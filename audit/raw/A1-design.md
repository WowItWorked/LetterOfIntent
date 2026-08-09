# A1 — Visual Design and Craft

Analyst A1. Working blind to other analysts. Analysis only; no application file was modified.

Environments used:
- **Local dev** `http://localhost:3000` — authoritative for code-level findings and file:line citations.
- **Production** `https://myletterofintent.com` — authoritative for what families actually receive. All rendered
  measurements below were taken on production unless stated.

Tooling note: the Bash tool was unavailable for this entire session (classifier outage). I used PowerShell,
Grep/Glob/Read, and in-page JavaScript in the browser pane instead. This cost me the ability to run Playwright
and `@axe-core/playwright`, so **no axe run appears in this report** — I wrote my own contrast scanner instead
and I flag its limitations honestly where they bite.

---

## Headline: the design system is half-adopted, and the half that was dropped is the half that governs reading

The token file (`src/app/globals.css`) is unusually good. It is commented, it explains its own reasoning, and it
has already had accessibility work done to it by hand (`--ink-faint` at line 77-81 is a brand grey deliberately
darkened to clear 4.5:1, with the rationale written down; `--control-border` at line 83 is tuned to 3:1). That is
better discipline than most commercial design systems have.

But the tokens are only obeyed for **colour, radius and shadow**. For **type size, line-height, letter-spacing,
spacing and measure** the token scale is not merely bypassed — it is referenced **zero times in the entire
component tree**.

Measured, source tree (`src/**/*.tsx`, 41 files):

| Token family | Defined | `var(--…)` references in components | Distinct ad-hoc values used instead |
|---|---|---|---|
| `--fs-*` font size | 12 | **0** | 31 (`text-[…]`, 145 occurrences) |
| `--lh-*` line height | 5 | **0** | 15 (`leading-[…]`, 70 occurrences) |
| `--ls-*` letter spacing | 5 | **0** | 16 (`tracking-[…]`, 68 occurrences) |
| `--space-1…10` | 10 | **0** | 13 ad-hoc px + 17 Tailwind default steps (384 uses) |
| `--measure` (66ch) | 1 | **0** | 13 distinct `max-w-[Nch]` values |
| `--radius-*` | 6 | **67** | 0 — fully disciplined |
| `--shadow-*` | 5 | 1 + focus ring | 0 — fully disciplined |
| colour | ~55 | via `@theme inline` utilities | 11 raw hex in TSX (6 off-palette) |

Measured, **production built CSS** (single stylesheet, 63,313 bytes, fetched from the live origin):

| Property | Distinct values in built CSS | Tokens defined | Ratio |
|---|---|---|---|
| `font-size` | 41 | 12 | 3.4× |
| `line-height` | 34 | 5 | 6.8× |
| `letter-spacing` | 22 | 5 | 4.4× |
| `max-width` | 26 | 2 | 13× |
| `padding` / `margin` / `gap` | 23 / 32 / 20 | 10 | ~7× |
| `border-radius` | 7 | 6 | **1.2× ✓** |
| `box-shadow` | 4 | 5 | **0.8× ✓** |
| distinct hex colours | 58 | ~55 | **1.05× ✓** |

The two tables agree, which is the point: radius, shadow and colour land at ~1:1 with the token set; type,
rhythm and measure land at 3–13×. This is not sloppiness everywhere — it is a specific, bounded, fixable gap.

**Why this matters for the parent at 11pm, concretely.** The stated audience skews older and exhausted. The
single most likely future request is "make the body text a bit bigger" or "give the reading text more air."
Today that is not a token change — it is 145 edits across 31 files, and because five different line-heights are
attached to the same 15px size, there is no single place where "body text" is even defined. The system cannot be
tuned for the people it is for. That is the real cost, not the tidiness.

There is also a *shadow scale* hiding in the code that deserves naming rather than scolding: the ad-hoc px
rhythm values in use are 3, 5, 7, 9, 11, 15, **18, 22, 26, 30, 34, 38**, 62 — the run from 18 upward is a clean
+4 sequence. The author clearly has a consistent instinct; it simply never got written into the token file, and
it does not match `--space-*` (4, 8, 12, 16, 24, 32, 48, 64, 96, 128) at any point. The fix is to promote the
scale that is actually being used, not to force the components onto the one that lost.

---

## Findings

