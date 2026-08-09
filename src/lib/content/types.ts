import type { SectionKey } from "@/lib/schema";

/** Input kinds rendered by the generic section form. */
export type ScalarKind = "text" | "textarea" | "date" | "email" | "tel";

interface BaseField {
  /** Key inside the section's data object. Must exist in the zod schema. */
  id: string;
  label: string;
  /** Short helper text shown under the label (wired via aria-describedby). */
  help?: string;
  placeholder?: string;
  /** Realistic sample answer, revealed behind a "See an example" disclosure. */
  example?: string;
}

export interface ScalarField extends BaseField {
  kind: ScalarKind;
  /** Rough size hint for textareas. */
  rows?: number;
}

export interface RepeaterItemField {
  id: string;
  label: string;
  kind: "text" | "textarea" | "email" | "tel" | "checkbox";
  placeholder?: string;
  help?: string;
  /** Layout hint: half-width fields pair up on wider screens. */
  width?: "full" | "half";
}

export interface RepeaterField extends BaseField {
  kind: "repeater";
  /** Singular noun for one entry, e.g. "person", "medication". */
  itemNoun: string;
  addLabel: string;
  itemFields: RepeaterItemField[];
}

export type FieldDef = ScalarField | RepeaterField;

export interface SectionDef {
  /** URL segment under /letter/. */
  slug: string;
  /** Data key in LetterData — ties the def to the schema. */
  key: SectionKey;
  /** 1-based position in the default path. */
  number: number;
  /** Full title. May contain {name}, replaced with the person's name. */
  title: string;
  /** Short label for the sidebar. May contain {name}. */
  navTitle: string;
  /** Honest time estimate in minutes. */
  minutes: number;
  /** Warm intro paragraph(s) under the title. {name} supported. */
  intro: string;
  /** Optional extra note rendered as a quiet aside (e.g. why we don't ask for numbers). */
  note?: string;
  /** True → show a gentle interstitial before the form (final wishes). */
  emotional?: boolean;
  /** True → mark as "(optional)" in navigation. */
  optionalTag?: boolean;
  /**
   * True → render the photograph drop targets after the form. Photos live in
   * IndexedDB rather than the letter data, so they are not schema fields.
   */
  photoSlot?: boolean;
  fields: FieldDef[];
}
