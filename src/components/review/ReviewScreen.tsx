"use client";

import Link from "next/link";
import { useState } from "react";
import { firm } from "@/config/firm";
import { sectionDefs } from "@/lib/content/sections";
import type { FieldDef, SectionDef } from "@/lib/content/types";
import {
  displayName,
  fieldHasContent,
  fillName,
  formatDateLong,
  itemHasContent,
  letterDateIso,
  readerName,
  sectionHasContent,
  startedCount,
} from "@/lib/derive";
import { buildReviewReminderIcs } from "@/lib/ics";
import { triggerDownload } from "@/lib/download";
import { useLetterStore } from "@/lib/store";
import type { LetterData } from "@/lib/schema";
import { Button, buttonClasses } from "@/components/ui/Button";

type Busy = null | "letter" | "emergency";

export function ReviewScreen() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const [busy, setBusy] = useState<Busy>(null);
  const [downloaded, setDownloaded] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = hydrated ? startedCount(data) : 0;
  const name = displayName(data);

  const download = async (kind: Exclude<Busy, null>) => {
    setBusy(kind);
    setError(null);
    try {
      const mod = await import("@/lib/pdf/generate");
      if (kind === "letter") {
        const blob = await mod.generateLetterPdfBlob(data);
        triggerDownload(mod.letterPdfFilename(data), blob, "application/pdf");
      } else {
        const blob = await mod.generateEmergencyPdfBlob(data);
        triggerDownload(mod.emergencyPdfFilename(data), blob, "application/pdf");
      }
      setDownloaded(true);
    } catch (e) {
      console.error(e);
      setError(
        "The PDF couldn't be prepared on this device. The reading view below still " +
          "prints cleanly — use your browser's Print button as a fallback."
      );
    } finally {
      setBusy(null);
    }
  };

  const downloadIcs = () => {
    const reminder = buildReviewReminderIcs(readerName(data), new Date());
    triggerDownload(reminder.filename, reminder.content, "text/calendar");
  };

  if (hydrated && count === 0) {
    return (
      <article>
        <h1 className="text-3xl sm:text-4xl">Review &amp; download</h1>
        <div className="mt-6 max-w-prose rounded-xl border border-line bg-surface p-6">
          <p className="text-body">
            Nothing to review yet — your letter doesn't have any notes so far. Even one
            section makes a real, useful document.
          </p>
          <Link
            href="/letter/getting-started"
            className={buttonClasses("primary", "mt-4")}
          >
            Start with the first section
          </Link>
        </div>
      </article>
    );
  }

  return (
    <article>
      <h1 className="text-3xl sm:text-4xl">Review &amp; download</h1>
      <p className="mt-3 max-w-prose text-body">
        {count === sectionDefs.length
          ? "Every section has notes. "
          : `${count} of ${sectionDefs.length} sections have notes so far — that's already worth printing. `}
        Both documents are created right here on your device: nothing is uploaded.
      </p>

      <div aria-live="assertive">
        {error ? (
          <p className="mt-4 max-w-prose rounded-lg border border-danger bg-dangerbg p-4 text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------ downloads */}
      <div className="mt-6 grid gap-4 md:grid-cols-2">
        <section className="rounded-xl border border-line bg-surface p-6">
          <h2 className="text-xl">The Letter of Intent</h2>
          <p className="mt-2 text-sm text-body">
            The full document: cover page, a guide for the reader, a table of
            contents, every section you've written, and ruled note lines for
            handwritten updates. Made to be printed and put in a binder.
          </p>
          <Button
            className="mt-4"
            onClick={() => download("letter")}
            disabled={!hydrated || busy !== null}
          >
            {busy === "letter" ? "Preparing your PDF…" : "Download the letter (PDF)"}
          </Button>
        </section>

        <section className="rounded-xl border border-goldline bg-surface p-6">
          <h2 className="text-xl">The emergency one-pager</h2>
          <p className="mt-2 text-sm text-body">
            One page for the fridge, the school office, the sitter, the ER:
            diagnoses, meds, allergies, how {name === "your loved one" ? "they" : name}{" "}
            communicate{name === "your loved one" ? "" : "s"}, what helps in a crisis,
            and who to call. Families use this one weekly.
          </p>
          <Button
            variant="secondary"
            className="mt-4"
            onClick={() => download("emergency")}
            disabled={!hydrated || busy !== null}
          >
            {busy === "emergency" ? "Preparing your PDF…" : "Download the emergency sheet (PDF)"}
          </Button>
        </section>
      </div>
      <p aria-live="polite" className="sr-only">
        {busy ? "Preparing your PDF. This stays on your device." : ""}
      </p>

      {/* ---------------------------------------------- after the download */}
      {downloaded ? (
        <div className="mt-8 space-y-4">
          <section className="rounded-xl border border-line bg-surface p-6">
            <h2 className="text-xl">Keep it alive: a yearly review</h2>
            <p className="mt-2 max-w-prose text-sm text-body">
              A Letter of Intent is trustworthy only while it's current. Add a reminder
              to your calendar — one year from today — to reread it, update what
              changed, and print a fresh copy. The file works with Google Calendar,
              Outlook, and Apple Calendar. No email address needed.
            </p>
            <Button variant="secondary" className="mt-4" onClick={downloadIcs}>
              Add a yearly reminder (.ics file)
            </Button>
          </section>

          <section
            aria-labelledby="trust-cta"
            className="rounded-xl border border-goldline bg-goldtint p-6"
          >
            <h2 id="trust-cta" className="text-xl">
              The letter guides people. A trust protects the money.
            </h2>
            <p className="mt-2 max-w-prose text-sm text-body">
              Your letter tells future caregivers <em>how</em> — but it can't hold
              money, protect {name}'s public benefits, or legally bind anyone. That's
              the job of a special needs trust and an estate plan. If you'd like to
              talk through how the two fit together, {firm.attorneyName} works with
              families across {firm.licensedStates.join(" and ")}.
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-4">
              <a
                href={firm.consultUrl}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("primary")}
              >
                Book a conversation with {firm.shortName}
              </a>
              <span className="text-sm text-muted">
                or call{" "}
                <a href={firm.phoneHref} className="text-accent underline underline-offset-4">
                  {firm.phone}
                </a>{" "}
                — no pressure, ever.
              </span>
            </div>
          </section>
        </div>
      ) : null}

      <p className="mt-6 text-sm text-muted">
        Also wise:{" "}
        <Link href="/your-data" className="text-accent underline underline-offset-4">
          download a backup file
        </Link>{" "}
        so a cleared browser can never take your work.
      </p>

      {/* ------------------------------------------------- reading view */}
      <ReadingView data={data} hydrated={hydrated} />
    </article>
  );
}

