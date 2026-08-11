"use client";

import { useRef, useState } from "react";
import {
  MAX_BACKUP_BYTES,
  serializeBackup,
  type ParseBackupResult,
  type SalvageReport,
  parseBackup,
} from "@/lib/backup";
import { startedCount } from "@/lib/content/config";
import { displayName, formatDateLong, preferredName } from "@/lib/derive";
import { documentFilename } from "@/lib/filenames";
import { triggerDownload } from "@/lib/download";
import { photosForBackup, restorePhotos } from "@/lib/photos";
import { useLetterStore } from "@/lib/store";
import type { BackupPhoto, LetterData } from "@/lib/schema";
import { Button } from "@/components/ui/Button";
import { Dialog } from "@/components/ui/Dialog";

type Loaded = Extract<ParseBackupResult, { ok: true }>;

export type RestoreNotice = { tone: "success" | "danger"; text: string } | null;

/** Only these reach the file dialog; the parser re-checks regardless. */
const ACCEPT = "application/json,.json";

/**
 * Wording for a file we could not read. Every branch apologises and says what
 * to try, because the person on the other end has usually just discovered
 * their letter is not where they left it.
 */
function failureMessage(reason: Extract<ParseBackupResult, { ok: false }>["reason"]): string {
  switch (reason) {
    case "too-large":
      return (
        "That file is too large to be a Letter of Intent backup, so it was not opened. " +
        "If you meant to load a backup, it should be the .json file this tool gave you."
      );
    case "not-json":
      return (
        "Sorry — that file could not be read. A backup from this tool is a .json file; " +
        "a PDF or a document from another program will not open here. Nothing on this " +
        "device was changed."
      );
    case "empty":
      return (
        "Sorry — that is a backup from this tool, but there was nothing in it we could " +
        "read back. It may have been saved before anything was filled in. Nothing on " +
        "this device was changed, so your current letter is safe. If you have another " +
        "copy of the file, try that one."
      );
    default:
      return (
        "Sorry — that does not look like a Letter of Intent backup, so nothing was " +
        "changed. Look for the .json file this tool downloaded, named something like " +
        "Letter-of-Intent-Backup-2026-08-08.json."
      );
  }
}

/** Plain-language account of what came back and what did not. */
function salvageMessage(loaded: Loaded): string {
  const filled = startedCount(loaded.data, loaded.meta);
  const parts = [
    `Backup loaded — ${filled} section${filled === 1 ? " has" : "s have"} notes.`,
  ];

  if (loaded.salvage.skipped.length > 0) {
    parts.push(
      `${loaded.salvage.skipped.length} section${
        loaded.salvage.skipped.length === 1 ? "" : "s"
      } in that file could not be read and ${
        loaded.salvage.skipped.length === 1 ? "was" : "were"
      } left out; everything else came back.`
    );
  }
  if (loaded.migratedFromV1) {
    parts.push(
      "That file was written by an older version of this tool, so its answers were " +
        "carried into the current letter. Nothing was lost" +
        (loaded.combined.length > 0
          ? `, and where the old letter held two answers to the same question, both were kept together for you to tidy.`
          : ".")
    );
  }
  parts.push("Everything is saved on this device now.");
  return parts.join(" ");
}

