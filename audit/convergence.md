# Convergence and emergent findings

Synthesis across all nine analyses. The independence phase is over; everything here comes
from reading the nine against each other.

Source of truth for scores, tiers and verdicts: `audit/findings-index.json`.
157 findings — 151 CONFIRMED, 3 PLAUSIBLE, 3 REFUTED. P0=12, P1=21, P2=67, P3=54.

**Governing hierarchy applied throughout:** 1 Privacy > 2 Accessibility (including
cognitive) > 3 Clarity > 4 Design quality > 5 Growth and reach.

---

## How to read this document

- **Part 1** deduplicates without erasing. Where four analyses found one problem in four
  vocabularies, that convergence is the strongest signal in the audit and is preserved on
  the face of the cluster.
- **Part 2** is the part that could not be written before now: ten failure chains that are
  invisible inside any single analysis.
- **Part 3** is shared root causes that are not literal duplicates.
- **Part 4** flags five places where the nine analyses (or the five verifications)
  contradict each other and a merged report would ship the contradiction.
- **Part 5** is where I disagree with how the hierarchy has been applied.

Combined tier is the highest member tier, adjusted where convergence or hierarchy position
changes the answer. Where verification corrected a score, the correction is honoured.

---

# PART 1 — CONVERGENCE

Nineteen clusters, ranked by number of independent analyses that reached them.
They absorb 71 of the 157 findings.

---

## C-01 · The explainer video has no captions and no transcript
### 5 independent analyses — the largest convergence in the audit

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A4-001 | A4 accessibility conformance | **P0** | "SC 1.2.2 is Level A — the legal floor" |
| A4-002 | A4 | P2 | "No media alternative — 1.2.3 (A) and 1.2.5 (AA)" |
| A3-002 | A3 inclusive design | P2 | "hearing / language / situational / literacy — and it is 4m38s, not 2 minutes" |
| A1-007 | A1 visual design | P2 | "accessibility-media" (craft gap) |
| A2-018 | A2 usability | P2 | "comprehension — the one asset that answers *what is this thing?* is unavailable" |
| A9-022 | A9 distribution | P2 | "forfeits the site's best crawlable prose" |
| A8-006 | A8 policy | **P0** | cites the caption gap as the evidence that there is no Accessibility Statement |

**Independent analyses: 5** (A1, A2, A3, A4, A9), with A8 depending on it.

**Root cause.** One `.mp4`, `textTracks.length === 0`, no `.vtt` asset anywhere in 431
production requests, no transcript in the DOM. A single missing artifact.

**The one fix.** Generate a caption track **and publish the transcript as on-page HTML
directly beneath the player.** The transcript is the load-bearing half: it closes A4-002
(1.2.3/1.2.5), A2-018 and A3-002's literacy argument, gives A9-022 the crawlable prose,
and gives A8-006 something true to point at. Captions alone close only A4-001.

**Combined tier: P0.** Level A, the audience is disabled people and their families, and
five analyses reached it from five directions.

**Notes.** A3-003 (the "about 2 minutes" label against a 4:38 runtime) is a sibling defect
and is **already fixed and deployed** in `b243107` — V2 corrects `CHANGES-DURING-RUN.md`,
which believed it was still pending. A4-002 is marked `already_fixed: partially` for the
same reason; the transcript half is live. A4-015 (the custom key handler swallows Space)
and A3-012 (voice control cannot say "Watch") sit on the same component and should be
picked up in the same visit.

---

## C-02 · The emergency sheet has no content contract
### 4 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A3-005 | A3 | **P0** | "downloads near-empty, with no warning; its inputs are scattered across five sections and mostly unlabelled" |
| A6-001 | A6 PDF | **P0** | "never US Letter size — the page grows or shrinks with the content" |
| A2-008 | A2 | P1 | "the most safety-critical list is opt-in by click" — medications and doctors start at zero behind `+ Add` |
| A6-008 | A6 | P1 | "omits the treating doctors, though the letter collects name, specialty and phone" |
| A6-010 | A6 | P1 | "laid out for the family, not for the stranger reading it in fifteen seconds" |
| A6-017 | A6 | P2 | "silently truncates several fields at limits that are tight for real medical content" |
| A6-014 | A6 | P2 | "a reader in 2041 can date it but cannot tell if it is current" |
| A6-011 | A6 | P2 | "tinted warning backgrounds carry no signal at all in black and white" |
| A9-018 | A9 | P3 | "the most-copied artifact the tool produces does not carry the site address" |

**Independent analyses: 4** (A2, A3, A6, A9).

**Root cause.** The emergency sheet was implemented as a *view over whatever the letter
happens to contain*, not as a document with a declared required-content set. Everything
above follows: no guard, no page geometry, no field precedence, no completeness marking.
The proof is in the codebase — `emergencyHasContent()` is **defined at `derive.ts:347` and
called nowhere**, while the equivalent guard `keyPointsHaveContent` **is** applied to the
letter's key-points page (`loi-document.tsx:235`). The pattern was understood and simply
not extended.

**The one fix.** Give the sheet an explicit contract: a named list of the ~15 fields it
consumes, surfaced in the wizard as one "Emergency sheet" checklist view; call the guard
that already exists; fix `<Page wrap={false}>` so the page is 612×792 always. Everything
else in the cluster becomes a small edit inside work that is already open.

**Combined tier: P0.** Two P0s, and the artifact's entire purpose is to be read by a
stranger under time pressure.

**Measured evidence worth keeping visible.** V3 reproduced the page geometry to the
hundredth of a point: emergency sheets measure 612 × **441.54**, **742.84**, **1113.19**,
and the two shipped samples 739.19 and **852.69** (11.84 inches). A3 extracted the whole
body text of a minimal sheet: the name, "ATTACH RECENT PHOTO", and "ALLERGIES — None
recorded — confirm with family." That is the document.

---

## C-03 · The keyboard focus indicator is invisible
### 3 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A1-002 | A1 | **P0** | "effectively invisible on every light surface on the site" — a craft failure |
| A3-001 | A3 | **P0** | "motor / switch access / low vision" — a wayfinding failure for people who cannot use a mouse |
| A4-003 | A4 | P1 | "SC 2.4.7 Focus Visible; 1.4.11 Non-text Contrast; and form fields have no outline at all" |

**Independent analyses: 3.**

**Root cause.** The focus outline resolves through an oklab `color-mix` to `#e2caaa`,
which measures **1.26–1.58:1** against the site's own ivory and white — V1 recomputed this
from the CSS Color 4 matrices, got a zero delta on the hex, and then read the painted
pixels on production to confirm. Three lines above it, **`--ring: var(--navy-700)` and
`--ring-w` are defined and referenced zero times anywhere in `src/`.**

**The one fix.** Wire the two dead tokens into the global `:focus-visible` rule and extend
it to form controls. V1: "it makes A1-002's fix a two-line change rather than a new API."

**Combined tier: P0.**

**Standards correction (V1).** Cite **SC 2.4.7 Focus Visible (A)** and **SC 2.4.13 Focus
Appearance (AAA)** for the 3:1 indicator. **Not** SC 2.4.11 — that is a different failure
and it belongs to A4-007 (see C-05).

**Sibling.** **A4-012 (P0)** — in Windows High Contrast Mode form fields have *no* focus
indicator at all, because the cue is a `box-shadow` and forced-colors discards it. Same
fix visit, different mechanism. See also C-15.

**Important context.** V1 ran the axe scan A1 could not run (`@axe-core/playwright`,
`wcag2a/2aa/21a/21aa/22aa/best-practice`, seven **production** routes) and found **zero
WCAG A/AA violations** — only a moderate best-practice `region` issue. This cluster is
real *and* invisible to every automated rule that exists. That is the point of C-16 below
and of E-010.

---

## C-04 · The returning family cannot find their letter
### 3 independent analyses — the cheapest high-value fix in the audit

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A2-005 | A2 | P1 | "save-resume / returning users — a marketing homepage with no sign their letter exists" |
| A3-010 | A3 | P2 | "memory / anxiety / re-entry — the home page shows no sign a letter is already in progress" |
| A5-008 | A5 language | P3 | "the sticky header says *Start your letter* to someone who is already writing one" |
| A2-015 | A2 | P2 | "there is no way to find an answer — a family returning to change one medication scrolls for it" |

**Independent analyses: 3** (A2, A3, A5). A2 reached it twice, from two different personas.

**Root cause.** No marketing surface ever reads the draft key. The state exists in
`localStorage` under `twl-loi-letter-v1`; nothing on `/` or in the masthead looks at it.

**The one fix.** One hydration-safe effect reading the draft key, swapping the hero and
header CTA to "Continue your letter — last saved Tuesday" with a section count. It closes
three findings from three analyses, requires no new storage, no server, and no change to
the privacy model. A2-015 (in-letter search) is a larger, separate piece.

**Combined tier: P1.**

---

