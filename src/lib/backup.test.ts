import { describe, expect, it } from "vitest";
import { MAX_BACKUP_BYTES, parseBackup, serializeBackup } from "@/lib/backup";
import type { LetterData } from "@/lib/schema";

const sample: LetterData = {
  gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
  health: {
    medications: [{ id: "m1", name: "Keppra", dose: "500 mg", purpose: "Seizures" }],
    allergies: "Penicillin — hives",
  },
};

describe("backup round trip", () => {
  it("serialize → parse preserves data and meta, including routing answers", () => {
    const text = serializeBackup(sample, {
      lastVisitedSlug: "health-and-medical",
      audience: "both",
      supportLevel: "substantial",
      onboardingDone: true,
    });
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.gettingStarted?.authorName).toBe("Maria");
      expect(parsed.data.health?.medications?.[0]?.name).toBe("Keppra");
      expect(parsed.meta.lastVisitedSlug).toBe("health-and-medical");
      expect(parsed.meta.audience).toBe("both");
      expect(parsed.meta.onboardingDone).toBe(true);
      expect(parsed.migratedFromV1).toBe(false);
    }
  });

  it("round-trips the marks record", () => {
    const withMarks: LetterData = {
      ...sample,
      marks: { "health.therapies": "not_applicable", finalWishes: "come_back" },
    };
    const r = parseBackup(serializeBackup(withMarks, {}));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.marks?.["health.therapies"]).toBe("not_applicable");
      expect(r.data.marks?.finalWishes).toBe("come_back");
    }
  });

  it("round-trips the card sections and the extended medication fields", () => {
    const withCards: LetterData = {
      gettingStarted: { subjectFullName: "Alex Rivera", subjectAddress: "12 Elm St" },
      familySupport: {
        contacts: [
          { id: "c1", name: "Dana", roles: ["primary", "medical_decision"], altPhone: "555-0100" },
        ],
      },
      health: {
        medications: [
          {
            id: "m1",
            name: "Epinephrine",
            isRescue: true,
            location: "Red pouch, front of backpack",
            schedule: ["prn", "14:30"],
            prnTrigger: "Bee sting",
            prnMaxPerDay: "2",
            keepOffCards: false,
          },
        ],
      },
      allergies: {
        items: [{ id: "a1", allergen: "Bee stings", severity: "life-threatening" }],
      },
      routines: {
        items: [{ id: "r1", timeOfDay: "morning", steps: "Wake\nBreakfast" }],
        transitions: "Five-minute warning, then one-minute.",
      },
      foods: { items: [{ id: "f1", item: "Grapes", type: "choking_risk" }] },
      careTasks: { items: [{ id: "t1", category: "bathing", steps: "Check temperature" }] },
      emergencyPlan: {
        responseSteps: "1 · Auto-injector\n2 · Call 911",
        scenarios: [
          { id: "s1", trigger: "If she bolts", steps: "Check closets\nCall Jessie" },
        ],
        otcPolicy: "Nothing else",
      },
    };
    const r = parseBackup(serializeBackup(withCards, {}));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.salvage.unknown).toEqual([]);
    expect(r.salvage.restored).toEqual(
      expect.arrayContaining(["allergies", "routines", "foods", "careTasks", "emergencyPlan"])
    );
    expect(r.data.gettingStarted?.subjectAddress).toBe("12 Elm St");
    expect(r.data.familySupport?.contacts?.[0]?.roles).toEqual(["primary", "medical_decision"]);
    expect(r.data.health?.medications?.[0]?.isRescue).toBe(true);
    expect(r.data.health?.medications?.[0]?.schedule).toEqual(["prn", "14:30"]);
    expect(r.data.allergies?.items?.[0]?.severity).toBe("life-threatening");
    expect(r.data.emergencyPlan?.scenarios?.[0]?.trigger).toBe("If she bolts");
  });

  it("strips unknown fields instead of failing (forward compatibility)", () => {
    const withExtra = JSON.parse(serializeBackup(sample, {}));
    withExtra.data.futureSection = { anything: "at all" };
    withExtra.data.health.futureField = "ignored";
    const r = parseBackup(JSON.stringify(withExtra));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.salvage.unknown).toContain("futureSection");
      expect(r.data.health?.allergies).toContain("Penicillin");
    }
  });
});

