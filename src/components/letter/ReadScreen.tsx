"use client";

import Link from "next/link";
import { LetterReading } from "@/components/letter/LetterReading";
import { buttonClasses } from "@/components/ui/Button";
import { useLetterStore } from "@/lib/store";

/**
 * /letter/read — the letter as it reads today, live from the store.
 *
 * The "see it become the letter" view from the rail: plain HTML through the
 * same renderer the review page prints with, so there is nothing heavy here.
 * No PDF machinery loads on this route; updates are ordinary React re-renders
 * of text. Reading is all this screen does — the downloads stay on Review &
 * download, one link away.
 */
export function ReadScreen() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);

  return (
    <>
      <div
        className="print-hide"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            Step back and read
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.01em] text-onink">
            Your letter so far
          </h1>
          <p className="mt-4 max-w-[66ch] text-lg leading-[1.7] text-oninkbody">
            The form asks one question at a time; this is where the answers become a
            letter. Read it the way a future caregiver will, and the gaps will tell
            you where to go next. Like everything here, it stays on your device.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Link href="/letter/review" className={buttonClasses("accent")}
              style={{ background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }}>
              Review &amp; download
            </Link>
            <Link href="/letter" className={buttonClasses("outlineOnInk")}>
              Back to writing
            </Link>
          </div>
        </div>
      </div>

      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(10px, 2vw, 24px) var(--gutter) 72px",
        }}
      >
        {hydrated ? (
          <LetterReading data={data} meta={meta} mode="live" className="mt-6" />
        ) : (
          <p className="mt-8 text-muted">Opening your letter…</p>
        )}
      </div>
    </>
  );
}
