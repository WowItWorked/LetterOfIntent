"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/cn";
import { sectionsForMeta, startedCount } from "@/lib/content/config";
import { resolveSectionWording } from "@/lib/content/types";
import { displayName, fillName, sectionHasContent } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";

export function ProgressNote() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  // Scope is communicated through structure, never through the clock: how
  // many sections THIS configuration asks, and how far along the family is.
  const total = sectionsForMeta(meta, data).length;
  const count = hydrated ? startedCount(data, meta) : 0;

  return (
    <div>
      <p className="tw-engraved mb-2.5 text-xs tracking-[0.2em] text-faint">
        {displayName(data) === "your loved one" ? "Your letter" : `For ${displayName(data)}`}
      </p>
      <p className="text-[0.9375rem] text-muted">
        {count === 0
          ? "Start anywhere. Every question is optional."
          : `You've added notes to ${count} of ${total} sections.`}
      </p>
      <div aria-hidden="true" className="mt-2.5 h-1 rounded-full bg-line">
        <div
          className="h-1 rounded-full transition-[width] motion-reduce:transition-none"
          style={{
            width: `${total > 0 ? Math.round((count / total) * 100) : 0}%`,
            background: "var(--gradient-gold)",
          }}
        />
      </div>
      {count === total && total > 0 ? (
        <p className="mt-2 text-[0.9375rem] text-success">
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
  const meta = useLetterStore((s) => s.meta);
  const name = displayName(data);
  const sections = sectionsForMeta(meta, data);

  return (
    <nav aria-label="Letter sections" className="mt-[22px]">
      <ol className="flex list-none flex-col gap-0.5 p-0">
        {sections.map((def, i) => {
          const href = `/letter/${def.slug}`;
          const current = pathname === href;
          const started = hydrated && sectionHasContent(data, def);
          return (
            <li key={def.slug}>
              <Link
                href={href}
                aria-current={current ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-2.5 rounded-[var(--radius-sm)] border-l-2 px-2.5 py-1.5 text-[0.9375rem]",
                  current
                    ? "border-gold500 bg-gold100 text-ink"
                    : "border-transparent text-body hover:bg-paper2 hover:text-ink"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "tw-engraved w-[2.4ch] shrink-0 text-xs tabular-nums",
                    current ? "text-accent" : "text-faint"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                <span className="min-w-0 flex-1">
                  {fillName(resolveSectionWording(def, meta).navTitle, name)}
                  {def.optionalTag ? <span className="text-muted"> (optional)</span> : null}
                </span>
                {started ? (
                  <>
                    <span
                      aria-hidden="true"
                      className="size-1.5 shrink-0 rounded-full bg-gold500"
                    />
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

function RailLinks() {
  return (
    <div className="mt-5 flex flex-col gap-0.5 border-t border-line pt-4">
      {/* The way back to the onboarding answers: changing one re-gates the
          form and never loses a word of written work. */}
      <Link
        href="/letter#answers"
        className="flex min-h-11 items-center rounded-[var(--radius-sm)] px-2.5 text-[0.9375rem] text-muted hover:bg-paper2 hover:text-ink"
      >
        Your answers (change any time)
      </Link>
      <Link
        href="/letter/review"
        className="flex min-h-11 items-center rounded-[var(--radius-sm)] px-2.5 text-[0.9375rem] font-bold text-accent hover:bg-paper2"
      >
        Review &amp; download →
      </Link>
      <Link
        href="/your-data"
        className="flex min-h-11 items-center rounded-[var(--radius-sm)] px-2.5 text-[0.9375rem] text-muted hover:bg-paper2 hover:text-ink"
      >
        Back up or delete your data
      </Link>
    </div>
  );
}

export function WizardRail() {
  return (
    <div className="sticky top-[122px] max-h-[calc(100vh-9rem)] overflow-y-auto pb-4 pr-1">
      <ProgressNote />
      <SectionNav />
      <RailLinks />
    </div>
  );
}

export function MobileSections() {
  return (
    <details className="print-hide mb-6 rounded-[var(--radius-md)] border border-line bg-surface lg:hidden">
      <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between px-4 py-2.5 font-semibold text-ink [&::-webkit-details-marker]:hidden">
        Sections
        <span aria-hidden="true" className="text-muted">
          ▾
        </span>
      </summary>
      <div className="border-t border-line p-3">
        <ProgressNote />
        <SectionNav />
        <RailLinks />
      </div>
    </details>
  );
}
