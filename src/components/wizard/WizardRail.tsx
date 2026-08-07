"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { sectionDefs } from "@/lib/content/sections";
import { displayName, fillName, sectionHasContent, startedCount } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { cn } from "@/lib/cn";

export function ProgressNote() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const total = sectionDefs.length;
  const count = hydrated ? startedCount(data) : 0;

  return (
    <div className="mb-4">
      <p className="text-sm text-muted">
        {count === 0
          ? "Start anywhere. Every question is optional."
          : `You've added notes to ${count} of ${total} sections.`}
      </p>
      <div aria-hidden="true" className="mt-2 h-1 rounded-full bg-line">
        <div
          className="h-1 rounded-full bg-gold transition-[width] motion-reduce:transition-none"
          style={{ width: `${Math.round((count / total) * 100)}%` }}
        />
      </div>
      {count === total ? (
        <p className="mt-2 text-sm text-success">
          Every section has notes. A yearly review keeps it trustworthy.
        </p>
      ) : null}
    </div>
  );
}

export function SectionNav() {
  const pathname = usePathname();
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const name = displayName(data);

  return (
    <nav aria-label="Letter sections">
      <ol className="space-y-0.5">
        {sectionDefs.map((def) => {
          const href = `/letter/${def.slug}`;
          const current = pathname === href;
          const started = hydrated && sectionHasContent(data, def);
          return (
            <li key={def.slug}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-md border-l-2 px-2.5 py-1.5 text-[0.92rem]",
                  current
                    ? "border-gold bg-goldtint text-ink"
                    : "border-transparent text-body hover:bg-paper2 hover:text-ink"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "w-5 shrink-0 text-right font-serif text-sm tabular-nums",
                    current ? "text-golddeep" : "text-faint"
                  )}
                >
                  {def.number}
                </span>
                <span className="min-w-0 flex-1">
                  {fillName(def.navTitle, name)}
                  {def.optionalTag ? <span className="text-faint"> (optional)</span> : null}
                </span>
                {started ? (
                  <>
                    <span aria-hidden="true" className="size-1.5 shrink-0 rounded-full bg-gold" />
                    <span className="sr-only">, has notes</span>
                  </>
                ) : null}
              </Link>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}

export function WizardRail() {
  return (
    <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pb-4 pr-1">
      <ProgressNote />
      <SectionNav />
      <div className="mt-5 space-y-1 border-t border-line pt-4">
        <Link
          href="/letter/review"
          className="flex min-h-11 items-center rounded-md px-2.5 text-[0.92rem] font-semibold text-accent hover:bg-paper2"
        >
          Review &amp; download →
        </Link>
        <Link
          href="/your-data"
          className="flex min-h-11 items-center rounded-md px-2.5 text-[0.92rem] text-muted hover:bg-paper2 hover:text-ink"
        >
          Back up or delete your data
        </Link>
      </div>
    </div>
  );
}

export function MobileSections() {
  return (
    <details className="print-hide mb-6 rounded-lg border border-line bg-surface lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-2.5 font-medium text-ink [&::-webkit-details-marker]:hidden">
        Sections
        <span aria-hidden="true" className="text-muted">
          ▾
        </span>
      </summary>
      <div className="border-t border-line p-3">
        <ProgressNote />
        <SectionNav />
        <div className="mt-3 border-t border-line pt-3">
          <Link
            href="/letter/review"
            className="flex min-h-11 items-center rounded-md px-2.5 text-[0.92rem] font-semibold text-accent"
          >
            Review &amp; download →
          </Link>
        </div>
      </div>
    </details>
  );
}
