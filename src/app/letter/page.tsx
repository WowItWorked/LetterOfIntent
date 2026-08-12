import type { Metadata } from "next";
import Link from "next/link";
import { Onboarding } from "@/components/letter/Onboarding";
import { ResumeCard } from "@/components/home/ResumeCard";

export const metadata: Metadata = {
  title: "Create your letter",
  description:
    "One set of questions that fits itself to the person you care for. A few " +
    "answers up front shape the form, and it saves on your device as you go.",
  alternates: { canonical: "/letter" },
};

/**
 * The builder, and only the builder.
 *
 * What a Letter of Intent is, who reads it, how the tool works, and the
 * full question catalogue all live on /letter-of-intent now. Somebody who
 * arrives here has already decided; this page's whole job is to take the ten
 * onboarding answers and open the form. The one link back out is for the
 * reader who landed here without the explanation.
 */
export default function LetterBuilderPage() {
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
            It saves as you go, on this device only. New to this?{" "}
            <Link
              href="/letter-of-intent"
              className="font-semibold text-gold400 underline underline-offset-[3px] hover:text-gold300"
            >
              Read what a Letter of Intent is
            </Link>{" "}
            and every question it asks.
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

        {/* The onboarding sequence, or — once answered — the answers card. */}
        <Onboarding />
      </div>
    </>
  );
}
