import {
  ALLERGY_SEVERITY_ORDER,
  CARD_CONSTRAINTS,
  CARD_DEFS,
  FOOTER_META_TEMPLATE,
  PRIORITY_ORDER,
  RENDER_REQUIREMENTS,
  ROUTINE_TIME_OF_DAY_ORDER,
  SOURCES,
  type CardKey,
  type CardSource,
  type RecordFilter,
  type SourceRef,
} from "@/lib/content/cards";
import {
  fillName,
  formatDateLong,
  itemHasContent,
  letterDateIso,
  preferredName,
  readerName,
  todayIso,
} from "@/lib/derive";
import type {
  AllergyRecord,
  CareTaskRecord,
  Contact,
  EmergencyScenario,
  FoodRecord,
  LetterData,
  LetterPath,
  Medication,
  Provider,
  RoutineRecord,
} from "@/lib/schema";
import type { CardBlock, CardData, CardLine, CardPerson } from "@/lib/cards/types";

/**
 * Turns a letter into renderable CardData, one card at a time.
 *
 * Everything configurable lives in content/cards.ts (which sections feed which
 * card, sort orders, render requirements); this file is the machinery that
 * reads that config against a LetterData. It emits FULL blocks — no clamping,
 * no pagination. Overflow is Phase F's job, and it trims from the bottom of
 * each card's PRIORITY_ORDER, which is exactly the order blocks are emitted in
 * here.
 */

/* ---------------------------------------------------------------- config */

/**
 * Which blocks draw the flagged panel (tint + topic-color bar), keyed by the
 * block tokens the builders stamp on what they emit. A config table rather
 * than label matching, so renaming a label — or translating one — can never
 * silently unflag the allergy block.
 *
 * The choices follow the design export's pattern: the block a stranger must
 * not miss (allergies, when to dial 911) or must not improvise (refusal,
 * transitions, choking, equipment) gets the flag; biography does not.
 */
const CRITICAL_ITEMS: Record<CardKey, readonly string[]> = {
  identity: [],
  emergency: ["allergies_by_severity", "call_911_when"],
  meds: ["refusal_strategy"],
  behavior: ["what_helps"],
  routine: ["transitions"],
  food: ["food_choking_risk"],
  care: ["care_equipment", "home_safety"],
};

/**
 * Contact ordering for the identity card is PRIORITY_ORDER.identity, not a
 * second list: these map its item tokens to the role tokens contacts carry,
 * and the rank of each role is its position there. A contact wearing several
 * hats sorts by its most urgent one.
 */
const ROLE_TOKEN_BY_PRIORITY_ITEM: Readonly<Record<string, string>> = {
  primary_contact: "primary",
  backup_contact: "neighbor_backup",
  medical_decision_contact: "medical_decision",
};

const CONTACT_ROLE_RANK: ReadonlyMap<string, number> = new Map(
  PRIORITY_ORDER.identity.flatMap((item, i) => {
    const role = ROLE_TOKEN_BY_PRIORITY_ITEM[item];
    return role ? [[role, i] as const] : [];
  })
);

/**
 * How a contact's role tokens read on a card line — "Jessie Anderson — aunt,
 * legal guardian · (555) 017-2264". Unknown tokens render verbatim, lowercased:
 * a backup written by a newer version may know a role this map does not, and
 * the person still deserves their line.
 */
const CONTACT_ROLE_PHRASES: Readonly<Record<string, string>> = {
  primary: "first call",
  medical_decision: "medical decisions",
  pickup: "approved for pickup",
  neighbor_backup: "backup",
  legal_guardian: "legal guardian",
};

/**
 * Representative clock minutes for the medication schedule tokens, so a typed
 * time like "14:30" can interleave chronologically — a caregiver reads the
 * meds card top to bottom against the actual clock. Values must ascend in
 * MED_TIME_OF_DAY_ORDER order (derive.test.ts holds them to it).
 */
export const TOKEN_MINUTES: Readonly<Record<string, number>> = {
  morning: 8 * 60,
  noon: 12 * 60,
  evening: 18 * 60,
  bedtime: 21 * 60 + 30,
};

/** Behavior card blocks per path, in PRIORITY_ORDER.behavior's token terms. */
interface BehaviorItemDef {
  item: string;
  field: string;
  label: string;
}

