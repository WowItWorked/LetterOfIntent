# A2 — Usability, flow, and form completion

Analyst A2. Working blind to the other eight. Analysis only — no application code,
styles, content or configuration was modified. The only files created are the
measurement scripts under `audit/tools/a2-*.mjs`, their JSON/PNG output under
`audit/evidence/a2/`, and this document.

Repo root: `C:\Users\patri\OneDrive\Documents\Claude Code\Trusts Wealth Website\loi-builder`
Local dev: `http://localhost:3000` (already running, `next dev`, Turbopack)
Production: `https://myletterofintent.com` (read-only; nothing was typed into production)

---

## Method

Everything below marked MEASURED came out of a Playwright script I wrote and ran.
The scripts are committed under `audit/tools/` so every number can be re-run:

| script | what it produces |
|---|---|
| `audit/tools/a2-inventory.mjs` | `audit/evidence/a2/inventory.json` — every rendered control, label, repeater and declared duration, both paths |
| `audit/tools/a2-personas.mjs` | `audit/evidence/a2/persona-runs.json`, `persona-runs-P1.json` — P1/P2/P3/P5 + task 7 + a production timing comparison |
| `audit/tools/a2-full-run.mjs` | `audit/evidence/a2/full-run.json` — a real end-to-end completion of all 15 sections, then PDF generation; validation and error states; backup→delete→restore |
| `audit/tools/a2-recheck.mjs` | `audit/evidence/a2/recheck.json` — two checks the first pass measured badly, redone strictly |
| `audit/tools/a2-comprehension.mjs` | `audit/evidence/a2/comprehension.json` — Flesch/Flesch–Kincaid per section, jargon inventory, keyboard cost |
| `audit/tools/a2-storage-detail.mjs` / `a2-storage-prod.mjs` | `audit/evidence/a2/storage-failure*.json` + screenshots — behaviour when localStorage cannot be written, local **and on production** |
| `audit/tools/a2-zoom-shots.mjs` | `audit/evidence/a2/zoom-200/` — P2's viewport at 200% |
| `audit/tools/a2-save-visibility.mjs` | `audit/evidence/a2/save-indicator/` — is the autosave reassurance actually on screen |
| `audit/tools/a2-progress-honesty.mjs` | `audit/evidence/a2/progress-honesty.json` — what the progress bar says at known fill levels |
| `audit/tools/a2-pdf-text.mjs` | `audit/evidence/a2/pdf-text.json` — text of the shared evidence PDFs |

**Four method disclosures I am obliged to make plainly.**

1. **P3 is a proxy, not a screen reader.** I could not drive NVDA or VoiceOver. I
   drove the keyboard and read the accessibility tree. That tells me tab order,
   accessible names, landmarks, headings and live-region presence. It does **not**
   tell me what is announced, in what order, or whether a live region actually
   fires. **Every P3 finding is labelled INSPECTED, never MEASURED.**
2. **P2's "200% zoom" is an approximation.** I did not drive real browser zoom. I
   emulated a 1024×768 window at 200% as a **512×384 CSS-pixel viewport at
   deviceScaleFactor 2**, which reproduces the layout consequence (the CSS viewport
   halves) but not browser font-boosting or browser chrome. Numbers are directionally
   right; treat the exact pixels as ±.
3. Dev-server timings are unminified per-module and are **not** production. Where
   load performance matters I re-ran against production and report those numbers.
4. The 30-minute idle was **simulated** by rewriting `meta.startedAt`/`meta.updatedAt`
   to 30 minutes ago and opening the app cold. I did not wait 30 minutes.

### Build state — the brief is out of date, and it matters

The brief states local HEAD and `origin/main` are both `d5ec230`, with
`src/app/page.tsx` and `src/components/home/VideoPlayer.tsx` uncommitted and therefore
absent from production. **That is no longer true.** During this run:

- `HEAD` and `origin/main` are both **`b243107`**.
- Both files are **committed and pushed** — `git status --porcelain` on them is clean.
- Production is **serving the new version**: the `#what-it-is` section on
  `https://myletterofintent.com/` now carries `class="tw-panel-navy"`, and the served
  HTML contains the poster play button's `aria-label`. The deployment gap the brief
  told me to expect has closed.

I mention it because I was told to treat any local/production difference in that
section as an expected deployment gap rather than a defect, and that instruction no
longer applies. I also note, without reading them, that other analysts' output files
now exist under `audit/raw/`; per Rule 2 I have not opened any of them, and my own
scripts and evidence were committed by something other than me mid-run.

---

## The measured shape of the task

From `audit/evidence/a2/inventory.json` and `full-run.json`, special-needs path:

| | measured |
|---|---|
| sections | 15 |
| top-level questions | **83** |
| form controls with one item in each repeater | **96** |
| controls actually filled in a complete run | **95** |
| characters typed for a realistic (2-sentence) answer everywhere | **12,860** |
| navigation clicks start → downloaded files | **16** |
| extra clicks to open repeaters | 3 |
| sum of the per-section "about N minutes" badges | **165 min** |
| what the site promises | **45–90 min** |
| stored letter size | 15,014 bytes of localStorage |

General path: 14 sections, 71 questions, 84 controls, badges sum **145 min** against
a promise of **40–80 min**.

---

## FINDINGS

