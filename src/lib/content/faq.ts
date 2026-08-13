/**
 * The questions families actually ask about a Letter of Intent, and what the
 * planning literature answers.
 *
 * One source for two consumers: the page renders it, and the page's
 * schema.org FAQPage block is generated from the same array. Structured data
 * that is typed out separately from the visible copy drifts within a release
 * or two, and the drift is invisible — the page reads correctly while search
 * engines and assistants are served last month's answer. Generating both from
 * here means they cannot disagree.
 *
 * Written to be quotable in isolation. An assistant answering "how often
 * should I update a letter of intent" will lift one answer out and show it
 * with no page around it, so every answer has to stand up alone: no "as
 * mentioned above", no pronoun whose referent is three questions back.
 *
 * Sourced from the special-needs planning literature — the Special Needs
 * Alliance's guidance on letters of intent, the Arc's sample letters, and the
 * trust-administration writing on letters of wishes as evidence of a
 * settlor's intent. Nothing here is legal advice, and the page says so.
 */

export interface FaqItem {
  /** The question, phrased the way a family would type it. */
  q: string;
  /**
   * The answer. Kept to a few sentences: long enough to be genuinely useful
   * on its own, short enough that a person scanning for one fact finds it.
   */
  a: string;
}

export interface FaqGroup {
  /** URL fragment — stable, because these get linked to directly. */
  id: string;
  title: string;
  /** One line under the group heading, setting up what it covers. */
  lead: string;
  items: readonly FaqItem[];
}

