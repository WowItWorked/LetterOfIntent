import Link from "next/link";
import type { LetterPath } from "@/lib/schema";
import { samplesForPath } from "@/lib/content/samples";
import { DeliverableArt } from "@/components/home/DeliverableArt";

/**
 * A sample-document card for the chooser: the brand-drawn letter vignette
 * (nothing legible, no sample-family name to hide), the navy Open-sample
 * affordance bar, and the registry's own serif title and subtitle beside it.
 *
 * These link to /samples/<slug> rather than straight at the .pdf. Whether a
 * browser opens a PDF or drops it in the downloads folder is a per-browser
 * setting; the viewer draws it on the page instead, so a sample link always
 * shows a sample. The PDF itself is a button away once you are there.
 *
 * The caller owns the strip's "See Samples" label — this component rendering
 * its own put the same engraved words above every column.
 */
export function SampleDocuments({
  path,
  letterOnly = false,
}: {
  path: LetterPath;
  /**
   * Show only the Letter of Intent sample. The chooser uses this now that the
   * emergency sheet has its own page (/emergency-sheet) carrying its sample —
   * repeating it here made the strip read as two separate forms to fill in.
   */
  letterOnly?: boolean;
}) {
  const samples = samplesForPath(path).filter(
    (s) => !letterOnly || s.slug.startsWith("letter-of-intent")
  );

  return (
    <ul className="grid list-none grid-cols-1 gap-3.5 p-0">
      {samples.map((s) => (
        <li key={s.slug}>
          <Link
            href={`/samples/${s.slug}`}
            className="group block overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] hover:-translate-y-[3px] hover:border-gold400 focus-visible:outline-offset-4 motion-reduce:transform-none motion-reduce:transition-none"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <span className="block h-[3px]" style={{ background: "var(--gradient-gold)" }} />
            <span className="flex flex-col sm:flex-row">
              <span className="relative flex aspect-[16/10] flex-none flex-col overflow-hidden border-b border-line sm:aspect-auto sm:w-[44%] sm:border-b-0 sm:border-r">
                <span className="min-h-0 flex-1">
                  <DeliverableArt kind="letter" />
                </span>
                <span
                  className="flex items-center justify-center gap-1.5 py-2.5 text-xs font-semibold uppercase tracking-[0.14em] text-onink"
                  style={{ background: "var(--navy-800)" }}
                >
                  Open sample
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 24 24"
                    className="size-3 flex-none fill-none stroke-current"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </span>
              <span className="flex min-w-0 flex-1 flex-col justify-center px-6 py-5">
                <span className="tw-engraved text-xs tracking-[0.15em] text-accent">
                  {s.detail}
                </span>
                <span className="mt-1.5 block font-serif text-[1.375rem] font-semibold leading-snug text-ink group-hover:text-gold700">
                  {s.label}
                </span>
                <span className="mt-2 block text-[0.9375rem] leading-[1.65] text-body">
                  {s.subtitle}
                </span>
              </span>
            </span>
          </Link>
        </li>
      ))}
    </ul>
  );
}