const BEHAVIOR_ITEMS: Record<LetterPath, readonly BehaviorItemDef[]> = {
  "special-needs": [
    { item: "escalates_when", field: "triggers", label: "It goes sideways when" },
    { item: "what_helps", field: "deEscalation", label: "What helps" },
    { item: "how_they_communicate", field: "how", label: "How they communicate" },
    { item: "yes_no_signals", field: "yesNo", label: "Yes and no" },
    { item: "pain_signals", field: "pain", label: "Pain looks like" },
    { item: "what_not_to_say", field: "whatNotToSay", label: "Do not say" },
  ],
  general: [
    { item: "escalates_when", field: "cannotAbide", label: "What they cannot stand" },
    { item: "what_helps", field: "whatHelps", label: "What helps" },
    { item: "how_they_communicate", field: "howToSpeak", label: "How to talk with them" },
    { item: "pain_signals", field: "wontAdmit", label: "What they will not admit" },
    { item: "what_not_to_say", field: "whatToAvoid", label: "What to avoid" },
  ],
};

/** Food groups in emission order: the dangerous block is pinned to the top. */
const FOOD_GROUPS: ReadonlyArray<{ type: string; itemKey: string; label: string }> = [
  { type: "choking_risk", itemKey: "food_choking_risk", label: "Choking risk" },
  { type: "always_works", itemKey: "food_always_works", label: "Always works" },
  { type: "will_not_eat", itemKey: "food_will_not_eat", label: "Will not eat" },
  { type: "texture", itemKey: "food_texture", label: "Texture" },
  { type: "support", itemKey: "food_support", label: "Help at meals" },
];

/** Care-task category labels; unknown categories render their token verbatim. */
const CARE_LABELS: Readonly<Record<string, string>> = {
  toileting: "Toileting",
  dressing: "Dressing",
  bathing: "Bathing",
  equipment: "Equipment",
  mobility: "Getting around",
};

/* ------------------------------------------------------------- primitives */

type AnyRecord = Record<string, unknown>;

function trimmed(v: string | undefined): string | undefined {
  const t = v?.trim();
  return t ? t : undefined;
}

function cap(s: string): string {
  return s.charAt(0).toUpperCase() + s.slice(1);
}

/**
 * Joins fragments into one readable value: each fragment becomes a sentence,
 * fragments after the first are capitalized, existing !?… endings are kept.
 * Family text goes in verbatim otherwise — this never rewrites words.
 */
function sentenceJoin(...parts: Array<string | undefined>): string {
  const kept = parts.map((p) => p?.trim()).filter((p): p is string => Boolean(p));
  return kept
    .map((p, i) => {
      const t = p.replace(/[.\s]+$/, "");
      const ended = /[.!?…]$/.test(t) ? t : `${t}.`;
      return i === 0 ? ended : cap(ended);
    })
    .join(" ");
}

/** One CardLine per non-empty line of a multiline answer. */
function paragraphLines(text: string | undefined): CardLine[] {
  if (!text) return [];
  return text
    .split(/\r?\n+/)
    .map((s) => s.trim())
    .filter(Boolean)
    .map((v) => ({ v }));
}

/**
 * Numbered steps from a multiline answer. We supply the numbers, and strip a
 * family-typed "1." / "2)" prefix first so no card ever reads "1 · 1. Call".
 */
function numberedLines(text: string | undefined): CardLine[] {
  return paragraphLines(text).map((line, i) => ({
    k: `${i + 1} · `,
    v: line.v.replace(/^\d+\s*[·.):—-]\s*/, ""),
  }));
}

/**
 * Age in whole years as of an ISO date. Missing, malformed, or future DOBs
 * yield undefined — a card header can omit the age, but "NaN" on a card
 * handed to a paramedic would poison trust in everything else on it.
 */
export function ageFrom(dobIso: string | undefined, onDateIso: string): number | undefined {
  const ISO = /^(\d{4})-(\d{2})-(\d{2})$/;
  const dob = dobIso ? ISO.exec(dobIso.trim()) : null;
  const on = ISO.exec(onDateIso.trim());
  if (!dob || !on) return undefined;
  const [dy, dm, dd] = [Number(dob[1]), Number(dob[2]), Number(dob[3])];
  const [oy, om, od] = [Number(on[1]), Number(on[2]), Number(on[3])];
  if (dm < 1 || dm > 12 || dd < 1 || dd > 31) return undefined;
  const beforeBirthday = om < dm || (om === dm && od < dd);
  const age = oy - dy - (beforeBirthday ? 1 : 0);
  return age >= 0 ? age : undefined;
}

