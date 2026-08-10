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
    "Write down where the cards and records are kept, never the numbers themselves. " +
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
      help: "Medications, foods, materials, and what the reaction actually looks like.",
    },
    {
      id: "medications",
      kind: "repeater",
      label: "Medications",
      help: "Everything taken regularly, including over-the-counter and supplements. Doses change. Update this page when they do.",
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
        {
          id: "schedule",
          kind: "multiselect",
          label: "When they take it",
          help: "Check all that apply. The Medications card groups doses by time of day, and a typed clock time (8:00 AM) prints exactly as written.",
          options: [
            { value: "morning", label: "Morning" },
            { value: "noon", label: "Noon" },
            { value: "evening", label: "Evening" },
            { value: "bedtime", label: "Bedtime" },
            { value: "prn", label: "As needed (PRN)" },
          ],
          custom: {
            label: "Custom time",
            placeholder: "e.g., 14:30 or 2:30 PM",
            addLabel: "Add time",
          },
        },
        {
          id: "withFood",
          kind: "checkbox",
          label: "Take with food",
          width: "half",
        },
        {
          id: "isRescue",
          kind: "checkbox",
          label: "Rescue medication: for emergencies, not the daily routine",
          help: "Rescue medications print first, and land on the Emergency card too.",
        },
        {
          id: "location",
          kind: "text",
          label: "Where it is kept",
          placeholder: "e.g., The nitroglycerin stays in the top kitchen drawer",
          help: "Matters most for a rescue medication: the card tells a helper where to grab it.",
        },
        {
          id: "unit",
          kind: "text",
          group: "more",
          width: "half",
          label: "Dose amount",
          placeholder: "e.g., 25 mg",
        },
        {
          id: "route",
          kind: "text",
          group: "more",
          width: "half",
          label: "How it is taken",
          placeholder: "e.g., By mouth; patch; injection",
        },
        {
          id: "prnTrigger",
          kind: "text",
          group: "more",
          label: "As needed: give it when",
          placeholder: "e.g., Chest tightness, before calling anyone",
        },
        {
          id: "prnMaxPerDay",
          kind: "text",
          group: "more",
          width: "half",
          label: "As needed: most in one day",
          placeholder: "e.g., 2 doses",
        },
        {
          id: "refusalStrategy",
          kind: "textarea",
          group: "more",
          label: "If they refuse it",
          placeholder:
            "e.g., Set it beside their plate and walk away. Come back in five minutes. Handing it over directly turns it into a fight.",
        },
        {
          id: "sideEffects",
          kind: "textarea",
          group: "more",
          label: "Side effects to watch for",
          placeholder: "e.g., Dizzy if they stand up fast (a fall risk)",
        },
        {
          id: "keepOffCards",
          kind: "checkbox",
          label: "Keep off shareable cards",
          help: "It stays in the full letter. It just never prints on the cards you might text a sitter.",
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
        {
          id: "practice",
          kind: "text",
          label: "Practice or clinic",
          width: "half",
          placeholder: "e.g., Vienna Family Medicine",
        },
        {
          id: "notes",
          kind: "textarea",
          group: "more",
          label: "Notes",
          placeholder: "e.g., The cardiologist knows to call me after every visit",
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
