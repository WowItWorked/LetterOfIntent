# Accessibility Conformance Report — DRAFT

## Voluntary Product Accessibility Template® (VPAT®) — Version 2.5 (Rev) — WCAG Edition

> **THIS IS A DRAFT PREPARED BY AN AUDITOR, NOT A PUBLISHED CONFORMANCE CLAIM.**
> It is written at the fidelity the evidence supports and no further. Several rows are
> marked with an evidence-quality caveat. Before this is published, sent to a
> procurement office, or relied on by anyone, the gaps listed under
> *Evaluation Methods* → *Limits of this evaluation* must be closed — in particular,
> **no testing with an actual screen reader was performed**, and a conformance report
> that has not been screen-reader tested should not carry an organisation's name.
> Rows whose determination rests on inference rather than observation are flagged
> `[inferred]`.

---

## Name of Product/Version

My Letter of Intent — Letter of Intent Builder
Web application, evaluated locally at `http://localhost:3000`.

**Commit is not a single point.** Evaluation began at `d5ec230` with `src/app/page.tsx`
and `src/components/home/VideoPlayer.tsx` uncommitted; those were committed to
**`b243107`** partway through. Every determination below was either taken at or
re-verified against `b243107`, except that the full 19-state axe sweep, the reflow
matrix and the veraPDF pass were run before the move. The changed files are the home page
and the video player only — they do not touch the wizard, review, sample viewer or PDF
pipeline. **Whether `b243107` is deployed to production was not tested.**

## Report Date

2026-08-09

## Product Description

A free, client-side web application that guides a family member through writing a Letter
of Intent — the non-binding companion to a special needs trust — and generates a
formatted PDF letter, a one-page emergency information sheet, and a JSON backup file.
All content authoring, storage and document generation occur in the user's browser; no
letter content is transmitted to any server.

## Contact Information

Trusts & Wealth, PLLC — contact@trustsandwealth.com — (703) 745-5565

## Notes

1. **Scope of this report** is the web application at `https://myletterofintent.com`,
   evaluated locally at `http://localhost:3000` from the commit above.
2. **The PDF documents the tool generates are reported separately** in
   *Appendix A — Generated Documents*. They are user-authored output, not published
   content, and are therefore outside the normal scope of an ACR — but they are the
   deliverable the product exists to produce and a conformance report that ignored them
   would be misleading.
3. Determinations reflect the **highest-severity** state observed. Where a criterion is
   met in most states and fails in one, it is marked *Partially Supports* and the failing
   state is named.
4. Cross-references of the form `A4-0nn` point to findings in
   `audit/raw/A4-a11y-conformance.md`, which carries the evidence.

## Evaluation Methods Used

**Automated.** axe-core 4.12 via `@axe-core/playwright` 4.12.1, Playwright 1.62.1,
Chromium build 1234. 19 page states evaluated with tags
`wcag2a, wcag2aa, wcag21a, wcag21aa, wcag22aa`, plus a separate AAA pass. States included
post-interaction conditions: open modal dialog, mobile navigation menu expanded, video
playing, multiple populated validation errors, mid-download busy state, the "final wishes"
acknowledgement gate before and after acknowledgement, the PDF sample viewer, and 320px
reflow. Raw output: `audit/evidence/axe/axe-A4-full.json`.
**Result: zero violations in every state.**

**Manual.** Keyboard-only traversal forward and backward with per-stop measurement of
position, computed outline and box-shadow; skip-link function and tab-stop counting;
focus behaviour across client-side route change; modal focus placement, trap and
restoration; the browser's own accessibility tree via Chrome DevTools Protocol
`Accessibility.getFullAXTree` (roles, computed names with source, descriptions, and the
`invalid`/`required`/`selected`/`controls`/`describedby`/`modal`/`live` properties);
form-semantics inventory across five sections; contrast computed by rasterising each
declared colour — including `color-mix()`, `oklab()` and gradient stops — to a 1×1 canvas
and reading the sRGB pixel; reflow at 320×640, 640×512 and 320×256; the SC 1.4.12
text-spacing override; `prefers-reduced-motion: reduce`; `forced-colors: active` with
screenshots; orientation at both aspect ratios; target-size measurement at 375px;
help-mechanism inventory across eight routes; readability scoring; and veraPDF 1.x
PDF/UA-1 validation of the generated documents.
Raw output: `audit/evidence/axe/A4-measurements*.json`, `A4-ax-tree.json`;
screenshots `audit/evidence/screenshots/A4-*.png`.

**Limits of this evaluation** — these are the reasons this document is a draft:

