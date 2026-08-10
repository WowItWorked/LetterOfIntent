import type { SectionDef } from "@/lib/content/types";

/** Shared by both paths; the general path renumbers it in general/index.ts. */
export const foods: SectionDef = {
  slug: "food-and-eating",
  key: "foods",
  number: 11,
  title: "Food and eating",
  navTitle: "Food & eating",
  minutes: 5,
  optionalTag: true,
  intro:
    "Food is safety first, then comfort. One item per entry: the food itself " +
    "and the rule that goes with it. These print on the Eating & Food card, so " +
    "a sitter gets the rules without reading the whole letter.",
  legacyRefs: {
    "special-needs": [
      {
        sectionKey: "typicalDay",
        fieldKey: "food",
        label: "Food: favorites, dislikes, and rules",
      },
    ],
    general: [
      {
        sectionKey: "typicalWeek",
        fieldKey: "food",
        label: "Food, appetite, and mealtimes",
      },
    ],
  },
  fields: [
    {
      id: "items",
      kind: "repeater",
      label: "The food rules",
      help: "Start with anything dangerous: choking risks and texture rules print with a flag on the card.",
      itemNoun: "food",
      addLabel: "Add a food",
      itemFields: [
        {
          id: "item",
          kind: "text",
          label: "Food or drink",
          width: "half",
          placeholder: "e.g., Waffles",
        },
        {
          id: "type",
          kind: "select",
          label: "Which kind of note",
          width: "half",
          options: [
            { value: "always_works", label: "Always works" },
            { value: "will_not_eat", label: "Will not eat" },
            { value: "texture", label: "Texture rule" },
            { value: "choking_risk", label: "Choking risk" },
            { value: "support", label: "Mealtime support" },
          ],
        },
        {
          id: "reason",
          kind: "text",
          label: "The rule, in one line",
          placeholder: "e.g., Cut in strips, syrup on the side — never on top",
        },
        // No keepOffCards here, by owner decision: a food rule exists to be
        // handed to whoever is feeding them — the schema still accepts the
        // flag from old backups, and derive still honors it if present.
      ],
    },
  ],
};
