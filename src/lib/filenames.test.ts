import { describe, expect, it } from "vitest";
import { documentFilename, isoDate } from "@/lib/filenames";

const AUG = new Date(2026, 7, 8); // 8 August 2026, local time

const KINDS = ["letter", "caregiver", "emergency", "backup"] as const;

describe("download filenames", () => {
  it("says which document it is, plus the date — no question-set qualifier now that there is one form", () => {
    expect(documentFilename("letter", AUG)).toBe("Letter-of-Intent-2026-08-08.pdf");
    expect(documentFilename("caregiver", AUG)).toBe("Letter-for-the-Caregiver-2026-08-08.pdf");
    expect(documentFilename("emergency", AUG)).toBe("Emergency-Information-Sheet-2026-08-08.pdf");
    expect(documentFilename("backup", AUG)).toBe("Letter-of-Intent-Backup-2026-08-08.json");
  });

  /**
   * The point of the whole module. A filename is read by anyone who can see
   * the screen, the downloads folder, or the sync notification.
   */
  it("never carries a person's name", () => {
    const identifying = /alex|bonnie|anderson|davis|emily|maria/i;
    for (const kind of KINDS) {
      expect(identifying.test(documentFilename(kind, AUG))).toBe(false);
    }
  });

  it("uses a sortable local date, not UTC", () => {
    // Late evening local time must not roll forward to tomorrow's date.
    const lateEvening = new Date(2026, 0, 31, 23, 30);
    expect(isoDate(lateEvening)).toBe("2026-01-31");
    expect(documentFilename("letter", lateEvening)).toContain("2026-01-31");
  });

  it("produces names that need no escaping on any filesystem", () => {
    const unsafe = /[<>:"/\\|?*\s]/;
    for (const kind of KINDS) {
      expect(unsafe.test(documentFilename(kind, AUG))).toBe(false);
    }
  });
});
