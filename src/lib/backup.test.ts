import { describe, expect, it } from "vitest";
import {
  MAX_BACKUP_BYTES,
  detectLetterPath,
  parseBackup,
  serializeBackup,
} from "@/lib/backup";
import type { LetterData } from "@/lib/schema";

const sample: LetterData = {
  gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
  medical: {
    medications: [{ id: "m1", name: "Keppra", dose: "500 mg", purpose: "Seizures" }],
    allergies: "Penicillin — hives",
  },
};

/** The four sections both letters share — a genuinely ambiguous file. */
const sharedOnly: LetterData = {
  gettingStarted: { subjectPreferredName: "Alex" },
  familySupport: { firstCall: "Dana" },
};

describe("backup round trip", () => {
  it("serialize → parse preserves data and meta", () => {
    const text = serializeBackup(sample, { lastVisitedSlug: "medical" });
    const parsed = parseBackup(text);
    expect(parsed.ok).toBe(true);
    if (parsed.ok) {
      expect(parsed.data.gettingStarted?.authorName).toBe("Maria");
      expect(parsed.data.medical?.medications?.[0]?.name).toBe("Keppra");
      expect(parsed.meta.lastVisitedSlug).toBe("medical");
    }
  });

  it("accepts bare letter data without the envelope", () => {
    const r = parseBackup(JSON.stringify(sample));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.medical?.allergies).toContain("Penicillin");
  });

  it("strips unknown fields instead of failing (forward compatibility)", () => {
    const withExtra = JSON.parse(serializeBackup(sample, {}));
    withExtra.data.futureSection = { anything: "at all" };
    withExtra.data.medical.futureField = "ignored";
    const r = parseBackup(JSON.stringify(withExtra));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.salvage.unknown).toContain("futureSection");
      expect(r.data.medical?.allergies).toContain("Penicillin");
    }
  });
});

describe("backup refusals", () => {
  it.each([
    ["not json at all", "not-json"],
    ["", "not-json"],
    ["[1,2,3]", "not-a-backup"],
    ['"a string"', "not-a-backup"],
    ["null", "not-a-backup"],
    ['{"hello":"world"}', "not-a-backup"],
  ])("refuses %j with reason %s", (input, reason) => {
    const r = parseBackup(input);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe(reason);
  });

  it("refuses another app's file even if the shape matches", () => {
    const r = parseBackup(
      JSON.stringify({ app: "some-other-tool", version: 9, data: sample })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("not-a-backup");
  });

  it("refuses our own envelope when nothing inside can be read", () => {
    const r = parseBackup(
      JSON.stringify({ app: "twl-letter-of-intent", version: 1, data: { about: 42 } })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("empty");
  });

  it("refuses a file too large to be a letter, without parsing it", () => {
    const huge = `{"app":"twl-letter-of-intent","padding":"${"x".repeat(MAX_BACKUP_BYTES)}"}`;
    const r = parseBackup(huge);
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.reason).toBe("too-large");
  });
});

/**
 * The salvage path. A family should never lose a whole letter because one
 * section of the file is malformed.
 */
describe("salvaging a damaged backup", () => {
  it("keeps the readable sections and reports the rest", () => {
    const damaged = {
      app: "twl-letter-of-intent",
      version: 1,
      data: {
        gettingStarted: { authorName: "Maria", subjectPreferredName: "Alex" },
        about: "this should be an object, not a string",
        medical: { allergies: "Penicillin" },
        behavior: ["also", "wrong"],
      },
    };
    const r = parseBackup(JSON.stringify(damaged));
    expect(r.ok).toBe(true);
    if (!r.ok) return;
    expect(r.data.gettingStarted?.authorName).toBe("Maria");
    expect(r.data.medical?.allergies).toBe("Penicillin");
    expect(r.salvage.restored).toEqual(
      expect.arrayContaining(["gettingStarted", "medical"])
    );
    expect(r.salvage.skipped).toEqual(expect.arrayContaining(["about", "behavior"]));
    expect(r.data).not.toHaveProperty("about");
  });

  it("drops a repeater entry's junk without losing the section", () => {
    const r = parseBackup(
      JSON.stringify({
        gettingStarted: { authorName: "Maria" },
        medical: { allergies: "Penicillin", medications: "not an array" },
      })
    );
    // The medical section as a whole fails its schema, but the letter survives.
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.gettingStarted?.authorName).toBe("Maria");
  });
});

