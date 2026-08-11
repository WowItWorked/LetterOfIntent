import type { FieldDef, RepeaterItemField, SectionDef } from "@/lib/content/types";
import type { Contact, LetterData, Medication, SectionKey } from "@/lib/schema";

/* ------------------------------------------------------------------ naming */

/** The name we call the person in UI copy and the letter body, if known. */
export function preferredName(data: LetterData): string | undefined {
  const gs = data.gettingStarted;
  const pref = gs?.subjectPreferredName?.trim();
  if (pref) return pref;
  const full = gs?.subjectFullName?.trim();
  if (full) return full.split(/\s+/)[0];
  return undefined;
}

/** Name with a warm fallback, for copy addressed to the writer. */
export function displayName(data: LetterData): string {
  return preferredName(data) ?? "your loved one";
}

/** Name with a neutral fallback, for text addressed to a future reader. */
export function readerName(data: LetterData): string {
  return preferredName(data) ?? "this person";
}

/** Replaces {name} tokens in content strings. */
export function fillName(text: string, name: string): string {
  return text.split("{name}").join(name);
}

/* ------------------------------------------------------------------- marks */

/** The family's marker for a field ("not_applicable" | "come_back" | "combined"). */
export function fieldMark(
  data: LetterData,
  section: SectionKey,
  fieldId: string
): string | undefined {
  return data.marks?.[`${section}.${fieldId}`] ?? data.marks?.[section];
}

/** True when the family said this question does not apply to them. Outputs
 *  skip such fields entirely; the reading view never calls them gaps. */
export function isNotApplicable(
  data: LetterData,
  section: SectionKey,
  fieldId: string
): boolean {
  return fieldMark(data, section, fieldId) === "not_applicable";
}

/* ------------------------------------------------------------ content checks */

function isFilledString(v: unknown): boolean {
  return typeof v === "string" && v.trim() !== "";
}

/**
 * True if a repeater item holds anything beyond its generated id. Deliberately
 * text-only: every record's identifying field (a contact's name, a medication's
 * name, an allergen) is a text field, so a record holding nothing but ticked
 * boxes or schedule tokens has nothing any output could render — counting it
 * would put blank rows on the emergency sheet.
 */
export function itemHasContent(item: Record<string, unknown>): boolean {
  return Object.entries(item).some(([k, v]) => k !== "id" && isFilledString(v));
}

export function fieldHasContent(
  sectionValues: Record<string, unknown> | undefined,
  field: FieldDef
): boolean {
  if (!sectionValues) return false;
  const v = sectionValues[field.id];
  if (field.kind === "repeater") {
    return (
      Array.isArray(v) && v.some((item) => itemHasContent(item as Record<string, unknown>))
    );
  }
  return isFilledString(v);
}

export function sectionHasContent(data: LetterData, def: SectionDef): boolean {
  const values = data[def.key] as Record<string, unknown> | undefined;
  return def.fields.some((f) => fieldHasContent(values, f));
}

/* ---------------------------------------------------------------- dates */

/** "2026-08-06" → "August 6, 2026". Non-ISO input is returned unchanged. */
export function formatDateLong(value: string | undefined): string | undefined {
  if (!value) return undefined;
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(value.trim());
  if (!m) return value;
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];
  const month = months[Number(m[2]) - 1];
  if (!month) return value;
  return `${month} ${Number(m[3])}, ${Number(m[1])}`;
}

/**
 * One repeater-item value as display text, for the review page and the PDF.
 * Select and multiselect values render through the field's own option labels
 * ("life-threatening" → "Life-threatening"); tokens the field doesn't know —
 * a typed clock time, a value from a newer backup — pass through verbatim,
 * and arrays join with a spaced separator instead of String()'s bare comma.
 */
export function formatItemValue(field: RepeaterItemField, value: unknown): string {
  const label = (token: string) =>
    "options" in field
      ? (field.options.find((o) => o.value === token)?.label ?? token)
      : token;
  if (Array.isArray(value)) {
    return value
      .map((v) => label(String(v).trim()))
      .filter(Boolean)
      .join(" · ");
  }
  return label(String(value ?? "").trim());
}

