import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  BUNDLES,
  CARD_DEFS,
  CARD_KEYS,
  PRIORITY_ORDER,
  RENDER_REQUIREMENTS,
  SOURCES,
  type CardSource,
  type SourceRef,
} from "@/lib/content/cards";
import { sectionSchemas, type SectionKey } from "@/lib/schema";

/**
 * The card config and the persistence schema are written by hand in two
 * places. The renderer trusts the config blindly — a source that names a
 * section or field the schema does not have would render an empty block, or
 * nothing, with no error anywhere. This test is what stops the two drifting.
 */

/** Every section.field pair the config references, wherever it appears. */
function allRefs(): Array<{ where: string; section: SectionKey; field: string; kind?: string }> {
  const refs: Array<{ where: string; section: SectionKey; field: string; kind?: string }> = [];
  for (const [card, byPath] of Object.entries(SOURCES)) {
    for (const [path, sources] of Object.entries(byPath)) {
      for (const src of sources as readonly CardSource[]) {
        refs.push({
          where: `SOURCES.${card}.${path}`,
          section: src.section,
          field: src.field,
          kind: src.kind,
        });
      }
    }
  }
  for (const [card, needs] of Object.entries(RENDER_REQUIREMENTS)) {
    for (const need of needs) {
      for (const ref of need.anyOf as readonly SourceRef[]) {
        refs.push({ where: `RENDER_REQUIREMENTS.${card}`, section: ref.section, field: ref.field });
      }
    }
  }
  return refs;
}

describe("card config and the schema agree", () => {
  it("every reference names a real section and a real field in its zod shape", () => {
    for (const ref of allRefs()) {
      const schema = sectionSchemas[ref.section];
      expect(schema, `${ref.where}: unknown section "${ref.section}"`).toBeDefined();
      const field = (schema.shape as Record<string, z.ZodTypeAny>)[ref.field];
      expect(field, `${ref.where}: "${ref.section}.${ref.field}" is not in the schema`).toBeDefined();
    }
  });

  it('a "records" source points at an array, a "scalar" source at a string', () => {
    for (const ref of allRefs()) {
      if (!ref.kind) continue;
      const field = (sectionSchemas[ref.section].shape as Record<string, z.ZodTypeAny>)[
        ref.field
      ] as z.ZodOptional<z.ZodTypeAny>;
      const inner = field._def.innerType as z.ZodTypeAny;
      const isArray = inner instanceof z.ZodArray;
      expect(
        isArray,
        `${ref.where}: "${ref.section}.${ref.field}" kind "${ref.kind}" does not match its shape`
      ).toBe(ref.kind === "records");
    }
  });

  it("every card key appears in CARD_DEFS, SOURCES, RENDER_REQUIREMENTS, and PRIORITY_ORDER", () => {
    for (const key of CARD_KEYS) {
      expect(CARD_DEFS[key], `CARD_DEFS.${key}`).toBeDefined();
      expect(CARD_DEFS[key].key, `CARD_DEFS.${key} names itself`).toBe(key);
      expect(SOURCES[key], `SOURCES.${key}`).toBeDefined();
      expect(RENDER_REQUIREMENTS[key], `RENDER_REQUIREMENTS.${key}`).toBeDefined();
      expect(PRIORITY_ORDER[key], `PRIORITY_ORDER.${key}`).toBeDefined();
      expect(PRIORITY_ORDER[key].length, `PRIORITY_ORDER.${key} is empty`).toBeGreaterThan(0);
    }
  });

  it("both letter paths get a source list and a non-empty requirement for every card", () => {
    for (const key of CARD_KEYS) {
      expect(SOURCES[key]["special-needs"].length, `SOURCES.${key}.special-needs`).toBeGreaterThan(0);
      expect(SOURCES[key].general.length, `SOURCES.${key}.general`).toBeGreaterThan(0);
      expect(RENDER_REQUIREMENTS[key].length, `RENDER_REQUIREMENTS.${key}`).toBeGreaterThan(0);
      for (const need of RENDER_REQUIREMENTS[key]) {
        expect(need.anyOf.length, `RENDER_REQUIREMENTS.${key} has an unmeetable need`).toBeGreaterThan(0);
      }
    }
  });

  it("the emergency card reads the scenario records on both paths", () => {
    for (const path of ["special-needs", "general"] as const) {
      expect(
        SOURCES.emergency[path].some(
          (s) => s.section === "emergencyPlan" && s.field === "scenarios" && s.kind === "records"
        ),
        `SOURCES.emergency.${path} is missing emergencyPlan.scenarios`
      ).toBe(true);
    }
  });

  it("every bundle is made of real cards", () => {
    for (const bundle of BUNDLES) {
      expect(bundle.cards.length, `bundle "${bundle.name}"`).toBeGreaterThan(0);
      for (const card of bundle.cards) {
        expect(CARD_KEYS, `bundle "${bundle.name}" references "${card}"`).toContain(card);
      }
    }
  });

  it("the seven color triples are unique — a card is recognisable at a glance", () => {
    const triples = Object.values(CARD_DEFS).map((d) => `${d.color}/${d.deep}/${d.tint}`);
    expect(new Set(triples).size).toBe(triples.length);
    const spines = Object.values(CARD_DEFS).map((d) => d.color);
    expect(new Set(spines).size).toBe(spines.length);
  });

  it("every card has an icon path — color is never the only signal", () => {
    for (const def of Object.values(CARD_DEFS)) {
      expect(typeof def.iconPath, `${def.key} iconPath`).toBe("string");
      expect(def.iconPath.trim().length, `${def.key} iconPath is empty`).toBeGreaterThan(0);
    }
  });
});
