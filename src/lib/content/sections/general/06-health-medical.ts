import type { SectionDef } from "@/lib/content/types";

export const healthMedical: SectionDef = {
  slug: "health-and-medical",
  key: "healthMedical",
  number: 6,
  title: "Health and medical",
  navTitle: "Health & medical",
  minutes: 10,
  intro:
    "If someone had to take {name} to an emergency room tonight, this is the page " +
    "they would need. Conditions, medications with doses, allergies, and who to " +
    "call. It also prints on the one-page emergency sheet.",
  note:
    "Write down where the cards and records are kept — never the numbers themselves. " +
    "This tool never asks for a Social Security number, an account number, or a " +
    "policy number, and you should not add one anywhere in it.",
  fields: [
    {
      id: "conditions",
      kind: "textarea",
      rows: 4,
      label: "Conditions and diagnoses",
      help: "Roughly when each was diagnosed, and how it affects daily life now.",
      placeholder: "e.g., Atrial fibrillation (2019, on a blood thinner); osteoarthritis in both knees",
    },
    {
      id: "allergies",
      kind: "textarea",
      rows: 2,
      label: "Allergies and bad reactions",
      help: "Medications, foods, materials — and what the reaction actually looks like.",
    },
    {
      id: "medications",
      kind: "repeater",
      label: "Medications",
      help: "Everything taken regularly, including over-the-counter and supplements. Doses change — update this page when they do.",
      itemNoun: "medication",
      addLabel: "Add a medication",
      itemFields: [
        { id: "name", kind: "text", label: "Medication", width: "half" },
        { id: "dose", kind: "text", label: "Dose and timing", width: "half" },
        {
          id: "purpose",
          kind: "text",
          label: "What it is for",
          placeholder: "e.g., Blood pressure — never skip this one",
        },
      ],
    },
    {
      id: "providers",
      kind: "repeater",
      label: "Doctors and other providers",
      help: "The primary care doctor first, then specialists, dentist, and anyone else seen regularly.",
      itemNoun: "provider",
      addLabel: "Add a provider",
      itemFields: [
        { id: "name", kind: "text", label: "Name", width: "half" },
        {
          id: "specialty",
          kind: "text",
          label: "Specialty or role",
          width: "half",
          placeholder: "e.g., Primary care, cardiology",
        },
        { id: "phone", kind: "tel", label: "Phone", width: "half" },
      ],
    },
    {
      id: "pharmacy",
      kind: "textarea",
      rows: 2,
      label: "Pharmacy",
      placeholder: "Which one, where, and whether prescriptions are delivered or picked up",
    },
    {
      id: "preferredHospital",
      kind: "text",
      label: "Preferred hospital",
      help: "Where their records are, and where they would want to be taken.",
    },
    {
      id: "appointmentHelp",
      kind: "textarea",
      rows: 4,
      label: "How appointments actually work",
      help: "Who drives, who goes in, who takes notes, and what tends to get missed if nobody does.",
      example:
        "He will say the appointment went fine and remember none of it. Someone has " +
        "to go in with him and write it down. The cardiologist knows to call me after.",
    },
    {
      id: "recordsLocation",
      kind: "textarea",
      rows: 3,
      label: "Where the cards, records, and directives are kept",
      help: "The insurance cards, the medication list, the advance directive. Where, not what.",
    },
  ],
};