| Gap | Effect on this report |
|---|---|
| No testing with NVDA, JAWS or VoiceOver | Every determination that depends on *how* something is announced (4.1.3, 3.3.1, 1.3.1, 2.4.6, 4.1.2) rests on the accessibility tree, not on hearing it. Nine per-field live regions are unverified in practice. |
| Chromium only — no Firefox, Safari or WebKit | `:focus-visible` heuristics, `forced-colors` mapping, native `<dialog>` and `<input type="date">` semantics all vary by engine. |
| No real mobile device or mobile screen reader | 2.5.x, 1.3.4 and 1.4.10 determinations are from viewport emulation. |
| Windows High Contrast emulated, not native | 1.4.11 / 2.4.7 forced-colors determinations are Chromium's emulation of the default light Contrast Theme only. |
| Production not separately evaluated | All determinations are from local dev. |
| The codebase changed mid-evaluation (`d5ec230` → `b243107`) | One observation went stale and was struck; the headline measurements were re-verified at the new HEAD, but the full automated sweep was not re-run. |

## Applicable Standards/Guidelines

| Standard/Guideline | Included in report |
|---|---|
| Web Content Accessibility Guidelines 2.0 | Level A — **Yes**; Level AA — **Yes**; Level AAA — No |
| Web Content Accessibility Guidelines 2.1 | Level A — **Yes**; Level AA — **Yes**; Level AAA — No |
| Web Content Accessibility Guidelines 2.2 | Level A — **Yes**; Level AA — **Yes**; Level AAA — **Selected criteria only** (1.4.6, 2.5.5, 3.1.5, 3.3.5) |
| Revised Section 508 standards — 36 CFR 1194, Appendix A, B and C | **Yes** |
| EN 301 549 v3.2.1 | Not evaluated separately; Chapter 9 tracks WCAG rows below |

## Terms

- **Supports** — the functionality of the product has at least one method that meets the criterion without known defects, or meets with equivalent facilitation.
- **Partially Supports** — some functionality does not meet the criterion.
- **Does Not Support** — the majority of product functionality does not meet the criterion.
- **Not Applicable** — the criterion is not relevant to the product.
- **Not Evaluated** — the product has not been evaluated against the criterion. (Used here only where the *Limits of this evaluation* prevent a determination.)

---

# WCAG 2.2 Report

