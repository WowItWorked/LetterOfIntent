import type { SectionDef } from "@/lib/content/types";

export const gettingStarted: SectionDef = {
  slug: "getting-started",
  key: "gettingStarted",
  number: 1,
  title: "Getting started",
  navTitle: "Getting started",
  minutes: 5,
  intro:
    "A Letter of Intent is a plain-language guide to caring for your loved one: " +
    "everything a future caregiver, trustee, or guardian would need to know but " +
    "could never guess. It is not a legal document, and that is its strength: " +
    "no forms, no signatures, just the notes only you could write.\n\n" +
    "Most families finish in 45 minutes to two hours, usually across a few sittings. " +
    "Everything saves automatically on this device as you type. Every question " +
    "is optional. Skip anything. Come back anytime. There is no wrong way to do this.",
  fields: [
    {
      id: "authorName",
      kind: "text",
      label: "Your name",
      help: "The person writing this letter.",
      placeholder: "e.g., Maria Alvarez",
    },
    {
      id: "authorRelationship",
      kind: "text",
      label: "Your relationship to them",
      placeholder: "e.g., Mother, or \"Mom and Dad, writing together\"",
    },
    {
      id: "subjectFullName",
      kind: "text",
      label: "Their full name",
      help: "The person this letter is about.",
      placeholder: "e.g., Alexander James Alvarez",
    },
    {
      id: "subjectPreferredName",
      kind: "text",
      label: "What they like to be called",
      help: "Their preferred name or nickname. We'll use it through the rest of this guide, and in the letter itself.",
      placeholder: "e.g., Alex",
    },
    {
      id: "subjectAddress",
      kind: "text",
      label: "Their home address",
      help: "Only for the Identity & Contacts card, the card a sitter can hand a paramedic. Leave it blank if you'd rather the cards not carry it.",
      placeholder: "e.g., 4102 Maple Court, Vienna, VA",
    },
    {
      id: "letterDate",
      kind: "date",
      label: "Today's date",
      help: "This prints on the letter as its \"last updated\" date. Change it whenever you update the letter. Readers need to know how fresh it is.",
    },
  ],
};