```yaml
- id: A2-001
  title: A browser that will not let the site write localStorage produces "This page couldn't load" on every wizard section, in production, with no explanation and no way past it
  category: save-resume / error prevention / abandonment
  what_i_observed: >
    I patched localStorage.setItem to throw QuotaExceededError for this app's key only
    — the behaviour of "block all cookies"/"don't allow sites to save data" in Chrome
    and Safari, a managed device with site data blocked, and an exhausted origin quota
    — and loaded the real production site. Every wizard section renders the Next.js
    error boundary: a full-page "This page couldn't load. Reload to try again, or go
    back." with Reload and Back buttons. Zero form inputs render (control run on the
    same URL renders 5 and 8). The homepage, the /letter chooser and /letter/review
    still render normally, so a family gets all the way through the marketing, taps
    "Start the special needs letter", and lands on a dead page. Nothing anywhere tells
    them the cause is a browser setting. Reload will fail forever.
    The dev build names the exact line: src/lib/store.ts:38 setLastVisited -> zustand
    persist setItem -> throws, uncaught, inside SectionScreen.useEffect
    (src/components/wizard/SectionScreen.tsx:31-37).
  evidence:
    type: measurement + screenshot + network/storage instrumentation + code
    detail: >
      audit/evidence/a2/storage-failure-prod.json — "/letter/getting-started":
      controlRun {inputs:5, mainChars:1405} -> blocked {formInputs:0, mainVisibleChars:0},
      uncaughtErrors ["QuotaExceededError: The quota has been exceeded."].
      Screenshot: audit/evidence/a2/storage-failure-prod/wizard-medical.png (production,
      1280x950) shows only "This page couldn't load".
      Local dev overlay pinpointing the throw:
      audit/evidence/a2/storage-failure/wizard-getting-started.png.
      Code: src/lib/store.ts:49-57 (persist with createJSONStorage(() => localStorage),
      no onRehydrateStorage error path, no try/catch around writes);
      src/components/wizard/SectionScreen.tsx:31-37 (setLastVisited fires in an effect
      on every section mount).
      Contrast — the codebase already knows how to do this: src/components/wizard/PhotoFields.tsx:119-123
      catches the same class of failure and says "This browser would not store the photo.
      It may be in private mode, or out of space."
  confidence: MEASURED
  who_is_affected: >
    Anyone whose browser refuses site data: privacy-hardened settings, school/library/
    employer-managed devices, some in-app browsers, a genuinely full origin quota (the
    same origin also holds IndexedDB photos). Disproportionately the privacy-cautious —
    exactly the people this product's promise attracts.
  why_it_matters: >
    This is the worst possible failure for this product. The user is not told they
    cannot use the tool; they are told the page is broken. They will assume the site is
    down and leave. Governing hierarchy: this is an accessibility-and-clarity failure
    sitting on top of the privacy promise the site uses to earn trust.
  standard_reference: >
    WCAG 2.2 SC 3.3.1 Error Identification (an error occurred and is not identified in
    text); Nielsen heuristic 9 "help users recognize, diagnose and recover from errors".
  recommendation: >
    Wrap the persist storage in a guard that catches write failures once, sets a
    module-level "storage unavailable" flag, and (a) keeps the wizard fully usable in
    memory for this session, (b) shows a persistent, calm banner in the section header:
    "This browser is not letting us save on this device, so your work will be lost if
    you close this tab. You can still write, and you can download a backup file at any
    time — that file is the copy that lasts." (c) points to /your-data for the immediate
    download. Reuse the exact PhotoFields wording pattern so the voice matches. Also add
    a probe write on first load (write and delete a 1-byte test key) so the warning
    appears before the parent types for forty minutes, not after.
  scope: current
  privacy_impact: none — everything stays on the device; the fallback is in-memory only.
  cost_and_maintenance: One small storage wrapper plus one banner component. No new dependencies, no infra.
  effort: M
  risk_of_change: Low. The change is additive; the happy path is untouched.
  mission_impact: 5
  reach: 2
  harm_if_unfixed: 5
  environment: both

- id: A2-002
  title: The progress bar reads 100% and "Every section has notes" when 15 of 83 questions are answered — and the PDF the family hands over never says what was left blank
  category: progress indication / honesty / completeness
  what_i_observed: >
    startedCount() counts a section as done if ANY one field in it has content
    (src/lib/derive.ts:57-73). I seeded exactly one real answer in each of the fifteen
    sections — 15 of 83 questions, 18% — and the rail bar rendered at width:100%, the
    rail said "You've added notes to 15 of 15 sections. Every section has notes. A
    yearly review keeps it trustworthy.", and the review page said "Every section has
    notes." Separately, the generated Letter of Intent PDF has a CONTENTS page that
    lists only the sections that were filled: the minimal PDF's contents page reads
    "CONTENTS — What's in this letter — 1 Getting started 4". A reader in 2034 cannot
    tell whether the parent had nothing to say about behaviour or never got there.
  evidence:
    type: measurement + code + content
    detail: >
      audit/evidence/a2/progress-honesty.json — "one-answer-per-section":
      {answersGiven:15, questionsAvailable:83, rail:{barWidth:"100%", text:"...You've
      added notes to 15 of 15 sections. Every section has notes..."},
      review:{lead:"Every section has notes. ..."}}. Same file, "one-section-only":
      1 answer -> barWidth "7%".
      Code: src/lib/derive.ts:57-60 sectionHasContent uses def.fields.some(...);
      src/components/wizard/WizardRail.tsx:24, 36-49.
      PDF text: audit/evidence/a2/pdf-text.json — minimal letter,
      mentionsSectionsLeftBlank:false, hasContentsPage:true, contents lists one entry.
      Counter-example the product already gets right: the emergency sheet prints
      "ALLERGIES  None recorded — confirm with family."
  confidence: MEASURED
  who_is_affected: >
    Every family (the encouragement is well-intentioned and will be believed), plus
    P5 the attorney reviewing a client's output and every future caregiver who reads
    the finished PDF.
  why_it_matters: >
    Two opposite harms from one mechanism. Forward: a parent stops at 18% believing the
    document is finished. Backward: the person holding the letter in an emergency does
    not know that "no behaviour section" means "unanswered", not "nothing to say".
    The product's own stated purpose is that the document must serve whoever has to
    read it someday.
  standard_reference: >
    Nielsen heuristic 1 (visibility of system status) and heuristic 10 (documentation);
    WCAG 2.2 SC 3.3.2 Labels or Instructions in spirit rather than letter.
  recommendation: >
    Two separate changes. (1) Keep the encouraging "sections touched" count — it is
    good — but stop calling it complete. Show two numbers: "15 of 15 sections started ·
    15 of 83 questions answered", and hold the gold bar to the question ratio, or drop
    the bar to a dotted "started" marker per section. Never print "Every section has
    notes" unless it is true of the questions. (2) In the PDF, print every section
    heading, and under any unanswered one print a single ruled line in the letter's own
    voice — "Not written down yet. Ask the family." — matching the emergency sheet's
    existing "None recorded — confirm with family."
  scope: current
  privacy_impact: none — computed from data already on the device.
  cost_and_maintenance: derive.ts gains a question-level counter; loi-document.tsx gains an "omitted" row. No new deps.
  effort: M
  risk_of_change: Medium — the PDF change alters page count and pagination; A6's territory to re-check.
  mission_impact: 5
  reach: 5
  harm_if_unfixed: 4
  environment: both

- id: A2-003
  title: The promised time (45–90 minutes) is contradicted by the site's own per-section badges, which sum to 165 minutes
  category: honesty / expectation setting / abandonment
  what_i_observed: >
    "About 45–90 minutes" appears on the homepage, on /letter, on the chooser card and
    inside the getting-started intro. Reading the "about N minutes" eyebrow the app
    renders on each of the fifteen section pages and summing them gives 165 minutes.
    The general path claims "40–80 minutes"; its badges sum to 145. My own end-to-end
    run typed 12,860 characters across 95 controls; at 33 wpm plus 45 seconds of
    thinking per question that is ~149 minutes, which lands on the badges, not the
    promise.
  evidence:
    type: measurement + content
    detail: >
      audit/evidence/a2/inventory.json — summary.specialNeeds.declaredMinutesSum: 165;
      summary.general.declaredMinutesSum: 145.
      Claim locations (verbatim): src/app/page.tsx:167 "No account. No email required.
      About 45–90 minutes, in as many sittings"; src/app/letter/page.tsx:46 "About 45–90
      minutes in total"; src/lib/content/paths.ts:57 minutesLabel: "45–90 minutes";
      src/lib/content/sections/01-getting-started.ts:15 "Most families finish in 45 to 90
      minutes"; src/lib/content/sections/general/index.ts:33 "40 to 80 minutes".
      audit/evidence/a2/full-run.json — humanTimeModelINFERRED.totalMinutes 149
      (the model itself is INFERRED; the 12,860 characters and 95 controls are MEASURED).
  confidence: MEASURED
  who_is_affected: All five personas; most damaging to P1, who is budgeting a scarce evening.
  why_it_matters: >
    A parent who sets aside an hour on the strength of "45–90 minutes" and is a third
    of the way through at the ninety-minute mark does not conclude they type slowly.
    They conclude the tool misled them, and that is the moment trust in everything else
    on the page — including the privacy promise — becomes negotiable. Under-promising
    would cost nothing here, because the product already says "a letter with three
    sections filled in is worth more than the perfect letter that never gets written".
  standard_reference: Nielsen heuristic 1 (visibility of system status); plain-language honesty.
  recommendation: >
    Either raise the headline to match the badges ("most of a Saturday morning, or four
    or five short sittings — about 2½ hours of writing in total, and it is genuinely
    useful long before then"), or lower the badges. Do not leave the two disagreeing.
    Better still, lead with the sitting rather than the total: "Ten minutes gets you a
    usable emergency sheet. The full letter is about 2½ hours, in as many sittings as
    you like." That reframes the number as a reason to start rather than a reason to
    postpone. A single derived constant summing the badges would keep the two in sync
    forever.
  scope: current
  privacy_impact: none — copy only.
  cost_and_maintenance: One derived total, five copy edits.
  effort: S
  risk_of_change: Low.
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A2-004
  title: The hero button labelled "Start your letter" does not start the letter — it lands on a 5,905px chooser that asks a second question before a single field
  category: information architecture / flow / abandonment
  what_i_observed: >
    P1 on a 390x844 iPhone. Tapping the hero CTA "Start your letter · it's free" goes to
    /letter, a page 5,905px tall (7.0 screens on that phone). The explicit
    "Start the special needs letter" button sits at y=4445 — 5.3 screens down. The two
    option cards higher up ARE clickable (they are <button>s that call begin()), but
    nothing about them reads as a button: they are 614px and 624px tall reading cards
    whose only button-like cue is a gold text line at the very bottom. Total taps from
    homepage to the first question: 2. Total scroll before the first question is
    visible: 1.2 further screens on the section page (first field at y=1014). On a
    390px phone the header CTA is also unavailable without first opening the hamburger
    (COMPACT_BELOW = 1100 in src/components/chrome/SiteHeader.tsx:12), so the same
    collapse applies to every window narrower than 1100px — which includes a 1024px iPad
    and plenty of laptops.
  evidence:
    type: measurement + screenshot + code
    detail: >
      audit/evidence/a2/persona-runs-P1.json — phases.P1.tasks.task2_begin:
      trail ["header Start visible without opening the menu: false", "hero CTA ...",
      "-> /letter", "'Start the special needs letter' sits at y=4445 on /letter", ...],
      taps 2, pxToScrollToFirstField 1014, fold.documentHeight 5905,
      fold.screensOfScroll 7, fold.anyCtaInFirstViewport false (on /letter).
      Screenshot: audit/evidence/screenshots/letter-chooser-320.png.
      Code: src/components/letter/PathChooser.tsx:70-118 (option card is a <button>),
      src/components/letter/StartButtons.tsx:29-39, src/components/chrome/SiteHeader.tsx:12.
  confidence: MEASURED
  who_is_affected: >
    Every first-time visitor, worst for P1 (tired, small screen) and P4 (reading in a
    second language — the chooser is the highest-grade prose on the site at FK 8.0).
  why_it_matters: >
    The single hardest thing about this document is starting it. The current flow puts
    ~700 words and a taxonomy decision between "I have decided to do this" and the first
    keystroke. The chooser content is good and the reasoning for it is sound — but it is
    a *preparation* page being used as a *gate*.
  standard_reference: Nielsen heuristic 8 (aesthetic and minimalist design); Krug, "Don't Make Me Think", the trunk-test.
  recommendation: >
    Put a compact two-button choice in the first viewport of /letter — "Caring for
    someone with disabilities → Start" / "Caring for an adult who mostly manages →
    Start" with one line of copy each — and keep the full cards and the fifteen-section
    preview below it as "read what it asks first" for the people who want it. Give the
    existing option cards a visible button affordance at the top, not only a gold text
    line at the bottom. Nothing needs to be removed.
  scope: current
  privacy_impact: none — layout and copy.
  cost_and_maintenance: One component reorder on /letter. No new deps.
  effort: M
  risk_of_change: Low; purely additive above existing content.
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A2-005
  title: A family that comes back tomorrow and types the domain into their phone sees a marketing homepage with no sign their letter exists
  category: save-resume / returning users
  what_i_observed: >
    ResumeCard is rendered only on /letter (src/app/letter/page.tsx:53). It is not on
    the homepage. I seeded a letter with two sections of content, meta.lastVisitedSlug
    "medical", and timestamps 24 hours old, then opened "/" on a 390x844 phone: no
    resume link, no "welcome back", nothing. The shortest real route back to the answer
    they wanted to revise was hero CTA → /letter → "Pick up where you left off" →
    /letter/medical = 2 taps, then 1,037px (1.2 screens) of scrolling to reach the
    specific answer.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/persona-runs.json — phases.task7: homeResumeAffordance null,
      trail ["resume affordance on \"/\" : NONE", "hero CTA -> /letter",
      "ResumeCard on /letter: {...\"Pick up where you left off\"...}",
      "-> /letter/medical"], taps 2, pxScrollToTheAnswerBeingRevised 1037,
      anyFindOrSearch false.
      Also audit/evidence/a2/persona-runs-P1.json — task4.e_new_browser_session
      .resumeAffordanceOnHome: null.
      Code: src/components/home/ResumeCard.tsx:13-21 (returns null unless mounted with
      content); imported only by src/app/letter/page.tsx.
  confidence: MEASURED
  who_is_affected: Everyone who returns — which the product explicitly asks them to do, tonight and again in a year.
  why_it_matters: >
    The whole design bets on "a few sittings". The homepage is the address people
    actually type and the link an attorney actually sends. Meeting a returning parent
    with the pitch instead of their letter makes the second sitting feel like starting
    over, and it is the sitting most likely to be skipped.
  standard_reference: Nielsen heuristic 6 (recognition rather than recall).
  recommendation: >
    Render ResumeCard at the top of the homepage too, above the hero, when the device
    holds a letter. It already self-hides for new visitors, so first-time conversion is
    untouched. While there, make the header CTA swap its label to "Continue your letter"
    when a letter exists.
  scope: current
  privacy_impact: >
    none — ResumeCard reads only the local store. Note it does surface the child's
    preferred name on the homepage, so anyone who picks up the phone sees it; that is
    already true on /letter and is consistent with the product's model.
  cost_and_maintenance: One import and one placement.
  effort: S
  risk_of_change: Low.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A2-006
  title: On desktop, a keyboard or screen-reader user passes 17 navigation links before the first question — on every one of the 15 sections
  category: navigation / accessibility (keyboard) / cognitive load
  what_i_observed: >
    The wizard layout puts the section rail before the section content in DOM order
    (src/app/letter/[slug]/layout.tsx:19-22), and the skip link targets <main>, which
    contains the rail. Tabbing from the top of /letter/getting-started at 1280px reaches
    the first form field on tab stop 23; on /letter/medical it is tab stop 25. The same
    traversal at 390px costs 8, because the rail collapses into a single <details>
    summary. If focus resets to the top of the document on each client-side route change
    — which is the App Router default but which I did NOT verify here — a full
    fifteen-section pass costs roughly 250 extra tab presses that a mouse user never
    makes. "Skip to main content" does not help, because the rail is inside main.
  evidence:
    type: manual-a11y (keyboard, MEASURED as key presses) + code
    detail: >
      audit/evidence/a2/comprehension.json — keyboard["desktop-1280"]
      .tabsFromTopOfPageToFirstQuestion: 25; keyboard["phone-390"]: 8; sequences recorded
      in the same object.
      audit/evidence/a2/persona-runs.json — phases.P3.routes["/letter/getting-started"]
      .tabsToFirstFormField: 23, with the full tabOrder array (skip link, logo, header
      CTA, Share, "How it works", then 01–15, "Review & download →", "Back up or delete
      your data", then the first input).
      Code: src/app/letter/[slug]/layout.tsx:16-23; src/app/layout.tsx:94-105.
      WCAG: this is 2.4.1 Bypass Blocks — a skip mechanism exists but does not bypass
      the repeated block, which is the rail, not the masthead.
  confidence: INSPECTED
  who_is_affected: >
    P3 and every keyboard-only user; also anyone using switch access, voice control or
    a head pointer. Note the P3 disclosure at the top: I could not verify what NVDA or
    VoiceOver announces, only what the DOM and focus order contain.
  why_it_matters: >
    Fifteen sections is a long document for anyone. Paying a 25-stop navigation tax
    before every single one turns "come back for ten minutes" into something a person
    stops doing. This is the accessibility tier of the governing hierarchy, above
    clarity and design.
  standard_reference: WCAG 2.2 SC 2.4.1 Bypass Blocks (A); SC 2.4.3 Focus Order (A).
  recommendation: >
    Put the section content before the rail in DOM order and place the rail visually
    with CSS order/grid (the layout is already flex-wrap, so this is a one-line change
    plus an `order` utility). Failing that, add a second skip link inside the wizard —
    "Skip to the questions" — targeting the <article>, and give the rail
    `role="navigation"` with a heading so it can be jumped to deliberately.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One layout change. Re-check the 1024px breakpoint visually.
  effort: S
  risk_of_change: Low, but it is a visual layout change so it wants a screenshot diff.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A2-007
  title: At 200% zoom the sticky masthead and privacy strip eat 45% of the screen, permanently — the grandparent sees 212px of content at a time
  category: mobile/zoom friction / accessibility
  what_i_observed: >
    Emulating a 1024x768 window at 200% zoom (512x384 CSS px, dsf 2), the sticky <header>
    measures 114px and the privacy strip below it 58px: 172px of 384px, 45% of the
    viewport, on every route, and the header is position:sticky so it never scrolls away.
    At 100% on the same window it is 189px of 768px, 25%. The first screen of
    /letter/getting-started at that zoom contains the logo lockup, the privacy strip, a
    collapsed "Sections" accordion and the top edge of the navy panel — not one question,
    not one field. The wizard page is 6.8 screens tall at that zoom.
    Credit where due: there is no horizontal overflow at any route (scrollWidth == 512),
    so reflow itself is clean.
  evidence:
    type: measurement + screenshot
    detail: >
      audit/evidence/a2/zoom-200/measurements.json —
      "wizard@zoom200-512x384": {viewportH:384, headerH:114, stripH:58,
      chromePctOfViewport:45, usableRows:212, screens:6.8};
      "wizard@zoom100-1024x768": {chromePctOfViewport:25, screens:2.9}.
      Screenshot: audit/evidence/a2/zoom-200/wizard--zoom200-512x384.png.
      audit/evidence/a2/persona-runs.json — phases.P2.routes, horizontalOverflow false
      and scrollWidth 512 on all six routes.
      Code: src/components/chrome/SiteHeader.tsx:56-79 — logo height
      clamp(64px, 19vw, 124px), header position sticky.
  confidence: MEASURED
  who_is_affected: P2 and anyone who zooms — which is most people over about 65, and many with low vision.
  why_it_matters: >
    A person who needs 200% is the person least able to hold a long form in working
    memory, and we are giving them half a screen. The logo is doing nothing for them:
    they already know what site they are on.
  standard_reference: >
    WCAG 2.2 SC 1.4.4 Resize Text (content remains available, so this passes the letter
    of the SC) and SC 1.4.10 Reflow (passes — no 2-D scrolling). This is a usability
    finding sitting just above the conformance floor, not a violation.
  recommendation: >
    Shrink the sticky header on scroll, or make it non-sticky below a height threshold.
    A `@media (max-height: 500px)` rule that drops the lockup to a compact mark and
    collapses the privacy strip to a single line would return roughly a third of the
    screen with no change to the brand system at normal sizes. The strip's promise is
    important enough to keep in the flow of the page, but it does not have to be pinned.
  scope: current
  privacy_impact: >
    none — the privacy strip's sentence stays on the page, just not pinned. If the owner
    wants it always visible, keep the padlock and shorten the text instead.
  cost_and_maintenance: A media query and a compact logo variant.
  effort: S
  risk_of_change: Low; scoped to short viewports.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A2-008
  title: Medications and doctors are hidden behind "+ Add" buttons and start at zero items, so the emergency sheet's most safety-critical list is opt-in by click
  category: progressive disclosure / error prevention
  what_i_observed: >
    Repeaters render with no items until the family presses the add button
    (src/lib/derive.ts:109-138 initialises every repeater to an empty array;
    src/components/wizard/SectionForm.tsx:194-198 renders "Nothing here yet — add the
    first {noun} whenever you're ready."). On /letter/medical this hides 6 of the
    section's 14 controls: 3 for a provider and 3 for a medication. On
    /letter/family-and-support it hides 7 of 9 — the entire contacts list, including
    the "Emergency contact — include on the emergency sheet" checkbox that decides who
    appears in the emergency call band. A family that scans the medical page and sees
    two grey sentences where the medication list should be can reasonably conclude
    there is nothing there to fill in.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/inventory.json — specialNeeds "medical": controlCount 8,
      controlsWithOneItemPerRepeater 14, repeaterDetail[…].itemLabels
      ["Medication","Dose and timing","What it's for"]; "family-and-support":
      controlCount 2, controlsWithOneItemPerRepeater 9.
      Code: src/components/wizard/SectionForm.tsx:194-198 and 311-317;
      src/lib/derive.ts:117-137.
      Consequence: src/lib/derive.ts:191-195 builds the emergency sheet's medication list
      from data.medical.medications, which stays empty unless the button was pressed.
  confidence: MEASURED
  who_is_affected: Every family; the harm lands on whoever reads the emergency sheet.
  why_it_matters: >
    The emergency sheet is the artefact most likely to be used under pressure. Its
    medication list existing or not should not depend on a parent noticing a dashed
    outline at 11pm. The sheet already handles absence gracefully ("None recorded —
    confirm with family"), which is the right behaviour when the answer is genuinely
    "none" — but it cannot distinguish that from "never opened the control".
  standard_reference: Nielsen heuristic 6 (recognition rather than recall); error prevention (heuristic 5).
  recommendation: >
    Render one empty item by default in every repeater. It costs one extra visual row
    and removes a whole class of silent omission. itemHasContent() already filters
    blank items out of storage, the PDF and the emergency sheet, so an untouched empty
    row changes no output. If one row per repeater feels heavy on Family & support,
    render one there too — the contacts list is the single most-used part of the letter.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: A default in defaultValuesForSection; existing filters already handle empties.
  effort: S
  risk_of_change: Low — verify the empty row does not appear in the PDF (itemHasContent already guards it).
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 4
  environment: both

- id: A2-009
  title: The question "Who would you call first in an emergency?" makes the family retype a person they have already entered, with no way to pick from the list
  category: re-entry of information the site already has
  what_i_observed: >
    Family & support asks for a contacts repeater (name, relationship, phone, email,
    role, an "Emergency contact" checkbox, notes) and then, as a separate free-text
    field directly below it, "Who would you call first in an emergency?" with the
    placeholder "e.g., My sister Dana — she can be there in 15 minutes". The emergency
    sheet then builds its call band from firstCall PLUS the emergency-checked contacts,
    so the same person is typed twice and printed twice, in two different formats — once
    as free prose and once as "Name · Relationship · Phone".
  evidence:
    type: code + content
    detail: >
      src/lib/content/sections/03-family-support.ts:14-57 — the contacts repeater
      (itemFields include emergency checkbox) immediately followed by the firstCall
      text field.
      src/lib/derive.ts:292-304 keyPoints(): callOrder starts with firstCall, then
      appends every contact with emergency === true, then splices to MAX_CALL_ORDER 3.
      src/lib/derive.ts:196-205 emergencyInfo() carries both firstCall and contacts.
      audit/evidence/a2/inventory.json — specialNeeds "family-and-support".topLabels
      ["Who would you call first in an emergency?", "Is there anyone who should not be
      given a role?"].
  confidence: INSPECTED
  who_is_affected: Every family, and whoever reads the emergency sheet.
  why_it_matters: >
    Two mechanisms for one job means they can disagree. If a parent later changes Dana's
    phone number in the contacts list, the free-text first-call line still says whatever
    it said in 2026. On a document whose whole value is being trustworthy in an
    emergency, a stale phone number is the failure mode that matters.
  standard_reference: Nielsen heuristic 6 (recognition rather than recall); single source of truth.
  recommendation: >
    Turn "first call" into a designation on the contacts list rather than a second
    question: a radio/star on each contact row ("call this person first"), so the
    emergency sheet reads one list in one order. Keep a short free-text "why" if the
    "she can be there in 15 minutes" nuance is worth preserving — that part is genuinely
    valuable and is not duplicated anywhere. If the field must stay as-is for backwards
    compatibility with existing backup files, at minimum move it above the repeater and
    reword it so it is clearly a note, not a name.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One item field, one derive change, one migration consideration for old backups.
  effort: M
  risk_of_change: Medium — touches the backup schema and the emergency sheet; needs a read-old-files path.
  mission_impact: 3
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A2-010
  title: The field labelled "Today's date" is an empty date picker the app could have filled in — the fifth question of the first section, and the one most likely to be fought with on a phone
  category: re-entry / mobile friction
  what_i_observed: >
    getting-started's last field is a native <input type="date"> labelled "Today's date",
    which renders empty. The app already knows the date: todayIso() exists and
    letterDateIso() falls back to it (src/lib/derive.ts:91-101), so leaving the field
    blank produces a correct letter — but nothing on screen says so, and the field looks
    unfinished. On a phone this is a native wheel picker; in my keyboard traversal a
    single date input consumed four tab stops (Chromium's month/day/year/picker
    segments), one of which had no visible focus style.
  evidence:
    type: code + measurement
    detail: >
      src/lib/content/sections/01-getting-started.ts:46-51 (kind "date", label "Today's
      date", help "This prints on the letter as its 'last updated' date").
      src/lib/derive.ts:91-101 todayIso() / letterDateIso() — the fallback already exists.
      src/lib/derive.ts:109-137 defaultValuesForSection sets "" for every scalar, so the
      field starts blank.
      audit/evidence/a2/persona-runs.json — phases.P3.routes["/letter/getting-started"]
      .tabOrder shows input:date "Today's date" four times, one flagged [NO-FOCUS-STYLE].
      The four stops are Chromium's own date-segment behaviour, not a site defect — I say
      so explicitly.
      audit/evidence/a2/full-run.json — errorStates.badDate: the native picker refuses an
      impossible value outright, so the app's soft date hint is unreachable from the picker.
  confidence: MEASURED
  who_is_affected: Everyone; worst on a phone at 11pm and for P2 with an imprecise mouse.
  why_it_matters: >
    It is a small thing, but it is the last thing standing between a family and the end
    of the first section — the section whose entire job is to make starting feel easy.
    Asking a person to enter a fact the computer already has is the oldest form-design
    error there is.
  standard_reference: Nielsen heuristic 6; WCAG 2.2 SC 3.3.7 Redundant Entry (AA, new in 2.2) in spirit.
  recommendation: >
    Default the field to today's date on first render, and change the help to "We filled
    in today. Change it whenever you update the letter — readers need to know how fresh
    it is." Add a "Set to today" button beside it for the yearly-review visit, which is
    the one time the value is stale and the user wants exactly this.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One default value and one copy edit.
  effort: S
  risk_of_change: Low.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A2-011
  title: The two chooser cards are buttons whose accessible names are 94 and 101 words long
  category: accessibility (screen reader) / cognitive load
  what_i_observed: >
    Each PathChooser option is a single <button> wrapping the whole card: eyebrow,
    promise line, a 60-word blurb, a "what this one adds" line, the section count and
    the start label. Measured accessible-name content: 535 characters / 94 words for
    option 1 and 556 / 101 for option 2. A screen reader user landing on it hears one
    unbroken button label of roughly a hundred words with no way to stop, and no
    heading structure inside it to navigate by.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/persona-runs-P1.json — phases.P1.tasks.pathChooserCardNames:
      [{chars:535, words:94, name:"OPTION 1 FOR A LOVED ONE WITH DISABILITIES The letter
      a trustee will read. If your plan includes a special needs trust, ..."},
      {chars:556, words:101, ...}].
      Code: src/components/letter/PathChooser.tsx:70-118 — <button> wrapping <span>
      elements only (no headings are permitted inside a button's content model, which is
      why there are none).
  confidence: INSPECTED
  who_is_affected: P3 and anyone using a screen reader or voice control (a 94-word name is unspeakable as a voice command).
  why_it_matters: >
    This is the first decision the product asks anyone to make. A sighted person skims
    the card in four seconds; a screen reader user cannot skim.
  standard_reference: >
    WCAG 2.2 SC 2.5.3 Label in Name (A) is arguably satisfied but the intent is not;
    ARIA authoring practice — interactive elements should have short, distinguishing names.
  recommendation: >
    Make the card a plain container with a real <h3> promise line and body copy, and put
    a normal button at the bottom ("Start the special needs letter"). Keep the whole card
    clickable for mouse users with a click handler on the container plus a stretched-link
    pseudo-element on the button, which is the standard pattern that keeps the
    accessible name short without losing the big target.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One component refactor.
  effort: M
  risk_of_change: Low-medium; re-check hover/focus visuals.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A2-012
  title: A wizard section page has exactly one heading — even Medical, which is 3,596px of form
  category: navigation / accessibility / cognitive load
  what_i_observed: >
    Every /letter/[slug] page renders one <h1> and nothing else. The questions are
    <label> elements and the repeaters are <legend>s, so there is no heading structure
    inside a section at all. On /letter/medical that is one heading for 10 questions,
    2 repeaters and 3,596px of page. A screen reader user cannot use heading navigation
    to move around within a section; a sighted user gets no visual grouping either.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/comprehension.json — keyboard["desktop-1280"].headingsInMain:
      ["H1 Medical"]; and per-section headingsInMain in the sections array, all of which
      contain exactly one entry.
      audit/evidence/a2/persona-runs.json — phases.P3.routes["/letter/getting-started"]
      .headings: ["H1 Getting started"], h1Count 1.
      audit/evidence/a2/inventory.json — specialNeeds "medical".scrollHeight 3152
      (3596 with one item per repeater, from full-run.json perSection).
      Code: src/components/wizard/SectionScreen.tsx:60-93; SectionForm.tsx:84-99.
  confidence: INSPECTED
  who_is_affected: P3, and anyone with a cognitive or attention disability facing an undifferentiated wall of questions.
  why_it_matters: >
    The governing hierarchy names cognitive accessibility explicitly, not just ARIA
    conformance. Ten prose questions in a row with no visible grouping is where an
    exhausted person's place in the page is lost.
  standard_reference: >
    WCAG 2.2 SC 1.3.1 Info and Relationships (A) — structure conveyed visually should be
    programmatically determinable; SC 2.4.10 Section Headings (AAA).
  recommendation: >
    Add an optional `group` property to FieldDef and render an <h2> per group inside the
    form, for the three or four longest sections only (Medical, A typical day, Behaviour
    support, Benefits & money). Two or three groups per section — "Who treats them",
    "What they take", "What to do in an emergency" — would give both a screen reader
    landmark set and a visual breathing point. This is also the cheapest available
    anti-abandonment change, because a section that visibly breaks into three parts is
    a section you can do one part of.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One optional field on the content type; content edits for 4 sections.
  effort: M
  risk_of_change: Low.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A2-013
  title: Up to 600ms of typing is lost if the tab is closed or reloaded mid-keystroke — there is no unload flush
  category: save-resume
  what_i_observed: >
    I ran five interruption scenarios. Reload after the 600ms debounce: preserved.
    In-app navigation with no pause at all: preserved (SectionForm's unmount cleanup
    flushes — src/components/wizard/SectionForm.tsx:71-79). Brand-new browser context
    with the same storage: preserved. Simulated 30-minute idle: preserved, with no
    session or expiry copy anywhere. The one loss: reloading with zero delay after the
    last character loses that burst — value after reload was "". Reading localStorage
    the instant typing stopped returned null; 800ms later it held the text. There is no
    beforeunload, pagehide or visibilitychange listener anywhere in src/.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/persona-runs-P1.json — phases.P1.tasks.task4_leave_and_return:
      a_reload_immediately {preserved:false, valueAfter:""};
      b_reload_after_debounce {preserved:true};
      c_in_app_nav_immediately {preserved:true};
      d_hard_close_immediately {storedValueAtZeroDelay:null,
      storedValueAfter800ms:"Maria Alvarez", autosaveDebounceMs:600};
      e_new_browser_session {preserved:true};
      f_thirty_minute_idle_simulated {preserved:true, anyExpiryOrTimeoutCopy:false}.
      Code: src/components/wizard/SectionForm.tsx:31 AUTOSAVE_MS = 600 and 60-82.
      Grep of src/ for beforeunload|pagehide|visibilitychange: no matches.
  confidence: MEASURED
  who_is_affected: Anyone whose tab is killed by the OS mid-sentence — most likely on an older phone at 11pm.
  why_it_matters: >
    I want to be honest about scale: the exposure is at most 600ms of typing, roughly a
    few characters. This is a small finding and I am not going to inflate it. It is worth
    fixing only because it is nearly free and because this is the one product where "did
    I lose what I wrote" is an emotionally loaded question.
  standard_reference: n/a — engineering hygiene.
  recommendation: >
    Add a `pagehide` (not `beforeunload` — it is unreliable on mobile Safari) listener
    that calls the same flush the unmount cleanup already calls. Ten lines in SectionForm.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Trivial.
  effort: S
  risk_of_change: Low.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 2
  environment: both

- id: A2-014
  title: The wizard defines its hard jargon beautifully — then leaves "waiver", "IEP", "AAC", "day program" and "advance directive" undefined
  category: comprehension (P4)
  what_i_observed: >
    Reading level across all fifteen sections is genuinely good: Flesch–Kincaid 3.6 to
    6.5, mean 4.9, zero sections above grade 10, Flesch ease 64.7–89.2. That is better
    than most consumer health writing and it should not be touched. The site also
    defines its hardest terms inline and does it well — SSI, SSDI, ABLE account,
    representative payee, special needs trust, guardianship, conservatorship, power of
    attorney and supported decision-making all carry a plain-English gloss in the help
    text. The gap is a short list of terms used with no gloss at all: "waiver" /
    "DD waiver" (Benefits, Medical, Housing), "IEP" (School & work), "AAC"
    (Communication), "day program" (School & work), "advance directive" and "living
    will" (Final wishes), "sensory" (A typical day).
  evidence:
    type: measurement + content
    detail: >
      audit/evidence/a2/comprehension.json — summary {sectionGradeMin:3.6,
      sectionGradeMax:6.5, sectionGradeMean:4.9, sectionsAboveGrade10:0}; per-section
      jargon arrays. Highest-jargon section is benefits-and-finances with 10 terms.
      Defined well, verbatim: src/lib/content/sections/10-benefits-finances.ts:26
      "SSI is a monthly check for people with disabilities and limited income. SSDI is
      based on a parent's work record."; :41 "A savings account for people with
      disabilities that doesn't count against benefit limits."; :48 "A special needs
      trust holds money for {name} without breaking their benefits.";
      src/lib/content/sections/12-legal-advocacy.ts:19 "Is there a guardianship or
      conservatorship (a court gave someone authority)?".
      Undefined, verbatim: 10-benefits-finances.ts:26 "...and any waiver programs";
      :27 placeholder "on the DD waiver waitlist since 2021";
      14-final-wishes.ts:50 "If there's an advance directive or living will, say where
      it is."
  confidence: MEASURED
  who_is_affected: >
    P4 — a caregiver reading at ~6th grade or in a second language — and P1's spouse,
    a sibling, an aging grandparent, and anyone newly diagnosed who has not yet learned
    the vocabulary.
  why_it_matters: >
    "Waiver" is the single most consequential word in US disability services and it is
    used four times across three sections as though everyone knows it. A parent three
    weeks past a diagnosis does not. They will skip the question rather than admit they
    do not know, and the trustee will never learn there is a waiver.
  standard_reference: >
    Plain-language practice (CDC/NIH: define a term at first use); WCAG 2.2 SC 3.1.3
    Unusual Words (AAA) and 3.1.4 Abbreviations (AAA).
  recommendation: >
    Add one clause of gloss to each, in exactly the voice already used elsewhere:
    "a waiver — a state programme that pays for support at home instead of in an
    institution"; "an IEP — the school's written plan for how they are taught";
    "AAC — a device or picture system they use to speak"; "an advance directive — a
    signed document saying what medical care they would want". Nothing else about the
    reading level needs to change; it is already right.
  scope: current
  privacy_impact: none — copy only.
  cost_and_maintenance: Eight help-text edits.
  effort: S
  risk_of_change: None.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A2-015
  title: There is no way to find an answer — a family returning to change one medication scrolls for it
  category: navigation / returning users
  what_i_observed: >
    No search input and no element with role="search" exists anywhere in the app. The
    only way to locate an answer is to recall which of the fifteen sections it is in,
    open that section, and scroll. In the task-7 run, reaching one specific answer
    (allergies) after returning the next day took 2 taps and 1,037px of scrolling on a
    390x844 phone. The rail's per-section dots say "has notes" but not which questions
    are answered, so there is nothing to steer by.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/a2/persona-runs.json — phases.task7: anyFindOrSearch false,
      pxScrollToTheAnswerBeingRevised 1037, screensOfScrollToIt 1.23.
      Code: src/components/wizard/WizardRail.tsx:54-109 — the nav lists sections only;
      the "has notes" dot is section-level.
      The review page's reading view (src/components/review/ReviewScreen.tsx:483-561)
      does render every answer in one place, but it is read-only — clicking an answer
      does not take you to its field.
  confidence: MEASURED
  who_is_affected: >
    Every family at the yearly review the product explicitly asks for, and P5 the
    attorney checking one specific thing in a client's draft.
  why_it_matters: >
    The product's own model is "come back in a year and change what has changed". That
    visit is short by design, and it is the visit that keeps the document trustworthy.
    Making it a scavenger hunt is how the yearly review stops happening.
  standard_reference: Nielsen heuristic 7 (flexibility and efficiency of use).
  recommendation: >
    Client-side only, no index needed: a filter box above the section rail that matches
    against question labels and the family's own answers already in the store, and links
    straight to /letter/{slug}#f-{fieldId}. Every field already carries a stable id
    (`id="f-${field.id}"`, src/components/wizard/SectionForm.tsx:106) so the anchors exist —
    but the form only mounts after store hydration, so a fragment on a cold load will not
    scroll on its own; it needs a small effect that scrolls and focuses the target once
    `hasHydrated` flips. I did not test this, so treat the "it already works" part as
    unverified: the ids are there, the scroll behaviour is not. Second, make each answer in
    the review page's reading view a link to its own field — an "edit this" affordance that
    costs one anchor per entry.
  scope: current
  privacy_impact: >
    none — the filter runs entirely against the in-memory store; no query leaves the
    device, and it must not be put in the URL.
  cost_and_maintenance: One small component; the anchors already exist.
  effort: M
  risk_of_change: Low.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A2-016
  title: The "Download all three" button takes ~14 seconds on a CPU-throttled phone with no progress beyond a disabled label reading "Preparing your files…"
  category: mobile friction / system status
  what_i_observed: >
    On a 390x844 iPhone emulation with a 4x CPU slowdown and a heavily filled letter,
    the busy state on "Download all three together" lasted 13,701ms. On an unthrottled
    desktop the single letter PDF took 2,125ms and all three took 5,581ms. During the
    wait the only signal is the button label changing to "Preparing your files…", plus
    a screen-reader-only line; there is no bar, no per-file tick, and no indication of
    how long it will take. My probe for any additional progress text found none.
  evidence:
    type: measurement
    detail: >
      audit/evidence/a2/persona-runs.json — phases.P5.checks.mobileAllThreePdf:
      {cpuThrottle:"4x slowdown via CDP Emulation.setCPUThrottlingRate",
      msUntilBusyCleared:13701, anyProgressIndicatorText:null};
      checks.letterPdf {ms:2125}.
      audit/evidence/a2/full-run.json — fullCompletion.downloadAllThreeMs 5581 on
      desktop, filesDownloaded lists all three.
      Code: src/components/review/ReviewScreen.tsx:70-89, 173-187.
      The 4x CPU throttle is an approximation of a mid-range phone, not a measurement
      of one; the number is directional.
  confidence: MEASURED
  who_is_affected: P1 and anyone finishing on a phone — the moment the whole product exists for.
  why_it_matters: >
    Fourteen seconds of a frozen-looking button, at the end of a two-and-a-half-hour
    document, is exactly where a person taps again, or backs out, or assumes it failed.
    Everything before this point is wasted if the files do not arrive.
  standard_reference: >
    Nielsen heuristic 1; the classic 10-second threshold above which a determinate
    progress indicator is required rather than optional.
  recommendation: >
    Report the three files individually as they complete — "Letter ✓ · Emergency sheet ✓ ·
    Backup…" — driven by the existing sequential awaits in run("all"). That converts an
    unbounded wait into three bounded ones at essentially zero cost. Add one line under
    the button on first press: "This can take up to half a minute on a phone. Keep this
    screen open."
  scope: current
  privacy_impact: none — generation is already local.
  cost_and_maintenance: One piece of state in ReviewScreen.
  effort: S
  risk_of_change: Low.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A2-017
  title: On Slow 3G nothing is painted for 7.8 seconds on production — task 1 ("decide in 10 seconds whether this is for me") fails before it starts
  category: mobile friction / first impression
  what_i_observed: >
    Production, iPhone 390x844, Chrome DevTools presets via CDP. Slow 3G: first
    contentful paint 7,824ms, LCP 7,824ms, load event at 28,286ms, 495,943 bytes
    transferred. Fast 3G: FCP 2,172ms, load 7,110ms. Unthrottled: FCP 236ms. So on a
    genuinely poor connection the parent stares at white for nearly eight seconds before
    the first word appears, and the 10-second judgement window is nearly gone before the
    page exists. When it does render, the page is honest and well-ordered: the privacy
    promise is the very first thing at y=91 and is inside the first viewport, and the
    primary CTA is at y=782 and also inside it, with 118 words of first-viewport text.
  evidence:
    type: measurement
    detail: >
      audit/evidence/a2/persona-runs.json — phases.production.runs:
      slow3g {wallMsToLoadEvent:28286, fcp:7824, lcp:7824, transferBytes:495943},
      fast3g {fcp:2172, lcp:2172}, unthrottled {fcp:236, transferBytes:495941}.
      Dev comparison (not production): phases.P1.tasks.task1_home_* — transferBytes
      1,184,298 unminified, so the dev numbers overstate by ~2.4x and are not used here.
      First-viewport content: phases.P1.tasks.task1_home_unthrottled.fold —
      privacyPromise {text:"Private by design. Everything you type stays on your device
      and is never sent anywhere. How it works", y:91, inFirstViewport:true},
      firstCtaY 782, anyCtaInFirstViewport true, wordsInFirstViewport 118,
      documentHeight 8093.
  confidence: MEASURED
  who_is_affected: >
    P1 specifically, and anyone on rural broadband, a hospital or clinic wifi, or a
    throttled prepaid plan — a materially over-represented group among families of
    disabled children.
  why_it_matters: >
    Everything else in this audit is downstream of the page appearing. I have not
    diagnosed WHY 496KB is needed on the homepage — that is a performance analyst's job,
    not mine — but the usability consequence is measured and real.
  standard_reference: Core Web Vitals LCP "good" threshold is 2.5s at the 75th percentile.
  recommendation: >
    Out of my lane to prescribe the fix, but two things are squarely usability: (a) make
    sure the hero heading, the privacy strip and the primary CTA are in the initial HTML
    and styled by inline critical CSS so they paint before anything else arrives — on a
    static export that is achievable; (b) whatever the homepage's heaviest asset is
    (the lockup PNG is `priority` and 779x248 at 2x), serve it at the size actually
    rendered. Flag to whoever owns performance rather than treating it as settled here.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Unknown until the payload is broken down — deliberately not estimated.
  effort: L
  risk_of_change: Medium — build-level changes want a full visual regression pass.
  mission_impact: 4
  reach: 3
  harm_if_unfixed: 3
  environment: production

- id: A2-018
  title: The explainer video has no captions and no transcript, so the one asset that answers "what is this thing?" is unavailable to deaf, hard-of-hearing and second-language visitors
  category: comprehension (P4) / accessibility
  what_i_observed: >
    The homepage's "What is a Letter of Intent" section is one of only two affordances
    offered to a visitor who is not ready to start (the other being "See a sample").
    The <video> element carries no <track>, and there is no transcript on the page.
    The code states the intended justification explicitly — an in-source comment reads
    that the same explanation is written out in full in the column beside the player.
    I checked that column. It is roughly 130 words that define what a Letter of Intent
    is and say it is not legally binding. The player's own caption says the video runs
    "under 5 minutes" and "walks through what to write, why it matters, and how to
    finish it in ten-minute sittings". So the adjacent prose is a good summary of the
    first third and covers neither "what to write" nor "how the builder works" — it is
    not an equivalent alternative, and it is not labelled as one.
  evidence:
    type: code + content
    detail: >
      src/components/home/VideoPlayer.tsx:200-215 — <video src poster controls playsInline
      preload tabIndex onClick onKeyDown onTimeUpdate> with no child <track>; the
      preceding comment (lines 201-202) states "No caption track: the same explanation is
      written out in full in the column beside this player."
      The adjacent column: src/app/page.tsx:267-289 (two paragraphs, ~130 words).
      The video's own description: VideoPlayer.tsx:246-254 "Watch · under 5 minutes …
      walks through what to write, why it matters, and how to finish it in ten-minute
      sittings."
      CONFIRMED ON PRODUCTION: fetching https://myletterofintent.com/ during this run,
      the served HTML contains the play-button aria-label "Play the video: what a Letter
      of Intent is, and how the builder works" and references /video-poster-lockup.png,
      and contains no "<track" anywhere. So the deployment gap the brief warned about has
      closed (see "Build state" note above) and the missing captions are a production
      fact, not a local-only one.
      Related, from the brief: the fullscreen button is reported broken by the owner —
      I did not reproduce it and make no claim about it.
  confidence: INSPECTED  # code inspection plus a served-HTML check; playback itself was not tested
  who_is_affected: >
    Deaf and hard-of-hearing visitors; anyone reading in a second language who needs to
    read rather than listen; anyone on a phone in a quiet hospital waiting room, which
    is a very common context for this audience.
  why_it_matters: >
    A video without captions is not "less good" for these users, it is absent. And the
    video is doing persuasion work — it is where "is this for me and is it safe" gets
    answered for people who will not read 700 words.
  standard_reference: >
    WCAG 2.2 SC 1.2.2 Captions (Prerecorded) — Level A. A nearby text summary does not
    satisfy 1.2.2 at all; captions are required for synchronized media regardless of what
    else is on the page. A full text alternative can satisfy SC 1.2.3, but only if it
    conveys everything the video does and is labelled as an alternative — this one does
    neither.
  recommendation: >
    Ship a WebVTT caption track (if no script exists, one transcription pass plus a human
    correction is about an hour for five minutes of speech) and put the full transcript on
    the page in a <details> beneath the player, labelled "Read this instead". Then either
    amend or delete the in-source comment, because right now it records a belief that the
    requirement is already met. The transcript is also the cheapest SEO this page will ever
    get, and it is the version a screen reader user can skim.
  scope: current
  privacy_impact: >
    none, provided the .vtt is served from the same origin as a static asset. Do NOT use
    a third-party captioning/embedding service that would load a player from another
    host — that would put viewing behaviour in front of a third party for no benefit.
  cost_and_maintenance: One .vtt file per video, regenerated whenever the video changes.
  effort: S
  risk_of_change: None.
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 4
  environment: both
```

