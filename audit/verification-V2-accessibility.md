# V2 — Adversarial verification of A3 (inclusive/cognitive) and A4 (technical a11y conformance)

Verifier V2. Mandate: refute. Every claim below was re-opened, re-measured or
re-run from scratch. Nothing was taken on the analyst's word.

**Repo state during verification:** `HEAD = b243107`, `git status -- src/` clean.
**Production checked live:** `https://myletterofintent.com/` returned 200 and
**already serves `b243107`** — 0 occurrences of "about 2 minutes", 1 of "under 5
minutes", the `Play the video` button and poster present, `og:image` present ×8.
That is new information relative to `audit/CHANGES-DURING-RUN.md`, which recorded
production as still showing the old label. Several `environment:` fields in A3/A4
are stale as a result.

**What I ran (all analysis-only; nothing under `src/` touched):**
- `audit/tools/v2-contrast.mjs` — independent WCAG relative-luminance arithmetic,
  written from the formula, on 23 declared colour pairs.
- `audit/tools/v2-verify-a.mjs` … `v2-verify-d.mjs`, `v2-review-order.mjs` —
  fresh Playwright/Chromium passes against the running dev server: canvas
  read-back of `color-mix`/`oklab` tokens, computed focus styles, a 40-stop
  Shift+Tab sweep, forced-colors emulation driven by **real keyboard Tab**,
  `colorScheme` dark/light, the tab pattern, the sample viewer, autocomplete,
  target size, share, video keys, reading level, and a full reseeded review page.
  Raw output in `audit/evidence/v2/`.
- `audit/tools/v2-pdf-text.mjs` — pdfjs text extraction of the evidence PDFs.
- `audit/tools/v2-capture-check.mjs` — production network capture re-parse.
- Direct parse of `audit/evidence/verapdf/*.xml` and `audit/evidence/axe/axe-A4-full.json`.
- Direct reads of every cited source file, with line-number confirmation.

**One methodological note that changed an outcome.** My first forced-colors pass
used programmatic `element.focus()` and appeared to *refute* A4-012's "links keep
a ring, inputs lose theirs". Re-running with genuine `Tab` keypresses reversed
that: programmatic focus does not satisfy Chromium's `:focus-visible` heuristic
for links. A4-012 survives the harder test. I flag this because the same trap
would produce a false refutation for anyone re-checking it.

---

## A3 — Inclusive & Cognitive Accessibility

### A3-001 — CONFIRMED
**Original claim:** The global focus ring is `#e2caaa`, 1.52:1 on `--paper`, 1.38:1 on `--paper-2`, 1.58:1 on white; focusing an input *lowers* its border contrast.
**What I did to check it:** Painted `var(--focus-ring)` through a live element into a 1×1 canvas and read the sRGB pixel back (`v2-verify-b.mjs`). Computed every ratio with my own implementation of the WCAG relative-luminance formula (`v2-contrast.mjs`), not the analyst's. Focused the first field on `/letter/medical` and read computed styles. Re-opened `globals.css`, `field-ui.tsx`.
**What I found:** Canvas read-back → `srgb: [226, 202, 170]` = **#e2caaa**, exactly as claimed. My independent ratios: **1.52 / 1.38 / 1.58 / 8.84 / 10.02** — all five identical to the reported values, to two decimals. Focused textarea: `borderColor` moves `rgb(110,120,137)` (#6e7889, **4.46:1**) → `rgb(217,185,127)` (#d9b97f, **1.88:1**); both figures exact. Line citations exact: `globals.css:98`, `globals.css:265-269`, `field-ui.tsx:7-10`. Two recommendation figures are understated, in the safe direction: navy-700 on `--paper` is **11.78:1** (claimed 10.4), gold-700 on `--paper` is **4.79:1** (claimed 4.9). The cited screenshot `scratchpad/focus-on-input.png` is not in shared evidence and could not be checked; `audit/evidence/screenshots/A4-focus-input-1280.png` corroborates visually.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 1.4.11 (AA) and SC 2.4.13 (AAA) are both real and correctly levelled; Understanding 1.4.11 does cover focus indicators.

### A3-002 — CONFIRMED
**Original claim:** The video has zero text tracks, zero transcript affordances, no audio description; 277.999999 s; production carries no captions across 431 requests.
**What I did to check it:** Clicked the poster on `/`, waited for metadata, read `video.duration`, `querySelectorAll("track").length`, `textTracks.length`, `innerHTML`. Searched every `a/button/summary/details` for transcript|caption|subtitle. Re-parsed `audit/evidence/network/capture-production.json`. Read `VideoPlayer.tsx` and `page.tsx:259-294`.
**What I found:** `duration: 277.999999`, `trackEls: 0`, `textTracks: 0`, `childHTML: ""`, transcript affordances `[]` — every value reproduced exactly. Capture: `requestCount: 431` exactly; `.vtt` 0, `captions` 0, `subtitles` 0, `track kind` 0; the only mp4 is `https://myletterofintent.com/what-is-a-letter-of-intent.mp4`. The comment at `VideoPlayer.tsx:201-202` is verbatim as quoted. The "column beside" is `page.tsx:267-290`: two paragraphs plus a footnote (~138 words) defining what a Letter of Intent is — genuinely different content from the figcaption's stated scope. The analyst's claim is correctly narrow.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — 1.2.2 (A), 1.2.3 (A), 1.2.5 (AA) all correctly numbered and levelled.

### A3-003 — CONFIRMED
**Original claim:** The figcaption reads "Watch · about 2 minutes" against a 277.999999 s runtime, in the committed file.
**What I did to check it:** `git show d5ec230:src/components/home/VideoPlayer.tsx`; read the current file; fetched production HTML.
**What I found:** At `d5ec230` the string is verbatim `Watch · about 2 minutes` — **real as observed**. At `b243107` (`VideoPlayer.tsx:246`) it reads `Watch · under 5 minutes`, and my rendered measurement returns `WATCH · UNDER 5 MINUTES`. Production returns 0 hits for "about 2 minutes" and 1 for "under 5 minutes". Duration 277.999999 confirmed.
**Verdict:** CONFIRMED (as observed)
**already_fixed:** **true** — fixed in `b243107` and, contrary to `CHANGES-DURING-RUN.md`, **already deployed**. This needs no work at all, not even deployment.
**wrong_severity:** false
**wrong_standard:** false — correctly declines to cite a WCAG SC.

### A3-004 — CONFIRMED
**Original claim:** Section badges sum to 165 minutes (special needs) and 145 (general) against headline claims of "45–90" and "40–80".
**What I did to check it:** Parsed `minutes:` out of all 15 special-needs section files and all 10 general-only files, then resolved the general path's 14-section list from `general/index.ts` and summed it myself.
**What I found:** Special-needs total **165** — and every per-file value matches the analyst's list exactly (5,10,10,15,10,15,15,10,10,10,10,10,10,10,15). General path resolves to gettingStarted(5)+aboutThem(10)+familySupport(10)+typicalWeek(15)+dailyCommunication(10)+healthMedical(10)+homeLiving(10)+moneyDocuments(10)+workObligations(10)+faithCommunity(10)+legalDecisions(10)+steppingIn(10)+finalWishes(10)+personalMessage(15) = **145**. `paths.ts:57` "45–90 minutes" exact; `paths.ts:87` "40–80 minutes" exact; `page.tsx:167` exact; `01-getting-started.ts:15` exact. `general/index.ts` "40 to 80 minutes" sits at line 34, cited as 33 — off by one.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — correctly says "Not a WCAG SC".

