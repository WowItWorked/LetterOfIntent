import type { CardKey } from "@/lib/content/cards";
import type { LetterData } from "@/lib/schema";

/**
 * The sample letter behind the /care-cards page's previews.
 *
 * Data only — no React. This is the Ruiz family from the sample documents:
 * Danny Ruiz, 24, written by his mother Teresa, with his aunt Carmen as
 * first call and trustee. The same family a visitor meets in the sample
 * letters (src/lib/content/samples/ruiz.ts, prose in
 * docs/sample-family-high-support.md) — one family across the whole site,
 * owner decision at Checkpoint 3.
 *
 * Deliberately obvious sample data: (555) phone numbers throughout, and the
 * section beside the previews says so in words.
 *
 * This fixture holds ONLY what the previewed cards draw from, and every card
 * must fit a single 1080×1920 frame: the /care-cards page renders these
 * WITHOUT the cards page's pagination measurement, and an e2e check fails if
 * any card's content runs under its footer. Two sizing decisions follow the
 * pattern the previous fixture proved out:
 * - Carmen carries only the legal_guardian role and Robert describes himself
 *   in the free-text role field ("backup"), so no contact holds an emergency
 *   role and the emergency card carries no "Then call" block.
 * - The emergency card carries ONE scenario (the missing-bus story). The
 *   peanut response lives in the Allergies, Rescue medication, and Call 911
 *   blocks already on the card; a second scenario block repeating it ran the
 *   rendered card under its footer (the e2e overflow check caught it).
 * - The behavior card fixture omits yesNo (its content is folded into how),
 *   keeping the card at six blocks with the first-responder block aboard.
 * sample-card-data.test.ts fails the build if any previewed card stops
 * deriving or outgrows its frame's block budget.
 */

/** Every card, in display order — the gallery shows the whole set, care last. */
export const HOME_CARD_KEYS: readonly CardKey[] = [
  "identity",
  "emergency",
  "meds",
  "behavior",
  "routine",
  "food",
  "care",
];

export const SAMPLE_CARD_LETTER: LetterData = {
  gettingStarted: {
    authorName: "Teresa Ruiz",
    authorRelationship: "Mother",
    subjectFullName: "Daniel Ruiz",
    subjectPreferredName: "Danny",
    subjectAddress: "2115 Alder Court, Vienna VA",
    // Fixed on purpose — the card footers read the letter's own date, and a
    // moving date would churn the visual regression pins.
    letterDate: "2026-05-04",
  },
  person: { dateOfBirth: "2002-03-18" },
  familySupport: {
    contacts: [
      {
        id: "sample-carmen",
        name: "Carmen Ruiz-Bell",
        relationship: "Aunt",
        phone: "(555) 014-2280",
        roles: ["legal_guardian"],
      },
      {
        id: "sample-robert",
        name: "Robert Bell",
        relationship: "Uncle",
        phone: "(555) 014-2287",
        role: "backup",
      },
    ],
    firstCall: "Carmen — (555) 014-2280",
  },
  allergies: {
    items: [
      {
        id: "sample-peanuts",
        allergen: "Peanuts",
        severity: "serious",
        reaction: "Hives and vomiting",
        treatment: "Benadryl, then 911 if breathing changes",
      },
    ],
  },
  emergencyPlan: {
    scenarios: [
      {
        id: "sample-missing",
        trigger: "If Danny is missing",
        steps:
          "He is riding, not hiding — check the 2A bus first\nThen the bus museum\nCall Carmen while you check",
      },
    ],
    call911When: "Trouble breathing, or a fall he does not get up from",
    ifNoOneAnswers: "Fairfax Northern has his records. And check the 2A.",
    otcPolicy: "Nothing beyond the list without calling Carmen first.",
  },
  communication: {
    how:
      "Short sentences, four or five words. Silence means he is thinking, " +
      "and silence is also how he says no.",
    pain:
      "He will not say something hurts. He guards the spot and stops " +
      "eating — check his teeth first.",
    whatToAvoid: "Never say maybe, later, or calm down. Never touch the backpack.",
  },
  behavior: {
    triggers: "Unannounced changes. Fire alarms. Being touched from behind.",
    deEscalation:
      "One person talks, everyone else steps back. First-then words. Offer " +
      "the ear defenders. Give him the walkway, never a corner.",
    lawEnforcement:
      "A large man who may not answer and may walk away — that is autism, " +
      "not defiance. ID in his left jacket pocket. One officer, no lights, " +
      "no touching.",
  },
  routines: {
    items: [
      {
        id: "sample-r1",
        timeOfDay: "morning",
        time: "6:40",
        steps: "Bus feed first — ask nothing until he checks it\nEggs scrambled hard, toast corner to corner\nMeds in the green cup",
      },
      {
        id: "sample-r2",
        timeOfDay: "afternoon",
        time: "4:30",
        steps: "One hour alone, door shut\nNot optional, not a warning sign",
      },
      {
        id: "sample-r3",
        timeOfDay: "evening",
        time: "8:30",
        steps: "Shower — towel on the left hook\nLights out at 10, fan on",
      },
    ],
    transitions: "First-then words with a real time. Changes go on the whiteboard.",
  },
  foods: {
    items: [
      {
        id: "sample-f1",
        item: "Anything peanut",
        type: "will_not_eat",
        reason: "Allergy — serious. Program food is packed from home",
      },
      {
        id: "sample-f2",
        item: "Eggs scrambled hard, toast corner to corner",
        type: "always_works",
        reason: "No foods touching on the plate",
      },
    ],
  },
  careTasks: {
    items: [
      {
        id: "sample-c1",
        category: "bathing",
        steps: "Shower at 8:30 or not at all\nThe checklist on the mirror runs itself",
      },
      {
        id: "sample-c2",
        category: "equipment",
        steps: "Ear defenders in the backpack front pocket\nOffer, never install",
        equipment: "Ear defenders; the picture-card ring",
      },
    ],
  },
  health: {
    medications: [
      {
        id: "sample-benadryl",
        name: "Benadryl",
        dose: "50",
        unit: "mg",
        isRescue: true,
        location: "Kitchen cabinet by the phone",
        purpose: "Peanut exposure",
      },
      {
        id: "sample-sertraline",
        name: "Sertraline",
        dose: "50",
        unit: "mg",
        schedule: ["morning"],
        purpose: "for anxiety. Never stop it abruptly",
      },
      {
        id: "sample-melatonin",
        name: "Melatonin",
        dose: "3",
        unit: "mg",
        schedule: ["9:30 PM"],
        purpose: "only if he asks for the sleep one",
      },
    ],
    providers: [
      {
        id: "sample-chandra",
        name: "Dr. Priya Chandra",
        specialty: "Family medicine",
        phone: "(555) 014-6210",
      },
    ],
    preferredHospital: "Fairfax Northern. Records and behavior plan on file",
  },
};
