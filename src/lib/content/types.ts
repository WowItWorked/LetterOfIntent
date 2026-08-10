import type { LetterPath, SectionKey } from "@/lib/schema";

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

/** One choice in a select or multiselect. Values are the stored tokens. */
export interface SelectOption {
  value: string;
  label: string;
}

interface RepeaterItemBase {
  id: string;
  label: string;
  placeholder?: string;
  help?: string;
  /** Layout hint: half-width fields pair up on wider screens. */
  width?: "full" | "half";
  /**
   * "more" tucks the field behind the record's "More details" disclosure.
   * The visible fields are the ones a tired person must not miss; everything
   * here is real but optional detail, so the form stays a card, not a wall.
   */
  group?: "more";
}

export interface RepeaterItemInput extends RepeaterItemBase {
  kind: "text" | "textarea" | "email" | "tel" | "checkbox";
}

/**
 * Renders as a NATIVE <select>: the platform control every screen reader and
 * every phone keyboard already knows, styled to match the text inputs.
 */
export interface RepeaterItemSelect extends RepeaterItemBase {
  kind: "select";
  options: readonly SelectOption[];
}

/**
 * Renders as a fieldset/legend checkbox group writing into one string[].
 * Stored values outside `options` (a typed clock time, a token from a newer
 * backup) still render as removable checked entries — never dropped.
 */
export interface RepeaterItemMultiselect extends RepeaterItemBase {
  kind: "multiselect";
  options: readonly SelectOption[];
  /**
   * Adds a free text input whose typed value joins the array alongside the
   * checked tokens — the medication schedule's "custom time" ("14:30",
   * "2:30 PM"). Kept free-form on purpose: families write times the way they
   * say them, and the card layer renders unknown tokens verbatim.
   */
  custom?: {
    label: string;
    placeholder?: string;
    addLabel: string;
  };
}

export type RepeaterItemField =
  | RepeaterItemInput
  | RepeaterItemSelect
  | RepeaterItemMultiselect;

export interface RepeaterField extends BaseField {
  kind: "repeater";
  /** Singular noun for one entry, e.g. "person", "medication". */
  itemNoun: string;
  addLabel: string;
  itemFields: RepeaterItemField[];
}

export type FieldDef = ScalarField | RepeaterField;

/**
 * An older free-text field that a structured card section shadows. The wizard
 * quotes the family's own words back above the new form — "You wrote this
 * earlier" — so nobody retypes a paragraph wondering where it went. The prose
 * is never parsed into records; the family decides what moves.
 */
export interface LegacyRef {
  sectionKey: SectionKey;
  fieldKey: string;
  /** The label the family saw when they wrote it, shown over the quote. */
  label: string;
}

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
  /**
   * Older prose fields this section shadows, per letter path — the two paths
   * keep the same information in different sections, so each lists its own.
   */
  legacyRefs?: Partial<Record<LetterPath, readonly LegacyRef[]>>;
  fields: FieldDef[];
}
