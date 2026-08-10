# V5 — Adversarial verification of A9 (Distribution and Adoption)

**Verifier stance:** refute-first. Every citation re-opened, every number recomputed,
every manual test re-driven. 23 findings assigned (A9-001 through A9-024; **there is no
A9-009** — the file skips it, confirmed by `grep -c "^- id: A9-"` = 23).

**Verification environment**
- HEAD `b243107` (moved from `d5ec230` mid-audit, as briefed). `git status` shows **no
  uncommitted source changes** — only audit files. So every "uncommitted/local" claim in
  A9 now refers to committed code.
- **Production is now serving `b243107`.** Independently established three ways: the
  homepage caption reads `Watch · under 5 minutes`; the homepage serves the poster button
  with `video-poster-lockup.png` and **zero `<video>` elements on first paint**; and
  `https://myletterofintent.com/og-image.png` is **88,371 bytes**, byte-count-identical to
  `git show b243107:public/og-image.png` and different from `a44c334`'s 62,358. This
  matters for A9-024, A9-022 and A9-002.
- Fresh production fetches (curl, 9 Aug 2026, 21:2x UTC) of 12 routes; fresh Chromium
  (Playwright) runs against production for DOM, geometry, network and GA4.
- New scripts written (analysis-only, under `audit/tools/`, no app code touched):
  `v5-verify.mjs`, `v5-review.mjs`, `v5-cfbeacon.mjs`, `v5-pdf-attribution.mjs`.
- **A9 cites no axe results** (`grep -c "axe"` = 0), so the axe-integrity concern in my
  brief does not apply to this file.
