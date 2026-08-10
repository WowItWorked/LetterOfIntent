import { describe, expect, it } from "vitest";
import { BUNDLES, CARD_KEYS, type CardKey } from "@/lib/content/cards";
import type { CardData } from "@/lib/cards/types";
import { pageCards, selectionKeys, splitByReady } from "@/components/cards/selection";

describe("selectionKeys", () => {
  it("selects nothing until the family picks something", () => {
    expect(selectionKeys({ kind: "none" })).toEqual([]);
  });

  it("resolves every bundle to its cards in canonical CARD_KEYS order", () => {
    for (const bundle of BUNDLES) {
      const keys = selectionKeys({ kind: "bundle", name: bundle.name });
      expect(new Set(keys)).toEqual(new Set(bundle.cards));
      const order = keys.map((k) => CARD_KEYS.indexOf(k));
      expect(order).toEqual([...order].sort((a, b) => a - b));
    }
  });

  it("selects nothing for a bundle name that no longer exists", () => {
    expect(selectionKeys({ kind: "bundle", name: "Retired bundle" })).toEqual([]);
  });

  it("returns individual picks in canonical order, not click order", () => {
    const keys = selectionKeys({
      kind: "individual",
      keys: new Set<CardKey>(["food", "identity", "meds"]),
    });
    expect(keys).toEqual(["identity", "meds", "food"]);
  });
});

describe("splitByReady", () => {
  it("partitions a selection, preserving order on both sides", () => {
    const { ready, waiting } = splitByReady(
      ["identity", "emergency", "meds", "behavior"],
      new Set<CardKey>(["identity", "behavior"])
    );
    expect(ready).toEqual(["identity", "behavior"]);
    expect(waiting).toEqual(["emergency", "meds"]);
  });
});

describe("pageCards", () => {
  const card: CardData = {
    key: "meds",
    color: "#B7892F",
    deep: "#8A6A38",
    tint: "#F8EFD8",
    t1: "Medications",
    titleSize: 74,
    spineLabel: "Medications",
    purpose: "What Alex takes.",
    iconPath: "M0 0",
    personLine: "Alex, 22",
    footerMeta: "Updated August 7, 2026 · Not a medical document",
    person: { name: "Alexander James Alvarez" },
    blocks: [
      { label: "Rescue medication", lines: [{ v: "a" }] },
      { label: "On a schedule", lines: [{ v: "b" }] },
      { label: "If they say no", tone: "critical", lines: [{ v: "c" }] },
    ],
  };

  it("slices blocks per page and stamps the continuation marker", () => {
    const pages = pageCards(card, [[0, 1], [2]]);
    expect(pages).toHaveLength(2);
    expect(pages[0].blocks.map((b) => b.label)).toEqual(["Rescue medication", "On a schedule"]);
    expect(pages[1].blocks.map((b) => b.label)).toEqual(["If they say no"]);
    expect(pages[0].pageIndex).toBe(1);
    expect(pages[0].pageCount).toBe(2);
    expect(pages[1].pageIndex).toBe(2);
    expect(pages[1].pageCount).toBe(2);
  });

  it("repeats everything but the blocks on every page — Phase F's header rule", () => {
    const pages = pageCards(card, [[0], [1], [2]]);
    for (const p of pages) {
      expect(p.t1).toBe(card.t1);
      expect(p.personLine).toBe(card.personLine);
      expect(p.footerMeta).toBe(card.footerMeta);
      expect(p.person).toEqual(card.person);
    }
  });

  it("stamps no marker on a card that fits one page", () => {
    const pages = pageCards(card, [[0, 1, 2]]);
    expect(pages).toHaveLength(1);
    expect(pages[0].pageIndex).toBeUndefined();
    expect(pages[0].pageCount).toBeUndefined();
    expect(pages[0].blocks).toHaveLength(3);
  });
});
