import type { CardKey } from "@/lib/content/cards";
import type { LetterData, LetterPath } from "@/lib/schema";

/**
 * The sample letter behind the /care-cards page's previews.
 *
 * Data only — no React. This is the Anderson family from the published sample
 * PDFs (public/samples): Bonnie Marie Anderson, written by her mother
 * Margaret, with Aunt Jessie as her guardian and Hannah Phillips next door.
 * The content is transcribed near-verbatim from the reference card set in the
 * approved design export — the sertraline and melatonin with their clock
 * times, the bee-sting and amoxicillin allergies, the auto-injector in the
 * red pouch, the "If she is stung" steps, Dr. Alena Rowe, Tri-County General
 * — so a visitor who opens a sample PDF and then scrolls past the cards meets
 * one family, not two.
 *
 * Deliberately obvious sample data: (555) phone numbers throughout, and the
 * section beside the previews says so in words.
 *
 * The fixture holds only what the previewed cards draw from, and every card
 * must fit a single 1080×1920 frame: the /care-cards page renders these
 * WITHOUT the cards page's pagination measurement, and an e2e check fails if
 * any card's content runs under its footer. The emergency and behavior cards
 * sit closest to that line, so two reference phrases are deliberately absent:
 * the 911 block's trailing "Otherwise, call Jessie" (Jessie is already step 3
 * of the sting plan) and "knows her and" in the knock-on-Hannah's-door line.
 * sample-card-data.test.ts fails the build if any previewed card stops
 * deriving or outgrows its frame's block budget.
 *
 * Two derive quirks this fixture leans on, worth knowing before editing:
 * - Jessie carries only the legal_guardian role, which has no rank in the
 *   identity card's contact ordering — so Hannah describes herself in the
 *   free-text role field ("backup") instead of the neighbor_backup token,
 *   keeping the family's entry order (Jessie first) in charge.
 * - Neither contact holds an emergency role, so the emergency card carries
 *   no "Then call" block — matching the reference card, and buying the frame
 *   room the two scenario blocks need.
 */

