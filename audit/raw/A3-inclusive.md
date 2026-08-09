# A3 — Inclusive & Cognitive Accessibility

Analyst A3. Universal design, COGA (Making Content Usable), UDL, situational and
assistive-tech-in-the-wild. Not the ARIA conformance audit.

Environment: local dev `http://localhost:3000` (authoritative for code), plus
`audit/evidence/` (screenshots, PDFs, production network capture). Local HEAD
`d5ec230`; `src/app/page.tsx` and `src/components/home/VideoPlayer.tsx`
uncommitted. Where a finding differs between the two, I say so.

All measurements below were produced by Playwright 1.62.1 / Chromium against the
running dev server, and by pdfjs-dist text extraction over the PDFs already in
`audit/evidence/pdfs/`. Scripts live in the session scratchpad, not the repo.

---

## FINDINGS

```yaml
- id: A3-001
  title: The focus indicator is effectively invisible on every ivory and white surface (1.52:1)
  category: motor / switch access / low vision / keyboard
  what_i_observed: >
    The site has one global focus style — `:focus-visible { outline: 3px solid
    var(--focus-ring); outline-offset: 2px }` — and `--focus-ring` resolves to
    #e2caaa, a pale champagne. Measured against the two grounds the whole wizard
    sits on: 1.52:1 vs --paper (#fbfaf6), 1.38:1 vs --paper-2 (#f4efe6), 1.58:1
    vs white input surfaces. It only clears 3:1 on navy panels (8.84:1 / 10.02:1).
    Separately, focusing a text input *lowers* its border contrast: the resting
    border is --control-border #6e7889 at 4.46:1 against white, and on focus the
    border switches to gold-400 #d9b97f at 1.88:1. So the focused state of a form
    field is less visible than its unfocused state, and the ring meant to
    compensate is at 1.58:1.
  evidence:
    type: measurement + screenshot
    detail: >
      Canvas readback of `var(--focus-ring)` → rgb(226,202,170) = #e2caaa.
      WCAG relative-luminance contrast: vs #fbfaf6 = 1.52, vs #f4efe6 = 1.38,
      vs #ffffff = 1.58, vs #1d2c46 = 8.84, vs #16223a = 10.02.
      Code: src/app/globals.css:98 `--focus-ring: color-mix(in oklab,
      var(--gold-500) 55%, white)`; src/app/globals.css:265-269 the
      `:focus-visible` rule; src/components/wizard/field-ui.tsx:7-10
      `focus:border-gold400 ... focus:shadow-[0_0_0_3px_var(--focus-ring)]`.
      Visual proof: scratchpad/focus-on-input.png — a focused textarea on
      /letter/medical, the ring is barely separable from the page.
  confidence: MEASURED
  who_is_affected: >
    Everyone who does not use a mouse. Switch-access and scanning users, whose
    only feedback is where the highlight is. Head-pointer, eye-gaze and
    sip-and-puff users. Keyboard-only users with tremor or limited reach —
    common among the parents *and* among the disabled adults who use this tool
    for themselves. Screen-magnifier users, who navigate by finding the focus
    ring in a 4x window. Anyone with low vision. Anyone on a laptop screen in
    sunlight.
  why_it_matters: >
    This is a 15-section form. Losing your place in it is not a nuisance, it is
    the end of the session. A switch user scanning a 15-item rail plus ~10 fields
    per section has literally nothing to look at. The site's stated audience
    explicitly includes "some have disabilities themselves"; this is the control
    surface they depend on and it is the one thing on the site that fails hardest.
  standard_reference: >
    WCAG 2.2 SC 1.4.11 Non-text Contrast (AA) — focus indicators are user
    interface component state indicators and require 3:1 against adjacent colours.
    Also fails SC 2.4.13 Focus Appearance (AAA) on contrast. COGA "Make it easy
    to find what you need" / orientation.
  recommendation: >
    Make the ring a dark navy on light grounds and keep the champagne only on
    navy panels. E.g. `--focus-ring: var(--navy-700)` (#253551 → 10.4:1 on ivory)
    with a 2px white inner halo so it stays visible on navy too:
    `outline: 3px solid var(--navy-700); outline-offset: 2px; box-shadow: 0 0 0
    5px rgba(255,255,255,.9)`. Or keep gold but darken to --gold-700 #8a6a38
    (4.9:1 on ivory). Also stop swapping the input border to gold-400 on focus —
    darken it instead. This does not change the brand system; navy and gold are
    both already in it.
  scope: current
  privacy_impact: none — no user data leaves the device
  cost_and_maintenance: two token changes in globals.css plus one class in field-ui.tsx; no ongoing cost
  effort: S
  risk_of_change: low — visual only, but re-check the ring on navy panels and on the gold buttons
  mission_impact: 4
  reach: 3
  harm_if_unfixed: 5
  environment: both

- id: A3-002
  title: The explainer video has no captions, no transcript, and no audio description — and it is 4m38s, not 2 minutes
  category: hearing / language / situational / literacy
  what_i_observed: >
    The `<video>` on the home page has zero text tracks and zero `<track>`
    elements. There is no transcript link, no "read this instead" disclosure, and
    no caption affordance anywhere on the page (I searched every a/button/summary
    /details for transcript|caption|subtitle → empty). The code comment at
    src/components/home/VideoPlayer.tsx:201-202 asserts "No caption track: the
    same explanation is written out in full in the column beside this player."
    That is not accurate. The adjacent column is a 2-paragraph definition of what
    a Letter of Intent is; the video, by its own figcaption, "walks through what
    to write, why it matters, and how to finish it in ten-minute sittings."
    Those are different content. The measured duration is 277.999999 s = 4m38s.
    Production is the same: the capture shows the .mp4 served from
    myletterofintent.com and no .vtt / captions / subtitles anywhere in 431
    requests.
  evidence:
    type: measurement + network + code
    detail: >
      Playwright: `{present:true, tracks:0, trackEls:[], duration:277.999999,
      transcriptAffordances:[]}` after clicking the play control on /.
      Network: `grep -o "\.vtt\|captions\|subtitles\|track kind"
      audit/evidence/network/capture-production.json` → zero matches; only
      `https://myletterofintent.com/what-is-a-letter-of-intent.mp4`.
      Code: src/components/home/VideoPlayer.tsx:200-216 (the `<video>` has
      src/poster/controls and no children).
  confidence: MEASURED
  who_is_affected: >
    Deaf and hard-of-hearing parents and guardians — a population
    over-represented among the families this tool serves, and among aging
    grandparents becoming guardians. Non-native English speakers, who read
    English far better than they hear it. Auditory processing disorder. Anyone on
    a borrowed or shared device without headphones. Anyone at 11pm beside a
    sleeping child. Anyone in a clinic waiting room. Anyone who simply reads
    faster than a narrator talks — which is most people with limited time.
  why_it_matters: >
    The video is one of only two secondary calls to action in the hero ("Watch &
    learn more"). It is positioned as the answer to "what is this thing?" — the
    question standing between a hesitant visitor and starting. Locking that
    answer inside 4m38s of un-captioned audio excludes a whole class of user from
    the onboarding, not from a nicety. The site is otherwise unusually good at
    plain language; this is the one place where the plain language is unavailable.
  standard_reference: >
    WCAG 2.2 SC 1.2.2 Captions (Prerecorded) — Level A. SC 1.2.3 Audio
    Description or Media Alternative (Prerecorded) — Level A. SC 1.2.5 Audio
    Description — AA. COGA: provide content in more than one modality (UDL
    Principle I, multiple means of representation).
  recommendation: >
    Two things, in this order. (1) Publish a plain-text transcript on the page as
    a `<Disclosure label="Read the transcript instead">` directly under the
    figcaption — this is a static file, costs nothing to host, is indexable, is
    translatable by browser translation extensions, and serves the reader who
    just wants to skim. (2) Ship a WebVTT caption track: `/what-is-a-letter-of-
    intent.vtt` with `<track kind="captions" srclang="en" label="English" default>`.
    Both are within static export. Do the transcript first — it helps more people
    for less work, including everyone who never presses play. Correct the
    VideoPlayer.tsx comment at the same time; it currently records a claim the
    page does not honour.
  scope: current
  privacy_impact: none — static assets, no user data involved
  cost_and_maintenance: >
    One transcription pass (~30 min of human time for a 4m38s script, or a
    machine pass plus proofreading). The .vtt must be re-cut if the video is ever
    re-edited — that is the only ongoing burden.
  effort: M
  risk_of_change: low
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 5
  environment: both

- id: A3-003
  title: The video is labelled "about 2 minutes" and runs 4 minutes 38 seconds
  category: attention / executive function / trust
  what_i_observed: >
    The figcaption reads "Watch · about 2 minutes". Measured `video.duration` is
    277.999999 seconds. That is 2.3x the advertised length. The string is in the
    committed (production) file as well as locally.
  evidence:
    type: measurement + content
    detail: >
      Playwright `video.duration` → 277.999999.
      `git show HEAD:src/components/home/VideoPlayer.tsx` line 199:
      "Watch · about 2 minutes". Local file: src/components/home/VideoPlayer.tsx:246.
  confidence: MEASURED
  who_is_affected: >
    Anyone budgeting a small, hard-won window of attention: a parent in a
    ten-minute gap, someone with ADHD or executive dysfunction, someone whose
    child will interrupt them, someone on metered mobile data.
  why_it_matters: >
    The whole product promise is "finish it in ten-minute sittings." Time
    estimates are the mechanism by which a user with limited executive function
    decides to start at all. A 2-minute promise that turns into nearly 5 minutes
    is the first time the site is wrong about time, and it happens before the
    user has invested anything — which is exactly when trust is cheapest to lose.
  standard_reference: >
    COGA "Make it easy to... know how long a task will take" (Making Content
    Usable, Objective: Help users understand what things do and how to use them).
    Not a WCAG SC.
  recommendation: >
    Change to "Watch · about 5 minutes". One string. If 5 minutes feels like too
    big an ask, that is a signal to cut the video, not to mislabel it.
  scope: current
  privacy_impact: none
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A3-004
  title: The site's two time estimates contradict each other by roughly 2x (165 minutes of section badges vs a "45–90 minutes" headline)
  category: executive function / planning / trust
  what_i_observed: >
    Every section carries an honest-looking per-section estimate rendered as
    "Section 06 of 15 · about 15 minutes", and the same numbers appear on the
    chooser rows ("Medical — 15 min"). Summing the `minutes` field across the
    15 special-needs sections gives 165 minutes. The headline claim, in three
    separate places, is "45–90 minutes". The general path sums to 145 minutes
    against a claimed "40–80 minutes".
  evidence:
    type: code + measurement
    detail: >
      Sum of `minutes:` across src/lib/content/sections/*.ts (special-needs path,
      in path order): 5+10+10+15+10+15+15+10+10+10+10+10+10+10+15 = 165.
      General path via src/lib/content/sections/general/index.ts:
      5+10+10+15+10+10+10+10+10+10+10+10+10+15 = 145.
      Claims: src/lib/content/paths.ts:57 `minutesLabel: "45–90 minutes"`;
      src/lib/content/paths.ts:87 `"40–80 minutes"`;
      src/app/page.tsx:167-169 "About 45–90 minutes, in as many sittings as you
      need." (also in the committed version at line 167);
      src/lib/content/sections/01-getting-started.ts:15 "Most families finish in
      45 to 90 minutes"; general/index.ts:33 "40 to 80 minutes".
      Rendered proof: /letter/getting-started header reads "SECTION 01 OF 15 ·
      ABOUT 5 MINUTES"; /letter/medical reads "SECTION 06 OF 15 · ABOUT 15
      MINUTES".
  confidence: MEASURED
  who_is_affected: >
    Everyone, but disproportionately anyone with executive-function difficulty,
    ADHD, depression, fatigue, or a caregiving schedule they do not control — in
    other words the described audience. Also anyone deciding *whether to start*.
  why_it_matters: >
    These numbers do opposite jobs and cannot both be true. The headline is a
    recruitment number ("this is doable tonight"); the per-section badges are a
    planning tool ("can I do Medical before pickup?"). If the headline is right,
    the badges are inflated by ~2x and are actively frightening people away from
    single sections. If the badges are right, a parent who blocked out 90 minutes
    discovers at section 8 that they are less than halfway — the single most
    common moment of abandonment for this kind of document. Either way, one of
    the two numbers is teaching the user that the site's time estimates cannot
    be trusted, and time estimates are the main scaffold this tool offers for
    executive function.
  standard_reference: >
    COGA, Making Content Usable — "Help users understand what things do and how
    to use them"; and the pattern "Provide a way to know how long a task takes."
    Not a WCAG SC.
  recommendation: >
    Decide which number is real by timing three or four people, then make the
    other derive from it rather than being written by hand. Concretely: keep the
    per-section minutes as the source of truth, compute the path total from them
    (`sections.reduce((a,s)=>a+s.minutes,0)`), and present it honestly as a range
    with the reassurance already used elsewhere — e.g. "About 2½ hours in total,
    but almost nobody does it in one go, and every question is optional." A
    computed total also means a future section can never silently break the
    claim. If the real answer is that most families skip most fields and finish
    in 60 minutes, say *that*: "Most families spend about an hour; the sections
    add up to more because they are written for people who want to fill in
    everything." That sentence would help the 11pm parent more than either number
    alone.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one derived value plus a copy pass; the derivation removes future drift
  effort: S
  risk_of_change: low — but the honest number may be a bigger ask, so pair it with the "start anywhere" framing already on the site
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A3-005
  title: The emergency sheet will download near-empty, with no warning, and its inputs are scattered across five sections and mostly unlabelled
  category: content-as-accessibility / executive function / safety
  what_i_observed: >
    The one-page emergency sheet is assembled from ~15 fields spread across five
    different sections (Getting started, About, Family & support, Communication,
    Medical, Behavior support). Only five of those fields tell the user they feed
    it. There is no view of "these are the answers that make the emergency sheet
    work," and there is no guardrail: the Review page always offers the download.
    A helper `emergencyHasContent()` exists in the codebase and is never called
    anywhere. The equivalent guard *is* applied to the letter's key-points page
    (`keyPointsHaveContent`), so the pattern was understood and simply not
    extended. I extracted the text of the "minimal" emergency PDF already in the
    evidence folder — generated from the Getting started section only — and the
    entire body is: the name, "ATTACH RECENT PHOTO", and "ALLERGIES — None
    recorded — confirm with family."
  evidence:
    type: measurement + code
    detail: >
      pdfjs text extraction of
      audit/evidence/pdfs/minimal--Emergency-Information-Sheet-2026-08-09.pdf →
      "EMERGENCY INFORMATION — … Updated August 9, 2026 Verify if older than one
      year ATTACH RECENT PHOTO … GOES BY … A L L E R G I E S None recorded —
      confirm with family. … Not a medical or legal document." (one page, nothing
      else).
      Source fields: src/lib/derive.ts:184-236 `emergencyInfo()` pulls from
      familySupport.contacts/firstCall, medical.allergies/medications/
      emergencyProtocol/preferredHospital/insurance, about.diagnoses/dateOfBirth,
      communication.how/yesNo/pain, behavior.triggers/deEscalation/makesWorse.
      Unused guard: src/lib/derive.ts:347 `emergencyHasContent` —
      `grep -rn "emergencyHasContent" src/` returns only its own definition.
      Used-guard precedent: src/lib/pdf/loi-document.tsx:235 `const showKeyPoints
      = keyPointsHaveContent(points)`.
      Fields that *do* announce it: 02-about.ts:26, 03-family-support.ts:19 & :42,
      06-medical.ts:37, general/06-health-medical.ts:13, PhotoFields.tsx:28.
      Always-offered download: src/components/review/ReviewScreen.tsx:157-162
      (disabled only on `!hydrated || busy !== null`).
  confidence: MEASURED
  who_is_affected: >
    First, the person the sheet is for: the sitter, the school nurse, the ER
    team, the respite worker. Second, the parent — particularly one with memory,
    attention or planning difficulty, or simply exhaustion, who follows the
    site's own (correct and humane) advice to stop after three sections.
  why_it_matters: >
    The site deliberately and rightly encourages stopping early — "A letter with
    three sections filled in is already worth more to a future caregiver than the
    perfect letter that never got written." But the emergency sheet is the one
    output where partial completion is not partially useful, because its whole
    function is to be grabbed in a crisis by someone who will trust it. A sheet
    headed EMERGENCY INFORMATION with a name, a blank photo box and "Allergies:
    none recorded" is worse than no sheet at all: it looks like a checked box. It
    goes on a fridge. Someone reads it at 2am. The parent has no way to know it
    is thin, because the fields that fill it are invisible to them and nothing on
    the Review page says so. This is the clearest case on the site where a
    perfectly usable form yields an unusable document.
  standard_reference: >
    COGA, Making Content Usable — "Help users avoid mistakes and know how to
    correct them"; "Make each step clear." UDL: provide feedback on progress
    toward a goal, not merely on activity.
  recommendation: >
    Three changes, in priority order.
    (1) Wire the guard that already exists: on the Review page, if
    `emergencyHasContent(emergencyInfo(data, path))` is false, replace the
    "Download" button on that row with a short line — "The emergency sheet is
    still blank. It fills in from Medical, Communication, Behavior support, and
    the emergency contacts in Family & support." — plus links straight to those
    four sections. Do not block the download; offer it under the explanation, so
    nobody is trapped.
    (2) Add a small persistent marker on the ~10 unlabelled fields that feed it,
    matching the wording already used on medications ("These print on the
    emergency sheet"). A one-word badge would do; the copy pattern exists.
    (3) On the sheet itself, when a box is empty, print "Not recorded — ask the
    family" rather than a confident negative like "None recorded". "None
    recorded" reads to a nurse as "checked, and there are none."
    Change (1) is the one that actually helps the 11pm parent; (2) and (3) help
    the reader.
  scope: current
  privacy_impact: none — all of this is computed on device from data already there
  cost_and_maintenance: >
    A few hours; the derived helper already exists, so no new logic to maintain.
    The per-field badges need keeping in sync with `emergencyInfo()` — worth a
    unit test that asserts every field named in `emergencyInfo` carries the badge.
  effort: M
  risk_of_change: low
  mission_impact: 5
  reach: 4
  harm_if_unfixed: 5
  environment: both

- id: A3-006
  title: The letter's "How to use this letter" page directs the reader to sections that are not in the letter
  category: content-as-accessibility / the reader's experience
  what_i_observed: >
    Page 2 of every generated Letter of Intent is a static "To the reader"
    orientation page. It instructs: "If you are new to [name], start with 'A
    typical day' and 'Communication.' They will carry you through the first
    week." and "In a crisis, go straight to 'Medical' and 'Behavioral support.'"
    Those instructions are printed unconditionally. In the "minimal" PDF the
    Contents page lists exactly one entry — "1 Getting started 4" — so a reader
    following the letter's own crisis instruction is sent to a Medical section
    that does not exist in the document they are holding.
  evidence:
    type: measurement
    detail: >
      pdfjs extraction of
      audit/evidence/pdfs/minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf.
      Page 2 contains verbatim: "If you are new to … start with \"A typical day\"
      and \"Communication.\"" and "In a crisis, go straight to \"Medical\" and
      \"Behavioral support.\"" Page 3 (Contents) contains only:
      "C O N T E N T S What's in this letter 1 Getting started 4".
  confidence: MEASURED
  who_is_affected: >
    The future caregiver, sibling, trustee or guardian reading the letter —
    frequently under stress, frequently for the first time, sometimes in an
    emergency. Also the parent, who is unknowingly handing over a document that
    contradicts itself.
  why_it_matters: >
    The orientation page is the single best thing in the generated letter; it is
    genuinely thoughtful (it tells the reader nothing is binding, to check the
    date, that no ID numbers are inside, and that they may write on it). Its
    value depends entirely on being true. A reader who follows a crisis
    instruction into an absent section learns, at the worst possible moment, that
    the document cannot be trusted to describe itself. Cognitive accessibility
    for the *reader* is in scope here: this letter's whole purpose is to be
    usable by a stranger in a hurry.
  standard_reference: >
    COGA "Make each step clear" / "Do not give inaccurate instructions". Not a
    WCAG SC — this is document content, not the web UI.
  recommendation: >
    Generate that page from the sections actually present. Filter each named
    section through the same `sectionHasContent` check the reading view already
    uses, drop the bullet if none of its sections exist, and substitute a plain
    line when the letter is thin — e.g. "This letter is a start rather than a
    finished record; it covers [n] of [total] areas. Ask the family about
    anything not here." Keep the rest of the page exactly as it is.
  scope: current
  privacy_impact: none
  cost_and_maintenance: small conditional in the PDF component; one test
  effort: M
  risk_of_change: low
  mission_impact: 4
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A3-007
  title: A fully-formed email signup on the Review page does nothing, and looks like the most important control in its card
  category: anxiety / executive function / trust / privacy-feel
  what_i_observed: >
    "Option two · not switched on yet — Let us remind you" is a navy panel
    carrying a real `<label>`, a real `type=email` input with `autoComplete=
    "email"`, and a submit button reading "Send me the reminder" that turns solid
    gold gradient as soon as the address looks valid. Submitting sets local state
    and renders "Email reminders aren't switched on yet, so nothing was sent…".
    Nothing is transmitted — the code is honest about that, and the panel does
    say "not switched on yet" in the eyebrow and again in the paragraph. But the
    dead control is the visually heaviest element in the whole "Come back in a
    year" section: the working option (calendar) is a beige card, the dead option
    is a navy card, and the only gold-gradient button in the pair belongs to the
    dead one.
  evidence:
    type: code + screenshot
    detail: >
      src/components/review/ReminderPanel.tsx:46-85 — the form, the input, and
      the button whose `valid` branch applies
      `style={{ background: "var(--gradient-gold)" }}`. Line 48-51: `onSubmit`
      only calls `setTried(true)`.
      Placement: src/components/review/ReviewScreen.tsx:466 `<ReminderPanel />`
      sits as the second cell of the two-column grid opened at line 407.
      Screenshot: audit/evidence/screenshots/review-1024.png — the navy "LET US
      REMIND YOU" panel with the "SEND ME THE REMINDER" button, right of the
      beige calendar card.
  confidence: INSPECTED
  who_is_affected: >
    Anyone who scans rather than reads — which at this point in the flow is
    almost everyone, because this screen comes *after* the emotional work is
    done. Specifically: users with reading difficulty or dyslexia, users with
    attention or working-memory limits, users whose first language is not
    English, and users who have learned to look for the brightest button.
  why_it_matters: >
    Two costs. First, executive function: this is the last screen, the user has
    one action's worth of energy left, and the interface spends it on a control
    that cannot succeed. "Come back in a year" is the single behaviour that keeps
    this document trustworthy over time; steering the tired user's one click into
    a dead end is the most expensive possible place to do it. Second, the felt
    privacy promise: the entire site says "No account. No email required." This
    is the one field on the site that asks for an email address, and the
    reassurance that nothing was stored arrives only *after* the user has typed
    it and pressed the button. Technically nothing leaves the device;
    experientially the user has just handed over their address to a site that
    told them it would never ask. That is a real cost even though it is not a
    real leak.
  standard_reference: >
    COGA, Making Content Usable — "Make it clear what will happen"; "Avoid
    controls that do not do what they appear to do." WCAG 3.3.2 is satisfied
    (there is a label) so this is not an SC failure.
  recommendation: >
    Remove the input and the button until the service exists. Replace with the
    same paragraph plus nothing else, or at most a `<Disclosure label="Tell me
    when email reminders are ready">` that reveals the explanation. Then let the
    calendar card — the option that works today — take the whole width, or the
    navy treatment, or both. If the panel must keep an input for design symmetry,
    at minimum move the "not switched on" sentence above the label, disable the
    submit, and drop the gold gradient so the working option is the brightest
    thing on the card. The version that helps the 11pm parent is the one where
    the only two buttons on the screen both work.
  scope: current
  privacy_impact: >
    Removing the field strictly reduces exposure. No user data leaves the device
    today and none would after the change.
  cost_and_maintenance: negative — deletes code and a future support question
  effort: S
  risk_of_change: low
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A3-008
  title: In Windows High Contrast / forced-colors, every progress and orientation cue disappears
  category: vision / high contrast mode / memory
  what_i_observed: >
    With `forced-colors: active` the gold gradient affordances resolve to
    `background-image: none` and the flat gold fills resolve to Canvas, so the
    following all become invisible: the progress bar under "You've added notes to
    N of M sections"; the small gold dot that marks which sections have notes; the
    `.tw-diamond` bullets used as list markers, inside buttons and in the review
    file list; the 3px gold rule on every `.tw-card`. In the screenshot I captured,
    the rail correctly reports "You've added notes to 1 of 15 sections" in text,
    but no section in the list carries any visible mark, and the current section
    ("06 Medical", which has `aria-current="page"`) is visually
    indistinguishable from the other fourteen — its `bg-gold100` fill and
    `border-gold500` are both forced away.
  evidence:
    type: measurement + screenshot
    detail: >
      Playwright context `forcedColors: "active"` on /letter/medical after typing
      into Allergies. `matchMedia("(forced-colors: active)").matches` → true.
      `.tw-diamond` computed: `{bg:"rgba(255,255,255,0)", bgImg:"none", w:10,
      h:10}` — i.e. a 10px box with nothing in it.
      Screenshot: scratchpad/forced-colors-medical.png (1280x1000) — compare with
      scratchpad/normal-colors-medical.png captured from identical state, where
      the current item computes `backgroundColor: rgb(247,238,223)` and the
      "has notes" dot computes `rgb(201,160,99)`.
      Source of the vanished cues: src/components/wizard/WizardRail.tsx:36-43
      (progress bar, `background: var(--gradient-gold)`), :75-77 (current item
      `border-gold500 bg-gold100`), :93-100 (the dot, `bg-gold500`);
      src/app/globals.css:367-374 (`.tw-diamond`), :389-395 (`.tw-card::before`).
  confidence: MEASURED
  who_is_affected: >
    Windows High Contrast Mode users — overwhelmingly people with low vision,
    light sensitivity, or migraine who are *not* screen reader users and
    therefore get no benefit from the sr-only fallbacks. This is a large and
    under-served group among older caregivers.
  why_it_matters: >
    The "has notes" dots and the current-section highlight are the site's entire
    externalised memory. The whole design premise — stop mid-sentence tonight,
    come back Thursday — depends on the user being able to see, at a glance, what
    they already did and where they are. Take those away and a 15-section form
    becomes something you have to hold in your head, which is precisely the
    demand COGA exists to remove. The rail does carry an `sr-only` ", has notes"
    for screen readers (WizardRail.tsx:99), which is good and shows the intent;
    the gap is for sighted HCM users.
  standard_reference: >
    WCAG 2.2 SC 1.4.1 Use of Colour (A) — the notes state and the current state
    are conveyed by colour/fill alone visually. SC 1.4.11 Non-text Contrast (AA)
    for the indicator itself. COGA: externalise memory, show don't remember.
  recommendation: >
    Do not rely on any gradient or fill to carry meaning. For the "has notes"
    marker use a glyph in text colour (a filled ◆ next to an outline ◇, or a
    check) so it survives forced colours and also reads at a glance for everyone
    else. For the current item add a shape cue that forced colours preserves —
    a left border in `currentColor` plus `font-weight: 600` — alongside the fill.
    For the progress bar, add the plain sentence it already has (keep it) and give
    the bar a 1px `currentColor` border so the track survives. Add a
    `@media (forced-colors: active)` block that restores these; it is a dozen
    lines and touches nothing else.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one CSS block plus a marker glyph; negligible upkeep
  effort: M
  risk_of_change: low
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A3-009
  title: There is no dark mode, and light mode is hard-coded — for a tool explicitly designed for use at midnight
  category: situational / vision / photophobia
  what_i_observed: >
    `:root { color-scheme: light; }` at src/app/globals.css:13, no
    `prefers-color-scheme` media query anywhere in the codebase, and no
    `<meta name="color-scheme">`. Rendering the wizard in a Chromium context with
    `colorScheme: "dark"` produces byte-identical colours to light: body
    background rgb(251,250,246), inputs rgb(255,255,255). The full-bleed ivory
    #fbfaf6 covers essentially the whole viewport on every wizard screen.
  evidence:
    type: measurement + code
    detail: >
      `grep -rn "prefers-color-scheme" src/` → no matches (only
      `prefers-reduced-motion` at globals.css:288, which *is* handled, and well).
      Playwright, `colorScheme:"dark"` vs `"light"` on /letter/medical: both
      `{bodyBg:"rgb(251, 250, 246)", inputBg:"rgb(255, 255, 255)",
      colorScheme:"light", metaColorScheme:null}`.
      Hard-coded at src/app/globals.css:13.
  confidence: MEASURED
  who_is_affected: >
    People with photophobia, migraine, post-concussive light sensitivity, uveitis,
    dry-eye, and many autistic users with sensory sensitivity — all
    over-represented among both the caregivers and the disabled adults using this
    tool. Also everybody situationally: the brief's own archetype is "a phone at
    midnight", often in a dark room beside a sleeping child.
  why_it_matters: >
    This is the clearest gap between who the site says it is for and what it
    does. The design brief for the whole product is "one more ten-minute sitting,
    whenever you can find it" — and the sittings people actually find are late at
    night. A full-screen ivory page at 2am is physically uncomfortable for a
    large minority and physically excluding for a smaller one. The site already
    owns a complete dark palette: the navy scale, `--on-ink-heading`,
    `--on-ink-body`, `--on-ink-secondary` and the navy panel treatment are used
    on the hero, on every section header, and on the review header. A dark theme
    is not a new brand; it is the existing navy ground extended.
  standard_reference: >
    No WCAG SC requires dark mode (1.4.8 Visual Presentation, AAA, is the closest
    relative). COGA and inclusive-design practice; also `prefers-color-scheme` is
    a declared user preference the platform expects sites to honour.
  recommendation: >
    Add `@media (prefers-color-scheme: dark)` overriding the semantic aliases
    only — `--paper`, `--paper-2`, `--surface`, `--ink`, `--ink-body`,
    `--ink-muted`, `--ink-faint`, `--line`, `--control-border`, `--btn-fg`,
    `--focus-ring` — mapping paper to the navy scale and ink to the on-ink scale.
    The brand tokens themselves do not change; only which semantic alias points
    where. Set `color-scheme: light dark`. Then re-run the contrast checks,
    because gold-on-navy and gold-on-ivory have different budgets, and re-check
    the navy panels, which will need to become *lighter* than the page rather
    than darker. If a full dark theme is out of scope for now, the smallest useful
    step is a manual "dim" toggle stored in localStorage — but the media query is
    the honest answer and is not much more work.
  scope: current
  privacy_impact: none — a media query and CSS tokens; a manual toggle would store one boolean on device
  cost_and_maintenance: >
    Real but bounded: roughly a day to map the tokens, plus an ongoing discipline
    that new components use semantic aliases (they already do). The main
    maintenance risk is the two navy panels inverting their relationship to the
    page, which needs a design decision, not just tokens.
  effort: L
  risk_of_change: medium — it is the only change here that could visibly go wrong across the whole site
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A3-010
  title: The home page shows no sign that a letter is already in progress
  category: memory / anxiety / re-entry
  what_i_observed: >
    A `ResumeCard` component exists and renders "PICK UP WHERE YOU LEFT OFF" —
    but it is mounted only on /letter (the chooser), at
    src/app/letter/page.tsx:53. The home page does not import it, in either the
    local or the committed version. I typed into Medical, confirmed persistence,
    then loaded `/` fresh: no resume affordance anywhere in the page text; the
    first screen is the same hero a first-time visitor sees, headed by
    "Start your letter · it's free".
  evidence:
    type: measurement + code
    detail: >
      Playwright: fill #f-allergies → wait → navigate to `/` → search body text
      for /pick up where you left|continue your letter|resume/i → `found:false`.
      Same session at `/letter` → "PICK UP WHERE YOU LEFT OFF REVIEW & DOWNLOAD".
      `grep -rn "ResumeCard" src/` → only src/app/letter/page.tsx:5 and :53.
      `git show HEAD:src/app/page.tsx | grep -c ResumeCard` → 0.
  confidence: MEASURED
  who_is_affected: >
    Everyone returning after an interruption, which is the design's own core
    scenario. Acutely: anyone with memory impairment, anyone with anxiety about
    having lost their work, anyone who reaches the site by typing the domain or
    using a bookmark rather than a deep link — which is what a tired person does.
  why_it_matters: >
    This tool has no account. The only proof a user has that their 40 minutes
    still exist is what the interface shows them. Landing on an unchanged
    marketing hero, with a button that says *Start* your letter, is precisely the
    wrong signal: it reads as "there is nothing here." A user with anxiety or
    memory difficulty may reasonably conclude they lost it. Users who click
    through do find the resume card one page later — but the cost is a moment of
    fear at exactly the moment the site is trying to earn a second sitting.
  standard_reference: >
    COGA, Making Content Usable — "Help users find what they need"; "Reduce the
    need to remember." Not a WCAG SC.
  recommendation: >
    Render `<ResumeCard />` at the top of the home page too, above the hero or
    immediately under it, gated on `hasHydrated && startedCount > 0`. The
    component already exists and already handles the empty case, so this is one
    import and one line. Then change nothing else — the hero can stay exactly as
    it is for first-time visitors.
  scope: current
  privacy_impact: >
    None. The card reads localStorage that is already read on /letter; nothing
    leaves the device. Worth noting the shoulder-surfing angle: it may show the
    child's preferred name on a shared or borrowed device's home page. If that
    matters, show progress without the name ("You have notes in 7 of 15
    sections") — which is also the version that helps most.
  cost_and_maintenance: one import
  effort: S
  risk_of_change: low
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A3-011
  title: On phones and tablets, progress and the section list are hidden inside a collapsed disclosure
  category: memory / orientation / mobile
  what_i_observed: >
    Below the `lg` breakpoint the desktop rail is `hidden` and everything it
    carries — the audience label, the "You've added notes to N of M sections"
    sentence, the progress bar, the 15-item section list with its "has notes"
    marks, the "Review & download" link and the "Back up or delete your data"
    link — moves inside a `<details>` element that is closed by default and
    labelled only "Sections". Nothing about progress, position, or the route to
    Review is visible on a phone without first opening that disclosure.
  evidence:
    type: code + screenshot
    detail: >
      src/components/wizard/WizardRail.tsx:140-156 `MobileSections` — `<details
      className="print-hide mb-6 … lg:hidden">` with no `open` attribute; the
      summary reads "Sections"; `<ProgressNote />`, `<SectionNav />` and
      `<RailLinks />` are all inside it.
      src/app/letter/[slug]/layout.tsx:16-21 — `MobileSections` for `<lg`, `aside`
      is `hidden … lg:block`.
      Screenshot: audit/evidence/screenshots/wizard-medical-320.png — a closed
      "Sections ▾" bar directly under the privacy strip; no progress text, no
      list, no Review link anywhere on the page above the Next/Previous buttons.
  confidence: INSPECTED
  who_is_affected: >
    Every phone and small-tablet user, i.e. a large share of the audience and
    almost all of the "on a phone at midnight" population. Within that, anyone
    with working-memory limits, anyone resuming after days away, and anyone who
    does not know that "Sections" is a container for progress rather than just a
    list of links.
  why_it_matters: >
    Collapsing a 15-item nav on a 320px screen is right. Collapsing the *progress
    summary* with it is not: it is one short sentence and a 4px bar, it is the
    externalised memory the whole design depends on, and it is being hidden
    specifically on the viewport where interruption is most likely and where
    scrolling back to find your bearings costs the most. The desktop user, who
    least needs the reminder, gets it permanently; the phone user, who most needs
    it, has to go looking. The summary label "Sections" also under-describes what
    is inside — a user looking for "how far am I" has no reason to open it.
  standard_reference: >
    COGA, Making Content Usable — "Make it easy to find the most important
    features"; "Reduce the need to remember." Not a WCAG SC (the content is
    reachable).
  recommendation: >
    Lift `<ProgressNote />` out of the `<details>` so the sentence and bar always
    show on mobile, and leave `<SectionNav />` and `<RailLinks />` inside. Relabel
    the summary to say what it does — "All 15 sections" or "Jump to a section" —
    so it is addressable by a voice-control user and legible to someone scanning.
    Consider surfacing the "Review & download" link outside the disclosure too;
    on mobile it is currently reachable only by opening "Sections" or by walking
    Next to the end.
  scope: current
  privacy_impact: none
  cost_and_maintenance: moving two JSX nodes
  effort: S
  risk_of_change: low
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A3-012
  title: The new video play control cannot be activated by voice control using its visible name ("Watch")
  category: voice control / speech input
  what_i_observed: >
    In the local (uncommitted) VideoPlayer the poster is wrapped in a `<button>`
    whose `aria-label` is "Play the video: what a Letter of Intent is, and how
    the builder works", while the visible label rendered on the poster is the word
    "Watch" inside a gold pill. The accessible name does not contain the string
    "Watch", so a Dragon NaturallySpeaking or Voice Control user saying "click
    Watch" will not match it. This control does not exist in the committed
    version currently in production — it is arriving with the pending deployment,
    so it is worth catching now.
  evidence:
    type: measurement + code
    detail: >
      Playwright, comparing rendered visible text (aria-hidden retained, because
      SC 2.5.3 is about what is *visible*, not what is exposed) against
      `aria-label`, across six routes. Exactly one text mismatch on the whole
      site: `{route:"/", tag:"button", visibleText:"watch", accessibleName:"play
      the video: what a letter of intent is, and how the builder works"}`.
      Code: src/components/home/VideoPlayer.tsx:162-166 (`aria-label`) and
      :192-194 (the visible "Watch"). The committed file has neither
      (`git show HEAD:…` line 16 documents "PROTOTYPE: no custom poster image or
      'Watch' pill right now").
      Every other control on the site passed: zero other visible/accessible name
      mismatches found.
  confidence: MEASURED
  who_is_affected: >
    Speech-input users — people with high-level spinal cord injury, ALS, MS,
    severe RSI, cerebral palsy, or temporary injury. Also anyone dictating
    one-handed while holding a child, which is a named situational case for this
    audience.
  why_it_matters: >
    Small in isolation — one control, one page. It matters because it is the only
    such mismatch on the entire site and it is about to ship, so fixing it keeps a
    genuinely clean record clean. Voice-control users learn quickly that a site
    either works by spoken labels or does not; one failure in the hero teaches
    them to fall back to number overlays for everything.
  standard_reference: >
    WCAG 2.2 SC 2.5.3 Label in Name — Level A. The accessible name must contain
    the text that is presented visually.
  recommendation: >
    Start the accessible name with the visible word: `aria-label="Watch the
    video: what a Letter of Intent is, and how the builder works"`. One word.
    (Also note for completeness: the eight social-share links on the home page
    are icon-only with `aria-label` names like "Share on Facebook" — that is not
    a 2.5.3 failure since there is no visible text, and the names are good, but
    those controls are only addressable by a voice user via number overlays.)
  scope: current
  privacy_impact: none
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 3
  environment: local (pending deployment)

- id: A3-013
  title: Twenty engraved-caps labels are set at 9–11px, against the design system's own "never below 12px" rule
  category: vision / legibility / literacy
  what_i_observed: >
    `.tw-engraved` is Cinzel (a display serif), uppercase, with
    `letter-spacing: 0.18em` and often more. globals.css:304 states the rule in
    its own comment: "Engraved all-caps lockup, à la the wordmark. Never below
    12px." Counting actual usages: 17 at 0.6875rem (11px), 2 at 10px, 1 at 9px.
    These labels carry navigational and orienting meaning — "Option one",
    "What this set asks", "Be ready to write about", "The last step", "Start
    here", "Pass it along", "Recent photo", "One year from today".
  evidence:
    type: code
    detail: >
      `grep -rn "tw-engraved" src/` cross-tabulated by size class:
      17 × `text-[0.6875rem]`, 2 × `text-[10px]`, 1 × `text-[9px]`, 13 × `text-xs`
      (12px), 1 × `text-[0.9375rem]`, 1 × `text-[30px]`.
      The 9px instance: src/components/wizard/PhotoFields.tsx:210
      `className="tw-engraved block text-[9px] tracking-[0.16em] text-accent"` —
      the "RECENT PHOTO" / "FAMILY OR OTHER PHOTO" slot labels.
      The 10px instances: src/components/chrome/SiteFooter.tsx:5 (every footer
      column heading) and src/components/home/VideoPlayer.tsx:237.
      Rule being broken: src/app/globals.css:304.
  confidence: INSPECTED
  who_is_affected: >
    Older caregivers — the design tokens themselves acknowledge this audience at
    globals.css:77-80, where `--ink-faint` was deliberately darkened because "the
    audience is older caregivers." Also low vision, dyslexia (all-caps removes
    word-shape cues), and anyone reading on a phone at arm's length.
  why_it_matters: >
    Uppercase + wide tracking + display serif + 9-11px is close to the worst
    available combination for readers with low vision or dyslexia, and it is used
    for the labels that tell you what part of the page you are in. The site has
    clearly thought carefully about contrast (see the `--ink-faint` comment) and
    then let size undo some of that care. Note this is not a WCAG failure — there
    is no minimum font size in WCAG, and the text zooms — but it is a real
    legibility cost, and the project has already decided the rule for itself.
  standard_reference: >
    The project's own rule at globals.css:304. WCAG 2.2 SC 1.4.4 Resize Text is
    met (text does scale). COGA / inclusive typography practice.
  recommendation: >
    Raise the floor to 12px everywhere `.tw-engraved` appears, and reduce
    tracking below 0.20em at that size. Start with the three worst: the 9px photo
    slot labels and the 10px footer headings and video chip. The visual weight
    lost can be recovered with the gold colour and the existing hairline rule
    rather than with smallness. Nothing about the brand changes.
  scope: current
  privacy_impact: none
  cost_and_maintenance: a find-and-replace plus a visual pass; adding the floor to `.tw-engraved` itself would prevent recurrence
  effort: S
  risk_of_change: low — some tight layouts (the footer, the photo captions) will need a reflow check
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A3-014
  title: Worked examples are the site's best scaffold and are thinly and unevenly distributed — Medical has one for sixteen inputs
  category: content-as-accessibility / literacy / executive function
  what_i_observed: >
    The `example` field renders a "See an example" disclosure containing a real
    sample answer, closed by footer text that reads "a sample answer, to show the
    level of detail. Yours can be shorter." Where they exist they are excellent —
    concrete, specific, written the way a real parent writes. They are rare. In
    the 15-section special-needs path there are 19 `example:` entries against 99
    declared input kinds. The distribution is inverted relative to difficulty:
    Medical has 1 example for 16 inputs; Getting started has 0 for 5; School &
    work 0 for 6; Final wishes 0 for 6; Behavioral support has 3 for 6.
  evidence:
    type: code
    detail: >
      Per-file counts of `example:` against `kind: "` across
      src/lib/content/sections/*.ts —
      01-getting-started 0/5, 02-about 2/5, 03-family-support 1/10,
      04-typical-day 2/9, 05-communication 2/6, 06-medical 1/16,
      07-behavior 3/6, 08-education-work 0/6, 09-housing 1/5,
      10-benefits-finances 2/6, 11-social-faith 1/6, 12-legal-advocacy 1/4,
      13-trustee 2/6, 14-final-wishes 0/6, 15-personal-message 1/3.
      Rendering: src/components/wizard/field-ui.tsx:79-90.
      The one Medical example (06-medical.ts:70-74, the seizure protocol) is the
      best single piece of content in the product.
  confidence: INSPECTED
  who_is_affected: >
    Anyone facing a blank textarea without a model of what "good" looks like:
    users with low literacy or writing difficulty, non-native speakers, people
    with executive-function or initiation difficulty (very common in depression
    and in grief — both near-universal in this audience), and anyone who has
    never seen a Letter of Intent.
  why_it_matters: >
    The site's founding insight is correct and stated on its own home page: "a
    blank page is paralyzing… This tool replaces the blank page with small,
    answerable questions." But a small answerable question with an empty box
    under it is still a blank page for someone who does not know what a good
    answer contains. The examples are the actual mechanism by which this tool
    produces a *useful* document rather than a *complete* one — the difference
    between "he gets upset sometimes" and the seizure protocol at
    06-medical.ts:70. Medical and Behavioral support are the two sections a
    stranger will act on in a crisis, and Medical is the one with the thinnest
    scaffolding and the most inputs.
  standard_reference: >
    UDL Principle II/III — provide models and exemplars, support planning and
    strategy development. COGA, Making Content Usable — "Provide help and
    examples for complex content."
  recommendation: >
    Target the sections where a vague answer is dangerous rather than merely
    weak. Priority order: Medical (allergies, medications purpose, equipment,
    what worked / what did not — four examples), Communication (already 2/6, add
    "what pain looks like"), Family & support (1/10, add the emergency-contact
    row), Final wishes (0/6 — this one is delicate; a single gentle example would
    lower the barrier more than any other change on the site, because the reason
    that box stays empty is usually not-knowing-how-to-start rather than
    not-wanting-to). Reuse the existing voice: specific, named, unsentimental.
    Roughly ten more examples would change the character of the output.
    This is the recommendation most likely to change what the 11pm parent
    actually produces.
  scope: current
  privacy_impact: none — static content
  cost_and_maintenance: >
    Writing time, not engineering time. Ongoing cost is nil, but the examples
    must stay plausible and must never look like fill-in-the-blank templates, or
    families will copy them.
  effort: M
  risk_of_change: low
  mission_impact: 5
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A3-015
  title: The "Review & download" page puts three downloads at the top and the letter itself 5,000px below, past two promotional sections
  category: executive function / verification / attention
  what_i_observed: >
    The page order is: header → "Download all three" (with a primary "Download
    all three together") → "Come back in a year" → "Pass it along" (share +
    leave a review) → "The letter guides their care. A trust protects their
    future." (book a consultation) → "Read it through" (the full reading view) →
    "Sections without notes yet". At 1024px with typical content the page is
    6,430px tall; the reading view begins at roughly 82% of that height, and the
    list of sections still empty is the very last thing on the page.
  evidence:
    type: screenshot + code + measurement
    detail: >
      audit/evidence/screenshots/review-1024.png — full-page capture,
      6,430px tall; "READ IT THROUGH" appears at approximately y=5,300 and
      "Sections without notes yet" at approximately y=6,150.
      Order in code: src/components/review/ReviewScreen.tsx:133 (downloads),
      :192 (`<YearlyReview/>`), :195 (pass it along), :263 (firm CTA), :311
      (`<ReadingView/>`); the "Sections without notes yet" block is inside
      ReadingView at :540-558.
  confidence: MEASURED
  who_is_affected: >
    Anyone with limited attention or stamina at the end of a long task, which by
    the site's own account is everyone who reaches this screen. Users with
    executive-function difficulty, who will take the first offered action and
    stop. Screen-magnifier users, for whom 5,000px of scrolling at 4x is a very
    long journey.
  why_it_matters: >
    The page is called Review & download and it presents download first,
    unconditionally, with a large primary button. The reading view — the only
    place a family can actually check what they are about to print and hand to a
    school or an ER — is behind two promotional sections. The likeliest outcome
    for a tired user is that they download three files and never read them. That
    matters here more than on an ordinary site, because the letter's errors are
    not typos: a wrong medication dose or a stale emergency contact reaches a
    stranger who will act on it. Also, the list of sections still empty — the one
    thing that would prompt a second sitting — is at the very bottom, after
    everything.
  standard_reference: >
    COGA, Making Content Usable — "Make each step clear"; "Support the user in
    completing the task correctly." Not a WCAG SC.
  recommendation: >
    Move "Sections without notes yet" up, directly under the header, before the
    downloads — it is the decision the user actually has to make first (keep
    going, or finish). Put a short "Read it through before you print" link next
    to the download buttons that jumps to the reading view. Then move the two
    promotional sections ("Pass it along", the firm CTA) below the reading view.
    Nothing needs to be removed; the sharing ask lands better *after* someone has
    seen their finished letter anyway. Note the owner's open question about two
    consecutive beige sections on the home page is a separate matter and I have
    not treated it as a defect.
  scope: current
  privacy_impact: none
  cost_and_maintenance: reordering JSX blocks
  effort: S
  risk_of_change: low — but it moves the firm's conversion CTA down the page, which is a business trade-off the owner should make knowingly
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A3-016
  title: The "has notes" marker is a 6px gold dot at 2.4:1, and "has notes" is earned by a single character
  category: vision / progress feedback
  what_i_observed: >
    Two related weaknesses in the same signal. (a) The per-section marker is a
    6px `rounded-full` in gold-500 rgb(201,160,99), which measures 2.42:1 against
    white and about 2.3:1 against the gold-100 fill of the current row — below
    the 3:1 required of a meaningful non-text indicator. There is an `sr-only`
    ", has notes" alongside it, so screen readers are served; sighted low-vision
    users are not. (b) `sectionHasContent` returns true if any field contains any
    non-whitespace string, so a single typed character marks a section done and
    increments "You've added notes to N of M sections".
  evidence:
    type: measurement + code
    detail: >
      Playwright computed style of the dot: `rgb(201,160,99)`;
      contrast vs #ffffff = 2.42 (canvas-readback luminance calc).
      Code: src/components/wizard/WizardRail.tsx:93-100 (dot + sr-only text);
      src/lib/derive.ts:34-60 (`isFilledString` → `fieldHasContent` →
      `sectionHasContent`), and :71-73 (`startedCount`).
  confidence: MEASURED
  who_is_affected: >
    Low-vision users who are not screen reader users, for (a). For (b), anyone
    relying on the progress readout to decide what is left — especially users
    with memory or attention difficulty, and anyone returning after a gap.
  why_it_matters: >
    This is the site's completion memory. If it is hard to see, the memory is
    unavailable to part of the audience; if it over-reports, the memory is wrong
    for everyone. Neither is severe alone; together they mean a user can believe
    they have "added notes to 12 of 15 sections" when several contain one word.
  standard_reference: WCAG 2.2 SC 1.4.11 Non-text Contrast (AA) for (a). COGA progress feedback for (b).
  recommendation: >
    (a) Replace the dot with a glyph in accent text colour (the site already owns
    `--accent-text` #7d5f31 at 4.5:1 on ivory) — a filled diamond against an
    outline diamond reads at a glance, survives forced colours, and is on-brand.
    (b) Leave `sectionHasContent` alone for the "started" dot — it is honest that
    something is there — but do not let one character read as done. Either use
    two states (started / substantially filled, e.g. more than one field or more
    than ~40 characters) or reword the sentence to "You've started N of M
    sections", which is both accurate and cheaper. Reword first; two-state is
    only worth it if the letter completeness matters more than the encouragement.
  scope: current
  privacy_impact: none
  cost_and_maintenance: small; the two-state variant adds one derived helper to keep tested
  effort: S
  risk_of_change: low
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A3-017
  title: The sticky masthead consumes a third of the viewport at 400% zoom
  category: vision / magnification / reflow
  what_i_observed: >
    The masthead is `position: sticky` and its lockup is
    `h-[clamp(64px,19vw,124px)]`. At a 320x256 CSS viewport — what a 1280x1024
    screen gives you at 400% browser zoom, the level WCAG Reflow is written
    around — the sticky header measures 81px tall against a 256px viewport: 32%
    of everything the user can see, permanently, on every screen. At 400x320
    (1600x1280 at 400%) it is 93px of 320px, 29%.
    To be clear about what does *not* fail: reflow itself is clean. I measured
    every route at 320x256 and found zero horizontal overflow and zero elements
    extending past the viewport. Text-spacing overrides (line-height 1.5,
    letter-spacing 0.12em, word-spacing 0.16em, paragraph-spacing 2em) produced
    no new horizontal scrolling and no clipping on any route. Both of those are
    genuinely well done.
  evidence:
    type: measurement
    detail: >
      Playwright at 320x256 on /letter/medical: `{headerH:81, viewportH:256,
      pctConsumed:32}`; at 400x320: `{headerH:93, viewportH:320, pctConsumed:29}`;
      at 375x667 (phone): `{headerH:88, pctConsumed:13}`.
      Reflow sweep, 320x256, eight routes: every one `{scrollW:320, clientW:320,
      hOverflow:false, offenders:[]}`.
      Text-spacing sweep, five routes: `newHorizOverflow:false` on all; the only
      "clipped" element found was the visually-hidden skip link, which is expected.
      Code: src/components/chrome/SiteHeader.tsx:56-58 (`sticky top-0`) and :78
      (`h-[clamp(64px,19vw,124px)]`).
  confidence: MEASURED
  who_is_affected: >
    Low-vision users at high zoom and screen-magnifier users. Also anyone on a
    short landscape viewport — a phone turned sideways to type, which is what
    people do for long text entry.
  why_it_matters: >
    A magnifier user filling in a textarea has roughly 175px of usable height.
    Losing a third of a small viewport to branding on every screen, forever, is
    the difference between seeing a label and its input together and not.
    This is not an SC failure — Reflow passes cleanly, and SC 2.4.11 Focus Not
    Obscured is met because focused fields carry a generous `scroll-margin-top`
    (globals.css:277-280, a nice touch). It is a straightforward usability cost
    with a cheap fix.
  standard_reference: >
    Adjacent to WCAG 2.2 SC 1.4.10 Reflow (which passes) and SC 2.4.11 Focus Not
    Obscured (which also passes). Reported as inclusive-design practice, not as a
    violation.
  recommendation: >
    Shrink the sticky header when the viewport is short, and/or unstick it below
    a threshold: `@media (max-height: 480px) { header { position: static } }`, or
    collapse the lockup to the monogram after the first scroll. The simplest
    honest fix is to cap the lockup height by viewport height as well as width —
    `h-[min(clamp(64px,19vw,124px),18vh)]`. Verify the anchor-offset calc at
    globals.css:279 and the ANCHOR_OFFSET in page.tsx still hold afterwards;
    they are both derived from the same clamp.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one CSS rule plus re-checking two derived offsets
  effort: S
  risk_of_change: medium — the anchor offsets are coupled to the header clamp in two places and will need re-testing
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 3
  environment: both

- id: A3-018
  title: The final-wishes interstitial removes the only visible way back
  category: executive function / anxiety / navigation
  what_i_observed: >
    Section 14 is gated behind "A gentle note before this section" until
    acknowledged. The gate itself is handled with real care — it names what is
    coming, explicitly permits leaving it out, and offers "I'm ready" and "Skip
    for now →". But `NextPrev` is suppressed while the gate is showing
    (`{!showGate ? <NextPrev …/> : null}`), so there is no "← Legal & advocacy"
    control: the two forward paths are the only in-page controls. On a phone the
    section rail is inside a closed disclosure (see A3-011), so a user who
    arrived here by accident and wants to go *back* has only the browser's back
    button. Separately, and much smaller: removing a repeater row prompts a
    `window.confirm` when it has content, but removing a photograph does not
    prompt at all.
  evidence:
    type: code
    detail: >
      src/components/wizard/SectionScreen.tsx:95 —
      `{!showGate ? <NextPrev slug={def.slug} name={name} /> : null}`;
      :116-140 the `EmotionalGate` (two controls: "I'm ready", "Skip for now →").
      :42 `showGate = Boolean(def.emotional && hydrated && !meta.finalWishesAck)`.
      Photo removal without confirmation: src/components/wizard/PhotoFields.tsx:
      215-221; contrast with the repeater confirm at
      src/components/wizard/SectionForm.tsx:176-186.
  confidence: INSPECTED
  who_is_affected: >
    Anyone who reaches this screen before they are ready — which is the entire
    reason the gate exists. Users with anxiety, users in acute grief, users who
    tapped the wrong rail item, and phone users, who have no rail visible.
  why_it_matters: >
    The gate is the most emotionally careful thing on the site and it is nearly
    right. But the moment it names — "the next questions are about funerals,
    burial, and end-of-life wishes for [name]" — is precisely the moment a parent
    may want to retreat rather than advance, and both offered doors point
    forward. "Skip for now" moves them to section 15; there is no "not tonight."
    Adding a backwards door costs one line and makes the kindness complete.
  standard_reference: >
    COGA, Making Content Usable — "Let users go back"; "Support users in
    controlling their own pace." WCAG 3.2.x are met.
  recommendation: >
    Render the `prev` half of `NextPrev` on the gate (or add a plain "← Go back"
    beside the two buttons). A third option worth considering: "Not tonight —
    take me back to where I was", returning to `meta.lastVisited`. Also add a
    confirm to photo removal so the two destructive actions in the wizard behave
    alike.
  scope: current
  privacy_impact: none
  cost_and_maintenance: a few lines
  effort: S
  risk_of_change: low
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 3
  environment: both
```

---

## WHAT IS HANDLED WELL

Recording this because the brief asks where the emotional load is handled well,
and because several of these are better than the industry norm and should not be
"improved" by a later pass.

- **Autosave.** Measured: 676 ms from keystroke to localStorage, and the last
  keystrokes survive navigation (the cleanup in `SectionForm.tsx:74-79` flushes
  on unmount). For a user who *will* be interrupted, this is the single most
  important behaviour on the site and it is right.
- **Save announcements are throttled.** `SaveIndicator.tsx:15-24` announces at
  most once per 8 s and clears after 3 s, instead of firing on every debounce.
  Most sites get this wrong and drown screen reader users.
- **Validation is advisory, never blocking.** `mode: "onTouched"`, hints render
  in `--hint` #7d5f31 rather than red, prefixed with ✻ rather than an error icon,
  and no field is required. Nobody is trapped by a format.
- **The delete flow.** A confirm dialog whose second button is "Download a
  backup first" (`DataControls.tsx:285`) — an escape hatch inside the
  destructive confirmation, which is unusually thoughtful.
- **Restore failures apologise and say nothing was changed.**
  `RestoreFlow.tsx:30-57` — four distinct failure messages, each of which tells
  the user their current letter is safe. That is the right instinct for someone
  who has just discovered their letter is not where they left it.
- **Plain-language definitions of jargon, in place, at the point of need.** "SSI
  is a monthly check for people with disabilities and limited income"
  (10-benefits-finances.ts:26); "A special needs trust holds money for {name}
  without breaking their benefits" (:48); "guardianship or conservatorship (a
  court gave someone authority)" (12-legal-advocacy.ts:19). I went looking for a
  missing glossary and found the definitions already embedded where they are
  needed, which is better than a glossary.
- **Reading level.** Prose-only Flesch-Kincaid across seven routes: 7.0–8.5,
  average sentence 10–18 words. Genuinely good for this subject matter, including
  the privacy page (FK 8.3 over 956 words).
- **Reflow and text-spacing.** Zero horizontal overflow at 320x256 on all eight
  routes; no clipping or new overflow under the 1.4.12 text-spacing overrides.
- **Reduced motion** is honoured globally (globals.css:288-297) and per-component
  (`motion-reduce:` classes throughout). No infinite animations, no autoplay, no
  carousels, no time limits anywhere.
- **The contrast tokens were reasoned about.** globals.css:77-81 darkens
  `--ink-faint` above the brand value specifically because "the audience is older
  caregivers", and :83 sets `--control-border` to clear 3:1. The care is real —
  which makes the focus ring (A3-001) a lapse rather than a pattern.
- **The `emergencyProtocol` example** (06-medical.ts:70-74) is the best content in
  the product and should be the model for A3-014.
- **The reader's orientation page** in the generated PDF, and the "ruled lines at
  the end of each section are for you — write on this document", treat the future
  caregiver as a person rather than a recipient.

---

## WHAT I EXAMINED, AND WHAT I COULD NOT

**Examined.**
Live dev server at eight routes (/, /letter, /letter/getting-started,
/letter/medical, /letter/behavioral-support, /letter/benefits-and-finances,
/letter/final-wishes, /letter/review, /privacy, /your-data) under Chromium via
Playwright at 320x256, 375x667, 375x800, 400x320, 1024x800, 1280x900/1000 —
reflow, text-spacing override, target size, label-in-name, focus indicator
contrast (canvas readback, not string parsing), forced-colors, prefers-color-scheme
dark and light, keyboard tab order, autosave timing and persistence, resume
behaviour after simulated interruption, and video track/duration state.
Full source read of the wizard (SectionScreen, SectionForm, field-ui, WizardRail,
PhotoFields, Disclosure), the review screen, ReminderPanel, DataControls,
RestoreFlow, SiteHeader, PrivacyStrip, SaveIndicator, PathChooser, VideoPlayer,
the home page, globals.css, derive.ts, paths.ts, types.ts, and all 25 section
content files. Text extraction of the minimal Letter and Emergency PDFs in
`audit/evidence/pdfs/`. Screenshots at 320/768/1024/1440 from
`audit/evidence/screenshots/`. Production caption/track check against
`audit/evidence/network/capture-production.json`. Both the working tree and the
committed `HEAD` versions of `page.tsx` and `VideoPlayer.tsx`, so that findings
are attributed to the right environment.

**Could not examine, and why.**

1. **Real assistive technology.** No screen reader (NVDA/JAWS/VoiceOver), no
   Dragon NaturallySpeaking, no switch interface, no eye-gaze, no screen
   magnifier was available in this environment. Every AT claim above is derived
   from measurable properties (accessible names, contrast ratios, computed
   styles, DOM order) rather than from operating the software. A3-001 in
   particular deserves a five-minute confirmation with an actual magnifier.
2. **Real Windows High Contrast Mode.** Playwright's `forcedColors: "active"`
   applies the forced-colors media feature but keeps a light system palette, so I
   could measure which properties get forced (background-image → none,
   background-color → Canvas) but could not see the real high-contrast themes
   users actually run. The measured property values are solid; the visual
   severity in a real HCM theme is inferred.
3. **Users.** No usability testing with anyone from the audience. Every claim
   about what a tired parent will do is an argument from COGA guidance and from
   the interface's own structure, not an observation. A3-004 (which time estimate
   is true) and A3-014 (whether more examples change what people write) can only
   be settled by watching four or five real people.
4. **Browser translation extensions and reading tools.** I did not test Google
   Translate's in-page translator, Immersive Reader, or Read Aloud against this
   markup. The site's heavy use of CSS-generated flourishes and `aria-hidden`
   spans is the sort of thing that sometimes confuses those tools.
5. **Production directly.** Per the authority rule, code-level findings come from
   local. Where a finding touches production copy or assets (A3-002, A3-003,
   A3-004) I verified against `git show HEAD:` and against the production network
   capture, and said so. I did not browse the live site.
6. **iOS/Android real devices, VoiceOver rotor, Android TalkBack, iOS Voice
   Control, and Dynamic Type.** Only Chromium emulation was available.
7. **The video's actual content.** I could not watch or hear it, so I cannot say
   how much of its information exists in text elsewhere. My claim in A3-002 is
   narrower and defensible: the adjacent column's stated topic differs from the
   figcaption's stated topic, so the code comment's "the same explanation" claim
   is not supported by what is on the page.
8. **`veraPDF` / PDF-UA tagging of the generated documents.** I extracted text
   but did not run the accessibility validator; that belongs to whoever owns the
   PDF output, and reading order / tagging for a screen reader opening the
   generated letter is a real question I have left untouched.

---

## THREE MOST CONFIDENT / THREE LEAST CONFIDENT

**Most confident**

1. **A3-001, the focus ring.** Colour read back from a canvas, contrast computed
   with the WCAG formula, values reproduced against five different grounds, and a
   screenshot showing it. 1.52:1 is not a judgement call.
2. **A3-005, the empty emergency sheet.** I extracted the actual text of the PDF
   that this codebase produced from a minimal letter, and separately proved by
   grep that the guard function which would have prevented it is defined and
   never called. Both halves are facts.
3. **A3-002 / A3-003, the video.** `textTracks.length === 0`, `duration ===
   277.999999`, zero caption assets across 431 production requests, and the
   string "about 2 minutes" present in the committed file. Nothing inferred.

**Least confident**

1. **A3-004, the time estimates.** The arithmetic is certain (165 vs 45–90) and
   the contradiction is real. What I cannot tell you is *which number is wrong*,
   and therefore whether the fix is to correct the headline (discouraging) or to
   deflate the badges (encouraging). My recommendation says "time some real
   people" for exactly that reason. I have marked it MEASURED for the
   contradiction, not for the resolution.
2. **A3-008, forced colours.** I am confident about the mechanism —
   `.tw-diamond` measurably computes to `background-image: none` under
   forced-colors, and the "has notes" and current-row cues are pure colour. I am
   less confident about how bad it looks in a real Windows high-contrast theme,
   because Playwright's emulation kept a light palette. Someone on a real HCM
   setup should look for ten seconds before this is scheduled.
3. **A3-014, the examples.** Everything about the counts is verifiable. The claim
   that more examples would meaningfully improve what families *write* is a
   professional judgement grounded in UDL, not something I observed here. It is
   also the recommendation with the highest ceiling, which is why I flagged it
   mission_impact 5 despite the softer evidence.

**Also worth flagging as uncertain:** I investigated the reported broken video
fullscreen button and could not reproduce or explain it. What I can say is
narrow: the component intercepts clicks in the region above the bottom 58px
(`VideoPlayer.tsx:119-126`) and toggles play/pause, and it swaps `src` to a blob
URL when range requests are not honoured (`ensureSeekable`, :47-75). Either could
plausibly interact badly with the native fullscreen control on some browser, but
I did not observe it and am not asserting it. Under Chromium on the dev server
the controls behaved normally.

---

## WHAT WOULD MAKE ME MORE CERTAIN

- Thirty minutes with NVDA + Firefox and thirty with VoiceOver + Safari on the
  wizard, specifically checking whether the throttled save announcement, the
  `aria-live` hint regions in `field-ui.tsx`, and the repeater add/remove flow
  behave as the code intends.
- Ten minutes in real Windows High Contrast Mode on `/letter/medical` with two
  sections filled in — enough to settle A3-008's severity.
- Ten minutes with Voice Control or Dragon attempting: "click Start your letter",
  "click Sections", "click See an example", "click Watch", "click Download all
  three together". That would confirm A3-012 and test the icon-only share row.
- Four or five moderated sessions with real users from the audience — one parent
  mid-diagnosis, one adult sibling, one grandparent over 70, one person with a
  cognitive disability using it for themselves. Timing them settles A3-004; giving
  them a blank Medical section and reading what they write settles A3-014.
- One thing I would ask the owner rather than test: what the video actually says.
  If its content is genuinely already written out somewhere on the site, A3-002's
  transcript recommendation gets cheaper — it becomes a link rather than a
  transcription job.
- `veraPDF` and a screen reader against the generated PDFs. The document a family
  hands to a blind sibling or a blind adult self-advocate is out of my measured
  scope here and nobody should assume it is fine.