```yaml
- id: A1-001
  title: Type, rhythm and measure tokens are defined but referenced zero times; the reading experience cannot be tuned in one place
  category: design-system-consistency
  what_i_observed: >
    globals.css defines 12 font sizes, 5 line-heights, 5 letter-spacings, 10 spacing steps and a 66ch measure.
    Across all 41 component files there are zero occurrences of var(--fs-*), var(--lh-*), var(--ls-*),
    var(--space-*) or var(--measure). In their place: 145 arbitrary text-[…] values (31 distinct), 70
    leading-[…] (15 distinct), 68 tracking-[…] (16 distinct), 13 distinct max-w-[Nch] measures, and 384 uses of
    Tailwind's own default spacing scale across 17 steps. The production built CSS confirms the drift: 41
    distinct font-size, 34 line-height, 22 letter-spacing, 26 max-width declarations. By contrast radius and
    shadow ARE used through var() (67 references) and land at 1.2x and 0.8x the token count respectively, and
    colour lands at 1.05x — so the discipline exists in this codebase, it just was not applied to type.
  evidence:
    type: measurement + code
    detail: >
      PowerShell regex census over src/**/*.tsx. Built-CSS census by fetching the single production stylesheet
      and counting distinct declaration values. Token definitions at src/app/globals.css:102-142. Representative
      near-duplicates that prove drift rather than intent: text-[0.9375rem] (74 uses) vs text-[15px] (1) vs
      text-[0.95rem] (4) vs text-[0.98rem] (1) — four spellings of "small body"; text-[13px] vs
      text-[0.8125rem]; text-[10px] vs text-[0.625rem]. Twelve distinct clamp() display sizes exist for what is
      functionally two roles (page heading, section heading), e.g. clamp(1.85rem,5.5vw,3rem),
      clamp(1.75rem,5vw,2.75rem), clamp(1.7rem,4vw,2.25rem), clamp(1.9rem,3.4vw,2.5rem).
  confidence: MEASURED
  who_is_affected: >
    Indirectly every user, via the maintainer. Directly, older and low-vision users, because the most valuable
    future change for them — a global increase in body size and leading — is currently uncosted and risky.
  why_it_matters: >
    The product's core audience is described as exhausted, often older caregivers. The one adjustment most
    likely to help them cannot be made systemically. A 145-site edit will not be attempted at 11pm, so it will
    not be attempted at all.
  standard_reference: >
    No WCAG SC — this is a maintainability and design-system integrity finding. It is the enabling constraint
    for WCAG 2.2 SC 1.4.4 (Resize Text) and 1.4.12 (Text Spacing) work later.
  recommendation: >
    Do NOT mass-refactor 145 call sites; that is high-risk, low-reward churn on a working site. Instead, in
    this order: (1) Promote the scale that is actually in use — add the 18/22/26/30/34/38 rhythm and the four
    real body sizes to globals.css as named tokens, and delete or comment out the --space-* steps that nothing
    uses, so the file stops lying about what governs the site. (2) Add a fluid display scale token set
    (--fs-display-1/2/3) covering the twelve clamp() variants, which collapse to about three real roles.
    (3) Introduce two utility classes, .prose-body and .prose-lead, that own font-size + line-height + measure
    together, and adopt them only in newly touched files. (4) Add a lint rule (eslint-plugin-tailwindcss
    no-arbitrary-value, or a simple CI grep) that fails on NEW text-[…] and leading-[…] additions while
    grandfathering existing ones. That converts an unbounded refactor into a ratchet.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: >
    No new dependency if the CI check is a grep; eslint-plugin-tailwindcss if preferred. Ongoing burden is
    near-zero and negative after a few months (changes get cheaper).
  effort: M
  risk_of_change: >
    Low if done as described. HIGH if attempted as a big-bang refactor — 145 edits across the whole surface with
    no visual regression suite is exactly how a working site gets subtly broken everywhere at once.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A1-002
  title: The keyboard focus ring is effectively invisible on every light surface on the site
  category: accessibility-visual
  what_i_observed: >
    globals.css sets one global focus style: `:focus-visible { outline: 3px solid var(--focus-ring); }`.
    --focus-ring is `color-mix(in oklab, var(--gold-500) 55%, white)`, which resolves in the browser to
    #e2caaa. Measured against every ground the site actually uses:
    vs --paper #fbfaf6 = 1.52:1; vs --paper-2 #f4efe6 = 1.38:1; vs --paper-3 #ece5d8 = 1.26:1;
    vs --gold-100 tint panels = 1.38:1; vs white (inside cards and form inputs) = 1.58:1.
    It only works on the navy panels (vs --navy-900 = 10.02:1; vs --navy-700 = 7.77:1).
    The same token is also used as the input focus glow, `focus:shadow-[0_0_0_3px_var(--focus-ring)]`.
  evidence:
    type: measurement + code
    detail: >
      Token definition src/app/globals.css:98; applied at src/app/globals.css:265-269; input variant at
      src/components/wizard/field-ui.tsx:10, src/components/wizard/PhotoFields.tsx:239,
      src/components/review/ReminderPanel.tsx:71. Colour resolved by painting var(--focus-ring) to a canvas in
      the live page and reading the sRGB pixel back (#e2caaa), then computing WCAG contrast against each token
      ground. Ratios listed above.
  confidence: MEASURED
  who_is_affected: >
    Every keyboard user, every switch-access and voice-control user, anyone with a motor impairment who cannot
    use a mouse, and anyone with low vision tracking focus visually. The brief notes some users have
    disabilities themselves. It also affects sighted mouse users who tab through the 15-section form.
  why_it_matters: >
    This is a ~120-field form. Losing your place in it is the difference between finishing and abandoning. The
    focus indicator is the only thing telling a keyboard user where they are, and on the ivory paper that
    constitutes the great majority of the site's surface — including every single form field — it is a pale
    cream ring on a pale cream page at 1.3-1.6:1. Functionally there is no focus indicator on this site outside
    the navy panels.
  standard_reference: >
    WCAG 2.2 SC 2.4.11 Focus Appearance (AA) — the focus indicator must have at least 3:1 contrast against the
    adjacent colours of the unfocused state. Measured 1.26-1.58:1 on all light grounds. Also SC 2.4.7 Focus
    Visible (AA) in substance, and SC 1.4.11 Non-text Contrast (AA).
  recommendation: >
    Use the navy ring the token file already contains. `--ring: var(--navy-700)` and `--ring-w: 2px` are defined
    at globals.css:99-100 and referenced nowhere. Navy-700 measures 7.77:1 against paper and would pass
    comfortably. The most robust single change is a two-tone ring that works on both grounds without needing to
    know which ground it is on: `outline: 3px solid var(--navy-700); outline-offset: 2px; box-shadow: 0 0 0 5px
    var(--focus-ring);` — navy does the work on light, the existing gold halo does the work on navy, and the
    gold is preserved as the brand signal rather than discarded. This keeps the brand system unchanged (gold is
    still present in the ring) and is one edit in one file.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: >
    One CSS rule. No dependency, no ongoing burden. Should be visually spot-checked on a navy panel and on an
    ivory form to confirm both directions.
  effort: S
  risk_of_change: >
    Very low. Contained to :focus-visible. The only aesthetic consequence is that focus becomes clearly visible,
    which is the intent.
  mission_impact: 4
  reach: 3
  harm_if_unfixed: 5
  environment: both

- id: A1-003
  title: Structural labels render at 10-11px, breaking the design system's own written "never below 12px" rule
  category: typography
  what_i_observed: >
    On the production homepage, 15 elements render text at 10-11px. Eleven of them use the `.tw-engraved` class,
    whose definition in globals.css carries the comment "Never below 12px." Breakdown:
    11px Cinzel uppercase, letter-spacing 1.98px — "Option 1", "Option 2", "See a sample" (x2), "Who tends to
    need it", "Post it where families gather", "A message comes written for you" (7 instances);
    10px Cinzel uppercase, letter-spacing 1.8px — footer column headings "The tool", "Contact", "Pass it along",
    and the firm's own descriptor "Estate and Tax Planning · Virginia" (4 instances);
    10px Mulish uppercase — the "View sample" thumbnail overlay (4 instances).
  evidence:
    type: measurement + code
    detail: >
      Enumerated every element with its own text node on the live production homepage via getComputedStyle,
      filtered to fontSize <= 11.5px. Rule being broken: src/app/globals.css:304-311, comment reads
      "Engraved all-caps lockup, à la the wordmark. Never below 12px." Source of the violations includes
      text-[0.6875rem] (17 uses, = 11px) and text-[10px] (2 uses) applied together with .tw-engraved, e.g.
      src/components/letter/PathChooser.tsx and src/components/chrome/SiteFooter.tsx.
  confidence: MEASURED
  who_is_affected: >
    Older caregivers and grandparents becoming guardians — explicitly named in the audience — plus anyone with
    presbyopia or mild low vision, and anyone reading on a phone in poor light.
  why_it_matters: >
    Cinzel is a high-contrast display serif with small counters. Setting it in all caps removes word-shape
    cues, and 0.18-0.24em tracking breaks word cohesion further. At 10px, with all three of those stacked, it
    is close to the hardest legible configuration Latin text has. These are not decorative flourishes — they
    are the structural labels that tell a reader what they are looking at: "Option 1" and "Option 2" are how a
    parent distinguishes the two letter types, and "See a sample" is an interactive affordance.
  standard_reference: >
    WCAG has no absolute minimum font size, and I will not claim one. The primary reference here is the
    product's own documented rule at globals.css:304. WCAG 2.2 SC 1.4.4 Resize Text (AA) is relevant only in
    that these are the elements most dependent on zoom, and SC 1.4.12 Text Spacing (AA) interacts with the
    heavy tracking.
  recommendation: >
    Raise the engraved floor to the system's own stated 12px minimum and reduce tracking modestly at the small
    end (0.14-0.16em rather than 0.20-0.24em) — wide tracking buys elegance at large sizes and costs legibility
    at small ones. Specifically: promote the 11px instances to 12px and the 10px footer headings to 12px. This
    is a brand-preserving change; the engraved caps look is retained, it simply stops being set below the size
    the brand guide specifies. Add the floor as a token (--fs-engraved-min: 0.75rem) so it is enforceable.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: none beyond the edit
  effort: S
  risk_of_change: >
    Low. Slight reflow risk in the footer column headings and the PathChooser card headers; both should be
    eyeballed at 320 and 1440 after the change.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A1-004
  title: The fields where parents write the hardest prose wrap at 105 characters per line; the system defines 66ch
  category: typography-layout
  what_i_observed: >
    On production at a 1425px viewport, every textarea in the wizard measures 778px of inner width at 16px
    Mulish — approximately 105 characters per line, measured with a lowercase-English average rather than a
    digit width. All seven textareas on the Medical section (allergies, emergencyProtocol, therapies, equipment,
    insurance, whatWorked, whatDidNot) are identical at 105ch. Meanwhile --measure: 66ch is defined in the token
    file, and max-w-[66ch] is applied 21 times elsewhere — to static prose the user only reads.
  evidence:
    type: measurement
    detail: >
      Live measurement on https://myletterofintent.com/letter/medical at 1425px. For each textarea: computed
      clientWidth minus horizontal padding = 778px inner; per-character width derived from a hidden span set to
      the textarea's own resolved font-family/size/weight/letter-spacing containing representative lowercase
      text. Result 105 characters, font-size 16px, line-height 27.2px. Token --measure resolved from
      :root as "66ch". Contrast with 21 uses of max-w-[66ch] and 13 distinct max-w-[Nch] values across
      src/**/*.tsx (24, 52, 54, 56, 58, 60, 62, 66, 68, 70, 72, 74, 76ch).
  confidence: MEASURED
  who_is_affected: >
    Every desktop user writing long-form answers — which is the central act of the product. Most acute for
    tired readers and anyone with dyslexia, low vision, or an attention/tracking difficulty, for whom long
    return-sweeps are where the line gets lost.
  why_it_matters: >
    The measure token is applied to text the user reads and withheld from text the user writes. That is exactly
    backwards for this product: a parent re-reads and edits their own seizure protocol, calming strategies and
    communication notes far more often than they re-read the site's help copy. These are the longest and most
    emotionally difficult passages in the whole experience, and they are set at the widest measure on the site.
  standard_reference: >
    WCAG 2.2 SC 1.4.8 Visual Presentation (AAA) specifies a maximum of 80 characters. Conventional typographic
    guidance (Bringhurst, Butterick) is 45-75. Measured 105. Note AAA is not the site's target, so I am citing
    this as craft with a standards anchor, not as a conformance failure.
  recommendation: >
    Cap the writing fields at the measure the system already defines. Adding max-w-[66ch] (or better,
    a --measure-input token around 70ch) to the textarea styling in src/components/wizard/field-ui.tsx would
    bring the writing surface in line with the reading surface. This does not shorten the form or hide
    anything — the field simply stops spanning the full column on wide screens. Worth a quick check that the
    field still looks generous rather than mean; if it reads as cramped, keep the box visually wide and cap the
    text with a max-width on the inner content instead.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: none beyond the edit
  effort: S
  risk_of_change: low — contained to the field component; visual change only
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A1-005
  title: Production HTML ships the desktop nav to every phone; the hamburger only appears after hydration, and the pre-hydration header overflows a 320px screen by 94px
  category: responsive-layout
  what_i_observed: >
    SiteHeader initialises `const [compact, setCompact] = useState(false)` and only corrects it inside a
    useEffect that reads matchMedia. The site is a static export, so the prerendered HTML always carries
    compact === false. I fetched the production HTML directly and confirmed: the shipped <header> contains the
    "Start your letter · it's free" CTA and the "Share" link, and contains NO element with aria-label="Menu".
    When I forced that same DOM state at a 320px viewport, the header measured 414px wide against a 320px
    viewport — 94px of horizontal overflow, with the "Share" link starting at x=318, entirely off-screen.
    After hydration the hamburger replaces it correctly and overflow returns to 0.
  evidence:
    type: network + code + measurement
    detail: >
      Prerendered HTML fetched from https://myletterofintent.com with cache:'reload' and inspected:
      prerenderedHeaderContains_StartYourLetterCTA = true, prerenderedHeaderContains_ShareLink = true,
      prerenderedHeaderContains_MenuButton = false. Code: src/components/chrome/SiteHeader.tsx:28 (useState
      false), :32-41 (useEffect + matchMedia), :12 (COMPACT_BELOW = 1100), :91-129 (the conditional). Geometry
      in the compact-false state at 320px: header scrollWidth 414 vs clientWidth 320; CTA x=36→308 with
      white-space:nowrap; Share x=318→414. After a clean reload at 320px: docScrollWidth 320, overflow 0,
      hamburgerPresent true.
  confidence: MEASURED
  who_is_affected: >
    Every visitor on a viewport under 1100px — the majority — during the window between first paint and
    hydration. Worst for users on slow connections and older phones, i.e. disproportionately the audience this
    tool exists for. Also affects anyone at 200% browser zoom on a ~640px window, which yields a 320px layout
    viewport, and 200% zoom is exactly what an older caregiver does.
  why_it_matters: >
    The first thing a frightened parent sees on their phone is a header wider than their screen with the primary
    call to action clipped, which then jumps to a different layout. On a page whose entire job is to earn enough
    trust to be handed a child's medical history, "this site looks broken" in the first second is expensive out
    of proportion to the milliseconds involved. It is also a layout shift on the largest element above the fold.
  standard_reference: >
    Relevant to WCAG 2.2 SC 1.4.10 Reflow (AA), though I want to be precise: the *settled* page passes Reflow —
    I verified 0px overflow after a clean load at 320px. The failure is transient, pre-hydration. It is a
    Cumulative Layout Shift and first-impression defect rather than a sustained conformance failure, and I am
    deliberately not scoring it as a Reflow violation.
  recommendation: >
    Render both navs in the HTML and switch them with CSS instead of JavaScript state. Tailwind can express the
    single 1100px breakpoint directly (max-[1099px]:hidden on the desktop nav, min-[1100px]:hidden on the
    hamburger button), which removes the useState/useEffect/matchMedia entirely. The correct header is then in
    the prerendered HTML, there is no hydration gap, no layout shift, and less client JavaScript. The menu's
    open/closed state still needs JS, but its trigger no longer does. The code comment at SiteHeader.tsx:10-11
    already describes this as "the only breakpoint on the site," so expressing it as a media query matches the
    stated intent.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: >
    Net reduction: removes a state hook, an effect, and a matchMedia listener. No new dependency.
  effort: S
  risk_of_change: >
    Low-to-moderate. Both navs existing in the DOM means the hidden one must be properly hidden from assistive
    tech too (display:none rather than visual-only hiding) or a screen reader will announce two "Main"
    navigations. Verify with a screen reader or an accessibility tree dump after the change.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: production

- id: A1-006
  title: An 18.8 MB video preloads automatically on the homepage, with no poster frame
  category: performance-craft
  what_i_observed: >
    The production homepage embeds https://myletterofintent.com/what-is-a-letter-of-intent.mp4 with
    preload="auto" and poster="" (none). A HEAD request returns content-length 19,737,505 bytes = 18.82 MB.
    Because preload is "auto", the browser begins pulling that file on page load whether or not the visitor
    ever presses play. Because there is no poster, the video region also has nothing to paint until bytes
    arrive.
  evidence:
    type: measurement + network
    detail: >
      On the live production homepage: video.preload = "auto", video.poster = "(none)", video.currentSrc =
      "https://myletterofintent.com/what-is-a-letter-of-intent.mp4". fetch HEAD →
      content-length: 19737505 (18.82 MB), content-type: video/mp4.
  confidence: MEASURED
  who_is_affected: >
    Every homepage visitor on a metered or slow connection. The brief's "parent on a phone at midnight" is the
    exact worst case — and on a capped mobile plan this is a real financial cost imposed silently.
  why_it_matters: >
    18.8 MB is roughly the entire rest of the site many times over, spent before the visitor has decided they
    want it. On a slow connection it also competes for bandwidth with the fonts and CSS that make the page
    readable, so the text a frightened parent is trying to read arrives later because of a video they did not
    ask to watch.
  standard_reference: >
    No WCAG SC. This is performance craft. (WCAG 2.2 SC 1.4.2 Audio Control would apply only if it autoplayed
    with sound, which it does not.)
  recommendation: >
    Set preload="none" (or at most "metadata") and ship a real poster image. The poster is already restored in
    the uncommitted local VideoPlayer.tsx, so deploying that closes half of this — but preload="auto" should be
    changed regardless, and I could not find it addressed in the local changes. Separately, 18.8 MB is large for
    a roughly three-minute explainer; re-encoding to H.264 at a sane bitrate plus a WebM/AV1 alternate would
    likely land under 5 MB with no visible quality loss. That is a one-off encode, not new infrastructure.
  scope: current
  privacy_impact: none — the file is served from the site's own origin; no third party involved
  cost_and_maintenance: >
    One-off re-encode. No new dependency or hosting change; the file already sits on the same origin behind
    Cloudflare, so the smaller file also reduces bandwidth cost.
  effort: S
  risk_of_change: very low
  mission_impact: 2
  reach: 4
  harm_if_unfixed: 3
  environment: production

- id: A1-007
  title: The explainer video has no caption track and no transcript
  category: accessibility-media
  what_i_observed: >
    The production <video> element contains zero <track> children and video.textTracks.length === 0. There is
    no transcript anywhere on the page. The section around it reads "The video walks through what to write, why
    it matters, and how to finish it in ten-minute sittings" — i.e. the video carries substantive instructional
    content, not decoration.
  evidence:
    type: measurement + content
    detail: >
      Live production homepage: [...video.querySelectorAll('track')] = [], video.textTracks.length = 0.
      Surrounding copy quoted above appears beside the player in the "What is a Letter of Intent?" section.
      Confirmed in the shared screenshot set (home-1440.png) that no transcript or caption UI is present.
  confidence: MEASURED
  who_is_affected: >
    Deaf and hard-of-hearing users — including the aging grandparents explicitly named in the audience, among
    whom age-related hearing loss is common. Also anyone watching without sound (a phone at midnight next to a
    sleeping child is the canonical case), anyone in a second language, and anyone who would rather skim text
    than sit through three minutes.
  why_it_matters: >
    This is the site's primary explanation of what a Letter of Intent even is. A user who cannot access it is
    excluded from the orientation everyone else gets. The brief confirms captions were deprioritised for MVP
    rather than dismissed, so this is a live gap rather than a settled decision.
  standard_reference: >
    WCAG 2.2 SC 1.2.2 Captions (Prerecorded) — Level A. Also SC 1.2.3 Audio Description or Media Alternative
    (Level A), which a full transcript would satisfy alongside captions.
  recommendation: >
    Ship a WebVTT caption track and a visible text transcript. Because the video is scripted, the transcript
    likely already exists as the script — publishing it is close to free and also gives the page indexable
    content explaining the product, which serves the growth goal at the bottom of the hierarchy. Order of
    value: transcript first (cheapest, helps most people including the sighted skimmer), then the .vtt track.
    A .vtt file is a static asset served from the same origin, so this needs no new infrastructure and no
    third-party captioning service — captions can be authored by hand from the script.
  scope: current
  privacy_impact: >
    none, provided captions are authored locally and served from the site's own origin. A third-party
    auto-captioning SaaS would mean uploading the video to a vendor; the video contains no user data, so this
    would not touch the core promise, but the hand-authored route avoids the question entirely and is
    recommended.
  cost_and_maintenance: >
    One .vtt file plus a transcript block. Must be re-done if the video is ever re-cut — that is the only
    ongoing burden.
  effort: M
  risk_of_change: none
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 5
  environment: production

- id: A1-008
  title: The gold gradient button drops to 4.33:1 under its own 13-15px label at the dark end of the gradient
  category: colour-contrast
  what_i_observed: >
    The "accent" button variant paints var(--gradient-gold) behind text-navy900. Because the background is a
    150deg gradient rather than a flat colour, contrast varies across the button face: 9.82:1 at the 0% stop
    (#e3c89b), 6.56:1 at the 42% stop (#c9a063), and 4.33:1 at the 78% stop (#a87e45). The labels on this
    variant are 13px (sm) or 15px (lg), uppercase, semibold — which is small text under WCAG, requiring 4.5:1.
    So the trailing portion of every gold button label sits marginally below AA. This variant is used for the
    loudest call to action on several screens ("Create your letter", "Start the special needs letter",
    "Send it to someone").
  evidence:
    type: measurement + code
    detail: >
      Component: src/components/ui/Button.tsx:57-58 (variant "accent" sets text-navy900, border-transparent)
      and :75-78 (buttonStyle applies background: var(--gradient-gold)). Gradient stops from
      src/app/globals.css:33-39. Contrast computed per stop against --navy-900 #16223a using the WCAG relative
      luminance formula: 9.82 / 6.56 / 4.33:1. Size classes at Button.tsx:25-27 (text-[13px], text-[15px]).
  confidence: MEASURED
  who_is_affected: Low-vision users and anyone reading in bright ambient light or on a dimmed phone screen.
  why_it_matters: >
    Marginal rather than severe — 4.33 vs 4.5 is a near miss, and the navy-on-gold direction is fundamentally
    the right choice (I initially misread the low-resolution screenshots as white-on-gold, which would have been
    far worse; it is not). The interesting part is structural: a gradient means the design system's contrast
    guarantee is not a single number, and nothing in the token file records that. Whoever next reaches for
    --gradient-gold has no way to know one end of it is unsafe for small text.
  standard_reference: WCAG 2.2 SC 1.4.3 Contrast (Minimum), Level AA — 4.5:1 for text below 18.66px bold / 24px.
  recommendation: >
    Darken the gradient's late stops slightly so the whole face clears 4.5:1 against navy-900 — moving the 78%
    stop from #a87e45 toward #9a7340 would do it while remaining unmistakably champagne gold. Alternatively
    shorten the gradient so the dark stop falls outside the text's bounding box. Either way, record the safe
    text colour for --gradient-gold as a comment in globals.css next to the gradient, in the same style as the
    existing notes at lines 77-81 and 91 — this file already documents its contrast reasoning, and this is the
    one place it does not.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: none beyond the edit
  effort: S
  risk_of_change: very low — a small shift in one gradient stop
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A1-009
  title: Sample-thumbnail affordance is revealed only on hover, so touch users get no visual cue the thumbnails open anything
  category: interaction-affordance
  what_i_observed: >
    The sample document thumbnails carry a "View sample" overlay label that is opacity-0 at rest and revealed
    by group-hover and group-focus-within, at 10px Mulish uppercase. Keyboard and screen-reader users are
    handled correctly — focus-within reveals it, and the label remains inside the link's accessible name
    ("View sample / The Letter of Intent"), so assistive technology is not affected. The gap is touch: a phone
    or tablet has no hover state, so the label never appears, and the thumbnail presents as a static image with
    no visible indication that tapping it does anything.
  evidence:
    type: measurement + code
    detail: >
      Live production homepage: for each "View sample" element, opacity at rest = "0", visibility = "visible",
      fontSize = "10px", transitionProperty = "opacity", classes include opacity-0, group-hover and
      focus-within variants; enclosing link accessible name = "View sampleThe Letter of Intent". Component:
      src/components/home/SampleDocuments.tsx (text-[0.625rem] / text-[10px] overlay).
  confidence: MEASURED
  who_is_affected: >
    Touch users — the majority of this audience, and specifically the phone-at-midnight case. Not an assistive
    technology failure; I checked and the accessible name is intact.
  why_it_matters: >
    Seeing a real finished example is one of the strongest antidotes to blank-page paralysis, which the site's
    own copy identifies as the core problem ("Most families are told to write a Letter of Intent and never do,
    because a blank page is paralyzing"). If the affordance is invisible on the device most people use, the
    single most reassuring content on the page goes unfound. Note this is also an instance of the pattern the
    audit brief warns against — content hidden behind hover — already present in the design.
  standard_reference: >
    WCAG 2.2 SC 1.4.13 Content on Hover or Focus is not violated in the strict sense (the content is
    supplementary and dismissible). This is a usability/affordance finding, not a conformance failure, and I am
    labelling it as such.
  recommendation: >
    Make the affordance permanent rather than hover-revealed. A small always-visible caption or a corner badge
    on the thumbnail costs nothing and works on every input type. If the concern is that a persistent label
    dirties the thumbnail, put it below the image alongside the existing "The Letter of Intent" /
    "Emergency sheet" captions rather than over it. Whatever form it takes, set it at 12px minimum per A1-003
    rather than 10px.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: none beyond the edit
  effort: S
  risk_of_change: very low
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A1-010
  title: Line-height drift is visible in rendered output — five different line-heights on the same 15px size, on one page
  category: typography
  what_i_observed: >
    The production homepage alone renders 29 distinct font-size / line-height / family combinations. Within
    that, the same font size carries multiple different line-heights: 15px appears with 24.3px, 25.5px, 18.75px,
    24.75px and 26.25px leading (five variants); 16px appears with 25.92px, 25.6px, 28px and 27.2px (four);
    22px with 25.96px, 29.7px and 26.4px (three); 48px with 53.76px and 56.64px (two). The token file defines
    five line-height values and none of them is referenced.
  evidence:
    type: measurement
    detail: >
      Enumerated every element with its own text node on the live production homepage, keyed by
      computed fontSize + lineHeight + fontFamily. 29 distinct combinations. Source-level cause: 70
      leading-[…] declarations across 15 distinct values, of which leading-[1.7] (30 uses) and leading-[1.75]
      (17 uses) are near-identical, alongside 1.6, 1.65, 1.62, 1.55, 1.5, 1.35, 1.3, 1.25, 1.2, 1.12, 1.1, 1.8,
      1.85. Tokens at src/app/globals.css:116-120 (--lh-tight/snug/heading/body/relaxed).
  confidence: MEASURED
  who_is_affected: >
    No one is blocked. This is a craft and consistency finding — it shows up as a faint unevenness of texture
    down a long page rather than as a discrete defect.
  why_it_matters: >
    This is the visible symptom of A1-001 and the reason I am confident that finding is real rather than
    theoretical. It also matters for a specific future task: WCAG 2.2 SC 1.4.12 Text Spacing requires the page
    to survive a user stylesheet forcing 1.5× line-height. With leading set 15 different ways inline, the
    outcome of that override is unpredictable per element rather than uniform.
  standard_reference: >
    WCAG 2.2 SC 1.4.12 Text Spacing (AA) is the practical anchor, though I did not test the 1.5× override
    directly and am not claiming it fails — see "what I could not examine".
  recommendation: >
    Collapse to the five defined --lh values as part of the ratchet described in A1-001. The 30 uses of
    leading-[1.7] and 17 of leading-[1.75] are one value in practice; standardising just those two on
    --lh-body (1.62) or a new --lh-comfortable (1.7) would fix 47 of the 70 occurrences in a single
    find-and-replace with essentially no visual change.
  scope: current
  privacy_impact: none — no user data involved
  cost_and_maintenance: none beyond the edit
  effort: S
  risk_of_change: low for the leading-[1.7]/[1.75] consolidation; do the rest opportunistically
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 1
  environment: both

- id: A1-011
  title: Deployment gap confirmed — production still shows the light "What is a Letter of Intent" section and a posterless video
  category: deployment
  what_i_observed: >
    As the brief predicted. On production the section containing the "What is a Letter of Intent?" heading has
    backgroundColor rgba(0,0,0,0) and backgroundImage "none", with text colour rgb(58,68,86) = --ink-700 —
    i.e. the old light treatment, not the navy panel. The video has poster "(none)". Both match the described
    uncommitted local state of src/app/page.tsx and src/components/home/VideoPlayer.tsx.
  evidence:
    type: measurement
    detail: >
      Live production homepage: the <section> ancestor of the "What is a Letter of Intent?" heading returns
      backgroundColor "rgba(0, 0, 0, 0)", backgroundImage "none", color "rgb(58, 68, 86)". video.poster =
      "(none)". Local dev at the same route renders the navy panel and a poster (visible in the shared
      screenshot set, see A1-012).
  confidence: MEASURED
  who_is_affected: no one adversely — this is a state observation, not a defect
  why_it_matters: >
    Recorded so it is not mistaken for a regression by another reader, and because it establishes that
    production and local genuinely differ on the homepage — which matters for how the shared screenshot
    evidence should be read (A1-012). Deploying it also resolves half of A1-006.
  standard_reference: n/a
  recommendation: >
    Deploy when the owner is satisfied with the local change. No action required from this audit. Worth pairing
    the deploy with the preload="none" change from A1-006 so the video work lands in one go.
  scope: current
  privacy_impact: none
  cost_and_maintenance: none
  effort: S
  risk_of_change: n/a — owner's existing work
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 1
  environment: both

- id: A1-012
  title: The shared screenshot evidence set was captured against local dev, not production
  category: evidence-integrity
  what_i_observed: >
    The Next.js development-mode indicator — a small dark circular badge at the left edge — is visible in the
    shared screenshots, e.g. home-1440.png at approximately x=14,y=326; wizard-medical-1440.png at
    approximately x=23,y=546; wizard-medical-768.png at approximately x=22,y=578. That badge only renders in
    `next dev`. Corroborating: home-1440.png shows the "What is a Letter of Intent" section in navy and the
    video with a poster and a WATCH control, which A1-011 confirms production does NOT have.
  evidence:
    type: screenshot
    detail: >
      audit/evidence/screenshots/home-1440.png, wizard-medical-1440.png, wizard-medical-768.png — dev badge
      present at the coordinates above. Cross-checked against the production DOM measurements in A1-011.
  confidence: MEASURED
  who_is_affected: >
    Other analysts and the owner, if any of us treats the screenshot set as evidence of production appearance.
  why_it_matters: >
    The screenshots are excellent and I used them heavily for composition, hierarchy and responsive behaviour,
    where local and production do not differ. But they include the uncommitted homepage work, so any statement
    of the form "production looks like X" that rests only on these images is unsound for the homepage. I want
    this on the record because the audit brief explicitly designates production as authoritative for some
    classes of finding, and a reader could otherwise reasonably assume these images are production.
  standard_reference: n/a
  recommendation: >
    Note the provenance in the evidence folder (a one-line README or a filename prefix). If a production
    baseline is wanted, re-capture against the deployed origin after the pending deploy — at which point local
    and production converge and the distinction stops mattering.
  scope: current
  privacy_impact: none
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 1
  environment: both
```

