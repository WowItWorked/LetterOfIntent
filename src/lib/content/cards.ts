import type { SectionKey } from "@/lib/schema";

/**
 * The single source of truth for the shareable care cards.
 *
 * Data only — no React, no rendering. The form's card markers, the live card
 * status, the card renderer, and pagination all read from here, so a card can
 * never disagree with the schema it draws from: cards.test.ts introspects the
 * zod shapes and fails the build if any reference below names a section or
 * field that does not exist.
 *
 * Visual values (colors, titles, purpose lines, icon paths) are transcribed
 * from the approved design export, and each color triple mirrors a --card-*
 * token in globals.css. The tokens style the site; these literals are for the
 * canvas renderer, which cannot read CSS variables at draw time.
 */

/* -------------------------------------------------------------------- keys */

export const CARD_KEYS = [
  "identity",
  "emergency",
  "meds",
  "behavior",
  "routine",
  "food",
  "care",
] as const;

export type CardKey = (typeof CARD_KEYS)[number];

/* -------------------------------------------------------------- definitions */

export interface CardDef {
  key: CardKey;
  /** Topic color — mirrors --card-{key} in globals.css. */
  color: `#${string}`;
  /** Darker shade for the engraved title — mirrors --card-{key}-deep. */
  deep: `#${string}`;
  /** Background tint for flagged blocks — mirrors --card-{key}-tint. */
  tint: `#${string}`;
  /** "Color · Topic" label under the color swatch, e.g. "Red · Emergency". */
  swatchLabel: string;
  /** Two-line title; t2 may be empty ("Medications" stands alone). */
  t1: string;
  t2: string;
  /**
   * Title size in px on the 1080-wide canvas. 74 fits most titles; the two
   * longest pairs step down so they never touch the icon.
   */
  titleSize: number;
  /** One plain sentence under the title saying what the card is for. */
  purpose: string;
  /** 24×24 stroke path from the export's ICON map. */
  iconPath: string;
}

export const CARD_DEFS: Record<CardKey, CardDef> = {
  identity: {
    key: "identity",
    color: "#4e7a57", // --card-identity
    deep: "#3a5c41", // --card-identity-deep
    tint: "#eaf1eb", // --card-identity-tint
    swatchLabel: "Green · Identity",
    t1: "Identity",
    t2: "& Contacts",
    titleSize: 74,
    purpose: "Who {name} is, who is responsible for them, and who to reach.",
    iconPath:
      "M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M16 7a4 4 0 1 1-8 0 4 4 0 0 1 8 0Z",
  },
  emergency: {
    key: "emergency",
    color: "#a64545", // --card-emergency
    deep: "#7f3232", // --card-emergency-deep
    tint: "#f6e9e7", // --card-emergency-tint
    swatchLabel: "Red · Emergency",
    t1: "Emergency",
    t2: "Protocol",
    titleSize: 74,
    purpose: "What to do, in order — and when to call 911.",
    iconPath:
      "M21.73 18 13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3ZM12 9v4M12 17h.01",
  },
  meds: {
    key: "meds",
    color: "#b7892f", // --card-meds
    deep: "#8a6a38", // --card-meds-deep
    tint: "#f8efd8", // --card-meds-tint
    swatchLabel: "Yellow · Medications",
    t1: "Medications",
    t2: "",
    titleSize: 74,
    purpose: "What {name} takes, when, and what to do when they say no.",
    iconPath:
      "M10.5 20.5 20.5 10.5a4.95 4.95 0 1 0-7-7l-10 10a4.95 4.95 0 1 0 7 7ZM8.5 8.5l7 7",
  },
  behavior: {
    key: "behavior",
    color: "#b5622c", // --card-behavior
    deep: "#8c4a1f", // --card-behavior-deep
    tint: "#f7ece2", // --card-behavior-tint
    swatchLabel: "Orange · Behavior",
    t1: "Behavior &",
    t2: "Communication",
    titleSize: 60,
    purpose: "How {name} tells you things, and what to do when it goes sideways.",
    iconPath: "M7.9 20A9 9 0 1 0 4 16.1L2 22Z",
  },
  routine: {
    key: "routine",
    color: "#6a4a73", // --card-routine
    deep: "#513959", // --card-routine-deep
    tint: "#f0ebf3", // --card-routine-tint
    swatchLabel: "Purple · Routine",
    t1: "Daily",
    t2: "Routine",
    titleSize: 74,
    purpose: "The shape of their day. The order matters more than the clock.",
    iconPath: "M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20ZM12 6v6l4 2",
  },
  food: {
    key: "food",
    color: "#2f6b6b", // --card-food
    deep: "#235252", // --card-food-deep
    tint: "#e7f0f0", // --card-food-tint
    swatchLabel: "Teal · Food",
    t1: "Eating",
    t2: "& Food",
    titleSize: 74,
    purpose: "What works, what does not, and what is actually dangerous.",
    iconPath:
      "M3 2v7c0 1.1.9 2 2 2h4a2 2 0 0 0 2-2V2M7 2v20M21 15V2a5 5 0 0 0-5 5v6c0 1.1.9 2 2 2h3Zm0 0v7",
  },
  care: {
    key: "care",
    color: "#3e5c84", // --card-care
    deep: "#2c4463", // --card-care-deep
    tint: "#eaeff6", // --card-care-tint
    swatchLabel: "Blue · Personal care",
    t1: "Personal Care",
    t2: "& Mobility",
    titleSize: 66,
    purpose: "What {name} does themselves, and where they need a hand.",
    iconPath:
      "M20.38 3.46 16 2a4 4 0 0 1-8 0L3.62 3.46a2 2 0 0 0-1.34 2.23l.58 3.47a1 1 0 0 0 .99.84H6v10c0 1.1.9 2 2 2h8a2 2 0 0 0 2-2V10h2.15a1 1 0 0 0 .99-.84l.58-3.47a2 2 0 0 0-1.34-2.23z",
  },
};

