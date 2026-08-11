import Link from "next/link";
import { sectionsForMeta } from "@/lib/content/config";
import { readingGaps } from "@/lib/content/reading-gaps";
import type { FieldDef, SectionDef } from "@/lib/content/types";
import {
  displayName,
  fieldHasContent,
  fillName,
  formatDateLong,
  formatItemValue,
  itemHasContent,
  letterDateIso,
  readerName,
  sectionHasContent,
} from "@/lib/derive";
import { projects, type LetterProjection } from "@/lib/pdf/projections";
import type { LetterData, LetterMeta } from "@/lib/schema";

/**
 * The letter as continuous reading — one renderer behind every HTML
 * presentation of the letter (§2.6d.6: HTML approximation, one renderer).
 *
 * Modes:
 * - "print" (the review page): only sections with content render, and the
 *   sections still without notes gather in a chip panel below — the view a
 *   family prints as a fallback copy.
 * - "live" (/letter/read): the letter taking shape. Filled sections render
 *   exactly as in print mode; an open section shows a gentle gap line naming
 *   what a reader would not yet know, with the way to go write it. A section
 *   marked not-applicable is a decision, not a gap — it shows nothing at all.
 *   Gap cards are print-hidden, so even this view prints as a clean letter.
 *
 * `projection` optionally narrows the reading to one output's field set
 * (TRUSTEE_PROJECTION / CAREGIVER_PROJECTION); without it the whole letter
 * reads. Data flows in as props only — this component never touches the
 * store, so the sample fixtures could read through it too.
 */
