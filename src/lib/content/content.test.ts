import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sectionDefs } from "@/lib/content/sections";
import { sectionKeys, sectionSchemas } from "@/lib/schema";

/**
 * The section definitions (copy) and the zod schema (persistence) are written
 * by hand in two places. These tests make drift impossible to miss.
 */
describe("content ↔ schema sync", () => {
  it("has 15 sections, numbered 1–15 in order, with unique slugs and keys", () => {
    expect(sectionDefs).toHaveLength(15);
    expect(sectionDefs.map((d) => d.number)).toEqual(
      Array.from({ length: 15 }, (_, i) => i + 1)
    );
    expect(new Set(sectionDefs.map((d) => d.slug)).size).toBe(15);
    expect(new Set(sectionDefs.map((d) => d.key)).size).toBe(15);
    expect(sectionDefs.map((d) => d.key).sort()).toEqual([...sectionKeys].sort());
  });

  it("every field id exists in the schema, and every schema key has a field", () => {
    for (const def of sectionDefs) {
      const shape = sectionSchemas[def.key].shape;
      const schemaKeys = Object.keys(shape).sort();
      const defKeys = def.fields.map((f) => f.id).sort();
      expect(defKeys, `section "${def.key}"`).toEqual(schemaKeys);
    }
  });

  it("repeater item fields match their item schemas (plus generated id)", () => {
    for (const def of sectionDefs) {
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
    for (const def of sectionDefs) {
      for (const field of def.fields) {
        expect(banned.test(field.id), `${def.key}.${field.id}`).toBe(false);
      }
    }
  });
});
