import type { SectionDef } from "@/lib/content/types";

export const legalDecisions: SectionDef = {
  slug: "legal-and-decisions",
  key: "legalDecisions",
  number: 11,
  title: "Legal and decisions",
  navTitle: "Legal & decisions",
  minutes: 10,
  intro:
    "Who is allowed to decide what, and where it is written down. This is not " +
    "legal advice and this letter is not a legal document — but it is the map that " +
    "tells a family which documents exist and who is already holding them.",
  fields: [
    {
      id: "powersOfAttorney",
      kind: "textarea",
      rows: 4,
      label: "Powers of attorney",
      help: "Financial and medical: who is named, whether it is in effect now or only on incapacity, and where the signed document is kept.",
      example:
        "Financial POA names my brother, effective now. Medical POA names me, with " +
        "him as the alternate. Both signed in 2021 and the originals are in the grey " +
        "file box; the lawyer has copies.",
    },
    {
      id: "advanceDirectives",
      kind: "textarea",
      rows: 4,
      label: "Advance directive or living will",
      help: "What it says in plain words, and where a hospital could get it at two in the morning.",
    },
    {
      id: "guardianship",
      kind: "textarea",
      rows: 3,
      label: "Guardianship or conservatorship, if any",
      help: "Whether any court process has happened, is under way, or has been deliberately avoided — and why.",
    },
    {
      id: "whoDecidesWhat",
      kind: "textarea",
      rows: 4,
      label: "Who decides what, and where the limits are",
      help: "In practice, not on paper. Which decisions are still entirely theirs, which are shared, and which have quietly moved.",
      example:
        "Everything day to day is hers. Money over about five hundred dollars she " +
        "talks over with my brother first, by her own choice. Medical she wants " +
        "explained to her and then decided with me in the room.",
    },
    {
      id: "professionals",
      kind: "textarea",
      rows: 3,
      label: "Attorney, accountant, and advisors",
      placeholder: "Names, firms, and phone numbers — the people who already hold the file",
    },
  ],
};