---

## Abandonment analysis — where a real person quits, and what carries them through

I was asked to be specific. These are the moments, in order of how many people I
think they cost, each tied to a measured fact.

**1. The chooser, before a single word is written.** `/letter` is 5,905px on a phone
and asks a taxonomy question ("special needs or general?") that a newly-diagnosed
parent may not yet be able to answer with confidence. It is also the highest-grade
prose on the site (FK 8.0 versus a wizard mean of 4.9). The person who tapped
"Start your letter" wanted to start. **Carry them through:** a compact two-button
choice in the first viewport, with the full reading material kept below for the
people who want it (A2-004). Consider also letting them start without choosing —
the four shared sections (getting started, family & support, final wishes, personal
message) belong to both paths, so "just start, we'll ask later" is architecturally
possible today.

**2. The first section that is longer than the badge implies.** The badges are
5–15 minutes; the sum is 165. My end-to-end run typed 12,860 characters. The moment
of loss is somewhere around section 4–6, when the parent realises the pace is not
what they were sold. **Carry them through:** fix the arithmetic (A2-003) and change
the frame from "finish the letter" to "finish a sitting". The product already has the
right sentence — "Start with ten minutes" — it is just not the sentence that governs.

**3. Medical, section 6, 15 declared minutes, 3,596px, FK 6.5, two empty repeaters.**
This is the hardest section in the letter and it arrives before any of the easy,
warm ones (Joy & faith, Your message). **Carry them through:** in-section grouping
headings (A2-012), one open repeater row (A2-008), and — worth the owner's
consideration — an explicit "you can do this one last" note on the section itself,
since the letter's own reading order in the PDF does not have to match the order the
questions are answered in.

