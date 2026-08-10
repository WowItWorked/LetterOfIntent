# V3 — Adversarial verification of A5 (language) and A6 (PDF)

Verifier V3. Mandate: refute. Every finding below was re-opened against the tree at
HEAD `b243107`, every measurement was recomputed from scratch, and every quoted string
was re-read from the current file or re-fetched from production.

**What I did NOT take on trust:** I did not reuse A5's or A6's tools. I wrote my own
under `audit/tools/v3-*.mjs` (read-only) — an independent pdfjs geometry/text/metadata
pass, a raw PDF object and zlib-inflated content-stream parser, an independent WCAG
contrast and grayscale calculator, a veraPDF report parser, and a fresh
production/local metadata fetcher. No application code, content or config was modified.

**Environment:** Node 24.19.0 portable; pdfjs-dist 6.2.108 (project dep);
`@react-pdf/renderer` ^4.5.1. `git diff --name-only d5ec230 b243107` shows **no change
under `src/lib/pdf/`** — every A6 finding is still live at HEAD. The only app files that
moved mid-run were `src/app/page.tsx`, `src/components/home/VideoPlayer.tsx`,
`public/og-image.png`, `public/social-logo.png`, `scripts/generate-og-image.mjs`.
Neither A5 nor A6 raised a finding against any of those, so **no finding in either file
is `already_fixed`.**

**Headline integrity result:** no finding's headline claim was refuted, but **seven
sub-claims were**, and **one finding cites tool evidence that does not exist in the
published evidence file**. Details in A5-005, A5-006, A5-017, A6-008, A6-010, A6-011 and
A6-018.

---

## A5 — PLAIN LANGUAGE AND CONTENT

### A5-001 — CONFIRMED
**Original claim:** The generated PDF's "How to use this letter" page tells a crisis reader to go to sections the document does not contain.
**What I did to check it:** Ran my own pdfjs text dump (`audit/tools/v3-text.mjs`) over `audit/evidence/pdfs/minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf`, pages 2 and 3. Re-read `src/lib/pdf/loi-document.tsx` lines 231–246 and 400.
**What I found:** Exact reproduction. Page 3 contains nine text items totalling `"C O N T E N T S" / "What's in this letter" / "1" / "Getting started" / "4"` — one section. Page 2 contains, verbatim: `In a crisis, go straight to "Medical" and "Behavioral support."` and `start with "A typical day" and "Communication."` Code citations are exact to the line: `included` is computed at line 231, `showKeyPoints` at 235, `firstWeekPointer`/`crisisPointer` at 239–246 branching only on `path`, contents page gated at 400. The bullets are the only ungated claim on the page. A6-003's independent evidence corroborates (see below).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 5/3/4 is defensible. The reach of 3 is arguably conservative: every partial letter is affected, and the site actively encourages partial letters.
**wrong_standard:** true — WCAG 2.2 SC 3.2.4 Consistent Identification is about components with the same *functionality* being *labelled* consistently across a set of pages. It has nothing to do with a cross-reference resolving. A5 hedged it ("nearest formal analogue… primarily a content-accuracy defect"), which is the right instinct, but the citation should simply be dropped. There is no WCAG SC for this; plainlanguage.gov "Be complete" carries it alone.

### A5-002 — CONFIRMED
**Original claim:** `/privacy`'s meta description contains an orphaned fragment "of any kind." and it is live in production.
**What I did to check it:** Read `src/app/privacy/page.tsx` lines 7–14 directly. Re-fetched `https://myletterofintent.com/privacy` today with my own fetcher (`audit/tools/v3-meta.mjs`) and parsed the `<meta name="description">` out of the served HTML.
**What I found:** Local source lines 9–12 are exactly as quoted, including the stray `"of any kind. "` on line 12. Production returns, verbatim: *"Everything you type stays on your device. No account, and nothing you write is ever captured — we count page visits and nothing else. of any kind. Here is exactly how that works, in plain words."* Length 194 characters, matching A5's figure. Local and production are byte-identical, so this is shipped, not a deployment artefact.
**Verdict:** CONFIRMED
**already_fixed:** false — still broken in both local and production as of this verification.
**wrong_severity:** false
**wrong_standard:** false