export const FAQ_GROUPS: readonly FaqGroup[] = [
  {
    id: "what-it-is",
    title: "What a Letter of Intent is",
    lead: "The short version, and why planners keep calling it the most important document in the file.",
    items: [
      {
        q: "What is a Letter of Intent?",
        a: "A Letter of Intent is a written guide from the people who know a person best to whoever will one day be responsible for them — usually a trustee, and often a guardian or successor caregiver as well. It records the things a legal document has no room for: the daily routine, how they communicate, what calms a hard hour, which providers know the history, what a good life looks like for this particular person. It is sometimes called a letter of guidance, a memorandum of intent, or a letter of wishes.",
      },
      {
        q: "Is a Letter of Intent legally binding?",
        a: "No. A Letter of Intent is not a legal instrument and does not bind a trustee to any particular decision. It sits alongside the trust as guidance rather than instruction, which is exactly why it can say things a trust cannot — a trustee who is told what mattered to the family is far better placed to exercise the discretion the trust already gives them.",
      },
      {
        q: "If it is not binding, why does it matter?",
        a: "Because most of what a trustee needs to know is not in the trust. A trust says what money may be spent on; it does not say that noise in a waiting room is the reason appointments go badly, or that a particular aide is the one person who can get a coat on. Where a trustee's discretion is later questioned, courts have treated a settlor's written wishes as meaningful evidence of intent — but the everyday value comes long before that, in the hundreds of small decisions nobody will ever litigate.",
      },
      {
        q: "Do I still need one if I already have a special needs trust?",
        a: "Yes, and the two do different jobs. The trust controls the money and protects benefits eligibility; the Letter of Intent tells whoever administers it who the beneficiary is. Planning attorneys who work in this area routinely describe the letter as the more practically useful of the two documents on any ordinary day, precisely because the trust cannot describe a person.",
      },
      {
        q: "Who is the Letter of Intent written for?",
        a: "Primarily the trustee — the person or institution that will manage funds for your loved one after you cannot. In practice it is also read by successor guardians, adult siblings taking over, case managers, and the professional trustee's staff, who may never have met the beneficiary. Write it for a competent stranger who is trying hard and starting from nothing.",
      },
    ],
  },
  {
    id: "what-goes-in-it",
    title: "What goes in it",
    lead: "The sections that planners and pooled-trust programs ask for, and the ones families most often leave out.",
    items: [
      {
        q: "What should a Letter of Intent include?",
        a: "The standard sections are: who the person is and how to reach the people around them; medical history, diagnoses, medications, and the providers who know the file; daily routine, food, and personal care; how they communicate, including how they show pain or say no; behavior — what sets it off and what helps; housing and daily support; school, work, and programs; benefits and financial resources; legal authorities already in place; what brings them joy; and your hopes for their life. Most published templates, including the pooled-trust samples, follow close to this order.",
      },
      {
        q: "How long should it be?",
        a: "Long enough to be useful and short enough to exist. A thorough letter often runs twenty to forty pages once routines and medications are written out, but a two-page letter that covers the morning, the medications, and who to call is worth far more than the complete one that never got finished. Start with the sections a stranger would need in the first week.",
      },
      {
        q: "What do trustees say is most often missing?",
        a: "The unwritten operating knowledge: the order the morning has to happen in, the sentence that de-escalates, the food that comes back untouched if the plate is wrong, the difference between a bad day and an emergency. Families tend to record diagnoses and contact numbers, which are recoverable from records, and omit the things that exist only in their heads.",
      },
      {
        q: "Should it include financial information?",
        a: "Include the shape of the picture, not the balances. Note which benefits your loved one receives — SSI, SSDI, Medicaid, Medicare, waiver services — who handles the bills today, where the records live, and any known vulnerabilities around money. Account numbers and balances go stale quickly and belong with the estate documents, not in a letter that gets photocopied.",
      },
      {
        q: "Should my loved one help write it?",
        a: "Wherever possible, yes. Their own words about what they want carry weight nothing else does, and the exercise itself is often the first time some preferences have been asked about directly. Siblings and long-serving caregivers are worth asking too — they routinely remember routines the primary caregiver has stopped noticing.",
      },
    ],
  },
  {
    id: "keeping-it-current",
    title: "Keeping it current",
    lead: "A letter written once and never revisited is the most common failure mode.",
    items: [
      {
        q: "How often should a Letter of Intent be updated?",
        a: "Read it through once a year and update what has changed. Many families anchor the review to a fixed date — a birthday, or the same week as the annual benefits review — because a letter tied to no date is a letter that gets reviewed once.",
      },
      {
        q: "What should trigger an update sooner than the annual review?",
        a: "Any change to the facts a stranger would act on: a new medication or a stopped one, a new diagnosis, a new school, program, or job, a move, a change in who provides daily care, a new behavior or trigger, or a change to benefits or legal authority. These are the details someone will rely on in the first week, and a year is a long time to be wrong.",
      },
      {
        q: "What happens if circumstances change after I am gone?",
        a: "The letter is guidance, not a script, and a good trustee will read it that way. That is a reason to write down the why behind your preferences rather than only the what — a trustee who understands that a routine exists to prevent a specific kind of hard day can protect the intent even when the specifics have to change.",
      },
      {
        q: "How do I keep a long document from going stale?",
        a: "Update in place rather than rewriting. Date every revision, keep the most recent version wherever your estate documents live, and replace the copies you have handed out. A letter that contradicts itself between two circulating versions is worse than one that is slightly out of date.",
      },
    ],
  },
  {
    id: "who-reads-it",
    title: "Who reads it, and when",
    lead: "A document nobody can find at the moment it is needed has not been written.",
    items: [
      {
        q: "Who should have a copy?",
        a: "The trustee and any successor trustee; the guardian or the person expected to become one; the attorney who drafted the trust; and close family who would be called first in a crisis. If a pooled trust or corporate trustee is involved, ask what they want on file — many programs accept the letter and keep it with the trust record.",
      },
      {
        q: "Where should I keep it?",
        a: "With the will, the trust, and the rest of the estate plan, so it is found by whoever finds those. Tell at least two people where it is. A letter locked in a file only you can open fails at exactly the moment it was written for.",
      },
      {
        q: "When does the trustee actually read it?",
        a: "Usually at two moments: when they take over, and whenever they face a decision the trust does not settle on its own. That second case is the one families underestimate — requests to fund something unusual are far easier to approve when the file already explains why it matters to this person.",
      },
      {
        q: "Is the trustee's letter the same document a caregiver needs?",
        a: "They come from the same knowledge but they are read very differently. A trustee needs the money, the benefits, the legal picture, and enough of the person to exercise judgment. Whoever is doing the day needs the routine, the communication, and the behavior detail, at 7am, in a kitchen. Many families write both.",
      },
    ],
  },
  {
    id: "how-it-fits",
    title: "How it fits the rest of the plan",
    lead: "Where the Letter of Intent stops, and where a lawyer starts.",
    items: [
      {
        q: "Does a Letter of Intent replace a will or a trust?",
        a: "No. A Letter of Intent is not a will and not a trust, and it does not replace either one: it carries no legal authority, moves no assets, and appoints nobody. It works alongside the plan your attorney prepares, and it is the part of that plan you are best placed to write yourself.",
      },
      {
        q: "Do I need a lawyer to write one?",
        a: "You do not need a lawyer to write the letter, and the writing is genuinely yours to do — nobody else holds the knowledge. You do need one for the instruments around it: a special needs trust drafted so that an inheritance does not disqualify your loved one from benefits is legal work, and getting it wrong is expensive in a way a letter never is.",
      },
      {
        q: "What if I do not have a trust yet?",
        a: "Write the letter anyway. It costs nothing, it loses nothing if the plan changes, and families frequently find that writing it clarifies what they need to ask an attorney for. It is also the piece most likely to be postponed indefinitely while the legal work is arranged.",
      },
      {
        q: "Can I write one if I am not the parent?",
        a: "Yes. Siblings, grandparents, adult children caring for an aging parent, and long-serving caregivers all write them. The question is not what your relationship is; it is whether you hold knowledge that would be lost if you were not there to be asked.",
      },
    ],
  },
  {
    id: "getting-started",
    title: "Getting started",
    lead: "What it takes to actually finish one.",
    items: [
      {
        q: "How long does it take to write?",
        a: "Most families do not write it in one sitting, and it works better as ten minutes at a time across a few weeks. The first section is the hardest because the page is blank; after that it is recall rather than composition.",
      },
      {
        q: "What if I cannot answer everything?",
        a: "Skip it. There are no required questions, and an unanswered one is simply left out of the finished letter rather than showing as a gap. A letter covering the routine and the medications is already worth more to whoever arrives on Monday than the complete letter that never got written.",
      },
      {
        q: "What does this site produce?",
        a: "One set of questions produces a Letter of Intent for the trustee, a separate Letter for the Caregiver, a one-page emergency information sheet for the fridge, and eight care cards sized for a phone. It is free, there is no account, and everything is written on your own device — nothing you type is transmitted anywhere.",
      },
    ],
  },
];

/** Every question and answer, flattened — for the FAQPage structured data. */
export function allFaqItems(): FaqItem[] {
  return FAQ_GROUPS.flatMap((g) => g.items);
}