### A3-005 — CONFIRMED
**Original claim:** The emergency sheet downloads near-empty with no warning; `emergencyHasContent()` exists and is never called; the minimal PDF's whole body is a name, "ATTACH RECENT PHOTO" and an allergies line.
**What I did to check it:** Extracted the text of `audit/evidence/pdfs/minimal--Emergency-Information-Sheet-2026-08-09.pdf` with pdfjs. Grepped all of `src/` for `emergencyHasContent` and `keyPointsHaveContent`. Read `derive.ts` and `ReviewScreen.tsx`.
**What I found:** The whole PDF is **one page, 589 characters**, and its body is exactly: name → "ATTACH RECENT PHOTO" → "GOES BY" → "ALLERGIES — None recorded — confirm with family." Reproduced verbatim. `emergencyHasContent` is defined at `derive.ts:347` and appears **nowhere else in `src/`**; `keyPointsHaveContent` *is* used at `loi-document.tsx:235` — the asymmetry is exactly as described. `emergencyInfo()` at `derive.ts:184-236` pulls from precisely the sections named. `ReviewScreen.tsx:156-162` offers the download `disabled={!hydrated || busy !== null}` and nothing else.
**One sub-claim I contest:** recommendation (3) proposes replacing "a confident negative like 'None recorded'" with "Not recorded — ask the family". The code at `emergency-document.tsx:239` **already** prints `"None recorded — confirm with family."` — the hedge is present. `why_it_matters` drops it ("'Allergies: none recorded'… looks like a checked box"), which overstates that particular harm. Recommendations (1) and (2) are unaffected.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 5/4/5 is defensible for a document that goes on a fridge.
**wrong_standard:** false

