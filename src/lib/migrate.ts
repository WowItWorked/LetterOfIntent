import type { LetterData, LetterMeta, SectionKey } from "@/lib/schema";

/**
 * v1 → v2 migration: both old path shapes onto the canonical schema.
 *
 * Runs on RAW parsed JSON, before any zod validation — the canonical schemas
 * would silently strip old field ids, and stripping is data loss. The
 * complete field accounting lives in docs/schema-migration.md; every mapping
 * here is a row from that table.
 *
 * The one rule that matters: NOTHING IS LOST. A stored v1 letter can hold
 * content on both sides of a merged pair (path switching was a link click),
 * so every merged scalar follows the collision rule: one side → it moves;
 * identical → one copy; both differ → concatenate with a visible separator,
 * the letter's own path first, and mark the field "combined" so the family
 * can reconcile it on their next visit. Software never picks.
 *
 * Idempotent by construction: canonical data carries no v1 keys, so a second
 * pass finds nothing to move.
 */

/** Visible join between two preserved answers. Plain enough for any PDF. */
export const COMBINED_SEPARATOR = "\n\n· · ·\n\n";

type Raw = Record<string, unknown>;

/** old field id → [canonical section, canonical field] */
type SectionMoves = Record<string, [SectionKey, string]>;

/* ------------------------------------------------------------------ tables */

/**
 * Sections whose raw object copies over untouched: canonical key, canonical
 * shape (v1 and v2 agree), or canonical-only keys a v1 file never wrote.
 */
const PASSTHROUGH: readonly string[] = [
  "gettingStarted",
  "familySupport",
  "behavior",
  "finalWishes",
  "personalMessage",
  "allergies",
  "routines",
  "foods",
  "careTasks",
  "emergencyPlan",
  // Canonical-only keys — present only in v2 data, which passes through.
  "person",
  "routine",
  "health",
  "home",
  "schoolWork",
  "moneyBenefits",
  "legal",
  "communityFaith",
  "trusteeGuidance",
  "caregiverGuidance",
];

/** Special-needs path sections (processed first unless the letter's path was general). */
const SN_MOVES: Record<string, SectionMoves> = {
  about: {
    dateOfBirth: ["person", "dateOfBirth"],
    diagnoses: ["health", "conditions"],
    lifeHistory: ["person", "history"],
    firstFiveMinutes: ["person", "firstFiveMinutes"],
    importantToKnow: ["person", "importantToKnow"],
  },
  typicalDay: {
    morningRoutine: ["routine", "mornings"],
    eveningRoutine: ["routine", "evenings"],
    sleep: ["routine", "sleep"],
    food: ["routine", "food"],
    clothing: ["routine", "clothing"],
    sensory: ["routine", "sensory"],
    comfortObjects: ["routine", "comfortObjects"],
    goodDay: ["routine", "goodDay"],
    hardDay: ["routine", "hardDay"],
  },
  /**
   * The one old key that is ALSO a canonical key with a different field set.
   * Every canonical field maps to itself so v2 data flows through unharmed;
   * the two renamed fields land on their canonical ids.
   */
  communication: {
    how: ["communication", "how"],
    howToSpeak: ["communication", "howToSpeak"],
    yesNo: ["communication", "yesNo"],
    hearingVisionMemory: ["communication", "hearingVisionMemory"],
    pain: ["communication", "pain"],
    wontAdmit: ["communication", "wontAdmit"],
    overwhelm: ["communication", "overwhelm"],
    hardConversations: ["communication", "hardConversations"],
    whatHelps: ["communication", "whatHelps"],
    whatToAvoid: ["communication", "whatToAvoid"],
    whatToSay: ["communication", "whatHelps"],
    whatNotToSay: ["communication", "whatToAvoid"],
  },
  medical: {
    providers: ["health", "providers"],
    medications: ["health", "medications"],
    allergies: ["health", "allergies"],
    emergencyProtocol: ["health", "emergencyProtocol"],
    therapies: ["health", "therapies"],
    equipment: ["health", "equipment"],
    insurance: ["health", "insurancePlans"],
    preferredHospital: ["health", "preferredHospital"],
    whatWorked: ["health", "whatWorked"],
    whatDidNot: ["health", "whatDidNot"],
  },
  educationWork: {
    currentProgram: ["schoolWork", "currentProgram"],
    iepHistory: ["schoolWork", "iepHistory"],
    whatWorksLearning: ["schoolWork", "whatWorksLearning"],
    workHistory: ["schoolWork", "workHistory"],
    jobSupports: ["schoolWork", "jobSupports"],
    hopes: ["schoolWork", "hopes"],
  },
  housing: {
    currentLiving: ["home", "currentLiving"],
    supportLevel: ["home", "supportLevel"],
    waiverStatus: ["home", "waiverStatus"],
    futureHopes: ["home", "futureHopes"],
    hardLimits: ["home", "hardLimits"],
  },
  benefitsFinances: {
    programs: ["moneyBenefits", "programs"],
    repPayee: ["moneyBenefits", "repPayee"],
    ableAccount: ["moneyBenefits", "ableAccount"],
    trusts: ["moneyBenefits", "trusts"],
    pending: ["moneyBenefits", "pending"],
    whereRecordsKept: ["moneyBenefits", "whereRecordsKept"],
  },
  socialFaith: {
    friends: ["communityFaith", "friends"],
    activities: ["communityFaith", "activities"],
    faith: ["communityFaith", "faith"],
    traditions: ["communityFaith", "traditions"],
    travel: ["communityFaith", "travel"],
    joy: ["communityFaith", "joy"],
  },
  legalAdvocacy: {
    decisionStatus: ["legal", "decisionStatus"],
    advocates: ["legal", "advocates"],
    attorney: ["legal", "professionals"],
    advocacyHistory: ["legal", "advocacyHistory"],
  },
  trustee: {
    moneyIsFor: ["trusteeGuidance", "moneyIsFor"],
    easyYeses: ["trusteeGuidance", "easyYeses"],
    spendVsPreserve: ["trusteeGuidance", "spendVsPreserve"],
    scrutinize: ["trusteeGuidance", "scrutinize"],
    wishesVsSafety: ["trusteeGuidance", "wishesVsSafety"],
    consultFirst: ["trusteeGuidance", "consultFirst"],
  },
};

