import Link from "next/link";
import { firm } from "@/config/firm";
import { buttonClasses } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VideoPlayer } from "@/components/home/VideoPlayer";
import { ShareCard } from "@/components/share/ShareCard";
import { PadlockIcon } from "@/components/ui/PadlockIcon";

// Trimmed 25% from clamp(64px, 8vw, 104px) at the owner's request — the page
// reads as one flow, not a stack of separate landings.
const SECTION_PAD = "clamp(48px, 6vw, 78px) var(--gutter)";

/**
 * Where an anchored section comes to rest.
 *
 * Offsetting by the masthead's own height is the obvious move and the wrong
 * one: these sections carry 56–104px of top padding, so the padding then
 * stacks *below* the masthead and opens a dead band — measured at 141px — of
 * empty page before anything readable. Subtracting that padding back out lets
 * it slide up behind the masthead instead, which is what puts the heading near
 * the top of the screen.
 *
 * Both terms are the site's own clamps, so the result tracks the masthead as
 * it shrinks: it holds the first line ~27px under the header at every width
 * from 375px up, rather than being right at one size and wrong at the rest.
 */
const ANCHOR_OFFSET =
  "calc(clamp(64px, 19vw, 124px) - clamp(48px, 6vw, 78px) + 52px)";

/**
 * The path from blank page to handoff, in four beats. Step IV is the point of
 * the whole tool — the documents only matter once they reach the people who
 * will use them — so it names real recipients rather than "share as needed".
 */
const PROCESS = [
  {
    numeral: "I",
    title: "Pick your letter",
    bullets: [
      "One written for disabilities and special needs",
      "One for anyone you care for: an aging parent, a spouse",
      "All are free; start the other at any time",
    ],
  },
  {
    numeral: "II",
    title: "Fill out the form",
    bullets: [
      "Short sections, every question optional",
      "Saves on your device after every answer",
      "Ten minutes at a time is enough",
    ],
  },
  {
    numeral: "III",
    title: "Download all four",
    bullets: [
      "The Letter of Intent",
      "The Emergency Information Sheet",
      "Your Care Cards",
      "Your backup file, so you can come back and edit anytime",
      "Print them, file them, save them to your phone",
    ],
  },
  {
    numeral: "IV",
    title: "Hand them to the right people",
    bullets: [
      "The letter goes to the trustee, the guardian, the sibling who steps in",
      "The emergency sheet goes on the fridge, to the school office, to the ER",
      "The cards go to the sitter, the respite worker, the family group chat",
      "Update annually",
    ],
  },
];

/**
 * The three deliverables. The tiles carry stylized vignettes rather than
 * screenshot crops — page-one thumbnails read as visual noise at this size,
 * and the real samples are one click away on each deliverable's page.
 */
const DELIVERABLES = [
  {
    title: "The Letter of Intent",
    blurb:
      "The deep document: every routine, warning, and hard-won lesson, laid out for the trustee, guardian, or sibling who takes over.",
    href: "/letter",
    cta: "Learn more",
    art: "letter" as const,
  },
  {
    title: "The Emergency Information Sheet",
    blurb:
      "One page with the essentials: allergies, medications, who to call. For the fridge, the school office, the sitter, the ER.",
    href: "/emergency-sheet",
    cta: "Learn more",
    art: "sheet" as const,
  },
  {
    title: "The Care Cards",
    blurb:
      "Pocket-size cards, one topic each, sized for a phone screen. Save them to your photos and message one to whoever is stepping in tonight.",
    href: "/care-cards",
    cta: "See them in action",
    art: "cards" as const,
  },
];

/**
 * Calm, brand-drawn stands-ins for the three deliverables: shapes and the
 * house palette only, nothing legible. Decorative — each tile's heading and
 * blurb carry the meaning, so the art is hidden from assistive tech.
 */
