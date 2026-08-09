import type { SectionDef } from "@/lib/content/types";

export const moneyDocuments: SectionDef = {
  slug: "money-and-documents",
  key: "moneyDocuments",
  number: 8,
  title: "Money and documents",
  navTitle: "Money & documents",
  minutes: 10,
  intro:
    "Not the balances — the machinery. Which bills go out automatically, which one " +
    "arrives by post and gets missed, and where the paperwork lives. Someone " +
    "stepping in cold should be able to keep the lights on without a scavenger hunt.",
  note:
    "Write down where things are kept, never the numbers themselves. This tool has " +
    "no field for an account number, a Social Security number, or a policy number, " +
    "and you should not put one in any box here. A letter is not a safe.",
  fields: [
    {
      id: "whoHandlesBills",
      kind: "textarea",
      rows: 3,
      label: "Who handles the bills today",
      help: "Them, you, both of you, or an arrangement that has drifted without anyone saying so.",
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
    },
    {
      id: "incomeSources",
      kind: "textarea",
      rows: 3,
      label: "Where the money comes in",
      help: "Pension, Social Security, an annuity, rent from a property. What arrives and roughly when — not the amounts, unless you want to.",
    },
    {
      id: "whereDocumentsKept",
      kind: "textarea",
      rows: 4,
      label: "Where the documents are kept",
      help: "The will, the deed, the insurance policies, the tax returns, the safe deposit box and who can open it. Where, not what.",
      example:
        "Grey file box on the top shelf of the hall closet: deed, will, and the " +
        "long-term care policy. Bank box at the branch on Main — my brother is on " +
        "the signature card.",
    },
    {
      id: "vulnerabilities",
      kind: "textarea",
      rows: 4,
      label: "Scams and pressure they are vulnerable to",
      help: "The phone calls, the mail, the charity that will not stop, the relative who asks. What has already happened, and what you watch for.",
    },
    {
      id: "advisors",
      kind: "textarea",
      rows: 3,
      label: "Accountant, banker, and anyone else who helps",
      placeholder: "Names and phone numbers — the people who already know the situation",
    },
  ],
};