**4. The end of a sitting, when nothing tells them they achieved something.**
Today, closing the tab after two sections produces silence. **Carry them through:**
after a section is completed, one line under the Next button — "That's Medical done.
Your emergency sheet already has something worth printing." — and a download link to
the emergency sheet specifically. Meaningful partial output already exists in this
product; it is just not surfaced until the very end.

**5. The 100% bar at 18% answered.** Some people will stop here believing they are
finished (A2-002). This one is invisible in analytics because it looks like success.

**6. The fourteen-second download on a phone (A2-016)**, and — for a small but
catastrophically affected group — **the blank error page for anyone whose browser
blocks site data (A2-001)**, where abandonment is total and involuntary.

### What already works, and should not be "improved"

I want to be explicit about this, because a list of findings reads as a list of
faults and this product does several hard things right.

- **Reading level.** FK 3.6–6.5 across fifteen sections, ease up to 89. Nothing in
  the wizard needs simplifying. (`comprehension.json`)
- **Save and resume.** Survives reload, in-app navigation with no pause, a full
  browser restart and a simulated 30-minute idle. No session, no expiry, no login.
  (`persona-runs-P1.json` task4)
- **The save indicator is genuinely visible** while typing at 390px, at 200% zoom and
  at 1280px, because the header is sticky — and its screen-reader announcement is
  throttled to 8s so it does not spam. (`save-indicator/measurements.json`;
  `src/components/chrome/SaveIndicator.tsx:15-24`)
