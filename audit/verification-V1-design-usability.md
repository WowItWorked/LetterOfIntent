# V1 — Adversarial verification of A1 (design) and A2 (usability)

Verifier V1. Mandate: refute. Every number below was recomputed or re-measured by me; nothing
was taken on the analyst's word. Analysis only — no application code, style, content or config
was touched. New files are confined to `audit/tools/v1-*.mjs`, `audit/evidence/v1/`, and this
document.

**Repo state at verification:** `HEAD` = `origin/main` = `b243107` (clean apart from untracked
audit output). Production `https://myletterofintent.com` is serving `b243107` — I confirmed
`tw-panel-navy`, `/video-poster-lockup.png`, `og:image`, and the string `under 5 minutes` in the
live HTML. **The deployment gap the brief described has closed.** That fact alone invalidates
the current-state reading of two A1 findings.

**Tooling I used that A1 did not have:**

| tool | what it settled |
|---|---|
| `audit/tools/v1-contrast-math.mjs` | oklab `color-mix` + WCAG luminance from first principles — A1-002, A1-008 |
| `audit/tools/v1-prod-checks.mjs` | fresh production DOM/network at 1425px, 390px, 320px (JS on and off) |
| `audit/tools/v1-gradient-and-axe.mjs` | gradient geometry, **plus the axe run A1 could not do**, 7 routes |
| `audit/tools/v1-gradient-pixels.mjs` | real painted pixels under the gold button labels |
| `audit/tools/v1-a2-checks{,2,3}.mjs` | A2's persona measurements, re-driven |
| `audit/tools/v1-crop.mjs` | crops of the shared screenshot set |

Raw output: `audit/evidence/v1/*.json`.

---

## A1 — Visual design and craft

### A1-001 — CONFIRMED
**Original claim:** Type/rhythm/measure tokens are defined but referenced zero times; the reading
experience cannot be tuned in one place.

**What I did to check it:** Re-ran the census myself with ripgrep over `src/**/*.tsx`, then
re-fetched the production stylesheet (`/_next/static/immutable/chunks/2h7kuma4ik2-h.css`, 64,798
bytes today vs the 63,313 A1 reported — the sheet has changed since) and recounted distinct
declaration values. Read `src/app/globals.css` lines 1–330 in full.

**What I found:** The negative result is exact and reproduces perfectly.

| measure | A1 | me |
|---|---|---|
| `.tsx` files | 41 | **41** |
| `var(--fs-*)` / `var(--lh-*)` / `var(--ls-*)` / `var(--space-*)` / `var(--measure)` | 0 | **0 / 0 / 0 / 0 / 0** |
| `text-[…]` occurrences / distinct | 145 / 31 | **145 / 31** |
| `leading-[…]` occurrences / distinct | 70 / 15 | **70 / 15** |
| `tracking-[…]` occurrences / distinct | 68 / 16 | **68 / 16** |
| distinct `max-w-[Nch]` | 13 | **13** (24,52,54,56,58,60,62,66,68,70,72,74,76 — A1's list verbatim) |
| `max-w-[66ch]` uses | 21 | **21** |
| built CSS distinct `font-size` | 41 | **41** |
| built CSS distinct `border-radius` / `box-shadow` | 7 / 4 | **7 / 4** |

Token definitions are at `globals.css:102–142` exactly as cited.

**Three supporting sub-claims are overstated, and I want them on the record even though the
finding survives:**

1. A1 writes *"there is no single place where 'body text' is even defined."* **False.**
   `src/app/globals.css:237–245` sets `body { font-size: var(--fs-md); line-height: var(--lh-body); }`.
   There *is* a single place; it is simply overridden 145 times. The finding's substance holds —
   the base rule governs little — but the sentence as written is wrong.
2. A1's table says `--shadow-*` has **"1 + focus ring"** references. I count **25**
   (`--shadow-md` ×13, `--shadow-sm` ×5, `--shadow-gold` ×4, `--shadow-xs` ×3). This *strengthens*
   A1's conclusion, but the cell is wrong.
3. A1's table says radius has **"0 ad-hoc values — fully disciplined."** Not true: there are **20**
   non-token rounded utilities in `.tsx` (`rounded-md` ×6, `rounded-full` ×6, `rounded-lg` ×3,
   `rounded-r/b/t` ×5), and Tailwind's `rounded-md` (0.375rem) is *not* `--radius-md` (8px). That
   is why the built CSS carries 7 distinct radii against 6 tokens. Only 2 of the 6 radius tokens
   (`sm`, `md`) are ever used.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 2 / reach 5 / harm 2 is proportionate for a maintainability finding
**wrong_standard:** false — A1 correctly declines to claim an SC

---

### A1-002 — CONFIRMED (but the citation and one recommendation number are wrong)
**Original claim:** The keyboard focus ring is effectively invisible on every light surface.

**What I did to check it:** (a) Implemented CSS Color 4 oklab conversion and `color-mix` from
scratch in `v1-contrast-math.mjs` and resolved `color-mix(in oklab, #c9a063 55%, white)`
independently. (b) Recomputed WCAG relative luminance and contrast against all seven grounds.
(c) On live production, injected a probe element, read the resolved `--focus-ring`, then pressed
Tab twice and read the *painted* `outline-color` / `outline-width` off `document.activeElement`
plus the ground behind it.

**What I found:** A1's arithmetic reproduces **to two decimal places on every single number.**

| ground | A1 | me |
|---|---|---|
| resolved ring | `#e2caaa` | **`#e2caaa`** (delta 0,0,0) |
| `--paper` | 1.52 | **1.52** |
| `--paper-2` | 1.38 | **1.38** |
| `--paper-3` | 1.26 | **1.26** |
| `--gold-100` | 1.38 | **1.38** |
| white | 1.58 | **1.58** |
| `--navy-900` | 10.02 | **10.02** |
| `--navy-700` | 7.77 | **7.77** |

The rule is at `globals.css:265–269` exactly as cited; the token at `:98`; the three input-glow
sites are exact — `field-ui.tsx:10`, `PhotoFields.tsx:239`, `ReminderPanel.tsx:71`. In the live
browser the focused link paints `outline: 3px solid oklab(0.85155 0.0119952 0.0494828)` over a
`rgba(251,250,246,0.93)` ground. `--ring` resolves to `#253551` and `grep` finds **zero**
references to `var(--ring)` or `var(--ring-w)` anywhere in `src/` — A1's "referenced nowhere" is
exactly right.

**Two defects in the write-up:**

- **Wrong SC.** A1 cites *"WCAG 2.2 SC 2.4.11 Focus Appearance (AA)."* In the published WCAG 2.2
  Recommendation, **2.4.11 is Focus Not Obscured (Minimum), Level AA**; **Focus Appearance is
  SC 2.4.13 and it is Level AAA.** Focus Appearance carried the 2.4.11 number at AA only in
  working drafts. The AA hooks that *do* apply are **SC 2.4.7 Focus Visible (Level A/AA)** — a
  1.26:1 ring is a defensible failure of "visible" — and, on the common reading, SC 1.4.11
  Non-text Contrast (AA). A1 names both as secondary, so the finding is not destroyed, but the
  headline citation is wrong in both number and conformance level, and would be embarrassing in
  a VPAT.
- **Wrong number in the recommendation.** A1 writes *"Navy-700 measures 7.77:1 against paper."*
  It does not. 7.77:1 is `--focus-ring` against `--navy-700`. **`--navy-700` against `--paper` is
  11.78:1** — A1 reused the wrong cell. The recommendation is still correct, and in fact better
  than claimed.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 3 / harm 5 is if anything conservative for a ~120-field form
**wrong_standard:** **true** — cite **SC 2.4.13 Focus Appearance (AAA)** for the 3:1 indicator
requirement, and lead with **SC 2.4.7 Focus Visible (A)** for the AA-level failure. Not 2.4.11.

---

### A1-003 — CONFIRMED
**Original claim:** 15 elements render at 10–11px on the production homepage, 11 of them
`.tw-engraved`, whose own comment says "Never below 12px."

**What I did to check it:** Enumerated every element on the live production homepage that owns a
non-empty text node, read `getComputedStyle`, filtered to `fontSize <= 11.5`. Separately read
`globals.css:304–311` and re-counted the source classes.

**What I found:** **15 elements, exactly.** The breakdown matches item for item:
- 11px Cinzel uppercase, letter-spacing 1.98px — "Option 1", "Option 2", "See a sample" ×2,
  "Who tends to need it", "Post it where families gather", "A message comes written for you" = **7**
- 10px Cinzel uppercase — "Estate and Tax Planning · Virginia", "The tool", "Contact",
  "Pass it along" = **4**
- 10px Mulish uppercase — "View sample" ×4 = **4**

**11** of the 15 carry `.tw-engraved` — A1's count is exact. The rule being broken is at
`globals.css:304`, comment verbatim: `Engraved all-caps lockup, à la the wordmark. Never below
12px.` Source counts are exact too: `text-[0.6875rem]` ×**17**, `text-[10px]` ×**2**, and both
cited files check out — `PathChooser.tsx:89` (`tw-engraved … text-[0.6875rem]`) and
`SiteFooter.tsx:5` (`const engraved = "tw-engraved text-[10px] text-accent"`).

One trivial imprecision: A1 gives the 10px footer headings as letter-spacing 1.8px. Measured,
"The tool"/"Contact"/"Pass it along" are **2px**; 1.8px is only the firm descriptor. Immaterial.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A1 explicitly refuses to invent a WCAG minimum font size, which is
correct, and anchors on the product's own written rule. Exemplary handling.

---

### A1-004 — CONFIRMED
**Original claim:** Every wizard textarea wraps at ~105 characters; `--measure` is 66ch.

**What I did to check it:** Loaded `https://myletterofintent.com/letter/medical` at 1425px and, for
each textarea, computed `clientWidth − paddingLeft − paddingRight`, then derived per-character
width from a hidden span carrying the textarea's own resolved font stack and a lowercase English
sample sentence.

**What I found:** **7 textareas**, named exactly as A1 lists them (`allergies`,
`emergencyProtocol`, `therapies`, `equipment`, `insurance`, `whatWorked`, `whatDidNot`), every one
of them **778px inner width, 16px, line-height 27.2px, `max-width: none`** — all four numbers
identical to A1's. My character count comes out at **103**, A1's at 105; the 2-character gap is
the choice of sample string, not a disagreement. `--measure` resolves to `66ch` and `max-w-[66ch]`
is applied 21 times to read-only prose.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — and A1's own least-confidence note (a wide box may be deliberately
reassuring) is a fair caveat I would keep
**wrong_standard:** false — SC 1.4.8 Visual Presentation is real, is Level AAA, does specify an
80-character maximum, and A1 correctly labels it as craft-with-an-anchor rather than a failure

