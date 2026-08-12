import type { Metadata } from "next";
import Link from "next/link";
import { DeliverableArt } from "@/components/home/DeliverableArt";
import { QuestionCatalog } from "@/components/letter/QuestionCatalog";
import { StartButtons } from "@/components/letter/StartButtons";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "The Letter of Intent: what it is, and how it gets used",
  description:
    "A Letter of Intent is the plain-language guide a future trustee, guardian, " +
    "or caregiver relies on: routines, warning signs, who to call, what a good " +
    "day looks like. What it is, who reads it, and every question it asks. Free, " +
    "written on your device.",
  alternates: { canonical: "/letter-of-intent" },
};

/**
 * The two letters, and what each one gives up. Straight from
 * lib/pdf/projections.ts — TRUSTEE_PROJECTION drops the daily-care sections
 * outright and keeps `routine` to goodDay alone; CAREGIVER_PROJECTION cuts
 * moneyBenefits and legal to a handful of pointer fields. A family choosing
 * between them deserves to know that before they choose, not after they
 * print.
 */
const LETTERS = [
  {
    title: "The Letter of Intent",
    who: "For the trustee",
    carries:
      "Money, benefits, and the trust. Legal authority and who decides what. Health, housing, school and work. And enough of the person that a trustee who never met them can exercise judgment.",
    thinner:
      "Daily life. Communication, behavior, allergies, the emergency plan, routines, food, and personal care are not printed here — of the day-to-day, it keeps only what a good day looks like.",
  },
  {
    title: "The Letter for the Caregiver",
    who: "For whoever provides the care",
    carries:
      "Routines, communication, behavior, health as it is actually lived, the home, allergies, the emergency plan, food, and personal care — read in a kitchen at 7am, not filed in a binder.",
    thinner:
      "Money and legal. It keeps the pointers a caregiver needs — who pays the bills, where the papers are, who holds power of attorney — and leaves the benefits and trust machinery to the trustee letter.",
  },
];

/**
 * Who ends up holding this, and what they need from it — the counterpart to
 * the emergency sheet's "where it goes". Lead phrase set apart from the rest,
 * because the reader is scanning for the person they recognise.
 */
const READERS = [
  {
    title: "The trustee",
    lead: "Money only helps if someone knows what it is for.",
    body: "A trust document says what a trustee may spend. It cannot say that the swim class on Tuesdays is the reason the week holds together, or that the aide who already knows the routine is worth keeping. The letter says it.",
  },
  {
    title: "The guardian, or whoever takes over",
    lead: "The first week is the hardest one.",
    body: "What the morning has to look like, what calms a bad hour, which foods are refused and which are non-negotiable. Everything you would have told them in person, if anyone had thought to ask you first.",
  },
  {
    title: "The sibling who steps in",
    lead: "Usually the person who inherits the job, rarely the one who was taught it.",
    body: "They grew up beside it and still do not know the medication schedule, the pharmacy, or which doctor actually returns calls. Written down once, it stops being something they have to reconstruct.",
  },
  {
    title: "A new doctor, school, or program",
    lead: "Handed across the desk at intake.",
    body: "The history behind the chart: how pain gets communicated, what a meltdown is actually signalling, what has already been tried and did not work.",
  },
  {
    title: "You, a year from now",
    lead: "The only written record of what you decided, and why.",
    body: "Read it every year and update what has changed. Most families find the second pass easier than the first — the blank page is already gone.",
  },
];

/** The three-step how-it-works trio: what using the builder actually involves. */
const HOW_IT_WORKS = [
  {
    numeral: "A.",
    title: "Answer what you can",
    body: "Short sections, every question optional. Jump around. A ten-minute sitting is a real contribution.",
  },
  {
    numeral: "B.",
    title: "It saves only on your device",
    body: (
      <>
        It saves after every answer, so you can stop mid-sentence tonight and pick it up
        on Thursday. No account and no login, so it saves in <em>this</em> browser only:
        download a backup file to switch devices.
      </>
    ),
  },
  {
    numeral: "C.",
    title: "Download the documents and your backup file",
    body: "The polished, printable letters, the one-page emergency sheet, and your care cards, plus the backup file that lets you pick the letter up again later, or on another device.",
  },
];

