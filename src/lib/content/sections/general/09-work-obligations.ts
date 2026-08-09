import type { SectionDef } from "@/lib/content/types";

export const workObligations: SectionDef = {
  slug: "work-and-obligations",
  key: "workObligations",
  number: 9,
  title: "Work and obligations",
  navTitle: "Work & obligations",
  minutes: 10,
  intro:
    "Adults carry commitments, and other people are relying on them. A business " +
    "with employees, a board seat, a Tuesday shift at the food pantry, a rental " +
    "property with tenants. If {name} could not do it next month, someone would " +
    "need to know what it was and who to tell.",
  optionalTag: true,
  fields: [
    {
      id: "currentWork",
      kind: "textarea",
      rows: 4,
      label: "Work, business, or volunteering",
      help: "What they do, where, how often, and how much it matters to them.",
      placeholder: "e.g., Still keeps the books for the family business two days a week",
    },
    {
      id: "commitments",
      kind: "textarea",
      rows: 4,
      label: "Commitments other people are depending on",
      help: "Boards, committees, a congregation role, a standing volunteer shift, tenants, clients.",
    },
    {
      id: "keyContacts",
      kind: "textarea",
      rows: 3,
      label: "Who to tell, and how to reach them",
      placeholder: "The business partner, the board chair, the property manager, the volunteer coordinator",
    },
    {
      id: "windDown",
      kind: "textarea",
      rows: 4,
      label: "What should be wound down, and by whom",
      help: "What can simply stop, what has to be handed over carefully, and what they would want continued in their name.",
      example:
        "The bookkeeping can pass to Dana at the office — she has done it before. " +
        "The scholarship committee he would want kept going; call Marge, she knows " +
        "the whole history.",
    },
  ],
};
