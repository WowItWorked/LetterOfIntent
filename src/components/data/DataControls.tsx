"use client";

import Link from "next/link";
import { useRef, useState, type ReactNode } from "react";
import { firm } from "@/config/firm";
import { backupFilename, parseBackup, serializeBackup } from "@/lib/backup";
import { DEFAULT_PATH, pathDef } from "@/lib/content/paths";
import { displayName, preferredName, startedCount } from "@/lib/derive";
import { triggerDownload } from "@/lib/download";
import { deleteAllPhotos, photosForBackup, restorePhotos } from "@/lib/photos";
import { LETTER_STORAGE_KEY, useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import { Eyebrow } from "@/components/ui/Eyebrow";
import type { BackupPhoto, LetterData, LetterMeta } from "@/lib/schema";

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
  const replaceAll = useLetterStore((s) => s.replaceAll);
  const clearAll = useLetterStore((s) => s.clearAll);

  const [notice, setNotice] = useState<Notice>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [busy, setBusy] = useState<"letter" | "emergency" | null>(null);
  const [pendingImport, setPendingImport] = useState<{
    data: LetterData;
    meta: LetterMeta;
    photos?: BackupPhoto[];
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const path = meta.letterPath ?? DEFAULT_PATH;
  const total = pathDef(path).sections.length;
  const count = hydrated ? startedCount(data, path) : 0;

  /* ------------------------------------------------------------- export */
  const handleExport = async () => {
    const photos = await photosForBackup();
    triggerDownload(
      backupFilename(preferredName(data), new Date()),
      serializeBackup(data, meta, photos),
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
        triggerDownload(mod.letterPdfFilename(data), blob, "application/pdf");
      } else {
        const blob = await mod.generateEmergencyPdfBlob(data, path);
        triggerDownload(mod.emergencyPdfFilename(data), blob, "application/pdf");
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

  /* ------------------------------------------------------------- import */
  const handleFile = async (file: File) => {
    const text = await file.text();
    const result = parseBackup(text);
    if (!result.ok) {
      setNotice({
        tone: "danger",
        text:
          result.reason === "not-json"
            ? "That file doesn't look like a backup from this tool (it isn't readable as JSON)."
            : "That file doesn't look like a Letter of Intent backup. Nothing was changed.",
      });
      return;
    }
    if (count > 0) {
      setPendingImport({ data: result.data, meta: result.meta, photos: result.photos });
    } else {
      await applyImport(result.data, result.meta, result.photos);
    }
  };

  const applyImport = async (
    importedData: LetterData,
    importedMeta: LetterMeta,
    photos?: BackupPhoto[],
  ) => {
    replaceAll(importedData, importedMeta);
    if (photos?.length) await restorePhotos(photos);
    setPendingImport(null);
    const importedPath = importedMeta.letterPath ?? DEFAULT_PATH;
    const n = startedCount(importedData, importedPath);
    setNotice({
      tone: "success",
      text: `Backup loaded — ${n} of ${pathDef(importedPath).sections.length} sections have notes. Everything is saved on this device now.`,
    });
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
        actions={
          <>
            <input
              ref={fileRef}
              type="file"
              accept="application/json,.json"
              aria-hidden="true"
              tabIndex={-1}
              className="sr-only"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) void handleFile(f);
                e.target.value = "";
              }}
            />
            <Button variant="outline" onClick={() => fileRef.current?.click()}>
              Choose a backup file…
            </Button>
          </>
        }
      >
        <p>
          Continue on this device from a backup file you downloaded earlier — here or on
          another device. Loading a backup replaces whatever is on this device, so
          download a copy of that first if you want to keep it.
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

      {/* ------------------------------------------------- import dialog */}
      <Dialog
        open={pendingImport !== null}
        onClose={() => setPendingImport(null)}
        title="Replace what's on this device?"
      >
        <p className="max-w-[66ch] text-body">
          This device already has a letter with notes in {count} section
          {count === 1 ? "" : "s"}
          {preferredName(data) ? ` (about ${displayName(data)})` : ""}. Loading the backup
          will replace it completely.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={() =>
              pendingImport &&
              void applyImport(pendingImport.data, pendingImport.meta, pendingImport.photos)
            }
          >
            Replace with the backup
          </Button>
          <Button variant="quiet" onClick={() => setPendingImport(null)}>
            Cancel
          </Button>
        </div>
      </Dialog>
    </div>
  );
}
