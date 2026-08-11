import type { LetterMeta, SectionKey } from "@/lib/schema";

/** Input kinds rendered by the generic section form. */
export type ScalarKind = "text" | "textarea" | "date" | "email" | "tel";

/* --------------------------------------------------------------- adaptivity */

/**
 * The routing answers a condition may test. Mirrors the onboarding fields on
 * LetterMeta (docs/onboarding-questions.md).
 */
export type RoutingKey =
  | "audience"
  | "stage"
  | "supportLevel"
  | "communicationDiffers"
  | "behaviorEscalates"
  | "cognitionChanging"
  | "hasTrust"
  | "hasBenefits"
  | "schoolWork"
  | "livesWith";

/**
 * One declarative condition: every named key must hold one of the listed
 * tokens (AND across keys; OR within a key's list). Declarative on purpose —
 * the a11y suite enumerates configurations and the sync tests check adaptive
 * examples, and neither can look inside a closure.
 *
 * An UNANSWERED key fails its test: before onboarding, gated content stays
 * out of the way. Content already written always overrides gating — that
 * rule lives in lib/content/config.ts, not here.
 */
export type MetaCond = Readonly<Partial<Record<RoutingKey, readonly string[]>>>;

/** OR of ANDs. Absent showWhen = shown in every configuration. */
export type ShowWhen = readonly MetaCond[];

export function metaCondMatches(cond: MetaCond, meta: LetterMeta): boolean {
  return Object.entries(cond).every(([key, tokens]) => {
    if (!tokens) return true;
    const v = meta[key as RoutingKey];
    if (Array.isArray(v)) return v.some((t) => tokens.includes(t));
    return typeof v === "string" && tokens.includes(v);
  });
}

export function showWhenMatches(showWhen: ShowWhen | undefined, meta: LetterMeta): boolean {
  if (!showWhen || showWhen.length === 0) return true;
  return showWhen.some((cond) => metaCondMatches(cond, meta));
}

/**
 * Context-dependent wording for one field: storage consolidates, voice does
 * not flatten. First matching variant wins; the base wording is the fallback,
 * written for the broadest audience. A variant that changes the register MUST
 * carry its own example when the base has one — the sync tests enforce it,
 * because a granddaughter reading a child-diagnosis example under an adapted
 * label is the exact failure the variants exist to prevent.
 */
export interface WordingVariant {
  when: MetaCond;
  label?: string;
  help?: string;
  placeholder?: string;
  example?: string;
}

/* ------------------------------------------------------------------- fields */

/** One tappable suggestion. Never a closed list; the field stays free text. */
export interface Chip {
  value: string;
  /** Inline plain-language definition (~8th grade) — the chip also teaches. */
  teach?: string;
}

interface BaseField {
  /** Key inside the section's data object. Must exist in the zod schema. */
  id: string;
  label: string;
  /** Short helper text shown under the label (wired via aria-describedby). */
  help?: string;
  placeholder?: string;
  /** Realistic sample answer, revealed behind a "See an example" disclosure. */
  example?: string;
  /** Ask only in matching configurations. Content overrides (config.ts). */
  showWhen?: ShowWhen;
  /** Adaptive wording per configuration. */
  variants?: readonly WordingVariant[];
}

export interface ScalarField extends BaseField {
  kind: ScalarKind;
  /** Rough size hint for textareas. */
  rows?: number;
  /**
   * Browser-autofill policy. Default is off (health and narrative detail is
   * nothing a browser should offer to remember); fields that are mechanical
   * identity typing opt in with a real token ("name", "tel", "email").
   */
  autoComplete?: string;
  /** Tap-to-append suggestions for genuinely enumerable fields. */
  chips?: readonly Chip[];
  /** Tappable sentence starters for long textareas ("What helps most is…"). */
  openers?: readonly string[];
  /**
   * Advisory character budget for card-bound fields: surfaced softly in the
   * form, never blocking; the card renderer degrades gracefully past it.
   */
  cardLengthHint?: number;
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
  /** Autofill token for mechanical inputs (a contact's name/tel/email). */
  autoComplete?: string;
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

/** The field's wording as one configuration sees it. */
export interface ResolvedWording {
  label: string;
  help?: string;
  placeholder?: string;
  example?: string;
}

export function resolveWording(field: FieldDef, meta: LetterMeta): ResolvedWording {
  const variant = field.variants?.find((v) => metaCondMatches(v.when, meta));
  return {
    label: variant?.label ?? field.label,
    help: variant?.help ?? field.help,
    placeholder: variant?.placeholder ?? field.placeholder,
    example: variant?.example ?? field.example,
  };
}

/* ----------------------------------------------------------------- sections */

/**
 * An older free-text field that a structured (or sharper) question shadows.
 * The wizard quotes the family's own words back above the new form — "You
 * wrote this earlier" — so nobody retypes a paragraph wondering where it
 * went. The prose is never parsed; the family decides what moves.
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
  /** Full title. May contain {name}, replaced with the person's name. */
  title: string;
  /** Short label for the sidebar. May contain {name}. */
  navTitle: string;
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
  /** Ask this section only in matching configurations. Content overrides. */
  showWhen?: ShowWhen;
  /** Adaptive section title/intro per configuration (first match wins). */
  variants?: readonly {
    when: MetaCond;
    title?: string;
    navTitle?: string;
    intro?: string;
  }[];
  /** Older prose fields this section shadows (canonical refs). */
  legacyRefs?: readonly LegacyRef[];
  fields: FieldDef[];
}

export function resolveSectionWording(
  def: SectionDef,
  meta: LetterMeta
): { title: string; navTitle: string; intro: string } {
  const variant = def.variants?.find((v) => metaCondMatches(v.when, meta));
  return {
    title: variant?.title ?? def.title,
    navTitle: variant?.navTitle ?? def.navTitle,
    intro: variant?.intro ?? def.intro,
  };
}