/* ------------------------------------------------------------------ sources */

/**
 * Named record filters, resolved by the card renderer:
 *
 * - "rescueOnly":    medications with isRescue === true.
 * - "emergencyOnly": contacts holding the primary/emergency role — a roles
 *                    array containing "primary" or "medical_decision", or the
 *                    legacy emergency === true boolean, which predates roles
 *                    and means the same thing.
 * - "byRole":        every contact, ordered by role (see PRIORITY_ORDER).
 *
 * Every filter also drops records marked keepOffCards — that flag is the
 * family's line between the full letter and a neighbor's phone.
 */
export type RecordFilter = "rescueOnly" | "emergencyOnly" | "byRole";

/**
 * - "required":        the content the card is built around.
 * - "enriches":        adds detail when present, silently absent when not.
 * - "legacy_fallback": the pre-cards prose blob, rendered ONLY when the card
 *                      has no structured records — blob coexistence means the
 *                      records win once they exist, and nothing auto-parses
 *                      the prose into records behind the family's back.
 */
export type SourceTier = "required" | "enriches" | "legacy_fallback";

export interface CardSource {
  section: SectionKey;
  /** Field inside that section's zod shape. cards.test.ts keeps this honest. */
  field: string;
  kind: "records" | "scalar";
  recordFilter?: RecordFilter;
  tier: SourceTier;
}

/**
 * Ordered content sources per card. ONE list per card — the canonical schema
 * has no path variants, so a card can never disagree with the section a
 * family actually wrote in. docs/output-matrix.md is the contract this table
 * implements.
 */
export type CardSources = Record<CardKey, readonly CardSource[]>;

