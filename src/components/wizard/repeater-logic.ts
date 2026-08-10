import type {
  RepeaterField,
  RepeaterItemMultiselect,
  SelectOption,
} from "@/lib/content/types";
import { clampToWord } from "@/lib/derive";

/*
 * Pure logic behind the repeater UI — token arrays and the one-line record
 * summary. Kept out of the component so it can be unit-tested without
 * rendering a form.
 */

/** The display label for a stored token; unknown tokens render verbatim. */
export function optionLabel(options: readonly SelectOption[], value: string): string {
  return options.find((o) => o.value === value)?.label ?? value;
}

/**
 * Known tokens first, in the order the options declare (the card layer sorts
 * by the same declared orders); anything typed or imported keeps its own
 * order after them. Stable, so checking "morning" after "bedtime" cannot
 * shuffle a custom "14:30" the family already added.
 */
export function orderTokens(
  options: readonly SelectOption[],
  values: readonly string[]
): string[] {
  const known = options.map((o) => o.value).filter((v) => values.includes(v));
  const custom = values.filter((v) => !options.some((o) => o.value === v));
  return [...known, ...custom];
}

/** Check/uncheck one token in a multiselect's string[]. */
export function toggleToken(
  field: RepeaterItemMultiselect,
  values: readonly string[],
  token: string
): string[] {
  const next = values.includes(token)
    ? values.filter((v) => v !== token)
    : [...values, token];
  return orderTokens(field.options, next);
}

/**
 * A typed custom value ("14:30", "2:30 PM") joins the same array as the
 * checked tokens. Trimmed and deduplicated; an empty entry is a no-op so a
 * stray Enter never adds a blank chip.
 */
export function addCustomValue(
  field: RepeaterItemMultiselect,
  values: readonly string[],
  raw: string
): string[] {
  const t = raw.trim();
  if (!t || values.includes(t)) return [...values];
  return orderTokens(field.options, [...values, t]);
}

/** Max length of a collapsed record's summary line — one line on a phone. */
const SUMMARY_MAX = 80;

/**
 * The one-line summary a collapsed record shows, derived from its first
 * filled fields in definition order: "Sertraline — 25 mg, morning". The first
 * filled value leads; up to two more follow after an em dash. Checkbox labels
 * lose any " — " or ": " explanation tail and lowercase into the list ("with
 * food"),
 * and tokens render as their option labels, so the summary reads like a
 * sentence fragment rather than data.
 */
export function repeaterItemSummary(
  field: RepeaterField,
  item: Record<string, unknown>
): string {
  const parts: string[] = [];
  for (const f of field.itemFields) {
    const v = item[f.id];
    if (f.kind === "checkbox") {
      if (v === true) parts.push(lowerFirst(f.label.split(/ — |: /)[0]));
      continue;
    }
    if (f.kind === "select") {
      if (typeof v === "string" && v.trim()) parts.push(optionLabel(f.options, v.trim()));
      continue;
    }
    if (f.kind === "multiselect") {
      if (Array.isArray(v) && v.length > 0) {
        parts.push(
          orderTokens(f.options, v.filter((t): t is string => typeof t === "string"))
            .map((t) => optionLabel(f.options, t))
            .join(", ")
        );
      }
      continue;
    }
    if (typeof v === "string" && v.trim()) parts.push(firstLine(v));
  }
  if (parts.length === 0) return "";
  const [head, ...rest] = parts;
  const tail = rest.slice(0, 2).join(", ");
  return clampToWord(tail ? `${head} — ${tail}` : head, SUMMARY_MAX);
}

/** Multiline answers (routine steps) contribute only their first line. */
function firstLine(v: string): string {
  return v.trim().split("\n")[0].trim();
}

function lowerFirst(v: string): string {
  const t = v.trim();
  return t.charAt(0).toLowerCase() + t.slice(1);
}
