"use client";

import Link from "next/link";
import { useRef, useState } from "react";
import { firm } from "@/config/firm";
import { backupFilename, parseBackup, serializeBackup } from "@/lib/backup";
import { displayName, preferredName, startedCount } from "@/lib/derive";
import { triggerDownload } from "@/lib/download";
import { LETTER_STORAGE_KEY, useLetterStore } from "@/lib/store";
import { SETTINGS_STORAGE_KEY, useSettingsStore, applySettingsToDocument } from "@/lib/settings-store";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";
import type { LetterData, LetterMeta } from "@/lib/schema";

type Notice = { tone: "success" | "danger"; text: string } | null;

export function DataControls() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const replaceAll = useLetterStore((s) => s.replaceAll);
  const clearAll = useLetterStore((s) => s.clearAll);

  const [notice, setNotice] = useState<Notice>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [pendingImport, setPendingImport] = useState<{
    data: LetterData;
    meta: LetterMeta;
  } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const count = hydrated ? startedCount(data) : 0;

  /* ------------------------------------------------------------- export */
  const handleExport = () => {
    triggerDownload(
      backupFilename(preferredName(data), new Date()),
      serializeBackup(data, meta),
      "application/json"
    );
    setNotice({
      tone: "success",
      text: "Backup downloaded. Keep it somewhere safe — a cloud drive, an email to yourself, a USB stick.",
    });
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
      setPendingImport({ data: result.data, meta: result.meta });
    } else {
      applyImport(result.data, result.meta);
    }
  };

  const applyImport = (importedData: LetterData, importedMeta: LetterMeta) => {
    replaceAll(importedData, importedMeta);
    setPendingImport(null);
    const n = startedCount(importedData);
    setNotice({
      tone: "success",
      text: `Backup loaded — ${n} of 15 sections have notes. Everything is saved on this device now.`,
    });
  };

  /* ------------------------------------------------------------- delete */
  const handleDelete = () => {
    clearAll();
    useSettingsStore.setState({ textSize: 1, contrast: "default" });
    applySettingsToDocument(1, "default");
    useLetterStore.persist.clearStorage();
    useSettingsStore.persist.clearStorage();
    setDeleteOpen(false);
    const letterGone = localStorage.getItem(LETTER_STORAGE_KEY) === null;
    const settingsGone = localStorage.getItem(SETTINGS_STORAGE_KEY) === null;
    setNotice(
      letterGone && settingsGone
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
    <div className="space-y-6">
      <div aria-live="polite">
        {notice ? (
          <p
            className={
              notice.tone === "success"
                ? "rounded-lg border border-success/40 bg-surface p-4 text-success"
                : "rounded-lg border border-danger bg-dangerbg p-4 text-danger"
            }
          >
            {notice.text}
          </p>
        ) : null}
      </div>

      {/* ------------------------------------------------------- backup */}
      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-xl">Download a backup</h2>
        <p className="mt-2 max-w-prose text-body">
          One file holds your whole letter{count > 0 ? ` (${count} of 15 sections have notes)` : ""}.
          Keep it in a safe place, move it to another device, or email it to yourself.
          If this browser's data is ever cleared, the backup is how you get everything
          back.
        </p>
        <div className="mt-4">
          <Button onClick={handleExport} disabled={!hydrated}>
            Download backup file
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------- import */}
      <section className="rounded-xl border border-line bg-surface p-6">
        <h2 className="text-xl">Load a backup</h2>
        <p className="mt-2 max-w-prose text-body">
          Continue on this device from a backup file you downloaded earlier — here or
          on another device.
        </p>
        <div className="mt-4">
          {/* Proxy input, driven by the visible button below — kept out of the
              a11y tree so there's exactly one "choose a file" control. */}
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
          <Button variant="secondary" onClick={() => fileRef.current?.click()}>
            Choose a backup file…
          </Button>
        </div>
      </section>

      {/* ------------------------------------------------------- delete */}
      <section className="rounded-xl border border-danger/50 bg-surface p-6">
        <h2 className="text-xl">Delete all my data</h2>
        <p className="mt-2 max-w-prose text-body">
          Erases everything this tool has stored on this device — the whole letter and
          your display settings. This cannot be undone. If you might want the letter
          later, download a backup first.
        </p>
        <div className="mt-4 flex flex-wrap gap-3">
          <Button variant="danger" onClick={() => setDeleteOpen(true)} disabled={!hydrated}>
            Delete all my data…
          </Button>
        </div>
      </section>

      <p className="text-sm text-muted">
        Wondering where your data lives in the first place?{" "}
        <Link href="/privacy" className="text-accent underline underline-offset-4">
          How your data works
        </Link>
        {" · "}
        Questions? Call {firm.shortName} at{" "}
        <a href={firm.phoneHref} className="text-accent underline underline-offset-4">
          {firm.phone}
        </a>
        .
      </p>

      {/* ------------------------------------------------- delete dialog */}
      <Dialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        title="Delete everything on this device?"
      >
        <p className="max-w-prose text-body">
          Your whole letter{count > 0 ? ` — including the ${count} sections with notes —` : ""}{" "}
          will be permanently erased from this device. There is no undo.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button variant="danger" onClick={handleDelete}>
            Yes, delete it all
          </Button>
          <Button variant="secondary" onClick={handleExport}>
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
        <p className="max-w-prose text-body">
          This device already has a letter with notes in {count} section{count === 1 ? "" : "s"}
          {preferredName(data) ? ` (about ${displayName(data)})` : ""}. Loading the backup
          will replace it completely.
        </p>
        <div className="mt-5 flex flex-wrap gap-3">
          <Button
            onClick={() => pendingImport && applyImport(pendingImport.data, pendingImport.meta)}
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