/** General path sections. */
const GENERAL_MOVES: Record<string, SectionMoves> = {
  aboutThem: {
    dateOfBirth: ["person", "dateOfBirth"],
    whoTheyAre: ["person", "whoTheyAre"],
    history: ["person", "history"],
    temperament: ["person", "temperament"],
    cannotAbide: ["person", "cannotAbide"],
    strangersGetWrong: ["person", "strangersGetWrong"],
  },
  typicalWeek: {
    mornings: ["routine", "mornings"],
    evenings: ["routine", "evenings"],
    fixedPoints: ["routine", "fixedPoints"],
    gettingAround: ["routine", "gettingAround"],
    food: ["routine", "food"],
    goodDay: ["routine", "goodDay"],
    hardDay: ["routine", "hardDay"],
  },
  dailyCommunication: {
    howToSpeak: ["communication", "howToSpeak"],
    hearingVisionMemory: ["communication", "hearingVisionMemory"],
    wontAdmit: ["communication", "wontAdmit"],
    hardConversations: ["communication", "hardConversations"],
    whatHelps: ["communication", "whatHelps"],
    whatToAvoid: ["communication", "whatToAvoid"],
  },
  healthMedical: {
    providers: ["health", "providers"],
    medications: ["health", "medications"],
    conditions: ["health", "conditions"],
    allergies: ["health", "allergies"],
    pharmacy: ["health", "pharmacy"],
    preferredHospital: ["health", "preferredHospital"],
    appointmentHelp: ["health", "appointmentHelp"],
    recordsLocation: ["health", "recordsLocation"],
  },
  homeLiving: {
    theHome: ["home", "theHome"],
    deferred: ["home", "deferred"],
    householdHelp: ["home", "householdHelp"],
    personalCare: ["home", "personalCare"],
    petsAndPlants: ["home", "petsAndPlants"],
    safety: ["home", "safety"],
  },
  moneyDocuments: {
    whoHandlesBills: ["moneyBenefits", "whoHandlesBills"],
    howBillsArePaid: ["moneyBenefits", "howBillsArePaid"],
    incomeSources: ["moneyBenefits", "incomeSources"],
    whereDocumentsKept: ["moneyBenefits", "whereRecordsKept"],
    vulnerabilities: ["moneyBenefits", "vulnerabilities"],
    advisors: ["legal", "professionals"],
  },
  workObligations: {
    currentWork: ["schoolWork", "currentWork"],
    commitments: ["schoolWork", "commitments"],
    keyContacts: ["schoolWork", "keyContacts"],
    windDown: ["schoolWork", "windDown"],
  },
  faithCommunity: {
    faith: ["communityFaith", "faith"],
    congregation: ["communityFaith", "congregation"],
    friendsAndNeighbors: ["communityFaith", "friends"],
    traditions: ["communityFaith", "traditions"],
    pleasures: ["communityFaith", "joy"],
  },
  legalDecisions: {
    powersOfAttorney: ["legal", "powersOfAttorney"],
    advanceDirectives: ["legal", "advanceDirectives"],
    guardianship: ["legal", "guardianship"],
    whoDecidesWhat: ["legal", "whoDecidesWhat"],
    professionals: ["legal", "professionals"],
  },
  steppingIn: {
    firstWeek: ["caregiverGuidance", "firstWeek"],
    hindsight: ["caregiverGuidance", "hindsight"],
    neverChange: ["caregiverGuidance", "neverChange"],
    consultFirst: ["caregiverGuidance", "consultFirst"],
  },
};

