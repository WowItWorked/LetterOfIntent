import { describe, expect, it } from "vitest";
import { buildReviewReminderIcs, escapeIcsText, foldIcsLine } from "@/lib/ics";

describe("ics generation", () => {
  const now = new Date(2026, 7, 7, 15, 30, 0); // Aug 7, 2026, local time

  it("schedules an all-day event exactly one year out", () => {
    const { content, filename } = buildReviewReminderIcs("Alex", now);
    expect(filename).toMatch(/\.ics$/);
    expect(content).toContain("DTSTART;VALUE=DATE:20270807");
    expect(content).toContain("DTEND;VALUE=DATE:20270808");
    expect(content).toContain("BEGIN:VCALENDAR");
    expect(content).toContain("END:VCALENDAR");
    expect(content).toContain("SUMMARY:Review Alex's Letter of Intent");
  });

  it("uses CRLF line endings and folds long lines under 76 octets", () => {
    const { content } = buildReviewReminderIcs("Alexandria-Rose", now);
    expect(content.includes("\r\n")).toBe(true);
    expect(content.replace(/\r\n/g, "").includes("\n")).toBe(false);
    for (const line of content.split("\r\n")) {
      expect(line.length).toBeLessThanOrEqual(75);
    }
  });

  it("escapes reserved characters in text values", () => {
    expect(escapeIcsText("a,b;c\nd\\e")).toBe("a\\,b\\;c\\nd\\\\e");
    const { content } = buildReviewReminderIcs("Alex, Jr", now);
    expect(content).toContain("Alex\\, Jr");
  });

  it("folding round-trips: continuation lines start with a space", () => {
    const folded = foldIcsLine(`DESCRIPTION:${"x".repeat(200)}`);
    const lines = folded.split("\r\n");
    expect(lines.length).toBeGreaterThan(1);
    for (const l of lines.slice(1)) expect(l.startsWith(" ")).toBe(true);
    expect(lines.map((l, i) => (i === 0 ? l : l.slice(1))).join("")).toBe(
      `DESCRIPTION:${"x".repeat(200)}`
    );
  });
});
