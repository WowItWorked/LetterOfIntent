import { describe, expect, it } from "vitest";
import { deriveCard } from "@/lib/cards/derive";
import { letterDataSchema } from "@/lib/schema";
import { HOME_CARD_KEYS, SAMPLE_CARD_LETTER } from "@/components/home/sample-card-data";

/**
 * The home page renders real CareCards from this fixture with no fallback UI:
 * if a card stops deriving, the section silently loses a preview. These tests
 * turn that silence into a red build.
 */

describe("the home page sample letter", () => {
  it("is valid LetterData exactly as the schema defines it", () => {
    expect(() => letterDataSchema.parse(SAMPLE_CARD_LETTER)).not.toThrow();
  });

  it.each(HOME_CARD_KEYS.map((key) => [key] as const))(
    "derives the %s card the section renders",
    (key) => {
      const card = deriveCard(SAMPLE_CARD_LETTER, key);
      expect(card).not.toBeNull();
      // A derived card with no blocks would be a header over nothing.
      expect(card!.blocks.length).toBeGreaterThan(0);
      // The spoken label ("… care card for Danny, 24") is what the e2e spec
      // and screen readers key on — it must name the sample person.
      expect(card!.personLine).toMatch(/^Danny/);
    }
  );

  it("keeps the previews single-frame: few enough blocks that no card needs pagination", () => {
    // The home page deliberately skips the cards page's measurement pass, so
    // the fixture must stay lean. Block-count is a proxy the DOM-free test
    // can hold: since the fixture matched the reference card set, the fullest
    // previews (emergency, behavior) carry 6 blocks and land within a few
    // lines of the footer — there is no headroom left for a seventh block or
    // a fifth line anywhere. The e2e overflow check on /care-cards is the
    // real gate; a fixture edit that trips THESE ceilings has already lost
    // in a real browser.
    for (const key of HOME_CARD_KEYS) {
      const card = deriveCard(SAMPLE_CARD_LETTER, key);
      expect(card!.blocks.length).toBeLessThanOrEqual(6);
      for (const block of card!.blocks) {
        expect(block.lines.length).toBeLessThanOrEqual(4);
      }
    }
  });
});
