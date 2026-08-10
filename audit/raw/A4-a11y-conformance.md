# A4 — Technical Accessibility Conformance

Analyst A4. Working blind to the other eight analysts. No application code, style,
content or configuration was modified. Files created: this file,
`audit/vpat-draft.md`, and raw evidence under `audit/evidence/axe/` plus five
screenshots under `audit/evidence/screenshots/` prefixed `A4-`.

**Environments.** Code-level findings and file:line citations are from local dev
(`http://localhost:3000`). Nothing in this audit depends on production-only behaviour
(headers, third parties), so no local/production disagreement arose in scope.

**⚠ The repository moved during this audit — read this before acting on anything below.**
The brief stated HEAD was `d5ec230` with `src/app/page.tsx` and
`src/components/home/VideoPlayer.tsx` uncommitted. Partway through my work those were
committed: **HEAD is now `b243107`** ("feat: new social share image, navy video section,
and a corrected video length"), and `git status -- src/` is clean. Consequences I have
already applied:

- One observation I made early — that the video's figcaption read "about 2 minutes"
  against a measured 4 m 38 s runtime — **was fixed in `b243107` while I was working.**
  I re-checked at the new HEAD: it now reads "Watch · under 5 minutes". That claim has
  been struck from A4-002. Flagging it explicitly because a stale finding is worse than
  no finding.
- A4-015 was drafted as "local-only, uncommitted". `VideoPlayer.tsx` is now committed, so
  it is a normal code finding. Whether `b243107` is *deployed* is a separate question I
  did not test.
- I re-verified the two headline measurements at `b243107` after the move: focus ring
  **1.38:1** against `--paper-2`, accent-button text **4.33:1** against the gradient's
  darkest stop, video `trackCount: 0 / textTracks: 0 / duration 277.999999 / zero
  transcript affordances`. All unchanged.

Anything else in this report that reads as surprising should be re-checked against
`b243107` rather than assumed current.

**Where the evidence lives.** `audit/evidence/axe/` holds six raw JSON files
(`axe-A4-full.json`, `A4-measurements.json`, `A4-measurements-2/3/4.json`,
`A4-ax-tree.json`). The five `A4-*.png` screenshots are in
`audit/evidence/screenshots/`, which **is gitignored** (`.gitignore:55`) — they exist on
disk but will not travel with the repo. I did not run any git command that stages or
commits; if the axe JSON appears in the index, that was not me.

**Method.** Automated (axe-core 4.12 via @axe-core/playwright, Chromium 1234, 19
page states including post-interaction states the repo's own gate never enters) AND
manual (keyboard traversal, real accessibility tree via CDP `Accessibility.getFullAXTree`,
computed contrast by painting each declared colour to a canvas and reading the sRGB
pixel back, reflow at 320px / 200% / 400%, 1.4.12 text-spacing override, forced-colors
emulation, `prefers-reduced-motion` emulation, veraPDF PDF/UA-1 on the real generated
output). Every finding is labelled `automated` or `manual` in `what_i_observed`.

**The headline.** axe-core reports **zero** WCAG 2.0/2.1/2.2 A and AA violations across
all 19 states, including states the repo's e2e gate never reaches (open modal, populated
validation errors, video playing, mobile menu open, 320px reflow, mid-download busy
state, the emotional gate, the PDF sample viewer). That is a real achievement and it is
also the reason the findings below matter: **every one of them is invisible to the gate
the project currently trusts.** The single largest cause is that axe cannot evaluate
contrast against a CSS gradient — it returned 23 `color-contrast` *incomplete* results on
the home page alone — and the brand's two signature surfaces (the navy panel, the gold
gradient button) are both gradients.

---

## TIER 1 — Section 508 / WCAG 2.0 AA (the legal floor)

Mapping note: the Revised Section 508 standards (36 CFR 1194, Appendix A) incorporate
WCAG 2.0 Level A and AA by reference at **E205.4** (electronic content) and **E207.2**
(software). Legacy §1194.22 provisions are given as a secondary reference where the
original wording is the clearer citation.

