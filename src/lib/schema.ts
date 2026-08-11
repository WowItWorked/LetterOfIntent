import { z } from "zod";

/**
 * Persistence schema for the whole Letter of Intent.
 *
 * ONE canonical schema. There are no per-path section variants: every family
 * writes into the same fields, and the adaptive form decides which questions
 * to ASK from the onboarding answers in `meta` — never which fields exist.
 * The full rationale and the complete v1 → v2 field accounting live in
 * docs/schema-migration.md; the v1 shapes themselves in lib/legacy/v1-schema.
 *
 * Deliberately permissive: every field is optional and format rules are NOT
 * enforced here. A half-finished letter is a valid letter. Gentle format
 * hints (email/date) live in the UI layer only — see lib/validation.ts —
 * so an imported backup can never be rejected over a typo.
 *
 * Privacy note: there are intentionally no fields for SSNs, account numbers,
 * or policy numbers anywhere in this schema. The letter records where the
 * family keeps those, never the numbers themselves.
 */

const s = z.string().optional();
const b = z.boolean().optional();

/* ---------------------------------------------------------------- repeaters */

export const contactSchema = z.object({
  id: s,
  name: s,
  relationship: s,
  phone: s,
  altPhone: s,
  email: s,
  role: s,
  /**
   * Card-role tokens: "primary" | "medical_decision" | "legal_guardian" |
   * "pickup" | "neighbor_backup" — kept as free strings so an imported backup
   * is never rejected over an unknown token. The older `emergency` boolean
   * below stays untouched: card derivations treat emergency === true as a
   * legacy synonym for the primary/emergency role, so a letter written before
   * roles existed still puts its people on the cards.
   */
  roles: z.array(z.string()).optional(),
  emergency: b,
  notes: s,
  /** True → this record stays in the full letter and off shareable cards. */
  keepOffCards: b,
});

export const providerSchema = z.object({
  id: s,
  name: s,
  specialty: s,
  practice: s,
  phone: s,
  notes: s,
  keepOffCards: b,
});
// preferredHospital deliberately stays a section scalar (health asks it once
// per letter) rather than moving onto the provider record — a family has one
// preferred hospital, not one per doctor.

export const medicationSchema = z.object({
  id: s,
  name: s,
  dose: s,
  purpose: s,
  unit: s,
  route: s,
  /**
   * Schedule tokens: "morning" | "noon" | "evening" | "bedtime" | "prn", or a
   * typed clock time such as "14:30". Deliberately not an enum: a family that
   * writes "2:30 PM" keeps it, and a backup is never rejected over a token we
   * did not anticipate. The card layer sorts the known tokens (that order
   * lives in content/cards.ts) and renders anything else verbatim.
   */
  schedule: z.array(z.string()).optional(),
  withFood: b,
  isRescue: b,
  /** Where a rescue medication physically lives — the pouch, the drawer. */
  location: s,
  refusalStrategy: s,
  sideEffects: s,
  prnTrigger: s,
  prnMaxPerDay: s,
  keepOffCards: b,
});

/* ---------------------------------------------------- care-card record types */

export const allergyRecordSchema = z.object({
  id: s,
  allergen: s,
  reaction: s,
  /** Severity tokens: "life-threatening" | "serious" | "mild". */
  severity: s,
  treatment: s,
  keepOffCards: b,
});

export const routineRecordSchema = z.object({
  id: s,
  /** Token: "morning" | "afternoon" | "evening" | "night". */
  timeOfDay: s,
  /** Free text like "7:00 AM" — the order matters more than the clock. */
  time: s,
  /** Multiline: one step per line; the cards split on newline. */
  steps: s,
  notes: s,
  keepOffCards: b,
});

export const foodRecordSchema = z.object({
  id: s,
  item: s,
  /** Token: "always_works" | "will_not_eat" | "texture" | "choking_risk" | "support". */
  type: s,
  reason: s,
  keepOffCards: b,
});

export const careTaskRecordSchema = z.object({
  id: s,
  /** Token: "toileting" | "dressing" | "bathing" | "equipment" | "mobility". */
  category: s,
  /** Multiline: one step per line, same convention as routine steps. */
  steps: s,
  equipment: s,
  keepOffCards: b,
});

