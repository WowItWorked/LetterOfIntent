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
  // Three states, honestly counted: done, marked not-applicable, outstanding.
  const sections = sectionsForMeta(meta, data);
  const total = sections.length;
  const count = hydrated ? startedCount(data, meta) : 0;
  const notApplicable = hydrated
    ? sections.filter(
        (d) => !sectionHasContent(data, d) && data.marks?.[d.key] === "not_applicable"
      ).length
    : 0;
  const accounted = count + notApplicable;

  return (
    <div>
      <p className="tw-engraved mb-2.5 text-xs tracking-[0.2em] text-faint">
        {displayName(data) === "your loved one" ? "Your letter" : `For ${displayName(data)}`}
      </p>
      <p className="text-[0.9375rem] text-muted">
        {count === 0 && notApplicable === 0
          ? "Start anywhere. Every question is optional."
          : `Notes in ${count} of ${total} sections${
              notApplicable > 0
                ? `, ${notApplicable} marked not applicable`
                : ""
            }.`}
      </p>
      <div aria-hidden="true" className="mt-2.5 h-1 rounded-full bg-line">
        <div
          className="h-1 rounded-full transition-[width] motion-reduce:transition-none"
          style={{
            width: `${total > 0 ? Math.round((accounted / total) * 100) : 0}%`,
            background: "var(--gradient-gold)",
          }}
        />
      </div>
      {accounted === total && total > 0 ? (
        <p className="mt-2 text-[0.9375rem] text-success">
          Every section is accounted for. A yearly review keeps it trustworthy.
        </p>
      ) : null}
      <BackupNudge startedCount={count} />
    </div>
  );
}

/**
 * The backup nudge: once, gently, after meaningful progress, and never again
 * for this letter unless a lot of new work accumulates. localStorage is
 * evictable; the backup file is the family's only copy — that sentence is the
 * whole reason this exists.
 */
function BackupNudge({ startedCount: count }: { startedCount: number }) {
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const setMetaAnswers = useLetterStore((s) => s.setMetaAnswers);

  const dismissedAt = Number(meta.backupNudgeCount ?? "-1");
  // First nudge at three sections of real work; again after six more.
  const due = count >= 3 && (dismissedAt < 0 || count >= dismissedAt + 6);
  if (!due) return null;

  const dismiss = () => setMetaAnswers({ backupNudgeCount: String(count) });

  const download = async () => {
    const [{ serializeBackup }, { photosForBackup }, { triggerDownload }, { documentFilename }] =
      await Promise.all([
        import("@/lib/backup"),
        import("@/lib/photos"),
        import("@/lib/download"),
        import("@/lib/filenames"),
      ]);
    const photos = await photosForBackup();
    triggerDownload(
      documentFilename("backup"),
      serializeBackup(data, meta, photos),
      "application/json"
    );
    dismiss();
  };

  return (
    <div className="mt-4 rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-3.5">
      <p className="text-[0.875rem] leading-[1.6] text-body">
        Your letter stays on this device only, so a backup file is your only
        copy. Worth thirty seconds now.
      </p>
      <div className="mt-2.5 flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={() => void download()}
          className="min-h-10 rounded-[var(--radius-sm)] border border-control bg-surface px-3 text-[0.875rem] font-semibold text-accent hover:bg-goldtint"
        >
          Download backup file
        </button>
        <button
          type="button"
          onClick={dismiss}
          className="min-h-10 text-[0.875rem] text-muted underline underline-offset-[3px] hover:text-ink"
        >
          Not now
        </button>
      </div>
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
