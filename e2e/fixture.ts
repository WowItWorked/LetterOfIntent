import type { Page } from "@playwright/test";
import type { LetterData, LetterMeta } from "../src/lib/schema";

/** Mirrors LETTER_STORAGE_KEY in src/lib/store.ts (kept literal so this file
 *  stays import-light; the seeded tests fail loudly if the key ever drifts). */
export const LETTER_KEY = "twl-loi-letter-v1";

/** The canonical roster's slugs, in reading order (one roster, one form). */
export const SECTION_SLUGS = [
  "getting-started",
  "about-them",
  "family-and-support",
  "typical-days",
  "communication",
  "health-and-medical",
  "behavioral-support",
  "allergies",
  "emergency-plan",
  "daily-routines",
  "food-and-eating",
  "personal-care",
  "home-and-daily-living",
  "school-and-work",
  "money-and-benefits",
  "legal-and-decisions",
  "friends-joy-and-faith",
  "guidance-for-the-trustee",
  "for-whoever-steps-in",
  "final-wishes",
  "a-personal-message",
] as const;

export const ALL_SECTION_SLUGS = SECTION_SLUGS;

/**
 * The routing answers of the full fixture: the "both" configuration at high
 * support — every section in play.
 */
export const FULL_META: LetterMeta = {
  audience: "both",
  stage: "adult",
  supportLevel: "substantial",
  communicationDiffers: "yes",
  behaviorEscalates: "yes",
  cognitionChanging: "no",
  hasTrust: "yes",
  hasBenefits: "yes",
  schoolWork: ["school", "work"],
  livesWith: "withWriter",
  onboardingDone: true,
};

