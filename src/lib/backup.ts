import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  backupPhotoSchema,
  letterMetaSchema,
  sectionKeys,
  sectionSchemas,
  marksSchema,
  type Backup,
  type BackupPhoto,
  type LetterData,
  type LetterMeta,
  type SectionKey,
} from "@/lib/schema";
import { inferMetaFromV1, migrateLetterData, V1_ONLY_SECTION_KEYS } from "@/lib/migrate";

/* -------------------------------------------------------------------------- */
/*                                   limits                                   */
/* -------------------------------------------------------------------------- */

/**
 * A letter is text. Even a long one with two photographs inlined as data URLs
 * lands well under this, so anything larger is a mistake or an attempt to hang
 * the tab in `JSON.parse`. Checked before the string is ever parsed.
 */
export const MAX_BACKUP_BYTES = 24 * 1024 * 1024;

/** Guards against a data: URL that is really a 200 MB payload. */
const MAX_PHOTO_DATA_URL_CHARS = 12 * 1024 * 1024;

/** Only these can appear in a restored photograph. */
const PHOTO_DATA_URL = /^data:image\/(jpeg|png|webp|heic|heif);base64,[A-Za-z0-9+/=]+$/;

/* -------------------------------------------------------------------------- */
/*                                   writing                                  */
/* -------------------------------------------------------------------------- */

export function serializeBackup(
  data: LetterData,
  meta: LetterMeta,
  photos?: BackupPhoto[]
): string {
  const backup: Backup = {
    app: BACKUP_APP_ID,
    version: BACKUP_VERSION,
    exportedAt: new Date().toISOString(),
    data,
    meta,
    ...(photos && photos.length ? { photos } : {}),
  };
  return JSON.stringify(backup, null, 2);
}

/* -------------------------------------------------------------------------- */
/*                                   reading                                  */
/* -------------------------------------------------------------------------- */

/** Keys that let attacker-controlled JSON reach `Object.prototype`. */
const POLLUTING_KEYS = new Set(["__proto__", "constructor", "prototype"]);

/**
 * Rebuilds a parsed JSON value with only its own, non-polluting keys.
 *
 * `JSON.parse` itself is safe — it does not walk the prototype chain — but the
 * object it returns can carry a literal `__proto__` key that poisons anything
 * downstream doing a naive merge or spread. Zod would strip unknown keys, and
 * we do not merge raw input anywhere; this is defence in depth on untrusted
 * input that arrives as a file.
 */
function sanitize(value: unknown, depth = 0): unknown {
  if (depth > 12) return undefined; // absurdly nested input is not a letter
  if (Array.isArray(value)) return value.map((v) => sanitize(v, depth + 1));
  if (value === null || typeof value !== "object") return value;

  const out: Record<string, unknown> = Object.create(null);
  for (const [key, v] of Object.entries(value as Record<string, unknown>)) {
    if (POLLUTING_KEYS.has(key)) continue;
    out[key] = sanitize(v, depth + 1);
  }
  // Back to an ordinary object so zod and React see a plain shape.
  return { ...out };
}

export interface SalvageReport {
  /** Sections read back intact. */
  restored: SectionKey[];
  /** Sections that were present but could not be read — canonical keys, or
   *  legacy v1 keys whose value was junk before migration could read it. */
  skipped: string[];
  /** Top-level keys that are not (and never were) sections of the letter. */
  unknown: string[];
}

export type ParseBackupResult =
  | {
      ok: true;
      data: LetterData;
      meta: LetterMeta;
      photos?: BackupPhoto[];
      /** When the file was written, from its envelope — the replace-warning
       *  dialog compares it against the letter on the device. */
      exportedAt?: string;
      /** True when the file predates the canonical schema and was migrated.
       *  A v1 file imports cleanly forever — permanent commitment. */
      migratedFromV1: boolean;
      /** "section.field" keys where the migration preserved two answers. */
      combined: string[];
      salvage: SalvageReport;
    }
  | {
      ok: false;
      reason: "too-large" | "not-json" | "not-a-backup" | "empty";
    };

/**
 * Reads each section on its own so one malformed answer cannot cost a family
 * the rest of the letter. A whole-object parse would reject the file outright.
 * Runs on CANONICAL data — v1 shapes are migrated before they get here.
 */
function salvageSections(raw: unknown): { data: LetterData; report: SalvageReport } {
  const report: SalvageReport = { restored: [], skipped: [], unknown: [] };
  const data: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { data: {}, report };
  }

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (key === "marks") {
      const parsed = marksSchema.safeParse(value);
      if (parsed.success) data.marks = parsed.data;
      continue;
    }
    if (!(sectionKeys as string[]).includes(key)) {
      report.unknown.push(key);
      continue;
    }
    const schema = sectionSchemas[key as SectionKey];
    const parsed = schema.safeParse(value);
    if (parsed.success) {
      data[key] = parsed.data;
      report.restored.push(key as SectionKey);
    } else {
      report.skipped.push(key as SectionKey);
    }
  }
  return { data: data as LetterData, report };
}