---

### A1-005 — CONFIRMED (and worse than reported)
**Original claim:** The prerendered HTML ships the desktop nav to every phone; at 320px that DOM
state overflows by 94px; the hamburger only appears after hydration.

**What I did to check it:** Two clean production loads at 320×700. (a) `javaScriptEnabled: false`
— this is the prerendered HTML with no hydration at all, a stricter test than A1's forced DOM
state. (b) JS on, `waitUntil: networkidle`.

**What I found:**

| | JS off (prerender) | JS on (settled) |
|---|---|---|
| header text | `START YOUR LETTER · IT'S FREE SHARE` | (hamburger) |
| `aria-label="Menu"` present | **false** | **true** |
| header scrollWidth / clientWidth | **431 / 320** | — |
| document scrollWidth / clientWidth | **431 / 320** | **320 / 320** |
| horizontal overflow | **111px** | **0** |

The prerendered header contains the CTA and Share and no menu button — exactly A1's claim. My
overflow measures **111px** where A1 measured 94px; the difference is web-font fallback with JS
disabled. Either way the phenomenon is real. Code citations are all exact:
`SiteHeader.tsx:12` (`COMPACT_BELOW = 1100`), `:28` (`useState(false)`), `:32–41` (effect +
matchMedia), and the comment at `:10–11` does describe it as "the only breakpoint on the site."
A1's recorded withdrawal — that the *settled* page passes Reflow at 320px — is correct and I
reproduce it (overflow 0).

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — A1 already flags this as its own least-confident finding because the
*duration* of the window is unmeasured. That caveat is right and I did not close it either.
**wrong_standard:** false — A1 explicitly declines to score SC 1.4.10 Reflow, which is the correct
call for a pre-hydration transient

---

### A1-006 — CONFIRMED AS OBSERVED, but **already fixed and deployed**
**Original claim:** An 18.8 MB video preloads automatically on the homepage, with no poster frame.

**What I did to check it:** (a) `curl -I` the mp4. (b) Loaded production with a request logger and
waited 3s past `networkidle`, then inspected the DOM. (c) `git show d5ec230:src/components/home/VideoPlayer.tsx`
to establish what A1 was actually looking at.

**What I found:**

- The byte count is **exact**: `Content-Length: 19737505` = 18.82 MB. Local `public/what-is-a-letter-of-intent.mp4`
  is the same size.
- **On production today the mp4 is not requested at all.** `mp4Requested: false`, `mp4Urls: []`
  out of 33 total requests. There is **no `<video>` element on load** — `HEAD`'s `VideoPlayer.tsx`
  renders a poster `<Image>` inside a play button and only mounts `<video>` after
  `setPlaying(true)` (`VideoPlayer.tsx:161–216`). `preload="auto"` still sits on that element
  (`:209`) but it is unreachable until the visitor asks for it.
- The poster is present: `/video-poster-lockup.png` via `next/image`, `posterImagePresent: true`.
- At `d5ec230` — the commit A1 measured against — the header comment read *"PROTOTYPE: no custom
  poster image or 'Watch' pill right now"* and *"switch preload to 'metadata' if the eager download
  is not wanted"*, and the `<video>` mounted on page load. **A1's observation was correct at the
  time.**

So the finding is real as written and no longer describes the site. What remains true is only the
tail of A1's recommendation: 18.8 MB is still large for a 4:38 explainer, and the file still ships
at that size the moment anyone presses play.

