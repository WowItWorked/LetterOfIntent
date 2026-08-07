import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  backupSchema,
  letterDataSchema,
  type Backup,
  type LetterData,
  type LetterMeta,
} from "@/lib/schema";

export function serializeBackup(data: LetterData, meta: LetterMeta): string {
  const backup: Backup = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    meta,
  };
  return JSON.stringify(backup, null, 2);
}

export function sanitizeForFilename(v: string): string {
  return v
    .normalize("NFKD")
    .replace(/[^\w\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .slice(0, 40);
}

export function backupFilename(personLabel: string | undefined, now: Date): string {
  const date = now.toISOString().slice(0, 10);
  const who = personLabel ? `-${sanitizeForFilename(personLabel)}` : "";
  return `letter-of-intent-backup${who}-${date}.json`;
}

export type ParseBackupResult =
  | { ok: true; data: LetterData; meta: LetterMeta }
  | { ok: false; reason: "not-json" | "not-a-backup" | "invalid" };

/**
 * Reads a backup file. Tolerant on purpose: a newer-version backup still
 * parses (the data schema strips unknown fields), and a bare LetterData
 * object without the envelope is accepted too.
 */
export function parseBackup(text: string): ParseBackupResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(text);
  } catch {
    return { ok: false, reason: "not-json" };
  }

  const asBackup = backupSchema.safeParse(parsed);
  if (asBackup.success) {
    return { ok: true, data: asBackup.data.data, meta: asBackup.data.meta ?? {} };
  }

  if (parsed && typeof parsed === "object" && "app" in (parsed as object)) {
    // It claimed to be some app's file but didn't validate — call it invalid.
    return { ok: false, reason: "invalid" };
  }

  const asData = letterDataSchema.safeParse(parsed);
  if (asData.success && Object.keys(asData.data).length > 0) {
    return { ok: true, data: asData.data, meta: {} };
  }

  return { ok: false, reason: "not-a-backup" };
}
