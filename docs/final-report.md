# Final report: one adaptive form, four outputs (brief §5)

State at this report: main is at commit 1f51a60, gate green (lint clean, tsc
clean, production build clean, 283 unit tests, 165 e2e tests across desktop
and 375px mobile, axe WCAG 2.1 AA sweep included).

---

## 1. What changed, and why

**The schema collapsed from two rosters (30 sections, 155 fields) to one
canonical roster: 21 sections, 134 fields** (`src/lib/schema.ts`). Every
surviving key kept its old name so backups stay readable without a rename
table. The special-needs path contributed the structured card sections
(allergies, emergency plan, routines, foods, care tasks); the general path
contributed the aging-specific prose (what they will not admit, household
drift, deferred maintenance, scam pressure). `LetterData` gained `marks`
(not applicable, come back, combined) so a family's decisions about
questions are data, not absence.

**Routing became ten onboarding answers** stored in `meta`
(`docs/onboarding-questions.md`): audience, stage, one ordinal support
level, and topical yes/nos (communication, behavior, cognition, trust,
benefits, school/work, living situation). Sections and fields carry
declarative `showWhen` gates (OR of ANDs, content always overrides) and
`variants` (adaptive label/help/placeholder/example). The configuration is
computed, never stored, so changing an answer re-fits the form losslessly.

**The two-path migration** (`src/lib/migrate.ts`): every one of the 155 v1
fields has a mapped destination. When both old shapes populated the same
canonical field, the texts concatenate with a visible separator and the
field is marked `combined`: no silent choosing, zero data loss, proven
field-by-field by `it.each` over all 17 merged pairs. v1 backups import
forever. Onboarding answers are inferred from old letters as pre-fills the
family can correct.

**Four outputs became projections of the one schema**
(`src/lib/pdf/projections.ts`, `docs/output-matrix.md` as executable data):

- **Letter of Intent** (trustee): narrowed to money, legal, decision
  authority, and enough of the person for judgment.
- **Letter for the Caregiver** (new): daily life, communication, behavior,
  health as lived, with the key-points page up front.
- **Emergency Information Sheet**: rebuilt on canonical mappings, three
  shipped defects fixed (below).
- **Care Cards**: unchanged phone PNGs plus the new print-at-home PDF
  (wallet and 4x6 layouts, crop marks, the index card as final sheet).

An integrity test asserts every one of the 134 fields lands in at least one
output: nothing a family writes can vanish.

**The site stopped speaking "two forms" everywhere**, time estimates are
gone except "Start with ten minutes", and the samples went live: two
fixture families (`src/lib/content/samples/`) generate every sample
document on the visitor's device through the real pipeline, watermarked
SAMPLE, downloadable, incapable of going stale. The card gallery shows
Danny Ruiz, the same family as the sample letters.

**The letter became readable while being written**: one HTML renderer
(`LetterReading`) behind the review print view and the new `/letter/read`
route, where unwritten sections appear as gentle gaps naming what a reader
would not yet know, never what the writer failed to do.

## 2. The three fixed defects

All three lived in the shipped emergency sheet's derive layer, all three
are now structurally impossible (zero path conditionals in
`emergencyInfo()`), and each has a named regression test in
`src/lib/derive.test.ts`:

1. **Protocol printed appointment logistics.** The general path mapped the
   sheet's emergency-protocol line from `appointmentHelp` ("someone has to
   go in with him and write it down" under a 2am emergency heading). Now:
   `protocol: responseSteps ?? emergencyProtocol`. Test: "DEFECT 1 —
   protocol never reads appointmentHelp".
2. **Insurance printed the records location.** The sheet's Insurance line
   read `recordsLocation` (a fireproof box description where an ER expects
   a plan name). Now: `insurance: insurancePlans`, records stay under
   records. Test: "DEFECT 2 — the Insurance heading never reads
   recordsLocation".
3. **Triggers never printed.** The general path hardcoded
   `triggers: undefined`, so written triggers vanished from the sheet. Now
   `behavior.triggers` is the one source and prints whenever present.
   Test: "DEFECT 3 — triggers print whenever they exist, for every
   configuration".