/* ------------------------------------------------- config-driven accessors */

function findSource(key: CardKey, path: LetterPath, field: string): CardSource | undefined {
  return SOURCES[key][path].find((s) => s.field === field);
}

function rawSectionValue(data: LetterData, section: keyof LetterData, field: string): unknown {
  return (data[section] as AnyRecord | undefined)?.[field];
}

/** Records that actually go on cards: non-empty and not held back by the family. */
function liveRecords(raw: unknown): AnyRecord[] {
  if (!Array.isArray(raw)) return [];
  return raw.filter(
    (r): r is AnyRecord =>
      Boolean(r) &&
      typeof r === "object" &&
      itemHasContent(r as AnyRecord) &&
      (r as AnyRecord).keepOffCards !== true
  );
}

/**
 * The legacy `emergency` boolean predates roles and means "this is the
 * primary/emergency person" — it counts exactly like the primary role, so a
 * letter written before roles existed still puts its people on the cards.
 */
function isEmergencyContact(r: AnyRecord): boolean {
  const roles = Array.isArray(r.roles) ? (r.roles as unknown[]) : [];
  return roles.includes("primary") || roles.includes("medical_decision") || r.emergency === true;
}

function contactRoleRank(r: AnyRecord): number {
  const roles = Array.isArray(r.roles) ? (r.roles as unknown[]) : [];
  let rank = PRIORITY_ORDER.identity.length;
  for (const role of roles) {
    if (typeof role !== "string") continue;
    const i = CONTACT_ROLE_RANK.get(role);
    if (i !== undefined && i < rank) rank = i;
  }
  if (r.emergency === true) {
    const primary = CONTACT_ROLE_RANK.get("primary");
    if (primary !== undefined && primary < rank) rank = primary;
  }
  return rank;
}

function applyRecordFilter(records: AnyRecord[], filter?: RecordFilter): AnyRecord[] {
  if (filter === "rescueOnly") return records.filter((r) => r.isRescue === true);
  if (filter === "emergencyOnly") return records.filter(isEmergencyContact);
  if (filter === "byRole") {
    // Explicit index tiebreak: within a role, the family's entry order stands.
    return records
      .map((r, i) => ({ r, i }))
      .sort((a, b) => contactRoleRank(a.r) - contactRoleRank(b.r) || a.i - b.i)
      .map((x) => x.r);
  }
  return records;
}

function resolveRecords(data: LetterData, src: CardSource): AnyRecord[] {
  return applyRecordFilter(liveRecords(rawSectionValue(data, src.section, src.field)), src.recordFilter);
}

/**
 * Field values resolved THROUGH the card's source list, so the section a
 * field lives in — different per path for most cards — is stated once, in
 * content/cards.ts, and derive can never disagree with it.
 */
function srcScalar(data: LetterData, key: CardKey, path: LetterPath, field: string): string | undefined {
  const src = findSource(key, path, field);
  if (!src || src.kind !== "scalar") return undefined;
  const v = rawSectionValue(data, src.section, src.field);
  return typeof v === "string" ? trimmed(v) : undefined;
}

function srcRecords<T>(data: LetterData, key: CardKey, path: LetterPath, field: string): T[] {
  const src = findSource(key, path, field);
  if (!src || src.kind !== "records") return [];
  // The zod schema guarantees these shapes; the cast narrows what liveRecords
  // had to treat as unknown.
  return resolveRecords(data, src) as unknown as T[];
}

/** True when every record source on the card is empty — the legacy blob's gate. */
function recordSourcesEmpty(data: LetterData, key: CardKey, path: LetterPath): boolean {
  return SOURCES[key][path]
    .filter((s) => s.kind === "records")
    .every((s) => resolveRecords(data, s).length === 0);
}

/* ------------------------------------------------------ render requirements */

function refHasContent(data: LetterData, path: LetterPath, ref: SourceRef): boolean {
  if (ref.path && ref.path !== path) return false;
  const v = rawSectionValue(data, ref.section, ref.field);
  if (Array.isArray(v)) return applyRecordFilter(liveRecords(v), ref.recordFilter).length > 0;
  return typeof v === "string" && v.trim() !== "";
}

