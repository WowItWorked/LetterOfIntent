import { describe, expect, it } from "vitest";
import { backupFilename, parseBackup, serializeBackup } from "@/lib/backup";
import type { LetterData } from "@/lib/schema";

const sample: LetterData = {
  gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
  medical: {
    medications: [{ id: "m1", name: "Keppra", dose: "500 mg", purpose: "Seizures" }],
    allergies: "Penicillin — hives",
  },
};

describe("backup round trip", () => {
  it("serialize → parse preserves data and meta", () => {
    const text = serializeBackup(sample, { lastVisitedSlug: "medical" });
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.gettingStarted?.authorName).toBe("Maria");
      expect(parsed.data.medical?.medications?.[0]?.name).toBe("Keppra");
      expect(parsed.meta.lastVisitedSlug).toBe("medical");
    }
  });

  it("rejects non-JSON", () => {
    expect(parseBackup("not json at all")).toEqual({ ok: false, reason: "not-json" });
  });

  it("rejects a different app's file", () => {
    const r = parseBackup(JSON.stringify({ app: "some-other-tool", version: 9, data: {} }));
    expect(r.ok).toBe(false);
  });

  it("accepts bare letter data without the envelope", () => {
    const r = parseBackup(JSON.stringify(sample));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.medical?.allergies).toContain("Penicillin");
  });

  it("rejects unrelated JSON objects", () => {
    expect(parseBackup(JSON.stringify({ hello: "world" })).ok).toBe(false);
  });

  it("strips unknown fields instead of failing (forward compatibility)", () => {
    const text = serializeBackup(sample, {});
    const withExtra = JSON.parse(text);
    withExtra.data.futureSection = { anything: "at all" };
    withExtra.data.medical.futureField = "ignored";
    const r = parseBackup(JSON.stringify(withExtra));
    expect(r.ok).toBe(true);
  });

  it("builds a safe filename", () => {
    expect(backupFilename("Alex / Jr", new Date(2026, 7, 7))).toBe(
      "letter-of-intent-backup-Alex-Jr-2026-08-07.json"
    );
    expect(backupFilename(undefined, new Date(2026, 7, 7))).toBe(
      "letter-of-intent-backup-2026-08-07.json"
    );
  });
});
