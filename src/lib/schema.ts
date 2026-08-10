import { z } from "zod";

/**
 * Persistence schema for the whole Letter of Intent.
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
   * Card-role tokens: "primary" | "medical_decision" | "pickup" |
   * "neighbor_backup" — kept as free strings so an imported backup is never
   * rejected over an unknown token. The older `emergency` boolean below stays
   * untouched: card derivations treat emergency === true as a legacy synonym
   * for the primary/emergency role, so a letter written before roles existed
   * still puts its people on the cards.
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
// preferredHospital deliberately stays a section scalar (medical and
// healthMedical each already ask it once per letter) rather than moving onto
// the provider record as the card model drew it — a family has one preferred
// hospital, not one per doctor, and moving it would strand existing answers.

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
  // The card model nests these as prn: { trigger, maxPerDay }. Flattened here
  // on purpose: the backup salvage path reads flat optional scalars robustly,
  // and flat is the house style everywhere else in this schema.
  prnTrigger: s,
  prnMaxPerDay: s,
  keepOffCards: b,
});

/* ---------------------------------------------------- care-card record types
 *
 * Structured records behind the shareable care cards. Every field optional,
 * every token list a free string: the cards sort and group by the tokens they
 * know and render anything else verbatim, and an imported backup can never be
 * rejected over one.
 */