### A3-006 — CONFIRMED
**Original claim:** Page 2 of every letter sends the reader to "Medical" and "Behavioral support"; the minimal PDF's Contents lists only "Getting started".
**What I did to check it:** pdfjs extraction of all 4 pages of `minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf`; read `loi-document.tsx:239-246`.
**What I found:** Page 2 contains verbatim *"If you are new to … start with "A typical day" and "Communication." They will carry you through the first week."* and *"In a crisis, go straight to "Medical" and "Behavioral support.""*. Page 3 is 57 characters total: `C O N T E N T S What's in this letter 1 Getting started 4`. Both pointers are built unconditionally at `loi-document.tsx:239-246` (the only branch is special-needs vs general, not content-presence).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A3-007 — PLAUSIBLE
**Original claim:** The dead email form is the visually heaviest element in the "Come back in a year" section; the only gold-gradient button in the pair belongs to the dead option; the tired user's last click is steered into it.
**What I did to check it:** Read `ReminderPanel.tsx` in full and `ReviewScreen.tsx:376-467`; loaded `/letter/review` and read computed button styles before and after typing.
**What I found:** Every *factual* element reproduces. `ReminderPanel.tsx:46-85` is the form; `:48-51` `onSubmit` only calls `setTried(true)`; `:80` applies `background: var(--gradient-gold)` — and `<ReminderPanel />` is at `ReviewScreen.tsx:466`, the second cell of the grid opened at `:407`. Both line numbers exact.
**But the causal mechanism does not survive.** `ReminderPanel.tsx:75-80`: the gold gradient is applied **only when `valid` is true** — i.e. only after the user has already typed a complete, well-formed address. Before that the submit renders `border-navy500 bg-[rgba(255,255,255,0.08)] text-oninkmuted` — a ghost button, and my measurement confirmed `backgroundImage: none` in the resting state. Meanwhile the *working* calendar card (`ReviewScreen.tsx:428-452`) carries **three filled `buttonClasses("primary")` navy buttons** (Apple / Google / Outlook) plus an underlined `.ics` link. So at the moment a scanning user decides where to click, the dead control is the **dimmest** thing in the pair and the working option carries four affordances including three filled buttons. "Users have learned to look for the brightest button" therefore does not steer them into the dead end; the gradient only appears once they have already committed.
What remains true and worth acting on: the navy ground *is* heavier than the beige card, a fully-formed labelled `type=email` input that does nothing is a real cost, and it is the only place on the site that asks for an email. The privacy-feel argument stands (though the eyebrow, the body paragraph, and the always-visible `#reminder-note` — which the input's own `aria-describedby` points at — all precede or accompany the field, so "the reassurance arrives only after" is also overstated).
**Verdict:** PLAUSIBLE
**already_fixed:** false
**wrong_severity:** **true** — reach 4 → **3**, harm_if_unfixed 3 → **2**. mission_impact 3 is fine.
**wrong_standard:** false — correctly says 3.3.2 is satisfied and this is not an SC failure.

### A3-008 — CONFIRMED
**Original claim:** Under `forced-colors: active` the progress bar, the "has notes" dot, `.tw-diamond`, the card top-rule and the current-section highlight all disappear; the current item becomes indistinguishable from the other fourteen.
**What I did to check it:** Fresh Chromium context with `forcedColors: "active"` on `/letter/medical`, typed into Allergies, then read computed styles of the desktop rail's current row, a non-current row, the dot, `.tw-diamond` and the progress bar.
**What I found:** `matchMedia("(forced-colors: active)").matches` → true. `.tw-diamond` → `{bg: "rgba(255,255,255,0)", bgImg: "none", w: 9.9, h: 9.9}` — the claimed `{transparent, none, 10, 10}` reproduced (9.9 is a 7px square rotated 45°, per `globals.css:367-374`). Progress bar inner div → `bgImg: "none"`, `bg: rgba(255,255,255,0)`. The dot → `bg: rgb(255,255,255)` (forced to Canvas) on a white ground. Current row → `bg: rgb(255,255,255)`, `borderLeftColor: rgb(0,0,159)`; non-current row → `bg: rgba(255,255,255,0)`, `borderLeftColor: rgb(0,0,159)` — **identical border colour, and white-on-white background**: the two states are visually indistinguishable, exactly as claimed. `sr-only ", has notes"` present at `WizardRail.tsx:99`. All cited line ranges exact.
The two cited screenshots live in the analyst's scratchpad, not shared evidence, so they are unverifiable — but I reproduced every measurement independently, so the finding does not depend on them.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — 1.4.1 (A) and 1.4.11 (AA) are both defensible here.

### A3-009 — CONFIRMED
**Original claim:** `color-scheme: light` is hard-coded at `globals.css:13`, no `prefers-color-scheme` anywhere, and a dark-scheme context renders byte-identical colours.
**What I did to check it:** Grepped `src/` for `prefers-color-scheme`; read `globals.css:13`; ran `/letter/medical` in two contexts with `colorScheme: "dark"` and `"light"`.
**What I found:** Zero `prefers-color-scheme` matches in `src/` (only `prefers-reduced-motion` at `globals.css:288-297`). `globals.css:13` is `color-scheme: light;`. Dark context: `{bodyBg: "rgb(251, 250, 246)", inputBg: "rgb(255, 255, 255)", rootColorScheme: "light", metaColorScheme: null, prefersDark: true}`; light context identical except `prefersDark: false`. The analyst's reported values are reproduced verbatim.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** mild — harm_if_unfixed 3 for a preference gap on a site that *does* honour `prefers-reduced-motion` well is a touch high; I would put it at 2. Not material enough to call wrong.
**wrong_standard:** false — honestly states no SC requires this and correctly names 1.4.8 (AAA) as the nearest relative.

### A3-010 — CONFIRMED
**Original claim:** `ResumeCard` renders only on `/letter`; the home page shows no sign of work in progress.
**What I did to check it:** Grepped `src/` for `ResumeCard`; typed into `/letter/medical`, confirmed `localStorage` key `twl-loi-letter-v1` was written, then loaded `/` and `/letter` in the same session.
**What I found:** `ResumeCard` appears only at `src/app/letter/page.tsx:5` (import) and `:53` (render) — exactly as cited. After a real save: `/` → no `pick up where you left|continue your letter|resume` anywhere in body text, `h1` is still "Write down what only you know…"; `/letter` → resume text present. Reproduced exactly.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A3-011 — CONFIRMED
**Original claim:** Below `lg`, the progress sentence, the bar, the 15-item list and the Review link all move inside a `<details>` closed by default and labelled only "Sections".
**What I did to check it:** Read `WizardRail.tsx:140-156` and `letter/[slug]/layout.tsx:16-21`; loaded `/letter/medical` at 375×800 with real saved content and inspected the DOM.
**What I found:** `<details className="print-hide mb-6 … lg:hidden">` with no `open` attribute, summary text "Sections", and `ProgressNote`/`SectionNav`/`RailLinks` all inside — exact. Measured: `details.open === false`; the progress paragraph resolves `closest("details")` to the disclosure; `body.innerText` contains no "You've added notes to N of M" at all. I initially found a `/letter/review` link *outside* the details and thought I had a refutation — it is the desktop `<aside>` copy, which is `display: none` at 375 (measured height 0). So "reachable only by opening Sections, or by walking Next to the end" holds. `wizard-medical-320.png` exists in shared evidence at 320×4426.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — correctly says this is not a WCAG SC.

### A3-012 — CONFIRMED
**Original claim:** The video play button's visible label is "Watch" but its accessible name never contains that word; this is the only such mismatch on the site.
**What I did to check it:** Read `VideoPlayer.tsx:162-197`. Ran my own visible-text-vs-`aria-label` sweep over `a[href]`, `button`, `[role=button]` and `summary` across **seven** routes (`/`, `/letter`, `/letter/getting-started`, `/letter/medical`, `/letter/review`, `/privacy`, `/your-data`). Fetched production.
**What I found:** `aria-label` at line 165, visible "Watch" at line 193 — exact. My sweep returned **exactly one** mismatch across all seven routes: `{tag: "BUTTON", visibleText: "WATCH", accessibleName: "Play the video: what a Letter of Intent is, and how the builder works"}` on `/`. The "only one on the whole site" claim is reproduced. The eight icon-only share links carry `aria-label={t.label}` with no visible text (`ShareCard.tsx:40-52`), so the analyst's parenthetical is also right.
**One standards nuance the analyst half-addressed:** the visible "Watch" sits inside a span carrying `aria-hidden="true"` (`VideoPlayer.tsx:177`). The analyst's justification ("2.5.3 is about what is *visible*, not what is exposed") matches the ACT rule "Visible label is part of accessible name", which applies to visible text nodes regardless of `aria-hidden`. A strict reviewer could argue a decorative pill over a poster is not "the label". Either way the practical voice-control failure — "click Watch" does not match — is real and measured.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false in scores, but `environment: local (pending deployment)` is **stale** — production now serves this control. It should read `both`.
**wrong_standard:** false — SC 2.5.3 Label in Name, Level A, correctly cited.

### A3-013 — CONFIRMED
**Original claim:** 17 `.tw-engraved` usages at 11px, 2 at 10px, 1 at 9px, against the file's own "Never below 12px" rule.
**What I did to check it:** Wrote my own recursive scanner over every `.ts/.tsx/.css` under `src/`, cross-tabulating every line containing `tw-engraved` against its size class.
**What I found:** 36 usages total: **17 × `text-[0.6875rem]` (11px), 2 × `text-[10px]`, 1 × `text-[9px]`, 13 × `text-xs`, 1 × `text-[0.9375rem]`, 1 × `text-[30px]`** — every count identical. The 9px instance is `src/components/wizard/PhotoFields.tsx:210`; the 10px instances are `src/components/chrome/SiteFooter.tsx:5` and `src/components/home/VideoPlayer.tsx:237` — all three line numbers exact. `globals.css:304` reads `Engraved all-caps lockup, à la the wordmark. Never below 12px.` 17+2+1 = 20, matching the title.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — correctly notes WCAG has no minimum font size and 1.4.4 is met.

### A3-014 — CONFIRMED
**Original claim:** 19 `example:` entries against 99 `kind:` declarations across the 15 special-needs sections, with a specific per-file distribution.
**What I did to check it:** Counted `^\s*example:` and `kind: "` per file myself.
**What I found:** **19/99**, and the per-file table matches on all fifteen rows: 0/5, 2/5, 1/10, 2/9, 2/6, **1/16**, 3/6, 0/6, 1/5, 2/6, 1/6, 1/4, 2/6, 0/6, 1/3. Medical at 1-for-16 confirmed. `field-ui.tsx:79-90` renders the disclosure with the quoted footer, exact.
**Verdict:** CONFIRMED (counts)
**already_fixed:** false
**wrong_severity:** mild — `mission_impact: 5` rests on an unobserved behavioural claim (more examples change what families write), which the analyst honestly flags as professional judgement. I would put it at 4. Counts are beyond dispute.
**wrong_standard:** false — UDL/COGA, not a WCAG claim.

### A3-015 — CONFIRMED (structure) / headline distances REFUTED
**Original claim:** The review page is 6,430px at 1024px; the reading view "begins at roughly 82% of that height", "READ IT THROUGH appears at approximately y=5,300", "Sections without notes yet" at "approximately y=6,150"; the letter itself is "5,000px below" the downloads.
**What I did to check it:** Measured `review-1024.png` (1024 × **6430**). Then reproduced the page from scratch: seeded `localStorage` with the **same** `levels.typical` fixture and the same envelope shape that `audit/tools/capture-artifacts.mjs` used to make that screenshot, loaded `/letter/review` at 1024×900, and read the scroll offset of each landmark.
**What I found:** Page height reproduced **exactly: 6430px**. The order is exactly as claimed: downloads → "Come back in a year" → "Pass it along" → firm CTA → "Read it through" → "Sections without notes yet". Code order confirmed at `ReviewScreen.tsx:133 / :192 / :195 / :269 / :311 / :543`.
**The distances are wrong by roughly 2×.** Measured offsets: downloads **549**, year **1123**, pass-it-along **1911**, firm CTA **2414**, **"Read it through" 2788 (43% of the page)**, "Sections without notes yet" **5587 (87%)**. The claimed "roughly 82%" / "y≈5,300" / "y≈6,150" / "5,000px below" are not reproducible at the identical seed and viewport — the reading view starts a little under half-way down, about 2,240px below the download buttons, after roughly 1,700px of promotional content. The magnifier argument ("5,000px of scrolling at 4x") halves accordingly.
**Verdict:** CONFIRMED (the ordering defect and the 6,430px height); the quantitative headline is REFUTED.
**already_fixed:** false
**wrong_severity:** **true** — mission_impact 4 → **3**, reach 4 → **3**, harm_if_unfixed 3 → **2**.
**wrong_standard:** false — correctly says not a WCAG SC.

### A3-016 — CONFIRMED
**Original claim:** (a) the "has notes" marker is a 6px gold-500 dot at 2.42:1 on white and ~2.3:1 on the current row's fill; (b) one typed character marks a section as having notes.
**What I did to check it:** Read the dot's computed `backgroundColor` and box in a live rail; computed both ratios myself; read `derive.ts:34-73`.
**What I found:** (a) dot `rgb(201,160,99)`, 6×6 CSS px (`size-1.5`), **2.42:1** vs white — exact. Against the current row's `rgb(247,238,223)` fill I measure **2.10:1**, not "about 2.3:1" — a small overstatement, still well under 3:1, conclusion unchanged. `sr-only ", has notes"` confirmed at `WizardRail.tsx:99`. (b) `isFilledString` (`derive.ts:34-36`) returns true for any non-whitespace string; `fieldHasContent`→`sectionHasContent`→`startedCount` (`:71-73`) inherit that — one character does mark a section, confirmed from source. The recommendation quotes `--accent-text #7d5f31` as "4.5:1 on ivory" (repeating the token's own comment); it actually measures **5.66:1** on `--paper`.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

