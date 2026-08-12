import { describe, expect, it } from "vitest";
import { blankFormStrings, scrubHelp } from "./blank-form-document";
import { CAREGIVER_PROJECTION, TRUSTEE_PROJECTION } from "./projections";

/**
 * The blank forms borrow their questions from the content catalogue, which is
 * written for the builder. In the builder "this prints on the Emergency card"
 * is true; on a form somebody fills in by hand it is a promise about a
 * document that will never exist, and it sends a reader looking for cards they
 * were never going to get.
 *
 * The catalogue is edited often and nobody editing it is thinking about the
 * PDFs, so this is a standing guard rather than a one-off clean-up.
 */

/** Anything that would send a reader looking for a document this cannot make. */
const FORBIDDEN = [
  /\bcare cards?\b/i,
  /\bshareable cards?\b/i,
  /\bemergency sheet\b/i,
  /\bemergency card\b/i,
  /\bmedications card\b/i,
  /\bidentity\s*&\s*contacts card\b/i,
  /\bdaily routine card\b/i,
  /\bthe cards?\b(?!\s+game)/i,
];

describe("scrubHelp", () => {
  it("drops the sentence that names another document, keeps the rest", () => {
    expect(
      scrubHelp(
        "Plain words are fine. List what a new doctor should know first. This also prints on the emergency sheet."
      )
    ).toBe("Plain words are fine. List what a new doctor should know first.");
  });

  it("returns undefined when nothing survives", () => {
    expect(scrubHelp("Each entry prints on the Emergency card.")).toBeUndefined();
  });

  it("leaves help alone when it names no other document", () => {
    const help = "Roughly when each was diagnosed, and how it affects daily life now.";
    expect(scrubHelp(help)).toBe(help);
  });

  /*
   * The two the narrow pattern exists for. A blunt /card/i would delete a
   * question about where the insurance paperwork lives, and mangle a routine
   * about a weekly card game — both real answers, neither about this app.
   */
  it("keeps a card that is not one of ours", () => {
    const game =
      "Appointments, church, the standing phone call, the card game, the day the aide comes.";
    expect(scrubHelp(game)).toBe(game);

    const insurance = "The insurance cards, the medication list, the advance directive.";
    expect(scrubHelp(insurance)).toBe(insurance);
  });

  it("passes undefined through", () => {
    expect(scrubHelp(undefined)).toBeUndefined();
  });
});

describe("what the blank forms print", () => {
  for (const [name, projection] of [
    ["the Letter of Intent", TRUSTEE_PROJECTION],
    ["the Letter for the Caregiver", CAREGIVER_PROJECTION],
  ] as const) {
    it(`${name} never names a document it does not produce`, () => {
      const offenders = blankFormStrings(projection).filter((line) =>
        FORBIDDEN.some((pattern) => pattern.test(line))
      );
      expect(offenders, "these would promise a document the form cannot make").toEqual(
        []
      );
    });

    it(`${name} asks nothing whose only purpose is steering the cards`, () => {
      // "Keep off shareable cards" cannot mean anything here: there are no
      // cards to keep it off. A checkbox that does nothing is worse than a
      // missing one — it reads as a choice that was recorded.
      const offenders = blankFormStrings(projection).filter((line) =>
        /keep off/i.test(line)
      );
      expect(offenders).toEqual([]);
    });
  }
});