## Table 1: Success Criteria, Level A

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| **1.1.1 Non-text Content** | Partially Supports | Decorative graphics are correctly `aria-hidden` or `alt=""`; the masthead lockup carries `alt="My Letter of Intent"`; icon-only share links carry `aria-label`. **Fails on `/samples/<slug>`**, where each PDF page is drawn to a `<canvas role="img">` whose `aria-label` identifies the page ("…, page 1 of 11") but conveys none of its content; measured `textContent.length === 0` and no text layer on any of 11 canvases. See A4-005. |
| **1.2.1 Audio-only and Video-only (Prerecorded)** | Not Applicable | The single media item is synchronized media (video with audio). No audio-only or video-only content exists. |
| **1.2.2 Captions (Prerecorded)** | **Does Not Support** | The explainer video (4 min 38 s, audio present) has zero `<track>` elements and zero text tracks — measured. axe flagged the same element under `video-caption` (incomplete). No captions exist in any form. See A4-001. |
| **1.2.3 Audio Description or Media Alternative (Prerecorded)** | **Does Not Support** | No transcript, no media alternative, no audio description. A search of every page for a transcript affordance returned nothing. The adjacent editorial column is a ~130-word summary of the topic, not an alternative for the media. See A4-002. |
| **1.3.1 Info and Relationships** | Supports | Semantic landmarks (`header`/`nav[Main]`/`main`/`footer`) on all routes; exactly one `<h1>` per page with no skipped levels; repeater groups use `<fieldset>`/`<legend>`; every input has a programmatic `<label for>` — verified in the accessibility tree, where names resolve with `nameFrom: "relatedElement"`; helper text is bound via `aria-describedby` to real elements; the review reading view uses `<dl>`/`<dt>`/`<dd>`. `[inferred]` for how this is announced — see *Limits*. |
| **1.3.2 Meaningful Sequence** | Supports | DOM order matches visual order at all tested widths; the two-column wizard layout is a flex-wrap that linearises correctly at 320px; no CSS reordering (`order`, `flex-direction: row-reverse`, grid placement) that separates reading order from visual order was found. |
| **1.3.3 Sensory Characteristics** | Supports | Instructions reference labels and section names, not position, shape or colour. No "click the button on the right" constructions found. |
| **1.4.1 Use of Color** | **Does Not Support** | The wizard rail's current-section indicator differs from the others **only** by colour — measured `fontWeight` 400 in both states, `textDecoration: none` in both, differing only in background tint (`--gold-100` ≈1.1:1 against the card), left border (`--gold-500` on `--gold-100` = 2.10:1) and text colour. The "has notes" marker is likewise a same-hue dot at 2.42:1. `aria-current="page"` and an `sr-only ", has notes"` mean assistive-technology users are served; sighted users with colour-vision deficiency or reduced contrast sensitivity are not. See A4-011. |
| **1.4.2 Audio Control** | Supports | No audio plays automatically. The video is behind a poster button and only loads and plays on explicit activation. |
| **2.1.1 Keyboard** | Partially Supports | All application functionality is keyboard operable: the full wizard, the chooser, all downloads, the restore flow and the delete confirmation were driven end-to-end from the keyboard. Two defects: (a) a custom `onKeyDown` on the `<video>` element calls `preventDefault()` for `Space` — measured `defaultPrevented: true` — which is the standard activation key for the buttons in the browser's own control bar (A4-015); (b) the chooser's `role="tab"` controls do not respond to arrow keys, which the announced role implies (A4-010). Both have a working alternative (Enter; Tab-then-Enter), hence Partially rather than Does Not. |
| **2.1.2 No Keyboard Trap** | Supports | 44 forward and 40 backward keyboard stops traversed on the densest route with no trap. The native `<dialog>` `showModal()` trap is escapable with `Escape` — verified, with focus restored to the invoking control. |
| **2.1.4 Character Key Shortcuts** | Supports | Single-character shortcuts exist on the video (`k`, `j`, `l`, `0`–`9`) but are active only while the `<video>` element itself has focus, which is the criterion's own "active only on focus" exception. No global single-key shortcuts. |
| **2.2.1 Timing Adjustable** | Supports | No time limits are imposed on the user. The 600 ms autosave debounce and the 8 s screen-reader announcement throttle are internal and do not constrain the user's pace. No session expiry — there are no sessions. |
| **2.2.2 Pause, Stop, Hide** | Supports | No auto-updating or auto-scrolling content. One indeterminate progress animation exists (the "Preparing to scrub" chip) and (a) appears only when the host fails to answer range requests, which does not occur on the current host, and (b) is disabled under `prefers-reduced-motion` by both a class and the global override. |
| **2.3.1 Three Flashes or Below Threshold** | Supports | Nothing flashes. No content changes luminance more than once per second. |
| **2.4.1 Bypass Blocks** | Partially Supports | A working skip link is the first tab stop on every page and moves focus to `<main id="main" tabIndex="-1">` — verified. However on the 25 wizard section routes the 17-link section rail is rendered **inside** `<main>` and therefore after the skip target: measured **18 tab stops** from skip-link activation to the first form control. The rail is a `<nav aria-label="Letter sections">` landmark, which is a WCAG-sufficient technique (ARIA11) for assistive-technology users, so the criterion is met in the letter; it is not met for keyboard-only users without AT. See A4-013. |
| **2.4.2 Page Titled** | Supports | Every route has a unique, descriptive, front-loaded `<title>` — verified on seven routes (e.g. "Medical — Letter of Intent Builder", "Your data — back up, move, or delete — Letter of Intent Builder"). Titles update correctly across client-side navigation. |
| **2.4.3 Focus Order** | Partially Supports | Tab order matches visual order on every route measured. However focus is dropped to `<body>` on every client-side route change — measured `activeElement === document.body` after activating "Next:" — so a keyboard user restarts from the top of the masthead on each of the 14 section transitions. WCAG has no criterion squarely governing focus after SPA navigation; recorded here as Partially Supports on the "preserves operability" clause rather than as a clean failure. See A4-013. |
| **2.4.4 Link Purpose (In Context)** | Supports | Link text is self-describing or resolvable from its sentence/list context. Icon-only share links carry `aria-label` and `title`. The repeater "Remove" buttons append `sr-only` disambiguation (" medication 2"). Two photo "Remove" buttons share a name but are distinguished by their enclosing `<figure>`/`<figcaption>` context. |
| **3.1.1 Language of Page** | Supports | `<html lang="en">` set in the root layout — verified on all routes. |
| **3.2.1 On Focus** | Supports | No change of context occurs on focus. Focus produces only visual styling changes. |
| **3.2.2 On Input** | Supports | No form control submits, navigates or otherwise changes context on input. Autosave writes to `localStorage` only. Validation hints appear on blur (`mode: "onTouched"`) and are non-blocking. |
| **3.3.1 Error Identification** | Supports | The only validation that fires in practice is the email-format hint. It renders adjacent text in a persistent `aria-live="polite"` container, is bound to the field with `aria-describedby`, and the accessibility tree reports `invalid: "true"` with the hint text as the description — verified via CDP. No explicit `aria-invalid` attribute is set; the state is derived from native constraint validation on `type="email"`, which is the standard HTML-AAM mapping. |
| **3.3.2 Labels or Instructions** | Supports | Every field has a visible `<label>` plus, in most cases, helper text and a "See an example" disclosure containing a real sample answer. Placeholders are illustrative and never substitute for a label. |
| **4.1.2 Name, Role, Value** | Partially Supports | Verified against the browser's accessibility tree, not markup: all interactive controls resolve to non-empty accessible names; `aria-expanded`/`aria-controls` on disclosures; `aria-current="page"` on the rail; `modal: true` and a `relatedElement`-sourced name on the dialog. **The chooser fails**: two controls announce `role="tab"` with `aria-controls="question-set"`, but `#question-set` has `role: null` — there is no tabpanel — and arrow-key traversal does not work (measured: `aria-selected` unchanged after ArrowRight). The role announced does not match the structure or behaviour. See A4-010. |
| **4.1.3 Status Messages** *(2.1)* | Partially Supports | Autosave, PDF preparation, restore results, delete confirmation and photo errors are all exposed without focus change — `aria-live="polite"` regions plus one `role="alert"` for photo errors and one `aria-live="assertive"` for download failures. **Gap:** the share/copy action produces no status message at all — measured, no label change and no live-region change after activation — so a user cannot tell whether the link was copied. Strictly the criterion is not triggered (nothing is presented visually either), but the operability defect is real. See A4-014. |
| **2.4.11 Focus Not Obscured (Minimum)** *(2.2 — see Table 2)* | — | Listed at Level AA in Table 2. |
| **3.2.6 Consistent Help** *(2.2 — Level A)* | Supports | A contact block (telephone and email) appears in the footer on every route measured, in the same relative order. Verified across eight routes. |
| **3.3.7 Redundant Entry** *(2.2 — see Table 2)* | — | Listed at Level A in WCAG 2.2; recorded in Table 2 below alongside the other 2.2 additions for readability. |

