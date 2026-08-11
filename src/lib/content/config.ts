import type { LetterData, LetterMeta, SectionKey } from "@/lib/schema";
import type { FieldDef, SectionDef } from "@/lib/content/types";
import { showWhenMatches } from "@/lib/content/types";
import { sectionDefs } from "@/lib/content/sections";
import { fieldHasContent, sectionHasContent } from "@/lib/derive";

/**
 * The configuration layer: which sections and fields a given letter's
 * onboarding answers put in play. This replaces the old two-array path system
 * (`LETTER_PATHS`, `resolvePath`, `sectionBySlugInPath`, …) with one roster
 * gated declaratively.
 *
 * The one rule that overrides every gate: CONTENT ALWAYS SHOWS. A section or
 * field that holds the family's words renders in every configuration, however
 * the answers are set — gating decides what we ASK, never what we show back.
 */

export { sectionDefs };

/** Every section, ungated — prerendering, tests, and the backup layer. */
export function allSections(): SectionDef[] {
  return sectionDefs;
}

export function allSectionSlugs(): string[] {
  return sectionDefs.map((s) => s.slug);
}

export function sectionByKey(key: SectionKey): SectionDef | undefined {
  return sectionDefs.find((s) => s.key === key);
}

export function sectionBySlug(slug: string): SectionDef | undefined {
  return sectionDefs.find((s) => s.slug === slug);
}

/* ------------------------------------------------------------- visibility */

export function sectionInPlay(def: SectionDef, meta: LetterMeta, data: LetterData): boolean {
  if (showWhenMatches(def.showWhen, meta)) return true;
  return sectionHasContent(data, def);
}

export function fieldInPlay(
  def: SectionDef,
  field: FieldDef,
  meta: LetterMeta,
  data: LetterData
): boolean {
  if (showWhenMatches(field.showWhen, meta)) return true;
  const values = data[def.key] as Record<string, unknown> | undefined;
  return fieldHasContent(values, field);
}

/** The sections this configuration asks, in reading order. */
export function sectionsForMeta(meta: LetterMeta, data: LetterData = {}): SectionDef[] {
  return sectionDefs.filter((def) => sectionInPlay(def, meta, data));
}

/** The fields of one section this configuration asks, in def order. */
export function fieldsForMeta(
  def: SectionDef,
  meta: LetterMeta,
  data: LetterData = {}
): FieldDef[] {
  return def.fields.filter((f) => fieldInPlay(def, f, meta, data));
}

/* --------------------------------------------------------------- progress */

export function startedSectionKeys(data: LetterData, meta: LetterMeta): SectionKey[] {
  return sectionsForMeta(meta, data)
    .filter((d) => sectionHasContent(data, d))
    .map((d) => d.key);
}

export function startedCount(data: LetterData, meta: LetterMeta): number {
  return startedSectionKeys(data, meta).length;
}

/* ------------------------------------------------------------- navigation */

/**
 * A slug is resolvable even when its section is gated off — deep links and
 * old bookmarks must never 404 a family's own letter. The wizard shows a
 * gated-but-visited section with a gentle note instead of hiding it.
 */
export function nextSection(
  slug: string,
  meta: LetterMeta,
  data: LetterData = {}
): SectionDef | undefined {
  const active = sectionsForMeta(meta, data);
  const all = sectionDefs;
  const from = all.findIndex((s) => s.slug === slug);
  if (from < 0) return undefined;
  for (let i = from + 1; i < all.length; i++) {
    if (active.some((a) => a.slug === all[i].slug)) return all[i];
  }
  return undefined;
}

export function prevSection(
  slug: string,
  meta: LetterMeta,
  data: LetterData = {}
): SectionDef | undefined {
  const active = sectionsForMeta(meta, data);
  const all = sectionDefs;
  const from = all.findIndex((s) => s.slug === slug);
  if (from < 0) return undefined;
  for (let i = from - 1; i >= 0; i--) {
    if (active.some((a) => a.slug === all[i].slug)) return all[i];
  }
  return undefined;
}

/** 1-based position and total within the active configuration, for headers. */
export function sectionPosition(
  slug: string,
  meta: LetterMeta,
  data: LetterData = {}
): { index: number; total: number } {
  const active = sectionsForMeta(meta, data);
  const i = active.findIndex((s) => s.slug === slug);
  return { index: i >= 0 ? i + 1 : 0, total: active.length };
}

/* -------------------------------------------------------- retired slugs */

/**
 * Old wizard URLs from the two-path era, mapped to their canonical sections.
 * next.config.ts turns these into permanent redirects; the wizard also
 * resolves them so an in-app stale link never dead-ends.
 */
export const RETIRED_SLUGS: Record<string, string> = {
  about: "about-them",
  "a-typical-day": "typical-days",
  "a-typical-week": "typical-days",
  "talking-with-them": "communication",
  medical: "health-and-medical",
  housing: "home-and-daily-living",
  "work-and-obligations": "school-and-work",
  "benefits-and-finances": "money-and-benefits",
  "money-and-documents": "money-and-benefits",
  "legal-and-advocacy": "legal-and-decisions",
  "faith-joy-and-community": "friends-joy-and-faith",
};

export function resolveSlug(slug: string): SectionDef | undefined {
  return sectionBySlug(RETIRED_SLUGS[slug] ?? slug);
}