- **Validation is soft and non-blocking, and never eats work.** A malformed email
  produces a gentle hint, does not block Next, and the exact typed value is still
  there when you come back. (`recheck.json` — hintShown true, blockedNavigation false,
  valueKeptAfterLeavingAndReturning "dana@")
- **Destructive actions are confirmed honestly.** "Remove this provider? What you
  typed here will be removed. (The rest of the letter is untouched.)" — and cancel
  keeps it. The delete-everything dialog offers "Download a backup first" as a
  first-class button. (`full-run.json` errorStates; `DataControls.tsx:281-291`)
- **The backup → delete → restore round trip works**, end to end, and the delete
  confirmation verifies the storage is actually empty afterwards.
  (`full-run.json` backupRoundTrip — restored true)
- **The final-wishes emotional gate** is the best single piece of interaction design
  on the site. "I'm ready" / "Skip for now" with an explicit "all of those are right".
- **The review page is honest about what is missing** — it lists every unanswered
  section as a link. (The PDF is not; see A2-002.)
- **The emergency sheet handles absence correctly** — "None recorded — confirm with
  family" is exactly the right sentence.
- **404 on an unknown section slug** returns a real 404 with a way back.
- **No horizontal overflow at any tested viewport, including 200% zoom.**

### Where a technically correct recommendation would not actually help