The same pass fixed the letter's key-points page sharing one slot between
"never change" and "hard limits": they are now two boxes.

## 3. Judgment calls (review these)

Voice, positioning, and scope decisions I made for you:

1. **"Letter for the Caregiver"** as the second document's name (you chose
   two documents; the name was mine).
2. **The key-points page moved** from the trustee letter to the front of
   the caregiver letter: it is first-five-minutes material, and the
   trustee letter now opens with the person instead.
3. **The trustee letter narrowed**: daily-care mechanics (routines, foods,
   personal care) print only in the caregiver letter. A trustee-only
   family still gets them via the emergency sheet and cards.
4. **Ten onboarding questions, not the brief's six**: flagged at
   Checkpoint 1, accepted.
5. **Four §0 "duplicate" pairs kept apart** because they failed the
   brief's own merge test (same data, different question): documented in
   docs/schema-migration.md.
6. **`legal.decisionStatus` is stored and printed but never asked**: the
   old composite question's prose spans four sharper questions now.
7. **The combined-collision separator** is a visible "· · ·" line, so a
   family can see the seam and edit it out.
8. **Sample families**: names, diagnoses, and texture of the Ruiz and Hale
   letters are mine (approved as prose at Checkpoint 3); the gallery's
   Danny card set required sizing decisions (Carmen carries only the
   legal-guardian role; the emergency card carries ONE scenario, the
   missing-bus story, because the peanut response already lives in its
   Allergies, Rescue medication, and Call 911 blocks and the duplicate
   overflowed the card frame).
9. **Samples download on demand** (generated client-side, SAMPLE
   watermark); the static `public/samples/` files are deleted.
10. **Backup nudge thresholds**: first at three started sections, again
    after six more, dismissible forever.
