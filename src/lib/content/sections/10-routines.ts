import type { SectionDef } from "@/lib/content/types";

export const routines: SectionDef = {
  slug: "daily-routines",
  key: "routines",
  title: "Daily routines",
  navTitle: "Daily routines",
  optionalTag: true,
  intro:
    "The order matters more than the clock. Write each block of {name}'s day as " +
    "steps someone could follow tonight: waking up, after school, bedtime. " +
    "These print on the Daily Routine card, in the order you add them.",
  legacyRefs: [
    { sectionKey: "routine", fieldKey: "mornings", label: "Morning routine" },
    { sectionKey: "routine", fieldKey: "evenings", label: "Evening and bedtime routine" },
  ],
  fields: [
    {
      id: "items",
      kind: "repeater",
      label: "The day, block by block",
      help:
        "One entry per moment (wake-up, breakfast, bedtime), each with its " +
        "own time. They print on the Daily Routine card in the order you add them.",
      itemNoun: "routine",
      addLabel: "Add a routine",
      itemFields: [
        {
          id: "timeOfDay",
          kind: "select",
          label: "Part of the day",
          width: "half",
          options: [
            { value: "morning", label: "Morning" },
            { value: "afternoon", label: "Afternoon" },
            { value: "evening", label: "Evening" },
            { value: "night", label: "Night" },
          ],
        },
        {
          id: "time",
          kind: "text",
          label: "Around what time",
          width: "half",
          placeholder: "e.g., 7:00 AM",
          help: "The card leads the line with it: “7:00 · Wake.” The order still matters more than the clock.",
        },
        {
          id: "steps",
          kind: "textarea",
          label: "The steps, one per line",
          placeholder: "e.g.,\nRadio on before the covers come off\nMeds in the blue cup with juice\nWaffles cut in strips",
        },
        {
          id: "notes",
          kind: "textarea",
          group: "more",
          label: "Notes",
          placeholder: "What helps when this block goes sideways",
        },
        {
          id: "keepOffCards",
          kind: "checkbox",
          label: "Keep off shareable cards",
          help: "It stays in the full letter. It just never prints on the cards you might text a sitter.",
        },
      ],
    },
    {
      id: "transitions",
      kind: "textarea",
      rows: 3,
      label: "Moving between activities",
      help: "How to get from one thing to the next without a fight. The Daily Routine card flags this block.",
      placeholder:
        "e.g., A five-minute warning, then a two-minute warning. “First shoes, then the park.” Never spring a change.",
    },
  ],
};
