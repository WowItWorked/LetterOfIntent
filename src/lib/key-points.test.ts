import { describe, expect, it } from "vitest";
import {
  MAX_CALL_ORDER,
  MAX_KEY_POINT_CHARS,
  clampToWord,
  keyPoints,
  keyPointsHaveContent,
} from "@/lib/derive";
import type { LetterData } from "@/lib/schema";

/**
 * Page four of the letter. It is a summary of other sections, so the thing
 * worth guarding is that it cites the right source for each path and never
 * invents a point out of an empty field.
 */

const SPECIAL: LetterData = {
  familySupport: {
    firstCall: "Dana — (703) 555-0142",
    contacts: [
      { id: "c1", name: "Dana Alvarez", relationship: "Aunt", phone: "(703) 555-0142", emergency: true },
      { id: "c2", name: "Ray Alvarez", relationship: "Uncle", emergency: false },
    ],
  },
  communication: { how: "Short sentences; AAC app when overwhelmed." },
  medical: { allergies: "Penicillin.", emergencyProtocol: "Time the seizure." },
  behavior: { deEscalation: "Lower your voice. Wait ten minutes.", makesWorse: "Crowding." },
  housing: { hardLimits: "Never a large institution." },
};

const GENERAL: LetterData = {
  familySupport: { firstCall: "My brother — (703) 555-0000" },
  dailyCommunication: {
    howToSpeak: "Say it straight and say it once.",
    whatHelps: "Sit down first, television off.",
    whatToAvoid: "Never start with \"we've decided\".",
  },
  healthMedical: { allergies: "Sulfa drugs.", conditions: "Atrial fibrillation." },
  steppingIn: { neverChange: "Do not move her downstairs." },
};

describe("key points at a glance", () => {
  it("is empty for an empty letter", () => {
    const k = keyPoints({});
    expect(k.points).toEqual([]);
    expect(k.callOrder).toEqual([]);
    expect(keyPointsHaveContent(k)).toBe(false);
  });

  it("builds the call order from the first call plus flagged contacts only", () => {
    const k = keyPoints(SPECIAL);
    expect(k.callOrder).toEqual([
      "Dana — (703) 555-0142",
      "Dana Alvarez · Aunt · (703) 555-0142",
    ]);
  });

  it("cites the special-needs sections, and flags what makes it worse", () => {
    const k = keyPoints(SPECIAL, "special-needs");
    expect(k.points.map((p) => [p.title, p.source])).toEqual([
      ["How to talk with them", "Communication"],
      ["Medical facts that cannot wait", "Medical"],
      ["What calms them", "Behavior support"],
      ["What makes it worse", "Behavior support"],
    ]);
    expect(k.points.find((p) => p.warning)?.title).toBe("What makes it worse");
    expect(k.neverChange).toBe("Never a large institution.");
  });

  it("reads the general path's own sections instead", () => {
    const k = keyPoints(GENERAL, "general");
    expect(k.points.map((p) => p.title)).toEqual([
      "How to talk with them",
      "Medical facts that cannot wait",
      "What helps",
      "What makes it worse",
    ]);
    expect(k.points.every((p) => p.source === "Communication" || p.source === "Health & medical")).toBe(true);
    expect(k.neverChange).toBe("Do not move her downstairs.");
    expect(keyPointsHaveContent(k)).toBe(true);
  });

  it("skips points whose source field is blank", () => {
    const k = keyPoints({ ...SPECIAL, behavior: { deEscalation: "  " } }, "special-needs");
    expect(k.points.map((p) => p.title)).not.toContain("What calms them");
    expect(k.points.map((p) => p.title)).not.toContain("What makes it worse");
  });
});

/**
 * The page is one sheet by contract. Everything below exists so that a family
 * who writes at length still gets a page they can read at a glance.
 */
describe("key points stay on one page", () => {
  const long = (n: number) => "word ".repeat(n).trim();

  it("clamps every point to the character budget", () => {
    const k = keyPoints(
      {
        ...SPECIAL,
        communication: { how: long(200) },
        behavior: { deEscalation: long(200), makesWorse: long(200) },
        housing: { hardLimits: long(200) },
      },
      "special-needs"
    );
    for (const p of k.points) {
      expect(p.text.length, p.title).toBeLessThanOrEqual(MAX_KEY_POINT_CHARS + 1);
    }
    expect(k.neverChange!.length).toBeLessThanOrEqual(MAX_KEY_POINT_CHARS + 1);
  });

  it("caps how many names the call band carries", () => {
    const contacts = Array.from({ length: 8 }, (_, i) => ({
      id: `c${i}`,
      name: `Contact ${i}`,
      phone: "(703) 555-0100",
      emergency: true,
    }));
    const k = keyPoints({ familySupport: { firstCall: "Dana", contacts } });
    expect(k.callOrder).toHaveLength(MAX_CALL_ORDER);
    expect(k.callOrder[0]).toBe("Dana");
  });

  it("leaves short answers exactly as written", () => {
    const k = keyPoints(SPECIAL, "special-needs");
    expect(k.points[0].text).toBe("Short sentences; AAC app when overwhelmed.");
  });

  it("cuts at a word boundary and marks the cut", () => {
    expect(clampToWord("one two three four five", 12)).toBe("one two…");
    expect(clampToWord("short", 40)).toBe("short");
    // Line breaks collapse — the box is a summary, not a transcript.
    expect(clampToWord("first line\n\nsecond line", 80)).toBe("first line second line");
  });

  it("does not invent a trailing ellipsis on a clean fit", () => {
    const exact = "a".repeat(MAX_KEY_POINT_CHARS);
    expect(clampToWord(exact, MAX_KEY_POINT_CHARS)).toBe(exact);
  });
});
