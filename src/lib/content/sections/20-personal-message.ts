import type { SectionDef } from "@/lib/content/types";

export const personalMessage: SectionDef = {
  slug: "a-personal-message",
  key: "personalMessage",
  number: 20,
  title: "A personal message",
  navTitle: "Your message",
  minutes: 15,
  intro:
    "The rest of this letter is instructions. This part is you.\n\n" +
    "Many families say this is the page that matters most: the one that gets " +
    "read at kitchen tables years from now. There are no rules here. Write to " +
    "whoever you want, in whatever voice is yours. The examples are only there " +
    "if you're stuck.",
  fields: [
    {
      id: "toCaregivers",
      kind: "textarea",
      rows: 7,
      label: "To {name}'s future caregivers",
      help: "If you could sit across from the people who will do your job after you, what would you tell them? What does it look like to love {name} well?",
      example:
        "Thank you for being with him when I can't be. You will earn his trust " +
        "slowly, and then have it absolutely. When he is difficult, he is scared. " +
        "When he brings you a train schedule, he is telling you he loves you. " +
        "Please be patient with my son. He is the best thing I ever did.",
    },
    {
      id: "toSiblings",
      kind: "textarea",
      rows: 7,
      label: "To their siblings",
      help: "Gratitude, permission, hopes, and anything they'll need to be released from. Many parents use this space to say: your own life matters too.",
    },
    {
      id: "toPerson",
      kind: "textarea",
      rows: 7,
      label: "To {name}",
      help: "A letter for someone to read to them (or for them to read) when you're not there to say it yourself.",
    },
  ],
};