### A5-003 — CONFIRMED
**Original claim:** "Trustee" is load-bearing across the special-needs path and is never defined.
**What I did to check it:** Grepped `src/` for `trustee` case-insensitively and read every hit in context. Opened `src/app/page.tsx:91`, `src/lib/content/paths.ts:42`, `src/lib/content/sections/01-getting-started.ts:12`, `13-trustee.ts:12`, `10-benefits-finances.ts:26` and `:48`.
**What I found:** All four cited lines are exact. Copy uses of "trustee" number roughly 24 across `PathChooser.tsx:61`, `ReviewScreen.tsx:154`, `paths.ts:42/46/50/55/62/93`, `privacy/page.tsx:210`, `preview-prompts.ts:69/84`, `page.tsx:91/282`, `01-getting-started.ts:12`, `10-benefits-finances.ts:48/50`, and eight in `13-trustee.ts` — A5's "22" is in the right range. **No gloss exists anywhere.** The nearest is `10-benefits-finances.ts:48`, which defines *special needs trust*, not *trustee*. `13-trustee.ts:12` is quoted verbatim and does describe what a trustee does, in section 13. The contrast case is real: I confirmed SSI (`10-benefits-finances.ts:26`), ABLE (`:41`), AAC (`05-communication.ts:19`) and IEP (`08-education-work.ts:26`) all carry inline glosses at first use — so A5's hand-correction of its own tool's false positives (the tool's `acronyms.json` marks ABLE `definedAtFirstUse: null`) was correct.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-004 — CONFIRMED (one factual error, one wrong SC)
**Original claim:** The review page's email reminder form presents a working, gold-highlighted submit for a service that does not exist, and only discloses this after the click.
**What I did to check it:** Read `src/components/review/ReminderPanel.tsx` in full.
**What I found:** The substance is exact. Line 32 eyebrow "Option two · not switched on yet" at `text-[0.6875rem]` = 11px (A5's "11px engraved eyebrow" is arithmetically right). Line 63 `autoComplete="email"`, line 62 `type="email"`, line 64 placeholder, line 82 "Send me the reminder". `onSubmit` at 48–51 does nothing but `setTried(true)`. Post-click message at 90–94 verbatim. The privacy page's corresponding claim at `privacy/page.tsx:271–279` is exact.
**Counter-evidence on one detail:** A5 says the valid-state styling applies "`background: var(--gradient-gold)` **and `boxShadow`**". There is no `boxShadow`. Line 80 is `style={valid ? { background: "var(--gradient-gold)" } : undefined}` and the valid className (line 77) drops the border and sets `text-navy900` — no shadow anywhere. Minor, but it is an invented detail in a MEASURED-adjacent evidence block.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true — WCAG 2.2 SC 3.2.2 **On Input** is about a change of context occurring automatically when a component's setting is changed. Nothing here changes context on input. The nearest real SC is **3.3.2 Labels or Instructions** (Level A), and even that is weak because instructions *are* present, just poorly sequenced. Honest answer: no SC applies; plainlanguage.gov "Tell your reader what to do" carries it.

### A5-005 — CONFIRMED in substance; MEASUREMENT MATERIALLY REFUTED
**Original claim:** Six competing names for the backup operation across 96 uses of user-facing copy, measured by a copy-only extractor where "identifiers, class names and imports cannot inflate a count".
**What I did to check it:** Opened `audit/evidence/terminology.json` and read the per-variant `topFiles`. Then opened every file named under the `export` variant and grepped it.
**What I found — the load-bearing methodological guarantee is false.** The `export` variant is reported at **19 uses** with top files `src/lib/content/types.ts (5)`, `src/lib/derive.ts (5)`, `src/lib/ics.ts (2)`, `src/lib/photos.ts (2)`, `src/components/home/VideoPlayer.tsx (1)`. Those files contain **zero user-facing "export" copy**. `types.ts` is a pure type-declaration file whose only "export" occurrences are the TypeScript `export` keyword (6 of them); `derive.ts` has 25 `export` keywords and no copy; `ics.ts` 6; `photos.ts` 15; `VideoPlayer.tsx` has exactly one, `export function VideoPlayer()`. A repo-wide grep finds **exactly one genuine user-facing "export"**: `src/app/privacy/page.tsx:196`, "…or work in a private window and export a backup first." The `backup (bare)` variant is likewise inflated — its `src/lib/schema.ts (2)` hits are a code comment (line 9) and comment text at 318–319, not copy.
So the real copy figure is roughly **~77 uses, with "export" at 1, not 19.** The tool counted keywords, identifiers and comments — precisely what its own `note` says it cannot do.
**What survives:** six distinct names do appear in copy, and the co-located `/your-data` screen evidence is exact — `DataControls.tsx` line 157 "Download a backup", line 160 "Download backup file", 185 "Download the documents", 218 "Load a backup", `RestoreFlow.tsx:177` "Choose a backup file…", 177 the `.json` sentence, and `handleExport` at line 76. Two citations drift by one line (161→160, 186→185). The finding's argument — one irreversible-loss-preventing action with several names on one screen — holds on the co-located evidence alone, independent of the counts.
**Verdict:** CONFIRMED (headline). The specific enumerated counts and the "copy-only" evidence claim are REFUTED.
**already_fixed:** false
**wrong_severity:** true — reach **5 → 4**. The rhetorical weight came from "96 uses / six names"; the true copy figure is ~77 with one of the six names appearing once, in a body paragraph on a page most users never reach. mission_impact 4 and harm_if_unfixed 4 stand on the `/your-data` screen evidence.
**wrong_standard:** false, but SC 3.2.4 is a stretch: it governs the *same* component identified consistently across pages, not different components (card title vs. button label vs. body prose) describing the same concept.

### A5-006 — CONFIRMED in substance; TWO SUB-CLAIMS REFUTED
**Original claim:** Five names for one irreversible destructive action, 27 uses; the `/your-data` delete card alone uses three of them.
**What I did to check it:** Read `DataControls.tsx:120–250` and `271–292`; read `privacy/page.tsx:166–186`; opened the `Deletion` block of `terminology.json`; grepped `src/components/wizard/` for `remove`.
**What I found:**
- The co-located citations are exact: eyebrow "Erase" (237), title "Delete all my data" (238), button (241), body "Erases everything…" (246), dialog title (273), confirm button (283). `privacy/page.tsx:177` "Clearing browser data erases it" and `:180` "…the letter is gone." both exact.
- **Refuted sub-claim 1:** "The `/your-data` delete card alone uses three of them." It uses **two** of the five — *erase* and *delete*. The colon-list has three items but "Erase" and "Erases" are the same lemma.
- **Refuted sub-claim 2:** the "five names / 27 uses" figure conflates two genuinely different operations. `remove` (5) comes entirely from `SectionForm.tsx` and `PhotoFields.tsx` — and those are *not* the same action. `SectionForm.tsx:181` reads "Remove this {noun}? What you typed here will be removed. **(The rest of the letter is untouched.)**" That is a scoped, single-row removal, correctly given its own verb, and the code goes out of its way to say so. `clear` (7) similarly includes a `photos.ts` hit that is `s.clear()`/a code comment, and the `PhotoFields` hit is clearing one photo. Roughly half the 27 uses do not describe the destroy-everything action at all.
- What survives: for the destroy-everything concept there are genuinely **four** overlapping words — *erase*, *delete*, *clear*, *gone* — and A5's real insight (that *clear/gone* are used for the accidental browser-side event while *erase/delete* are used for the deliberate one, with overlap) is correct and verifiable by reading.
**Verdict:** CONFIRMED (headline). "Three names on one card" and "five names / 27 uses" are REFUTED.
**already_fixed:** false
**wrong_severity:** true — reach **4 → 3**, harm_if_unfixed **4 → 3**. The confusable surface is smaller than reported.
**wrong_standard:** true — WCAG 2.2 SC 3.3.4 is **Error Prevention (Legal, Financial, Data)** and its requirement is that such actions be *reversible, checked, or confirmed*. It does not say destructive actions "must be clearly identified" — that gloss is invented. And the site **satisfies** 3.3.4: `DataControls.tsx:270–292` puts the deletion behind a confirmation dialog with an explicit "Download a backup first" escape. Citing a satisfied SC as a failure is the most misleading kind of standards error. The correct citation is 3.2.4 (as used in A5-005) or none.

### A5-007 — CONFIRMED
**Original claim:** The site-wide description names only parents of a person with disabilities, is 206 chars, and inherits onto the review and all wizard routes.
**What I did to check it:** Fetched `/`, `/letter`, `/letter/review`, `/letter/getting-started`, `/letter/medical` from production and localhost with my own fetcher; read `src/app/layout.tsx:38–41` and `src/lib/share.ts:1–12`.
**What I found:** `DESCRIPTION` at layout.tsx:38–41 is exact. Production and local return it identically at **206 characters** on `/`, `/letter/review`, `/letter/getting-started` and `/letter/medical`. `/letter`'s own description is exact to A5's quote: *"Two sets of questions — one for a loved one with disabilities, one for anyone you care for…"* (136 chars). `share.ts:8–10` says verbatim that Facebook and LinkedIn strip pre-filled text and show the meta description instead — A5's risk note is grounded.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-008 — CONFIRMED as to fact; wrong SCs
**Original claim:** The sticky header says "START YOUR LETTER · IT'S FREE" and links to `/letter` even mid-letter.
**What I did to check it:** Read `SiteHeader.tsx` 92–105 and 136–149, and `ResumeCard.tsx:18–39`.
**What I found:** Desktop nav at 95–101 and mobile menu at 139–146 are both literal `href="/letter"` with the string at lines 100 and 145 — exact. No store awareness. `ResumeCard.tsx:21` `if (!hydrated || count === 0) return null;` is exact, so A5's mitigation and its hydration-flash caveat are both grounded.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 2/3/2 is if anything generous, and A5 itself labels the harm INFERRED.
**wrong_standard:** true — **SC 3.2.4 Consistent Identification is satisfied here, not violated**: the control is labelled identically everywhere, which is exactly A5's complaint. Citing it inverts the SC. SC 2.4.6 Headings and Labels is also a poor fit (it governs headings and form labels, not nav link text). If any SC applies it is **2.4.4 Link Purpose (In Context)**, and even that is arguable since `/letter` genuinely is where a letter is started.

### A5-009 — CONFIRMED
**Original claim:** Progress is counted in "sections with notes", and "Notes" is also a field label.
**What I did to check it:** Opened all six cited call sites.
**What I found:** All exact — `ResumeCard.tsx:34`, `ReviewScreen.tsx:95`, `ReviewScreen.tsx:120`, `ReviewScreen.tsx:543` ("Sections without notes yet"), `DataControls.tsx:166`, `RestoreFlow.tsx:63`. The collision is real: `03-family-support.ts` defines `id: "notes"` (45) with `label: "Notes"` (47). The PDF contrast is also real — `loi-document.tsx:376` says "what a family learns over a lifetime". A5's warning not to change the field `id` is correct: it is a zod schema key and a persistence key.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A5 correctly declines to claim conformance impact here.

### A5-010 — CONFIRMED
**Original claim:** "fortnight" in help text, contradicted by "two weeks" in the example three lines below.
**What I did to check it:** Grepped `general/12-stepping-in.ts`; read `audit/evidence/copy-lint.json`; read `src/config/firm.ts:79`.
**What I found:** Line 20 help contains "…what can safely wait a fortnight." and line 25 example contains "Everything financial can wait two weeks." — exact. `firm.ts:79 licensedStates: ["Virginia"]` exact.
**Minor:** A5 says "It was one of only two register hits across the entire codebase." `copy-lint.json` does contain two `non-US register` hits — but **both are the same occurrence**, `12-stepping-in.ts:20`, emitted twice (once as bare text, once with the `help:` prefix). There is one register hit, double-counted.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-011 — CONFIRMED
**Original claim:** The privacy page's claim "no script on this page reads them" is literally false.
**What I did to check it:** Read `privacy/page.tsx:236–245` and `:151–156`; confirmed `src/lib/store.ts` persists to localStorage and `src/lib/pdf/generate.tsx` reads the letter.
**What I found:** The Callout at 236–245 is exact, including "…and no script on this page reads them, sends them, or records your screen." The falsifiability argument is grounded: `privacy/page.tsx:152–155` does invite the reader to open devtools and watch the network tab. The application's own first-party JS demonstrably reads every field — that is how the PDFs in `audit/evidence/pdfs/` came to exist. A5 correctly limits the claim to a *wording* defect and defers the leakage question to A7.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-012 — CONFIRMED
**Original claim:** The one-line promise says "device" while the real scope is one browser profile, and the site says both.
**What I did to check it:** Read `PrivacyStrip.tsx:20–23`, `SiteFooter.tsx:121–124`, `page.tsx:40–45`, `DataControls.tsx:164–175`, `privacy/page.tsx:145–149`.
**What I found:** All exact. `PrivacyStrip.tsx:22–23` "Everything you type stays on your device and is never sent anywhere."; `SiteFooter.tsx:122–123` "nothing you type ever leaves your device."; `page.tsx:43` "it saves in *this* browser only"; `DataControls.tsx:168` "If this browser's data is ever cleared…"; `privacy/page.tsx:146` "stored in your browser, on this device". The Rewrite-11 cite of `letter/page.tsx:46–48` is actually 45–47 — one line off; the quoted string is exact.
**Note on the count table:** the `Where the data is` counts inherit the same tool contamination as A5-005 — the single reported `IndexedDB` hit is a code comment in `photos.ts:7`, while the *real* user-facing IndexedDB mention (`privacy/page.tsx:147`, the one A5-016 is about) is absent from the count. The counts are wrong in both directions. The finding does not depend on them.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-013 — CONFIRMED
**Original claim:** "Power of attorney" is the only one of three legal arrangements in its own sentence without a gloss; waiver, OT and day program are undefined.
**What I did to check it:** Read `12-legal-advocacy.ts:14–23`, `10-benefits-finances.ts:22–31`, `06-medical.ts:76–100`, `08-education-work.ts:14–21`.
**What I found:** Every citation exact. `12-legal-advocacy.ts:19` verbatim: guardianship/conservatorship gets "(a court gave someone authority)", supported decision-making gets "({name} keeps authority, with named helpers)", power of attorney gets nothing. `10-benefits-finances.ts:26` "any waiver programs" and `:27` "on the DD waiver waitlist since 2021" exact. `06-medical.ts:81` OT placeholder exact. `06-medical.ts:96` "Virginia Medicaid — CCC Plus waiver." exact. `08-education-work.ts:18` "Current school or day program" exact.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-014 — CONFIRMED
**Original claim:** Descriptions run 171–206 chars, truncating the privacy promise out of search results.
**What I did to check it:** Fetched nine routes from production and measured lengths myself.
**What I found:** `/` 206, `/letter/review` 206, `/letter/getting-started` 206, `/letter/medical` 206, `/privacy` 194, `/samples/letter-of-intent-disabilities` 171, `/letter` 136, `/your-data` 116. Every number matches. The two emergency-sheet sample routes are 147 and 132 — under the cut, which A5 did not claim otherwise.
**Minor:** the text says "Five of nine sampled routes" but then enumerates six (`/` + three inheriting routes + `/privacy` + the sample letter). A counting slip in the prose; the data is right.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 1/3/1 is honest.
**wrong_standard:** false — A5 correctly says this is not a formal standard.

### A5-015 — CONFIRMED
**Original claim:** The letter PDF and backup filenames carry "Disabilities", contradicting the rule stated in the same module.
**What I did to check it:** Read `src/lib/filenames.ts` 8–52; listed `audit/evidence/pdfs/`; grepped `RestoreFlow.tsx` and `backup.ts`.
**What I found:** All citations exact. The rule is at 14–18 verbatim; `PATH_LABEL` at 23–26; templates at 44 (`Letter-of-Intent-${which}-${date}.pdf`), 48 (emergency, unqualified) and 50 (backup). The emergency exemption comment is at 45–46/47–48. The generated evidence files confirm real output: `minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf` and `typical--Letter-of-Intent-Disabilities-Backup-2026-08-09.json`. A5's assurance that restore is filename-independent checks out: `parseBackup` is at `backup.ts:210` and reads content. `RestoreFlow.tsx:54` does cite an example filename that would need updating.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A5 correctly cites the module's own rule rather than reaching for a WCAG SC.

### A5-016 — CONFIRMED
**Original claim:** "local storage" and "IndexedDB" are named without explanation on a page that promises "no legalese".
**What I did to check it:** Read `privacy/page.tsx:143–157` and `:76–81`; read `audit/evidence/copy-lint.json` in full.
**What I found:** The sentence at 146–147 is verbatim. `privacy/page.tsx:80` "One page, no legalese." exact. And the copy-lint evidence is exactly as described: three `undefined tech term` hits, of which two are code (`VideoPlayer.tsx:113` `localStorage.setItem`, `store.ts:51` `localStorage)`) and one is copy (`privacy/page.tsx:147` IndexedDB). A5's characterisation is precise.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-017 — CONFIRMED as to code; CITED EVIDENCE REFUTED
**Original claim:** The deletion-failure message is vague, and it was "Detected by `audit/tools/copy-lint.mjs` 'vague error' rule; it was the only copy hit."
**What I did to check it:** Read `DataControls.tsx:110–136` and `RestoreFlow.tsx:36–57`. Read all 51 lines of `audit/evidence/copy-lint.json`.
**What I found:** The code claim is exact. Line 133: `"Something didn't clear. Please also clear this site's data in your browser settings."`; the success path at 129 is the exemplary one A5 quotes; `RestoreFlow.tsx:38–42` and `44–49` are verbatim.
**But the cited evidence does not exist.** `copy-lint.json` has `totalHits: 5` under exactly two rules — `undefined tech term` (3) and `non-US register` (2). There is **no "vague error" rule** and **no hit on `DataControls.tsx`** anywhere in the file. This is the same class of problem the verification brief flags for axe: a finding asserting a tool result that is absent from the published evidence. The finding stands because the code is readable, but the evidence line should be struck.
**Verdict:** CONFIRMED (headline). The tool-detection claim is REFUTED.
**already_fixed:** false
**wrong_severity:** false — 2/1/3 is appropriately modest.
**wrong_standard:** true — WCAG 2.2 SC 3.3.3 **Error Suggestion** applies when "an input error is automatically detected and suggestions for correction are known". This is not an input error; it is an operation failure. No SC applies. plainlanguage.gov error guidance carries it alone.

### A5-018 — CONFIRMED
**Original claim:** The only worked example for family traditions is a Christmas one.
**What I did to check it:** Read `11-social-faith.ts:28–49`.
**What I found:** Exact. The example at 41–44 is verbatim as quoted; the faith field's label (32) and help (33) at the cited lines are exactly the non-presumptive copy A5 credits. A5's own honesty about this being borderline is warranted, and its claim that copy-lint found zero presumptive-language hits is confirmed by `copy-lint.json`.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A5-019 — CONFIRMED
**Original claim:** Sample page titles stack four em-dash segments; 98 characters.
**What I did to check it:** The slug A5 used 404s. I found the real slugs in `src/lib/content/samples.ts` (`emergency-sheet-disabilities`, not `emergency-information-sheet-disabilities`) and fetched production directly.
**What I found:** Production returns `"Sample — Emergency information sheet — for a loved one with disabilities — Letter of Intent Builder"` — four segments, three em dashes, **99 characters** (A5 said 98; off by one). Produced by `layout.tsx:49`'s `%s — Letter of Intent Builder` template composed with `samples.ts:58`. The `anyone` variant is 89 chars.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true (mildly) — SC 2.4.2 Page Titled requires a title that "describes topic or purpose". This title *does*, verbosely. It is not a 2.4.2 failure; it is a conciseness issue. A5 hedges with "undermines", which is doing a lot of work.

### A5 measured-readability section (not a numbered finding, but load-bearing) — CONFIRMED as arithmetic, PLAUSIBLE as corpus
**What I did:** Opened `audit/evidence/readability.json`. Verified the published site averages against the report. Cross-validated the formulas by solving Flesch-Kincaid for syllables-per-word from the reported grade and words-per-sentence, then independently computing Flesch Reading Ease from those two values on three routes.
**What I found:** `siteAverages` match the report exactly (FK 5.8 / Fog 8.42 / SMOG 8.94 / Ease 75.45 / wps 12.32). The cross-validation is tight: **home** FK 6.53 + wps 15.33 implies spw 1.368, which yields Ease 75.55 — the reported value, exactly. **privacy** FK 7.49 + wps 15.59 implies spw 1.4407 → Ease 69.13, exactly as reported. **legal-and-advocacy** FK 6.80 + wps 10.00 → Ease 64.12 vs 64.15 reported (rounding). Both formulas were therefore computed from the same measurements and implement the standard definitions correctly. The self-published syllable accuracy (86 words, 88.4% exact, MAE 0.116) is in the file, and the ten listed misses have sensible ground-truth values.
**What I could NOT verify:** the extracted prose corpus itself. `readability.json` does not retain the raw text per route in a form I could re-score with an independent syllable counter, so the *inputs* to the correct arithmetic are unverified. Marked PLAUSIBLE on that axis.

---

## A6 — PDF AND DOCUMENT OUTPUT

### A6-001 — CONFIRMED
**Original claim:** `wrap={false}` on the emergency sheet's `<Page>` makes the page height content-dependent; no emergency sheet is 792pt.
**What I did to check it:** Wrote my own pdfjs geometry pass over all six audit PDFs and all four shipped samples (`audit/tools/v3-pdf-verify.mjs`), reading `getViewport({scale:1})` per page. Read `src/lib/pdf/emergency-document.tsx` line 163.
**What I found:** Every number reproduces to the hundredth of a point.

| file | measured |
|---|---|
| minimal Emergency | 612 × **441.54** |
| typical Emergency | 612 × **742.84** |
| maximal Emergency | 612 × **1113.19** |
| sample emergency (anyone) | 612 × **739.19** |
| sample emergency (disabilities) | 612 × **852.69** (11.84 in) |

Every page of every LOI, audit and shipped, is exactly 612 × 792. Line 163 is verbatim `<Page size="LETTER" style={s.page} wrap={false}>`. The clamp budgets A6 points at are at 103–108, exact.
**Caveat I will name:** the *mechanism* ("`wrap={false}` makes the page box size itself to the content") is inferred from the observed geometry, not confirmed against @react-pdf documentation or source. The defect is not in doubt; the one-line root cause is a strong hypothesis rather than a verified fact.
**Verdict:** CONFIRMED
**already_fixed:** false — `git diff d5ec230..b243107` touches nothing under `src/lib/pdf/`.
**wrong_severity:** false — 5/5/5 is justified. The shipped sample being 11.84 in of realistic hand-written content settles it.
**wrong_standard:** false — A6 correctly states there is no formal SC and labels 1.4.4/1.4.10 as "in spirit".

### A6-002 — CONFIRMED
**Original claim:** The fixed footer (disclaimer + date + "Page N of M") is translated outside the page box on every content page and never renders.
**What I did to check it:** Wrote a raw PDF object parser and zlib-inflated the page content streams (`audit/tools/v3-pdf-raw.mjs`, `v3-stream.mjs`). Scanned every `1 0 0 1 x y cm` group per page for a y outside 0..792. Separately ran an independent `"Page "` text probe over all ten PDFs.
**What I found:** Exact, by two independent methods.
- Off-page footer groups: **minimal 3 of 4**, **typical 10 of 11**, **maximal 62 of 64** — every count matches A6 exactly. The two unaffected maximal pages are page objects 8 and 16 (cover and how-to).
- Maximal page 8 is page object **39**, contents object **37** — A6's exact identifiers — and its stream opens `1 0 0 -1 0 792 cm` then `64 -426389.1875 m … 1 0 0 1 64 -426389.1875 cm`, followed by the `/F28 7.5 Tf … TJ` runs. I have that verbatim in front of me.
- Offsets `-6834.5` and `-426389.1875` both reproduced verbatim; I also observed `-24026340` and `-1351523584` on later pages, which A6 did not mention.
- `"Page "` occurs **0 times** in all six audit PDFs *and* all four shipped samples.
- `PdfFooter` is at 486–496 exact; `s.footer`/`footerText`/`footerPage` at 58–78 exact; call sites at 370, 402, 420, 520 exact; `footerLine` at 237 exact; and the footer *is* the first child of every `<Page>`, which is A6's hypothesised cause.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false. If anything mission_impact 4 is conservative — this is a document meant to be read decades later in loose photocopies.
**wrong_standard:** false — A6 correctly claims no WCAG SC.

### A6-003 — CONFIRMED
**Original claim:** The `render`-prop "SECTION N" eyebrow emits no glyphs; the plain-child eyebrows do render.
**What I did to check it:** Ran text probes for `SECTION` and for the letterspaced variant `S E ?CT` across all ten PDFs. Dumped typical page 5. Read `loi-document.tsx:518–534`.
**What I found:** `SECTION` = 0 and `S E CT` = 0 in every one of the ten files. Typical page 5's first text item is `"Getting started"` at y=711.7 — the 22pt title, with no eyebrow above it. Meanwhile minimal page 2 and page 3 begin with `"T O" / "T H E" / "R E A D E R"` and `"C O N T E N T S"` respectively, at y=727.2 — so the plain-child eyebrows render exactly as A6 says. And the side effect does fire: minimal's TOC prints "Getting started … 4" and Getting started really is on page 4.
**Minor drift:** A6 cites the render-prop `<Text>` at 523–531; it opens at 522. `number` is passed at 472, not 471. `minPresenceAhead={90}` is at 521, not 520. All one-line drift; claims hold.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A6-004 — CONFIRMED
**Original claim:** Every PDF is untagged; veraPDF ua1 fails all six with five specific rules and specific failed-check counts.
**What I did to check it:** Wrote a parser for the six `mrr` XML reports in `audit/evidence/verapdf/` and tabulated failed rules and counts independently. Separately probed the catalog with my own raw parser and pdfjs `getMetadata()`.
**What I found:** **Every figure reproduces exactly.**

| file | failedChecks | 7.1-3 | 7.2-34 |
|---|---|---|---|
| minimal Emergency | 53 | 30 | 20 |
| typical Emergency | 132 | 80 | 49 |
| maximal Emergency | 220 | 124 | 93 |
| minimal LOI | 170 | 93 | 74 |
| typical LOI | 489 | 288 | 198 |
| maximal LOI | 3836 | 2020 | 1813 |

All six report `isCompliant="false"`, `failedRules=5`, and exactly the rules 6.2-1, 7.1-3, 7.1-8, 7.1-11, 7.2-34 against `ISO 14289-1:2014`. My raw catalog dump returns, verbatim, `<< /Type /Catalog /Pages 1 0 R /Names 2 0 R /ViewerPreferences 5 0 R >>` — character-for-character A6's quote. No `/StructTreeRoot`, `/MarkInfo`, `/Metadata`, `/Lang` or `/Outlines` anywhere, including inside object streams (there are none). pdfjs reports `Language: null` and no XMP for all ten files including the four samples. `DisplayDocTitle` and `ViewerPreferences` are present, as A6 credits.
**One sub-claim is weaker than presented:** the column-interleaving prediction. I confirmed the mechanism — in the shipped disabilities sample, `"D I A G N O S E S"` and `"H OW T H E Y CO M M U N I C AT E"` both sit at y = 514.8, so any y-sorted extraction *will* fuse them. But pdfjs's default (drawing-order) extraction emits the whole left column then the whole right column, which is correct reading order. So whether a real screen reader interleaves depends on its heuristic. A6 does label this INFERRED in its coverage notes; the finding text presents it more confidently than the evidence supports.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — reach 2 is honest about how few readers use AT on these files; harm_if_unfixed 5 is right.
**wrong_standard:** false, with one over-reach: SC 2.4.6 Headings and Labels is not the issue (headings are present, just not programmatically determinable — that is 1.3.1). 1.3.1, 1.3.2 and 3.1.1 are all correctly applied via WCAG2ICT, and the ISO clause numbers are correct.

### A6-005 — CONFIRMED
**Original claim:** 85–98% of every PDF is one logo embedded at ~1,150–1,900 DPI; fonts are a rounding error.
**What I did to check it:** Enumerated every `/Subtype /Image` object with its `/Width`, `/Height` and `/Length` from the raw file; summed; divided by file size. Read the PNG sizes off disk. Recomputed every DPI figure.
**What I found:** Object **9** is `3716 × 2782`, `/Length 903664`, with an SMask of `138906` — A6 reported 903,672 + 138,914 (an 8-byte-per-stream difference, i.e. stream delimiters). Shares reproduce to the tenth of a percent:

| file | my share | A6 |
|---|---|---|
| minimal Emergency | 98.5% | 98.5% |
| typical Emergency | 98.1% | 98.1% |
| maximal Emergency | 98.0% | 98.0% |
| minimal LOI | 96.8% | 96.8% |
| typical LOI | 95.3% | 95.3% |
| maximal LOI | 85.1% | 85.1% |

`public/mloi-lockup-stacked.png` is **828,742 bytes** on disk — exact. `firm.ts:80` `logoPath: "/monogram-gold.png"` and `:82` `appLogoPath: "/mloi-lockup-stacked.png"` exact. Draw sizes at `loi-document.tsx:259` (230pt) and `:341` (22pt) and `emergency-document.tsx:172` (158pt) all exact. Every DPI figure checks out: 230pt = 3.194 in → 3716/3.194 = **1163**; 158pt = 2.194 in → **1694**; 22pt = 0.3056 in → 578/0.3056 = **1891**. The 300-DPI targets (~958 px and ~92 px) are correct arithmetic. Fonts: in the typical emergency sheet, images account for 1,042,570 of 1,062,282 bytes, leaving **19,712 bytes total** for all three subsetted faces plus every content stream — "a rounding error" is if anything an understatement. Subset prefixes `XPJXNA+Cinzel-SemiBold` and `IAXAWI+CormorantGaramond-Regular` are present verbatim in the maximal LOI.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A6 correctly claims none.

### A6-006 — CONFIRMED
**Original claim:** `letterSpacing` corrupts every small-caps label in the text layer; the effect is threshold-dependent around 0.6–0.8.
**What I did to check it:** Dumped pdfjs text items for the maximal LOI, the maximal emergency sheet, and the shipped disabilities emergency sample. Checked all eleven cited style declarations.
**What I found:** Every quoted string reproduces **verbatim**, including from a file A6 did not use (the shipped sample):
`"N OT E S — FO R H A N DW R I T T E N A D D I T I O N S"`, `"C O N T E N T S"`, `"D I A G N O S E S"`, `"YO U R R E LAT I O N S H I P TO T H E M"`, `"C U R R E N T M E D I C AT I O N S"`, `"I N A N E M E R G E N C Y — P R OTO CO L"`, `"H OW T H E Y CO M M U N I C AT E"`, `"E M E R G E N C Y CO N TA C TS"`.
The threshold claim is confirmed precisely: at 0.6, `"EMERGENCY INFORMATION — MAX"` extracts **clean**; at 0.7, `"AVOID — MAKES IT WORSE"` is clean while `"Y ES / NO"` is broken; at ≥0.8 everything breaks. Field values — the family's own prose — extract cleanly. All nine `loi-document.tsx` line cites (85, 96, 117, 157, 178, 266, 281, 327, 345) and both `emergency-document.tsx` cites (74, 82) are **exact to the line and to the value**. This is the most precisely-cited finding in either file.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true (partly) — **SC 1.1.1 Non-text Content does not apply.** These are text runs, not non-text content; there is no text alternative to provide. SC 1.3.1 is defensible via WCAG2ICT, and the PDF/UA 7.2 citation is right. Drop 1.1.1.

### A6-007 — CONFIRMED
**Original claim:** In the maximal letter, pages 8, 12, 41 and 64 contain only the NOTES label; page 46 has a two-line widow; zero such pages at realistic lengths.
**What I did to check it:** Counted text items per page across all ten PDFs and dumped the named pages.
**What I found:** Exact. Pages **8, 12, 41 and 64** each report `items = 1`, the single item being `"N OT E S — FO R H A N DW R I T T E N A D D I T I O N S"`. Page 46 has four items: `"not guess. Sentence 12 describing this in the kind of detail a family actually writes, including specifics a"` / `"future caregiver would need and could not guess."` / the NOTES label — A6's quote verbatim. **Zero** single-item pages in the minimal LOI, the typical LOI, either emergency sheet, or any of the four shipped samples. `notesArea … wrap={false}` at 561–566 exact; `minPresenceAhead={90}` at 521 (A6 said 520).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 2/2/2 is right, and A6's own "length-dependent, absent at realistic lengths" framing is scrupulous.
**wrong_standard:** false

### A6-008 — CONFIRMED on providers; ONE SUB-CLAIM REFUTED
**Original claim:** `emergencyInfo()` never reads `medical.providers`; weight, blood type and pharmacy are absent from the schema entirely.
**What I did to check it:** Read `src/lib/derive.ts:180–236` in full and grepped the whole file for `providers`. Read `06-medical.ts:14–32` and `emergency-document.tsx:317–336`. Grepped all of `src/lib/content` for weight / blood type / pharmacy.
**What I found:** The core claim is exact. `emergencyInfo()` spans 184–236 and `providers` appears **zero times** in `derive.ts`. The providers repeater is at `06-medical.ts:15–32` with `name`, `specialty` and `phone` — exact. The EMERGENCY CONTACTS box at 317–336 renders only `firstCall` and `contacts` — exact. I confirmed the shipped sample renders only "Jessie Anderson — (Aunt)" and "Hannah Phillips — (Neighbor)".
**Refuted sub-claim:** "Also absent from the schema entirely (searched `sections/06-medical.ts` **and the general-path equivalent**): weight, blood type, and **pharmacy**." **Pharmacy is in the schema.** `src/lib/content/sections/general/06-health-medical.ts:72` defines `id: "pharmacy"` with `label: "Pharmacy"` at line 75. A6 states it searched that exact file. Weight and blood type are genuinely absent — I confirmed the only `weight` hit in content is "the weighted blanket" in `07-behavior.ts:44`.
**Verdict:** CONFIRMED (headline). The pharmacy claim is REFUTED.
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — the AAP/ACEP Emergency Information Form for Children With Special Needs is a real, correctly-named artefact and A6 explicitly cites it as a design reference rather than a requirement.

### A6-009 — CONFIRMED
**Original claim:** No `/Outlines`, and the contents entries are not internal links.
**What I did to check it:** Ran `getOutline()` on all ten PDFs and probed the raw files for `/Outlines`. Read `loi-document.tsx:400–415`.
**What I found:** `getOutline()` returns `null` for all ten; no `/Outlines` in any catalog. The contents rows at 406–413 are `<Text style={s.tocNumber}>`, `<Text style={s.tocTitle}>`, a `<View style={s.tocLeader}>` and `<Text style={s.tocPage}>` — plain Text, no `<Link>`. Exact.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true (mildly) — SC 2.4.5 Multiple Ways applies, under WCAG2ICT, to a document *within a set of documents*; a single self-contained PDF is not a set, so 2.4.5 is a poor fit. SC 2.4.1 Bypass Blocks is the more defensible of the two. A6 hedges ("are the relevant principles"), and correctly notes PDF/UA does not mandate outlines.

### A6-010 — CONFIRMED on hierarchy; MONOCHROME SUB-CLAIM REFUTED
**Original claim:** The sheet is laid out for the family, not the stranger: logo largest, DIAGNOSES first, only ALLERGIES emphasised, dead area lower-left, 6.8–7.5pt labels.
**What I did to check it:** Opened `public/samples/sample-emergency-information-sheet-disabilities.png` and looked at it at full size, then checked every claim line-by-line against `emergency-document.tsx`.
**What I found:** The layout observations are all correct and I can see them.
- The lockup occupies roughly the top **17%** of the sheet, above the navy bar — "roughly the top sixth" is accurate. Code at 166–175, 158pt wide, exact.
- Left column order DIAGNOSES → ALLERGIES → CURRENT MEDICATIONS → PROTOCOL, source-order, at 227–269 — exact and visible.
- The lower-left dead area is large and obvious in the render: the left column ends under PROTOCOL while the right column runs on for another third of the page.
- Type sizes at lines 26 (9), 73 (7.5), 81 (7), 96 (6.8) — exact.
- Medications capped at 8 (line 153) with the "+ N more" indicator at 253–257 — exact.
**Refuted sub-claim:** "the allergy box's urgency is carried by **red alone**, which is lost in the black-and-white printing." It is not carried by red alone, and it is not lost. The `Box` component (127) sets `borderWidth: 1.2` whenever a `borderColor` is passed, versus `0.9` for a plain box — so ALLERGIES already has a heavier border. And by A6-011's own grayscale table, DANGER `#A64545` prints at **90** against a normal border `#cfc9bb` at **~201**. That is one of the most visible contrasts on the monochrome page. A6-010 and A6-011 contradict each other here, and A6-011 is the one that is right. The SC 1.4.1 citation should be withdrawn.
**Verdict:** CONFIRMED (headline). The "color alone / lost in monochrome" argument is REFUTED.
**already_fixed:** false
**wrong_severity:** true — mission_impact **5 → 4**. This is a design judgement A6 itself flags as unvalidated by any real reader ("deserves five minutes with an actual ER nurse"), and one of its four supporting arguments does not hold. A 5 puts it level with A6-001, which is measured and unambiguous.
**wrong_standard:** true — SC 1.4.1 Use of Color does not apply for the reason above.

### A6-011 — CONFIRMED on every number; ONE USAGE CLAIM REFUTED
**Original claim:** FAINT and GOLD_DEEP fail SC 1.4.3; the tinted backgrounds carry no signal in monochrome.
**What I did to check it:** Wrote an independent WCAG relative-luminance / contrast-ratio calculator and an independent grayscale converter (`audit/tools/v3-contrast.mjs`) from the exact hex constants in `src/lib/pdf/theme.ts:52–65` and `emergency-document.tsx:18–19`. Then traced every claimed usage site in the source.
**What I found — every published ratio reproduces to two decimal places:** INK 15.00, NAVY 12.30, GRAY-on-white 5.63, GRAY-on-CREAM **4.92**, FAINT **3.13**, GOLD_DEEP **3.66**. Every grayscale value reproduces exactly under Rec.709 luma: CREAM 239, GOLD_TINT 239, warning 236, protocol 245, DANGER 90, LINE 210, GOLD 164, NAVY 52, RULE_ON_PAPER 195. The 3-levels-of-255 gap between the warning tint (236) and CREAM (239) is real. `theme.ts:52–65` and the `64–65` comment cite are exact. `pointBoxWarn` at `loi-document.tsx:172` does change fill and border colour but **not** border width — confirmed, exact.
**Refuted sub-claim:** "GOLD_DEEP … `emergency-document.tsx:265` (the **PROTOCOL box title**, 7.5pt)". It is not the title colour. Line 264 passes `borderColor={GOLD_DEEP}` and 265 passes `backgroundColor="#faf5ea"`; **no `titleColor` is passed**, so the `Box` component (132) renders the title with `s.boxTitle`'s own colour, GRAY `#5E6878`. GRAY on `#faf5ea` measures **5.18:1 — it passes.** This matters because A6 builds its severity argument on it ("worse in context: that box contains the seizure/choking/wandering instructions"). That argument collapses.
**Under-reported, in A6's favour:** GOLD_DEEP is also the colour of the cover's two 11pt engraved lines at `loi-document.tsx:267` and `:282` ("MY LETTER OF INTENT", "A LETTER OF INTENT FOR"). Those are normal-size text at 3.66:1 and also fail; A6 omits them.
**Interaction A6 missed:** the `sectionEyebrow` (9pt GOLD_DEEP, line 86) that A6-011 lists as failing is *also* the style A6-003 proves never renders on section pages. It renders only as a plain child, three times — on the how-to, contents and key-points pages. So the failing instances are three, not one per section.
**Verdict:** CONFIRMED (headline and all numbers). The PROTOCOL-title usage claim is REFUTED.
**already_fixed:** false
**wrong_severity:** false — 3/4/3 survives on the TOC numbers, the cover credit line, the itemTag and the three rendered eyebrows.
**wrong_standard:** false — SC 1.4.3 at 4.5:1 for text under 18pt / 14pt bold, applied via WCAG2ICT, is correct, and A6 correctly notes all failing text is normal-size.

### A6-012 — CONFIRMED
**Original claim:** Only three files are offered; the JSON is a save file; the print stylesheet is minimal and the reading view is a page, not a file.
**What I did to check it:** Read `ReviewScreen.tsx:146–171`, `:481–561`, and `src/app/globals.css:428–453`.
**What I found:** Exact. The three `FileRow`s are at 149–170; the JSON's blurb at 169 says verbatim "a machine-readable format the builder reads rather than a person". `ReadingView` is declared at 483 and runs to 561, with `ReadingSection` starting at 563 — the cited range is precise. The print block at 432–450 is *exactly* the five rules A6 describes: `.print-hide{display:none}`, white body/black text, `main{max-width:none}`, black undecorated links, `.print-section{break-inside:avoid-page}`. Nothing more.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — this is a recommendation-shaped finding, and the 4/2/5 scoring reflects that honestly.
**wrong_standard:** false

### A6-013 — CONFIRMED
**Original claim:** The letter tells the reader how to read it but never tells the family who to give it to; a repo-wide search returns only three incidental clauses.
**What I did to check it:** Read `loi-document.tsx:369–397` in full. Ran my own repo-wide grep for `safe deposit|who should have a copy|keep copies|give a copy|hand a copy|copies where`.
**What I found:** The six bullets at 379–391 are exactly as characterised — all addressed to the reader, none to the writer. My independent grep returns **exactly** what A6 says it returns and nothing else: `loi-document.tsx:245` and `:246` (the two crisisPointer variants), and `general/08-money-documents.ts:49` ("the safe deposit box and who can open it"). Plus `ReviewScreen.tsx:154` and `:161`, which A6 cites separately. `YearlyReview` is at 376–479, exact, and the backup JSON really does carry `version: 1` (`BACKUP_VERSION` at `schema.ts:385`).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — correctly claims none.

### A6-014 — CONFIRMED
**Original claim:** Dating is handled; revision identity is not.
**What I did to check it:** Extracted the Info dictionary from all ten PDFs with pdfjs. Read the cited cover, how-to and emergency-header code.
**What I found:** `CreationDate = D:20260809202804Z` for the typical LOI — **A6's quoted value, exactly.** The LAST UPDATED box at `loi-document.tsx:313–333` and the how-to bullet at `:383` are exact; the emergency header's "Updated {date}" / "Verify if older than one year" at `emergency-document.tsx:179–180` are exact. `filenames.ts:34–52` carries only a date. No revision number, no "supersedes" statement, and nothing in the store or the backup that would supply one. `Author` is set only when `authorName` is filled (`loi-document.tsx:251` falls back to a generic string, so the Info field is never empty — a small nuance A6 glosses).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A6-015 — CONFIRMED
**Original claim:** The filename policy hides the name; the PDF Title displays it, and DisplayDocTitle is on.
**What I did to check it:** pdfjs `getMetadata().info` over all ten PDFs; raw catalog probe for `/ViewerPreferences` and `/DisplayDocTitle`; read `filenames.ts:8–19`, `loi-document.tsx:249–253`, `emergency-document.tsx:158–161`, `derive.ts:8`.
**What I found:** Verbatim reproduction of all three quoted Info values: `Title: "Letter of Intent — Maximal Subject With A Notably Long Legal Name"`, `Title: "Emergency information — Maximal Subject With A Notably Long Legal Name"`, `Author: "Maximal Author With A Notably Long Legal Name"`. `/ViewerPreferences` and `/DisplayDocTitle` are both present in the raw catalog of every file. The policy comment at `filenames.ts:9–19` is verbatim. `preferredName()` is at `derive.ts:8`, as claimed. The shipped samples do the same (`"SAMPLE - Letter of Intent — Bonnie Marie Anderson"`).
**Minor:** A6 lists `Author` among "Observed Info dictionaries" without noting that the **emergency sheets have no Author at all** — only the LOI sets it. Immaterial to the finding.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — and A6 deserves credit for naming the genuine conflict with PDF/UA 7.1 rather than pretending the fix is free.

### A6-016 — CONFIRMED
**Original claim:** All four shipped samples carry every defect above.
**What I did to check it:** Ran the full independent geometry / metadata / text / catalog pass over `public/samples/*.pdf`.
**What I found:** Every single figure is exact.

| sample | pages | geometry | bytes |
|---|---|---|---|
| letter-of-intent-disabilities | 11 | 612×792 | 1,247,411 |
| letter-of-intent-anyone | 12 | 612×792 | 1,249,746 |
| emergency-…-disabilities | 1 | 612×**852.69** | 1,062,946 |
| emergency-…-anyone | 1 | 612×**739.19** | 1,061,744 |

All four: `Language: null`, no XMP, no StructTreeRoot, no MarkInfo, no `/Outlines`, and `"Page "` occurs **0 times**. These are the strongest artefacts in A6's whole file, because they are hand-authored realistic content that someone reviewed and shipped.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A6-017 — CONFIRMED
**Original claim:** Silent contact truncation, mid-word cutting, and three unclamped identity fields.
**What I did to check it:** Read `emergency-document.tsx:103–108`, `151–155`, `196–222` and every clamp call site. Dumped the maximal emergency sheet's text items.
**What I found:** **All eleven clamp limits and all eleven call-site line numbers are exact**: diagnoses 230 (229), allergies 190 (239), protocol 460 (267), communication 240 (277), yesNo 120 (282), pain 150 (288), triggers 190 (299), deEscalation 240 (305), makesWorse 140 (311), insurance 130 (212), hospital 90 (218). `info.contacts.slice(0, 4)` at line 155 with **no overflow indicator anywhere in the contacts Box (317–336)** — confirmed by reading the whole component. `clampToWord` at `derive.ts:277` is word-boundary aware; `clamp` at 103–108 is not, and I reproduced a mid-word cut verbatim in the maximal sheet: `"including specifics a future caregi… (see full letter)"`. `fullName` (196), `preferred` (200) and `dateOfBirth` (206) are unclamped.
**Minor overstatement:** "the unclamped `dateOfBirth` alone consumed roughly a quarter of the sheet." I measure it spanning y 862.5 → 673.5, about 189pt of an 1113pt page — **~17%**, not ~25%. Still a striking defect; the number is inflated by about half again.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A6-018 — CONFIRMED headline; SUPPORTING EVIDENCE REFUTED
**Original claim:** An unembedded `Helvetica` (object 19) is present in the emergency sheets; the page `/Font` map is `/F2 11 /F6 12 /F1 14 /F12 15` and "object 19 is not in it", so nothing is drawn with it.
**What I did to check it:** Enumerated every `/BaseFont` object in the typical emergency sheet and dumped objects 3, 4, 11, 12, 14, 15, 19 and 23 individually. Then extracted the set of `Tf` operators from the inflated page content stream and located every `/F1 … Tf` in context.
**What I found:**
- **Confirmed:** an unembedded base-14 font is present. `obj 14 = << /Type /Font /BaseFont /Helvetica /Subtype /Type1 /Encoding /WinAnsiEncoding >>` — no FontFile, no subset prefix. It is present in the minimal, typical and maximal emergency sheets and in **none** of the LOIs.
- **Refuted:** it is **not object 19**. Object 19 is `(D:20260809202800Z)`, a date string.
- **Refuted:** the reasoning "object 19 is not in [the `/Font` map]" is void, and its conclusion is backwards. Helvetica **is** object 14, which is `/F1` in the very font map A6 quotes, and `/F1` **is** one of the four `Tf` operators A6 itself lists as used. By A6's own stated logic, Helvetica would be in use.
- **The conclusion survives, on different evidence.** I located every `/F1 7 Tf` in the content stream. Each sits inside a `BT … Tm /F1 7 Tf ET` block containing **no text-showing operator** — no `TJ`, no `Tj`. So glyphs are selected but never shown. A6 is right that nothing is drawn; it got there by a chain of reasoning that does not hold.
**Verdict:** CONFIRMED (headline). Two of the three evidentiary claims are REFUTED.
**already_fixed:** false
**wrong_severity:** false — 1/1/1 and "Nobody, on current evidence" is exactly right, and A6 lists this among its own least-confident findings.
**wrong_standard:** false — PDF/UA-1 7.21.4.1 is the right clause for font embedding, and A6 correctly says it is not currently triggered.

---

## COUNT

| Verdict | Findings |
|---|---|
| **CONFIRMED** | **37** (A5-001…A5-019, A6-001…A6-018) |
| **PLAUSIBLE** | 0 findings — but A5's readability *corpus* (as distinct from its arithmetic, which is CONFIRMED) is PLAUSIBLE only: `readability.json` does not retain per-route raw prose in a form I could re-score independently. |
| **REFUTED (whole finding)** | **0** |
| **REFUTED (sub-claim inside a confirmed finding)** | **8** — A5-004 (`boxShadow` does not exist), A5-005 (the `export` count and the "copy-only" guarantee), A5-006 (two: "three names on one card"; the five-name/27-use conflation), A5-017 (the cited copy-lint rule does not exist), A6-008 (pharmacy *is* in the schema), A6-010 (the SC 1.4.1 monochrome argument), A6-011 (the PROTOCOL box title is not GOLD_DEEP), A6-018 (object number and font-map reasoning) |
| **already_fixed** | **0** |
| **wrong_severity** | **3** — A5-005 (reach 5→4), A5-006 (reach 4→3, harm 4→3), A6-010 (mission_impact 5→4) |
| **wrong_standard** | **8** — A5-001, A5-004, A5-006, A5-008, A5-017, A5-019, A6-006, A6-009, plus a partial on A6-004 (SC 2.4.6) and a withdrawal on A6-010 (SC 1.4.1) |

Line-number drift was small and never load-bearing: A5-005 ×2, A5-012 ×1, A6-003 ×3, all by one line.

---

## STRONGEST — survived the hardest scrutiny

1. **A6-002 (footer off-page).** I reproduced it by two fully independent methods and got A6's exact page counts (3/4, 10/11, 62/64), its exact page and content object numbers (39 and 37), and its exact translation offsets (`-6834.5`, `-426389.1875`) out of the zlib-inflated stream. Zero occurrences of `"Page "` across ten separately-generated files, including four shipped samples nobody in this audit produced. This is not a judgement call at any point.
2. **A6-011's contrast arithmetic.** Given the brief's warning that A1's contrast numbers were unvalidated hand-arithmetic, I built my own calculator and expected to find drift. I found none: seven ratios to two decimal places and nine Rec.709 grayscale values, all exact. A6's measurement discipline here is the best in either file, which is what makes the single wrong *usage* attribution worth flagging rather than shrugging at.
3. **A6-006 (letterspacing corrupts the text layer).** Eleven style declarations cited to the exact line *and* the exact value; every extracted string reproduced verbatim, including from the shipped sample A6 did not use for this finding; and the 0.6/0.7/0.8 threshold behaviour reproduced precisely. Nothing to push back on.
4. **A5-001 + A6-003 together.** They were written blind to each other and corroborate: A5 shows the minimal letter's contents page lists one section while page 2 names four; A6 shows the section eyebrows never render at all. Both are exact, both from the same evidence set, neither knew about the other.
5. **A5-002 (broken privacy description).** Trivially falsifiable and I tried: fetched production fresh today, and the orphaned "of any kind." is there, byte-identical to local.
6. **A6-001 / A6-016 (emergency sheet geometry).** Ten files, ten independent measurements, all matching to the hundredth of a point — and the decisive artefact is a hand-authored shipped sample at 11.84 in, not a synthetic fixture.

## WEAKEST — could not fully refute, but treat with care

1. **A6-010 (emergency sheet hierarchy).** The observations are all verifiable and I confirmed them against the shipped render. But one of its four supporting arguments (SC 1.4.1 / monochrome) is refuted by A6's own sibling finding, the conclusion is a design judgement A6 admits it could not validate, and it is scored 5/4/4 — level with measured defects. Real, over-scored.
2. **A5-005 and A5-006 (the terminology findings).** Both headlines are true and both are supported by co-located screen evidence I verified by hand. But both are *presented* as MEASURED, and the measurement instrument is demonstrably counting TypeScript keywords, identifiers and code comments as user-facing copy. Anyone acting on the numbers rather than the screenshots will be acting on fiction.
3. **A5-008 (header CTA).** A5 flags the harm as INFERRED itself, and both WCAG citations are wrong — one of them inverted. Fine as a copy suggestion; not a conformance finding.
4. **A5-018 (Christmas example) and A5-019 (title stacking).** Both accurately observed, both scored 1/2/1, and A5 says plainly that a reasonable editor could decline them. I agree.
5. **A6-018 (unembedded Helvetica).** Correct conclusion, wrong evidence, and A6 scored it 1/1/1 and told the owner not to action it. The right call on all counts except the citations.

## WHAT THE ORIGINAL ANALYSTS MISSED (found while I was in there)

1. **A5's `terminology.mjs` does not do what its own output file says it does.** `audit/evidence/terminology.json` carries the note "Counts are over extracted COPY only (string literals + JSX text), not identifiers." That is false. The `export` variant's five top files contain zero user-facing "export"; they contain the TypeScript `export` keyword. `backup (bare)` counts code comments in `schema.ts`. `IndexedDB` counts a comment in `photos.ts:7` while *missing* the real user-facing IndexedDB in `privacy/page.tsx:147`. Every count in A5's terminology table and every count in the A5-005 / A5-006 / A5-012 findings should be treated as unreliable until the tool is fixed. This affects three findings' headline numbers.
2. **A5-017 asserts a tool hit that is not in the evidence file.** `copy-lint.json` has five hits under two rules; there is no "vague error" rule and no `DataControls.tsx` hit. The finding is right; the provenance is not.
3. **A6-011 under-reports its own finding.** GOLD_DEEP is also the colour of the cover's two 11pt engraved lines (`loi-document.tsx:267`, `:282`) at 3.66:1. Those are normal-size text and also fail 1.4.3. Not listed.
4. **A6-011 and A6-003 interact and neither says so.** The `sectionEyebrow` style A6-011 lists as a 9pt contrast failure is the same style A6-003 proves never renders on section pages. The contrast failure is real but occurs on three pages (how-to, contents, key points), not once per section. Fixing A6-003 would *multiply* the A6-011 exposure — the two findings must be sequenced.
5. **The ALLERGIES box already has a heavier border than its neighbours** (`borderWidth: 1.2` vs `0.9`, set in the `Box` component at `emergency-document.tsx:127` whenever a `borderColor` is passed). Neither A6-010 nor A6-011 noticed. It refutes A6-010's SC 1.4.1 argument and it means the "give it a heavy rule so emphasis survives monochrome" recommendation is already half-implemented.
6. **A6-002's off-page offsets are wilder than reported.** A6 lists `-6834.5` and `-426389.1875`. I also observed `-24026340` and `-1351523584` on later maximal pages. The magnitude escalating page by page is a useful diagnostic clue for whoever chases the root cause — it looks like an accumulating rather than constant offset, which argues against a simple constant-origin bug.
7. **The emergency sheets contain an unembedded font; the letters do not.** A6-018 states this but does not draw the obvious inference: the divergence is between the two documents, so the fallback is being introduced by something present only in `emergency-document.tsx`. The `/F1 7 Tf` blocks I found are empty text runs at 7pt — the size of `subLabel` and `photoText` — which is a much better lead than "I could not determine WHY it is emitted".
8. **A5's stated build state is now stale, harmlessly.** A5's closing note reports four modified files plus one untracked asset at HEAD `d5ec230`. Those are all committed as of `b243107` and the tree is clean of app modifications. No A5 finding depends on it.

---

*Verifier tools written for this pass, all read-only, all under `audit/tools/`:*
`v3-pdf-verify.mjs` (pdfjs geometry / text probes / metadata / outline across 10 PDFs),
`v3-pdf-raw.mjs` (raw object enumeration, ObjStm + content-stream inflation, image/font/catalog analysis, off-page translation scan),
`v3-objdump.mjs` (per-object dictionary dump),
`v3-stream.mjs` (content-stream inflation with pattern windows),
`v3-text.mjs` (per-page text-item dump with y coordinates),
`v3-contrast.mjs` (independent WCAG luminance/contrast + Rec.601/709/gamma grayscale),
`v3-verapdf-read.mjs` (veraPDF mrr XML parser),
`v3-meta.mjs` (production vs local metadata fetch).
