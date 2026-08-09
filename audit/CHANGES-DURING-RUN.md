# Changes made to the site while the audit was running

The audit brief is analysis-only, and the nine analyses were told the target
would hold still. It did not, in one respect. Recorded here so that
verification can tell a stale finding from a live one, rather than silently
"correcting" the record later.

---

## C-1 — Video duration label was wrong by more than double

**Changed at:** during the nine-analysis phase, at the site owner's direct
instruction (not as a result of any audit finding).

**File:** `src/components/home/VideoPlayer.tsx`

**Before:** `Watch · about 2 minutes`
**After:** `Watch · under 5 minutes`

**Why it was wrong:** measured `video.duration` = **277.99s = 4:38**
(`what-is-a-letter-of-intent.mp4`). The player's own control bar displays
`4:37`, one second lower, because it truncates rather than rounds. Either way
the label claimed less than half the real length, and it sat directly beneath
those controls — so the contradiction was visible in a single glance: the
player said `0:00 / 4:37` and the caption underneath said "about 2 minutes".

Confidence: MEASURED (read from the media element, not from the rendered
control text).

**Why "under 5 minutes" rather than "about 5 minutes":** for an exhausted
reader deciding whether to spend the time, understating is the harm — they
either feel misled or abandon partway. Overstating slightly is kind, because
finishing early is a pleasant surprise. "Under 5 minutes" is both literally
accurate at 4:37 and caps the expectation rather than estimating it.

**Consequence for the audit:** A5 (plain language) and A2 (usability) were
running against the old text and may report the "about 2 minutes" claim as a
finding. If they do, that finding is **CORRECT AS OBSERVED but already fixed
locally** — it should be marked as such in verification, not refuted, and it
still needs deployment to reach production.

**Production status at time of writing:** still shows the old, incorrect
label. `origin/main` is at `d5ec230`; this change is uncommitted.

---

## C-2 — Social share image replaced

**Changed at:** during the nine-analysis phase, at the site owner's direct
instruction (not as a result of any audit finding).

**Files:** `public/social-logo.png` (new), `public/og-image.png`
(regenerated), `scripts/generate-og-image.mjs`.

**What changed:** the share card now uses a new stacked lockup with no
tagline, rendered on pure white at 1200x630, replacing the previous card
built from the tagline lockup on the site's ivory.

**Why a separate asset:** `public/mloi-lockup-stacked.png` is
`firm.appLogoPath` and prints on the cover of every PDF a family keeps. The
new artwork was added as its own file rather than overwriting that one, so a
future change to the social card cannot silently restyle documents that have
already been printed and handed to a trustee. Both existing lockups were
verified byte-identical after the change.

**On the background colour:** white and ivory were both rendered inside a
mocked message bubble and feed card before choosing — see
`audit/tools/og-compare.mjs` and `audit/evidence/og-options/`. The trade is
recorded honestly in the generator: on a white feed card the artwork loses
its edge, which ivory would have kept; white was chosen for being the more
predictable neutral across surfaces including dark mode.

**Consequence for the audit:** A9 (distribution) and A1 (design) may cite the
older share image or its absence. Any such finding is correct as observed at
capture time. Note that the ORIGINAL production capture in
`audit/evidence/network/` predates even the first og-image, so it reflects a
site with no `og:image` at all.

**Production status at time of writing:** uncommitted.
