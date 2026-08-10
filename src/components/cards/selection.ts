import { BUNDLES, CARD_KEYS, type CardKey } from "@/lib/content/cards";
import type { CardData } from "@/lib/cards/types";

/**
 * The pure half of the cards screen: which cards a selection names, which of
 * them are ready, and how a paginated card becomes one CardData per page.
 * No React and no DOM, so selection.test.ts drives it without a browser.
 */

export type CardSelection =
  | { kind: "none" }
  | { kind: "bundle"; name: string }
  | { kind: "individual"; keys: ReadonlySet<CardKey> };

/**
 * The keys a selection names, always in canonical CARD_KEYS order — the order
 * every list on the screen and every download runs in. A bundle name that no
 * longer exists selects nothing rather than throwing: config is data.
 */
export function selectionKeys(sel: CardSelection): CardKey[] {
  if (sel.kind === "none") return [];
  if (sel.kind === "bundle") {
    const bundle = BUNDLES.find((b) => b.name === sel.name);
    if (!bundle) return [];
    return CARD_KEYS.filter((k) => bundle.cards.includes(k));
  }
  return CARD_KEYS.filter((k) => sel.keys.has(k));
}

/**
 * Splits a selection into the cards that can render now and the ones still
 * waiting on the letter — both in canonical order. Waiting cards are never an
 * error: the UI shows their missing-piece phrase and moves on.
 */
export function splitByReady(
  keys: readonly CardKey[],
  ready: ReadonlySet<CardKey>
): { ready: CardKey[]; waiting: CardKey[] } {
  return {
    ready: keys.filter((k) => ready.has(k)),
    waiting: keys.filter((k) => !ready.has(k)),
  };
}

/**
 * One CardData per page from a pagination's page assignments. Everything but
 * the blocks — header, spine, rule, footer, and the identity card's person
 * zone — repeats identically on every page (Phase F's rule; paginateCard
 * already subtracts the person zone from every page's capacity), so a page
 * card is the whole card with only its own blocks. The "2 of 3" marker is
 * stamped only when there is more than one page, matching CareCard's header.
 */
export function pageCards(
  card: CardData,
  pages: ReadonlyArray<readonly number[]>
): CardData[] {
  const count = pages.length;
  return pages.map((indices, i) => ({
    ...card,
    blocks: indices.map((bi) => card.blocks[bi]).filter(Boolean),
    ...(count > 1 ? { pageIndex: i + 1, pageCount: count } : {}),
  }));
}
