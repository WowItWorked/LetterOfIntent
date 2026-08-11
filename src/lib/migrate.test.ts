import { describe, expect, it } from "vitest";
import {
  COMBINED_SEPARATOR,
  inferMetaFromV1,
  migrateLetterData,
  migrateV1,
} from "@/lib/migrate";
import { letterDataSchema } from "@/lib/schema";

/**
 * The migration's one rule: NOTHING IS LOST. These tests are the proof the
 * brief demanded — a realistic v1 letter from each old path arrives intact,
 * and a letter with BOTH old shapes populated (path switching was a link
 * click) keeps every word of both sides.
 */

/* ------------------------------------------------- realistic v1 payloads */

/** A realistic special-needs v1 letter — every SN section touched. */
const V1_SPECIAL_NEEDS = {
  gettingStarted: {
    authorName: "Maria Alvarez",
    subjectFullName: "Alexander James Alvarez",
    subjectPreferredName: "Alex",
    letterDate: "2025-11-02",
  },
  about: {
    dateOfBirth: "2004-03-14",
    diagnoses: "Autism spectrum disorder; epilepsy (focal seizures)",
    lifeHistory: "Born in Fairfax, two months early and stubborn from day one.",
    firstFiveMinutes: "Lead with his name. A wave is better than a handshake.",
    importantToKnow: "Knows the entire Metro map by heart.",
  },
  familySupport: {
    contacts: [
      { id: "c1", name: "Dana Alvarez", relationship: "Aunt", phone: "(703) 555-0142", emergency: true },
    ],
    firstCall: "Dana — 15 minutes away",
    doNotInvolve: "Uncle Ray must not handle money.",
  },
  typicalDay: {
    morningRoutine: "Radio first, then meds in the blue cup.",
    eveningRoutine: "Bath at 8, lights out by 9:30.",
    sleep: "White noise machine, door cracked.",
    food: "Waffles cut in strips, syrup on the side.",
    clothing: "No tags, ever.",
    sensory: "Fire alarms are the enemy.",
    comfortObjects: "The green train. Backup in the closet.",
    goodDay: "Program, nuggets, train videos. He hums.",
    hardDay: "It starts with a schedule change nobody warned him about.",
  },
  communication: {
    how: "AAC app on his iPad for requests, plus about twenty signs.",
    yesNo: "A nod means yes; looking away means no.",
    pain: "Goes quiet and presses on the spot.",
    overwhelm: "Rocks and hums louder before it tips over.",
    whatToSay: "Short sentences. One thing at a time.",
    whatNotToSay: "Never say later. Give a real time.",
  },
  medical: {
    providers: [{ id: "p1", name: "Dr. Chen", specialty: "Neurology", phone: "(703) 555-0110" }],
    medications: [
      { id: "m1", name: "Levetiracetam", dose: "500 mg", schedule: ["morning", "evening"] },
    ],
    allergies: "Penicillin — hives, then trouble breathing.",
    emergencyProtocol: "Time the seizure. On his side. Over 3 minutes: rescue med, call 911.",
    therapies: "Speech Tuesdays at 4.",
    equipment: "Noise-cancelling headphones.",
    insurance: "Anthem through Dad's employer; Virginia Medicaid (CCC Plus).",
    preferredHospital: "Inova Fairfax",
    whatWorked: "Music-based learning.",
    whatDidNot: "Token boards. He sees through them.",
  },
  behavior: {
    triggers: "Fire alarms. Plans changing without warning.",
    earlyWarnings: "Pacing by the door.",
    deEscalation: "Lower your voice. Offer the headphones. Wait.",
    makesWorse: "Crowding him. Raised voices.",
    crisisPlan: "Call Dana, then the crisis line.",
    lawEnforcement: "He may run. That is fear, not defiance.",
  },
  educationWork: {
    currentProgram: "Davis Career Center, day program",
    iepHistory: "Music-based supports worked; token systems failed.",
    whatWorksLearning: "Show, don't tell.",
    workHistory: "Grocery bagging, two summers.",
    jobSupports: "Coach through the county.",
    hopes: "Something with trains.",
  },
  housing: {
    currentLiving: "At home with us.",
    supportLevel: "Needs someone present overnight.",
    waiverStatus: "On the DD waiver waitlist since 2021.",
    futureHopes: "A small group home near his sister.",
    hardLimits: "Never a large institution.",
  },
  benefitsFinances: {
    programs: "SSI since 18; Virginia Medicaid.",
    repPayee: "His mother, for now.",
    ableAccount: "ABLE account managed by Dana.",
    trusts: "Special needs trust created 2022; Dana is trustee.",
    pending: "Waiver appeal in progress.",
    whereRecordsKept: "Gray fireproof box, bedroom closet.",
  },
  socialFaith: {
    friends: "Marcus from program.",
    activities: "Train museum, every open Saturday.",
    faith: "Mass with Grandma monthly.",
    traditions: "Christmas Eve pajamas.",
    travel: "Trains only. Never planes.",
    joy: "The Metro map.",
  },
  legalAdvocacy: {
    decisionStatus: "Guardianship established 2022; supported decision-making for daily choices.",
    advocates: "Arc of NoVa case manager.",
    attorney: "Claire Kelly at Trusts & Wealth.",
    advocacyHistory: "Won the waiver appeal with the neurologist's letter.",
  },
  trustee: {
    moneyIsFor: "A life, not a ledger.",
    easyYeses: "Anything involving trains.",
    spendVsPreserve: "Lean toward today.",
    scrutinize: "Anyone asking for cash.",
    wishesVsSafety: "Risks that bruise, never risks that break.",
    consultFirst: "His sister, always.",
  },
  finalWishes: { funeral: "Small and musical." },
  personalMessage: { toCaregivers: "When he is difficult, he is scared." },
  allergies: {
    items: [{ id: "a1", allergen: "Penicillin", severity: "life-threatening", reaction: "Hives" }],
  },
  emergencyPlan: { responseSteps: "Start timing\nTurn on side\nRed pouch", call911When: "Over 3 minutes" },
};

