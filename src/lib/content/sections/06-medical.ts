import type { SectionDef } from "@/lib/content/types";

export const medical: SectionDef = {
  slug: "medical",
  key: "medical",
  number: 6,
  title: "Medical",
  navTitle: "Medical",
  minutes: 15,
  intro:
    "The medical facts a new caregiver — or a new doctor — needs, all in one " +
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
      ],
    },
    {
      id: "medications",
      kind: "repeater",
      label: "Current medications",
      help: "These print on the emergency sheet, so keep them current. Include supplements if they matter.",
      itemNoun: "medication",
      addLabel: "Add a medication",
      itemFields: [
        { id: "name", kind: "text", label: "Medication", width: "half" },
        {
          id: "dose",
          kind: "text",
          label: "Dose and timing",
          width: "half",
          placeholder: "e.g., 50 mg, morning and night",
        },
        {
          id: "purpose",
          kind: "text",
          label: "What it's for",
          placeholder: "e.g., Seizure control",
        },
      ],
    },
    {
      id: "allergies",
      kind: "textarea",
      rows: 2,
      label: "Allergies and reactions",
      help: "Medications, foods, materials like latex — and what the reaction looks like.",
    },
    {
      id: "emergencyProtocol",
      kind: "textarea",
      rows: 5,
      label: "Seizure or emergency protocol",
      help: "If there's a plan for seizures, choking, wandering, diabetic events — anything — write the steps in order, including when to call 911.",
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
        "e.g., Wheelchair, hearing aids, CPAP, communication device — plus chargers, suppliers, and quirks",
    },
    {
      id: "insurance",
      kind: "textarea",
      rows: 3,
      label: "Insurance and Medicaid — plan names only",
      help: "Name the plans, like \"Anthem through Dad's employer\" or \"Virginia Medicaid — CCC Plus waiver.\" No ID numbers here — you'll note where cards are kept in the Benefits section.",
    },
    {
      id: "preferredHospital",
      kind: "text",
      label: "Preferred hospital or ER",
      placeholder: "e.g., Inova Fairfax — they have his records and a quiet room",
    },
    {
      id: "whatWorked",
      kind: "textarea",
      rows: 3,
      label: "Treatments that have worked",
      help: "Medications, therapies, approaches — what actually helped, and how you could tell.",
    },
    {
      id: "whatDidNot",
      kind: "textarea",
      rows: 3,
      label: "Treatments that didn't work — or made things worse",
      help: "Save the next team from re-running painful experiments.",
    },
  ],
};
