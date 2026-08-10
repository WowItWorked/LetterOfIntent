import type { SectionDef } from "@/lib/content/types";

/**
 * Shared by both paths (like family & support): allergy records feed the same
 * Emergency card whichever letter a family writes. The general path renumbers
 * it in general/index.ts.
 */
export const allergies: SectionDef = {
  slug: "allergies",
  key: "allergies",
  number: 8,
  title: "Allergies and reactions",
  navTitle: "Allergies",
  minutes: 5,
  optionalTag: true,
  intro:
    "One allergy per entry, so nothing hides inside a paragraph. These print at " +
    "the top of the Emergency card (the card a sitter can show a paramedic), " +
    "with the most serious first. If {name} has no allergies, skip this section.",
  legacyRefs: {
    "special-needs": [
      { sectionKey: "medical", fieldKey: "allergies", label: "Allergies and reactions" },
    ],
    general: [
      {
        sectionKey: "healthMedical",
        fieldKey: "allergies",
        label: "Allergies and bad reactions",
      },
    ],
  },
  fields: [
    {
      id: "items",
      kind: "repeater",
      label: "Allergies",
      help: "Each entry prints on the Emergency card. The full letter keeps everything, including anything you keep off the cards.",
      itemNoun: "allergy",
      addLabel: "Add an allergy",
      itemFields: [
        {
          id: "allergen",
          kind: "text",
          label: "Allergic to",
          width: "half",
          placeholder: "e.g., Penicillin",
        },
        {
          id: "severity",
          kind: "select",
          label: "How serious",
          width: "half",
          options: [
            { value: "life-threatening", label: "Life-threatening" },
            { value: "serious", label: "Serious" },
            { value: "mild", label: "Mild" },
          ],
        },
        {
          id: "reaction",
          kind: "text",
          label: "What the reaction looks like",
          placeholder: "e.g., Hives on the neck, then trouble breathing",
        },
        {
          id: "treatment",
          kind: "text",
          label: "What to do",
          placeholder: "e.g., Benadryl from the kitchen cabinet. If breathing changes, call 911.",
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
