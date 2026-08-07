import { z } from "zod";
import type { FieldDef, SectionDef } from "@/lib/content/types";

/**
 * Gentle, format-only hints. These never block navigation or saving — they
 * only produce soft messages next to a field. The persistence schema in
 * lib/schema.ts stays fully permissive on purpose.
 */

export function looksLikeEmail(v: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v);
}

/** Accepts ISO (from native date inputs) and common typed forms like 3/14/2004. */
export function looksLikeDate(v: string): boolean {
  const t = v.trim();
  return (
    /^\d{4}-\d{2}-\d{2}$/.test(t) ||
    /^\d{1,2}[/.-]\d{1,2}[/.-]\d{2,4}$/.test(t)
  );
}

const EMAIL_HINT =
  "This doesn't look like a full email address yet — worth a quick check.";
const DATE_HINT = "This date doesn't look complete yet — worth a quick check.";

function emptyOr(check: (v: string) => boolean) {
  return (v: string | undefined) => !v || v.trim() === "" || check(v.trim());
}

function scalarHint(kind: FieldDef["kind"]) {
  const base = z.string().optional();
  if (kind === "email") return base.refine(emptyOr(looksLikeEmail), EMAIL_HINT);
  if (kind === "date") return base.refine(emptyOr(looksLikeDate), DATE_HINT);
  return base;
}

/**
 * Builds the react-hook-form resolver schema for one section from its
 * declarative definition. Every field remains optional; only email and date
 * formats produce (soft) messages.
 */
export function buildHintSchema(def: SectionDef) {
  const shape: Record<string, z.ZodTypeAny> = {};
  for (const field of def.fields) {
    if (field.kind === "repeater") {
      const itemShape: Record<string, z.ZodTypeAny> = { id: z.string().optional() };
      for (const item of field.itemFields) {
        itemShape[item.id] =
          item.kind === "checkbox" ? z.boolean().optional() : scalarHint(item.kind);
      }
      shape[field.id] = z.array(z.object(itemShape)).optional();
    } else {
      shape[field.id] = scalarHint(field.kind);
    }
  }
  return z.object(shape);
}