### A3-017 — CONFIRMED (measurement) / embedded standards claim REFUTED
**Original claim:** The sticky masthead is 81px of a 320×256 viewport (32%) and 93px of 400×320 (29%). Also asserts, twice, that "SC 2.4.11 Focus Not Obscured is met because focused fields carry a generous `scroll-margin-top` (globals.css:277-280)".
**What I did to check it:** Measured `header.getBoundingClientRect().height` at five viewports. Separately ran a 40-stop `Shift+Tab` sweep on `/letter/medical` at 1280×900 measuring each focused element against the header's bounds.
**What I found:** Header heights reproduce **exactly**: 320×256 → **81px / 32%**; 400×320 → **93px / 29%**; 375×667 → **88px / 13%** (and 640×512 → 141px / 28%, 1280×900 → 149px / 17%). `SiteHeader.tsx:56-58` and `:78` exact.
**The 2.4.11 assertion is false.** My own sweep found **four keyboard stops 100% covered by the sticky header** — "+ Add a provider" (rect 101→145, 44 of 44px), "10 Benefits & money" (61→105), "09 Housing" (15→59), "08 School & work" (0→44) — plus a textarea covered 144 of 158px. `globals.css:277-280` is scoped to `:target, [id]`, which does not reach those buttons and links, and does nothing once the browser judges an element already inside the layout viewport. A3-017 and A4-007 directly contradict each other on this point and **A4-007 is right**.
**Verdict:** CONFIRMED (the header measurement)
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** **true** — the statement "SC 2.4.11 Focus Not Obscured … is met" must be struck. SC 2.4.11 (Minimum), Level AA, is **failed**; see A4-007. The reflow / 1.4.10 pass claim in the same finding I did not re-run, but A4's independent sweep agrees, so I leave it PLAUSIBLE.

### A3-018 — CONFIRMED
**Original claim:** `NextPrev` is suppressed while the final-wishes gate shows, so both offered controls point forward; photo removal has no confirmation while repeater-row removal does.
**What I did to check it:** Read `SectionScreen.tsx`, `PhotoFields.tsx`, `SectionForm.tsx`.
**What I found:** `SectionScreen.tsx:95` is verbatim `{!showGate ? <NextPrev slug={def.slug} name={name} /> : null}`. `:42` is verbatim the cited `showGate` expression. `:116-140` is `EmotionalGate` with exactly two controls, "I'm ready" and "Skip for now →" — both forward. `PhotoFields.tsx` contains **no** `confirm` anywhere; `remove()` at `:126`, the Remove button at `:217-220` (cited as 215-221). `SectionForm.tsx:180` is the `window.confirm` for repeater rows (cited as 176-186). All confirmed.
**Minor overstatement:** "has only the browser's back button" — the masthead still carries a "My Letter of Intent, home" link and, on mobile, the "Sections" disclosure. Neither is a *back* control and the rail is collapsed on phones as described, so the substance holds.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — correctly says WCAG 3.2.x are met.

---

## A4 — Technical Accessibility Conformance

### A4-001 — CONFIRMED
**Original claim:** The 4m38s video has zero text tracks; axe flagged it as `video-caption` *incomplete* ×1 in `state_video-playing`; the "column beside" is two paragraphs, not a transcript.
**What I did to check it:** Re-measured the video element live. Parsed `audit/evidence/axe/axe-A4-full.json` myself (it stores a true `nodeCount` alongside a truncated `nodes` array — an easy way to under-read it). Read `page.tsx:259-294`.
**What I found:** `{trackCount: 0, textTracks: 0, duration: 277.999999, hasAudio, controls: true}` reproduced. The axe file's entry named exactly **`state_video-playing`** carries `incomplete: [color-contrast ×23, video-caption ×1]` — the citation is exact including the state name. Zero violations in all 19 A/AA states. `page.tsx:267-290` is the two-paragraph column, ~138 words.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — 1.2.2 Level A correct; Section 508 **E205.4** correct (36 CFR 1194 App. A); legacy **§1194.24(c)** is the right legacy captions provision; **EN 301 549 v3.2.1 §9.1.2.2** is real and correct.

### A4-002 — CONFIRMED
**Original claim:** No transcript, no media alternative, no audio description (1.2.3 A / 1.2.5 AA). The "about 2 minutes" half was struck mid-run.
**What I did to check it:** Ran the same transcript-affordance search; read the current figcaption; checked `Disclosure.tsx`.
**What I found:** `transcriptAffordances: []` reproduced; figcaption now renders `WATCH · UNDER 5 MINUTES`. The STRUCK note is accurate and the handling of it is exemplary. `Disclosure.tsx:20-21` does emit `aria-expanded`/`aria-controls` as claimed (cited as 19-21).
**One residual staleness:** `who_is_affected` still ends *"The stated duration being less than half the real one compounds this: someone budgeting two minutes at 11pm abandons at 2:01."* That sentence contradicts the STRUCK note three paragraphs above it and should go.
**Verdict:** CONFIRMED
**already_fixed:** partially — the duration half is fixed **and deployed**; the transcript/AD gap is live.
**wrong_severity:** false
**wrong_standard:** false — 1.2.3 (A) and 1.2.5 (AA) correctly numbered and levelled.