## Table 2: Success Criteria, Level AA

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| **1.2.4 Captions (Live)** | Not Applicable | No live media. |
| **1.2.5 Audio Description (Prerecorded)** | **Does Not Support** | No audio description track and no media alternative that describes visual content. See A4-002. |
| **1.3.4 Orientation** *(2.1)* | Supports | Tested at 400×800 and 800×400: identical content and functionality, no orientation lock, no rotate-your-device message, no horizontal scroll in either. |
| **1.3.5 Identify Input Purpose** *(2.1)* | **Does Not Support** | The wizard form sets `autoComplete="off"` at the form level and **no field carries an autocomplete token** — measured across five sections; every field returns `autocomplete: null`. Most fields collect information about a third party (the person being cared for) and are therefore outside the criterion's scope; the field that is in scope, the author's own name (`f-authorName`, label "Your name"), lacks `autocomplete="name"`. Narrow in extent, unambiguous in fact. See A4-008, which includes the privacy analysis of the remedy. |
| **1.4.3 Contrast (Minimum)** | **Does Not Support** | Body and secondary text pass comfortably across all routes (worst measured 4.92:1 against `--paper-2`). **The `accent` button variant fails**: `--navy-900` text over `--gradient-gold` measures **4.33:1** against the gradient's darkest stop, requirement 4.5:1. This affects the primary call to action on the home page, the chooser, the review page and the sample viewer. axe cannot evaluate contrast against a gradient and returned these as `incomplete` rather than as violations. See A4-004. |
| **1.4.4 Resize Text** | **Does Not Support** | The application's own text resizes correctly to 200% and beyond with no loss of content. **The sample document viewer does not**: each PDF page is a `<canvas>` sized to 100% of its column, so browser zoom cannot enlarge the document text — the rendered size in device pixels is effectively constant. Measured at a 320px viewport: canvas 280 CSS px from an 1100px backing store, scale 0.255, 10 pt body copy rendering at an effective 4.58 CSS px. See A4-005. |
| **1.4.5 Images of Text** | Partially Supports | The application uses real text throughout; the only images of text are the brand lockup (a logotype — exempt) and the sample document canvases. A faithful rendition of a printed document has a reasonable claim on the "essential" exception, which is why the sample viewer is reported primarily under 1.4.4. Recorded as Partially Supports rather than Supports because no text alternative is offered alongside. |
| **1.4.10 Reflow** *(2.1)* | Supports | Measured on six routes at 320×640, 640×512 (200% of 1280×1024) and 320×256 (400% of 1280×1024): `scrollWidth === clientWidth` in every case, and an enumeration of all elements extending past the client width returned empty in every case. No two-dimensional scrolling. This includes the sample viewer, where the canvas scales down rather than overflowing. |
| **1.4.11 Non-text Contrast** *(2.1)* | **Does Not Support** | Computed, not estimated. **Focus indicator:** `--focus-ring` measures **1.58:1** against `#ffffff`, **1.52:1** against `--paper`, **1.38:1** against `--paper-2` — against a 3:1 requirement. It is fine (8.84:1) on the navy panels. **Form fields:** `focus:outline-none` suppresses the shared outline (measured `outlineStyle: "none"` on a focused input), leaving only that low-contrast box-shadow, and the field's own border moves from 4.46:1 unfocused to **1.88:1** focused. **State indicators:** the rail's "has notes" dot is 2.42:1. Passing components include the unfocused input border (4.46:1), outline buttons (9.77:1) and the checkbox accent (12.3:1). See A4-003, A4-011, A4-012. |
| **1.4.12 Text Spacing** *(2.1)* | Supports | Applied the full 1.4.12 override (line-height 1.5, letter-spacing 0.12em, word-spacing 0.16em, paragraph spacing 2em) on four routes at 1024px: no horizontal scrolling and no clipped or overlapped content. The only element reported as clipped is the intentionally 1×1 `sr-only` skip link. |
| **1.4.13 Content on Hover or Focus** *(2.1)* | Supports | The only hover-revealed content is the "View sample" overlay on the sample thumbnails, which is `aria-hidden` decoration inside the link's own bounds — dismissible by moving away, hoverable, and persistent while hovered. Native `title` tooltips on the share links are browser-controlled and outside the criterion. |
| **2.4.5 Multiple Ways** | Supports | More than one route to any page: the masthead/footer navigation, the section rail on wizard routes, the chooser's full section listing, and in-content links. No search, which is not required when other mechanisms exist. |
| **2.4.6 Headings and Labels** | Supports | Headings are descriptive and front-loaded; labels state the question in plain language. Verified across seven routes. `[inferred]` for announcement quality — see *Limits*. |
| **2.4.7 Focus Visible** | Partially Supports | A single consistent focus style is applied site-wide via `:focus-visible`, which is more than most products manage. But it is **very low contrast** on light grounds (1.38–1.58:1, see 1.4.11), **absent as an outline on all form fields** (measured `outlineStyle: "none"`), and **effectively absent for form fields in forced-colors mode**, where the box-shadow is suppressed and the only remaining difference is a 1 px border colour change between `rgb(0,0,0)` and `rgb(55,0,110)` — a 1.39:1 difference. Links retain a real `solid` outline in forced-colors mode. See A4-003, A4-012. |
| **2.4.11 Focus Not Obscured (Minimum)** *(2.2)* | **Does Not Support** | Measured directly. Walking backwards with Shift+Tab from the foot of `/letter/medical` at 1280×900, nine consecutive stops were overlapped by the sticky masthead and **four were entirely covered**: "+ Add a provider" (44 of 44 px), "10 Benefits & money", "09 Housing", "08 School & work"; a textarea was 144 of 158 px covered. Browsers do not scroll an element that is inside the layout viewport, and a sticky header overlays the layout viewport. See A4-007. |
| **2.5.1 Pointer Gestures** *(2.1)* | Supports | No multipoint or path-based gestures anywhere in the product. |
| **2.5.2 Pointer Cancellation** *(2.1)* | Supports | All activation is on `click`/`pointerup`; no down-event activation. |
| **2.5.3 Label in Name** *(2.1)* | Supports | Accessible names contain the visible label text — verified in the accessibility tree, where names resolve `nameFrom: "contents"` or `"relatedElement"`. The repeater "Remove" buttons append rather than replace ("Remove medication 2"). |
| **2.5.4 Motion Actuation** *(2.1)* | Supports | No device-motion or user-motion actuation. |
| **2.5.7 Dragging Movements** *(2.2)* | Supports | The only drag affordance is the photo drop zone, which is a `<label>` wrapping a file input — a single-pointer click opens the file picker and achieves the identical outcome. |
| **2.5.8 Target Size (Minimum)** *(2.2)* | Supports | Measured every interactive element at 375px across five routes. Every standalone control is ≥44 px in its smaller dimension (`min-h-11` applied consistently to buttons, inputs, rail links and repeater controls). The sub-24 px items are (a) inline text links within sentences, which the criterion's *Inline* exception covers, and (b) visually-hidden controls (the skip link, the file input), which are not rendered targets. |
| **3.1.2 Language of Parts** | Supports | No content in a language other than the page language was found. |
| **3.2.3 Consistent Navigation** | Supports | Masthead, privacy strip and footer are identical and in the same relative order on every route. The wizard rail is consistent across all 25 section routes. |
| **3.2.4 Consistent Identification** | Supports | Components with the same function carry the same label throughout ("Start your letter · it's free" is used identically in the masthead and hero, deliberately; "Download" rows on the review page; "Remove" in repeaters). |
| **3.2.6 Consistent Help** *(2.2 — Level A, repeated here for the 2.2 additions)* | Supports | See Table 1. |
| **3.3.3 Error Suggestion** | Supports | The email hint states what is wrong and implies the correction in plain, non-punitive language: "This doesn't look like a full email address yet — worth a quick check." No field is required, so no "required field" errors exist. |
| **3.3.4 Error Prevention (Legal, Financial, Data)** | Supports | The two destructive actions are guarded. "Delete all my data" opens a modal confirmation that states the consequence, offers "Download a backup first" in the same dialog, and verifies deletion afterwards. Loading a backup over existing work opens a confirmation naming how many sections would be replaced. Removing a repeater row with content raises a native `confirm()`. |
| **3.3.7 Redundant Entry** *(2.2 — Level A)* | Partially Supports | Nothing is auto-populated incorrectly and no information is re-requested across steps in general — the emergency sheet is derived entirely from letter answers with no second form, which is exactly what the criterion asks for. One case falls short: "Who would you call first in an emergency?" is a free-text field asking the user to restate a person already entered in the contacts repeater immediately above, which even carries an `emergency` checkbox. Because no field in this product is *required*, a strict reading of "required to be entered again" gives a pass; recorded as Partially Supports on the criterion's intent. See A4-009. |
| **3.3.8 Accessible Authentication (Minimum)** *(2.2)* | Not Applicable | The product has no authentication. There is no account, no login, no password, and no email address is collected. |
| **4.1.3 Status Messages** *(2.1)* | Partially Supports | See Table 1. |