export const SAMPLE_CARD_PATH: LetterPath = "special-needs";

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
    authorName: "Margaret Anderson",
    authorRelationship: "Mother",
    subjectFullName: "Bonnie Marie Anderson",
    subjectPreferredName: "Bonnie",
    subjectAddress: "418 Fernbank Road, Vienna VA 22180",
    // Fixed on purpose — the card footers read the letter's own date, and a
    // moving date would make the previews differ between builds.
    letterDate: "2026-08-08",
  },
  about: { dateOfBirth: "2015-06-19" },
  familySupport: {
    contacts: [
      {
        id: "sample-jessie",
        name: "Jessie Anderson",
        relationship: "Aunt",
        phone: "(555) 017-2264",
        roles: ["legal_guardian"],
      },
      {
        id: "sample-hannah",
        name: "Hannah Phillips",
        relationship: "Neighbor",
        phone: "(555) 017-4417",
        role: "backup",
      },
    ],
  },
  allergies: {
    items: [
      {
        id: "sample-bee",
        allergen: "Bee stings",
        reaction: "anaphylaxis",
        severity: "life-threatening",
      },
      {
        id: "sample-amox",
        allergen: "Amoxicillin",
        reaction: "hives",
        severity: "serious",
      },
    ],
  },
  // No generic responseSteps on purpose: the reference emergency card teaches
  // through its two named plans, and the allergy records alone keep the card
  // deriving.
  emergencyPlan: {
    scenarios: [
      {
        id: "sample-stung",
        trigger: "If she is stung",
        // Three steps, not the reference's four: "Call 911" and "Call Jessie"
        // share a line because the card sits one text row past its frame
        // otherwise — the overflow e2e guard measures it.
        steps:
          "Auto-injector, outer thigh, through clothing\n" +
          "Call 911, then Jessie\n" +
          "Keep her lying down. Stay in her sight.",
      },
      {
        id: "sample-bolts",
        trigger: "If she bolts",
        steps: "Check closets, under beds, behind doors — she hides, she does not run",
      },
    ],
    call911When:
      "Trouble breathing. Swelling of the face or throat. No response to her name.",
    // Kept to one rendered line — the emergency card runs closest to its
    // frame, and the overflow e2e guard measures it.
    ifNoOneAnswers: "Knock on Hannah's door first. Bonnie will go with her.",
    otcPolicy:
      "No over-the-counter medicine — including ibuprofen — without calling Jessie first.",
  },
  communication: {
    how:
      "Talks freely at home, almost never to a stranger. She carries a " +
      "laminated card and will use it when speaking is too expensive.",
    yesNo:
      "A nod, plus “mm-hm,” plus half a second of eye contact. A bare nod " +
      "means “I want this to stop.”",
    pain:
      "She does not report pain. She skips food she likes, presses a flat " +
      "hand on the spot, goes to bed early.",
    whatNotToSay: "Never take Forky away as leverage. Never touch him without asking.",
  },
  behavior: {
    triggers:
      "A plan changing without warning. Fire alarms. Being told no with no alternative.",
    deEscalation:
      "One person talks, everyone else steps back. Lower your voice. Offer " +
      "the headphones. Say “You're safe. I'm here. We can wait” — then wait.",
  },
  routines: {
    items: [
      {
        id: "sample-wake",
        timeOfDay: "morning",
        time: "7:00",
        steps: "Wake. Lights low, no radio. She comes down when she is ready.",
      },
      {
        id: "sample-breakfast",
        timeOfDay: "morning",
        time: "7:30",
        steps: "Breakfast — same bowl, same seat.",
      },
      {
        id: "sample-morning-med",
        timeOfDay: "morning",
        time: "8:00",
        steps: "Sertraline, with food.",
      },
      { id: "sample-lunch", timeOfDay: "afternoon", time: "12:30", steps: "Lunch." },
      {
        id: "sample-quiet",
        timeOfDay: "afternoon",
        time: "3:30",
        steps: "Quiet hour. Headphones on, no questions.",
      },
      { id: "sample-dinner", timeOfDay: "evening", time: "6:00", steps: "Dinner." },
      {
        id: "sample-bath",
        timeOfDay: "evening",
        time: "7:30",
        steps: "Bath, then pajamas, then teeth — this order, every night.",
      },
      {
        id: "sample-chapters",
        timeOfDay: "evening",
        time: "8:15",
        steps: "Two chapters. Hall light on, door open four inches.",
      },
    ],
    transitions: "Five-minute warning, then a one-minute warning. Never a cold stop.",
  },
  foods: {
    items: [
      {
        id: "sample-choking",
        item: "Grapes and hot dogs",
        type: "choking_risk",
        reason:
          "must be quartered lengthwise. When she is anxious she swallows without chewing",
      },
      {
        id: "sample-always",
        item:
          "Plain pasta. Peeled apple slices. Crackers. Yogurt drinks. Water " +
          "only — nothing with a flavor.",
        type: "always_works",
      },
      {
        id: "sample-will-not",
        item:
          "Anything mixed together. Red sauce. Most vegetables. Wet and " +
          "crunchy in one bite is the hard no.",
        type: "will_not_eat",
      },
      {
        id: "sample-texture",
        item: "Sauces and dips",
        type: "texture",
        reason: "on the side, always — never poured on",
      },
      {
        id: "sample-support",
        item:
          "If the room is loud she eats alone at the counter. That is fine — let her.",
        type: "support",
      },
    ],
  },
  careTasks: {
    items: [
      {
        id: "sample-toileting",
        category: "toileting",
        steps:
          "Independent, but she will not ask. Offer at every transition: " +
          "“Bathroom before we go.”",
      },
      {
        id: "sample-dressing",
        category: "dressing",
        steps:
          "Independent. Tags cut out of everything. If she is pulling at a " +
          "sleeve, it is the seam.",
      },
      {
        id: "sample-bathing",
        category: "bathing",
        steps:
          "She runs it herself; an adult checks the temperature. Never run " +
          "the water while she is in the tub.",
      },
      {
        id: "sample-equipment",
        category: "equipment",
        steps:
          "Noise-cancelling headphones travel with her. Treat them as " +
          "medical equipment, not a toy.",
      },
      {
        id: "sample-mobility",
        category: "mobility",
        steps:
          "Stairs are fine. She freezes at escalators — take the elevator, " +
          "do not negotiate.",
      },
    ],
  },
  medical: {
    medications: [
      {
        id: "sample-epi",
        name: "Epinephrine auto-injector",
        isRescue: true,
        location: "Red pouch, front left of her backpack. Spare in the kitchen drawer",
        purpose: "Bee stings",
      },
      {
        id: "sample-sertraline",
        name: "Sertraline",
        dose: "25",
        unit: "mg",
        schedule: ["8:00 AM"],
        withFood: true,
        purpose: "for anxiety. Never stop it abruptly",
        refusalStrategy:
          "Set it beside her plate and walk away. Come back in five minutes. " +
          "Handing it to her directly turns it into a fight every time.",
      },
      {
        id: "sample-melatonin",
        name: "Melatonin",
        dose: "3",
        unit: "mg",
        schedule: ["8:30 PM"],
        purpose: "only if she is still awake at nine",
      },
    ],
    providers: [
      {
        id: "sample-rowe",
        name: "Dr. Alena Rowe",
        specialty: "Pediatrics",
        phone: "(555) 017-9080",
      },
    ],
    preferredHospital: "Tri-County General. They hold her record and the allergy flag",
  },
};
