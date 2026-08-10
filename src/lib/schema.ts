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
  email: s,
  role: s,
  emergency: b,
  notes: s,
});

export const providerSchema = z.object({
  id: s,
  name: s,
  specialty: s,
  phone: s,
});

export const medicationSchema = z.object({
  id: s,
  name: s,
  dose: s,
  purpose: s,
});

/* ----------------------------------------------------------------- sections */

export const gettingStartedSchema = z.object({
  authorName: s,
  authorRelationship: s,
  subjectFullName: s,
  subjectPreferredName: s,
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
} as const;

export const BACKUP_APP_ID = "twl-letter-of-intent" as const;
export const BACKUP_VERSION = 1;
