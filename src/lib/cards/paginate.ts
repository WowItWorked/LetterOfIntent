import { CARD_CONSTRAINTS, type CardKey } from "@/lib/content/cards";
import type { CardData } from "@/lib/cards/types";

/**
 * Splits an overflowing card body across continuation cards ("1 of 2") —
 * Rule 6 of the design export: overflow continues, nothing is silently
 * truncated, and type never shrinks below the 39px floor.
 *
 * Two halves, deliberately separate: assignPages is the pure algorithm —
 * synthetic heights in, page assignments out — and paginateCard is the thin
 * wrapper that measures real block heights from a mounted CareCard and feeds
 * them in, so tests drive the algorithm without a browser. Blocks are atomic:
 * deriveCard already grouped records into blocks, so a page break only ever
 * falls BETWEEN blocks, never through a record.
 */

/* --------------------------------------------------------- zone arithmetic */

/**
 * Fixed zone heights of the 1080x1920 frame, mirrored from the inline px
 * values in components/cards/CareCard.tsx the same way cards.ts mirrors the
 * --card-* tokens: the component cannot import from lib without inverting the
 * dependency, so paginate.test.ts holds these to the arithmetic below.
 *
 * Body capacity = canvas 1920
 *   - header      (MEASURED — see bodyCapacityPx)
 *   - 5           gold rule
 *   - 84          footer: 26 pad-top + 32 content + 26 pad-bottom — every
 *                 footer child is line-height 1 and nowrap, the tallest the
 *                 32px brand span, so the centered row is exactly 32px
 *   - 42          body padding-top
 *   - 28          body padding-bottom
 *
 * The header is the one zone WITHOUT a fixed height: the title runs one or
 * two lines at a per-card titleSize (60-74) and the purpose sentence wraps at
 * the fonts' mercy, so capacity is a function of the measured header rather
 * than a constant.
 */
export const RULE_HEIGHT_PX = 5;
export const FOOTER_HEIGHT_PX = 84;
export const BODY_PADDING_TOP_PX = 42;
export const BODY_PADDING_BOTTOM_PX = 28;
/** Column-flex gap between body children (blocks, and the person zone). */
export const BODY_GAP_PX = 26;

/** 1 original + at most 3 continuations — a card set never becomes a document. */
export const MAX_PAGES = 1 + CARD_CONSTRAINTS.maxContinuations;

/** Body px available for blocks on every page of a card with this header. */
export function bodyCapacityPx(headerHeightPx: number): number {
  return (
    CARD_CONSTRAINTS.canvas.h -
    headerHeightPx -
    RULE_HEIGHT_PX -
    FOOTER_HEIGHT_PX -
    BODY_PADDING_TOP_PX -
    BODY_PADDING_BOTTOM_PX
  );
}

/* ---------------------------------------------------------------- algorithm */

/**
 * Owner's spec: the emergency card refuses to paginate. An emergency protocol
 * that continues on a second card a responder may not have is worse than a
 * warning, so an overflowing emergency body stays whole on one card and comes
 * back flagged "emergency-overflow" for the UI to tell the family to trim.
 */
const NEVER_SPLIT: ReadonlySet<CardKey> = new Set(["emergency"]);

export interface AssignPagesOptions {
  /** The card being paginated; "emergency" resists splitting (NEVER_SPLIT). */
  key?: CardKey;
  /** Vertical gap between blocks. Defaults to the frame's BODY_GAP_PX. */
  gapPx?: number;
  /** Page cap. Defaults to MAX_PAGES. */
  maxPages?: number;
}

export interface PageAssignment {
  /** Block indices per page, in the order deriveCard emitted them. */
  pages: number[][];
  /**
   * Indices that did not make the last allowed page — never rendered, never
   * silently dropped: the UI says what was left off. The first block that
   * misses the last page cuts everything after it, even blocks small enough
   * to fit, because blocks arrive in PRIORITY_ORDER and rendering a lower
   * priority while dropping a higher one would misrepresent that order.
   */
  overflowBlocks: number[];
  /**
   * Single blocks taller than a whole page. Each keeps its own page and
   * renders as-is — the frame's overflow:hidden crops it — because the type
   * floor is not negotiable. The UI warns.
   */
  oversizedBlocks: number[];
  /** Present only when a NEVER_SPLIT card's body exceeds one page. */
  overflow?: "emergency-overflow";
}

