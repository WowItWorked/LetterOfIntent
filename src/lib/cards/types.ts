import type { CardKey } from "@/lib/content/cards";

/**
 * The renderable shape of one care card — exactly what the approved design
 * export's renderVals() consumes, so the React port in components/cards can
 * stay a line-for-line translation instead of an interpretation.
 *
 * Derivation (lib/cards/derive.ts) produces this; the component and the
 * capture pipeline only ever read it. Pagination (Phase F) slices `blocks`
 * without needing to know where any block came from.
 */

/**
 * One body line. `k` is the bold lead-in ("Name — ", "1 · ", "7:00 · ") and
 * includes its own trailing separator; `v` is the plain remainder. A free
 * sentence is just a line with no `k`.
 */
export interface CardLine {
  k?: string;
  v: string;
}

/**
 * One labeled body block. tone "critical" draws the tinted panel with the
 * topic-color left bar — never more than two per card (CARD_CONSTRAINTS),
 * or the emphasis stops meaning anything.
 */
export interface CardBlock {
  label: string;
  tone?: "critical";
  lines: CardLine[];
}

/** The identity card's person zone: big name, then two detail lines. */
export interface CardPerson {
  name: string;
  sub?: string;
  sub2?: string;
}

export interface CardData {
  key: CardKey;
  /** Topic color triple, copied from CARD_DEFS so a CardData is self-contained. */
  color: string;
  deep: string;
  tint: string;
  /** Two-line engraved title; t2 absent when the title stands alone. */
  t1: string;
  t2?: string;
  titleSize: number;
  /** Vertical label on the 64px spine — the title in one line. */
  spineLabel: string;
  /** Purpose sentence with {name} already filled in. */
  purpose: string;
  iconPath: string;
  /** Header eyebrow after the diamond: "Bonnie, 11". Empty when unknown. */
  personLine: string;
  /** "Updated August 8, 2026 · Not a medical document". */
  footerMeta: string;
  /**
   * Continuation numbering, stamped by pagination (Phase F) when the body
   * splits across cards: 1-based page ordinal and total, rendered as "2 of 3"
   * on the header meta line. Absent — or pageCount 1 — on a card that fits
   * one page, and no marker shows.
   */
  pageIndex?: number;
  pageCount?: number;
  /** Present only on the identity card. */
  person?: CardPerson;
  blocks: CardBlock[];
}