---

## What would move this from competent to distinguished

Before the recommendations, an honest framing. **This site is already well above the median for its category.**
The brand system is coherent, the colour work is careful and demonstrably tested (zero text-contrast failures on
the homepage in my scan), the copy is unusually humane, and the privacy page is genuinely excellent work —
numbered sections, an on-page index, summary cards, callout panels, a clear reading order. If I were shown only
`/privacy` I would assume a good studio made this.

Four things separate it from award-level work in the nonprofit/services category. All four are achievable
without violating the constraint that this is a design for someone who may be crying.

**1. The document is the product, but you never watch it become one.** This is the highest-leverage move
available. Right now the wizard is a form, and the letter appears at the end. The review screen's letter preview
(visible in review-1440.png) is the most beautiful thing on the site — serif, properly set, unmistakably a
document — and it is the last thing you see. Bring that presence forward: a persistent, quiet indication that a
document is accruing. Not a progress bar (there is one, and it is fine); a *page*. Even a small static
representation that gains sections as you fill them would convert "I am filling in 120 boxes" into "I am writing
something." For a parent who may not finish tonight, the emotional difference between those two framings is the
difference between coming back and not. This is entirely client-side, costs no privacy, and is exactly the kind
of thing an awards jury in this category recognises: the interface embodying the outcome rather than describing
it.

