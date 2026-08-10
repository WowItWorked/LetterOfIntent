# V4 — Adversarial verification of A7 (privacy/security) and A8 (policy/legal)

**Verifier stance:** refute first. Every line citation re-opened, every measurement
re-run from scratch with my own scripts, every live claim re-driven in a real
browser against production. Tools I wrote are under `audit/tools/v4-*.mjs`;
raw output under `audit/evidence/v4/`. No application code, style, content or
config was modified.

**Repo state at verification:** HEAD `b243107`. **Production has moved past
`d5ec230` since A7/A8 ran** — `/` now serves "under 5 minutes", `og:image` is
live, and the video section is the navy one. Findings written against the older
tree are flagged individually.

**Environment gotcha I hit and you should know about:** my first pass used
Node's `fetch()` with no `Accept` header and saw **no Cloudflare beacon**, which
looked like a clean refutation of A7-004/A8-001/A8-003. It was not. Cloudflare
gates RUM-beacon injection on `Accept: text/html`. Measured
(`audit/tools/v4-beacon-ua.mjs`):

```
node default (no UA, no Accept)     len=101500  beacon=false  emailDecode=true
browser UA only                     len=101500  beacon=false  emailDecode=true
Accept: text/html only              len=101859  beacon=true   emailDecode=true
browser UA + Accept + sec-fetch     len=101859  beacon=true   emailDecode=true
```

The beacon is alive and well. This matters operationally — see "What both
analysts missed", item 2.

---

## A7 — PRIVACY AND SECURITY

### A7-001 — CONFIRMED
**Original claim:** No user-typed content leaves the device; 0 hits across 309 needles in a 431-request production capture, reproduced live.
**What I did to check it:** Wrote my own capture parser (`audit/tools/v4-capture-and-readability.mjs`) over `audit/evidence/network/capture-production.json`. Independently counted requests, hosts, POST bodies, referers, and canary occurrences. Then drove three fresh production browser contexts (`audit/tools/v4-prod-browser.mjs`) typing `ZQXV4CANARY4242` character-by-character into `/letter/about`, `/letter/medical`, `/letter/getting-started` and searched every outbound URL and body in plain, URL-encoded and raw form. Spot-checked the four supporting code citations.
**What I found:** `requestCount: 431`. `uniqueHosts` exactly `["myletterofintent.com","static.cloudflareinsights.com","www.google-analytics.com","www.googletagmanager.com"]`. `postDataCount: 0`. Every `referer` header empty. `ZQXCANARY` occurrences: **0 in `.requests`, 72 in `.storageByRoute`** — the 72 matches A8's independent count exactly. `ZQXTYPEDCANARY`: 0 in requests *and* 0 in storage. My own live canary: `canaryInAnyOutbound: false` on 3/3 routes. Code citations verified: `store.ts:50-52` is `name: LETTER_STORAGE_KEY / storage: createJSONStorage(() => localStorage) / partialize` — localStorage only, exact. `download.ts:1-14` is the whole `triggerDownload` function, object URL, no network — exact. `photos.ts:1-14` header comment ends "There is no upload path anywhere in this module" — exact. `share.ts` is 99 lines, citation `12-99` valid.
**One evidence gap:** A7 says "Script and full output retained." **It is not.** There is no `a7-*.mjs` in `audit/tools/`, so the 309-needle / 24-encoding sweep is not independently re-runnable. I reproduced the *result* with my own narrower search, so the finding stands, but the headline number (309 needles, 91,595 chars) is not checkable.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true (soft) — NIST Privacy Framework **CT.DM-P1 is "Data elements can be accessed for review"**, not "data processed limited to identified purpose". The gloss belongs to a Control-Data-Processing-Policies subcategory, not CT.DM-P1. Moderate confidence; the finding does not depend on it.

---

### A7-002 — CONFIRMED
**Original claim:** Typing fires a GA4 `form_start` carrying `ep.first_field_name`, `ep.form_destination`, `epn.form_length`; no field values.
**What I did to check it:** Two independent attempts. **First attempt failed to reproduce** (`v4-prod-browser.mjs`): character-typing at 90ms/char into `f-diagnoses`, `f-allergies`, `f-authorName`, 8s of settle, blur — only `page_view`, 3/3 routes. I was ready to refute. I then wrote a harder test (`audit/tools/v4-form-start.mjs`): slower typing, a *second* field focused, scroll, SPA nav, then full unload to flush `sendBeacon`.
**What I found:** `form_start` fires, with the reported parameters **verbatim to the digit**:

```
/letter/about    en=form_start  _et=9717
                 ep.form_id=""  ep.form_destination=https://myletterofintent.com/letter/about
                 epn.form_length=7  ep.first_field_id=f-diagnoses
                 ep.first_field_name=diagnoses  epn.first_field_position=2
/letter/medical  en=form_start  _et=9667
                 ep.form_destination=https://myletterofintent.com/letter/medical
                 epn.form_length=13 ep.first_field_id=f-allergies
                 ep.first_field_name=allergies  epn.first_field_position=1
```

Identical field ids, identical `form_length` values (7 and 13), identical `first_field_position` values (2 and 1). No field values in any hit. The contradicted copy is live at `src/app/privacy/page.tsx` **151-156** (A7 cited 152-156 — one line short) and byte-identical in production HTML. The comment A7 cites at `analytics.ts:11-15` spans **10-15** in the file; the quoted phrases are present.
**Additionally, and A7 missed it:** a **`scroll`** enhanced-measurement event also fires (`en=scroll`, `epn.percent_scrolled=90`) on both routes. So at least two Enhanced Measurement sub-features are ON, not one.
**Verdict:** CONFIRMED — and this is the single best-reproduced finding in either file. My failure to reproduce on the first attempt is itself evidence for A7's warning that a single synthetic capture is not enough.
**already_fixed:** false
**wrong_severity:** false — scores (2/5/3) are fair; the `scroll` discovery widens the surface but not the harm.
**wrong_standard:** true (soft) — **GDPR Art. 9 is a stretch.** No health data is transmitted, only a *field name*, and A8's own territorial analysis concludes GDPR very likely does not reach this site. The load-bearing citation is FTC Act §5 (an invitation to verify that fails verification) plus NIST PF **CM.AW-P1**, which A7 cites and which is correctly glossed.

---