/**
 * One need is met when any of its refs holds content. Exported so status.ts
 * can phrase WHICH need a card is missing with the same check that gates
 * rendering — a second implementation could drift into mislabeling a card.
 */
export function needMet(
  data: LetterData,
  path: LetterPath,
  need: { anyOf: readonly SourceRef[] }
): boolean {
  return need.anyOf.some((ref) => refHasContent(data, path, ref));
}

/**
 * A card renders only when every need is met. Failing this returns null from
 * deriveCard — a card that is only a header is worse than no card, because
 * someone might trust it.
 */
export function requirementsMet(data: LetterData, path: LetterPath, key: CardKey): boolean {
  return RENDER_REQUIREMENTS[key].every((need) => needMet(data, path, need));
}

/* ------------------------------------------------------------ block helpers */

/** Builds a block, stamping tone from CRITICAL_ITEMS; null when it has no lines. */
function makeBlock(key: CardKey, itemKey: string, label: string, lines: CardLine[]): CardBlock | null {
  if (lines.length === 0) return null;
  if (CRITICAL_ITEMS[key].includes(itemKey)) return { label, tone: "critical", lines };
  return { label, lines };
}

function pushBlock(blocks: CardBlock[], block: CardBlock | null): void {
  if (block) blocks.push(block);
}

/**
 * At most two flagged blocks per card, or the emphasis stops meaning anything.
 * Blocks arrive in priority order, so the demotion falls on the lowest-priority
 * critical: it keeps its content and loses only the panel.
 */
export function enforceCriticalCap(
  blocks: CardBlock[],
  max: number = CARD_CONSTRAINTS.maxCriticalBlocksPerCard
): CardBlock[] {
  let seen = 0;
  return blocks.map((b) => {
    if (b.tone !== "critical") return b;
    seen += 1;
    return seen <= max ? b : { label: b.label, lines: b.lines };
  });
}

/* ------------------------------------------------------------ line builders */

/**
 * "aunt, legal guardian" — the words after the relationship saying what this
 * person IS to the reader. Role tokens translate through CONTACT_ROLE_PHRASES;
 * when the family checked no roles, their free-text description of what the
 * person helps with stands in.
 */
function contactRoleWords(c: Contact): string | undefined {
  const tokens = (c.roles ?? []).map((t) => t.trim()).filter(Boolean);
  if (tokens.length === 0) {
    // The free-text role stands in only when it reads like a role WORD
    // ("backup", "legal guardian") — not a description. A sentence poured
    // into the compact contact line wraps it two or three deep and can push
    // the emergency card past its single-page budget, which blocks the
    // family's download. Long or clause-bearing text stays in the letter.
    const free = trimmed(c.role);
    return free && free.length <= 28 && !/[;.]/.test(free) ? free : undefined;
  }
  return tokens
    .map((t) => CONTACT_ROLE_PHRASES[t.toLowerCase()] ?? t.toLowerCase())
    .join(", ");
}

function contactLine(c: Contact): CardLine {
  const name = trimmed(c.name);
  const who = [trimmed(c.relationship), contactRoleWords(c)].filter(Boolean).join(", ");
  const v = [who || undefined, trimmed(c.phone), trimmed(c.altPhone)]
    .filter(Boolean)
    .join(" · ");
  return name ? { k: `${name} — `, v } : { v };
}

function providerLine(p: Provider): CardLine {
  const name = trimmed(p.name);
  const v = [trimmed(p.specialty), trimmed(p.practice), trimmed(p.phone)]
    .filter(Boolean)
    .join(" · ");
  return name ? { k: `${name} — `, v } : { v };
}

function allergyLine(a: AllergyRecord): CardLine {
  const allergen = trimmed(a.allergen);
  const v = sentenceJoin(a.reaction, a.treatment);
  return allergen ? { k: `${allergen} — `, v } : { v };
}

function allergyRank(a: AllergyRecord): number {
  const s = trimmed(a.severity)?.toLowerCase();
  const i = s ? (ALLERGY_SEVERITY_ORDER as readonly string[]).indexOf(s) : -1;
  // Unknown severities sort after "mild" in entry order — never dropped. The
  // family may know something the token list does not.
  return i === -1 ? ALLERGY_SEVERITY_ORDER.length : i;
}

