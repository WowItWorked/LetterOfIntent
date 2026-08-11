import type { SectionKey } from "@/lib/schema";

/**
 * docs/output-matrix.md, as executable data. Each letter is a PROJECTION of
 * the canonical schema: these tables say which fields each document prints,
 * and the renderers consume them — they must never invent a mapping that is
 * not here. projections.test.ts holds this file and the matrix doc together.
 *
 * "all" prints every field the section holds; a list prints exactly those
 * fields; a section absent from the record does not appear in that letter.
 * (The emergency sheet's projection lives in derive.ts emergencyInfo(); the
 * cards' in content/cards.ts SOURCES.)
 */
export type SectionProjection = "all" | readonly string[];
export type LetterProjection = Partial<Record<SectionKey, SectionProjection>>;

/**
 * The Letter of Intent (for the trustee): financial, legal, benefits, and
 * decision-authority weight, plus enough of the person that a trustee who
 * never met them can exercise judgment. Daily-care mechanics live in the
 * caregiver letter, not here.
 */
export const TRUSTEE_PROJECTION: LetterProjection = {
  gettingStarted: "all",
  person: "all",
  familySupport: ["contacts", "firstCall", "doNotInvolve"],
  routine: ["goodDay"],
  health: [
    "providers",
    "medications",
    "conditions",
    "pharmacy",
    "therapies",
    "equipment",
    "insurancePlans",
    "recordsLocation",
    "whatWorked",
    "whatDidNot",
  ],
  home: ["currentLiving", "supportLevel", "waiverStatus", "futureHopes", "hardLimits"],
  schoolWork: [
    "currentProgram",
    "iepHistory",
    "workHistory",
    "currentWork",
    "jobSupports",
    "commitments",
    "windDown",
    "hopes",
  ],
  moneyBenefits: "all",
  legal: "all",
  communityFaith: ["friends", "joy", "faith", "traditions"],
  trusteeGuidance: "all",
  finalWishes: "all",
  personalMessage: "all",
};

/**
 * The Letter for the Caregiver: daily life, routine, communication, behavior,
 * health as it is lived, the home, and the guidance written to whoever steps
 * in. Written to be read in a kitchen at 7am, not filed in a binder — so the
 * money/legal machinery stays in the trustee letter, with only the pointers
 * a caregiver genuinely needs (who handles bills, where the papers live).
 */
export const CAREGIVER_PROJECTION: LetterProjection = {
  gettingStarted: "all",
  person: "all",
  familySupport: "all",
  routine: "all",
  communication: "all",
  health: "all",
  behavior: "all",
  home: "all",
  schoolWork: "all",
  moneyBenefits: ["whoHandlesBills", "howBillsArePaid", "whereRecordsKept", "vulnerabilities"],
  legal: ["powersOfAttorney", "advanceDirectives", "whoDecidesWhat", "decisionStatus", "advocates"],
  communityFaith: "all",
  caregiverGuidance: "all",
  finalWishes: "all",
  personalMessage: "all",
  // The structured card sections read as clean lists in the letter too.
  allergies: "all",
  emergencyPlan: "all",
  routines: "all",
  foods: "all",
  careTasks: "all",
};

/** True when this projection prints the given field. */
export function projects(
  projection: LetterProjection,
  section: SectionKey,
  fieldId: string
): boolean {
  const p = projection[section];
  if (!p) return false;
  return p === "all" || p.includes(fieldId);
}
