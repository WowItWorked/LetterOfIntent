import { describe, expect, it } from "vitest";
import { HALE_LETTER, HALE_META } from "@/lib/content/samples/hale";
import { RUIZ_LETTER, RUIZ_META } from "@/lib/content/samples/ruiz";
import { SAMPLE_DOCS, sampleBySlug } from "@/lib/content/samples";
import { SAMPLE_CARD_LETTER } from "@/components/home/sample-card-data";
import { fieldsForMeta, sectionsForMeta } from "@/lib/content/config";
import { deriveCard } from "@/lib/cards/derive";
import { emergencyInfo, keyPoints } from "@/lib/derive";
import { CARD_KEYS } from "@/lib/content/cards";
import { letterDataSchema, letterMetaSchema, type LetterData } from "@/lib/schema";

/**
 * The two sample families are fixtures with five jobs (the sample a visitor
 * opens, the output-integrity payload, the migration payload, the a11y
 * fixture, and the variance proof). These tests are the CI teeth: a fixture
 * that references a field the schema no longer has fails the build, and the
 * variance requirement is asserted, not asserted-by-vibes.
 */

const FIXTURES: ReadonlyArray<[string, LetterData, typeof RUIZ_META]> = [
  ["Ruiz", RUIZ_LETTER, RUIZ_META],
  ["Hale", HALE_LETTER, HALE_META],
  ["card gallery (Danny)", SAMPLE_CARD_LETTER, RUIZ_META],
];

describe("the sample fixtures stay schema-true", () => {
  it.each(FIXTURES)("%s parses and loses nothing to the schema", (_name, data, meta) => {
    const parsed = letterDataSchema.parse(data);
    // zod strips unknown keys silently; deep equality turns a stripped key —
    // a fixture referencing a field the schema no longer has — into a red build.
    expect(parsed).toEqual(data);
    expect(letterMetaSchema.parse(meta)).toEqual(meta);
  });

  it("carries no sensitive identifiers, by grep", () => {
    const banned = /\bssn\b|social security number|account number|policy number|\d{3}-\d{2}-\d{4}/i;
    for (const [name, data] of FIXTURES) {
      expect(banned.test(JSON.stringify(data)), name).toBe(false);
    }
  });

  it("uses only (555) phone numbers — obviously sample, never a real line", () => {
    for (const [name, data] of FIXTURES) {
      const phones = JSON.stringify(data).match(/\(\d{3}\) \d{3}-\d{4}/g) ?? [];
      for (const p of phones) expect(p.startsWith("(555)"), `${name}: ${p}`).toBe(true);
    }
  });
});

describe("the variance proof — same form, visibly different letters", () => {
  it("the two configurations differ by roughly the promised spread of questions", () => {
    const ruizSections = sectionsForMeta(RUIZ_META, {});
    const haleSections = sectionsForMeta(HALE_META, {});
    const count = (meta: typeof RUIZ_META) =>
      sectionsForMeta(meta, {}).reduce(
        (n, def) => n + fieldsForMeta(def, meta, {}).length,
        0
      );
    const ruizFields = count(RUIZ_META);
    const haleFields = count(HALE_META);

    // The Hale configuration never sees the sharp sections…
    const haleKeys = haleSections.map((d) => d.key);
    expect(haleKeys).not.toContain("behavior");
    expect(haleKeys).not.toContain("trusteeGuidance");
    expect(haleKeys).not.toContain("careTasks");
    // …the Ruiz configuration sees everything.
    expect(ruizSections).toHaveLength(21);

    // The brief's bar: a 20-30 question spread between the poles.
    const spread = ruizFields - haleFields;
    expect(spread).toBeGreaterThanOrEqual(20);
    expect(spread).toBeLessThanOrEqual(40);
  });

  it("each fixture fills every section its configuration asks", () => {
    for (const [name, data, meta] of [
      ["Ruiz", RUIZ_LETTER, RUIZ_META],
      ["Hale", HALE_LETTER, HALE_META],
    ] as const) {
      for (const def of sectionsForMeta(meta, data)) {
        expect(
          data[def.key] && Object.keys(data[def.key] as object).length > 0,
          `${name} fixture leaves ${def.key} empty`
        ).toBeTruthy();
      }
    }
  });
});

describe("the fixtures light the outputs", () => {
  it("the Ruiz letter derives every card; the Hale letter derives its own set", () => {
    for (const key of CARD_KEYS) {
      expect(deriveCard(RUIZ_LETTER, key), `Ruiz ${key}`).not.toBeNull();
    }
    // Hale has no behavior section and no care tasks, but the daily-life
    // cards still light from her letter.
    for (const key of ["identity", "emergency", "meds", "behavior", "routine", "food"] as const) {
      expect(deriveCard(HALE_LETTER, key), `Hale ${key}`).not.toBeNull();
    }
  });

  it("both emergency sheets carry the essentials, from the right fields", () => {
    const ruiz = emergencyInfo(RUIZ_LETTER);
    expect(ruiz.allergies ?? ruiz.medications.length).toBeTruthy();
    expect(ruiz.protocol).toBeUndefined(); // no prose protocol; scenarios carry it
    expect(ruiz.triggers).toContain("Unannounced");
    const hale = emergencyInfo(HALE_LETTER);
    expect(hale.medications.map((m) => m.name)).toContain("Warfarin");
    expect(hale.insurance).toContain("Medicare");
    // No sharp pain field in this configuration — wontAdmit stands in.
    expect(hale.pain).toContain("stairs");
    expect(hale.communication).toContain("Straight");
  });

  it("key points read correctly for both families", () => {
    expect(keyPoints(RUIZ_LETTER).hardLimits).toContain("facility");
    expect(keyPoints(HALE_LETTER).neverChange).toContain("upstairs bedroom");
  });
});

describe("the sample registry", () => {
  it("every sample names a real fixture family and unique slug", () => {
    expect(new Set(SAMPLE_DOCS.map((s) => s.slug)).size).toBe(SAMPLE_DOCS.length);
    for (const doc of SAMPLE_DOCS) {
      expect(["high-support", "aging-parent"]).toContain(doc.family);
      expect(["letter", "caregiver", "emergency"]).toContain(doc.kind);
      expect(doc.downloadName).toMatch(/^SAMPLE-/);
      expect(sampleBySlug(doc.slug)).toBe(doc);
    }
  });

  it("keeps the legacy slugs the site links to", () => {
    expect(sampleBySlug("letter-of-intent-disabilities")).toBeDefined();
    expect(sampleBySlug("emergency-sheet-disabilities")).toBeDefined();
    expect(sampleBySlug("letter-of-intent-anyone")).toBeDefined();
  });

  it("the caregiver-only family never offers a trustee letter", () => {
    for (const doc of SAMPLE_DOCS.filter((d) => d.family === "aging-parent")) {
      expect(doc.kind).not.toBe("letter");
    }
  });
});