## Table 3: Success Criteria, Level AAA — selected criteria only

Only the four criteria named in the audit brief were evaluated. All other AAA criteria
are **Not Evaluated**.

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| **1.4.6 Contrast (Enhanced)** | **Does Not Support** | axe (AAA tags) reported `color-contrast-enhanced` at *serious* impact on 28 nodes (`/`), 44 nodes (`/letter/medical`) and 122 nodes (`/letter/review`). The recurring pattern is secondary text at 4.92:1 against `--paper-2` — safely above the 4.5:1 AA threshold, below the 7:1 AAA one. **Cost to reach:** every secondary text token would collapse toward `--ink-900`, the gold accent text could not be used for links on cream at all, and the navy panels' body colour would have to lighten to near-white — i.e. a redesign of the brand's typographic hierarchy, estimated 2–4 weeks of design plus a full visual regression pass. A partial step (raising `--ink-muted` from `#5e6878` to ≈`#4c5666`, giving ≈6.2:1) captures most of the benefit for under two hours. See A4-017. |
| **2.5.5 Target Size (Enhanced)** | Partially Supports | All standalone controls already meet 44×44 CSS px. Inline text links within sentences do not: measured "How it works" 74.5×15, "Learn more." 83.4×19, "download a backup file" 161.3×19, and the footer phone/email links at 19 px tall. **Cost to reach:** padding inline links to 44 px would break the line rhythm of every paragraph on the site, and the paragraph text is the product. A narrow, worthwhile subset — making the phone and email links block-level and 44 px tall on narrow viewports only — is under an hour. See A4-018. |
| **3.1.5 Reading Level** | Partially Supports | Flesch–Kincaid grade measured over `<main>`: home 7.0, chooser 8.0, getting-started 7.8, behavioral-support 8.0, final-wishes 7.7, review 7.2, privacy 8.0 — all at or below lower-secondary. **`/letter/medical` measures 10.8** (reading ease 48.8), driven by unavoidable domain nouns rather than sentence complexity (its average sentence length matches `/privacy`, which scores 8.0). The criterion's own supplement route is largely already taken: per-field helper text and worked example answers accompany most questions. **Cost to reach:** splitting two sentences in one section intro — about an hour of copy editing. See A4-019. |
| **3.3.5 Help** | Partially Supports | Context-sensitive help is unusually strong: programmatically associated helper text on most fields, a "See an example" disclosure containing a real sample answer, and a pre-start preview of every question in either question set. The gap is a route to a **person** from inside the form — the telephone number appears only in the page footer on wizard routes. **Cost to reach:** one paragraph appended to the wizard rail's link block, which renders in both the desktop rail and the mobile disclosure; under an hour. Note that the obvious alternatives (chat widget, support form) are rejected on privacy grounds, not cost. See A4-020. |