- **A9 disclosed its own screenshot-environment problem up front** (its "Environment
  note" states `audit/evidence/screenshots/` is localhost). I nevertheless re-verified
  both screenshot-backed findings (A9-011, A9-012) against **production HTML** rather
  than accepting the local screenshot.

---

### A9-001 — CONFIRMED
**Original claim:** All 25 `/letter/<slug>` pages emit `<link rel="canonical" href="https://myletterofintent.com"/>` while the sitemap submits them at priority 0.7–0.8.

**What I did to check it:** Fetched production `/letter/medical`, `/letter/getting-started`,
`/letter/about`, `/letter/final-wishes`, `/letter`, `/letter/review`, `/privacy`,
`/your-data`, `/samples/letter-of-intent-disabilities` with curl and extracted every
`<link rel="canonical">`. Fetched `https://myletterofintent.com/sitemap.xml` and counted
`<loc>` entries. Re-opened `src/app/letter/[slug]/page.tsx`, `src/app/layout.tsx`,
`src/app/sitemap.ts`.

**What I found:** Reproduced exactly.
- `/letter/medical`, `/letter/getting-started`, `/letter/about`, `/letter/final-wishes`
  → all four `canonical href="https://myletterofintent.com"`.
- Controls behave as A9 said: `/letter` → `.../letter`, `/letter/review` → `.../letter/review`,
  `/privacy` → `.../privacy`, `/your-data` → `.../your-data`.
- `src/app/letter/[slug]/page.tsx:11-17` — `generateMetadata` returns `{ title }` **only**. Exact.
- `src/app/layout.tsx:52` — `alternates: { canonical: "/" }`. Exact.
- `src/app/sitemap.ts:13-18` — section spread, `priority: slug === "getting-started" ? 0.8 : 0.7`. Exact.
- Sitemap: 30 `<loc>` entries, of which **exactly 25** are `/letter/<slug>`. Counted.

Two things that *strengthen* the finding, which A9 asserted only in its recommendation and
did not measure: every section page also carries the **identical** root meta description
(verified: `/letter/medical`'s description is verbatim the `DESCRIPTION` constant from
`layout.tsx:38-41`), and `src/app/sitemap.ts:5` carries the comment *"Section pages carry
real guidance copy, so they index."* — direct evidence the canonical is an accident, not a
decision.

One over-reach in the citation: A9 says a foreign canonical "is treated as a de-indexing
instruction." Google Search Central's "Consolidate duplicate URLs" describes rel=canonical
as a strong **hint** that Google may override, not a directive. The document cited is real
and on point, and the Search Console status string A9 quotes ("Alternate page with proper
canonical tag") is a real Page Indexing status — so this is a shading of emphasis, not a
wrong citation.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — though note A9 is right to concede the *effect* is unverified;
see "what was missed" on the weak landing experience of these pages.
**wrong_standard:** false

---

### A9-010 — CONFIRMED
**Original claim:** Both firm CTAs on `/letter/review` (`/reserve.html`, `/contact.html`) return 404.

**What I did to check it:** (a) `curl -sI` on all six firm URLs, with and without redirect
following. (b) Wrote `audit/tools/v5-review.mjs`: real Chromium against **production**,
seeded `localStorage["twl-loi-letter-v1"]` with a valid `gettingStarted` section (my first
seed used the wrong key shape and produced the "Nothing to review yet" empty state — I
corrected it against `src/lib/store.ts` and `src/lib/derive.ts` and re-ran), navigated to
`/letter/review`, harvested every `a[href^='http']` from the rendered DOM, then requested
each harvested URL. (c) Re-opened `src/config/firm.ts` and `ReviewScreen.tsx`.

**What I found:** Full reproduction, live, today:

```
404  https://trustsandwealth.com/reserve.html   "Book a conversation"
404  https://trustsandwealth.com/contact.html   "Contact Trusts & Wealth"
200  https://trustsandwealth.com/               "trustsandwealth.com"
200  https://g.page/r/CYJI2xbnvpz7EAE/review    "Leave a review"
200  https://calendar.google.com/... (Google calendar link)
200  https://outlook.live.com/...  (Outlook calendar link)
```
Replacements verified 200: `https://trustsandwealth.com/book`, `https://trustsandwealth.com/contact`.
Source citations exact: `firm.ts:73` consultUrl, `:74` contactUrl, `ReviewScreen.tsx:285`
and `:293`, and the one-off `${firm.website}/contact` at `privacy/page.tsx:329`.
The two dead links are also present in the **server-rendered** `/letter/review` HTML, so
they are on the page from first paint.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — and A9 is right that SC 2.4.4 is satisfied; it correctly
declined to dress a correctness defect as an accessibility failure.

---

### A9-002 — CONFIRMED
**Original claim:** Zero JSON-LD anywhere; competitors carry Article/FAQPage markup.

**What I did to check it:** Repo grep for `ld\+json|schema\.org|JsonLd|structuredData`
across `src/`, `public/`, `scripts/`. Production homepage: counted `ld+json` in the raw
HTML **and** ran `document.querySelectorAll('script[type="application/ld+json"]').length`
in a real browser (so client-injected JSON-LD would have been caught). Dumped the complete
`document.head` tag inventory from the live DOM. Then fetched three competitor pages from
A9's own SERP list with a browser UA and grepped their `@type` values.

**What I found:** Repo grep: no matches. Production `ld+json` count in raw HTML: 0. In-DOM
JSON-LD count: **0**. The full live head inventory matches A9's list item-for-item:
charSet, viewport, title, description, canonical, og:title/description/url/site_name/
image/image:width/image:height/image:alt/type, twitter:card/title/description/image, icon,
next-size-adjust, plus font and script preloads. No JSON-LD, no verification tag, no
hreflang, no author, no theme-color.

The external half — which A9 asserted without showing — I verified and it holds, 3 for 3:
- `yourlegacylegalcare.com/blog/special-needs-letter-of-intent...` → `BlogPosting`, `BreadcrumbList`, `Organization`, `Person`
- `specialneedstrustbystate.com/letter-of-intent/` → `Article`, **`FAQPage`**, `HowTo`, `HowToStep`, `Question`, `Answer`
- `template.net/letters/letter-of-intent/5` → **`FAQPage`**, `BreadcrumbList`, `Question`, `Answer`

**Verdict:** CONFIRMED — and stronger than filed.
**already_fixed:** false
**wrong_severity:** false. mission_impact 1 / harm 1 is honest self-restraint for a
machine-facing fix.
**wrong_standard:** false

---

### A9-003 — CONFIRMED
**Original claim:** No search-console verification in HTML or `/public`.

**What I did to check it:** Grepped the production homepage for
`google-site-verification|msvalidate|yandex-verification`; separately walked the **live
DOM head inventory** for any verification meta; listed `public/` and `public/fonts/`,
`public/samples/`.

**What I found:** 0 matches in HTML; no verification meta in the live head; no
`google*.html`, no `BingSiteAuth.xml`, no `yandex_*.html` under `public/`. A9's own caveat
about DNS TXT is the correct limit and I inherit it — I cannot see DNS either.

Small factual drift in A9's parenthetical inventory of `public/`: it lists "lockups, the
video, fonts, sample PDFs/PNGs, pdf.worker and og-image.png" — `public/social-logo.png`
(added mid-run) and `public/video-poster-lockup.png` are also there. Immaterial to the claim.

**Verdict:** CONFIRMED (correctly filed as INSPECTED, not MEASURED)
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-004 — CONFIRMED
**Original claim:** No answer-content; `/about` and `/for-professionals` 404; the SERP field is explainer articles and templates, and this site is absent.

**What I did to check it:** curl'd `/about` → **404** and `/for-professionals` → **404**.
Parsed the production sitemap (30 URLs) and cross-checked against `src/app/**`. Then ran
**both** of A9's two SERP queries on a live search engine independent of whatever A9 used.

**What I found:** Route absence confirmed. The SERP reproduction is close to exact for
query 1, "letter of intent special needs trust template free" — my results returned
**yourlegacylegalcare.com, specialneedsalliance.org ("The Special Needs Letter of Intent"),
specialneedstrustbystate.com, specialneedstrustsonline.com, template.net** — five of the
six sites A9 named, in a field made entirely of explainer articles and template farms, with
**no myletterofintent.com**. Query 2, "what happens to my child when I die", returned
specialneeds.com, generationlaw.com, umbrahealthadvocacy.com, PBS, **BBC** — different
individual URLs from A9's list (expected across engines/dates) but identical in shape:
articles, law firms, news; myletterofintent.com absent.

I also independently verified the one external fact A9 marked "Verified" in its channel
map: `thearc.org/resource/letter-of-intent/` exists, is The Arc's own LOI resource page,
and offers a downloadable template PDF.

**Verdict:** CONFIRMED (the measured half). The *benefit* of filling the gap remains
inference, which A9 itself lists as its second-least-confident finding — that self-marking
is accurate and I am not upgrading it.
**already_fixed:** false
**wrong_severity:** false. reach 4 rests on unquantified search volume; A9 says so.
**wrong_standard:** false (correctly marked "n/a — editorial")

---

### A9-005 — CONFIRMED
**Original claim:** The `/letter` question-preview accordion never reaches the server HTML.

**What I did to check it:** Fetched production `/letter` and searched for the accordion's
strings; re-opened `src/components/letter/PathChooser.tsx` and counted lines to the exact
citations; checked the control (`/letter/medical`'s server-rendered intro).

**What I found:** Production `/letter` is **55,495 bytes — byte-for-byte the figure A9
reported**, so the page has not changed since A9 measured it. Counts: "Be ready to write
about" = 0, "seizure" = 0, "allergies" = 0, "Funeral, burial or cremation" = 0, "Paid
supports" = 0, "Who to call first" = 0. The heading "Every question, before you start" = 1
(the shell renders; the contents do not). Control: `/letter/medical` contains "The medical
facts a new caregiver" = 1, from `src/lib/content/sections/06-medical.ts:11` — exact.

Line citations are exact, not approximate: `PathChooser.tsx:38` is
`const [open, setOpen] = useState<string | null>(null);` and `:253` is
`{isOpen && prompts ? (`. The stated risk is real: `role="tablist"` is at `:140` and
`role="tab"` at `:149`, so a `<details>` swap would indeed alter the a11y tree.
`preview-prompts.ts` is 139 lines (A9 said "roughly 78 lines" of prompt text — plausible
for the string payload inside a 139-line file; I did not split hairs).

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-006 — CONFIRMED
**Original claim:** Title/H1 carry almost none of the searched vocabulary; specific occurrence counts.

**What I did to check it:** Recomputed every count myself, case-insensitively, against the
production homepage HTML fetched today. Extracted `<title>` and every `<h1>`/`<h2>`.

**What I found:** All eleven counts reproduce **exactly**: SSI 0, Medicaid 0, IEP 0,
"ABLE account" 0, autism 0, "Down syndrome" 0, guardian 2, "special needs" 6,
disabilities 36, caregiver 13, trustee 8. Title:
`Letter of Intent Builder — Trusts & Wealth, PLLC`. Headings, in order: h1 "Write down
what only you know…", then h2 "Pick your letter and get started.", "What is a Letter of
Intent?", "Three steps, at your pace.", "Someone you know needs this too.", "Start with
ten minutes." — A9's list, verbatim and in order. `layout.tsx:47-50` exact.

Two adversarial notes. (1) A9 writes elsewhere that "the word 'template' appears nowhere";
a naïve grep returns 13 hits on the homepage — **but I checked every one** and they are all
`grid-template-columns` and RSC flight-payload `"template"` keys, never visible copy. A9's
claim survives; I mention it because a reader repeating the grep would think it failed.
(2) "'Trusts & Wealth, PLLC' occupies roughly a third of the title tag" — it is 21 of 47
characters, **~45%**. A9 understated its own point.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-007 — CONFIRMED
**Original claim:** Sample viewer pages are noindexed and absent from the sitemap while the raw PDFs are fully crawlable.

**What I did to check it:** Fetched production `/samples/letter-of-intent-disabilities`
(robots meta, canonical, title, description); parsed the sitemap for any `/samples` entry;
`curl -sI` on `https://myletterofintent.com/samples/sample-letter-of-intent-disabilities.pdf`
looking for `X-Robots-Tag`; re-opened `src/app/samples/[doc]/page.tsx`, `src/app/robots.ts`,
`src/lib/content/samples.ts`, `next.config.ts`.

**What I found:** Every element confirmed.
- Production: `<meta name="robots" content="noindex, follow"/>`, self-canonical, title
  `Sample — Letter of Intent — for a loved one with disabilities — Letter of Intent Builder`
  — A9's quoted title, verbatim.
- `samples/[doc]/page.tsx:20-22` — the comment "A watermarked example is not what should
  surface in a search result for the tool itself." at 20-21 and `robots: { index: false,
  follow: true }` at 22. Exact.
- `robots.ts:11` — `rules: [{ userAgent: "*", allow: "/" }]`. Exact. Live `/robots.txt`
  confirms `User-Agent: * / Allow: /`.
- Sitemap contains **no** `/samples` URL (all 30 enumerated).
- The PDF is served **with no `X-Robots-Tag` header at all** — so A9's "the bare PDF is the
  only crawlable version" is correct, verified at the header level rather than assumed.
- Four slugs confirmed in `samples.ts` at :40/:54/:68/:82.
- `next.config.ts:90` has `async headers()`, so A9's "one entry" costing is right.

One correction to the *recommendation*, not the finding: A9 says to "give each viewer page
a distinct description already available in `sample.subtitle`" — those descriptions are
**already wired up** (`generateMetadata` sets `description: sample.subtitle`, and the live
page carries a distinct 200-character description). Only the `noindex` and the sitemap need
changing.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-008 — CONFIRMED
**Original claim:** `/privacy`'s meta description ships an orphan fragment "of any kind."

**What I did to check it:** Re-fetched production `/privacy` and extracted the raw
`<meta name="description">`; re-opened `src/app/privacy/page.tsx:1-20` and counted lines.

**What I found:** Live, verbatim, today:

> `Everything you type stays on your device. No account, and nothing you write is ever captured — we count page visits and nothing else. of any kind. Here is exactly how that works, in plain words.`

Source: `privacy/page.tsx` line 9 = `description:`, 10 = `"Everything you type…"`,
11 = `"ever captured — we count page visits and nothing else. "`, 12 =
`"of any kind. Here is exactly how that works, in plain words.",`. A9's citation
(`:9-12`, "line 12 begins `of any kind.`") is exact to the character.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — harm 3 for a two-word fix on the site's trust-critical page is
defensible; if anything it is under-rated relative to its zero cost.
**wrong_standard:** false

---

### A9-011 — CONFIRMED
**Original claim:** No "who made this"; `attorneyBioBlurb` exists in config and renders nowhere.

**What I did to check it:** Rather than accept the cited **local-dev screenshot**
(`home-1440.png`), I re-tested against **production HTML**: searched the homepage for
"Claire Kelly", "Esq", "last reviewed", "Last updated", "About us"; enumerated every
`href="/…"` on the page; enumerated every `alt=""` string. Then grepped the whole repo
(not just `src/`) for `attorneyBioBlurb`. curl'd `/about`.

**What I found:** Production homepage: "Claire Kelly" = **0**, "Esq" = 0, "last reviewed" =
0, "Last updated" = 0. Internal links on the page are only `/`, `/letter`, `/privacy`,
`/your-data` — no `/about`. Image alt texts are `""`, "My Letter of Intent" (the lockup),
and the two sample thumbnails — **no person**. `/about` → 404.

`attorneyBioBlurb` is defined at `firm.ts:51` (interface) and `:91` (value). The single
user-facing attorney mention is `ReviewScreen.tsx:275` `{firm.attorneyName}` — exactly as
A9 said. **One correction:** A9's grep was scoped to `src/`, so it missed one reference
outside it — `scripts/review-doc/capture-pdf.mjs:48` maps `["attorneyBioBlurb", "Attorney
biography"]`. That is a build/review script, never rendered to a user, so the finding's
claim ("rendered nowhere") stands unchanged.

**Verdict:** CONFIRMED — and on stronger evidence than filed, since I replaced the local
screenshot with production HTML.
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false (correctly framed as E-E-A-T guidance, not a standard)

---

### A9-012 — CONFIRMED
**Original claim:** Zero social proof of any kind.

**What I did to check it:** Same substitution — production HTML instead of the local
screenshot. Searched the homepage for "testimonial", "Trusted by", "as seen", "endorse";
repo-grepped `src/` for the same; re-read `ReviewScreen.tsx:248-255`.

**What I found:** Production homepage: 0 for all four. Repo `src/`: 0 for
`testimonial|Trusted by|as seen|endorse`. The only third-party trust artifact is the
outbound "Leave a review" anchor at `ReviewScreen.tsx:249` pointing at `firm.reviewUrl`,
which I requested live: **200** (302 → 200 following). It does, as A9 says, solicit a
review of the *firm*, not the tool.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-013 — PLAUSIBLE
**Original claim:** Law-firm publication is the strongest and most limiting trust asset; other professionals will not hand over a competitor-branded document.

**What I did to check it:** Verified every branding citation line by line, and then went
further than A9 could: I **extracted the PDF text layer** of the generated Letter of Intent
(A9 said it could not — see A9-018) to see what actually lands on a family's cover.

**What I found — the facts half, all exact:**
- `src/app/page.tsx:76` — `A free, private Letter of Intent Builder from {firm.name}`
- `src/app/layout.tsx:48` — `default: \`Letter of Intent Builder — ${firm.name}\`` (A9 said
  "title template"; :48 is the *default*, :49 is the template — a one-line imprecision)
- `SiteFooter.tsx:35` — `{firm.name}`; `:119-120` — `disclaimerShort` and `advertisingNotice`
- `firm.ts:98-114` — disclaimerShort / disclaimerFull / advertisingNotice, exact span
- `loi-document.tsx:252-253` (creator/producer), `:347` (`{firm.name.toUpperCase()}`),
  `:360` (`{firm.disclaimerShort}`), `:363` (builder URL) — all four exact
- Production `<title>` confirms the firm name
- **New:** the rendered PDF cover text layer contains the firm's disclaimer and name, so
  A9's "goes into their client's permanent binder" is verified against the artifact, not
  just the source.

**What I could not verify:** the behavioural conclusion — that unaffiliated special-needs
attorneys, hospitals, PTIs and Arc/P2P chapters will therefore decline to distribute it.
I contacted no one; there is no referral history to inspect; A9 contacted no one either and
says so, listing this as its **least**-confident finding and naming the single phone call
that would settle it. That self-assessment is correct and I am not upgrading it on
reasoning alone.

**Verdict:** PLAUSIBLE (facts CONFIRMED; the load-bearing behavioural premise unverified)
**already_fixed:** false
**wrong_severity:** **true (mildly).** `mission_impact: 4` / `reach: 4` is the joint-highest
score in the file and it rests on an explicitly untested premise. I would hold the scores
but bind them to a gate: **mission_impact 4 → 3, reach 4 → 3 until one unaffiliated
professional confirms the barrier**, then restore. Spending XL effort on `/for-professionals`
+ a co-brandable handout before that call is the biggest unhedged bet in the file.
**wrong_standard:** false — ABA Model Rules 7.1–7.3 are real and are the right family of
rules for lawyer communications/solicitation, and A9 correctly disclaims giving legal advice.

---

### A9-014 — CONFIRMED
**Original claim:** Nothing on the site is designed to be handed to a family by a gatekeeper; complete public asset inventory shows nothing printable-for-distribution.

**What I did to check it:** Listed `public/`, `public/fonts/`, `public/samples/` in full;
re-parsed the 30-URL sitemap plus the four noindexed sample routes; curl'd
`/for-professionals`.

**What I found:** The conclusion holds — there is no printable one-pager, no professional
surface, no resource blurb, no worksheet, and `/for-professionals` → **404**.

**One factual error in the evidence, which I am flagging because A9 called this a
"complete" inventory:** `public/fonts/` contains **eight** `.ttf` files
(Cinzel ×2, CormorantGaramond ×3, Mulish ×3), not "five font files". `public/` also now
contains `social-logo.png` (added mid-run) alongside `video-poster-lockup.png`. Neither
changes the finding by a hair — there is still nothing distributable in there — but a
"complete inventory" that miscounts should be corrected in the record.

**Verdict:** CONFIRMED (with the inventory correction above)
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-015 — CONFIRMED
**Original claim:** `/letter/review` shows an email reminder form that does nothing.

**What I did to check it:** Re-drove it. In `v5-review.mjs`, against **production**, with a
seeded letter: confirmed `#reminder-email` exists, filled it with a real-shaped address,
clicked "Send me the reminder", and read back the `[aria-live="polite"]` region. Then
re-opened `ReminderPanel.tsx` and counted lines to each citation.

**What I found:** Reproduced end to end. The announced result, verbatim from the live DOM:

> "Email reminders aren't switched on yet, so nothing was sent and your address was not
> saved or transmitted anywhere. Use one of the calendar buttons instead — they work today,
> and they never involve an email address at all."

No network request accompanied the submit. Every line citation is exact:
`:31-33` eyebrow "Option two · not switched on yet"; `:40-43` "That service is not running
yet"; `:46-51` the handler that does nothing but `setTried(true)`; `:88-95` the post-submit
message; `ReviewScreen.tsx:466` renders it; `privacy/page.tsx:271-279` is the matching callout.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A9 correctly declines to call this a WCAG failure; I confirmed
the live-region announcement works, which is what would have made it one.

---

### A9-016 — CONFIRMED
**Original claim:** Every share target sends the bare `https://myletterofintent.com` with no channel parameter, so GA4 cannot separate referral sources.

**What I did to check it:** Re-opened `src/lib/share.ts` and checked every cited line
number; captured live GA4 `/g/collect` hits from production in Chromium and decoded their
`dl`/`dr` parameters; cross-checked `audit/evidence/network/capture-production.json`.

**What I found:** `share.ts:12` is `export const SHARE_URL = firm.appUrl;` and it appears
unmodified at `:48, :54, :60, :66, :72, :78, :84` (via `MAIL_BODY` at `:42`), `:90`, and
`nativeShareData` at `:95-99`. **Every one of A9's ten line numbers is exact.** No target
appends any parameter. The shared capture's GA4 hits carry
`dl=https%3A%2F%2Fmyletterofintent.com%2F` and `dt=Letter%20of%20Intent%20Builder` exactly
as A9 quoted, with nothing channel-bearing.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — mission_impact 1 is honest; this is an owner-facing measurement
gap, not a family-facing one.
**wrong_standard:** false

---

### A9-017 — CONFIRMED
**Original claim:** Eight equal share tiles, 22×52 CSS px at 320px, wrong channel priority; explicitly assessed as **not** failing WCAG 2.2 SC 2.5.8 via the spacing exception.

**What I did to check it:** Re-measured from scratch. Chromium against production at
viewport widths 320/375/768/1440; located the `grid-cols-8` container; read
`getBoundingClientRect()` for all eight anchors plus the computed `gap`; computed
centre-to-centre deltas. Then re-derived the SC 2.5.8 exception arithmetic myself rather
than trusting A9's.

**What I found:**

| viewport | tile w × h | gap | centre-to-centre |
|---|---|---|---|
| 320 | **21.8 × 52** | 8px | 30, 29, 30, 30, 30, 29, 30 |
| 375 | **28.6 × 52** | 8px | ~37 |
| 768 | **29.0 × 52** | 8px | 37 |
| 1440 | **55.1 × 52** | 8px | ~63 |

A9 reported 22/29/29/55 × 52 — correct to the rounding. Order reproduced exactly:
Facebook, Nextdoor, Reddit, X, LinkedIn, WhatsApp, Email, SMS — text and email last.
`ShareCard.tsx:9` (`h-[52px] w-full`), `:38` (`grid grid-cols-8 gap-2`) and `:83-85` (the
"Sharing the link reveals nothing you have written" note) are exact.

**On the standard, which is the part I most wanted to break:** SC 2.5.8 Target Size
(Minimum) is Level **AA** in WCAG 2.2, and the Spacing exception requires that a 24px-diameter
circle centred on each undersized target's bounding box not intersect another target or
another such circle. At 320px the tiles are 21.8 wide (undersized on one axis), centres
29.8–30px apart. Circle radius 12; adjacent tile's near edge sits 30 − 10.9 = **19.1px**
from the centre, and the adjacent circle's centre is **30px** away (> 24). Neither
intersection occurs. **A9's arithmetic and its conclusion are correct** — this does not
fail 2.5.8, and A9 said so unprompted rather than inflating a usability point into a
conformance point. That restraint is worth recording.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — SC 2.5.8 is real, correctly numbered, correctly named, and
correctly assessed as *not failed*.

---

### A9-018 — CONFIRMED (and upgraded from INSPECTED to MEASURED)
**Original claim:** The Letter of Intent cover carries the site address at 7.5pt in the faintest grey; the emergency sheet omits the URL entirely. A9 filed this as source-only because it could not read the PDF text layer.

**What I did to check it:** A9 said "`pdftoppm` is not installed and `strings` found
nothing". **The project already depends on `pdfjs-dist`.** I wrote
`audit/tools/v5-pdf-attribution.mjs` and extracted the text layer, with per-item glyph
height and page coordinates, from `audit/evidence/pdfs/typical--Letter-of-Intent-
Disabilities-2026-08-09.pdf` and `typical--Emergency-Information-Sheet-2026-08-09.pdf`.

**What I found — the finding is real, in the rendered artifact:**
- LOI PDF, **page 1 (the cover)**, 612×792pt: one item, glyph height **7.5**, at
  x=192 y=**66** (66pt above the page bottom):
  `Created with the free Letter of Intent Builder · myletterofintent.com`
- Emergency sheet, 612×742.8pt, the only footnote item, height **6.8**, at x=30 y=42:
  `Long entries may be shortened here — full detail lives in the complete Letter of
  Intent. Prepared with the free Letter of Intent Builder from Trusts & Wealth, PLLC.
  Not a medical or legal document.` — **no URL anywhere on the page.**

I also checked the colour claim: `theme.ts:59` `FAINT = "#8A92A0"` versus `GRAY = "#5E6878"`,
so "the faintest grey on the page" is literally true. Computed contrast of #8A92A0 on the
near-white cover (#FBFAF6): **≈3.03:1** — below 4.5:1 for body text. A9's "optimises for
invisibility" is fair, not rhetorical.

Line citations exact: `loi-document.tsx:362-364`, `emergency-document.tsx:340-344`, and no
`firm.appUrl`/`appUrlLabel` reference anywhere in `emergency-document.tsx` (grep: zero hits).

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** **true (understated).** A9 self-rated `mission_impact: 2, reach: 4,
harm_if_unfixed: 1` and then called it "the cheapest reach improvement in the entire audit"
— those are inconsistent. For a one-line, zero-privacy-cost change on the single artifact
most likely to be read by strangers, **harm_if_unfixed 1 → 2**. Everything else stands.
**wrong_standard:** false

---

### A9-019 — CONFIRMED
**Original claim:** `referrer-policy: no-referrer` on every response means the firm can never attribute a click.

**What I did to check it:** `curl -sI` on the production homepage and on a sample PDF;
re-opened `next.config.ts`.

**What I found:** `referrer-policy: no-referrer` present on both responses. Source:
`next.config.ts:54` — `{ key: "Referrer-Policy", value: "no-referrer" }`. **Exact line.**
I did not re-run the outbound-click Referer capture, because with `no-referrer` set at the
document level the absence of a `Referer` header on any outbound navigation is mechanically
entailed by the W3C Referrer Policy spec, not an empirical question. A9's inbound
counter-point is also right in kind: the `dr` parameter on internal soft navigations is
populated (I observed a second `page_view` after an in-app `next/link` click), and an
inbound referrer is governed by the referring site's policy.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — the header is correctly named and correctly attributed to W3C
Referrer Policy, and A9 correctly refuses to recommend weakening it site-wide.

---

### A9-020 — CONFIRMED
**Original claim:** GA4 emits `page_view` and nothing else; no `gtag('event', …)` anywhere; soft navigations *are* counted (A9's own disproved expectation).

**What I did to check it:** Repo-grepped `src/` for `gtag(|dataLayer`. Then ran production
in Chromium with **all** `google-analytics.com` / `analytics.google.com` traffic routed to
a 204 stub so nothing reached Google, loaded `/`, clicked the in-app `/letter` link, and
observed for 14s, decoding every `en=` parameter. Cross-checked
`audit/evidence/network/capture-production.json`.

**What I found:**
- Repo: the only hits are `layout.tsx:119`, `:120`, `:121`, `:122` — the bootstrap. **No
  `gtag('event', …)` anywhere in the codebase.** Exact citation.
- Live, stubbed: exactly **2** collect hits, `en=page_view` and `en=page_view` — one for
  the hard load, one following the soft navigation. Nothing else.
- Shared capture: **6** collect requests, all `en=page_view`, with `dl=…/` and
  `dl=…/letter/about`. Matches A9 exactly.

A9's methodological note is also verified: soft navigations *are* recorded, so the dramatic
version of this finding it nearly published would have been wrong. Reporting the narrower,
correct version is the single most credibility-earning thing in the file.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A9-021 — CONFIRMED
**Original claim:** English only; `lang="en"` is the sole language declaration; no i18n of any kind.

**What I did to check it:** Repo-grepped `src/` for `lang=|i18n|locale|Spanish`; checked
for a `[locale]` route segment, `next-intl`, `next-i18next`, a message catalogue, or any
`hreflang` in the live head.

**What I found:** Exactly one hit in the whole of `src/`: `src/app/layout.tsx:89` `lang="en"`.
**Exact.** No locale segment, no i18n dependency, no catalogue. Live head inventory:
no `alternate hreflang`.

**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — `harm_if_unfixed: 4` is the joint-highest harm score in the
file and rests on the same untested gatekeeper premise as A9-013; A9 lists it as its
third-least-confident finding, which is the right hedge for the most expensive
recommendation in the document. I would not move it, but I would not spend against it
before A9's own suggested bilingual-gatekeeper check.
**wrong_standard:** false — and A9 is correct that SC 3.1.1 Language of Page is *satisfied*;
it did not manufacture a WCAG failure out of a language-access argument.

---

### A9-022 — CONFIRMED (core claim); one cited detail is stale
**Original claim:** The homepage video has no `<track>` and no transcript anywhere.

**What I did to check it:** In Chromium against **production**: loaded the homepage, read
the pre-click state, clicked the poster button, waited for the player, then read
`video.querySelectorAll('track').length`, `video.textTracks.length` and `video.duration`
from the live element. Searched the whole repo for any `.vtt`. Re-opened
`VideoPlayer.tsx`.

**What I found:**
- After the player mounts: **`tracks: 0`, `textTracks: 0`** — no captions, measured on the
  live element. `duration: 277.999999` s = **4:38**.
- `find public src -iname "*.vtt"` → nothing. No transcript on the page.
- `VideoPlayer.tsx:201-202` is the comment "No caption track: the same explanation is
  written out in full in the column beside this player."; the `<video>` is at `:203-215`
  with no child `<track>`. (A9 cited `:201-215` for the element — a two-line drift after
  HEAD moved; the claim is otherwise exact.)

**Stale sub-claims, both harmless to the finding:**
1. A9 quotes the caption as "about 2 minutes". Production and HEAD now both read
   **"Watch · under 5 minutes"** — the C-1 change, now committed *and deployed*. This makes
   A9's equivalence argument **stronger**, not weaker: ~150 words of side text against
   4:38 of speech.
2. A9's "Production HTML confirms `<video src=… controls playsInline preload="auto" …>`"
   is no longer true of production, because the poster gate is now deployed and no `<video>`
   exists until the user clicks. I re-established the claim by clicking.

**Verdict:** CONFIRMED
**already_fixed:** false — captions and transcript are still absent.
**wrong_severity:** false. `mission_impact 3 / harm_if_unfixed 4` for a Level-A failure
against a named audience is if anything conservative.
**wrong_standard:** false — I checked both. **SC 1.2.2 Captions (Prerecorded), Level A** is
the correct criterion for prerecorded synchronised media, and **SC 1.2.3 Audio Description
or Media Alternative (Prerecorded), Level A** is correctly invoked for the transcript
route (a full text alternative satisfies the "media alternative" branch). Both numbers,
names and levels are right.

---

### A9-023 — REFUTED
**Original claim (title):** "A Cloudflare analytics beacon **runs** in production, is not in the CSP, and is not disclosed on the privacy page."

**What I did to check it:** This is the finding I most expected to survive, so I attacked
it hardest. I wrote `audit/tools/v5-cfbeacon.mjs`: loaded production in Chromium and
recorded **requests, responses, `requestfailed` reasons and every console message**, waited
9s plus a visibilitychange (RUM beacons flush on visibility/unload), then checked for the
beacon's DOM node and for any `cf`/`beacon`/`rum` global. Separately re-fetched the HTML
with a browser `Accept:` header, and re-read the live CSP.

**What I found — the beacon does not run. Chromium blocks it:**

```
requestfailed: https://static.cloudflareinsights.com/beacon.min.js/v4513226… :: csp
console error: Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/…'
               violates the following Content Security Policy directive:
               "script-src 'self' 'unsafe-inline' …"
responses matching cloudflare: (the beacon never produced a response)
cf-ish globals: []
```

So the very CSP gap A9 identified is what **prevents** the beacon from executing. The
script tag is edge-injected (`<script type="module" src="…beacon.min.js/v4513226…"
data-cf-beacon='{"version":"2024.11.0","token":"faa290b9…"}' crossorigin="anonymous">`) and
then dies at the CSP. Nothing reaches Cloudflare Web Analytics. The A9 evidence line
"uniqueHosts includes static.cloudflareinsights.com" reflects an **attempted, blocked**
request in the shared capture, not a working tracker.

Two consequences. The **title is false**. And the recommendation's stated upside — *"if it
stays, Cloudflare Web Analytics is cookieless and would give referral-source data for
A9-016"* — is **wrong today**: it would give nothing at all unless the CSP were also
widened, which is a change A9 explicitly declines to adjudicate.

**What survives, in a narrower form (and A9 identified the wrong script):**
- An undisclosed Cloudflare script tag *is* injected into every HTML response.
- `Report-To` / `NEL` headers do point at `a.nel.cloudflare.com` and are real.
- **A9 missed the Cloudflare script that actually executes.**
  `https://myletterofintent.com/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js`
  returns **200 and runs**, because it is served same-origin and therefore permitted by
  `script-src 'self'`. It is present on `/` and on `/privacy` itself — where the *only*
  occurrence of the string "cloudflare" on the entire privacy page is that script tag,
  which is not a disclosure. So a reader who takes the page's invitation to open devtools
  will see a Cloudflare script executing on the privacy page. That is a real, smaller
  version of A9's point, attached to the wrong file in the original.

**Verdict:** REFUTED (as written — the beacon does not run, and the recommendation's
benefit case does not hold)
**already_fixed:** false
**wrong_severity:** **true.** Filed `mission_impact 1 / reach 2 / harm 2`. As a *tracking*
finding it should be **0/0/0** — no tracking occurs. As a *disclosure* finding, rewritten
around `email-decode.min.js` and the NEL endpoint, **mission_impact 1 / reach 1 / harm 1**.
**wrong_standard:** false (correctly marked "n/a — disclosure completeness")

---

### A9-024 — CONFIRMED as observed, but ALREADY FIXED AND DEPLOYED
**Original claim:** Production renders a posterless `<video>`, so a referred first-time visitor sees a blank player; the fix exists locally.

**What I did to check it:** Fetched the production homepage and searched for `<video`;
checked for the poster button and `video-poster-lockup.png`; loaded the page in Chromium
and read the pre-click DOM; compared `og-image.png` bytes on production against
`git show b243107:public/og-image.png` and `a44c334`; read `git log`.

**What I found — the gap is closed:**
- Production homepage HTML contains **zero `<video` elements**.
- Chromium pre-click state: `videoCount: 0`, `posterButton: true`,
  `captionText: "Watch · under 5 minutes"`.
- `video-poster-lockup.png` is present in the responsive `srcset`.
- Production `og-image.png` = **88,371 bytes** = `b243107`'s artwork (`a44c334`'s was
  62,358 — the figure A9 quoted, which was correct at its capture time).
- `git log` shows `b243107` "feat: new social share image, navy video section, and a
  corrected video length" is HEAD, and the working tree has no source changes.

A9's observation was accurate against the `d5ec230` deployment it measured. It is no longer
true. Its recommendation ("deploy before any outreach") has been satisfied.

**Verdict:** CONFIRMED (as observed at the time)
**already_fixed:** **true** — fixed by commit `b243107` and **deployed to production**;
verified by three independent production signals above. No development work remains; the
item should be closed, not scheduled.
**wrong_severity:** false
**wrong_standard:** false (correctly filed as a deployment gap, not a defect)

---

## COUNT

| Verdict | Count | IDs |
|---|---|---|
| **CONFIRMED** | **21** | A9-001, 002, 003, 004, 005, 006, 007, 008, 010, 011, 012, 014, 015, 016, 017, 018, 019, 020, 021, 022, 024 |
| **PLAUSIBLE** | **1** | A9-013 |
| **REFUTED** | **1** | A9-023 |
| **already_fixed** | **1** | A9-024 (fixed *and* deployed) |
| **wrong_severity** | **3** | A9-013 (over), A9-018 (under), A9-023 (over) |
| **wrong_standard** | **0** | — |

Every WCAG/standard citation in this file checked out: SC 1.2.2, SC 1.2.3, SC 2.4.4,
SC 2.5.8 and SC 3.1.1 are all real, correctly numbered, correctly levelled, and — in the
three cases where A9 assessed a criterion as *satisfied* rather than failed (2.4.4, 2.5.8,
3.1.1) — correctly declined. I re-derived the SC 2.5.8 spacing-exception geometry myself
and got A9's answer. Zero standards errors across 23 findings is unusual.

---

## STRONGEST — survived the hardest scrutiny

1. **A9-010 (both firm CTAs 404).** I tried to break this by re-driving the whole flow in a
   real browser against production with a seeded letter, harvesting the anchors from the
   rendered DOM rather than the source, and requesting each one. 404 / 404, with the correct
   replacements verified 200. Nothing here is interpretation, and it is the only
   revenue-bearing exit the product has.
2. **A9-018 (emergency sheet omits the URL).** A9 filed this as INSPECTED because it could
   not read the PDF. I read the PDF — the project's own `pdfjs-dist` was sitting in
   `node_modules` — and found the LOI cover line at exactly 7.5pt at y=66, and the emergency
   sheet's footnote with no URL at all. The finding is now MEASURED and the "faintest grey"
   claim is quantified at ≈3.0:1.
3. **A9-001 (25 self-cancelling canonicals).** Four production URLs, two correct controls,
   three exact source citations, a 30-URL sitemap parsed, and a comment in `sitemap.ts:5`
   that proves the behaviour is unintended.
4. **A9-020 (GA4 is page_view-only).** Reproduced with the collect endpoint stubbed, and it
   is the finding where A9 measured away its own more dramatic hypothesis.
5. **A9-017 (share-tile ergonomics).** Every measurement reproduced to within rounding, and
   the WCAG restraint verified by independent geometry.
6. **A9-008 (broken privacy meta description).** Verbatim on production, exact to the source line.

## WEAKEST — could not fully refute

1. **A9-013 (law-firm-publisher referral barrier).** Facts perfect, premise untested. It
   drives the two XL recommendations in the file and eight rows of the channel map. I could
   not refute it and I could not confirm it; it should not be spent against until A9's own
   suggested phone call happens.
2. **A9-004 (content gap).** The absence is measured and the SERP shape reproduced
   independently. The *benefit* of filling it is unquantified — no Search Console, no
   traffic data, no keyword difficulty. XL effort on INFERRED benefit.
3. **A9-021 (English-only reach).** The fact is certain; the reach consequence rests on the
   same untested gatekeeper premise as A9-013 while carrying `harm_if_unfixed: 4` and the
   largest cost in the file.
4. **A9-003 (no Search Console).** Correct as far as it goes, but genuinely
   unfalsifiable on the DNS-verification branch — A9 says so.
5. **A9-002 (no JSON-LD).** Confirmed, but self-rated 1/3/1 and honest about being
   machine-facing; the competitive argument is the strongest part and I verified it.

## WHAT THE ANALYST MISSED

1. **The Cloudflare beacon is blocked, and the wrong Cloudflare script was flagged.** The
   beacon never executes (`requestfailed :: csp`). The one that *does* execute is
   `/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js`, served same-origin so
   `'self'` permits it — and it runs on `/privacy` itself, the page that invites the reader
   into devtools. That is the disclosure finding A9 was reaching for.
2. **All 25 section pages also share one identical meta description.** A9 put this in a
   recommendation but never measured it. `/letter/medical`'s description is verbatim the
   root `DESCRIPTION` from `layout.tsx:38-41`. It compounds A9-001: even if the canonicals
   were fixed, 25 pages would still be indistinguishable to a search engine.
3. **The section pages are weak search landing pages on their own terms**, which tempers
   A9-001's `reach: 4`. `/letter/medical`'s `<h1>` is the single bare word **"Medical"**,
   and below it is a form. A cold searcher who lands there gets guidance copy and then an
   input, not an article. Fixing the canonical is still right, but the traffic it unlocks
   converts less well than the finding implies.
4. **`sitemap.ts:5` documents the intent** — "Section pages carry real guidance copy, so
   they index." Quote it in the fix; it settles any argument that the canonical was deliberate.
5. **The PDF text layer was always extractable.** A9 listed "Poppler or another PDF text
   extractor" as its #5 wish. `pdfjs-dist` is already a project dependency. Three of A9's
   own stated limits (A9-018's rendered position, A9-013's PDF cover, the attribution
   legibility question) were answerable with tooling already installed.
6. **`public/fonts/` holds eight font files, not five**, in a passage A9 labels a "complete
   asset inventory" (A9-014).
7. **`attorneyBioBlurb` has one reference outside `src/`** — `scripts/review-doc/capture-pdf.mjs:48`
   — missed by A9's `src/`-scoped grep. Harmless to the finding, but it means "referenced by
   nothing" is not literally true.
8. **The sample viewer pages already carry distinct meta descriptions** from
   `sample.subtitle`; only the `noindex` and the sitemap omission need changing (A9-007).
9. **`/about` and `/for-professionals` 404 pages emit `<link rel="canonical"
   href="https://myletterofintent.com"/>` alongside `robots: noindex`** — the same
   layout-inherited canonical as A9-001, now pointing a 404 at the homepage. Cosmetic, but
   it is the same root cause and will be fixed by the same one-line change plus a
   `not-found` metadata entry.
10. **A9-006's "roughly a third of the title tag"** is actually ~45% (21 of 47 characters).
    The finding understates itself.
