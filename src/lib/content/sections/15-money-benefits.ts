import type { SectionDef } from "@/lib/content/types";

/**
 * Canonical merge of `benefitsFinances` (special-needs) and `moneyDocuments`
 * (general). repPayee (an SSA-appointed benefits manager) and whoHandlesBills
 * (who pays the household bills in practice) stay separate: different
 * questions that only looked alike in the old table. Everything here is
 * trustee-letter material held to emergency-sheet strictness.
 */
export const moneyBenefits: SectionDef = {
  slug: "money-and-benefits",
  key: "moneyBenefits",
  title: "Money and benefits",
  navTitle: "Money & benefits",
  intro:
    "A map of what exists: programs, accounts, trusts, how the bills get paid, " +
    "and who runs each. Not the balances, the machinery. Someone stepping in " +
    "cold should be able to keep the lights on without a scavenger hunt, and " +
    "nothing should get accidentally broken.",
  note:
    "Why no account or Social Security numbers? This letter is meant to be " +
    "copied and handed to schools, hospitals, and caregivers. A map of {name}'s " +
    "benefits helps all of them. The numbers themselves help only the one or two " +
    "people who manage things, and are dangerous in the wrong hands. The letter " +
    "will print where the numbers are kept instead.",
  fields: [
    {
      id: "programs",
      kind: "textarea",
      rows: 4,
      label: "Benefits they receive today",
      help: "SSI is a monthly check for people with disabilities and limited income. SSDI is based on a work record. Add Medicaid, Medicare, and any waiver programs. Name what {name} gets, and roughly since when.",
      placeholder: "e.g., SSI since age 18; Virginia Medicaid; on the DD waiver waitlist since 2021",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }],
      chips: [
        { value: "SSI", teach: "A monthly check for people with disabilities and limited income" },
        { value: "SSDI", teach: "Disability income based on a work record" },
        { value: "Medicaid" },
        { value: "Medicare" },
        { value: "SNAP", teach: "Food assistance, once called food stamps" },
        { value: "Section 8", teach: "Rental housing assistance" },
        { value: "HCBS waiver", teach: "Medicaid support for care at home instead of a facility" },
      ],
    },
    {
      id: "incomeSources",
      kind: "textarea",
      rows: 3,
      label: "Where the money comes in",
      help: "Pension, Social Security, an annuity, rent from a property. What arrives and roughly when, not the amounts, unless you want to.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "whoHandlesBills",
      kind: "textarea",
      rows: 3,
      label: "Who handles the bills today",
      help: "Them, you, both of you, or an arrangement that has drifted without anyone saying so.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "howBillsArePaid",
      kind: "textarea",
      rows: 4,
      label: "How the bills actually get paid",
      help: "What is on autopay, what is paid by check, what arrives by post. Name the ones that get missed.",
      example:
        "Utilities and the phone are on autopay from the checking account. Property " +
        "tax comes twice a year by mail and she has missed it twice. The church " +
        "pledge she writes by hand every January.",
      showWhen: [{ stage: ["adult"] }],
    },
    {
      id: "repPayee",
      kind: "textarea",
      rows: 2,
      label: "Representative payee",
      help: "The person or organization that receives and manages benefit checks on {name}'s behalf, if any.",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }],
    },
    {
      id: "ableAccount",
      kind: "textarea",
      rows: 2,
      label: "ABLE account",
      help: "A savings account for people with disabilities that doesn't count against benefit limits. Who manages it? (No account number.)",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }],
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
      // Ungated. This was `hasTrust ∈ {yes, planned, notSure} OR audience ∈
      // {trustee, both}` — an onboarding question spent on one optional field
      // that two of the three audiences already saw. Asked of everyone now:
      // for an aging parent the trust is usually a living trust rather than a
      // special needs trust, so the help and the example switch together.
      variants: [
        {
          when: { supportLevel: ["mostlyIndependent"] },
          help: "If a trust exists, a living trust or any other kind: when it was created, who the trustee or successor trustee is, and which attorney drafted it.",
          example:
            "Mom's revocable living trust, set up in 2019, holds the house. She " +
            "is her own trustee; I am successor trustee. The attorney who " +
            "drafted it has the original and my number.",
        },
      ],
    },
    {
      id: "pending",
      kind: "textarea",
      rows: 3,
      label: "Anything pending",
      placeholder: "Applications, renewals, appeals, and who is handling each one",
      showWhen: [{ hasBenefits: ["yes", "maybe"] }],
    },
    {
      id: "whereRecordsKept",
      kind: "textarea",
      rows: 3,
      label: "Where the official numbers and papers live",
      help: "The letter will print: \"ID and account numbers are kept separately. See here.\" So, where? A fireproof box, an attorney's office, a password manager someone trusted can reach?",
      example:
        "The gray fireproof box in our bedroom closet, top shelf; the key is taped " +
        "inside the kitchen junk drawer. Passwords are in Bitwarden, and Dana has " +
        "emergency access.",
      variants: [
        {
          when: { stage: ["adult"], supportLevel: ["mostlyIndependent"] },
          label: "Where the documents are kept",
          help: "The will, the deed, the insurance policies, the tax returns, the safe deposit box and who can open it. Where, not what.",
          example:
            "Grey file box on the top shelf of the hall closet: deed, will, and the " +
            "long-term care policy. Bank box at the branch on Main. My brother is on " +
            "the signature card.",
        },
      ],
    },
    {
      id: "vulnerabilities",
      kind: "textarea",
      rows: 4,
      label: "Scams and pressure they are vulnerable to",
      help: "The phone calls, the mail, the charity that will not stop, the relative who asks. What has already happened, and what you watch for.",
      showWhen: [{ stage: ["adult"] }, { cognitionChanging: ["yes", "early"] }],
    },
  ],
};
