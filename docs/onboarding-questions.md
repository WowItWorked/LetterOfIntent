# Onboarding: the adaptive form's routing questions

Status: **PROPOSED — Checkpoint 1.** Exact wording, answer options, and gating.

These answers live in `meta` (routing state), never in `data` (letter
content). Every answer is changeable later from the wizard rail without losing
a word of written work — gating only hides *unanswered* questions; a gated-off
field that holds content stays visible with its content.

The brief guessed "six or so" follow-ups. The set that actually carries the
range is **the audience question plus nine follow-ups** (hybrid model,
approved): one ordinal gates bulk depth, three topical questions gate the
sharp content, five short facts gate whole topics. Each is one tap; the whole
sequence is under a minute. If ten feels like one axis collapsed too far, the
three topical questions are the ones I would defend to the last — they are
what keeps the granddaughter out of the law-enforcement section and the parent
of an escalating adult in it.

Format below: **id** · question · options `(stored token)` · what it gates.

---

**1. audience** — "Who do you most need this letter to reach?"
- "Whoever will manage money for them — a trustee, or the person who will one
  day take that role" `(trustee)`
- "Whoever will provide day-to-day care — family, or someone paid to help"
  `(caregiver)`
- "Both" `(both)`

Gates: `trusteeGuidance` (trustee/both) · `caregiverGuidance`
(caregiver/both) · which letters generate. A "trust" is defined inline the
first time it appears. "Both" widens outputs; it does not turn off the gating
below.

**2. stage** — "Is {name} a child or an adult?"
- "A child" `(child)`
- "An adult" `(adult)`

Gates: `routine.gettingAround` (driving framing), `schoolWork.currentWork`,
`commitments`, `keyContacts`, `windDown`, `moneyBenefits.whoHandlesBills`,
`howBillsArePaid`, `incomeSources`, `vulnerabilities`, `legal` depth
(POA/directives are adult instruments; a child's legal section leads with
guardianship-at-18 framing). Adaptive wording on many labels.

**3. supportLevel** (the ordinal) — "How much day-to-day support does {name}
need right now?"
- "They mostly manage — someone quietly fills the gaps" `(mostlyIndependent)`
- "Help with parts of every day" `(someDailyHelp)`
- "Hands-on help through most of the day" `(substantial)`
- "Someone with them, or on call, around the clock" `(roundTheClock)`

Gates bulk depth: `careTasks` and `home.personalCare` (someDailyHelp+),
`routine.clothing`, `comfortObjects` (substantial+),
`home.householdHelp`, `home.deferred` (mostlyIndependent/someDailyHelp — the
quietly-filled-gaps questions), `home.supportLevel` label adapts.

**4. communicationDiffers** (topical) — "Does {name} communicate differently
than a stranger might expect — speech that takes knowing them, a device or
app that speaks for them, signs, or mostly without words?"
- "Yes" `(yes)` · "No" `(no)`

Gates: `communication.how`, `yesNo`, `overwhelm`, `routine.sensory`. (The
sharp special-needs communication depth — never gated on support level, per
the approved hybrid.)

**5. behaviorEscalates** (topical) — "Are there moments that can escalate —
meltdowns, wandering or bolting, aggression, or anything that could bring the
police or 911 into it?"
- "Yes" `(yes)` · "No" `(no)`

Gates: the whole `behavior` section (triggers, earlyWarnings, deEscalation,
makesWorse, crisisPlan, lawEnforcement). This question alone is why an
independent grandparent's granddaughter never reads "guidance for police,"
and the parent of an escalating adult always does.

**6. cognitionChanging** (topical) — "Is {name}'s memory or thinking
changing, or do you worry it might be?"
- "Yes" `(yes)` · "Early signs" `(early)` · "No" `(no)`

Gates (yes/early): `communication.hearingVisionMemory`, `wontAdmit`,
`hardConversations`, `moneyBenefits.vulnerabilities` (also gated on by
stage=adult — either opens it), heavier interstitial pacing on
decline-adjacent questions.

**7. hasTrust** — "Is there a trust for {name} — money set aside with
someone appointed to manage it — or a plan to create one?"
- "Yes" `(yes)` · "We're planning one" `(planned)` · "No" `(no)` ·
  "I'm not sure" `(notSure)`

Gates: `moneyBenefits.trusts` (yes/planned/notSure) and strengthens the
trustee-letter recommendation when audience is caregiver-only (the "way back"
to add the trustee output).

**8. hasBenefits** — "Does {name} receive public benefits — SSI, SSDI,
Medicaid, Medicare, or a waiver — or might they apply?"
- "Yes" `(yes)` · "Maybe / applying" `(maybe)` · "No" `(no)`

Gates (yes/maybe): `moneyBenefits.programs`, `repPayee`, `ableAccount`,
`pending`, `home.waiverStatus`, `legal.advocates`, `advocacyHistory`. Each
program name is defined inline where it first appears.

**9. schoolWork** — "Is school, a day program, work, or volunteering part of
{name}'s life?" *(multi-select)*
- "School or a day program" `(school)` · "Work or volunteering" `(work)` ·
  "Neither right now" `(neither)`

Gates: school → `currentProgram`, `iepHistory`, `whatWorksLearning`;
work → `currentWork`, `jobSupports`, `commitments`, `keyContacts`,
`windDown`, `workHistory`. `hopes` shows for all.

**10. livesWith** — "Where does {name} live?"
- "With me" `(withWriter)` · "In their own home" `(ownHome)` ·
  "With family or a roommate" `(withOthers)` ·
  "In a facility or supported residence" `(facility)`

Gates: `home.theHome`, `deferred` (ownHome/withOthers — the operating-manual
questions), `home.safety` framing, `currentLiving` label adapts. A facility
answer trims the household questions entirely.

---

## Ungated (asked in every configuration)

`gettingStarted` · `person` · `familySupport` · routine's mornings, evenings,
sleep, food, fixedPoints, goodDay, hardDay · communication's howToSpeak,
pain, whatHelps, whatToAvoid · health (minus therapies, gated lightly on
supportLevel/benefits) · communityFaith · finalWishes · personalMessage ·
the five card-data sections (all optional-tagged, as today).

## The variance proof (§1's requirement)

- **Nonverbal adult, both, trust, benefits, roundTheClock, commDiff, escalates,
  school:** ~118 of 134 fields in play — behavior, full communication, sensory,
  care tasks, waiver, advocacy, trustee guidance.
- **Independent grandparent, caregiver-only, no trust, no benefits,
  mostlyIndependent, no commDiff, no escalation, cognition early, ownHome:**
  ~88 fields — gains householdHelp, deferred, theHome, wontAdmit,
  hardConversations, vulnerabilities; never sees behavior (6), how/yesNo/
  overwhelm/sensory (4), IEP/jobSupports, programs/repPayee/able/pending/
  waiver (5), advocacy (2), trusteeGuidance (6).

Spread ≈ 30 questions, before repeater effort — inside the 20–30 band the
brief demands, in the right direction on both tails.

## Re-entry rules

- Onboarding answers editable from the rail ("Your answers" card); changing
  one re-gates instantly, loses nothing.
- Skipped-but-relevant sections stay visible and re-enterable; hiding is only
  for not-asked questions.
- A gated-off field that already holds text (migrated letters) always renders.
- Never reopen a session on an emotional section (`lastVisitedSlug` guard).