---

# Revised Section 508 Report

## Chapter 3: Functional Performance Criteria (FPC)

| Criteria | Conformance Level | Remarks and Explanations |
|---|---|---|
| **302.1 Without Vision** | Partially Supports | The wizard, chooser, review and data-management flows are fully operable via the accessibility tree with correct names, roles and states. Two blockers: the explainer video has no captions or transcript (302.1 is not the primary citation there, but the content is unavailable), and the sample documents are unreadable — 11 canvases conveying "page N of 11" and nothing else. Generated PDFs are untagged (Appendix A). **Not confirmed with a screen reader** — see *Limits*. |
| **302.2 With Limited Vision** | **Does Not Support** | Reflow and text spacing are exemplary. But the focus indicator measures 1.38–1.58:1 on the site's own grounds; form fields lose their outline entirely; the "you are here" and "has notes" markers are colour-only at 2.10:1 and 2.42:1; the primary CTA text is 4.33:1; and the sample documents cannot be enlarged at all. |
| **302.3 Without Perception of Color** | **Does Not Support** | Current-section and has-notes state in the wizard rail are conveyed by colour alone — measured identical font weight and text decoration between states. |
| **302.4 Without Hearing** | **Does Not Support** | The explainer video has no captions. It is one of only two secondary calls to action in the hero. |
| **302.5 With Limited Hearing** | **Does Not Support** | Same cause as 302.4. |
| **302.6 Without Speech** | Not Applicable | No speech input is required or offered. |
| **302.7 With Limited Manipulation** | Partially Supports | All targets meet 44 px; no dragging is required; no timed interactions. But keyboard operation is degraded: focus is dropped to `<body>` on each of 14 section transitions, 18 tab stops separate the skip link from the first form control, autofill is disabled site-wide, and focused controls are routinely hidden behind the sticky masthead. |
| **302.8 With Limited Reach and Strength** | Supports | No sustained input, no timed input, no fine-motor gestures. |
| **302.9 With Limited Language, Cognitive, and Learning Abilities** | Supports | This is the product's strongest area. Plain language at grade 7–8 on seven of eight routes; every question optional; per-field help and worked examples; a preview of every question before starting; autosave with a visible indicator; an explicit emotional gate before the end-of-life section with an equally weighted "Skip for now"; non-punitive, non-blocking validation. The residual gaps (one redundant-entry field, no help route to a person from inside the form, disabled autofill) are recorded above and do not rise to Partially Supports. |