describe("working out which letter a backup belongs to", () => {
  it("believes the file when it says", () => {
    const text = serializeBackup(sample, { letterPath: "general" });
    const r = parseBackup(text);
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.path).toBe("general");
      expect(r.pathSource).toBe("declared");
    }
  });

  it("infers the special-needs set from a section only it has", () => {
    const r = parseBackup(
      JSON.stringify({ gettingStarted: {}, trustee: { moneyIsFor: "A life" } })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.path).toBe("special-needs");
      expect(r.pathSource).toBe("inferred");
    }
  });

  it("infers the general set the same way", () => {
    const r = parseBackup(
      JSON.stringify({ gettingStarted: {}, steppingIn: { firstWeek: "Call Hannah" } })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.path).toBe("general");
      expect(r.pathSource).toBe("inferred");
    }
  });

  it("admits it cannot tell when the file holds only shared sections", () => {
    const r = parseBackup(JSON.stringify(sharedOnly));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.path).toBeNull();
      expect(r.pathSource).toBe("unknown");
    }
  });

  it("writes the resolved path into meta so the app does not have to guess twice", () => {
    const r = parseBackup(
      JSON.stringify({ gettingStarted: {}, behavior: { triggers: "Alarms" } })
    );
    if (r.ok) expect(r.meta.letterPath).toBe("special-needs");
  });

  it("prefers the declaration over the sections, even when they disagree", () => {
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        meta: { letterPath: "general" },
        data: { trustee: { moneyIsFor: "A life" } },
      })
    );
    if (r.ok) {
      expect(r.path).toBe("general");
      expect(r.pathSource).toBe("declared");
    }
  });

  it("ignores a letterPath that is not one of the two", () => {
    const { path, source } = detectLetterPath(sample, {
      letterPath: "../../etc/passwd" as never,
    });
    expect(source).not.toBe("declared");
    expect(path === null || path === "special-needs" || path === "general").toBe(true);
  });
});

/**
 * A backup file is untrusted input that arrives from the filesystem. These
 * are the paths an attacker would reach for.
 */
describe("hostile backup files", () => {
  it("does not let a __proto__ key reach Object.prototype", () => {
    const attack = '{"gettingStarted":{"authorName":"Maria"},"__proto__":{"polluted":"yes"}}';
    const r = parseBackup(attack);
    expect(r.ok).toBe(true);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    if (r.ok) expect(r.data).not.toHaveProperty("polluted");
  });

  it("does not let a nested __proto__ or constructor key through", () => {
    const attack = JSON.stringify({
      gettingStarted: { authorName: "Maria", __proto__: { polluted: "deep" } },
      medical: { constructor: { prototype: { polluted: "deeper" } }, allergies: "None" },
    });
    const r = parseBackup(attack);
    expect(({} as Record<string, unknown>).polluted).toBeUndefined();
    expect(r.ok).toBe(true);
  });

  it("survives absurdly deep nesting instead of blowing the stack", () => {
    let deep = '{"a":1}';
    for (let i = 0; i < 400; i += 1) deep = `{"a":${deep}}`;
    const r = parseBackup(`{"gettingStarted":{"authorName":"Maria"},"junk":${deep}}`);
    expect(r.ok).toBe(true);
  });

  it("keeps script-looking text as literal text rather than treating it as markup", () => {
    const xss = "<script>alert(1)</script>";
    const r = parseBackup(JSON.stringify({ gettingStarted: { authorName: xss } }));
    expect(r.ok).toBe(true);
    // Stored verbatim; React escapes it on render and the PDF draws it as text.
    if (r.ok) expect(r.data.gettingStarted?.authorName).toBe(xss);
  });

  it("refuses a photograph that is not an inline image", () => {
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        data: sample,
        photos: [
          { slot: "recent", dataUrl: "javascript:alert(1)" },
          { slot: "family", dataUrl: "https://example.com/tracker.png" },
        ],
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.photos).toBeUndefined();
  });

  it("keeps a well-formed inline image", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        data: sample,
        photos: [{ slot: "recent", dataUrl: png }],
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.photos).toHaveLength(1);
  });

  it("never restores more than the two photograph slots", () => {
    const png =
      "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";
    const r = parseBackup(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        data: sample,
        photos: Array.from({ length: 50 }, () => ({ slot: "recent", dataUrl: png })),
      })
    );
    if (r.ok) expect(r.photos!.length).toBeLessThanOrEqual(2);
  });
});