### A7-003 — CONFIRMED
**Original claim:** Five copy locations overclaim; the privacy page's meta description carries an orphaned "of any kind." live in production.
**What I did to check it:** Read `src/app/privacy/page.tsx` (355 lines) end to end, `src/app/layout.tsx`, `src/components/chrome/PrivacyStrip.tsx`, `src/app/page.tsx`. Fetched production `/` and `/privacy` and string-matched each claim (`audit/tools/v4-final-checks.mjs`).
**What I found:** All five verified. (1) `layout.tsx:38-41` `DESCRIPTION` ends "Everything stays on your device." — **exact**. (2) `privacy/page.tsx:91` card heading `"Nothing is uploaded"` — **exact**. (3) the gold callout with "no script on this page reads them, sends them, or records your screen" — text verbatim, but it spans **236-245** (the sentence itself at 242-244), not 239-244. (4) `PrivacyStrip.tsx:22-23` — **exact**, and correctly scoped. (5) `page.tsx:170` "Your data remains on your device and is never shared." — **exact**, and `"never shared"` is present in the production homepage HTML. Production `/privacy` meta description today, verbatim: `"...we count page visits and nothing else. of any kind. Here is exactly how that works, in plain words."` Source concatenation at `privacy/page.tsx:9-12` is exactly as described. All five homepage string probes A7 listed return true.
**Verdict:** CONFIRMED (minor line drift on item 3)
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A7-004 — CONFIRMED
**Original claim:** Cloudflare injects a RUM beacon into every page; it is in no codebase and on no disclosure; it is blocked by CSP by accident.
**What I did to check it:** Three fresh production browser contexts with a `securitypolicyviolation` init-script listener, plus `window.__cfBeacon` probing, plus the capture. Then the `Accept`-header experiment above.
**What I found, reproduced on `/`, `/privacy` and `/letter/about`:**
```
csp: [{ blockedURI: "https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496",
         violatedDirective: "script-src-elem", disposition: "enforce" }]
cfBeaconScriptInDom: true   hasCfBeaconGlobal: false   requestfailed reason: "csp"
```
Same beacon URL hash A7 quoted. In the shared capture: **11 requests to `static.cloudflareinsights.com`, 0 responses**. Disclosure gaps confirmed: `SECURITY.md:81-82` reads verbatim "**No other analytics** — no Vercel Analytics, no heatmaps, no session recording, no advertising pixels."; `/privacy` section 04 names only Google.
**Caveat on one evidence line:** A7's "found at byte offset 99918 of the served document" is not reproducible with a naive fetch — you must send `Accept: text/html`. The beacon is real; the retrieval method matters.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A7-005 — CONFIRMED
**Original claim:** Cloudflare Email Obfuscation rewrites HTML and executes same-origin JS on every page including the wizard pages; React undoes the obfuscation at hydration anyway.
**What I did to check it:** Production HTML fetch (raw), capture analysis, and live DOM/performance probing on three routes.
**What I found:** Tag present verbatim, immediately after `</footer>`, on every route fetched:
`...ever leaves your device.</p></div></div></footer><script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js">`
(offset drifted 53053 → 54698 as the page copy changed; tag byte-identical). Capture: **11 requests to that URL, 11 × HTTP 200** — I recomputed both. Live: `emailDecodePerfEntry: true` on all three routes, so it executes. Post-hydration on `/letter/about`: `emailProtectionLinks: []`, `cfEmailSpans: 0`, and a working `mailto:contact@trustsandwealth.com` — **exactly** A7's secondary observation, independently reproduced. Raw HTML carries a `/cdn-cgi/l/email-protection#...` href for no-JS users, so the degradation claim holds too.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** true (soft) — OWASP ASVS v4 **14.2.3 is specifically about Subresource Integrity for *externally hosted* assets**. The email decoder is served same-origin, so SRI is not the control at issue. ASVS **1.14 (trust boundaries / configuration architecture)** is the better fit; GDPR Art. 32 is fine.

---

