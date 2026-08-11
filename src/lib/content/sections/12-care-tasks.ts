import type { SectionDef } from "@/lib/content/types";

export const careTasks: SectionDef = {
  slug: "personal-care",
  key: "careTasks",
  title: "Personal care tasks",
  navTitle: "Personal care",
  optionalTag: true,
  showWhen: [{ supportLevel: ["someDailyHelp", "substantial", "roundTheClock"] }],
  intro:
    "The hands-on help nobody thinks to write down: toileting, dressing, " +
    "bathing, getting around. Write steps, not descriptions, for someone " +
    "doing this with {name} for the first time. These print on the Personal " +
    "Care & Mobility card.",
  legacyRefs: [
    { sectionKey: "home", fieldKey: "personalCare", label: "Personal care" },
  ],
  fields: [
    {
      id: "items",
      kind: "repeater",
      label: "The tasks, one at a time",
      help: "One entry per task. Each prints on the Personal Care & Mobility card in the order you add them.",
      itemNoun: "task",
      addLabel: "Add a task",
      itemFields: [
        {
          id: "category",
          kind: "select",
          label: "What kind of help",
          width: "half",
          options: [
            { value: "toileting", label: "Toileting" },
            { value: "dressing", label: "Dressing" },
            { value: "bathing", label: "Bathing" },
            { value: "equipment", label: "Equipment" },
            { value: "mobility", label: "Mobility" },
          ],
        },
        {
          id: "steps",
          kind: "textarea",
          label: "The steps, one per line",
          placeholder: "e.g.,\nWater running before they come in\nCheck the temperature — they cannot judge it\nHair last, always",
        },
        {
          id: "equipment",
          kind: "text",
          group: "more",
          label: "Equipment involved",
          placeholder: "e.g., Shower chair; the transfer belt hangs behind the door",
        },
        {
          id: "keepOffCards",
          kind: "checkbox",
          label: "Keep off shareable cards",
          help: "It stays in the full letter. It just never prints on the cards you might text a sitter.",
        },
      ],
    },
  ],
};
