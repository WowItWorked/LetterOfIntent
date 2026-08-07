# Letter of Intent Builder

A free, public, guided web tool that helps a parent or guardian of a person with
disabilities write a comprehensive **Letter of Intent** and download it as a
polished PDF — plus a one-page **emergency sheet** for sitters, schools, and the
ER. Built as a public-service tool for [Trusts & Wealth, PLLC](https://trustsandwealth.com).

**The two non-negotiables, enforced in code and CI:**

1. **Privacy** — every keystroke stays in the browser. There is no backend, no
   database, no analytics, and a production Content-Security-Policy pins
   `connect-src` to `'self'`. An e2e test records every network request across a
   full journey (including PDF generation) and fails if any request leaves
   localhost. The tool never asks for SSNs or account numbers — by schema design.
2. **Accessibility** — WCAG 2.1 AA. axe runs in CI against every wizard step and
   must report zero violations. Full keyboard journey is tested. User-facing text
   size (3 steps) and high-contrast toggles persist. Dark mode and
   `prefers-reduced-motion` are respected. Touch targets are ≥ 44px.

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
    schema.ts                 ← zod persistence schema, all 15 sections, all optional
    content/sections/*.ts     ← the product: 15 declarative section defs with all copy
    content/types.ts          ← FieldDef / SectionDef types
    store.ts                  ← zustand + persist (letter data, localStorage)
    settings-store.ts         ← text size / contrast (applied pre-paint)
    validation.ts             ← gentle UI-only format hints (never blocking)
    derive.ts                 ← names, progress, emergency-sheet extraction
    backup.ts / ics.ts        ← export/import envelope, RFC 5545 reminder
    pdf/loi-document.tsx      ← full letter (two-pass render for TOC page numbers)
    pdf/emergency-document.tsx← one-page emergency sheet
  components/
    wizard/                   ← rail nav, generic SectionForm renderer, autosave
    review/                   ← downloads, yearly reminder, single CTA, print view
    data/                     ← export / import / delete-all
```

**One renderer, fifteen sections.** Sections are data, not components: each file
in `lib/content/sections/` declares its fields, helper text, and examples, and
the generic `SectionForm` renders any of them. The PDF and the review screen
walk the same definitions. A unit test asserts the definitions and the zod
schema can never drift apart.

**Adding or changing a question** = edit the section def + the matching schema
object (the sync test tells you if you miss one). Copy changes are pure content
edits — no component work.

**Why Zustand over Context:** form state spans 15 routes and updates on every
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
table of contents. Fonts are the built-in Times family — zero font fetches.

## Privacy architecture

- All data lives in `localStorage` under two keys (`twl-loi-letter-v1`,
  `twl-loi-settings-v1`).
- Export/Import: versioned JSON envelope (`lib/backup.ts`), tolerant of
  future fields; import never rejects a letter over a typo.
- **Delete all my data** clears both stores, then *verifies* the keys are gone
  and says so.
- No SSN / account-number fields exist anywhere in the schema; the letter
  records *where* the family keeps those instead. A unit test enforces the ban.
- `next telemetry` is disabled for this project.

## Deploying to Vercel

1. Push this repo to GitHub (CI runs lint, unit, build, e2e + axe).
2. In Vercel: **New Project → import the repo.** Framework auto-detects Next.js.
   No environment variables are needed — there is no backend.
3. Suggested domain: `letter.trustsandwealth.com`.
4. After the first deploy, verify in the browser devtools network tab that a
   full wizard + PDF journey makes no third-party requests (the e2e suite
   asserts the same thing on every commit).

## White-labeling

Everything firm-specific — name, attorney, phone, consultation URL, brand
colors, disclaimers, advertising notice — lives in `src/config/firm.ts` with
typed exports. The logo is `public/monogram-gold.png` (referenced from config;
set `logoPath: null` to hide it). No other file names the firm.

## Content guardrails

- Every field optional; sections skippable; progress is encouragement, not a
  requirement. Format hints (email/date) are soft, amber, and never block.
- Section 14 (Final wishes) sits behind a gentle interstitial and is marked
  optional in navigation.
- Reading level target for UI copy: ~8th grade. Terms of art (waiver, IEP,
  ABLE, SSI/SSDI, supported decision-making) are defined inline where used.