export function todayIso(): string {
  const d = new Date();
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

/** The letter's "last updated" date: what the family entered, else today. */
export function letterDateIso(data: LetterData): string {
  const v = data.gettingStarted?.letterDate?.trim();
  return v || todayIso();
}

/* ------------------------------------------------------------ form defaults */

/**
 * Builds react-hook-form default values for one section: every scalar becomes
 * "" (controlled from the start), every checkbox a boolean, every multiselect
 * a string[] — RHF checkboxes go uncontrolled if a default is missing — and
 * every repeater becomes an array.
 *
 * A repeater never starts empty: an empty stored array is seeded with one
 * blank record, so the first thing a tired person sees is a form to fill, not
 * an "Add" button to find. This is safe because a blank record autosaves as
 * id-only (plus empty strings/arrays/false), and itemHasContent() — which
 * counts only filled strings — filters id-only records out of everything
 * downstream: sectionHasContent/started counts, emergencyInfo, the review
 * screen, and the PDF (loi-document.tsx) all run items through it.
 */
export function defaultValuesForSection(
  def: SectionDef,
  data: LetterData
): Record<string, unknown> {
  const stored = (data[def.key] ?? {}) as Record<string, unknown>;
  const values: Record<string, unknown> = {};
  for (const field of def.fields) {
    if (field.kind === "repeater") {
      const arr = Array.isArray(stored[field.id]) ? (stored[field.id] as unknown[]) : [];
      const items = arr.map((raw) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        const out: Record<string, unknown> = {
          id: typeof item.id === "string" && item.id ? item.id : newItemId(),
        };
        for (const itemField of field.itemFields) {
          const v = item[itemField.id];
          out[itemField.id] =
            itemField.kind === "checkbox"
              ? v === true
              : itemField.kind === "multiselect"
                ? Array.isArray(v)
                  ? v.filter((t): t is string => typeof t === "string")
                  : []
                : typeof v === "string"
                  ? v
                  : "";
        }
        return out;
      });
      values[field.id] = items.length > 0 ? items : [emptyRepeaterItem(field)];
    } else {
      values[field.id] = typeof stored[field.id] === "string" ? stored[field.id] : "";
    }
  }
  return values;
}

