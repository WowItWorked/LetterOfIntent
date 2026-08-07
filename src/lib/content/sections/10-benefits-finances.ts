import type { SectionDef } from "@/lib/content/types";

export const benefitsFinances: SectionDef = {
  slug: "benefits-and-finances",
  key: "benefitsFinances",
  number: 10,
  title: "Benefits and finances",
  navTitle: "Benefits & money",
  minutes: 10,
  intro:
    "A map of what exists — programs, accounts, trusts, and who runs each — so " +
    "nothing gets lost, and nothing gets accidentally broken. This section " +
    "explains what exists, not the numbers.",
  note:
    "Why no account or Social Security numbers? This letter is meant to be " +
    "copied and handed to schools, hospitals, and caregivers. A map of {name}'s " +
    "benefits helps all of them. The numbers themselves help only the one or two " +
    "people who manage things — and are dangerous in the wrong hands. The letter " +
    "will print where the numbers are kept instead.",
  fields: [
    {
      id: "programs",
      kind: "textarea",
      rows: 4,
      label: "Benefits they receive today",
      help: "SSI is a monthly check for people with disabilities and limited income. SSDI is based on a parent's work record. Add Medicaid, Medicare, and any waiver programs. Name what {name} gets, and roughly since when.",
      placeholder: "e.g., SSI since age 18; Virginia Medicaid; on the DD waiver waitlist since 2021",
    },
    {
      id: "repPayee",
      kind: "textarea",
      rows: 2,
      label: "Representative payee",
      help: "The person or organization that receives and manages benefit checks on {name}'s behalf, if any.",
    },
    {
      id: "ableAccount",
      kind: "textarea",
      rows: 2,
      label: "ABLE account",
      help: "A savings account for people with disabilities that doesn't count against benefit limits. Who manages it? (No account number.)",
    },
    {
      id: "trusts",
      kind: "textarea",
      rows: 3,
      label: "Existing trusts and who runs them",
      help: "A special needs trust holds money for {name} without breaking their benefits. If one exists: when it was created, who the trustee is, and which attorney drafted it.",
      example:
        "A special needs trust created in 2022. His aunt Dana Alvarez is trustee; " +
        "Claire Kelly at Trusts & Wealth drafted it and has the original.",
    },
    {
      id: "pending",
      kind: "textarea",
      rows: 3,
      label: "Anything pending",
      placeholder: "Applications, renewals, appeals — and who is handling each one",
    },
    {
      id: "whereRecordsKept",
      kind: "textarea",
      rows: 3,
      label: "Where the official numbers and papers live",
      help: "The letter will print: \"ID and account numbers are kept separately — see here.\" So — where? A fireproof box, an attorney's office, a password manager someone trusted can reach?",
      example:
        "The gray fireproof box in our bedroom closet, top shelf; the key is taped " +
        "inside the kitchen junk drawer. Passwords are in Bitwarden — Dana has " +
        "emergency access.",
    },
  ],
};
