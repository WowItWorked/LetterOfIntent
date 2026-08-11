"use client";

import Link from "next/link";
import { useState } from "react";
import { firm } from "@/config/firm";
import { sectionsForMeta, startedCount } from "@/lib/content/config";
import { displayName, readerName } from "@/lib/derive";
import { serializeBackup } from "@/lib/backup";
import { requirementsMet } from "@/lib/cards/derive";
import { CARD_KEYS } from "@/lib/content/cards";
import { documentFilename } from "@/lib/filenames";
import { buildReviewReminderIcs, calendarLinks } from "@/lib/ics";
import { triggerDownload } from "@/lib/download";
import { photosForBackup } from "@/lib/photos";
import { useLetterStore } from "@/lib/store";
import type { LetterData } from "@/lib/schema";
import { Button, buttonClasses } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { LetterReading } from "@/components/letter/LetterReading";
import { ReminderPanel } from "@/components/review/ReminderPanel";

type FileKind = "letter" | "caregiver" | "emergency" | "cards" | "backup";

const CARD_GAP = "mt-[22px]";

export function ReviewScreen() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);

  const [busy, setBusy] = useState<FileKind | "all" | null>(null);
  const [error, setError] = useState<string | null>(null);

  const sections = sectionsForMeta(meta, data);
  const total = sections.length;
  const count = hydrated ? startedCount(data, meta) : 0;
  const name = displayName(data);

  /* ------------------------------------------------------------ downloads */
  const downloadBackup = async () => {
    const photos = await photosForBackup();
    // The backup carries the routing answers in meta, so a restore re-fits
    // the form without asking anything.
    triggerDownload(
      documentFilename("backup"),
      serializeBackup(data, meta, photos),
      "application/json"
    );
  };

  const downloadPdf = async (kind: "letter" | "caregiver" | "emergency" | "cards") => {
    const mod = await import("@/lib/pdf/generate");
    if (kind === "letter") {
      const blob = await mod.generateLetterPdfBlob(data, meta);
      triggerDownload(mod.letterPdfFilename(), blob, "application/pdf");
    } else if (kind === "caregiver") {
      const blob = await mod.generateCaregiverPdfBlob(data, meta);
      triggerDownload(mod.caregiverPdfFilename(), blob, "application/pdf");
    } else if (kind === "cards") {
      const blob = await mod.generateCardsPrintPdfBlob(data);
      triggerDownload(mod.cardsPrintPdfFilename(), blob, "application/pdf");
    } else {
      const blob = await mod.generateEmergencyPdfBlob(data);
      triggerDownload(mod.emergencyPdfFilename(), blob, "application/pdf");
    }
  };

  // Which documents THIS letter produces: the audience decides the letters,
  // the data decides the cards; the sheet and the backup are always in the
  // set. An unanswered audience gets both letters — never fewer documents
  // than the family may need.
  const audience = meta.audience;
  const wantTrustee = audience !== "caregiver";
  const wantCaregiver = audience !== "trustee";
  const cardsReady = hydrated && CARD_KEYS.some((k) => requirementsMet(data, k));
  const pdfKinds: FileKind[] = [
    ...(wantTrustee ? (["letter"] as const) : []),
    ...(wantCaregiver ? (["caregiver"] as const) : []),
    "emergency",
    ...(cardsReady ? (["cards"] as const) : []),
  ];
  const setCount = pdfKinds.length + 1; // + the backup file

  const run = async (kind: FileKind | "all") => {
    setBusy(kind);
    setError(null);
    try {
      if (kind === "backup") await downloadBackup();
      else if (kind === "all") {
        for (const k of pdfKinds) {
          await downloadPdf(k as "letter" | "caregiver" | "emergency" | "cards");
        }
        await downloadBackup();
      } else await downloadPdf(kind);
    } catch (e) {
      console.error(e);
      setError(
        "The files couldn't be prepared on this device. The reading view below still " +
          "prints cleanly. Use your browser's Print button as a fallback."
      );
    } finally {
      setBusy(null);
    }
  };

  /* ---------------------------------------------------------- empty state */
  if (hydrated && count === 0) {
    return (
      <Shell lead="Nothing to review yet: your letter doesn't have any notes so far. Even one section makes a real, useful document.">
        <section className={`tw-card ${CARD_GAP} p-8`}>
          <p className="text-body">
            Start anywhere. A letter with three sections filled in is already worth more
            to a future caregiver than the perfect letter that never got written.
          </p>
          <Link
            href={`/letter/${sections[0]?.slug ?? "getting-started"}`}
            className={buttonClasses("primary", "mt-4")}
          >
            Start with the first section
          </Link>
        </section>
      </Shell>
    );
  }

  const busyLabel = busy ? "Preparing…" : null;

  return (
    <Shell
      lead={
        count === total
          ? `Every section has notes. Every file in your set is created right here on your device: nothing is uploaded.`
          : `${count} of ${total} sections have notes so far, which is already worth printing. Every file in your set is created right here on your device: nothing is uploaded.`
      }
    >
      <div aria-live="assertive">
        {error ? (
          <p className="mt-4 rounded-[var(--radius-sm)] border border-danger bg-dangerbg p-4 text-danger">
            {error}
          </p>
        ) : null}
      </div>

      {/* -------------------------------------------------------- downloads */}
      <section
        className={`${CARD_GAP} overflow-hidden rounded-[var(--radius-md)] border border-gold400 bg-surface`}
        style={{ boxShadow: "var(--shadow-md)" }}
      >
        <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
        <div style={{ padding: "30px clamp(24px, 3vw, 34px) 32px" }}>
          <Eyebrow>Start here</Eyebrow>
          <h2 className="mt-3 font-serif text-[clamp(1.6rem,3.4vw,2rem)] font-semibold text-ink">
            Download your set
          </h2>
          <p className="mt-3 max-w-[68ch] leading-[1.7]">
            The documents this letter produces for the people who will care for {name},
            and one file for you. Take the whole set now, because it only works together.
            And when life changes later, a new medication, a move, a change in who
            helps, come back and download a fresh set the same week.
          </p>

          <ul className="mt-[22px] list-none p-0">
            {wantTrustee ? (
              <FileRow
                onClick={() => void run("letter")}
                disabled={!hydrated || busy !== null}
                label={busy === "letter" ? busyLabel : "Download"}
                title="The Letter of Intent (PDF)"
                blurb="for whoever will manage money and decisions: the trustee, and the advisors around them."
              />
            ) : null}
            {wantCaregiver ? (
              <FileRow
                onClick={() => void run("caregiver")}
                disabled={!hydrated || busy !== null}
                label={busy === "caregiver" ? busyLabel : "Download"}
                title="The Letter for the Caregiver (PDF)"
                blurb="daily life, routines, and what helps: written for whoever is holding it in a kitchen at 7am."
              />
            ) : null}
            <FileRow
              onClick={() => void run("emergency")}
              disabled={!hydrated || busy !== null}
              label={busy === "emergency" ? busyLabel : "Download"}
              title="The emergency sheet (PDF)"
              blurb="one page for the fridge, the school office, the sitter, the ER."
            />
            {cardsReady ? (
              <FileRow
                onClick={() => void run("cards")}
                disabled={!hydrated || busy !== null}
                label={busy === "cards" ? busyLabel : "Download"}
                title="Care cards, print at home (PDF)"
                blurb="the same cards as the phone set, sized for a wallet and the fridge, with cut marks."
              />
            ) : null}
            <FileRow
              last
              onClick={() => void run("backup")}
              disabled={!hydrated || busy !== null}
              label={busy === "backup" ? busyLabel : "Download"}
              title="Your backup file (.json)"
              blurb="the working copy, in a machine-readable format the builder reads rather than a person. Load it back in to pick the letter up again, here or on another computer. Without it, a cleared browser takes the letter with it."
            />
          </ul>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            <Button
              size="lg"
              onClick={() => void run("all")}
              disabled={!hydrated || busy !== null}
            >
              {busy === "all"
                ? "Preparing your files…"
                : `Download the full set (${setCount} files)`}
            </Button>
            <span className="text-[0.9375rem] text-muted">
              {pdfKinds.length} PDFs and one backup file. Nothing is uploaded.
            </span>
          </div>
          <p aria-live="polite" className="sr-only">
            {busy ? "Preparing your files. This stays on your device." : ""}
          </p>
        </div>
      </section>

      {/* ------------------------------------------------------- care cards */}
      <section className={`tw-card ${CARD_GAP}`}>
        <div style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}>
          <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
            A bonus for your phone
          </p>
          <h2 className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">
            Care cards
          </h2>
          <p className="mt-3 max-w-[70ch] leading-[1.7]">
            Pocket-size picture cards drawn from what you have already written about{" "}
            {name}: one topic each, sized for a phone screen, easy to text to a sitter
            or keep in a camera roll. Pick the set that fits the moment, preview it, and
            download the images. They are drawn on your device too: nothing is uploaded.
          </p>
          <div className="mt-5">
            <Link href="/care-cards#make-yours" className={buttonClasses("outline")}>
              Choose your cards
            </Link>
          </div>
        </div>
      </section>

      {/* --------------------------------------------------- come back in a year */}
      <YearlyReview data={data} />

      {/* ----------------------------------------------------- pass it along */}
      <section className={`tw-card ${CARD_GAP}`}>
        <div style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}>
          <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
            Pass it along
          </p>
          <h2 className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">
            You know how hard this was to start.
          </h2>
          <p className="mt-3 max-w-[70ch] leading-[1.7]">
            Someone in your circle has been meaning to write one of these for years: a
            parent in your support group, a sibling, the family at the next table at
            clinic. Two things put the tool in front of them, and both take about a
            minute.
          </p>

          {/*
            Two ways to help, side by side. Each column is a flex column so the
            buttons sit on a common baseline at the foot of the card however
            unevenly the two paragraphs wrap.
          */}
          <div className="mt-6 grid gap-x-[clamp(20px,3vw,44px)] gap-y-7 border-t border-line pt-6 md:grid-cols-2">
            <div className="flex min-w-0 flex-col">
              <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
                Send them the link
              </p>
              <p className="mt-2 leading-[1.7]">
                The tool is free, and nothing they write ever leaves their own device.
                A text or an email saves someone else from staring at the blank page.
              </p>
              <div className="mt-auto pt-5">
                <Link
                  href="/#pass-it-along"
                  className={buttonClasses("accent", "w-full sm:w-[262px]", "lg")}
                  style={{
                    background: "var(--gradient-gold)",
                    boxShadow: "var(--shadow-gold)",
                  }}
                >
                  Send it to someone
                </Link>
              </div>
            </div>

            <div className="flex min-w-0 flex-col">
              <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
                Put in a good word
              </p>
              <p className="mt-2 leading-[1.7]">
                Most families find this tool by searching. A few honest words about{" "}
                {firm.name} on Google is what lifts it into those results, and that is
                how the next parent stumbles onto it.
              </p>
              <div className="mt-auto pt-5">
                <a
                  href={firm.reviewUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonClasses("outline", "w-full sm:w-[262px]", "lg")}
                >
                  Leave a review
                </a>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ------------------------------------------------------- trust card */}
      <section
        className={`${CARD_GAP} rounded-[var(--radius-md)] border border-gold400 bg-gold100`}
        style={{ padding: "28px 30px" }}
      >
        <Eyebrow>One more thing worth knowing</Eyebrow>
        <h2 className="mt-3 font-serif text-[1.75rem] font-semibold text-ink">
          The letter guides their care. A trust protects their future.
        </h2>
        <p className="mt-3 max-w-[66ch] text-[0.9375rem] leading-[1.7]">
          Your letter tells future caregivers <em>how</em>, but it cannot hold money,
          protect {name}&rsquo;s public benefits, or legally bind anyone. That&rsquo;s the
          job of a special needs trust and an estate plan. If you&rsquo;d like to talk
          through how the two fit together, {firm.attorneyName} works with families across{" "}
          {firm.licensedStates.join(" and ")}.
        </p>
        {/*
          A grid rather than a flex row so the two calls to action are exactly
          the same width whatever their labels say — the second one is long
          enough to wrap to two lines, and both cells stretch to match.
        */}
        <div className="mt-5 grid gap-3 sm:max-w-[560px] sm:grid-cols-2">
          <a
            href={firm.consultUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("primary", "w-full")}
          >
            Book a conversation
          </a>
          <a
            href={firm.contactUrl}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses("outline", "w-full")}
          >
            Contact {firm.shortName}
          </a>
        </div>
        <p className="mt-3.5 text-[0.9375rem] text-muted">
          or call{" "}
          <a href={firm.phoneHref} className="underline underline-offset-[3px]">
            {firm.phone}
          </a>
          . No pressure, ever.
        </p>
      </section>

      {/* ---------------------------------------------------- reading view */}
      {hydrated ? <LetterReading data={data} meta={meta} className={CARD_GAP} /> : null}
    </Shell>
  );
}