**2. The gold is doing six jobs, so it signals none of them.** Champagne gold currently marks: eyebrow labels,
hairline rules, the diamond bullet, the 3px card top-rule, the loudest button, and the focus ring. When an accent
is that promiscuous it stops being information and becomes texture. The most valuable reassignment: let gold mean
*"this is yours — your document, your progress"* and let navy mean *"this is the tool."* That single semantic
split would make the accruing-document idea in point 1 legible without adding a pixel of new decoration. This is
a reallocation within the existing brand system, not a change to it.

**3. The empty state is the real design problem and it is currently only a copy problem.** The site's own
diagnosis is correct: "a blank page is paralyzing." The copy answers it well ("Nothing here yet — add the first
provider whenever you're ready"). The *visuals* do not: an untouched wizard section is a stack of empty
rectangles. There is already a "See an example" disclosure in the Medical section — the right content exists and
is hidden behind a link. Surfacing a specimen answer as genuinely-styled ghost text inside the field, in the
field's own typography, would let a parent see the shape of a good answer without clicking anything. Critically
this must be real placeholder-adjacent presentation that never risks being mistaken for their own text, and it
must not reduce contrast on anything real — done carefully it is the single biggest reduction in blank-page
paralysis available.

**4. Typographic finish at the small end.** Three families is the right call and Cormorant is under-used — it
currently only sets headings. The document voice established in the review preview could appear earlier, even as
a hairline letterhead motif on each section card. Meanwhile the small end needs the opposite treatment: raise
the 10-11px engraved labels to 12px and pull the tracking back (A1-003). Distinguished typography is usually
recognisable by what it does at 12px, not at 64px.

### The honest trade on awards

The brief asked me to say directly if a design award would require something that harms this audience. **It
would, for one of the three named.** Awwwards' Site of the Day scoring weights Creativity and Design heavily and
in practice rewards motion, scroll-driven sequences, cursor effects and novelty — precisely the things that hurt
a distressed, tired, possibly cognitively-loaded user, and several of which the brief rightly forbids. I do not
think this site should chase Awwwards, and I would advise against the changes that would be needed.

**CSS Design Awards** (particularly its UI/UX and Innovation sub-scores) and a **Webby in Websites & Mobile
Sites → Nonprofit / Services** are both genuinely winnable on the site's own terms — Webby's criteria
(Structure & Navigation, Visual Design, Content, Functionality, Overall Experience) reward exactly the clarity
and restraint this project already has. Fixing the focus ring (A1-002), the 12px floor (A1-003) and the measure
(A1-004), then doing the accruing-document work (point 1), would make it a credible Webby entry. That is the
path I would recommend. *(Awards-criteria characterisation: external / INFERRED — general knowledge of these
programmes, not verified against their current published rubrics this cycle.)*

### Competitive visual reference

**All of this section is external / INFERRED.** I could not browse competitor sites in this session — this is
from general knowledge, unverified against their current live designs, and should be treated as a starting point
for the owner's own look rather than as observed fact.

- **GOV.UK Design System and NHS.uk** — the reference standard for form-heavy services used under stress.
  Specifically worth borrowing: (a) a larger body size than feels necessary — NHS.uk sets body around 19px on
  desktop, against this site's 15-16px, and that alone would serve the older-caregiver audience more than any
  other single change; (b) the error-summary-at-top pattern; (c) the discipline of one idea per screen. Their
  visual restraint is close to this site's already, so the borrow is comfortable rather than a style clash.
- **PREPARE for Your Care** (advance directives, designed for low literacy and older adults) — worth borrowing
  the per-step short video with captions and the consistently large type. Relevant precisely because it is
  built for the same demographic and validated with it.
- **Everplans / Cake / FreeWill** (end-of-life and estate planning) — worth borrowing the "progress as
  reassurance" framing: completion state presented as encouragement, never as a scold or a nag. Worth
  explicitly *not* borrowing their upsell interstitials and account-creation gates, which this site is right to
  refuse.
- **Patient-facing health record summaries (MyChart-style after-visit summaries)** — worth borrowing the
  "record card" visual language: a bounded, printable-looking block with a strong header rule that reads as a
  document rather than a web page. That is the visual vocabulary for point 1 above, and this site already has
  the pieces (the 3px gold top-rule card, the serif preview).

### Things I deliberately did not recommend

- Nothing that reduces text contrast anywhere.
- No decorative or scroll-triggered motion. The existing motion (a 3px card lift, a 140ms colour transition) is
  already at the right level and correctly gated behind `prefers-reduced-motion` at globals.css:288-297.
- Nothing new hidden behind hover — I flagged the one existing instance instead (A1-009).
- No cleverness in labels. "Start your letter · it's free" and "Download all three together" are exactly right
  and should not be made more interesting.
- I did **not** recommend widening or restyling the two consecutive beige sections, removing Google Analytics,
  or changing the brand palette or type pairing — all out of scope per the brief.

---

## What I examined, and what I could not

### Examined
- All 28 shared screenshots at 320/768/1024/1440 (read closely: home ×2, wizard-medical ×2, wizard-getting-started,
  letter-chooser, review, privacy).
- `src/app/globals.css` in full — the token definitions, base layer, brand primitives, print styles.
- `src/components/ui/Button.tsx`, `src/components/chrome/SiteHeader.tsx` in full; targeted reads and greps across
  all 41 `.tsx` files.
- A full quantitative census of arbitrary values across the source tree (PowerShell regex over `src/**/*.tsx`).
- The **production** built CSS (63,313 bytes, fetched live) for distinct-value counts.
- The **production** DOM at 320px and 1440px: horizontal overflow, header composition, rendered type scale,
  field measures, touch-target sizes, video attributes and byte size, caption tracks.
- The **production** prerendered HTML, fetched directly, to establish the pre-hydration header state.
- WCAG contrast maths across ~32 token pairs, plus a custom whole-page contrast scan of the rendered homepage
  and the Medical wizard section.

### Could NOT examine, and why
- **No axe run.** The Bash tool was unavailable for the entire session (classifier outage), so I could not run
  Playwright or `@axe-core/playwright`. Everything I report as a contrast measurement is my own arithmetic on
  computed styles, not axe output. **No finding in this report carries an `axe` evidence type, and none should
  be read as if it does.** A1-002, A1-003 and A1-008 in particular would benefit from independent axe/manual
  confirmation.
- **My whole-page contrast scanner cannot judge text over gradients.** It skipped 13 nodes on the homepage for
  this reason. My first run produced three false positives on the navy wizard panel (which uses a
  `linear-gradient` background-image, so `backgroundColor` reads transparent and my ancestor-walk fell through
  to the page colour). I corrected the scanner to bail out over gradients rather than guess. I verified those
  particular cases separately via token arithmetic (on-ink body text on navy measures 8.66-9.82:1 and passes).
  I mention this because it means **my scan cannot claim complete coverage** of text on the navy panels.
- **Layout geometry on localhost was unreliable.** The browser pane was not compositing frames, so
  `getBoundingClientRect` returned zeroes there. All geometry in this report was therefore taken on production.
  I could not take fresh screenshots of the local dev server for the same reason.
- **I did not test the WCAG 1.4.12 Text Spacing override** (the 1.5× line-height / 0.12em letter-spacing user
  stylesheet). I reference it in A1-010 as a *risk* created by scattered inline leading; I am not claiming it
  fails.
- **I did not investigate the video fullscreen button** the owner reported. It was flagged as known and
  unreproduced, and it is a behaviour question rather than a visual-design one.
- **I could not browse any competitor site.** The entire competitive reference section is general knowledge,
  labelled external/INFERRED, and unverified.
- I did not open `capture-production.json`, the PDFs, or `fill-levels.json` — they are network/privacy and
  output-fidelity evidence, outside the visual-design remit and covered by other analysts.

### One claim I withdrew during the audit
I initially measured **94px of horizontal overflow at 320px on production** and was ready to report an SC 1.4.10
Reflow failure. On reload at that viewport the overflow was **0** and the hamburger rendered correctly — my
first measurement was an artifact of resizing the viewport *after* load, which did not fire the component's
`matchMedia` listener. **The settled page passes Reflow at 320px.** The genuine finding underneath it is
narrower and is reported honestly as A1-005 (a pre-hydration transient, not a sustained failure). I am recording
the withdrawal because a confident false positive here would have sent someone chasing a bug that does not
exist.

I also initially believed the 1440 wizard had a large empty void on the right. That was me misreading
coordinates on a downscaled screenshot; measured on production, `main` spans the full width with the form column
correctly centred beside the rail. **Withdrawn.**

---

## Confidence summary

### Three highest-confidence findings
1. **A1-002 — focus ring invisible on light grounds (1.26-1.58:1).** Colour resolved by canvas pixel readback in
   the live browser, contrast computed from the WCAG formula, and the applying rule cited at
   `globals.css:265-269`. There is no interpretation involved.
2. **A1-001 — type/rhythm/measure tokens referenced zero times.** Two independent censuses (source tree, and the
   production built CSS) agree, and the negative result is exact: zero `var(--fs-*)`, `var(--space-*)`,
   `var(--lh-*)`, `var(--ls-*)`, `var(--measure)` in 41 component files.
3. **A1-006 / A1-007 — 18.82 MB video, `preload="auto"`, no poster, zero caption tracks.** All four are direct
   property reads and an HTTP `content-length` from the live origin.

### Three least-confident findings
1. **A1-005 — the pre-hydration header flash.** The *components* are all measured (prerendered HTML lacks the
   menu button; that DOM state overflows by 94px at 320px). What I have **not** measured is how long the window
   actually lasts on a real phone on a real slow connection, or whether it is perceptible in practice. It could
   be 60ms and invisible. The recommendation is cheap and improves the code regardless, but the severity is my
   inference, not an observation.
2. **A1-004 — the 105-character writing measure.** The measurement is solid, but the *harm* rests on general
   typographic research rather than on evidence about this product's users. It is also possible a wide box is
   deliberately reassuring — a big box says "write as much as you like," and narrowing it might discourage
   exactly the fullness the document needs. I flagged the risk in the recommendation; I would want the owner's
   judgement or a user test before treating this as settled.
3. **A1-008 — the gold gradient button at 4.33:1.** The arithmetic is exact, but whether the label's glyphs
   actually sit over the 78% stop depends on the button's rendered dimensions and the gradient's 150deg
   geometry per instance, which I did not measure button-by-button. On a short wide button the dark stop may
   fall entirely outside the text. Real but possibly narrower than stated.

### What I would need to be more certain
- **A working Bash tool**, to run `@axe-core/playwright` across all seven routes at all four viewports. That
  would independently confirm or refute A1-002, A1-003 and A1-008 and would catch contrast cases my
  gradient-blind scanner skipped.
- **A throttled-network trace** (Slow 3G, mid-tier mobile CPU) capturing CLS and a filmstrip of the first 2
  seconds, to size A1-005 properly and to show what the 18.8 MB preload actually does to first render.
- **A Text Spacing override test** (1.5× line-height, 0.12em letter-spacing, 0.16em word-spacing) across the
  wizard, to convert the A1-010 risk into a measured pass or fail.
- **Five minutes of watching two real users** — one parent on a phone, one grandparent on a desktop at 200%
  zoom — attempt the Medical section. That would settle A1-004 and the empty-state question in point 3 far more
  reliably than any measurement I can take, and would tell us whether the blank-page problem is being solved or
  merely named.