export function RestoreFlow({
  onNotice,
  className,
}: {
  onNotice: (n: RestoreNotice) => void;
  className?: string;
}) {
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const replaceAll = useLetterStore((s) => s.replaceAll);

  const [loaded, setLoaded] = useState<Loaded | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const existing = startedCount(data, meta);

  /* --------------------------------------------------------------- read */
  const handleFile = async (file: File) => {
    onNotice(null);

    if (file.size > MAX_BACKUP_BYTES) {
      onNotice({ tone: "danger", text: failureMessage("too-large") });
      return;
    }

    let text: string;
    try {
      text = await file.text();
    } catch {
      onNotice({ tone: "danger", text: failureMessage("not-json") });
      return;
    }

    const result = parseBackup(text);
    if (!result.ok) {
      onNotice({ tone: "danger", text: failureMessage(result.reason) });
      return;
    }

    // Nothing on this device to overwrite: no question worth asking, load it.
    const state = useLetterStore.getState();
    if (startedCount(state.data, state.meta) === 0) {
      await applyLoaded(result);
      return;
    }

    setLoaded(result);
  };

  /* --------------------------------------------------------------- apply */
  const applyLoaded = async (source: Loaded) => {
    replaceAll(source.data as LetterData, source.meta);
    if (source.photos?.length) await restorePhotos(source.photos as BackupPhoto[]);
    onNotice({ tone: "success", text: salvageMessage(source) });
    setLoaded(null);
  };

  /** The safe path: what is on this device leaves as a backup file BEFORE the
   *  replace, so nothing can be lost by accident. */
  const backupThenReplace = async (source: Loaded) => {
    const state = useLetterStore.getState();
    const photos = await photosForBackup();
    triggerDownload(
      documentFilename("backup"),
      serializeBackup(state.data, state.meta, photos),
      "application/json"
    );
    await applyLoaded(source);
  };

  const cancel = () => setLoaded(null);

  return (
    <div className={className}>
      <input
        ref={fileRef}
        type="file"
        accept={ACCEPT}
        aria-hidden="true"
        tabIndex={-1}
        className="sr-only"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) void handleFile(f);
          // Clear so choosing the same file twice still fires a change.
          e.target.value = "";
        }}
      />
      <Button variant="outline" onClick={() => fileRef.current?.click()}>
        Choose a backup file…
      </Button>

      {/* --------------------------------------------- replace what's here.
          "Replace", never "import": the heading says what actually happens.
          Both sides are computed before anything is written, the dangerous
          direction is flagged plainly, and the safe path is the primary
          action — one click to safety, deliberate effort to destroy. */}
      <Dialog
        open={loaded !== null}
        onClose={cancel}
        title="Replace the letter on this device?"
      >
        {loaded ? <ReplaceComparison loaded={loaded} existing={existing} data={data} /> : null}
        {loaded ? <SalvageSummary report={loaded.salvage} /> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => loaded && void backupThenReplace(loaded)}>
            Save this device&rsquo;s letter first, then replace
          </Button>
          <Button
            variant="outline"
            onClick={() => loaded && void applyLoaded(loaded)}
          >
            Replace without saving
          </Button>
          <Button variant="quiet" onClick={cancel}>
            Cancel
          </Button>
        </div>
        <p className="mt-4 max-w-[66ch] text-[0.9375rem] text-muted">
          You have done nothing wrong — this is just the one action here that
          cannot be undone, so it gets a careful moment.
        </p>
      </Dialog>
    </div>
  );
}

/**
 * The two letters, side by side, so the family can compare before choosing.
 * Specific on purpose: vagueness is what makes people click through.
 */
function ReplaceComparison({
  loaded,
  existing,
  data,
}: {
  loaded: Loaded;
  existing: number;
  data: LetterData;
}) {
  const meta = useLetterStore.getState().meta;
  const incoming = startedCount(loaded.data, loaded.meta);
  const deviceUpdated = meta.updatedAt?.slice(0, 10);
  const fileExported = loaded.exportedAt?.slice(0, 10);
  const fileOlder = Boolean(
    deviceUpdated && fileExported && fileExported < deviceUpdated
  );
  const fileSmaller = incoming < existing;

  return (
    <div className="max-w-[66ch]">
      <p className="text-body">
        Loading this file <strong className="font-semibold">replaces</strong> the
        letter on this device completely. There is no undo and no merge.
      </p>
      <dl className="mt-4 grid gap-3 sm:grid-cols-2">
        <div className="rounded-[var(--radius-sm)] border border-line bg-paper2 p-3.5">
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-faint">
            On this device now
          </dt>
          <dd className="mt-1 text-[0.9375rem] leading-[1.6] text-body">
            Notes in {existing} section{existing === 1 ? "" : "s"}
            {preferredName(data) ? ` (about ${displayName(data)})` : ""}.
            {deviceUpdated ? ` Last edited ${formatDateLong(deviceUpdated)}.` : ""}
          </dd>
        </div>
        <div className="rounded-[var(--radius-sm)] border border-line bg-paper2 p-3.5">
          <dt className="text-xs font-semibold uppercase tracking-[0.08em] text-faint">
            In the backup file
          </dt>
          <dd className="mt-1 text-[0.9375rem] leading-[1.6] text-body">
            Notes in {incoming} section{incoming === 1 ? "" : "s"}
            {preferredName(loaded.data) ? ` (about ${displayName(loaded.data)})` : ""}.
            {fileExported ? ` Saved ${formatDateLong(fileExported)}.` : ""}
          </dd>
        </div>
      </dl>
      {fileOlder || fileSmaller ? (
        <p className="mt-3 rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-3.5 text-[0.9375rem] leading-[1.65] text-body">
          Worth a second look:{" "}
          {fileOlder && fileSmaller
            ? "this file is older than the letter on this device and holds less — replacing means losing the newer work."
            : fileOlder
              ? "this file is older than the letter on this device — replacing means losing the newer work."
              : "this file holds fewer sections with notes than this device does."}
        </p>
      ) : null}
    </div>
  );
}

/** Only shown when something in the file could not be read. */
function SalvageSummary({ report }: { report: SalvageReport }) {
  if (report.skipped.length === 0) return null;
  return (
    <p className="mt-4 max-w-[66ch] rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-4 text-[0.9375rem] text-body">
      One thing to know first: {report.skipped.length} section
      {report.skipped.length === 1 ? "" : "s"} in that file could not be read, so{" "}
      {report.skipped.length === 1 ? "it" : "they"} will come back empty. Everything else
      in the file loads normally.
    </p>
  );
}
