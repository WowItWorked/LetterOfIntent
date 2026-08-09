import Link from "next/link";
import { firm } from "@/config/firm";
import { LETTER_PATHS } from "@/lib/content/paths";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { VideoPlayer } from "@/components/home/VideoPlayer";
import { ShareCard } from "@/components/share/ShareCard";

const SECTION_PAD = "clamp(64px, 8vw, 104px) var(--gutter)";

/** Anchor targets have to clear a masthead that is itself clamp()-sized. */
const ANCHOR_OFFSET = "calc(clamp(64px, 19vw, 124px) + 42px)";

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

          <Eyebrow tone="light" align="center" flanked>
            A free public tool from {firm.name}
          </Eyebrow>

          <h1
            className="mx-auto mt-[22px] max-w-[24ch] font-serif text-[clamp(2rem,6.4vw,4rem)] font-semibold leading-[1.1] tracking-[-0.015em] text-onink"
            style={{ textWrap: "pretty" }}
          >
            Write down what only you know about caring for them.
          </h1>

          <p
            className="mx-auto mt-[26px] max-w-[68ch] text-lg leading-[1.7] text-oninkbody"
            style={{ textWrap: "pretty" }}
          >
            A Letter of Intent is the guide a future caregiver, trustee, or guardian will
            rely on to care well for the person you love: the routines, the warning signs,
            the joys, the hard-won lessons. Everyone tells you to write one. This is the
            tool that helps you finish it: one small question at a time, saved as you go,
            and printed as a document you can hand to whoever comes next.
          </p>

          <div className="mx-auto mt-[38px] flex flex-col items-center gap-4">
            <div
              className="grid w-full max-w-[760px] gap-3.5"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(min(100%, 330px), 1fr))",
              }}
            >
              {/* The prototype scrolled to the chooser below; the handoff's
                  own spec sends this to /letter, which is also the only
                  version that works for someone driving by keyboard. */}
              <Link href="/letter" className={buttonClasses("ivory", "tracking-[0.06em]", "lg")}>
                <span className="tw-diamond" aria-hidden="true" />
                Start your letter · it&rsquo;s free
              </Link>
              <Link
                href="#pass-it-along"
                className={buttonClasses("outlineOnInk", "gap-2.5 tracking-[0.06em]", "lg")}
              >
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-4 flex-none fill-none stroke-current"
                  strokeWidth={1.8}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 15V4m0 0L8.5 7.5M12 4l3.5 3.5" />
                  <path d="M5 14v4.5A1.5 1.5 0 0 0 6.5 20h11a1.5 1.5 0 0 0 1.5-1.5V14" />
                </svg>
                Know someone that needs this?
              </Link>
            </div>
            <span className="text-[0.9375rem] text-navy300">
              No account. No email. About 45–90 minutes, in as many sittings as you need.
            </span>
          </div>

          <div
            className="mx-auto mt-11 flex max-w-[760px] items-start gap-3 rounded-[var(--radius-md)] border border-navy500 px-[22px] py-[18px] text-left"
            style={{ background: "rgba(255,255,255,0.045)" }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 16 16"
              className="mt-1 size-[15px] flex-none fill-gold400"
            >
              <path d="M8 1a3.5 3.5 0 0 0-3.5 3.5V6H4a1.5 1.5 0 0 0-1.5 1.5v5A1.5 1.5 0 0 0 4 14h8a1.5 1.5 0 0 0 1.5-1.5v-5A1.5 1.5 0 0 0 12 6h-.5V4.5A3.5 3.5 0 0 0 8 1Zm2 5H6V4.5a2 2 0 1 1 4 0V6Z" />
            </svg>
            <p className="text-[0.9375rem] leading-[1.65] text-[#D6DDE9]">
              Everything you type stays on this device. We never see it. There is no
              account, so a letter started here can only be continued here; download a
              backup file to move it elsewhere.{" "}
              <Link
                href="/privacy"
                className="text-gold400 underline underline-offset-[3px]"
              >
                How that works
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
                  <p className="mt-auto pt-[18px] text-xs text-faint">
                    {path.countWord} sections · about {path.minutesLabel}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="mx-auto mt-9 flex flex-col items-center gap-3.5">
            <Link
              href="/letter"
              className={buttonClasses("accent", undefined, "lg")}
              style={buttonStyle("accent")}
            >
              Create your letter
            </Link>
            <p className="text-center text-[0.9375rem] text-muted">
              See every question in both sets before you write a word.
            </p>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------ what it is + video */}
      <section style={{ padding: SECTION_PAD }}>
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
              It is free and it stays free, and whatever they write stays private on their
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