## Chapter 4: Hardware — **Not Applicable** (software product, no hardware component).

## Chapter 5: Software

| Criteria | Conformance Level | Remarks |
|---|---|---|
| **501.1 Scope — Incorporation of WCAG** | See WCAG 2.2 report | The product is web content authored in HTML/CSS/JS; the WCAG tables above are the operative determination. |
| **502 Interoperability with Assistive Technology** | Partially Supports | Standard HTML semantics and correct ARIA throughout, verified against the platform accessibility tree, with the exception of the incomplete tab pattern (WCAG 4.1.2). No custom accessibility API implementation. |
| **503 Applications** | Partially Supports | 503.2 (user preferences) — the product respects `prefers-reduced-motion` (verified: zero running animations and zero transitions >50 ms under emulation) but suppresses its own focus indicator under `forced-colors`, which is a failure to respect a platform setting. |
| **504 Authoring Tools** | **Partially Supports — see Appendix A** | **This is the criterion that matters most for this product and the one most likely to be overlooked.** 504.2 requires that an authoring tool provide a mode of operation that produces content conforming to WCAG. The tool produces PDFs that are untagged, have no logical structure, and declare no natural language. 504.3 (prompts) and 504.4 (templates) are not met: the tool neither prompts the author to supply accessibility information nor offers an accessible template. Detail in Appendix A. |

## Chapter 6: Support Documentation and Services

