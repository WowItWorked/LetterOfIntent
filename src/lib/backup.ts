import {
  BACKUP_APP_ID,
  BACKUP_VERSION,
  backupPhotoSchema,
  letterMetaSchema,
  letterPathSchema,
  sectionKeys,
  sectionSchemas,
  type Backup,
  type BackupPhoto,
  type LetterData,
  type LetterMeta,
  type LetterPath,
  type SectionKey,
} from "@/lib/schema";
import { LETTER_PATHS } from "@/lib/content/paths";

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
  /** Sections that were present but could not be read. */
  skipped: SectionKey[];
  /** Top-level keys that are not sections of either letter. */
  unknown: string[];
}

export type PathSource = "declared" | "inferred" | "unknown";

export type ParseBackupResult =
  | {
      ok: true;
      data: LetterData;
      meta: LetterMeta;
      photos?: BackupPhoto[];
      /** Null when the file does not say and its sections do not give it away. */
      path: LetterPath | null;
      pathSource: PathSource;
      salvage: SalvageReport;
    }
  | {
      ok: false;
      reason: "too-large" | "not-json" | "not-a-backup" | "empty";
    };

/** Sections unique to one path — the fingerprint used to infer the template. */
const EXCLUSIVE: Record<LetterPath, SectionKey[]> = {
  "special-needs": [],
  general: [],
};
{
  const bySide = LETTER_PATHS.map((p) => ({
    id: p.id,
    keys: new Set(p.sections.map((s) => s.key)),
  }));
  for (const side of bySide) {
    const others = bySide.filter((o) => o.id !== side.id);
    EXCLUSIVE[side.id] = [...side.keys].filter((k) => !others.some((o) => o.keys.has(k)));
  }
}

/**
 * Which letter a restored file belongs to.
 *
 * A file written by this version says so outright. One written before the
 * second path existed does not, so we look at which sections it actually
 * contains: `trustee` and `behavior` only exist in one set, `steppingIn` and
 * `homeLiving` only in the other. A file holding nothing but the four shared
 * sections genuinely cannot be told apart — that is what `null` means, and the
 * caller has to ask.
 */
export function detectLetterPath(
  data: LetterData,
  meta: LetterMeta | undefined
): { path: LetterPath | null; source: PathSource } {
  const declared = letterPathSchema.safeParse(meta?.letterPath);
  if (declared.success) return { path: declared.data, source: "declared" };

  const present = new Set(Object.keys(data) as SectionKey[]);
  const scores = LETTER_PATHS.map((p) => ({
    id: p.id,
    hits: EXCLUSIVE[p.id].filter((k) => present.has(k)).length,
  }));
  const best = [...scores].sort((a, b) => b.hits - a.hits);

  if (best[0].hits > 0 && best[0].hits > best[1].hits) {
    return { path: best[0].id, source: "inferred" };
  }
  return { path: null, source: "unknown" };
}

/**
 * Reads each section on its own so one malformed answer cannot cost a family
 * the rest of the letter. A whole-object parse would reject the file outright.
 */
function salvageSections(raw: unknown): { data: LetterData; report: SalvageReport } {
  const report: SalvageReport = { restored: [], skipped: [], unknown: [] };
  const data: Record<string, unknown> = {};
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) {
    return { data: {}, report };
  }

  for (const [key, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!(sectionKeys as string[]).includes(key)) {
      report.unknown.push(key);
      continue;
    }
    const schema = sectionSchemas[key as SectionKey];
    const parsed = schema.safeParse(value);
    if (parsed.success && Object.keys(parsed.data).length > 0) {
      data[key] = parsed.data;
      report.restored.push(key as SectionKey);
    } else if (parsed.success) {
      // Present but empty — nothing to restore and nothing to apologise for.
      report.restored.push(key as SectionKey);
      data[key] = parsed.data;
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

/**
 * Reads a backup file. Deliberately forgiving about shape and unforgiving
 * about size and type: a family should never lose a letter to a typo, and the
 * file is still untrusted input.
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
  const { data, report } = salvageSections(rawData);

  if (report.restored.length === 0) {
    // Nothing recognisable. If it never looked like ours, say so; if it did,
    // it is a real backup we could not read.
    return { ok: false, reason: envelope ? "empty" : "not-a-backup" };
  }

  const meta = envelope
    ? (letterMetaSchema.safeParse(root.meta).data ?? {})
    : ({} as LetterMeta);
  const { path, source } = detectLetterPath(data, meta);
  const photos = envelope ? salvagePhotos(root.photos) : undefined;

  return {
    ok: true,
    data,
    meta: path ? { ...meta, letterPath: path } : meta,
    photos,
    path,
    pathSource: source,
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

export { BACKUP_VERSION };