function DeliverableArt({ kind }: { kind: "letter" | "sheet" | "cards" }) {
  if (kind === "letter") {
    return (
      <div aria-hidden="true" className="flex h-full items-center justify-center bg-paper2">
        <div
          className="w-[44%] rounded-[6px] border border-line bg-white px-[6%] py-[7%]"
          style={{ boxShadow: "var(--shadow-md)", aspectRatio: "8.5 / 11" }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblem-envelope.png" alt="" className="mx-auto w-[46%]" />
          <div
            className="mx-auto mt-[8%] h-[3px] w-[54%]"
            style={{ background: "var(--gradient-gold)" }}
          />
          <div className="mx-auto mt-[7%] h-[5px] w-[72%] rounded-full bg-line" />
          <div className="mx-auto mt-[5%] h-[5px] w-[62%] rounded-full bg-line" />
        </div>
      </div>
    );
  }
  if (kind === "sheet") {
    return (
      <div aria-hidden="true" className="flex h-full items-center justify-center bg-paper2">
        <div
          className="w-[52%] overflow-hidden rounded-[6px] border border-line bg-white"
          style={{ boxShadow: "var(--shadow-md)", aspectRatio: "11 / 8.5" }}
        >
          <div className="h-[22%] bg-navy800" />
          <div className="grid grid-cols-2 gap-[6%] p-[7%]">
            <div>
              <div className="h-[5px] w-[85%] rounded-full bg-line" />
              <div className="mt-[9%] h-[5px] w-[70%] rounded-full bg-line" />
            </div>
            <div>
              <div className="h-[5px] w-[80%] rounded-full bg-line" />
              <div className="mt-[9%] h-[5px] w-[65%] rounded-full bg-line" />
            </div>
            <div
              className="col-span-2 rounded-[4px] px-[4%] py-[3.5%]"
              style={{ background: "var(--danger-bg, #f7e9e9)" }}
            >
              <div
                className="h-[5px] w-[46%] rounded-full"
                style={{ background: "var(--card-emergency)", opacity: 0.55 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="relative h-full bg-paper2">
      {(
        [
          ["var(--card-identity)", "-14%", "rotate(-8deg)"],
          ["var(--card-meds)", "14%", "rotate(8deg)"],
          ["var(--card-emergency)", "0%", "none"],
        ] as const
      ).map(([color, shift, rotate]) => (
        <div
          key={color}
          className="absolute left-1/2 top-1/2 w-[26%] overflow-hidden rounded-[7px] border border-line bg-white"
          style={{
            aspectRatio: "9 / 16",
            transform: `translate(calc(-50% + ${shift === "0%" ? "0px" : shift}), -50%) ${
              rotate === "none" ? "" : rotate
            }`,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="h-[30%]" style={{ background: color }} />
          <div className="p-[10%]">
            <div className="h-[4px] w-[80%] rounded-full bg-line" />
            <div className="mt-[12%] h-[4px] w-[62%] rounded-full bg-line" />
            <div className="mt-[12%] h-[4px] w-[72%] rounded-full bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}

const WHO_NEEDS_IT = [
  "A parent in your support group who keeps meaning to start",
  "The sibling who will one day take over, and knows it",
  "A teacher, a case manager, or a support group that meets families early",
  "Anyone caring for an aging parent who has never written any of it down",
];

export default function HomePage() {
  return (
    <>
      {/* ------------------------------------------------------------- hero */}
      <section
        className="tw-panel-navy"
        style={{ padding: "clamp(48px, 6.75vw, 87px) var(--gutter) clamp(54px, 7.5vw, 93px)" }}
      >
        <div className="mx-auto max-w-[1040px] text-center">
          {/* Constrained to the button stack's width so the hero's furniture
              shares one visual column. */}
          <div className="tw-rule--center mx-auto mb-7 max-w-[760px] opacity-80">
            <span className="tw-diamond" aria-hidden="true" />
          </div>

          <Eyebrow tone="light" align="center" diamonds={false}>
            A free, private Letter of Intent Builder from {firm.name}
          </Eyebrow>

          <h1
            className="mx-auto mt-[22px] max-w-[24ch] font-serif text-[clamp(2rem,6.4vw,4rem)] font-semibold leading-[1.1] tracking-[-0.015em] text-onink"
            style={{ textWrap: "pretty" }}
          >
            Write down what only you know, so they&rsquo;ll be cared for the way that only
            you have.
          </h1>

          <p
            className="mx-auto mt-[26px] max-w-[68ch] text-lg leading-[1.7] text-oninkbody"
            style={{ textWrap: "pretty" }}
          >
            A Letter of Intent is the guide a future caregiver, trustee, or guardian will
            rely on to care well for the person you love: the routines, the warning signs,
            the joys, the hard-won lessons. Everyone tells you to write one. This is the
            tool that helps you finish it, one small question at a time, saved as you go,
            until it becomes a document you can print and hand to the person who takes
            over.
          </p>

          {/*
            One ask, then two answers.

            A secondary hero button is pressed by the people who are not ready
            to start, and the old one asked them to share a tool they had not
            seen yet — the one thing that group cannot honestly do. These two
            answer the questions that actually stand between them and starting:
            what do I end up with, and what is this thing? Sharing has not been
            lost; it still sits in the header, the footer, the section further
            down this page, and on the screen after the download.
          */}
          <div className="mx-auto mt-[38px] flex w-full max-w-[760px] flex-col items-center gap-3.5">
            {/* The prototype scrolled to the chooser below; the handoff's
                own spec sends this to /letter, which is also the only
                version that works for someone driving by keyboard. */}
            <Link
              href="/letter"
              className={buttonClasses("ivory", "w-full tracking-[0.06em]", "lg")}
            >
              <span className="tw-diamond" aria-hidden="true" />
              Start your letter · it&rsquo;s free
            </Link>

            <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-3">
              <Link
                href="#what-you-get"
                className={buttonClasses("outlineOnInk", "w-full gap-2.5 tracking-[0.06em]")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 flex-none fill-none stroke-current"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M6 3h8l4 4v14a1 1 0 0 1-1 1H6a1 1 0 0 1-1-1V4a1 1 0 0 1 1-1Z" />
                  <path d="M14 3v4h4M8.5 12h7M8.5 16h4.5" />
                </svg>
                See samples
              </Link>
              <Link
                href="#the-process"
                className={buttonClasses("outlineOnInk", "w-full gap-2.5 tracking-[0.06em]")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 flex-none fill-none stroke-current"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M5 6h.01M5 12h.01M5 18h.01M9.5 6H19M9.5 12H19M9.5 18H19" />
                </svg>
                The process
              </Link>
              <Link
                href="#what-it-is"
                className={buttonClasses("outlineOnInk", "w-full gap-2.5 tracking-[0.06em]")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 flex-none fill-none stroke-current"
                  strokeWidth={1.7}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <circle cx="12" cy="12" r="9" />
                  <path d="m10 8.5 5.5 3.5L10 15.5V8.5Z" />
                </svg>
                Learn more
              </Link>
            </div>
          </div>

          <div
            className="mx-auto mt-4 flex max-w-[760px] items-start gap-3 rounded-[var(--radius-md)] border border-navy500 px-[22px] py-[18px] text-left"
            style={{ background: "rgba(255,255,255,0.045)" }}
          >
            <PadlockIcon className="mt-1 size-[15px] fill-gold400" />
            <p className="text-[0.9375rem] leading-[1.65] text-[#D6DDE9]">
              <strong className="font-semibold text-white">
                No account. No email required. About 45 minutes to two hours, in as many
                sittings as you need.
              </strong>{" "}
              Your data remains on your device and is never shared.{" "}
              <Link
                href="/privacy"
                className="whitespace-nowrap font-semibold text-gold400 underline underline-offset-[3px] hover:text-gold300"
              >
                Learn more.
              </Link>
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------ what you get */}
      <section
        id="what-you-get"
        className="border-b border-line"
        style={{ padding: SECTION_PAD, scrollMarginTop: ANCHOR_OFFSET }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              What you get
            </Eyebrow>
          </div>
          <SectionHeading align="center" title="Fill out one form. Get three things back." />
          <p className="mx-auto mt-4 max-w-[860px] text-center text-lg leading-[1.7] text-muted">
            Every answer you write feeds all three: the deep document, a one-page
            emergency sheet, and a set of care cards for your phone. All of it is made
            on your device.
          </p>

          <ul
            className="mt-10 grid list-none gap-6 p-0"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
            }}
          >
            {DELIVERABLES.map((d) => (
              <li key={d.title} className="flex">
                <Link
                  href={d.href}
                  className="group flex flex-1 flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] hover:-translate-y-[3px] hover:border-gold400 focus-visible:outline-offset-4 motion-reduce:transform-none motion-reduce:transition-none"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <span
                    className="relative block overflow-hidden border-b border-line"
                    style={{ aspectRatio: "16 / 10" }}
                  >
                    <DeliverableArt kind={d.art} />
                  </span>
                  <span className="flex flex-1 flex-col px-[26px] pb-6 pt-5">
                    <h3 className="font-serif text-[1.3rem] font-semibold leading-snug text-ink group-hover:text-gold700">
                      {d.title}
                    </h3>
                    <span className="mt-2 text-[0.9375rem] leading-[1.7] text-body">
                      {d.blurb}
                    </span>
                    <span className="mt-auto flex items-center gap-1.5 pt-4 text-xs font-semibold uppercase tracking-[0.14em] text-accent">
                      {d.cta}
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
              </li>
            ))}
          </ul>

        </div>
      </section>

      {/* ------------------------------------------------------- the process */}
      <section
        id="the-process"
        className="border-b border-line bg-paper2"
        style={{ padding: SECTION_PAD, scrollMarginTop: ANCHOR_OFFSET }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              The process
            </Eyebrow>
          </div>
          <SectionHeading align="center" title="Pick. Fill. Download. Share." />
          <p className="mx-auto mt-4 max-w-[860px] text-center text-lg leading-[1.7] text-muted">
            Four steps, at your own pace. Nothing is due, and nothing leaves your
            device until you choose to share it.
          </p>

          <ol
            className="mt-10 grid list-none gap-6 p-0"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(250px, 100%), 1fr))",
            }}
          >
            {PROCESS.map((step) => (
              <li
                key={step.numeral}
                className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
                <div className="px-[26px] pb-7 pt-6">
                  <span
                    aria-hidden="true"
                    className="tw-engraved block text-[28px] tracking-[0.06em] text-gold600"
                  >
                    {step.numeral}
                  </span>
                  <h3 className="mt-2 font-serif text-[1.25rem] font-semibold text-ink">
                    {step.title}
                  </h3>
                  <ul className="mt-3 grid list-none gap-2 p-0 text-[0.9375rem] leading-[1.6] text-body">
                    {step.bullets.map((line) => (
                      <li key={line} className="flex items-start gap-[10px]">
                        <span aria-hidden="true" className="tw-diamond mt-[8px] flex-none" />
                        {line}
                      </li>
                    ))}
                  </ul>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- pass it along */}
      <section
        id="pass-it-along"
        className="border-t border-line bg-surface"
        style={{
          padding: "clamp(42px, 5.25vw, 66px) var(--gutter)",
          scrollMarginTop: ANCHOR_OFFSET,
        }}
      >
        <div
          className="mx-auto grid items-center gap-[clamp(30px,4vw,64px)]"
          style={{
            maxWidth: "var(--container)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))",
          }}
        >
          <div>
            <Eyebrow>Pass it along</Eyebrow>
            <h2 className="mt-3.5 font-serif text-[clamp(1.9rem,3.4vw,2.5rem)] font-semibold tracking-[-0.01em] text-ink">
              Someone you know needs this too.
            </h2>
            <p className="mt-[18px] max-w-[56ch] leading-[1.7]">
              Most families are told to write a Letter of Intent and never do, because the
              blank page wins. Sending the link takes ten seconds and saves someone else
              that blank page.
            </p>
            <p className="tw-engraved mt-[26px] text-xs tracking-[0.15em] text-accent">
              Who tends to need it
            </p>
            <ul className="mt-3 flex max-w-[52ch] list-none flex-col gap-[9px] p-0">
              {WHO_NEEDS_IT.map((who) => (
                <li key={who} className="flex items-start gap-[11px] leading-[1.6]">
                  <span aria-hidden="true" className="tw-diamond mt-[9px] flex-none" />
                  {who}
                </li>
              ))}
            </ul>
            <p className="mt-[22px] max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
              It is free, and whatever they write stays private on their
              own device. We never see a word of it.
            </p>
          </div>

          <ShareCard />
        </div>
      </section>

      {/* ------------------------------------------------ what it is + video */}
      <section
        id="what-it-is"
        className="tw-panel-navy"
        style={{ padding: SECTION_PAD, scrollMarginTop: ANCHOR_OFFSET }}
      >
        <div
          className="mx-auto grid items-start gap-[clamp(36px,5vw,72px)]"
          style={{
            maxWidth: "var(--container)",
            gridTemplateColumns: "repeat(auto-fit, minmax(min(360px, 100%), 1fr))",
          }}
        >
          <div>
            <Eyebrow tone="light">Plain language</Eyebrow>
            <h2 className="mt-3.5 font-serif text-[clamp(1.7rem,4.6vw,2.5rem)] font-semibold tracking-[-0.01em] text-onink">
              What is a Letter of Intent?
            </h2>
            <p className="mt-5 max-w-[60ch] leading-[1.7] text-oninkbody">
              It&rsquo;s a plain-language companion to a special needs trust and estate
              plan. It is not a legal document, and that is the point. No lawyer is
              needed. It&rsquo;s everything a future caregiver would need to know but
              could never guess: how your loved one communicates, what calms them, which
              doctor to call, what a good day looks like.
            </p>
            <p className="mt-4 max-w-[60ch] leading-[1.7] text-oninkbody">
              Most families are told to write one and never do, because a blank page is
              paralyzing. This tool replaces the blank page with small, answerable
              questions, and turns your answers into a document you can hand to a trustee,
              a sibling, a school, or an ER nurse.
            </p>
            <hr className="tw-rule mt-[30px] max-w-[120px]" />
            <p className="mt-[22px] max-w-[54ch] text-[0.9375rem] text-navy300">
              Not a will. Not a trust. Not legally binding, and not a substitute for
              either. It works alongside the plan your attorney prepares.
            </p>
          </div>

          <VideoPlayer />
        </div>
      </section>
    </>
  );
}
