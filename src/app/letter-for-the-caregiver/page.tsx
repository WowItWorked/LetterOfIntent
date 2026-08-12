import type { Metadata } from "next";
import Link from "next/link";
import { CAREGIVER_PROJECTION } from "@/lib/pdf/projections";
import { DeliverableArt } from "@/components/home/DeliverableArt";
import { QuestionCatalog } from "@/components/letter/QuestionCatalog";
import { StartButtons } from "@/components/letter/StartButtons";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "The Letter for the Caregiver: what it is, and who reads it",
  description:
    "The day-to-day letter: routines, communication, behavior, health as it is " +
    "actually lived, written for whoever is holding it in a kitchen at 7am. " +
    "What it contains, who reads it, and every question it asks. Free, written " +
    "on your device.",
  alternates: { canonical: "/letter-for-the-caregiver" },
};

/**
 * Who ends up holding this one. Deliberately a different list from the
 * trustee letter's: these are people who arrive, do the day, and leave —
 * often without ever meeting the person who wrote it.
 */
const READERS = [
  {
    title: "Whoever arrives on Monday",
    lead: "A new aide, on their first morning, alone.",
    body: "They have a job description and a key. What they do not have is the order the morning has to happen in, or the fact that asking a question before the bus feed is checked will cost them the next hour.",
  },
  {
    title: "The respite worker, for one weekend",
    lead: "Two days is not long enough to learn any of it.",
    body: "Which foods are refused, what a hard hour looks like before it arrives, what calms it, and what makes it worse. Written down, a stranger gets a good weekend instead of a survivable one.",
  },
  {
    title: "A sibling covering while you are away",
    lead: "They grew up in the house and still do not know the routine.",
    body: "Knowing someone is not the same as running their day. The letter says the parts that were always just done, by you, without anyone writing them down.",
  },
  {
    title: "The group home or day program",
    lead: "Handed over at intake, then kept in the file.",
    body: "Staff turn over. The letter is what survives that: how they communicate, what pain looks like when they will not say it, and the difference between a bad day and an emergency.",
  },
  {
    title: "The person who takes over for good",
    lead: "One day this stops being temporary.",
    body: "The same pages that got a sitter through a Tuesday get a guardian through the first month. Nothing has to be rewritten for them; it is already there.",
  },
];

/**
 * What this letter contains, as a list rather than a paragraph.
 *
 * Someone deciding whether to write this is scanning for whether their own
 * situation is in it — "does it cover the seizures, does it cover food" — and
 * a prose block makes them read all of it to find out. A list answers at a
 * glance, and the one-line-each shape is also a fair picture of the letter's
 * own sections.
 */
const CONTAINS = [
  "Routines, and the shape of a day",
  "How they communicate, and how to talk with them",
  "Behavior: what sets it off, what helps, and what to say to a first responder",
  "Health as it is lived — medications, allergies, the emergency plan",
  "What a good day looks like, and what a hard one needs",
  "Food, personal care, and the home",
  "School or work, and the people and places that matter",
];

