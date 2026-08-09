"use client";

import { useRef, useState } from "react";
import {
  MAX_BACKUP_BYTES,
  type ParseBackupResult,
  type SalvageReport,
  parseBackup,
} from "@/lib/backup";
import { LETTER_PATHS, pathDef } from "@/lib/content/paths";
import { displayName, preferredName, startedCount } from "@/lib/derive";
import { restorePhotos } from "@/lib/photos";
import { useLetterStore } from "@/lib/store";
import type { BackupPhoto, LetterData, LetterMeta, LetterPath } from "@/lib/schema";
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
        "read back. It may have been written by a much older version, or saved before " +
        "anything was filled in. Nothing on this device was changed, so your current " +
        "letter is safe. If you have another copy of the file, try that one."
      );
    default:
      return (
        "Sorry — that does not look like a Letter of Intent backup, so nothing was " +
        "changed. Look for the .json file this tool downloaded, named something like " +
        "Letter-of-Intent-Disabilities-Backup-2026-08-08.json."
      );
  }
}

/** Plain-language account of what came back and what did not. */
function salvageMessage(loaded: Loaded, path: LetterPath): string {
  const total = pathDef(path).sections.length;
  const filled = startedCount(loaded.data, path);
  const parts = [`Backup loaded — ${filled} of ${total} sections have notes.`];

  if (loaded.salvage.skipped.length > 0) {
    parts.push(
      `${loaded.salvage.skipped.length} section${
        loaded.salvage.skipped.length === 1 ? "" : "s"
      } in that file could not be read and ${
        loaded.salvage.skipped.length === 1 ? "was" : "were"
      } left out; everything else came back.`
    );
  }
  if (loaded.pathSource === "inferred") {
    parts.push(
      `That backup did not say which letter it was, so we matched it to the ${pathDef(
        path
      ).tabLabel.toLowerCase()} set from the sections it contained.`
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
  const [chosenPath, setChosenPath] = useState<LetterPath | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const currentPath = meta.letterPath ?? "special-needs";
  const existing = startedCount(data, currentPath);

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

    // A readable file, a known template, and nothing here to overwrite: no
    // question worth asking, so load it.
    const nothingToLose = startedCount(useLetterStore.getState().data, currentPath) === 0;
    if (result.path && nothingToLose) {
      await applyLoaded(result, result.path);
      return;
    }

    setLoaded(result);
    setChosenPath(result.path);
  };

  /* --------------------------------------------------------------- apply */
  const applyLoaded = async (source: Loaded, path: LetterPath) => {
    const nextMeta: LetterMeta = { ...source.meta, letterPath: path };
    replaceAll(source.data as LetterData, nextMeta);
    if (source.photos?.length) await restorePhotos(source.photos as BackupPhoto[]);
    onNotice({ tone: "success", text: salvageMessage(source, path) });
    setLoaded(null);
    setChosenPath(null);
  };

  const apply = async (path: LetterPath) => {
    if (loaded) await applyLoaded(loaded, path);
  };

  const cancel = () => {
    setLoaded(null);
    setChosenPath(null);
  };

  const needsPath = loaded !== null && loaded.path === null;
  const needsConfirm = loaded !== null && loaded.path !== null;

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

      {/* ------------------------------------------------ which letter is it */}
      <Dialog open={needsPath} onClose={cancel} title="Which letter is this?">
        <p className="max-w-[66ch] text-body">
          That backup was written before this tool had two sets of questions, and the
          sections in it are ones both sets share — so we cannot tell which letter it
          belongs to. Pick the one you were writing and everything in the file will be
          loaded into it.
        </p>
        <div className="mt-5 flex flex-col gap-3">
          {LETTER_PATHS.map((p) => (
            <Button
              key={p.id}
              variant={chosenPath === p.id ? "primary" : "outline"}
              className="justify-start text-left"
              onClick={() => void apply(p.id)}
            >
              {p.tabLabel} — {p.sections.length} sections
            </Button>
          ))}
          <Button variant="quiet" className="self-start" onClick={cancel}>
            Cancel
          </Button>
        </div>
        <p className="mt-4 max-w-[66ch] text-[0.9375rem] text-muted">
          If you pick the wrong one, nothing is lost — the answers are all still there,
          and you can load the file again and choose the other.
        </p>
      </Dialog>

      {/* ------------------------------------------------- replace what's here */}
      <Dialog
        open={needsConfirm}
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
          <Button onClick={() => loaded?.path && void apply(loaded.path)}>
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