function sortAllergies(items: AllergyRecord[]): AllergyRecord[] {
  return items
    .map((r, i) => ({ r, i }))
    .sort((a, b) => allergyRank(a.r) - allergyRank(b.r) || a.i - b.i)
    .map((x) => x.r);
}

function scheduleEntryMinutes(entry: string): number | undefined {
  const t = entry.trim().toLowerCase();
  if (t in TOKEN_MINUTES) return TOKEN_MINUTES[t];
  const m = /^(\d{1,2}):(\d{2})$/.exec(t);
  if (!m) return undefined;
  const h = Number(m[1]);
  const min = Number(m[2]);
  return h < 24 && min < 60 ? h * 60 + min : undefined;
}

function medMinutes(m: Medication): number {
  const known = (m.schedule ?? [])
    .map(scheduleEntryMinutes)
    .filter((n): n is number => n !== undefined);
  return known.length ? Math.min(...known) : Number.POSITIVE_INFINITY;
}

function sortByTimeOfDay(meds: Medication[]): Medication[] {
  // Unknown tokens keep the family's entry order at the end (index tiebreak).
  return meds
    .map((r, i) => ({ r, i }))
    .sort((a, b) => medMinutes(a.r) - medMinutes(b.r) || a.i - b.i)
    .map((x) => x.r);
}

function medKey(m: Medication): string | undefined {
  const name = trimmed(m.name);
  const dose = trimmed(m.dose);
  const unit = trimmed(m.unit);
  const doseText = dose ? (unit ? `${dose} ${unit}` : dose) : undefined;
  const parts = [name, doseText].filter(Boolean);
  return parts.length ? `${parts.join(" ")} — ` : undefined;
}

function medLine(m: Medication, v: string): CardLine {
  const k = medKey(m);
  return k ? { k, v } : { v };
}

function scheduleClause(m: Medication): string | undefined {
  const entries = (m.schedule ?? []).map((t) => t.trim()).filter(Boolean);
  // Known tokens and typed times render verbatim; only "prn" gets translated,
  // because "as needed" is the phrase a lay sitter actually knows.
  const words = entries.map((t) => (t.toLowerCase() === "prn" ? "as needed" : t));
  const clause = words.join(", ");
  if (!clause) return m.withFood === true ? "with food" : undefined;
  return m.withFood === true ? `${clause}, with food` : clause;
}

/** True for a med taken only in response to something, never on the clock. */
function isPrnMed(m: Medication): boolean {
  const entries = (m.schedule ?? []).map((t) => t.trim()).filter(Boolean);
  const onClock = entries.some((t) => t.toLowerCase() !== "prn");
  if (onClock) return false;
  return entries.length > 0 || trimmed(m.prnTrigger) !== undefined;
}

function rescueMedLine(m: Medication): CardLine {
  // Location leads: in the moment this line exists for, "where is it" is the
  // whole question.
  const v = sentenceJoin(m.location, m.purpose) || sentenceJoin(m.prnTrigger);
  return medLine(m, v);
}

/* ------------------------------------------------------------ card builders */

interface BuiltBody {
  person?: CardPerson;
  blocks: CardBlock[];
}

function buildIdentity(data: LetterData, path: LetterPath): BuiltBody {
  const full = trimmed(data.gettingStarted?.subjectFullName);
  const pref = trimmed(data.gettingStarted?.subjectPreferredName);
  const dob = srcScalar(data, "identity", path, "dateOfBirth");

  const sub = [
    full && pref && pref !== full ? `Goes by ${pref}` : undefined,
    dob ? `born ${formatDateLong(dob) ?? dob}` : undefined,
  ]
    .filter(Boolean)
    .join(" · ");

  const person: CardPerson = {
    name: full ?? pref ?? readerName(data),
    sub: sub || undefined,
    sub2: srcScalar(data, "identity", path, "subjectAddress"),
  };

  const blocks: CardBlock[] = [];

  const contacts = srcRecords<Contact>(data, "identity", path, "contacts");
  pushBlock(blocks, makeBlock("identity", "primary_contact", "Who to call", contacts.map(contactLine)));

  const providers = srcRecords<Provider>(data, "identity", path, "providers");
  const careLines = providers.map(providerLine);
  const hospital = srcScalar(data, "identity", path, "preferredHospital");
  if (hospital) careLines.push({ k: "Preferred hospital — ", v: hospital });
  pushBlock(blocks, makeBlock("identity", "provider", "Care team", careLines));

  pushBlock(
    blocks,
    makeBlock(
      "identity",
      "if_no_one_answers",
      "If no one answers",
      paragraphLines(srcScalar(data, "identity", path, "ifNoOneAnswers"))
    )
  );

  return { person, blocks };
}