export function newItemId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `item-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

export function emptyRepeaterItem(field: Extract<FieldDef, { kind: "repeater" }>) {
  const item: Record<string, unknown> = { id: newItemId() };
  for (const f of field.itemFields) {
    item[f.id] = f.kind === "checkbox" ? false : f.kind === "multiselect" ? [] : "";
  }
  return item;
}

/* ------------------------------------------------------------ emergency sheet */

export interface EmergencyInfo {
  fullName?: string;
  preferred?: string;
  dateOfBirth?: string;
  diagnoses?: string;
  communication?: string;
  yesNo?: string;
  pain?: string;
  allergies?: string;
  medications: Medication[];
  protocol?: string;
  triggers?: string;
  deEscalation?: string;
  makesWorse?: string;
  contacts: Contact[];
  firstCall?: string;
  insurance?: string;
  hospital?: string;
  updatedIso: string;
}

const trimmed = (v: string | undefined) => {
  const t = v?.trim();
  return t ? t : undefined;
};

/**
 * Pulls the emergency one-pager's content out of the letter. ONE canonical
 * source per heading — no path conditionals, and every mapping is a row in
 * docs/output-matrix.md. Three of these lines are the fix for shipped
 * defects, each pinned by a regression test:
 *
 *   protocol   ← emergencyPlan.responseSteps, else health.emergencyProtocol.
 *                NEVER health.appointmentHelp.
 *   insurance  ← health.insurancePlans. NEVER health.recordsLocation.
 *   triggers   ← behavior.triggers, whenever it has content. Never hardcoded
 *                absent.
 *
 * A field the family marked not-applicable prints nothing (no empty heading).
 */
export function emergencyInfo(data: LetterData): EmergencyInfo {
  const na = (section: SectionKey, field: string) => isNotApplicable(data, section, field);
  const take = (section: SectionKey, field: string, v: string | undefined) =>
    na(section, field) ? undefined : trimmed(v);

  const contacts = (data.familySupport?.contacts ?? []).filter(
    (c) => c.emergency === true && itemHasContent(c as Record<string, unknown>)
  );
  const medications = na("health", "medications")
    ? []
    : (data.health?.medications ?? []).filter((m) =>
        itemHasContent(m as Record<string, unknown>)
      );

  return {
    fullName: take("gettingStarted", "subjectFullName", data.gettingStarted?.subjectFullName),
    preferred: preferredName(data),
    dateOfBirth: take("person", "dateOfBirth", data.person?.dateOfBirth),
    diagnoses: take("health", "conditions", data.health?.conditions),
    communication:
      take("communication", "how", data.communication?.how) ??
      take("communication", "howToSpeak", data.communication?.howToSpeak),
    yesNo:
      take("communication", "yesNo", data.communication?.yesNo) ??
      take("communication", "hearingVisionMemory", data.communication?.hearingVisionMemory),
    pain:
      take("communication", "pain", data.communication?.pain) ??
      take("communication", "wontAdmit", data.communication?.wontAdmit),
    allergies: take("health", "allergies", data.health?.allergies),
    medications,
    protocol:
      take("emergencyPlan", "responseSteps", data.emergencyPlan?.responseSteps) ??
      take("health", "emergencyProtocol", data.health?.emergencyProtocol),
    triggers: take("behavior", "triggers", data.behavior?.triggers),
    deEscalation:
      take("behavior", "deEscalation", data.behavior?.deEscalation) ??
      take("communication", "whatHelps", data.communication?.whatHelps),
    makesWorse:
      take("behavior", "makesWorse", data.behavior?.makesWorse) ??
      take("communication", "whatToAvoid", data.communication?.whatToAvoid),
    contacts,
    firstCall: take("familySupport", "firstCall", data.familySupport?.firstCall),
    insurance: take("health", "insurancePlans", data.health?.insurancePlans),
    hospital: take("health", "preferredHospital", data.health?.preferredHospital),
    updatedIso: letterDateIso(data),
  };
}

/* --------------------------------------------------- key points at a glance */

export interface KeyPoint {
  title: string;
  /** Which section this came from, cited so a reader can go deeper. */
  source: string;
  text: string;
  /** True for "what makes it worse" — printed inside a danger border. */
  warning?: boolean;
}

export interface KeyPoints {
  callOrder: string[];
  points: KeyPoint[];
  /** The caregiver's "never change this" ask (caregiverGuidance.neverChange). */
  neverChange?: string;
  /**
   * Housing red lines (home.hardLimits). A separate box from neverChange on
   * purpose: the old code piped both questions into one slot, which was a
   * bug, not a merge — they are different questions with different readers.
   */
  hardLimits?: string;
}

/**
 * A page called "at a glance" that runs to two pages is not one. These caps
 * keep it to a single sheet however much a family has written: five boxes of
 * roughly two lines each, plus the call band, is what fits.
 *
 * Nothing is lost — every box names the section it came from, and the page
 * says in as many words that it is a summary.
 */
export const MAX_KEY_POINT_CHARS = 150;
export const MAX_CALL_ORDER = 3;

/** Clamps an optional field to key-point length, preserving "absent". */
function clampKeyPoint(v: string | undefined): string | undefined {
  const t = trimmed(v);
  return t ? clampToWord(t, MAX_KEY_POINT_CHARS) : undefined;
}

/**
 * Trims to the last whole word inside `max`, and marks the cut. Falls back to
 * a hard cut only when there is no word boundary to use at all — a single
 * unbroken string longer than the budget.
 */
export function clampToWord(text: string, max: number): string {
  const flat = text.replace(/\s*\n+\s*/g, " ").trim();
  if (flat.length <= max) return flat;
  const cut = flat.slice(0, max);
  const lastSpace = cut.lastIndexOf(" ");
  const kept = lastSpace > 0 ? cut.slice(0, lastSpace) : cut;
  return `${kept.replace(/[.,;:—-]+$/, "")}…`;
}

/**
 * Page four of the letter: the handful of things a reader needs in the first
 * five minutes, lifted from sections they would otherwise have to hunt for.
 * Every point cites its source section so nothing here is a second source of
 * truth. Canonical sources only — the letter's configuration decides what has
 * content, never which mapping applies.
 */
export function keyPoints(data: LetterData): KeyPoints {
  const callOrder: string[] = [];
  const first = trimmed(data.familySupport?.firstCall);
  if (first) callOrder.push(first);
  for (const c of data.familySupport?.contacts ?? []) {
    if (c.emergency !== true) continue;
    const nm = trimmed(c.name);
    if (!nm) continue;
    const rel = trimmed(c.relationship);
    const phone = trimmed(c.phone);
    callOrder.push([nm, rel, phone].filter(Boolean).join(" · "));
  }
  callOrder.splice(MAX_CALL_ORDER);

  const points: KeyPoint[] = [];
  const add = (title: string, source: string, text?: string, warning?: boolean) => {
    if (text) points.push({ title, source, text: clampToWord(text, MAX_KEY_POINT_CHARS), warning });
  };

  add(
    "How to talk with them",
    "Communication",
    trimmed(data.communication?.how) ?? trimmed(data.communication?.howToSpeak)
  );
  add(
    "Medical facts that cannot wait",
    "Health & medical",
    [
      trimmed(data.health?.allergies),
      trimmed(data.health?.emergencyProtocol) ?? trimmed(data.health?.conditions),
    ]
      .filter(Boolean)
      .join("\n\n") || undefined
  );
  add(
    "What helps",
    "Behavior & communication",
    trimmed(data.behavior?.deEscalation) ?? trimmed(data.communication?.whatHelps)
  );
  add(
    "What makes it worse",
    "Behavior & communication",
    trimmed(data.behavior?.makesWorse) ?? trimmed(data.communication?.whatToAvoid),
    true
  );

  return {
    callOrder,
    points,
    neverChange: clampKeyPoint(data.caregiverGuidance?.neverChange),
    hardLimits: clampKeyPoint(data.home?.hardLimits),
  };
}

export function keyPointsHaveContent(k: KeyPoints): boolean {
  return (
    k.points.length > 0 ||
    k.callOrder.length > 0 ||
    Boolean(k.neverChange) ||
    Boolean(k.hardLimits)
  );
}