export const emergencyScenarioSchema = z.object({
  id: s,
  /** The situation, in the family's words — "If she is stung", "If she bolts". */
  trigger: s,
  /** Multiline: one action per line; the card numbers them like responseSteps. */
  steps: s,
});

/* ------------------------------------------------------- canonical sections */

export const gettingStartedSchema = z.object({
  authorName: s,
  authorRelationship: s,
  subjectFullName: s,
  subjectPreferredName: s,
  /**
   * The identity card's address line — the one piece of postal PII the letter
   * collects, added for the card a sitter hands to a paramedic. Owner-approved.
   */
  subjectAddress: s,
  letterDate: s,
});

/** Who this person is — the portrait, not the paperwork. */
export const personSchema = z.object({
  dateOfBirth: s,
  whoTheyAre: s,
  history: s,
  temperament: s,
  firstFiveMinutes: s,
  strangersGetWrong: s,
  cannotAbide: s,
  importantToKnow: s,
});

export const familySupportSchema = z.object({
  contacts: z.array(contactSchema).optional(),
  firstCall: s,
  doNotInvolve: s,
});

/** The shape of their days and week. */
export const routineSchema = z.object({
  mornings: s,
  evenings: s,
  sleep: s,
  food: s,
  clothing: s,
  sensory: s,
  comfortObjects: s,
  fixedPoints: s,
  gettingAround: s,
  goodDay: s,
  hardDay: s,
});

/**
 * Both directions of communication. `how` (how they express themselves) and
 * `howToSpeak` (how to address them) look like duplicates and are not — the
 * emergency sheet's old mis-wiring is what made them look alike. Same for
 * pain (involuntary signs) vs. wontAdmit (deliberate non-disclosure).
 */
export const communicationSchema = z.object({
  how: s,
  howToSpeak: s,
  yesNo: s,
  hearingVisionMemory: s,
  pain: s,
  wontAdmit: s,
  overwhelm: s,
  hardConversations: s,
  whatHelps: s,
  whatToAvoid: s,
});

/**
 * emergencyProtocol and appointmentHelp are DIFFERENT questions and must
 * never merge: printing appointment logistics where a first responder looks
 * for a protocol is the shipped defect this schema exists to end. Likewise
 * insurancePlans (plan names) vs. recordsLocation (where papers live).
 */
export const healthSchema = z.object({
  providers: z.array(providerSchema).optional(),
  medications: z.array(medicationSchema).optional(),
  conditions: s,
  allergies: s,
  pharmacy: s,
  preferredHospital: s,
  emergencyProtocol: s,
  appointmentHelp: s,
  therapies: s,
  equipment: s,
  insurancePlans: s,
  recordsLocation: s,
  whatWorked: s,
  whatDidNot: s,
});

export const behaviorSchema = z.object({
  triggers: s,
  earlyWarnings: s,
  deEscalation: s,
  makesWorse: s,
  crisisPlan: s,
  lawEnforcement: s,
});

export const homeSchema = z.object({
  currentLiving: s,
  theHome: s,
  supportLevel: s,
  householdHelp: s,
  personalCare: s,
  petsAndPlants: s,
  deferred: s,
  safety: s,
  waiverStatus: s,
  futureHopes: s,
  hardLimits: s,
});

export const schoolWorkSchema = z.object({
  currentProgram: s,
  iepHistory: s,
  whatWorksLearning: s,
  workHistory: s,
  currentWork: s,
  jobSupports: s,
  commitments: s,
  keyContacts: s,
  windDown: s,
  hopes: s,
});

export const moneyBenefitsSchema = z.object({
  programs: s,
  incomeSources: s,
  whoHandlesBills: s,
  howBillsArePaid: s,
  repPayee: s,
  ableAccount: s,
  trusts: s,
  pending: s,
  whereRecordsKept: s,
  vulnerabilities: s,
});

export const legalSchema = z.object({
  powersOfAttorney: s,
  advanceDirectives: s,
  guardianship: s,
  whoDecidesWhat: s,
  /**
   * Legacy-carried: the old special-needs composite question. Its prose spans
   * the four sharper fields above, so it is stored, printed, and quoted above
   * them in the form ("you wrote this earlier") — never asked again, and
   * never split by software.
   */
  decisionStatus: s,
  advocates: s,
  advocacyHistory: s,
  professionals: s,
});