```yaml
- id: A4-001
  title: The explainer video has no caption track — WCAG 1.2.2 is Level A, the legal floor
  category: media / synchronized media
  what_i_observed: >
    manual + automated. The 4 minute 38 second explainer video on the home page carries
    audio and has zero text tracks. In the DOM: `v.querySelectorAll("track").length === 0`
    and `v.textTracks.length === 0`, with `duration: 277.999999` and audio present.
    axe-core flagged it as the one non-contrast item needing review on that state:
    rule `video-caption`, 1 node, returned under `incomplete` (axe cannot assert a
    negative, so it never becomes a "violation" and the repo gate stays green).
    The source comment at VideoPlayer.tsx:201-202 says "No caption track: the same
    explanation is written out in full in the column beside this player." The column
    beside it (page.tsx:267-289) is two paragraphs, roughly 130 words, describing what a
    Letter of Intent is. The video is 4m38s. It is a summary, not a transcript, and a
    transcript would not satisfy 1.2.2 in any case — 1.2.2 requires captions.
  evidence:
    type: code + measurement + axe
    detail: >
      src/components/home/VideoPlayer.tsx:200-216 (the `<video>` element, no `<track>`);
      src/components/home/VideoPlayer.tsx:201-202 (the comment);
      src/app/page.tsx:267-289 (the "column beside", 2 paragraphs);
      audit/evidence/axe/A4-measurements.json → `video`:
      {"present":true,"controls":true,"trackCount":0,"textTracks":0,"hasAudio":true,
       "duration":277.999999,"transcriptLinks":[]};
      audit/evidence/axe/axe-A4-full.json → `state_video-playing` → incomplete
      `video-caption` x1.
  confidence: MEASURED
  who_is_affected: >
    Deaf and hard-of-hearing parents and siblings; anyone on a phone at midnight beside a
    sleeping child who cannot use sound; anyone in a hospital waiting room; non-native
    English speakers who read English better than they hear it; people with auditory
    processing differences (common among the parents of this audience, and among the
    adult siblings). Also: anyone whose connection cannot carry a 4-minute video.
  why_it_matters: >
    This is the site's own answer to "what is this thing and why should I spend 90
    minutes on it". The hero offers exactly two secondary buttons and one of them is
    "Watch & learn more". A deaf parent pressing that button gets nothing. It is the
    only Level A failure in this audit that a plaintiff's lawyer would find in ten
    minutes.
  standard_reference: >
    WCAG 2.0/2.1/2.2 SC 1.2.2 Captions (Prerecorded) — Level A. Section 508 E205.4
    (incorporates WCAG 2.0 A/AA); legacy §1194.24(c). Also EN 301 549 v3.2.1 §9.1.2.2.
  recommendation: >
    Ship a WebVTT caption track and mark it default-off but available:
    1. Produce `public/what-is-a-letter-of-intent.en.vtt`. Because the narration is
       scripted, the cheapest accurate route is to caption from the script, not from an
       ASR pass — ASR on medical/disability vocabulary ("Levetiracetam", "CCC Plus
       waiver", "rep payee") is where auto-captions become misinformation.
    2. In VideoPlayer.tsx, inside the `<video>` element (currently self-closing at
       line 215), add a child:
       ```tsx
       <track
         kind="captions"
         src="/what-is-a-letter-of-intent.en.vtt"
         srcLang="en"
         label="English captions"
         default
       />
       ```
       Note `default` — for this audience captions-on-by-default is the right call, and
       the native control bar gives everyone else a one-click off switch.
    3. Because the file is served same-origin from /public, no CSP change and no
       third-party is involved. `crossOrigin` is not needed.
    Also correct the comment at VideoPlayer.tsx:201-202, which currently asserts a text
    equivalent that does not exist. A wrong comment is how this stayed unfixed.
  scope: current
  privacy_impact: >
    None. The .vtt is a static same-origin asset. No user data involved, no third party,
    no change to the promise.
  cost_and_maintenance: >
    One-off: 2-4 hours to caption 4m38s accurately from the script and time it. Ongoing:
    the caption file must be regenerated whenever the video is re-cut — add that to
    whatever checklist governs the video asset.
  effort: M
  risk_of_change: >
    Very low. A `<track>` child is inert if the file 404s (the video still plays). The
    only regression risk is the custom `onKeyDown` handler on the same element — see
    A4-015 — which is independent of this change.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 5
  environment: both

- id: A4-002
  title: No transcript or media alternative for the video — 1.2.3 (A) and 1.2.5 (AA)
  category: media / synchronized media
  what_i_observed: >
    manual. Searched every page for a transcript affordance:
    `[...document.querySelectorAll("a,button,summary")].filter(t => /transcript|caption|subtitle/i.test(t))`
    returned `[]` on the home page. There is no expandable transcript, no linked text
    version, no audio description track. The `<figcaption>` (VideoPlayer.tsx:244-255)
    gives a 3-line blurb.
    STRUCK: an earlier draft of this finding reported that the figcaption claimed "about
    2 minutes" against a measured 277.999999 s (4 m 38 s) runtime. That was true when I
    read the file and was **fixed in commit b243107 during this audit**. Re-verified at
    the new HEAD: the figcaption now reads "Watch · under 5 minutes", which is accurate.
    Nothing else in this finding changed.
  evidence:
    type: measurement + content
    detail: >
      audit/evidence/axe/A4-measurements.json → `video.transcriptLinks: []`,
      `video.duration: 277.999999`.
      Re-verified at HEAD b243107: figcaption "WATCH · UNDER 5 MINUTES", video
      {trackCount: 0, textTracks: 0, duration: 277.999999, transcriptAffordances: []}.
      src/components/home/VideoPlayer.tsx:244-255.
  confidence: MEASURED
  who_is_affected: >
    Deafblind users (for whom captions alone are insufficient and a text transcript is
    the only route); blind users, who get no audio description of anything shown on
    screen; and — the largest group by far — every exhausted parent who would rather
    skim 600 words in 90 seconds than sit through 4m38s. The stated duration being
    less than half the real one compounds this: someone budgeting two minutes at 11pm
    abandons at 2:01.
  why_it_matters: >
    A transcript is the cheapest thing on this list and serves the widest group,
    including people with no disability at all. It also becomes the site's only
    indexable description of its own value proposition.
  standard_reference: >
    WCAG SC 1.2.3 Audio Description or Media Alternative (Prerecorded) — Level A;
    SC 1.2.5 Audio Description (Prerecorded) — Level AA. Section 508 E205.4.
  recommendation: >
    Publish the narration script as a collapsed transcript directly beneath the player,
    using the existing `Disclosure` component so it costs no vertical space:
    ```tsx
    // in VideoPlayer.tsx, after </figcaption>
    <Disclosure label="Read the transcript instead" className="mt-4">
      <div className="max-w-[60ch] text-[0.9375rem] leading-[1.75] text-oninkbody">
        {TRANSCRIPT.map((p, i) => <p key={i} className="mt-3 first:mt-0">{p}</p>)}
      </div>
    </Disclosure>
    ```
    with `TRANSCRIPT` a `string[]` module constant. `Disclosure` already emits
    `aria-expanded` / `aria-controls` correctly (src/components/ui/Disclosure.tsx:19-21)
    and its label colour on the navy panel will need `text-gold300` rather than
    `text-accent`.
    If the transcript describes what is shown as well as said (e.g. "on screen: the
    builder's medical section, with a medication row being filled in"), it doubles as
    the 1.2.3 media alternative and no separate audio-description track is required.
    (The stated-duration half of this recommendation is already done — see the STRUCK
    note above.)
  scope: current
  privacy_impact: None — static text in the bundle.
  cost_and_maintenance: >
    One-off 2-3 hours if the script exists, 4-6 if it must be transcribed. Ongoing: same
    coupling as the caption file — re-cut the video, re-write both.
  effort: M
  risk_of_change: Very low — additive, inside an existing tested component.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 4
  environment: both

- id: A4-003
  title: The site-wide focus indicator is 1.5:1 against the site's own paper, and form fields have no outline at all
  category: focus / non-text contrast
  what_i_observed: >
    manual (computed, not eyeballed). `--focus-ring` is
    `color-mix(in oklab, var(--gold-500) 55%, white)` (globals.css:98). Painted to a
    canvas and measured against each of the site's grounds:
      focus ring vs #ffffff (card/input surface): **1.58:1**
      focus ring vs --paper #fbfaf6:              **1.52:1**
      focus ring vs --paper-2 #f4efe6:            **1.38:1**
      focus ring vs --navy-800 (navy panels):      8.84:1  ← fine
    Worse for form fields specifically: `inputClasses` sets `focus:outline-none`
    (field-ui.tsx:9), which is a Tailwind utility and therefore beats the `@layer base`
    `:focus-visible { outline: 3px solid var(--focus-ring) }` rule (globals.css:265-269).
    Measured on a focused input: `outlineStyle: "none"`. The only remaining indicator is
    a `box-shadow` ring of that same 1.58:1 colour, plus a border that goes the wrong
    way: unfocused `--control-border` #6e7889 = **4.46:1** against white; focused
    `--gold-400` #d9b97f = **1.88:1**. The field's own boundary becomes *less* visible
    when it receives focus.
  evidence:
    type: measurement + code + screenshot
    detail: >
      audit/evidence/axe/A4-measurements-2.json → `nonText.ratios` (full table) and
      `nonText.focusedInput`: {"outlineStyle":"none","boxShadow":"… oklab(0.85155 …) 0px 0px 0px 3px",
      "borderColor":"rgb(217, 185, 127)"}.
      src/app/globals.css:98 (`--focus-ring`), :265-269 (the base rule);
      src/components/wizard/field-ui.tsx:7-12 (`inputClasses`, `focus:outline-none`);
      src/components/wizard/PhotoFields.tsx:239 (the same pattern, hand-copied).
      Screenshot: audit/evidence/screenshots/A4-focus-input-1280.png (1280 viewport,
      first field of /letter/getting-started, focused).
  confidence: MEASURED
  who_is_affected: >
    Everyone driving by keyboard, which includes people with tremor, RSI, low vision,
    switch users, and — importantly for this product — anyone using a laptop trackpad
    they can no longer aim well. Low-vision and older users are hit hardest: a 1.5:1
    pale-gold halo on ivory paper is, functionally, no halo. The audience is explicitly
    "aging grandparents becoming guardians".
  why_it_matters: >
    This is a 45-90 minute form across 15 screens. Losing your place in it is the
    difference between finishing and abandoning. The site got the hard part right —
    there IS one consistent focus style, applied everywhere — and then chose a colour
    that cannot be seen on 90% of the site's surface area.
  standard_reference: >
    WCAG SC 1.4.11 Non-text Contrast — Level AA (Understanding 1.4.11 explicitly covers
    "visual focus indicators"; threshold 3:1 against adjacent colours). SC 2.4.7 Focus
    Visible — Level AA (met in the letter, marginal in the spirit). Section 508 E205.4.
    WCAG 2.2 SC 2.4.13 Focus Appearance is AAA and is not claimed here.
  recommendation: >
    Make the ring navy on light grounds and keep the gold on navy grounds. Two edits.
    1. globals.css:264-269 — replace the base rule with:
       ```css
       :focus-visible {
         outline: 3px solid var(--navy-700);   /* measured 12.3:1 on white, 10.6:1 on --paper-2 */
         outline-offset: 2px;
         border-radius: 2px;
       }
       /* On the navy panels, invert: gold reads 8.8:1 there. */
       .tw-panel-navy :focus-visible,
       [style*="--navy-800"] :focus-visible {
         outline-color: var(--gold-400);
       }
       ```
       (the second selector is brittle; cleaner is to add a `tw-panel-navy` class to the
       three inline-gradient panels in SectionScreen.tsx:48-55, ReviewScreen.tsx:319-327
       and SampleViewer.tsx:107-114 so one selector covers all of them.)
    2. field-ui.tsx:7-12 — stop suppressing the outline. Replace:
       ```
       "text-base text-ink placeholder:text-faint focus:border-gold400 focus:outline-none " +
       "focus:shadow-[0_0_0_3px_var(--focus-ring)]"
       ```
       with:
       ```
       "text-base text-ink placeholder:text-faint focus-visible:border-navy700"
       ```
       so the shared `:focus-visible` outline paints. Apply the identical change to the
       hand-copied class string at PhotoFields.tsx:239.
    The gold halo can stay as decoration underneath the navy ring
    (`box-shadow: 0 0 0 6px var(--focus-ring)`) if the look matters — it is the
    *outline* that has to carry the 3:1.
    This is a token/utility change, not a change to the brand system: navy-700 is the
    brand primary and is already the button fill.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: >
    Under two hours including a visual pass over the navy panels. No ongoing cost. Add a
    contrast assertion to the e2e suite so the token cannot silently regress (axe will
    not catch it — see A4-016).
  effort: S
  risk_of_change: >
    Low, but it is visible on every screen, so it wants a designer's eye on the navy
    panels and the gold-gradient buttons before merge. `focus-visible` rather than
    `focus` avoids the mouse-click ring the current code was presumably avoiding.
  mission_impact: 4
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A4-004
  title: The gold gradient — the site's loudest call to action — carries text at 4.33:1
  category: contrast
  what_i_observed: >
    manual (computed). `--gradient-gold` is
    `linear-gradient(150deg, #e3c89b 0%, #c9a063 42%, #a87e45 78%, #c9a063 100%)`
    (globals.css:33-39). The `accent` button variant sets text to `--navy-900` #16223a
    over it (Button.tsx:57-58, 76-78). Against the gradient's darkest stop #a87e45 the
    measured ratio is **4.33:1**; the requirement for 15px/600 text is 4.5:1.
    Affected controls, measured on real pages:
      "Create your letter"            (home, page.tsx:243-249)
      "Share to help another family"  (home, ShareCard.tsx:56-64)
      "Start the special needs letter"/"Start the general letter" (the two big option
                                       cards, via PathChooser / StartButtons)
      "Send it to someone"            (review, ReviewScreen.tsx:225-234)
      "Download this PDF"             (sample viewer, SampleViewer.tsx:140-147)
    axe reported **none** of these. It cannot compute contrast against a gradient and
    returned them as `color-contrast` *incomplete* — 23 such items on the home page.
  evidence:
    type: measurement
    detail: >
      audit/evidence/axe/A4-measurements-2.json → `contrast_home`, `contrast_chooser`,
      `contrast_sample` — each row records fg `rgb(22, 34, 58)`, bg
      `gradient rgb(227,200,155) → rgb(201,160,99) → rgb(168,126,69) …`, `ratio: 4.33`,
      `needAA: 4.5`, `failsAA: true`.
      audit/evidence/axe/axe-A4-full.json → `route_` → incomplete `color-contrast` x23
      (the tool declining to judge).
      src/app/globals.css:33-39; src/components/ui/Button.tsx:57-58 and :74-78.
  confidence: MEASURED
  who_is_affected: >
    Low-vision users, users with reduced contrast sensitivity (near-universal past 65),
    anyone reading outdoors or on a dimmed phone at night. The failure is small in
    magnitude (4.33 vs 4.5) but it lands on the single control the whole page funnels to.
  why_it_matters: >
    A near-miss on the primary CTA is the most consequential kind of near-miss: it is the
    one element every user must find. It is also the one place where a conformance claim
    will be checked first.
  standard_reference: >
    WCAG SC 1.4.3 Contrast (Minimum) — Level AA. Section 508 E205.4; legacy §1194.22(c).
  recommendation: >
    Two options; the first is smaller and fixes it everywhere the gradient carries text.
    Option A (preferred) — lighten the gradient's darkest stop so the whole ramp clears
    4.5:1 against navy-900. globals.css:33-39:
    ```css
    --gradient-gold: linear-gradient(
      150deg,
      #e3c89b 0%,
      #c9a063 42%,
      #b28a4d 78%,   /* was #a87e45 — measured 4.89:1 against --navy-900 */
      #c9a063 100%
    );
    ```
    This stays inside the champagne-gold ramp (it sits between --gold-600 and --gold-500)
    and is a token correction, not a change to the brand system.
    Option B — leave the gradient alone and darken only the accent button's label.
    Button.tsx:58, change `text-navy900` to `text-[#101828]` (measured 4.85:1 against
    #a87e45). Narrower blast radius; introduces a one-off colour outside the token set.
    Whichever is chosen, do the same check on the two other places the gradient carries
    text or an important boundary: the 3px card top-rule (`.tw-card::before`,
    globals.css:389-395) is decorative and exempt; the progress bar
    (WizardRail.tsx:36-44) is `aria-hidden` with a text equivalent beside it and is also
    exempt. Neither needs changing.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: One token line. No ongoing cost.
  effort: S
  risk_of_change: >
    Option A shifts every gold gradient on the site by a few percent lightness — visible
    to a designer, invisible to anyone else, but it should be looked at rather than
    merged blind.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A4-005
  title: The sample documents are rendered as pictures of text that cannot be enlarged
  category: images of text / resize
  what_i_observed: >
    manual + automated. `/samples/<slug>` draws each PDF page onto a `<canvas>` with
    pdf.js (SampleViewer.tsx:56-79). On the 11-page sample I measured 11 canvases, each
    `role="img"` with `aria-label="Letter of Intent — for a loved one with disabilities,
    page N of 11"`, `textContent.length === 0`, and no `.textLayer` anywhere on the page.
    The whole page's readable text is 1,644 characters — the site chrome and the header
    panel, none of the document.
    Because the canvas is always sized to 100% of its column, browser zoom cannot enlarge
    the document text: the backing store is a fixed 1100px (`RENDER_WIDTH`,
    SampleViewer.tsx:24) and CSS scales it down to whatever the column is.
      at a 320px viewport: canvas 280 CSS px wide, scale 0.255,
        10pt body copy renders at an effective **4.58 CSS px**
      at 768px: canvas 707 CSS px, scale 0.642, effective **11.55 CSS px**
    axe returns zero violations here — a `role="img"` with a non-empty `aria-label` is
    exactly what `image-alt` asks for, so the rule passes while the content stays
    unreachable.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements.json → `sampleViewerDom`:
      {"canvasCount":11,"firstCanvas":{"role":"img","ariaLabel":"…, page 1 of 11",
      "textContentLength":0,"cssWidth":1104,"intrinsicWidth":1100},
      "bodyTextChars":1644,"hasTextLayer":false}.
      audit/evidence/axe/A4-measurements-3.json → `sampleCanvas_320`:
      {"cssWidth":280,"intrinsicWidth":1100,"scale":0.255,"effectiveBodyTextCssPx":4.58}.
      audit/evidence/axe/A4-measurements-4.json → `samplesAxe`: violations [] on both
      sample routes.
      src/components/samples/SampleViewer.tsx:22-24, :56-79.
  confidence: MEASURED
  who_is_affected: >
    Blind users and screen-reader users get "page 1 of 11" eleven times and nothing else.
    Low-vision users who rely on browser zoom get nothing — zoom does not help here, which
    is unusual and therefore surprising. Everyone on a phone gets 4.6px type. Also the
    special-needs-trust attorneys who refer families here and who will look at the sample
    before they recommend the tool.
  why_it_matters: >
    "See a sample" is one of only two secondary buttons in the hero. It answers the
    question that decides whether someone commits 90 minutes. The comment at
    SampleViewer.tsx:7-15 gives a good reason for drawing the PDF rather than linking it
    (browsers download PDFs unpredictably) — that reasoning is sound, and the fix is to
    add a text path alongside the picture, not to abandon the renderer.
  standard_reference: >
    WCAG SC 1.4.4 Resize Text — Level AA (text cannot be resized to 200% at all).
    SC 1.1.1 Non-text Content — Level A (the label identifies the image but does not
    convey its content; partially met at best). SC 1.4.5 Images of Text — Level AA
    (a faithful rendition of a printed document has a reasonable "essential" argument,
    which is why 1.4.4 is the cleaner citation). Section 508 E205.4; legacy §1194.22(a).
  recommendation: >
    Add a text rendition beside the picture, from data pdf.js already has.
    In SampleViewer.tsx's `draw()` loop, after `page.render(...)`, pull the text content
    and emit it as a visually-hidden-but-selectable block associated with the canvas:
    ```tsx
    const tc = await page.getTextContent();
    const text = tc.items.map(i => ("str" in i ? i.str : "")).join(" ")
                   .replace(/\s+/g, " ").trim();

    const sr = document.createElement("div");
    sr.id = `sample-page-${n}-text`;
    sr.className = "sr-only";
    sr.textContent = text;

    canvas.setAttribute("role", "img");
    canvas.setAttribute("aria-label", `${title}, page ${n} of ${doc.numPages}`);
    canvas.setAttribute("aria-describedby", sr.id);   // ties the words to the picture
    wrap.appendChild(sr);
    ```
    Then add one visible control above the pages — a `Disclosure` labelled
    "Read this sample as text" — that toggles `sr-only` off on those blocks, so a
    low-vision user gets real, zoomable, reflowing text at their own size. That single
    control resolves 1.4.4, completes 1.1.1, and costs one state variable.
    Do NOT rely on the "Download this PDF" button as the alternative: the PDF is itself
    untagged (see A4-006), and an alternative that is also inaccessible is not one.
  scope: current
  privacy_impact: >
    None. The sample PDFs are the project's own static assets in /public; `getTextContent`
    runs in the same pdf.js worker already loaded from `/pdf.worker.min.mjs`. No network,
    no third party, no user data.
  cost_and_maintenance: >
    3-6 hours including the toggle and its styling. Ongoing: none — the text is derived
    from the PDF at render time, so regenerating a sample regenerates its text.
    Watch the payload: the 11-page sample's text is a few tens of KB in the DOM, which is
    fine, but if samples grow to 30+ pages consider rendering the text block lazily per
    page.
  effort: M
  risk_of_change: >
    Low. Additive; the canvas path is unchanged. pdf.js `getTextContent` on a
    @react-pdf-generated file returns positioned runs with no reading-order guarantees,
    so the extracted text may occasionally interleave two columns of the emergency
    sheet. That is still far better than nothing, and worth stating in the toggle's
    helper text ("extracted from the PDF; layout may differ").
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A4-006
  title: The documents the tool produces are untagged PDFs with no declared language
  category: output document accessibility
  what_i_observed: >
    manual. Ran veraPDF 1.x (Java 21.0.12) with the PDF/UA-1 profile against the real
    generated output in audit/evidence/pdfs/. Both documents fail. Five rules fail on
    each:
      ISO 14289-1 **6.2-1**  — no MarkInfo/Marked true. The file is not a tagged PDF.
      ISO 14289-1 **7.1-11** — "StructTreeRoot entry is not present in the document
                                catalog". There is no logical structure at all.
      ISO 14289-1 **7.1-3**  — 288 content items in the letter (and the same class of
                                failure in the emergency sheet) are "neither marked as
                                Artifact nor tagged as real content".
      ISO 14289-1 **7.1-8**  — no XMP metadata stream.
      ISO 14289-1 **7.2-34** — natural language not determined for **198** text items in
                                the letter and **49** in the emergency sheet.
    Totals: letter 1225 passed / **489 failed** checks; emergency sheet 612 passed /
    **132 failed**.
    Root cause for the language failure is a missing prop: `<Document>` is constructed
    with `title`, `author`, `creator`, `producer` and no `language`
    (loi-document.tsx:249-254; emergency-document.tsx:158-162), and
    @react-pdf/renderer 4.5 does expose `language?: string` on `DocumentProps`
    (node_modules/@react-pdf/renderer/lib/react-pdf.browser.d.ts:53).
    Root cause for the tagging failure is the renderer: @react-pdf/renderer 4.5 has no
    structure-tree API at all — there is no prop, no escape hatch, in the type
    definitions.
  evidence:
    type: measurement + code
    detail: >
      veraPDF PDF/UA-1 machine-readable report (regenerate with:
      `& "C:\Users\patri\AppData\Local\verapdf\verapdf.bat" --flavour ua1 --format mrr
      <pdf>` with JAVA_HOME set to the portable JDK). Verbatim error strings quoted
      above, including "StructTreeRoot entry is not present in the document catalog" and
      "Content is neither marked as Artifact nor tagged as real content".
      Files checked: audit/evidence/pdfs/typical--Letter-of-Intent-Disabilities-2026-08-09.pdf
      and typical--Emergency-Information-Sheet-2026-08-09.pdf.
      src/lib/pdf/loi-document.tsx:249-254; src/lib/pdf/emergency-document.tsx:158-162.
  confidence: MEASURED
  who_is_affected: >
    Whoever has to read the document one day. That is the whole point of the artefact:
    a trustee, an adult sibling, a group-home manager, a school nurse, an ER charge
    nurse. Some of them are blind. Some of the *siblings* who inherit this role are
    themselves disabled — that is common in these families. Also anyone using a
    screen reader on a phone, and anyone whose reading software needs a language to pick
    a voice: with no /Lang, a screen reader reads an English letter in whatever the
    system default is, which for a Spanish-language household means English words read
    with Spanish phonemes.
  why_it_matters: >
    Under the governing hierarchy this is an accessibility issue about the *deliverable*,
    not the app — and by the audit's own bar ("what they produce must actually serve
    whoever has to read it someday") it is the most important item in this report after
    captions. The text IS present and extractable, so a screen reader will read
    *something*; what is missing is headings, reading order, table structure, and
    language. On the emergency sheet — a two-column layout — missing reading order is
    the difference between "ALLERGIES: penicillin" and a column-interleaved jumble in the
    one document that gets handed to an ER.
    Be honest about the split: **the language fix is one line and worth doing today. Full
    PDF/UA tagging is not reachable in this stack.**
  standard_reference: >
    ISO 14289-1 (PDF/UA-1) clauses 6.2, 7.1, 7.2 as cited. Mapped to WCAG for the
    produced content: SC 1.3.1 Info and Relationships (A), SC 1.3.2 Meaningful Sequence
    (A), SC 3.1.1 Language of Page (A). Section 508 E205.4 applies to "electronic
    content" the agency/organisation publishes; a document a member of the public
    generates for themselves is outside the letter of 508, which is exactly why this is
    reported as a quality-of-deliverable finding rather than a compliance one.
  recommendation: >
    Do the cheap, high-value half now.
    1. Add the language. loi-document.tsx:249-254 and emergency-document.tsx:158-162:
       ```tsx
       <Document
         title={`Letter of Intent — ${fullName}`}
         author={author ?? "Prepared with the Letter of Intent Builder"}
         creator={`Letter of Intent Builder — ${firm.name}`}
         producer={firm.name}
         language="en"                 // ← sets Catalog /Lang; clears veraPDF 7.2-34
       >
       ```
       That alone converts 198 + 49 = 247 failed checks to passes and is what makes a
       screen reader read the document in the right voice. Verify by re-running the
       veraPDF command above and confirming clause 7.2 test 34 no longer appears.
    2. Add a `contentAccessibility: true` permission if the code ever sets
       `ownerPassword`/permissions (it does not today) — noted so it is not lost later.
    3. Add one veraPDF assertion to whatever CI touches the PDF pipeline, asserting that
       clause 7.2-34 has zero failures. It will not pass ua1 overall; gate on the
       specific rule.
    Full tagging is a separate decision — see scope.
  scope: >
    architectural (for full PDF/UA); current (for the `language="en"` line, which is S
    effort and should not wait for the architectural decision).
    Architectural detail, since full tagging would need it:
    @react-pdf/renderer 4.5 cannot emit a structure tree — verified against its own
    type definitions, which expose no structure API. Reaching PDF/UA would mean either
    (a) replacing the PDF layer with pdf-lib + a hand-built StructTreeRoot, or
    (b) post-processing in the browser with a WASM tagging library, or
    (c) moving generation server-side to a tagging-capable engine.
    ONGOING COST: (a) is a rewrite of both documents' layout code and then permanent
    ownership of tag emission — realistically 3-6 weeks up front and a standing tax on
    every future layout change. (b) adds 1-3 MB of WASM to a bundle that this audience
    downloads on slow connections. 
    MAINTENANCE BURDEN: tags rot silently; nothing in the app would tell you they broke,
    so it needs the veraPDF gate in CI permanently.
    NEW FAILURE MODES: (a)/(b) risk producing a *worse* document (wrong tag nesting reads
    worse than no tags in some AT). (c) is disqualified outright — see privacy_impact.
  privacy_impact: >
    Options (a) and (b) are client-side and change nothing: no data leaves the device,
    no rewording of the promise, no new breach surface.
    Option (c) — server-side generation — is the one that would break the promise, and
    it should be rejected on that basis alone rather than costed. For completeness:
      What data would leave the device: the entire letter — diagnoses, medications,
        behavioural triggers, benefits status, the child's name and photograph.
      To where, and who could access it: whatever host ran the renderer; its operators,
        its logs, its crash reports, its hosting provider, and anyone with a subpoena to
        any of them.
      Whether it is opt-in, default-off, revocable: irrelevant — even an opt-in path
        makes "everything you type stays on your device" false as a blanket statement,
        and the promise is the product.
      What the core promise would have to be reworded to: something like "everything you
        type stays on your device unless you choose to generate a tagged PDF, in which
        case it is transmitted to our server and deleted after N minutes" — which no
        frightened parent at 11pm will parse correctly.
      What breach or subpoena exposure this creates: a single server-side incident would
        expose the medical and behavioural records of every family that used the feature.
        This is protected-health-information-shaped data about minors and disabled
        adults.
      Client-side alternative considered, and why it is insufficient: (a) and (b) above
        are sufficient. They are expensive, not impossible. There is no accessibility
        argument that justifies moving this data off the device.
  cost_and_maintenance: >
    `language="en"`: under 30 minutes including re-running veraPDF. No ongoing cost.
    Full tagging: see scope. My recommendation is to ship the language fix, add a plain
    sentence to the review page telling families the PDF is not screen-reader-structured
    and that the backup .json plus the on-screen reading view are the accessible copies,
    and revisit tagging only if @react-pdf/renderer gains structure support upstream.
  effort: S
  risk_of_change: >
    Setting `language="en"` is a metadata-only change; it cannot alter layout. Zero risk.
    (Note the hard-coded "en" is correct today — the UI is English-only — but if the tool
    is ever translated this must follow the UI language, not be assumed.)
  mission_impact: 4
  reach: 2
  harm_if_unfixed: 5
  environment: both
```

---

## TIER 2 — WCAG 2.2 AA (the additions that bite a long form)

```yaml
- id: A4-007
  title: The sticky masthead completely hides controls that have just received keyboard focus
  category: focus management
  what_i_observed: >
    manual. Loaded /letter/medical at 1280x900, scrolled to the bottom, then walked
    backwards with Shift+Tab and measured each stop against the sticky `<header>`
    (`position: sticky`, measured height 149px at 1280, 141px at 640, 81px at 320).
    Nine consecutive stops were overlapped; **four were entirely covered**:
      "+ Add a provider"      rect 101→145, header bottom 149, covered 44 of 44px — fully hidden
      "10 Benefits & money"   rect  61→105, covered 44 of 44px — fully hidden
      "09 Housing"            rect  15→ 59, covered 44 of 44px — fully hidden
      "08 School & work"      rect   0→ 44, covered 44 of 44px — fully hidden
      a textarea              rect -14→144, covered 144 of 158px — 91% hidden
    The mechanism: a browser only scrolls a focused element into view when it is outside
    the *layout* viewport. A sticky header overlays content, so an element the browser
    considers visible can be entirely behind it. The `scroll-margin-top` floor in
    globals.css:277-280 is scoped to `[id]` and does not apply to the buttons and links
    involved, and would not help anyway once the element is judged already-visible.
  evidence:
    type: measurement
    detail: >
      audit/evidence/axe/A4-measurements-2.json → `focusObscured` (9 entries, with
      rectTop / rectBottom / headerBottom / coveredPx / heightPx / fullyHidden per stop).
      Also A4-measurements.json → `reflow_*.headerHeight` and `headerPctOfViewport`
      (13% of a 320x640 phone; **32% of the 320x256 viewport that 400% zoom produces**).
      src/components/chrome/SiteHeader.tsx:56-59 (`sticky top-0`), :72-79 (the lockup at
      `h-[clamp(64px,19vw,124px)]`, which is what makes the header this tall).
  confidence: MEASURED
  who_is_affected: >
    Every keyboard-only user, on every backwards traversal — which is what people do
    constantly in a long form when they realise they mistyped the field above. Screen
    magnifier users are hit hardest because their viewport is a fraction of the screen
    and the header eats a proportionally larger share.
  why_it_matters: >
    "Where am I?" is the central cognitive cost of a 15-screen form. Losing the caret
    behind a masthead, silently, with no indicator (and see A4-003 — the indicator that
    would be there is 1.5:1 anyway) is precisely the compounding failure that ends a
    session at 11pm.
  standard_reference: >
    WCAG 2.2 SC 2.4.11 Focus Not Obscured (Minimum) — Level AA. New in 2.2, therefore
    outside the `wcag21aa` tag set the repo's e2e gate uses
    (e2e/a11y.spec.ts:7 — `["wcag2a","wcag2aa","wcag21a","wcag21aa"]`), and axe has no
    automated rule for it in any case.
  recommendation: >
    Reserve the header's height in the scroll port so the browser can never park focus
    underneath it. One property, in globals.css inside `@layer base`:
    ```css
    html {
      /* The sticky masthead is out of flow; tell the scroll port it is there so
         scroll-into-view (focus, anchors, find-in-page) stops behind it, not under it. */
      scroll-padding-top: calc(clamp(64px, 19vw, 124px) + 30px);
    }
    ```
    `scroll-padding` on the scroll container is the correct primitive here and it also
    subsumes the per-element `scroll-margin-top` hack at globals.css:277-280, which can
    then be deleted (it currently applies to *every* `[id]` on the page, which is a lot
    of unnecessary specificity).
    This fixes the case where the browser does scroll. For the case where it does not —
    element already judged visible — add a focus handler that nudges. In
    `src/app/layout.tsx` (or a small client component mounted once):
    ```tsx
    useEffect(() => {
      const onFocus = (e: FocusEvent) => {
        const el = e.target as HTMLElement | null;
        const header = document.querySelector("header");
        if (!el?.getBoundingClientRect || !header) return;
        const r = el.getBoundingClientRect();
        const h = header.getBoundingClientRect();
        if (r.top < h.bottom && r.bottom > h.top && !header.contains(el)) {
          window.scrollBy({ top: r.top - h.bottom - 12, behavior: "auto" });
        }
      };
      document.addEventListener("focusin", onFocus);
      return () => document.removeEventListener("focusin", onFocus);
    }, []);
    ```
    Use `behavior: "auto"` deliberately — `smooth` would fight the global
    `prefers-reduced-motion` override at globals.css:288-297.
    Verify by re-running the Shift+Tab sweep and asserting `fullyHidden` is empty; that
    is a good permanent e2e test and cheap to write.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: >
    Under two hours. The `scroll-padding-top` line is free. The focusin handler is ~15
    lines and should carry a test so nobody deletes it as mysterious.
  effort: S
  risk_of_change: >
    Low. `scroll-padding-top` also changes where in-page anchors land — which is the same
    thing globals.css:271-280 is already doing by hand, so behaviour should be checked
    against the ANCHOR_OFFSET reasoning in page.tsx:14-29 before merging. That comment
    block is the site's own record of how carefully this was tuned; do not stack the two.
  mission_impact: 4
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A4-008
  title: Autofill is switched off for the whole wizard, including the one field that is about the user
  category: form semantics / cognitive
  what_i_observed: >
    manual. The wizard form carries `autoComplete="off"` at the form level
    (SectionForm.tsx:86) and **no field anywhere carries an autocomplete token**.
    Measured across five sections; every field returns
    `autocomplete: null, effectiveAutocomplete: ""`. Examples from
    /letter/getting-started: `f-authorName` label "Your name", `f-authorRelationship`
    label "Your relationship to them", `f-subjectFullName`, `f-subjectPreferredName`,
    `f-letterDate`.
    SC 1.3.5 applies only to fields collecting information *about the user*. In this
    tool almost every field is about the person being cared for, not the author — so the
    scope of the strict failure is narrow: `f-authorName` (the parent's own name) is the
    clear one. That narrowness is worth stating plainly; the broader cost is cognitive,
    not conformance.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements.json → `autocomplete["getting-started"]`:
      {"formAutocomplete":"off","fieldCount":5,"fields":[…all with "autocomplete":null…]},
      and the same shape for about / family-and-support / medical / benefits-and-finances.
      src/components/wizard/SectionForm.tsx:85-90.
  confidence: MEASURED
  who_is_affected: >
    People with motor impairments and tremor, for whom every avoided keystroke matters;
    people with dyslexia or memory impairment who rely on the browser to spell their own
    name correctly; and anyone typing on a phone one-handed at midnight. Also relevant:
    some of these parents are themselves disabled.
  why_it_matters: >
    Modest on its own. It matters here because the governing hierarchy puts cognitive
    accessibility above clarity and design, and because the fix is genuinely contested on
    privacy grounds — which is why it needs the block below rather than a shrug.
  standard_reference: >
    WCAG 2.1/2.2 SC 1.3.5 Identify Input Purpose — Level AA (the `name` token from the
    WCAG "Input Purposes for User Interface Components" list).
  recommendation: >
    Add exactly one token, on exactly one field, and leave `autoComplete="off"` on
    everything else.
    In `src/lib/content/types.ts` add an optional `autocomplete?: string` to `ScalarField`;
    in `src/lib/content/sections/01-getting-started.ts` set `autocomplete: "name"` on the
    `authorName` field; in SectionForm.tsx:143-152, pass it through:
    ```tsx
    <input
      id={id}
      type={field.kind === "tel" ? "text" : field.kind}
      autoComplete={field.autocomplete ?? "off"}
      …
    />
    ```
    and the same in the textarea branch at :134-141 and the repeater branch at :260-293.
    Do NOT add tokens to `subjectFullName`, the contacts repeater, the medical providers,
    or anything else — those are about a third party, 1.3.5 does not reach them, and
    tokens there would invite the browser to store a disabled child's name and a doctor's
    phone number in an autofill profile.
    A caveat I could not resolve here and would not want acted on blind: modern Chrome
    ignores `autocomplete="off"` for name- and address-shaped fields when deciding what
    to *save*. If that is true on this site, the current attribute is already providing
    less protection than the code implies. Confirming that is a 20-minute test with a
    real (non-headless) Chrome profile; it should be done before anyone relies on
    `autocomplete="off"` as a privacy control anywhere.
  scope: current
  privacy_impact: >
    Required, because this recommendation changes what a browser may retain.
      What data would leave the device: nothing is transmitted by this change. What
        changes is that the browser is invited to read from, and may write to, its own
        autofill profile — the author's own name only. If the user has browser sync
        enabled (Chrome Sync, iCloud Keychain, Firefox Sync), that profile entry may be
        synchronised to their own vendor account.
      To where, and who could access it: the user's own browser vendor, under the user's
        own account, subject to that vendor's terms. Not to this site, not to the firm,
        not to any endpoint under the project's control. The value is the *author's own
        name*, which they have already given that vendor a hundred times.
      Whether it is opt-in, default-off, and revocable: it is neither opt-in nor
        default-off — it is a hint the browser may act on. It is revocable in the
        browser's own autofill settings, not here. This asymmetry is the honest weakness
        of the recommendation.
      What the core promise would have to be reworded to: nothing. "Everything you type
        stays on your device" remains true — no data reaches a third party through this
        site. If the owner wants belt and braces, the privacy page (section 04) could
        gain one sentence: "Your browser's own autofill may remember your name, the way
        it does on any website. Nothing about the person you are writing about is ever
        offered to it."
      What breach or subpoena exposure this creates: none on this project's side. The
        exposure is the user's existing browser-sync exposure, unchanged in kind.
      Client-side alternative considered, and why it is insufficient: I considered
        recommending nothing at all and accepting the 1.3.5 gap, on the grounds that one
        field is a small prize. That remains a defensible choice and I would not
        overrule an owner who made it. I also considered pre-filling `authorName` from
        the zustand store on return visits — which is already effectively what persistence
        does — and that does NOT satisfy 1.3.5, which is about programmatic identification
        of purpose, not about convenience.
  cost_and_maintenance: >
    Under two hours including the type change. No ongoing cost. Guard it with a unit test
    asserting that exactly one field in the whole content set carries an autocomplete
    token, so a future contributor cannot sprinkle them onto the child's fields.
  effort: S
  risk_of_change: Low mechanically; the judgement call is the privacy trade above.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A4-009
  title: The emergency contact must be typed again after already being entered and flagged
  category: redundant entry / cognitive
  what_i_observed: >
    manual (code). In "Family & support" the `contacts` repeater collects name,
    relationship, phone, email, role, notes **and a checkbox** — and the fixture data
    shows that checkbox is `emergency: true`. Immediately below it, a separate free-text
    field asks the same question again:
      id: "firstCall", kind: "text",
      label: "Who would you call first in an emergency?",
      placeholder: "e.g., My sister Dana — she can be there in 15 minutes"
    (03-family-support.ts:52-57). There is no way to pick from the contacts already
    entered; the user retypes the name, and usually the number, that they entered a
    moment earlier. The emergency sheet then prints `info.firstCall` verbatim
    (emergency-document.tsx:319-321).
  evidence:
    type: code
    detail: >
      src/lib/content/sections/03-family-support.ts:52-57 (the field, quoted above);
      the same file's `contacts` repeater with its `emergency` checkbox;
      e2e/fixture.ts:66-86 shows the resulting duplication in practice —
      `contacts[0] = {name:"Dana Alvarez", phone:"(703) 555-0142", emergency:true}` and
      `firstCall: "Dana — (703) 555-0142"`.
      src/lib/pdf/emergency-document.tsx:317-321 (where firstCall is consumed).
  confidence: INSPECTED
  who_is_affected: >
    People with memory impairment, ADHD, brain fog, or fatigue — which is a fair
    description of most people writing this document. Also anyone using a screen reader
    or voice input, for whom re-entry is disproportionately expensive.
  why_it_matters: >
    Small in isolation. It is here because it is the one place in a 25-section schema
    where the tool asks twice, and because the data model already has the answer — the
    `emergency` checkbox. Fixing it removes a keystroke burden *and* removes a class of
    error where the two answers disagree and the emergency sheet prints the stale one.
    That last part is a safety issue in the document that goes to the ER.
  standard_reference: >
    WCAG 2.2 SC 3.3.7 Redundant Entry — Level AA. Honest caveat: 3.3.7 says "required to
    be entered again", and nothing in this tool is required — every field is optional by
    design. A strict reading therefore gives a pass. I am reporting it as
    Partially Supports because the spirit of the criterion is exactly this situation and
    because the fix is small.
  recommendation: >
    Make `firstCall` selectable rather than retyped. Two options, smallest first.
    Option A (no schema change): when the contacts repeater has at least one entry, render
    a row of buttons above the `firstCall` input that fill it:
    ```tsx
    // in SectionForm's ScalarControl, for a field carrying `fillFrom: "contacts"`
    {suggestions.length > 0 && (
      <div className="mt-2 flex flex-wrap gap-2">
        <span className="sr-only" id={`${id}-suggest`}>Fill from someone you already added</span>
        {suggestions.map(c => (
          <button key={c.id} type="button"
            aria-describedby={`${id}-suggest`}
            onClick={() => form.setValue(field.id, `${c.name}${c.phone ? ` — ${c.phone}` : ""}`,
                                         { shouldDirty: true })}
            className={buttonClasses("secondary", "min-h-11")}>
            {c.name}
          </button>
        ))}
      </div>
    )}
    ```
    where `suggestions` is `form.watch("contacts")` filtered to items with a name, with
    the `emergency`-checked ones first. This satisfies 3.3.7's "available for the user to
    select" without removing the free-text field, which people will still want for the
    "she can be there in 15 minutes" part.
    Option B: drop `firstCall` entirely and derive the emergency sheet's "CALL FIRST"
    line from the first contact whose `emergency` checkbox is ticked. Cleaner data model;
    loses the sentence of context; would need a migration path for existing backups. I
    would not do this.
  scope: current
  privacy_impact: >
    None. Everything stays in the same client-side form state; nothing new is stored and
    nothing is transmitted.
  cost_and_maintenance: >
    Option A is 3-5 hours including making `fillFrom` a declarative field property so it
    is reusable. Ongoing: one more content-schema concept to understand.
  effort: M
  risk_of_change: >
    Low, but it touches SectionForm, which is the most load-bearing component in the app
    and has its own unit test file (SectionForm.test.tsx). Extend that.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A4-010
  title: The question-set chooser announces itself as tabs but does not behave as tabs
  category: ARIA pattern / name-role-value
  what_i_observed: >
    manual (accessibility tree, not markup). On /letter the two buttons carry
    `role="tab"` and `aria-controls="question-set"` inside a
    `role="tablist" aria-label="Which set of questions"` (PathChooser.tsx:137-167).
    Verified in Chrome's real accessibility tree via CDP `Accessibility.getFullAXTree`:
      {role:"tablist", name:"Which set of questions"}
      {role:"tab", name:"Disability & special needs 15 SECTIONS", selected:true,  controls:"question-set", focusable:true}
      {role:"tab", name:"Aging & general care 14 SECTIONS",       selected:false, controls:"question-set", focusable:true}
    Three things are missing:
      1. **There is no tabpanel.** `#question-set` exists but
         `role: null, aria-labelledby: null, tabindex: null` — measured. Both tabs point
         `aria-controls` at an element that is not a tabpanel, so the relationship a
         screen reader announces leads nowhere.
      2. **Arrow keys do nothing.** Focused the first tab, pressed ArrowRight, measured
         `aria-selected` before and after: `["true","false"]` → `["true","false"]`,
         focus unmoved. The ARIA tab pattern's whole keyboard contract is arrow-key
         traversal.
      3. **No roving tabindex.** Neither tab sets `tabindex`, so both are separate Tab
         stops — the opposite of the pattern.
    axe reports zero violations on this page: `aria-required-children` and friends do not
    fire because the tablist's children *are* tabs; nothing in axe checks that a
    tabpanel exists or that arrow keys work.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-ax-tree.json → `/letter` (the three nodes quoted above).
      audit/evidence/axe/A4-measurements-2.json → `tabKeyboard`:
      {"before":["true","false"],"after":{"selected":["true","false"],
      "focused":"Disability & special needs 15 SECTIONS"},"arrowKeyMovesSelection":false};
      `tabPanel`: {"exists":true,"role":null,"labelledby":null,"tabindex":null}.
      src/components/letter/PathChooser.tsx:137-167 (tablist and tabs), :169 (the div
      that should be the panel).
  confidence: MEASURED
  who_is_affected: >
    Screen-reader users, who are told "tab, 1 of 2, selected" — a promise about how the
    control works — and then find that the documented interaction does not work. That is
    worse than an unlabelled button, because an unlabelled button at least does not lie.
  why_it_matters: >
    This is the screen where a family decides which of the two letters they are writing.
    Getting stuck here means not starting at all.
  standard_reference: >
    WCAG SC 4.1.2 Name, Role, Value — Level A (role announced does not match behaviour
    or structure). SC 2.1.1 Keyboard — Level A (the pattern's expected keys are
    inoperable; mitigated by both tabs being Tab-reachable and Enter-activatable).
    W3C ARIA Authoring Practices, Tabs pattern.
  recommendation: >
    Either complete the pattern or drop it. Dropping it is cheaper and, for this audience,
    better.
    **Preferred — drop the ARIA, keep the buttons.** In PathChooser.tsx:137-167 remove
    `role="tablist"`, `aria-label="Which set of questions"`, `role="tab"`,
    `aria-selected` and `aria-controls`, and replace them with a plain toggle-button
    group that says what it means:
    ```tsx
    <div className="…" role="group" aria-label="Which set of questions">
      {LETTER_PATHS.map(p => (
        <button key={p.id} type="button"
          aria-pressed={tab === p.id}
          onClick={() => pick(p.id)}
          className={…}>
          …
        </button>
      ))}
    </div>
    ```
    `aria-pressed` is announced as "pressed"/"not pressed", is honest about Tab-then-Enter
    being the interaction, and needs no arrow keys. Then give the region it changes a
    live announcement so the change is not silent:
    ```tsx
    <div id="question-set" aria-live="polite">…</div>
    ```
    (polite, not assertive — this is not an emergency.)
    **If the tab pattern is kept instead**, all three of these are required: put
    `role="tabpanel"` + `aria-labelledby={idOfSelectedTab}` + `tabIndex={0}` on
    `#question-set`; give each tab a stable `id`; implement roving tabindex
    (`tabIndex={on ? 0 : -1}`) plus an `onKeyDown` handling ArrowLeft/ArrowRight/Home/End
    that moves focus *and* selection. That is materially more code than option one for no
    user gain.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: >
    The preferred option is ~1 hour and *removes* code. The tab-pattern option is 4-6
    hours and adds a keyboard state machine to maintain.
  effort: S
  risk_of_change: >
    Low. The repo's own gate exercises this component
    (e2e/a11y.spec.ts:28-34 uses `getByRole("tab", …)`), so that selector must change to
    `getByRole("button", …)` in the same commit or the suite goes red.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 3
  environment: both

- id: A4-011
  title: "You are here" and "this section has notes" are carried by colour alone, both under 3:1
  category: use of colour / non-text contrast
  what_i_observed: >
    manual (computed). In the wizard rail (WizardRail.tsx:54-109) the current section is
    distinguished from the others by, and only by, colour. Measured the two states:
      current: bg rgb(247,238,223) (--gold-100), text rgb(26,34,51), border-left
               rgb(201,160,99) (--gold-500) at 2px, fontWeight 400, no underline
      other:   bg transparent,     text rgb(58,68,86),  border-left transparent,
               fontWeight 400, no underline
    Ratios: --gold-500 left border against --gold-100 = **2.10:1**; --gold-100 tint
    against the white card = ~1.1:1. The "has notes" dot is --gold-500 on white =
    **2.42:1**.
    Non-visual users are fine — `aria-current="page"` is set (WizardRail.tsx:72) and the
    dot has a `sr-only ", has notes"` sibling (:99). It is the *sighted* low-vision and
    colour-deficient user who has nothing.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements-3.json → `currentMarker`:
      {"current":{"bg":"rgb(247, 238, 223)","borderLeftColor":"rgb(201, 160, 99)",
      "borderLeftWidth":"2px","fontWeight":"400","textDecoration":"none"},
      "other":{…"fontWeight":"400","textDecoration":"none"},"hasAriaCurrent":true,
      "differsOnlyByColour":true}.
      audit/evidence/axe/A4-measurements-2.json → `nonText.ratios`:
      "rail current border --gold-500 on --gold-100": 2.1,
      "rail 'has notes' dot --gold-500 on white": 2.42.
      src/components/wizard/WizardRail.tsx:70-101.
  confidence: MEASURED
  who_is_affected: >
    Users with any degree of colour-vision deficiency (about 1 in 12 men) and anyone with
    reduced contrast sensitivity. Gold-on-cream is one of the harder pairs for deuteranopia.
  why_it_matters: >
    The rail is the only map of a 15-section document. "Which of these have I done?" is
    the question that decides whether someone comes back on Thursday.
  standard_reference: >
    WCAG SC 1.4.1 Use of Color — Level A (information conveyed by colour alone).
    SC 1.4.11 Non-text Contrast — Level AA (the dot is a graphical object required to
    understand the content, at 2.42:1 against 3:1 required).
  recommendation: >
    Add a non-colour difference to each. Both are one-line changes in WizardRail.tsx.
    1. Current section — make it bolder as well as tinted (:73-78):
       ```tsx
       current
         ? "border-gold500 bg-gold100 text-ink font-semibold"
         : "border-transparent text-body hover:bg-paper2 hover:text-ink"
       ```
       Weight is the cheapest non-colour signal and does not disturb the layout because
       the row already has a fixed min-height.
    2. "Has notes" — replace the coloured dot with the house glyph, which has a shape:
       ```tsx
       <span aria-hidden="true" className="tw-diamond tw-diamond--sm shrink-0" />
       <span className="sr-only">, has notes</span>
       ```
       and darken it for contrast by giving `.tw-diamond--sm` in this context
       `background: var(--gold-700)` (#8a6a38, which measures 4.3:1 on white — above the
       3:1 threshold with margin). A rotated square reads as different-from-nothing even
       in greyscale; a same-hue dot does not.
    Leave `aria-current` and the `sr-only` text exactly as they are — they are correct.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: Under an hour. No ongoing cost.
  effort: S
  risk_of_change: Very low; contained to one component.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 3
  environment: both

- id: A4-012
  title: In Windows High Contrast Mode, form fields have no visible focus indicator at all
  category: forced colors / focus
  what_i_observed: >
    manual (forced-colors emulation, Chromium `forcedColors: "active"`). Compared each
    control's computed style unfocused vs focused, in both modes:
      forced-colors ACTIVE, `<input>`:
        unfocused → outline `none 3px rgb(0,0,0)`, box-shadow `none`, border rgb(0,0,0)
        focused   → outline `none 3px rgb(55,0,110)`, box-shadow `none`, border rgb(55,0,110)
      forced-colors ACTIVE, `<a>`:
        unfocused → outline `none 3px rgb(0,0,159)`
        focused   → outline **`solid` 3px rgb(55,0,110)**  ← a real ring
    So links keep a focus ring in HCM and inputs lose theirs entirely. The cause is the
    same `focus:outline-none` in `inputClasses` identified in A4-003: with the outline
    suppressed and `box-shadow` forced to `none` by forced-colors mode, the only
    remaining difference is a 1px border colour change from #000000 to #37006E — a
    measured **1.39:1** between the two, i.e. indistinguishable.
    Everything else in HCM holds up well: gradients are stripped, the navy panels become
    system-coloured, all text remains legible. Screenshots confirm it.
  evidence:
    type: measurement + screenshot
    detail: >
      audit/evidence/axe/A4-measurements-3.json → `focusDelta_active` and
      `focusDelta_none` (full before/after per control type, quoted above).
      Screenshots at 1280: audit/evidence/screenshots/A4-forcedcolors-home-1280.png,
      A4-forcedcolors-section-1280.png, A4-forcedcolors-review-1280.png,
      A4-forcedcolors-chooser-1280.png, A4-forcedcolors-focused-input-1280.png.
      src/components/wizard/field-ui.tsx:9; src/components/wizard/PhotoFields.tsx:239.
  confidence: MEASURED
  who_is_affected: >
    Windows High Contrast / Contrast Themes users — overwhelmingly people with low vision,
    and disproportionately older users, which is this audience. HCM is often the *first*
    accommodation an ageing user finds, long before they try a screen reader.
  why_it_matters: >
    An HCM user filling in 15 sections cannot see which box they are typing into. This is
    a harder failure than A4-003 (which is "faint") — this is "absent".
  standard_reference: >
    WCAG SC 2.4.7 Focus Visible — Level AA (no visible indicator in this mode).
    SC 1.4.11 Non-text Contrast — Level AA. Section 508 E205.4.
  recommendation: >
    The A4-003 fix resolves this as a side effect, because removing `focus:outline-none`
    lets the base `:focus-visible` outline paint, and forced-colors mode maps an outline
    to the system Highlight colour automatically.
    If for any reason A4-003 is not taken, this narrower fix stands alone — add to
    globals.css inside `@layer base`:
    ```css
    @media (forced-colors: active) {
      input:focus-visible,
      textarea:focus-visible,
      select:focus-visible {
        outline: 3px solid Highlight;
        outline-offset: 2px;
      }
    }
    ```
    Verify by re-running with `forcedColors: "active"` and asserting the focused
    `outlineStyle` is `solid`.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: >
    Zero if A4-003 is taken. Otherwise 30 minutes. Worth an e2e assertion either way —
    Playwright supports `forcedColors: "active"` on a context, so this is a
    five-line test.
  effort: S
  risk_of_change: None.
  mission_impact: 4
  reach: 1
  harm_if_unfixed: 5
  environment: both

- id: A4-013
  title: Focus is dropped to <body> on every section change, and the 17-link rail cannot be skipped
  category: focus management / bypass blocks
  what_i_observed: >
    manual. Two measurements on the wizard:
    1. Route change. From /letter/getting-started, activated the "Next: …" link and
       measured the active element after navigation:
       {"url":"/letter/about","activeTag":"BODY","isBody":true,"scrollY":0,
        "title":"About your loved one — Letter of Intent Builder"}.
       Focus returns to `<body>` on every one of the 14 section transitions. The page
       title updates correctly, which is the mitigating half.
    2. Bypass. The wizard rail (`<nav aria-label="Letter sections">`, 15 section links
       plus 2 rail links) is rendered **inside** `<main>`
       (letter/[slug]/layout.tsx:19-22, `railInsideMain: true` measured). The skip link
       targets `#main`, which sits before the rail. Activating the skip link and then
       counting Tab presses to the first form control on /letter/medical:
       **18 tab stops**, ending on "+ Add a provider".
    So a keyboard-only user without AT does: Tab (skip link) → Enter → 18 × Tab → start
    typing. Fourteen times.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements.json → `routeChangeFocus` (quoted above) and
      `tabOrder` (the full 44-stop sweep of /letter/medical showing rail links at
      positions 6-22).
      audit/evidence/axe/A4-measurements-4.json → `skipToFirstField`:
      {"n":18,"tag":"BUTTON","inForm":true,"text":"+ Add a provider"};
      `skipLinkTarget`: {"mainTabindex":"-1","railInsideMain":true}.
      src/app/layout.tsx:94-105 (skip link and `<main id="main" tabIndex={-1}>`);
      src/app/letter/[slug]/layout.tsx:16-23; src/components/wizard/WizardRail.tsx:54-62.
  confidence: MEASURED
  who_is_affected: >
    Keyboard-only users without a screen reader — switch users, people with tremor or
    RSI, people navigating from a wheelchair-mounted keyboard. Screen-reader users have a
    partial escape (the `nav[aria-label="Letter sections"]` landmark is jumpable, which
    is a WCAG-sufficient technique — ARIA11 — so 2.4.1 is technically met for them).
  why_it_matters: >
    252 avoidable keypresses across a full letter, before any typing. That is the kind of
    cost that does not fail a checklist and does end a session.
  standard_reference: >
    WCAG SC 2.4.1 Bypass Blocks — Level A. Honest position: the landmark satisfies the
    letter of 2.4.1 via ARIA11, so I am recording Partially Supports, not a failure.
    SC 2.4.3 Focus Order — Level A is arguable for the route-change behaviour; WCAG has
    no SC that squarely governs focus after client-side navigation, and I am not going to
    invent one. This is reported primarily as an operability defect with a WCAG hook, not
    as a clean conformance failure.
  recommendation: >
    Two independent, small changes.
    1. Move focus to the section heading on navigation. In SectionScreen.tsx, give the
       `<h1>` (line 60) a ref and `tabIndex={-1}`, and focus it when `def.slug` changes:
       ```tsx
       const heading = useRef<HTMLHeadingElement>(null);
       useEffect(() => { heading.current?.focus(); }, [def.slug]);
       …
       <h1 ref={heading} tabIndex={-1} className="… outline-none">…</h1>
       ```
       This is the standard SPA remedy: it announces the new section to a screen reader
       *and* puts a keyboard user's next Tab inside the content rather than at the top of
       the masthead. Guard it so it does not fire on first mount if you want to avoid
       stealing focus on a cold load — `useRef(true)` sentinel.
    2. Add a second skip link that clears the rail. In letter/[slug]/layout.tsx, before
       the `<aside>`:
       ```tsx
       <a href="#section-form"
          className="sr-only focus:not-sr-only focus:absolute focus:z-40 focus:rounded-md focus:bg-surface focus:px-4 focus:py-3 focus:text-ink focus:shadow-lg">
         Skip to the questions
       </a>
       ```
       and put `id="section-form"` with `tabIndex={-1}` on the content column div at
       line 22. Both skip links then read as a pair, which is a familiar idiom.
    Note the interaction with A4-007: once focus moves to the `<h1>`, the sticky-header
    fix must already be in place or the heading itself lands behind the masthead.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: 2-4 hours for both, including a keyboard e2e assertion.
  effort: M
  risk_of_change: >
    Moderate for change 1 — moving focus programmatically is the kind of thing that feels
    wrong if it fires at the wrong moment (e.g. on a back-navigation, or on the first
    load of a bookmarked section). It needs testing on a real screen reader, not just in
    Playwright. e2e/keyboard.spec.ts already has the harness for it.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 3
  environment: both

- id: A4-014
  title: The share button copies a link and tells nobody it did
  category: status messages / feedback
  what_i_observed: >
    manual. `useCopyLink` returns `{ copied, copyLink, share }` and maintains a `copied`
    flag that reverts after 2400ms (useCopyLink.ts:12, 24-27). `ShareCard` destructures
    only `share` (ShareCard.tsx:24) and never reads `copied`. On a browser without
    `navigator.share`, `share()` silently falls through to `copyLink()`
    (useCopyLink.ts:29-39).
    Measured in Chromium desktop, where `navigator.share` is absent:
      hasNativeShare: false
      button label before: "SHARE TO HELP ANOTHER FAMILY"
      button label after:  "SHARE TO HELP ANOTHER FAMILY"   (unchanged)
      live-region content before: ""   after: ""            (unchanged)
    Nothing visual changes, nothing is announced, and the clipboard write can also fail
    silently (the `catch` at useCopyLink.ts:20-23 deliberately swallows it).
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements-4.json → `share`:
      {"hasNativeShare":false,"textBefore":"SHARE TO HELP ANOTHER FAMILY",
      "textAfter":"SHARE TO HELP ANOTHER FAMILY","labelChanged":false,
      "liveBefore":"","liveAfter":"","liveChanged":false}.
      src/components/share/useCopyLink.ts:11-42; src/components/share/ShareCard.tsx:24, 56-64.
  confidence: MEASURED
  who_is_affected: >
    Everyone on a desktop browser without a native share sheet (Firefox, most desktop
    Chrome). Screen-reader users additionally, because even if a visual change were added
    they would need the live region.
  why_it_matters: >
    Strictly, SC 4.1.3 is not failed — 4.1.3 governs status messages that *are* presented
    visually, and here nothing is presented at all. So this is a plain operability defect
    that happens to hurt AT users most. It matters because the whole "pass it along"
    section — a growth mechanism the owner clearly cares about — ends in a button that
    appears to do nothing.
  standard_reference: >
    WCAG SC 4.1.3 Status Messages — Level AA (would apply once feedback exists; today
    the criterion is not triggered because there is no status message to expose).
    SC 3.2.2 On Input is not implicated.
  recommendation: >
    Use the state the hook already computes, and announce it.
    ShareCard.tsx:24 and :56-64:
    ```tsx
    const { share, copied } = useCopyLink();
    …
    <button type="button" onClick={() => void share()} …>
      <ShareIcon />
      {copied ? "Link copied" : "Share to help another family"}
    </button>
    <p aria-live="polite" className="sr-only">
      {copied ? "Link copied to your clipboard." : ""}
    </p>
    ```
    Do the same wherever else `useCopyLink` is consumed. Also stop swallowing the
    clipboard failure blind — useCopyLink.ts:20-23 should set a `failed` flag so the UI
    can fall back to showing the URL as selectable text; "the link is on screen either
    way" is true on the home page and not true everywhere the hook is used.
    Keep the live region `polite` and `sr-only`; the visible label change carries it for
    everyone else.
  scope: current
  privacy_impact: >
    None. `SHARE_URL` is the public site URL and carries nothing from the letter — that
    is already asserted on screen at ShareCard.tsx:83-85 and is true in the code.
  cost_and_maintenance: Under an hour.
  effort: S
  risk_of_change: Very low.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A4-015
  title: The video's custom key handler swallows Space, which is how the native control bar is operated
  category: keyboard
  what_i_observed: >
    manual. VideoPlayer.tsx:128-153 attaches `onKeyDown` to the `<video>` element and
    calls `e.preventDefault()` for Space, k, ArrowLeft/Right, j, l, Home, End and the
    digits. Chrome's native control bar lives in the video's shadow DOM; key events from
    its buttons bubble to the `<video>` host, where this handler sees them.
    Dispatched real KeyboardEvents at the focused video and measured `defaultPrevented`:
      " "     → **defaultPrevented: true**   (and `dispatchEvent` returned false)
      "Enter" → defaultPrevented: false
      "f"     → defaultPrevented: false
    So a keyboard user who Tabs into the control bar, reaches Fullscreen (or Mute, or
    Captions once A4-001 lands) and presses **Space** — the standard activation key for a
    button — gets play/pause instead of the control they are on. Enter still works.
    The owner has reported the fullscreen button as broken with an unknown cause. This is
    a mechanism that would produce exactly that report for a keyboard user, and it is
    measured. **I could not reproduce a mouse-driven fullscreen failure** and do not
    claim one: the `onClick` guard at VideoPlayer.tsx:119-126 exempts the bottom 58px,
    which should cover Chrome's ~40px control bar, and Playwright cannot reliably click
    inside the media-controls shadow DOM to test it. Treat the mouse case as unresolved.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements-2.json → `videoKeys`:
      {"log":[{"key":" ","defaultPrevented":true,"notCancelled":false},
              {"key":"Enter","defaultPrevented":false},
              {"key":"f","defaultPrevented":false}],
       "controls":true,"tabIndex":0,"fullscreenEnabled":true,"hasRequestFullscreen":true}.
      src/components/home/VideoPlayer.tsx:128-153 (the handler), :119-126 (the click guard),
      :203-215 (the element, with `controls` and `tabIndex={0}`).
      NOTE on build state: when I began, VideoPlayer.tsx was uncommitted and this was a
      local-only observation. It is now committed at HEAD b243107 (`git status -- src/`
      clean), so it is a normal code finding. **Whether b243107 is deployed I did not
      test** — if production still serves the older posterless player, the handler there
      may differ and this should be re-checked against whatever is live.
  confidence: MEASURED
  who_is_affected: >
    Keyboard-only users of the video, and anyone using a screen reader (which routes
    Space to activate the focused control).
  why_it_matters: >
    Small reach — one video on one page. It is included because it is a concrete,
    measured mechanism behind a bug the owner already knows about and could not explain,
    and because it will get worse once a captions button exists on that same control bar.
  standard_reference: >
    WCAG SC 2.1.1 Keyboard — Level A (a control that is reachable but not operable by its
    standard key). SC 2.1.4 Character Key Shortcuts — Level A is also engaged: `k`, `j`,
    `l` and the digits are single-character shortcuts with no way to turn off or remap
    them. They are scoped to the focused `<video>`, which is the "active only on focus"
    exception, so 2.1.4 is met — worth noting so nobody "fixes" it unnecessarily.
  recommendation: >
    Only handle keys that actually landed on the video itself, not on its shadow controls.
    VideoPlayer.tsx:128-131:
    ```tsx
    const onKeyDown = (e: React.KeyboardEvent<HTMLVideoElement>) => {
      const v = videoRef.current;
      if (!v) return;
      // Events from the native control bar bubble out of the shadow DOM and
      // retarget to the <video> host. Only claim the keys when the video element
      // itself is what has focus — otherwise Space steals activation from
      // whichever control (fullscreen, mute, captions) the user has tabbed to.
      if (document.activeElement !== v) return;
      …
    ```
    That single guard restores Space on every native control while keeping the shortcuts
    for someone who focused the video frame.
    Consider also dropping `k`/`j`/`l`/digits entirely: they replicate YouTube muscle
    memory that this audience does not have, and each one is a key the browser might
    want. ArrowLeft/ArrowRight/Space are the ones worth keeping.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: Under an hour.
  effort: S
  risk_of_change: >
    Low. Worth verifying by hand in a real browser with a real control bar — the
    shadow-DOM retargeting behaviour is engine-specific and my evidence is synthesised
    events in Chromium, not a genuine Tab-into-the-control-bar traversal, which Playwright
    cannot perform.
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 2
  environment: local (verified at HEAD b243107; deployment state to production untested)

- id: A4-016
  title: The project's own accessibility gate is structurally blind to the brand's two signature surfaces
  category: process / test coverage
  what_i_observed: >
    manual + automated. e2e/a11y.spec.ts asserts zero axe violations on 5 routes, all 25
    section slugs, and 3 interaction states, using
    `["wcag2a","wcag2aa","wcag21a","wcag21aa"]` (a11y.spec.ts:7). It passes. My own run
    across 19 states — adding `wcag22aa`, the open modal, the mobile menu, the video
    playing, many simultaneous validation errors, the busy download state, the emotional
    gate, the PDF sample viewer, and 320px reflow — also reports **zero violations**.
    Both are true and neither is reassuring, because:
      1. **Gradients defeat the contrast rule.** axe returned `color-contrast`
         *incomplete* 23× on the home page, 24× on the review page, 22× with the mobile
         menu open, 21× at 320px. Every navy panel and every gold-gradient button is in
         that set. A4-004 lives entirely inside those "incomplete" results.
      2. **The 2.2 tag was never included**, so SC 2.4.11 (A4-007), 3.3.7 (A4-009) and
         2.5.8 were outside the assertion — though axe has no automated rule for 2.4.11
         or 3.3.7 anyway.
      3. **The sample viewer route is not in the gate's list at all.** `/samples/<slug>`
         appears nowhere in a11y.spec.ts. When I ran axe there it also passed — because a
         `<canvas role="img">` with a label is exactly what the rules want (A4-005).
      4. **No forced-colors run, no computed focus-indicator check.** A4-003 and A4-012
         are invisible to every automated rule that exists.
    This is the ordinary ceiling of automated testing — roughly a third of real issues —
    landing on a project that has done the automated part unusually well.
  evidence:
    type: axe + code
    detail: >
      e2e/a11y.spec.ts:7 (the tag list), :20 (the route list — no /samples), :28-69.
      audit/evidence/axe/axe-A4-full.json — all 19 result sets; every `violations: []`;
      `incomplete` counts per state as quoted.
  confidence: MEASURED
  who_is_affected: >
    Indirectly, everyone — this is why the six Tier-1 findings above survived to
    production.
  why_it_matters: >
    A green gate that cannot see the two colours the brand is built from will keep being
    green while contrast regresses. The cheapest durable win in this report is turning
    each fixed finding into an assertion.
  standard_reference: >
    Not a WCAG criterion. WCAG-EM 1.0 (Website Accessibility Conformance Evaluation
    Methodology) §Step 4, which requires manual evaluation alongside tooling.
  recommendation: >
    Four additions to e2e/a11y.spec.ts and one new spec. In priority order:
    1. Add `"wcag22aa"` to `WCAG_TAGS` at a11y.spec.ts:7 and add `/samples/<slug>` for
       each entry in SAMPLE_DOCS to the route loop at :20.
    2. Fail on `incomplete` for `color-contrast` rather than ignoring it — or better,
       assert the specific token ratios directly, since the tokens are the real contract:
       ```ts
       test("brand tokens meet contrast thresholds", async ({ page }) => {
         await page.goto("/");
         const ratios = await page.evaluate(() => { /* the canvas-readback helper */ });
         expect(ratios["--focus-ring on --paper-2"]).toBeGreaterThanOrEqual(3);
         expect(ratios["navy-900 on gradient darkest stop"]).toBeGreaterThanOrEqual(4.5);
       });
       ```
       The helper is in my scratch script and is ~15 lines; the pattern is: paint the
       colour to a 1×1 canvas over white, read the pixel, compute relative luminance.
       This is the only way to test a gradient.
    3. Add a forced-colors project to playwright.config.ts:
       `{ name: "forced-colors", use: { ...devices["Desktop Chrome"], forcedColors: "active" } }`
       and one test asserting a focused `<input>` has `outlineStyle === "solid"`.
    4. Add a 2.4.11 test: scroll to the bottom of /letter/medical, Shift+Tab 40 times,
       assert no focused element is fully covered by the sticky header. My measurement
       loop is directly reusable.
    5. Add a veraPDF check on the generated PDF asserting zero failures for ISO 14289-1
       clause 7.2 test 34 (see A4-006).
  scope: current
  privacy_impact: None — all test-only.
  cost_and_maintenance: >
    1-2 days for all five. Ongoing: a forced-colors Playwright project roughly doubles
    that spec's runtime; scope it to 3-4 representative routes rather than all 25
    sections. The veraPDF check needs Java on CI, which is the only real new dependency.
  effort: L
  risk_of_change: >
    None to users. Some risk of a flaky forced-colors suite if it is pointed at every
    route; keep it narrow.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 3
  environment: both
```

---

## TIER 3 — Selected AAA, with the cost of reaching it

These are reported for completeness and are **not** recommended wholesale. Where a AAA
criterion is nearly met and cheap, I say so; where it would cost the brand or the tone,
I say that too.

```yaml
- id: A4-017
  title: "AAA 1.4.6 Contrast (Enhanced) — not met, and reaching it would cost the brand"
  category: contrast (AAA)
  what_i_observed: >
    automated + manual. axe with `["wcag2aaa","wcag21aaa","wcag22aaa"]`:
      /                  color-contrast-enhanced, serious, **28 nodes**
      /letter/medical    color-contrast-enhanced, serious, **44 nodes**
      /letter/review     color-contrast-enhanced, serious, **122 nodes**
    My own computed pass, which unlike axe can see the gradients, found the recurring
    near-misses to be the site's supporting text on cream: `--ink-muted` #5e6878 and
    `--ink-faint` #646d7b on `--paper-2` #f4efe6 measure **4.92:1** — comfortably above
    the 4.5:1 AA threshold, well below the 7:1 AAA one. The privacy strip, the footer
    fine print, the attorney-advertising notice and most helper text are all in this band.
  evidence:
    type: axe + measurement
    detail: >
      audit/evidence/axe/axe-A4-full.json → `aaa_`, `aaa_letter_medical`,
      `aaa_letter_review` (node counts above).
      audit/evidence/axe/A4-measurements-2.json → `contrast_section` /
      `contrast_review` / `contrast_privacy` — 27, 12 and 21 AAA-only rows respectively,
      worst 4.92:1, zero AA failures on those routes.
      src/app/globals.css:76-81 (the `--ink-faint` comment already records a deliberate
      darkening to clear 4.5:1 "because the audience is older caregivers").
  confidence: MEASURED
  who_is_affected: Users with more significant low vision than AA anticipates.
  why_it_matters: >
    The gap is genuinely small — 4.92 against 7.0 — and the project has already made the
    deliberate move once (the `--ink-faint` comment is evidence of exactly this thinking).
    But closing it means most secondary text becomes near-black on cream, which
    eliminates the typographic hierarchy the design depends on. Given the audience I
    would take a *partial* step and no more.
  standard_reference: WCAG SC 1.4.6 Contrast (Enhanced) — Level AAA.
  recommendation: >
    Do not pursue AAA globally. Do consider two targeted moves:
    (a) Raise `--ink-muted` from #5e6878 to about #4c5666 (≈6.2:1 on --paper-2). Still
        visibly secondary, meaningfully more readable, no hierarchy lost.
    (b) Leave `--ink-faint` where it is; it is already the product of this exact
        judgement.
    COST OF FULL AAA: every secondary text token would collapse toward --ink-900, the
    gold accent text (`--accent-text` #7d5f31) could not be used for links on cream at
    all (it is a 4.5:1 colour by construction), and the navy panels' `--on-ink-body`
    #c3ccdd would have to lighten to near-white. That is a redesign, and the brand system
    is explicitly off the table. Estimated 2-4 weeks of design plus a full visual
    regression pass, for a benefit that (a) alone delivers most of.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: (a) is under two hours plus a design review. Full AAA: see above.
  effort: S
  risk_of_change: Low for (a); very high for full AAA.
  mission_impact: 1
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A4-018
  title: "AAA 2.5.5 Target Size (Enhanced) — met for buttons, not for inline links"
  category: target size (AAA)
  what_i_observed: >
    manual. At a 375px viewport, measured every `a[href]`, `button`, `input`, `select`,
    `textarea` and `[role=button]`. Every standalone control is ≥44px in its smaller
    dimension — the `min-h-11` discipline in Button.tsx:24-28, field-ui.tsx:8 and
    WizardRail.tsx:74 is applied consistently and it works. What falls short is inline
    text links inside sentences:
      "How it works"           74.5 × 15px   (privacy strip, every page)
      "Learn more."            83.4 × 19px   (home hero)
      "download a backup file" 161.3 × 19px  (/letter)
      "(703) 745-5565"         109.9 × 19px  (/your-data)
      "contact@trustsandwealth.com" 212.1 × 19px
    All of these are exempt from the **AA** criterion 2.5.8 under its "inline" exception,
    which is why A4 records 2.5.8 as Supports. AAA 2.5.5 has no such generous exception
    path for these.
  evidence:
    type: measurement
    detail: >
      audit/evidence/axe/A4-measurements.json → `targetSize` per route (five routes;
      `<24px` counts of 3/3/2/2/7, all of them inline links or the visually-hidden skip
      link and file input).
  confidence: MEASURED
  who_is_affected: Users with tremor, limited dexterity, or large fingers on a small phone.
  why_it_matters: >
    Low. These are all secondary links with a nearby larger equivalent (the footer
    repeats Privacy, the phone number is also a full-width footer row). The AA criterion
    is met, which is the standard that matters.
  standard_reference: WCAG SC 2.5.5 Target Size (Enhanced) — Level AAA (44×44 CSS px).
  recommendation: >
    Do not chase this. Padding inline links to 44px tall would break the line rhythm of
    every paragraph on the site, and the paragraph text is the product. If one thing is
    worth doing: give the phone and email links on /your-data and /privacy a `block`
    `min-h-11` treatment on narrow viewports only (`max-sm:flex max-sm:min-h-11
    max-sm:items-center`), because those are the two a distressed user taps in a hurry.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: Under an hour for the narrow phone/email tweak.
  effort: S
  risk_of_change: Low.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both

- id: A4-019
  title: "AAA 3.1.5 Reading Level — met everywhere except the Medical section"
  category: reading level (AAA)
  what_i_observed: >
    manual. Computed Flesch–Kincaid grade and Flesch Reading Ease over `<main>` on eight
    routes:
      /                          FK  7.0   ease 74.6
      /letter                    FK  8.0   ease 68.6
      /letter/getting-started    FK  7.8   ease 63.7
      /letter/medical            FK **10.8**  ease **48.8**
      /letter/behavioral-support FK  8.0   ease 66.8
      /letter/final-wishes       FK  7.7   ease 66.3
      /letter/review             FK  7.2   ease 68.3
      /privacy                   FK  8.0   ease 69.5
    3.1.5 asks that text requiring reading ability beyond lower secondary (≈ grade 9)
    have a supplement. Seven of eight routes are already under it — which for a document
    about special needs trusts is genuinely good writing. Only /letter/medical exceeds,
    and inspection suggests it is driven by unavoidable domain nouns
    ("caregiver", "specialists", "medications", "emergency protocol") rather than by
    convoluted sentences: its average sentence length (17.7 words) is the same as
    /privacy's, which scores 8.0.
  evidence:
    type: measurement
    detail: >
      audit/evidence/axe/A4-measurements-3.json → `readingLevel` (words, sentences,
      avgWordsPerSentence, fleschKincaidGrade, fleschReadingEase per route).
      Caveat on method: readability formulae penalise polysyllabic nouns regardless of
      familiarity. "Medications" is a word every parent in this audience uses daily and
      the formula treats it as hard. Treat 10.8 as a flag to look, not a verdict.
  confidence: MEASURED
  who_is_affected: >
    Readers with dyslexia, cognitive disabilities, limited literacy, or English as an
    additional language.
  why_it_matters: >
    The site is already doing the AAA-shaped work voluntarily and well. The finding is
    worth recording mainly as evidence that the plain-language commitment is real and
    measurable, and to point at the one page that drifted.
  standard_reference: WCAG SC 3.1.5 Reading Level — Level AAA.
  recommendation: >
    Do not restructure the section. Two sentences in the /letter/medical intro carry most
    of the weight; splitting them at the semicolons would likely bring the score under 9
    with no loss of meaning. The section already has the two best 3.1.5 supplements
    available — per-field helper text and a "See an example" disclosure on most
    questions — so the criterion's own supplement route is effectively already taken.
    If a broader step is ever wanted, the highest-value one is not simplification but a
    short plain-language summary at the top of each section, which the `def.intro`
    field already structurally supports.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: An hour of editing.
  effort: S
  risk_of_change: None mechanically; it is a copy change and wants the owner's voice.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A4-020
  title: "AAA 3.3.5 Help — context-sensitive help is unusually strong; the gap is a human route from inside the form"
  category: help (AAA)
  what_i_observed: >
    manual. Per-field help is pervasive and correctly associated: every scalar field with
    a `help` string renders `<p id="{id}-help">` and the input carries
    `aria-describedby` pointing at it (field-ui.tsx:62-66, SectionForm.tsx:121, 138, 149).
    Many fields add a "See an example" disclosure with a real sample answer
    (field-ui.tsx:79-90). The chooser previews every question before you start
    (PathChooser.tsx:253-276). Placeholders are illustrative, not label-substitutes.
    That is a stronger 3.3.5 posture than most AA sites achieve.
    The gap: from inside a section, there is no route to a person. Measured every page's
    contact mechanisms — `tel:` and `mailto:` appear in the footer on all 8 routes tested,
    and additionally in `<main>` on /privacy and /your-data only. From /letter/medical at
    11pm, the phone number is at the very bottom of a long page.
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/axe/A4-measurements-3.json → `consistentHelp` (per-route contact
      mechanisms with their landmark, plus the footer link set).
      src/components/wizard/field-ui.tsx:47-93; src/components/wizard/SectionForm.tsx:113-154;
      src/components/chrome/SiteFooter.tsx:64-83.
  confidence: MEASURED
  who_is_affected: >
    Anyone who gets stuck: cognitive disabilities, first-time users, and — the specific
    case this product exists for — someone who has hit a question they cannot face.
  why_it_matters: >
    The "Final wishes" emotional gate (SectionScreen.tsx:116-140) shows the team already
    thinks about the moment someone stalls. Extending that thinking to "here is a person
    you can call" is a small step with real weight for this audience.
  standard_reference: >
    WCAG SC 3.3.5 Help — Level AAA. (The AA criterion 3.2.6 Consistent Help is **met** —
    the footer contact block is in the same relative order on every page measured.)
  recommendation: >
    Add one quiet line to the wizard rail, below `RailLinks` (WizardRail.tsx:111-128):
    ```tsx
    <p className="mt-4 border-t border-line pt-4 text-[0.9375rem] text-muted">
      Stuck on a question? You can skip it, or call {firm.shortName} at{" "}
      <a href={firm.phoneHref} className="underline underline-offset-[3px]">{firm.phone}</a>.
      No charge, no pressure.
    </p>
    ```
    It appears in both the desktop rail and the mobile `<details>` because both render
    `RailLinks`. Keep it below the section list so it never competes with navigation.
    Do NOT add a chat widget or a support form: the first is a third party (privacy), the
    second asks a frightened person to type into a box that goes somewhere.
  scope: current
  privacy_impact: >
    None as specified — a `tel:` link initiates a call from the user's own device and
    sends nothing. Explicitly rejecting the alternatives that would not be free: a chat
    widget would load third-party script onto pages where the letter is in the DOM, which
    is a direct threat to the core promise and should not be proposed.
  cost_and_maintenance: Under an hour.
  effort: S
  risk_of_change: Very low.
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 1
  environment: both
```

---

## What I examined, and what I could not

### Examined

**Automated.** axe-core 4.12 via @axe-core/playwright, Chromium build 1234, against
`http://localhost:3000` (dev server already running; not restarted). 19 result sets, raw
JSON at `audit/evidence/axe/axe-A4-full.json`:

- Static routes with `wcag2a wcag2aa wcag21a wcag21aa wcag22aa`: `/`, `/letter`,
  `/privacy`, `/your-data`, `/letter/review`, and (in a later pass, with the correct
  slugs) `/samples/letter-of-intent-disabilities`, `/samples/emergency-sheet-disabilities`.
- **Post-interaction states the repo's gate never enters**: mobile menu open at 390px;
  the delete confirmation modal open; the video playing (the `<video>` element only
  exists after the poster button is pressed); a section with three repeater rows and
  every validated field populated with bad data and blurred; the photo-fields section;
  the "Final wishes" emotional gate both before and after acknowledgement; the review
  page with a full letter; the review page mid-download with every button disabled;
  320px reflow on the two densest routes.
- AAA-only pass (`wcag2aaa wcag21aaa wcag22aaa`) on three routes.

**Manual.** Everything below was performed and recorded, not assumed:

- Keyboard traversal of /letter/medical (44 forward stops recorded with tag, name,
  position, computed outline and box-shadow) and a 40-stop backwards Shift+Tab sweep for
  SC 2.4.11.
- Skip-link function; tab-stop count from skip-link activation to first form control.
- Focus behaviour across a client-side route change.
- Modal dialog: open state, `:modal`, accessible name source, focus placement, Escape,
  focus restoration to the trigger.
- **Real accessibility tree** via CDP `Accessibility.getFullAXTree` on six page states —
  roles, computed names with `nameFrom` source, descriptions, and the `invalid`,
  `required`, `selected`, `controls`, `describedby`, `modal`, `live` properties.
  (`page.accessibility.snapshot()` no longer exists in Playwright 1.62; CDP is the
  substitute and is the browser's own tree.)
- Form semantics: label association, `aria-describedby` resolution to real elements,
  `autocomplete` on every field of five sections, required indication, error
  identification and its exposure in the AX tree, live-region inventory.
- Colour contrast **computed** by painting each declared colour (including `color-mix`,
  `oklab` and gradient stops) to a 1×1 canvas and reading the sRGB pixel, then computing
  relative luminance — for text on seven routes and for 13 named non-text pairs.
- Reflow: 320×640, 640×512 (200% of 1280×1024) and 320×256 (400% of 1280×1024), on six
  routes, checking `scrollWidth` vs `clientWidth` and enumerating any element extending
  past the client width. **All clean.**
- SC 1.4.12 text-spacing override (line-height 1.5, letter-spacing 0.12em, word-spacing
  0.16em, paragraph spacing 2em) on four routes, checking for horizontal scroll and for
  clipped content. **All clean** — the only "clipped" element is the intentionally
  1×1 `sr-only` skip link.
- `prefers-reduced-motion: reduce` emulated: zero elements with a running animation or a
  transition longer than 50ms; `scroll-behavior: auto`. **Clean.**
- Windows High Contrast simulated via `forcedColors: "active"`: four full-page
  screenshots plus a focused-control comparison in both modes.
- Orientation at 400×800 and 800×400.
- Target size at 375px across five routes.
- Consistent-help mechanism inventory across eight routes.
- Reading level (Flesch–Kincaid, Flesch Reading Ease) over `<main>` on eight routes.
- Video: track count, text tracks, duration, transcript search, key-event interception.
- Heading hierarchy, landmark structure (both raw DOM and visible-only, at 1280 and 800),
  page titles and `lang` on seven routes.
- **veraPDF 1.x PDF/UA-1** (Java 21.0.12 portable) against the real generated letter and
  emergency sheet in `audit/evidence/pdfs/`.
- Read in full: `layout.tsx`, `page.tsx`, `globals.css`, `SectionForm.tsx`,
  `field-ui.tsx`, `SectionScreen.tsx`, `WizardRail.tsx`, `letter/[slug]/layout.tsx`,
  `ReviewScreen.tsx`, `DataControls.tsx`, `RestoreFlow.tsx`, `PhotoFields.tsx`,
  `Dialog.tsx`, `Disclosure.tsx`, `Button.tsx`, `SiteHeader.tsx`, `SiteFooter.tsx`,
  `PrivacyStrip.tsx`, `SaveIndicator.tsx`, `VideoPlayer.tsx`, `SampleViewer.tsx`,
  `samples/[doc]/page.tsx`, `SampleDocuments.tsx`, `ShareCard.tsx`, `useCopyLink.ts`,
  `PathChooser.tsx`, `validation.ts`, `pdf/generate.tsx`, both PDF documents,
  `e2e/a11y.spec.ts`, `e2e/keyboard.spec.ts`, `e2e/fixture.ts`, `playwright.config.ts`.

### Could not examine, and why

- **No real screen reader.** Everything about roles, names, states and live regions comes
  from Chrome's accessibility tree, which is what NVDA/JAWS/VoiceOver consume but is not
  the same as hearing them. Specifically unverified: whether the nine per-field
  `aria-live="polite"` wrappers (one per `FieldShell`, plus the save indicator) produce a
  usable experience or a chatty one when several hints appear at once; whether the throttled
  "Your work is saved on this device." lands at a helpful moment; and whether the
  `aria-current="page"` rail is announced the way I assume. **This is the largest single
  gap in this audit** and it is the thing I would buy first.
- **Chromium only.** No Firefox, no Safari, no WebKit. `:focus-visible` heuristics,
  forced-colors handling, native date-input semantics and `<dialog>` behaviour all differ
  across engines. The forced-colors findings in particular are emulated Chromium, not a
  real Windows Contrast Theme.
- **No real touch device and no real mobile screen reader** (TalkBack, VoiceOver iOS).
  Given how much of this audience is described as "on a phone at midnight", that gap is
  material.
- **Production was not tested for this audit.** Everything is local dev. That is the
  correct authority for code-level findings per the brief, and nothing in A4's scope
  (privacy, headers, third parties) required production. Note the consequence for
  A4-015: the video player was uncommitted when I started and is committed at `b243107`
  now, but **I did not verify what is actually deployed**. If production still serves the
  older posterless player, A4-015 and the video half of A4-001/A4-002 need re-checking
  against the live bundle before anyone reports them as production defects. The caption
  and transcript findings themselves are about a media asset, not the player, and hold
  either way.
- **The repository was a moving target.** HEAD changed from `d5ec230` to `b243107` during
  this audit and one of my observations went stale as a result (see the build-state note
  at the top). I re-verified the headline measurements afterwards, but I did not re-run
  the full 19-state axe sweep, the reflow matrix, or the veraPDF pass against the new
  HEAD. The changed files were the home page and the video player, none of which touch
  the wizard, the review page, the sample viewer or the PDF pipeline — so I do not expect
  drift, but I have not proved its absence.
- **The mouse path to the video's fullscreen button is unresolved.** Playwright cannot
  click reliably inside the media-controls shadow DOM. I have a measured keyboard
  mechanism (A4-015) and no evidence at all about the mouse case. Do not read A4-015 as
  a complete explanation of the owner's report.
- **Chrome's real autofill save behaviour** with `autocomplete="off"` — asserted from
  general knowledge in A4-008 and flagged there as needing a 20-minute test in a
  non-headless profile before anyone relies on the attribute as a privacy control.
- **Cognitive walkthrough with actual users.** Nothing here substitutes for watching a
  tired parent try to finish this. Several findings (A4-009, A4-013, A4-020) are
  reasoned from the artefact, not observed.
- **The attorney review-pack** (`scripts/review-doc/`) was not examined — out of scope
  per the brief and flagged as in-flight.

---

## Three highest-confidence findings

1. **A4-006 — the generated PDFs are untagged and have no declared language.** veraPDF is
   a reference implementation of ISO 14289-1 and it returned verbatim errors: "StructTreeRoot
   entry is not present in the document catalog"; 198 text items with no determined natural
   language in the letter, 49 in the emergency sheet; 489 failed checks total. The cause of
   the language half is a missing prop I confirmed exists in the installed package's own
   type definitions. There is no interpretation in this finding.
2. **A4-003 / A4-012 — the focus indicator.** Ratios of 1.58 / 1.52 / 1.38 against the
   site's three light grounds, computed from the actually-painted colour, plus a measured
   `outlineStyle: "none"` on focused inputs and a measured before/after showing the
   indicator vanishing in forced-colors mode. Reproducible in three lines and visible in
   `A4-focus-input-1280.png`.
3. **A4-007 — focus obscured by the sticky masthead.** Four keyboard stops measured as
   100% covered (44 of 44 CSS px) with the exact rects and the header's own bounds
   recorded. SC 2.4.11 is unambiguous about "entirely hidden".

## Three least-confident findings

1. **A4-015 — the video key handler.** MEASURED for what it measures (`Space` is
   `defaultPrevented`), but the bridge from that to "the fullscreen button is broken" is
   inference: I synthesised KeyboardEvents rather than genuinely tabbing into Chrome's
   shadow-DOM control bar, which Playwright cannot do. Shadow-DOM event retargeting is
   engine-specific. The mouse path is entirely untested. Verify by hand before acting.
2. **A4-009 — redundant entry.** INSPECTED, not measured, and the standards position is
   genuinely arguable: SC 3.3.7 says "required to be entered again", and this tool
   requires nothing. I have recorded it as Partially Supports rather than a failure, and a
   reviewer who marks it Supports is not wrong.
3. **A4-005's severity, and A4-019.** For A4-005 the measurements are solid but the WCAG
   mapping is contestable — 1.4.5's "essential" exception has a real argument for a
   faithful rendition of a printed document, which is why I leaned on 1.4.4 instead.
   For A4-019, Flesch–Kincaid is a blunt instrument that penalises "medications" as
   though it were jargon; the 10.8 score on /letter/medical is a flag to look at, not a
   finding I would defend as a defect.

## What I would need in order to be more certain

1. **One session each with NVDA + Firefox, JAWS + Chrome, and VoiceOver + Safari**, walked
   through: start → getting-started → a repeater section with a validation error → the
   emotional gate → review → download. Roughly a day. It would confirm or kill my
   assumptions about the nine live regions, the save announcement, and the `aria-current`
   rail, and it is the only way to know whether the wizard is *pleasant* to use with AT
   rather than merely conformant.
2. **TalkBack on a real Android phone and VoiceOver on a real iPhone**, at 375px, on the
   same path. Half a day. This audience is disproportionately mobile.
3. **A real Windows machine with a Contrast Theme active** to confirm A4-012 outside
   emulation, and to check the gold gradient and the navy panels under a light-on-dark
   theme rather than the default dark-on-light one. Two hours.
4. **Firefox and Safari runs** of the reflow, text-spacing, focus-visible and
   `<dialog>` checks. Half a day. `:focus-visible` heuristics differ enough between
   engines that A4-003's fix should be verified in all three.
5. **A non-headless Chrome profile test** of what the browser actually saves from a form
   marked `autocomplete="off"` — the open question in A4-008, and the one place where an
   accessibility recommendation and the privacy promise touch.
6. **Two or three moderated sessions** with people in the actual audience — a parent with
   low vision, an adult sibling using a screen reader, someone with a cognitive
   disability — attempting to finish a letter. Nothing in this report tells you whether
   they can.
