import { describe, expect, it } from "vitest";
import { z } from "zod";
import { sectionDefs } from "@/lib/content/sections";
import { previewPrompts } from "@/lib/content/preview-prompts";
import type { MetaCond } from "@/lib/content/types";
import { sectionKeys, sectionSchemas } from "@/lib/schema";

/**
 * The section definitions (copy) and the zod schema (persistence) are written
 * by hand in two places. These tests make drift impossible to miss: every
 * schema key must be reachable from THE roster (there is exactly one), and
 * every field a section asks about must exist in the schema — with the
 * adaptive-wording rules enforced, not inspected.
 */

/**
 * Schema fields that deliberately have NO form control. Each is an owner
 * decision recorded here; anything not listed still fails the sync.
 * - legal.decisionStatus: the old composite question, legacy-carried — its
 *   prose spans the four sharper questions, so it is stored and printed but
 *   never asked again (docs/schema-migration.md).
 */
const FORMLESS_FIELDS: Record<string, string[]> = {
  legal: ["decisionStatus"],
};

/** The onboarding vocabulary — showWhen and variants may test only these. */
const ROUTING_TOKENS: Record<string, string[]> = {
  audience: ["trustee", "caregiver", "both"],
  stage: ["child", "adult"],
  supportLevel: ["mostlyIndependent", "someDailyHelp", "substantial", "roundTheClock"],
  communicationDiffers: ["yes", "no"],
  behaviorEscalates: ["yes", "no"],
  cognitionChanging: ["yes", "early", "no"],
  hasTrust: ["yes", "planned", "no", "notSure"],
  hasBenefits: ["yes", "maybe", "no"],
  schoolWork: ["school", "work", "neither"],
  livesWith: ["withWriter", "ownHome", "withOthers", "facility"],
};

function expectValidCond(cond: MetaCond, where: string) {
  for (const [key, tokens] of Object.entries(cond)) {
    expect(ROUTING_TOKENS[key], `${where}: unknown routing key "${key}"`).toBeDefined();
    for (const t of tokens ?? []) {
      expect(ROUTING_TOKENS[key], `${where}: unknown token "${key}=${t}"`).toContain(t);
    }
  }
}

describe("content ↔ schema sync", () => {
  it("is ONE roster of twenty-one sections, ordered, unique", () => {
    expect(sectionDefs).toHaveLength(21);
    expect(new Set(sectionDefs.map((d) => d.slug)).size).toBe(21);
    expect(new Set(sectionDefs.map((d) => d.key)).size).toBe(21);
  });

  it("every schema key belongs to a section, and every section key is in the schema", () => {
    const keysInUse = [...new Set(sectionDefs.map((d) => d.key))];
    expect(keysInUse.sort()).toEqual([...sectionKeys].sort());
  });

  it("every field id exists in the schema, and every schema key has a field (or a recorded exception)", () => {
    for (const def of sectionDefs) {
      const shape = sectionSchemas[def.key].shape;
      const formless = FORMLESS_FIELDS[def.key] ?? [];
      const schemaKeys = Object.keys(shape)
        .filter((k) => !formless.includes(k))
        .sort();
      const defKeys = def.fields.map((f) => f.id).sort();
      expect(defKeys, `section "${def.key}"`).toEqual(schemaKeys);
    }
  });

  it("repeater item fields match their item schemas (plus the generated id)", () => {
    // Schema keys with no form control, each a deliberate owner decision.
    const FORMLESS: Record<string, string[]> = {
      // Food rules exist to be handed to whoever is feeding them — the
      // keep-off-cards flag was removed from this form (2026-08-10).
      "foods.items": ["keepOffCards"],
    };
    for (const def of sectionDefs) {
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
    for (const def of sectionDefs) {
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
    const options = (sectionKey: string, repeaterId: string, itemId: string): string[] => {
      for (const def of sectionDefs) {
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
    for (const def of sectionDefs) {
      for (const field of def.fields) {
        expect(banned.test(field.id), `${def.key}.${field.id}`).toBe(false);
      }
    }
  });

  it("legacy refs point at real free-text schema fields, never at a section's own asked fields", () => {
    for (const def of sectionDefs) {
      for (const ref of def.legacyRefs ?? []) {
        const where = `${def.key} → ${ref.sectionKey}.${ref.fieldKey}`;
        const shape = sectionSchemas[ref.sectionKey].shape as Record<string, unknown>;
        expect(Object.keys(shape), where).toContain(ref.fieldKey);
        // A ref may point into its own section only for a legacy-carried
        // field the form no longer asks (legal.decisionStatus).
        if (ref.sectionKey === def.key) {
          expect(
            FORMLESS_FIELDS[def.key] ?? [],
            `${where} shadows a field the form still asks`
          ).toContain(ref.fieldKey);
        }
      }
    }
  });

  it("every section has three preview prompts", () => {
    for (const def of sectionDefs) {
      const prompts = previewPrompts[def.slug];
      expect(prompts, `preview prompts for "${def.slug}"`).toBeDefined();
      expect(prompts).toHaveLength(3);
      for (const p of prompts) expect(p.trim().length).toBeGreaterThan(0);
    }
  });

  it("has no orphan preview prompts", () => {
    const slugs = new Set(sectionDefs.map((d) => d.slug));
    for (const slug of Object.keys(previewPrompts)) {
      expect(slugs.has(slug), `orphan preview prompt "${slug}"`).toBe(true);
    }
  });
});

describe("adaptive wording", () => {
  it("every showWhen and variant condition uses the real routing vocabulary", () => {
    for (const def of sectionDefs) {
      for (const cond of def.showWhen ?? []) expectValidCond(cond, `section ${def.key}`);
      for (const v of def.variants ?? []) expectValidCond(v.when, `section ${def.key} variant`);
      for (const field of def.fields) {
        for (const cond of field.showWhen ?? [])
          expectValidCond(cond, `${def.key}.${field.id}`);
        for (const v of field.variants ?? [])
          expectValidCond(v.when, `${def.key}.${field.id} variant`);
      }
    }
  });

  it("a variant that changes the register carries its own example when the base has one", () => {
    // The failure this prevents is concrete: a granddaughter writing about
    // her grandmother opens "See an example" under an adapted label and
    // reads a sample answer about a child's autism diagnosis.
    for (const def of sectionDefs) {
      for (const field of def.fields) {
        if (field.kind === "repeater" || !field.example) continue;
        for (const v of field.variants ?? []) {
          if (v.label || v.help) {
            expect(
              v.example,
              `${def.key}.${field.id}: variant changes wording but keeps the base example`
            ).toBeDefined();
          }
        }
      }
    }
  });

  it("variants never carry an example that duplicates the base verbatim", () => {
    for (const def of sectionDefs) {
      for (const field of def.fields) {
        if (field.kind === "repeater") continue;
        for (const v of field.variants ?? []) {
          if (v.example && field.example) {
            expect(v.example, `${def.key}.${field.id}`).not.toBe(field.example);
          }
        }
      }
    }
  });
});
