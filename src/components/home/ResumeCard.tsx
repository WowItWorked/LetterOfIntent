"use client";

import Link from "next/link";
import { resolveSlug, sectionsForMeta, startedCount } from "@/lib/content/config";
import { displayName, fillName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Shown only when this device already holds a letter. New visitors see
 * nothing — the onboarding below is their starting point.
 */
export function ResumeCard() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);

  const count = hydrated ? startedCount(data, meta) : 0;
  if (!hydrated || count === 0) return null;

  const sections = sectionsForMeta(meta, data);
  const total = sections.length;
  const lastVisited = meta.lastVisitedSlug ? resolveSlug(meta.lastVisitedSlug) : undefined;
  // Never reopen a session on the heaviest page: if the family closed the tab
  // in an emotional section, resume somewhere gentler, with the way back one
  // click away in the rail.
  const resume =
    lastVisited && !lastVisited.emotional ? lastVisited : (sections[0] ?? lastVisited);
  const name = displayName(data);
  if (!resume) return null;

  return (
    <div className="mt-8 rounded-[var(--radius-md)] border border-goldline bg-goldtint p-6">
      <p className="font-serif text-[1.375rem] text-ink">
        Welcome back — your letter is saved on this device.
      </p>
      <p className="mt-2 text-[0.9375rem] text-body">
        You&rsquo;ve added notes to {count} of {total} sections.
        {lastVisited && lastVisited.slug !== resume.slug ? (
          <>
            {" "}
            You were last in{" "}
            <span className="font-semibold">
              &ldquo;{fillName(lastVisited.navTitle, name)}&rdquo;
            </span>
            — a heavy page to land on first, so this picks up somewhere gentler.
          </>
        ) : (
          <>
            {" "}
            You were last in{" "}
            <span className="font-semibold">
              &ldquo;{fillName(resume.navTitle, name)}.&rdquo;
            </span>
          </>
        )}
      </p>
      {/* Equal columns, so neither of the two ways forward looks like the
          secondary one. */}
      <div
        className="mt-4 grid max-w-[560px] gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(240px, 100%), 1fr))" }}
      >
        <Link
          href={`/letter/${resume.slug}`}
          className={buttonClasses("primary", "w-full px-4 text-center")}
        >
          Pick up where you left off
        </Link>
        <Link
          href="/letter/review"
          className={buttonClasses("outline", "w-full px-4 text-center")}
        >
          Review &amp; download
        </Link>
      </div>
    </div>
  );
}