export const SOURCES: CardSources = {
  identity: [
    { section: "gettingStarted", field: "subjectFullName", kind: "scalar", tier: "required" },
    { section: "gettingStarted", field: "subjectPreferredName", kind: "scalar", tier: "enriches" },
    { section: "gettingStarted", field: "subjectAddress", kind: "scalar", tier: "enriches" },
    { section: "person", field: "dateOfBirth", kind: "scalar", tier: "enriches" },
    {
      section: "familySupport",
      field: "contacts",
      kind: "records",
      recordFilter: "byRole",
      tier: "required",
    },
    { section: "health", field: "providers", kind: "records", tier: "enriches" },
    { section: "health", field: "preferredHospital", kind: "scalar", tier: "enriches" },
    { section: "emergencyPlan", field: "ifNoOneAnswers", kind: "scalar", tier: "enriches" },
  ],
  emergency: [
    { section: "allergies", field: "items", kind: "records", tier: "required" },
    { section: "emergencyPlan", field: "responseSteps", kind: "scalar", tier: "required" },
    // Named what-if plans ("If she is stung"), each its own block after the
    // unnamed responseSteps. Enriches, deliberately: RENDER_REQUIREMENTS stays
    // unchanged, so scenarios alone do not light the card.
    { section: "emergencyPlan", field: "scenarios", kind: "records", tier: "enriches" },
    { section: "emergencyPlan", field: "call911When", kind: "scalar", tier: "required" },
    { section: "emergencyPlan", field: "otherwiseCall", kind: "scalar", tier: "enriches" },
    { section: "emergencyPlan", field: "ifNoOneAnswers", kind: "scalar", tier: "enriches" },
    {
      section: "familySupport",
      field: "contacts",
      kind: "records",
      recordFilter: "emergencyOnly",
      tier: "enriches",
    },
    {
      section: "health",
      field: "medications",
      kind: "records",
      recordFilter: "rescueOnly",
      tier: "required",
    },
  ],
  meds: [
    { section: "health", field: "medications", kind: "records", tier: "required" },
    { section: "emergencyPlan", field: "otcPolicy", kind: "scalar", tier: "enriches" },
  ],
  // Deliberately records-free: the behavior card is clamped prose, the same
  // material the emergency sheet already lifts. The anchor is either
  // direction of communication; everything else only enriches. Fields that
  // pair a sharp source with a broader fallback (triggers/cannotAbide,
  // pain/wontAdmit) list both; the builder takes the first with content.
  behavior: [
    { section: "communication", field: "how", kind: "scalar", tier: "required" },
    { section: "communication", field: "howToSpeak", kind: "scalar", tier: "required" },
    { section: "communication", field: "yesNo", kind: "scalar", tier: "enriches" },
    { section: "communication", field: "pain", kind: "scalar", tier: "enriches" },
    { section: "communication", field: "wontAdmit", kind: "scalar", tier: "enriches" },
    { section: "communication", field: "whatHelps", kind: "scalar", tier: "enriches" },
    { section: "communication", field: "whatToAvoid", kind: "scalar", tier: "enriches" },
    { section: "person", field: "cannotAbide", kind: "scalar", tier: "enriches" },
    { section: "behavior", field: "triggers", kind: "scalar", tier: "enriches" },
    { section: "behavior", field: "deEscalation", kind: "scalar", tier: "enriches" },
    { section: "behavior", field: "lawEnforcement", kind: "scalar", tier: "enriches" },
  ],
  routine: [
    { section: "routines", field: "items", kind: "records", tier: "required" },
    { section: "routines", field: "transitions", kind: "scalar", tier: "enriches" },
    { section: "routine", field: "mornings", kind: "scalar", tier: "enriches" },
    { section: "routine", field: "evenings", kind: "scalar", tier: "enriches" },
    { section: "routine", field: "sleep", kind: "scalar", tier: "enriches" },
    { section: "routine", field: "fixedPoints", kind: "scalar", tier: "enriches" },
  ],
  food: [
    { section: "foods", field: "items", kind: "records", tier: "required" },
    { section: "routine", field: "food", kind: "scalar", tier: "legacy_fallback" },
  ],
  care: [
    { section: "careTasks", field: "items", kind: "records", tier: "required" },
    { section: "health", field: "equipment", kind: "scalar", tier: "enriches" },
    { section: "home", field: "personalCare", kind: "scalar", tier: "enriches" },
    { section: "home", field: "safety", kind: "scalar", tier: "enriches" },
  ],
};

/* ------------------------------------------------------ render requirements */

export interface SourceRef {
  section: SectionKey;
  field: string;
  recordFilter?: RecordFilter;
}

/**
 * A card renders only when every need is met; a need is met when any one of
 * its refs holds content (an AND of ORs). A card below this bar would be a
 * header with nothing under it — worse than no card, because someone might
 * trust it.
 */
export type RenderRequirement = readonly { anyOf: readonly SourceRef[] }[];

export const RENDER_REQUIREMENTS: Record<CardKey, RenderRequirement> = {
  // A name and at least one person responsible — a card that cannot say who
  // she is or who to reach identifies nothing.
  identity: [
    {
      anyOf: [
        { section: "gettingStarted", field: "subjectFullName" },
        { section: "gettingStarted", field: "subjectPreferredName" },
      ],
    },
    { anyOf: [{ section: "familySupport", field: "contacts" }] },
  ],
  emergency: [
    {
      anyOf: [
        { section: "allergies", field: "items" },
        { section: "health", field: "medications", recordFilter: "rescueOnly" },
        { section: "emergencyPlan", field: "responseSteps" },
        { section: "emergencyPlan", field: "call911When" },
      ],
    },
  ],
  meds: [{ anyOf: [{ section: "health", field: "medications" }] }],
  // Either direction of communication anchors the card: how they express
  // themselves, or how to talk with them.
  behavior: [
    {
      anyOf: [
        { section: "communication", field: "how" },
        { section: "communication", field: "howToSpeak" },
      ],
    },
  ],
  routine: [
    {
      anyOf: [
        { section: "routines", field: "items" },
        { section: "routines", field: "transitions" },
        { section: "routine", field: "mornings" },
        { section: "routine", field: "evenings" },
      ],
    },
  ],
  food: [
    {
      anyOf: [
        { section: "foods", field: "items" },
        { section: "routine", field: "food" },
      ],
    },
  ],
  care: [
    {
      anyOf: [
        { section: "careTasks", field: "items" },
        { section: "health", field: "equipment" },
        { section: "home", field: "personalCare" },
        { section: "home", field: "safety" },
      ],
    },
  ],
};

/* ------------------------------------------------------------ priority order */

/**
 * Allergy severity, worst first — the token order the emergency card sorts by.
 * The schema stores severity as a free string; anything not in this list sorts
 * after "mild" in the order the family entered it.
 */
