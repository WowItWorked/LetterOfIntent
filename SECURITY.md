# Security and privacy assessment

Assessed against the code as it stands, not against intentions. Every claim
below names the file that enforces it or the test that proves it, so this
document can be re-checked rather than believed.

Scope: `myletterofintent.com` — a static Next.js site with **no backend, no
database, and no accounts**. That single architectural fact removes most of the
OWASP Top Ten outright, and the rest of this document is about the parts it
does not remove.

---

## 1. Privacy: does anything a family types leave their device?

**No.** Verified four ways.

### What the code can do

There are exactly **two** network calls in the entire application:

| Call | File | What it fetches |
| --- | --- | --- |
| `fetch(VIDEO_FILE)` | `components/home/VideoPlayer.tsx` | `/what-is-a-letter-of-intent.mp4`, same origin, only when a host fails to answer range requests |
| `fetch(path)` | `lib/pdf/generate.tsx` | `/monogram-gold.png` and `/mloi-lockup-stacked.png`, same origin, to embed in the PDF |

Both are GETs for the site's own static assets. There is no `XMLHttpRequest`,
no `WebSocket`, no `EventSource`, and no `navigator.sendBeacon` anywhere in
`src/`. Nothing accepts a body, so there is no code path that *could* transmit
a letter even if someone wanted it to.

### What the browser is permitted to do

`next.config.ts` sets, in production:

```
connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com
            https://*.google-analytics.com https://*.analytics.google.com
```

Google Analytics is the **only** third party the browser may talk to, and the
list is generated from `src/config/analytics.ts` so the policy and the code
cannot drift. Any other exfiltration attempt — by a bug or a compromised
dependency — is blocked by the browser before the request leaves the machine.
`default-src 'self'`, `object-src 'none'`, `base-uri 'self'`, `form-action
'self'`, and `frame-ancestors 'none'` close the adjacent routes.

### Where the data actually lives

| Data | Store | Key |
| --- | --- | --- |
| The letter | `localStorage` | `twl-loi-letter-v1` |
| Photographs | IndexedDB | `twl-loi-photos` |
| Video position | `localStorage` | `mloi.video.whatIsALetterOfIntent.position` |

All origin-scoped and local. **Delete all my data** clears both stores and then
re-reads the key to confirm it is gone (`components/data/DataControls.tsx`).

### Proof, not assertion

`e2e/privacy-network.spec.ts` records **every** request the browser makes
across a full journey — typing, autosave, PDF generation, all three downloads,
photo upload, backup restore, and the reminder panel — and fails on either of
two conditions:

1. a request reaches any host other than the analytics endpoints, or
2. **any request, to any host including Google, contains a distinctive string
   from the seeded letter** — names, a medication, an allergy.

The second check is the one that matters. Analytics is permitted to count a
page; it is not permitted to learn anything about the person the letter is
about, and the test would fail the build if that ever changed. It runs on every
commit, at desktop and 375px.

### Third parties

- **Google Analytics 4** (`G-90YXKXB5TC`), loaded from googletagmanager.com,
  reporting page views. It is never passed a form value; there is no custom
  event carrying letter content anywhere in `src/`. GA4 anonymises IP
  addresses by default.
- **No other analytics** — no Vercel Analytics, no heatmaps, no session
  recording, no advertising pixels.
- **No web fonts from a CDN.** Cinzel, Cormorant Garamond, and Mulish are
  served from this origin — `next/font` for the site, `public/fonts/` for the
  PDF renderer.
- **Cookies.** GA4 sets its own (`_ga`, `_ga_*`). Nothing else on the site sets
  one. See the consent question under *Recommendations* below.

### What Vercel and GitHub see

- **GitHub** holds the source code. It never sees user data: no letter has
  ever been in the repository, and there is no mechanism to put one there.
- **Vercel** serves static files. It necessarily receives what any web server
  receives — IP address, timestamp, path, user agent — as ordinary request
  logs. It does **not** receive letter contents, because the letter is never
  in a request. This is disclosed on the privacy page.

> **Recommendation.** Confirm the retention period of Vercel's request logs and
> state it on the privacy page. "Our host keeps ordinary server logs" is true
> but vague; "for 30 days" is checkable. Consider whether a firm handling
> special-needs planning wants a Data Processing Agreement with Vercel on file.

### Outbound links — the one place data *can* travel

These are user-initiated navigations, not background requests, but they deserve
naming because the distinction is invisible to a family.

| Link | What travels | Contains letter data? |
| --- | --- | --- |
| Share buttons (8 targets) | A fixed pre-written message and `myletterofintent.com` | **No** — static strings, see `lib/share.ts` |
| Google / Outlook calendar | The title `Review the Letter of Intent` and a date | **No** |
| `.ics` download | Title including the person's name | Local file; nothing transmitted |
| Firm phone / email / website | Nothing beyond the navigation | No |

