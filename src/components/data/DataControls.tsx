"use client";

import Link from "next/link";
import { useState, type ReactNode } from "react";
import { firm } from "@/config/firm";
import { serializeBackup } from "@/lib/backup";
import { DEFAULT_PATH, pathDef } from "@/lib/content/paths";
import { startedCount } from "@/lib/derive";
import { documentFilename } from "@/lib/filenames";
import { triggerDownload } from "@/lib/download";
import { deleteAllPhotos, photosForBackup } from "@/lib/photos";
import { LETTER_STORAGE_KEY, useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { RestoreFlow } from "@/components/data/RestoreFlow";

type Notice = { tone: "success" | "danger"; text: string } | null;

/**
 * Each card is laid out explanation-left, actions-right, so the buttons line
 * up down the page and the reading column keeps its measure.
 */
function ActionCard({
  eyebrow,
  title,
  children,
  actions,
  danger,
}: {
  eyebrow: string;
  title: string;
  children: ReactNode;
  actions: ReactNode;
  danger?: boolean;
}) {
  return (
    <section
      className={
        danger
          ? "mt-[22px] overflow-hidden rounded-[var(--radius-md)] border border-danger bg-surface"
          : "tw-card mt-[22px]"
      }
      style={{ boxShadow: "var(--shadow-sm)" }}
    >
      <div
        className="flex flex-wrap items-start gap-[clamp(18px,3vw,44px)]"
        style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}
      >
        <div className="min-w-0 flex-[3_1_340px]">
          <Eyebrow>{eyebrow}</Eyebrow>
          <h2 className="mt-2 font-serif text-[1.75rem] font-semibold text-ink">{title}</h2>
          <div className="mt-2.5 max-w-[66ch] leading-[1.75]">{children}</div>
        </div>
        <div className="flex min-w-0 flex-[1_1_250px] flex-col gap-3">{actions}</div>
      </div>
    </section>
  );
}

