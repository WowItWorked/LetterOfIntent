import { DEFAULT_PATH } from "@/lib/content/paths";
import type { LetterPath } from "@/lib/schema";

/**
 * Names for the files a family downloads.
 *
 * Two rules, and the second one is the important one:
 *
 * 1. The name says what the file is — which document, and for the letter and
 *    its backup, which of the two question sets it came from — plus the date
 *    it was created, so a folder with three years of downloads sorts and reads
 *    correctly.
 *
 * 2. The name never says *who* it is about. Downloads land in shared folders,
 *    get synced to cloud drives, and are read out by screen readers in open-
 *    plan offices; a filename carrying "Letter-of-Intent-Alex" discloses a
 *    disability to anyone who glances at the screen. The person's name is
 *    inside the document, where the family chose to put it.
 */

export type DocumentKind = "letter" | "emergency" | "backup";

const PATH_LABEL: Record<LetterPath, string> = {
  "special-needs": "Disabilities",
  general: "Anyone",
};

/** Local calendar date — the day the family pressed the button. */
export function isoDate(now: Date): string {
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${now.getFullYear()}-${pad(now.getMonth() + 1)}-${pad(now.getDate())}`;
}

export function documentFilename(
  kind: DocumentKind,
  path: LetterPath = DEFAULT_PATH,
  now: Date = new Date()
): string {
  const date = isoDate(now);
  const which = PATH_LABEL[path] ?? PATH_LABEL[DEFAULT_PATH];

  switch (kind) {
    case "letter":
      return `Letter-of-Intent-${which}-${date}.pdf`;
    // The emergency sheet is the same one-pager whichever set it came from,
    // so it is not qualified — matching how families refer to it.
    case "emergency":
      return `Emergency-Information-Sheet-${date}.pdf`;
    case "backup":
      return `Letter-of-Intent-${which}-Backup-${date}.json`;
  }
}
