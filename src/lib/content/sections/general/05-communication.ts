import type { SectionDef } from "@/lib/content/types";

export const dailyCommunication: SectionDef = {
  slug: "talking-with-them",
  key: "dailyCommunication",
  number: 5,
  title: "Talking with {name}",
  navTitle: "Communication",
  minutes: 10,
  intro:
    "Most friction between an adult and the people helping them is not about care. " +
    "It is about how the care gets offered. This section is about tone as much as " +
    "hearing: who they will take it from, what they will not admit to needing, and " +
    "how to raise the hard subjects without losing the argument before it starts.",
  fields: [
    {
      id: "howToSpeak",
      kind: "textarea",
      rows: 4,
      label: "How they prefer to be spoken to, and by whom",
      help: "Directly or gently? Face to face or over the phone? Is there someone they will accept news from that they will not accept from anyone else?",
      example:
        "Say it straight and say it once. She can tell when she is being handled and " +
        "it makes her dig in. Anything about money should come from my brother — she " +
        "has always trusted him with that and it is not worth relitigating.",
    },
    {
      id: "hearingVisionMemory",
      kind: "textarea",
      rows: 4,
      label: "Hearing, vision, and memory, as they are now",
      help: "Be honest and specific — this is the page that keeps someone from mistaking a hearing problem for confusion.",
      example:
        "Hearing aids in both ears; he forgets the left one. Reading glasses on the " +
        "chain. Memory is fine for the distant past, patchy for this week — he will " +
        "cover for it rather than ask you to repeat something.",
    },
    {
      id: "wontAdmit",
      kind: "textarea",
      rows: 3,
      label: "What they will not admit to needing",
      help: "Pain, help in the shower, trouble on the stairs, money running short. What are the signs, if they will not say it?",
    },
    {
      id: "hardConversations",
      kind: "textarea",
      rows: 4,
      label: "The conversations that are still unfinished",
      help: "Driving, moving, bringing in more help. Where does the subject stand, what has already been said, and what has been agreed?",
    },
    {
      id: "whatHelps",
      kind: "textarea",
      rows: 3,
      label: "What helps a conversation go well",
      placeholder: "Sitting down first, no television on, giving them the decision to make",
    },
    {
      id: "whatToAvoid",
      kind: "textarea",
      rows: 3,
      label: "What to avoid saying",
      help: "The phrases that end the conversation. Every family has a few.",
      example:
        "Never start with \"we've decided.\" Never mention the word facility in front " +
        "of her. Do not bring up her sister's stroke as a comparison.",
    },
  ],
};