/**
 * PERMANENT COMMITMENT: a v1 backup file imports cleanly forever. The old
 * shapes migrate onto the canonical schema on the way in, no words lost.
 */
describe("v1 backups import cleanly, forever", () => {
  it("a v1 special-needs envelope migrates onto the canonical schema", () => {
    const v1 = {
      app: "twl-letter-of-intent",
      version: 1,
      exportedAt: "2026-02-01T10:00:00.000Z",
      meta: { letterPath: "special-needs", finalWishesAck: true },
      data: {
        gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
        about: { diagnoses: "Autism; epilepsy", lifeHistory: "Born in Fairfax." },
        medical: {
          medications: [{ id: "m1", name: "Keppra", dose: "500 mg" }],
          allergies: "Penicillin — hives",
          insurance: "Anthem; Virginia Medicaid.",
          emergencyProtocol: "Time the seizure.",
        },
        trustee: { moneyIsFor: "A life, not a ledger." },
        behavior: { triggers: "Fire alarms." },
      },
    };
    const r = parseBackup(JSON.stringify(v1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migratedFromV1).toBe(true);
    expect(r.data.health?.medications?.[0]?.name).toBe("Keppra");
    expect(r.data.health?.conditions).toContain("Autism");
    expect(r.data.health?.insurancePlans).toContain("Anthem");
    expect(r.data.person?.history).toContain("Fairfax");
    expect(r.data.trusteeGuidance?.moneyIsFor).toContain("ledger");
    // Routing answers inferred as pre-fills, never silently confirmed.
    expect(r.meta.audience).toBe("both");
    expect(r.meta.onboardingInferred).toBe(true);
    expect(r.meta.onboardingDone).toBe(false);
  });

  it("a v1 general envelope migrates, aging fields intact", () => {
    const v1 = {
      app: "twl-letter-of-intent",
      version: 1,
      meta: { letterPath: "general" },
      data: {
        gettingStarted: { subjectPreferredName: "Bob" },
        aboutThem: { whoTheyAre: "Dad is 81.", temperament: "A ride but not an arm." },
        dailyCommunication: { wontAdmit: "Trouble on the stairs." },
        homeLiving: { deferred: "The gutters.", householdHelp: "Laundry Saturdays." },
        moneyDocuments: { vulnerabilities: "Phone charity calls." },
        steppingIn: { neverChange: "Do not cancel the cleaning service." },
      },
    };
    const r = parseBackup(JSON.stringify(v1));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.migratedFromV1).toBe(true);
    expect(r.data.person?.whoTheyAre).toContain("81");
    expect(r.data.communication?.wontAdmit).toContain("stairs");
    expect(r.data.home?.deferred).toContain("gutters");
    expect(r.data.moneyBenefits?.vulnerabilities).toContain("charity");
    expect(r.data.caregiverGuidance?.neverChange).toContain("cleaning service");
    expect(r.meta.audience).toBe("caregiver");
  });

  it("bare v1 data with no envelope at all still migrates", () => {
    const r = parseBackup(
      JSON.stringify({
        gettingStarted: { subjectPreferredName: "Alex" },
        medical: { allergies: "Penicillin" },
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.migratedFromV1).toBe(true);
      expect(r.data.health?.allergies).toBe("Penicillin");
    }
  });

  it("a v1 letter with BOTH old shapes keeps both texts, marked for review", () => {
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        meta: { letterPath: "special-needs" },
        data: {
          typicalDay: { goodDay: "He hums at dinner." },
          typicalWeek: { goodDay: "The garden is in it." },
        },
      })
    );
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.routine?.goodDay).toContain("hums");
    expect(r.data.routine?.goodDay).toContain("garden");
    expect(r.combined).toContain("routine.goodDay");
    expect(r.data.marks?.["routine.goodDay"]).toBe("combined");
  });
});

