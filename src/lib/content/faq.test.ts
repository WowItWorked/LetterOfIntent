import { describe, expect, it } from "vitest";
import { FAQ_GROUPS, allFaqItems } from "./faq";

/**
 * The FAQ is read in three places at once: on the page, by crawlers reading
 * the FAQPage structured data generated from this same array, and by
 * assistants lifting a single answer out and showing it with no page around
 * it. The third is what most of these tests are about — an answer that only
 * makes sense in position is the failure nobody sees, because the page it was
 * proof-read on still reads perfectly.
 */

describe("FAQ structure", () => {
  it("has a stable, unique id per group — these get linked to directly", () => {
    const ids = FAQ_GROUPS.map((g) => g.id);
    expect(ids.filter((id, i) => ids.indexOf(id) !== i)).toEqual([]);
    for (const id of ids) expect(id).toMatch(/^[a-z][a-z0-9-]*$/);
  });

  it("asks no question twice", () => {
    const qs = allFaqItems().map((i) => i.q.toLowerCase());
    expect(qs.filter((q, i) => qs.indexOf(q) !== i)).toEqual([]);
  });

  it("phrases every question as a question", () => {
    const notQuestions = allFaqItems()
      .filter((i) => !i.q.trim().endsWith("?"))
      .map((i) => i.q);
    expect(notQuestions).toEqual([]);
  });

  it("gives every group at least three questions", () => {
    // A group of one or two reads as an afterthought, and in the on-page nav
    // it promises more than it delivers.
    for (const g of FAQ_GROUPS) {
      expect(g.items.length, `${g.id} has too few questions`).toBeGreaterThanOrEqual(3);
    }
  });
});

describe("every answer stands on its own", () => {
  /*
   * An assistant quoting one answer shows it with nothing around it. These
   * are the phrases that only work with the page attached.
   */
  const NEEDS_CONTEXT = [
    /\bas (?:mentioned|described|noted) (?:above|below|earlier)\b/i,
    /\bsee above\b/i,
    /\bsee below\b/i,
    /\bthe (?:previous|next) (?:question|answer|section)\b/i,
    /\bas we said\b/i,
  ];

  it("never leans on a neighbouring answer", () => {
    const offenders = allFaqItems()
      .filter((i) => NEEDS_CONTEXT.some((p) => p.test(i.a)))
      .map((i) => i.q);
    expect(offenders).toEqual([]);
  });

  it("is substantial enough to be worth quoting", () => {
    const thin = allFaqItems()
      .filter((i) => i.a.length < 120)
      .map((i) => `${i.q} (${i.a.length} chars)`);
    expect(thin).toEqual([]);
  });

  it("stays short enough to be read", () => {
    // Google truncates rich results, and a wall of text is skipped on the
    // page too. This is a ceiling, not a target.
    const long = allFaqItems()
      .filter((i) => i.a.length > 900)
      .map((i) => `${i.q} (${i.a.length} chars)`);
    expect(long).toEqual([]);
  });
});

describe("what the FAQ must not claim", () => {
  /*
   * This is a law firm's page about a document people rely on. The two facts
   * below are load-bearing: a family who takes the letter for a binding
   * instrument, or for a substitute for a trust, has been actively misled by
   * a site that exists to help them.
   */
  it("says plainly that the letter is not legally binding", () => {
    const answers = allFaqItems().map((i) => i.a.toLowerCase());
    expect(
      answers.some((a) => a.includes("not legally binding") || a.includes("not a legal instrument"))
    ).toBe(true);
  });

  it("says plainly that it does not replace a will or a trust", () => {
    const answers = allFaqItems().map((i) => i.a.toLowerCase());
    expect(
      answers.some(
        (a) =>
          (a.includes("not a will") || a.includes("does not replace")) &&
          a.includes("trust")
      )
    ).toBe(true);
  });

  it("never promises a legal outcome", () => {
    // Attorney advertising rules, and simple honesty: nothing here can
    // guarantee how a trustee or a court will act.
    const FORBIDDEN = /\b(guarantee|guaranteed|ensures that the (?:court|trustee) will|legally require[sd]?)\b/i;
    const offenders = allFaqItems()
      .filter((i) => FORBIDDEN.test(i.a))
      .map((i) => i.q);
    expect(offenders).toEqual([]);
  });
});
