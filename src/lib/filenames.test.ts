import { describe, expect, it } from "vitest";
import { documentFilename, isoDate } from "@/lib/filenames";

const AUG = new Date(2026, 7, 8); // 8 August 2026, local time

describe("download filenames", () => {
  it("says which document and which question set it came from", () => {
    expect(documentFilename("letter", "special-needs", AUG)).toBe(
      "Letter-of-Intent-Disabilities-2026-08-08.pdf"
    );
    expect(documentFilename("letter", "general", AUG)).toBe(
      "Letter-of-Intent-Anyone-2026-08-08.pdf"
    );
    expect(documentFilename("backup", "special-needs", AUG)).toBe(
      "Letter-of-Intent-Disabilities-Backup-2026-08-08.json"
    );
    expect(documentFilename("backup", "general", AUG)).toBe(
      "Letter-of-Intent-Anyone-Backup-2026-08-08.json"
    );
  });

  it("does not qualify the emergency sheet — it is the same one-pager either way", () => {
    expect(documentFilename("emergency", "special-needs", AUG)).toBe(
      "Emergency-Information-Sheet-2026-08-08.pdf"
    );
    expect(documentFilename("emergency", "general", AUG)).toBe(
      "Emergency-Information-Sheet-2026-08-08.pdf"
    );
  });

  /**
   * The point of the whole module. A filename is read by anyone who can see
   * the screen, the downloads folder, or the sync notification.
   */
  it("never carries a person's name", () => {
    const identifying = /alex|bonnie|anderson|davis|emily|maria/i;
    for (const kind of ["letter", "emergency", "backup"] as const) {
      for (const path of ["special-needs", "general"] as const) {
        expect(identifying.test(documentFilename(kind, path, AUG))).toBe(false);
      }
    }
  });

  it("uses a sortable local date, not UTC", () => {
    // Late evening local time must not roll forward to tomorrow's date.
    const lateEvening = new Date(2026, 0, 31, 23, 30);
    expect(isoDate(lateEvening)).toBe("2026-01-31");
    expect(documentFilename("letter", "special-needs", lateEvening)).toContain("2026-01-31");
  });

  it("falls back to the default set when the path is unknown", () => {
    expect(documentFilename("letter", undefined, AUG)).toBe(
      "Letter-of-Intent-Disabilities-2026-08-08.pdf"
    );
  });

  it("produces names that need no escaping on any filesystem", () => {
    const unsafe = /[<>:"/\\|?*\s]/;
    for (const kind of ["letter", "emergency", "backup"] as const) {
      expect(unsafe.test(documentFilename(kind, "general", AUG))).toBe(false);
    }
  });
});