> **Fixed during this review.** The hosted calendar links previously carried
> `Review Alex's Letter of Intent` — putting a real name, and by implication a
> disability, into a Google or Microsoft account. They now use a fixed
> impersonal title (`HOSTED_CALENDAR_TITLE` in `lib/ics.ts`). The `.ics` file,
> which is built and read entirely on the device, still uses the name.

> **Fixed during this review.** Download filenames previously included the
> person's name (`Letter-of-Intent-Alex-2026-08-08.pdf`). A filename is read by
> anyone who can see a downloads folder, a sync notification, or a shared
> drive. Names are now `Letter-of-Intent-Disabilities-2026-08-08.pdf`, enforced
> by `lib/filenames.ts` and asserted in both unit and e2e tests.

### Further privacy recommendations

0. **Decide the consent question for Google Analytics, with counsel.** GA4 sets
   cookies and processes IP addresses. This site has no consent banner, on the
   view that a plain disclosure plus Google's opt-out is proportionate for a
   US-facing informational tool. That view is worth confirming rather than
   inheriting, because: Virginia's VCDPA and several other state laws have
   opt-out rights attached to "targeted advertising" and "sale" that turn on
   how GA is configured; visitors from the EU/UK bring GDPR consent
   requirements; and the audience here is families of people with
   disabilities, which makes even inferred audience data unusually sensitive.
   Two concrete mitigations if you want to keep GA but reduce exposure:
   switch on **Google Consent Mode v2** with analytics storage denied until a
   choice is made, and turn **off** Google Signals in the GA4 property so no
   cross-device advertising profile is built from this traffic.

1. **A "clear on exit" option for shared computers.** The library-machine case
   is real for this audience. A checkbox that wipes storage on tab close would
   help more than another paragraph of advice.
2. **Strip photograph EXIF on import.** A phone photo carries GPS coordinates
   and a capture timestamp. These stay on the device today, but they also ride
   inside the backup `.json` and the emergency-sheet PDF — both of which
   families are told to email to themselves and hand to a school. Re-encoding
   through a canvas on upload would drop EXIF entirely.
3. **Warn before the reading view is printed to PDF.** Browser "Print to PDF"
   may route through a cloud print service on some platforms.
4. **Say something about browser sync.** Chrome and Edge profile sync does not
   carry `localStorage` to other devices, but families reasonably assume
   otherwise; one sentence would settle it.

---

## 2. Security: OWASP Top Ten (2021)

| # | Category | Applicability and control |
| --- | --- | --- |
| A01 | Broken access control | **Not applicable.** No accounts, no roles, no server-side objects. All data is origin-scoped browser storage, isolated by the same-origin policy. |
| A02 | Cryptographic failures | No secrets exist client-side; there are no API keys, tokens, or credentials in the bundle. Transport is HTTPS, now pinned by HSTS (2 years, `includeSubDomains`, `preload`). Data at rest is unencrypted browser storage — appropriate, since the threat model is *the family's own device*, and encrypting it would require a password the tool deliberately does not have. |
| A03 | Injection | **XSS is the only live vector.** No `dangerouslySetInnerHTML`, `innerHTML`, `eval`, `new Function`, or `document.write` anywhere in `src/` — verified by grep. React escapes all interpolated text, and the PDF renderer draws strings as glyphs. A backup containing `<script>alert(1)</script>` is stored and displayed as literal text (asserted in `backup.test.ts`). No SQL, no shell, no server-side templating exists to inject into. |
| A04 | Insecure design | The riskiest design decision — a form that looks functional but is not — was avoided: the yearly-reminder panel states plainly that it is not switched on, stores nothing, and sends nothing (asserted in `privacy-network.spec.ts`). |
| A05 | Security misconfiguration | CSP, HSTS, `X-Content-Type-Options`, `Referrer-Policy: no-referrer`, a deny-list `Permissions-Policy`, `X-Frame-Options: DENY`, and `Cross-Origin-Opener-Policy` / `Cross-Origin-Resource-Policy: same-origin`. See *Known weakness* below. |
| A06 | Vulnerable components | `npm audit` reports **0 vulnerabilities**, production and dev. Dependencies are few and mainstream. CI runs on every push. |
| A07 | Identification / authentication | **Not applicable.** There is nothing to authenticate to. |
| A08 | Software and data integrity | The backup file is untrusted input from the filesystem and is treated as such — see below. No external scripts are loaded, so SRI is moot. |
| A09 | Logging and monitoring | Deliberately absent. Client-side logging of a document like this would be a privacy defect, not a security control. |
| A10 | SSRF | **Not applicable.** No server, and no code path that fetches a user-supplied URL. |

### The backup file — the main untrusted input