export function LetterReading({
  data,
  meta,
  projection,
  mode = "print",
  className,
}: {
  data: LetterData;
  meta: LetterMeta;
  projection?: LetterProjection;
  mode?: "print" | "live";
  className?: string;
}) {
  const inPlay = sectionsForMeta(meta, data).filter(
    (d) => !projection || projection[d.key]
  );
  const name = readerName(data);
  const included = inPlay.filter((d) => sectionHasContent(data, d));
  // A section the family marked not-applicable is not a gap — it is a
  // decision, and nagging about it would call their answer unfinished.
  const missing = inPlay.filter(
    (d) => !sectionHasContent(data, d) && data.marks?.[d.key] !== "not_applicable"
  );
  const author = data.gettingStarted?.authorName?.trim();
  const fullName = data.gettingStarted?.subjectFullName?.trim() || name;
  const dateLong = formatDateLong(letterDateIso(data));

  // The live view walks the roster in reading order, filled and open
  // interleaved; the letter's section numbers count only what is written.
  let number = 0;

  return (
    <section aria-labelledby="reading-title" className={className}>
      <div
        className="tw-card print-hide"
        style={{ borderRadius: "var(--radius-md) var(--radius-md) 0 0" }}
      >
        <div style={{ padding: "26px clamp(24px, 2.6vw, 36px) 28px" }}>
          <p className="tw-engraved text-xs tracking-[0.16em] text-accent">
            The letter itself
          </p>
          <h2 id="reading-title" className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">
            {mode === "live" ? "Your letter, as it reads today" : "Read it through"}
          </h2>
          <p className="mt-2 max-w-[60ch] text-[0.9375rem] text-muted">
            {mode === "live"
              ? "Everything you have written so far, the way a future reader will meet it. The quiet notes in between name what a reader would not yet know."
              : "Everything you’ve written, in one place, exactly as it appears in the PDF. This view also prints cleanly if you ever need a copy without it."}
          </p>
        </div>
      </div>

      <div className="rounded-b-[var(--radius-md)] border border-t-0 border-line bg-surface px-[clamp(20px,2.6vw,36px)] pb-10 pt-8 font-serif">
        <div className="border-b-2 border-gold500 pb-6 text-center">
          <p className="tw-engraved text-xs tracking-[0.2em] text-accent">
            Letter of Intent
          </p>
          <p className="mt-2 text-[2.25rem] text-ink">{fullName}</p>
          {author ? <p className="mt-2 italic text-muted">Written by {author}</p> : null}
          {dateLong ? (
            <p className="mt-1 font-sans text-[0.9375rem] text-muted">
              Last updated {dateLong}
            </p>
          ) : null}
        </div>

        {mode === "live"
          ? inPlay.map((d) => {
              if (sectionHasContent(data, d)) {
                number += 1;
                return (
                  <ReadingSection
                    key={d.slug}
                    def={d}
                    data={data}
                    name={name}
                    number={number}
                    projection={projection}
                  />
                );
              }
              if (data.marks?.[d.key] === "not_applicable") return null;
              return <ReadingGap key={d.slug} def={d} data={data} />;
            })
          : included.map((d, i) => (
              <ReadingSection
                key={d.slug}
                def={d}
                data={data}
                name={name}
                number={i + 1}
                projection={projection}
              />
            ))}
      </div>

      {mode === "print" && missing.length > 0 ? (
        <div className="print-hide mt-6 rounded-[var(--radius-md)] border border-line bg-paper2 p-5">
          <h3 className="font-sans text-base font-semibold text-ink">
            Sections without notes yet
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.map((d) => (
              <li key={d.slug}>
                <Link
                  href={`/letter/${d.slug}`}
                  className="inline-flex min-h-11 items-center rounded-[var(--radius-sm)] border border-line bg-surface px-3 text-[0.9375rem] text-body hover:text-ink"
                >
                  {fillName(d.navTitle, displayName(data))}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

/** The gentle gap: what a reader would not yet know, and the way to write it. */
function ReadingGap({ def, data }: { def: SectionDef; data: LetterData }) {
  const display = displayName(data);
  const line = readingGaps[def.slug];
  return (
    <div className="print-hide mt-8 rounded-[var(--radius-sm)] border border-dashed border-line bg-paper2 px-5 py-4 font-sans">
      <p className="text-[0.9375rem] italic leading-[1.65] text-muted">
        {line ? fillName(line, display) : `Nothing here yet under “${fillName(def.navTitle, display)}”.`}
      </p>
      <Link
        href={`/letter/${def.slug}`}
        className="mt-1.5 inline-flex min-h-9 items-center text-[0.9375rem] font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
      >
        Write {fillName(def.navTitle, display)} →
      </Link>
    </div>
  );
}

function ReadingSection({
  def,
  data,
  name,
  number,
  projection,
}: {
  def: SectionDef;
  data: LetterData;
  name: string;
  number: number;
  projection?: LetterProjection;
}) {
  const values = (data[def.key] ?? {}) as Record<string, unknown>;
  const filled = def.fields.filter(
    (f) =>
      fieldHasContent(values, f) &&
      (!projection || projects(projection, def.key, f.id))
  );
  return (
    <section className="print-section mt-10">
      <h3 className="flex items-baseline gap-3 border-b border-line pb-2 text-2xl text-navydeep">
        <span aria-hidden="true" className="text-base text-accent">
          {number}.
        </span>
        {fillName(def.title, name)}
      </h3>
      <dl className="mt-4 space-y-5">
        {filled.map((field) => (
          <ReadingField key={field.id} field={field} values={values} name={name} />
        ))}
      </dl>
    </section>
  );
}

function ReadingField({
  field,
  values,
  name,
}: {
  field: FieldDef;
  values: Record<string, unknown>;
  name: string;
}) {
  const label = fillName(field.label, name);

  if (field.kind === "repeater") {
    const items = (values[field.id] as Array<Record<string, unknown>>).filter((it) =>
      itemHasContent(it)
    );
    return (
      <div>
        <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
          {label}
        </dt>
        <dd className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
          {items.map((item, i) => (
            <div
              key={i}
              className="rounded-[var(--radius-sm)] border border-line bg-paper2 p-3.5 text-[0.98rem]"
            >
              {field.itemFields
                .filter((f) => f.kind !== "checkbox")
                .map((f) => {
                  const v = formatItemValue(f, item[f.id]);
                  if (!v) return null;
                  return (
                    <p key={f.id} className="mt-0.5 first:mt-0">
                      <span className="font-sans text-[0.7rem] font-semibold uppercase tracking-wider text-faint">
                        {fillName(f.label, name)}{" "}
                      </span>
                      <span className="whitespace-pre-wrap">{v}</span>
                    </p>
                  );
                })}
              {field.itemFields
                .filter((f) => f.kind === "checkbox" && item[f.id] === true)
                .map((f) => (
                  <p
                    key={f.id}
                    className="mt-1.5 font-sans text-xs font-semibold text-accent"
                  >
                    ◆ {fillName(f.label, name).replace(/( — |: ).*/, "")}
                  </p>
                ))}
            </div>
          ))}
        </dd>
      </div>
    );
  }

  const raw = String(values[field.id] ?? "").trim();
  const value = field.kind === "date" ? (formatDateLong(raw) ?? raw) : raw;
  return (
    <div>
      <dt className="font-sans text-xs font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 max-w-[66ch] whitespace-pre-wrap text-[1.02rem] leading-relaxed text-ink">
        {value}
      </dd>
    </div>
  );
}