function buildEmergency(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];

  const allergies = sortAllergies(srcRecords<AllergyRecord>(data, "emergency", path, "items"));
  pushBlock(blocks, makeBlock("emergency", "allergies_by_severity", "Allergies", allergies.map(allergyLine)));

  const rescue = srcRecords<Medication>(data, "emergency", path, "medications");
  pushBlock(
    blocks,
    makeBlock("emergency", "rescue_meds_with_location", "Rescue medication", rescue.map(rescueMedLine))
  );

  pushBlock(
    blocks,
    makeBlock(
      "emergency",
      "response_steps",
      "What to do",
      numberedLines(srcScalar(data, "emergency", path, "responseSteps"))
    )
  );

  // Named what-if plans follow the unnamed steps, each labeled by its trigger
  // exactly as the family wrote it ("If she is stung" — the frozen card visual
  // uppercases every block label). Not critical-toned: the flags stay on
  // allergies and the 911 line.
  const scenarios = srcRecords<EmergencyScenario>(data, "emergency", path, "scenarios");
  for (const sc of scenarios) {
    pushBlock(
      blocks,
      makeBlock("emergency", "scenario", trimmed(sc.trigger) ?? "What to do", numberedLines(sc.steps))
    );
  }

  const call911 = srcScalar(data, "emergency", path, "call911When");
  const otherwise = srcScalar(data, "emergency", path, "otherwiseCall");
  const callText = sentenceJoin(call911, otherwise ? `otherwise, call ${otherwise}` : undefined);
  pushBlock(
    blocks,
    makeBlock("emergency", "call_911_when", "Call 911", callText ? [{ v: callText }] : [])
  );

  const contacts = srcRecords<Contact>(data, "emergency", path, "contacts");
  pushBlock(blocks, makeBlock("emergency", "rest", "Then call", contacts.map(contactLine)));

  pushBlock(
    blocks,
    makeBlock(
      "emergency",
      "rest",
      "If no one answers",
      paragraphLines(srcScalar(data, "emergency", path, "ifNoOneAnswers"))
    )
  );

  return { blocks };
}

function buildMeds(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];
  const meds = srcRecords<Medication>(data, "meds", path, "medications");

  // A rescue med entered once shows up here AND on the emergency card — the
  // family never types it twice, and the two cards can never disagree.
  const rescue = meds.filter((m) => m.isRescue === true);
  pushBlock(blocks, makeBlock("meds", "rescue_first", "Rescue medication", rescue.map(rescueMedLine)));

  const rest = meds.filter((m) => m.isRescue !== true);
  const scheduled = sortByTimeOfDay(rest.filter((m) => !isPrnMed(m)));
  pushBlock(
    blocks,
    makeBlock(
      "meds",
      "scheduled_by_time_of_day",
      "On a schedule",
      scheduled.map((m) => medLine(m, sentenceJoin(scheduleClause(m), m.purpose)))
    )
  );

  const prn = rest.filter(isPrnMed);
  pushBlock(
    blocks,
    makeBlock(
      "meds",
      "prn",
      "As needed",
      prn.map((m) => {
        const max = trimmed(m.prnMaxPerDay);
        const lead = trimmed(m.prnTrigger) ?? trimmed(m.purpose);
        return medLine(m, sentenceJoin(lead, max ? `no more than ${max} in a day` : undefined));
      })
    )
  );

  const refusals = meds.filter((m) => trimmed(m.refusalStrategy));
  pushBlock(
    blocks,
    makeBlock(
      "meds",
      "refusal_strategy",
      "If they say no",
      refusals.map((m) => {
        const name = trimmed(m.name);
        const v = trimmed(m.refusalStrategy) ?? "";
        return name ? { k: `${name} — `, v } : { v };
      })
    )
  );

  // "Nothing else": the family's rule on unapproved over-the-counter medicine.
  pushBlock(
    blocks,
    makeBlock("meds", "otc_policy", "Nothing else", paragraphLines(srcScalar(data, "meds", path, "otcPolicy")))
  );

  return { blocks };
}

