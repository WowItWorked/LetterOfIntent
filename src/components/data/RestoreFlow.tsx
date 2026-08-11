"use client";

import { useRef, useState } from "react";
import {
  MAX_BACKUP_BYTES,
  type ParseBackupResult,
  type SalvageReport,
  parseBackup,
} from "@/lib/backup";
import { startedCount } from "@/lib/content/config";
import { displayName, preferredName } from "@/lib/derive";
import { restorePhotos } from "@/lib/photos";
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

      {/* ------------------------------------------------- replace what's here */}
      <Dialog
        open={loaded !== null}
        onClose={cancel}
        title="Replace what's on this device?"
      >
        <p className="max-w-[66ch] text-body">
          This device already has a letter with notes in {existing} section
          {existing === 1 ? "" : "s"}
          {preferredName(data) ? ` (about ${displayName(data)})` : ""}. Loading this
          backup will replace it completely, and that cannot be undone.
        </p>
        {loaded ? <SalvageSummary report={loaded.salvage} /> : null}
        <div className="mt-5 flex flex-wrap gap-3">
          <Button onClick={() => loaded && void applyLoaded(loaded)}>
            Replace with the backup
          </Button>
          <Button variant="quiet" onClick={cancel}>
            Cancel
          </Button>
        </div>
      </Dialog>
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
