import type { SectionDef } from "@/lib/content/types";

export const trustee: SectionDef = {
  slug: "guidance-for-the-trustee",
  key: "trustee",
  number: 18,
  title: "Guidance for the trustee",
  navTitle: "For the trustee",
  minutes: 10,
  intro:
    "A trust says what the money is. This section says what the money is for.\n\n" +
    "One day a trustee (maybe a relative, maybe a professional who never met " +
    "you) will make judgment calls in your place. These notes hand them your " +
    "judgment. They are not legally binding, and that is their strength: you can " +
    "speak plainly here.",
  fields: [
    {
      id: "moneyIsFor",
      kind: "textarea",
      rows: 4,
      label: "When you picture the trust doing its job, what is it paying for?",
      help: "Name what matters: comfort, companionship, experiences, safety, dignity. What should money never be the reason to skip?",
      example:
        "The money is for a life, not a ledger. It's for the aide who takes him to " +
        "concerts, the good mattress, the direct flight instead of two layovers. " +
        "It's so his sister never has to choose between his dental work and her own " +
        "kids' shoes.",
    },
    {
      id: "easyYeses",
      kind: "textarea",
      rows: 3,
      label: "What should be an easy yes?",
      help: "The requests a trustee should approve generously, without a second thought.",
    },
    {
      id: "spendVsPreserve",
      kind: "textarea",
      rows: 4,
      label: "Spending now versus preserving for later",
      help: "There's no formula, but you have instincts. Should the trustee lean toward making today better, or stretching the fund across a lifetime? What would change the balance?",
    },
    {
      id: "scrutinize",
      kind: "textarea",
      rows: 3,
      label: "What deserves extra scrutiny?",
      help: "Requests, spending patterns, or people that should make the trustee slow down and ask questions.",
    },
    {
      id: "wishesVsSafety",
      kind: "textarea",
      rows: 4,
      label: "When {name}'s wishes and their safety disagree",
      help: "How should the trustee weigh what {name} wants against what keeps them safe? Where would you take a risk, and where would you never?",
      example:
        "Let her take risks that bruise; block the ones that break. If she wants to " +
        "spend her fun money on another keyboard she'll abandon in a week, let her: " +
        "that's her money and her joy. But housing and medical decisions are not a " +
        "vote. She will always choose whatever keeps her near her friends, even when " +
        "it's unsafe. There, safety wins, and someone she trusts explains why.",
    },
    {
      id: "consultFirst",
      kind: "textarea",
      rows: 3,
      label: "Who should the trustee talk with before big decisions?",
      help: "The people who know {name} well enough to be a reality check, and any professionals worth the fee.",
    },
  ],
};