export default function CaregiverLetterPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — the same
          treatment as the other document pages. */}
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
            The Letter for the Caregiver.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            The day-to-day letter: routines, communication, behavior, and health as it
            is actually lived. Written to be read in a kitchen at 7am by someone who
            has to get the morning right, not filed in a binder.
          </p>
          {/* Says how this letter relates to the other one without comparing
              the samples. The sample below is the Hale family, who are
              caregiver-only and never produce a trustee letter at all, so a
              line about "the trustee's letter" pointed at nothing a visitor
              could open from this page. */}
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            One of the two letters the form can write. This one is for whoever gives
            the day-to-day care.
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
                The morning, written down before someone has to guess it.
              </h2>
              <p className="mt-[18px] max-w-[56ch] leading-[1.7]">
                Most of what keeps a day working was never written anywhere. It lives
                in the person who has always done it: the order things happen in, the
                sentence that gets a coat on, the food that goes back untouched if the
                plate is wrong. A caregiver arriving without it spends weeks
                rediscovering what you already know.
              </p>
              <p className="mt-4 max-w-[56ch] leading-[1.7]">
                This letter is that knowledge, in the order someone needs it. It is not
                a care plan and not a medical document &mdash; it is one person telling
                the next person how to do this well.
              </p>
              <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
                Free, printable, and made entirely on your device. Nothing is uploaded,
                and we never see a word.
              </p>
            </div>

            {/* The Hale family's letter, not the Ruiz one the Letter of Intent
                page shows. Both are caregiver letters; showing a different
                family here is what demonstrates that this is one form for two
                very different lives — a daughter writing about her mother,
                beside a mother writing about her adult son. */}
            <Link
              href="/samples/letter-for-the-caregiver-aging-parent"
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
              {/* Names the family before the click, and describes only what is
                  in this sample. It used to read "the same form, a different
                  life", which was written when both pages showed the Ruiz
                  family — on this page alone that contrast has no second half
                  a visitor can see, so it just reads as a claim about a letter
                  that is not here. */}
              <span className="mt-2.5 block text-[0.9375rem] leading-[1.6] text-muted">
                The Hale family: a daughter writing about her mother &mdash;{" "}
                <span className="text-body">
                  the week as it really runs, the unfinished conversations, and what
                  must never change.
                </span>
              </span>
            </Link>
          </div>

          {/* --------------------------------------------------------- the scope */}
          <div
            className="mt-12 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
            <div className="px-[clamp(20px,3vw,34px)] pb-8 pt-7">
              <h2 className="font-serif text-[1.5rem] font-semibold leading-snug text-ink">
                What it contains
              </h2>
              <ul
                className="mt-5 grid list-none gap-x-8 gap-y-3 p-0"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))",
                }}
              >
                {CONTAINS.map((line) => (
                  <li key={line} className="flex gap-3 leading-[1.6] text-body">
                    <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                    <span className="flex-1">{line}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          {/* The same panel the Letter of Intent page carries, pointed the
              other way. Someone reading about one letter has no idea the
              other exists, or fears that picking this one rules it out. */}
          <div className="mt-6 rounded-[var(--radius-md)] border border-goldline bg-goldtint px-[clamp(20px,3vw,34px)] py-6">
            <p className="mx-auto max-w-[76ch] text-center text-lg leading-[1.7] text-body">
              <strong className="font-semibold text-ink">One form can write both.</strong>{" "}
              You answer the questions once. Each letter is then written for its own
              reader, so nobody is handed the other one&rsquo;s pages &mdash; and you
              never type anything twice.
            </p>
            <p className="mt-3 text-center">
              <Link
                href="/letter-of-intent"
                className="inline-flex items-center gap-1.5 text-[0.9375rem] font-semibold text-accent underline-offset-[3px] hover:underline"
              >
                More about the Letter of Intent
                <span aria-hidden="true">&rarr;</span>
              </Link>
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
              Read by whoever has the day.
            </h2>
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
            <QuestionCatalog
              projection={CAREGIVER_PROJECTION}
              lead={
                "These are the {n} sections this letter draws from. Open any one to read " +
                "what it asks for. You will not see all of them: a few questions at the " +
                "start shape the form around the person you care for, and the sections " +
                "that do not fit are never asked. Nothing is required, and a section you " +
                "skip simply will not appear."
              }
            />
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/letter"
              className={buttonClasses("accent", undefined, "lg")}
              style={buttonStyle("accent")}
            >
              Start your letter
            </Link>
            <p className="max-w-[70ch] text-center text-[0.9375rem] leading-[1.7] text-muted">
              It also produces{" "}
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

      {/* ---------------------------------------- start, closing the page. */}
      <section
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(48px, 6.5vw, 80px) var(--gutter)",
        }}
      >
        <div className="mx-auto max-w-[760px] text-center">
          <Eyebrow tone="light" align="center" flanked>
            Start with ten minutes
          </Eyebrow>
          <h2 className="mt-5 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.015em] text-onink">
            The first section is the one that helps most.
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-[1.7] text-oninkbody">
            A caregiver letter with the morning routine and nothing else is already
            worth more to whoever arrives on Monday than the complete letter that never
            got written.
          </p>
          <StartButtons />
        </div>
      </section>
    </>
  );
}