/** A realistic general-path v1 letter — every general section touched. */
const V1_GENERAL = {
  gettingStarted: {
    authorName: "Ellen Marsh",
    subjectFullName: "Robert Marsh",
    subjectPreferredName: "Bob",
    letterDate: "2025-12-10",
  },
  aboutThem: {
    dateOfBirth: "1944-05-02",
    whoTheyAre: "Dad is 81, a retired principal, organized to a fault.",
    history: "Thirty-one years at the high school.",
    temperament: "Accepts a ride but not an arm.",
    cannotAbide: "Being talked about in the third person.",
    strangersGetWrong: "People hear the hearing aids and start shouting.",
  },
  familySupport: {
    contacts: [{ id: "g1", name: "Tom Marsh", relationship: "Son", phone: "(571) 555-0181" }],
    firstCall: "Tom, next town over.",
  },
  typicalWeek: {
    mornings: "Coffee, pills from the blue box, then the paper.",
    evenings: "Jeopardy at 7, bed by 10.",
    fixedPoints: "Monday aide 9–1; Sunday call at 4pm.",
    gettingAround: "Still drives daytime, badly. We are working on it.",
    food: "Eats like a bird at dinner. Dentures out at night.",
    goodDay: "The garden is in it.",
    hardDay: "Starts with a bad night's sleep.",
  },
  dailyCommunication: {
    howToSpeak: "Say it straight and say it once.",
    hearingVisionMemory: "Hearing aids both ears; memory patchy for this week.",
    wontAdmit: "Trouble on the stairs. Watch for the pause at the landing.",
    hardConversations: "Driving. Half-agreed to stop at night.",
    whatHelps: "Sitting down first. No television on.",
    whatToAvoid: "Never start with we've decided.",
  },
  healthMedical: {
    providers: [{ id: "gp1", name: "Dr. Patel", specialty: "Primary care", phone: "(571) 555-0122" }],
    medications: [{ id: "gm1", name: "Warfarin", dose: "5 mg", schedule: ["evening"] }],
    conditions: "Atrial fibrillation (2019); osteoarthritis in both knees.",
    allergies: "Sulfa drugs — rash.",
    pharmacy: "Main Street Pharmacy, delivers Thursdays.",
    preferredHospital: "County General — records and cardiologist there.",
    appointmentHelp: "Someone has to go in with him and write it down.",
    recordsLocation: "Insurance cards in his wallet; directives in the grey file box.",
  },
  homeLiving: {
    theHome: "Owned outright. Water shut-off behind the dryer.",
    deferred: "The gutters. The one urgent thing is the bathroom grab bar.",
    householdHelp: "I do laundry Saturdays while she naps.",
    personalCare: "Manages, slowly. Nails need doing.",
    petsAndPlants: "Biscuit the terrier: vet on Elm, walks twice a day.",
    safety: "No rugs on the stairs anymore. Alert pendant he won't wear.",
  },
  moneyDocuments: {
    whoHandlesBills: "He does, mostly, with drift.",
    howBillsArePaid: "Utilities autopay; property tax by mail and missed twice.",
    incomeSources: "Pension on the 1st; Social Security on the 3rd.",
    whereDocumentsKept: "Grey file box, hall closet: deed, will, LTC policy.",
    vulnerabilities: "Phone charity calls. He cannot hang up on anyone.",
    advisors: "Accountant: Ruth Meyer, does the taxes.",
  },
  workObligations: {
    currentWork: "Keeps the books for the family store, two days a week.",
    commitments: "Scholarship committee chair.",
    keyContacts: "Marge at the committee.",
    windDown: "Bookkeeping passes to Dana at the office.",
  },
  faithCommunity: {
    faith: "Communion at home first Sundays; Father Reilly will come.",
    congregation: "St. Luke's. Call the office.",
    friendsAndNeighbors: "Ellen next door has a key and checks.",
    traditions: "The lake cabin, first week of August.",
    pleasures: "The garden. The crossword. The third cup of coffee.",
  },
  legalDecisions: {
    powersOfAttorney: "Financial POA names Tom, effective now.",
    advanceDirectives: "Signed 2021; hospital has a copy.",
    guardianship: "Deliberately avoided. He would not forgive it.",
    whoDecidesWhat: "Day to day is his. Money over $500 he asks Tom.",
    professionals: "Attorney: Claire Kelly. Accountant: Ruth Meyer.",
  },
  steppingIn: {
    firstWeek: "Call Dr. Patel's office and say you are taking over.",
    hindsight: "I wish we had moved the bedroom downstairs before the fall.",
    neverChange: "Do not cancel the cleaning service.",
    consultFirst: "Tom and Father Reilly, before anything irreversible.",
  },
  finalWishes: { restingPlace: "Beside Mom, at St. Luke's." },
  personalMessage: { toPerson: "You taught me everything, Dad." },
};

