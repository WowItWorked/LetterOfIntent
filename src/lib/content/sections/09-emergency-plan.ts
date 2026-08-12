import type { SectionDef } from "@/lib/content/types";

/**
 * Every field here prints on a card: the steps, the 911 line, and the call
 * order go to the Emergency card; the over-the-counter rule closes the
 * Medications card. The prose protocol in `health` is the older answer this
 * section shadows, and the emergency sheet prefers these steps when present.
 */
export const emergencyPlan: SectionDef = {
  slug: "emergency-plan",
  key: "emergencyPlan",
  title: "The emergency plan",
  navTitle: "Emergency plan",
  optionalTag: true,
  intro:
    "If something goes wrong, the person holding the phone needs steps, not " +
    "paragraphs. This section prints on the Emergency card, the one card " +
    "someone reads under stress. Short lines, in order.",
  legacyRefs: [
    {
      sectionKey: "health",
      fieldKey: "emergencyProtocol",
      label: "Seizure or emergency protocol",
    },
  ],
  fields: [
    {
      id: "responseSteps",
      kind: "textarea",
      rows: 5,
      label: "What to do, in order",
      help: "One step per line, in order. The card numbers them for you.",
      placeholder: "e.g.,\nStart timing\nTurn them on their side\nGet the red pouch from the go-bag",
      // The example must model the exact shape the help asks for: one step
      // per line, never a paragraph. It prints on the card that way.
      example:
        "Start timing the seizure\n" +
        "Turn her on her side, nothing in her mouth\n" +
        "Over 3 minutes: rescue med from the red pouch\n" +
        "Then call us, any hour",
      // The tightest budget on the form, and deliberately so: this is the one
      // block that can push the Emergency Protocol card past a single card,
      // and that card never continues onto a second one — its download is
      // blocked instead (components/cards/copy.ts). Better to nudge here,
      // while someone is writing, than to refuse the card later.
      cardLengthHint: 200,
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          example:
            "If she falls, do not lift her yourself\n" +
            "Check for pain in the hip or wrist before she moves\n" +
            "She takes a blood thinner, so any knock to the head is an ER trip\n" +
            "Call me while you wait",
        },
      ],
    },
    {
      id: "scenarios",
      kind: "repeater",
      label: "If this happens, do this",
      help:
        "For the emergencies you can see coming: a sting, a seizure, a bolt " +
        "for the door. Each prints on the Emergency card under its own " +
        "heading, steps numbered.",
      itemNoun: "scenario",
      addLabel: "Add a scenario",
      // Models both halves of a scenario, heading then steps, instead of
      // restating the item placeholders as one sentence.
      example:
        "If {name} walks off:\n" +
        "Check the quiet places first, the porch, the bus bench on Elm\n" +
        "Call me while you look\n" +
        "After 20 minutes, call 911 and say they may not answer to their name",
      itemFields: [
        {
          id: "trigger",
          kind: "text",
          label: "If…",
          placeholder: "e.g., If {name} is stung",
          help: "Becomes the heading on the card, just as you write it.",
        },
        {
          id: "steps",
          kind: "textarea",
          label: "The steps, one per line",
          placeholder:
            "e.g.,\nAuto-injector, outer thigh, through clothing\nCall 911, then Dana\nKeep them lying down — stay in their sight",
          help: "One step per line, in order. The card numbers them for you.",
        },
      ],
    },
    {
      id: "call911When",
      kind: "textarea",
      rows: 2,
      label: "Call 911 when",
      help:
        "The signs a stranger could see. The card pairs this with " +
        "“Otherwise, call” below, so the small stuff comes to you instead.",
      // No example disclosure here: the placeholder already models a
      // card-sized answer, and repeating the same sentence behind a "See an
      // example" toggle is furniture, not help. The length budget is what this
      // field was actually missing.
      placeholder:
        "e.g., Trouble breathing, swelling of the face or throat, or no response to their name",
      cardLengthHint: 180,
    },
    {
      id: "otherwiseCall",
      kind: "text",
      label: "Otherwise, call",
      placeholder: "e.g., Dana — (703) 555-0142, any hour",
    },
    {
      id: "ifNoOneAnswers",
      kind: "text",
      label: "If no one answers",
      placeholder: "e.g., Go to Inova Fairfax — they have {name}'s records",
    },
    {
      id: "otcPolicy",
      kind: "textarea",
      rows: 2,
      label: "The rule on over-the-counter medicine",
      help: "The Medications card ends with this rule: what a helper may give without calling you, if anything.",
      placeholder: "e.g., Nothing beyond the list without calling us first. No ibuprofen — it interacts.",
      cardLengthHint: 160,
    },
  ],
};
