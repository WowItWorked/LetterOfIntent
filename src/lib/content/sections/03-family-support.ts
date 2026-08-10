import type { SectionDef } from "@/lib/content/types";

export const familySupport: SectionDef = {
  slug: "family-and-support",
  key: "familySupport",
  number: 3,
  title: "Family and support network",
  navTitle: "Family & support",
  minutes: 10,
  intro:
    "List the people in {name}'s life: family, friends, current caregivers, and " +
    "paid supports. A future caregiver should be able to look at this page and " +
    "know exactly who to call, and for what.",
  fields: [
    {
      id: "contacts",
      kind: "repeater",
      label: "People in {name}'s life",
      help: "Add as many as you like. Check the emergency box for the few people who belong on the one-page emergency sheet.",
      itemNoun: "person",
      addLabel: "Add a person",
      itemFields: [
        { id: "name", kind: "text", label: "Name", width: "half" },
        {
          id: "relationship",
          kind: "text",
          label: "Relationship",
          width: "half",
          placeholder: "e.g., Aunt, neighbor, support worker",
        },
        { id: "phone", kind: "tel", label: "Phone", width: "half" },
        { id: "altPhone", kind: "tel", label: "Backup phone", width: "half" },
        { id: "email", kind: "email", label: "Email", width: "half" },
        {
          id: "roles",
          kind: "multiselect",
          label: "On the cards, this person is",
          help: "Check any that apply. The Identity & Contacts card lists people by these roles.",
          options: [
            { value: "primary", label: "First call (the primary contact)" },
            { value: "medical_decision", label: "Can make medical decisions" },
            { value: "legal_guardian", label: "Legal guardian" },
            { value: "pickup", label: "Approved for pickup" },
            { value: "neighbor_backup", label: "Nearby backup (can be there fast)" },
          ],
        },
        {
          id: "role",
          kind: "text",
          label: "What they help with",
          placeholder: "e.g., Handles doctor visits; Tuesday rides; knows the routines",
        },
        {
          id: "emergency",
          kind: "checkbox",
          label: "Emergency contact: include on the emergency sheet",
        },
        {
          id: "notes",
          kind: "textarea",
          group: "more",
          label: "Notes",
          placeholder: "Anything a future caregiver should know about this person or relationship",
        },
        {
          id: "keepOffCards",
          kind: "checkbox",
          label: "Keep off shareable cards",
          help: "They stay in the full letter. They just never print on the cards you might text a sitter.",
        },
      ],
    },
    {
      id: "firstCall",
      kind: "text",
      label: "Who would you call first in an emergency?",
      placeholder: "e.g., My sister Dana (she can be there in 15 minutes)",
    },
    {
      id: "doNotInvolve",
      kind: "textarea",
      rows: 3,
      label: "Is there anyone who should not be given a role?",
      help: "This stays between you and whoever reads this letter. You don't have to explain why, but you can, and it helps.",
      example:
        "His uncle Ray should not be involved in money decisions. He means well, but " +
        "he has borrowed from family before and not paid it back. Visits are fine.",
    },
  ],
};
