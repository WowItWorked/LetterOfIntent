import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `socialFaith` (special-needs) and `faithCommunity`
 * (general). activities (what they do) and joy (what delights) stay separate.
 */
export const communityFaith: SectionDef = {
  slug: "friends-joy-and-faith",
  key: "communityFaith",
  title: "Friends, joy, and faith",
  navTitle: "Joy & faith",
  intro:
    "A safe life is not the same as a good one. This section protects the parts " +
    "of {name}'s life that make it worth living: the friends who would notice an " +
    "absence, the congregation, the traditions, the pleasures that have survived " +
    "everything else.",
  fields: [
    {
      id: "friends",
      kind: "textarea",
      rows: 3,
      label: "Friendships to protect",
      placeholder: "Who are their people? How do they stay in touch? What would it take to keep those ties alive?",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "Friends and neighbors who should be kept close",
          help: "The ones who check in, the ones who would want to know, and the ones who are the whole social calendar.",
        },
      ],
    },
    {
      id: "activities",
      kind: "textarea",
      rows: 3,
      label: "Activities and hobbies",
      placeholder: "What they do weekly, what they do seasonally, and what they'd do all day if allowed",
    },
    {
      id: "joy",
      kind: "textarea",
      rows: 3,
      label: "What brings them joy",
      help: "When everything else fails, what always works?",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "What still brings genuine pleasure",
          help: "The garden, the crossword, the ballgame, the drive to the shore, the third cup of coffee. Small things count. They are usually the point.",
        },
      ],
    },
    {
      id: "faith",
      kind: "textarea",
      rows: 3,
      label: "Faith community and practices",
      help: "What they believe and what they practice, including anything that must continue if they cannot ask for it. Holidays, dietary rules, and who from that community knows and loves {name}.",
      example:
        "Communion at home on the first Sunday; Father Reilly already knows and will " +
        "come if called. Grace before dinner, always, even in a hospital.",
    },
    {
      id: "congregation",
      kind: "textarea",
      rows: 3,
      label: "Congregation, club, or group",
      placeholder: "Which one, who to call there, and whether they would want to be told",
    },
    {
      id: "traditions",
      kind: "textarea",
      rows: 3,
      label: "Holidays and family traditions",
      help: "The rituals that should survive you. Be specific about how they're done: the details are the tradition.",
      example:
        "Christmas Eve is pajamas, one gift, and The Muppet Christmas Carol (the " +
        "DVD, not streaming, because the menu music is part of it). Her birthday cake " +
        "is yellow with chocolate frosting from the box. Never bakery. She checks.",
    },
    {
      id: "travel",
      kind: "textarea",
      rows: 2,
      label: "Travel",
      placeholder: "How they travel well, favorite places, what to pack, what to avoid",
    },
  ],
};
