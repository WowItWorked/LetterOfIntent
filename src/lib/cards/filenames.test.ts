import { describe, expect, it } from "vitest";
import { cardFilename } from "@/lib/cards/filenames";

describe("care-card filenames", () => {
  /**
   * OWNER DECISION: unlike the PDFs and backup (src/lib/filenames.ts, whose
   * no-names rule and tests stand untouched), a card filename MAY carry the
   * person's name — it is on the card face in 70px type either way, and the
   * name is what makes a camera roll of cards findable.
   */
  it("leads with the person's name when one is stored", () => {
    expect(cardFilename("Emergency Protocol", { personName: "Bonnie" })).toBe(
      "Bonnie — Emergency Protocol.png"
    );
    expect(cardFilename("Identity & Contacts", { personName: "Alex" })).toBe(
      "Alex — Identity & Contacts.png"
    );
  });

  it("stands the title alone when no name is stored", () => {
    expect(cardFilename("Medications")).toBe("Medications.png");
    expect(cardFilename("Medications", { personName: "   " })).toBe("Medications.png");
  });

  it("numbers continuations the way the card header does", () => {
    expect(
      cardFilename("Medications", { personName: "Alex", pageIndex: 2, pageCount: 3 })
    ).toBe("Alex — Medications 2 of 3.png");
    expect(cardFilename("Daily Routine", { pageIndex: 1, pageCount: 2 })).toBe(
      "Daily Routine 1 of 2.png"
    );
  });

  it("adds no marker to a card that fits one page", () => {
    expect(cardFilename("Eating & Food", { personName: "Alex", pageIndex: 1, pageCount: 1 })).toBe(
      "Alex — Eating & Food.png"
    );
  });

  it("strips characters no filesystem should see, keeping spaces and the dash", () => {
    // Same forbidden set filenames.test.ts holds the document names to —
    // minus \s, because these names carry spaces on purpose.
    const unsafe = /[<>:"/\\|?*]/;
    const hostile = cardFilename('We/ird: "Card"*?', { personName: "A<l>e\\x|" });
    expect(unsafe.test(hostile)).toBe(false);
    expect(hostile).toBe("A l e x — We ird Card.png");
    expect(hostile.endsWith(".png")).toBe(true);
  });

  it("never emits a base name ending in a dot or space (Windows refuses them)", () => {
    expect(cardFilename("Medications.", { personName: "Alex Jr." })).toBe(
      "Alex Jr — Medications.png"
    );
  });

  it("falls back to a generic label rather than an empty base", () => {
    expect(cardFilename("///")).toBe("Care card.png");
  });
});