- Adding a **required-field system** or a completion checklist would be conventional
  form design and would be wrong here. "Every question is optional" is load-bearing
  for a parent who cannot answer the medical questions tonight. My A2-002
  recommendation deliberately changes what the *counter* says, not what the form
  *demands*.
- **Splitting long sections into multi-step sub-wizards** would test well and would
  hurt: it adds navigation state to a product whose main risk is people not coming
  back. In-section headings (A2-012) get most of the chunking benefit at none of the
  cost.
- **An auto-save-to-cloud "so you never lose it"** is the obvious answer to A2-001
  and I am not making it. It would break the promise, and A2-001 has a complete
  client-side fix.
- **Reducing the reading level further** is not needed and would cost the writing its
  warmth. The measured problem is five undefined terms, not the prose.

---

## What I examined, and what I could not

**Examined.** All 15 special-needs sections and all 14 general sections as rendered by
the running app; `/`, `/letter`, `/letter/review`, `/your-data`, `/privacy`; the wizard
layout, section screen, section form, field shell, rail, save indicator, site header,
resume card, path chooser, start buttons, photo fields, data controls, store,
validation and derive modules; the three shared evidence PDFs' text; the 320/768/
1024/1440 screenshots already captured; and production for load timings and the
storage-failure case.

**Could not examine, and why.**