/* -------------------------------------------------------- helpers */

/** Every leaf string of a nested object, for no-words-lost assertions. */
function leafStrings(obj: unknown, out: string[] = []): string[] {
  if (typeof obj === "string") {
    const t = obj.trim();
    if (t) out.push(t);
  } else if (Array.isArray(obj)) {
    obj.forEach((v) => leafStrings(v, out));
  } else if (obj && typeof obj === "object") {
    Object.entries(obj).forEach(([k, v]) => {
      if (k !== "id" && k !== "letterDate" && k !== "dateOfBirth") leafStrings(v, out);
    });
  }
  return out;
}

/* ---------------------------------------------------------------- tests */

describe("v1 special-needs letter → canonical", () => {
  const { data } = migrateLetterData(V1_SPECIAL_NEEDS, { letterPath: "special-needs" });

  it("every field's text arrives somewhere, intact", () => {
    const before = leafStrings(V1_SPECIAL_NEEDS);
    const after = JSON.stringify(data);
    for (const text of before) {
      expect(after, `lost: ${text}`).toContain(JSON.stringify(text).slice(1, -1));
    }
  });

  it("lands on the canonical sections, and validates", () => {
    expect(data.person?.history).toContain("stubborn from day one");
    expect(data.health?.conditions).toContain("Autism spectrum");
    expect(data.health?.insurancePlans).toContain("Anthem");
    expect(data.health?.emergencyProtocol).toContain("Time the seizure");
    expect(data.routine?.mornings).toContain("blue cup");
    expect(data.communication?.whatHelps).toContain("Short sentences");
    expect(data.communication?.whatToAvoid).toContain("Never say later");
    expect(data.home?.hardLimits).toContain("institution");
    expect(data.moneyBenefits?.trusts).toContain("2022");
    expect(data.legal?.decisionStatus).toContain("Guardianship established");
    expect(data.legal?.professionals).toContain("Claire Kelly");
    expect(data.trusteeGuidance?.consultFirst).toContain("sister");
    expect(data.schoolWork?.currentProgram).toContain("Davis");
    expect(data.communityFaith?.joy).toContain("Metro map");
    expect(letterDataSchema.safeParse(data).success).toBe(true);
  });

  it("carries repeaters whole", () => {
    expect(data.health?.providers).toHaveLength(1);
    expect(data.health?.medications?.[0]?.name).toBe("Levetiracetam");
    expect(data.familySupport?.contacts?.[0]?.name).toBe("Dana Alvarez");
    expect(data.allergies?.items?.[0]?.allergen).toBe("Penicillin");
  });
});

