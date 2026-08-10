import type { SectionDef } from "@/lib/content/types";

export const medical: SectionDef = {
  slug: "medical",
  key: "medical",
  number: 6,
  title: "Medical",
  navTitle: "Medical",
  minutes: 15,
  intro:
    "The medical facts a new caregiver (or a new doctor) needs, all in one " +
    "place. Plan names and doctor names are useful here. ID numbers are not: " +
    "this letter is meant to be copied and shared, so numbers stay out of it.",
  fields: [
    {
      id: "providers",
      kind: "repeater",
      label: "Doctors and specialists",
      itemNoun: "provider",
      addLabel: "Add a provider",
      itemFields: [
        { id: "name", kind: "text", label: "Name", width: "half" },
        {
          id: "specialty",
          kind: "text",
          label: "Specialty",
          width: "half",
          placeholder: "e.g., Primary care, Neurology, Dentist",
        },
        { id: "phone", kind: "tel", label: "Phone", width: "half" },
        {
          id: "practice",
          kind: "text",
          label: "Practice or clinic",
          width: "half",
          placeholder: "e.g., Fairfax Neurology Center",
        },
        {
          id: "notes",
          kind: "textarea",
          group: "more",
          label: "Notes",
          placeholder: "e.g., Ask for the first appointment of the day (waiting rooms are hard)",
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
      id: "medications",
      kind: "repeater",
      label: "Current medications",
      help: "These print on the emergency sheet and the Medications card, so keep them current. Include supplements if they matter.",
      itemNoun: "medication",
      addLabel: "Add a medication",
      itemFields: [
        { id: "name", kind: "text", label: "Medication", width: "half" },
        {
          id: "dose",
          kind: "text",
          label: "Dose and timing",
          width: "half",
          placeholder: "e.g., 25 mg, one tablet",
        },
        {
          id: "purpose",
          kind: "text",
          label: "What it's for",
          help: "Conditions and warnings belong here too. They print on the medication's line.",
          placeholder: "e.g., For anxiety — never stop it abruptly",
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
          label: "Where it's kept",
          placeholder: "e.g., Red pouch, front left of the backpack — spare in the kitchen drawer",
          help: "Matters most for a rescue medication: the card tells a helper where to grab it, so name the spare too.",
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
          label: "How it's taken",
          placeholder: "e.g., By mouth; patch; injection",
        },
        {
          id: "prnTrigger",
          kind: "text",
          group: "more",
          label: "As needed: give it when",
          placeholder: "e.g., A headache they rate over 5, or any wheezing",
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
          placeholder: "e.g., Sleepy for the first hour; call us about any rash",
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
      id: "allergies",
      kind: "textarea",
      rows: 2,
      label: "Allergies and reactions",
      help: "Medications, foods, materials like latex, and what the reaction looks like.",
    },
    {
      id: "emergencyProtocol",
      kind: "textarea",
      rows: 5,
      label: "Seizure or emergency protocol",
      help: "If there's a plan for seizures, choking, wandering, diabetic events, or anything else, write the steps in order, including when to call 911.",
      example:
        "For a seizure: start timing immediately. Turn her on her side; nothing in her " +
        "mouth. Under 3 minutes: stay close, speak calmly, let her sleep after. Over 3 " +
        "minutes, or a second seizure: give the rescue med from the red pouch " +
        "(instructions inside it) and call 911. Then call us, any hour.",
    },
    {
      id: "therapies",
      kind: "textarea",
      rows: 3,
      label: "Therapies and schedules",
      placeholder: "e.g., Speech on Tuesdays at 4 with Ms. Kim; OT every other Friday",
    },
    {
      id: "equipment",
      kind: "textarea",
      rows: 3,
      label: "Equipment they use",
      placeholder:
        "e.g., Wheelchair, hearing aids, CPAP, communication device, plus chargers, suppliers, and quirks",
    },
    {
      id: "insurance",
      kind: "textarea",
      rows: 3,
      label: "Insurance and Medicaid: plan names only",
      help: "Name the plans, like \"Anthem through Dad's employer\" or \"Virginia Medicaid (CCC Plus waiver).\" No ID numbers here. You'll note where cards are kept in the Benefits section.",
    },
    {
      id: "preferredHospital",
      kind: "text",
      label: "Preferred hospital or ER",
      placeholder: "e.g., Inova Fairfax (they have his records and a quiet room)",
    },
    {
      id: "whatWorked",
      kind: "textarea",
      rows: 3,
      label: "Treatments that have worked",
      help: "Medications, therapies, approaches: what actually helped, and how you could tell.",
    },
    {
      id: "whatDidNot",
      kind: "textarea",
      rows: 3,
      label: "Treatments that didn't work, or made things worse",
      help: "Save the next team from re-running painful experiments.",
    },
  ],
};
