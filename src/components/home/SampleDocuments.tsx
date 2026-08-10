import Image from "next/image";
import Link from "next/link";
import type { LetterPath } from "@/lib/schema";
import { samplesForPath } from "@/lib/content/samples";

/**
 * The two example documents, inside an option card.
 *
 * Families ask "what do I actually get at the end of this?" before anything
 * else, and a list of section names does not answer it. Page one of each real
 * document does — watermarked, so nobody mistakes the example for their own
 * letter.
 *
 * These link to /samples/<slug> rather than straight at the .pdf. Whether a
 * browser opens a PDF or drops it in the downloads folder is a per-browser
 * setting; the viewer draws it on the page instead, so "see a sample" always
 * shows a sample. The PDF itself is a button away once you are there.
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
    <div className="mt-6 border-t border-line pt-5">
      <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
        See a sample
      </p>

      {/* A lone sample spans the full column so its edges line up with the
          option card above it; a pair splits the column as before. */}
      <ul
        className={`mt-3 grid list-none gap-3.5 p-0 ${
          samples.length === 1 ? "grid-cols-1" : "grid-cols-2"
        }`}
      >
        {samples.map((s) => (
          <li key={s.slug}>
            <Link
              href={`/samples/${s.slug}`}
              className="group block rounded-[var(--radius-sm)] focus-visible:outline-offset-4"
            >
              <span
                className="relative block overflow-hidden rounded-[var(--radius-sm)] border border-line bg-white transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] group-hover:-translate-y-[3px] group-hover:border-gold400 motion-reduce:transform-none motion-reduce:transition-none"
                style={{ aspectRatio: "16 / 11", boxShadow: "var(--shadow-xs)" }}
              >
                <Image
                  src={s.thumb}
                  alt={s.alt}
                  fill
                  sizes="(max-width: 700px) 45vw, 200px"
                  // A landscape crop of the top of page one. The whole page at
                  // this size is a block of grey noise — nobody can read 9pt
                  // body copy at 200px wide, so all it contributes is clutter.
                  // The masthead, the title, and the name are legible, and they
                  // are what tells you which document you are looking at.
                  className="object-cover object-top"
                />
                {/*
                  A solid light-blue bar rather than a fade: the crop ends
                  right where the sample family's name begins, and the bar
                  covers it — a sample should advertise the document, not a
                  name. It also carries the permanent "Open sample" affordance
                  that used to sit under the tile.
                */}
                <span
                  className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-onink"
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
                <span
                  aria-hidden="true"
                  className="pointer-events-none absolute inset-0 flex items-center justify-center gap-1.5 bg-[rgba(22,34,58,0.78)] text-xs font-semibold uppercase tracking-[0.14em] text-onink opacity-0 transition-opacity duration-[var(--dur-base)] group-hover:opacity-100 group-focus-visible:opacity-100 motion-reduce:transition-none"
                >
                  View sample
                  <svg
                    viewBox="0 0 24 24"
                    className="size-3 fill-none stroke-current"
                    strokeWidth={2}
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M7 17 17 7M9 7h8v8" />
                  </svg>
                </span>
              </span>

              <span className="mt-2 block text-[0.8125rem] font-semibold leading-tight text-ink group-hover:text-gold700">
                {s.label}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