describe("v1 general letter → canonical", () => {
  const { data } = migrateLetterData(V1_GENERAL, { letterPath: "general" });

  it("every field's text arrives somewhere, intact", () => {
    const before = leafStrings(V1_GENERAL);
    const after = JSON.stringify(data);
    for (const text of before) {
      expect(after, `lost: ${text}`).toContain(JSON.stringify(text).slice(1, -1));
    }
  });

  it("the aging-specific fields survive as themselves — never rounded off", () => {
    expect(data.communication?.hearingVisionMemory).toContain("patchy");
    expect(data.communication?.wontAdmit).toContain("stairs");
    expect(data.home?.deferred).toContain("gutters");
    expect(data.moneyBenefits?.vulnerabilities).toContain("hang up");
    expect(data.home?.petsAndPlants).toContain("Biscuit");
    expect(data.home?.householdHelp).toContain("Saturdays");
    expect(data.schoolWork?.windDown).toContain("Dana");
    expect(letterDataSchema.safeParse(data).success).toBe(true);
  });

  it("keeps the distinct questions distinct", () => {
    // The shipped defects: these landing in the wrong canonical field would
    // recreate the emergency sheet's mis-mappings at the data layer.
    expect(data.health?.appointmentHelp).toContain("write it down");
    expect(data.health?.emergencyProtocol ?? "").not.toContain("write it down");
    expect(data.health?.recordsLocation).toContain("wallet");
    expect(data.health?.insurancePlans ?? "").not.toContain("wallet");
    expect(data.caregiverGuidance?.neverChange).toContain("cleaning service");
    expect(data.home?.hardLimits ?? "").not.toContain("cleaning service");
  });
});

