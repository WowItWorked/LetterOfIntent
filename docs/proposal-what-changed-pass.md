# Proposal: the "what changed?" pass (§2.6d.7 — NOT BUILT, awaiting approval)

The brief asks for a proposal, not a build: a review pass that walks only the
volatile fields rather than asking a family to re-read the whole letter.
Everything below is design; no code exists for it.

## What it would be

A short guided sequence, entered from two places:

- The "welcome back" card on /letter, when the letter's `letterDate` is more
  than six months old: "It has been a while. Walk through what usually
  changes, about five minutes."
- A "What changed?" button beside the reminder options on Review & download.

The pass shows one screen per volatile cluster, each displaying the CURRENT
stored answers with two actions per item: "Still right" and "Update", where
Update deep-links into the section with the field focused. Nothing re-asks
what has not changed; the family confirms or jumps.

## The volatile clusters, in walk order

1. **Medications** — `health.medications` (the fastest-rotting data in the letter)
2. **The people** — `familySupport.contacts` (phones, roles, who is first call)
3. **Providers and pharmacy** — `health.providers`, `health.pharmacy`,
   `health.preferredHospital`
4. **Program, school, or work** — `schoolWork.currentProgram`,
   `schoolWork.currentWork`, `schoolWork.keyPeople`
5. **Where they live** — `home.currentLiving`, `home.householdHelp`
6. **Benefits and legal authority** — `moneyBenefits.benefits`,
   `legal.powersOfAttorney`, `legal.whoDecidesWhat`

(Exact field list to be settled at build time from the canonical roster; the
cluster shape is the proposal.)

## What it writes

- Confirming a cluster stamps a new `lastConfirmedAt` per cluster in `meta`
  (schema addition, migration-safe: optional field, absent means never).
- Finishing the pass updates `gettingStarted.letterDate` to today, so the
  printed "Last updated" line reflects the review, and nudges the fresh
  download: "Your documents are older than these answers now."

## Why this shape

- It matches how the letter actually rots: contacts and medications drift
  quietly; final wishes do not.
- "Still right" is one tap, so a five-minute pass is honest, and the deep
  link means updating never re-types anything.
- Every screen is the existing section machinery re-entered; the only new UI
  is the checklist shell, so the estimate is small: one component, one route
  (/letter/refresh), meta plumbing, e2e for confirm-vs-update, axe.

## Cost and risks

- Rough size: a day's work with tests. No new privacy surface (no network).
- Risk: a second way to edit invites drift between the pass and the wizard.
  Mitigated by making Update navigate INTO the wizard rather than editing in
  place: one editor, always.
- Risk: `letterDate` auto-update surprises a family who confirmed without
  reading. Mitigated by stamping only when every cluster was visited.

## Recommendation

Build it, but only after the reminder-email service decision: if the yearly
email ever switches on, the email should link straight to this pass, and
building them together makes the email worth sending.
