import { describe, expect, it } from "vitest";
import { CARD_KEYS, RENDER_REQUIREMENTS } from "@/lib/content/cards";
import { fieldsForMeta, sectionByKey, sectionInPlay } from "@/lib/content/config";
import { cardTitle } from "@/lib/cards/status";
import type { LetterMeta } from "@/lib/schema";

/**
 * Can every care card still be FILLED, in every configuration the form can
 * take?
 *
 * The onboarding's first question promises all seven cards whichever audience
 * you pick, and the Letter of Intent page repeats it. That promise is only
 * honest if the adaptive form actually ASKS at least one anchor field for each
 * card in every configuration — a card whose only required source sits behind
 * a showWhen the family will never satisfy is a card they can never earn, and
 * the status panel would tell them forever that it "needs" something they were
 * never offered.
 *
 * This is the gating counterpart to the output-matrix test: that one checks
 * every field lands in an output, this one checks every card can be reached
 * from what a given configuration is asked. Empty data throughout — content
 * always overrides gating (config.ts), so anything reachable on a blank letter
 * is reachable on a written one.
 */

/** Every value each routing answer can take, per docs/onboarding-questions.md. */
const ANSWER_SPACE = {
  audience: ["trustee", "caregiver", "both"],
  stage: ["child", "adult"],
  supportLevel: ["mostlyIndependent", "someDailyHelp", "substantial", "roundTheClock"],
  communicationDiffers: ["yes", "no"],
  behaviorEscalates: ["yes", "no"],
  cognitionChanging: ["yes", "early", "no"],
  hasTrust: ["yes", "planned", "no", "notSure"],
  hasBenefits: ["yes", "maybe", "no"],
  livesWith: ["withWriter", "ownHome", "withOthers", "facility"],
} as const;

/** schoolWork is multi-select; these are the combinations the UI can produce. */
const SCHOOL_WORK: string[][] = [[], ["school"], ["work"], ["school", "work"], ["neither"]];

function everyConfiguration(): LetterMeta[] {
  let metas: LetterMeta[] = [{ onboardingDone: true }];
  for (const [key, values] of Object.entries(ANSWER_SPACE)) {
    metas = metas.flatMap((m) => values.map((v) => ({ ...m, [key]: v })));
  }
  return metas.flatMap((m) => SCHOOL_WORK.map((sw) => ({ ...m, schoolWork: sw })));
}

/**
 * Is at least one of this need's refs actually ASKED in this configuration?
 * Mirrors needMet's AND-of-ORs shape, but asks "would the form offer it",
 * not "did the family write it".
 */
function needIsAskable(
  need: { anyOf: readonly { section: string; field: string }[] },
  meta: LetterMeta
): boolean {
  return need.anyOf.some((ref) => {
    const def = sectionByKey(ref.section as never);
    if (!def || !sectionInPlay(def, meta, {})) return false;
    return fieldsForMeta(def, meta, {}).some((f) => f.id === ref.field);
  });
}

describe("care card reachability across every configuration", () => {
  const configurations = everyConfiguration();

  it("enumerates the whole answer space", () => {
    // 3·2·4·2·2·3·4·3·4 = 13,824 answer sets × 5 schoolWork combinations.
    expect(configurations).toHaveLength(69_120);
  });

  it("asks at least one anchor field for every card, in every configuration", () => {
    const unreachable: string[] = [];

    for (const meta of configurations) {
      for (const key of CARD_KEYS) {
        const askable = RENDER_REQUIREMENTS[key].every((need) => needIsAskable(need, meta));
        if (!askable) {
          unreachable.push(
            `${cardTitle(key)} — supportLevel=${meta.supportLevel}, ` +
              `communicationDiffers=${meta.communicationDiffers}, ` +
              `behaviorEscalates=${meta.behaviorEscalates}, ` +
              `livesWith=${meta.livesWith}, stage=${meta.stage}`
          );
        }
      }
    }

    // Deduplicated: one line per (card, gating combination) that fails.
    expect([...new Set(unreachable)]).toEqual([]);
  });

  /**
   * The specific trap worth naming: `mostlyIndependent` gates off BOTH the
   * personal-care section (careTasks) and home.personalCare, so the Personal
   * Care & Mobility card hangs entirely on health.equipment and home.safety
   * staying ungated. Nothing in the section files says so; this test does.
   */
  it("keeps the Personal Care card reachable for a mostly-independent adult", () => {
    const aging: LetterMeta = {
      audience: "caregiver",
      stage: "adult",
      supportLevel: "mostlyIndependent",
      communicationDiffers: "no",
      behaviorEscalates: "no",
      cognitionChanging: "early",
      hasTrust: "no",
      hasBenefits: "no",
      schoolWork: ["work"],
      livesWith: "ownHome",
      onboardingDone: true,
    };

    const careTasks = sectionByKey("careTasks" as never);
    expect(careTasks && sectionInPlay(careTasks, aging, {})).toBe(false);

    const home = sectionByKey("home" as never)!;
    const homeFields = fieldsForMeta(home, aging, {}).map((f) => f.id);
    expect(homeFields).not.toContain("personalCare");
    expect(homeFields).toContain("safety");

    const health = sectionByKey("health" as never)!;
    expect(fieldsForMeta(health, aging, {}).map((f) => f.id)).toContain("equipment");

    expect(RENDER_REQUIREMENTS.care.every((need) => needIsAskable(need, aging))).toBe(true);
  });
});
