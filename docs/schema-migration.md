# Schema migration: two paths → one canonical schema

Status: **PROPOSED — Checkpoint 1.** Nothing in code implements this yet.

This is the complete accounting demanded by the re-architecture brief (§2.2):
every existing field id across both paths, mapped to exactly one of
`{canonical field, deliberately merged into X, deliberately dropped because Y}`.

**Nothing is dropped.** Every field survives, either as itself, merged, or
legacy-carried (stored and printed, no longer asked).

---

## 1. The canonical schema

21 sections, 134 top-level fields (was 30 section keys, 155 fields).
Repeater item fields (contact.name, medication.dose, …) are identical on both
paths today and carry over unchanged inside their repeaters.

| Canonical section | Fields | Count |
| --- | --- | --- |
| `gettingStarted` | authorName, authorRelationship, subjectFullName, subjectPreferredName, subjectAddress, letterDate | 6 (unchanged) |
| `person` | dateOfBirth, whoTheyAre, history, temperament, firstFiveMinutes, strangersGetWrong, cannotAbide, importantToKnow | 8 |
| `familySupport` | contacts[], firstCall, doNotInvolve | 3 (unchanged) |
| `routine` | mornings, evenings, sleep, food, clothing, sensory, comfortObjects, fixedPoints, gettingAround, goodDay, hardDay | 11 |
| `communication` | how, howToSpeak, yesNo, hearingVisionMemory, pain, wontAdmit, overwhelm, hardConversations, whatHelps, whatToAvoid | 10 |
| `health` | providers[], medications[], conditions, allergies, pharmacy, preferredHospital, emergencyProtocol, appointmentHelp, therapies, equipment, insurancePlans, recordsLocation, whatWorked, whatDidNot | 14 |
| `behavior` | triggers, earlyWarnings, deEscalation, makesWorse, crisisPlan, lawEnforcement | 6 (unchanged) |
| `home` | currentLiving, theHome, supportLevel, householdHelp, personalCare, petsAndPlants, deferred, safety, waiverStatus, futureHopes, hardLimits | 11 |
| `schoolWork` | currentProgram, iepHistory, whatWorksLearning, workHistory, currentWork, jobSupports, commitments, keyContacts, windDown, hopes | 10 |
| `moneyBenefits` | programs, incomeSources, whoHandlesBills, howBillsArePaid, repPayee, ableAccount, trusts, pending, whereRecordsKept, vulnerabilities | 10 |
| `legal` | powersOfAttorney, advanceDirectives, guardianship, whoDecidesWhat, decisionStatus†, advocates, advocacyHistory, professionals | 8 |
| `communityFaith` | friends, activities, joy, faith, congregation, traditions, travel | 7 |
| `trusteeGuidance` | moneyIsFor, easyYeses, spendVsPreserve, scrutinize, wishesVsSafety, consultFirst | 6 |
| `caregiverGuidance` | firstWeek, hindsight, neverChange, consultFirst | 4 |
| `finalWishes` | funeral, restingPlace, religious, organDonation, endOfLife, documentsLocation | 6 (unchanged) |
| `personalMessage` | toCaregivers, toSiblings, toPerson | 3 (unchanged) |
| `allergies` | items[] | 1 (unchanged) |
| `routines` | items[], transitions | 2 (unchanged) |
| `foods` | items[] | 1 (unchanged) |
| `careTasks` | items[] | 1 (unchanged) |
| `emergencyPlan` | responseSteps, scenarios[], call911When, otherwiseCall, ifNoOneAnswers, otcPolicy | 6 (unchanged) |

† `legal.decisionStatus` is **legacy-carried**: stored, printed in the letters
under "Decision-making status" when it has content, quoted above the four
sharper legal questions via the existing legacyRefs mechanism — but never asked
again. Its prose spans all four new questions, so no single migration target
can hold it without mis-filing someone's words.

`meta` gains the routing answers (never letter content):
`audience`, `stage`, `hasTrust`, `hasBenefits`, `supportLevel`,
`communicationDiffers`, `behaviorEscalates`, `cognitionChanging`,
`schoolWork`, `livesWith` — see `docs/onboarding-questions.md`.

### Departures from the brief's proposed shape (§2.1), with reasons

1. **No `writer`/`people` split; `gettingStarted` and `familySupport` keep
   their keys and shapes.** Splitting six settled fields into two three-field
   sections churns the store key of the most valuable repeater in the product
   (contacts) for naming aesthetics. Canonical keys keep existing keys wherever
   the section survives intact — migration safety over tidiness.
