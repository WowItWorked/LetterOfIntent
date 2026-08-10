import type { Metadata } from "next";
import Link from "next/link";
import { PathChooser } from "@/components/letter/PathChooser";
import { StartButtons } from "@/components/letter/StartButtons";
import { ResumeCard } from "@/components/home/ResumeCard";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Create your letter",
  description:
    "Two sets of questions — one for a loved one with disabilities, one for anyone " +
    "you care for. Read every question before you write a word.",
  alternates: { canonical: "/letter" },
};

export default function LetterLandingPage() {
  return (
    <div
      className="mx-auto w-full"
      style={{
        maxWidth: "var(--container)",
        padding: "clamp(36px, 5vw, 72px) var(--gutter) 80px",
      }}
    >
      {/* ------------------------------------------------------ header panel */}
      <div
        className="rounded-[var(--radius-md)]"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          boxShadow: "var(--shadow-md)",
          padding: "clamp(26px, 3.4vw, 44px) clamp(24px, 3.4vw, 44px)",
        }}
      >
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
          Create your letter
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
          Create your Letter of Intent
        </h1>
        <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
          Two sets of questions, because two situations are not the same. Pick the one
          that fits the person you care for, read exactly what it will ask, and begin.
          Nothing is required, and you can start the other set at any time.
        </p>
        <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
          It saves as you go, on this device only. About 45–90 minutes in total, in as
          many sittings as you need.
        </p>
      </div>

      {/* Returning visitors land here from the header's Start now, so the
          letter already on this device has to be reachable in one click. */}
      <ResumeCard />

      <PathChooser />

      {/* --------------------------------------------------------- begin card */}
      <section
        className="mt-11 overflow-hidden rounded-[var(--radius-md)] border border-gold400 bg-surface"
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
        <div style={{ padding: "32px clamp(24px, 3vw, 40px) 34px" }}>
          <Eyebrow>Begin</Eyebrow>
          <h2 className="mt-3 font-serif text-[clamp(1.6rem,3.4vw,2.1rem)] font-semibold text-ink">
            Start with ten minutes.
          </h2>
          <p className="mt-3 max-w-[70ch] leading-[1.7]">
            You do not have to do this all at once, or do it perfectly. A letter with
            three sections filled in is worth more to a future caregiver than the perfect
            letter that never gets written.
          </p>
          <StartButtons />
          <p className="mt-[18px] text-[0.9375rem] text-muted">
            No account and no email address. It saves on this device as you go, and you
            can{" "}
            <Link href="/your-data" className="underline underline-offset-[3px]">
              download a backup file
            </Link>{" "}
            at any time.
          </p>
        </div>
      </section>
    </div>
  );
}
