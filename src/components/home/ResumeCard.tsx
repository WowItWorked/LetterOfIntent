"use client";

import Link from "next/link";
import { sectionBySlug, sectionDefs } from "@/lib/content/sections";
import { displayName, fillName, startedCount } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Landing-page call to action: "Start" for new visitors, "Pick up where you
 * left off" when saved work exists on this device.
 */
export function ResumeCard() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const lastVisited = useLetterStore((s) => s.meta.lastVisitedSlug);

  const count = hydrated ? startedCount(data) : 0;
  const resumeDef =
    (lastVisited ? sectionBySlug(lastVisited) : undefined) ?? sectionDefs[0];
  const name = displayName(data);

  if (!hydrated || count === 0) {
    return (
      <div className="flex flex-wrap items-center gap-4">
        <Link href="/letter/getting-started" className={buttonClasses("primary", "px-7 text-base")}>
          Start your letter — it's free
        </Link>
        <span className="text-sm text-muted">
          No account. No email. About 45–90 minutes, in as many sittings as you need.
        </span>
      </div>
    );
  }

  return (
    <div className="max-w-xl rounded-xl border border-goldline bg-goldtint p-5">
      <p className="font-medium text-ink">
        Welcome back — your letter is saved on this device.
      </p>
      <p className="mt-1 text-sm text-body">
        You've added notes to {count} of {sectionDefs.length} sections. You were last in{" "}
        <span className="font-medium">“{fillName(resumeDef.navTitle, name)}.”</span>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/letter/${resumeDef.slug}`} className={buttonClasses("primary")}>
          Pick up where you left off
        </Link>
        <Link href="/letter/review" className={buttonClasses("secondary")}>
          Review &amp; download
        </Link>
      </div>
    </div>
  );
}
