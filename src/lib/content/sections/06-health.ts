import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `medical` (special-needs) and `healthMedical` (general).
 * Two pairs here look duplicative and are NOT, by hard-won lesson:
 * emergencyProtocol (what to do) vs. appointmentHelp (how visits work), and
 * insurancePlans (plan names) vs. recordsLocation (where papers live). The
 * old emergency sheet printed the wrong one under a trusted heading; keeping
 * all four fields distinct is the fix.
 */
export const health: SectionDef = {
  slug: "health-and-medical",
  key: "health",
  title: "Health and medical",
  navTitle: "Health & medical",
  intro:
    "If someone had to take {name} to an emergency room tonight, this is the " +
    "page they would need: conditions, medications with doses, allergies, and " +
    "who to call. It also feeds the one-page emergency sheet and the cards.",
  note:
    "Write down plan names and where the cards and records are kept, never the " +
    "numbers themselves. This tool never asks for a Social Security number, an " +
    "account number, or a policy number, and you should not add one anywhere in it.",
  fields: [
    {
      id: "conditions",
      kind: "textarea",
      rows: 3,
      label: "Diagnoses and conditions",
      help: "Plain words are fine. List what a new doctor or caregiver should know first. This also prints on the emergency sheet.",
      placeholder: "e.g., Autism spectrum disorder; epilepsy (focal seizures); anxiety",
      cardLengthHint: 180,
      variants: [
        {
          when: { stage: ["adult"], supportLevel: ["mostlyIndependent"] },
          label: "Conditions and diagnoses",
          help: "Roughly when each was diagnosed, and how it affects daily life now. This also prints on the emergency sheet.",
          placeholder:
            "e.g., Atrial fibrillation (2019, on a blood thinner); osteoarthritis in both knees",
        },
      ],
    },
    {
      id: "allergies",
      kind: "textarea",
      rows: 2,
      label: "Allergies and reactions",
      help: "Medications, foods, materials like latex, and what the reaction looks like. The Allergies section below can hold them one per entry for the cards.",
    },
    {
      id: "medications",
      kind: "repeater",
      label: "Current medications",
      help: "These print on the emergency sheet and the Medications card, so keep them current. Include over-the-counter medicines and supplements if they matter.",
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
        { id: "withFood", kind: "checkbox", label: "Take with food", width: "half" },
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
      id: "providers",
      kind: "repeater",
      label: "Doctors and specialists",
      help: "The primary care doctor first, then specialists, dentist, and anyone else seen regularly.",
      itemNoun: "provider",
      addLabel: "Add a provider",
      itemFields: [
        { id: "name", kind: "text", label: "Name", width: "half", autoComplete: "name" },
        {
          id: "specialty",
          kind: "text",
          label: "Specialty",
          width: "half",
          placeholder: "e.g., Primary care, Neurology, Dentist",
        },
        { id: "phone", kind: "tel", label: "Phone", width: "half", autoComplete: "tel" },
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
      id: "pharmacy",
      kind: "textarea",
      rows: 2,
      label: "Pharmacy",
      placeholder: "Which one, where, and whether prescriptions are delivered or picked up",
    },
    {
      id: "preferredHospital",
      kind: "text",
      label: "Preferred hospital or ER",
      placeholder: "e.g., Inova Fairfax (they have his records and a quiet room)",
      cardLengthHint: 90,
    },
    {
      id: "emergencyProtocol",
      kind: "textarea",
      rows: 5,
      label: "Seizure or emergency protocol",
      help: "If there's a plan for seizures, choking, wandering, diabetic events, or anything else, write the steps in order, including when to call 911. The Emergency Plan section can hold these as numbered steps for the cards.",
      example:
        "For a seizure: start timing immediately. Turn her on her side; nothing in her " +
        "mouth. Under 3 minutes: stay close, speak calmly, let her sleep after. Over 3 " +
        "minutes, or a second seizure: give the rescue med from the red pouch " +
        "(instructions inside it) and call 911. Then call us, any hour.",
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          label: "If there is a medical emergency",
          help: "What should happen first, and when to call 911. If there is a plan for falls, chest pain, or a diabetic event, write the steps in order.",
          example:
            "If he falls: do not help him up right away. Sit with him, check for pain " +
            "in the hip or wrist, and call me. If there is any confusion beyond his " +
            "normal, or chest pain, call 911 first and me second. The nitroglycerin " +
            "is in the top kitchen drawer.",
        },
      ],
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
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "therapies",
      kind: "textarea",
      rows: 3,
      label: "Therapies and schedules",
      placeholder: "e.g., Speech on Tuesdays at 4 with Ms. Kim; OT every other Friday",
      showWhen: [
        { supportLevel: ["someDailyHelp", "substantial", "roundTheClock"] },
        { hasBenefits: ["yes", "maybe"] },
      ],
      chips: [
        { value: "Physical therapy (PT)" },
        { value: "Occupational therapy (OT)", teach: "Help with daily-living skills like dressing and eating" },
        { value: "Speech therapy" },
        { value: "ABA", teach: "Applied Behavior Analysis, a structured behavior therapy" },
        { value: "Counseling" },
      ],
    },
    {
      id: "equipment",
      kind: "textarea",
      rows: 3,
      label: "Equipment they use",
      placeholder:
        "e.g., Wheelchair, hearing aids, CPAP, communication device, plus chargers, suppliers, and quirks",
      chips: [
        { value: "Wheelchair" },
        { value: "Walker" },
        { value: "Hearing aids" },
        { value: "CPAP", teach: "A machine that helps breathing during sleep" },
        { value: "Communication device" },
        { value: "Glasses" },
      ],
      example:
        "Ear defenders in the front pocket of the backpack — offer them, never put " +
        "them on him. Picture-card ring on the same clip.",
      cardLengthHint: 200,
    },
    {
      id: "insurancePlans",
      kind: "textarea",
      rows: 3,
      label: "Insurance and Medicaid: plan names only",
      help: "Name the plans, like \"Anthem through Dad's employer\" or \"Virginia Medicaid (CCC Plus waiver).\" No ID numbers here. Where the cards are kept goes below.",
    },
    {
      id: "recordsLocation",
      kind: "textarea",
      rows: 3,
      label: "Where the cards, records, and directives are kept",
      help: "The insurance cards, the medication list, the advance directive. Where, not what.",
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
