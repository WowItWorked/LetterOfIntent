import type { LetterData, LetterMeta } from "@/lib/schema";

/**
 * Sample family 1 — the Ruiz family. Teresa writing about Danny, 24, in the
 * "both" configuration at substantial support: every section in play, all
 * four outputs exercised. The prose source of truth is
 * docs/sample-family-high-support.md (owner-reviewed at Checkpoint 3);
 * this fixture is that letter as LetterData, and samples.test.ts keeps it
 * schema-true.
 *
 * Wholly fictional. (555) numbers. No SSNs or account numbers anywhere —
 * the fixture models where-not-what, because people copy what a sample does.
 */

export const RUIZ_META: LetterMeta = {
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

export const RUIZ_LETTER: LetterData = {
  gettingStarted: {
    authorName: "Teresa Ruiz",
    authorRelationship: "Mother",
    subjectFullName: "Daniel Ruiz",
    subjectPreferredName: "Danny",
    subjectAddress: "2115 Alder Court, Vienna, VA",
    letterDate: "2026-05-04",
  },
  person: {
    dateOfBirth: "2002-03-18",
    whoTheyAre:
      "Danny is 24, built like his grandfather, and the most reliable person in " +
      "this house. He has autism and an intellectual disability, and those words " +
      "tell you almost nothing useful about him. He knows every bus route in " +
      "Fairfax County and whether they are running late. He has worked the " +
      "Saturday shift at Harris Grocery for three years and has never once been " +
      "late. If he tells you he will do a thing, the thing gets done, exactly, " +
      "forever.",
    history:
      "Danny was born in Arlington in 2002. He was diagnosed at two and a half. " +
      "He didn't speak until he was six, and the first thing he said was the " +
      "number of the bus that goes to his grandmother's house. Middle school was " +
      "the hard chapter: a placement that didn't fit, two years we are still " +
      "sorry about. Everything turned when he got to the county transition " +
      "program and met Mr. Okafor, who saw that Danny doesn't learn from being " +
      "told, he learns from being shown, once, slowly. His grandmother died in " +
      "2020 and he still points out her bus stop every time we pass it.",
    firstFiveMinutes:
      "Tell him your name and give him a minute. Don't fill the silence; he is " +
      "deciding about you, and he is allowed. If he shows you the bus schedule " +
      "on his phone, you are in. Never touch his backpack. It is not a rule we " +
      "made, it is a rule he made, and it is absolute.",
    strangersGetWrong:
      "People talk to him louder and slower than they need to, or they talk to " +
      "whoever is next to him instead. He understands nearly everything said at " +
      "normal speed. He simply may not answer, and his not answering means he " +
      "is thinking, not that he didn't hear.",
    cannotAbide:
      "Being hurried. The word \"maybe.\" Anyone touching his backpack. Plans " +
      "that change without a warning and a reason.",
  },
  familySupport: {
    contacts: [
      {
        id: "ruiz-carmen",
        name: "Carmen Ruiz-Bell",
        relationship: "Aunt",
        phone: "(555) 014-2280",
        roles: ["primary", "medical_decision"],
        emergency: true,
        role: "Trustee; the person he will go with without a fuss",
        notes: "Fifteen minutes away.",
      },
      {
        id: "ruiz-miguel",
        name: "Miguel Ruiz",
        relationship: "Father",
        phone: "(555) 014-2281",
        emergency: true,
        notes: "Works nights; call after 3pm first.",
      },
      {
        id: "ruiz-robert",
        name: "Robert Bell",
        relationship: "Uncle",
        phone: "(555) 014-2287",
        roles: ["neighbor_backup", "pickup"],
      },
      {
        id: "ruiz-okafor",
        name: "Ms. Dana Okafor",
        relationship: "Day program lead",
        phone: "(555) 014-3010",
        role: "Weekdays; knows his communication cards",
      },
    ],
    firstCall: "Carmen — (555) 014-2280, then Miguel",
    doNotInvolve:
      "His uncle Ray means well and should never handle money for Danny. He has " +
      "borrowed from three family members and paid back none of them. Visits " +
      "and birthdays are fine, and welcome.",
  },
  routine: {
    mornings:
      "Danny wakes at 6:40 without an alarm. Bathroom, then he checks the bus " +
      "feed on his phone before anything else; do not ask him anything until he " +
      "has. Breakfast is two eggs scrambled hard and toast cut corner to " +
      "corner. Meds go in the green cup by his plate. He leaves for the program " +
      "at 8:05, the 8:12 bus, and he likes to be at the stop four minutes early.",
    evenings:
      "Home at 4:30. One hour alone in his room with the door shut; this hour " +
      "is not optional and not a sign anything is wrong. Dinner at 6. Shower at " +
      "8:30, and the towel goes on the left hook or the shower has not " +
      "happened. Lights out at 10 with the fan on, even in winter.",
    sleep:
      "Solid, once he is down. If he is up past 11 something is wrong; check " +
      "tomorrow's schedule with him. There is usually a change in it he heard " +
      "about and didn't mention.",
    food:
      "Eggs scrambled hard, toast corner to corner, and the tamales he makes " +
      "with Carmen. No foods touching on the plate. Everything he eats at the " +
      "program is packed from home because of the peanut allergy.",
    sensory:
      "Fire alarms and air dryers are genuinely painful for him. Fluorescent " +
      "hum bothers him before anyone else can hear it. His ear defenders are " +
      "in the front pocket of the backpack; offering them is always welcome, " +
      "putting them on him is not.",
    comfortObjects:
      "The backpack, entire and untouched. The laminated ring of picture cards " +
      "inside it. His bus museum membership card, which he carries always.",
    fixedPoints:
      "Program weekdays 9 to 2. Harris Grocery Saturdays 9 to 1. Mass with " +
      "Carmen Sunday 10:30. Bus museum the first Saturday of the month, which " +
      "is the appointment of his life.",
    gettingAround:
      "The county bus, expertly and proudly, on the routes he knows. New " +
      "routes need a companion the first three times, then they are his.",
    goodDay:
      "A good day ends with him narrating the bus delays to us at dinner. The " +
      "narration is the tell. A quiet Danny at dinner is a Danny with a " +
      "problem he has not found words for yet.",
    hardDay:
      "A hard day starts with an unannounced change. He goes quiet first, then " +
      "rigid, then loud. The order never varies, and quiet is the moment to act.",
  },
  communication: {
    how:
      "Short sentences, four or five words. He answers questions reliably " +
      "about concrete things and struggles with \"why\" questions. For anything " +
      "hard he uses the picture cards in his backpack, a laminated ring of " +
      "about thirty he made himself with Ms. Okafor. The newest card is how " +
      "you find out what he has been worrying about.",
    howToSpeak:
      "Normal speed, normal volume, to him and not about him. Say his name " +
      "first. One question at a time, and give the silence room to work.",
    yesNo:
      "Yes is \"yeah\" with a nod. No is silence and looking away. Pressing " +
      "after the silence gets you a louder no and costs you an hour of trust. " +
      "Silence IS the answer.",
    pain:
      "He will not tell you something hurts. He guards the spot and stops " +
      "eating. A skipped meal is a fever, a bad tooth, or worse, every single " +
      "time it has ever happened. Check teeth first.",
    overwhelm:
      "He goes still and stops answering. Then he squares his shoulders and " +
      "plants his feet. The stillness is the early warning, and it is easy to " +
      "miss if you don't know him.",
    whatHelps:
      "\"First, then\" sentences: first the store, then the bus. Real times. " +
      "Writing a change on the whiteboard where he can see it coming.",
    whatToAvoid:
      "\"Maybe.\" \"Later.\" \"We'll see.\" \"Calm down.\" Sarcasm reads as lying " +
      "to him. Never promise a bus ride you cannot deliver.",
  },
  health: {
    conditions:
      "Autism, intellectual disability (moderate), anxiety. Chronic " +
      "constipation, which is serious for him: it changes behavior a week " +
      "before anyone would guess the cause.",
    allergies: "Peanuts — hives and vomiting within the hour.",
    medications: [
      {
        id: "ruiz-sertraline",
        name: "Sertraline",
        dose: "50 mg",
        schedule: ["morning"],
        purpose: "for anxiety. Never stop it abruptly",
      },
      {
        id: "ruiz-miralax",
        name: "Miralax",
        dose: "1 cap",
        schedule: ["evening"],
        purpose: "nightly, in juice. He knows it is in there and it is fine",
      },
      {
        id: "ruiz-benadryl",
        name: "Benadryl",
        dose: "50 mg",
        isRescue: true,
        location: "Kitchen cabinet by the phone; spare in Carmen's car",
        purpose: "Peanut exposure",
        prnTrigger: "Hives or vomiting after eating",
      },
      {
        id: "ruiz-melatonin",
        name: "Melatonin",
        dose: "3 mg",
        schedule: ["21:30"],
        purpose: "only if he asks for \"the sleep one\"",
      },
    ],
    providers: [
      {
        id: "ruiz-chandra",
        name: "Dr. Priya Chandra",
        specialty: "Family medicine",
        phone: "(555) 014-6210",
        notes: "Books him the first slot of the day.",
      },
      {
        id: "ruiz-weiss",
        name: "Dr. Weiss",
        specialty: "Dentist",
        phone: "(555) 014-6244",
        notes: "Sedation cleanings twice a year; book months ahead.",
      },
    ],
    preferredHospital: "Fairfax Northern. Records and behavior plan on file; ask for the quiet intake room",
    appointmentHelp:
      "Someone he knows goes in with him, always. He answers the doctor " +
      "honestly but minimally, and he will say nothing hurts while guarding " +
      "his jaw. The escort's job is to say what the week has actually looked like.",
    insurancePlans: "Virginia Medicaid, and secondary coverage through Miguel's employer plan.",
    recordsLocation:
      "Insurance cards in Teresa's wallet and copies in the blue box. The " +
      "medication list is taped inside the kitchen cabinet by the phone.",
    therapies: "Speech consult quarterly with the program. Sedation dentistry twice a year.",
    whatWorked:
      "Sertraline, genuinely; the difference was two months and unmistakable. " +
      "Visual schedules. Sedation dentistry.",
    whatDidNot:
      "Risperidone: weight gain, flat affect, no benefit. He was the one who " +
      "told us, with a picture card he made that said \"foggy.\"",
  },
  behavior: {
    triggers:
      "Unannounced changes. Fire alarms. Being touched from behind. Crowded " +
      "waiting rooms. The phrase \"calm down.\"",
    earlyWarnings:
      "He goes still and stops answering. Then he squares his shoulders and " +
      "plants his feet. You have about two minutes from the stillness.",
    deEscalation:
      "One person talks; everyone else steps back and stops looking at him. " +
      "Name the plan in first-then words. Offer the ear defenders. Give him " +
      "the walkway, never a corner. It takes ten minutes and it works.",
    makesWorse:
      "Touch. Crowding. Two people talking at once. Taking the backpack " +
      "\"somewhere safe.\"",
    crisisPlan:
      "True crises are rare, roughly twice a year. Call Carmen, then Miguel. " +
      "The county crisis line is on the fridge and in Carmen's phone. He has " +
      "never hurt anyone; he wants distance, not a fight.",
    lawEnforcement:
      "Danny is a large man who may not answer questions, may rock, and may " +
      "walk away from you. That is autism, not defiance or intoxication. He " +
      "cannot answer \"what's your name\" under stress but will show you the ID " +
      "card in his left jacket pocket if you ask slowly. One officer, no " +
      "lights, no touching. Registered with the Fairfax County voluntary registry.",
  },
  schoolWork: {
    currentProgram:
      "Fairfax Adult Day Services, weekdays 9 to 2. Lead: Ms. Dana Okafor. He " +
      "rides the 8:12 county bus alone, and treasures managing it alone.",
    whatWorksLearning:
      "Show him once, slowly, silently if you can. He cannot learn from a " +
      "paragraph. He can learn anything from a demonstration.",
    workHistory: "Harris Grocery since 2023. Before that, the transition program's mail run.",
    currentWork:
      "Harris Grocery, Saturdays 9 to 1, carts and stocking. His badge says " +
      "DANIEL and he wears it Sundays too. The manager, Ted, gets it; if Ted " +
      "ever leaves, that relationship is the thing to rebuild first.",
    jobSupports: "Job coach: Marcus Bell of ServiceSource, monthly check-ins. (555) 014-8830.",
    hopes:
      "More hours at Harris. Someday, honestly, anything at the transit " +
      "authority. A man who knows every route in the county should get to use that.",
  },
  home: {
    currentLiving:
      "With us, in the house he has lived in since he was four. His room is " +
      "his territory and cleaning it is his job, done to his own exacting and " +
      "slightly alarming standard.",
    supportLevel:
      "He manages hygiene with a posted checklist, cooks three specific meals " +
      "with supervision on the stove, and cannot manage money beyond a twenty. " +
      "He should never be alone overnight; not because of danger, but because " +
      "a disrupted morning with no one to steady it unravels his whole day.",
    personalCare:
      "Independent with the checklist. The shower happens at 8:30 or it " +
      "doesn't happen; prompts after that window turn into a standoff.",
    petsAndPlants: "No pets; he considers Biscuit next door to be partly his, and walks him Sundays with Robert.",
    safety:
      "Stove has a supervision rule, his own: he will not use it alone and " +
      "says so. Front door chimes. He carries ID in his left jacket pocket, always.",
    waiverStatus:
      "On the DD waiver waitlist since 2019, priority category two. Carmen " +
      "manages the annual paperwork; the county letter comes in March and must " +
      "not be missed.",
    futureHopes:
      "A supported apartment near Carmen, with his own kitchen and a bus line " +
      "he approves of. Two roommates maximum. He has told us this himself, in " +
      "his own words, several times, and he means it.",
    hardLimits:
      "Never a large facility. Never out of Fairfax County away from the " +
      "routes he knows and the people who know him. Never a placement that " +
      "treats his hour alone after program as isolation to be corrected; it is " +
      "regulation and he built it himself.",
  },
  moneyBenefits: {
    programs: "SSI since 18. Virginia Medicaid. DD waiver waitlist since 2019.",
    repPayee: "Teresa, for now; the plan is Carmen next.",
    ableAccount:
      "Opened 2022, Carmen manages it. Danny contributes twenty dollars a " +
      "month from Harris and knows it is \"his apartment money.\"",
    trusts:
      "A special needs trust, created 2021. Carmen is trustee, Robert is " +
      "successor. Drafted by Claire Kelly at Trusts & Wealth, who holds the original.",
    pending: "The waiver waitlist, standing. Nothing else pending.",
    whereRecordsKept:
      "The blue fireproof box in our bedroom closet: trust documents, benefit " +
      "letters, the decision-making agreement, his ID documents. The key is in " +
      "the kitchen drawer with the takeout menus. Carmen has the password to " +
      "the document scans.",
  },
  legal: {
    guardianship:
      "We deliberately did not pursue full guardianship. Danny has a supported " +
      "decision-making agreement (2021) naming Teresa and Carmen as supporters.",
    powersOfAttorney: "Teresa holds medical and financial powers of attorney, signed 2021.",
    whoDecidesWhat:
      "Daily life is his. His money to twenty dollars, his room, his routes. " +
      "Medical: explained to him with the picture cards, decided with Teresa " +
      "in the room. Money above that: Carmen. Anything about where he lives: " +
      "everyone, slowly, with him first.",
    advocates: "Support coordinator: Ms. Green, Fairfax CSB, (555) 014-7788.",
    advocacyHistory:
      "The 2019 waiver category appeal: won with letters from Dr. Chandra and " +
      "Ms. Okafor. The phrase that moved the wall was \"institutional level of " +
      "care.\" Get every denial in writing. Never accept a no by phone.",
    professionals: "Claire Kelly, Trusts & Wealth: the trust, the POAs, the agreement.",
  },
  communityFaith: {
    friends:
      "Sam from the program, who shares the bus thing; they text each other " +
      "route numbers, which is a complete conversation. The Saturday crew at Harris.",
    activities: "The bus museum, first Saturday monthly. Cooking with Carmen. The routes themselves.",
    joy:
      "Buses. The museum. His grandmother's tamale recipe, which he cooks with " +
      "Carmen on Christmas Eve, exactly her way, no substitutions tolerated.",
    faith: "Mass with Carmen at St. Anthony's, 10:30. Same pew, third from the back.",
    congregation: "St. Anthony's. Father Muller knows him and would want to be called.",
    traditions: "Christmas Eve tamales with Carmen. The museum's holiday train display, opening day, every year.",
  },
  trusteeGuidance: {
    moneyIsFor:
      "A life, not a ledger. It is for the supported apartment when his name " +
      "comes up. It is for the aide who will ride the new bus route with him " +
      "until it is his. It is for sedation dentistry without anyone weighing " +
      "it against the electric bill, and for the bus museum membership every " +
      "single year, forever.",
    easyYeses:
      "Anything under three hundred dollars that touches buses, the museum, " +
      "his kitchen, or Harris Grocery. Respite for whoever is caring for him; " +
      "that money protects him, not just them.",
    spendVsPreserve:
      "Spend. The house will fund the far future. The trust exists so his " +
      "twenties and thirties are not a waiting room.",
    scrutinize:
      "Any request that comes through Ray. Any program with a beautiful " +
      "brochure that cannot explain its staff turnover.",
    wishesVsSafety:
      "Danny's wishes are usually about sameness, and sameness is usually " +
      "safe. Where it matters: he would ride buses alone at night, and the " +
      "answer is no, explained, with an alternative, every time. Let him take " +
      "risks that bruise. Not the ones that break.",
    consultFirst:
      "Carmen, always. Ms. Okafor about his days. Dr. Chandra about anything " +
      "medical. And Danny. He understands more than the meeting thinks he " +
      "does, and he can tell when he was not asked.",
  },
  caregiverGuidance: {
    firstWeek:
      "Do not change anything you do not have to. Call Ms. Okafor so the " +
      "program knows there is a new person; call Ted at Harris so Saturday " +
      "holds. Meals from the list on the fridge. Learn the bus feed app " +
      "before you need it. Everything financial can wait two weeks; Carmen has it.",
    hindsight:
      "We waited three years too long to start the waiver paperwork, and we " +
      "spent Danny's teens preparing for the person we feared he would be " +
      "instead of the person he was becoming. Start everything earlier than " +
      "feels necessary, and bet on him.",
    neverChange:
      "The hour alone after program. Saturday at Harris. The first-Saturday " +
      "museum trip. The backpack rules. These look like quirks and they are " +
      "load-bearing.",
    consultFirst:
      "Carmen and Miguel together, and Danny himself, with the cards, with time.",
  },
  finalWishes: {
    funeral: "A small Mass at St. Anthony's. Ask Sam to sit in his pew.",
    restingPlace: "Near his grandmother.",
    documentsLocation:
      "The blue box. The bus museum takes memorial donations; that is where " +
      "any flowers money should go.",
  },
  personalMessage: {
    toCaregivers:
      "When Danny is difficult he is frightened, and when he trusts you he " +
      "will be more loyal to you than anyone you have ever met. Do not " +
      "mistake his silence for absence. He is all the way in there.",
    toSiblings:
      "Carmen — he is not a duty we left you. He is the best of all of us, " +
      "and you have always seen it. Your own life matters too; the trust is " +
      "funded so that both of those sentences can stay true at once.",
    toPerson: "Danny: you are not a burden. You have never once been a burden. Keep riding, mijo.",
  },
  allergies: {
    items: [
      {
        id: "ruiz-peanuts",
        allergen: "Peanuts",
        severity: "serious",
        reaction: "Hives and vomiting within the hour",
        treatment: "Benadryl from the kitchen cabinet; 911 if lips swell or breathing changes",
      },
    ],
  },
  emergencyPlan: {
    scenarios: [
      {
        id: "ruiz-missing",
        trigger: "If Danny is missing",
        steps:
          "He is not hiding, he is riding: check the 2A bus first\nThen the bus museum\nCall Carmen while you check — do not wait an hour",
      },
      {
        id: "ruiz-peanut",
        trigger: "If he eats peanuts",
        steps:
          "Benadryl 50 mg from the kitchen cabinet\nWatch his breathing\nCall Carmen — 911 if lips swell or breathing changes",
      },
    ],
    call911When: "Breathing trouble, a fall he doesn't get up from, or the \"hurt\" card with no findable cause",
    otherwiseCall: "Carmen — (555) 014-2280, any hour",
    ifNoOneAnswers: "Fairfax Northern has his records — and check the 2A",
    otcPolicy: "Nothing beyond the list without calling Carmen first.",
  },
  routines: {
    items: [
      {
        id: "ruiz-r1",
        timeOfDay: "morning",
        time: "6:40",
        steps: "Bus feed first — ask nothing until he has checked it\nEggs scrambled hard, toast corner to corner\nMeds in the green cup",
      },
      {
        id: "ruiz-r2",
        timeOfDay: "afternoon",
        time: "4:30",
        steps: "One hour alone in his room, door shut\nNot optional, not a warning sign",
      },
      {
        id: "ruiz-r3",
        timeOfDay: "evening",
        time: "8:30",
        steps: "Shower — towel on the left hook\nLights out at 10, fan on, even in winter",
      },
    ],
    transitions:
      "Name the plan in first-then words, with a real time. Changes go on the " +
      "whiteboard where he can see them coming.",
  },
  foods: {
    items: [
      {
        id: "ruiz-f1",
        item: "Peanuts, anything peanut",
        type: "will_not_eat",
        reason: "Allergy — serious. Everything at the program is packed from home",
      },
      {
        id: "ruiz-f2",
        item: "Eggs scrambled hard, toast corner to corner",
        type: "always_works",
        reason: "Every morning. No foods touching on the plate",
      },
    ],
  },
  careTasks: {
    items: [
      {
        id: "ruiz-c1",
        category: "bathing",
        steps: "Shower at 8:30 or not at all\nChecklist is on the mirror — he runs it himself",
      },
      {
        id: "ruiz-c2",
        category: "equipment",
        steps: "Ear defenders live in the backpack front pocket\nOffer, never install",
        equipment: "Ear defenders; the picture-card ring",
      },
    ],
  },
};