**Verdict:** CONFIRMED (as observed at `d5ec230`) — **does not describe production today**
**already_fixed:** **true** — commit `b243107`, "The video's poster image and Watch pill are
restored after the earlier posterless prototype." Deployed. Verified live.
**wrong_severity:** **true** — as scored (mission 2 / reach 4 / harm 3) it read as a live
performance defect. Residual scope is only "re-encode a 18.8 MB file that now downloads on
demand": **mission 1 / reach 2 / harm 1**.
**wrong_standard:** false

---

### A1-007 — CONFIRMED
**Original claim:** The explainer video has no caption track and no transcript.

**What I did to check it:** Grepped the served production HTML for `<track` (**0 occurrences**),
inspected the DOM for any transcript/`<details>`/"read this instead" affordance, and read
`VideoPlayer.tsx` in full at `HEAD`.

**What I found:** Confirmed on every limb. `VideoPlayer.tsx:203–215` renders `<video>` with
`src poster controls playsInline preload tabIndex` and **no `<track>` child**. The in-source
comment at `:201–202` still records the belief that the requirement is met: *"No caption track:
the same explanation is written out in full in the column beside this player."* There is no
transcript anywhere on the page — my scan of every `details`/`summary`/`h2`/`h3` for
transcript/caption language returned `[]`. The surrounding copy A1 quotes is verbatim in the DOM
("The video walks through what to write, why it matters, and how to finish it in ten-minute
sittings", `VideoPlayer.tsx:251–254`).

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 3 / reach 2 / harm 5 is well judged
**wrong_standard:** false — SC 1.2.2 Captions (Prerecorded) is Level A, SC 1.2.3 Audio Description
or Media Alternative (Prerecorded) is Level A. Both correctly cited and correctly levelled.

---

### A1-008 — REFUTED (arithmetic exact, conclusion does not hold)
**Original claim:** "The trailing portion of every gold button label sits marginally below AA" —
4.33:1 at the 78% gradient stop under a 13–15px label.

**What I did to check it:** Three independent attacks.
1. Recomputed the per-stop contrast against `--navy-900` from the WCAG formula.
2. Measured the real buttons on production: element rect, and the **exact rect of the rendered
   glyphs** via `Range.selectNodeContents`. Computed the 150deg gradient axis length
   `L = |w·sin θ| + |h·cos θ|`, projected all four corners of the *text* rect onto it, and
   interpolated the gradient colour at each.
3. Screenshotted each button, decoded the PNG back through a canvas, and sampled painted pixels.

**What I found:**

Per-stop arithmetic reproduces exactly: **9.82 / 6.56 / 4.33 : 1**. So does every code citation
(`Button.tsx:57–58`, `:75–78`, `:25–27`; gradient stops at `globals.css:33–39`).

But the operative claim fails. Only two gradient-faced controls exist on the homepage, and neither
label ever meets 4.33:1:

| button | size | label | worst corner of the **text rect** | passes 4.5:1 |
|---|---|---|---|---|
| "Create your letter" | 243×52 | 15px / 600 | **4.56 : 1** (t = 0.804) | **yes** |
| "Share to help another family" | 498×56 | 15px / 700 | **4.50 : 1** (t = 0.798) | **yes** |

The reason: the gradient does not end at the dark stop. It runs `#a87e45 78% → #c9a063 100%`, so
by the time the axis position reaches the bottom-right of the label box (t ≈ 0.80) the paint has
already lightened back to ≈ `rgb(172,130,72)`. The 4.33:1 minimum exists on the button *face*,
and its iso-line does clip the label's bounding box — but the region below 4.5:1 inside that box
is roughly **0.5% of its area, a triangle in the bottom-right corner where there is no glyph ink**
(for "Create your letter": vertices ≈ (200,35), (208,35), (208,30) in a 173×19 box). My pixel pass
bottomed out at ~3.2:1 but on inspection those are navy/gold antialiasing pixels at glyph edges,
not background — I discount them and say so rather than use them to inflate the case.

**A1's own least-confidence note called this exactly right** ("On a short wide button the dark stop
may fall entirely outside the text"). It effectively predicted its own refutation.

**Separately, the recommendation is directionally wrong and would make things worse.** A1 says
*"Darken the gradient's late stops … moving the 78% stop from `#a87e45` toward `#9a7340` would do
it."* The label is **navy on gold**. Darkening the gold moves it *toward* the ink.
**`#9a7340` against `--navy-900` measures 3.70:1** — worse than the 4.33:1 A1 was trying to fix,
and below AA. The correct direction is to **lighten** the 78% stop. If this were actioned as
written it would introduce the failure it set out to remove.

**Verdict:** REFUTED
**already_fixed:** false
**wrong_severity:** **true** — mission 1 / reach 3 / harm 2 should be **mission 0–1 / reach 1 /
harm 1**. The one durable item is A1's structural point, which I endorse: nothing in the token
file records that a gradient has no single contrast guarantee. Keep that as a comment-only
recommendation; drop the colour change.
**wrong_standard:** false — SC 1.4.3 Contrast (Minimum), AA, 4.5:1 below 18.66px bold / 24px is
correctly stated. (Minor: A1 says the variant's labels are "13px (sm) or 15px (lg)". No `accent`
button anywhere uses `sm`; the sizes actually in use are `lg` → 15px and `md` → 14px. Both are
still small text, so the threshold is unchanged.)

---

### A1-009 — CONFIRMED
**Original claim:** The "View sample" affordance is hover-revealed only, so touch users get no cue.

**What I did to check it:** Read the computed styles of every "View sample" element on live
production at rest, and read `SampleDocuments.tsx`.

**What I found:** Four instances, each `opacity: "0"`, `visibility: "visible"`, `fontSize: "10px"`,
enclosing link accessible name `"View sampleThe Letter of Intent"` / `"View sampleEmergency
sheet"` — A1's quoted accessible name is verbatim. `SampleDocuments.tsx:66` carries
`opacity-0 … group-hover:opacity-100 group-focus-visible:opacity-100`.

One correction: A1 says the reveal is `group-focus-within`. It is **`group-focus-visible`**. The
practical consequence is the same (keyboard focus reveals it, touch never does), and A1's
conclusion that assistive technology is unaffected is right — the label stays in the accessible
name regardless of opacity.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 1.4.13 Content on Hover or Focus is real (AA), and A1 correctly
says it is *not* violated and labels this a usability finding. That restraint is right.

---

### A1-010 — CONFIRMED
**Original claim:** 29 distinct font-size/line-height/family combinations on the homepage; five
different line-heights on 15px.

**What I did to check it:** Enumerated every element owning a text node on live production and
keyed by computed `fontSize|lineHeight|fontFamily`.

**What I found:** **29 distinct combinations — exact.** The per-size leading spread reproduces
value for value:

| size | A1 | me |
|---|---|---|
| 15px | 24.3, 25.5, 18.75, 24.75, 26.25 | **18.75, 24.3, 24.75, 25.5, 26.25** |
| 16px | 25.92, 25.6, 28, 27.2 | **25.6, 25.92, 27.2, 28** |
| 22px | 25.96, 29.7, 26.4 | **25.96, 26.4, 29.7** |
| 48px | 53.76, 56.64 | **53.76, 56.64** |

I additionally found two A1 did not list: **10px** with 2 leadings and **12px** with 4, and
**18px** with 2. The finding is if anything understated. Tokens are at `globals.css:116–120`
as cited.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 1 / harm 1 is honest; A1 says outright that nobody is blocked
**wrong_standard:** false — SC 1.4.12 Text Spacing is real (AA), and A1 explicitly does not claim
it fails, having not run the override

---

### A1-011 — CONFIRMED AS OBSERVED, but **already fixed and deployed**
**Original claim:** Production still shows the light "What is a Letter of Intent" section and a
posterless video.

**What I did to check it:** Located the "What is a Letter of Intent?" heading on live production
and read its ancestor `<section>`'s computed background.

**What I found:** **The opposite of what A1 recorded.** Today:

```
sectionClass:    "tw-panel-navy"
backgroundImage: "linear-gradient(168deg, rgb(29, 44, 70) 0%, rgb(22, 34, 58) 78%)"
headingColor:    "rgb(246, 244, 238)"        // --on-ink-heading, not --ink-700
```

`backgroundColor` does read `rgba(0,0,0,0)` — the same value A1 saw — but that is because the panel
paints via `background-image`, not `background-color`. A1's inference from a transparent
`backgroundColor` was sound against the old build and is misleading against this one. The poster is
also present. Commit `b243107` shipped both changes and production serves it.

**Verdict:** CONFIRMED (as observed pre-`b243107`) — **does not describe production today**
**already_fixed:** **true** — `b243107`, deployed
**wrong_severity:** false — A1 scored it 1/5/1 and called it "a state observation, not a defect",
which was exactly the right framing
**wrong_standard:** false (n/a)

---

### A1-012 — CONFIRMED (by better evidence than A1 offered)
**Original claim:** The shared screenshot set was captured against local dev, not production.

**What I did to check it:** (a) Cropped and magnified the exact regions A1 cites — `home-1440.png`
around x=14,y=326 and the two `wizard-medical` files — and looked at them.
(b) Read the tool that produced the set.

**What I found:** The conclusion is **provably right**, but not for the reason given.

- `audit/tools/capture-artifacts.mjs:16` reads `const BASE = "http://localhost:3000";` and every
  `page.goto` in the file (`:160`, `:190`) uses it. There is no production branch. The screenshot
  set is local dev, full stop.
- **I could not see any Next.js dev badge** in the crop at A1's coordinates in `home-1440.png` —
  the region is flat navy hero (`audit/evidence/v1/crop-home-1440.png`). A1's stated evidence is
  therefore unreproduced by me. It may have been a JPEG-scale artefact or a mis-transcribed
  coordinate.
- Corroborating: `wizard-medical-1440.png` is 1440×3153 and I measured `/letter/medical`'s
  `scrollHeight` at **3152** — the set is a full-page capture of that build.

So: right answer, weak evidence. If this finding is carried forward, cite `capture-artifacts.mjs:16`,
not a badge.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false (n/a)

---

## A2 — Usability, flow and form completion

A2's build-state note is correct: `HEAD` and `origin/main` are both `b243107` and production is
serving it. Everything A2 measured post-`b243107` is measurable today.

**One methodological trap I fell into first and record so nobody repeats it:** the app's storage
key is **`twl-loi-letter-v1`** (`src/lib/store.ts:5`), not anything under `mloi.*`. My first pass
patched `mloi*` and reproduced nothing, which would have refuted A2-001, A2-002 and A2-005
falsely. (`mloi.video.whatIsALetterOfIntent.position` *is* an `mloi` key, and its write is inside
a `try/catch` at `VideoPlayer.tsx:112–116` — that is what my bad patch was hitting.) With the
correct key everything reproduces.

---

### A2-001 — CONFIRMED (the single strongest finding across both reports)
**Original claim:** A browser that will not let the site write localStorage produces "This page
couldn't load" on every wizard section, in production.

**What I did to check it:** `addInitScript` patching `Storage.prototype.setItem` to throw a
`QuotaExceededError` for `twl-loi-letter-v1` **only**, then walked six production routes, with a
matching unpatched control run on the same URLs.

**What I found:** Reproduced on production, with A2's exact numbers.

| production route | blocked | control |
|---|---|---|
| `/letter/getting-started` | **0 inputs, 0 main chars, error boundary** | **5 inputs, 1405 chars** |
| `/letter/medical` | **0 inputs, 0 main chars, error boundary** | **8 inputs, 1809 chars** |
| `/` | 4708 chars, renders | — |
| `/letter` | 3220 chars, renders | — |
| `/letter/review` | 326 chars, renders | — |
| `/your-data` | 2072 chars, 1 input, renders | — |

The wizard pages render, verbatim: `This page couldn't load Reload to try again, or go back.
Reload Back`. `pageerror` captured `QuotaExceededError: The quota has been exceeded.` — twice on
the crashing routes. A2's control figures (5/1405 and 8/1809) are **identical to mine, to the
character.** Every code citation checks out: `store.ts:38` (`setLastVisited` set call),
`store.ts:49–57` (persist config, `createJSONStorage(() => localStorage)`, no error path),
`SectionScreen.tsx:31–37` (effect firing `setLastVisited` on mount). The contrast A2 draws is
also real — `PhotoFields.tsx:119–123` catches exactly this class of failure and speaks to the user.

**Something A2 understated:** the uncaught `QuotaExceededError` fires on `/`, `/letter`,
`/letter/review` and `/your-data` too. Those routes survive only because no component throws
during render there. The blast radius is the whole app; the *visible* crash is the wizard.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 5 / reach 2 / harm 5 is right. Reach 2 is appropriately
conservative given A2's honest NOT_VERIFIED note on prevalence.
**wrong_standard:** **partially true** — SC 3.3.1 Error Identification applies where "an input
error is automatically detected"; a storage write failing during mount is not an input error, so
3.3.1 is a stretch. There is no clean WCAG hook for this; it is a robustness defect. Nielsen
heuristic 9 (recognise, diagnose, recover) is exactly right and should carry the citation on its
own. Do not put 3.3.1 in a VPAT on the strength of this.

---

### A2-002 — CONFIRMED
**Original claim:** The progress bar reads 100% and "Every section has notes" when 15 of 83
questions are answered.

**What I did to check it:** Seeded `twl-loi-letter-v1` with **exactly one scalar answer in each of
the 15 special-needs sections** (using real field ids from the content modules), then loaded
`/letter/getting-started` and `/letter/review` — **on both production and dev**.

**What I found:** Identical on both environments:

```
barStyle:              "width: 100%; background: var(--gradient-gold);"
rail:                  "You've added notes to 15 of 15 sections."
rail:                  "Every section has notes. A yearly review keeps it trustworthy."
review:                "Every section has notes. All three files are created right here on
                        your device: nothing is uploaded."
```

A2's quoted strings are **verbatim**. The mechanism is exactly as cited: `derive.ts:57–60`
`sectionHasContent` uses `def.fields.some(...)`; `WizardRail.tsx:24` computes `count` from
`startedCount`, `:36–49` sets `width: ${Math.round((count/total)*100)}%` and gates the "Every
section has notes" line on `count === total`.

I independently checked the denominator: 86 top-level `id:` entries across the 15 special-needs
section modules, of which 3 are repeaters (`familySupport.contacts`, `medical.providers`,
`medical.medications`) — **83 questions.** A2's number is exact.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 5 / reach 5 / harm 4. I would not lower it. The forward harm
(stopping at 18% believing you are done) and the backward harm (a 2034 reader unable to
distinguish "nothing to say" from "never got there") are both real and both invisible in analytics.
**wrong_standard:** false — A2 cites Nielsen 1 and 10 and explicitly says SC 3.3.2 applies "in
spirit rather than letter", which is the honest framing

---

### A2-003 — CONFIRMED
**Original claim:** The promised 45–90 minutes is contradicted by per-section badges summing to 165.

**What I did to check it:** Summed the `minutes:` values straight out of the content modules for
both paths, and opened every quoted claim location.

**What I found:** Special needs: 5+10+10+15+10+15+15+10+10+10+10+10+10+10+15 = **165**. General
path (10 own sections + 4 shared): **145**. Both **exact**. Every citation is exact to the line:

- `src/app/page.tsx:167` — "No account. No email required. About 45–90 minutes, in as many sittings"
- `src/app/letter/page.tsx:46` — "About 45–90 minutes in total"
- `src/lib/content/paths.ts:57` — `minutesLabel: "45–90 minutes"` (and `:87` — `"40–80 minutes"`)
- `src/lib/content/sections/01-getting-started.ts:15` — "Most families finish in 45 to 90 minutes"
- `src/lib/content/sections/general/index.ts:33` — "40 to 80 minutes"

And the badge really is rendered on every section page: `SectionScreen.tsx:57–58` prints
`Section NN of 15 · about {def.minutes} minutes`. The contradiction is on screen, not inferred.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 5 / harm 3 is fair
**wrong_standard:** false — no SC claimed, correctly

---

### A2-004 — CONFIRMED
**Original claim:** "Start your letter" lands on a 5,905px chooser; the explicit start button is at
y=4445; the option cards are 614/624px reading cards.

**What I did to check it:** Loaded `/letter` on production at 390×844, dsf 3, `isMobile`, and
located the button whose text is **exactly** "start the special needs letter" (my first attempt
matched the card, because the card's own text contains that string — worth knowing).

**What I found:**

| | A2 | me |
|---|---|---|
| document height | 5905 | **5881** |
| screens of scroll | 7.0 | **7.0** |
| explicit start button y | 4445 | **4421** |
| option card heights | 614 / 624 | **614 / 624** |
| header CTA reachable without opening the menu | false | **false** |
| any start CTA in the first viewport | false | **false** |

The two ~24px drifts are font-loading jitter. The card heights are identical. `COMPACT_BELOW = 1100`
at `SiteHeader.tsx:12` is exact, and the option cards really are `<button>` elements
(`PathChooser.tsx:70–118`).

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — heuristic citation only, correctly

---

### A2-005 — CONFIRMED
**Original claim:** A returning family typing the domain sees a marketing homepage with no sign
their letter exists.

**What I did to check it:** Seeded a real letter (2 sections, `lastVisitedSlug: "medical"`,
24-hour-old timestamps), then loaded `/` and `/letter` — on production and dev.

**What I found:** Identical on both:

| | `/` | `/letter` |
|---|---|---|
| "Pick up where you left off" | **false** | **true** |
| "Continue your letter" | false | — |
| header CTA | `START YOUR LETTER · IT'S FREE SHARE` (unchanged) | — |

`ResumeCard.tsx:13–21` returns `null` unless hydrated with content, and it is imported only by
`src/app/letter/page.tsx`. Both cited facts are exact.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 4 / harm 3 is well judged for a product whose whole
model is "come back in a few sittings"
**wrong_standard:** false

---

### A2-006 — CONFIRMED
**Original claim:** A keyboard user passes 17 navigation links before the first question, on every
section; 23 tab stops on getting-started, 25 on medical; "Skip to main content" does not help
because the rail is inside `main`.

**What I did to check it:** Drove real `Tab` presses from a blurred body at 1280px and recorded
`document.activeElement` at every stop until the first form control.

**What I found:** **23 and 25 — exact.** The trail is A2's, verbatim in order:

```
Skip to main content · My Letter of Intent, home · Start your letter · it's free · Share ·
How it works · 01 Getting started … 15 Your message · Review & download → ·
Back up or delete your data · [first input]
```

The rail contributes exactly **17** focusable links (15 sections + "Review & download →" + "Back up
or delete your data"), matching the title. The skip link's `href` is `#main` and the rail *is*
inside `main` — I checked directly. `layout.tsx:16–23` and `app/layout.tsx:94–105` are the right
citations.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 3 / reach 2 / harm 4 is proportionate, and A2's INSPECTED
label is honest (no screen reader was driven)
**wrong_standard:** **partially true** — **SC 2.4.1 Bypass Blocks (A)** is apt and well argued:
a bypass mechanism exists but does not bypass the repeated block. **SC 2.4.3 Focus Order (A) is
not applicable** — focus follows DOM order and preserves meaning, which is all 2.4.3 requires.
Drop 2.4.3.

---

### A2-007 — CONFIRMED
**Original claim:** At 200% zoom the sticky masthead and privacy strip eat 45% of the screen; the
user sees 212px of content.

**What I did to check it:** Independently emulated 512×384 at `deviceScaleFactor: 2` and a 1024×768
control, and measured the header and the element after it.

**What I found:** **Every number identical.**

| | A2 | me |
|---|---|---|
| `zoom200-512x384` headerH / stripH | 114 / 58 | **114 / 58** |
| chrome % of viewport | 45 | **45** |
| usable rows | 212 | **212** |
| screens of scroll | 6.8 | **6.8** |
| horizontal overflow / scrollWidth | 0 / 512 | **0 / 512** |
| `zoom100-1024x768` chrome % | 25 | **25** (149 + 40 = 189 of 768) |
| screens | 2.9 | **2.9** |

Header `position: sticky` confirmed. The first form field at that zoom sits at y=885 — more than
two screens down.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — and notably A2 states plainly that **SC 1.4.4 and SC 1.4.10 both
pass** and that this is a usability finding above the conformance floor. That is the correct and
unusually disciplined call; I would keep the sentence.

---

### A2-008 — CONFIRMED
**Original claim:** Repeaters start at zero items, hiding 6 of Medical's 14 controls and 7 of 9 on
Family & support.

**What I did to check it:** Rendered `/letter/medical` and `/letter/family-and-support` cold and
counted controls and empty-state copy.

**What I found:** `/letter/medical`: **8 controls**, two add buttons (`+ Add a provider`,
`+ Add a medication`), and the empty copy verbatim — *"Nothing here yet — add the first provider
whenever you're ready."* `/letter/family-and-support`: **2 controls**, one add button, same copy
pattern. Both control counts are **identical to A2's inventory**. `derive.ts:117–137` initialises
every repeater to `[]`; `derive.ts:191–195` builds the emergency sheet's medication list from
`data.medical.medications`. The consequence A2 draws is real.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 5 / harm 4 for the artefact used under pressure is
right
**wrong_standard:** false

---

### A2-009 — CONFIRMED
**Original claim:** "Who would you call first in an emergency?" makes the family retype a person
already in the contacts list.

**What I did to check it:** Read `03-family-support.ts` and `derive.ts` around `keyPoints()`.

**What I found:** Exact on every limb. `03-family-support.ts:14–57` is the `contacts` repeater
whose `itemFields` include `{ id: "emergency", kind: "checkbox", label: "Emergency contact —
include on the emergency sheet" }`, **immediately** followed by
`{ id: "firstCall", kind: "text", label: "Who would you call first in an emergency?", placeholder:
"e.g., My sister Dana — she can be there in 15 minutes" }` — A2's quotes are verbatim.
`derive.ts:292–304` `keyPoints()` pushes `firstCall` first, then appends every
`emergency === true` contact as `name · relationship · phone`, then `splice(MAX_CALL_ORDER)`.
Two mechanisms, one job, exactly as described. The stale-phone-number failure mode is real.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A2-010 — CONFIRMED
**Original claim:** "Today's date" is an empty date picker the app could have filled in.

**What I did to check it:** Rendered `/letter/getting-started` cold and read the date input; read
`derive.ts` and the content module.

**What I found:** `<input type="date">` present, **`value: ""`**, label **"Today's date"** —
exact. `01-getting-started.ts:46–51` defines it; `derive.ts` has `todayIso()` (:91–97) and
`letterDateIso()` (:99–102) with the fallback already in place;
`defaultValuesForSection` (:108–140) sets `""` for every scalar. Every citation lands.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 2 / harm 2, correctly small
**wrong_standard:** false — **SC 3.3.7 Redundant Entry is genuinely new in WCAG 2.2 and is Level
AA**, and A2 correctly qualifies it as "in spirit" (3.3.7 covers re-entry of information the user
previously supplied in the same process, not facts the system independently knows). Well handled.

---

### A2-011 — CONFIRMED
**Original claim:** The two chooser cards are buttons with 94- and 101-word accessible names.

**What I did to check it:** Measured the text content and word count of the oversized `<button>`
elements on `/letter`, and counted headings inside them.

**What I found:** **529 / 550 characters, 88 / 95 words, 0 headings inside** — against A2's
535/94 and 556/101. My counts are a floor: `textContent` concatenates adjacent spans without
separators ("Option 1For a loved one…"), so A2's accessible-name computation, which inserts word
boundaries, is the more accurate figure. Same order, same conclusion. `PathChooser.tsx:70–118`
confirms a `<button>` wrapping only `<span>` elements — and A2's parenthetical about why there
are no headings inside (a button's content model forbids them) is correct.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 2.5.3 Label in Name is real (Level A) and A2 correctly says it is
"arguably satisfied but the intent is not", falling back on ARIA authoring practice

---

### A2-012 — CONFIRMED
**Original claim:** A wizard section page has exactly one heading, even Medical at 3,596px.

**What I did to check it:** Queried every `h1…h4` inside `main` on two section routes and measured
`scrollHeight`.

**What I found:** `/letter/getting-started` → `["H1 Getting started"]`. `/letter/medical` →
`["H1 Medical"]`. **One heading each — exact.** `/letter/medical` `scrollHeight` = **3152**,
identical to A2's inventory figure (the 3,596 in the title is with one item open per repeater,
which A2 states). Questions are `<label>`s, repeaters are `<legend>`s; there is no intra-section
heading structure at all.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 1.3.1 (A) is apt; SC 2.4.10 Section Headings is correctly identified
as AAA

---

### A2-013 — CONFIRMED
**Original claim:** Up to 600ms of typing is lost on a mid-keystroke reload; there is no unload flush.

**What I did to check it:** Ran the three decisive scenarios myself against dev, reading
`twl-loi-letter-v1` directly.

**What I found:**

| scenario | stored | value after reload | preserved |
|---|---|---|---|
| reload with zero delay | **null** | **`""`** | **false** |
| reload after 900ms | `"Maria Alvarez"` | `"Maria Alvarez"` | true |
| in-app nav, no pause | `"Maria Alvarez"` | — | true |

Exactly A2's result, including the empty-string-after-reload detail. `AUTOSAVE_MS = 600` at
`SectionForm.tsx:31`; the unmount flush at `:71–79`; and `grep` over all of `src/` for
`beforeunload|pagehide|visibilitychange` returns **nothing**.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — and A2 deserves credit for writing "I am not going to inflate it" and
then scoring it 1/2/2. That is the right instinct and I found nothing to raise it with.
**wrong_standard:** false — "n/a, engineering hygiene" is correct

---

### A2-014 — REFUTED in substantial part
**Original claim:** The wizard "leaves 'waiver', 'IEP', 'AAC', 'day program' and 'advance
directive' undefined."

**What I did to check it:** Grepped the entire content tree for each named term and read the
surrounding `label` and `help` strings; then opened `audit/evidence/a2/comprehension.json`, which
A2 cites as the evidence.

**What I found:** **Three of the five headline terms — including the two A2 argues hardest about —
already carry exactly the gloss A2 recommends adding.**

- **IEP — REFUTED.** `src/lib/content/sections/08-education-work.ts:26`:
  *"An IEP (Individualized Education Program) is the written plan a school builds for a student
  with a disability."* A2's recommendation is *"an IEP — the school's written plan for how they
  are taught"*. It is already there, define-at-first-use, one line below the label that introduces
  the term.
- **AAC — REFUTED.** `src/lib/content/sections/05-communication.ts:19`: *"Speech, an AAC device or
  app (a tablet or device that speaks for them), sign language, gestures…"* A2's proposed gloss —
  *"AAC — a device or picture system they use to speak"* — is a paraphrase of text that exists.
- **waiver — REFUTED as stated.** A2 writes that waiver *"is used four times across three sections
  as though everyone knows it"*. `src/lib/content/sections/09-housing.ts:34` says:
  *"A Medicaid waiver pays for long-term support at home or in the community. In Virginia these
  are the DD waivers, and the waitlist runs years."* That is a better gloss than the one A2
  proposes. It is genuinely bare in Medical (`06-medical.ts:96`, "CCC Plus waiver") and Benefits
  (`10-benefits-finances.ts:26`, "any waiver programs"), so *first use in those sections* is
  unglossed — but the claim that the product treats the word as common knowledge is false.
- **sensory — REFUTED.** `04-typical-day.ts:58–62` labels it "Sensory sensitivities" and the help
  enumerates *"Sounds, lights, textures, smells, crowds, touch. What overwhelms — and what
  soothes?"* That is explanation by enumeration, which is what plain-language practice asks for.
- **day program — CONFIRMED undefined.** `08-education-work.ts:18`, label only.
- **advance directive / living will — CONFIRMED undefined.** `14-final-wishes.ts:50`:
  *"If there's an advance directive or living will, say where it is."* No gloss.

The cited evidence does not support the claim either. `comprehension.json` contains a jargon
**inventory** (`jargonAcrossWizard`, and a per-section `jargon` array listing terms *present*).
Nothing in it distinguishes glossed from unglossed. The "undefined" judgement was made in prose,
by eye, and it is wrong on the majority of its examples.

What survives: **two** genuinely bare terms ("day program"; "advance directive"/"living will"), plus
a narrower and still-valid point that "waiver" is glossed in Housing but used cold in Medical and
Benefits.

The reading-level half of the finding is **fully confirmed** — `comprehension.json` gives
`sectionGradeMin 3.6, sectionGradeMax 6.5, sectionGradeMean 4.9, sectionsAboveGrade10 0`, exactly
as A2 reports, and A2's instruction not to touch the prose is right.

**Verdict:** REFUTED (in substantial part; a narrow residue is real)
**already_fixed:** false — these glosses are not new; `git log` shows no mid-run content change here.
This is a reading error, not staleness.
**wrong_severity:** **true** — mission 3 / reach 4 / harm 3 rests on the rhetorical weight of
"waiver is the single most consequential word in US disability services and it is used as though
everyone knows it", which is false. Corrected: **mission 1 / reach 2 / harm 2** — two help-text
edits and one cross-reference, not eight.
**wrong_standard:** false — SC 3.1.3 Unusual Words and SC 3.1.4 Abbreviations are both real and
both correctly identified as AAA

---

### A2-015 — CONFIRMED
**Original claim:** There is no way to find an answer; no search input, no `role="search"`.

**What I did to check it:** Queried `[role="search"]` and `input[type="search"]` on the production
homepage and on both wizard routes.

**What I found:** **0 and 0 everywhere.** `WizardRail.tsx` lists sections only and the "has notes"
dot is section-level. A2's own hedge in the recommendation — that field anchors (`id="f-${field.id}"`,
`SectionForm.tsx:106`) exist but the scroll-on-cold-load behaviour is untested — is honest and I
did not test it either.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 3 / reach 4 / harm 2 is right for a "makes the yearly review
less likely" finding
**wrong_standard:** false

---

### A2-016 — CONFIRMED
**Original claim:** "Download all three" takes ~14s on a CPU-throttled phone with no progress
beyond a disabled label.

**What I did to check it:** 390×844 emulation, `Emulation.setCPUThrottlingRate: 4`, a seeded
letter, then clicked and polled the button's busy state every 250ms.

**What I found:** **13,424 ms** against A2's 13,701 ms — a 2% difference. The only signal during
the wait is the label, verbatim: **"Preparing your files…"**. No bar, no per-file tick.
`ReviewScreen.tsx:70–89, 173–187` are the right citations. A2's own disclosure that 4× CPU
throttling is a stand-in rather than a phone measurement is the correct caveat and I inherit it.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 4 / harm 3 at the moment the whole product exists for
**wrong_standard:** false — the 10-second threshold for a determinate indicator is standard
HCI guidance (Miller/Nielsen), correctly cited as a heuristic not an SC

---

### A2-017 — CONFIRMED
**Original claim:** On Slow 3G nothing is painted for 7.8 seconds on production.

**What I did to check it:** This is the one finding I initially failed to reproduce, and the
failure was mine. My first run used a hand-rolled "slow 3G" (500 Kbps / 400 ms RTT) and got
FCP 3,672 ms — I would have wrongly downgraded A2. I re-ran with **Chrome DevTools' actual
constants** (Slow 3G = 400 Kbps down / 400 Kbps up / **2000 ms** RTT; Fast 3G = 1.6 Mbps /
750 Kbps / 562.5 ms), with a real `PerformanceObserver` for LCP.

**What I found:**

| | A2 | me (DevTools constants) |
|---|---|---|
| Slow 3G FCP | 7,824 ms | **7,636 ms** |
| Slow 3G LCP | 7,824 ms | **7,636 ms** |
| Fast 3G FCP | 2,172 ms | **2,164 ms** |
| unthrottled FCP | 236 ms | **248 ms** |
| transfer | 495,943 B | **483,366 B** |

FCP and LCP land within 2.5%. Fast 3G is within 8 ms. The one number that does not reproduce is
the **load event: 18,359 ms against A2's 28,286 ms** — plausibly a build difference, since the
site has changed since (og-image added, poster image added) and `load` waits on every subresource.
The finding rests on FCP/LCP, which reproduce.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission 4 / reach 3 / harm 3, and A2 explicitly hands the diagnosis to
a performance analyst rather than guessing, which is the right boundary
**wrong_standard:** false — the Core Web Vitals LCP "good" threshold is 2.5 s at p75, correctly
stated

---

### A2-018 — CONFIRMED
**Original claim:** The explainer video has no captions and no transcript; the adjacent prose is
not an equivalent alternative.

**What I did to check it:** Fetched the served production HTML (`grep -c '<track'` → **0**), scanned
the live DOM for any transcript affordance, read `VideoPlayer.tsx` at `HEAD`, and counted the
adjacent column.

**What I found:** Confirmed on every limb, and A2's own production check is reproduced: the served
HTML carries the play-button `aria-label` *"Play the video: what a Letter of Intent is, and how
the builder works"* and references `/video-poster-lockup.png`, and contains **no `<track>`
anywhere**. The in-source comment at `VideoPlayer.tsx:201–202` still records the belief that the
requirement is met. The adjacent column (`src/app/page.tsx:267–289`) is **two paragraphs plus a
disclaimer line, ~140 words** — A2's "roughly 130 words" is accurate — and it does define what a
Letter of Intent is and say it is not legally binding, while covering neither "what to write" nor
"how the builder works". A2's conclusion that it is not an equivalent alternative and is not
labelled as one is correct.

A2's caveat "A2-018 is a code inspection of an uncommitted file" is now stale in the analyst's
favour: the file is committed at `b243107` and deployed.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false. Note A1-007 scores the same defect mission 3 / harm 5 and A2-018 scores
it mission 2 / harm 4. Both are defensible; when the reports are merged, use one score.
**wrong_standard:** false — and A2's sentence *"A nearby text summary does not satisfy 1.2.2 at
all; captions are required for synchronized media regardless of what else is on the page"* is a
precisely correct statement of the SC. Levels (1.2.2 = A, 1.2.3 = A) are right.

---

## COUNT

| verdict | count | ids |
|---|---|---|
| **CONFIRMED** | **28** | A1-001, A1-002, A1-003, A1-004, A1-005, A1-006\*, A1-007, A1-009, A1-010, A1-011\*, A1-012; A2-001, A2-002, A2-003, A2-004, A2-005, A2-006, A2-007, A2-008, A2-009, A2-010, A2-011, A2-012, A2-013, A2-015, A2-016, A2-017, A2-018 |
| **PLAUSIBLE** | **0** | — |
| **REFUTED** | **2** | **A1-008**, **A2-014** |
| **already_fixed** | **2** | A1-006, A1-011 (\*confirmed as observed; both fixed in `b243107` **and deployed** — they do not describe production today) |
| **wrong_severity** | **3** | A1-006, A1-008, A2-014 |
| **wrong_standard** | **3** | **A1-002** (2.4.11 AA → 2.4.13 AAA / lead with 2.4.7), A2-001 (3.3.1 is a stretch), A2-006 (drop 2.4.3) |

Thirty findings examined. Twenty-eight survived, most of them with numbers identical to three
significant figures. That is a higher survival rate than I expected going in, and it is not for
lack of trying: I recomputed the oklab colour mix from the CSS Color 4 matrices rather than trust
a canvas readback, sampled real painted pixels rather than argue geometry, ran the axe scan A1
could not run, and re-drove every A2 persona measurement with my own scripts. Where the analysts
hedged, they hedged in the right places — A1's three least-confident findings include the one I
refuted, and A2's least-confident list includes the one number I had to re-run to confirm.

---

## Strongest findings — the ones that survived the hardest scrutiny

1. **A2-001 (storage-blocked browsers crash the wizard).** I tried to kill this twice — once with
   the wrong storage key, which produced a false negative I nearly reported. With the right key it
   reproduces **on production**, with a matched control run, and the control numbers (5 inputs /
   1405 chars; 8 inputs / 1809 chars) are *identical to the analyst's, to the character*. The user
   is told the page is broken rather than that they cannot use the tool. Nothing about this is
   inferred. Only the WCAG hook is soft.
2. **A1-002 (focus ring at 1.26–1.58:1 on every light ground).** Independent oklab arithmetic
   returned `#e2caaa` with a zero delta, and all seven contrast ratios matched to two decimals.
   Then I focused a real link on production and read the painted outline — pale cream on pale
   cream, confirmed at the pixel level. `--ring: var(--navy-700)` sits unused three lines above.
   Cite it as 2.4.7 / 2.4.13, not 2.4.11.
3. **A2-002 (100% bar at 18% answered).** Reproduced on *both* production and dev with verbatim
   string matches, and I independently derived the 83-question denominator (86 top-level fields
   minus 3 repeaters). The two-directional harm — a parent stopping early, and a 2034 reader unable
   to tell "nothing to say" from "never got there" — is the most consequential thing in either report.
4. **A2-007 (45% of the viewport is fixed chrome at 200% zoom).** Every one of eight measurements
   came back identical. And A2 states plainly that both relevant SCs *pass*, which is the kind of
   restraint that makes the rest of the report trustworthy.
5. **A2-003 (165 vs 45–90 minutes).** Pure arithmetic against numbers the app itself prints, with
   five citations that are all exact to the line. Nothing to attack.

## Weakest findings I could not fully refute

1. **A1-005 (pre-hydration header).** The components are all measured — I got 111px of overflow
   against A1's 94px with JS disabled — but neither of us has measured how long the window lasts on
   a real phone on a real connection. It could be 60 ms and imperceptible. The severity is
   inference. The recommendation (CSS media query instead of `useState`/`matchMedia`) improves the
   code regardless, which is the only reason I would still act on it.
2. **A1-004 (105-character writing measure).** The measurement is unimpeachable (778px inner on
   seven textareas, identical to A1). The *harm* rests on general typographic research, not on
   evidence about these users, and A1's own counter-argument — a wide box may say "write as much as
   you like" — is genuinely persuasive. This wants a user test, not another measurement.
3. **A2-011 (94/101-word accessible names).** The fact is certain; the harm is inferred from
   structure. Neither analyst nor I drove a screen reader, so "a screen reader user hears one
   unbroken hundred-word label with no way to stop" is a reasonable model of NVDA/VoiceOver
   behaviour, not an observation. A2 labels it INSPECTED, correctly.
4. **A2-016 (14-second download).** I reproduced 13,424 ms against 13,701 ms — but both of us
   measured a 4× CPU multiplier on a desktop, not a phone. The number is directionally right and
   precisely wrong.

## What both analysts missed while I was in there

1. **A1-008's fix would introduce the bug it is trying to remove.** The label is navy on gold;
   darkening the gradient's dark stop moves the ground *toward* the ink. **`#9a7340` against
   `--navy-900` measures 3.70:1** — worse than the 4.33:1 A1 set out to fix, and a genuine AA
   failure. If anyone actions that recommendation as written, the site gets less accessible. The
   correct direction is to lighten.
2. **The axe run nobody had.** A1 disclosed it ran none; A2 was out of lane. I ran
   `@axe-core/playwright` with `wcag2a/2aa/21a/21aa/22aa/best-practice` across seven **production**
   routes. Result: the only violation on any route is **`region` (moderate, best-practice)** —
   the privacy strip's text sits outside any landmark, `.leading-\[1\.5\] > .min-w-0`. **Zero
   WCAG A/AA violations.** That independently corroborates A1's "zero text-contrast failures in my
   scan", and it means A1-002/003/008 are all outside axe's reach — 2.4.13 has no automated rule,
   there is no font-size rule, and the gradient button lands in `color-contrast` **incomplete**
   rather than violation. Between 3 and 23 `color-contrast` incompletes per route is where the
   remaining risk lives; nobody has resolved those by hand.
3. **A2-001's blast radius is wider than reported.** The uncaught `QuotaExceededError` also fires on
   `/`, `/letter`, `/letter/review` and `/your-data`. Those routes survive by luck — nothing throws
   during their render. Meanwhile `VideoPlayer.tsx:112–116` wraps its own `localStorage.setItem` in
   a `try/catch` with a comment explaining why. The codebase already knows the hazard in one place
   and not in the one that matters.
4. **`--ring` and `--ring-w` are dead tokens.** Zero references anywhere in `src/`. Confirmed, and
   it makes A1-002's fix a two-line change rather than a new API.
5. **A1's "radius and shadow are fully disciplined" premise is partly false.** There are **20**
   non-token `rounded-*` utilities in `.tsx`, and Tailwind's `rounded-md` (0.375rem) is not
   `--radius-md` (8px) — which is exactly why the built CSS carries 7 radii against 6 tokens. Only
   2 of 6 radius tokens are ever used. The finding survives, but the "the discipline exists here,
   it just wasn't applied to type" argument is weaker than presented.
6. **A1's screenshot-provenance evidence is unreproducible, but the claim is provable outright.**
   I could not find the Next.js dev badge at the coordinates A1 gives.
   `audit/tools/capture-artifacts.mjs:16` hardcodes `http://localhost:3000` and has no production
   branch. Cite the script, retire the badge.
7. **A2's own jargon evidence does not support A2-014.** `comprehension.json` is an inventory of
   terms *present*, not terms *unglossed*. The "undefined" judgement was made by eye and is wrong
   for IEP, AAC, waiver-in-Housing and sensory. Any finding whose evidence file cannot in principle
   answer the question it is cited for should be re-derived before it ships.
8. **A1-006 and A1-011 will read as live defects to anyone skimming the merged report.** Both were
   true when written and both are deployed-fixed. They need a "resolved" banner, not a fix ticket.
9. **The same video-caption gap is filed twice** (A1-007 at mission 3 / harm 5, A2-018 at
   mission 2 / harm 4) with different scores. De-duplicate before ranking, or it will be
   double-counted in whatever prioritisation comes next.
10. **A2-006 leaves a cheap corroboration on the table:** the rail is a `nav` inside `main` with no
    accessible name, so even a screen-reader user who knows it is there cannot jump to it by
    landmark. That strengthens the finding at no evidential cost.