export const allergyRecordSchema = z.object({
  id: s,
  allergen: s,
  reaction: s,
  /**
   * Severity tokens: "life-threatening" | "serious" | "mild". The sort order
   * (worst first on the emergency card) lives in content/cards.ts, not here —
   * the schema stores what the family said, the card config decides urgency.
   */
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
  /**
   * Multiline: one step per line; the cards split on newline. A string[] would
   * need a repeater inside a repeater the form is never going to grow.
   */
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

/* ----------------------------------------------------------------- sections */

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

export const aboutSchema = z.object({
  dateOfBirth: s,
  diagnoses: s,
  lifeHistory: s,
  firstFiveMinutes: s,
  importantToKnow: s,
});

export const familySupportSchema = z.object({
  contacts: z.array(contactSchema).optional(),
  firstCall: s,
  doNotInvolve: s,
});

export const typicalDaySchema = z.object({
  morningRoutine: s,
  eveningRoutine: s,
  sleep: s,
  food: s,
  clothing: s,
  sensory: s,
  comfortObjects: s,
  goodDay: s,
  hardDay: s,
});

export const communicationSchema = z.object({
  how: s,
  yesNo: s,
  pain: s,
  overwhelm: s,
  whatToSay: s,
  whatNotToSay: s,
});

export const medicalSchema = z.object({
  providers: z.array(providerSchema).optional(),
  medications: z.array(medicationSchema).optional(),
  allergies: s,
  emergencyProtocol: s,
  therapies: s,
  equipment: s,
  insurance: s,
  preferredHospital: s,
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

export const educationWorkSchema = z.object({
  currentProgram: s,
  iepHistory: s,
  whatWorksLearning: s,
  workHistory: s,
  jobSupports: s,
  hopes: s,
});

export const housingSchema = z.object({
  currentLiving: s,
  supportLevel: s,
  waiverStatus: s,
  futureHopes: s,
  hardLimits: s,
});

export const benefitsFinancesSchema = z.object({
  programs: s,
  repPayee: s,
  ableAccount: s,
  trusts: s,
  pending: s,
  whereRecordsKept: s,
});

export const socialFaithSchema = z.object({
  friends: s,
  activities: s,
  faith: s,
  traditions: s,
  travel: s,
  joy: s,
});

export const legalAdvocacySchema = z.object({
  decisionStatus: s,
  advocates: s,
  attorney: s,
  advocacyHistory: s,
});

export const trusteeSchema = z.object({
  moneyIsFor: s,
  easyYeses: s,
  spendVsPreserve: s,
  scrutinize: s,
  wishesVsSafety: s,
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

/* ------------------------------------------------- the general path's sections
 *
 * The second letter — for an aging parent, a spouse, a sibling you look after —
 * asks genuinely different questions, so it gets its own keys rather than
 * reusing the special-needs ones with different labels. Getting started,
 * family & support, final wishes, and the personal message are shared: they
 * ask the same thing either way, and a family that switches paths keeps them.
 */

export const aboutThemSchema = z.object({
  dateOfBirth: s,
  whoTheyAre: s,
  history: s,
  temperament: s,
  cannotAbide: s,
  strangersGetWrong: s,
});

export const typicalWeekSchema = z.object({
  mornings: s,
  evenings: s,
  fixedPoints: s,
  gettingAround: s,
  food: s,
  goodDay: s,
  hardDay: s,
});

export const dailyCommunicationSchema = z.object({
  howToSpeak: s,
  hearingVisionMemory: s,
  wontAdmit: s,
  hardConversations: s,
  whatHelps: s,
  whatToAvoid: s,
});

export const healthMedicalSchema = z.object({
  providers: z.array(providerSchema).optional(),
  medications: z.array(medicationSchema).optional(),
  conditions: s,
  allergies: s,
  pharmacy: s,
  preferredHospital: s,
  appointmentHelp: s,
  recordsLocation: s,
});

export const homeLivingSchema = z.object({
  theHome: s,
  deferred: s,
  householdHelp: s,
  personalCare: s,
  petsAndPlants: s,
  safety: s,
});

export const moneyDocumentsSchema = z.object({
  whoHandlesBills: s,
  howBillsArePaid: s,
  incomeSources: s,
  whereDocumentsKept: s,
  vulnerabilities: s,
  advisors: s,
});

export const workObligationsSchema = z.object({
  currentWork: s,
  commitments: s,
  keyContacts: s,
  windDown: s,
});

export const faithCommunitySchema = z.object({
  faith: s,
  congregation: s,
  friendsAndNeighbors: s,
  traditions: s,
  pleasures: s,
});

export const legalDecisionsSchema = z.object({
  powersOfAttorney: s,
  advanceDirectives: s,
  guardianship: s,
  whoDecidesWhat: s,
  professionals: s,
});

export const steppingInSchema = z.object({
  firstWeek: s,
  hindsight: s,
  neverChange: s,
  consultFirst: s,
});

/* ------------------------------------------------- shared card-data sections
 *
 * The structured collections the care cards draw from. They sit ALONGSIDE the
 * prose fields (medical.allergies, typicalDay.food, …) rather than replacing
 * them: nothing parses a family's prose into records, and a letter holding
 * only the prose is still whole. Shared by both paths, like familySupport.
 * Not yet in either wizard roster — the form cannot render their pickers until
 * Phase C — but registered in the trio below so a backup written by a newer
 * version restores instead of silently dropping them.
 */

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

export const emergencyScenarioSchema = z.object({
  id: s,
  /** The situation, in the family's words — "If she is stung", "If she bolts". */
  trigger: s,
  /** Multiline: one action per line; the card numbers them like responseSteps. */
  steps: s,
});

export const emergencyPlanSchema = z.object({
  /** Multiline: one numbered step per line — "1 · Auto-injector…". */
  responseSteps: s,
  /**
   * Named what-if plans. Each renders on the Emergency card as its own block
   * labeled by its trigger, steps numbered exactly like responseSteps — which
   * stays, and still renders first as the unnamed "What to do" block.
   */
  scenarios: z.array(emergencyScenarioSchema).optional(),
  call911When: s,
  otherwiseCall: s,
  ifNoOneAnswers: s,
  /**
   * The medications card's "Nothing else" block — the family's rule on
   * unapproved over-the-counter medicine. It lives here rather than on a
   * medication record because it is a safety rule about medicines the person
   * does NOT take; there is no record for it to hang on.
   */
  otcPolicy: s,
});

/* -------------------------------------------------------------- whole letter */

export const letterDataSchema = z.object({
  gettingStarted: gettingStartedSchema.optional(),
  about: aboutSchema.optional(),
  familySupport: familySupportSchema.optional(),
  typicalDay: typicalDaySchema.optional(),
  communication: communicationSchema.optional(),
  medical: medicalSchema.optional(),
  behavior: behaviorSchema.optional(),
  educationWork: educationWorkSchema.optional(),
  housing: housingSchema.optional(),
  benefitsFinances: benefitsFinancesSchema.optional(),
  socialFaith: socialFaithSchema.optional(),
  legalAdvocacy: legalAdvocacySchema.optional(),
  trustee: trusteeSchema.optional(),
  finalWishes: finalWishesSchema.optional(),
  personalMessage: personalMessageSchema.optional(),

  aboutThem: aboutThemSchema.optional(),
  typicalWeek: typicalWeekSchema.optional(),
  dailyCommunication: dailyCommunicationSchema.optional(),
  healthMedical: healthMedicalSchema.optional(),
  homeLiving: homeLivingSchema.optional(),
  moneyDocuments: moneyDocumentsSchema.optional(),
  workObligations: workObligationsSchema.optional(),
  faithCommunity: faithCommunitySchema.optional(),
  legalDecisions: legalDecisionsSchema.optional(),
  steppingIn: steppingInSchema.optional(),

  // Shared card-data sections (both paths, Phase C wizard registration).
  allergies: allergiesSchema.optional(),
  routines: routinesSchema.optional(),
  foods: foodsSchema.optional(),
  careTasks: careTasksSchema.optional(),
  emergencyPlan: emergencyPlanSchema.optional(),
});

export const letterPathSchema = z.enum(["special-needs", "general"]);

export const letterMetaSchema = z.object({
  startedAt: s,
  updatedAt: s,
  lastVisitedSlug: s,
  finalWishesAck: b,
  /** Which set of questions this letter is being written from. */
  letterPath: letterPathSchema.optional(),
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
export type LetterPath = z.infer<typeof letterPathSchema>;
export type BackupPhoto = z.infer<typeof backupPhotoSchema>;
export type Backup = z.infer<typeof backupSchema>;

export type SectionKey = keyof LetterData;

export const sectionKeys = Object.keys(letterDataSchema.shape) as SectionKey[];

/** Per-section schemas, addressable by key (used by tests and the form layer). */
export const sectionSchemas = {
  gettingStarted: gettingStartedSchema,
  about: aboutSchema,
  familySupport: familySupportSchema,
  typicalDay: typicalDaySchema,
  communication: communicationSchema,
  medical: medicalSchema,
  behavior: behaviorSchema,
  educationWork: educationWorkSchema,
  housing: housingSchema,
  benefitsFinances: benefitsFinancesSchema,
  socialFaith: socialFaithSchema,
  legalAdvocacy: legalAdvocacySchema,
  trustee: trusteeSchema,
  finalWishes: finalWishesSchema,
  personalMessage: personalMessageSchema,

  aboutThem: aboutThemSchema,
  typicalWeek: typicalWeekSchema,
  dailyCommunication: dailyCommunicationSchema,
  healthMedical: healthMedicalSchema,
  homeLiving: homeLivingSchema,
  moneyDocuments: moneyDocumentsSchema,
  workObligations: workObligationsSchema,
  faithCommunity: faithCommunitySchema,
  legalDecisions: legalDecisionsSchema,
  steppingIn: steppingInSchema,

  allergies: allergiesSchema,
  routines: routinesSchema,
  foods: foodsSchema,
  careTasks: careTasksSchema,
  emergencyPlan: emergencyPlanSchema,
} as const;

export const BACKUP_APP_ID = "twl-letter-of-intent" as const;
export const BACKUP_VERSION = 1;
