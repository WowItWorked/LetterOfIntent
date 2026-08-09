import Link from "next/link";
import { firm } from "@/config/firm";
import { LETTER_PATHS } from "@/lib/content/paths";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VideoPlayer } from "@/components/home/VideoPlayer";
import { SampleDocuments } from "@/components/home/SampleDocuments";
import { ShareCard } from "@/components/share/ShareCard";
import { PadlockIcon } from "@/components/ui/PadlockIcon";

const SECTION_PAD = "clamp(64px, 8vw, 104px) var(--gutter)";

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
  "calc(clamp(64px, 19vw, 124px) - clamp(64px, 8vw, 104px) + 52px)";

const HOW_IT_WORKS = [
  {
    numeral: "I",
    title: "Answer what you can",
    body: "Fifteen short sections, every question optional. Jump around. A ten-minute sitting is a real contribution.",
  },
  {
    numeral: "II",
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
    numeral: "III",
    title: "Download the documents and your backup file",
    body: "A polished, printable Letter of Intent and a one-page emergency sheet for sitters, school, and the ER, plus the backup file that lets you pick the letter up again later, or on another device.",
  },
];

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
        style={{ padding: "clamp(64px, 9vw, 116px) var(--gutter) clamp(72px, 10vw, 124px)" }}
      >
        <div className="mx-auto max-w-[1040px] text-center">
          <div className="tw-rule--center mb-7 opacity-80">
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

            <div className="grid w-full grid-cols-1 gap-3.5 sm:grid-cols-2">
              <Link
                href="#who-this-is-for"
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
                See a sample
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
                Watch &amp; learn more
              </Link>
            </div>
          </div>

          <div
            className="mx-auto mt-11 flex max-w-[760px] items-start gap-3 rounded-[var(--radius-md)] border border-navy500 px-[22px] py-[18px] text-left"
            style={{ background: "rgba(255,255,255,0.045)" }}
          >
            <PadlockIcon className="mt-1 size-[15px] fill-gold400" />
            <p className="text-[0.9375rem] leading-[1.65] text-[#D6DDE9]">
              <strong className="font-semibold text-white">
                No account. No email. About 45–90 minutes, in as many sittings as you
                need.
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

      {/* ------------------------------------------------------- get started */}
      <section
        id="who-this-is-for"
        className="border-b border-line bg-paper2"
        style={{ padding: SECTION_PAD, scrollMarginTop: ANCHOR_OFFSET }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              Get started
            </Eyebrow>
          </div>
          <SectionHeading align="center" title="Pick your letter and get started." />
          <p className="mx-auto mt-4 max-w-[860px] text-center text-lg leading-[1.7] text-muted">
            Who you care for decides which letter you write. Both are free, both save on
            your device, and you can start the other at any time.
          </p>

          <div
            className="mt-10 grid gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            }}
          >
            {LETTER_PATHS.map((path, i) => (
              <div
                key={path.id}
                className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div
                  className="h-[3px]"
                  style={{
                    background: "var(--gradient-gold)",
                    opacity: i === 0 ? 1 : 0.55,
                  }}
                />
                <div
                  className="flex flex-1 flex-col"
                  style={{ padding: "30px clamp(24px, 3vw, 36px)" }}
                >
                  <p className="tw-engraved mb-3.5 flex items-center gap-3 text-[0.6875rem] tracking-[0.22em] text-accent">
                    Option {i + 1}
                    <span
                      aria-hidden="true"
                      className="h-px flex-1 opacity-45"
                      style={{ background: "var(--gradient-gold)" }}
                    />
                  </p>
                  <Eyebrow>{path.audience}</Eyebrow>
                  <h3 className="mt-3 font-serif text-[1.75rem] font-semibold text-ink">
                    {path.promise}
                  </h3>
                  <p className="mt-3 leading-[1.7] text-body">{path.blurb}</p>
                  <SampleDocuments path={path.id} />
                </div>
              </div>
            ))}
          </div>

          <div className="mt-9 flex justify-center">
            <Link
              href="/letter"
              className={buttonClasses("accent", undefined, "lg")}
              style={buttonStyle("accent")}
            >
              Create your letter
            </Link>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ what it is + video */}
      <section
        id="what-it-is"
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
            <Eyebrow>Plain language</Eyebrow>
            <h2 className="mt-3.5 font-serif text-[clamp(1.7rem,4.6vw,2.5rem)] font-semibold tracking-[-0.01em] text-ink">
              What is a Letter of Intent?
            </h2>
            <p className="mt-5 max-w-[60ch] leading-[1.75] text-body">
              It&rsquo;s a plain-language companion to a special needs trust and estate
              plan. It is not a legal document, and that is the point. No lawyer is
              needed. It&rsquo;s everything a future caregiver would need to know but
              could never guess: how your loved one communicates, what calms them, which
              doctor to call, what a good day looks like.
            </p>
            <p className="mt-4 max-w-[60ch] leading-[1.75] text-body">
              Most families are told to write one and never do, because a blank page is
              paralyzing. This tool replaces the blank page with small, answerable
              questions, and turns your answers into a document you can hand to a trustee,
              a sibling, a school, or an ER nurse.
            </p>
            <hr className="tw-rule mt-[30px] max-w-[120px]" />
            <p className="mt-[22px] max-w-[54ch] text-[0.9375rem] text-muted">
              Not a will. Not a trust. Not legally binding, and not a substitute for
              either. It works alongside the plan your attorney prepares.
            </p>
          </div>

          <VideoPlayer />
        </div>
      </section>

      {/* ------------------------------------------------------ how it works */}
      <section
        className="border-y border-line bg-paper2"
        style={{ padding: SECTION_PAD }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <SectionHeading align="center" eyebrow="How it works" title="Three steps, at your pace." />
          <ol
            className="mt-11 grid list-none gap-6 p-0"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))",
            }}
          >
            {HOW_IT_WORKS.map((step) => (
              <li
                key={step.numeral}
                className="overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
                <div className="px-[30px] pb-8 pt-7">
                  <span
                    aria-hidden="true"
                    className="tw-engraved block text-[30px] tracking-[0.06em] text-gold600"
                  >
                    {step.numeral}
                  </span>
                  <h3 className="mt-2.5 font-serif text-[1.375rem] font-semibold text-ink">
                    {step.title}
                  </h3>
                  <p className="mt-2.5 text-[0.9375rem] leading-[1.7] text-body">
                    {step.body}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* ----------------------------------------------------- pass it along */}
      <section
        id="pass-it-along"
        className="border-t border-line bg-paper2"
        style={{
          padding: "clamp(56px, 7vw, 88px) var(--gutter)",
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
            <p className="mt-[18px] max-w-[56ch] leading-[1.75]">
              Most families are told to write a Letter of Intent and never do, because the
              blank page wins. Sending the link takes ten seconds and saves someone else
              that blank page.
            </p>
            <p className="tw-engraved mt-[26px] text-[0.6875rem] tracking-[0.2em] text-accent">
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
            <p className="mt-[22px] max-w-[56ch] text-[0.9375rem] leading-[1.75] text-muted">
              It is free, and whatever they write stays private on their
              own device. We never see a word of it.
            </p>
          </div>

          <ShareCard />
        </div>
      </section>

      {/* ------------------------------------------------------- closing CTA */}
      <section
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(64px, 9vw, 112px) var(--gutter)",
        }}
      >
        <div className="mx-auto max-w-[760px] text-center">
          <Eyebrow tone="light" align="center" flanked>
            Start anywhere
          </Eyebrow>
          <h2 className="mt-5 font-serif text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            Start with ten minutes.
          </h2>
          <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-[1.7] text-oninkbody">
            You don&rsquo;t have to do this all at once, and you don&rsquo;t have to do it
            perfectly. A letter with three sections filled in is already worth more to a
            future caregiver than the perfect letter that never got written.
          </p>
          <div className="mt-[34px]">
            <Link href="/letter" className={buttonClasses("ivory", "tracking-[0.06em]", "lg")}>
              <span className="tw-diamond" aria-hidden="true" />
              Begin your Letter of Intent
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
