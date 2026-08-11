import type { LetterData, LetterMeta } from "@/lib/schema";

/**
 * Sample family 2 — the Hale family. Susan writing about her mother Eleanor,
 * 79, in the caregiver-only configuration at low support: the aging-specific
 * questions carry the weight, and the behavior, waiver, and trustee material
 * is correctly absent. Prose source of truth:
 * docs/sample-family-aging-parent.md (owner-reviewed at Checkpoint 3).
 *
 * Together with RUIZ_LETTER this fixture is the variance proof: the same
 * form, visibly different letters.
 */

export const HALE_META: LetterMeta = {
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

export const HALE_LETTER: LetterData = {
  gettingStarted: {
    authorName: "Susan Hale",
    authorRelationship: "Daughter",
    subjectFullName: "Eleanor Hale",
    subjectPreferredName: "Ellie",
    subjectAddress: "34 Chestnut Lane, Vienna, VA",
    letterDate: "2026-05-04",
  },
  person: {
    dateOfBirth: "1946-11-02",
    whoTheyAre:
      "Mom is 79, a retired school librarian, and the person half her street " +
      "still calls before they call anyone else. She reads two books a week " +
      "and has opinions about both. She has buried a husband and a sister and " +
      "come to more life than most people start with. She is funny in a way " +
      "that sneaks up on you, and she will feed anyone who stands still on " +
      "her porch.",
    history:
      "She grew up in Roanoke, third of six. She ran the school library on " +
      "Maple Avenue for thirty-one years and there are grown adults in this " +
      "town who still stop her at the pharmacy to tell her what they're " +
      "reading. Dad died in 2019. The garden got bigger that year, which is " +
      "how she talks about things she does not talk about.",
    temperament:
      "She will accept a ride but not an arm. Offer to carry her bag and " +
      "she'll hand it over cheerfully; take it out of her hand and you have " +
      "started something you will not win. She would rather be twenty minutes " +
      "late than be hurried, and she considers being managed a form of rudeness.",
    strangersGetWrong:
      "They hear the hearing aids and start shouting. She hears fine if you " +
      "face her and speak normally. Shouting makes it worse and embarrasses " +
      "her, and she will quietly decide you are a fool.",
    cannotAbide:
      "Being talked about in the third person while she is in the room. Baby " +
      "talk. Anyone who says \"we\" when they mean her, as in \"how are we " +
      "today.\" The television above volume 20, which is a fight about the " +
      "hearing aids in disguise.",
  },
  familySupport: {
    contacts: [
      {
        id: "hale-susan",
        name: "Susan Hale",
        relationship: "Daughter",
        phone: "(555) 016-4410",
        roles: ["primary", "medical_decision"],
        emergency: true,
        notes: "Twenty minutes away.",
      },
      {
        id: "hale-david",
        name: "David Hale",
        relationship: "Son",
        phone: "(555) 016-4411",
        role: "Financial power of attorney",
        notes: "Portland, so calls, not casseroles.",
      },
      {
        id: "hale-ruthann",
        name: "Ruth Ann Petty",
        relationship: "Neighbor, forty years",
        phone: "(555) 016-4415",
        roles: ["neighbor_backup"],
        emergency: true,
        role: "Has a key; notices the curtains",
        notes: "Believe her when she calls.",
      },
      {
        id: "hale-bright",
        name: "Father Bright",
        relationship: "St. Luke's",
        phone: "(555) 016-4890",
        notes: "She would want him told.",
      },
    ],
    firstCall: "Susan, then Ruth Ann — she can be there in ninety seconds",
  },
  routine: {
    mornings:
      "Up at six, robe, coffee: half a cup, milk, no sugar, in Dad's mug, and " +
      "do not offer her a different mug. Pills from the labeled organizer on " +
      "the sill. Then the crossword. Do not raise anything real before the " +
      "crossword.",
    evenings:
      "Supper at six because it was always at six. Jeopardy at 7:30, out " +
      "loud, competitively. Phone call with David on Sundays at 4; she is by " +
      "the phone at 3:45 pretending she isn't.",
    sleep: "Fine, mostly. A bad night shows up as a short temper the whole next day.",
    food:
      "She cooks breakfast and lunch honestly. Supper \"cooking\" has quietly " +
      "become toast unless someone joins her, so I bring dinners Sundays, " +
      "labeled by day, and we maintain the fiction that it's because I made " +
      "too much. Appetite is fine in company. Dentures out at night, upper only.",
    fixedPoints:
      "Monday: Meals on Wheels route with June, Mom navigating. Wednesday: " +
      "hair at Dot's, 10 a.m. Thursday: Giant, same list, same order, Marlene " +
      "if she's on. Sunday: 9 a.m. Mass, then the cemetery in good weather.",
    gettingAround:
      "She still drives, daytime only, five familiar routes, and the car is a " +
      "sovereignty issue, not a transportation one. She has agreed, twice, not " +
      "to drive at night or in rain. Verify gently. This is the unfinished " +
      "conversation of our family and it must be handled like a border negotiation.",
    goodDay:
      "A good day has the garden in it, and she'll call me about what the " +
      "roses are doing.",
    hardDay:
      "A hard day follows a bad night or a doctor's letter in the mail; she " +
      "goes short with people and won't say why. Tea, the garden, and no big " +
      "subjects until tomorrow.",
  },
  communication: {
    howToSpeak:
      "Straight, once, sitting down, no television. She can smell a rehearsed " +
      "speech from the driveway. Anything about money lands better from " +
      "David; anything about health, from me; and anything about driving, " +
      "honestly, from Ruth Ann, who she considers an equal.",
    hearingVisionMemory:
      "Hearing aids in both ears; she forgets the left one, and it's in the " +
      "ashtray she never used, by the front door. Reading glasses on a chain. " +
      "Her long memory is a library; this week is where the gaps are. She " +
      "repeats a question sometimes an hour apart, covers it beautifully, and " +
      "would rather cover than ask. If she calls you \"honey\" mid-sentence " +
      "she has lost your name and is buying time; work your name into your " +
      "next sentence and no harm done.",
    wontAdmit:
      "The stairs. Watch her pause at the landing and count. Help in the " +
      "shower is a conversation we have not won yet. And money: she will " +
      "never say a bill confused her, but the stack on the hall table tells you.",
    hardConversations:
      "Night driving: agreed, mostly holding. The stairs and a first-floor " +
      "bedroom: raised twice, refused twice, and the second refusal had a " +
      "reason in it, which is in the never-change section. More help in the " +
      "house: she'll take \"company,\" she won't take \"help,\" so the cleaner " +
      "who comes Fridays is officially company who tidies.",
    whatHelps:
      "Giving her the decision to make, out loud, every time. \"What do you " +
      "want to do about the gutters, Mom\" gets the gutters fixed. \"I've " +
      "arranged the gutters\" gets the arrangement cancelled.",
    whatToAvoid:
      "Never open with \"we've decided.\" Never say \"facility\" in any " +
      "sentence in this house. Do not compare her to her sister, who went " +
      "into memory care at the end; it is her exact fear and she will end " +
      "the conversation and possibly the visit.",
  },
  health: {
    conditions:
      "Atrial fibrillation, 2018, on a blood thinner. Osteoarthritis, both " +
      "knees. Early memory change: her doctor's word so far is \"mild,\" and " +
      "we test yearly.",
    allergies: "Sulfa drugs — full-body rash. On file everywhere, and on the card in her wallet.",
    medications: [
      {
        id: "hale-warfarin",
        name: "Warfarin",
        dose: "5 mg",
        schedule: ["evening"],
        purpose: "the one that must never be missed or doubled. The organizer is the system of record",
      },
      {
        id: "hale-metoprolol",
        name: "Metoprolol",
        dose: "50 mg",
        schedule: ["morning"],
        purpose: "heart rate",
      },
      {
        id: "hale-tylenol",
        name: "Tylenol",
        prnTrigger: "The knees. She calls anything stronger a fuss",
        schedule: ["prn"],
      },
    ],
    providers: [
      {
        id: "hale-reyes",
        name: "Dr. Alan Reyes",
        specialty: "Family medicine",
        phone: "(555) 016-7702",
        notes: "Talks books first and blood pressure second. Calls Susan after anything that matters.",
      },
      {
        id: "hale-osei",
        name: "Dr. Osei",
        specialty: "Cardiology",
        phone: "(555) 016-7748",
        notes: "Quarterly.",
      },
    ],
    pharmacy: "Main Street Pharmacy; they deliver Thursdays and Amir calls her by name.",
    preferredHospital: "County General. Her records, her cardiologist, and her opinion of their coffee are all on file",
    appointmentHelp:
      "She'll say the appointment went fine and remember none of the middle. " +
      "Someone goes in with her and writes things down; the notebook is in " +
      "the car door pocket.",
    insurancePlans: "Medicare, with the supplement plan David set up. Cards in her wallet.",
    recordsLocation:
      "Insurance cards in her wallet. The medication list is taped inside " +
      "the kitchen cabinet by the phone. The grey file box in the hall closet " +
      "holds the directives; the hospital has copies.",
  },
  schoolWork: {
    currentWork:
      "The Meals on Wheels route, Mondays, with June driving. She is the " +
      "navigator and the conversation, and both matter to the people on that " +
      "route. The parish library cart, which is hers alone.",
    commitments:
      "The route. The cart. And the Tuesday phone call to her brother Walt " +
      "in Richmond, who is 84 and counts on it.",
    keyContacts: "June: (555) 016-5533. The parish office. Walt, gently.",
    windDown:
      "The route can pass to June's granddaughter, who has ridden along. The " +
      "cart she would want continued by someone who will actually read the " +
      "books first. The Walt call cannot be wound down; someone in this " +
      "family makes that call, forever.",
    hopes: "Exactly what she has: the route, the cart, the garden, and being asked.",
  },
  home: {
    currentLiving: "Her own house, forty-one years, and entirely her domain.",
    theHome:
      "Hers outright. Water shut-off behind the dryer. The good spare key " +
      "lives with Ruth Ann, not under the frog. The alarm code is Dad's " +
      "birthday, and she will not change it, and we have stopped asking.",
    supportLevel:
      "She mostly manages, and the gaps get quietly filled: laundry, dinners, " +
      "the statements, the rides after dark. The system works because nobody " +
      "calls it a system.",
    householdHelp:
      "She thinks she still does her own laundry. I do it Saturdays while " +
      "she naps. She cooks what she cooks; the freezer dinners cover the " +
      "rest. Franny \"the company\" tidies Fridays.",
    personalCare:
      "She manages, slowly, and the shower is the risk: there is a grab bar " +
      "now (installed as a \"towel rail,\" which is what diplomacy looks " +
      "like) and a mat. Hair is Dot's job. Nails she does herself with the " +
      "radio on, and doing them is a good sign; a week of undone nails is " +
      "information.",
    petsAndPlants:
      "Biscuit, the terrier, eleven, fed at 7 and 5, walked to the corner " +
      "three times a day, vet on Elm. The roses are not pets but try telling " +
      "her that; if she ever cannot garden, bring the garden to the porch in " +
      "pots before anyone suggests giving it up.",
    deferred:
      "The gutters, chronically. The back porch rail is the urgent one: it " +
      "moves, she uses it, and she has declined to consider it a problem. " +
      "Fix it while she is at Dot's and accept the scolding.",
    safety:
      "No rugs on the stairs anymore. Night lights in the hall. The alert " +
      "pendant exists and lives in the fruit bowl, unworn; Ruth Ann and the " +
      "curtain schedule are the actual system. The stove has a kettle " +
      "whistle rule: if the whistle isn't on the kettle, it isn't on the stove.",
    hardLimits:
      "Never a move made in a week from a hospital hallway. And nobody says " +
      "\"facility\" in this house; if that day ever comes, it arrives slowly, " +
      "with her in the room and Father Bright in the loop.",
  },
  moneyBenefits: {
    whoHandlesBills:
      "She does, mostly, with drift. David reads the statements monthly from " +
      "Portland by arrangement with her, which she calls \"David's little hobby.\"",
    howBillsArePaid:
      "Utilities and phone on autopay. Property tax comes by mail twice a " +
      "year and has been missed twice; David has the dates flagged. The " +
      "church pledge she writes by hand every January and would not dream of " +
      "automating.",
    incomeSources: "Dad's pension on the first, Social Security on the third.",
    vulnerabilities:
      "The phone charities have her number and she cannot hang up on a " +
      "polite voice. After the roof-repair deposit incident of 2023 (four " +
      "hundred dollars, never seen again), the rule she agreed to is: " +
      "nothing over fifty dollars by phone without telling David first, " +
      "\"because he enjoys it.\" Watch the hall table for pledge envelopes.",
    whereRecordsKept:
      "The grey file box, hall closet: deed, will, POAs, directives, the " +
      "long-term-care policy David pays. Safe deposit box at the Main Street " +
      "branch; David is on the signature card. Where, not what: no numbers " +
      "live in this letter.",
  },
  legal: {
    powersOfAttorney:
      "Financial: David, effective now, signed 2021. Medical: Susan, with " +
      "David as alternate. Originals in the grey box, copies with the lawyer " +
      "and the hospital.",
    advanceDirectives:
      "Signed 2021. Comfort first; she has said it plainly and it is in " +
      "writing. The hospital has it on file.",
    whoDecidesWhat:
      "Everything day to day is hers, full stop. Money over about five " +
      "hundred dollars she talks over with David first, by her own choice " +
      "and her own phrasing: \"I keep him busy.\" Medical she wants explained " +
      "to her and decided with me in the room, not for her.",
    professionals:
      "Claire Kelly at Trusts & Wealth did the POAs and the will. Ruth Meyer " +
      "does the taxes and has for twenty years.",
  },
  communityFaith: {
    friends:
      "Ruth Ann. June. Marlene at the Giant. Dot. The route regulars, who " +
      "she would want checked on if she ever can't.",
    activities: "The garden. The route. The cart. The crossword, in pen.",
    joy:
      "The roses. Biscuit's opinions. A grandchild on the porch swing with " +
      "nowhere else to be. The third cup of coffee she has been told not to have.",
    faith:
      "St. Luke's, 9 a.m. Mass, third pew, right side. Communion at home on " +
      "the first Friday if she cannot get out; Father Bright already knows. " +
      "Grace before dinner, always, even over toast.",
    congregation: "St. Luke's. The parish office knows the family; Father Bright is the one to call.",
    traditions:
      "Christmas Eve is her house, ham, and the good tablecloth, " +
      "non-negotiable even if the guest list is two people and a terrier. " +
      "The lake cabin the first week of August, on the porch with a stack of books.",
  },
  caregiverGuidance: {
    firstWeek:
      "Call Dr. Reyes' office and say you are taking over the notebook. Then " +
      "Ruth Ann, who knows more than this letter. Keep Franny coming " +
      "Fridays; she is the only visitor Mom doesn't tidy for, which makes " +
      "her the only one Mom fully relaxes around. Walk Biscuit yourself " +
      "before you rearrange anything about Biscuit. The money can wait two " +
      "weeks; David has it.",
    hindsight:
      "I spent a year correcting her: the repeated questions, the wrong " +
      "names. It bought me nothing and cost us both. Answer the question " +
      "again like it's the first time; it is, for her. And I wish we had put " +
      "the grab bar in two years before we did. Do the safety things early " +
      "and call them something else.",
    neverChange:
      "The upstairs bedroom, however sensible the downstairs one looks on " +
      "paper. The stairs are the only exercise she gets, and that room is " +
      "the one she shared with Dad for thirty-eight years; she is not being " +
      "stubborn, she is being loyal. Supper at six. Mass at nine. The Walt " +
      "call. Jeopardy out loud.",
    consultFirst:
      "Susan and David together, Dr. Reyes on capacity, and Father Bright, " +
      "who she has trusted with things she has never told us. Selling the " +
      "house is not a decision anyone makes in a week from a hospital " +
      "hallway; that sentence is why this letter exists.",
  },
  finalWishes: {
    funeral:
      "The Mass is planned in a letter she wrote Father Bright herself, " +
      "which is very like her. No fuss, real flowers, and the reception at " +
      "the parish hall because the house should not be sad for the neighbors.",
    restingPlace: "Beside Dad at St. Luke's; the plot is bought and the deed is in the grey box.",
    organDonation: "Recorded at the DMV: \"whatever still works, honey.\"",
    documentsLocation: "The grey file box, hall closet.",
  },
  personalMessage: {
    toCaregivers:
      "She spent her whole life being the person who noticed everyone else. " +
      "Notice her back. Laugh at the sneaky jokes. Lose at Jeopardy " +
      "occasionally; she knows when you're doing it and enjoys the courtesy anyway.",
    toSiblings:
      "David — reading the statements matters more than you think it does, " +
      "and so do the Sunday calls. You are not the far-away son. You are the " +
      "other half of this.",
    toPerson:
      "Mom: you taught a whole town to read for pleasure and me to do hard " +
      "things without making them look hard. Whatever the coming years take, " +
      "they cannot take what you already did. The roses will be looked " +
      "after. So will you.",
  },
  allergies: {
    items: [
      {
        id: "hale-sulfa",
        allergen: "Sulfa drugs",
        severity: "serious",
        reaction: "Full-body rash",
        treatment: "It is on the card in her wallet — tell any new prescriber",
      },
    ],
  },
  emergencyPlan: {
    scenarios: [
      {
        id: "hale-fall",
        trigger: "If she falls",
        steps:
          "Do not stand her straight up\nSit with her, check wrist and hip pain, call Susan\nAny head knock, new confusion, or she cannot bear weight: 911 first — she is on a blood thinner",
      },
    ],
    call911When: "Chest pain, trouble breathing, a fall with a head knock, or confusion that is new",
    otherwiseCall: "Susan — (555) 016-4410, any hour",
    ifNoOneAnswers: "Ruth Ann next door has a key — and County General has her records",
  },
  routines: {
    items: [
      {
        id: "hale-r1",
        timeOfDay: "morning",
        time: "6:00",
        steps: "Coffee: half a cup, milk, no sugar, Dad's mug\nPills from the organizer on the sill\nThe crossword before anything real",
      },
      {
        id: "hale-r2",
        timeOfDay: "evening",
        time: "6:00",
        steps: "Supper at six, always\nJeopardy at 7:30, out loud\nWarfarin with supper — never missed, never doubled",
      },
    ],
  },
  foods: {
    items: [
      {
        id: "hale-f1",
        item: "Supper alone",
        type: "support",
        reason: "Becomes toast unless someone joins her — freezer dinners are labeled by day",
      },
    ],
  },
};