describe("backup refusals", () => {
  it.each([
    ["not json at all", "not-json"],
    ["", "not-json"],
    ["[1,2,3]", "not-a-backup"],
    ['"a string"', "not-a-backup"],
    ["null", "not-a-backup"],
    ['{"hello":"world"}', "not-a-backup"],
  ])("refuses %j with reason %s", (input, reason) => {
    const r = parseBackup(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });

  it("refuses another app's file even if the shape matches", () => {
    const r = parseBackup(
      JSON.stringify({ app: "some-other-tool", version: 9, data: sample })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-a-backup");
  });

  it("refuses our own envelope when nothing inside can be read", () => {
    const r = parseBackup(
      JSON.stringify({ app: "twl-letter-of-intent", version: 1, data: { about: 42 } })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("empty");
  });

  it("refuses a file too large to be a letter, without parsing it", () => {
    const huge = `{"app":"twl-letter-of-intent","padding":"${"x".repeat(MAX_BACKUP_BYTES)}"}`;
    const r = parseBackup(huge);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-large");
  });
});

/**
 * The salvage path. A family should never lose a whole letter because one
 * section of the file is malformed.
 */
describe("salvaging a damaged backup", () => {
  it("keeps the readable sections and reports the rest", () => {
    const damaged = {
      app: "twl-letter-of-intent",
      version: 1,
      data: {
        gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
        about: "this should be an object, not a string",
        medical: { allergies: "Penicillin" },
        behavior: ["also", "wrong"],
      },
    };
    const r = parseBackup(JSON.stringify(damaged));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.gettingStarted?.authorName).toBe("Maria");
    expect(r.data.health?.allergies).toBe("Penicillin");
    expect(r.salvage.restored).toEqual(
      expect.arrayContaining(["gettingStarted", "health"])
    );
    // The junk legacy sections are reported, never silently dropped.
    expect(r.salvage.skipped).toEqual(expect.arrayContaining(["about", "behavior"]));
  });

  it("drops a repeater's junk without losing the rest of the letter", () => {
    const r = parseBackup(
      JSON.stringify({
        gettingStarted: { authorName: "Maria" },
        medical: { allergies: "Penicillin", medications: "not an array" },
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.gettingStarted?.authorName).toBe("Maria");
  });
});

/**
 * A backup file is untrusted input that arrives from the filesystem. These
 * are the paths an attacker would reach for.
 */
describe("hostile backup files", () => {
  it("does not let a __proto__ key reach Object.prototype", () => {
    const attack = '{"gettingStarted":{"authorName":"Maria"},"__proto__":{"polluted":"yes"}}';
    const r = parseBackup(attack);
    expect(r.ok).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    if (r.ok) expect(r.data).not.toHaveProperty("polluted");
  });

  it("does not let a nested __proto__ or constructor key through", () => {
    const attack = JSON.stringify({
      gettingStarted: { authorName: "Maria", __proto__: { polluted: "deep" } },
      health: { constructor: { prototype: { polluted: "deeper" } }, allergies: "None" },
    });
    const r = parseBackup(attack);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it("survives absurdly deep nesting instead of blowing the stack", () => {
    let deep = '{"a":1}';
    for (let i = 0; i < 400; i += 1) deep = `{"a":${deep}}`;
    const r = parseBackup(`{"gettingStarted":{"authorName":"Maria"},"junk":${deep}}`);
    expect(r.ok).toBe(true);
  });

  it("keeps script-looking text as literal text rather than treating it as markup", () => {
    const xss = "<script>alert(1)</script>";
    const r = parseBackup(JSON.stringify({ gettingStarted: { authorName: xss } }));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.gettingStarted?.authorName).toBe(xss);
  });

  it("refuses a photograph that is not an inline image", () => {
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 2,
        data: sample,
        photos: [
          { slot: "recent", dataUrl: "javascript:alert(1)" },
          { slot: "family", dataUrl: "https://example.com/tracker.png" },
        ],
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.photos).toBeUndefined();
  });

  it("keeps a well-formed inline image", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 2,
        data: sample,
        photos: [{ slot: "recent", dataUrl: png }],
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.photos).toHaveLength(1);
  });

  it("never restores more than the two photograph slots", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 2,
        data: sample,
        photos: Array.from({ length: 50 }, () => ({ slot: "recent", dataUrl: png })),
      })
    );
    if (r.ok) expect(r.photos!.length).toBeLessThanOrEqual(2);
  });
});
