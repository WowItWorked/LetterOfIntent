import type { SectionDef } from "@/lib/content/types";

export const finalWishes: SectionDef = {
  slug: "final-wishes",
  key: "finalWishes",
  number: 19,
  title: "Final wishes",
  navTitle: "Final wishes",
  minutes: 10,
  emotional: true,
  optionalTag: true,
  intro:
    "Writing this down spares the people who love {name} from having to guess " +
    "during the hardest week of their lives. Answer as much or as little as you " +
    "want. A single line here is a gift.",
  fields: [
    {
      id: "funeral",
      kind: "textarea",
      rows: 3,
      label: "Funeral or memorial preferences",
      placeholder: "Religious or not, music, who should speak, the feel of it",
    },
    {
      id: "restingPlace",
      kind: "textarea",
      rows: 2,
      label: "Burial or cremation",
      placeholder: "Preference, place, and anything already arranged or paid for",
    },
    {
      id: "religious",
      kind: "textarea",
      rows: 2,
      label: "Religious observances",
      placeholder: "Rites, customs, or requirements that must be honored",
    },
    {
      id: "organDonation",
      kind: "textarea",
      rows: 2,
      label: "Organ donation",
      placeholder: "Their status or your wishes, and where it's recorded",
    },
    {
      id: "endOfLife",
      kind: "textarea",
      rows: 3,
      label: "End-of-life care wishes",
      help: "If there's an advance directive or living will, say where it is. If not, what should guide the people deciding?",
    },
    {
      id: "documentsLocation",
      kind: "textarea",
      rows: 2,
      label: "Where the papers are",
      placeholder: "Pre-paid arrangements, cemetery deeds, advance directives, and where to find them",
    },
  ],
};