function buildBehavior(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];
  // PRIORITY_ORDER decides emission: the reader who only gets one block needs
  // the warning signs before the biography.
  for (const item of PRIORITY_ORDER.behavior) {
    const def = BEHAVIOR_ITEMS[path].find((b) => b.item === item);
    if (!def) continue;
    pushBlock(
      blocks,
      makeBlock("behavior", item, def.label, paragraphLines(srcScalar(data, "behavior", path, def.field)))
    );
  }
  return { blocks };
}

/** A step that opens with its own clock time — "7:00 - Wake", "7.30 Bath". */
const LEADING_CLOCK = /^\d{1,2}[:.]\d{2}/;

function routineItemLines(r: RoutineRecord): CardLine[] {
  const lines = [...paragraphLines(r.steps), ...paragraphLines(r.notes)];
  const time = trimmed(r.time);
  // A first step carrying its own clock time stays verbatim — prefixing the
  // record's time field too would read "7:00 · 7:00 - Wake".
  if (lines.length && time && !LEADING_CLOCK.test(lines[0].v)) {
    lines[0] = { k: `${time} · `, v: lines[0].v };
  }
  return lines;
}

function buildRoutine(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];
  const items = srcRecords<RoutineRecord>(data, "routine", path, "items");

  // Group into day-order blocks; within a group the family's sequence IS the
  // content (PRIORITY_ORDER.routine is "user_order"), so no re-sorting.
  const groups = new Map<string, CardLine[]>();
  const unknownOrder: string[] = [];
  for (const r of items) {
    const token = (trimmed(r.timeOfDay) ?? "").toLowerCase();
    if (!groups.has(token)) {
      groups.set(token, []);
      if (token && !(ROUTINE_TIME_OF_DAY_ORDER as readonly string[]).includes(token)) {
        unknownOrder.push(token);
      }
    }
    groups.get(token)?.push(...routineItemLines(r));
  }
  const order = [
    ...ROUTINE_TIME_OF_DAY_ORDER.filter((t) => groups.has(t)),
    ...unknownOrder,
    ...(groups.has("") ? [""] : []),
  ];
  for (const token of order) {
    const label = token ? cap(token) : "Anytime";
    pushBlock(blocks, makeBlock("routine", `routine_${token || "anytime"}`, label, groups.get(token) ?? []));
  }

  pushBlock(
    blocks,
    makeBlock(
      "routine",
      "transitions",
      "Between activities",
      paragraphLines(srcScalar(data, "routine", path, "transitions"))
    )
  );

  const prose: ReadonlyArray<{ field: string; label: string }> =
    path === "general"
      ? [
          { field: "mornings", label: "Mornings" },
          { field: "evenings", label: "Evenings" },
          { field: "fixedPoints", label: "Fixed points of the week" },
        ]
      : [
          { field: "morningRoutine", label: "Mornings" },
          { field: "eveningRoutine", label: "Evenings" },
          { field: "sleep", label: "Sleep" },
        ];
  for (const p of prose) {
    pushBlock(
      blocks,
      makeBlock("routine", `routine_${p.field}`, p.label, paragraphLines(srcScalar(data, "routine", path, p.field)))
    );
  }

  return { blocks };
}

function foodLine(f: FoodRecord): CardLine {
  const item = trimmed(f.item);
  const v = sentenceJoin(f.reason);
  if (!item) return { v };
  // "Item — reason." with a reason; a bare item is a plain line — a trailing
  // "— " over nothing would read like something got lost.
  return v ? { k: `${item} — `, v } : { v: item };
}

function buildFood(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];
  const items = srcRecords<FoodRecord>(data, "food", path, "items");

  for (const group of FOOD_GROUPS) {
    const inGroup = items.filter((f) => (trimmed(f.type) ?? "").toLowerCase() === group.type);
    pushBlock(blocks, makeBlock("food", group.itemKey, group.label, inGroup.map(foodLine)));
  }
  const known = new Set(FOOD_GROUPS.map((g) => g.type));
  const other = items.filter((f) => !known.has((trimmed(f.type) ?? "").toLowerCase()));
  pushBlock(blocks, makeBlock("food", "food_notes", "Food notes", other.map(foodLine)));

  // The pre-cards prose renders ONLY when there are no structured records:
  // once records exist they win, and nothing auto-parses the family's prose
  // into records behind their back.
  if (recordSourcesEmpty(data, "food", path)) {
    pushBlock(blocks, makeBlock("food", "food_legacy", "Food", paragraphLines(srcScalar(data, "food", path, "food"))));
  }

  return { blocks };
}