2. **`insuranceWhereKept` is wrong; the canonical field is `insurancePlans`.**
   The existing special-needs question asks for *plan names* ("Anthem through
   Dad's employer"), not where the card lives — its help text explicitly defers
   where-kept to the benefits section. The brief's proposed name would silently
   change what the question asks. `health.recordsLocation` (where cards,
   records, directives are kept) stays separate, exactly as the brief intends.
3. **The brief's proposed `communication` omits `wontAdmit`** while §1 lists
   `dailyCommunication.wontAdmit` as must-survive. It survives:
   `communication.wontAdmit`.
4. **The brief's proposal omits the five card-data sections entirely**
   (`allergies`, `routines`, `foods`, `careTasks`, `emergencyPlan`) — its audit
   predates Care Cards. They are already canonical (shared, no path variants)
   and carry over unchanged. `emergencyPlan.responseSteps` also resolves what
   the emergency-sheet "protocol" prints from — see the output matrix.
5. **`person.importantToKnow` is kept** (the brief's proposal dropped it): a
   catch-all costs nothing and holds real content in live letters.
6. **`schoolWork` keeps `currentProgram` and `currentWork` as separate
   fields** (the brief merged work into the section but not the field
   question): a transition-age adult can have both a day program and a job.
7. **`hopes` and `futureHopes` stay two fields** (days vs. home), matching the
   brief's own home/schoolWork split.

---

## 2. Migration table — every existing field

Legend: **→** carried to canonical (same text, possibly renamed) ·
**⇒ MERGE** two old fields become one canonical field (collision rule §4).

### Shared sections (identical on both paths — no change, no risk)

| Old field | Disposition |
| --- | --- |
| gettingStarted.authorName, .authorRelationship, .subjectFullName, .subjectPreferredName, .subjectAddress, .letterDate | → unchanged |
| familySupport.contacts[], .firstCall, .doNotInvolve | → unchanged |
| finalWishes.funeral, .restingPlace, .religious, .organDonation, .endOfLife, .documentsLocation | → unchanged |
| personalMessage.toCaregivers, .toSiblings, .toPerson | → unchanged |
| allergies.items[] · routines.items[], .transitions · foods.items[] · careTasks.items[] | → unchanged |
| emergencyPlan.responseSteps, .scenarios[], .call911When, .otherwiseCall, .ifNoOneAnswers, .otcPolicy | → unchanged |

### about (special-needs) + aboutThem (general) → person / health

| Old field | Disposition |
| --- | --- |
| about.dateOfBirth ⇄ aboutThem.dateOfBirth | ⇒ MERGE → person.dateOfBirth (identical question) |
| about.diagnoses ⇄ healthMedical.conditions | ⇒ MERGE → health.conditions (same question, two registers; labels already near-identical: "Diagnoses and conditions" / "Conditions and diagnoses"; adaptive label) |
| about.lifeHistory ⇄ aboutThem.history | ⇒ MERGE → person.history (both draw the biography; adaptive label) |
| about.firstFiveMinutes | → person.firstFiveMinutes |
| about.importantToKnow | → person.importantToKnow |
| aboutThem.whoTheyAre | → person.whoTheyAre — **kept vs. firstFiveMinutes**: a two-minute portrait vs. operational guidance for a stranger's first minutes; different answers |
| aboutThem.temperament | → person.temperament (universal: how they handle being helped) |
| aboutThem.cannotAbide | → person.cannotAbide |
| aboutThem.strangersGetWrong | → person.strangersGetWrong |

### typicalDay (SN) + typicalWeek (general) → routine

| Old field | Disposition |
| --- | --- |
| typicalDay.morningRoutine ⇄ typicalWeek.mornings | ⇒ MERGE → routine.mornings (same question at different scope; adaptive label) |
| typicalDay.eveningRoutine ⇄ typicalWeek.evenings | ⇒ MERGE → routine.evenings |
| typicalDay.food ⇄ typicalWeek.food | ⇒ MERGE → routine.food (adaptive label; stays the Food card's legacy fallback) |
| typicalDay.goodDay ⇄ typicalWeek.goodDay | ⇒ MERGE → routine.goodDay (identical) |
| typicalDay.hardDay ⇄ typicalWeek.hardDay | ⇒ MERGE → routine.hardDay ("describe a hard day" / "what a hard day needs" draw the same answer; adaptive label) |
| typicalDay.sleep | → routine.sleep |
| typicalDay.clothing | → routine.clothing |
| typicalDay.sensory | → routine.sensory |
| typicalDay.comfortObjects | → routine.comfortObjects |
| typicalWeek.fixedPoints | → routine.fixedPoints |
| typicalWeek.gettingAround | → routine.gettingAround |

### communication (SN) + dailyCommunication (general) → communication

| Old field | Disposition |
| --- | --- |
| communication.how | → communication.how — **kept vs. howToSpeak** (brief's own worked example: opposite directions) |
| dailyCommunication.howToSpeak | → communication.howToSpeak |
| communication.yesNo | → communication.yesNo |
| dailyCommunication.hearingVisionMemory | → communication.hearingVisionMemory (must-survive) |
| communication.pain | → communication.pain — **kept vs. wontAdmit**: involuntary signs of pain in someone who cannot report it vs. deliberate non-disclosure by someone who can but will not; different answers. (The brief's §0 table listed these as duplicates — the emergency sheet's current mis-wiring is what made them look alike.) |
| dailyCommunication.wontAdmit | → communication.wontAdmit (must-survive) |
| communication.overwhelm | → communication.overwhelm — **kept vs. hardConversations**: escalation warning signs vs. unfinished difficult subjects; different answers |
| dailyCommunication.hardConversations | → communication.hardConversations |
| communication.whatToSay ⇄ dailyCommunication.whatHelps | ⇒ MERGE → communication.whatHelps (both draw "how to make talking work"; adaptive label) |
| communication.whatNotToSay ⇄ dailyCommunication.whatToAvoid | ⇒ MERGE → communication.whatToAvoid (same question; adaptive label) |

### medical (SN) + healthMedical (general) → health

| Old field | Disposition |
| --- | --- |
| medical.providers[] ⇄ healthMedical.providers[] | ⇒ MERGE → health.providers[] (field-for-field identical; arrays concatenate, current path's records first) |
| medical.medications[] ⇄ healthMedical.medications[] | ⇒ MERGE → health.medications[] (identical; concatenate) |
| medical.allergies ⇄ healthMedical.allergies | ⇒ MERGE → health.allergies (identical; stays legacy fallback under allergies.items) |
| medical.preferredHospital ⇄ healthMedical.preferredHospital | ⇒ MERGE → health.preferredHospital (identical) |
| medical.emergencyProtocol | → health.emergencyProtocol — **kept vs. appointmentHelp** (the shipped defect; never merged) |
| healthMedical.appointmentHelp | → health.appointmentHelp |
| medical.insurance | → health.insurancePlans (renamed for honesty: it asks plan *names*) — **kept vs. recordsLocation** |
| healthMedical.recordsLocation | → health.recordsLocation |
| healthMedical.pharmacy | → health.pharmacy |
| medical.therapies | → health.therapies |
| medical.equipment | → health.equipment |
| medical.whatWorked | → health.whatWorked |
| medical.whatDidNot | → health.whatDidNot |

### behavior (SN only) → behavior

All six fields unchanged: triggers, earlyWarnings, deEscalation, makesWorse,
crisisPlan, lawEnforcement. Gated by the behavior-escalation follow-up, never
by "path."

### housing (SN) + homeLiving (general) → home

| Old field | Disposition |
| --- | --- |
| housing.currentLiving | → home.currentLiving — **kept vs. theHome**: the living *arrangement* vs. the house's *operating manual*; different answers. (The brief's §0 table paired them — the pairing fails the merge test.) |
| homeLiving.theHome | → home.theHome |
| housing.supportLevel | → home.supportLevel |
| housing.waiverStatus | → home.waiverStatus |
| housing.futureHopes | → home.futureHopes |
| housing.hardLimits | → home.hardLimits — **kept vs. homeLiving.safety** (future red lines vs. present hazards) and **kept vs. steppingIn.neverChange** — see §3, "the keyPoints collision is a bug" |
| homeLiving.deferred | → home.deferred (must-survive) |
| homeLiving.householdHelp | → home.householdHelp (must-survive) |
| homeLiving.personalCare | → home.personalCare (prose; stays the Care card's legacy fallback) |
| homeLiving.petsAndPlants | → home.petsAndPlants (must-survive) |
| homeLiving.safety | → home.safety |

### educationWork (SN) + workObligations (general) → schoolWork

| Old field | Disposition |
| --- | --- |
| educationWork.currentProgram | → schoolWork.currentProgram — **kept vs. currentWork**: a person can have both a day program and a job |
| workObligations.currentWork | → schoolWork.currentWork |
| educationWork.iepHistory | → schoolWork.iepHistory |
| educationWork.whatWorksLearning | → schoolWork.whatWorksLearning |
| educationWork.workHistory | → schoolWork.workHistory |
| educationWork.jobSupports | → schoolWork.jobSupports |
| educationWork.hopes | → schoolWork.hopes |
| workObligations.commitments | → schoolWork.commitments |
| workObligations.keyContacts | → schoolWork.keyContacts |
| workObligations.windDown | → schoolWork.windDown (must-survive) |

### benefitsFinances (SN) + moneyDocuments (general) → moneyBenefits / legal

| Old field | Disposition |
| --- | --- |
| benefitsFinances.programs | → moneyBenefits.programs |
| benefitsFinances.repPayee | → moneyBenefits.repPayee — **kept vs. whoHandlesBills**: an SSA-appointed benefits manager vs. who pays the household bills in practice; different answers. (Another §0 pairing that fails the test.) |
| moneyDocuments.whoHandlesBills | → moneyBenefits.whoHandlesBills |
| benefitsFinances.ableAccount | → moneyBenefits.ableAccount |
| benefitsFinances.trusts | → moneyBenefits.trusts |
| benefitsFinances.pending | → moneyBenefits.pending |
| benefitsFinances.whereRecordsKept ⇄ moneyDocuments.whereDocumentsKept | ⇒ MERGE → moneyBenefits.whereRecordsKept (same question — where the important papers live; adaptive label) |
| moneyDocuments.howBillsArePaid | → moneyBenefits.howBillsArePaid |
| moneyDocuments.incomeSources | → moneyBenefits.incomeSources |
| moneyDocuments.vulnerabilities | → moneyBenefits.vulnerabilities (must-survive) |
| moneyDocuments.advisors | ⇒ MERGE (3-way) → legal.professionals — see next table |

### legalAdvocacy (SN) + legalDecisions (general) → legal

| Old field | Disposition |
| --- | --- |
| legalDecisions.powersOfAttorney | → legal.powersOfAttorney |
| legalDecisions.advanceDirectives | → legal.advanceDirectives |
| legalDecisions.guardianship | → legal.guardianship |
| legalDecisions.whoDecidesWhat | → legal.whoDecidesWhat |
| legalAdvocacy.decisionStatus | → legal.decisionStatus, **legacy-carried** (see §1 note †): its prose spans all four sharper questions, so it is stored, printed, and quoted above them — never re-asked, never split by software |
| legalAdvocacy.advocates | → legal.advocates |
| legalAdvocacy.advocacyHistory | → legal.advocacyHistory |
| legalAdvocacy.attorney ⇄ legalDecisions.professionals ⇄ moneyDocuments.advisors | ⇒ MERGE (3-way) → legal.professionals ("Attorney, accountant, and anyone else who helps") — all three draw the professional bench; a general-path letter could hold two of them, so the collision rule applies twice |

### socialFaith (SN) + faithCommunity (general) → communityFaith

| Old field | Disposition |
| --- | --- |
| socialFaith.friends ⇄ faithCommunity.friendsAndNeighbors | ⇒ MERGE → communityFaith.friends (same question; adaptive label) |
| socialFaith.activities | → communityFaith.activities — **kept vs. joy**: what they *do* vs. what *delights*; different answers |
| socialFaith.joy ⇄ faithCommunity.pleasures | ⇒ MERGE → communityFaith.joy (same question, two registers; adaptive label) |
| socialFaith.faith ⇄ faithCommunity.faith | ⇒ MERGE → communityFaith.faith (adaptive help) |
| faithCommunity.congregation | → communityFaith.congregation |
| socialFaith.traditions ⇄ faithCommunity.traditions | ⇒ MERGE → communityFaith.traditions (identical question) |
| socialFaith.travel | → communityFaith.travel |

### trustee (SN) → trusteeGuidance · steppingIn (general) → caregiverGuidance

| Old field | Disposition |
| --- | --- |
| trustee.moneyIsFor, .easyYeses, .spendVsPreserve, .scrutinize, .wishesVsSafety | → trusteeGuidance.* unchanged |
| trustee.consultFirst | → trusteeGuidance.consultFirst — **kept vs. steppingIn.consultFirst**: who a trustee checks with before big money decisions vs. who a caregiver convenes before anything irreversible (selling the house, a move). The question texts differ enough to justify two fields; confirmed against both defs. No id collision: different sections. |
| steppingIn.firstWeek, .hindsight, .neverChange | → caregiverGuidance.* unchanged |
| steppingIn.consultFirst | → caregiverGuidance.consultFirst |

---

## 3. Consolidation ledger

- **Before:** 155 top-level fields across 30 section keys.
- **After:** 134 fields across 21 sections (−21 fields, −9 sections).
- **Merged:** 19 two-way pairs + 1 three-way (attorney/professionals/advisors).
- **Deliberately kept apart** (each recorded above with its test result): 13
  pairs, including every §0 table pairing that fails the "same answer from the
  same person" test — how/howToSpeak, pain/wontAdmit,
  overwhelm/hardConversations, currentLiving/theHome, hardLimits/safety,
  hardLimits/neverChange, repPayee/whoHandlesBills,
  emergencyProtocol/appointmentHelp, insurancePlans/recordsLocation,
  consultFirst×2, currentProgram/currentWork, whoTheyAre/firstFiveMinutes,
  activities/joy.
- **Dropped:** none.

**The hardLimits / neverChange decision (brief §2.2a asked for a ruling):**
they are different questions — housing red lines vs. arrangements that must
outlive the writer — and `keyPoints()` piping both into one output slot is a
**bug**, not evidence of duplication. Both fields survive; the reading view and
letters print them under their own titles.

## 4. Merge-collision rule (v1 → v2 migration)

A stored v1 letter can hold content on **both** sides of any merged pair
(path-switching was a link click). For every merged scalar:

1. If only one side has text → it moves.
2. If both sides have identical trimmed text → one copy moves.
3. If both differ → **concatenate, never pick**: the active path's text first,
   then `\n\n· · ·\n\n`, then the other. Zero words lost.
4. Every concatenation records `marks["section.field"] = "combined"` so the
   form can show a gentle "two answers were combined here — keep what you
   want" notice on next visit, cleared when the family edits the field.
   Card-bound overflow from concatenation degrades gracefully in the card
   generator (truncate + "see the full letter"), per the brief.

Merged repeaters (providers, medications) concatenate arrays, active path's
records first; colliding record ids get fresh ids. The migration test populates
**both** sides of every merged pair and asserts both texts survive.

`meta` inference: old `letterPath: "special-needs"` → audience preserved from
content (trustee section filled → includes trustee), behaviorEscalates
defaults from behavior-section content, etc. Where inference is uncertain the
family sees the onboarding once, pre-filled — never silently guessed, never
re-typed. `BACKUP_VERSION` → 2; the importer accepts v1 envelopes forever.

## 5. The two Checkpoint-1 schema items from §2.6d

**Not-applicable / come-back-to-this.** New top-level `LetterData` key:

```ts
/** "sectionKey" or "sectionKey.fieldId" → mark. Permissive record so a
 *  newer backup never fails to import. */
marks?: Record<string, "not_applicable" | "come_back" | "combined">;
```

- Works per-section AND per-field (a section mark covers all its fields).
- Lives inside `data`, so it travels in backups and the v1 migration
  (v1 letters simply have no marks) with zero extra plumbing.
- Progress counts three states: done · not applicable · outstanding.
- Outputs skip `not_applicable` fields without printing an empty heading; the
  gap-aware reading view never names a not-applicable field as a gap.
- `"combined"` doubles as the merge-review flag (§4).

**Tap-to-add chips + sentence openers.** `FieldDef` additions:

```ts
interface Chip { value: string; /** inline 8th-grade definition */ teach?: string }
interface ScalarField {
  /** Tapping appends value to the field; never a closed list. */
  chips?: readonly Chip[];
  /** Sentence starters for long textareas: "What helps most is…" */
  openers?: readonly string[];
  /** Advisory only, card-bound fields; surfaced softly, never blocking. */
  cardLengthHint?: number;
}
```

Chip sets on genuinely enumerable fields only (programs, therapies, equipment,
allergens, decision instruments); never medications. `teach` carries the
inline definition (ABLE, waiver, rep payee) so the chip educates. Openers are
recommended (they cure the blank-box stare and insert no content); hard rule
preserved: no affordance ever inserts prose content.
