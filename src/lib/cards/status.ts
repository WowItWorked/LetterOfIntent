import {
  CARD_DEFS,
  CARD_KEYS,
  RENDER_REQUIREMENTS,
  SOURCES,
  type CardKey,
  type SourceRef,
} from "@/lib/content/cards";
import { needMet, requirementsMet } from "@/lib/cards/derive";
import { displayName, fillName } from "@/lib/derive";
import type { LetterData, LetterPath, SectionKey } from "@/lib/schema";

/**
 * The wizard's view of the care cards: which fields feed which card, and
 * whether a card already has what it needs. Everything here is derived from
 * content/cards.ts — adding a field to SOURCES or a need to
 * RENDER_REQUIREMENTS surfaces in the form with no component change, and
 * status.test.ts fails the build when a new need arrives without its copy.
 */

/* -------------------------------------------------------------------- titles */

/** A card's display name, from CARD_DEFS — never a retyped literal. */
export function cardTitle(key: CardKey): string {
  const def = CARD_DEFS[key];
  return [def.t1, def.t2].filter(Boolean).join(" ");
}

/* ------------------------------------------------------------- reverse index */

// Paths come from the config too, so a third letter path would index itself.
const CONFIG_PATHS = Object.keys(SOURCES.identity) as LetterPath[];

const fieldCards = new Map<string, CardKey[]>();
const sectionCards = new Map<string, CardKey[]>();

function pushUnique(map: Map<string, CardKey[]>, key: string, card: CardKey): void {
  const list = map.get(key) ?? [];
  if (!list.includes(card)) list.push(card);
  map.set(key, list);
}

// CARD_KEYS is the outer loop so every list keeps the canonical card order.
// legacy_fallback sources are left out on purpose: that prose reaches a card
// only while the structured section is empty, and a marker promising it would
// mislead the moment the family adds their first record — the LegacyEcho
// aside already explains that handover where it happens.
for (const card of CARD_KEYS) {
  for (const path of CONFIG_PATHS) {
    for (const src of SOURCES[card][path]) {
      if (src.tier === "legacy_fallback") continue;
      pushUnique(fieldCards, `${path}|${src.section}|${src.field}`, card);
      pushUnique(sectionCards, `${path}|${src.section}`, card);
    }
  }
}

/** The cards a single form field feeds, in CARD_KEYS order. */
export function cardsForField(
  path: LetterPath,
  section: SectionKey,
  fieldId: string
): readonly CardKey[] {
  return fieldCards.get(`${path}|${section}|${fieldId}`) ?? [];
}

/** The cards a whole section feeds, in CARD_KEYS order. */
export function cardsForSection(path: LetterPath, section: SectionKey): readonly CardKey[] {
  return sectionCards.get(`${path}|${section}`) ?? [];
}

/* ------------------------------------------------------------- field markers */

function listJoin(items: readonly string[]): string {
  if (items.length <= 1) return items[0] ?? "";
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

/**
 * The quiet line under a field label: "Appears on the Emergency Protocol
 * card." Undefined when the field feeds nothing, so the form stays silent
 * for the many questions that are letter-only.
 */
export function fieldMarkerText(
  path: LetterPath,
  section: SectionKey,
  fieldId: string
): string | undefined {
  const cards = cardsForField(path, section, fieldId);
  if (cards.length === 0) return undefined;
  const word = cards.length === 1 ? "card" : "cards";
  return `Appears on the ${listJoin(cards.map(cardTitle))} ${word}.`;
}

/* ------------------------------------------------------------ requirement copy */

/**
 * A need's stable identity: its refs, each as section.field plus any path and
 * record filter, sorted so ref order never matters. Copy is keyed by this, so
 * ANY change to a requirement — a new need, a new ref, a changed filter —
 * orphans its phrase and fails the completeness test instead of silently
 * showing nothing.
 */
export function needKey(need: { anyOf: readonly SourceRef[] }): string {
  return need.anyOf
    .map(
      (r) =>
        `${r.section}.${r.field}` +
        (r.path ? `@${r.path}` : "") +
        (r.recordFilter ? `#${r.recordFilter}` : "")
    )
    .sort()
    .join(" | ");
}

/**
 * One warm phrase per requirement need, completing "The {card} card needs …".
 * Phrases may carry {name}; cardStatus fills it before display.
 */
export const MISSING_COPY: Readonly<Record<string, string>> = {
  // identity: a name…
  "gettingStarted.subjectFullName | gettingStarted.subjectPreferredName": "their name",
  // …and someone responsible.
  "familySupport.contacts": "at least one person to call",
  // emergency: any one anchor a stranger could act on.
  "allergies.items | emergencyPlan.call911When | emergencyPlan.responseSteps | healthMedical.medications@general#rescueOnly | medical.medications@special-needs#rescueOnly":
    "an allergy, a rescue medication, or what to do first",
  // meds
  "healthMedical.medications@general | medical.medications@special-needs":
    "at least one medication",
  // behavior
  "communication.how@special-needs | dailyCommunication.howToSpeak@general":
    "a note on how {name} communicates",
  // routine
  "routines.items | routines.transitions | typicalDay.eveningRoutine@special-needs | typicalDay.morningRoutine@special-needs | typicalWeek.evenings@general | typicalWeek.mornings@general":
    "one routine, or a note about mornings or evenings",
  // food
  "foods.items | typicalDay.food@special-needs | typicalWeek.food@general":
    "at least one note about food",
  // care
  "careTasks.items | homeLiving.personalCare@general | homeLiving.safety@general | medical.equipment@special-needs":
    "a care task, or a note on equipment, personal care, or safety",
};

// Reachable only if the completeness test is red; never shows on a green build.
const FALLBACK_PHRASE = "a little more detail";

/* ------------------------------------------------------------------- status */

/**
 * Phrases for the card's unmet needs, {name} still unfilled. Empty = all met.
 * needMet is derive.ts's own per-need gate — the same check requirementsMet
 * ANDs — so the phrasing can never disagree with whether the card renders.
 */
export function needsMissing(data: LetterData, path: LetterPath, key: CardKey): string[] {
  return RENDER_REQUIREMENTS[key]
    .filter((need) => !needMet(data, path, need))
    .map((need) => MISSING_COPY[needKey(need)] ?? FALLBACK_PHRASE);
}

export interface CardStatus {
  key: CardKey;
  title: string;
  ready: boolean;
  /** One finished sentence, {name} already filled. */
  text: string;
}

/**
 * One line about one card. Ready comes straight from requirementsMet — the
 * same gate deriveCard uses — so this can never promise a card the share
 * screen would refuse. Not-ready is a plain statement of what would complete
 * it, never an error: the cards are a bonus, not homework.
 */
export function cardStatus(data: LetterData, path: LetterPath, key: CardKey): CardStatus {
  const title = cardTitle(key);
  if (requirementsMet(data, path, key)) {
    return { key, title, ready: true, text: `The ${title} card has what it needs.` };
  }
  // Non-empty whenever requirementsMet is false: both run the same needMet.
  const phrases = needsMissing(data, path, key);
  return {
    key,
    title,
    ready: false,
    text: fillName(`The ${title} card needs ${listJoin(phrases)}.`, displayName(data)),
  };
}

/** Statuses for every card this section feeds, in CARD_KEYS order. */
export function sectionCardStatuses(
  data: LetterData,
  path: LetterPath,
  section: SectionKey
): CardStatus[] {
  return cardsForSection(path, section).map((key) => cardStatus(data, path, key));
}