function buildCare(data: LetterData, path: LetterPath): BuiltBody {
  const blocks: CardBlock[] = [];
  const items = srcRecords<CareTaskRecord>(data, "care", path, "items");

  // Categories appear in the order the family first used them (user_order).
  const groups = new Map<string, CardLine[]>();
  const order: string[] = [];
  for (const r of items) {
    const c = (trimmed(r.category) ?? "").toLowerCase();
    if (!groups.has(c)) {
      groups.set(c, []);
      order.push(c);
    }
    const lines = groups.get(c);
    lines?.push(...paragraphLines(r.steps));
    const equip = trimmed(r.equipment);
    if (equip) lines?.push({ k: "Equipment — ", v: equip });
  }

  // The medical equipment prose joins the equipment category's block instead
  // of standing beside it — two blocks both named "Equipment" would read as a
  // mistake.
  const equipmentProse = paragraphLines(srcScalar(data, "care", path, "equipment"));
  if (equipmentProse.length) {
    if (groups.has("equipment")) {
      groups.get("equipment")?.push(...equipmentProse);
    } else {
      groups.set("equipment", equipmentProse);
      order.push("equipment");
    }
  }

  for (const c of order) {
    const label = c ? (CARE_LABELS[c] ?? cap(c)) : "Care";
    pushBlock(blocks, makeBlock("care", `care_${c || "general"}`, label, groups.get(c) ?? []));
  }

  pushBlock(
    blocks,
    makeBlock(
      "care",
      "personal_care",
      "Personal care",
      paragraphLines(srcScalar(data, "care", path, "personalCare"))
    )
  );
  pushBlock(
    blocks,
    makeBlock("care", "home_safety", "Around the home", paragraphLines(srcScalar(data, "care", path, "safety")))
  );

  return { blocks };
}

const BUILDERS: Record<CardKey, (data: LetterData, path: LetterPath) => BuiltBody> = {
  identity: buildIdentity,
  emergency: buildEmergency,
  meds: buildMeds,
  behavior: buildBehavior,
  routine: buildRoutine,
  food: buildFood,
  care: buildCare,
};

/* ------------------------------------------------------------------ deriveCard */

/** "Bonnie, 11" — the header eyebrow. Empty when the letter has no name yet. */
function buildPersonLine(data: LetterData, path: LetterPath): string {
  const name = preferredName(data);
  if (!name) return "";
  // The per-path date of birth is registered once, on the identity card's
  // source list — every card's header reads it from there.
  const age = ageFrom(srcScalar(data, "identity", path, "dateOfBirth"), todayIso());
  return age !== undefined ? `${name}, ${age}` : name;
}

function buildFooterMeta(data: LetterData): string {
  const iso = letterDateIso(data);
  // The letter's own date, not the download date: a card says when it was
  // last true.
  return FOOTER_META_TEMPLATE.replace("{Month D, YYYY}", formatDateLong(iso) ?? iso);
}

/**
 * The whole derivation: one card from one letter, or null when the letter
 * does not yet hold enough for this card to be worth trusting.
 */
export function deriveCard(data: LetterData, path: LetterPath, key: CardKey): CardData | null {
  if (!requirementsMet(data, path, key)) return null;

  const def = CARD_DEFS[key];
  const built = BUILDERS[key](data, path);

  return {
    key,
    color: def.color,
    deep: def.deep,
    tint: def.tint,
    t1: def.t1,
    t2: def.t2 || undefined,
    titleSize: def.titleSize,
    spineLabel: [def.t1, def.t2].filter(Boolean).join(" "),
    purpose: fillName(def.purpose, readerName(data)),
    iconPath: def.iconPath,
    personLine: buildPersonLine(data, path),
    footerMeta: buildFooterMeta(data),
    person: built.person,
    blocks: enforceCriticalCap(built.blocks),
  };
}
