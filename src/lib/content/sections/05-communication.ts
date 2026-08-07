import type { SectionDef } from "@/lib/content/types";

export const communication: SectionDef = {
  slug: "communication",
  key: "communication",
  number: 5,
  title: "Communication",
  navTitle: "Communication",
  minutes: 10,
  intro:
    "{name} communicates all the time. A new caregiver just needs the dictionary. " +
    "This section is that dictionary.",
  fields: [
    {
      id: "how",
      kind: "textarea",
      rows: 4,
      label: "How they communicate",
      help: "Speech, an AAC device or app (a tablet or device that speaks for them), sign language, gestures, sounds, behavior — and when they use each.",
      example:
        "Nia uses an AAC app on her iPad (Proloquo2Go) for most requests, plus about " +
        "twenty signs. When the iPad is charging she gets frustrated fast — the backup " +
        "charger lives in her go-bag, front pocket.",
    },
    {
      id: "yesNo",
      kind: "textarea",
      rows: 3,
      label: "How they say yes and no",
      help: "Words, sounds, signs, or body language — how do you know which is which?",
    },
    {
      id: "pain",
      kind: "textarea",
      rows: 3,
      label: "How they show pain, or that they feel sick",
      help: "One of the most important answers in this whole letter. How would a new person know {name} is hurting?",
      example:
        "Marcus can't tell you something hurts. He goes quiet, presses on the spot, " +
        "and stops eating. If he skips a meal, something is wrong — check ears and " +
        "teeth first. It has been one of those every single time.",
    },
    {
      id: "overwhelm",
      kind: "textarea",
      rows: 3,
      label: "How they show they're becoming overwhelmed",
      help: "The early signs — the ones that come before a crisis, while there's still time to help.",
    },
    {
      id: "whatToSay",
      kind: "textarea",
      rows: 3,
      label: "What to say — words and approaches that work",
      placeholder: "Phrases, tone, pacing, humor — what lands well with them",
    },
    {
      id: "whatNotToSay",
      kind: "textarea",
      rows: 3,
      label: "What not to say",
      placeholder: "Words, topics, or tones to avoid — and what happens if they come up",
    },
  ],
};