export function DataControls() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const clearAll = useLetterStore((s) => s.clearAll);

  const [notice, setNotice] = useState<Notice>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<"letter" | "emergency" | null>(null);

  const path = meta.letterPath ?? DEFAULT_PATH;
  const total = pathDef(path).sections.length;
  const count = hydrated ? startedCount(data, path) : 0;

  /* ------------------------------------------------------------- export */
  const handleExport = async () => {
    const photos = await photosForBackup();
    triggerDownload(
      documentFilename("backup", path),
      // Always record which letter this is, even if the family never visited
      // the chooser — otherwise a file of only shared sections comes back
      // ambiguous and we have to ask them a question we could have answered.
      serializeBackup(data, { ...meta, letterPath: path }, photos),
      "application/json"
    );
    setNotice({
      tone: "success",
      text:
        "Backup downloaded. Keep it somewhere safe — a cloud drive, an email to " +
        "yourself, a USB stick." +
        (photos.length ? ` Your ${photos.length === 1 ? "photo is" : "photos are"} inside it too.` : ""),
    });
  };

  const handleDocument = async (kind: "letter" | "emergency") => {
    setBusy(kind);
    setNotice(null);
    try {
      const mod = await import("@/lib/pdf/generate");
      if (kind === "letter") {
        const blob = await mod.generateLetterPdfBlob(data, path);
        triggerDownload(mod.letterPdfFilename(path), blob, "application/pdf");
      } else {
        const blob = await mod.generateEmergencyPdfBlob(data, path);
        triggerDownload(mod.emergencyPdfFilename(path), blob, "application/pdf");
      }
    } catch (e) {
      console.error(e);
      setNotice({
        tone: "danger",
        text: "That document couldn't be prepared on this device. The reading view on the review page still prints.",
      });
    } finally {
      setBusy(null);
    }
  };

  /* ------------------------------------------------------------- delete */
  const handleDelete = async () => {
    clearAll();
    useLetterStore.persist.clearStorage();
    await deleteAllPhotos();
    setDeleteOpen(false);
    const letterGone = localStorage.getItem(LETTER_STORAGE_KEY) === null;
    setNotice(
      letterGone
        ? {
            tone: "success",
            text: "Deleted. We checked: this device now holds nothing from this tool.",
          }
        : {
            tone: "danger",
            text: "Something didn't clear. Please also clear this site's data in your browser settings.",
          }
    );
  };

  return (
    <div>
      <div aria-live="polite">
        {notice ? (
          <p
            className={
              notice.tone === "success"
                ? "mt-[22px] rounded-[var(--radius-md)] border border-success/40 bg-successbg p-4 text-success"
                : "mt-[22px] rounded-[var(--radius-md)] border border-danger bg-dangerbg p-4 text-danger"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------- backup */}
      <ActionCard
        eyebrow="Keep a copy"
        title="Download a backup"
        actions={
          <Button onClick={() => void handleExport()} disabled={!hydrated}>
            Download backup file
          </Button>
        }
      >
        <p>
          One file holds your whole letter
          {count > 0 ? ` (${count} of ${total} sections have notes)` : ""}, photographs
          included. Keep it in a safe place, move it to another device, or email it to
          yourself. If this browser&rsquo;s data is ever cleared, the backup is how you
          get everything back.
        </p>
        <div className="mt-4 rounded-[var(--radius-sm)] border border-gold400 bg-gold100 px-4 py-3.5 text-[0.9375rem] leading-[1.7]">
          <strong className="font-semibold text-ink">There is no account</strong>, so
          there is nothing for us to restore for you. This file is the only copy that
          outlives this browser.
        </div>
        <p className="mt-3 text-[0.9375rem] text-muted">
          The <code className="font-sans">.json</code> file is written for the builder to
          read, not for a person. The documents below are the ones you hand to someone.
        </p>
      </ActionCard>

      {/* ---------------------------------------------------- documents */}
      <ActionCard
        eyebrow="For the people who help"
        title="Download the documents"
        actions={
          <>
            <Button onClick={() => void handleDocument("letter")} disabled={!hydrated || busy !== null}>
              {busy === "letter" ? "Preparing…" : "The letter (PDF)"}
            </Button>
            <Button
              variant="outline"
              onClick={() => void handleDocument("emergency")}
              disabled={!hydrated || busy !== null}
            >
              {busy === "emergency" ? "Preparing…" : "Emergency sheet (PDF)"}
            </Button>
          </>
        }
      >
        <p>
          The same two documents the review page produces: the full Letter of Intent, and
          the one-page emergency sheet. Both are built here on this device, from whatever
          you have written so far.
        </p>
        <p className="mt-3 text-[0.9375rem] text-muted">
          Prefer to see it all first?{" "}
          <Link href="/letter/review" className="underline underline-offset-[3px]">
            Go to review &amp; download
          </Link>
          .
        </p>
      </ActionCard>

      {/* ------------------------------------------------------- import */}
      <ActionCard
        eyebrow="Continue elsewhere"
        title="Load a backup"
        actions={<RestoreFlow onNotice={setNotice} />}
      >
        <p>
          Continue on this device from a backup file you downloaded earlier — here or on
          another device. Loading a backup replaces whatever is on this device, so
          download a copy of that first if you want to keep it.
        </p>
        <p className="mt-3 text-[0.9375rem] text-muted">
          If the file was written before this tool had two sets of questions, we work out
          which letter it belongs to from the sections inside it — and ask you if it
          genuinely cannot be told apart. Anything in the file that cannot be read is
          reported rather than silently dropped.
        </p>
      </ActionCard>

      {/* ------------------------------------------------------- delete */}
      <ActionCard
        danger
        eyebrow="Erase"
        title="Delete all my data"
        actions={
          <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={!hydrated}>
            Delete all my data…
          </Button>
        }
      >
        <p>
          Erases everything this tool has stored on this device — the whole letter and any
          photographs. This cannot be undone, and there is no copy anywhere else. If you
          might want the letter later, download a backup first.
        </p>
      </ActionCard>

      <p className="mt-8 text-[0.9375rem] text-muted">
        Wondering where your data lives in the first place?{" "}
        <Link href="/privacy" className="underline underline-offset-[3px]">
          How your data works
        </Link>
        {" · "}
        Questions? Call {firm.shortName} at{" "}
        <a href={firm.phoneHref} className="underline underline-offset-[3px]">
          {firm.phone}
        </a>{" "}
        or write to{" "}
        <a href={`mailto:${firm.email}`} className="underline underline-offset-[3px]">
          {firm.email}
        </a>
        .
      </p>

      {/* ------------------------------------------------- delete dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete everything on this device?"
      >
        <p className="max-w-[66ch] text-body">
          Your whole letter
          {count > 0 ? ` — including the ${count} sections with notes —` : ""} will be
          permanently erased from this device, along with any photographs. There is no
          undo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => void handleDelete()}>
            Yes, delete it all
          </Button>
          <Button variant="outline" onClick={() => void handleExport()}>
            Download a backup first
          </Button>
          <Button variant="quiet" onClick={() => setDeleteOpen(false)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
