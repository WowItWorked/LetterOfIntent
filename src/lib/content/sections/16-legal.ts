import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `legalAdvocacy` (special-needs) and `legalDecisions`
 * (general). The general path's four sharp questions become the canonical
 * set; the old composite `decisionStatus` is legacy-carried (stored, printed,
 * quoted below) and never asked again — software must not split a family's
 * prose across four boxes. `professionals` is the three-way merge of
 * attorney, professionals, and advisors.
 */
export const legal: SectionDef = {
  slug: "legal-and-decisions",
  key: "legal",
  title: "Legal and decisions",
  navTitle: "Legal & decisions",
  intro:
    "Who is allowed to decide what, who advocates for {name}, and where it is " +
    "all written down. This is not legal advice and this letter is not a legal " +
    "document, but it is the map that tells a family which documents exist and " +
    "who is already holding them.",
  legacyRefs: [
    { sectionKey: "legal", fieldKey: "decisionStatus", label: "Decision-making status" },
  ],
  fields: [
    {
      id: "powersOfAttorney",
      kind: "textarea",
      rows: 4,
      label: "Powers of attorney",
      help: "Financial and medical: who is named, whether it is in effect now or only on incapacity, and where the signed document is kept.",
      example:
        "Financial POA names my brother, effective now. Medical POA names me, with " +
        "him as the alternate. Both signed in 2021 and the originals are in the grey " +
        "file box; the lawyer has copies.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "advanceDirectives",
      kind: "textarea",
      rows: 4,
      label: "Advance directive or living will",
      help: "What it says in plain words, and where a hospital could get it at two in the morning.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "guardianship",
      kind: "textarea",
      rows: 3,
      label: "Guardianship or conservatorship, if any",
      help: "Whether any court process has happened, is under way, or has been deliberately avoided, and why. A supported decision-making agreement ({name} keeps authority, with named helpers) belongs here too.",
      chips: [
        { value: "Guardianship", teach: "A court gave someone authority to decide" },
        { value: "Conservatorship", teach: "Court-appointed authority over money" },
        { value: "Supported decision-making", teach: "They keep authority, with named helpers" },
      ],
      variants: [
        {
          when: { stage: ["child"] },
          help: "At 18, parental authority ends unless something is put in place. Whether any court process has happened, is under way, or has been deliberately avoided, and why. A supported decision-making agreement ({name} keeps authority, with named helpers) belongs here too.",
        },
      ],
    },
    {
      id: "whoDecidesWhat",
      kind: "textarea",
      rows: 4,
      label: "Who decides what, and where the limits are",
      help: "In practice, not on paper. Which decisions are still entirely theirs, which are shared, and which have quietly moved.",
      example:
        "Everything day to day is hers. Money over about five hundred dollars she " +
        "talks over with my brother first, by her own choice. Medical she wants " +
        "explained to her and then decided with me in the room.",
    },
    {
      id: "advocates",
      kind: "textarea",
      rows: 3,
      label: "Case managers and advocates",
      placeholder: "Support coordinator, case manager, advocacy organizations: names, agencies, phone numbers",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }, { schoolWork: ["school"] }],
    },
    {
      id: "advocacyHistory",
      kind: "textarea",
      rows: 4,
      label: "What you've had to fight for, and how you won",
      help: "Denied services, school battles, benefit appeals. What worked? Which words, which laws, which people moved the wall?",
      example:
        "The county denied his waiver slot in 2021. We appealed with a letter from " +
        "his neurologist and won in four months. The phrase that mattered was " +
        "\"institutional level of care.\" Get every denial in writing. Never accept " +
        "a no by phone.",
      // The OR gate means hasBenefits alone (Medicare, Social Security)
      // surfaces this for the aging pole too, where the fight looks like a
      // coverage denial, not a waiver slot.
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          example:
            "Medicare denied her walker as \"not medically necessary\" in 2024. " +
            "Her doctor wrote one paragraph citing the fall in March and it was " +
            "approved on resubmission. Ask the doctor's office to use the words " +
            "\"medically necessary\" and keep every denial letter.",
        },
      ],
      showWhen: [{ hasBenefits: ["yes", "maybe"] }, { schoolWork: ["school"] }],
    },
    {
      id: "professionals",
      kind: "textarea",
      rows: 3,
      label: "Attorney, accountant, and anyone else who helps",
      help: "The people who already hold the file or know the situation: names, firms, and phone numbers.",
    },
  ],
};
