import type { SectionDef } from "@/lib/content/types";

/**
 * Both directions of communication in one section: how {name} expresses
 * themselves (`how`, gated on the communication follow-up) and how to talk
 * WITH them (`howToSpeak`, asked of everyone). The old paths split these
 * across two sections and the emergency sheet wired them wrongly; the
 * canonical schema keeps every distinct question distinct.
 */
export const communication: SectionDef = {
  slug: "communication",
  key: "communication",
  title: "Communication",
  navTitle: "Communication",
  intro:
    "{name} communicates all the time. Whoever steps in just needs the " +
    "dictionary: how they express themselves, how they like to be spoken to, " +
    "and how to tell when something is wrong. This section is that dictionary.",
  variants: [
    {
      when: { supportLevel: ["mostlyIndependent"] },
      title: "Talking with {name}",
      intro:
        "Most friction between an adult and the people helping them is not about " +
        "care. It is about how the care gets offered. This section is about tone " +
        "as much as hearing: who they will take it from, what they will not admit " +
        "to needing, and how to raise the hard subjects without losing the " +
        "argument before it starts.",
    },
  ],
  fields: [
    {
      id: "how",
      kind: "textarea",
      rows: 4,
      label: "How they communicate",
      help: "Speech, an AAC device or app (a tablet or device that speaks for them), sign language, gestures, sounds, behavior, and when they use each.",
      example:
        "Nia uses an AAC app on her iPad (Proloquo2Go) for most requests, plus about " +
        "twenty signs. When the iPad is charging she gets frustrated fast. The backup " +
        "charger lives in her go-bag, front pocket.",
      showWhen: [{ communicationDiffers: ["yes"] }],
      cardLengthHint: 220,
    },
    {
      id: "howToSpeak",
      kind: "textarea",
      rows: 4,
      label: "How they prefer to be spoken to, and by whom",
      help: "Directly or gently? Face to face or over the phone? Is there someone they will accept news from that they will not accept from anyone else?",
      example:
        "Say it straight and say it once. She can tell when she is being handled and " +
        "it makes her dig in. Anything about money should come from my brother: she " +
        "has always trusted him with that and it is not worth relitigating.",
      cardLengthHint: 220,
    },
    {
      id: "yesNo",
      kind: "textarea",
      rows: 3,
      label: "How they say yes and no",
      help: "Words, sounds, signs, or body language: how do you know which is which?",
      showWhen: [{ communicationDiffers: ["yes"] }],
      cardLengthHint: 180,
    },
    {
      id: "hearingVisionMemory",
      kind: "textarea",
      rows: 4,
      label: "Hearing, vision, and memory, as they are now",
      help: "Be honest and specific: this is the page that keeps someone from mistaking a hearing problem for confusion.",
      example:
        "Hearing aids in both ears; he forgets the left one. Reading glasses on the " +
        "chain. Memory is fine for the distant past, patchy for this week. He will " +
        "cover for it rather than ask you to repeat something.",
      showWhen: [{ cognitionChanging: ["yes", "early"] }, { stage: ["adult"] }],
    },
    {
      id: "pain",
      kind: "textarea",
      rows: 3,
      label: "How they show pain, or that they feel sick",
      help: "One of the most important answers in this whole letter. How would a new person know {name} is hurting?",
      example:
        "Marcus can't tell you something hurts. He goes quiet, presses on the spot, " +
        "and stops eating. If he skips a meal, something is wrong: check ears and " +
        "teeth first. It has been one of those every single time.",
      cardLengthHint: 200,
    },
    {
      id: "wontAdmit",
      kind: "textarea",
      rows: 3,
      label: "What they will not admit to needing",
      help: "Pain, help in the shower, trouble on the stairs, money running short. What are the signs, if they will not say it?",
      showWhen: [{ cognitionChanging: ["yes", "early"] }, { supportLevel: ["mostlyIndependent"] }],
      openers: ["They will never say it, but…", "The sign to watch for is…"],
    },
    {
      id: "overwhelm",
      kind: "textarea",
      rows: 3,
      label: "How they show they're becoming overwhelmed",
      help: "The early signs: the ones that come before a crisis, while there's still time to help.",
      showWhen: [{ communicationDiffers: ["yes"] }, { behaviorEscalates: ["yes"] }],
    },
    {
      id: "hardConversations",
      kind: "textarea",
      rows: 4,
      label: "The conversations that are still unfinished",
      help: "Driving, moving, bringing in more help. Where does the subject stand, what has already been said, and what has been agreed?",
      showWhen: [{ cognitionChanging: ["yes", "early"] }, { supportLevel: ["mostlyIndependent"] }],
    },
    {
      id: "whatHelps",
      kind: "textarea",
      rows: 3,
      label: "What to say: words and approaches that work",
      placeholder: "Phrases, tone, pacing, humor: what lands well with them",
      openers: ["What helps most is…"],
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "What helps a conversation go well",
          placeholder: "Sitting down first, no television on, giving them the decision to make",
        },
      ],
      cardLengthHint: 200,
    },
    {
      id: "whatToAvoid",
      kind: "textarea",
      rows: 3,
      label: "What not to say",
      placeholder: "Words, topics, or tones to avoid, and what happens if they come up",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "What to avoid saying",
          help: "The phrases that end the conversation. Every family has a few.",
          example:
            "Never start with \"we've decided.\" Never mention the word facility in front " +
            "of her. Do not bring up her sister's stroke as a comparison.",
        },
      ],
      cardLengthHint: 200,
    },
  ],
};