function totalHeight(heights: readonly number[], gap: number): number {
  const sum = heights.reduce((a, h) => a + h, 0);
  return heights.length > 1 ? sum + gap * (heights.length - 1) : sum;
}

/**
 * Greedy first-fit in emission order: fill a page until the next block would
 * not fit, then open the next. Greedy is correct here because order is fixed
 * (PRIORITY_ORDER / user_order) — no repacking is allowed to reorder content.
 */
export function assignPages(
  blockHeights: readonly number[],
  capacityPx: number,
  opts: AssignPagesOptions = {}
): PageAssignment {
  const gap = opts.gapPx ?? BODY_GAP_PX;
  const maxPages = opts.maxPages ?? MAX_PAGES;
  const oversizedBlocks = blockHeights.flatMap((h, i) => (h > capacityPx ? [i] : []));

  if (opts.key && NEVER_SPLIT.has(opts.key)) {
    const all = blockHeights.map((_, i) => i);
    const fits = totalHeight(blockHeights, gap) <= capacityPx;
    return {
      pages: [all],
      overflowBlocks: [],
      oversizedBlocks,
      ...(fits ? {} : { overflow: "emergency-overflow" as const }),
    };
  }

  const pages: number[][] = [[]];
  const overflowBlocks: number[] = [];
  let used = 0;

  for (let i = 0; i < blockHeights.length; i++) {
    if (overflowBlocks.length > 0) {
      overflowBlocks.push(i);
      continue;
    }
    const h = blockHeights[i];
    const page = pages[pages.length - 1];
    const needed = page.length === 0 ? h : used + gap + h;
    if (needed <= capacityPx) {
      page.push(i);
      used = needed;
      continue;
    }
    if (page.length === 0) {
      // Alone on a fresh page and still too tall: the block keeps this page
      // (oversizedBlocks already flags it) and, being over capacity, closes
      // it to everything after.
      page.push(i);
      used = h;
      continue;
    }
    if (pages.length >= maxPages) {
      overflowBlocks.push(i);
      continue;
    }
    pages.push([i]);
    used = h;
  }

  return { pages, overflowBlocks, oversizedBlocks };
}

/* -------------------------------------------------------------- measurement */

export interface CardPagination extends PageAssignment {
  /** Per-page body px available to blocks, after the repeated person zone. */
  capacityPx: number;
  /** Measured height of each block, indexed like CardData.blocks. */
  blockHeightsPx: number[];
}

/**
 * offsetHeight is a layout value — the frame's transform:scale never touches
 * it — so measuring a scaled preview mount still yields scale-1 px.
 * getComputedStyle survives a future gap retune in the component; jsdom (and
 * a flex "normal" gap) report no parseable value, so the mirrored constant is
 * the fallback.
 */
function bodyGapPx(body: HTMLElement): number {
  const g = parseFloat(getComputedStyle(body).rowGap);
  return Number.isFinite(g) ? g : BODY_GAP_PX;
}

/**
 * Measures a mounted CareCard and assigns its blocks to pages. Blocks are the
 * [data-block-index] children of [data-zone="body"]; any body child WITHOUT
 * that attribute is the identity card's person zone, which — like the header,
 * spine, rule, and footer — repeats on every page (only blocks differ between
 * pages), so its height and trailing gap come off every page's capacity.
 */
export function paginateCard(node: HTMLElement, card: CardData): CardPagination {
  const header = node.querySelector<HTMLElement>('[data-zone="header"]');
  const body = node.querySelector<HTMLElement>('[data-zone="body"]');
  if (!header || !body) {
    throw new Error("paginateCard needs a mounted CareCard with header and body zones");
  }

  const gap = bodyGapPx(body);
  let capacityPx = bodyCapacityPx(header.offsetHeight);

  const blocks: HTMLElement[] = [];
  for (const child of Array.from(body.children)) {
    if (!(child instanceof HTMLElement)) continue;
    if (child.dataset.blockIndex !== undefined) blocks.push(child);
    else capacityPx -= child.offsetHeight + gap;
  }
  blocks.sort((a, b) => Number(a.dataset.blockIndex) - Number(b.dataset.blockIndex));
  const blockHeightsPx = blocks.map((b) => b.offsetHeight);

  return {
    ...assignPages(blockHeightsPx, capacityPx, { key: card.key, gapPx: gap }),
    capacityPx,
    blockHeightsPx,
  };
}