/* ------------------------------------------------------------ reading view */

function ReadingView({ data, hydrated }: { data: LetterData; hydrated: boolean }) {
  if (!hydrated) return null;
  const name = readerName(data);
  const included = sectionDefs.filter((d) => sectionHasContent(data, d));
  const missing = sectionDefs.filter((d) => !sectionHasContent(data, d));
  const author = data.gettingStarted?.authorName?.trim();
  const fullName = data.gettingStarted?.subjectFullName?.trim() || name;
  const dateLong = formatDateLong(letterDateIso(data));

  return (
    <section aria-labelledby="reading-title" className="mt-12 border-t border-line pt-8">
      <div className="print-hide flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 id="reading-title" className="text-2xl">
            Read it through
          </h2>
          <p className="mt-1 max-w-prose text-sm text-muted">
            Everything you've written, in one place. This view also prints cleanly if
            you ever need a copy without the PDF.
          </p>
        </div>
        <Button variant="secondary" onClick={() => window.print()}>
          Print this view
        </Button>
      </div>

      {/* Print-friendly letterhead */}
      <div className="mt-8 font-serif">
        <div className="border-b-2 border-gold pb-6 text-center">
          <p className="text-[0.75rem] font-semibold uppercase tracking-[0.2em] text-accent">
            Letter of Intent
          </p>
          <p className="mt-2 text-3xl text-ink">{fullName}</p>
          {author ? <p className="mt-2 italic text-muted">Written by {author}</p> : null}
          {dateLong ? <p className="mt-1 text-sm text-muted">Last updated {dateLong}</p> : null}
        </div>

        {included.map((def) => (
          <ReadingSection key={def.slug} def={def} data={data} name={name} />
        ))}
      </div>

      {missing.length > 0 ? (
        <div className="print-hide mt-10 rounded-xl border border-line bg-paper2 p-5">
          <h3 className="text-base font-sans font-semibold text-ink">
            Sections without notes yet
          </h3>
          <ul className="mt-2 flex flex-wrap gap-2">
            {missing.map((def) => (
              <li key={def.slug}>
                <Link
                  href={`/letter/${def.slug}`}
                  className="inline-flex min-h-11 items-center rounded-md border border-line bg-surface px-3 text-sm text-body hover:text-ink"
                >
                  {def.number}. {fillName(def.navTitle, displayName(data))}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ) : null}
    </section>
  );
}

function ReadingSection({
  def,
  data,
  name,
}: {
  def: SectionDef;
  data: LetterData;
  name: string;
}) {
  const values = (data[def.key] ?? {}) as Record<string, unknown>;
  const filled = def.fields.filter((f) => fieldHasContent(values, f));
  return (
    <section className="print-section mt-10">
      <h3 className="flex items-baseline gap-3 border-b border-line pb-2 text-2xl text-navydeep">
        <span aria-hidden="true" className="text-base text-golddeep">
          {def.number}.
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
        <dt className="font-sans text-[0.75rem] font-semibold uppercase tracking-wider text-muted">
          {label}
        </dt>
        <dd className="mt-1.5 grid gap-2.5 sm:grid-cols-2">
          {items.map((item, i) => (
            <div key={i} className="rounded-lg border border-line bg-surface p-3.5 text-[0.98rem]">
              {field.itemFields
                .filter((f) => f.kind !== "checkbox")
                .map((f) => {
                  const v = String(item[f.id] ?? "").trim();
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
                  <p key={f.id} className="mt-1.5 font-sans text-xs font-semibold text-accent">
                    ◆ {fillName(f.label, name).replace(/ — .*/, "")}
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
      <dt className="font-sans text-[0.75rem] font-semibold uppercase tracking-wider text-muted">
        {label}
      </dt>
      <dd className="mt-1 max-w-prose whitespace-pre-wrap text-[1.02rem] leading-relaxed text-ink">
        {value}
      </dd>
    </div>
  );
}