/** Drops any photograph that is not a plausibly-sized inline image. */
function salvagePhotos(raw: unknown): BackupPhoto[] | undefined {
  if (!Array.isArray(raw)) return undefined;
  const out: BackupPhoto[] = [];
  for (const item of raw.slice(0, 2)) {
    const parsed = backupPhotoSchema.safeParse(item);
    if (!parsed.success) continue;
    const { dataUrl } = parsed.data;
    if (dataUrl.length > MAX_PHOTO_DATA_URL_CHARS) continue;
    if (!PHOTO_DATA_URL.test(dataUrl)) continue;
    out.push(parsed.data);
  }
  return out.length ? out : undefined;
}

/** True when a raw data object carries any section key only v1 ever wrote. */
function looksLikeV1(raw: unknown): boolean {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return false;
  const keys = Object.keys(raw as Record<string, unknown>);
  if (keys.some((k) => V1_ONLY_SECTION_KEYS.includes(k))) return true;
  // Old `communication` shape: fields the canonical section renamed.
  const comm = (raw as Record<string, unknown>).communication;
  if (comm && typeof comm === "object" && !Array.isArray(comm)) {
    const c = comm as Record<string, unknown>;
    if ("whatToSay" in c || "whatNotToSay" in c) return true;
  }
  return false;
}

/**
 * Reads a backup file. Deliberately forgiving about shape and unforgiving
 * about size and type: a family should never lose a letter to a typo, and the
 * file is still untrusted input. v1 envelopes (and bare v1 data with no
 * envelope at all) migrate to canonical on the way in — forever.
 */
export function parseBackup(text: string): ParseBackupResult {
  if (text.length > MAX_BACKUP_BYTES) return { ok: false, reason: "too-large" };

  let parsed: unknown;
  try {
    parsed = sanitize(JSON.parse(text));
  } catch {
    return { ok: false, reason: "not-json" };
  }

  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    return { ok: false, reason: "not-a-backup" };
  }

  const root = parsed as Record<string, unknown>;
  const envelope = typeof root.app === "string";

  // A file that names a different app is not ours to read, whatever it holds.
  if (envelope && root.app !== BACKUP_APP_ID) {
    return { ok: false, reason: "not-a-backup" };
  }

  const rawData = envelope ? root.data : root;
  const rawMeta = envelope ? root.meta : undefined;
  const declaredVersion = typeof root.version === "number" ? root.version : undefined;
  const isV1 =
    (envelope && declaredVersion !== undefined && declaredVersion < 2) ||
    looksLikeV1(rawData);

  let combined: string[] = [];
  let dataForSalvage = rawData;
  if (isV1) {
    const migrated = migrateLetterData(rawData, rawMeta);
    dataForSalvage = migrated.data;
    combined = migrated.combined;
  }

  const { data, report } = salvageSections(dataForSalvage);

  // Migration can only read a legacy section that is an object; a v1 key
  // holding junk vanishes before salvage sees it. Report it rather than
  // silently dropping — the promise is that nothing disappears unannounced.
  if (isV1 && rawData && typeof rawData === "object" && !Array.isArray(rawData)) {
    for (const [k, v] of Object.entries(rawData as Record<string, unknown>)) {
      const legacyKey = V1_ONLY_SECTION_KEYS.includes(k) || (sectionKeys as string[]).includes(k);
      const unreadable = v === null || typeof v !== "object" || Array.isArray(v);
      if (legacyKey && unreadable && !report.skipped.includes(k)) report.skipped.push(k);
    }
  }

  if (report.restored.length === 0) {
    // Nothing recognisable. If it never looked like ours, say so; if it did,
    // it is a real backup we could not read.
    return { ok: false, reason: envelope ? "empty" : "not-a-backup" };
  }

  let meta: LetterMeta = envelope
    ? (letterMetaSchema.safeParse(rawMeta).data ?? {})
    : ({} as LetterMeta);
  if (isV1) {
    meta = { ...meta, ...inferMetaFromV1(data, rawMeta) };
  }
  const photos = envelope ? salvagePhotos(root.photos) : undefined;

  return {
    ok: true,
    data,
    meta,
    photos,
    exportedAt:
      envelope && typeof root.exportedAt === "string" ? root.exportedAt : undefined,
    migratedFromV1: isV1,
    combined,
    salvage: report,
  };
}

/** Version of the file, when it says. Used only for the wording of messages. */
export function backupVersion(text: string): number | undefined {
  try {
    const v = (JSON.parse(text) as { version?: unknown }).version;
    return typeof v === "number" ? v : undefined;
  } catch {
    return undefined;
  }
}

/** exportedAt from the envelope, for the replace-warning dialog's comparison. */
export function backupExportedAt(text: string): string | undefined {
  try {
    const v = (JSON.parse(text) as { exportedAt?: unknown }).exportedAt;
    return typeof v === "string" ? v : undefined;
  } catch {
    return undefined;
  }
}

export { BACKUP_VERSION };
