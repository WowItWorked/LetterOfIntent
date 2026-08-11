/**
 * Names for the files a family downloads.
 *
 * Two rules, and the second one is the important one:
 *
 * 1. The name says what the file is — which document — plus the date it was
 *    created, so a folder with three years of downloads sorts and reads
 *    correctly. (There is one form now, so the name no longer carries a
 *    question-set qualifier.)
 *
 * 2. The name never says *who* it is about. Downloads land in shared folders,
 *    get synced to cloud drives, and are read out by screen readers in open-
 *    plan offices; a filename carrying "Letter-of-Intent-Alex" discloses a
 *    disability to anyone who glances at the screen. The person's name is
 *    inside the document, where the family chose to put it.
 */

export type DocumentKind = "letter" | "caregiver" | "emergency" | "backup";

/** Local calendar date — the day the family pressed the button. */
export function isoDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function documentFilename(kind: DocumentKind, now: Date = new Date()): string {
  const date = isoDate(now);

  switch (kind) {
    case "letter":
      return `Letter-of-Intent-${date}.pdf`;
    case "caregiver":
      return `Letter-for-the-Caregiver-${date}.pdf`;
    case "emergency":
      return `Emergency-Information-Sheet-${date}.pdf`;
    case "backup":
      return `Letter-of-Intent-Backup-${date}.json`;
  }
}
