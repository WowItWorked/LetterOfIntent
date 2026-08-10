import { describe, expect, it } from "vitest";
import {
  assignPages,
  BODY_GAP_PX,
  BODY_PADDING_BOTTOM_PX,
  BODY_PADDING_TOP_PX,
  bodyCapacityPx,
  FOOTER_HEIGHT_PX,
  MAX_PAGES,
  paginateCard,
  RULE_HEIGHT_PX,
  type PageAssignment,
} from "@/lib/cards/paginate";
import { CARD_CONSTRAINTS } from "@/lib/content/cards";
import type { CardData } from "@/lib/cards/types";

/**
 * The pure algorithm runs on synthetic heights — no DOM, no fonts — so every
 * splitting rule is provable exactly. The one paginateCard test mocks
 * offsetHeight to prove the measurement wiring (zone lookup, person-zone
 * subtraction, index order) without a browser; real pixels are Phase G's e2e.
 */

/** Every block lands exactly once: on a page or in overflow, order intact. */
function expectPartition(result: PageAssignment, count: number): void {
  const placed = [...result.pages.flat(), ...result.overflowBlocks];
  expect(placed).toEqual(Array.from({ length: count }, (_, i) => i));
}

describe("assignPages", () => {
  it("keeps a fitting body on one page", () => {
    const result = assignPages([300, 300, 300], 1000, { gapPx: 10 });
    expect(result.pages).toEqual([[0, 1, 2]]);
    expect(result.overflowBlocks).toEqual([]);
    expect(result.oversizedBlocks).toEqual([]);
    expect(result.overflow).toBeUndefined();
  });

  it("splits between blocks, never inside one", () => {
    // 400 + 10 + 400 = 810 fits; + 10 + 400 = 1220 does not.
    const result = assignPages([400, 400, 400], 900, { gapPx: 10 });
    expect(result.pages).toEqual([[0, 1], [2]]);
    expectPartition(result, 3);
  });

  it("never exceeds the page cap and returns the rest as overflow", () => {
    expect(MAX_PAGES).toBe(1 + CARD_CONSTRAINTS.maxContinuations);
    // Each 60px block needs its own 100px page (60 + 10 + 60 > 100).
    const result = assignPages(Array(10).fill(60), 100, { gapPx: 10 });
    expect(result.pages).toHaveLength(MAX_PAGES);
    expect(result.pages).toEqual([[0], [1], [2], [3]]);
    expect(result.overflowBlocks).toEqual([4, 5, 6, 7, 8, 9]);
    expectPartition(result, 10);
  });

  it("cuts everything after the first block that misses the last page", () => {
    // Block 5 (30px) would fit page 4 beside block 3 (50 + 10 + 30 = 90),
    // but block 4 overflowed first — rendering 5 while dropping 4 would
    // misrepresent priority order.
    const result = assignPages([90, 90, 90, 50, 90, 30], 100, { gapPx: 10 });
    expect(result.pages).toEqual([[0], [1], [2], [3]]);
    expect(result.overflowBlocks).toEqual([4, 5]);
  });

  it("never splits the emergency card and flags its overflow", () => {
    const result = assignPages([300, 300], 500, { key: "emergency", gapPx: 10 });
    expect(result.pages).toEqual([[0, 1]]);
    expect(result.overflowBlocks).toEqual([]);
    expect(result.overflow).toBe("emergency-overflow");
  });

  it("leaves a fitting emergency card unflagged", () => {
    const result = assignPages([200, 200], 500, { key: "emergency", gapPx: 10 });
    expect(result.pages).toEqual([[0, 1]]);
    expect(result.overflow).toBeUndefined();
  });

  it("gives a block taller than a page its own page and flags it", () => {
    const result = assignPages([100, 800, 100], 500, { gapPx: 10 });
    expect(result.pages).toEqual([[0], [1], [2]]);
    expect(result.oversizedBlocks).toEqual([1]);
  });

  it("flags an oversized first block without losing the blocks after it", () => {
    const result = assignPages([800, 100], 500, { gapPx: 10 });
    expect(result.pages).toEqual([[0], [1]]);
    expect(result.oversizedBlocks).toEqual([0]);
    expectPartition(result, 2);
  });

  it("computes capacity from the zone constants", () => {
    expect(bodyCapacityPx(561)).toBe(
      CARD_CONSTRAINTS.canvas.h -
        561 -
        RULE_HEIGHT_PX -
        FOOTER_HEIGHT_PX -
        BODY_PADDING_TOP_PX -
        BODY_PADDING_BOTTOM_PX
    );
  });
});

/* -------------------------------------------------------------- paginateCard */

function sizedDiv(offsetHeight: number, attrs: Record<string, string> = {}): HTMLElement {
  const el = document.createElement("div");
  for (const [k, v] of Object.entries(attrs)) el.setAttribute(k, v);
  // jsdom does no layout; offsetHeight is stubbed per element.
  Object.defineProperty(el, "offsetHeight", { value: offsetHeight });
  return el;
}

function sampleCardData(key: CardData["key"]): CardData {
  return {
    key,
    color: "#4e7a57",
    deep: "#3a5c41",
    tint: "#eaf1eb",
    t1: "Identity",
    t2: "& Contacts",
    titleSize: 74,
    spineLabel: "Identity & Contacts",
    purpose: "Who they are.",
    iconPath: "M0 0",
    personLine: "Bonnie, 11",
    footerMeta: "Updated August 8, 2026 · Not a medical document",
    blocks: [],
  };
}

describe("paginateCard", () => {
  it("measures the mounted zones, subtracts the person zone, and splits in index order", () => {
    const node = document.createElement("div");
    const header = sizedDiv(561, { "data-zone": "header" });
    const body = sizedDiv(0, { "data-zone": "body" });
    // Person zone: a body child without data-block-index, repeated per page.
    body.append(sizedDiv(200));
    // Appended out of DOM order to prove index order wins.
    body.append(sizedDiv(500, { "data-block-index": "1" }));
    body.append(sizedDiv(500, { "data-block-index": "0" }));
    body.append(sizedDiv(300, { "data-block-index": "2" }));
    node.append(header, body);

    const result = paginateCard(node, sampleCardData("identity"));

    // 1920 - 561 header - fixed zones = 1200; minus person 200 + 26 gap
    // (jsdom reports no computed gap, so the BODY_GAP_PX fallback applies).
    expect(result.capacityPx).toBe(bodyCapacityPx(561) - 200 - BODY_GAP_PX);
    expect(result.capacityPx).toBe(974);
    expect(result.blockHeightsPx).toEqual([500, 500, 300]);
    // 500 alone, then 500 + 26 + 300 = 826 <= 974.
    expect(result.pages).toEqual([[0], [1, 2]]);
    expect(result.overflowBlocks).toEqual([]);
  });

  it("throws on a node without the card zones", () => {
    expect(() => paginateCard(document.createElement("div"), sampleCardData("meds"))).toThrow(
      /mounted CareCard/
    );
  });
});