| Criteria | Conformance Level | Remarks |
|---|---|---|
| **602.2 Accessibility and Compatibility Features** | Not Evaluated | No accessibility statement page exists on the site. Creating one is recommended and is a prerequisite for publishing any conformance claim. |
| **602.3 Electronic Support Documentation** | See WCAG report | The `/privacy` and `/your-data` pages, which serve as documentation, are covered by the WCAG tables. |
| **603 Support Services** | Supports | Telephone and email are offered in the footer of every page and in the body of `/privacy` and `/your-data`. No accessible-format-only barrier. |

---

# Appendix A — Generated Documents (outside normal ACR scope, reported deliberately)

The product's purpose is to produce three files. Two are PDFs handed to trustees,
siblings, schools, group homes and emergency rooms. Their accessibility is not governed
by an ACR for the *website*, but it is the thing the website exists to create, and a
conformance report that omitted it would mislead.

**Method.** veraPDF 1.x (the ISO reference implementation for PDF/UA), PDF/UA-1 profile,
Java 21.0.12, run against the real generated output in `audit/evidence/pdfs/` at the
"typical" fill level.

**Result: both documents are non-conformant.**

| Document | Passed checks | Failed checks | Verdict |
|---|---|---|---|
| Letter of Intent (11 pp) | 1,225 | **489** | Fail |
| Emergency Information Sheet (1 p) | 612 | **132** | Fail |

| ISO 14289-1 clause | Failure | Consequence for a reader |
|---|---|---|
| **6.2-1** | No `MarkInfo` dictionary with `Marked true` | The file is not a tagged PDF. |
| **7.1-11** | "StructTreeRoot entry is not present in the document catalog" | No logical structure at all — no headings, no lists, no reading order. |
| **7.1-3** | 288 content items "neither marked as Artifact nor tagged as real content" | Decorative rules and page furniture are indistinguishable from content. |
| **7.1-8** | No XMP metadata stream | Title, author and language are not discoverable by conforming readers. |
| **7.2-34** | Natural language not determined for **198** text items (letter) and **49** (emergency sheet) | A screen reader reads an English document in whatever voice the system defaults to. |

**Mitigating facts, stated so the picture is not worse than it is.** The text is real,
embedded and extractable — a screen reader will read *something*, not nothing. The
emergency sheet's two-column layout is the case where missing reading order does the most
damage, because it is the document that goes to an ER. The tool also produces a JSON
backup and an on-screen reading view, both of which are fully accessible; those are
currently the accessible copies of the letter and nothing on the site says so.

**Remediation.**
- **Immediate, one line, current scope:** `<Document>` in both PDF components accepts
  `language?: string` (confirmed in the installed package's type definitions) and does not
  set it. Adding `language="en"` clears clause 7.2-34 — 247 of the 621 failed checks — and
  is what makes a screen reader read the document in the right voice. Verify by re-running
  veraPDF and confirming clause 7.2 test 34 is absent.
- **Full PDF/UA is architectural.** `@react-pdf/renderer` 4.5 exposes no structure-tree
  API. Reaching conformance means replacing or post-processing the PDF layer — a
  multi-week rewrite with a permanent maintenance tax, and a real risk of producing
  wrongly-nested tags that read *worse* than no tags. A server-side renderer would solve it
  technically and must be rejected: it would send every diagnosis, medication, behavioural
  trigger and photograph off the device, which is the one thing this product promises not
  to do.
- **Interim, honest, cheap:** say so on the review page. One sentence telling families
  that the PDF is not structured for screen readers, and that the reading view and the
  backup file are the accessible copies, costs nothing and is true.

---

# Appendix B — Legal Disclaimer

This draft was produced by an independent auditor as part of a nine-analyst review and
has not been reviewed or adopted by Trusts & Wealth, PLLC. It is not a published
conformance claim and must not be represented as one. VPAT® is a registered trademark of
the Information Technology Industry Council (ITI). This document follows the VPAT 2.5Rev
WCAG Edition structure; it is not an ITI-certified document.

**Before publication, at minimum:**
1. Complete screen-reader testing (NVDA/Firefox, JAWS/Chrome, VoiceOver/Safari, plus
   TalkBack and VoiceOver iOS) and revise every row flagged `[inferred]`.
2. Test in Firefox and Safari.
3. Verify the forced-colors determinations on a real Windows machine with a Contrast
   Theme active.
4. Remediate or formally accept the six *Does Not Support* rows.
5. Publish an accessibility statement page (Section 508 §602.2) naming the known
   limitations and giving a route to report barriers.
