import type { SectionDef } from "@/lib/content/types";

/**
 * Shared by both paths. Every field here prints on a card: the steps, the 911
 * line, and the call order go to the Emergency card; the over-the-counter
 * rule closes the Medications card.
 */
export const emergencyPlan: SectionDef = {
  slug: "emergency-plan",
  key: "emergencyPlan",
  number: 9,
  title: "The emergency plan",
  navTitle: "Emergency plan",
  minutes: 5,
  optionalTag: true,
  intro:
    "If something goes wrong, the person holding the phone needs steps, not " +
    "paragraphs. This section prints on the Emergency card, the one card " +
    "someone reads under stress. Short lines, in order.",
  fields: [
    {
      id: "responseSteps",
      kind: "textarea",
      rows: 5,
      label: "What to do, in order",
      help: "One step per line, in order. The card numbers them for you.",
      placeholder: "e.g.,\nStart timing\nTurn them on their side\nGet the red pouch from the go-bag",
      example:
        "Start timing the seizure. Turn her on her side — nothing in her mouth. " +
        "Over 3 minutes: give the rescue med from the red pouch. Then call us, any hour.",
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
      example:
        "If they are stung: auto-injector, outer thigh, through clothing. " +
        "Call 911, then call us. Keep them lying down — stay in their sight.",
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
      placeholder:
        "e.g., Trouble breathing, swelling of the face or throat, or no response to their name",
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
    },
  ],
};
