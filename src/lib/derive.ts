import { sectionDefs } from "@/lib/content/sections";
import type { FieldDef, SectionDef } from "@/lib/content/types";
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

/* ------------------------------------------------------------ content checks */

function isFilledString(v: unknown): boolean {
  return typeof v === "string" && v.trim() !== "";
}

/** True if a repeater item holds anything beyond its generated id. */
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

export function startedSectionKeys(data: LetterData): SectionKey[] {
  return sectionDefs.filter((d) => sectionHasContent(data, d)).map((d) => d.key);
}

export function startedCount(data: LetterData): number {
  return startedSectionKeys(data).length;
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
 * "" (controlled from the start) and every repeater becomes an array.
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
      values[field.id] = arr.map((raw) => {
        const item = (raw ?? {}) as Record<string, unknown>;
        const out: Record<string, unknown> = {
          id: typeof item.id === "string" && item.id ? item.id : newItemId(),
        };
        for (const itemField of field.itemFields) {
          out[itemField.id] =
            itemField.kind === "checkbox"
              ? item[itemField.id] === true
              : typeof item[itemField.id] === "string"
                ? item[itemField.id]
                : "";
        }
        return out;
      });
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
  for (const f of field.itemFields) item[f.id] = f.kind === "checkbox" ? false : "";
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

/** Pulls the emergency one-pager's content out of the full letter. */
export function emergencyInfo(data: LetterData): EmergencyInfo {
  const contacts = (data.familySupport?.contacts ?? []).filter(
    (c) => c.emergency === true && itemHasContent(c as Record<string, unknown>)
  );
  const medications = (data.medical?.medications ?? []).filter((m) =>
    itemHasContent(m as Record<string, unknown>)
  );
  return {
    fullName: trimmed(data.gettingStarted?.subjectFullName),
    preferred: preferredName(data),
    dateOfBirth: trimmed(data.about?.dateOfBirth),
    diagnoses: trimmed(data.about?.diagnoses),
    communication: trimmed(data.communication?.how),
    yesNo: trimmed(data.communication?.yesNo),
    pain: trimmed(data.communication?.pain),
    allergies: trimmed(data.medical?.allergies),
    medications,
    protocol: trimmed(data.medical?.emergencyProtocol),
    triggers: trimmed(data.behavior?.triggers),
    deEscalation: trimmed(data.behavior?.deEscalation),
    makesWorse: trimmed(data.behavior?.makesWorse),
    contacts,
    firstCall: trimmed(data.familySupport?.firstCall),
    insurance: trimmed(data.medical?.insurance),
    hospital: trimmed(data.medical?.preferredHospital),
    updatedIso: letterDateIso(data),
  };
}

export function emergencyHasContent(info: EmergencyInfo): boolean {
  return Boolean(
    info.diagnoses ||
      info.allergies ||
      info.medications.length > 0 ||
      info.protocol ||
      info.triggers ||
      info.deEscalation ||
      info.communication ||
      info.contacts.length > 0 ||
      info.firstCall
  );
}