## C-05 · The sticky masthead eats the viewport and hides focus
### 3 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A4-007 | A4 | P1 | "**SC 2.4.11 Focus Not Obscured (AA) — failed.** Nine backwards keyboard stops overlapped the header; four entirely covered; a textarea 91% covered" |
| A2-007 | A2 | P2 | "at 200% zoom the masthead and privacy strip eat 45% of the screen, permanently — the grandparent sees 212px of content at a time" |
| A3-017 | A3 | P2 | "vision / magnification / reflow — a third of the viewport at 400% zoom" |

**Independent analyses: 3.**

**Root cause.** One fixed-height `position: sticky` masthead plus a persistent privacy
strip, with no `scroll-margin-top` on focusable descendants.

**The one fix.** Shrink-on-scroll (or release sticky below a viewport-height threshold)
plus `scroll-margin-top` equal to the chrome height. That closes the AA failure and both
zoom findings together.

**Combined tier: P1** — pulled up by A4-007's confirmed AA failure.

**Contradiction resolved.** A3-017 asserts "SC 2.4.11 Focus Not Obscured … is met."
**V2 strikes that**: it is failed, and A4-007 is the proof. If both findings ship as
written, the merged report tells the reader 2.4.11 both passes and fails.

---

## C-06 · The sample documents are treated as decoration, not as product
### 3 independent analyses — highest leverage-per-unit-effort in Part 1

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A4-005 | A4 | P2 | "images of text that cannot be enlarged — 11 `role=img` canvases, zero text content, 0.255 scale at 320px" |
| A6-016 | A6 | P2 | "trust / marketing-artifact — the four sample PDFs carry every defect above, including the two worst" |
| A9-007 | A9 | P3 | "search / content strategy — the highest-intent asset the site owns is noindexed and absent from the sitemap" |

**Independent analyses: 3.**

**Root cause.** The samples are pre-rendered PNG/canvas facsimiles of PDFs that were
generated by the same defective pipeline, then hidden from crawlers. Three different kinds
of second-class treatment, one decision underneath: samples are marketing, not product.

**The one fix.** Render the samples as **real HTML** from the same content model that
feeds the PDF, and index them. That single change:
- gives blind and low-vision visitors readable, resizable, selectable samples (A4-005),
- removes the PDF pipeline's defects from the marketing surface (A6-016),
- makes the highest-intent pages crawlable (A9-007),
- and is a working prototype of the HTML output A6-012 (P0) argues the product needs
  anyway.

**Combined tier: P2 as scored — but schedule it as P1.** It is the only fix in the audit
that pays into accessibility, output quality and reach simultaneously.

**Verification note.** V2 could not reproduce A4's "10pt renders at 4.58 effective CSS px"
at 320px — the correct figure is ≈3.4px. The finding is *worse* than filed, not weaker.

---

## C-07 · The PDF carries the identity the filename policy exists to hide
### 3 independent analyses — privacy tier

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A7-009 | A7 privacy | P2 | "`/Title` embeds the child's name, `/Author` the parent's — contradicting the project's own deliberate filename policy" |
| A6-015 | A6 | P3 | "privacy-consistency — and `DisplayDocTitle` is **on**, so every viewer shows the Title, not the filename" |
| A5-015 | A5 | P2 | "the download filename discloses **disability**, in a file whose own code comment forbids disclosure" |

**Independent analyses: 3.**

**Root cause.** One explicit, well-argued privacy rule — `src/lib/filenames.ts:9–18`,
which reasons that downloads "land in shared folders, get synced to cloud drives, and are
read out by screen readers in open-plan offices" — implemented in exactly one module and
violated in two others that never read it. A5 found the filename leaks the *category*
(`Letter-of-Intent-**Disabilities**-2026-08-09.pdf`); A7 found the metadata leaks the
*person*; A6 found the viewer setting that puts the person's name in the window title bar.

**The one fix.** Apply the rule the repo already wrote: neutral `/Title`
("Letter of Intent"), drop `/Author`, drop the path label from the filename. Keep
`DisplayDocTitle` (see E-005 — it is the accessible setting).

**Combined tier: P1.** Tier-1 value under the hierarchy, three analyses, S effort. The
P2/P3 scores were assigned before anyone could see that all three leaks are the same rule
being broken three times.

---

## C-08 · Cloudflare is an undisclosed processor
### 3 independent analyses — privacy tier — and the sub-claims conflict

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A8-001 | A8 | P2 | "an undisclosed processor — CalOPPA §22575(b)(1) categories of third parties; GDPR Art. 13(1)(e)" |
| A7-004 | A7 | P2 | "third-party — in no codebase, on no disclosure, blocked only by accident" |
| A7-005 | A7 | P2 | "Email Obfuscation **rewrites the HTML and runs its own JavaScript same-origin on every page**, including the wizard pages holding the letter" |
| A7-006 | A7 | P3 | "supply-chain — Cloudflare terminates TLS, rewrites HTML, runs the DNS, and appears nowhere in the threat model" |
| A9-023 | A9 | **REFUTED** | "a Cloudflare analytics beacon **runs** in production" |
| A8-002 | A8 | P2 | "SECURITY.md's third-party claims are contradicted by production and say the opposite of what is true" |

**Independent analyses: 3** (A7, A8, A9).

**Root cause.** The edge provider was never entered into either the threat model or the
disclosure. Two different Cloudflare scripts are involved and **the audit gets them
backwards in one place**:
- `static.cloudflareinsights.com/beacon.min.js` is edge-injected and **dies at the CSP** —
  V5 captured the `requestfailed … :: csp` and the console violation. **It does not run.**
  A9-023 is refuted, and its stated upside ("cookieless referral data") is wrong today.
- `/cdn-cgi/scripts/…/email-decode.min.js` is served **same-origin**, therefore permitted
  by `script-src 'self'`, and **does execute** — including on `/privacy`, where the only
  occurrence of the string "cloudflare" on the whole page is that script tag.

**The one fix.** One paragraph on the privacy page naming Cloudflare and what it does, and
turn **Email Obfuscation off** in the dashboard — which removes the only Cloudflare script
that actually runs. Both are minutes of work.

**Combined tier: P2 as scored; treat as P1 by hierarchy position.** Nothing typed leaves
the device (A7-001, verified adversarially) — but see E-006.

---

## C-09 · The dead email form at the moment of maximum trust
### 3 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A3-007 | A3 | P2 (PLAUSIBLE) | "anxiety / executive function / trust / privacy-feel — it looks like the most important control in its card" |
| A5-004 | A5 | P2 | "actionability — it invites an action it cannot perform, and only says so after the click" |
| A9-015 | A9 | P3 | "trust threshold — a non-functional email form sits at the moment of maximum trust" |

**Independent analyses: 3.**

**Root cause.** A fully-styled, fully-labelled form wired to nothing.