### A4-003 — CONFIRMED
**Original claim:** Focus ring 1.58 / 1.52 / 1.38 against white / `--paper` / `--paper-2`; `focus:outline-none` in `inputClasses` beats the base `:focus-visible` rule; the focused field's border goes *down* to 1.88:1.
**What I did to check it:** Canvas read-back plus my own contrast implementation; live computed styles of a focused field; layer reasoning checked against the measurement.
**What I found:** All four ratios exact (**1.58 / 1.52 / 1.38 / 8.84**). Focused field measured: `outlineStyle: "none"`, `boxShadow: "… oklab(0.85155 0.0119952 0.0494828) 0px 0px 0px 3px"`, `borderColor: rgb(217,185,127)`; unfocused `rgb(110,120,137)`. The reported JSON values in `A4-measurements-2.json` match my independent readings character-for-character. `el.matches(":focus-visible")` is `true`, so the base rule *does* match — the Tailwind `utilities`-layer `outline-none` simply wins the cascade, which is exactly the mechanism claimed. On links the same ring **does** paint (skip link measured `outlineStyle: "solid"`, colour `oklab(0.85155 …)` = #e2caaa), so the 1.52:1 ring really is the only indicator elsewhere. `globals.css:98`, `:265-269`, `field-ui.tsx:7-12`, `PhotoFields.tsx:239`, `SectionScreen.tsx:48-55`, `SampleViewer.tsx:107-114` all exact. Recommendation figures: navy-700 on white **12.30** (claimed 12.3, exact); on `--paper-2` **10.74** (claimed 10.6).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — 1.4.11 AA correctly applied to focus indicators; 2.4.7 AA correct; correctly declines to claim 2.4.13 (AAA).

### A4-004 — CONFIRMED
**Original claim:** Navy-900 text on `--gradient-gold`'s darkest stop `#a87e45` measures 4.33:1 against a 4.5:1 requirement; axe returned 23 `color-contrast` incompletes on the home page.
**What I did to check it:** Computed the ratio from the hex myself; enumerated every gradient-backed `a`/`button` on `/` at 375px and read colour, size and weight; re-parsed the axe JSON.
**What I found:** **4.33:1** exactly. Live: "CREATE YOUR LETTER" `color: rgb(22,34,58)`, `15px`, weight `600`; "SHARE TO HELP ANOTHER FAMILY" `15px`, weight `700` — both over the full gradient. Neither qualifies as WCAG "large text" (≥18.66px bold or ≥24px), so 4.5:1 applies; the reasoning is correct. Ramp check: `#e3c89b` 9.82, `#c9a063` 6.56, `#a87e45` **4.33** — `#a87e45` is indeed the worst stop. `route_` incomplete `color-contrast` **nodeCount: 23** — exact. `Button.tsx:57-58` and `:74-78`, `ShareCard.tsx:56-64`, `ReviewScreen.tsx:225-234`, `page.tsx:243-249` all exact. Option A's `#b28a4d` measures **5.01** (claimed 4.89 — conservative); Option B's `#101828` measures **4.85** (exact).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** **true, in the secondary citation only.** SC 1.4.3 (AA) and Section 508 E205.4 are correct. But **legacy §1194.22(c)** is the *use-of-colour* provision ("all information conveyed with color is also available without color") — the legacy 508 standards contain **no contrast provision at all**. It should be dropped, or replaced with §1194.22(c) only where a use-of-colour claim is made (A4-011, not here).

### A4-005 — CONFIRMED
**Original claim:** The sample viewer draws 11 `role="img"` canvases with zero text content and no text layer; browser zoom cannot enlarge them; at 320px the scale is 0.255.
**What I did to check it:** Loaded `/samples/letter-of-intent-disabilities` (HTTP 200), waited for render, counted canvases and read their attributes and boxes; repeated at 320px; read `SampleViewer.tsx`.
**What I found:** `canvasCount: 11`; first canvas `role: "img"`, `aria-label: "Letter of Intent — for a loved one with disabilities, page 1 of 11"`, `textContentLength: 0`, `cssWidth: 1104`, `intrinsicWidth: 1100`; `hasTextLayer: false` — every field exact. `bodyTextChars: 1663` vs the claimed 1644 (≈1% drift, immaterial). At 320px: `cssWidth: 280`, `scale: 0.255` — exact. `RENDER_WIDTH = 1100` at `SampleViewer.tsx:24`; the draw loop at `:56-79` — exact. The zoom argument is sound: because the canvas is `w-full` inside a fluid column, page zoom shrinks its CSS width in proportion and cancels the magnification.
**One derived number I could not reproduce:** "10pt body copy renders at an effective 4.58 CSS px" at 320. 10pt = 13.33 CSS px; × 0.255 = **3.4 px**. I cannot get 4.58 from the stated inputs. The true figure appears *worse* than reported, so the finding is not weakened — but that specific number should be treated as unverified.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — 1.4.4 (AA), 1.1.1 (A), 1.4.5 (AA) all real and correctly levelled, and the analyst's reason for leaning on 1.4.4 over 1.4.5 is sound. Legacy §1194.22(a) is the right text-equivalent provision.

### A4-006 — CONFIRMED
**Original claim:** Both generated PDFs fail PDF/UA-1 on five rules; letter 1225 passed / 489 failed checks, emergency 612 / 132; 198 and 49 items with undetermined language; `<Document>` has no `language` prop, which `@react-pdf/renderer` 4.5 does expose.
**What I did to check it:** Parsed the machine-readable veraPDF reports in `audit/evidence/verapdf/` myself; read both PDF components; read the installed package's type definitions and version.
**What I found:** Letter: `passedRules 101 / failedRules 5 / passedChecks 1225 / failedChecks 489`. Emergency: `101 / 5 / 612 / 132`. **Both exact.** The five failing rules and their check counts: **6.2-1** (1), **7.1-11** (1), **7.1-3** (288 letter / 80 emergency), **7.1-8** (1), **7.2-34** (**198** letter / **49** emergency) — every clause, test number and count exact, with descriptions matching the quoted strings ("Content shall be marked as Artifact or tagged as real content"; "Natural language for text in page content shall be determined"). `loi-document.tsx:249-254` and `emergency-document.tsx:158-162` construct `<Document>` with title/author/creator/producer and **no** `language` — exact line ranges. `@react-pdf/renderer` is **4.5.1**, and `language?: string` sits at **line 53** of `react-pdf.browser.d.ts` — the exact cited line. I also independently searched those type definitions for `StructTree`, `MarkInfo`, `tagged`, `Tagged`, `Lang`, `role`, `accessib`: **zero hits for all of them**, confirming the "no structure-tree API at all" claim.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — ISO 14289-1 clauses cited accurately; the WCAG mapping (1.3.1 A, 1.3.2 A, 3.1.1 A) is correct; the honest note that a self-generated document sits outside the letter of 508 is a fair scoping call.

### A4-007 — CONFIRMED
**Original claim:** Nine backwards keyboard stops overlapped the sticky header; four were entirely covered; a textarea 91% covered.
**What I did to check it:** Wrote my own sweep: scrolled `/letter/medical` (1280×900) to the bottom, focused the last focusable element, pressed `Shift+Tab` 40 times, and recorded each stop's rect against `header.getBoundingClientRect()`.
**What I found:** Reproduced **element for element and pixel for pixel**. Header 149px. Fully hidden (44 of 44 CSS px each): **"+ Add a provider" 101→145**, **"10 Benefits & money" 61→105**, **"09 Housing" 15→59**, **"08 School & work" 0→44**. Partially covered including **`f-emergencyProtocol` textarea rect −14→144, 144 of 158px covered (91%)**. Header 141px at 640 and 81px at 320, i.e. **32% of the 320×256 viewport 400% zoom produces** — all exact. `SiteHeader.tsx:56-59`, `:72-79`, `globals.css:277-280` (scoped to `[id]`) exact.
**Verdict:** CONFIRMED — and this is the finding that refutes A3-017's contrary standards claim.
**already_fixed:** false
**wrong_severity:** false. If anything reach 2 is conservative — every keyboard user hits this on every backwards traversal.
**wrong_standard:** false — SC 2.4.11 Focus Not Obscured (Minimum), **Level AA**, new in WCAG 2.2: correct number, correct level, correctly applied (its failure condition is "entirely hidden", and four stops are 100% covered). The note that axe has no rule for it is also correct.

### A4-008 — CONFIRMED
**Original claim:** The wizard form carries `autoComplete="off"` and no field anywhere carries an autocomplete token; only `f-authorName` is squarely in 1.3.5's scope.
**What I did to check it:** Enumerated every `form input/textarea/select` on four sections and read `getAttribute("autocomplete")` and the `.autocomplete` IDL property.
**What I found:** All four sections: `formAutocomplete: "off"`, and every field `{autocomplete: null, effective: ""}`. Getting-started's five ids are exactly `f-authorName`, `f-authorRelationship`, `f-subjectFullName`, `f-subjectPreferredName`, `f-letterDate` — as cited. `SectionForm.tsx:86` is `autoComplete="off"`, exact.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 2/3/2 is honest for a one-field criterion.
**wrong_standard:** false — SC 1.3.5 Identify Input Purpose, Level AA, correct; and the scoping ("applies only to fields collecting information about the user") is a notably careful and correct application that many auditors get wrong in the other direction.

### A4-009 — CONFIRMED
**Original claim:** The contacts repeater has an `emergency` checkbox and a separate free-text `firstCall` field asks the same question again.
**What I did to check it:** Read `03-family-support.ts` and `emergency-document.tsx`.
**What I found:** `03-family-support.ts:52-57` is verbatim the quoted field (`id: "firstCall"`, `kind: "text"`, label "Who would you call first in an emergency?", placeholder "e.g., My sister Dana — she can be there in 15 minutes"). The repeater's `emergency` checkbox with label "Emergency contact — include on the emergency sheet" is at `:40-43`. `emergency-document.tsx:317-321` prints `CALL FIRST: {clamp(info.firstCall, 110)}` — exact. There is no selection affordance anywhere.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** **true** — **SC 3.3.7 Redundant Entry is Level A, not Level AA.** The finding calls it "Level AA" in `standard_reference`. The criterion number is right and the analyst's honest caveat (nothing is required, so a strict reading passes) is right; only the conformance level is wrong. Note the same mis-levelling implicitly carries into A4-016's list of "2.2 AA additions".

### A4-010 — CONFIRMED
**Original claim:** `role="tablist"`/`role="tab"` with no tabpanel, no arrow-key behaviour, and no roving tabindex.
**What I did to check it:** Loaded `/letter`, read `aria-selected` on both tabs, focused the first tab, pressed `ArrowRight`, re-read selection and focus, and inspected `#question-set`. Read `PathChooser.tsx`.
**What I found:** Reproduced exactly: `before ["true","false"]` → `after ["true","false"]`; focus still on "Disability & special needs 15 SECTIONS"; `tabIndexAttrs [null, null]`; `tabIds [null, null]`; both `aria-controls: "question-set"`; `#question-set` → `{role: null, labelledby: null, tabindex: null}`. `tablistLabel: "Which set of questions"`. Line citations exact: tablist opens `PathChooser.tsx:137`, `role="tab"` at `:149`, `aria-controls` at `:151`, tabs map `:143-166`, and **`:169` is the `<div id="question-set">`** that should be the panel. axe reports zero violations on `/letter` (confirmed in the evidence file), and `e2e/a11y.spec.ts:30` does use `getByRole("tab", …)` as the risk note says.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 4.1.2 (A) and SC 2.1.1 (A) correctly numbered and levelled, with an honest mitigation noted.

### A4-011 — CONFIRMED
**Original claim:** Current-section and "has notes" are conveyed by colour alone; gold-500 border on gold-100 = 2.10:1, gold-500 dot on white = 2.42:1.
**What I did to check it:** Read computed styles of the current and a non-current rail row and of the dot; computed both ratios from the measured colours.
**What I found:** Reproduced verbatim. Current: `{bg: rgb(247,238,223), color: rgb(26,34,51), borderLeftColor: rgb(201,160,99), borderLeftWidth: "2px", fontWeight: "400", textDecoration: none}`. Other: `{bg: rgba(0,0,0,0), color: rgb(58,68,86), borderLeft transparent, fontWeight "400", none}` — the two states genuinely differ only in colour. Ratios: border-on-fill **2.10**, dot-on-white **2.42** — both exact. `aria-current="page"` at `WizardRail.tsx:72` and `sr-only ", has notes"` at `:99` confirmed.
**One numeric slip in the recommendation:** `--gold-700` #8a6a38 is given as "4.3:1 on white"; it measures **5.00:1**. The error is in the safe direction — the proposed fix clears 3:1 with more margin than claimed.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 1.4.1 (A) and SC 1.4.11 (AA) correctly applied.

### A4-012 — CONFIRMED
**Original claim:** In forced-colors, links keep a focus ring and form fields lose theirs entirely; the only remaining difference on a field is a border going #000000 → #37006E, 1.39:1.
**What I did to check it:** This is the finding I came closest to refuting. My first pass used programmatic `element.focus()` under `forcedColors: "active"` and returned `outlineStyle: "none"` for **both** links and inputs — an apparent refutation. I re-ran the whole thing driving **real `Tab` keypresses** through 23 stops on `/letter/getting-started`, in both forced and normal modes.
**What I found:** With genuine keyboard focus the claim holds precisely. forced-colors **active**: first link (skip link) → `outlineStyle: "solid"`, `3px`, `rgb(55,0,110)` — a real ring. `f-authorName` at stop 23 → `outlineStyle: "none"`, `boxShadow: "none"`, `borderColor: rgb(55,0,110)`; the same field unfocused → `borderColor: rgb(0,0,0)`. That is exactly the before/after A4-012 reports, and I compute **#000000 vs #37006E = 1.39:1**, exact. In normal mode the same field focuses to `borderColor: rgb(217,185,127)` with the oklab box-shadow, and the same link gets a solid #e2caaa outline — consistent with A4-003. `field-ui.tsx:9` and `PhotoFields.tsx:239` exact. All five `A4-forcedcolors-*.png` screenshots are present in shared evidence.
**Verdict:** CONFIRMED — survived the hardest test I applied to any finding.
**already_fixed:** false
**wrong_severity:** false. reach 1 / harm 5 is a defensible shape for an HCM-only total loss of focus visibility.
**wrong_standard:** false — SC 2.4.7 (AA) and SC 1.4.11 (AA) correct. The analyst's own caveat (Chromium emulation with a light palette, not a real Windows Contrast Theme) is the right limitation to state.

### A4-013 — CONFIRMED
**Original claim:** Focus drops to `<body>` on every section change; 18 Tab presses from the skip link to the first form control; the rail sits inside `<main>`.
**What I did to check it:** Activated the "Next:" link from `/letter/getting-started` and read `document.activeElement`. Separately: Tab → skip link → Enter, then counted Tab presses until `closest("form")` was non-null.
**What I found:** Route change → `{url: "/letter/about", activeTag: "BODY", isBody: true, title: "About your loved one — Letter of Intent Builder", scrollY: 0}` — verbatim identical to the reported JSON. Skip-link sweep → **n = 18**, landing on `BUTTON` "+ Add a provider", `inForm: true` — verbatim identical. `main nav[aria-label="Letter sections"]` exists, so `railInsideMain: true`. `layout.tsx:94-105` (skip link, `<main id="main" tabIndex={-1}>`) and `letter/[slug]/layout.tsx:16-23` exact. The "252 avoidable keypresses" is 18 × 14, and checks out.
**Minor imprecision:** the two `RailLinks` are siblings of `nav[aria-label="Letter sections"]`, not inside it, so "a nav of 15 section links plus 2 rail links" is loose. Immaterial to the count.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 2.4.1 (A) correct, and ARIA11 is a genuine sufficient technique, so "Partially Supports" rather than a failure is the honest call. Correctly declines to invent an SC for SPA focus.

### A4-014 — CONFIRMED
**Original claim:** `ShareCard` destructures only `share`, never `copied`; on desktop Chromium nothing changes visually and nothing is announced.
**What I did to check it:** Loaded `/`, snapshotted the button label and every `[aria-live]` region's text, clicked the share button (clipboard permissions granted), re-snapshotted. Read both source files.
**What I found:** `{hasNativeShare: false, textBefore: "SHARE TO HELP ANOTHER FAMILY", textAfter: "SHARE TO HELP ANOTHER FAMILY", labelChanged: false, liveBefore: "", liveAfter: "", liveChanged: false}` — identical to the reported JSON, field for field. `ShareCard.tsx:24` is `const { share } = useCopyLink();` — `copied` is never read. `useCopyLink.ts`: `copied` state at `:12`, silent `catch` at `:20-23`, `setCopied(true)` + 2400ms revert at `:24-26`, `share()` falling through to `copyLink()` at `:29-39`. `ShareCard.tsx:83-85` is the privacy sentence, exact.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — and unusually careful: correctly reasons that SC 4.1.3 is **not** triggered because no status message is presented at all, rather than claiming a failure.

### A4-015 — CONFIRMED (mechanism); causal bridge remains PLAUSIBLE
**Original claim:** The `<video>`'s `onKeyDown` calls `preventDefault()` for Space, which would steal activation from native control-bar buttons.
**What I did to check it:** Focused the playing video and dispatched real `KeyboardEvent`s for `" "`, `Enter`, `f`, `k`, `ArrowRight`, reading `defaultPrevented` and the `dispatchEvent` return. Read `VideoPlayer.tsx`.
**What I found:** `" "` → `defaultPrevented: true`, `notCancelled: false`; `Enter` → false; `f` → false — the exact three results reported. (`k` and `ArrowRight` are also prevented, consistent with the handler.) `VideoPlayer.tsx:128-153` is the handler, `:119-126` the bottom-58px click guard, `:203-215` the element with `controls` and `tabIndex={0}` — all exact.
**Deployment question closed:** production serves `b243107` (poster, Watch pill, "under 5 minutes" all present live), so this is now a production code path, not a local-only one.
**What I could not close:** the same limitation the analyst states. Playwright cannot Tab into Chrome's media-controls shadow DOM, so the step from "Space is `defaultPrevented` on the host" to "the fullscreen button is unusable by keyboard" is inference about shadow-DOM retargeting, not observation. The mouse path is untested by both of us.
**Verdict:** CONFIRMED (for what is measured)
**already_fixed:** false
**wrong_severity:** false — 1/1/2 is appropriately modest.
**wrong_standard:** false — SC 2.1.1 (A) correct, and the SC 2.1.4 analysis (single-character shortcuts scoped to a focused control fall under the "active only on focus" exception, so 2.1.4 is **met**) is correct and a useful thing to have said.
**environment:** should now read `both`, not "local … deployment state untested".

### A4-016 — CONFIRMED
**Original claim:** The repo's gate uses only `wcag2a/2aa/21a/21aa`; 19 states all report zero violations; `color-contrast` incomplete counts of 23 / 24 / 22 / 21; `/samples` is not in the gate.
**What I did to check it:** Read `e2e/a11y.spec.ts`; parsed all 19 entries of `axe-A4-full.json` myself using the file's `nodeCount` field.
**What I found:** `a11y.spec.ts:7` is exactly `["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"]`; `:20` is the five-route loop with no `/samples`; `:28-34` the chooser test; plus the `ALL_SECTION_SLUGS` loop and two more interaction tests. The axe file holds **19** result sets and **every A/AA state has `violations: []`**. Incomplete `color-contrast` nodeCounts: `route_` **23**, `state_review-full-letter` **24**, `state_mobile-menu-open-390` **22**, `reflow320_letter_review` **21** — **all four exact**. A4's own run did include `wcag22aa` (visible in the stored `tags`), consistent with the text.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — WCAG-EM 1.0 is a real W3C Working Group Note and Step 4 is correctly characterised as requiring manual evaluation. (Its point 2 implicitly treats SC 3.3.7 as an AA addition; see A4-009 — 3.3.7 is Level A. The substance is unaffected since the gate carries no `wcag22a` tag either.)

### A4-017 — CONFIRMED, with one sub-claim REFUTED
**Original claim:** AAA `color-contrast-enhanced` fires on 28 / 44 / 122 nodes; `--ink-muted` #5e6878 **and** `--ink-faint` #646d7b on `--paper-2` both measure 4.92:1.
**What I did to check it:** Parsed the three `aaa_*` entries of the axe file; computed both ratios independently.
**What I found:** Node counts **28 / 44 / 122** — all three exact. `--ink-muted` #5e6878 on #f4efe6 = **4.92:1** exact (axe's own `failureSummary` in the same file says 4.91). **But `--ink-faint` #646d7b on #f4efe6 = 4.57:1, not 4.92.** Two different colours cannot produce the same ratio against the same ground; the finding attributes one measurement to both tokens. Conclusion unaffected — both sit in the 4.5–7 band — but the number is wrong for `--ink-faint`. The proposed `#4c5666` measures **6.48:1** (claimed ≈6.2). `globals.css:77-81` carries the `--ink-faint` comment as cited.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 1.4.6 Contrast (Enhanced), Level AAA, correct.

### A4-018 — CONFIRMED in substance; headline sub-claim REFUTED
**Original claim:** "Every standalone control is ≥44px in its smaller dimension … the `min-h-11` discipline is applied consistently and it works." Only inline text links fall short, with five named examples.
**What I did to check it:** Measured every `a[href]`, `button`, `input`, `select`, `textarea`, `[role=button]` at a 375px viewport across five routes, recording width, height and computed `display`.
**What I found:** The five named inline links reproduce **exactly**: "How it works" **74.5 × 15**, "Learn more." **83.4 × 19**, "(703) 745-5565" **109.9 × 19**, "contact@trustsandwealth.com" **212.1 × 19**, plus the intentional 1×1 skip link.
**But "every standalone control is ≥44px" is false.** On every route at 375px I measured **six `display: block` footer links at 335 × 24 px**: "Start your letter", "Privacy & your data", "Back up or delete", "(703) 745-5565", "contact@trustsandwealth.com", "trustsandwealth.com". These are not inline-in-a-sentence, so AAA 2.5.5's inline exception does not reach them — they are standalone controls at 24px. (They still meet AA 2.5.8, which needs 24×24.) Notably, the finding's own recommendation proposes a `min-h-11` treatment for the phone and email links "on /your-data and /privacy", missing the footer copies of the same two links that appear on **every** page and are the ones actually short.
**Verdict:** CONFIRMED (the criterion is not met, and the inline measurements are exact)
**already_fixed:** false
**wrong_severity:** false — 1/2/1 is right for a AAA item the analyst explicitly recommends not chasing.
**wrong_standard:** false — SC 2.5.5 (AAA, 44×44) and SC 2.5.8 (AA, 24×24 with an inline exception) both real and correctly levelled.

### A4-019 — CONFIRMED
**Original claim:** Flesch–Kincaid grade 10.8 and reading ease 48.8 on `/letter/medical`, with 17.7 words per sentence; seven of eight routes under grade 9.
**What I did to check it:** Wrote my own FK / Flesch-Reading-Ease implementation (independent syllable heuristic) and ran it over `<main>` on four routes.
**What I found:** `/letter/medical` → **FK 10.8, ease 48.8, 17.7 words/sentence** — all three exact, from an independently written implementation. `/` → FK 6.8 (claimed 7.0), `/privacy` → FK 7.8 (claimed 8.0) — within syllable-heuristic noise, and both under 9 as claimed. `/letter/review` is not comparable because my run had a thin letter.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 3.1.5 Reading Level, Level AAA, correct; "lower secondary education level ≈ grade 9" is the right reading. The analyst's own caveat that FK penalises "medications" is correct and appropriately limits the finding.

### A4-020 — CONFIRMED
**Original claim:** Per-field help is pervasive and correctly associated; `tel:`/`mailto:` appear in the footer on all routes and additionally in `<main>` only on `/privacy` and `/your-data`.
**What I did to check it:** Enumerated `a[href^="tel:"], a[href^="mailto:"]` on five routes recording whether each sits in `<footer>` or `<main>`. Read `field-ui.tsx` and `SectionForm.tsx`.
**What I found:** Exactly as claimed. `/`, `/letter`, `/letter/medical` → one `tel:` and one `mailto:`, both `inFooter: true`, `inMain: false`. `/your-data` and `/privacy` → four each: the footer pair **plus** a `<main>` pair. `field-ui.tsx:62-66` renders `<p id={helpId}>`; `:79-90` the example disclosure; `SectionScreen.tsx:116-140` the gate; `WizardRail.tsx:111-128` `RailLinks` — all exact. Minor citation drift: `aria-describedby` in `SectionForm.tsx` is at `:138`, `:148`, `:269`, `:289`; the finding cites `:121, 138, 149`.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** **true** — **SC 3.2.6 Consistent Help is Level A, not Level AA.** The finding's parenthetical calls it "the AA criterion 3.2.6". SC 3.3.5 Help (AAA) is correctly levelled.

---

## COUNT

| Verdict | Count |
|---|---|
| **CONFIRMED** | **37** |
| **PLAUSIBLE** | **1** (A3-007) |
| **REFUTED (whole finding)** | **0** |
| **already_fixed** | **2** (A3-003 fully — fixed *and deployed*; A4-002 partially — its struck duration half) |
| **wrong_severity** | **2** (A3-007, A3-015); 2 more mild (A3-009, A3-014) |
| **wrong_standard** | **4** (A3-017, A4-004 secondary citation, A4-009 level, A4-020 level) |

**Sub-claims I refuted inside otherwise-confirmed findings — these matter and should be corrected before anything is published:**
1. **A3-017's assertion that SC 2.4.11 Focus Not Obscured is met** — flatly contradicted by my own reproduction of four 100%-hidden focus stops. Two findings in the same audit take opposite positions; A4-007 is right.
2. **A3-015's distances** — "roughly 82%", "y≈5,300", "5,000px below". Measured at the identical seed and viewport: **43%**, **y = 2,788**, ~2,240px. The page height (6,430px) is exact; the magnitude is out by ~2×.
3. **A4-018's "every standalone control is ≥44px"** — six block-level footer links measure 335 × 24px on every route.
4. **A4-017's `--ink-faint` = 4.92:1** — it is 4.57:1.
5. **A4-005's "effective 4.58 CSS px"** — not derivable from the stated inputs (3.4px is what the numbers give).
6. **A3-016's "about 2.3:1"** for gold-500 on gold-100 — it is 2.10:1.
7. **A4-011's "gold-700 measures 4.3:1 on white"** — it is 5.00:1.
8. **A3-005's implication that the sheet prints a bare "None recorded"** — `emergency-document.tsx:239` already prints "None recorded — confirm with family."
9. **A4-002's residual sentence** about the two-minute label, which contradicts its own STRUCK note.
10. **Three WCAG level errors:** 3.3.7 is Level A (A4-009 says AA); 3.2.6 is Level A (A4-020 says AA); legacy §1194.22(c) is use-of-colour, not contrast (A4-004).

---

## STRONGEST FINDINGS (survived the hardest scrutiny)

1. **A4-006 — untagged PDFs, no `/Lang`.** I re-parsed the veraPDF reports myself and got the exact rule set, the exact per-rule failure counts (288, 198, 80, 49) and the exact totals (1225/489, 612/132); then confirmed the missing prop *and* that `language?: string` sits at the cited line 53 of the installed package's own types, *and* that no structure/tagging API exists anywhere in those types. There is nothing interpretive left in this finding. The one-line fix converts 247 failed checks to passes.
2. **A4-007 — focus obscured by the sticky masthead.** Reproduced element-for-element and pixel-for-pixel from an independently written sweep, including the four fully-hidden rects. Unambiguous SC 2.4.11 (AA) failure, invisible to every automated rule, and it directly refutes a contrary claim elsewhere in the same audit.
3. **A4-003 / A3-001 — the focus ring.** Canvas read-back gives #e2caaa; my own implementation of the WCAG formula reproduces 1.52 / 1.38 / 1.58 / 8.84 / 10.02 to two decimals; the measured `outlineStyle: "none"` on a focused field and the border going *down* to 1.88:1 are both live-verified. This is a whole-site, every-screen failure with a two-line fix.
4. **A4-012 — no focus indicator at all in forced-colors.** The one finding my first pass appeared to refute, which then survived a stricter test. That is the definition of a robust finding.
5. **A3-005 — the emergency sheet.** Both halves are facts I re-derived independently: a 589-character PDF, and a guard function that exists and is called nowhere while its twin *is* called.
6. **A4-010 — the fake tab pattern.** Every measured property reproduced exactly, including the null role/labelledby/tabindex on the supposed panel and the inert ArrowRight.

## WEAKEST FINDINGS I COULD NOT FULLY REFUTE

1. **A3-007 (email signup).** Every fact reproduces; the causal argument does not. The dead button is the dimmest control in the pair until the user has already typed a valid address, and the working calendar card carries three filled primary buttons. Marked PLAUSIBLE. The recommendation (remove the input until the service exists) is still sound on other grounds.
2. **A4-015 (video Space key).** The measurement is exact but synthesised; the bridge to the owner's fullscreen bug is inference about shadow-DOM retargeting that neither the analyst nor I could test, and the mouse path is untested by anyone.
3. **A3-008 (forced colours).** Every computed property reproduced, but Playwright's emulation keeps a light system palette, so the *visual severity* in a real Windows Contrast Theme is still inferred. Ten minutes on a real HCM machine would settle it.
4. **A3-014 (worked examples).** The counts are beyond dispute; the claim that more examples change what families write is unobserved. `mission_impact: 5` rests on that unobserved half.
5. **A3-004 (time estimates).** The contradiction is arithmetic and certain; which number is wrong is undetermined, so the finding cannot yet tell anyone what to change.
6. **A4-005's "4.58 CSS px"** and **A3-015's distances** — the surrounding findings hold, but these specific numbers do not reproduce.

## WHAT THE ANALYSTS MISSED (noticed while I was in there)

- **The two reports contradict each other on SC 2.4.11 and neither flags it.** A3-017 asserts it is met; A4-007 measures four 100%-covered stops. Anyone assembling a VPAT from both would produce an incoherent document. A4-007 is correct.
- **`b243107` is already in production.** `audit/CHANGES-DURING-RUN.md` records production as still serving the old label, and A4 explicitly says "whether `b243107` is deployed I did not test". I tested: it is. That flips A3-003 to needing no action at all, and flips A3-012 and A4-015 from "local, pending" to live production defects.
- **The `--focus-ring` failure has a third instance nobody cited.** `ReminderPanel.tsx:71` hand-copies the same `focus:outline-none` + `focus:shadow-[0_0_0_3px_var(--focus-ring)]` pattern onto the email input. A4-003 lists `field-ui.tsx:9` and `PhotoFields.tsx:239` as the two places to fix; there are **three**.
- **The `axe-A4-full.json` evidence file truncates `nodes` to four but stores the true count in a separate `nodeCount` field.** Anyone verifying A4-004 or A4-017 by counting `nodes.length` will get 4 and 8 and wrongly conclude the analyst inflated the numbers. I nearly did. Worth a README line in `audit/evidence/axe/`.
- **The six 24px block footer links** (A4-018) are a better AA-adjacent target than the inline links the finding focuses on: the phone number and email address a distressed user taps in a hurry are 24px tall on *every* page, not just `/privacy` and `/your-data`.
- **`--ink-faint` (#646d7b) at 4.57:1 on `--paper-2` is the tightest AA text pair on the site**, not the 4.92:1 that A4-017 reports. It still passes, but the margin is 0.07, and the token comment at `globals.css:77-80` claims it was darkened specifically to clear 4.5:1 — so any future paper-tint change breaks it silently. That is a good candidate for the token assertion A4-016 recommends.
- **`emergencyHasContent` is not merely uncalled — it is untested.** `derive.test.ts` and `key-points.test.ts` cover `keyPointsHaveContent`; nothing covers `emergencyHasContent`. Wiring it up (A3-005 rec 1) would be the first use *and* the first test.
