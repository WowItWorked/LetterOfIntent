import { describe, expect, it } from "vitest";
import { z } from "zod";
import { LETTER_PATHS } from "@/lib/content/paths";
import { previewPrompts } from "@/lib/content/preview-prompts";
import type { SectionDef } from "@/lib/content/types";
import { sectionKeys, sectionSchemas } from "@/lib/schema";

const allSections: SectionDef[] = LETTER_PATHS.flatMap((p) => p.sections);

/**
 * The section definitions (copy) and the zod schema (persistence) are written
 * by hand in two places. These tests make drift impossible to miss: every
 * schema key must be reachable from a roster, and every field a section asks
 * about must exist in the schema — exactly, in both directions.
 */
describe("content ↔ schema sync", () => {
  it("has both paths, at twenty and nineteen sections", () => {
    expect(LETTER_PATHS.map((p) => p.id)).toEqual(["special-needs", "general"]);
    expect(LETTER_PATHS[0].sections).toHaveLength(20);
    expect(LETTER_PATHS[1].sections).toHaveLength(19);
  });

  it.each(LETTER_PATHS)("$id is numbered in order with unique slugs and keys", (path) => {
    const defs = path.sections;
    expect(defs.map((d) => d.number)).toEqual(
      Array.from({ length: defs.length }, (_, i) => i + 1)
    );
    expect(new Set(defs.map((d) => d.slug)).size).toBe(defs.length);
    expect(new Set(defs.map((d) => d.key)).size).toBe(defs.length);
  });

  it("every schema key belongs to a section, and every section key is in the schema", () => {
    const keysInUse = [...new Set(allSections.map((d) => d.key))];
    expect(keysInUse.sort()).toEqual([...sectionKeys].sort());
  });

  it("a slug shared between the paths always means the same section key", () => {
    const bySlug = new Map<string, string>();
    for (const def of allSections) {
      const seen = bySlug.get(def.slug);
      if (seen) expect(seen, `slug "${def.slug}"`).toBe(def.key);
      else bySlug.set(def.slug, def.key);
    }
  });

  it("every field id exists in the schema, and every schema key has a field", () => {
    for (const def of allSections) {
      const shape = sectionSchemas[def.key].shape;
      const schemaKeys = Object.keys(shape).sort();
      const defKeys = def.fields.map((f) => f.id).sort();
      expect(defKeys, `section "${def.key}"`).toEqual(schemaKeys);
    }
  });

  it("repeater item fields match their item schemas (plus the generated id)", () => {
    // Schema keys with no form control, each a deliberate owner decision.
    // The schema keeps them so old backups restore losslessly; the form
    // simply no longer offers them. Anything not listed here still fails.
    const FORMLESS: Record<string, string[]> = {
      // Food rules exist to be handed to whoever is feeding them — the
      // keep-off-cards flag was removed from this form (2026-08-10).
      "foods.items": ["keepOffCards"],
    };
    for (const def of allSections) {
      for (const field of def.fields) {
        if (field.kind !== "repeater") continue;
        const wrapped = sectionSchemas[def.key].shape[
          field.id as keyof (typeof sectionSchemas)[typeof def.key]["shape"]
        ] as z.ZodTypeAny;
        const arr = (wrapped as z.ZodOptional<z.ZodArray<z.AnyZodObject>>)._def
          .innerType as z.ZodArray<z.AnyZodObject>;
        const formless = FORMLESS[`${def.key}.${field.id}`] ?? [];
        const itemShapeKeys = Object.keys(arr.element.shape)
          .filter((k) => !formless.includes(k))
          .sort();
        const expected = ["id", ...field.itemFields.map((f) => f.id)].sort();
        expect(itemShapeKeys, `repeater "${def.key}.${field.id}"`).toEqual(expected);
      }
    }
  });

  it("every select and multiselect declares unique, non-empty options", () => {
    for (const def of allSections) {
      for (const field of def.fields) {
        if (field.kind !== "repeater") continue;
        for (const item of field.itemFields) {
          if (item.kind !== "select" && item.kind !== "multiselect") continue;
          const where = `${def.key}.${field.id}.${item.id}`;
          expect(item.options.length, where).toBeGreaterThan(0);
          expect(new Set(item.options.map((o) => o.value)).size, where).toBe(
            item.options.length
          );
          for (const o of item.options) {
            expect(o.value.trim(), where).not.toBe("");
            expect(o.label.trim(), where).not.toBe("");
          }
        }
      }
    }
  });

  it("keeps the option tokens the card layer translates", () => {
    // derive.ts turns these tokens into card phrases and groupings; removing
    // or renaming one silently changes cards. The schema stays a free string
    // — options are form-only — so this pin is the only guard.
    const options = (sectionKey: string, repeaterId: string, itemId: string): string[] => {
      for (const def of allSections) {
        if (def.key !== sectionKey) continue;
        for (const field of def.fields) {
          if (field.kind !== "repeater" || field.id !== repeaterId) continue;
          const item = field.itemFields.find((f) => f.id === itemId);
          if (item && (item.kind === "select" || item.kind === "multiselect")) {
            return item.options.map((o) => o.value);
          }
        }
      }
      return [];
    };
    expect(options("familySupport", "contacts", "roles")).toEqual(
      expect.arrayContaining([
        "primary",
        "medical_decision",
        "legal_guardian",
        "pickup",
        "neighbor_backup",
      ])
    );
    expect(options("routines", "items", "timeOfDay")).toEqual(
      expect.arrayContaining(["morning", "afternoon", "evening", "night"])
    );
    expect(options("careTasks", "items", "category")).toEqual(
      expect.arrayContaining(["toileting", "dressing", "bathing", "equipment", "mobility"])
    );
  });

  it("never asks for numbers it promised not to collect", () => {
    const banned = /ssn|social.?security|account.?number|policy.?number/i;
    for (const def of allSections) {
      for (const field of def.fields) {
        expect(banned.test(field.id), `${def.key}.${field.id}`).toBe(false);
      }
    }
  });

  it("legacy refs point at real free-text schema fields, never at themselves", () => {
    for (const def of allSections) {
      if (!def.legacyRefs) continue;
      for (const path of LETTER_PATHS) {
        for (const ref of def.legacyRefs[path.id] ?? []) {
          const where = `${def.key} → ${ref.sectionKey}.${ref.fieldKey}`;
          expect(ref.sectionKey, where).not.toBe(def.key);
          const shape = sectionSchemas[ref.sectionKey].shape as Record<string, unknown>;
          expect(Object.keys(shape), where).toContain(ref.fieldKey);
          // And the shadowed section must actually be in that path's roster,
          // or the quote would cite a question the family was never asked.
          expect(
            path.sections.some((s) => s.key === ref.sectionKey),
            where
          ).toBe(true);
        }
      }
    }
  });

  it("every section has three preview prompts for the chooser", () => {
    for (const def of allSections) {
      const prompts = previewPrompts[def.slug];
      expect(prompts, `preview prompts for "${def.slug}"`).toBeDefined();
      expect(prompts).toHaveLength(3);
      for (const p of prompts) expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no orphan preview prompts", () => {
    const slugs = new Set(allSections.map((d) => d.slug));
    for (const slug of Object.keys(previewPrompts)) {
      expect(slugs.has(slug), `orphan preview prompt "${slug}"`).toBe(true);
    }
  });
});
