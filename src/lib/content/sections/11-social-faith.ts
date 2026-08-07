import type { SectionDef } from "@/lib/content/types";

export const socialFaith: SectionDef = {
  slug: "friends-joy-and-faith",
  key: "socialFaith",
  number: 11,
  title: "Friends, joy, and faith",
  navTitle: "Joy & faith",
  minutes: 10,
  intro:
    "A safe life is not the same as a good one. This section protects the parts " +
    "of {name}'s life that make it worth living.",
  fields: [
    {
      id: "friends",
      kind: "textarea",
      rows: 3,
      label: "Friendships to protect",
      placeholder: "Who are their people? How do they stay in touch? What would it take to keep those ties alive?",
    },
    {
      id: "activities",
      kind: "textarea",
      rows: 3,
      label: "Activities and hobbies",
      placeholder: "What they do weekly, what they do seasonally, and what they'd do all day if allowed",
    },
    {
      id: "faith",
      kind: "textarea",
      rows: 3,
      label: "Faith community and practices",
      help: "Congregation, practices, holidays, dietary rules — and who from that community knows and loves {name}.",
    },
    {
      id: "traditions",
      kind: "textarea",
      rows: 3,
      label: "Holidays and family traditions",
      help: "The rituals that should survive you. Be specific about how they're done — the details are the tradition.",
      example:
        "Christmas Eve is pajamas, one gift, and The Muppet Christmas Carol — the " +
        "DVD, not streaming, because the menu music is part of it. Her birthday cake " +
        "is yellow with chocolate frosting from the box. Never bakery. She checks.",
    },
    {
      id: "travel",
      kind: "textarea",
      rows: 2,
      label: "Travel",
      placeholder: "How they travel well, favorite places, what to pack, what to avoid",
    },
    {
      id: "joy",
      kind: "textarea",
      rows: 3,
      label: "What brings them joy",
      help: "When everything else fails — what always works?",
    },
  ],
};
