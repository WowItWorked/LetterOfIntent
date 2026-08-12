import { describe, expect, it } from "vitest";
import { createZip, crc32, dosDateTime } from "@/lib/zip";

/**
 * The writer is hand-rolled, so these tests do two jobs: check the checksum
 * against published vectors, and read the archive back out with an
 * independent parser written here. A writer validated only by its own reader
 * proves nothing, so the parser below follows the spec's offsets literally
 * rather than reusing anything from lib/zip.ts.
 */

const te = new TextEncoder();
const td = new TextDecoder();

/* ------------------------------------------------- an independent reader */

interface ParsedEntry {
  name: string;
  bytes: Uint8Array;
  crc: number;
  method: number;
  flags: number;
}

/** Walks the End of Central Directory → central directory → local headers. */
function readZip(zip: Uint8Array): ParsedEntry[] {
  const view = new DataView(zip.buffer, zip.byteOffset, zip.byteLength);

  // EOCD is the last 22 bytes when there is no archive comment.
  const eocd = zip.length - 22;
  expect(view.getUint32(eocd, true), "EOCD signature").toBe(0x06054b50);
  const count = view.getUint16(eocd + 10, true);
  const centralStart = view.getUint32(eocd + 16, true);

  const out: ParsedEntry[] = [];
  let at = centralStart;
  for (let i = 0; i < count; i++) {
    expect(view.getUint32(at, true), "central header signature").toBe(0x02014b50);
    const flags = view.getUint16(at + 8, true);
    const method = view.getUint16(at + 10, true);
    const crc = view.getUint32(at + 16, true);
    const size = view.getUint32(at + 24, true);
    const nameLen = view.getUint16(at + 28, true);
    const localAt = view.getUint32(at + 42, true);
    const name = td.decode(zip.subarray(at + 46, at + 46 + nameLen));

    // Follow the pointer into the local header and take the data from there.
    expect(view.getUint32(localAt, true), "local header signature").toBe(0x04034b50);
    const localNameLen = view.getUint16(localAt + 26, true);
    const extraLen = view.getUint16(localAt + 28, true);
    const dataAt = localAt + 30 + localNameLen + extraLen;

    out.push({ name, crc, method, flags, bytes: zip.subarray(dataAt, dataAt + size) });
    at += 46 + nameLen + view.getUint16(at + 30, true) + view.getUint16(at + 32, true);
  }
  return out;
}

/* -------------------------------------------------------------------- crc */

describe("crc32", () => {
  it("matches the published check value for \"123456789\"", () => {
    expect(crc32(te.encode("123456789"))).toBe(0xcbf43926);
  });

  it("matches the standard vector for the quick brown fox", () => {
    expect(crc32(te.encode("The quick brown fox jumps over the lazy dog"))).toBe(
      0x414fa339
    );
  });

  it("is 0 for empty input", () => {
    expect(crc32(new Uint8Array(0))).toBe(0);
  });
});

/* ------------------------------------------------------------- dos time */

describe("dosDateTime", () => {
  it("packs a date into the MS-DOS fields", () => {
    const { date, time } = dosDateTime(new Date(2026, 7, 12, 13, 45, 30));
    expect((date >> 9) + 1980).toBe(2026);
    expect((date >> 5) & 0x0f).toBe(8); // August
    expect(date & 0x1f).toBe(12);
    expect(time >> 11).toBe(13);
    expect((time >> 5) & 0x3f).toBe(45);
    expect((time & 0x1f) * 2).toBe(30); // two-second resolution
  });

  it("clamps years before the epoch DOS can express", () => {
    const { date } = dosDateTime(new Date(1970, 0, 1));
    expect((date >> 9) + 1980).toBe(1980);
  });
});

/* ------------------------------------------------------------------- zip */

describe("createZip", () => {
  const when = new Date(2026, 7, 12, 9, 0, 0);

  it("round-trips names and bytes through an independent parser", () => {
    const entries = [
      { name: "Alex — Emergency Protocol.png", bytes: te.encode("first payload") },
      { name: "Alex — Medications 2 of 3.png", bytes: te.encode("second") },
      { name: "Which Cards To Send.png", bytes: new Uint8Array([0x89, 0x50, 0x4e, 0x47]) },
    ];

    const parsed = readZip(createZip(entries, when));
    expect(parsed.map((e) => e.name)).toEqual(entries.map((e) => e.name));
    for (let i = 0; i < entries.length; i++) {
      expect([...parsed[i].bytes]).toEqual([...entries[i].bytes]);
      expect(parsed[i].crc).toBe(crc32(entries[i].bytes));
      expect(parsed[i].method, "entries are stored, never deflated").toBe(0);
    }
  });

  it("flags names as UTF-8 — card names carry em dashes", () => {
    const parsed = readZip(
      createZip([{ name: "Alex — Daily Routine.png", bytes: te.encode("x") }], when)
    );
    expect(parsed[0].flags & 0x0800, "general purpose bit 11").toBe(0x0800);
    expect(parsed[0].name).toBe("Alex — Daily Routine.png");
  });

  it("writes a readable archive for an empty entry list", () => {
    const zip = createZip([], when);
    expect(zip.length).toBe(22); // EOCD only
    expect(readZip(zip)).toEqual([]);
  });

  it("survives a zero-byte member", () => {
    const parsed = readZip(createZip([{ name: "empty.png", bytes: new Uint8Array(0) }], when));
    expect(parsed[0].bytes.length).toBe(0);
    expect(parsed[0].crc).toBe(0);
  });

  it("keeps every entry's data intact when several are stored together", () => {
    // Offsets are the easiest thing to get wrong: one bad length and every
    // later entry reads from the wrong place while the first still passes.
    const entries = Array.from({ length: 8 }, (_, i) => ({
      name: `card-${i}.png`,
      bytes: te.encode(`payload-${i}-`.repeat(i * 37 + 1)),
    }));
    const parsed = readZip(createZip(entries, when));
    expect(parsed).toHaveLength(8);
    for (let i = 0; i < entries.length; i++) {
      expect(td.decode(parsed[i].bytes), `entry ${i}`).toBe(td.decode(entries[i].bytes));
    }
  });
});