export const communityFaithSchema = z.object({
  friends: s,
  activities: s,
  joy: s,
  faith: s,
  congregation: s,
  traditions: s,
  travel: s,
});

export const trusteeGuidanceSchema = z.object({
  moneyIsFor: s,
  easyYeses: s,
  spendVsPreserve: s,
  scrutinize: s,
  wishesVsSafety: s,
  /** Who a trustee checks with before big money decisions — deliberately a
   *  different question from caregiverGuidance.consultFirst. */
  consultFirst: s,
});

export const caregiverGuidanceSchema = z.object({
  firstWeek: s,
  hindsight: s,
  neverChange: s,
  /** Who a caregiver convenes before anything irreversible. */
  consultFirst: s,
});

export const finalWishesSchema = z.object({
  funeral: s,
  restingPlace: s,
  religious: s,
  organDonation: s,
  endOfLife: s,
  documentsLocation: s,
});

export const personalMessageSchema = z.object({
  toCaregivers: s,
  toSiblings: s,
  toPerson: s,
});

/* ------------------------------------------------- shared card-data sections */

export const allergiesSchema = z.object({
  items: z.array(allergyRecordSchema).optional(),
});

export const routinesSchema = z.object({
  items: z.array(routineRecordSchema).optional(),
  /** The routine card's flagged block: how to move between activities safely. */
  transitions: s,
});

export const foodsSchema = z.object({
  items: z.array(foodRecordSchema).optional(),
});

export const careTasksSchema = z.object({
  items: z.array(careTaskRecordSchema).optional(),
});

export const emergencyPlanSchema = z.object({
  /** Multiline: one numbered step per line — "1 · Auto-injector…". */
  responseSteps: s,
  /** Named what-if plans, each its own Emergency-card block. */
  scenarios: z.array(emergencyScenarioSchema).optional(),
  call911When: s,
  otherwiseCall: s,
  ifNoOneAnswers: s,
  /** The medications card's "Nothing else" block. */
  otcPolicy: s,
});

/* ------------------------------------------------------------------- marks */

/**
 * Per-field and per-section markers, keyed "sectionKey" or
 * "sectionKey.fieldId". Known values: "not_applicable" (the family said this
 * does not apply — outputs skip it, the reading view never calls it a gap),
 * "come_back" (deliberately deferred), "combined" (the v1 migration joined
 * two answers here; the form shows a gentle reconcile notice until edited).
 * A permissive record of strings so a newer backup can never be rejected.
 */
export const marksSchema = z.record(z.string(), z.string());

export type MarkValue = "not_applicable" | "come_back" | "combined";

/* -------------------------------------------------------------- whole letter */

export const letterDataSchema = z.object({
  gettingStarted: gettingStartedSchema.optional(),
  person: personSchema.optional(),
  familySupport: familySupportSchema.optional(),
  routine: routineSchema.optional(),
  communication: communicationSchema.optional(),
  health: healthSchema.optional(),
  behavior: behaviorSchema.optional(),
  home: homeSchema.optional(),
  schoolWork: schoolWorkSchema.optional(),
  moneyBenefits: moneyBenefitsSchema.optional(),
  legal: legalSchema.optional(),
  communityFaith: communityFaithSchema.optional(),
  trusteeGuidance: trusteeGuidanceSchema.optional(),
  caregiverGuidance: caregiverGuidanceSchema.optional(),
  finalWishes: finalWishesSchema.optional(),
  personalMessage: personalMessageSchema.optional(),

  // Structured card-data sections.
  allergies: allergiesSchema.optional(),
  routines: routinesSchema.optional(),
  foods: foodsSchema.optional(),
  careTasks: careTasksSchema.optional(),
  emergencyPlan: emergencyPlanSchema.optional(),

  // Not a section: the marks record (see marksSchema).
  marks: marksSchema.optional(),
});

/* --------------------------------------------------------------- routing meta */

/**
 * Onboarding answers are ROUTING STATE, not letter content: they decide which
 * questions the form asks, and live in meta so the letter data stays purely
 * the family's words. Tokens are free strings (never enums) so an imported
 * backup with an unknown token is kept, not rejected. The full question set
 * with wording and gating lives in docs/onboarding-questions.md.
 */
