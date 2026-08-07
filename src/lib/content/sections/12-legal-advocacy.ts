import type { SectionDef } from "@/lib/content/types";

export const legalAdvocacy: SectionDef = {
  slug: "legal-and-advocacy",
  key: "legalAdvocacy",
  number: 12,
  title: "Legal and advocacy",
  navTitle: "Legal & advocacy",
  minutes: 10,
  intro:
    "Who holds legal authority in {name}'s life, who advocates for them, and the " +
    "battles you've already won — so nobody has to fight them twice.",
  fields: [
    {
      id: "decisionStatus",
      kind: "textarea",
      rows: 4,
      label: "Decision-making status",
      help: "Is there a guardianship or conservatorship (a court gave someone authority)? A power of attorney? A supported decision-making agreement ({name} keeps authority, with named helpers)? Who holds each role — and where are the papers?",
    },
    {
      id: "advocates",
      kind: "textarea",
      rows: 3,
      label: "Case managers and advocates",
      placeholder: "Support coordinator, case manager, advocacy organizations — names, agencies, phone numbers",
    },
    {
      id: "attorney",
      kind: "textarea",
      rows: 2,
      label: "Attorney",
      placeholder: "Who has handled their legal work, and for what",
    },
    {
      id: "advocacyHistory",
      kind: "textarea",
      rows: 4,
      label: "What you've had to fight for — and how you won",
      help: "Denied services, school battles, benefit appeals. What worked? Which words, which laws, which people moved the wall?",
      example:
        "The county denied his waiver slot in 2021. We appealed with a letter from " +
        "his neurologist and won in four months — the phrase that mattered was " +
        "\"institutional level of care.\" Get every denial in writing. Never accept " +
        "a no by phone.",
    },
  ],
};
