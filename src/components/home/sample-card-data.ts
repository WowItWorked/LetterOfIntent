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
 * Written to look like a letter someone FINISHED — both the trustee letter
 * and the caregiver letter — because a visitor judging whether this is worth
 * their evening should see a full card, not a stub. Every card now sits at or
 * just under its ceiling: five or six blocks, four lines at most in any one.
 *
 * That ceiling is real. The /care-cards page renders these WITHOUT the cards
 * page's pagination measurement, so every card must fit a single 1080×1920
 * frame, and an e2e check fails if any card's content runs under its footer.
 * Three sizing decisions the layout forced:
 * - Carmen carries only the legal_guardian role, and every other contact
 *   describes itself in the free-text role field ("backup", "day to day"), so
 *   no contact holds an emergency role and the emergency card carries no
 *   "Then call" block. It has no room for one.
 * - The emergency card carries responseSteps and NOT a named scenario. Both
 *   together measured ~80px past the footer; of the two, the unnamed
 *   what-to-do-first block is the one a stranger actually reads.
 * - The behavior card omits yesNo (its content is folded into how), keeping
 *   the card at six blocks with the first-responder block aboard.
 *
 * sample-card-data.test.ts bounds blocks and lines, but it is only a proxy —
 * it passed while the emergency card was overflowing by 80px. The e2e check
 * is the gate that actually knows.
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
      // Free-text roles on purpose, like Robert's: a contact holding a
      // primary or medical-decision role would add a "Then call" block to the
      // emergency card, which has no room left (see the block budget below).
      {
        id: "sample-teresa",
        name: "Teresa Ruiz",
        relationship: "Mother",
        phone: "(555) 014-2201",
        role: "day to day",
      },
      {
        id: "sample-marcy",
        name: "Marcy Alvarado",
        relationship: "Case manager",
        phone: "(555) 014-9930",
        role: "county services",
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
      {
        id: "sample-latex",
        allergen: "Latex",
        severity: "mild",
        reaction: "Red, itchy skin",
        treatment: "Wash the area; hydrocortisone from the medicine box",
      },
    ],
  },
  emergencyPlan: {
    responseSteps:
      "Start timing the seizure\nOn his side, nothing in his mouth\nOver 3 minutes: rescue med from the red pouch\nCall 911, then Carmen",
    // The "If Danny is missing" scenario used to live here. It gave way to
    // responseSteps above: on a completed letter the unnamed what-to-do-first
    // block is the one a stranger reads, and the card has room for one of the
    // two, not both — the e2e overflow gate measured the pair at ~80px past
    // the footer.
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
      {
        id: "sample-r4",
        timeOfDay: "night",
        time: "10:00",
        steps: "Fan stays on all night — it is the sound, not the air\nIf he is up, the bus feed settles him faster than talking",
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
      {
        id: "sample-f3",
        item: "Nothing wet on top of anything crisp",
        type: "texture",
        reason: "Sauce goes in a separate bowl, always",
      },
      {
        id: "sample-f4",
        item: "Grapes, hot dogs, anything round",
        type: "choking_risk",
        reason: "Cut lengthwise. He eats fast when he is hungry",
      },
      {
        id: "sample-f5",
        item: "He clears his own plate; leave the counter to him",
        type: "support",
        reason: "Prompting the order of things undoes it",
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
      {
        id: "sample-c3",
        category: "dressing",
        steps: "Clothes laid out the night before, in the order they go on\nTags out, no zips he has not used before",
      },
      {
        id: "sample-c4",
        category: "toileting",
        steps: "Independent. He will not ask, so offer before you leave the house",
      },
      {
        id: "sample-c5",
        category: "mobility",
        steps: "Walks everywhere. Stairs on the left rail\nCrowds: give him the outside of the pavement",
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
      {
        id: "sample-levetiracetam",
        name: "Levetiracetam",
        dose: "500",
        unit: "mg",
        schedule: ["morning", "bedtime"],
        purpose: "Seizure control. Never miss the evening one",
      },
    ],
    providers: [
      {
        id: "sample-chandra",
        name: "Dr. Priya Chandra",
        specialty: "Family medicine",
        phone: "(555) 014-6210",
      },
      {
        id: "sample-okafor",
        name: "Dr. James Okafor",
        specialty: "Neurology",
        phone: "(555) 014-0110",
      },
    ],
    preferredHospital: "Fairfax Northern. Records and behavior plan on file",
  },
};
