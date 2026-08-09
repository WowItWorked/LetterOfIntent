import { describe, expect, it } from "vitest";
import { z } from "zod";
import { LETTER_PATHS } from "@/lib/content/paths";
import { previewPrompts } from "@/lib/content/preview-prompts";
import type { SectionDef } from "@/lib/content/types";
import { sectionKeys, sectionSchemas } from "@/lib/schema";

const allSections: SectionDef[] = LETTER_PATHS.flatMap((p) => p.sections);

/**
 * The section definitions (copy) and the zod schema (persistence) are written
 * by hand in two places. These tests make drift impossible to miss.
 */
describe("content ↔ schema sync", () => {
  it("has both paths, at fifteen and fourteen sections", () => {
    expect(LETTER_PATHS.map((p) => p.id)).toEqual(["special-needs", "general"]);
    expect(LETTER_PATHS[0].sections).toHaveLength(15);
    expect(LETTER_PATHS[1].sections).toHaveLength(14);
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
    const keysInUse = [...new Set(allSections.map((d) => d.key))].sort();
    expect(keysInUse).toEqual([...sectionKeys].sort());
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

  it("repeater item fields match their item schemas (plus generated id)", () => {
    for (const def of allSections) {
      for (const field of def.fields) {
        if (field.kind !== "repeater") continue;
        const wrapped = sectionSchemas[def.key].shape[
          field.id as keyof (typeof sectionSchemas)[typeof def.key]["shape"]
        ] as z.ZodTypeAny;
        const arr = (wrapped as z.ZodOptional<z.ZodArray<z.AnyZodObject>>)._def
          .innerType as z.ZodArray<z.AnyZodObject>;
        const itemShapeKeys = Object.keys(arr.element.shape).sort();
        const expected = ["id", ...field.itemFields.map((f) => f.id)].sort();
        expect(itemShapeKeys, `repeater "${def.key}.${field.id}"`).toEqual(expected);
      }
    }
  });

  it("never asks for numbers it promised not to collect", () => {
    const banned = /ssn|social.?security|account.?number|policy.?number/i;
    for (const def of allSections) {
      for (const field of def.fields) {
        expect(banned.test(field.id), `${def.key}.${field.id}`).toBe(false);
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