/* --------------------------------------------------------------- pieces */

function HeaderPanel({ lead }: { lead: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
        padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">The last step</p>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.01em] text-onink">
          Review &amp; download
        </h1>
        <p className="mt-4 max-w-[66ch] text-lg leading-[1.7] text-oninkbody">{lead}</p>
      </div>
    </div>
  );
}

/**
 * Full-bleed header band flush under the privacy strip (the home-page hero
 * treatment), then the page's own centered container. The route page renders
 * the screen bare so the band can reach both edges.
 */
function Shell({ lead, children }: { lead: string; children: React.ReactNode }) {
  return (
    <>
      <HeaderPanel lead={lead} />
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(10px, 2vw, 24px) var(--gutter) 72px",
        }}
      >
        {children}
      </div>
    </>
  );
}

function FileRow({
  title,
  blurb,
  onClick,
  disabled,
  label,
  last,
}: {
  title: string;
  blurb: string;
  onClick: () => void;
  disabled: boolean;
  label: string | null;
  last?: boolean;
}) {
  return (
    <li
      className={
        last
          ? "flex flex-wrap items-center gap-3.5"
          : "mb-3.5 flex flex-wrap items-center gap-3.5 border-b border-line pb-3.5"
      }
    >
      <span className="tw-diamond flex-none" aria-hidden="true" />
      <span className="min-w-0 flex-[1_1_300px] text-[0.9375rem] leading-[1.65]">
        <strong className="font-semibold text-ink">{title}</strong>, {blurb}
      </span>
      <Button
        variant="outline"
        className="w-[150px] flex-none justify-center"
        onClick={onClick}
        disabled={disabled}
      >
        {label ?? "Download"}
      </Button>
    </li>
  );
}

