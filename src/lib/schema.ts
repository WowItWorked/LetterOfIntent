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
});

export const letterMetaSchema = z.object({
  startedAt: s,
  updatedAt: s,
  lastVisitedSlug: s,
  finalWishesAck: b,
});

/** Envelope written by "Export a backup" and read by "Import a backup". */
export const backupSchema = z.object({
  app: z.literal("twl-letter-of-intent"),
  version: z.number(),
  exportedAt: s,
  data: letterDataSchema,
  meta: letterMetaSchema.optional(),
});

export type Contact = z.infer<typeof contactSchema>;
export type Provider = z.infer<typeof providerSchema>;
export type Medication = z.infer<typeof medicationSchema>;
export type LetterData = z.infer<typeof letterDataSchema>;
export type LetterMeta = z.infer<typeof letterMetaSchema>;
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
} as const;

export const BACKUP_APP_ID = "twl-letter-of-intent" as const;
export const BACKUP_VERSION = 1;