/** Every v1 section key, for "is this a legacy key" checks elsewhere. */
export const V1_ONLY_SECTION_KEYS = [
  ...Object.keys(SN_MOVES),
  ...Object.keys(GENERAL_MOVES),
].filter((k) => k !== "communication");

/* ------------------------------------------------------------------ helpers */

const isObj = (v: unknown): v is Raw =>
  Boolean(v) && typeof v === "object" && !Array.isArray(v);

const asText = (v: unknown): string | undefined => {
  if (typeof v !== "string") return undefined;
  const t = v.trim();
  return t ? v : undefined;
};

function freshId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) return crypto.randomUUID();
  return `item-${Math.random().toString(36).slice(2, 12)}`;
}

/* ------------------------------------------------------------------ migrate */

export interface MigratedLetter {
  data: LetterData;
  /** "section.field" keys where two answers were preserved by concatenation. */
  combined: string[];
}

/**
 * Maps a raw v1 (or already-v2) data object onto the canonical shape.
 * Never drops a word: merged scalars concatenate on conflict, merged
 * repeaters concatenate their arrays.
 */
export function migrateLetterData(rawData: unknown, rawMeta?: unknown): MigratedLetter {
  const raw = isObj(rawData) ? rawData : {};
  const meta = isObj(rawMeta) ? rawMeta : {};
  const out: Record<string, Raw> = {};
  const combined: string[] = [];

  // Bookkeeping first: marks pass through (v2 data), never treated as a section.
  const marks: Record<string, string> = {};
  if (isObj(raw.marks)) {
    for (const [k, v] of Object.entries(raw.marks)) {
      if (typeof v === "string") marks[k] = v;
    }
  }

  for (const key of PASSTHROUGH) {
    if (isObj(raw[key])) out[key] = { ...(raw[key] as Raw) };
  }

  const target = (section: SectionKey): Raw => (out[section] ??= {});

  const moveScalar = (section: SectionKey, field: string, value: string) => {
    const t = target(section);
    const existing = asText(t[field]);
    if (!existing) {
      t[field] = value;
      return;
    }
    if (existing.trim() === value.trim()) return;
    t[field] = `${existing}${COMBINED_SEPARATOR}${value}`;
    const mark = `${section}.${field}`;
    if (!combined.includes(mark)) combined.push(mark);
  };

  const moveArray = (section: SectionKey, field: string, value: unknown[]) => {
    const t = target(section);
    const existing = Array.isArray(t[field]) ? (t[field] as unknown[]) : [];
    const seen = new Set(
      existing.map((r) => (isObj(r) && typeof r.id === "string" ? r.id : "")).filter(Boolean)
    );
    const incoming = value.filter(isObj).map((r) => {
      const id = typeof r.id === "string" && r.id && !seen.has(r.id) ? r.id : freshId();
      seen.add(id);
      return { ...r, id };
    });
    if (incoming.length) t[field] = [...existing, ...incoming];
  };

  const applyMoves = (tables: Record<string, SectionMoves>) => {
    for (const [oldKey, moves] of Object.entries(tables)) {
      const source = raw[oldKey];
      if (!isObj(source)) continue;
      // The canonical-key special case: `communication` is rebuilt from its
      // own moves table, so drop the passthrough copy before re-applying.
      if (oldKey === "communication") delete out.communication;
      for (const [oldField, [section, field]] of Object.entries(moves)) {
        const v = source[oldField];
        if (Array.isArray(v)) moveArray(section, field, v);
        else {
          const text = asText(v);
          if (text) moveScalar(section, field, text);
        }
      }
    }
  };

  // The letter's own path goes first, so its words lead every concatenation.
  const path = typeof meta.letterPath === "string" ? meta.letterPath : "special-needs";
  if (path === "general") {
    applyMoves(GENERAL_MOVES);
    applyMoves(SN_MOVES);
  } else {
    applyMoves(SN_MOVES);
    applyMoves(GENERAL_MOVES);
  }

  for (const mark of combined) marks[mark] = "combined";
  if (Object.keys(marks).length) (out as Raw).marks = marks;

  // Drop sections that ended up empty.
  for (const [k, v] of Object.entries(out)) {
    if (isObj(v) && Object.keys(v).length === 0) delete out[k];
  }

  return { data: out as LetterData, combined };
}