export default function LetterOfIntentPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — the same
          treatment as the emergency sheet and care cards pages. */}
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            The document
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            The Letter of Intent.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            The deep document: every routine, warning sign, and hard-won lesson, written
            down for whoever one day cares for someone you love. Everyone is told to
            write one. Almost nobody does, because the blank page wins.
          </p>
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            Not a will. Not a trust. Not legally binding &mdash; and that is the point.
          </p>
        </div>
      </div>

      <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>

          {/* ------------------------------------------------------ what it is */}
          <div
            className="mt-11 grid items-start gap-[clamp(30px,4vw,64px)]"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))",
            }}
          >
            <div>
              <Eyebrow>What it is</Eyebrow>
              <h2 className="mt-3.5 font-serif text-[1.75rem] font-semibold tracking-[-0.01em] text-ink">
                Everything a stranger could never guess.
              </h2>
              <p className="mt-[18px] max-w-[56ch] leading-[1.7]">
                A Letter of Intent is the plain-language companion to an estate plan or
                a special needs trust. Your attorney writes what the law needs. This is
                what a person needs: how your loved one communicates, what calms them,
                which doctor to call, what a good day looks like, and what a bad one
                asks for.
              </p>
              <p className="mt-4 max-w-[56ch] leading-[1.7]">
                No lawyer is required to write one, and no legal language belongs in it.
                It is addressed to a reader, not a court &mdash; the trustee, the
                guardian, the sibling, the aide starting on Monday. It works alongside
                the documents your attorney prepares, and replaces none of them.
              </p>
              <p className="mt-4 max-w-[56ch] leading-[1.7]">
                This tool replaces the blank page with small, answerable questions, and
                turns your answers into a document you can print, file, and hand over.
              </p>
              <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
                Free, printable, and made entirely on your device. Nothing is uploaded,
                and we never see a word.
              </p>
            </div>

            <Link
              href="/samples/letter-of-intent-disabilities"
              className="group block rounded-[var(--radius-md)] focus-visible:outline-offset-4"
            >
              <span
                className="relative block overflow-hidden rounded-[var(--radius-md)] border border-line bg-white transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] group-hover:-translate-y-[3px] group-hover:border-gold400 motion-reduce:transform-none motion-reduce:transition-none"
                style={{ aspectRatio: "16 / 12", boxShadow: "var(--shadow-sm)" }}
              >
                <span className="absolute inset-0">
                  <DeliverableArt kind="letter" />
                </span>
                <span
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-onink"
                  style={{ background: "var(--navy-800)" }}
                >
                  Open sample
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-3 flex-none fill-none stroke-current"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </span>
            </Link>
          </div>

          {/* -------------------------------------------------- the two letters */}
          <div className="mt-14">
            <div className="mb-3.5 flex justify-center">
              <Eyebrow align="center" flanked>
                Which letter you get
              </Eyebrow>
            </div>
            <h2 className="text-center font-serif text-[clamp(1.5rem,3.4vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
              One set of answers. Two letters, narrowed for their readers.
            </h2>
            <p className="mx-auto mt-4 max-w-[72ch] text-center text-lg leading-[1.7] text-muted">
              The first question you are asked is who this letter has to reach. It is the
              one answer that decides which letters you get &mdash; and each one is
              deliberately thinner in one place, because a trustee should not have to
              read sixty pages to find the benefits, and nobody reads a binder at 7am.
            </p>

            <div
              className="mt-9 grid gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
              }}
            >
              {LETTERS.map((letter) => (
                <div
                  key={letter.title}
                  className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
                  <div className="flex flex-1 flex-col px-[clamp(20px,3vw,30px)] pb-7 pt-6">
                    <span className="tw-engraved block text-[0.6875rem] tracking-[0.16em] text-accent">
                      {letter.who}
                    </span>
                    <h3 className="mt-2 font-serif text-[1.375rem] font-semibold leading-snug text-ink">
                      {letter.title}
                    </h3>
                    <p className="mt-3 text-[0.9375rem] leading-[1.7] text-body">
                      <strong className="font-semibold text-ink">What it carries.</strong>{" "}
                      {letter.carries}
                    </p>
                    <p className="mt-3.5 border-l-2 border-goldline pl-3.5 text-[0.9375rem] leading-[1.65] text-muted">
                      <strong className="font-semibold text-ink">Where it is thinner.</strong>{" "}
                      {letter.thinner}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            <p className="mx-auto mt-6 max-w-[76ch] text-center text-[0.9375rem] leading-[1.7] text-muted">
              Choose both and nothing is thinned &mdash; you write one extra section, and
              each reader still gets only what they need. Whichever you pick, nothing you
              write is discarded: the answers a letter does not print still feed the
              emergency sheet and the care cards, and you can add the second letter at any
              time and have it fill itself in from what is already there.
            </p>
          </div>

          {/* ----------------------------------------------------- who reads it */}
          <div className="mt-14">
            <div className="mb-3.5 flex justify-center">
              <Eyebrow align="center" flanked>
                How it gets used
              </Eyebrow>
            </div>
            <h2 className="text-center font-serif text-[clamp(1.5rem,3.4vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
              Written once. Read by everyone who steps in.
            </h2>
            {/* Divided rows rather than a card grid: five cards always leave an
                orphan on the second line, and a stack reads top to bottom the
                way the reader arrives at their own row. */}
            <ul
              className="mt-9 list-none divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-0"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              {READERS.map((reader, i) => (
                <li
                  key={reader.title}
                  className="flex flex-col gap-2 px-[clamp(20px,3vw,34px)] py-6 sm:grid sm:gap-x-8"
                  style={{ gridTemplateColumns: "minmax(180px, 240px) 1fr" }}
                >
                  <div>
                    {/* text-accent, not gold600: at 13px this is small text and
                        the lighter gold misses 4.5:1 on white. */}
                    <span
                      aria-hidden="true"
                      className="tw-engraved block text-[13px] tracking-[0.14em] text-accent"
                    >
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <h3 className="mt-1 font-serif text-[1.375rem] font-semibold leading-snug text-ink">
                      {reader.title}
                    </h3>
                  </div>
                  {/* text-body, not text-muted: at 15px muted misses 4.5:1. */}
                  <p className="self-center text-[0.9375rem] leading-[1.7] sm:border-l sm:border-line sm:pl-8">
                    <strong className="font-semibold text-ink">{reader.lead}</strong>{" "}
                    <span className="text-body">{reader.body}</span>
                  </p>
                </li>
              ))}
            </ul>
          </div>

          {/* ------------------------------------ what it asks, before you start */}
          <div className="mt-14">
            <QuestionCatalog />
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/letter"
              className={buttonClasses("accent", undefined, "lg")}
              style={buttonStyle("accent")}
            >
              Start your letter
            </Link>
            <p className="text-[0.9375rem] text-muted">
              It comes with{" "}
              <Link
                href="/emergency-sheet"
                className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
              >
                a one-page emergency sheet
              </Link>{" "}
              and{" "}
              <Link
                href="/care-cards"
                className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
              >
                a set of care cards
              </Link>
              , from the same answers.
            </p>
          </div>
        </div>
      </div>

      {/* ------------------------------------- how it works, closing the page. */}
      <section
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(56px, 7.5vw, 96px) var(--gutter)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <div className="mx-auto max-w-[760px] text-center">
            <Eyebrow tone="light" align="center" flanked>
              How it works
            </Eyebrow>
            <h2 className="mt-5 font-serif text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
              Start with ten minutes.
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-[1.7] text-oninkbody">
              You don&rsquo;t have to do this all at once, and you don&rsquo;t have to do
              it perfectly. A letter with three sections filled in is already worth more
              to a future caregiver than the perfect letter that never got written.
            </p>
          </div>

          <ol
            className="mx-auto mt-11 grid max-w-[1080px] list-none gap-5 p-0 text-left"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            }}
          >
            {HOW_IT_WORKS.map((step) => (
              <li
                key={step.numeral}
                className="rounded-[var(--radius-md)] border border-navy500 px-7 pb-7 pt-6"
                style={{ background: "rgba(255,255,255,0.045)" }}
              >
                <span
                  aria-hidden="true"
                  className="tw-engraved block text-[28px] tracking-[0.06em] text-gold400"
                >
                  {step.numeral}
                </span>
                <h3 className="mt-2 font-serif text-[1.25rem] font-semibold text-onink">
                  {step.title}
                </h3>
                <p className="mt-2 text-[0.9375rem] leading-[1.7] text-oninkbody">
                  {step.body}
                </p>
              </li>
            ))}
          </ol>

          <div className="mx-auto mt-[30px] max-w-[640px]">
            <StartButtons />
            <p className="mt-[18px] text-center text-[0.9375rem] leading-[1.65] text-oninkbody">
              No account and no email address. It saves on this device as you go, and
              you can{" "}
              <Link
                href="/your-data"
                className="font-semibold text-gold400 underline underline-offset-[3px] hover:text-gold300"
              >
                download a backup file
              </Link>{" "}
              at any time.
            </p>
          </div>
        </div>
      </section>
    </>
  );
}
