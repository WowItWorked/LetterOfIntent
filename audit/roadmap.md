# Roadmap and Coverage Statement

Synthesis of the nine-perspective audit (157 findings) into a sequenced plan, plus an
honest account of what the audit did not and could not see.

**Two parts, equal weight.** Part 1 says what to do. Part 2 says how much to trust Part 1.
If you only read one, read Part 2 first — it changes how you should read Part 1.

**Governing hierarchy used to resolve every conflict below:**
1 Privacy › 2 Accessibility (including cognitive) › 3 Clarity › 4 Design quality › 5 Growth and reach.
Where I think the hierarchy — or the brief's own scoping decisions — reach the wrong answer,
I say so in the open, in [§1.8](#18-where-i-disagree).

**The test applied to every item:** does this help a frightened parent at 11pm finish this
document, and does what they produce serve whoever must read it someday?

---

## 0. Read this before the tables

**157 findings is not 157 work items.** The nine analyses ran independently, so the same
defect is filed up to six times with six different severity scores. Any plan built by
walking the index top to bottom will double-count. The major collapses:

| One fix | Findings closed | Notes |
|---|---|---|
| Focus indicator (2 lines + 3 call sites) | **A1-002, A3-001, A4-003, A4-012**, partly A4-011 | `--ring` / `--ring-w` are dead tokens (V1). A4-003 names two call sites; there are **three** — `ReminderPanel.tsx:71` is the missed one (V2) |
| PDF `<Document>` props (one block, two files) | **A4-006, A7-009, A6-015** | `loi-document.tsx:249-254`, `emergency-document.tsx:158-162`. Adding `language` converts **247 failed veraPDF checks to passes** (V2) |
| Video captions + transcript (one asset) | **A4-001, A4-002, A1-007, A2-018, A3-002, A9-022** | Filed six times, scored six different ways |
| Broken `/privacy` meta description (one string) | **A5-002, A9-008, A8-014** | Live in production, byte-identical local and prod |
| Remove the dead email input | **A3-007, A5-004, A9-015** | |
| One time-estimate decision | **A2-003, A3-004** | |
| One backup/delete glossary pass | **A5-005, A5-006** | |
| Letter cross-references to absent sections | **A5-001, A3-006** | Written blind to each other; they corroborate |

**Tier is not schedule.** Two P0s are effort L and one of those is architecturally blocked.
"P0" here means *must be true before this is fair to hand to strangers*; it does not mean
*possible this week*. The horizons below sequence by what can actually land.

---

## PART 1 — ROADMAP

### 1.1 The five already-fixed findings: zero engineering time, zero deploy time

The brief says these "need DEPLOYMENT, not development." **That premise is out of date.**
V1 and V2 both measured production directly: `b243107` is live. These need *neither*.

| ID | Status | Action |
|---|---|---|
| A1-006 | Fixed and deployed (`b243107`) — poster frame, no autoload | **Close. Mark RESOLVED in the report.** |
| A1-011 | Fixed and deployed | **Close.** |
| A3-003 | Fixed and deployed. V3's note is explicit: *"contrary to CHANGES-DURING-RUN.md, already deployed. This needs no work at all, not even deployment."* | **Close.** |
| A9-024 | Fixed and deployed | **Close.** |
| A4-002 | **Half live.** The video-duration half is fixed and deployed; the transcript / audio-description half is not | **Split.** Close the duration half; the remainder joins the caption cluster (§1.4) |

Two corrections that run the other way, and cost time if missed: V2 measured production and
found **A3-012** (video play control not voice-addressable by its visible name) and
**A4-015** (custom key handler swallows Space) flip from "local, pending deployment" to
**live production defects**. They are P2/P3, but they are real now.

---

### 1.2 P0 validation — the 12, tested against the brief's definition

P0 triggers: *someone excluded · data leaves the device unexpectedly · the privacy promise
is inaccurate · a legal requirement unmet · work silently lost.*

| ID | Trigger claimed | Verdict | Why |
|---|---|---|---|
| **A2-001** | Someone excluded | **KEEP** | The only *total* exclusion in the set. Storage-blocked browser → "This page couldn't load" on every wizard section, in production, no explanation, no way past. V1: *"the single strongest finding across both reports."* |
| **A3-005** | Work silently lost | **KEEP** | The emergency sheet downloads near-empty with no warning. `emergencyHasContent` is defined, called nowhere, and untested, while its twin `keyPointsHaveContent` **is** called (V2). The family is not told. |
| **A6-001** | Work silently lost | **KEEP** | Every emergency sheet is content-height, never 792pt. The **shipped** disabilities sample is 11.84 in on 11 in paper → shrink-to-fit at 71% (9pt body → 6.4pt) or silent clipping of the EMERGENCY CONTACTS box. Ten files, ten measurements, hand-authored samples not synthetic fixtures. |
| **A1-002** | Someone excluded | **KEEP** (merge with A3-001) | Duplicate of A3-001. See below. |
| **A3-001** | Someone excluded | **KEEP** | Focus ring 1.52:1 on every ivory/white surface; form fields have `outlineStyle: "none"`. A keyboard, switch or magnifier user cannot see where they are. Canvas read-back, reproduced independently by A4 and V2 to two decimals. |
| **A4-012** | Someone excluded | **KEEP** | Forced-colors: no focus indicator **at all** on form fields. V2 tried to refute it and it survived a stricter test. |
| **A4-006** | Someone excluded / legal | **KEEP** | Untagged PDFs, no `/Lang`. A blind trustee opening the letter gets inferred reading order and the wrong TTS voice. One-line fix for the language half. |
| **A6-004** | Someone excluded | **KEEP tier, RESEQUENCE** | Same defect, full scope. But V2 searched the installed `@react-pdf/renderer` 4.5.1 types for `StructTree`, `MarkInfo`, `tagged`, `Lang`, `role`, `accessib` — **zero hits for all six**. Full PDF/UA is *not implementable* with the current engine. This is a decision (§1.6 D1), not a ticket. |
| **A4-001** | Legal requirement unmet | **KEEP, with a flag** | SC 1.2.2 is Level A — the floor — on a tool built for disabled people. The owner has deprioritised captions for MVP. I record the P0 and disagree with the deferral: see [§1.8](#18-where-i-disagree). |
| **A5-005** | Work silently lost | **DEMOTE → P1** | Six names for the backup action. Real, but the harm is a *three-step chain* (misread the label → believe you backed up → browser evicts), not a direct loss, and V3 already cut reach 5→4. Worse, V3 proved the measuring instrument (`terminology.mjs`) counts TypeScript keywords and comments as user-facing copy, so the "96 uses" headline is fiction. The finding survives on co-located screenshots, not on its numbers. **Demoting does not delay it** — it is effort S and ships in the same week (§1.7). |
| **A8-006** | Legal requirement unmet | **DEMOTE → P1** | An Accessibility Statement is *required* under EN 301 549 / the EU Web Accessibility Directive for public-sector bodies. This is a private US law firm's free tool. A8's own citation hedges ("nexus theory in the Fourth Circuit is unsettled"). Nobody is excluded by its absence — it is a disclosure. V4 also cut harm 5→4. Additionally, `audit/policies/accessibility-statement.md` is already drafted: this is *review and publish*, not *build*. |
| **A6-012** | — | **DEMOTE → STRATEGIC** | "HTML should be a first-class output" is a product decision, not a defect. Nobody is excluded *today* by its absence if the PDF metadata is fixed. Confidence INSPECTED, effort L. It is the right long-term answer to A6-004 and belongs in §1.6 D1 with it. |

**Result: 9 P0 findings, 6 work items** (the focus-ring four collapse to one; A4-006 and A6-004
share a starting edit).

---

### 1.3 IMMEDIATE — this week

Ordered by effort ascending so quick wins land first, then by dependency.

| # | Item | Findings | Effort | Depends on / blocks |
|---|---|---|---|---|
| **W1** | Give focus a visible indicator. Raise the ring to ≥3:1 on ivory/white, restore an outline on form fields, add a `forced-colors` fallback. Three call sites: `field-ui.tsx:9`, `PhotoFields.tsx:239`, **`ReminderPanel.tsx:71`**. `--ring`/`--ring-w` are dead tokens, so this is a two-line base change, not a new API. | A1-002, A3-001, A4-003, A4-012, partly A4-011 | **S** | None. Do first. Partially mitigates A4-007 (§1.4) but does not fix it. |
| **W2** | Fix the PDF `<Document>` props in both documents: add `language="en-US"`; replace the name-bearing `/Title` and `/Author` with a generic title. One block, two files. | A4-006, A7-009, A6-015 | **S** | None. Converts 247 veraPDF failures to passes. **Do these together** — A6-004 notes the accessible fix pushes toward *more* title prominence while A7-009 needs *less*; "Letter of Intent", nameless, satisfies both. Fixing them separately will produce a fight. |
| **W3** | Stop the emergency sheet downloading near-empty in silence. Wire up `emergencyHasContent` (its first use *and* its first test), and warn before download. | A3-005 (app half) | **M** | None. The PDF half of A3-005 waits on W4. Note V2's correction: the sheet already prints *"None recorded — confirm with family."* — A3-005's implication of a bare "None recorded" is refuted; the finding survives entirely on the uncalled guard. |
| **W4** | Make the emergency sheet exactly one US Letter page. Remove `wrap={false}`, tighten the `clamp()` budgets, add a build-time assertion that typical and maximal render at 612×792. | A6-001 | **M** | **Blocks A6-008** (adding doctors consumes vertical space) and **A6-016** (regenerate shipped samples — must be last). Medium risk: changes layout for every existing user's next download; needs visual regression against three fill levels plus both shipped samples. |
| **W5** | Handle storage failure. Catch the `QuotaExceededError`, explain it in plain language, and offer a path that does not require persistence. | A2-001 | **M** | None. Blast radius is wider than filed: V1 found the same throw also reaches `/`, `/letter`, `/letter/review`, `/your-data`, which survive by luck. `VideoPlayer.tsx:112-116` already wraps its own `setItem` in a `try/catch` with a comment explaining why — the codebase knows the hazard in one place and not in the one that matters. |
| **W6** | Publish a transcript for the explainer video, as the interim step toward captions. | Partial: A4-001, A4-002, A1-007, A2-018, A3-002, A9-022 | **S–M** | See [§1.8](#18-where-i-disagree). A transcript does **not** satisfy 1.2.2; it is a down payment, and it also closes A5's single largest coverage gap and A9-022's crawlable-prose argument in the same stroke. |

---

### 1.4 30 DAYS — P1, plus the two demoted P0s

Grouped by cluster, because these have real ordering constraints.

**Cluster A — the documents tell the truth about themselves** *(sequence matters)*

| Order | Item | Findings | Effort | Why this order |
|---|---|---|---|---|
| A1 | Fix the two PDF text colours that fail contrast and give the tinted "warning" boxes a non-colour signal | A6-011 | S | **Must land with or before A6-003.** V3: fixing A6-003 makes the `sectionEyebrow` style render on every section page, *multiplying* the contrast exposure from 3 pages to ~25. Also under-reported: the cover's two 11pt engraved lines are GOLD_DEEP at 3.66:1 and fail 1.4.3 too. |
| A2 | Make the "SECTION N" eyebrow render | A6-003 | S | After A1. |
| A3 | Bring the page footer back onto the page (disclaimer + "Page N of M") | A6-002 | M | Independent. Symptom is conclusive (zero occurrences of `"Page "` across ten files); mechanism is not. V3 observed offsets escalating page by page (`-6834` → `-1351523584`), which argues against a constant-origin bug. |
| A4 | Stop the letter pointing readers at sections that are not in it | A5-001, A3-006 | S | After A2 — some references resolve once eyebrows render. |
| A5 | Say what was left blank | A2-002 | M | After W4 and A3 — it changes page count and pagination. |
| A6 | Add treating doctors to the emergency sheet | A6-008 | S | **After W4.** Consumes vertical space that W4 has to have reclaimed first. |
| A7 | Tell the reader who to give the document to and where to keep it | A6-013 | M | Independent. |

**Cluster B — the site tells the truth about itself**

| Item | Findings | Effort | Notes |
|---|---|---|---|
| Resolve and correct the time estimate | A2-003, A3-004 | S after a decision | **Blocked on D2 (§1.6).** V2 is blunt: the contradiction is arithmetic and certain, but *which* number is wrong is undetermined, "so the finding cannot yet tell anyone what to change." |
| One vocabulary for backup, one for delete | A5-005 (demoted P0), A5-006 | S | Act on the co-located screenshots, **not** on the counts. Add the vocabulary to `AGENTS.md`/`CLAUDE.md` so it survives the next contributor. |
| Define "trustee" | A5-003 | S | Load-bearing word of the entire special-needs path. |
| Publish a retention and deletion statement | A8-007 | M → review | Draft exists: `audit/policies/data-retention-and-deletion.md`. V4 measured `navigator.storage.persisted() === false` on production, upgrading A8-007's inference to fact. Bracketed `[[…]]` values need the owner. |
| Publish an Accessibility Statement | A8-006 (demoted P0) | M → review | Draft exists: `audit/policies/accessibility-statement.md`, plus `audit/vpat-draft.md`. **Depends on this roadmap** — the draft's own warning is that "publishing a conformance claim the site cannot support is worse than publishing nothing." State a target and honest gaps. **And re-check every SC citation first — see §2.5.** |

**Cluster C — the family can find their way**

| Item | Findings | Effort | Notes |
|---|---|---|---|
| Sticky masthead hides freshly-focused controls | A4-007 | S | Real SC 2.4.11 (AA) failure — four stops 100% covered, a textarea 91% covered. Invisible to every automated rule. **This directly contradicts A3-017's assertion that 2.4.11 "is met." A4-007 is right; strike the A3-017 sentence before anything is published.** |
| Start medications and doctors with one open row | A2-008 | S | The emergency sheet's most safety-critical lists are currently opt-in by click. |
| Show returning families that their letter exists | A2-005 (+ A3-010) | S | |
| Progress feedback on the ~14s "Download all three" | A2-016 | S | |
| Put the letter above the promotional sections on Review | A3-015 | S | **Over-scored.** V2 re-measured at the identical seed and viewport: 43% not "roughly 82%", y=2,788 not 5,300, ~2,240px not 5,000px. The finding holds; the drama does not. |
| Make "Start your letter" start the letter | A2-004 | M | |
| Spread worked examples evenly | A3-014 | M | `mission_impact: 5` rests on the unobserved claim that more examples change what families write. Real, unproven. |

**Deferred out of the 30-day set, with reasons**

- **A6-010** (emergency sheet laid out for the family, not the stranger) — over-scored (V3 cut
  mission 5→4), one of its four supporting arguments is refuted by A6's own sibling finding,
  and A6 itself says it "deserves five minutes with an actual ER nurse." **Buy the five
  minutes before spending the M.**
- **A2-017** (7.8s first paint on Slow 3G) — effort L, A2's own least-confident finding,
  explicitly outside its lane, and the CPU multiplier was measured on a desktop.
- **A9-014** (gatekeeper assets) — XL, and it rests entirely on A9-013, which V5 marked
  PLAUSIBLE and could neither confirm nor refute. → STRATEGIC (§1.6 D4).

---

### 1.5 90 DAYS — the P2 work that matters

67 findings are tiered P2. These are the ones worth doing, ordered by the governing hierarchy.

**Rank 1 — Privacy: the substance is sound; the description is not.**

A7-001 is the most thoroughly tested claim in the entire audit and it **passes** — no
user-typed content leaves the device, verified adversarially against production. Everything
below is accuracy-of-description, which under the hierarchy still outranks all of §1.5.

| Order | Item | Findings | Effort | Notes |
|---|---|---|---|---|
| 1 | **Fix the egress test first.** It exempts every analytics host and asserts nothing about which events fire — which is precisely why A7-002 went unnoticed. | A7-012 | S | **Under-scored** (V4: harm 3→4). Do this before the fixes it guards, or they regress. V4's trap: the Cloudflare beacon is only injected on `Accept: text/html`, so a naive `curl`/`fetch` CI check **passes while the beacon ships to every real visitor**. Drive a real browser or send the header. |
| 2 | Turn off GA4 Enhanced Measurement form/scroll/download/search events | A7-002 | S (config, not code) | `form_start` carries `f-diagnoses` / `diagnoses` / `form_length=7`. **This does not violate the canonical promise** — no typed content is transmitted — but it contradicts what the privacy page currently says. V4 also found **`scroll` firing** (`percent_scrolled=90`), which neither A7 nor A8 knew. |
| 3 | Correct SECURITY.md | A8-002 | S | It currently says *"No other analytics"* and *"No external scripts are loaded."* Production contradicts both. **Blocks publication of the `/security` page**, whose draft is derived from it. |
| 4 | Disclose Cloudflare as a processor; disclose the two injected scripts | A8-001, A7-004, A7-005 | S | The beacon is CSP-blocked; the email decoder **runs**, same-origin, on every page including `/privacy` itself. |
| 5 | Make the privacy page's strongest sentence true by design, not by CSP accident | A8-003 | S | |
| 6 | Fix the three claims the copy gets wrong: "device" vs per-browser; one literally false statement; the disability-disclosing filename | A5-012, A5-011, A5-015 | S each | |
| 7 | Make "Delete all my data" actually delete | A7-007 | S | V4: the zustand persist middleware rewrites the key on the *next state change of any kind*, not merely on reload — so A7's proposed "`removeItem` on the next tick" fix would not survive. `SECURITY.md:240-243` already proposes `Clear-Site-Data`, a fourth option A7 never lists. |

**Rank 2 — Accessibility**

- **Caption cluster** (A4-001 remainder, A4-002 remainder, A1-007, A2-018, A3-002, A9-022) —
  one asset, six findings. See §1.8.
- **Keyboard and structure**: A2-006 (17 links before the first question on every one of 15
  sections; the rail is a `nav` inside `main` with no accessible name, so it cannot be reached
  by landmark either), A4-013 (focus dropped to `<body>` on every section change), A4-010
  (announces itself as tabs, does not behave as tabs), A2-012 (one heading on a 3,596px form),
  A2-011 (94- and 101-word button names).
- **Vision**: A4-011 (state carried by colour alone, both under 3:1), A3-016 (6px gold dot at
  2.10:1 — V2's number, not A3's 2.3:1), A2-007 and A3-017 (fixed chrome eating 45% at 200%
  zoom / a third at 400%), A3-008 (forced-colors progress cues vanish), A4-005 (samples are
  pictures of text).
- **Output**: A6-006 (letterspacing corrupts the text layer — "DIAGNOSES" extracts as
  "D I A G N O S E S"; this also breaks copy-paste for *everyone*), A6-009 (no bookmarks in a
  64-page letter), A6-017 (silent truncation of medical fields).
- **Process**: A4-016 — the project's own accessibility gate is structurally blind to the
  brand's two signature surfaces. Effort L, but it is the control that keeps everything above
  from regressing. V2 adds a good first assertion: `--ink-faint` on `--paper-2` is **4.57:1**,
  not the 4.92:1 A4-017 reports — a 0.07 margin on the tightest AA text pair on the site,
  which any future paper-tint change breaks silently.
- **A3-009** (no dark mode, hard-coded light) — effort L, and the strongest single argument
  for it is the product's own positioning: a tool explicitly designed for use at midnight.

**Rank 3–4 — Clarity, correctness, trust**

- **A9-010** — both firm CTAs 404. Effort S, harm 4, live in production, the only
  revenue-bearing exit the product has, and V5 verified the correct replacements return 200.
  **This should not wait 90 days; it belongs in the first Saturday (§1.7).**
- A6-014 (a reader in 2041 cannot tell if this is the current version), A2-009 (retypes a
  person the site already has), A2-015 (no way to find an answer), A1-003 (10–11px labels
  break the design system's own written 12px rule), A9-011 (the attorney bio exists in config
  and renders nowhere), A6-016 (**regenerate the four shipped samples last**, after W4, A3
  and A6-003 land — they currently carry every defect including the two worst).
- Remove the dead email input: A3-007, A5-004, A9-015. V2 marked A3-007 PLAUSIBLE — the facts
  all reproduce, the causal argument ("looks like the most important control in its card")
  does not. The fix is right on other grounds.

**Legal and policy — review-and-publish, not author**

Ten drafts already exist under `audit/policies/`. Every one carries a **DO NOT PUBLISH AS-IS**
banner and needs attorney review. Sequenced: A8-002 → `/security`; roadmap + VPAT →
accessibility statement; the rest are parallel. Covers A8-004 (CalOPPA — five missing elements,
statute has no revenue threshold), A8-005 (Terms), A8-008 (Children's/COPPA), A8-010
(ePrivacy — note V4: `SECURITY.md:129-141` *already* documents this decision and already
recommends Consent Mode v2 with Google Signals off, so A8-010's "unexamined default" framing
is wrong), A8-012, A8-013, A8-015.

**Explicitly deprioritised within P2, and why**

| Findings | Why not now |
|---|---|
| A9-004 (answer content) | XL against an INFERRED benefit. No Search Console, no traffic data, no keyword difficulty. |
| A9-012 (social proof) | L, and A9 itself concedes there is "no honest way to get any without breaking the privacy model." Rank 1 beats rank 5. |
| A9-013 (law-firm-publisher barrier) | PLAUSIBLE, XL, premise untested. → D4. |
| A9-021 (English only) | XL and architectural — but **I think its classification is wrong**. See §1.8. |
| A8-009 (Washington MHMDA) | NOT_VERIFIED, genuinely open question of statutory construction. → outside counsel, not engineering. |

---

### 1.6 STRATEGIC — decisions, not implementations

Nothing here should be given to a developer until someone rules on it.

**D1 — What is the accessible output format?** *(A6-012, A6-004; the largest architectural
question in the audit)*
V2 established that `@react-pdf/renderer` 4.5.1 exposes **no structure-tree API of any kind**.
PDF/UA-1 conformance is unreachable without changing the engine. Three options: (a) accept
untagged PDF, fix the metadata (W2), and ship a self-contained HTML version as a first-class
output; (b) replace the PDF engine; (c) accept the gap and disclose it honestly. **Recommend
(a).** It is the cheapest route to an actually-accessible document, it fixes A6-006's corrupted
text layer for free, and it gives A6-009's navigation problem a native answer. This decision
also constrains the honest wording of the Accessibility Statement — so it blocks that too.

**D2 — Which time estimate is true?** *(A2-003, A3-004)* The site says 45–90 minutes; its own
badges sum to 165. Nobody knows which is right. Cheapest resolution: time four real sections
end to end. Until then the finding cannot tell anyone what to change.

**D3 — Captions.** Owner-deferred. See §1.8.

**D4 — Is the law-firm-publisher barrier real?** *(A9-013, A9-014)* Two XL recommendations and
eight rows of A9's channel map hang on a premise nobody tested. A9 proposed the test itself:
phone three to five gatekeepers. **Make the calls before spending the XL.**

**D5 — Spanish.** *(A9-021)* The one finding scoped `architectural`. See §1.8 — I think this
is filed under the wrong heading.

**D6 — Email reminders: build the service or remove the input.** *(A3-007, A5-004, A9-015)*
Removing is S and available today.

**D7 — Get read access to GA4 and Search Console.** Not a fix; an unblock. It is A8's
self-declared "single largest gap" and A9's, and it would settle the prevalence question
behind A2-001, the legal classification of GA under state law, and whether A9-001's effect is
real. Roughly an afternoon of account admin against several days of unresolvable analysis.

**D8 — Legal review of the ten policy drafts.** Attorney time, not engineering time. Note the
drafts' own dependency: `/security` must not publish before A8-002 is corrected.

---

### 1.7 THE SINGLE MOST IMPORTANT THING TO DO THIS WEEK

> ## **A2-001 — make the site work when the browser will not let it write to storage.**

**The argument.**

Every other P0 degrades something. This one *ends* it. A browser that refuses `localStorage`
gets **"This page couldn't load"** on every wizard section, in production, right now, with no
explanation, no diagnosis, and no way past. There is no partial experience, no workaround, no
degraded mode. The person leaves.

Under the governing hierarchy this is rank 2 — accessibility, read as the brief instructs, as
*someone is excluded* rather than as ARIA conformance. It is the only complete exclusion in
157 findings.

**Who this is.** Not a random 2%. The triggers are "block all site data" settings, managed and
locked-down devices, some in-app browsers, and quota exhaustion — which means library
computers, shelter computers, school and hospital family-room machines, employer laptops, and
the phones of people who have deliberately hardened their browser. That last group is
disproportionately the privacy-conscious families this product is explicitly built to attract.
It is very close to a literal description of the brief's reader: a frightened parent at 11pm
on a borrowed computer.

**Why it beats the alternatives.** The focus ring (W1) affects more people and costs less — do
it the same day — but a keyboard user with a bad focus ring can still finish the document. The
emergency-sheet defects (A3-005, A6-001) govern a document a paramedic reads, but a thin or
badly-scaled sheet still leaves the family better off than the status quo of no sheet at all,
and A6-001's fix carries medium risk and needs a visual regression pass it should not be
rushed through. A2-001 leaves the family with nothing and tells them nothing.

**The honest counter-argument, and why it loses.** A2 marked the *prevalence* NOT_VERIFIED —
modern Safari private browsing no longer throws, so nobody knows how many people hit this. That
does not defeat it. The fix does not require knowing the prevalence; A2 rates the change
additive and low-risk with the happy path untouched. Being wrong about prevalence costs a few
hours. Being wrong the other way costs a family who typed the domain, saw a broken page, and
concluded the tool does not work.

And the codebase already knows: `VideoPlayer.tsx:112-116` wraps its own `localStorage.setItem`
in a `try/catch` with a comment explaining exactly this hazard. The protection exists in the
place where failure is cosmetic and is absent from the place where failure is total.

---

### 1.8 Where I disagree
<a id="18-where-i-disagree"></a>

**1. The caption deferral is wrong, and I would reverse it.**

The brief holds accessibility at rank 2 and simultaneously deprioritises captions for MVP.
Those two statements are in tension, and applying the hierarchy plainly resolves against the
deferral. Three reasons beyond the hierarchy:

- SC 1.2.2 is **Level A** — the floor, not an aspiration — on a tool whose entire reason for
  existing is families with disabilities. Of every accessibility gap in this audit, this is the
  one that reads worst in a demand letter and the one hardest to defend in an Accessibility
  Statement the same team is about to publish.
- **It is cheaper than its effort score implies.** The video is 4m38s and its duration is
  already measured to the second. Machine transcription plus one human correction pass over
  medical and legal terms is a Saturday afternoon, not a project.
- **The deferral has two hidden costs the audit already measured.** A5 could not audit the
  video's script at all — it calls this its single largest coverage gap — so we do not know
  whether the narration defines "trustee", matches the site's register, or states the privacy
  promise accurately. And A9-022 shows it forfeits the site's best crawlable prose. Captions
  are not only an accessibility debt here; they are an evidence debt and a reach debt.

I have respected the ruling in the sequencing (transcript in week one, full captions in
30–90 days) but I am not going to pretend the deferral is neutral.

**2. A9-021 (English only) is misclassified as reach.**

It is tiered P2, categorised "reach / equity", and under the hierarchy that puts it at rank 5,
where it gets deprioritised. I think that is the wrong shelf. For a monolingual Spanish-speaking
caregiver, an English-only tool is not reduced reach — it is exclusion, which is rank 2. The
hierarchy's own parenthetical instructs that accessibility be read broadly ("including
cognitive, not only ARIA conformance"), and this audit treats plain language as accessibility
throughout — A3's entire remit is built on that reading. Language access sits in the same
family.

I am **not** saying build Spanish now. It is genuinely XL, and V5 is right that the reach
consequence leans on the same untested gatekeeper premise as A9-013. I am saying it should be
recorded as **deferred accessibility with a named reason and a named decision-maker**, not as
growth. The practical difference is who has to keep signing off on the deferral.

**3. Where the hierarchy is right and I want to say so.**

- Privacy over growth: A9's distribution programme is throttled by the privacy model
  (A9-012 concedes there is no honest route to social proof). The hierarchy is correct, and
  A7-001's clean result is the reason the product deserves the constraint.
- Accessibility over design: the focus ring is brand gold at 1.52:1. The brand system is off
  the table, but a focus-ring colour is not a brand element, and there is no conflict to
  resolve once you say so.
- Clarity over design: A1-003 and A3-013 (10–11px labels) do not even reach the hierarchy —
  the design system's own written rule says never below 12px. The system already agrees.
- One apparent rank-1-vs-rank-2 conflict dissolves: A7-009 wants the child's name out of the
  PDF `/Title`; A4-006/A6-004 want a meaningful title for screen readers, and A6 flags the
  tension itself. "Letter of Intent", with no name, satisfies both. Fix them in the same
  commit (W2) or the second fix will undo the first.

---

### 1.9 CHEAPEST HIGH-VALUE WINS

Every finding with **effort S** and **harm_if_unfixed ≥ 3**: 56 total, of which **55 are
actionable** (A2-014 is REFUTED; A1-006 is already fixed and deployed). Sorted by harm
descending, then score descending.

**The first Saturday** — highest harm, and several close multiple findings at once:

| # | ID(s) | What to do | Harm |
|---|---|---|---|
| 1 | **A1-002 + A3-001 + A4-003 + A4-012** | One focus-ring fix, three call sites, four findings closed | 5 |
| 2 | **A4-006 + A7-009 + A6-015** | One `<Document>` props block, two files, three findings, 247 veraPDF checks flipped | 5 |
| 3 | **A9-010** | Repoint two 404'd firm CTAs; V5 verified the replacements return 200 | 4 |
| 4 | **A5-002 + A9-008 + A8-014** | One broken meta-description string, live in production | 3 |
| 5 | **A3-007 + A5-004 + A9-015** | Delete the dead email input | 3 |
| 6 | **A5-005 + A5-006** | One backup vocabulary, one delete vocabulary | 4 / 4 |
| 7 | **A5-001** | Stop the PDF telling a caregiver in a crisis to read sections that do not exist | 4 |
| 8 | **A2-008** | Start medications and doctors with one open row | 4 |

**Full list (55 actionable), harm descending:**

| ID | Tier | Harm | Score | Title (abbreviated) |
|---|---|---|---|---|
| A1-002 | P0 | 5 | 12 | Focus ring invisible on every light surface |
| A3-001 | P0 | 5 | 12 | Focus indicator 1.52:1 on ivory and white |
| A4-006 | P0 | 5 | 11 | Untagged PDFs, no declared language |
| A4-012 | P0 | 5 | 10 | No focus indicator at all in High Contrast Mode |
| A2-008 | P1 | 4 | 13 | Medications and doctors are opt-in by click |
| A5-005 | P0→P1 | 4 | 13 | Six names for the backup action |
| A5-001 | P1 | 4 | 12 | PDF points a caregiver at absent sections |
| A4-003 | P1 | 4 | 11 | Site-wide focus indicator 1.5:1; fields have no outline |
| A5-006 | P2 | 4 | 11 | Five names for an irreversible destructive action |
| A8-003 | P2 | 4 | 11 | Strongest privacy sentence true only by CSP accident |
| A4-007 | P1 | 4 | 10 | Sticky masthead hides freshly-focused controls |
| A6-006 | P2 | 4 | 10 | Letterspaced labels extract as broken text |
| A9-010 | P2 | 4 | 10 | Both firm CTAs return 404 |
| A2-006 | P2 | 4 | 9 | 17 nav links before the first question, ×15 sections |
| A7-007 | P2 | 4 | 9 | "Delete all my data" leaves three traces |
| A2-018 | P2 | 4 | 8 | Video has no captions or transcript |
| A2-003 | P1 | 3 | 12 | 45–90 minutes contradicted by 165 minutes of badges |
| A3-004 | P1 | 3 | 12 | The two time estimates differ by ~2× |
| A2-005 | P1 | 3 | 11 | Returning family sees no sign their letter exists |
| A2-016 | P1 | 3 | 11 | ~14s download with no progress |
| A3-015 | P1 | 3 | 11 | Letter sits below two promotional sections on Review |
| A5-003 | P1 | 3 | 11 | "Trustee" never defined |
| A6-008 | P1 | 3 | 11 | Emergency sheet omits the treating doctors |
| A6-014 | P2 | 3 | 11 | No way to tell if the letter is the current version |
| A1-003 | P2 | 3 | 10 | Structural labels at 10–11px vs the system's own 12px rule |
| A3-007 | P2 | 3 | 10 | Dead email signup looks like the primary control |
| A3-010 | P2 | 3 | 10 | Home page shows no letter in progress |
| A3-011 | P2 | 3 | 10 | Progress and section list collapsed on phones |
| A6-011 | P2 | 3 | 10 | Two PDF text colours fail contrast; warnings vanish in mono |
| A7-002 | P2 | 3 | 10 | Typing fires GA `form_start` with field names |
| A8-001 | P2 | 3 | 10 | Cloudflare undisclosed; second beacon injected |
| A2-007 | P2 | 3 | 9 | 45% of viewport is fixed chrome at 200% zoom |
| A5-004 | P2 | 3 | 9 | Email form invites an action it cannot perform |
| A5-012 | P2 | 3 | 9 | Promise says "device"; storage is per-browser |
| A6-009 | P2 | 3 | 9 | No PDF bookmarks in a 64-page letter |
| A6-017 | P2 | 3 | 9 | Emergency sheet silently truncates medical fields |
| A7-004 | P2 | 3 | 9 | Undisclosed Cloudflare beacon on every page |
| A7-005 | P2 | 3 | 9 | Cloudflare email decoder runs same-origin on wizard pages |
| A7-012 | P2 | 3 | 9 | Egress test exempts every analytics host |
| A8-008 | P2 | 3 | 9 | No Children's Information notice |
| A3-016 | P2 | 3 | 8 | "Has notes" is a 6px gold dot at 2.10:1 |
| A4-010 | P2 | 3 | 8 | Announces itself as tabs, does not behave as tabs |
| A4-011 | P2 | 3 | 8 | "You are here" carried by colour alone, under 3:1 |
| A5-002 | P2 | 3 | 8 | Privacy meta description grammatically broken, in production |
| A5-011 | P2 | 3 | 8 | One privacy claim literally false and easy to falsify |
| A5-015 | P2 | 3 | 8 | Download filename discloses disability |
| A6-016 | P2 | 3 | 8 | The four shipped samples carry every defect |
| A7-009 | P2 | 3 | 8 | PDFs embed the child's and parent's names |
| A3-017 | P2 | 3 | 7 | Masthead takes a third of the viewport at 400% zoom |
| A3-018 | P2 | 3 | 7 | Final-wishes interstitial removes the only way back |
| A5-017 | P2 | 3 | 6 | The one error message below the standard of the others |
| A9-008 | P2 | 3 | 6 | Broken privacy description shipped to search results |
| A3-012 | P2 | 3 | 5 | Video play control not voice-addressable by its visible name |
| A8-002 | P2 | 3 | 5 | SECURITY.md says the opposite of what is true |
| *A1-006* | *P2* | *3* | *9* | *18.8 MB autoloading video — **already fixed and deployed***

---

## PART 2 — COVERAGE STATEMENT

This is not a footnote. Several findings in Part 1 are scored 4 or 5 on premises nobody
observed, and the audit's weakest layer is the one a reader is most likely to quote.

### 2.1 What was not examined at all

| Not examined | Why | Consequence |
|---|---|---|
| **Any real user.** No parent, caregiver, attorney, social worker, ER nurse or gatekeeper organisation. | Not available in the environment. | Every persona is an analyst driving a script. A2 says so plainly: "the abandonment ordering above is my judgement, not data." A6-010 is a design judgement about a stranger's fifteen seconds that no stranger tested. A3-014's `mission_impact: 5` rests on an unobserved claim. A9 contacted **zero** gatekeepers, and two XL recommendations rest on that. |
| **Any real assistive technology.** No NVDA, JAWS, VoiceOver, TalkBack, Dragon, switch interface, eye-gaze or magnifier. | Not available. | A4 calls this "the largest single gap in this audit… the thing I would buy first." Specifically unverified: whether nine per-field `aria-live` regions are usable or chatty; whether the save indicator lands at a helpful moment; whether the `aria-current` rail announces as assumed. |
| **Any browser but Chromium.** | Not available. | `:focus-visible` heuristics, forced-colors handling, native date-input semantics and `<dialog>` behaviour all differ. Every focus and forced-colors finding is Chromium-only. |
| **Any real device.** No real phone, real touch, real Windows High Contrast machine, real browser zoom, or physical printer. | Not available. | A6-001's headline "71% shrink-to-fit" is arithmetic plus general knowledge, not a print test. A2's zoom figures are approximations. A3-008's forced-colors *severity* is inferred — Playwright keeps a light system palette. |
| **The explainer video's content.** Nobody watched or listened to it. | It has no captions and no transcript. | Circular and worth stating: **the absence of captions is what made the video unauditable.** A5 calls this its single largest gap — we do not know whether the narration defines "trustee", matches the register, or restates the privacy promise accurately. |
| **The GA4 property configuration.** | No dashboard access. | A8: "the single largest gap in this report." It determines whether GA is a "sale"/"share"/"targeted advertising" under state law, whether COPPA's persistent-identifier concern amplifies, and whether GDPR is live at all. |
| **Google Search Console / Bing Webmaster.** | No access; there may be no property. | A9 has zero data on impressions, queries or rankings. A9-001 is, in its own words, "a certain cause with an unverified effect." |
| **Cloudflare zone configuration; Vercel and Cloudflare log retention; whether DPAs exist.** | Account-holder access. | Answerable in an afternoon by the owner; not answerable from outside. |
| **`scripts/review-doc/`** (the attorney review pack). | Out of scope per the brief, flagged in-flight. | Untouched by anyone. |
| **The general (non-special-needs) path, end to end.** | Time. | A2 inventoried all 14 sections and measured totals, but ran every persona and every timing on the special-needs path. "Nothing I found looks path-specific, but I have not proven it." |
| **Visual rendering of the audit PDFs.** | No rasteriser installed. | A6 has **not seen the broken footer with its own eyes**. It considers A6-002 established anyway — offsets quoted from decompressed streams, zero `"Page "` across ten files — and V3 reproduced it two independent ways. A human should still open one PDF. |
| **Browser translation tools, Immersive Reader, Read Aloud.** | Not tested. | The site's CSS flourishes and `aria-hidden` spans are exactly what confuses these tools. |
| **Any competitor site.** | A1 could not browse. | A1's entire competitive reference section is general knowledge, labelled INFERRED, unverified. |

### 2.2 What could not be verified, and what verification would take

| Unverified claim | What it would take |
|---|---|
| How often browsers actually block `localStorage` (prevalence behind **A2-001**) | GA4 read access: compare `/letter` page views to `/letter/[slug]`. ~1 hour. |
| Visual severity in a real Windows Contrast Theme (**A3-008, A4-012**) | 10 minutes on a real Windows machine. |
| Whether nine `aria-live` regions and the save indicator are usable or chatty (**A4's largest gap**) | ~2 hours with NVDA, ideally with a real user. |
| Whether shrink-to-fit really produces 71% (**A6-001**) | One physical print on one home inkjet and one office laser. |
| Whether Safari ITP actually evicts this site's storage (**A8-007**) | A real device over a real interval. |
| Washington MHMDA applicability (**A8-009**, NOT_VERIFIED) | Outside counsel. Genuinely open statutory construction. |
| The operative 2025 text of 16 C.F.R. Part 312 (**A8's COPPA reasoning**) | Counsel reading the amended text. Marked INFERRED. |
| Whether more worked examples change what families write (**A3-014**) | Four or five people, watched. |
| Which time estimate is true (**A2-003 / A3-004**) | Time four real sections. |
| Whether the law-firm-publisher barrier is real (**A9-013**, drives two XL items) | Three to five phone calls. |
| Chrome's real autofill behaviour with `autocomplete="off"` (**A4-008**) | 20 minutes in a non-headless profile. |

**Resolved during verification — worth recording as the process working:** whether
`@react-pdf/renderer` can emit tagged PDFs (A6 asked for 20 minutes; V2 spent them; the answer
is **no**, and it reshapes D1). Also CAA records, DNSSEC and HSTS preload membership, all three
of which A7 listed as unverifiable and V4 settled.

**One evidence-integrity problem that verification could not fix.** A7-001 — the audit's single
most important privacy claim, that no typed content leaves the device — states "Script and full
output retained." **They were not.** There is no `a7-*.mjs` under `audit/tools/` and no A7
output under `audit/evidence/`. The headline figures (309 needles, 24 encodings, 91,595
characters) are **not re-runnable**. V4 reproduced the *result* independently, so the finding
holds; but if this audit is ever handed to a third party, that specific claim cannot be checked.

### 2.3 Where the audit is weakest and least trustworthy

Ranked, worst first.

1. **A1 (visual design) is the least reliable analysis in the set.** Bash was unavailable for
   its entire session. It ran **no axe scan**; every contrast number is its own arithmetic on
   computed styles. It withdrew two confident claims mid-audit (a 94px reflow failure that was
   a resize artefact, and a 1440px layout void that was a misread screenshot). Its
   screenshot-provenance evidence is unreproducible (§2.4). And its one REFUTED finding
   (A1-008) shipped with a **recommendation that would have made the site less accessible** —
   V1 measured the proposed `#9a7340` against `--navy-900` at **3.70:1**, worse than the 4.33:1
   it set out to fix. If anyone had actioned it as written, the site would have acquired a
   genuine AA failure.
2. **A5's terminology instrument does not do what its own output file says it does.**
   `terminology.json` carries the note "Counts are over extracted COPY only (string literals +
   JSX text), not identifiers." That is false. The `export` count is dominated by the TypeScript
   `export` keyword; `backup (bare)` counts code comments in `schema.ts`; `IndexedDB` counts a
   comment while *missing* the real user-facing instance in `privacy/page.tsx:147`. **Three
   findings' headline numbers (A5-005, A5-006, A5-012) are fiction.** All three survive on
   co-located screenshot evidence — but anyone acting on the numbers is acting on nothing.
3. **Anything resting only on the shared screenshots.** They are local dev (§2.4).
4. **A9's strategy layer.** A9-013 is PLAUSIBLE and untested; it drives A9-014, A9-021 and eight
   rows of the channel map. V5: "should not be spent against until A9's own suggested phone call
   happens." A9's *measurement* layer, by contrast, is the strongest in the audit.
5. **A2's performance numbers.** 4× CPU throttling on a desktop is not a mid-range phone. The
   13.7s and 7.8s figures are directional. A2 says so.
6. **Specific numbers that did not reproduce**, inside findings that otherwise hold: A3-015's
   distances (43% not 82%; ~2,240px not 5,000px), A4-017's 4.92:1 (it is 4.57:1), A3-016's
   2.3:1 (2.10:1), A4-011's 4.3:1 (5.00:1), A4-005's "4.58 CSS px" (not derivable from its own
   inputs), A4-018's "every standalone control ≥44px" (six footer links are 24px on every page).
7. **The 43 INSPECTED findings and the one NOT_VERIFIED.** 112 of 157 are MEASURED, which is
   good. The rest are reasoned from the artefact.
8. **A data-quality defect in the index itself.** One record's `confidence` field is a mangled
   sentence — `INSPECTEDCODEINSPECTIONPLUSASERVEDHTMLCHECKPLAYBACKITSELFWASNOTTESTED` (A2-018)
   — and `environment` carries five distinct values including free-text parentheticals. Anyone
   filtering the index programmatically will silently drop or mis-bucket rows.

### 2.4 Specific known evidence problems

- **A1 ran no axe scan** (Bash unavailable). **But V1 ran one, on production**:
  `@axe-core/playwright` with `wcag2a/2aa/21a/21aa/22aa/best-practice` across seven production
  routes. Result: **zero WCAG A/AA violations**; the only issue is `region` (moderate,
  best-practice) where the privacy strip sits outside any landmark. That independently
  corroborates A1's "zero text-contrast failures" and confirms A1-002/003/008 are all **outside
  axe's reach** — 2.4.13 has no automated rule, there is no font-size rule, and the gradient
  button lands in `color-contrast` *incomplete*. **The residual risk lives in 3–23
  `color-contrast` incompletes per route that nobody has resolved by hand.** Automated-clean is
  not accessible.
- **The shared screenshots are local dev — and the stated evidence for that is wrong.** My own
  brief (and A1-012) say a Next.js dev badge is visible. **V1 cropped A1's exact coordinates and
  could not find one** — the region is flat navy hero. The conclusion is nonetheless *provable*:
  `audit/tools/capture-artifacts.mjs:16` hardcodes `const BASE = "http://localhost:3000"` with
  no production branch. **Cite the script; retire the badge.** I am recording this because the
  inaccuracy was passed to me as established fact, and it is exactly the kind of confident
  detail that survives into a summary unchecked.
- **The production network capture is stale in three ways.** It predates the video-label change,
  it predates the og-image change, and per `CHANGES-DURING-RUN.md` it predates **even the first
  og-image** — so it reflects a site with no `og:image` at all. It also contains **no PDF
  download**, so same-origin font loading at runtime is INSPECTED, not MEASURED. And it contains
  exactly one GA event name (`page_view`) while **two** enhanced-measurement events
  (`form_start`, `scroll`) demonstrably fire in the field. The capture is not a census of
  analytics behaviour — which is precisely A7-012's point, and the reason A7-002 went unnoticed
  for as long as it did.
- **No real screen reader was ever run.** A2's P3 persona is an accessibility-tree proxy,
  correctly labelled INSPECTED rather than MEASURED. A4's roles/names/states come from Chrome's
  CDP tree, which is what NVDA/JAWS/VoiceOver consume but is not the same as hearing them.
- **No assistive-technology users were consulted. No actual parent was observed using the site.**
- **The target moved during the audit, and the record of where it moved to was itself wrong.**
  HEAD went `d5ec230` → `b243107` mid-run. `CHANGES-DURING-RUN.md` records production as still
  serving the old build; **V2 measured production and found `b243107` live.** Two analyses
  reasoned from a stale build state, five findings are already-fixed noise, and two findings
  (A3-012, A4-015) flipped the other way from "pending" to "live defect."
- **A4 did not re-run its 19-state axe sweep, its reflow matrix, or veraPDF against the new
  HEAD.** It argues the changed files do not touch the wizard, review, sample viewer or PDF
  pipeline — reasonable, but unproven.
- **`audit/evidence/axe/axe-A4-full.json` truncates `nodes` to four** and stores the true count
  in a separate `nodeCount` field. Anyone re-verifying A4-004 or A4-017 by counting
  `nodes.length` will get 4 and 8 and wrongly conclude the analyst inflated the numbers. V2
  nearly did. This needs a README line in `audit/evidence/axe/`.
- **Two findings in the same audit take opposite positions on SC 2.4.11 and neither flags it.**
  A3-017 asserts it is met; A4-007 measures four 100%-covered focus stops. A4-007 is right.
  Anyone assembling a VPAT from both would produce an incoherent document.

### 2.5 The 23 wrong_standard flags — what they say about the audit

The raw ratio understates it. **Only 73 of 157 findings cite a standard at all. 23 of those 73
are flagged wrong — 32% of every citation in the audit.**

By analysis: **A5 = 6, A7 = 6, A6 = 3, A2 = 2, A4 = 2, A8 = 2, A1 = 1, A3 = 1, A9 = 0.**

Four distinct failure modes, and they are not equally serious:

1. **Level errors (A4 ×2).** SC 3.3.7 Redundant Entry called Level AA — it is Level A. SC 3.2.6
   Consistent Help called AA — it is A. Mechanical, embarrassing, and preventable with a lookup
   table.
2. **Wrong criterion — the serious one (A5 ×6).** Citing a real success criterion that does not
   cover the observed behaviour: 3.2.4 Consistent Identification for a *document cross-reference*;
   3.2.2 On Input for a form that changes no context; 3.3.4 Error Prevention for *naming*;
   3.3.3 Error Suggestion where no input error is detected; 2.4.2 Page Titled for verbosity in a
   title that does describe its purpose. Worst of all, **A5-008 cites 3.2.4 in a case where the
   criterion is *satisfied*, and satisfied by exactly the behaviour A5 is complaining about** —
   the citation argues against the finding. This pattern says the standard was reached for as
   rhetorical weight *after* the judgement was made, not used to make it.
3. **Soft misglosses in frameworks (A7 ×6).** NIST Privacy Framework subcategories confused
   (CT.DM-P1 vs P4 vs P5), GDPR Art. 9 over-reached on data that is not health data and in a
   jurisdiction A8's own analysis says probably does not apply, and OWASP ASVS controls aimed
   three times at a different thing than the one being described.
4. **One hard legal error (A8-015).** Cites Cal. B&P §22575(b)(4) for the change-notification
   element. (b)(4) is "identify its effective date"; the change-notification element is (b)(3).

**What it means.** Every one of the underlying observations survived verification. The
*observation* layer of this audit is strong — 151 of 157 CONFIRMED, and the verifiers repeatedly
tried and failed to break the big ones. The *citation* layer is the weakest thing in it, and it
is the layer a reader is most likely to lift and quote.

**And it was avoidable.** A9 got **23 out of 23** right, including three cases where it correctly
declined to claim a criterion was failed. Same audit, same conditions, zero errors.

**The operational consequence, stated plainly:** do not copy a single standard citation out of
this audit into the Accessibility Statement, the VPAT, a policy page, a conformance claim, or a
response to a demand letter without re-checking it against the source text. Those are precisely
the documents this audit feeds (`audit/policies/accessibility-statement.md`,
`audit/vpat-draft.md`), and an accessibility statement that miscites the standard it claims to
meet is worse than no statement at all — which the draft itself already warns about.

### 2.6 What a second pass should do differently

1. **Buy the missing evidence before writing anything.** One screen-reader session, one real
   Windows HCM machine, one real mid-range phone, one physical print, and read access to GA4 and
   Search Console. That is roughly a day of setup, and it would have resolved six to eight of the
   "least confident" findings across five separate analyses — including the one A4 named as the
   thing it would buy first.
2. **Watch four or five real people.** A3-004, A3-014, A5-003, A6-010 and A2's entire abandonment
   ordering cannot be settled any other way, and several are scored 4 or 5 on mission impact off
   premises nobody observed.
3. **Freeze the target.** HEAD moved mid-run, the record of production state was itself wrong, and
   five findings became already-fixed noise.
4. **Separate the observation from the citation, and verify citations mechanically.** Every SC
   number, level and text checked against the published source *before* the finding is written.
   A9's clean record proves this is achievable under the same constraints.
5. **De-duplicate before scoring.** The caption gap is filed six times with six different scores;
   the focus ring four times; the broken meta description three; the dead email form three. Any
   ranking built on the raw 157 double-counts, and severity gets set by whichever analyst felt
   strongest rather than by the defect.
6. **Validate the instruments before trusting their output.** Three separate tools' own
   descriptions were wrong: `terminology.mjs` claimed copy-only extraction and counted keywords;
   `e2e/privacy-network.spec.ts` exempted the very hosts it existed to watch (A7-012); the
   accessibility gate is structurally blind to the brand's two signature surfaces (A4-016). A
   half-day validating the tooling would have been the cheapest quality intervention available.
7. **Retain every script and its output.** A7's canary search is the audit's most consequential
   privacy claim and is not re-runnable.
8. **Fix the index schema.** One mangled `confidence` value, five `environment` variants including
   free text.
9. **Run the adversarial pass earlier, or continuously.** V1–V5 caught a recommendation that would
   have made the site less accessible, a direct contradiction between two findings, three
   over-scored severities, 23 bad citations, and the fact that the PDF library cannot do the thing
   two P0 findings assume it can. It was the highest-yield phase of the audit and it ran last.

---

*Sources: `audit/findings-index.json` (authoritative for scores, tiers and verdicts);
`audit/raw/A1`–`A9`; `audit/verification-V1`–`V5`; `audit/CHANGES-DURING-RUN.md`;
`audit/policies/` (ten attorney-review drafts); `audit/vpat-draft.md`.
Analysis only — no application code, styles, content or configuration were modified.*