/* ------------------------------------------------------------ meta inference */

const hasAny = (section: unknown, fields?: string[]): boolean => {
  if (!isObj(section)) return false;
  const entries = fields ? fields.map((f) => section[f]) : Object.values(section);
  return entries.some((v) =>
    Array.isArray(v)
      ? v.some((item) => isObj(item) && Object.entries(item).some(([k, x]) => k !== "id" && asText(x)))
      : Boolean(asText(v))
  );
};

/**
 * Routing answers inferred from what a v1 letter actually contains. These are
 * PRE-FILLS for a one-time onboarding pass (`onboardingInferred: true`) —
 * never silent guesses the family cannot see. Sections that already hold
 * content always render regardless of gating, so nothing disappears while
 * the answers wait to be confirmed.
 */
export function inferMetaFromV1(data: LetterData, rawMeta?: unknown): Partial<LetterMeta> {
  const meta = isObj(rawMeta) ? rawMeta : {};
  const path = typeof meta.letterPath === "string" ? meta.letterPath : undefined;
  const d = data as Record<string, Raw | undefined>;

  const anyContent = Object.entries(d).some(([k, v]) => k !== "marks" && hasAny(v));
  if (!anyContent) return {};

  const trusteeContent = hasAny(d.trusteeGuidance);
  const benefits =
    hasAny(d.moneyBenefits, ["programs", "repPayee", "ableAccount", "pending"]) ||
    hasAny(d.home, ["waiverStatus"]);

  const schoolWork: string[] = [];
  if (hasAny(d.schoolWork, ["currentProgram", "iepHistory", "whatWorksLearning"]))
    schoolWork.push("school");
  if (hasAny(d.schoolWork, ["currentWork", "workHistory", "jobSupports", "commitments"]))
    schoolWork.push("work");

  const general = path === "general";
  return {
    audience: general && !trusteeContent ? "caregiver" : "both",
    stage: general ? "adult" : undefined,
    supportLevel: general ? "mostlyIndependent" : "substantial",
    communicationDiffers: hasAny(d.communication, ["how", "yesNo", "overwhelm"])
      ? "yes"
      : general
        ? "no"
        : undefined,
    behaviorEscalates: hasAny(d.behavior) ? "yes" : general ? "no" : undefined,
    cognitionChanging: hasAny(d.communication, ["hearingVisionMemory", "wontAdmit"])
      ? "yes"
      : undefined,
    hasTrust: hasAny(d.moneyBenefits, ["trusts"]) ? "yes" : general ? "no" : undefined,
    hasBenefits: benefits ? "yes" : general ? "no" : undefined,
    schoolWork: schoolWork.length ? schoolWork : undefined,
    livesWith: undefined,
    onboardingDone: false,
    onboardingInferred: true,
  };
}

/**
 * The store's v1 → v2 migration: canonical data plus inferred routing meta.
 * Also the importer's path for v1 backup envelopes — one code path, tested
 * once, trusted everywhere.
 */
export function migrateV1(persisted: { data?: unknown; meta?: unknown }): {
  data: LetterData;
  meta: LetterMeta;
} {
  const { data } = migrateLetterData(persisted.data, persisted.meta);
  const oldMeta = isObj(persisted.meta) ? (persisted.meta as LetterMeta) : {};
  const inferred = inferMetaFromV1(data, persisted.meta);
  // The old single final-wishes ack becomes the general emotional ack.
  const emotionalAcks =
    oldMeta.finalWishesAck === true && !oldMeta.emotionalAcks?.includes("final-wishes")
      ? [...(oldMeta.emotionalAcks ?? []), "final-wishes"]
      : oldMeta.emotionalAcks;
  return { data, meta: { ...oldMeta, ...inferred, ...(emotionalAcks ? { emotionalAcks } : {}) } };
}