export const letterMetaSchema = z.object({
  startedAt: s,
  updatedAt: s,
  lastVisitedSlug: s,
  /** v1 legacy: the final-wishes interstitial ack. Migrated into emotionalAcks. */
  finalWishesAck: b,
  /** Slugs whose emotional interstitial the family has acknowledged. */
  emotionalAcks: z.array(z.string()).optional(),
  /** v1 legacy: which of the two old question sets this letter was written
   *  from. Kept so old backups' meta parses; used only by the migration's
   *  audience inference. Nothing else may read it. */
  letterPath: s,

  /** "trustee" | "caregiver" | "both" */
  audience: s,
  /** "child" | "adult" */
  stage: s,
  /** "mostlyIndependent" | "someDailyHelp" | "substantial" | "roundTheClock" */
  supportLevel: s,
  /** "yes" | "no" */
  communicationDiffers: s,
  /** "yes" | "no" */
  behaviorEscalates: s,
  /** "yes" | "early" | "no" */
  cognitionChanging: s,
  /** "yes" | "planned" | "no" | "notSure" */
  hasTrust: s,
  /** "yes" | "maybe" | "no" */
  hasBenefits: s,
  /** Multi-select: "school" | "work" | "neither" */
  schoolWork: z.array(z.string()).optional(),
  /** "withWriter" | "ownHome" | "withOthers" | "facility" */
  livesWith: s,
  /** True once the family has been through onboarding (or confirmed the
   *  migration's inferred answers). */
  onboardingDone: b,
  /** True when the answers were inferred by the v1 migration and not yet
   *  confirmed — the onboarding shows once, pre-filled. */
  onboardingInferred: b,
});

/**
 * Photographs travel in the backup as data URLs. They live in IndexedDB on
 * the device rather than in the letter data, but a backup that dropped them
 * would quietly lose the one thing a family cannot retype.
 */
export const backupPhotoSchema = z.object({
  slot: z.enum(["recent", "family"]),
  dataUrl: z.string(),
  name: s,
  type: s,
  addedAt: s,
  caption: s,
});

/** Envelope written by "Download your backup file" and read by "Load a backup file". */
export const backupSchema = z.object({
  app: z.literal("twl-letter-of-intent"),
  version: z.number(),
  exportedAt: s,
  data: letterDataSchema,
  meta: letterMetaSchema.optional(),
  photos: z.array(backupPhotoSchema).optional(),
});

export type Contact = z.infer<typeof contactSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type AllergyRecord = z.infer<typeof allergyRecordSchema>;
export type RoutineRecord = z.infer<typeof routineRecordSchema>;
export type FoodRecord = z.infer<typeof foodRecordSchema>;
export type CareTaskRecord = z.infer<typeof careTaskRecordSchema>;
export type EmergencyScenario = z.infer<typeof emergencyScenarioSchema>;
export type LetterData = z.infer<typeof letterDataSchema>;
export type LetterMeta = z.infer<typeof letterMetaSchema>;
export type BackupPhoto = z.infer<typeof backupPhotoSchema>;
export type Backup = z.infer<typeof backupSchema>;

/** Every key of LetterData that is a SECTION (marks is bookkeeping, not one). */
export type SectionKey = Exclude<keyof LetterData, "marks">;

export const sectionKeys = Object.keys(letterDataSchema.shape).filter(
  (k) => k !== "marks"
) as SectionKey[];

/** Per-section schemas, addressable by key (used by tests and the form layer). */
export const sectionSchemas = {
  gettingStarted: gettingStartedSchema,
  person: personSchema,
  familySupport: familySupportSchema,
  routine: routineSchema,
  communication: communicationSchema,
  health: healthSchema,
  behavior: behaviorSchema,
  home: homeSchema,
  schoolWork: schoolWorkSchema,
  moneyBenefits: moneyBenefitsSchema,
  legal: legalSchema,
  communityFaith: communityFaithSchema,
  trusteeGuidance: trusteeGuidanceSchema,
  caregiverGuidance: caregiverGuidanceSchema,
  finalWishes: finalWishesSchema,
  personalMessage: personalMessageSchema,
  allergies: allergiesSchema,
  routines: routinesSchema,
  foods: foodsSchema,
  careTasks: careTasksSchema,
  emergencyPlan: emergencyPlanSchema,
} as const;

export const BACKUP_APP_ID = "twl-letter-of-intent" as const;
/** v2: the canonical schema. The importer accepts v1 envelopes forever. */
export const BACKUP_VERSION = 2;
