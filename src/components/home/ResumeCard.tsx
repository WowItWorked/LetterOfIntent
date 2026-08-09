"use client";

import Link from "next/link";
import { DEFAULT_PATH, pathDef, sectionBySlugInPath } from "@/lib/content/paths";
import { displayName, fillName, startedCount } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { buttonClasses } from "@/components/ui/Button";

/**
 * Shown only when this device already holds a letter. New visitors see
 * nothing — the chooser below is their starting point.
 */
export function ResumeCard() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);

  const path = meta.letterPath ?? DEFAULT_PATH;
  const def = pathDef(path);
  const count = hydrated ? startedCount(data, path) : 0;
  if (!hydrated || count === 0) return null;

  const resume =
    (meta.lastVisitedSlug ? sectionBySlugInPath(meta.lastVisitedSlug, path) : undefined) ??
    def.sections[0];
  const name = displayName(data);

  return (
    <div className="mt-8 rounded-[var(--radius-md)] border border-goldline bg-goldtint p-6">
      <p className="font-serif text-[1.375rem] text-ink">
        Welcome back — your letter is saved on this device.
      </p>
      <p className="mt-2 text-[0.9375rem] text-body">
        You&rsquo;ve added notes to {count} of {def.sections.length} sections of the{" "}
        {def.tabLabel.toLowerCase()} letter. You were last in{" "}
        <span className="font-semibold">
          &ldquo;{fillName(resume.navTitle, name)}.&rdquo;
        </span>
      </p>
      <div className="mt-4 flex flex-wrap gap-3">
        <Link href={`/letter/${resume.slug}`} className={buttonClasses("primary")}>
          Pick up where you left off
        </Link>
        <Link href="/letter/review" className={buttonClasses("outline")}>
          Review &amp; download
        </Link>
      </div>
    </div>
  );
}
