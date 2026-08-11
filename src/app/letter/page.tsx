import type { Metadata } from "next";
import Link from "next/link";
import { Onboarding } from "@/components/letter/Onboarding";
import { StartButtons } from "@/components/letter/StartButtons";
import { ResumeCard } from "@/components/home/ResumeCard";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Create your letter",
  description:
    "One set of questions that fits itself to the person you care for. A few " +
    "answers up front shape the form; read every question before you write a word.",
  alternates: { canonical: "/letter" },
};

/** The three-step "how it works" trio — moved here from the home page. */
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

export default function LetterLandingPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — the same
          edge-to-edge treatment as the home page hero, not an inset box. */}
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            Create your letter
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            Create your Letter of Intent
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            One set of questions that fits itself to the person you care for: a child
            with disabilities, an adult finding their footing, a spouse, an aging
            parent. A few answers up front shape the form. Nothing is required, and
            every answer can change later without losing a word.
          </p>
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            It saves as you go, on this device only.
          </p>
        </div>
      </div>

      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(10px, 2vw, 24px) var(--gutter) 80px",
        }}
      >
        {/* Returning visitors land here from the header's Start now, so the
            letter already on this device has to be reachable in one click. */}
        <ResumeCard />

        {/* The onboarding sequence (or, once answered, the answers card),
            plus the live question-set preview beneath it. */}
        <Onboarding />
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