11. **Reading gaps are consequence-phrased** ("A caregiver would not yet
    know what to do if something goes wrong"), print-hidden, and a
    not-applicable mark shows nothing at all.
12. **Update triggers**: the review page now leads with life events (move,
    diagnosis, medication, program or job, caregiver change, illness or
    death in the network, benefits or legal change, hospital stay) and
    frames the yearly reminder as the backstop. The eyebrow "One year from
    today" became "Keeping it current".
13. **The §2.6b variant additions** (this last commit): where a
    DD-flavored example could reach the aging configuration through an
    ungated field or an OR gate, I added a mostly-independent variant
    (communication.pain, emergencyPlan.responseSteps, moneyBenefits.trusts
    including its help, legal.advocacyHistory,
    personalMessage.toCaregivers); "To their siblings" is relabeled "To
    the rest of the family" for the pole where the writer IS the sibling;
    and the two aging-voiced caregiver-guidance examples gained
    high-support mirrors so neither pole reads the other's life as the
    model answer.

## 4. What the collapse cost: the caregiver branch, three ways

Counts are computed from the real config (sections in play, fields asked,
empty letter), not estimated.

**(a) A parent writing about a nonverbal adult child** (round-the-clock,
communication differs, behavior escalates, benefits, school program,
lives with the writer): **20 sections, 116 fields.** Everything sharp is
present: behavior support with law-enforcement guidance, sensory and
comfort-object fields in typical days, `how`/`yesNo` communication,
personal care, the school branch. Correctly hidden: trustee guidance (they
chose the caregiver letter), work-branch questions, the aging fields
(wontAdmit, householdHelp, deferred maintenance, hard conversations).
Where the gating guesses: `trusts` still shows on "not sure", which is
right; `waiverStatus` and `ableAccount` show whenever benefits do, which
is right for this family.

**(b) A daughter writing about her grandmother with early memory change**
(mostly independent, benefits, her own home): **17 sections, 103 fields.**
Correctly hidden: behavior support, personal care, school and work, the
sensory/comfort/clothing fields, `how`/`yesNo`. Correctly present and
aging-worded: typical days and communication carry variant titles;
wontAdmit, hardConversations, householdHelp, deferred, theHome all
appear; after this last commit her "See an example" answers are in her
life's register everywhere they were not. Where the gating guesses:
**`ableAccount` appears for her** because it rides `hasBenefits` alone,
but ABLE accounts require disability onset before age 26, so for a
79-year-old this question is almost always noise (flagged in §5);
`waiverStatus` appears in the home section for every pole (defensible,
HCBS waivers exist for aging, but the label leans DD); `repPayee` is
legitimate for her (Social Security retirement has rep payees).

**(c) A husband writing about his wife after a recent diagnosis**
(some daily help, cognition changing, still working, no trust yet):
**19 sections, 109 fields.** The blend mostly lands: work branch with
wind-down planning, hard conversations, personal care present, behavior
absent. Where the gating guesses hardest: this family sits between the
poles, so the sensory, comfort-object, and clothing fields are hidden
(gated to the DD pole) even though a wife with, say, progressive
neurological illness may need exactly those; and `guardianship` is asked
while spousal decision-making usually runs through POA, so the question
can read a half-step alarming. **What got blander in the merge**: nothing
was deleted, but the always-on sections (emergency plan, allergies,
routines, foods) must speak to every pole at once, so their intros are
necessarily more neutral than a single-audience form could be; the
sharpness now lives in the examples and variants rather than the field
prose.

## 5. What you should reconsider

1. **The §0 audit was partly stale**: the care-card system it asked for
   already existed, and four claimed duplicates failed the merge test.
   Resolved via Option C and documentation, but worth knowing the brief's
   inventory drifted from the shipped product.
2. **"Six or so follow-ups" was optimistic**: ten questions is the honest
   floor for this range, and I would not try to compress further; the
   three-persona walkthrough above is the evidence the ten are earning
   their places.
3. **`ableAccount` gating**: recommend either a `supportLevel:
   mostlyIndependent` variant of the help that says plainly it applies
   only if the disability began before 26, or a tighter gate. Cheap
   either way; I did not decide this for you because hiding a money
   question is the kind of call the brief reserves.
4. **The behavior section is one gate from the granddaughter failure**:
   an aging-pole family that answers "behavior escalates: yes" (sundowning
   is real) reads a young autistic man's crisis manual, autism ID card and
   all. The §2.6b pass did not touch it because the stated aging
   configuration answers "no", but if you believe that pairing occurs,
   the section needs cognition-flavored variants.
5. **The reminder email panel** still promises a service that does not
   exist. It says so honestly, but every month it stays dark it costs a
   little trust; either schedule the service or consider folding the
   panel.

## 6. What I did not do, and what it would take

1. **The "what changed?" pass**: proposed only, per the brief. Design and
   cost in `docs/proposal-what-changed-pass.md`. Roughly a day with tests;
   recommend building it together with the reminder email so the email
   has somewhere to send people.
2. **A dedicated "first five minutes" view**: `keyPoints()` and
   `emergencyInfo()` exist and open the caregiver letter, but there is no
   standalone on-screen presentation. It would be a panel atop
   `/letter/read` rendering those two derivations; half a day including
   axe and tests.
3. **DD-side variants for the remaining one-directional wording**:
   `legal.whoDecidesWhat`'s aging example, the `moneyBenefits.programs`
   and `legal.advocates` placeholders, and the `ableAccount` help (item 5.3).
   An hour each with the sync tests as the guard.
4. **The reminder email service** itself: out of scope by design (no
   backend exists, which is the privacy promise; it would have to be a
   separate consented system).
5. **The explainer video**: it still describes the old flow; you said you
   would re-record it once the two-letter split landed. (The review
   screen's old "All three files" lead, which undercounted the set, is
   fixed in this commit: it now says "Every file in your set" and counts
   nothing.)

---

*Everything above is on main through 1f51a60; the contract docs
(schema-migration, output-matrix, onboarding-questions, the two
sample-family files, and the what-changed proposal) live beside this
report in docs/.*
