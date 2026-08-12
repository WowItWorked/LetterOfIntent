/**
 * A minimal ZIP writer, stored (uncompressed) entries only.
 *
 * Zero-dependency on purpose, like lib/cards/capture.ts: this runs in the
 * browser on a device holding a family's letter, and the privacy gate means
 * every byte has to be accounted for. A store-only writer is ~100 lines and
 * costs nothing here — PNG is already DEFLATE-compressed internally, so
 * re-compressing the card images would burn CPU to save low single-digit
 * percentages.
 *
 * Scope, deliberately: no ZIP64, no encryption, no directories. The card pack
 * is eight files of a few hundred KB, four orders of magnitude below the
 * 4 GiB/65535-entry point where ZIP64 becomes necessary.
 */

export interface ZipEntry {
  /** Stored path. Card names carry spaces and em dashes; both are fine. */
  name: string;
  bytes: Uint8Array;
}

/* -------------------------------------------------------------------- crc32 */

/** Standard IEEE 802.3 table, built once on first use. */
let CRC_TABLE: Uint32Array | null = null;

function crcTable(): Uint32Array {
  if (CRC_TABLE) return CRC_TABLE;
  const t = new Uint32Array(256);
  for (let i = 0; i < 256; i++) {
    let c = i;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[i] = c >>> 0;
  }
  CRC_TABLE = t;
  return t;
}

export function crc32(bytes: Uint8Array): number {
  const t = crcTable();
  let c = 0xffffffff;
  for (let i = 0; i < bytes.length; i++) c = t[(c ^ bytes[i]) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

/* --------------------------------------------------------------- date/time */

/**
 * MS-DOS date and time, the only timestamp ZIP's base format carries. Two
 * seconds is its resolution — the low bit of the seconds field does not exist.
 * Callers pass the date explicitly so nothing here reads a clock.
 */
export function dosDateTime(d: Date): { date: number; time: number } {
  const year = Math.max(1980, d.getFullYear());
  return {
    date: (((year - 1980) & 0x7f) << 9) | ((d.getMonth() + 1) << 5) | d.getDate(),
    time: (d.getHours() << 11) | (d.getMinutes() << 5) | (d.getSeconds() >> 1),
  };
}

/* ------------------------------------------------------------------ writer */

/** General-purpose bit 11: the name is UTF-8, not CP437. Card names need it. */
const UTF8_NAME_FLAG = 0x0800;
const VERSION_NEEDED = 20; // 2.0 — the floor for a stored entry
const METHOD_STORE = 0;

function writeU16(view: DataView, at: number, v: number): void {
  view.setUint16(at, v, true); // ZIP is little-endian throughout
}
function writeU32(view: DataView, at: number, v: number): void {
  view.setUint32(at, v >>> 0, true);
}

/**
 * Builds the archive. Entry order is preserved: the central directory lists
 * files in the order given, which is the order most viewers display.
 */
export function createZip(entries: readonly ZipEntry[], modified: Date): Uint8Array {
  const encoder = new TextEncoder();
  const prepared = entries.map((e) => {
    const name = encoder.encode(e.name);
    return { name, bytes: e.bytes, crc: crc32(e.bytes) };
  });
  const { date, time } = dosDateTime(modified);

  const localSize = prepared.reduce((n, p) => n + 30 + p.name.length + p.bytes.length, 0);
  const centralSize = prepared.reduce((n, p) => n + 46 + p.name.length, 0);
  const out = new Uint8Array(localSize + centralSize + 22);
  const view = new DataView(out.buffer);

  // --------------------------------------------------------- local headers
  const offsets: number[] = [];
  let at = 0;
  for (const p of prepared) {
    offsets.push(at);
    writeU32(view, at, 0x04034b50);
    writeU16(view, at + 4, VERSION_NEEDED);
    writeU16(view, at + 6, UTF8_NAME_FLAG);
    writeU16(view, at + 8, METHOD_STORE);
    writeU16(view, at + 10, time);
    writeU16(view, at + 12, date);
    writeU32(view, at + 14, p.crc);
    writeU32(view, at + 18, p.bytes.length); // compressed === uncompressed
    writeU32(view, at + 22, p.bytes.length);
    writeU16(view, at + 26, p.name.length);
    writeU16(view, at + 28, 0); // no extra field
    out.set(p.name, at + 30);
    out.set(p.bytes, at + 30 + p.name.length);
    at += 30 + p.name.length + p.bytes.length;
  }

  // ----------------------------------------------------- central directory
  const centralStart = at;
  for (let i = 0; i < prepared.length; i++) {
    const p = prepared[i];
    writeU32(view, at, 0x02014b50);
    writeU16(view, at + 4, VERSION_NEEDED); // version made by
    writeU16(view, at + 6, VERSION_NEEDED); // version needed
    writeU16(view, at + 8, UTF8_NAME_FLAG);
    writeU16(view, at + 10, METHOD_STORE);
    writeU16(view, at + 12, time);
    writeU16(view, at + 14, date);
    writeU32(view, at + 16, p.crc);
    writeU32(view, at + 20, p.bytes.length);
    writeU32(view, at + 24, p.bytes.length);
    writeU16(view, at + 28, p.name.length);
    writeU16(view, at + 30, 0); // extra
    writeU16(view, at + 32, 0); // comment
    writeU16(view, at + 34, 0); // disk number
    writeU16(view, at + 36, 0); // internal attrs
    writeU32(view, at + 38, 0); // external attrs
    writeU32(view, at + 42, offsets[i]);
    out.set(p.name, at + 46);
    at += 46 + p.name.length;
  }

  // ------------------------------------------------------------------ EOCD
  writeU32(view, at, 0x06054b50);
  writeU16(view, at + 4, 0); // this disk
  writeU16(view, at + 6, 0); // disk with central directory
  writeU16(view, at + 8, prepared.length);
  writeU16(view, at + 10, prepared.length);
  writeU32(view, at + 12, at - centralStart);
  writeU32(view, at + 16, centralStart);
  writeU16(view, at + 20, 0); // no archive comment

  return out;
}

/** The archive as a Blob, ready for triggerDownload. */
export function createZipBlob(entries: readonly ZipEntry[], modified: Date): Blob {
  // Copy through a fresh ArrayBuffer so the Blob never aliases a view with a
  // byteOffset — Safari has historically mishandled that.
  return new Blob([createZip(entries, modified).slice().buffer], {
    type: "application/zip",
  });
}