### A7-006 — CONFIRMED, and I closed the three gaps A7 could not
**Original claim:** Cloudflare terminates TLS, rewrites HTML and runs DNS, and is absent from SECURITY.md; DNSSEC probably off; CAA and HSTS-preload NOT VERIFIED; `SECURITY.md:170` "No external scripts are loaded, so SRI is moot" is false.
**What I did to check it:** Re-read the cited SECURITY.md lines. Re-pulled production headers. Then queried DNS over HTTPS against **two independent resolvers** (Cloudflare and Google) and hit the hstspreload.org API (`audit/tools/v4-dns-and-notice.mjs`) — all three things A7 marked unverifiable.
**What I found:**
- `A` → `104.21.50.242`, `172.67.215.2`; `NS` → `kinsley.ns.cloudflare.com`, `steven.ns.cloudflare.com` — **exact match** to A7.
- Headers verbatim: `server: cloudflare`, `cf-ray`, `x-vercel-cache: HIT`, `x-vercel-id: iad1::...`, `strict-transport-security: max-age=63072000; includeSubDomains; preload`, `Nel: {"report_to":"cf-nel","success_fraction":0.0,...}`, `Report-To` pointing at `a.nel.cloudflare.com`.
- **CAA: none.** NOERROR + SOA-in-authority (NODATA) from both Cloudflare DoH and Google DoH. A7 marked this NOT VERIFIED; **it is now verified — there are no CAA records.**
- **DNSSEC: definitively off.** No `DNSKEY`, and — conclusively — **no `DS` record at the `.com` parent** (`a.gtld-servers.net` SOA returned in authority). A7 said "strongly indicated, not proven"; it is now proven.
- **HSTS preload: the domain is NOT on the list.** `hstspreload.org/api/v2/status` returns `{"status":"unknown","preloadedDomain":""}`. The header declares `preload` but nothing has been submitted.
- `SECURITY.md:89` is exactly `### What Vercel and GitHub see`; `SECURITY.md:170` is exactly `...No external scripts are loaded, so SRI is moot.` gtag.js loads and executes with no `integrity` attribute — confirmed in the DOM.
**Verdict:** CONFIRMED — and every recommendation (4, 5, 6) now rests on verified rather than inferred facts.
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A7-007 — CONFIRMED
**Original claim:** "Delete all my data" leaves the IndexedDB database, recreates the localStorage key on reload, and leaves both GA cookies for ~13 months — while telling the family the device holds nothing.
**What I did to check it:** Ran the real flow twice on production, seeding both a letter and an IndexedDB photo record, snapshotting storage before/after/after-reload. Re-read `photos.ts` and `DataControls.tsx` in full.
**What I found (verbatim from my run):**
```
BEFORE  localStorage {"twl-loi-letter-v1": 269}  indexedDB ["twl-loi-photos"]  photoCount 1
AFTER   localStorage {}                          indexedDB ["twl-loi-photos"]  photoCount 0
        cookies _ga, _ga_90YXKXB5TC  secure=false httpOnly=false  expires 2027-09-13
RELOAD  localStorage {"twl-loi-letter-v1": 43}   indexedDB ["twl-loi-photos"]  photoCount 0
```
Notice text, read from the second `aria-live="polite"` region on production: **"Deleted. We checked: this device now holds nothing from this tool."** — verbatim. (My first read returned empty because Next renders an earlier `aria-live="polite"` region; A7's capture was right and mine was initially wrong.) Code: `photos.ts:131-137` `deleteAllPhotos()` calls `s.clear()` and never `indexedDB.deleteDatabase()` — **exact**. `DataControls.tsx:124` is exactly `const letterGone = localStorage.getItem(LETTER_STORAGE_KEY) === null;` — **exact**. `handleDelete` spans 119-136 — **exact**. Privacy-page instruction at `privacy/page.tsx:187-198` — **exact**.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 2/3/4 is right. This is the finding that most directly touches a real person on a library machine.
**wrong_standard:** true (soft) — NIST PF **CT.DM-P4 is "Data elements can be accessed for deletion"**; the parenthetical gloss "data deleted per policy" is **CT.DM-P5**. And GDPR Art. 17 (erasure) is a poor fit: there is no controller-held copy to erase and the site is very likely outside GDPR's territorial scope on A8's own analysis. The honest frame is FTC Act §5 plus the site's own promise — which A7 effectively argues anyway.

---

### A7-008 — CONFIRMED
**Original claim:** Both GA cookies are set without `Secure`; real-world risk low because of HSTS with preload.
**What I did to check it:** Read the cookie records straight out of the capture, then read `context.cookies()` in three fresh production browser contexts.
**What I found:** Capture, verbatim: `_ga … "expires":1820867112.867853,"httpOnly":false,"secure":false,"sameSite":"Lax"` and `_ga_90YXKXB5TC … "expires":1820867112.867652 …` — **both figures match A7 to the decimal**. Live, three contexts: `secure:false, httpOnly:false, sameSite:"Lax", expires 2027-09-13T21:24:xxZ`. `layout.tsx:114-123` loads gtag and calls `gtag('config','G-90YXKXB5TC')` with no options object at line 122 — **exact**.
**Where A7 under-states it:** A7 says the residual window is "a first-ever visit on a device where the preload list has not taken effect." I verified the domain is **not on the HSTS preload list at all**, so the window is every first-ever visit from any browser that has not previously seen the header — wider than described, though still practically small.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 1/5/1 is right even with the wider window.
**wrong_standard:** true (soft) — **OWASP ASVS v4 3.4.1 is about cookie-based *session tokens***. These are analytics cookies and there is no session anywhere in this app. **RFC 6265bis §4.1.2.5**, which A7 also cites, is the correct and sufficient reference; drop the ASVS one.

---

### A7-009 — CONFIRMED
**Original claim:** PDFs embed the child's name in `/Title` and the parent's in `/Author`, contradicting the filename policy; catalog is untagged; nothing else leaked.
**What I did to check it:** Wrote my own PDF Info-dictionary decoder from scratch (`audit/tools/v4-pdf-info3.mjs`) — resolves the trailer `/Info` reference, follows the indirect string objects, and decodes UTF-16BE with the BOM. Ran it over all six PDFs. Re-read both PDF document sources and `filenames.ts`.
**What I found — every value matches A7 verbatim:**
```
maximal--Letter-of-Intent-Disabilities-2026-08-09.pdf
  /Title [UTF-16BE] "Letter of Intent — Maximal Subject With A Notably Long Legal Name"
  /Author [PDFDoc]  "Maximal Author With A Notably Long Legal Name"
  /Producer "Trusts & Wealth, PLLC"   /CreationDate "D:20260809202819Z"
maximal--Emergency-Information-Sheet-2026-08-09.pdf
  /Title "Emergency information — Maximal Subject With A Notably Long Legal Name"
```
Catalog on all six: `/Type /Catalog /Pages 1 0 R /Names 2 0 R /ViewerPreferences 5 0 R >>` — **byte-identical to A7's quote**, and no `/MarkInfo`, `/StructTreeRoot` or `/Lang`. No `/Encrypt`, `/JavaScript`, `/EmbeddedFile`, `/Launch`, `/OpenAction`, `/Metadata`, no XMP packet in any file. Code: `loi-document.tsx` lines 250/251/252/253 are `title=`/`author=`/`creator=`/`producer=` — A7's citation `249-253` and its pointer to "the fallback at loi-document.tsx:251" are **exact**. `emergency-document.tsx:159` is `title={\`Emergency information — ${info.fullName ?? info.preferred ?? ""}\`}` — **exact**, including A7's observation that the precedence is `fullName ?? preferred`. The contradicted policy is at `filenames.ts` — rule 2 begins at line 14 within the cited 9-18 block.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — 1/4/3 with A7's own note that it queues behind A7-002 and A7-007 is right.
**wrong_standard:** false (ISO 32000-1 §14.3 is the metadata clause; §14.3.3 is the document information dictionary specifically — a precision nit, not an error).

---

### A7-010 — CONFIRMED
**Original claim:** SECURITY.md justifies `'unsafe-inline'` on the premise that the site is statically exported; it is not, and middleware is available today.
**What I did to check it:** Read `next.config.ts` in full. Searched the repo for `middleware.ts`/`middleware.js`. Pulled production headers on HTML and RSC responses.
**What I found:** `next.config.ts` has **no `output` key** (96 lines, read in full), and `async headers()` sits at 90-93 gated on `NODE_ENV === "production"` — and the CSP and every other security header **are** being served, which is impossible under `output: "export"`. That single fact is decisive. `x-nextjs-prerender: 1` on HTML; RSC returns `content-type: text/x-component`, `x-matched-path: /privacy.rsc`, `x-vercel-cache: PRERENDER`. No `middleware.ts` anywhere outside `node_modules`. `SECURITY.md:219-227` reads verbatim as quoted, including "this site is statically exported, so there is no server to mint a per-request nonce." A7's recommendation-3 XSS-sink grep re-run by me: `dangerouslySetInnerHTML|innerHTML|outerHTML|insertAdjacentHTML|document.write|eval(|new Function` across `src/` → **zero matches**, reproduced.
**One sub-observation I could not reproduce:** `x-nextjs-postponed: 2`. My RSC fetch returned no such header. The conclusion does not depend on it.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A7-011 — CONFIRMED, with one sub-detail corrected
**Original claim:** CSP is strong; four gaps (no `script-src-attr`, no `frame-src`, `base-uri 'self'`, no reporting); four CSP variants observed across response types.
**What I did to check it:** Diffed the live CSP header against `next.config.ts:34-51` character by character, then pulled the CSP from six different response types (`audit/tools/v4-csp-variants.mjs`).
**What I found:** The production CSP is byte-identical to the array at `next.config.ts:34-51`. All four gaps confirmed: no `script-src-attr` anywhere, no `frame-src`, `base-uri 'self'` at line 48, and **no `report-uri`/`report-to` on the CSP** — the only `Report-To` on the site is Cloudflare's NEL group, which does not receive CSP reports. The silent-failure proof holds: 11 blocked beacon requests in the capture, `disposition: "enforce"` live, zero signal to the owner.
**Corrected sub-detail:** A7 says static chunks are served "without" the GA hosts. They are not — `/_next/static/immutable/chunks/*.js` carries the **full** CSP including the GA hosts. I measured **three** variants, not four: (a) the full policy on HTML, RSC, static chunks and static images; (b) the policy **without** GA hosts on `/what-is-a-letter-of-intent.mp4`; (c) `script-src 'none'; frame-src 'none'; sandbox;` on `/_next/image`. A7 flagged this observation as "not a defect" anyway.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — CSP Level 3 §6.1 (`script-src-attr`) and §7 (reporting) are correct.

---

### A7-012 — CONFIRMED
**Original claim:** `e2e/privacy-network.spec.ts` exempts analytics hosts from the external-host check and asserts nothing about which events fire — which is why A7-002 went unnoticed.
**What I did to check it:** Read the spec. Then tested the claim against the shared capture: if the suite were event-blind, the capture should contain only `page_view` even though `form_start` demonstrably fires in real use.
**What I found:** Line citations are **exact, all of them**. Line 15 is the `ANALYTICS_HOST` regex verbatim. `LETTER_SECRETS` is a pure value list at **22-30**. The value scan is at **47-48**. The early return is at **line 57**: `if (ANALYTICS_HOST.test(u.hostname)) return;` — exactly as quoted, inside the `try` at 51-58. `src/config/analytics.test.ts:20-44` asserts host/CSP agreement and the measurement-ID shape and nothing about runtime events — confirmed by reading it. **And the capture proves the mechanism:** I extracted every `en=` parameter from every GA request in the 431-request capture — the set is exactly `["page_view"]`. A suite built on that capture's shape would stay green while `form_start` and `scroll` fire in the field.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — if anything **under**-stated. This is the only finding in either file that prevents recurrence, and my `scroll` discovery is a live example of exactly the drift it predicts. I would move `harm_if_unfixed` from 3 to 4.
**wrong_standard:** false

---

### A7-013 — CONFIRMED, with one REFUTED sub-detail
**Original claim:** HTML and RSC carry `access-control-allow-origin: *` alongside `CORP/COOP: same-origin`; the header is not in `next.config.ts`; it exposes nothing.
**What I did to check it:** Pulled headers from six response types.
**What I found:** `access-control-allow-origin: *` on `/` and on `/privacy?_rsc=1`, alongside `cross-origin-opener-policy: same-origin` and `cross-origin-resource-policy: same-origin`. Not present anywhere in `next.config.ts:31-77` (read in full). So it is platform-emitted — confirmed.
**REFUTED sub-detail:** A7 states it is "Absent from the `.mp4` response." **It is present on the `.mp4`** (`access-control-allow-origin: *`). What is *absent* from the `.mp4` is `cross-origin-resource-policy`. A7 appears to have swapped the two. In fact ACAO `*` is on **every** response type I tested — HTML, RSC, static JS, PNG, the image optimiser and the video.
**Verdict:** CONFIRMED (core claim) — the sub-detail is wrong and slightly *strengthens* rather than weakens the finding.
**already_fixed:** false
**wrong_severity:** false — 1/1/1 is right; A7's own "not a vulnerability" framing is honest and correct.
**wrong_standard:** true (soft) — **ASVS v4 14.5.3 is the CORS control**; 14.4.7 is a different HTTP-header control (frame options), not CORS. Cite 14.5.3 alone. Moderate confidence on ASVS sub-numbering.

---

### A7-014 — CONFIRMED (code claim) / PLAUSIBLE (exploitability)
**Original claim:** `escapeIcsText` uses `/\r?\n/g`, so a lone `\r` passes through unescaped.
**What I did to check it:** Read `src/lib/ics.ts` and traced `escapeIcsText` to its use in the SUMMARY line.
**What I found:** `ics.ts:12-18` is exactly the quoted function, with `.replace(/\r?\n/g, "\\n")` on **line 17**. `ics.ts:51` is exactly `const summary = escapeIcsText(\`Review ${personLabel}'s Letter of Intent\`);`. The regex demonstrably cannot match a bare `\r`. I did **not** construct a browser input that gets a bare `\r` through a form field — neither did A7, and A7 says so and scores it 1/1/1 accordingly.
**Verdict:** CONFIRMED on the defect, PLAUSIBLE on any reachable impact.
**already_fixed:** false
**wrong_severity:** false — A7 self-scores this at the floor and explicitly says drop it if it competes. That is the right call.
**wrong_standard:** false — RFC 5545 §3.3.11 is the TEXT escaping clause.

---

## A8 — POLICY AND LEGAL DOCUMENTS

### A8's factual predicate table (section 2) — CONFIRMED
I re-derived every row from the capture and production independently: 431 requests; the four hosts exactly as listed; zero POST bodies; `ZQXCANARY` 0 in requests / **72** in `storageByRoute` (matching A8's count exactly); GA event names in the capture = `["page_view"]` only; beacon token `faa290b919f94379b17a9d697c7a4c83` verbatim; beacon blocked with the console message verbatim; `email-decode.min.js` → 200; no `storage.persist` in `src/` (and I additionally measured `navigator.storage.persisted() === false` live); no AI references in `src/`; `<track>` count 0; 25 schema sections in `fill-levels.json` with every named field present; `src/app` contains only the listed routes; `SECURITY.md` is **15,452 bytes** exactly and is published nowhere (`/security` → 404).

### A8 section 3 (readability) — CONFIRMED directionally; the decimals are not reproducible
**Original claim:** `/privacy` prose = Flesch RE 71.4, FK 7.2, Fog 8.6, SMOG 8.5, 855 words, 54 sentences, 8 sentences over 25 words.
**What I did:** Wrote my own Flesch/Fog/SMOG implementation over the paragraph prose of the *live* production `/privacy` page (`audit/tools/v4-capture-and-readability.mjs`).
**What I found:** RE **71.2** (vs 71.4), FK **7.4** (vs 7.2), Fog **9.3** (vs 8.6), SMOG **9.2** (vs 8.5), **898** words (vs 855), **55** sentences (vs 54), **9** sentences over 25 words (vs 8). The Flesch pair reproduces within 0.2. Fog/SMOG run ~0.7 higher because my polysyllable rate is 7.0% against A8's 5.6% — syllable heuristics differ by design and ±1 grade is normal between implementations.
**Verdict:** The headline — "roughly a 7th-to-8th grade level; unusually readable for a privacy policy" — is **robustly CONFIRMED**. The specific decimals are implementation-dependent and should not be quoted as precise. A8's decision to report a number that contradicted the brief's hypothesis was the right call.

---

### A8-001 — CONFIRMED
**Original claim:** Cloudflare is an undisclosed processor; a second analytics beacon is injected into every page; the policy names only Google and calls infrastructure "Our host".
**What I did to check it:** Everything under A7-004/A7-005 plus reading the policy text.
**What I found:** Beacon tag and token verbatim (`faa290b919f94379b17a9d697c7a4c83`). `uniqueHosts` includes `static.cloudflareinsights.com`. `server: cloudflare` + `cf-ray` + `x-vercel-cache`/`x-vercel-id` all present. Homepage HTML: 2 `email-protection` + 1 `__cf_email__` = **3 matches**, exactly as A8 counted. Policy text at `privacy/page.tsx:257-259` is verbatim "Our host also keeps ordinary web server logs — the sort every website receives, including the address a request came from — and those are used only to keep the site up and secure." — **exact**.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — Cal. B&P **§22575(b)(1)** is indeed categories of PII *and* categories of third parties. Correct.

---

### A8-002 — CONFIRMED
**Original claim:** SECURITY.md's "No other analytics", "No external scripts are loaded, so SRI is moot", and "exactly two network calls" are contradicted by production.
**What I did to check it:** Opened all three lines.
**What I found:** `SECURITY.md:81-82` verbatim as quoted. `SECURITY.md:170` verbatim as quoted, in the OWASP A08 row. `SECURITY.md:20` reads "There are exactly **two** network calls in the entire application:" — **exact**, and A8's characterisation ("true of `src/`, not of what a browser does") is right. The root cause A8 identifies — the document reasons about `src/`, the beacon comes from the edge — is exactly right.
**Important addition to the recommendation:** A8 proposes pointing a production variant of `privacy-network.spec.ts` at the live URL. **That will only catch the beacon if the request sends `Accept: text/html`** — see the header table at the top of this file. A naive `curl`/`fetch` production check would pass while the beacon is being served.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false (A8 correctly says "None — internal accuracy")

---

### A8-003 — CONFIRMED
**Original claim:** "no script on this page reads them…" is true only because CSP happens to block an undocumented injected script; that beacon is the only request in the capture with no response.
**What I did to check it:** Reproduced the console message live, and independently computed the set of request URLs with no matching entry in `.responses`.
**What I found:** Console message reproduced **word for word**, same beacon hash, including the "'script-src-elem' was not explicitly set, so 'script-src' is used as a fallback" tail. And the capture check is exactly right: `requestsWithNoResponse` resolves to **exactly one distinct URL** — the beacon — across 11 requests. Every other one of the 431 requests has a response. That is a strong, precisely-stated, independently reproducible claim.
Policy text: the quoted sentence sits at `privacy/page.tsx:242-244` inside a callout spanning 236-245; A8 cited 241-244 (one line early on the open).
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — `harm_if_unfixed: 4` is defensible: the sentence flips from true to false on any unrelated `script-src` edit, with no test failing.
**wrong_standard:** false

---

### A8-004 — CONFIRMED, and understated
**Original claim:** Five CalOPPA elements missing: effective date, change process, DNT disclosure, cross-site third-party collection, categorised third parties.
**What I did to check it:** Stripped the production `/privacy` HTML to text and searched.
**What I found:** All five absent. Stronger than A8 claimed: the rendered privacy page contains **no four-digit year at all** and no date-like string of any form — not just no "effective date" label. Also absent: "do not track", "global privacy control", "updated", "effective", "changes to this policy", "last reviewed". Only Google is named. `privacy/page.tsx:257-259` is the entire infrastructure sentence, verbatim.
**Statute check:** Cal. B&P §22575(b) has seven paragraphs — (1) categories of PII/third parties, (2) review-and-change process, (3) material-change notification process, (4) effective date, (5) DNT response, (6) cross-site collection by other parties, (7) the hyperlink safe harbour for (5). A8's citation of "(b)(1)-(b)(7), incl. the AB 370 Do-Not-Track amendment at 22575(b)(5)-(6)" is **correct**.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false. (Confidence label should be MEASURED rather than INSPECTED — the absences are measured.)

---

### A8-005 — CONFIRMED
**Original claim:** No Terms of Use; no warranty disclaimer, liability limit, ownership statement or governing law; only `firm.disclaimerShort`/`disclaimerFull` exist.
**What I did to check it:** Listed `src/app`, read `src/app/sitemap.ts` in full, read `src/config/firm.ts:90-115`, and requested `/terms` from production.
**What I found:** `src/app` contains **exactly** what A8 lists — `page.tsx, layout.tsx, robots.ts, sitemap.ts, favicon.ico, globals.css` plus `letter/, privacy/, samples/, your-data/`. `sitemap.ts` returns **exactly six** array entries (`/`, `/letter`, the section-slug spread, `/letter/review`, `/privacy`, `/your-data`) and none is a terms page — **exact**. `firm.disclaimerShort` + `disclaimerFull` span **lines 98-110** — **exact to the line**. `https://myletterofintent.com/terms` → **404**. Neither disclaimer disclaims warranties or limits liability — I read both in full and confirm.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — A8 correctly says "Not legally required."

---

### A8-006 — CONFIRMED on the substance; one evidence figure is STALE/WRONG
**Original claim:** No accessibility statement; the explainer video has zero `<track>` elements and no transcript; production GET `/` shows `<track>` = 0 and `<video>` = 1.
**What I did to check it:** Fetched production `/` raw, then checked the live post-hydration DOM after `networkidle` + 3s, and read `VideoPlayer.tsx` at both HEAD and `d5ec230`.
**What I found:** Substance confirmed. There is **no `<track>` element anywhere in `VideoPlayer.tsx`** (grep: the only "track" hits are Tailwind `tracking-` classes). No `/accessibility` route — production returns **404**. `VideoPlayer.tsx:201-202` is verbatim `// No caption track: the same explanation is written out in full in` / `// the column beside this player.` — **exact**. The referenced column is `src/app/page.tsx:267-289` — **exact to the line**, and it is indeed general expository copy ("What is a Letter of Intent?"), not a labelled media alternative.
**Stale/wrong figure:** `<video>` count on the production homepage is **0**, not 1 — at HEAD `b243107` the element renders only after the user presses play (`{playing && src ? <video … /> : null}` at `VideoPlayer.tsx:200-215`). At `d5ec230` the `<video>` was unconditional, so **A8's count was correct as observed** and is now stale. It does not touch the conclusion: when the video does render it still has no caption track.
**Verdict:** CONFIRMED
**already_fixed:** false (the `<video>=1` *evidence detail* is stale; the defect is not fixed)
**wrong_severity:** **true** — `harm_if_unfixed: 5` is the highest score in either file and I do not think it clears that bar. A8-007 (a family silently losing hours of writing) is scored 4. The video is now behind an explicit play affordance, is not the only route to the content, and the adjacent prose column — while not a conformant media alternative — does carry the substance. **My corrected scores: mission_impact 3 (unchanged), reach 3 (unchanged), harm_if_unfixed 4.**
**wrong_standard:** false — WCAG 2.2 **SC 1.2.2 Captions (Prerecorded), Level A** and **SC 1.2.3 Audio Description or Media Alternative (Prerecorded), Level A** are both real, correctly numbered, and correctly applied, including the point that an unsynchronised, unlabelled adjacent column does not satisfy 1.2.3.

---

### A8-007 — CONFIRMED (with one sub-claim PLAUSIBLE)
**Original claim:** No retention/deletion statement; the site never calls `navigator.storage.persist()`, so storage is best-effort and the browser can delete a family's letter unprompted — while the policy frames loss as something the *user* does.
**What I did to check it:** Re-ran the grep, then went further: measured `navigator.storage.persisted()` live on production in three fresh contexts. Read the cited policy text and the SECURITY.md storage table.
**What I found:** `grep -rE "storage\.persist|navigator\.storage|persisted\(" src/` → **zero matches**, reproduced. And live on `/`, `/privacy` and `/letter/about`: **`{ persisted: false, api: true }`** — so the API exists, the site could call it, and the origin is unambiguously in best-effort storage. That is a *measured* confirmation where A8 only had an inspection. Policy text at `privacy/page.tsx:179-181` is verbatim "If you or a cleanup tool clear this site's data, the letter is gone. / Download a backup / now and then. It takes one click." (the block runs 179-185 around an embedded `<Link>`). `SECURITY.md:50-54` is the storage table, exactly as cited, listing all three keys A8 names.
**PLAUSIBLE sub-claim:** the Safari/WebKit ITP 7-day script-writable-storage eviction. A8 flags that it did not reproduce this and neither did I — there is no Safari in this environment. The behaviour is documented by WebKit; treat it as well-founded but not measured here.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — `mission_impact: 5` is the right call. Of everything across both files this is the one where a real parent loses real work.
**wrong_standard:** true (soft) — Cal. B&P **§22575(b)(2)** is the review-and-change-process element, and it is about *reviewing PII*, not retention or browser eviction. A8 cites "22575(b)" loosely and then honestly says "the governing reason here is the site's own mission, not a statute" — which is correct. Drop the statutory dressing.

---

### A8-008 — CONFIRMED
**Original claim:** No Children's Information notice; the COPPA position rests on three legs, two of which are product decisions that a future feature could reverse, and none is written down.
**What I did to check it:** Searched the rendered production `/privacy` text for children's-privacy language. Re-derived the schema inventory from `fill-levels.json`. Checked the statutory citations against the operative rule structure.
**What I found:** `fill-levels.json .schemaSections` has **25 sections** and every field A8 names is present — `about.diagnoses`, `medical.allergies`, `medical.therapies`, `medical.emergencyProtocol`, `behavior.triggers`, `behavior.lawEnforcement`, `educationWork.iepHistory`, `socialFaith.faith`, `finalWishes.organDonation`, `finalWishes.funeral`, `benefitsFinances.repPayee`. Confirmed. No occurrence of "child", "children", "COPPA", "minor" or "under 13" in a privacy context on the page. GA `cid` and both `_ga` cookies with a 400-day life confirmed independently.
**Citation check:** 15 U.S.C. §§6501-6506 and 16 C.F.R. Part 312 are correct. A8's quotation of §312.2 "collects or collection" — "the gathering of any personal information from a child by any means" with limbs (a) requesting/prompting/encouraging, (b) enabling public availability, (c) passive tracking — is accurate. The "persistent identifier that can be used to recognize a user over time and across different Web sites or online services" is genuinely within §312.2's "personal information" definition. The §312.2 "directed to children" multi-factor list A8 recites is accurate. **A8's flag that Part 312 was amended in 2025 with staged compliance dates, and that it is reasoning partly from the pre-amendment rule, is honest and correct — counsel must check the operative text.**
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — and I want to record that the recommendation *against* an age gate is well-reasoned: an age gate would manufacture the "actual knowledge" that limb (b) turns on.

---

### A8-009 — PLAUSIBLE
**Original claim:** Washington MHMDA is the only in-scope statute with a private right of action; the site has no consumer-health-data policy and no dedicated homepage link; whether the operator "collects" is genuinely open.
**What I did to check it:** Verified the factual predicates and the statutory structure. Did not attempt to resolve the legal question.
**What I found — predicates all confirmed:** the schema fields A8 lists (`medical.allergies`, `medical.emergencyProtocol`, `medical.therapies`, `medical.equipment`, `medical.preferredHospital`, `about.diagnoses`, `behavior.triggers`, `behavior.earlyWarnings`, `behavior.crisisPlan`, `healthMedical.conditions`, `healthMedical.pharmacy`, `healthMedical.recordsLocation`, `dailyCommunication.hearingVisionMemory`) all exist. Production homepage HTML contains **no** `href` matching `/health/i` and no "consumer health" string — confirmed by extracting every `href` on the page. Zero canary strings in 431 requests, zero POST bodies — confirmed.
**Citations check out:** Wash. Rev. Code **ch. 19.373** is MHMDA; it has no revenue/volume threshold; it requires a *separate and distinct* consumer health data privacy policy with a dedicated homepage link; and a violation is actionable under the Washington Consumer Protection Act, which does carry a private right of action. Nevada **SB 370 (2023)** is the parallel statute without one. All correct.
**Why PLAUSIBLE not CONFIRMED:** the load-bearing question — whether writing to the consumer's own `localStorage` is "access, retain, receive, acquire… or otherwise process… in any manner" — is a legal question I cannot resolve, and A8 self-labels it `NOT_VERIFIED` on the law and `MEASURED` on the facts. That is exactly the right posture and I am not going to manufacture a verdict on it.
**Verdict:** PLAUSIBLE
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A8-010 — CONFIRMED, but it omits material context
**Original claim:** GA cookies are set on load with no consent mechanism; no `gcs=` parameter, so Consent Mode is not implemented; `Secure=false`; ePrivacy Art. 5(3) attaches regardless of targeting.
**What I did to check it:** Parsed the `gcs`/`gcd`/`npa` parameters out of every live GA hit across six fresh browser contexts; re-read the cookie records; read `layout.tsx:114-123`.
**What I found:** **`gcs` is null on every hit** — Consent Mode is not configured, confirmed. `gcd=13l3l3l3l1l1&npa=0` present verbatim in the collect URLs — **exact match** to A8's quote. Cookie fields verbatim from the capture including `expires=1820867112.867853` / `.867652` → **2027-09-13**, i.e. 400 days. `layout.tsx:114-123` loads gtag and calls `gtag('config','G-90YXKXB5TC')` unconditionally on every page — **exact**.
**Citations correct:** ePrivacy Directive 2002/58/EC Art. 5(3); GDPR Arts. 3(2), 6(1)(a), 13; UK PECR reg. 6; EDPB Guidelines 3/2018 on territorial scope. All real and correctly applied.
**Material omission:** A8 says the position should be "documented as a considered decision rather than left as an unexamined default." **It already is.** `SECURITY.md` lines 129-141, "Further privacy recommendations" item 0, reads: "Decide the consent question for Google Analytics, with counsel… This site has no consent banner, on the view that a plain disclosure plus Google's opt-out is proportionate for a US-facing informational tool. That view is worth confirming rather than inheriting…" — and then recommends *exactly* what A8 recommends: **Consent Mode v2 with analytics storage denied, and Google Signals off.** A8 read `SECURITY.md` in full (its own scope list says so) and still framed this as an unexamined default. That materially overstates the gap: the decision is documented and open, not absent.
**Verdict:** CONFIRMED (on the facts)
**already_fixed:** false
**wrong_severity:** **true** — with the SECURITY.md context restored, this is a documented open question rather than an oversight. `harm_if_unfixed: 3` → **2**. `mission_impact: 1` and `reach: 2` unchanged.
**wrong_standard:** false

---

### A8-011 — CONFIRMED
**Original claim:** The GA disclosure omits cookie names, lifetimes, Google's privacy policy link and the partner-data link.
**What I did to check it:** Read `privacy/page.tsx:230-235` and searched the whole rendered page for outbound Google links.
**What I found:** Lines **230-235** are verbatim as quoted, ending "Google sets its own cookies to do that, and its privacy terms apply to what it collects." — **exact**. The only Google link on the page is `GA_OPT_OUT_URL = "https://tools.google.com/dlpage/gaoptout"` at `src/config/analytics.ts:31` — **exact line**. No link to Google's privacy policy, none to the partner-data page. The concrete facts A8 says are missing are all facts I independently established: cookie names `_ga` / `_ga_90YXKXB5TC`, 400-day life, expiry 2027-09-13, measurement ID `G-90YXKXB5TC`, and a payload of `dl` + `dt` + device/locale/screen.
**One thing A8 got wrong by omission, in its own favour:** the payload is **not** "a page_view carrying dl, dt and device fields **and nothing else**" — `form_start` and `scroll` also fire (see A7-002). A8's characterisation of the GA surface, and its section-2 fact table row saying "GA4 transmits `page_view` only", are both **incomplete**. The capture supported them; live behaviour does not.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false — Cal. B&P §22575(b)(6) is the cross-site-collection element, correctly applied.

---

### A8-012 — CONFIRMED
**Original claim:** No vulnerability disclosure policy, no `security.txt`; SECURITY.md itself recommended one and it remains open.
**What I did to check it:** Listed `public/`, requested the well-known path from production, read the SECURITY.md recommendation.
**What I found:** No `public/.well-known` directory. `https://myletterofintent.com/.well-known/security.txt` → **404**. `/security` → **404**. `SECURITY.md` item 2 reads verbatim "**Add a `security.txt`** at `/.well-known/security.txt` with a contact address, so a researcher who finds something has an obvious route." at lines **236-237** (A8 cited 236-238 — one line over). RFC 9116 and ISO/IEC 29147 are correctly cited.
**Minor drift:** A8's `public/` listing omits `social-logo.png`, added mid-run per `audit/CHANGES-DURING-RUN.md` C-2. Immaterial.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A8-013 — CONFIRMED
**Original claim:** SECURITY.md is 15,452 bytes of the site's best trust material and is invisible to everyone who needs it.
**What I did to check it:** `wc -c SECURITY.md`, checked `public/`, read `sitemap.ts`, requested `/security` from production.
**What I found:** **15,452 bytes exactly.** Not in `public/`. Not referenced by `sitemap.ts` (which I read in full — six entries, none security-related). No route under `src/app/` renders it. `/security` → 404 in production. The "Known weakness, stated plainly" section A8 praises does exist, at lines 217-229, and does concede the `unsafe-inline` gap.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false — but note the dependency A8 itself flags: this must land *after* A8-002, or the published page inherits two false claims. That sequencing is correct and important.
**wrong_standard:** false

---

### A8-014 — CONFIRMED
**Original claim:** The `/privacy` meta description contains an orphaned "of any kind." fragment, live in production.
**What I did to check it:** Fetched production `/privacy` and read the `<meta name="description">` attribute directly; read the source concatenation.
**What I found, verbatim from production today:**
`"Everything you type stays on your device. No account, and nothing you write is ever captured — we count page visits and nothing else. of any kind. Here is exactly how that works, in plain words."`
Source at `src/app/privacy/page.tsx:9-12` concatenates `"...we count page visits and nothing else. " + "of any kind. Here is exactly how that works, in plain words."` — **exactly** as A8 describes. This is the same defect as A7-003's second half; two analysts found it independently.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** false

---

### A8-015 — CONFIRMED, with a miscited statutory paragraph
**Original claim:** No policy change log and no AI-use position; no AI features anywhere in the codebase.
**What I did to check it:** Re-ran the AI grep, listed the repository root, checked for a changelog route.
**What I found:** `grep -riE "openai|anthropic|gemini|\bclaude\b|\bLLM\b|machine learning" src/` → **zero matches**, reproduced. No `CHANGELOG` at the repository root. No `/changelog` route. Confirmed.
**Minor inaccuracy:** A8's "the root contains…" list is not the root's contents — it omits `audit/`, `e2e/`, `public/`, `scripts/`, `review-pack/`, `src/`, `test-results/`, `tsconfig.tsbuildinfo`. The load-bearing claim (no CHANGELOG) is unaffected.
**Verdict:** CONFIRMED
**already_fixed:** false
**wrong_severity:** false
**wrong_standard:** **true** — A8-015 cites "Cal. Bus. & Prof. Code 22575(b)(4) (process for notifying consumers of material changes)". **§22575(b)(4) is "Identify its effective date."** The process for notifying consumers of material changes is **§22575(b)(3)**. Correct citation: **Cal. Bus. & Prof. Code §22575(b)(3)** for the change-notification duty (and (b)(4) separately for the effective date, which A8-004 already covers). Note A8-004 gets this right by citing the (b)(1)-(b)(7) range; only A8-015 pins the wrong paragraph.

---

## COUNT

| Verdict | Count |
| --- | --- |
| **CONFIRMED** | **28** (A7-001…A7-014 = 14; A8-001…A8-008, A8-010…A8-015 = 14) |
| **PLAUSIBLE** | **1** (A8-009 — legal question genuinely open, self-labelled NOT_VERIFIED) |
| **REFUTED** | **0** findings. **2 sub-details refuted inside otherwise-confirmed findings:** A7-013's "absent from the .mp4" (ACAO *is* on the mp4; CORP is what's missing) and A7-011's "static chunks lack the GA hosts" (they carry them). One evidence figure is stale: A8-006's `<video> = 1`. |
| **already_fixed** | **0** |
| **wrong_severity** | **2** — A8-006 (harm 5 → 4), A8-010 (harm 3 → 2). One under-stated: A7-012 (harm 3 → 4). |
| **wrong_standard** | **7** — A8-015 (hard error: §22575(b)(4) → (b)(3)); A7-001, A7-002, A7-005, A7-007, A7-008, A7-013 (soft: misglossed NIST PF subcategories, over-reached GDPR Art. 9, ASVS controls aimed at a different thing). |

Nothing in either file was already fixed. Everything here still needs work — some of it deployment-independent, none of it merely stale.

---

## STRONGEST — survived the hardest scrutiny

1. **A7-002 (`form_start` on typing).** I actively tried to kill this and failed on my *first* attempt — character-typing on three routes produced only `page_view`, and I had the refutation half-written. A harder test reproduced it with **byte-identical parameters**: `f-diagnoses`/`diagnoses`/`form_length=7`/`first_field_position=2` and `f-allergies`/`allergies`/`form_length=13`/`first_field_position=1`. Nobody invents those. It also survived the sharpest available counter-argument — that the shared capture shows only `page_view` — because the capture genuinely does, and A7 said so itself and explained why.
2. **A7-012 (the egress test is event-blind).** Every line citation exact (15, 22-30, 47-48, 51-58, 57), and I proved the mechanism rather than the code: the entire 431-request capture contains exactly one GA event name, `page_view`, while two enhanced-measurement events demonstrably fire in the field. The longest half-life of anything in either file.
3. **A7-009 (PDF `/Title` and `/Author`).** I wrote an independent Info-dictionary decoder and got every string back verbatim, down to `D:20260809202819Z`, plus the catalog dictionary byte-identical. Line citations exact including the pointer to the fallback string at `loi-document.tsx:251`.
4. **A8-003 (the strongest sentence is true only by CSP accident).** The claim "the ONLY request URL in the entire capture with no corresponding entry in `.responses`" is an unusually falsifiable thing to assert, and it is exactly right — I computed the set independently and it has one member.
5. **A7-007 (delete leaves three traces).** Reproduced end to end on production, including the notice text verbatim, with exact code line citations.

## WEAKEST — could not fully refute, but treat with care

1. **A8-009 (MHMDA).** Correctly self-labelled `NOT_VERIFIED`. The predicates are solid and the statute citations are right, but the whole finding turns on an unresolved question of statutory construction that neither A8 nor I can settle. It is honest work, not verified work.
2. **A7-014 (lone-CR in ICS escaping).** The code defect is real and the regex demonstrably cannot match a bare `\r`. Neither A8's author nor I constructed an input that reaches it, and I do not believe one exists through a browser field. A7 scores it 1/1/1 and says drop it if it competes — correct.
3. **A8 section 3's readability decimals.** The conclusion is robust; the specific numbers are not independently reproducible (my Fog/SMOG ran ~0.7 higher on a different polysyllable heuristic). Do not quote 8.6/8.5 as if they were measurements of the text rather than of an implementation.
4. **A7-006's NEL/supply-chain framing.** The measurements are all solid (and I upgraded three of them from unverified to verified). The *inference* — that Cloudflare's demonstrated rewriting capability is the residual risk — is argument, not measurement. It happens to be a good argument.
5. **A7-013 (`ACAO: *`).** Reliably measured, correctly assessed as harmless, but one of its two supporting sub-details is wrong and the finding never established which layer emits the header. A7 lists it among its own least-confident items, which is right.

## WHAT BOTH ANALYSTS MISSED

1. **A second Enhanced Measurement event is firing: `scroll`.** `en=scroll`, `epn.percent_scrolled=90`, on both wizard routes I tested. A7-002 recommends turning off "Form interactions", "File downloads" and "Site search" and says it could not determine what else was on. **Scroll is on, and it is now measured.** This strengthens A7-012's argument materially and should be in the fix list. It also means A8's section-2 fact table row "GA4 transmits `page_view` only" and A8-011's payload description are both incomplete.
2. **The Cloudflare beacon is only injected when the request sends `Accept: text/html`.** Both A7-004 (recommendation 3) and A8-002/A8-003 propose a production CI check that asserts the host set or the script tags. **A naive `curl`/`fetch` check will pass while the beacon is served to every real visitor.** Whoever builds that check must send a browser `Accept` header, or drive a real browser. This is the single most actionable thing I found that neither analyst had.
3. **`SECURITY.md:240-243` already recommends `Clear-Site-Data` on the delete action** — "The header can only be sent by a server response, so it would need a route handler — but it is the only way to guarantee eviction of caches the page cannot reach from JavaScript." That is directly on point for A7-007 and neither analyst cites it. It is also a fourth remediation option A7-007 does not list.
4. **`SECURITY.md:129-141` already documents the consent decision and already recommends Consent Mode v2 plus Google Signals off** — which is A8-010's own recommendation, arrived at independently. A8-010 characterises the position as "left as an unexamined default"; it is not.
5. **Three DNS/TLS facts are now settled, not inferred:** no CAA records (two independent resolvers), DNSSEC definitively off (no `DNSKEY`, and no `DS` at the `.com` parent), and the domain is **not** on the HSTS preload list despite the header declaring `preload`. A7-006 listed all three as unverifiable; they are verified now, and A7-006's recommendations 4-6 are all live.
6. **`navigator.storage.persisted()` returns `false` on production** — A8-007 inferred best-effort storage from a grep; it is now measured on three routes.
7. **A7's canary-search script is not retained.** A7-001 states "Script and full output retained," but there is no `a7-*.mjs` under `audit/tools/` and no A7 output under `audit/evidence/`. The headline figures (309 needles, 24 encodings, 91,595 characters) are not re-runnable. I reproduced the *result* with my own search, so the finding holds — but if this audit is ever handed to a third party, that specific claim cannot be checked.
8. **The zustand persist rewrite is not only a reload artefact.** `clearAll()` sets state, `persist.clearStorage()` removes the key — but the middleware will rewrite `twl-loi-letter-v1` on the *next state change of any kind*, not merely on reload. A7-007's fix 2 ("`removeItem` once more on the next tick") would not survive a subsequent store write in the same page life. The durable fix is to stop the middleware writing an empty state at all.
9. **`access-control-allow-origin: *` is on literally every response type** — HTML, RSC, static JS, PNG, the `/_next/image` optimiser, and the `.mp4`. A7-013 believed it was scoped to HTML/RSC. Broader than reported, and still harmless for the reasons A7-013 gives.