- **Real screen reader output.** No NVDA/VoiceOver. Everything in P3 is a keyboard and
  accessibility-tree proxy and is labelled INSPECTED. I do not know what is actually
  announced when a soft hint appears, when the save indicator fires, or when the
  emotional gate replaces the form.
- **Real browser zoom.** Approximated (see method note 2). The 45%-of-viewport figure
  is the right order of magnitude, not a certified measurement.
- **Real device performance.** CPU throttling at 4x is a stand-in for a mid-range
  phone, not a measurement of one. The 13.7s figure is directional.
- **Real users.** Every persona is me driving a script. Hesitation, ambiguity and dead
  ends are inferred from structure and measurement, not observed in a human. The
  abandonment ordering above is my judgement, not data.
- **How often browsers actually block localStorage.** The crash (A2-001) is measured
  on production and is certain. Its *prevalence* is NOT_VERIFIED: modern Safari private
  browsing no longer throws on setItem, so the realistic triggers are "block all site
  data" settings, managed devices, some in-app browsers, and quota exhaustion. Someone
  with GA4 access could size it by comparing `/letter` page views to `/letter/[slug]`
  page views.
- **The video itself.** I did not play it, measure it, or attempt the fullscreen bug.
  A2-018 is a code inspection of an uncommitted file.
