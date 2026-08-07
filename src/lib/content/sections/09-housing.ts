import type { SectionDef } from "@/lib/content/types";

export const housing: SectionDef = {
  slug: "housing",
  key: "housing",
  number: 9,
  title: "Housing and daily living",
  navTitle: "Housing",
  minutes: 10,
  intro:
    "Where and how {name} lives may be the biggest decision anyone ever makes " +
    "for them. This section tells future decision-makers what you know — and " +
    "what you want.",
  fields: [
    {
      id: "currentLiving",
      kind: "textarea",
      rows: 3,
      label: "Current living situation",
      placeholder: "Where they live, with whom, and how it works day to day",
    },
    {
      id: "supportLevel",
      kind: "textarea",
      rows: 4,
      label: "The support they need to live safely",
      help: "Be concrete: cooking, medications, money, hygiene, transportation, being alone. What can they do on their own? What needs a person nearby, or a person doing it?",
    },
    {
      id: "waiverStatus",
      kind: "textarea",
      rows: 3,
      label: "Waiver and waitlist status",
      help: "A Medicaid waiver pays for long-term support at home or in the community. In Virginia these are the DD waivers, and the waitlist runs years. Where is {name} on it? Who manages the paperwork and the yearly updates?",
    },
    {
      id: "futureHopes",
      kind: "textarea",
      rows: 4,
      label: "Your hopes for their future home",
      help: "Dream concretely: what kind of place, with what kind of people, near whom, with what support?",
    },
    {
      id: "hardLimits",
      kind: "textarea",
      rows: 3,
      label: "What kind of living situation would you not want for them?",
      help: "Say it plainly. Future decision-makers can't honor limits they never heard.",
      example:
        "Never a large institution. Not alone in an apartment with only drop-in " +
        "checks — he needs someone present overnight. And never far from his sister; " +
        "their Sunday dinners are the spine of his week.",
    },
  ],
};
