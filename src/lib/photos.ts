/**
 * Photograph storage.
 *
 * Two photos, and no more: a recent one of the person (which prints on the
 * emergency sheet) and one family photo with a caption.
 *
 * They live in IndexedDB rather than localStorage, which is typically capped
 * around 5 MB across the whole origin — one phone photo can exceed that on its
 * own, and blowing the quota would take the written letter down with it. The
 * caption is small and travels with the letter data instead.
 *
 * Nothing here leaves the device. There is no upload path anywhere in this
 * module, and the CSP pins connect-src to 'self'.
 */

export type PhotoSlot = "recent" | "family";

export interface StoredPhoto {
  slot: PhotoSlot;
  /** The image itself, exactly as the family chose it. */
  blob: Blob;
  type: string;
  name: string;
  addedAt: string;
  /** Only the family photo carries one. */
  caption?: string;
}

const DB_NAME = "twl-loi-photos";
const DB_VERSION = 1;
const STORE = "photos";

/** Above this, browsers and the PDF renderer both start to struggle. */
export const MAX_PHOTO_BYTES = 8 * 1024 * 1024;

export const ACCEPTED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/heic"];

/**
 * What the file actually is, read from its first bytes.
 *
 * A file's name and its reported MIME type are both attacker-controlled — a
 * renamed .svg passes `type.startsWith("image/")` and an SVG is a document
 * that can carry script. Sniffing the header is the only check that means
 * anything, and it is cheap: the first 12 bytes are enough.
 */
export async function sniffImageType(file: Blob): Promise<string | null> {
  const head = new Uint8Array(await file.slice(0, 12).arrayBuffer());
  const startsWith = (...bytes: number[]) => bytes.every((b, i) => head[i] === b);
  const ascii = (offset: number, text: string) =>
    [...text].every((c, i) => head[offset + i] === c.charCodeAt(0));

  if (startsWith(0xff, 0xd8, 0xff)) return "image/jpeg";
  if (startsWith(0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a)) return "image/png";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  // HEIC/HEIF: an ISO-BMFF box whose brand starts "hei" or "mif".
  if (ascii(4, "ftyp") && (ascii(8, "hei") || ascii(8, "mif"))) return "image/heic";
  return null;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: "slot" });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function tx<T>(mode: IDBTransactionMode, run: (store: IDBObjectStore) => IDBRequest<T>) {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const t = db.transaction(STORE, mode);
        const req = run(t.objectStore(STORE));
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => reject(req.error);
        t.oncomplete = () => db.close();
      })
  );
}

export async function putPhoto(
  slot: PhotoSlot,
  file: File,
  caption?: string
): Promise<StoredPhoto> {
  const record: StoredPhoto = {
    slot,
    blob: file,
    type: file.type,
    name: file.name,
    addedAt: new Date().toISOString(),
    caption,
  };
  await tx("readwrite", (s) => s.put(record));
  return record;
}

/** Updates the family photo's caption without touching the image. */
export async function setCaption(slot: PhotoSlot, caption: string): Promise<void> {
  const existing = await getPhoto(slot);
  if (!existing) return;
  await tx("readwrite", (s) => s.put({ ...existing, caption }));
}

export async function getPhoto(slot: PhotoSlot): Promise<StoredPhoto | undefined> {
  try {
    return await tx<StoredPhoto | undefined>("readonly", (s) => s.get(slot));
  } catch {
    return undefined;
  }
}

export async function getAllPhotos(): Promise<StoredPhoto[]> {
  try {
    return await tx<StoredPhoto[]>("readonly", (s) => s.getAll());
  } catch {
    return [];
  }
}

export async function deletePhoto(slot: PhotoSlot): Promise<void> {
  await tx("readwrite", (s) => s.delete(slot));
}

export async function deleteAllPhotos(): Promise<void> {
  try {
    await tx("readwrite", (s) => s.clear());
  } catch {
    // No database yet — nothing to clear.
  }
}

/** Data URL, for the PDF renderer and for backup files. */
export function blobToDataUrl(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const r = new FileReader();
    r.onload = () => resolve(String(r.result));
    r.onerror = () => reject(r.error);
    r.readAsDataURL(blob);
  });
}

/**
 * Decoded by hand rather than with `fetch(dataUrl)` — synchronous, and it
 * keeps this module working no matter how tightly connect-src is pinned.
 */
export function dataUrlToBlob(dataUrl: string): Blob {
  const [header, encoded] = dataUrl.split(",", 2);
  const type = /data:([^;]+)/.exec(header)?.[1] ?? "application/octet-stream";
  const binary = atob(encoded ?? "");
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return new Blob([bytes], { type });
}

export function isSupported(): boolean {
  return typeof indexedDB !== "undefined";
}

/* ---------------------------------------------------------------- backups */

/** Photographs in the shape the backup file carries them. */
export async function photosForBackup() {
  const all = await getAllPhotos();
  return Promise.all(
    all.map(async (p) => ({
      slot: p.slot,
      dataUrl: await blobToDataUrl(p.blob),
      name: p.name,
      type: p.type,
      addedAt: p.addedAt,
      caption: p.caption,
    }))
  );
}

/** Restores photographs from a backup, replacing whatever is on the device. */
export async function restorePhotos(
  photos: Array<{
    slot: PhotoSlot;
    dataUrl: string;
    name?: string;
    type?: string;
    addedAt?: string;
    caption?: string;
  }>
): Promise<void> {
  await deleteAllPhotos();
  for (const p of photos) {
    const blob = dataUrlToBlob(p.dataUrl);
    const record: StoredPhoto = {
      slot: p.slot,
      blob,
      type: p.type ?? blob.type,
      name: p.name ?? `${p.slot}.jpg`,
      addedAt: p.addedAt ?? new Date().toISOString(),
      caption: p.caption,
    };
    await tx("readwrite", (s) => s.put(record));
  }
}