describe("a letter with BOTH old shapes populated — the subtlest data-loss risk", () => {
  // Nothing stopped a family from starting one path, switching, and filling
  // in the other. Populate BOTH sides of every merged pair and assert both
  // texts survive.
  const both = { ...V1_SPECIAL_NEEDS, ...V1_GENERAL, gettingStarted: V1_SPECIAL_NEEDS.gettingStarted };
  const { data, combined } = migrateLetterData(both, { letterPath: "special-needs" });

  const mergedPairs: Array<[string, string, string, string]> = [
    // [canonical section.field, SN text fragment, general text fragment, label]
    ["person.history", "stubborn from day one", "Thirty-one years", "history"],
    ["health.conditions", "Autism spectrum", "Atrial fibrillation", "conditions"],
    ["routine.mornings", "blue cup", "blue box", "mornings"],
    ["routine.evenings", "Bath at 8", "Jeopardy at 7", "evenings"],
    ["routine.food", "Waffles", "like a bird", "food"],
    ["routine.goodDay", "He hums", "garden", "goodDay"],
    ["routine.hardDay", "schedule change", "bad night's sleep", "hardDay"],
    ["communication.whatHelps", "Short sentences", "Sitting down first", "whatHelps"],
    ["communication.whatToAvoid", "Never say later", "we've decided", "whatToAvoid"],
    ["health.allergies", "Penicillin", "Sulfa", "allergies"],
    ["health.preferredHospital", "Inova Fairfax", "County General", "preferredHospital"],
    ["moneyBenefits.whereRecordsKept", "fireproof box", "hall closet", "whereRecordsKept"],
    ["communityFaith.friends", "Marcus", "Ellen next door", "friends"],
    ["communityFaith.joy", "Metro map", "third cup of coffee", "joy"],
    ["communityFaith.faith", "Mass with Grandma", "Father Reilly", "faith"],
    ["communityFaith.traditions", "pajamas", "lake cabin", "traditions"],
    ["legal.professionals", "Claire Kelly", "Ruth Meyer", "professionals (3-way)"],
  ];

  it.each(mergedPairs)("%s keeps both texts", (path, snText, genText) => {
    const [section, field] = path.split(".");
    const value = (data[section as keyof typeof data] as Record<string, unknown>)?.[field];
    expect(typeof value).toBe("string");
    expect(value as string).toContain(snText);
    expect(value as string).toContain(genText);
  });

  it("separates the two answers visibly, letter's own path first", () => {
    expect(data.routine?.mornings).toBe(
      `Radio first, then meds in the blue cup.${COMBINED_SEPARATOR}Coffee, pills from the blue box, then the paper.`
    );
  });

  it("marks every real concatenation for the family to reconcile", () => {
    expect(combined).toContain("routine.mornings");
    expect(data.marks?.["routine.mornings"]).toBe("combined");
    // And never marks a field that only had one side.
    expect(data.marks?.["communication.wontAdmit"]).toBeUndefined();
  });

  it("merged repeaters concatenate, active path's records first", () => {
    const meds = data.health?.medications ?? [];
    expect(meds.map((m) => m.name)).toEqual(["Levetiracetam", "Warfarin"]);
    const providers = data.health?.providers ?? [];
    expect(providers.map((p) => p.name)).toEqual(["Dr. Chen", "Dr. Patel"]);
  });

  it("identical text on both sides collapses to one copy", () => {
    const { data: d2 } = migrateLetterData(
      { typicalDay: { goodDay: "Same words." }, typicalWeek: { goodDay: "Same words." } },
      {}
    );
    expect(d2.routine?.goodDay).toBe("Same words.");
  });
});

describe("idempotence and passthrough", () => {
  it("canonical (v2) data passes through untouched", () => {
    const canonical = migrateLetterData(V1_SPECIAL_NEEDS, { letterPath: "special-needs" }).data;
    const again = migrateLetterData(canonical, {}).data;
    expect(again).toEqual(canonical);
  });

  it("marks written by v2 survive migration", () => {
    const { data } = migrateLetterData(
      { marks: { "health.therapies": "not_applicable" }, person: { whoTheyAre: "Hi" } },
      {}
    );
    expect(data.marks?.["health.therapies"]).toBe("not_applicable");
  });
});

describe("meta inference — pre-fills, never silent guesses", () => {
  it("a general letter infers a caregiver-only aging configuration", () => {
    const { data } = migrateLetterData(V1_GENERAL, { letterPath: "general" });
    const meta = inferMetaFromV1(data, { letterPath: "general" });
    expect(meta.audience).toBe("caregiver");
    expect(meta.stage).toBe("adult");
    expect(meta.supportLevel).toBe("mostlyIndependent");
    expect(meta.behaviorEscalates).toBe("no");
    expect(meta.cognitionChanging).toBe("yes"); // hearingVisionMemory has content
    expect(meta.hasTrust).toBe("no");
    expect(meta.schoolWork).toContain("work");
    expect(meta.onboardingDone).toBe(false);
    expect(meta.onboardingInferred).toBe(true);
  });

  it("a special-needs letter with trustee content infers both audiences", () => {
    const { data } = migrateLetterData(V1_SPECIAL_NEEDS, { letterPath: "special-needs" });
    const meta = inferMetaFromV1(data, { letterPath: "special-needs" });
    expect(meta.audience).toBe("both");
    expect(meta.behaviorEscalates).toBe("yes");
    expect(meta.communicationDiffers).toBe("yes");
    expect(meta.hasTrust).toBe("yes");
    expect(meta.hasBenefits).toBe("yes");
  });

  it("an empty letter infers nothing — plain onboarding, no pre-fill pass", () => {
    expect(inferMetaFromV1({}, {})).toEqual({});
  });

  it("migrateV1 folds the old final-wishes ack into emotionalAcks", () => {
    const { meta } = migrateV1({
      data: { finalWishes: { funeral: "Small." } },
      meta: { finalWishesAck: true },
    });
    expect(meta.emotionalAcks).toContain("final-wishes");
  });
});
