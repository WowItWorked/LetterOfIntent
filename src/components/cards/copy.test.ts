import { describe, expect, it } from "vitest";
import {
  EMERGENCY_OVERFLOW_TEMPLATE,
  emergencyOverflowCopy,
  overflowNotice,
  oversizedNotice,
} from "@/components/cards/copy";

describe("pagination warning copy", () => {
  it("the emergency-overflow copy exists, fills {name}, and points home", () => {
    expect(EMERGENCY_OVERFLOW_TEMPLATE).toContain("{name}");
    const text = emergencyOverflowCopy("Alex");
    expect(text.length).toBeGreaterThan(0);
    expect(text).toContain("Alex");
    expect(text).not.toContain("{name}");
    // The way out is named: back to the emergency-plan section, fewest steps.
    expect(text).toMatch(/emergency plan section/i);
    expect(text).toMatch(/response steps/i);
    // Firm about the block, in plain words, without an error register.
    expect(text).toMatch(/stays off/i);
    expect(text).not.toMatch(/\berror\b/i);
  });

  it("the left-off notice names every dropped block", () => {
    const text = overflowNotice(["Evenings", "Fixed points of the week"]);
    expect(text).toContain("Evenings");
    expect(text).toContain("Fixed points of the week");
    expect(text).toMatch(/left off/i);
    // Singular reads as a sentence too.
    expect(overflowNotice(["Evenings"])).toMatch(/was left off/i);
  });

  it("the crop warning names the block and says nothing shrinks", () => {
    const text = oversizedNotice(["What helps"]);
    expect(text).toContain("What helps");
    expect(text).toMatch(/crops?/i);
    expect(text).toMatch(/never shrinks/i);
  });
});