**The one fix, and it is already in the codebase.** Replace it with the reminder mechanism
the product already ships: the review screen has a working `.ics` download with Google and
Outlook deep links (`ReviewScreen.tsx:376–479`), and A6-013 records that the `.ics`
description already tells the family what to update. A client-side calendar reminder does
the job the email form pretends to do, costs no server, collects no address, and is
strictly better under the hierarchy. (Fix `A7-014`'s lone-CR escaping bug while there.)

**Combined tier: P2.**

---

## C-10 · One broken sentence, filed three times
### 3 independent analyses — the cheapest fix in the entire audit

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A5-002 | A5 | P2 | "content-defect / trust — grammatically broken, and live in production" |
| A9-008 | A9 | P2 | "ships a broken sentence to search results" |
| A8-014 | A8 | P3 | "live in production and in search results" |

**Independent analyses: 3.** One string, on `/privacy`.

**Root cause / fix.** Edit one line. Adjacent: **A5-014** — meta descriptions run 171–206
characters, which truncates the privacy promise out of the SERP snippet. Fix both in the
same commit.

**Combined tier: P2** — but this is three findings, three analyses, and under sixty
seconds of work. It should be the first thing done.

---

## C-11 · The privacy copy claims more than the code does
### 3 independent analyses — privacy tier

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A8-003 | A8 | P2 | "the policy's strongest sentence is currently true only by accident of CSP" |
| A5-011 | A5 | P2 | "one claim that is literally false and easy to falsify" — *"no script on this page reads them"*, when the app's own store and PDF generator do exactly that |
| A7-003 | A7 | P3 | "on-site copy claims more than the canonical scope in five places" |
| A5-012 | A5 | P2 | "the promise says **device**; the storage is per-browser, and the site says both" — 22 "this device" / 9 "your device" vs 4 "this browser" / 4 "your browser" |

**Independent analyses: 3** (A5, A7, A8).

**Root cause.** Privacy copy was written to the *intent* of the architecture rather than
to its *implementation*, and nothing re-checks it when either moves.

**The one fix.** A short claims register — every privacy sentence, the code fact that
makes it true, and the test that would catch it becoming false — wired to the existing
egress test. That is also the fix for A7-012 (see C-16 / E-010).

**Combined tier: P2 as scored; P1 by hierarchy position.** A5-012 in particular runs in
the direction that costs a family their work — see E-002.

---

## C-12 · Every PDF is untagged
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A4-006 | A4 | **P0** | "output document accessibility — untagged, with no declared language; `<Document>` has no `language` prop, which `@react-pdf/renderer` 4.5 does expose" |
| A6-004 | A6 | **P0** | "PDF/UA-1 fails on all six audit files **and all four shipped samples** — no structure tree, no MarkInfo, no XMP, no `/Lang`" |

**Independent analyses: 2**, both P0, both MEASURED against veraPDF, both fully reproduced
by verification.

**Same root, four more findings.** The generator paints glyphs at coordinates; there is no
document structure at any point. That single fact also produces **A6-006** (letterspaced
labels extract as `D I A G N O S E S`), **A6-009** (no bookmarks in a 64-page document),
**A6-018** (an unembedded Helvetica object), and is the whole argument of **A6-012 (P0)**
— that HTML should be a first-class output.

**The one fix, cheapest first.** Ship the HTML/plain-text sibling (A6-012). It resolves the
reader problem completely and immediately, for a fraction of the cost of tagging
`@react-pdf` output, and C-06 shows the same renderer is needed for the samples anyway.
Then add `/Lang` (one prop) and tag incrementally.

**Combined tier: P0.**

---

## C-13 · The two time estimates contradict each other
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A2-003 | A2 | P1 | "honesty / expectation setting / abandonment — Nielsen heuristic 1" |
| A3-004 | A3 | P1 | "executive function / planning / trust — a parent who cannot plan cannot start" |

**Independent analyses: 2.** Pure arithmetic against numbers the app itself prints:
the headline says **45–90 minutes**, the per-section badges sum to **165**. V1: "Nothing
to attack."

**Root cause.** Two independently-authored numbers, neither derived from the other. The
same root produced **A3-003** ("about 2 minutes" on a 4:38 video — now fixed): *the site's
stated durations are not computed from the things they describe.*

**The one fix.** Derive the headline from the badge sum, or delete the badges. A3 is
explicit and correct that it cannot tell you *which* number is wrong — that needs three
real people with a stopwatch, which is an hour of work and settles it permanently.

**Combined tier: P1.**

---

## C-14 · The letter directs its reader to sections that are not in it
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A5-001 | A5 | P1 | "content-accuracy / output-integrity — the PDF tells a caregiver **in a crisis** to read sections that are not in the document" |
| A3-006 | A3 | P1 | "content-as-accessibility / the reader's experience" |

**Independent analyses: 2.**

**Root cause.** The "How to use this letter" page is static boilerplate listing a section
set that no longer matches the generated section set.

**The one fix.** Generate the how-to-use list from the same array that generates the
sections. See E-007 — this is one of five defects that jointly destroy the document's
navigation.

**Combined tier: P1.** Standards correction (V3): drop SC 3.2.4 Consistent Identification;
this is a content-accuracy defect, not a WCAG one.

---

## C-15 · Forced colors strips every progress and focus cue
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A4-012 | A4 | **P0** | "in Windows High Contrast Mode, form fields have no visible focus indicator at all" |
| A3-008 | A3 | P2 | "vision / high contrast mode / **memory** — every progress and orientation cue disappears" |

**Independent analyses: 2.**

**Root cause.** Every cue in the wizard rail and every focus ring is carried by
`background-color`, `background-image` or `box-shadow`. All three are discarded under
`forced-colors: active`. A3 measured `.tw-diamond` computing to `background-image: none`.

**The one fix.** One `@media (forced-colors: active)` block using system colour keywords
plus border-based cues. Do it in the same visit as C-03.

**Combined tier: P0.** A3's honest caveat stands: someone on a real HCM setup should look
for ten seconds before this is scheduled, because Playwright's emulation kept a light
palette.

---

## C-16 · The app makes people retype what it already knows
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A2-009 | A2 | P2 | "re-entry of information the site already has — *Who would you call first?* with no way to pick from the list" |
| A4-009 | A4 | P3 | "redundant entry / cognitive — **SC 3.3.7**" |

**Independent analyses: 2.** Standards correction (V2): SC 3.3.7 Redundant Entry is
**Level A**, not AA as filed.

**Same root, two more.** **A2-010** — "Today's date" is an empty date picker the app could
have filled, and it is the fifth question of the first section. **A4-008** — autofill is
switched off across the whole wizard, including the one field that is about the user.

**The one fix.** A person-picker sourced from the contacts already entered, plus a
prefilled date, plus `autocomplete` on the author's own name.

**Combined tier: P2.**

---

## C-17 · Type renders below the design system's own floor
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A1-003 | A1 | P2 | "typography — structural labels at 10–11px, breaking the system's own written *never below 12px* rule" |
| A3-013 | A3 | P3 | "vision / legibility / literacy — twenty engraved-caps labels at 9–11px" |

**Independent analyses: 2** — one framing it as craft indiscipline, one as a reading
barrier.

**Root cause.** **A1-001**: the type, rhythm and measure tokens are defined at
`globals.css:102–142` and referenced **zero times** — V1 reproduced the census exactly
(0 `var(--fs-*)`, 0 `var(--lh-*)`, 0 `var(--ls-*)`, 145 raw `text-[…]` across 31 distinct
values). A written rule with no enforcement surface is not a rule.

**The one fix.** Wire the tokens, or add a lint rule that fails on `text-[…]` below 12px.
Sweeps up **A1-010** (five line-heights on one 15px size, on one page) and **A1-004**
(105-character measure in the textareas where parents write the hardest prose, against a
declared 66ch).

**Combined tier: P2.**

---

## C-18 · The chooser screen
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A2-004 | A2 | P1 | "information architecture / abandonment — *Start your letter* does not start the letter; it lands on a 5,905px chooser that asks a second question before a single field" |
| A2-011 | A2 | P2 | "the two chooser cards are buttons whose accessible names are 94 and 101 words long" |
| A4-010 | A4 | P2 | "ARIA pattern — it announces itself as tabs but does not behave as tabs" |

**Independent analyses: 2** (A2 twice, A4 once).

**Root cause.** One screen carrying a decision, two essays, and the wrong interaction
pattern.

**The one fix.** Card label = the heading only, prose moved to `aria-describedby`; drop
`role="tab"` for plain buttons (or implement the full pattern); default-select so the
screen is skippable for anyone who does not need it.

**Combined tier: P1.**

---

## C-19 · Seventeen links before the first question, and focus is dropped
### 2 independent analyses

| ID | Analysis | Tier | The vocabulary it used |
|---|---|---|---|
| A2-006 | A2 | P2 | "a keyboard or screen-reader user passes 17 navigation links before the first question — on every one of 15 sections. **SC 2.4.1 Bypass Blocks**" |
| A4-013 | A4 | P2 | "focus is dropped to `<body>` on every section change, and the 17-link rail cannot be skipped" |

**Independent analyses: 2.**

**Root cause.** No skip link, no accessible name on the rail `nav`, no focus management on
client-side route change. V1 adds a free corroboration A2 left on the table: the rail is a
`nav` **inside** `main` with no accessible name, so even a screen-reader user who knows it
is there cannot jump to it by landmark.

**The one fix.** Skip link + `aria-label` on the rail + move focus to the section `h1` on
route change — which also gives **A2-012** (a 3,596px Medical form with exactly one
heading) the heading structure it needs.

**Combined tier: P1.** Standards correction (V1): keep SC 2.4.1, drop SC 2.4.3.

---

### Convergence, in one table

| Cluster | Analyses | Tier | The fix in one line |
|---|---|---|---|
| C-01 video captions + transcript | **5** | P0 | one `.vtt` and an on-page transcript |
| C-02 emergency sheet contract | **4** | P0 | declare its required fields; call the guard that exists |
| C-03 focus indicator | 3 | P0 | wire two dead tokens |
| C-04 returning family | 3 | P1 | read the draft key on the homepage |
| C-05 sticky chrome | 3 | P1 | shrink on scroll + `scroll-margin-top` |
| C-06 samples as product | 3 | P2→P1 | render the samples as HTML |
| C-07 name in the PDF | 3 | P1 | apply `filenames.ts`'s own rule to `/Title` |
| C-08 Cloudflare undisclosed | 3 | P2→P1 | one paragraph; disable Email Obfuscation |
| C-09 dead email form | 3 | P2 | swap it for the `.ics` reminder already shipped |
| C-10 broken meta description | 3 | P2 | edit one line |
| C-11 copy overclaims | 3 | P2→P1 | a claims register wired to the egress test |
| C-12 untagged PDFs | 2 | P0 | ship the HTML sibling first, then `/Lang` |
| C-13 time estimates | 2 | P1 | derive one number from the other |
| C-14 phantom sections | 2 | P1 | generate the list from the section array |
| C-15 forced colors | 2 | P0 | one `@media (forced-colors: active)` block |
| C-16 redundant entry | 2 | P2 | person-picker + prefilled date |
| C-17 type below the floor | 2 | P2 | wire the type tokens / lint |
| C-18 chooser screen | 2 | P1 | short labels, drop fake tabs, default-select |
| C-19 bypass + focus loss | 2 | P1 | skip link, named rail, focus the `h1` |

---

# PART 2 — EMERGENT FINDINGS

Ten chains. Each is composed of individually defensible decisions. None is owned by any
single analysis.

---

## EMERGENT E-001 — The completeness illusion delivers an empty sheet to a stranger
**Tier: P0.** The most consequential thing in the audit.

**Contributing findings:** A2-002 (A2, P1) · A3-005 (A3, P0) · A2-008 (A2, P1) ·
A6-008 (A6, P1) · A6-002 (A6, P1) · A6-003 (A6, P2) · A6-017 (A6, P2)

**The chain, step by step**

1. `startedCount()` marks a section complete if **any one field** in it has content
   (`derive.ts:57–73`). A2 seeded one answer per section — **15 of 83 questions, 18%** —
   and the rail rendered `width: 100%` and printed *"Every section has notes."* **(A2-002)**
2. Medications and doctors are **not fields**; they are empty repeater lists behind
   `+ Add`. A family that never presses the button has satisfied the section anyway.
   **(A2-008)**
3. The emergency sheet is assembled from ~15 fields scattered across five sections; only
   five of them say so. `emergencyHasContent()` exists at `derive.ts:347` and is **never
   called**, while the analogous guard *is* applied to the letter's key-points page. The
   Review page therefore always offers the download. **(A3-005)**
4. The sheet omits treating doctors entirely — even where the family *did* enter names,
   specialties and phone numbers. **(A6-008)**
5. The PDF's contents page lists **only the sections that were filled**, and nowhere says
   which were left blank. **(A2-002, second half)**
6. The "SECTION N" eyebrow emits **zero glyphs** (`SECTION` = 0 occurrences across all ten
   PDFs) and the page footer — disclaimer *and* "Page N of M" — is translated to
   y = −426,389 and renders on no page. **(A6-003, A6-002)**
7. The parent, told they are finished, downloads and prints. The sheet reads, in full:
   the child's name, "ATTACH RECENT PHOTO", and *"ALLERGIES — None recorded — confirm with
   family."* They hand it to a sitter.

**Who it happens to, concretely.** A parent following the site's own good advice to work
in ten-minute sittings gets three sections in on Sunday, touches something in the rest so
the rail looks tidy, sees 100% and "Every section has notes", and stops. Six weeks later a
respite worker arrives for the first time, is handed a single page, and has the child's
name, no medications, no doctors, no protocol, and a line saying allergies were not
recorded. There is no page number, no section number, and no statement of what is missing —
so the worker cannot even tell that they are holding an incomplete document.

**Why no single analysis could see it.** A2 owns the progress bar and proved both halves of
its harm, but does not own the emergency sheet's field list. A3 owns the empty-sheet risk
but frames it as executive function, not as a consequence of a false completion signal. A6
owns the missing page furniture but reads it as document-integrity craft. The failure is
the *composition*: a false "done" signal, plus no content guard, plus no completeness
marking on the output. Remove any one and the chain breaks.

**What breaks the chain most cheaply.** **One change: print what is missing.**
Under any unanswered section heading in the PDF, print one ruled line in the letter's own
voice — *"Not written down yet. Ask the family."* — exactly matching the phrasing the
emergency sheet **already uses** for allergies. That single edit means an incomplete
document announces itself, regardless of what the progress bar said. It is strictly
cheaper than fixing the progress arithmetic and it protects the reader rather than the
writer. Do the progress arithmetic second, and the `emergencyHasContent()` call third
(it is a one-line call to a function that already exists).

---

## EMERGENT E-002 — The privacy promise is also an undisclosed data-loss promise
**Tier: P0.** A8 said "this is the finding I would put first if I could only fix one."
Cross-reading makes it worse than A8 could show.

**Contributing findings:** A8-007 (A8, P1) · A5-012 (A5, P2) · A2-005 (A2, P1) ·
A3-010 (A3, P2) · A2-001 (A2, P0) · A2-013 (A2, P3) · A5-005 (A5, P0) · A7-007 (A7, P2)

**The chain, step by step**

1. The client-side-only architecture is settled and correct. The persistent strip on every
   page says *"Everything you type stays on your device and is never sent anywhere."*
2. The actual scope is **one browser profile**, not a device — and the site says both:
   22 uses of "this device", 9 of "your device", against 4 "this browser" and 4 "your
   browser". **(A5-012)**
3. `navigator.storage.persist()` is **never called** — grep returns no matches. The letter
   therefore lives in best-effort storage, subject to eviction under pressure and to
   Safari ITP's deletion of script-writable storage after a period without interaction.
   **(A8-007)**
4. The privacy page frames loss as something the *user* does: *"If **you** or a cleanup
   tool clear this site's data, the letter is gone."* A parent who never clears anything
   reasonably concludes they are safe. **(A8-007)**
5. The one defence — the backup file — is called by **six different names** across the
   copy. **(A5-005, P0)**
6. Meanwhile there is no unload flush, so up to **600ms** of typing is lost on any abrupt
   close. **(A2-013)**
7. If the browser refuses storage entirely, the wizard shows **"This page couldn't load"**
   on every section, in production, with no explanation and no way past. The user is told
   the site is broken, not that they cannot use it. **(A2-001, P0)**
8. And when they do come back, nothing on the homepage or in the masthead acknowledges the
   letter exists. **(A2-005, A3-010)** So the family that *still has* their letter and the
   family whose letter was silently evicted **see exactly the same screen.**

**Who it happens to, concretely.** A mother writes four sections on her iPhone over two
weeks of 11pm sittings. She has read, and believed, that it stays on her device. She does
not open the site for three weeks — there is a hospital admission. ITP clears the storage.
She opens the site: a marketing homepage, "Start your letter". She has no way to
distinguish "my letter was deleted" from "I'm on the wrong browser" from "I misremembered
finishing it", because step 8 renders all three identically. There is no account, no
recovery, and she was never told this could happen.

**Why no single analysis could see it.** A8 owns the retention gap and the missing
`persist()` call. A5 owns the device/browser imprecision and the six names. A2 owns both
the storage crash and the invisible re-entry. A3 owns the memory burden. Each is a modest
finding alone. Composed, they describe a system in which **the most likely catastrophic
outcome is both silent and indistinguishable from user error** — and in which the privacy
promise is the mechanism that makes it possible.

**What breaks the chain most cheaply.** Three small things, in order:
1. Call `navigator.storage.persist()` on first write. One line; converts best-effort
   storage to persistent on Chromium and materially reduces eviction risk.
2. The C-04 fix — read the draft key on the homepage. It is the *only* way a family can
   tell "gone" from "wrong browser". This is why C-04 outranks its P1 on the merits.
3. Change one sentence: *"Browsers can clear this on their own — especially on iPhone if
   you don't visit for a few weeks. Download a backup."* Honest, and it moves the risk
   from the user's imagined negligence to where it actually lives.

A7-007 belongs to the same family: "Delete all my data" leaves three traces and then tells
the family the device holds nothing. Same root — **the storage story the copy tells is not
the storage story the code implements**, in both directions.

---

## EMERGENT E-003 — The disabled person in this story is the reader, and the artifact is unreadable
**Tier: P0.**

**Contributing findings:** A4-006 (A4, P0) · A6-004 (A6, P0) · A6-012 (A6, P0) ·
A6-006 (A6, P2) · A6-009 (A6, P2) · A4-005 (A4, P2) · A6-016 (A6, P2) · A9-007 (A9, P3) ·
A4-016 (A4, P2) · A6-018 (A6, P3)

**The chain, step by step**

1. The **site** is in good accessibility shape. V1's axe run across seven production routes
   found **zero WCAG A/AA violations** — one moderate best-practice `region` issue. The
   project's own gate asserts zero violations across 5 routes, all 25 section slugs and 3
   interaction states, and it passes. **(A4-016)**
2. The **output** fails PDF/UA-1 on all six audit files and **all four shipped samples** —
   no structure tree, no MarkInfo, no XMP, no `/Lang`. **(A4-006, A6-004)**
3. Consequences compound inside the PDF: letterspaced labels extract as
   `D I A G N O S E S` **(A6-006)**; a 64-page document has no bookmark pane **(A6-009)**;
   an unembedded Helvetica object sits in the emergency sheet **(A6-018)**.
4. There is **no HTML or plain-text version of either document**. **(A6-012, P0)**
5. A blind or dyslexic person evaluating the tool before using it cannot read the samples
   either — they are 11 `role="img"` canvases with **zero text content**, at an effective
   3.4 CSS px at 320px. **(A4-005)**
6. And those samples are noindexed, so the assistive-technology user cannot even find them
   by search. **(A9-007)**
7. The gate that would have caught this is structurally blind to exactly these surfaces:
   the `/samples` route is not in its route list, gradients land in `color-contrast`
   *incomplete* rather than violation (23× on the home page), `wcag22aa` was never in the
   tag list, and there is no forced-colors run and no computed focus check. **(A4-016)**

**Who it happens to, concretely.** The adult sibling who will be the trustee. She is blind.
She is the single most important future reader of this document — the letter exists to
speak to her after the parents are gone. She receives a 64-page untagged PDF: her screen
reader reads it as an undifferentiated stream in an undeclared language, with no headings,
no bookmarks, no page numbers (E-007), and the section labels spelled out one letter at a
time. Before that, when her parents asked her to look at the tool, she could not read the
samples either.

Second person, same chain: the disabled adult writing their **own** letter of intent. The
site serves them well. The document they produce, and will have to re-read every year, does
not.

**Why no single analysis could see it.** A4 audits the *site* against WCAG and correctly
reports it in good shape; its PDF finding is one item in twenty. A6 audits the *document*
and reports it as a PDF/UA failure — a document-quality frame. A9 reports the sample
noindex as a search problem. Nobody's brief was *"the accessible product produces an
inaccessible artifact for the person it was written for."* The inversion — accessibility
effort spent on the writer's surface, none on the reader's — is only visible with A4, A6
and A9 open at once.

**What breaks the chain most cheaply.** **Ship HTML.** One renderer, from the content model
that already exists, serving three purposes: the accessible output (A6-012, A4-006's
practical remedy), the sample pages (A4-005, C-06, A9-007), and a print stylesheet that
gets the family a printable document without touching the PDF pipeline. This is
dramatically cheaper than tagging `@react-pdf` output and it delivers a *better* result for
assistive technology than a tagged PDF would. Add `/Lang` to the PDF in the same commit —
it is one prop that `@react-pdf/renderer` 4.5 already exposes.

**Second cheapest, and do it too:** add `/samples/*` and `wcag22aa` to the gate's route and
tag lists, and stop treating "zero axe violations" as the accessibility position (E-010).

---

## EMERGENT E-004 — The emergency sheet fails as a physical object, and only as a physical object
**Tier: P0.**

**Contributing findings:** A6-001 (A6, P0) · A6-011 (A6, P2) · A6-005 (A6, P3) ·
A6-014 (A6, P2) · A6-017 (A6, P2) · A9-018 (A9, P3) · A6-010 (A6, P1) · A3-005 (A3, P0)

**The chain, step by step**

1. The sheet exists to be **printed, taped to a fridge, photocopied at a school office, and
   faxed to a day programme.** The product's own copy says so: "one page for the fridge,
   the school office, the sitter, the ER".
2. Its `<Page>` carries `wrap={false}`, so the page box sizes itself to the content. No
   emergency sheet is ever US Letter: measured at 612 × **441.54**, **742.84**,
   **1113.19**, and the shipped samples at 739.19 and **852.69pt (11.84 in)**. **(A6-001)**
   Printing that scales it, clips it, or spills it onto a second page — and a two-page
   "one-page emergency sheet" is a different object.
3. Its urgency cues are **tinted background panels**. In black and white — which is what a
   school photocopier and a fax produce — they carry no signal at all, and two text colours
   fail contrast besides. **(A6-011)**
4. Long entries are shortened at character limits that are tight for real medication
   strings. **(A6-017)**
5. The sheet has no version marker, so a photocopy taken in 2027 from a 2026 original looks
   exactly as current as one printed today. **(A6-014)**
6. It carries the firm's name but **not the URL** — the LOI cover has
   `myletterofintent.com` at 7.5pt; the emergency sheet has nothing. **(A9-018)**
7. And the file is **1.06 MB, 98% of which is one decorative logo embedded at ~1,694 DPI**,
   wrapped around roughly 575 characters of emergency information. **(A6-005)** Emailing it
   to a school is a megabyte of logo.

**Who it happens to, concretely.** The school nurse. She receives the sheet in September,
photocopies it for the substitute-teacher folder and the front office. The copy is greyscale:
the "WARNING" panel around the seizure protocol is now an indistinguishable grey box. The
original printed at 92% because the page was 11.84 inches, so the bottom line is cut. The
medication string was shortened and nothing on the page says which field was cut. In
February a substitute reads it, cannot tell it is from last year, and cannot look up the
tool to ask the family for a fresh one because the URL is not on the page.

**Why no single analysis could see it.** A6 found all the print defects and correctly
scored each as small — a page-size bug, a contrast issue, a file-size issue, a missing
version line. A9 found the missing URL and filed it as *growth*. A3 found the emptiness and
filed it as *executive function*. Nobody composed **"this artifact's entire life happens on
paper, in a photocopier, in someone else's building"** — at which point every one of those
small defects lands on the same object at the same moment.

**What breaks the chain most cheaply.** Fix the page geometry first (`wrap={false}` →
fixed `size="LETTER"`); it is the only one that makes the object *wrong* rather than
*worse*. Then, in the same file and the same afternoon: replace tinted panels with rules
plus bold labels so they survive greyscale; add a `Version / printed on` line; add the URL;
downsample the logo. Five edits in one file, all S, and together they turn a defective
artifact into a good one.

**Hierarchy note.** A9-018 is tier-5 "growth" and therefore scheduled last by value ranking.
It costs nothing once this file is open. See Part 5.

---

## EMERGENT E-005 — The accessible choice is the disclosing choice
**Tier: P1.** The audit's one genuine Privacy-vs-Accessibility conflict.

**Contributing findings:** A6-015 (A6, P3) · A7-009 (A7, P2) · A5-015 (A5, P2) ·
A4-006 / A6-004 (both P0)

**The chain, step by step**

1. `src/lib/filenames.ts:9–18` states a deliberate privacy rule, and states its reasoning:
   downloads "get synced to cloud drives, and are read out by screen readers in open-plan
   offices; a filename carrying 'Letter-of-Intent-Alex' discloses a disability to anyone
   who glances at the screen."
2. The rule is implemented. Production downloads are
   `Letter-of-Intent-Disabilities-2026-08-09.pdf` — no name.
3. But the path label is `Disabilities`. The filename hides *who* and discloses *what*, to
   precisely the glancing observer, shared folder and open-plan screen reader the comment
   describes. **(A5-015)**
4. The PDF Info dictionary carries `/Title = "Letter of Intent — <child's full name>"` and
   `/Author = "<parent's full name>"`. **(A7-009)**
5. The catalog sets **`/ViewerPreferences << /DisplayDocTitle true >>`**, instructing every
   viewer to show `/Title` — not the filename — in the window title bar, the browser tab,
   the file-manager preview pane, and the desktop search index. **(A6-015)**
6. **`DisplayDocTitle true` is the accessible setting.** PDF/UA requires it; it is what
   A4-006 and A6-004 are asking for more of. The accessibility remediation this audit rates
   P0 will, if done naively, make the disclosure *more* reliable across more viewers.

**Who it happens to, concretely.** A father opens the letter on his work laptop to check a
date before an IEP meeting, screen-sharing to a projector. The filename says
`…-Disabilities-…`. The window title bar says *"Letter of Intent — Alex Moreno"*. Both are
now on a wall in front of eleven people, one of whom is a district representative the
family has not chosen to disclose to. He never opened the document.

**Why no single analysis could see it.** A5 read the filename module and saw the rule
broken by its own author. A7 read the Info dictionary and saw a metadata leak. A6 read the
catalog and saw a viewer preference. A4 read the same PDFs and asked for *more* tagging —
which entails `DisplayDocTitle`. Only with all four open is it visible that **the privacy
fix and the accessibility fix point at the same byte and pull in opposite directions.**

**What breaks the chain most cheaply.** The hierarchy answers this cleanly and I agree with
it. **Privacy outranks accessibility, so change the content of `/Title`, not the setting.**
`/Title = "Letter of Intent"`, drop `/Author`, drop the `Disabilities` path label from the
filename, keep `DisplayDocTitle true`. Three string changes; no accessibility cost; the
tagging work in C-12 then proceeds with nothing to disclose. Note this is *not* splitting
the difference — accessibility loses nothing here, because a generic title is a perfectly
good accessible title.

---

## EMERGENT E-006 — The person who checks the promise concludes it is false
**Tier: P1.** The promise is true. The product still loses.

**Contributing findings:** A7-001 (A7, P2, CONFIRMED true) · A7-005 (A7, P2) ·
A7-002 (A7, P2) · A8-001 (A8, P2) · A8-002 (A8, P2) · A5-011 (A5, P2) ·
A5-002 / A9-008 / A8-014 (P2/P2/P3) · A5-016 (A5, P3) · A7-012 (A7, P2) ·
A9-011 (A9, P2) · A9-012 (A9, P2)

**The chain, step by step**

1. **The promise is true.** A7 attacked it adversarially against production with a seeded
   canary and confirmed no user-typed content leaves the device. **(A7-001)** This is the
   product's entire differentiator and it is real.
2. The privacy page **explicitly invites the reader to open devtools and check.** That is a
   brave and correct thing to do — and it makes every artifact of the page evidence.
3. What the reader who accepts the invitation sees:
   - a **Cloudflare script executing on the privacy page itself** —
     `/cdn-cgi/scripts/…/email-decode.min.js`, served same-origin, permitted by
     `script-src 'self'`, and the only occurrence of the word "cloudflare" on the page.
     **(A7-005)**
   - a GA event firing the moment they type:
     `en=form_start · ep.first_field_name=diagnoses · ep.form_destination=/letter/about`.
     **(A7-002)** No values. But "diagnoses" is on the wire.
   - the page's own sentence *"no script on this page reads them"*, which the app's own
     store and PDF generator falsify in the first second. **(A5-011)**
   - the page's meta description, live in search results, as a broken sentence fragment.
     **(A5-002 / A9-008 / A8-014)**
   - jargon — "local storage", "IndexedDB" — named to a reader the same page defines as not
     knowing what "client-side" means. **(A5-016)**
4. If they go further: `SECURITY.md` **says the opposite of what production does** about
   third parties **(A8-002)**, and Cloudflare appears in no disclosure **(A8-001)**.
5. There is no "who made this and why" — the attorney bio exists in config and is rendered
   nowhere **(A9-011)** — and no social proof of any kind **(A9-012)**. So the reader has
   nothing to weigh against what they just found.
6. The reason nobody caught the GA event is that **the egress test exempts every analytics
   host and asserts nothing about which events fire.** **(A7-012)**

**Who it happens to, concretely.** The special-needs trust attorney deciding whether to
recommend this to twenty client families — the exact channel A9 identifies as the product's
main route to market. Or the sceptical adult child in IT whom the parents ask to "check
this is safe". Fifteen minutes with devtools open. Everything they find is technically
harmless. They conclude the privacy claim is marketing, and say so. The one thing that
makes this product worth using is destroyed by a broken sentence, a GA toggle, and an edge
feature nobody turned on deliberately.

**Why no single analysis could see it.** A7 owns the truth and reports it as *confirmed
true*. A8 owns the disclosure gap and reports it as compliance. A5 owns the sentence and
reports it as copy. A9 owns the missing credibility signals and reports them as growth. The
composition — **a verifiable promise, an explicit invitation to verify, and five
individually-trivial artifacts that read as falsification** — is not in anyone's lane.

**What breaks the chain most cheaply.** Under two hours, in this order:
1. Turn off **GA4 Enhanced Measurement → Form interactions**. A property toggle. It removes
   `first_field_name=diagnoses` from the wire without touching GA, which stays. *(This is
   the single highest-value fix in the chain and it is five minutes.)*
2. Turn off **Cloudflare Email Obfuscation**. Removes the only Cloudflare script that runs.
3. Fix the sentence in A5-011 ("no script **sends** them") and the broken meta description.
4. Add one paragraph naming Cloudflare and Google as the two third parties, with what each
   receives.
5. Extend the egress test to assert on **GA event names and parameters**, not just hosts —
   which is also the fix for A7-012 and part of C-11.

**Explicitly not recommended:** removing Google Analytics. It is an owner decision, the
promise survives it, and every problem above is fixed without touching it.

---

## EMERGENT E-007 — The durable artifact has no working navigation system
**Tier: P1.**

**Contributing findings:** A6-002 (A6, P1) · A6-003 (A6, P2) · A5-001 (A5, P1) ·
A3-006 (A3, P1) · A6-009 (A6, P2) · A6-007 (A6, P3) · A2-002 (A2, P1)

**The chain, step by step**

1. The letter has a **CONTENTS page that numbers its sections** and prints page references
   ("Getting started … 4"), and those references are correct. **(A2-002 evidence, A6-003)**
2. The sections themselves carry **no numbers** — the "SECTION N" eyebrow is rendered
   through a `render` prop and emits **zero glyphs**. `SECTION` occurs 0 times, and its
   letterspaced variant 0 times, across all ten PDFs. **(A6-003)**
3. There are **no page numbers**, because the footer — disclaimer *and* "Page N of M" — is
   translated to y = −6,834 / −426,389 / −24,026,340 and renders on no page. `"Page "`
   occurs **0 times** in all six audit PDFs and all four shipped samples. **(A6-002)**
4. There are **no bookmarks**, so a 64-page document has no navigation pane. **(A6-009)**
5. The "How to use this letter" page tells the reader to **go to sections that are not in
   the document.** **(A5-001, A3-006)**
6. And pagination produces near-blank pages containing only a "NOTES" ruled-lines block.
   **(A6-007)**

So: a contents page that references numbered sections, sections without numbers, pages
without page numbers, no bookmarks, and instructions pointing at sections that do not
exist. **Every navigational affordance in the document is either absent or wrong.**

**Who it happens to, concretely.** An ER charge nurse at 2am with a 64-page printout in a
plastic wallet. The second page tells her "in a crisis, start with the Medical section". She
turns pages looking for a heading called Medical. The contents page said page 27; there are
no page numbers to count against, and she has already lost her place twice. She puts it
down and asks the paramedic instead. The document was written for exactly this moment, by a
parent, over 165 minutes.

**Why no single analysis could see it.** A6 found four rendering defects and scored each
individually — an off-page footer is a P1 correctness bug, a missing eyebrow is a P2 CSS
bug, absent bookmarks are a P2 convenience. A5 and A3 found the phantom cross-references as
a *copy* problem. A2 documented the contents page as part of the *completeness* problem. No
one asked "can a stranger navigate this document at all?" — and the answer is no, for five
unrelated reasons.

**What breaks the chain most cheaply.** The footer alone: it is one layout bug
(`PdfFooter` is the first child of every `<Page>`, which is the hypothesised cause) and it
restores page numbers *and* the legal disclaimer, which currently appears on no page of any
letter. Then the eyebrow (one `render`-prop fix) and the cross-reference generation
(C-14). Bookmarks last. Note that **fixing the eyebrow and footer changes pagination**,
which is A6's own flagged risk — so do them together with A6-007, once.

---

## EMERGENT E-008 — Midnight on a phone is the worst-supported case, and it is the stated primary case
**Tier: P1.**

**Contributing findings:** A3-009 (A3, P2) · A2-007 (A2, P2) · A3-017 (A3, P2) ·
A3-011 (A3, P2) · A1-003 (A1, P2) · A3-013 (A3, P3) · A3-016 (A3, P2) · A1-004 (A1, P2) ·
A2-017 (A2, P1) · A1-005 (A1, P3)

**The chain, step by step**

The product's own design brief is "a phone at midnight" and "one more ten-minute sitting".
Compose what that person meets:

1. `:root { color-scheme: light }` is hard-coded; there is no `prefers-color-scheme` query
   anywhere. Rendering the wizard in a dark-scheme context produces **byte-identical
   colours**. The full-bleed `#fbfaf6` ivory covers essentially the entire viewport.
   **(A3-009)** So: a full-brightness cream rectangle, in a dark room, beside a sleeping
   child.
2. Tired eyes zoom. At 200% the masthead and privacy strip take **45% of the screen,
   permanently** — 212px of content at a time. At 400%, a third. **(A2-007, A3-017)**
3. On phones, progress and the section list are hidden inside a **collapsed disclosure**,
   so the orientation cue is not on screen. **(A3-011)**
4. When it is on screen, the "has notes" marker is a **6px gold dot at 2.4:1** — and "has
   notes" is earned by a single typed character. **(A3-016)**
5. The labels naming everything are **9–11px**, below the design system's own written
   floor. **(A1-003, A3-013)**
6. The textareas where the hardest prose gets written wrap at **105 characters**, against
   the system's declared 66ch. **(A1-004)**
7. And getting there took **7.8 seconds to first paint on Slow 3G**, with a pre-hydration
   header that overflows a 320px screen by 94–111px. **(A2-017, A1-005)**

**Who it happens to, concretely.** She has twenty minutes before she falls asleep. The
screen is too bright to look at directly so she holds the phone away, which makes the 10px
labels unreadable, so she zooms, which leaves her a 212px window. The section list is
behind a tap she does not know about. She cannot tell which sections she has done, because
the only cue is a 6px dot she cannot see at this brightness. She writes two sentences into a
box whose lines are so long she loses her place between them. She closes the phone. This is
the scenario the entire product was designed around.

**Why no single analysis could see it.** A3 came closest — it owns dark mode, zoom, the
collapsed rail and the dot, and it names the midnight archetype. But the 10px labels are
A1's finding in a typography frame, the 105-char measure is A1's in a layout frame, the 45%
chrome figure is A2's in a friction frame, and the 7.8s paint is A2's in a first-impression
frame. Nobody composed all seven onto one person in one sitting — and the argument only
becomes compelling at seven.

**What breaks the chain most cheaply.** Dark mode is L effort and is the right answer, but
it is not the cheapest first step. Cheapest, in order:
1. Raise the sub-12px labels to 12px (C-17). S. Helps every one of the steps above.
2. Shrink the chrome on scroll (C-05). S–M. Recovers a third of the viewport, and closes an
   AA failure at the same time.
3. Pin the section list open on mobile, or move a compact "3 of 15" into the sticky header.
   S.
4. Then dark mode. A3's key observation makes it far cheaper than it looks: **the site
   already owns a complete dark palette.** The navy scale plus `--on-ink-heading`,
   `--on-ink-body` and `--on-ink-secondary` are already used on the hero, on every section
   header and on the review header. A dark theme is not a new brand; it is the existing navy
   ground extended, applied through the semantic aliases only.

---

## EMERGENT E-009 — The fourteen-second wait is a decorative logo
**Tier: P2.** Small, and the cleanest example of the shape in the whole audit.

**Contributing findings:** A2-016 (A2, P1) · A6-005 (A6, P3) · A2-017 (A2, P1) ·
A1-006 (A1, P2, already fixed)

**The chain, step by step**

1. A2 measured "Download all three together" on a 390×844 phone emulation at 4× CPU
   throttle: **13,701ms** of a disabled button reading "Preparing your files…", with no
   bar, no per-file tick, and no time estimate. On unthrottled desktop, 5,581ms.
   **(A2-016)** A2 filed it as a *system-status* problem and recommended a progress
   indicator.
2. A6, in a completely different file, established the cause without knowing it was a
   cause: **every PDF is 85–98% one image.** Object 9 in every file is the same
   3716×2782 RGB PNG plus its alpha mask — **1,042,586 bytes** — displayed at 230pt
   (≈1,164 DPI) on the letter cover and 158pt (**≈1,694 DPI**) on the emergency sheet.
   The minimal emergency sheet is **575 characters of emergency information inside a
   1.06 MB file.** **(A6-005)** A6 filed it as *engineering quality* and recommended
   downsampling.
3. "Download all three" generates two PDFs. Each Flate-encodes that megabyte of logo. On a
   4×-throttled phone CPU, that is plausibly the dominant term in the 13.7 seconds.
4. A1-006 (an 18.8 MB auto-preloading video) was the same class of problem on the homepage
   and **is already fixed and deployed** in `b243107`.

**Who it happens to, concretely.** The parent at the very last step, on a phone, at the end
of a two-and-a-half-hour document. Fourteen seconds of a frozen-looking button is exactly
where a person taps again, or backs out, or assumes it failed. And the 1.06 MB emergency
sheet they eventually get is the file they will email to a school.

**Why no single analysis could see it.** A2 measured a symptom on a device and prescribed a
progress bar. A6 measured a cause in a file format and prescribed downsampling. Neither
could see the other's half, so the audit contains a UX recommendation to *decorate* a wait
that an unrelated engineering recommendation would largely *eliminate*.

**What breaks the chain most cheaply.** Downsample `public/mloi-lockup-stacked.png` to
~300 DPI at its largest displayed size. One asset. It likely removes most of the wait
(fixing A2-016 better than a progress bar would), cuts both PDFs by ~90%, and makes the
emergency sheet emailable (E-004). Add the progress indicator afterwards if the measured
wait is still long — **and measure again before building it.**

---

## EMERGENT E-010 — Every automated guard is aimed slightly away from the risk it was built for
**Tier: P1.** A process finding, and the reason several P0s survived to this audit.

**Contributing findings:** A4-016 (A4, P2) · A7-012 (A7, P2) · A8-002 (A8, P2) ·
A7-010 (A7, P3) · A1-012 (A1, P3) · A1-011 / A9-024 (both P3, both fixed) · A9-003 (A9, P3)

**The chain, step by step**

This project is unusually conscientious. It has an accessibility gate, a privacy egress
test, a written security document, and a documented threat model. Every one of them has an
exemption precisely where its risk lives.

1. **The accessibility gate passes and is blind to the brand.** It asserts zero axe
   violations across 5 routes, 25 slugs and 3 states. But gradients resolve to
   `color-contrast` **incomplete** (23× on the home page), so every gold button and navy
   panel is excluded from the assertion; `wcag22aa` is not in the tag list; `/samples` is
   not in the route list; and there is no forced-colors run and no computed focus check —
   so **A4-003 and A4-012 are invisible to every automated rule that exists.** **(A4-016)**
2. **The privacy egress test exempts every analytics host** and asserts nothing about which
   events fire. A7 says so explicitly: *"this is why A7-002 went unnoticed."* **(A7-012)**
3. **`SECURITY.md` says the opposite of what production does** about third parties
   **(A8-002)**, and justifies keeping `'unsafe-inline'` on the premise that the site is a
   static export — **it is not**, and the fix it calls costly is available today
   **(A7-010)**.
4. **The evidence set the audit itself ran on was captured against local dev**, not
   production — a Next.js dev badge is in the shared screenshots. **(A1-012)**
5. **Production lagged HEAD** during the audit, so two findings described a site that no
   longer existed. **(A1-011, A9-024 — both fixed and deployed in `b243107`)**
6. **There is no Search Console**, so there is no external signal at all. **(A9-003)**

**Who it happens to, concretely.** The owner. Every dashboard is green. The a11y gate
passes, the egress test passes, `SECURITY.md` describes a clean architecture, and a
reasonable person concludes the product is in good shape — while a focus ring at 1.26:1
ships, `first_field_name=diagnoses` goes to Google on every keystroke session, and every
PDF the product exists to produce fails PDF/UA. **Confidence is calibrated to the tests,
not to the product.** That is a more dangerous state than having no tests, because it is
indistinguishable from safety.

**Why no single analysis could see it.** Each analysis found *its own* guard's blind spot
and reported it as a coverage gap inside its lane. A4 said the a11y gate misses gradients.
A7 said the egress test misses analytics. A8 said the security doc is stale. A1 said the
screenshots were local. Only stacked do they form a pattern: **four independent guards,
four exemptions, and in each case the exemption sits exactly over the thing the guard was
built to protect.** V1 and V5 also demonstrate the corollary — running the missing check is
cheap and decisive. V1's axe run took minutes and settled a question A1 could not answer;
V5's beacon capture took minutes and refuted a finding.

**What breaks the chain most cheaply.** Do not build new tooling. Widen four existing
lines:
1. Add `/samples/*` to the a11y route list and `wcag22aa` to the tag list. Two lines.
2. Add a forced-colors pass and a computed-focus-contrast assertion. The values are already
   measured in this audit, so the expected numbers are known.
3. Make the egress test assert on **GA event names and parameters**, not just hosts.
4. Resolve the `color-contrast` **incompletes** by hand once and record the answers.
   Nobody has, and V1 names it as where the remaining risk lives: 3–23 per route.

Then treat "the gate passes" as meaning "the gate passed", and nothing more.

---

# PART 3 — REINFORCEMENT

Shared root causes reached in different vocabularies, without being literal duplicates.

**R-1 · The codebase knows the hazard in one place and not in the one that matters.**
The strongest pattern in the audit, and it is nearly diagnostic.
`emergencyHasContent()` is defined and never called, while `keyPointsHaveContent` **is**
applied to the letter's key-points page (A3-005). `VideoPlayer.tsx:112–116` wraps its
`localStorage.setItem` in a try/catch **with a comment explaining why**, while the wizard's
does not — and that is A2-001, a P0 (V1 also found the same uncaught throw latent on `/`,
`/letter`, `/letter/review` and `/your-data`). The a11y gate covers 25 slugs and misses
`/samples` (A4-016). The egress test covers every host and exempts analytics (A7-012). In
every case the right pattern exists in the repository and was not extended one step. That
makes these unusually cheap fixes — and it means a checklist of "where else does this
apply?" would have caught four separate P0/P1 findings.

**R-2 · Prose rules with no enforcement surface.**
`filenames.ts` argues a privacy principle in its own comment and three modules break it
(A5-015, A7-009, A6-015). The design system writes "never below 12px" and twenty labels are
9–11px (A1-003, A3-013). `SECURITY.md` describes third parties that are not the ones in
production (A8-002) and an architecture that is not the one deployed (A7-010).
`analytics.ts:11–15` comments that "there is no event that carries form values" — still
true about *values*, no longer a complete account of what GA sends (A7-002). Four
documents, four accurate statements of intent, four drifts. Root: intent lives in comments;
comments are not tested.

**R-3 · Design tokens defined and never referenced.**
Type, rhythm and measure tokens: **zero** references (A1-001, reproduced exactly by V1).
`--ring` and `--ring-w`: **zero** references, three lines above the focus rule that needed
them (A1-002). The consequences are C-03 (P0) and C-17 (P2). Same root as R-2 in a
different medium — the system is *written down* and not *wired up*.

**R-4 · Encouragement systematically displaces accuracy.**
Not a duplicate set, but one editorial instinct producing five findings. The progress bar
says "Every section has notes" at 18% (A2-002). "Has notes" is earned by one character
(A3-016). The headline says 45–90 minutes against 165 of its own badges (A2-003, A3-004).
The video said "about 2 minutes" against 4:38 (A3-003, now fixed). The user's writing is
called "notes", which diminishes it (A5-009). Each is kind. Together the product
**systematically understates what remains**, and E-001 is what that costs. The fix is not
to become discouraging; it is to separate *encouragement* from *measurement* — keep "15 of
15 sections started" and stop printing "complete".

**R-5 · The document is treated as an export, not as the product.**
A6's eighteen findings, A2-002's PDF half, A9-018's missing URL, A6-013's silence about who
to give it to and where to keep it, A4-006's untagged output. The website is the thing that
was designed; the PDF is what falls out of it. But the PDF is the only artifact that
survives the family, and it is the only one anybody will read in 2041 (A6-014).

**R-6 · Where the site is good, it is *very* good — and that matters for scheduling.**
`prefers-reduced-motion` is handled, and handled well (A3). Context-sensitive help is
"unusually strong" (A4-020). The reading level measures grade 7.2, not the grade 14 the
brief hypothesised — A8 says so plainly rather than reshaping the finding (A8 §3). The
yearly-review card ships a working `.ics` with Google and Outlook deep links, and the `.ics`
body tells the family what to update (A6-013). Fonts are properly subsetted (A6-005). The
backup JSON is versioned and carries `exportedAt`. Zero WCAG A/AA axe violations on
production (V1). Five verifications found zero standards errors across all 23 of A9's
findings. This is a well-built product with a specific, patterned set of gaps — which is
why almost every fix above is S or M.

---

# PART 4 — CONFLICTS A MERGED REPORT WOULD SHIP

Five places where the nine analyses or the five verifications disagree with each other.
Each needs adjudicating before anything is scheduled.

**P4-1 · The same gradient is both CONFIRMED and REFUTED.**
**A1-008 is REFUTED**; **A4-004 is CONFIRMED at P3.** They are the same measurement of the
same button. V1 refuted A1-008 by projecting the **rendered glyph rect** onto the gradient
axis and sampling painted pixels: the worst corner of the *text* is 4.56:1 and 4.50:1 on the
only two gradient-faced controls, because the gradient lightens again after the 78% stop.
V2 confirmed A4-004 by computing the ratio **from the hex** and enumerating gradient-backed
elements — it did not do the glyph geometry. V1's method is strictly stronger.
**Recommendation:** reframe A4-004 to match A1-008's refutation, or the merged list carries
a live AA contrast defect that has been disproved. Also carry V1's warning forward: **A1's
recommended fix would make it worse** — the label is navy on gold, so darkening the gold
moves the ground toward the ink (`#9a7340` = **3.70:1**, a genuine AA failure). If anyone
actions that line as written, the site gets less accessible.

**P4-2 · SC 2.4.11 both passes and fails.**
A3-017 states it is met; A4-007 proves it is failed with nine measured keyboard stops. V2
strikes A3-017's claim. Resolved — but both texts still say what they say.

**P4-3 · "Silently truncates" is not quite right.**
A6-017 says the emergency sheet "silently truncates several fields". A9-018 quotes the
sheet's actual footnote: *"Long entries may be shortened here — full detail lives in the
complete Letter of Intent."* So truncation **is** disclosed generically; what is missing is
**which field was cut**. No verification caught this, because it requires reading A9's
evidence against A6's claim. Soften A6-017 and keep the real defect: mark the cut.

**P4-4 · The Cloudflare fix will be aimed at the wrong file.**
A9-023 (REFUTED) names `beacon.min.js`, which is **CSP-blocked and does not run**. A7-005
(CONFIRMED) names `email-decode.min.js`, which is **same-origin and does run**. Anyone
reading the merged report as one Cloudflare item will disable the wrong thing and believe
they are done. Keep the distinction explicit wherever this ships.

**P4-5 · The video caption gap is filed five times with five different scores.**
A4-001 (P0), A1-007 (mission 3 / harm 5), A2-018 (mission 2 / harm 4), A3-002, A9-022 —
plus A8-006 depending on it. V1 flagged the A1-007/A2-018 pair; the full set is five. If
these are ranked without deduplication the same missing `.vtt` file will be counted five
times and will dominate any weighted list. C-01 is the deduplicated form.

---

# PART 5 — WHERE I DISAGREE

The brief invites disagreement with the hierarchy's verdicts. Four, plus one general point.

**5-1 · The hierarchy ranks values. It does not rank work packets — and tiering by value
alone mis-schedules free riders.**
This is my main methodological objection and it recurs. A9-018 (put the URL on the emergency
sheet) is tier-5 *growth*, filed P3, and V5 says even that is **understated**. Scheduled by
value it sits behind roughly fifty P2s. But it is one line **in a file that C-02 and E-004
already require opening**, and its marginal cost once that file is open is zero. The same is
true of A6-014 (version line), A6-011 (greyscale-safe warnings) and A6-005 (logo
downsample). **Recommendation: tier the value, schedule the packet.** When a lower-tier item
rides free inside a higher-tier change, scheduling it separately is the error, not
prioritising it.

**5-2 · A7-002 should be P1, not P2 — and the hierarchy says so.**
GA receiving `first_field_name=diagnoses` does not violate the canonical promise; no typed
content moves, and A7-001 confirms that adversarially. On the letter of the rule it is
correctly a P2. But privacy is tier 1, and this is the one place where the promise is
**unfalsifiable by the audience the site explicitly invited to falsify it** — a reader who
opens devtools on the privacy page, as instructed, sees a health-adjacent field name on the
wire and will not parse the value/name distinction. The fix is a **GA property toggle,
roughly five minutes, and does not touch GA**. A P2 that is five minutes of work and
protects tier-1 value should not be scheduled behind sixty other P2s. Raise to P1.

**5-3 · A8-006 (Accessibility Statement) should not be P0, and publishing it first would be
actively harmful.**
V3/V4 already flagged the severity as wrong (`harm_if_unfixed: 5` is the highest score in
either file and does not clear that bar). I go further on hierarchy grounds. A missing
*document about* accessibility is a **Clarity**-tier item (3), not an **Accessibility**-tier
item (2) — it makes nothing usable. Its P0 is inherited from the caption gap it describes,
which is separately P0 as A4-001. And publishing a statement while the captions are still
missing converts an undocumented defect into a **dated, signed admission**. Sequence it
strictly behind C-01, and file it at P2.

**5-4 · A9-021 (English only) is filed in the wrong category, and the hierarchy would move
it if it were filed correctly.**
A9 files it as *reach / equity* — tier 5, the lowest — with `harm_if_unfixed: 4` and XL
effort. For a Spanish-dominant parent of a disabled child, an English-only interface is not
a reach problem; it is an **access** problem, tier 2, and the hierarchy would lift it above
most of the P2 list. I am not recommending that it be actioned now: V5 is right that it
rests on the same untested gatekeeper premise as A9-013 (PLAUSIBLE), and XL effort on an
untested premise is not defensible. But it should be **recorded as an accessibility item
deferred for evidence**, not as a growth item deprioritised by rank. Those are different
decisions and they will be revisited differently.

**5-5 · Where I agree with the hierarchy against my own instinct.**
E-005 is a real Privacy-vs-Accessibility collision: `DisplayDocTitle true` is the
PDF/UA-required, accessible setting, and it is the mechanism that puts a disabled child's
name on a projector. My instinct was to look for a middle path. There isn't one that is
better than the hierarchy's answer — privacy wins, so change the `/Title` string and keep
the accessible setting. Accessibility loses nothing, because a generic document title is a
perfectly good accessible title. Recorded because the brief asked for conflicts to be named
rather than silently split, and this is the one place the hierarchy did real work.

---

## Closing test

The brief's test for every conclusion: *does this help a frightened parent at 11pm finish
this document, and does what they produce serve whoever must read it someday?*

Against that test, the audit's centre of gravity is not the 12 P0s as listed. It is:

1. **Print what is missing** (E-001) — the incomplete document announces itself, and the
   reader is protected regardless of what the parent believed.
2. **Tell the truth about storage, and show the returning family their letter** (E-002,
   C-04) — the parent does not lose four sittings, and can tell loss from confusion.
3. **Ship an HTML version** (E-003, C-12, C-06) — the reader can read it, including the
   blind sibling who is the whole point of the document.
4. **Make the emergency sheet a real page** (E-004, C-02) — 612×792, greyscale-safe,
   dated, with a URL, and refusing to download empty.
5. **Caption and transcribe the video** (C-01) — five analyses, one file.
6. **Wire two dead tokens** (C-03) — the P0 that is two lines.

Everything else in the 157 is downstream of those six, cheap enough to ride along with
them, or genuinely optional.