export const ALLERGY_SEVERITY_ORDER = ["life-threatening", "serious", "mild"] as const;

/**
 * Medication schedule tokens in day order. Typed clock times ("14:30") sort
 * among themselves chronologically; unknown tokens keep entry order at the end.
 */
export const MED_TIME_OF_DAY_ORDER = ["morning", "noon", "evening", "bedtime"] as const;

/** Routine record timeOfDay tokens in day order, for grouping routine blocks. */
export const ROUTINE_TIME_OF_DAY_ORDER = ["morning", "afternoon", "evening", "night"] as const;

/**
 * What survives when a card runs out of room, most critical first. Pagination
 * trims from the bottom of this list, never the top: the last continuation
 * card may lose "rest", but allergies and rescue medication are always on
 * card 1 of N. "user_order" means records keep the order the family gave them
 * — for routines, foods, and care tasks the family's sequence IS the content.
 */
export const PRIORITY_ORDER: Record<CardKey, readonly string[]> = {
  identity: [
    "name_dob",
    "primary_contact",
    "backup_contact",
    "medical_decision_contact",
    "provider",
    "address",
    "if_no_one_answers",
  ],
  emergency: [
    "allergies_by_severity",
    "rescue_meds_with_location",
    "response_steps",
    "call_911_when",
    "rest",
  ],
  meds: [
    "rescue_first",
    "scheduled_by_time_of_day",
    "prn",
    "refusal_strategy",
    "otc_policy",
  ],
  // The escalate-when analog leads: the reader who only gets one block needs
  // the warning signs before the biography. First-responder guidance closes
  // the card — the block that exists for exactly one kind of reader.
  behavior: [
    "escalates_when",
    "what_helps",
    "how_they_communicate",
    "yes_no_signals",
    "pain_signals",
    "what_not_to_say",
    "first_responders",
  ],
  routine: ["user_order"],
  food: ["user_order"],
  care: ["user_order"],
};

/* --------------------------------------------------------------- index card */

/**
 * The eighth card in every pack: "Which Cards To Send", the bundle guide in
 * card form. The seven topic cards are for the caregiver; this one is for the
 * parent. It is a fixed asset, not a derived card — it carries no name, no
 * age, and no date, so the same PNG ships unchanged in every family's
 * download and never needs rendering.
 */
export const INDEX_CARD = {
  title: "Which Cards To Send",
  /** Static asset under public/; served same-origin, nothing leaves the device. */
  asset: "/cards/which-cards-to-send.png",
  /** Navy spine color from the design export (the "bundles" topic). */
  color: "#253551",
} as const;

/* ------------------------------------------------------------------ bundles */

export interface CardBundle {
  name: string;
  cards: readonly CardKey[];
  /** One-line situational note, verbatim from the design export. */
  note: string;
}

export const BUNDLES: readonly CardBundle[] = [
  {
    name: "Quick trip",
    cards: ["identity", "emergency", "behavior"],
    note: "An hour in a waiting room with someone who has never met them.",
  },
  {
    name: "Afternoon sitter",
    cards: ["identity", "emergency", "behavior", "food"],
    note: "Long enough that a snack happens.",
  },
  {
    name: "Evening / bedtime",
    cards: ["identity", "emergency", "behavior", "food", "routine"],
    note: "The bedtime sequence is the part a sitter cannot improvise.",
  },
  {
    name: "Overnight respite",
    cards: ["identity", "emergency", "meds", "behavior", "routine", "food", "care"],
    note: "Everything. A full night means medication and personal care are on the table.",
  },
  {
    name: "School or camp intake",
    cards: ["identity", "emergency", "meds", "behavior"],
    note: "What an office needs on file, without the household detail.",
  },
];

/* -------------------------------------------------------------- constraints */

/**
 * The system rules as data. 1080×1920 is a full phone screen and the aspect a
 * text message shows uncropped; 39px body text is roughly 14pt on that screen
 * and the floor below which a caregiver squints; at most two flagged blocks
 * per card or the emphasis stops meaning anything; and overflow becomes
 * numbered continuations ("Medications 1 of 2") rather than silent truncation
 * — capped so a card set never becomes a document.
 */
export const CARD_CONSTRAINTS = {
  canvas: { w: 1080, h: 1920 },
  maxContinuations: 3,
  maxCriticalBlocksPerCard: 2,
  bodyPxFloor: 39,
} as const;

/* ------------------------------------------------------------------- footer */

/**
 * The footer line every card carries. The date is the letter's own date —
 * letterDateIso(data) formatted long at render time, e.g. "August 8, 2026" —
 * so a card says when it was last true, not when it was downloaded.
 */
export const FOOTER_META_TEMPLATE = "Updated {Month D, YYYY} · Not a medical document";