function YearlyReview({ data }: { data: LetterData }) {
  const person = readerName(data);
  // The hosted links carry no name — see HOSTED_CALENDAR_TITLE. Only the .ics
  // built on this device does.
  const links = calendarLinks(new Date(), firm.appUrl);

  const downloadIcs = () => {
    const reminder = buildReviewReminderIcs(person, new Date());
    triggerDownload(reminder.filename, reminder.content, "text/calendar");
  };

  return (
    <section className={`tw-card ${CARD_GAP}`}>
      <div
        style={{
          padding:
            "clamp(26px, 3vw, 36px) clamp(24px, 2.6vw, 36px) clamp(28px, 3vw, 38px)",
        }}
      >
        <Eyebrow>Keeping it current</Eyebrow>
        <h2 className="mt-3 font-serif text-[clamp(1.7rem,3vw,2.2rem)] font-semibold tracking-[-0.01em] text-ink">
          Update it when life changes.
        </h2>
        <p className="mt-3 max-w-[74ch] leading-[1.7]">
          A Letter of Intent is trustworthy only while it is current, and what dates it
          is events, not anniversaries: a move, a new diagnosis or medication, a new
          school, program, or job, a change in who provides care, an illness or death in
          the support network, a change in benefits or legal authority, a hospital stay.
          When one of those happens, load your backup, change what changed, and download
          a fresh set that same week.
        </p>
        <p className="mt-3 max-w-[74ch] leading-[1.7]">
          The reminder below is the backstop for the quiet years, so set it now, while
          you are thinking about it.
        </p>

        <div
          className="mt-[26px] grid gap-[22px]"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}
        >
          <div className="rounded-[var(--radius-sm)] border border-line bg-paper2 px-5 pb-6 pt-[22px] sm:px-6">
            <p className="tw-engraved text-xs tracking-[0.15em] text-accent">
              Option one
            </p>
            <h3 className="mt-2 font-serif text-[1.375rem] font-semibold text-ink">
              Put it in your own calendar
            </h3>
            <p className="mt-2.5 text-[0.9375rem] leading-[1.7]">
              A single event, one year from today: <em>Reread and update the Letter of
              Intent.</em> No email address, and nothing leaves this device.
            </p>
            {/*
              Three equal columns in a ~240px card leaves each button about
              75px wide, and "Outlook" set at the md size very nearly fills it
              edge to edge. The sm size (13px, px-4) is what buys the label
              visible air on a phone — a `px-2` override would not, because
              `cn` is a plain joiner and the size's own px- wins.
            */}
            <div className="mt-[18px] grid auto-rows-[44px] grid-cols-3 gap-1.5 sm:gap-2">
              <button
                type="button"
                onClick={downloadIcs}
                className={buttonClasses("primary", undefined, "sm")}
              >
                Apple
              </button>
              <a
                href={links.google}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("primary", undefined, "sm")}
              >
                Google
              </a>
              <a
                href={links.outlook}
                target="_blank"
                rel="noopener noreferrer"
                className={buttonClasses("primary", undefined, "sm")}
              >
                Outlook
              </a>
            </div>
            <p className="mt-3 text-[0.9375rem] leading-[1.7] text-muted">
              Another calendar app?{" "}
              <button
                type="button"
                onClick={downloadIcs}
                className="border-0 bg-transparent p-0 font-semibold text-accent underline underline-offset-[3px]"
              >
                Download the .ics file
              </button>
              .
            </p>
          </div>

          <ReminderPanel />
        </div>

        <p className="mt-[22px] border-t border-line pt-[18px] text-[0.9375rem] leading-[1.7] text-muted">
          Either way, keep your backup file. It is the only way back into the letter next
          year.{" "}
          <Link href="/privacy" className="font-semibold underline underline-offset-[3px]">
            How reminders and your data work →
          </Link>
        </p>
      </div>
    </section>
  );
}