/** A letter with content in every canonical section, including repeaters. */
export const FULL_LETTER: LetterData = {
  gettingStarted: {
    authorName: "Maria Alvarez",
    authorRelationship: "Mother",
    subjectFullName: "Alexander James Alvarez",
    subjectPreferredName: "Alex",
    letterDate: "2026-08-07",
  },
  person: {
    dateOfBirth: "2004-03-14",
    whoTheyAre: "Alex is 22, funny, precise, and prouder of his library job than of anything.",
    history: "Born in Fairfax in 2004.\n\nDiagnosed at three. Loves the Metro map.",
    firstFiveMinutes: "Say 'Hi Alex' first. Wave, don't shake hands.",
    importantToKnow: "He remembers every birthday he's ever been told.",
  },
  familySupport: {
    contacts: [
      {
        id: "c1",
        name: "Dana Alvarez",
        relationship: "Aunt",
        phone: "(703) 555-0142",
        email: "dana@example.com",
        role: "Backup caregiver; knows the routines",
        emergency: true,
        notes: "Can be there in 15 minutes.",
      },
      {
        id: "c2",
        name: "Ray Alvarez",
        relationship: "Uncle",
        phone: "(703) 555-0000",
        emergency: false,
      },
    ],
    firstCall: "Dana — (703) 555-0142",
    doNotInvolve: "Ray should not handle money decisions.",
  },
  routine: {
    mornings: "Wakes 6:30. Ten minutes of radio first. Meds in the blue cup.",
    evenings: "Shower, two books, lights out 9:30.",
    sleep: "Needs the hallway light on.",
    food: "Waffles cut in strips. No foods touching.",
    clothing: "No tags. Soft seams only.",
    sensory: "Fire alarms are very hard. Headphones in the go-bag.",
    comfortObjects: "Blue train blanket — backup in the hall closet.",
    fixedPoints: "Program weekdays 9–2; library Saturdays; pizza Fridays with Marcus.",
    goodDay: "No surprises, program 9–2, train videos after.",
    hardDay: "Starts with a schedule change. Gets quiet, then loud.",
  },
  communication: {
    how: "Speaks in short sentences; uses an AAC app when overwhelmed.",
    howToSpeak: "Lead with his name. 'First… then…' sentences, real times.",
    yesNo: "Yes is a nod plus 'yeah'. No is walking away.",
    pain: "Goes quiet and presses on the spot. Skipped meals mean something hurts.",
    overwhelm: "Hums louder and rocks. That's the ten-minute warning.",
    whatHelps: "'First… then…' sentences. Real times, not 'later'.",
    whatToAvoid: "Never 'calm down'. Never 'maybe'.",
  },
  health: {
    providers: [
      { id: "p1", name: "Dr. Sarah Kim", specialty: "Neurology", phone: "(703) 555-0199" },
      { id: "p2", name: "Dr. James Okafor", specialty: "Primary care", phone: "(703) 555-0110" },
    ],
    medications: [
      { id: "m1", name: "Levetiracetam", dose: "500 mg, morning and night", purpose: "Seizure control" },
      { id: "m2", name: "Sertraline", dose: "50 mg, morning", purpose: "Anxiety" },
    ],
    conditions: "Autism spectrum disorder; epilepsy (focal seizures); anxiety",
    allergies: "Penicillin — hives and swelling.",
    emergencyProtocol:
      "Seizure: start timing. On his side, nothing in his mouth. Over 3 minutes: rescue med in the red pouch, call 911.",
    therapies: "Speech Tuesdays 4pm with Ms. Kim.",
    equipment: "Noise-canceling headphones; backup charger in go-bag.",
    insurancePlans: "Anthem HealthKeepers through Dad's employer; Virginia Medicaid — CCC Plus waiver.",
    preferredHospital: "Inova Fairfax — they have his records.",
    whatWorked: "Keppra stopped the drop seizures within a month.",
    whatDidNot: "Risperidone — weight gain, no benefit.",
  },
  behavior: {
    triggers: "Fire alarms. Plans changing without warning. The word 'later'.",
    earlyWarnings: "Louder humming, rocking, asking the same question twice.",
    deEscalation: "Lower your voice. One person talks. Weighted blanket. Wait ten minutes.",
    makesWorse: "Touching him, crowding, raised voices, rapid questions.",
    crisisPlan: "Call Dana first, then us. REACH crisis line is on the fridge.",
    lawEnforcement: "May not respond to commands; may run. One officer, slow voice, no restraint.",
  },
  schoolWork: {
    currentProgram: "Fairfax day program, 9–2 weekdays. Contact: Ms. Lopez.",
    iepHistory: "Small classes worked. Music-based learning worked. Timed tests never did.",
    whatWorksLearning: "Show, don't tell. One step at a time.",
    workHistory: "Library shelving volunteer since 2023 — extremely proud of it.",
    currentWork: "Library shelving, Saturday mornings.",
    jobSupports: "Job coach through ServiceSource: Mr. Bell.",
    commitments: "The library depends on him for the Saturday cart.",
    keyContacts: "Ms. Patel at the Vienna branch.",
    windDown: "The library shift passes to the volunteer coordinator.",
    hopes: "Part-time work around trains or libraries.",
  },
  home: {
    currentLiving: "At home with us.",
    supportLevel: "Needs someone present overnight; manages hygiene with prompts.",
    personalCare: "Manages with prompts; bathing needs the checklist.",
    petsAndPlants: "Feeds the goldfish, proudly. Backup: Sofia.",
    safety: "Stove locks on. Front door chimes.",
    waiverStatus: "On the DD waiver waitlist since 2021, priority 2. Dana has the paperwork.",
    futureHopes: "A small group home near his sister, with his own room.",
    hardLimits: "Never a large institution. Never far from his sister.",
  },
  moneyBenefits: {
    programs: "SSI since 18. Virginia Medicaid.",
    repPayee: "Mother is representative payee.",
    ableAccount: "ABLE account managed by Mother.",
    trusts: "Special needs trust (2022). Trustee: Dana Alvarez. Drafted by Trusts & Wealth.",
    pending: "Waiver slot appeal pending — Dana is handling it.",
    whereRecordsKept: "Gray fireproof box, bedroom closet. Key taped in the kitchen junk drawer.",
    incomeSources: "SSI on the 1st; library stipend quarterly.",
    whoHandlesBills: "Mother handles all bills.",
    howBillsArePaid: "Everything on autopay from the household account.",
    vulnerabilities: "Anyone who talks about trains can talk him into anything.",
  },
  communityFaith: {
    friends: "Marcus from program — pizza Fridays.",
    activities: "Trainspotting at the Vienna platform, Saturdays.",
    faith: "St. Mark's — Deacon Reyes knows him well.",
    congregation: "St. Mark's, 10am Mass. Call the parish office.",
    traditions: "Christmas Eve: pajamas, one gift, Muppet Christmas Carol (the DVD).",
    travel: "Window seat, direct flights only.",
    joy: "Trains. Always trains.",
  },
  legal: {
    decisionStatus: "Supported decision-making agreement (2023); healthcare POA held by Mother.",
    powersOfAttorney: "Healthcare POA held by Mother, signed 2023.",
    advanceDirectives: "None yet — on the list with the attorney.",
    guardianship: "Deliberately avoided; supported decision-making instead.",
    whoDecidesWhat: "Daily choices are his. Medical and money are shared with Mother.",
    advocates: "Support coordinator: Ms. Green, Fairfax CSB.",
    professionals: "Claire Kelly, Trusts & Wealth — trust and POA work.",
    advocacyHistory: "Won the 2021 waiver appeal with the neurologist's letter.",
  },
  trusteeGuidance: {
    moneyIsFor: "A life, not a ledger. Concert aides, the good mattress, direct flights.",
    easyYeses: "Anything for the train hobby under $200. Respite for caregivers.",
    spendVsPreserve: "Spend for quality of life now; the house covers the far future.",
    scrutinize: "Any request routed through Ray.",
    wishesVsSafety: "Risks that bruise, yes. Risks that break, no.",
    consultFirst: "Dana, then his sister. Dr. Kim for anything medical.",
  },
  caregiverGuidance: {
    firstWeek: "Call the program first — Ms. Lopez will hold his spot. Keep Saturday library no matter what.",
    hindsight: "We waited too long to write things down. Start the binder on day one.",
    neverChange: "Pizza Fridays with Marcus. It looks small. It is the week's anchor.",
    consultFirst: "Dana and Sofia, before any move or program change.",
  },
  finalWishes: {
    funeral: "Small, at St. Mark's. His playlist, not hymns.",
    restingPlace: "Cremation. Ashes with ours eventually.",
    religious: "Catholic rites.",
    organDonation: "Yes — recorded at the DMV.",
    endOfLife: "Comfort first. Advance directive in the fireproof box.",
    documentsLocation: "All of it in the gray fireproof box.",
  },
  personalMessage: {
    toCaregivers: "When he is difficult, he is scared. Thank you for being with him.",
    toSiblings: "Sofia — he is not your burden. Your own life matters too.",
    toPerson: "Alex: you are the best thing we ever did.",
  },
  allergies: {
    items: [
      {
        id: "al1",
        allergen: "Penicillin",
        reaction: "Hives, then swelling around the mouth",
        severity: "life-threatening",
        treatment: "Call 911 if breathing changes. Benadryl for hives alone.",
      },
      {
        id: "al2",
        allergen: "Latex",
        reaction: "Red, itchy skin",
        severity: "mild",
        treatment: "Wash the area; hydrocortisone from the medicine box",
      },
    ],
  },
  emergencyPlan: {
    responseSteps:
      "Start timing the seizure\nOn his side, nothing in his mouth\nOver 3 minutes: rescue med from the red pouch\nCall 911, then Dana",
    call911When: "Any seizure over 3 minutes, or any trouble breathing",
    otherwiseCall: "Dana — (703) 555-0142, any hour",
    ifNoOneAnswers: "Go to Inova Fairfax — they have his records",
    otcPolicy: "Nothing beyond the list without calling us first",
  },
  routines: {
    items: [
      {
        id: "r1",
        timeOfDay: "morning",
        time: "6:30 AM",
        steps:
          "Radio on before the covers come off\nMeds in the blue cup with orange juice\nWaffles cut in strips",
      },
      {
        id: "r2",
        timeOfDay: "night",
        time: "9:00 PM",
        steps: "Shower\nTwo books\nHallway light stays on",
        notes: "If bedtime slips past ten, the next day is hard.",
      },
    ],
    transitions: "Five-minute warning, then two. 'First shoes, then the park.'",
  },
  foods: {
    items: [
      {
        id: "f1",
        item: "Waffles",
        type: "always_works",
        reason: "Cut in strips, syrup on the side — never on top",
      },
      {
        id: "f2",
        item: "Grapes",
        type: "choking_risk",
        reason: "Always quartered, never whole",
      },
    ],
  },
  careTasks: {
    items: [
      {
        id: "ct1",
        category: "bathing",
        steps: "Water running before he comes in\nCheck the temperature — he cannot judge it",
        equipment: "Shower chair; grab bar by the tub",
      },
    ],
  },
};

/** Wraps letter data in zustand-persist's stored shape, at the current version. */
export function persistedState(data: LetterData, meta: LetterMeta = FULL_META) {
  return JSON.stringify({ state: { data, meta }, version: 2 });
}

/** A v1-era payload, exactly as the two-path app persisted it — for the
 *  migration e2e tests, which load it and let the store migrate live. */
export function persistedStateV1(
  data: Record<string, unknown>,
  meta: Record<string, unknown> = {}
) {
  return JSON.stringify({ state: { data, meta }, version: 1 });
}

/** Seeds localStorage before the app boots. */
export async function seedLetter(page: Page, data: LetterData, meta: LetterMeta = FULL_META) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [LETTER_KEY, persistedState(data, meta)] as const
  );
}

/** Seeds a v1 letter, so the app's own migration runs on first load. */
export async function seedV1Letter(
  page: Page,
  data: Record<string, unknown>,
  meta: Record<string, unknown> = {}
) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [LETTER_KEY, persistedStateV1(data, meta)] as const
  );
}