`lib/backup.ts`, with 30 unit tests in `backup.test.ts` and 9 end-to-end tests
in `e2e/restore.spec.ts`:

- **Size cap before parsing.** 24 MB, checked on the string *and* on
  `file.size` before reading, so a 2 GB file cannot hang the tab in
  `JSON.parse`.
- **Prototype-pollution guard.** Parsed JSON is rebuilt with own,
  non-polluting keys only; `__proto__`, `constructor`, and `prototype` are
  dropped at every depth. Tested at top level, nested, and end-to-end against
  a live page.
- **Depth limit.** Nesting beyond 12 levels is discarded rather than recursed
  into; a 400-deep payload is handled without a stack overflow.
- **Schema validation per section.** Every section is parsed against its own
  zod schema, so a malformed one is skipped and reported rather than taking the
  letter down with it.
- **Photograph validation.** At most two, each must match
  `data:image/(jpeg|png|webp|heic|heif);base64,…` and sit under 12 MB.
  `javascript:` and `https://` URLs are rejected — the latter would otherwise
  be a tracking pixel embedded in a shared backup.
- **Foreign files refused.** A file naming a different `app` is refused even
  if its shape matches.

### The photograph upload

`lib/photos.ts` and `components/wizard/PhotoFields.tsx`:

- 8 MB cap.
- **Magic-byte sniffing** (`sniffImageType`) rather than trusting `file.type`
  or the extension. This specifically blocks a renamed `.svg` — an SVG is a
  document that can carry script, and it would otherwise pass a naive
  `type.startsWith("image/")` check.
- Object URLs are revoked on unmount.

### Text fields

Every one is optional and free-text, rendered by React and drawn into the PDF
as text. There is no interpreter downstream — no SQL, no shell, no `eval`, no
server-side template — so there is nothing for a payload to escape into. The
schema also *refuses to have* fields for Social Security, account, or policy
numbers, enforced by a test that fails if such a field id is ever added.

### Known weakness, stated plainly

**`script-src` still allows `'unsafe-inline'.`** Next.js injects inline
bootstrap and hydration scripts, and this site is statically exported, so there
is no server to mint a per-request nonce. The practical exposure is low — there
is no user-controlled HTML sink to inject through — but it is a genuine gap
against a strict CSP.

> **Recommendation.** If this is worth closing, the route is Next.js middleware
> issuing a per-request nonce, which requires moving off pure static export to
> a runtime that executes middleware. That is a real trade-off in hosting cost
> and complexity for a site whose main asset is not secret. Recommended only if
> the firm's risk policy requires a clean CSP report.

### Further security recommendations

1. **Subresource Integrity is not applicable today, but pin it if a CDN is
   ever added.** The moment a third-party script appears, both the CSP and
   this assessment need revisiting.
2. **Add a `security.txt`** at `/.well-known/security.txt` with a contact
   address, so a researcher who finds something has an obvious route.
3. **Enable Dependabot or Renovate** on the repository. `npm audit` is clean
   today; the value is in being told the day it stops being.
4. **Consider `Clear-Site-Data` on the delete action.** The header can only be
   sent by a server response, so it would need a route handler — but it is the
   only way to guarantee eviction of caches the page cannot reach from
   JavaScript.
5. **Pin GitHub Actions to commit SHAs** rather than tags, so a compromised
   action tag cannot alter a build.
6. **Set `Content-Disposition: attachment` on the sample PDFs** if they are
   ever served from a domain that also holds authenticated content. Not
   required here.

---

## 3. What was changed during this assessment

| Change | File | Why |
| --- | --- | --- |
| Names removed from all download filenames | `lib/filenames.ts` | A filename discloses to anyone who sees the screen |
| Person's name removed from hosted calendar links | `lib/ics.ts` | Was sending a name to Google/Microsoft |
| Prototype-pollution guard and depth limit | `lib/backup.ts` | Untrusted file input |
| Size caps on backup and photo data URLs | `lib/backup.ts` | Denial of service via `JSON.parse` |
| Photograph magic-byte sniffing | `lib/photos.ts` | Renamed SVG bypassed the MIME check |
| Per-section salvage instead of all-or-nothing parsing | `lib/backup.ts` | A family should not lose a letter to one bad field |
| HSTS, COOP, CORP, `X-Frame-Options`, expanded `Permissions-Policy` | `next.config.ts` | Defence in depth |
| `media-src 'self' blob:` | `next.config.ts` | Required by the video fallback; scoped rather than broad |

## 4. How to re-verify

```bash
npm audit                                    # 0 vulnerabilities expected
npm run test:run                             # unit, including backup hostile-input tests
npx playwright test e2e/privacy-network.spec.ts   # asserts zero non-local requests
npx playwright test e2e/restore.spec.ts      # asserts safe failure on bad uploads
```