- **Anything about the other eight analysts' areas** — PDF typography, colour contrast,
  privacy/network behaviour, SEO. Where I touched them (PDF completeness, the 496KB
  homepage) I flagged them as handoffs rather than diagnosing.
- **The general path end-to-end.** I inventoried all fourteen sections and measured its
  totals, but the full completion run, the persona runs and the PDF timings were all on
  the special-needs path. Nothing I found looks path-specific, but I have not proven it.

## Three highest-confidence findings

1. **A2-001** — storage-blocked browsers get "This page couldn't load" on every wizard
   section. Measured on production, with a control run on the same URLs, screenshots,
   and the exact throwing line identified in dev. Nothing here is inferred.
2. **A2-002 / A2-003** (one mechanism, two symptoms) — 15 of 83 answers renders a 100%
   bar and "Every section has notes"; the badges sum to 165 minutes against a promise of
   45–90. Both are arithmetic against numbers the app itself prints.
3. **A2-007** — 45% of the viewport is fixed chrome at 200% zoom, with a screenshot
   showing zero questions on the first screen. The zoom method is an approximation; the
   ratio is not.

## Three least-confident findings

1. **A2-018 (video captions)** — inspection of an uncommitted file, no playback test,
   and production serves a different build. INSPECTED at best.
2. **A2-017 (3G first paint)** — the numbers are real, but I did not diagnose the
   payload and my recommendation is deliberately thin. Performance is not my lane and I
   may be wrong about what is fixable.
3. **The abandonment ordering** — six moments, each anchored to a measured fact, but the
   ranking between them is judgement. In particular I may be over-weighting the chooser
   and under-weighting the length of Medical.

## What would make me more certain

- **A real screen reader session** on `/letter/medical` and `/letter/final-wishes`
  (30 minutes with NVDA would settle A2-006, A2-011, A2-012 and tell me whether the
  soft hints and the save announcement actually fire).
- **Real browser zoom at 200% and 400%** on a real 1024x768 window, to replace my
  approximation.
- **GA4 funnel data** — `/` → `/letter` → `/letter/getting-started` → each subsequent
  slug → `/letter/review`. That single funnel would convert my abandonment ordering from
  judgement into measurement, and would size A2-001's prevalence. This needs no new
  tracking and no user-typed content: route-level page views already exist.
- **Five sessions with real parents**, thinking aloud, on their own phones. Nothing in
  this document is a substitute for that, and I would trade half of these findings for it.
- **A production build served locally** (`npm run build && next start`) so I could
  measure the crash path and the PDF timings on production bundles rather than dev,
  without touching the live site.
