/**
 * Names for the care-card PNGs a family downloads.
 *
 * OWNER DECISION — these deliberately differ from src/lib/filenames.ts, whose
 * no-names rule still governs the PDFs and the backup: a card's face carries
 * the person's name in 70px type, so the filename hiding it would protect
 * nothing. "Bonnie — Emergency Protocol.png" (the design export's own
 * convention) is also what makes a camera roll of cards findable. The rest of
 * the shape follows the export: continuations number themselves the way the
 * card's own header does ("2 of 3"), and with no name stored the title stands
 * alone.
 *
 * Characters are held to the same bar filenames.test.ts holds the document
 * names to — nothing Windows or macOS refuses (<>:"/\|?* and control
 * characters, no trailing dots or spaces) — except that spaces and the em
 * dash are allowed here on purpose: these names are read aloud off a phone,
 * not typed into a shell.
 */

export interface CardFilenameParts {
  /** The person's preferred name. Absent (or nothing survives cleaning) → title only. */
  personName?: string;
  /** 1-based page ordinal, present on continuations. */
  pageIndex?: number;
  /** Total pages; a marker is added only when it exceeds 1. */
  pageCount?: number;
}

/**
 * Windows' forbidden set (a superset of macOS's "/" and ":"), plus ASCII
 * control characters. Replaced with a space and re-collapsed, so "Alex/Sam"
 * degrades to "Alex Sam" rather than vanishing.
 */
const FORBIDDEN = /[<>:"/\\|?*\x00-\x1f\x7f]/g;

function cleanPart(part: string | undefined): string {
  if (!part) return "";
  return part
    .replace(FORBIDDEN, " ")
    .replace(/\s+/g, " ")
    .trim()
    // Windows refuses names ending in a dot or space; the ".png" below means
    // the whole name never does, but the base must not smuggle one in either.
    .replace(/[. ]+$/, "");
}

/** "Alex — Emergency Protocol.png", "Alex — Medications 2 of 3.png", "Medications.png". */
export function cardFilename(cardTitle: string, parts: CardFilenameParts = {}): string {
  const name = cleanPart(parts.personName);
  const title = cleanPart(cardTitle) || "Care card";
  const base = name ? `${name} — ${title}` : title;
  const marker =
    parts.pageCount && parts.pageCount > 1 ? ` ${parts.pageIndex ?? 1} of ${parts.pageCount}` : "";
  return `${base}${marker}.png`;
}
