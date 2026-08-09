# My Letter of Intent

A free, public, guided web tool that helps a family write a **Letter of Intent**
and download it as a polished PDF — plus a one-page **emergency sheet** for
sitters, schools, and the ER. Built as a public-service tool for
[Trusts & Wealth, PLLC](https://trustsandwealth.com) and published at
[myletterofintent.com](https://myletterofintent.com).

**Two letters, one builder.** A chooser at `/letter` picks the path:

| Path            | Sections | For                                                    |
| --------------- | -------- | ------------------------------------------------------ |
| `special-needs` | 15       | A loved one with disabilities — trustee, benefits, behavior support |
| `general`       | 14       | An aging parent, a spouse, a sibling you look after    |

Four sections (getting started, family & support, final wishes, the personal
message) are shared, so a family that switches paths keeps them.

**The two non-negotiables, enforced in code and CI:**

1. **Privacy** — every keystroke stays in the browser. There is no backend and
   no database. Google Analytics counts page views (`src/config/analytics.ts`)
   and is the only third party the CSP's `connect-src` permits; it is never
   handed anything from the letter. An e2e test records every network request
   across a full journey — typing, autosave, PDF generation, photo upload,
   backup restore — and fails if any request reaches a host other than
   analytics, **or if any request carries a word of the letter**. The tool
   never asks for SSNs or account numbers — by schema design.
2. **Accessibility** — WCAG 2.1 AA. axe runs in CI against every wizard step in
   both paths and must report zero violations. The full keyboard journey is
   tested. `prefers-reduced-motion` is respected and touch targets are ≥ 44px.
   Where a brand token failed contrast as text (`--ink-400` at 2.9:1), the
   semantic alias is darkened rather than the usage sprinkled with exceptions.

## Quick start

```bash
npm install
npm run dev          # http://localhost:3000
```

| Script              | What it does                                        |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Dev server                                          |
| `npm run build`     | Production build (also generates route types)       |
| `npm run start`     | Serve the production build                          |
| `npm run lint`      | ESLint                                              |
| `npm run typecheck` | `tsc --noEmit` (run a build once first)             |
| `npm run test`      | Vitest in watch mode                                |
| `npm run test:run`  | Unit tests once                                     |
| `npm run e2e`       | Playwright + axe (needs `npm run build` first)      |

## Architecture

```
src/
  config/firm.ts              ← every firm-specific value (white-label here)
  lib/
    schema.ts                 ← zod persistence schema, every section, all optional
    content/sections/*.ts     ← the special-needs path: 15 declarative section defs
    content/sections/general/ ← the general path: 14, four of them shared
    content/paths.ts          ← the two paths + slug → path resolution
    content/preview-prompts.ts← the chooser's "be ready to write about" lines
    content/types.ts          ← FieldDef / SectionDef types
    store.ts                  ← zustand + persist (letter data, localStorage)
    photos.ts                 ← the two photographs, in IndexedDB
    share.ts                  ← the pre-written message and its eight targets
    validation.ts             ← gentle UI-only format hints (never blocking)
    derive.ts                 ← names, progress, emergency sheet, key points
    backup.ts / ics.ts        ← export/import envelope, RFC 5545 reminder
    pdf/theme.ts              ← brand fonts + palette for both documents
    pdf/loi-document.tsx      ← full letter (two-pass render for TOC page numbers)
    pdf/emergency-document.tsx← one-page emergency sheet
  components/
    chrome/                   ← masthead, privacy strip, footer
    letter/                   ← the chooser and its start buttons
    home/                     ← the explainer video player, resume card
    share/                    ← the share card and copy-link behaviour
    wizard/                   ← rail nav, generic SectionForm renderer, photos
    review/                   ← downloads, yearly reminder, print view
    data/                     ← export / import / documents / delete-all
```

**One renderer, twenty-nine section definitions.** Sections are data, not
components: each file in `lib/content/sections/` declares its fields, helper
text, and examples, and the generic `SectionForm` renders any of them. The PDFs
and the review screen walk the same definitions. Unit tests assert that the
definitions, the zod schema, and the chooser's prompts can never drift apart —
including that a slug shared between the two paths always means the same
section key.

**Adding or changing a question** = edit the section def + the matching schema
object (the sync test tells you if you miss one). Copy changes are pure content
edits — no component work.

**Why Zustand over Context:** form state spans 25 routes and updates on every
debounced keystroke; Context would re-render the whole tree or demand heavy
memoization. Zustand gives selector-level subscriptions, a built-in
localStorage persist middleware, ~1 kB, and no provider nesting. Hydration is
deferred (`skipHydration` + a client boot effect) so the server render always
matches the first client render; forms mount only after hydration so saved
work is never clobbered.

**PDF generation** happens entirely client-side via `@react-pdf/renderer`,
loaded on demand (dynamic import) so it never weighs down the wizard. The
letter renders twice: pass 1 records which page each section starts on (via
render-prop side effects during layout), pass 2 prints those numbers in the
table of contents. **Page four is "Key points at a glance"** — the call order,
how to talk with them, the medical facts that cannot wait, what helps, and a
danger-bordered what-makes-it-worse, each citing the section it came from.

Fonts are Cinzel, Cormorant Garamond, and Mulish, served from `public/fonts/`
so they are same-origin and the CSP holds. Cinzel appears only at 9pt and above;
every smaller label is Mulish bold caps.

## The explainer video

`public/what-is-a-letter-of-intent.mp4` (4:38, ~19 MB, faststart). The poster is
a `<button>`; the whole frame starts playback. Position persists to
`localStorage` under `mloi.video.whatIsALetterOfIntent.position` and resumes on
return. With the video focused, ←/→ seek 5s (Shift for 30s) and 1–9 jump to
that tenth. If a host does not answer range requests the timeline is not
seekable, so the player fetches the file once and replays it from a blob URL —
Vercel does answer them, so that path should never fire in production, and
`media-src 'self' blob:` in the CSP is what allows the fallback when it does.

## Privacy architecture

- Letter text lives in `localStorage` under one key (`twl-loi-letter-v1`);
  photographs live in IndexedDB (`twl-loi-photos`), which localStorage's ~5 MB
  origin cap could not hold without risking the written letter.
- Export/Import: versioned JSON envelope (`lib/backup.ts`), tolerant of
  future fields; import never rejects a letter over a typo. Photographs travel
  inside the backup as data URLs.
- **Delete all my data** clears the store and the photo database, then
  *verifies* the key is gone and says so.
- No SSN / account-number fields exist anywhere in the schema; the letter
  records *where* the family keeps those instead. A unit test enforces the ban.
- `next telemetry` is disabled for this project.

## Deploying to Vercel

The repo is public at
[WowItWorked/LetterOfIntent](https://github.com/WowItWorked/LetterOfIntent) and
every push runs the full CI gate (lint, unit, build, e2e + axe).

1. Sign in at [vercel.com](https://vercel.com) with the GitHub account that owns
   the repo.
2. **Add New… → Project → Import** `LetterOfIntent`.
3. Accept every default. Framework auto-detects as Next.js, root directory is
   the repo root, and **no environment variables are needed** — there is no
   backend, no API keys, no database.
4. **Deploy.** First build takes 1–2 minutes and yields a live
   `*.vercel.app` URL. Every later push to `main` redeploys automatically;
   pull requests get their own preview URLs.
### Custom domain

The tool's canonical home is **myletterofintent.com** (set in
`src/config/firm.ts` as `appUrl` — canonical tags, link previews, the sitemap,
and the PDF footer credit all read from it).

1. **Vercel → Project → Settings → Domains → Add**: add both
   `myletterofintent.com` and `www.myletterofintent.com`, and mark one as
   primary (the other 308-redirects to it).
2. Vercel displays the exact DNS records. Add them at **Cloudflare**, which
   holds this domain's nameservers.
3. **Set each record to DNS only (grey cloud), not proxied (orange cloud).**
   Proxying breaks Vercel's certificate issuance and, with Cloudflare's
   Flexible SSL mode, causes redirect loops. Vercel terminates TLS itself.
4. Wait for Vercel to show **Valid Configuration**; certificates issue
   automatically, usually within minutes.

If the domain ever changes, update `appUrl` / `appUrlLabel` in
`src/config/firm.ts` — nothing else hardcodes it.

After the first deploy, confirm the privacy promise in the wild: open devtools →
Network, fill in a section, download the PDF, and watch for third-party
requests. There should be none (the e2e suite asserts this on every commit), and
the response headers should carry the `Content-Security-Policy` from
`next.config.ts`.

**Build directory note:** local builds write to `node_modules/.cache/next-build`
to dodge OneDrive file locks; hosted builds (`VERCEL` or `CI` set) use the
standard `.next`, which is what Vercel expects. See `next.config.ts`.

## White-labeling

Everything firm-specific — name, attorney, phone, consultation URL, brand
colors, disclaimers, advertising notice — lives in `src/config/firm.ts` with
typed exports. The logo is `public/monogram-gold.png` (referenced from config;
set `logoPath: null` to hide it). No other file names the firm.

## Content guardrails

- Every field optional; sections skippable; progress is encouragement, not a
  requirement. Format hints (email/date) are soft, amber, and never block.
- Final wishes sits behind a gentle interstitial and is marked optional in
  navigation, in both paths.
- Reading level target for UI copy: ~8th grade. Terms of art (waiver, IEP,
  ABLE, SSI/SSDI, supported decision-making) are defined inline where used.

## Known gaps

- **The emailed yearly reminder is not switched on.** The panel on the review
  page is built and clearly labelled as unavailable; submitting it stores and
  sends nothing, and points the visitor at the calendar buttons, which do work.
  Turning it on needs a send endpoint, somewhere to hold addresses, and a
  scheduler — plus a rewrite of privacy §05, which currently states plainly that
  nothing is transmitted.
- **No contact form.** By decision, the site links out to
  `trustsandwealth.com/contact` and offers `mailto:` and `tel:` links; there is
  no server here to accept a form post.
