import type { Page } from "@playwright/test";
import type { LetterData } from "../src/lib/schema";

/** Mirrors LETTER_STORAGE_KEY in src/lib/store.ts (kept literal so this file
 *  stays import-light; the seeded tests fail loudly if the key ever drifts). */
export const LETTER_KEY = "twl-loi-letter-v1";

export const SECTION_SLUGS = [
  "getting-started",
  "about",
  "family-and-support",
  "a-typical-day",
  "communication",
  "medical",
  "behavioral-support",
  "allergies",
  "emergency-plan",
  "daily-routines",
  "food-and-eating",
  "personal-care",
  "school-and-work",
  "housing",
  "benefits-and-finances",
  "friends-joy-and-faith",
  "legal-and-advocacy",
  "guidance-for-the-trustee",
  "final-wishes",
  "a-personal-message",
] as const;

/** The general path — nine sections are shared with the list above. */
export const GENERAL_SECTION_SLUGS = [
  "getting-started",
  "about-them",
  "family-and-support",
  "a-typical-week",
  "talking-with-them",
  "health-and-medical",
  "allergies",
  "emergency-plan",
  "daily-routines",
  "food-and-eating",
  "personal-care",
  "home-and-daily-living",
  "money-and-documents",
  "work-and-obligations",
  "faith-joy-and-community",
  "legal-and-decisions",
  "for-whoever-steps-in",
  "final-wishes",
  "a-personal-message",
] as const;

/** Every distinct section route across both paths. */
export const ALL_SECTION_SLUGS = [
  ...new Set([...SECTION_SLUGS, ...GENERAL_SECTION_SLUGS]),
] as const;

/** A letter with content in all 20 sections, including repeaters. */
export const FULL_LETTER: LetterData = {
  gettingStarted: {
    authorName: "Maria Alvarez",
    authorRelationship: "Mother",
    subjectFullName: "Alexander James Alvarez",
    subjectPreferredName: "Alex",
    letterDate: "2026-08-07",
  },
  about: {
    dateOfBirth: "2004-03-14",
    diagnoses: "Autism spectrum disorder; epilepsy (focal seizures); anxiety",
    lifeHistory: "Born in Fairfax in 2004.\n\nDiagnosed at three. Loves the Metro map.",
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
  typicalDay: {
    morningRoutine: "Wakes 6:30. Ten minutes of radio first. Meds in the blue cup.",
    eveningRoutine: "Shower, two books, lights out 9:30.",
    sleep: "Needs the hallway light on.",
    food: "Waffles cut in strips. No foods touching.",
    clothing: "No tags. Soft seams only.",
    sensory: "Fire alarms are very hard. Headphones in the go-bag.",
    comfortObjects: "Blue train blanket — backup in the hall closet.",
    goodDay: "No surprises, program 9–2, train videos after.",
    hardDay: "Starts with a schedule change. Gets quiet, then loud.",
  },
  communication: {
    how: "Speaks in short sentences; uses an AAC app when overwhelmed.",
    yesNo: "Yes is a nod plus 'yeah'. No is walking away.",
    pain: "Goes quiet and presses on the spot. Skipped meals mean something hurts.",
    overwhelm: "Hums louder and rocks. That's the ten-minute warning.",
    whatToSay: "'First… then…' sentences. Real times, not 'later'.",
    whatNotToSay: "Never 'calm down'. Never 'maybe'.",
  },
  medical: {
    providers: [
      { id: "p1", name: "Dr. Sarah Kim", specialty: "Neurology", phone: "(703) 555-0199" },
      { id: "p2", name: "Dr. James Okafor", specialty: "Primary care", phone: "(703) 555-0110" },
    ],
    medications: [
      { id: "m1", name: "Levetiracetam", dose: "500 mg, morning and night", purpose: "Seizure control" },
      { id: "m2", name: "Sertraline", dose: "50 mg, morning", purpose: "Anxiety" },
    ],
    allergies: "Penicillin — hives and swelling.",
    emergencyProtocol:
      "Seizure: start timing. On his side, nothing in his mouth. Over 3 minutes: rescue med in the red pouch, call 911.",
    therapies: "Speech Tuesdays 4pm with Ms. Kim.",
    equipment: "Noise-canceling headphones; backup charger in go-bag.",
    insurance: "Anthem HealthKeepers through Dad's employer; Virginia Medicaid — CCC Plus waiver.",
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
  educationWork: {
    currentProgram: "Fairfax day program, 9–2 weekdays. Contact: Ms. Lopez.",
    iepHistory: "Small classes worked. Music-based learning worked. Timed tests never did.",
    whatWorksLearning: "Show, don't tell. One step at a time.",
    workHistory: "Library shelving volunteer since 2023 — extremely proud of it.",
    jobSupports: "Job coach through ServiceSource: Mr. Bell.",
    hopes: "Part-time work around trains or libraries.",
  },
  housing: {
    currentLiving: "At home with us.",
    supportLevel: "Needs someone present overnight; manages hygiene with prompts.",
    waiverStatus: "On the DD waiver waitlist since 2021, priority 2. Dana has the paperwork.",
    futureHopes: "A small group home near his sister, with his own room.",
    hardLimits: "Never a large institution. Never far from his sister.",
  },
  benefitsFinances: {
    programs: "SSI since 18. Virginia Medicaid.",
    repPayee: "Mother is representative payee.",
    ableAccount: "ABLE account managed by Mother.",
    trusts: "Special needs trust (2022). Trustee: Dana Alvarez. Drafted by Trusts & Wealth.",
    pending: "Waiver slot appeal pending — Dana is handling it.",
    whereRecordsKept: "Gray fireproof box, bedroom closet. Key taped in the kitchen junk drawer.",
  },
  socialFaith: {
    friends: "Marcus from program — pizza Fridays.",
    activities: "Trainspotting at the Vienna platform, Saturdays.",
    faith: "St. Mark's — Deacon Reyes knows him well.",
    traditions: "Christmas Eve: pajamas, one gift, Muppet Christmas Carol (the DVD).",
    travel: "Window seat, direct flights only.",
    joy: "Trains. Always trains.",
  },
  legalAdvocacy: {
    decisionStatus: "Supported decision-making agreement (2023); healthcare POA held by Mother.",
    advocates: "Support coordinator: Ms. Green, Fairfax CSB.",
    attorney: "Claire Kelly, Trusts & Wealth — trust and POA work.",
    advocacyHistory: "Won the 2021 waiver appeal with the neurologist's letter.",
  },
  trustee: {
    moneyIsFor: "A life, not a ledger. Concert aides, the good mattress, direct flights.",
    easyYeses: "Anything for the train hobby under $200. Respite for caregivers.",
    spendVsPreserve: "Spend for quality of life now; the house covers the far future.",
    scrutinize: "Any request routed through Ray.",
    wishesVsSafety: "Risks that bruise, yes. Risks that break, no.",
    consultFirst: "Dana, then his sister. Dr. Kim for anything medical.",
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

/** Wraps letter data in zustand-persist's stored shape. */
export function persistedState(data: LetterData, meta: Record<string, unknown> = {}) {
  return JSON.stringify({ state: { data, meta }, version: 1 });
}

/** Seeds localStorage before the app boots. */
export async function seedLetter(page: Page, data: LetterData) {
  await page.addInitScript(
    ([key, value]) => {
      window.localStorage.setItem(key, value);
    },
    [LETTER_KEY, persistedState(data)] as const
  );
}
