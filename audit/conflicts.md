# Conflicts and reconciliations

Synthesis pass over all nine analyses and five verification files. This document
finds every place where two or more analyses recommend incompatible things, or
assert contradictory facts, and settles each one.

**Governing hierarchy used throughout:**
1 Privacy > 2 Accessibility (including cognitive) > 3 Clarity > 4 Design quality > 5 Growth and reach.
Higher beats lower. No conflict below is resolved by "do a bit of both".

**Owner's settled decisions treated as fixed:** Google Analytics stays. The brand
system stays. Client-side-only architecture stays. The canonical promise is
"Everything you type stays on your device" — analytics receiving a page view does
not violate it; typed content reaching a third party would.

Twenty-two conflicts follow. Seven are factual contradictions between analyses
(C-001 to C-005, C-010, C-021); the rest are incompatible recommendations. I
record explicit disagreement with the hierarchy's verdict in four places
(C-007, C-011, C-016, C-018) and a partial disagreement in one (C-008).

---

## CONFLICT C-001 — Is keyboard focus obscured by the sticky masthead?

**Analyses involved:** A3 (inclusive design), A4 (WCAG conformance). Adjudicated by V2.

**Finding IDs:** A3-017, A4-007. Related: A2-007, A4-003, A4-013, A4-016.

**Position A, argued at full strength:**
A3-017 measured the sticky masthead at 81px against a 320x256 viewport — 32% of
everything a 400%-zoom user can see, permanently, on every route — and then made
a scoping claim in the body of the finding: this is *not* a Success Criterion
failure. Reflow (1.4.10) passes cleanly: A3 swept eight routes at 320x256 and
found zero horizontal overflow and zero offenders, and ran the full text-spacing
override with no new overflow on any of five routes. On that basis A3 wrote that
SC 2.4.11 Focus Not Obscured "is met because focused fields carry a generous
`scroll-margin-top` (globals.css:277-280, a nice touch)", and filed the whole
thing as inclusive-design practice rather than a violation. The discipline here
is real: A3 refused to inflate a usability cost into a conformance failure, which
is exactly the behaviour you want from an auditor.

**Position B, argued at full strength:**
A4-007 loaded /letter/medical at 1280x900, scrolled to the bottom, and walked
backwards with Shift+Tab measuring every stop against the header. Nine
consecutive stops overlapped the masthead; **four were entirely covered** — "+ Add
a provider" (rect 101→145 against a header bottom of 149, 44 of 44px hidden),
"10 Benefits & money" (61→105), "09 Housing" (15→59), "08 School & work" (0→44) —
plus a textarea 91% hidden. A4 also gave the mechanism, which is the part that
matters: a browser only scrolls a focused element into view when it is outside
the **layout** viewport, and a sticky header *overlays* content, so an element the
browser judges visible can be entirely behind it. The `scroll-margin-top` rule
A3 relied on is scoped to `:target, [id]` — it does not reach those buttons and
links at all, and would not help even if it did, because the browser never
initiates the scroll.

**What is actually at stake for the user:**
A keyboard-only or switch user backing up to fix the field above — the single
most common movement in a fifteen-screen form — loses the caret behind a
masthead with no indication it happened. Compounded with A4-003 (the indicator
that would be there is 1.5:1), the user has neither a visible ring nor a visible
element. That is the failure that ends a session at 11pm and the person does not
come back.

**Resolution:**
**A4-007 is correct. A3-017's standards claim is struck.** V2 reproduced A4's
sweep independently and found the same four 100%-covered stops, and named the
mechanism error in A3's reasoning. SC 2.4.11 Focus Not Obscured (Minimum), Level
AA, is **failed**. A3-017 survives only as what it always was underneath — a
measured reflow/magnification usability finding (32% of a 320x256 viewport) with
its embedded conformance assertion deleted. Ship A4-007's remedy:
`scroll-padding-top: calc(clamp(64px, 19vw, 124px) + 30px)` on `html`, plus the
`focusin` nudge handler for the already-judged-visible case, plus a permanent e2e
assertion that `fullyHidden` is empty. That also subsumes and allows deletion of
the `[id]`-scoped `scroll-margin-top` hack A3 mistook for the fix.

**Governing rule applied:** Accessibility (2). Within accessibility, measured
reproduction beats inference from the presence of a CSS property.

**What was given up, and its cost:**
A3-017's conformance framing, and with it A3's clean "reflow is genuinely well
done" story. The cost is to A3's credibility on standards questions, not to any
user. The measurement A3 contributed is retained and is in fact the same number
A4 records (`headerPctOfViewport` 32% at 320x256) — the two analyses measured the
same header and disagreed only about what it means.

**Is there a third option that satisfies both?**
No. This is a binary factual question about whether four keyboard stops are
hidden. They are, and it was reproduced twice. There is no reading in which both
positions stand.

**What it means that they disagreed:**
This is the most instructive disagreement in the audit and it should not be
smoothed over. Two independent analyses, both competent, both working from the
same production build, reached opposite conclusions on a Level AA criterion —
and **neither flagged the possibility that the other might exist.** A3 inferred
from code (a `scroll-margin-top` rule exists, therefore the criterion is met);
A4 tested behaviour (walk the tab order, measure every rect). The code-reading
was wrong for a reason no amount of care in reading code would catch: the rule's
selector does not match the elements, and the browser's scroll-into-view
heuristic makes the rule irrelevant regardless. Three consequences follow.
First, **A3-017 is the one finding in this audit that would have caused active
harm if actioned** — a VPAT assembled from both files would claim 2.4.11
"Supports" while the site fails it, which is a false conformance statement to a
procurement officer. Second, it is the strongest possible argument for A4-016's
point that the automated gate is not the safety net anyone thinks it is: axe has
no rule for 2.4.11, the repo's tag list omits `wcag22aa` entirely, and both
scans return zero violations. Third, it validates the adversarial verification
layer as more than ceremony: this conflict was invisible inside either analysis
and only surfaced when someone read across them with a browser open. Any future
audit of this site should treat "a CSS property exists that would address X" as
an untested hypothesis, never as evidence.

**Do I disagree with the hierarchy here?** No. The hierarchy is not even engaged
— this is a factual dispute inside a single tier, and it resolves on evidence.

---

## CONFLICT C-002 — What should the focus ring actually become?

**Analyses involved:** A1 (design), A3 (inclusive), A4 (conformance). Numbers checked by V1.

**Finding IDs:** A1-002 (P0), A3-001 (P0), A4-003 (P1), A4-012 (P0).

**Position A, argued at full strength:**
A1-002 wants the brand preserved inside the fix: `outline: 3px solid
var(--navy-700); outline-offset: 2px; box-shadow: 0 0 0 5px var(--focus-ring);`
— navy does the work on light grounds, the existing champagne halo does the work
on navy panels, and gold survives as the brand signal rather than being
discarded. A1's structural point is the strongest thing any of the three says:
`--ring: var(--navy-700)` and `--ring-w: 2px` are **already defined** at
globals.css:99-100 and referenced nowhere in `src/`. The design system already
contains its own answer and nobody wired it up. One edit, one file, brand intact.

**Position B, argued at full strength:**
A3-001 wants `outline: 3px solid var(--navy-700); outline-offset: 2px;
box-shadow: 0 0 0 5px rgba(255,255,255,.9)` — a **white** inner halo, not gold —
so the ring is legible on navy panels without depending on a gold that is itself
marginal. A3 also adds the part the other two miss: stop swapping the input
border to gold-400 on focus; darken it instead. A4-003 wants neither halo:
scope the outline colour by ground (`:focus-visible` navy by default,
`.tw-panel-navy :focus-visible` gold), and it supplies the only per-ground
measurements anyone took — navy-700 at **12.3:1 on white and 10.6:1 on
`--paper-2`**, gold-400 at 8.8:1 on the navy panels.

**What is actually at stake for the user:**
Nothing in the choice between them — all three fix the P0. What is at stake is
that these are three mutually exclusive CSS rules for one selector, and if they
are actioned by three different people in three sittings, the last one wins and
the other two findings get closed as "done" against a rule that is not what they
asked for. A gold outer halo and a white outer halo cannot coexist.

**Resolution:**
**Adopt A4-003's mechanism with A3-001's input-border correction.** Ground-scoped
outline colour, no halo at all. Reasons, in order: (a) a halo is a second visual
system to maintain and both proposed halos are *decorative* solutions to a
problem that a scoped colour solves outright; (b) A4-003 is the only one of the
three that measured navy-700 against the actual grounds; (c) A3-001's border
correction is a real defect none of the others caught. Take A1's structural
insight — wire `--ring` and `--ring-w`, which already exist — as the
implementation vehicle, so the tokens stop being dead code. Then A4-012's
forced-colors fix must land in the same edit or the P0 persists in High Contrast
Mode regardless.

**One number must not be carried forward.** A1-002's recommendation states
"Navy-700 measures 7.77:1 against paper". It does not. V1 reproduced A1's
arithmetic to two decimal places and 7.77 is the contrast of the *current
champagne ring* against a navy-700 **ground** — a row in A1's own table, read
off the wrong axis. Navy-700 as a ring on ivory is ~10.4–12.3:1 (A3, A4). A1's
figure understates the fix by a third and would invite someone to reject it as
marginal. Separately, A1-002's headline citation of "SC 2.4.11 Focus Appearance
(AA)" is wrong twice over — 2.4.11 is Focus Not Obscured (AA); Focus Appearance
is **2.4.13, Level AAA**. The applicable AA hooks are 2.4.7 Focus Visible and,
on the common reading, 1.4.11 Non-text Contrast.

**Governing rule applied:** Accessibility (2) over design quality (4) — but note
that no design cost is actually incurred, because navy and gold are both already
in the brand system and A1 itself proposed navy.

**What was given up, and its cost:**
The gold halo, and with it A1's argument that the ring should keep carrying brand
signal. Cost: near zero. A focus ring is a functional indicator that appears
only during keyboard use; it is not a brand surface, and the brand loses nothing
a user will ever notice. Also given up: A1's 7.77 figure and its SC citation.

**Is there a third option that satisfies both?**
Yes, and it is worth naming so nobody re-litigates: gold *is* retained, on navy
grounds, where A4 measured it at 8.8:1 and where it reads better than navy would.
Both analyses get the ground they care about; neither gets a halo.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-003 — Does the gold gradient button fail contrast?

**Analyses involved:** A1 (design), A4 (conformance). Verified separately by V1 and V2, who disagreed.

**Finding IDs:** A1-008 (**REFUTED**), A4-004 (**CONFIRMED**, P3). Related: A4-016, A4-017.

**Position A, argued at full strength:**
A4-004: the gradient's darkest stop `#a87e45` against navy-900 measures exactly
**4.33:1**. Both gradient-faced controls carry 15px labels at weight 600 and
700 — neither qualifies as WCAG large text, so 4.5:1 applies, so it fails SC
1.4.3. axe returns 23 `color-contrast` **incompletes** on the home page precisely
because it cannot evaluate gradients, which is why nobody has caught it. V2
recomputed the ramp (9.82 / 6.56 / 4.33), confirmed the live font sizes and
weights, confirmed every code citation, and confirmed the proposed fix
`#b28a4d` measures 5.01. CONFIRMED.

**Position B, argued at full strength:**
V1, attacking A1-008 (the same measurement filed by a different analysis), did
something neither A1 nor A4 nor V2 did: it computed the **gradient axis**
`L = |w·sinθ| + |h·cosθ|` for the 150deg gradient, extracted the exact rendered
**glyph rect** via `Range.selectNodeContents`, projected all four corners of the
text rect onto the axis, and interpolated the paint colour at each. The gradient
does not end at the dark stop — it runs `#a87e45` at 78% → `#c9a063` at 100%, so
by the time the axis reaches the bottom-right of the label box (t ≈ 0.80) the
paint has lightened back to ≈ rgb(172,130,72). Result: "Create your letter"
worst text-rect corner **4.56:1**; "Share to help another family" **4.50:1**.
Both pass. The sub-4.5 region inside the label box is ~0.5% of its area, a
triangle in a corner containing no glyph ink. V1 also ran a pixel pass, got
~3.2:1, inspected it, found those were navy/gold antialiasing pixels at glyph
edges, and **discounted its own strongest number** rather than use it.

**What is actually at stake for the user:**
Very little, and both verifiers say so. Nobody's ability to read a button label
is materially in question. What is at stake is whether a P3 finding gets a
colour change actioned on the site's loudest brand surface, and whether a VPAT
records a 1.4.3 failure.

**Resolution:**
**V1's method is stronger and its conclusion governs: the labels pass 1.4.3.**
The operative WCAG question is the contrast of the text against the background
*behind the text*, not the worst contrast available anywhere on the control's
face. A4-004's measurement is exact and its reasoning about text size is right;
its error is scoping the background to the whole button rather than the glyph
rect. So: **A4-004 stands as a measurement and falls as a conformance failure.**
Downgrade it to match A1-008's refuted status; do not record a 1.4.3 failure in
the VPAT on this control.

**But action A4-004's remedy anyway, as design hygiene, not conformance.**
`#b28a4d` at 5.01:1 buys margin at a cost V2 measured and A1 did not. And note
the asymmetry that makes this worth getting right: **A1-008's recommendation was
actively harmful.** A1 said to darken the 78% stop toward `#9a7340`. The label is
navy *on* gold; darkening the gold moves it toward the ink. V1 measured `#9a7340`
at **3.70:1** — worse than the 4.33 A1 set out to fix, and below AA. A4's
direction (lighten) is correct; A1's (darken) would have introduced the failure
it was trying to remove.

**Governing rule applied:** Accessibility (2), applied honestly rather than
maximally. Overstating a pass as a failure costs the audit its credibility on
the twelve P0s that are real.

**What was given up, and its cost:**
A4-004's P3 conformance claim. Cost: none to users. There is one durable loss
worth recording — A1's structural observation, which V1 endorsed and I endorse:
**nothing in the token file records that a gradient has no single contrast
guarantee.** Add that as a comment beside the gradient definition. It is the only
part of either finding that prevents a recurrence.

**Is there a third option that satisfies both?**
Yes, and it is the recommended action: lighten to `#b28a4d`, which satisfies A4's
concern and costs the brand almost nothing, while recording in the VPAT that
1.4.3 is met. Both analyses get their remedy; only A4's *claim* is withdrawn.

**Note on why the verifiers disagreed.** V1 and V2 were lane-partitioned
(design/usability vs accessibility) and neither cross-referenced the other. V2
did not perform the glyph-rect projection; V1 did. This is the same structural
failure as C-001 in the verification layer rather than the analysis layer, and
it is the reason this synthesis document exists.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-004 — Does the Cloudflare beacon run?

**Analyses involved:** A7 (privacy), A8 (policy), A9 (distribution). Verified by V4 and V5.

**Finding IDs:** A7-004 (**CONFIRMED**, P2), A9-023 (**REFUTED**), A8-001 (CONFIRMED, P2). Related: A7-005, A7-006, A8-002, A8-003.

**Position A, argued at full strength:**
A9-023: "A Cloudflare analytics beacon **runs** in production, is not in the CSP,
and is not disclosed on the privacy page." The evidence line was that
`static.cloudflareinsights.com` appears in the capture's unique hosts. The
recommendation carried an upside: if the beacon stays, Cloudflare Web Analytics
is cookieless and would give referral-source data for A9-016.

**Position B, argued at full strength:**
A7-004: Cloudflare **injects** a beacon script tag into every page; it is in no
codebase and on no disclosure; and it is **blocked only by accident** of the CSP.
A7 reproduced this on `/`, `/privacy` and `/letter/about` with a
`securitypolicyviolation` listener: `blockedURI` the beacon,
`violatedDirective: script-src-elem`, `disposition: enforce`,
`cfBeaconScriptInDom: true`, `hasCfBeaconGlobal: false`, 11 requests to the host
and **0 responses**.

**What is actually at stake for the user:**
Whether a third party is receiving a record of this family's visit today. It is
not — the script dies at the CSP. What *is* at stake is whether the owner knows
that one configuration change at the edge, or one CSP widening for an unrelated
reason, silently turns a blocked tag into a live tracker on a site whose entire
proposition is verifiability.

**Resolution:**
**A7-004's framing is correct and A9-023's is false as written.** V5 attacked
A9-023 hardest of anything in its lane, waited 9s plus a visibilitychange (RUM
beacons flush on unload), and recorded `requestfailed … :: csp`. Nothing reaches
Cloudflare Web Analytics. The difference between the two findings is entirely in
the verb: A9 said *runs*, A7 said *injected and blocked*. Same bytes, same
capture, opposite claims. As a **tracking** finding A9-023 scores 0/0/0. As a
**disclosure** finding it survives, and A7-004 already states it better.

Two things A9-023 got wrong beyond the verb, both worth recording: its
recommendation's benefit case ("would give referral-source data") is
unavailable today and would require widening the CSP — the exact change A9
declined to adjudicate; and **A9 identified the wrong script.** The Cloudflare
script that actually executes is
`/cdn-cgi/scripts/…/cloudflare-static/email-decode.min.js`, which returns 200 and
runs because it is served same-origin and therefore permitted by
`script-src 'self'`. It is present on `/privacy` itself — where the only
occurrence of the string "cloudflare" on the entire page is that script tag,
which is not a disclosure. That is A7-005, and it is the real, smaller version
of what A9 was reaching for.

**Governing rule applied:** Privacy (1) — but applied to what is actually
happening, not to the worst available reading. Overclaiming a live tracker that
does not exist would have been a privacy finding that damages privacy, by
spending the owner's trust on a false alarm.

**What was given up, and its cost:**
A9-023 as a standalone finding. Cost: none — A7-004, A7-005, A7-006, A8-001 and
A8-002 cover the same ground with correct verbs. The residual real problems
remain open and should be actioned: Cloudflare is an undisclosed processor
(A8-001); `SECURITY.md:81-82` says verbatim "**No other analytics** — no Vercel
Analytics, no heatmaps, no session recording, no advertising pixels", which is
false about what is *injected* (A8-002); `/privacy` section 04 names only Google;
and the policy's strongest sentence is true only by accident of CSP (A8-003).

**Is there a third option that satisfies both?**
Yes: disable Cloudflare Web Analytics and Email Obfuscation at the dashboard so
the tags stop being injected at all, and name Cloudflare as a processor on
`/privacy`. That makes A7-004's "blocked only by accident" moot rather than
merely true, satisfies A9's disclosure instinct, and closes A8-003's dependency
of a privacy promise on a CSP directive. This is the single highest-value action
in the whole Cloudflare cluster and no analysis proposed it in exactly this form.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-005 — Is "None recorded — confirm with family" the best line in the product or a safety defect?

**Analyses involved:** A2 (usability), A3 (inclusive), A5 (language). Adjudicated by V2.

**Finding IDs:** A3-005 recommendation (3), against A2's "what works" register and A5's §"best copy in the product". Related: A6-017, A2-002.

**Position A, argued at full strength:**
A3-005(3): on the emergency sheet, when a box is empty, print "Not recorded — ask
the family" rather than a confident negative like "None recorded". A3's reasoning
is exactly right in principle and it is a genuinely important distinction: to a
triage nurse, "Allergies: none recorded" reads as *checked, and there are none* —
a positive clinical finding. "Not recorded" reads as *unknown, go ask*. The
difference between those two readings is a patient safety event. A3 reached this
from a text extraction of the real minimal PDF, so it is not speculation.

**Position B, argued at full strength:**
A2 lists "the emergency sheet handles absence correctly" in its register of what
works, quoting "None recorded — confirm with family" and calling it exactly the
right sentence. A5 goes further and calls it **the single best line of copy in
the product**, on precisely A3's reasoning: it tells a clinician the absence is
*unknown*, not *negative*. Both quote the full string from the generated PDF.

**What is actually at stake for the user:**
A first responder's reading of an empty allergy box, which is as high as the
stakes get anywhere in this product.

**Resolution:**
**A2 and A5 are right; A3-005(3) is withdrawn.** V2 checked the source:
`emergency-document.tsx:239` **already prints** "None recorded — confirm with
family." The hedge is present. A3's own evidence block quotes the full string —
"A L L E R G I E S None recorded — confirm with family." — and then A3's
`why_it_matters` paraphrases it as "Allergies: none recorded", dropping the hedge,
and argues against the paraphrase. This is a self-inflicted contradiction inside
one finding, not a disagreement about the product.

**A3-005 recommendations (1) and (2) are unaffected and are the reason this is
still a P0.** (1) Wire the `emergencyHasContent()` guard that already exists at
`derive.ts:347` and is called nowhere, so the Review page stops offering a
download of a sheet whose entire body is a name, "ATTACH RECENT PHOTO" and one
allergy line — V2 confirmed the minimal PDF is 589 characters. (2) Mark the ~10
unlabelled fields that feed the sheet. The precedent exists: `keyPointsHaveContent`
*is* used at `loi-document.tsx:235`. The asymmetry is the defect.

**Governing rule applied:** Accessibility (2) and clarity (3) — and evidence over
paraphrase. Where an analysis quotes a string correctly in evidence and
misquotes it in argument, the evidence governs.

**What was given up, and its cost:**
One of three A3 recommendations. Cost: none. Actioning it would have replaced a
sentence two other analyses independently identified as the best copy on the site
with a near-synonym, at the cost of regenerating every shipped sample.

**Is there a third option that satisfies both?**
Not needed — there is no live disagreement once the string is read correctly.
The one refinement worth taking from A3: apply the same hedged pattern to *every*
empty box on the sheet, not only allergies, and confirm it survives A6-017's
truncation logic.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-006 — Strip the analytics event surface, or instrument it?

**Analyses involved:** A7 (privacy), A9 (distribution). Related: A8.

**Finding IDs:** A7-002 (P2) and A7-012 (P2) against A9-020 (P3), A9-016 (P3), A9-019 (P3), A9-012 (P2), A9-003 (P3). Also A8-011.

**Position A, argued at full strength:**
A7-002 reproduced, four times out of four in fresh production contexts, a
`form_start` hit that fires the moment a parent types into any wizard section —
carrying `first_field_name=diagnoses`, `first_field_name=allergies`,
`form_destination=…/letter/medical`, `form_length`, `_et` engagement time and the
persistent `cid`. No field *values*: A7's canary never appeared, and A7 states
plainly that the canonical promise is not violated. What Google now receives is
"this browser began entering data in the Medical section of a special-needs
Letter of Intent, starting with the allergies field, and stayed engaged for 3.7
seconds." That is a behavioural profile of a caregiving household and
`first_field_name=diagnoses` is a health-adjacent inference about a real disabled
person. Worse: `/privacy` at page.tsx:152-156 *dares* the reader to open devtools
and type, promising "after that, silence, no matter how much you write." A
parent who takes that invitation watches a request fire as they type and has no
way to know it carried only a field name. **Inviting a check you fail is more
damaging than never inviting one.** A7's remedy leaves GA in place and reduces
the surface to page_view only.

**Position B, argued at full strength:**
A9-020: GA4 currently measures page views and nothing else — there is not one
`gtag('event', …)` call in the repository. Every number that would tell the owner
whether the tool works is invisible: did anyone start, did anyone finish, where
exactly do people stop, did anyone take the backup file, did anyone come back a
year later. A9's proposed events are deliberately boring and it wrote its own
hard rules: `letter_started`, `section_completed` (slug only), `review_reached`,
`document_downloaded`, `backup_restored`, `share_opened`, `sample_viewed` — "no
event parameter may ever contain a field value, a name, a diagnosis, a free-text
string, a character count, or a word count — a word count of a 'final wishes'
section is inference-bearing and must not be sent" — plus a test that fails if
any gtag call passes a literal outside an allowlist. The argument that lands: most
families never finish a Letter of Intent, so "did they finish" is the only number
that matters, and it is perfectly measurable client-side without touching a word
anyone wrote.

**What is actually at stake for the user:**
On A7's side: whether Google can infer, per browser, that a household is caring
for a disabled person and which domains of that person's life they are currently
documenting. On A9's side: whether the owner can ever learn that (say) 60% of
families stop at Medical, which is the single fact most likely to result in a
change that helps the next frightened parent finish.

**Resolution:**
**Privacy wins on the specific event A7 measured; A9's programme proceeds in a
narrowed form.** Concretely:

1. **Turn off GA4 Enhanced Measurement "Form interactions" immediately** (also
   File downloads and Site search). Two minutes in the GA4 admin, no code change,
   and it stops `first_field_name=diagnoses` at source. This is not negotiable
   and it is not in tension with the owner's ruling — GA stays.
2. **Fix `/privacy`:152-156.** The current text is falsifiable in ten seconds.
   Adopt A7's replacement, which is *stronger* than the false version because it
   is checkable: you will see requests that count the visit; what you will never
   see is a single word you wrote.
3. **A9's custom events proceed, minus section identity.** `letter_started`,
   `review_reached`, `document_downloaded`, `backup_restored`, `share_opened`,
   `sample_viewed` are all clear — none of them names a domain of the child's
   life. **`section_completed` with a section slug does not proceed as specified.**
   A7-002's whole objection is that "began entering data in the Medical section"
   is the inference, and A9's slug parameter re-creates exactly that, more
   reliably, from first-party code. The site's own path already discloses the
   audience; the *section* discloses what is being documented about the person.
4. **Replace it with a non-identifying completion signal:** `progress_reached`
   with an ordinal bucket (`3`, `6`, `9`, `12`, `15`) rather than a slug. That
   yields the drop-off curve A9 actually needs — where in the sequence people
   stop — without naming Medical, Behavior support or Final wishes. The owner
   learns "half stop by section six"; Google learns an integer.
5. **A7-012 is the enforcement mechanism and must land in the same change.** The
   egress test currently exempts every analytics host and asserts nothing about
   which events fire — "this is why A7-002 went unnoticed." Convert it to an
   allowlist assertion over event names and parameter literals. Without this,
   every future GA default silently re-widens the surface and nobody knows.

On the three smaller A9 items: **A9-016 is approved as written** — a static
`?s=text` channel tag describes which button was pressed, contains nothing about
the person, and A9 already rules out per-share unique identifiers as "out of the
question". **A9-019 option (a) is approved, option (b) is refused** — a
`?from=loi` parameter is visible to the user in their own address bar; a
`referrerPolicy="origin"` header is invisible and discloses "this visitor came
from a Letter of Intent site" to the firm's analytics. A9 itself prefers (a);
that preference is now a rule. **A9-012's item 3** ("families in all 50 states
have opened it") is approved only if stated from region data the property already
holds; do not enable Google Signals to obtain it — A8-010 already flags
confirming Signals is OFF.

**Governing rule applied:** Privacy (1) over growth and reach (5). Not close.

**What was given up, and its cost:**
Per-section drop-off. This is a real loss and I do not want to minimise it: "60%
of people stop at Medical" is more actionable than "60% stop by section six",
because it would tell the owner which content to fix. The ordinal bucket
recovers most of the value — the sequence is fixed, so bucket six *is* a small
set of sections — while breaking the direct join between a browser and a named
domain of a child's life. The owner also gives up whatever Enhanced Measurement
would have provided by default in future, permanently, which is the point.

**Is there a third option that satisfies both?**
Yes, and it is worth flagging as the better long-term answer: **compute the
drop-off client-side and never send it.** The store already knows which sections
have content. A "help us improve" control on the Review page could show the
family their own summary and offer a one-tap, explicitly opt-in send of a
section-completion vector. That is honest, revocable, default-off, and gives the
owner *better* data than any passive event. It is out of scope for MVP and needs
a privacy-impact block of its own, but it is the design that dissolves this
conflict rather than trading it.

**Do I disagree with the hierarchy here?** No. This is the hierarchy working
exactly as intended: a P3 measurement finding does not get to widen a P2 privacy
surface.

---

## CONFLICT C-007 — A consent gate for EU/UK visitors

**Analyses involved:** A8 (policy) against A2/A3 (cognitive load) and the owner's GA ruling.

**Finding IDs:** A8-010 (P2), A7-008 (P3), A8-011 (P3). Against A2-004, A2-017, A3-004, A3-015 (the cumulative-friction case).

**Position A, argued at full strength:**
A8-010: two GA cookies are set on page load with no consent step of any kind and
no `gcs=` parameter, so Consent Mode is not implemented. GDPR Art. 3(2)(a) is a
weak fit — the site is US-focused by every available signal — but **ePrivacy Art.
5(3) does not depend on targeting; it attaches to terminal equipment in the EU.**
A UK or EEA visitor who lands here from a search has non-essential cookies
written before any choice. Both cookies also carry `Secure=false` (A7-008), which
is one config line. And the exposure is unmeasurable today because nobody has
looked at the EU share in the GA4 property.

**Position B, argued at full strength:**
Every cognitive-load finding in the audit is an argument against an interstitial.
The archetype is a frightened parent at 11pm on a phone. A2-017 already shows
nothing paints for 7.8 seconds on Slow 3G; A2-004 shows the first real interaction
is already a second question before a single field. A consent banner adds a
modal decision, in legal register, before the person has learned what the site
is — on a site whose *entire* first impression is a promise that nothing they
type leaves the device. A banner asking permission to set cookies actively
contradicts that impression for a reader who does not distinguish "analytics
cookie" from "your letter". A8 knows this and says so: "for this audience, at
this moment in their lives, a consent interstitial is a real cost and the
US-facing legal case for it is weak."

**What is actually at stake for the user:**
For an EU/UK visitor: two analytics cookies set without asking. For everyone
else: a modal at the worst possible moment, or not.

**Resolution:**
**No global banner. Implement A8-010's graduated remedy exactly as it is written,
and treat the parts in this order:**
1. **Google Consent Mode v2 with `analytics_storage: 'denied'` as the default**,
   granted where consent is not required. Zero user-visible cost, closes the
   question for every visitor, and GA keeps counting in cookieless mode.
2. **Honour `navigator.globalPrivacyControl`** by not initialising gtag at all
   when it is set. A handful of lines; also closes the US universal-opt-out
   question.
3. **Set `Secure` on the GA cookies** via the `cookie_flags` config parameter
   (A7-008). One line.
4. **A minimal, dismissible choice shown only to EEA/UK visitors**, region-detected
   client-side via `Intl.DateTimeFormat().resolvedOptions().timeZone`. Imperfect,
   infrastructure-free, and compatible with the client-side-only ruling. The
   accurate alternative — reading `CF-IPCountry` in a Worker — is architectural
   and should not be taken for this.
5. **Confirm in the GA4 property that Google Signals is OFF** and set data
   retention to the shortest useful period.

**Governing rule applied:** Privacy (1) — but see below, because the literal
application of the hierarchy points the other way and I am declining it.

**What was given up, and its cost:**
Strict ePrivacy compliance for the window between shipping items 1–3 and item 4,
and a residual imperfection thereafter because timezone detection will miss some
EU visitors (a VPN, a traveller). Cost: a small number of EU visitors have
cookieless analytics set without a prompt. Consent Mode with default-denied means
those hits carry no identifier, which is most of the harm gone. V2's severity
correction is relevant: with the SECURITY.md context restored this is "a
documented open question rather than an oversight", harm 3 → 2.

**Is there a third option that satisfies both?**
Yes, and it is item 1 — Consent Mode default-denied is the third option. It is
the rare case where the privacy-maximal choice and the zero-friction choice are
the same choice, because the friction was never load-bearing: the banner was
only ever a way to *obtain* what default-denied simply assumes.

**Do I disagree with the hierarchy here? YES, partially, and it matters.**
A literal reading of "Privacy > Accessibility" mandates a consent gate for
everyone — privacy is tier 1, cognitive load is tier 2, higher beats lower, no
splitting the difference. I decline that reading and I want to be explicit about
why rather than smuggle it in. The hierarchy exists to protect **what happens to
a family's information**, not to maximise privacy *ritual*. A consent banner
shown to a US parent at 11pm transfers no data either way; it is a compliance
artefact, not a protection. Its cost is borne entirely in tier 2 — an extra
modal decision for someone with depleted executive function — and its benefit in
tier 1 is zero for the overwhelming majority of visitors, because default-denied
Consent Mode already delivers the protection. Where a tier-1 *label* attaches to
an action with no tier-1 *effect*, the hierarchy should not be allowed to
outrank a real tier-2 cost. If the owner disagrees and wants the global banner,
that is a defensible reading of the rule as written — but they should know they
are buying a legal posture with a measurable accessibility cost, not buying
privacy.

---

## CONFLICT C-008 — Six analyses want different things on one page of the emergency sheet

**Analyses involved:** A2, A3, A6, A9.

**Finding IDs:** A6-001 (P0), A6-002 (P1), A6-008 (P1), A6-010 (P1), A6-017 (P2), A6-011 (P2), A9-018 (P3), A3-005 (P0), A2-002 (P1).

**Position A, argued at full strength:** *(the page must shrink)*
A6-001 is the P0 that governs everything else. The sheet carries `wrap={false}`,
so it is **never US Letter size** — the page grows or shrinks with the content.
A printer scales it, so A6-010's 7pt sub-labels land at ~5pt on paper. The fix is
to remove `wrap={false}`, keep `size="LETTER"` authoritative, tighten the
existing `clamp()` budgets so realistic content lands on one page, and add a
build-time assertion that the output is exactly 612x792pt for the typical and
maximal fixtures. That assertion is a hard content budget: from the moment it
lands, anything added must displace something. A6-010 states the constraint in
words — **"Do NOT add more content to this sheet. Its value is that it is short."**

**Position B, argued at full strength:** *(five things must be added)*
- **A6-008:** the sheet omits the treating doctors, though the letter already
  collects their names, specialties and phone numbers. A paramedic or ER nurse
  wants the neurologist's number. Data already captured, costs the family nothing.
- **A9-018:** the sheet is the highest-circulation, highest-professional-density
  artifact the tool produces — fridge, school office, sitter, ER — and it carries
  no URL. A school nurse who wants one for another student has no way to find it.
  Zero payload risk, one static string, "the cheapest reach improvement in the
  entire audit". V5 judged A9's own severity **understated**.
- **A6-002:** the page footer — legal disclaimer *and* "Page N of M" — is
  currently rendered hundreds of thousands of points off-page and appears on no
  page of any document. Fixing it puts a footer back.
- **A2-002:** the PDF never says what was left blank, so the family hands over a
  document whose gaps are invisible to the reader.
- **A3-005:** empty boxes need the hedged "not recorded" treatment throughout
  (see C-005), and the sheet needs a completeness story.

**What is actually at stake for the user:**
Fifteen seconds of a stranger's attention over a child who cannot speak for
themselves. Everything on this page competes for it. Also, concretely: whether
the page prints at 100% or 71%.

**Resolution:** *(a strict priority order for the one page, and an explicit budget)*

1. **A6-001 first, alone.** Fix the page size and land the 612x792 assertion
   before anything else is added. A6-008 itself says so: "Note this competes for
   space with A6-001. Fix the page size first, then spend the recovered space on
   the doctors."
2. **A6-010's reordering next, because it *frees* space.** Moving the brand
   lockup off the top — it is currently the largest single element on an
   emergency document, ~158pt wide occupying the top sixth — reclaims the room
   everything else needs, and simultaneously removes the largest image (A6-005,
   where 85–98% of every PDF's bytes is one logo at 1,150–1,700 DPI). Promote
   ALLERGIES and CURRENT MEDICATIONS to a full-width band under the identity row;
   demote DIAGNOSES; raise the 7pt/6.8pt floors to 8pt. Give allergies and
   medications a **heavy rule, not colour**, because A6-011 measured that the
   tinted warning backgrounds carry no signal in the black-and-white printing
   this document will mostly receive.
3. **A6-008's doctors, into the reclaimed space**, capped at 2–3 with the same
   `clamp()` discipline. This is the only *content* addition that survives, and
   it survives because a phone number for the treating specialist changes what a
   clinician does in the first minute — the same test A6-010 uses to demote
   diagnoses.
4. **A9-018's URL, in the existing footnote.** It costs one static string in a
   line that already exists and already runs to three sentences. It is not
   competing for the fifteen seconds — nobody reads a footnote in a crisis — and
   it is the only distribution mechanism in the product that reaches
   professionals. Approved.
5. **A6-002's footer: restore "Page N of M" on both documents; do NOT put the
   legal disclaimer on the emergency sheet.** The sheet already ends "Not a
   medical or legal document." A second disclaimer block on a one-page crisis
   document spends the budget A6-010 just reclaimed on text written for a
   plaintiff's lawyer, not for a paramedic. Put the full disclaimer footer on the
   letter, where it belongs and where its absence from every page is the actual
   defect.
6. **A2-002's completeness statement goes on the letter, not the sheet.** The
   letter has the room and the "How to use this letter" page (A6-006, A6-013) is
   the natural home. On the sheet, A3-005's per-box hedging already does the job.
7. **A6-017's truncation must be re-tested after all of the above**, because
   every item here changes the space the clamps are tuned against, and silent
   truncation of a medication list is the worst failure mode on the page.

**Governing rule applied:** Accessibility (2) and clarity (3) over growth (5) —
with the ordering rule that a change which *frees* budget precedes every change
that spends it. Growth (A9-018) is admitted only because it demonstrably spends
nothing from the contested resource.

**What was given up, and its cost:**
The legal disclaimer on the emergency sheet, and A2-002's completeness block on
the sheet. Cost of the first: a marginal increase in whatever liability an
already-present "Not a medical or legal document" line does not cover — a real
cost, but one the owner-attorney is best placed to price, and it should be
flagged to them rather than decided here. Cost of the second: none, it moves.
Also given up: the brand lockup's position of primacy on the most-shown artifact
the product owns, which is a genuine marketing loss (see C-014 and C-019).

**Is there a third option that satisfies both?**
Partially, and it is the strongest single move available: **A6-012's HTML version
of the emergency sheet removes the page budget entirely.** An HTML sheet reflows,
so doctors, completeness notes and disclaimers can all be present without
competing for a fixed 612x792 rectangle, and it is better than a PDF at 3am on a
phone on almost every axis. That does not rescue the printed sheet — which is the
one that goes on the fridge — but it means the *contested* content only has to
lose the print battle, not disappear. Make HTML the recommended format for the
emergency sheet, as A6-012 argues.

**Do I disagree with the hierarchy here? Partially.** The hierarchy puts clarity
at tier 3, below accessibility. For this artifact that ranking is meaningless:
the reader is a stranger with fifteen seconds and no context, and for them
clarity *is* access. I have treated A6-010's information hierarchy as a tier-2
concern rather than a tier-3 one, which is why it outranks A6-008's content
addition. If it were scored at tier 3 as written, the doctors would have gone in
first and the reordering would have had less room. That would be the wrong
outcome and I am flagging the reasoning rather than hiding it.

---

## CONFLICT C-009 — Whose name goes in the PDF's identity metadata?

**Analyses involved:** A5 (language), A6 (PDF), A7 (privacy).

**Finding IDs:** A6-015 (P3), A7-009 (P2), A5-015 (P2), against A6-004 (P0) / A4-006 (P0).

**Position A, argued at full strength:** *(less identity in the metadata)*
`filenames.ts:9-19` states an explicit, well-argued policy: the filename "never
says *who* it is about", because "downloads land in shared folders, get synced to
cloud drives, and are read out by screen readers in open-plan offices; a filename
carrying 'Letter-of-Intent-Alex' discloses a disability to anyone who glances at
the screen." The policy is implemented correctly — a real production download is
`Letter-of-Intent-Disabilities-2026-08-09.pdf`. And then the same fact escapes
one file away: `/Title` is "Letter of Intent — <subject's full legal name>",
`/Author` is the parent's full legal name, and the catalog carries
`/ViewerPreferences` with **`DisplayDocTitle` true**, which instructs every viewer
to show the Title rather than the filename in the window title bar and tab.
A6-015's sharpest case: a screen reader announces the document title on open, so
a blind parent opening their own letter in a shared office announces their child's
full legal name to the room — while the filename that was carefully sanitised is
never spoken. A7-009 adds that `/Title` is indexed by Windows Search and
Spotlight, making the name searchable across a shared machine, and that
`/CreationDate` is recorded to the second.

**Position B, argued at full strength:** *(more identity in the metadata)*
PDF/UA-1 clause 7.1 requires a document title **and** `DisplayDocTitle` true.
A6-004 and A4-006 are both P0. A trustee or attorney with a dozen of these open
needs to tell them apart. And the screen-reader announcement A6-015 treats as the
harm is, in the ordinary case, the *benefit* — it is how a blind reader knows
which document just opened. A4-006's concrete remedy explicitly keeps
`title={\`Letter of Intent — ${fullName}\`}` and `author={author ?? …}` while
adding `language="en"`, which alone converts 247 failed veraPDF checks to passes.

**What is actually at stake for the user:**
Whether a glance at a shared laptop's window title, or a Spotlight search on a
work machine, discloses a child's disability. Against: whether a blind reader and
a trustee can identify the document.

**Resolution:** *(four separate decisions, not one)*

1. **`/Title`: keep it, keep `DisplayDocTitle` true, use the preferred name.**
   `Letter of Intent — Bonnie`, not `Letter of Intent — Bonnie Marie Anderson`.
   `preferredName()` already exists at `derive.ts:8-15` and is already used for
   reader-facing body copy. A6-015 and A7-009 converge on exactly this and it is
   right: it satisfies PDF/UA 7.1, keeps the trustee's disambiguation, keeps the
   screen-reader announcement, and removes the full legal name from the desktop
   search index. On the emergency sheet, `emergency-document.tsx:159` currently
   prefers `info.fullName ?? info.preferred` — **reverse that precedence.**
2. **`/Author`: A6-015 and A7-009 directly contradict each other. A7-009 wins.**
   A6-015 says leave it — "it is the writer's own name, not the disabled person's,
   and the writer chose to sign the document." A7-009 says drop it — "a document
   designed to be handed to hospitals, schools and caregivers does not need the
   parent's legal name in a machine-readable field that survives forwarding."
   A6-015's argument confuses two acts: the parent chose to sign *inside the
   letter*, where the reader is the intended audience. They did not choose to
   embed their legal name in an invisible field that travels with every forwarded
   copy, is indexed by desktop search, and is read by every automated system that
   touches the file. PDF/UA requires a Title; it does not require an Author. Set
   `/Author` to the existing fallback string "Prepared with the Letter of Intent
   Builder". Cost: none — the parent's name is in the signature block where they
   put it deliberately.
3. **`/CreationDate`: round to the day.** A7-009 is right that the second is a
   fingerprint that helps nobody, and A6-014 independently wants the date to be
   useful for versioning, which the day satisfies.
4. **A5-015's filename split is approved.** The current PDF name is
   `Letter-of-Intent-Disabilities-…`, which does not disclose *who* but does
   disclose the *category* — to exactly the glancing observer, shared folder and
   open-plan screen reader that `filenames.ts` was written about. A5's resolution
   is the right one and neither other analysis found it: **drop the qualifier from
   the PDF, which travels; keep it on the `.json` backup, which stays with the
   family and genuinely needs disambiguating when a family runs both paths.**

Then do what all three findings ask and **write the decision into
`filenames.ts`'s comment block**, so the policy governs metadata as well as
filenames and the next person does not rediscover this.

**Governing rule applied:** Privacy (1) over accessibility (2) — but note how
little accessibility actually had to give. PDF/UA's requirement is satisfied by
*a* meaningful title, not by the legal name.

**What was given up, and its cost:**
Full legal names in `/Title`, and `/Author` entirely. Cost: a trustee holding two
letters for two siblings with the same preferred name cannot distinguish them by
title bar. Genuinely possible, genuinely rare, and the date in the filename
resolves it. Second cost: any test asserting on PDF title strings needs updating,
and a trustee who has already filed documents by title sees a format change.

**Is there a third option that satisfies both?**
Yes, and it is what has been adopted: preferred-name titles are strictly better
on both axes than either extreme. Removing `/Title` would have broken PDF/UA and
the screen-reader case; keeping the legal name breaks the project's own stated
policy. There was never a real trade here — only two findings that each saw one
side of it.

**Do I disagree with the hierarchy here?** No. And note the priority discipline
A7-009 volunteered, which I endorse: "this is NOT what stops a parent finishing
the document at 11pm, and nothing here causes data to leave the device. It should
queue behind A7-002 and A7-007."

---

## CONFLICT C-010 — Tag the PDFs, or ship HTML? (a feasibility contradiction)

**Analyses involved:** A4 (conformance), A6 (PDF).

**Finding IDs:** A4-006 (P0), A6-004 (P0), A6-012 (P0). Related: A6-006, A6-009, A4-005.

**Position A, argued at full strength:**
A4-006 treats this as a fixable defect with a cheap first step and an
architectural second: add `language="en"` to both `<Document>` components, which
"alone converts 198 + 49 = 247 failed checks to passes and is what makes a screen
reader read the document in the right voice", add a veraPDF assertion gating
clause 7.2-34 specifically, and treat full tagging as a separate architectural
decision — replacing @react-pdf/renderer with pdf-lib plus a hand-built
`StructTreeRoot`, or post-processing with a WASM tagging library.

**Position B, argued at full strength:**
A6-004 says flatly that "make the PDF PDF/UA compliant" is **not implementable in
the current architecture** — @react-pdf/renderer exposes no API for emitting a
structure tree, MarkInfo or XMP, verified against its own type definitions, and
all ten outputs are untagged. "Recommending it as a to-do would be technically
correct and practically useless." A6-012 then argues the alternative in full and
commits: keep the PDF as the primary headline output, because a Letter of Intent
goes in a binder and fixed pagination is a feature when a trustee and an attorney
refer to the same thing — and because a parent who spent hours on the hardest
document of their life should receive something that looks like a document. But
**add a self-contained `.html` file per document** as an additional download,
generated by the same client-side code path from the same declarative section
model: inline `<style>`, no external references, `lang="en"`, real `<h1>/<h2>`,
real `<dl>`, a `<title>`, photo as a data URI. ~20KB instead of 1.2MB. An
untagged PDF with corrupted label text (A6-006 — "DIAGNOSES" extracts as
"D I A G N O S E S") is, for a screen reader user, substantially *worse* than a
plain HTML file, and the fix inside PDF is unavailable here.

**What is actually at stake for the user:**
Whether a blind trustee, a blind parent, or anyone using text-to-speech can read
the document this family spent hours writing. Today they cannot: no structure
tree, no reading order, no declared language, no bookmarks on a 64-page document
(A6-009), and letterspaced labels that extract as garbage.

**Resolution:**
**There is no real disagreement once the sequencing is fixed — but the two
findings assert incompatible things about feasibility and that must be settled:
A6-004 is right.** A4-006's remedy is written as if tagging were merely deferred;
A6 verified against the library's type surface that it cannot be reached at all
without replacing the renderer. Any plan built on A4-006's framing will schedule
an XL architectural project as a follow-up to a P0 and then not do it.

Do, in this order:
1. **`language="en"` on both `<Document>`s today.** Both analyses agree, it is S
   effort, and it clears 247 veraPDF checks. This is the highest ratio of
   accessibility gained to effort spent anywhere in the audit.
2. **The veraPDF assertion gating clause 7.2-34 specifically** (A4-006's item 3).
   Do not gate on `ua1` overall — it will not pass and the gate will be disabled.
3. **A6-012's HTML export**, presented in the UI as "for screen readers, phones,
   and translation" — never as a downgrade — and made the **recommended** format
   for the emergency sheet, which is the one read on a phone at 3am. This also
   sidesteps A6-006 entirely, because CSS `letter-spacing` in HTML does not
   corrupt the text content (see C-014).
4. **Full PDF/UA is recorded as architectural and explicitly deferred**, with the
   reason written down: the renderer cannot emit a structure tree. Do not leave
   it as an open to-do implying it is a matter of will.

**Governing rule applied:** Accessibility (2). Between two accessibility routes,
the one that is achievable this week and produces a strictly better artifact for
the disabled reader beats the one that is correct in principle and unreachable.

**What was given up, and its cost:**
PDF/UA conformance, indefinitely. Real cost: an institution with a procurement
requirement for PDF/UA cannot accept the letter's PDF, and the VPAT must say so.
Second cost, which A6-012 states honestly: a second rendering path that must be
kept in sync as sections and fields evolve. Mitigate with the test A6 proposes —
assert every section key present in the PDF output is present in the HTML output.

**Is there a third option that satisfies both?**
Not within the current renderer, which is precisely the finding. The only path to
both is replacing the PDF layer, which is XL and buys less for the disabled
reader than the HTML export buys this week.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-011 — The vertical chrome budget on a small viewport

**Analyses involved:** A2 (usability), A3 (inclusive).

**Finding IDs:** A2-007 (P2) and A3-017 (P2) against A3-011 (P2). Related: A5-008, A4-007, A3-010, A2-005.

**Position A, argued at full strength:** *(take chrome away)*
A2-007 measured a 1024x768 window at 200% zoom: the sticky header is 114px and
the privacy strip below it 58px — **172px of 384px, 45% of the viewport, on every
route, permanently**, because the header is `position: sticky`. The first screen
of `/letter/getting-started` at that zoom contains the logo lockup, the privacy
strip, a collapsed "Sections" accordion and the top edge of the navy panel — **not
one question, not one field.** The page is 6.8 screens tall. A3-017 measures the
same header at 32% of a 320x256 viewport at 400% zoom. A2's line is the one that
settles it: "The logo is doing nothing for them: they already know what site they
are on." And A5-008 adds that the sticky header says "Start your letter" to
someone who is already writing one.

**Position B, argued at full strength:** *(put more in the chrome)*
A3-011: below the `lg` breakpoint the entire rail — the audience label, "You've
added notes to N of M sections", the progress bar, the 15-item section list with
its has-notes marks, the Review link and the back-up/delete link — moves inside a
`<details>` that is **closed by default** and labelled only "Sections". Nothing
about progress, position or the route to Review is visible on a phone without
opening it. "Collapsing a 15-item nav on a 320px screen is right. Collapsing the
*progress summary* with it is not: it is one short sentence and a 4px bar, it is
the externalised memory the whole design depends on, and it is being hidden
specifically on the viewport where interruption is most likely." The desktop
user, who least needs the reminder, gets it permanently; the phone user, who most
needs it, has to go looking.

**What is actually at stake for the user:**
On a 512x384 effective viewport, every pixel of chrome is a pixel not showing a
question. On the same viewport, a parent resuming after four days has no idea
where they are. Both users are the same person on different nights.

**Resolution:** *(resolve by what the pixels do, not by which finding is bigger)*

1. **Unpin and shrink the masthead below a height threshold.** `@media
   (max-height: 500px)` drops the lockup to a compact mark; A3-017's
   `h-[min(clamp(64px,19vw,124px),18vh)]` caps it by viewport height as well as
   width. Both analyses proposed versions of this and they are compatible.
   **Re-test the anchor offsets** — `globals.css:279` and `ANCHOR_OFFSET` in
   `page.tsx` are both derived from the same clamp, and A4-007's
   `scroll-padding-top` fix will be derived from it too.
2. **Unpin the privacy strip; keep the sentence in the flow of the page.** It does
   not have to be pinned to be believed. If the owner wants it always visible,
   A2-007's fallback is right: keep the padlock, shorten the text.
3. **A3-011's progress note is lifted out of the `<details>` — and it is lifted
   into the space items 1 and 2 just freed, not added on top.** Net change on a
   512x384 viewport: chrome shrinks substantially and the one line the user
   actually needs is the line that survives. Relabel the summary "Jump to a
   section" — "Sections" is not addressable by a voice-control user looking for
   progress, and it under-describes what is inside.
4. **Surface the Review link outside the disclosure** as A3-011 suggests; it costs
   one line and closes the mobile dead end.

**Governing rule applied:** Accessibility (2) throughout — this is an
intra-tier conflict, resolved by asking which element serves the user's actual
task. A logo and a pinned reassurance banner serve orientation the user does not
need; a progress sentence serves memory the user does.

**What was given up, and its cost:**
The permanently pinned brand lockup and the permanently pinned privacy strip on
short viewports. Cost to the brand: nil at normal sizes, where nothing changes.
Cost to the privacy message: this is the one that deserves scrutiny, and it is
addressed below.

**Is there a third option that satisfies both?**
Yes: a **single compact status bar** on short viewports that carries the padlock,
a shortened promise, and the progress sentence in one row — replacing three
stacked elements with one. That serves A2-007's pixel argument, A3-011's memory
argument and the privacy strip's reassurance simultaneously, at roughly a third
of the current height. It is more work than either finding scoped and it is the
right answer.

**Do I disagree with the hierarchy here? YES, on one point, and it changes the
outcome.** Someone applying the hierarchy mechanically will protect the pinned
privacy strip, because privacy is tier 1 and low-vision reflow is tier 2. That is
a category error and it should be named. **The strip is privacy *messaging*, not
privacy *protection*.** Unpinning it removes no protection whatsoever — not one
byte moves differently, the promise stays on the page, and the architecture that
makes the promise true is untouched. What the strip provides is reassurance and
trust, which live at tier 3 (clarity), and tier 3 loses to a low-vision user
losing 45% of their screen on every route forever. If the hierarchy is read to
protect anything with the word "privacy" on it, it will start protecting
decoration at the expense of access. Tier 1 should mean *where the data goes*.

---

## CONFLICT C-012 — Fixing the seventeen-link rail

**Analyses involved:** A2 (usability), A3 (inclusive), A4 (conformance).

**Finding IDs:** A2-006 (P2), A4-013 (P2), A3-011 (P2), A2-012 (P2), A4-011 (P2).

**Position A, argued at full strength:**
A2-006: on desktop a keyboard or screen-reader user passes **17 navigation links
before the first question — on every one of the 15 sections.** The fix is
structural: put the section content before the rail in DOM order and place the
rail visually with CSS order/grid. The layout is already flex-wrap, so it is a
one-line change plus an `order` utility. This fixes the traversal for everyone,
permanently, with no new affordance to discover.

**Position B, argued at full strength:**
A4-013: focus is dropped to `<body>` on every section change *and* the rail
cannot be skipped — two defects, two targeted fixes. Move focus to the section
`<h1>` with `tabIndex={-1}` on `def.slug` change, which is the standard SPA remedy
and announces the new section to a screen reader as well as landing a keyboard
user inside the content. Add a second skip link, "Skip to the questions", so the
two skip links read as a familiar pair. A4 explicitly flags the ordering
dependency: **"once focus moves to the `<h1>`, the sticky-header fix must already
be in place or the heading itself lands behind the masthead"** — i.e. C-001 must
ship first. A4 offers the DOM reorder only as a fallback.

**And a third pull:** A3-011 needs the rail to be *findable* on mobile, because
it carries the externalised memory (C-011). A2-012 notes a wizard section page
has exactly one heading, even Medical at 3,596px — so the rail is currently doing
navigational work the document structure should be doing.

**What is actually at stake for the user:**
Seventeen tab presses times fifteen sections, for a switch user, every session.
And, in the opposite direction, whether the person who needs the section list can
still find it.

**Resolution:**
**A4-013's approach, in A4's stated order; A2-006's DOM reorder is refused.**

The DOM reorder is the more elegant idea and it should not be done, for a reason
neither analysis raised: **it creates a divergence between visual order and DOM
order that is itself a WCAG hazard.** A left-hand rail that comes after the
content in the DOM means a sighted keyboard user's focus jumps from the top of
the page to the middle-right, then back to the upper-left — the classic
`order`-induced focus-order problem, and a live 2.4.3 Focus Order risk on a
layout that currently has none. It also silently harms A3-011's population: a
screen-reader user on mobile who wants to know where they are now finds the
section list *after* 3,596px of form. Trading a measured 2.4.1-adjacent nuisance
for an unmeasured 2.4.3 risk is a bad trade.

So: (a) ship C-001's `scroll-padding-top` **first**; (b) move focus to the `<h1>`
on section change, with the `useRef(true)` sentinel so it does not steal focus on
a cold load of a bookmarked section; (c) add the "Skip to the questions" link
targeting `#section-form`; (d) give the rail `role="navigation"` with a heading
so it can be jumped to deliberately — which is A2-006's own fallback and serves
A3-011 at the same time; (e) fix A2-012 by giving each field group a real heading,
so the rail stops being the only structure on the page. A4-013 must also be tested
on a real screen reader, not only in Playwright — A4 says so and it is right;
programmatic focus movement is the class of change that feels wrong at the wrong
moment.

**Governing rule applied:** Accessibility (2), resolved within the tier by
preferring the remedy that does not create a new failure mode.

**What was given up, and its cost:**
A2-006's one-line fix, in favour of A4-013's 2–4 hours plus a screen-reader
session. Cost: real effort, and the skip link is a discoverable-only affordance —
a switch user who never finds it still tabs seventeen times. Mitigate by making
the two skip links a visible pair on focus, which A4's CSS already does.

**Is there a third option that satisfies both?**
Yes, and it is worth considering later: make the rail a single tab stop that
expands — one focusable disclosure containing the fifteen links, rather than
fifteen tab stops in sequence. That reduces traversal to two stops without any
DOM/visual divergence and without depending on skip-link discovery. It is a
larger interaction change and needs its own screen-reader validation, so it is a
follow-up, not the MVP fix.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-013 — The running order of the Review page

**Analyses involved:** A3 (inclusive), A9 (distribution). Related: A2, A5.

**Finding IDs:** A3-015 (P2) against A9-010 (P2), A9-011 (P2), A9-013 (P2), A9-014 (P1). Related: A3-007, A5-004, A9-015, A2-002.

**Position A, argued at full strength:**
A3-015: the page is called **Review & download** and it presents download first,
unconditionally, with a large primary button. The reading view — the only place a
family can check what they are about to print and hand to a school or an ER —
begins at roughly 82% of a 6,430px page, behind two promotional sections ("Pass
it along" and the firm CTA). The list of sections still empty, the one thing that
would prompt a second sitting, is the very last thing on the page. "The likeliest
outcome for a tired user is that they download three files and never read them.
That matters here more than on an ordinary site, because the letter's errors are
not typos: a wrong medication dose or a stale emergency contact reaches a
stranger who will act on it." For a magnifier user, 5,000px at 4x is a very long
journey. A3's own remedy removes nothing: move "Sections without notes yet" to
the top, add a "Read it through before you print" link beside the downloads, and
move the two promotional sections below the reading view.

**Position B, argued at full strength:**
This screen is the entire business rationale. A9-014 (P1) is the highest-scored
distribution finding in the audit: nothing on the site is designed to be handed to
a family by a gatekeeper, and the referral loop is what keeps the tool alive.
A9-010 finds **both firm CTA links on the finished-letter screen return 404** —
so the conversion mechanism is not merely mis-placed, it is broken. A9-015 notes
this is "the moment of maximum trust": a family has just invested 45–90 minutes
and a professional evaluating the tool will look hardest at this screen. Push the
firm CTA below 5,000px of reading view and it is, for practical purposes, gone.
A3-015 itself concedes the point in its `risk_of_change`: "it moves the firm's
conversion CTA down the page, which is a business trade-off the owner should make
knowingly."

**What is actually at stake for the user:**
Whether a parent verifies a medication dose before handing the document to an ER,
against whether the tool that let them write it continues to exist.

**Resolution:**
**A3-015's reorder is adopted in full. The promotional sections move below the
reading view.** Verification and correctness of a document that reaches a
stranger who will act on it outranks conversion, and it is not close.

But adopt it with three amendments that recover most of what A9 loses, because
nothing here requires the CTA to be *weakened*, only *moved*:
1. **Fix A9-010 first.** Two 404s are a P2 trust defect independent of position; a
   broken CTA at the bottom of the page is worse than a broken CTA at the top.
2. **Remove the dead email form, on which three analyses agree unanimously** —
   A3-007, A5-004 and A9-015 all say the same thing from three different lanes:
   a fully-formed input and button that visibly do nothing sit at the moment of
   maximum trust and are "the strongest 'this product is unfinished' signal on the
   site." Its removal frees exactly the vertical space the reordering needs, and
   A9-015's own instruction for the reclaimed space — "a stronger restatement that
   the backup file is the only way back in" — serves A2-005 and A3-010 too. This
   is the single cleanest agreement in the audit and should be actioned without
   further debate.
3. **A9-011's attorney bio, which exists in config and is rendered nowhere, goes
   *after* the reading view alongside the CTA** — where a reader who has just seen
   their finished letter meets the person who built the thing. A9's own argument
   supports this placement: "the sharing ask lands better *after* someone has seen
   their finished letter anyway" is A3's line, and it is equally true of the
   consultation ask.

**Governing rule applied:** Accessibility (2, cognitive — executive function and
verification at the end of a long task) over growth and reach (5).

**What was given up, and its cost:**
Above-the-fold position for the firm CTA and the share card, on the highest-intent
screen in the product. This is a genuine and quantifiable business cost and the
owner should see it stated plainly rather than buried: a CTA below 5,000px will
convert at a fraction of one placed at the top, and A9-014 is right that the
referral loop is what justifies continued investment. V1's severity correction
(A3-015 mission 4→3, reach 4→3, harm 3→2) makes this closer than A3 argued. I
still resolve it A3's way, because a family handing an ER a stale medication list
is a harm to a third party who never consented to it, and no conversion rate
outweighs that.

**Is there a third option that satisfies both?**
Yes, and it is better than either: **a compact, single-line "Read it through
before you print" bar directly beside the download buttons**, plus the
"Sections without notes yet" summary at the top, plus the promo sections
retained *above* the full reading view but *below* the verification prompts. That
gets A3's outcome — verification happens before download — without demoting the
CTA by 5,000px. It requires the reading view to be reachable by anchor rather than
by scroll, which is a small change. This is the recommended implementation; the
full reorder is the fallback if the anchor approach does not test well.

**Do I disagree with the hierarchy here?** No, though I note the hierarchy has
nothing to say about the tool ceasing to exist, which is the failure mode A9 is
guarding against. Growth being last does not mean growth being zero.

---

## CONFLICT C-014 — The engraved-caps device versus the settled brand

**Analyses involved:** A1 (design), A3 (inclusive), A4 (conformance), A6 (PDF).

**Finding IDs:** A1-003 (P2), A3-013 (P3), A6-006 (P2), A6-005 (P3), A6-010 (P1), A4-017 (P3). Owner ruling: the brand system is settled.

**Position A, argued at full strength:** *(the device is harming the audience)*
Four analyses, working independently, converged on one typographic device.
- **A1-003 / A3-013:** `.tw-engraved` is Cinzel — a display serif — uppercase, at
  `letter-spacing: 0.18em` or more. The rule is stated in the codebase's own
  comment at `globals.css:304`: **"Never below 12px."** Actual usage: 17 instances
  at 11px, 2 at 10px, 1 at 9px. These labels carry orienting meaning — "Option
  one", "What this set asks", "The last step", "Start here", "Recent photo".
  Uppercase + wide tracking + display serif at 9–11px is close to the worst
  available combination for low vision and dyslexia (all-caps removes word-shape
  cues), and the tokens themselves acknowledge the audience: `--ink-faint` was
  deliberately darkened at `globals.css:77-80` "because the audience is older
  caregivers." The site thought carefully about contrast and let size undo it.
- **A6-006:** in the PDF, every letterspaced label **extracts and copies as broken
  text** — "DIAGNOSES" comes out as "D I A G N O S E S". A screen reader on the
  emergency sheet reads the allergy heading as nine letters.
- **A6-010 / A6-005:** the brand lockup is the largest single element on the
  emergency sheet, and 85–98% of every PDF's bytes is that one logo at
  1,150–1,700 DPI — which is also most of A2-016's 14-second download.

**Position B, argued at full strength:** *(the brand is settled)*
The owner has ruled the brand system off the table, and that ruling deserves more
respect than "but accessibility". The engraved wordmark *is* the product's visual
identity; it is what makes a document a parent spent six hours on look like
something worth putting in a binder rather than a form printout. A6-012 makes
this argument explicitly and it is not sentimental: the dignity of the artifact is
part of what gets people to finish. A4-017 concedes the same ground from the
conformance side — AAA 1.4.6 is not met, and "reaching it would cost the brand",
so A4 does not ask for it. Death by a thousand accessibility papercuts is how
distinctive products become indistinguishable ones.

**What is actually at stake for the user:**
Whether an older caregiver can read the labels that tell them where they are, and
whether a blind reader hears "allergies" or "a-l-l-e-r-g-i-e-s".

**Resolution:**
**None of these findings asks to change the brand. Every one of them asks the
brand to obey its own written rules. Action all of them.** This conflict is
largely an artefact of how "settled" could be misread, and settling it explicitly
prevents four correct findings being closed as out of scope.

- **Raise the `.tw-engraved` floor to 12px everywhere.** This is not a brand
  change; it is enforcement of `globals.css:304`, which the brand system itself
  wrote. Start with the three worst: the 9px photo-slot labels
  (`PhotoFields.tsx:210`), the 10px footer headings (`SiteFooter.tsx:5`) and the
  10px video chip. Recover the lost visual weight with the gold colour and the
  existing hairline rule, as A3-013 suggests.
- **Reduce PDF `letterSpacing` to ≤ 0.6** (A6-006 option 1). The engraved feel
  comes from Cinzel and the caps, not the tracking. A6's option 2 (a hidden
  duplicate) does not work — @react-pdf gives no way to mark it as an artifact.
  The two cover lines ("A LETTER OF INTENT FOR") may keep their tracking: they are
  short, low-information strings where the extraction cost is trivial.
- **Reduce web tracking below 0.20em at 12px** (A3-013).
- **Re-encode the logo** at a sane DPI (A6-005) and **move it off the top of the
  emergency sheet** (A6-010, C-008). Neither changes the mark.
- **A4-017 stands as filed: do not pursue AAA 1.4.6.** A4 is right that it would
  cost the brand for a benefit the AA fixes already largely deliver, and the
  audit should be seen to decline something.

**Governing rule applied:** Accessibility (2) over design quality (4) — but the
operative rule is narrower and more useful: **a settled design system is settled
at the level of its intent, not its every current pixel value.** A rule the system
states about itself and then violates 20 times is a defect in the implementation,
not a decision to be protected.

**What was given up, and its cost:**
Roughly two points of tracking and one to three points of size on twenty labels,
and the logo's position at the top of one artifact. Cost: the engraved labels will
read very slightly less airy. This is the smallest cost of any resolution in this
document, which is why the volume of findings pointing at it is disproportionate
to the stakes.

**Is there a third option that satisfies both?**
For the PDF, yes, and A6 names it: the HTML export (C-010) sidesteps extraction
corruption entirely, because CSS `letter-spacing` in HTML does not alter the text
content. That means the *printed* PDF could in principle keep full tracking if the
HTML is the accessible route. I still recommend reducing it, because the PDF is
the primary artifact and a trustee copying a heading out of it should get a word.

**Do I disagree with the hierarchy here?** No — but I would flag to the owner
that if "the brand is settled" is ever used to block enforcement of the brand's
own stated rules, four independent analyses will keep rediscovering the same
twenty labels.

---

## CONFLICT C-015 — Dark mode

**Analyses involved:** A3 (inclusive) against the settled brand and the contrast work in A1/A4.

**Finding IDs:** A3-009 (P2). Related: A3-008 (P2), A4-012 (P0), A4-003, A4-004.

**Position A, argued at full strength:**
A3-009: `:root { color-scheme: light; }` is hard-coded at `globals.css:13`, there
is no `prefers-color-scheme` query anywhere, and rendering the wizard in a dark
Chromium context produces **byte-identical** colours. "This is the clearest gap
between who the site says it is for and what it does." The design brief for the
whole product is "one more ten-minute sitting, whenever you can find it" — and
the sittings people actually find are late at night, often in a dark room beside
a sleeping child. A full-screen ivory page at 2am is physically uncomfortable for
a large minority (photophobia, migraine, post-concussive light sensitivity,
uveitis, dry eye, autistic sensory sensitivity — all over-represented among both
caregivers and disabled adults) and physically excluding for a smaller one. And
the decisive point: **the site already owns a complete dark palette.** The navy
scale, `--on-ink-heading`, `--on-ink-body`, `--on-ink-secondary` and the navy
panel treatment are already used on the hero, every section header and the review
header. "A dark theme is not a new brand; it is the existing navy ground
extended."

**Position B, argued at full strength:**
The brand is settled and a dark theme is a second complete visual system, not a
token flip. A3 concedes the hard part in its own recommendation: "re-run the
contrast checks, because gold-on-navy and gold-on-ivory have different budgets,
and re-check the navy panels, which will need to become *lighter* than the page
rather than darker." That inversion is the whole difficulty — every navy panel in
the product is currently a figure against an ivory ground, and in dark mode it
must become a ground itself. Every contrast decision in C-002 (the focus ring),
C-003 (the gold gradient) and A4-011 (colour-carried state) has to be re-derived
for a second set of grounds, doubling the surface the accessibility gate must
cover — a gate A4-016 has already shown is structurally blind to the brand's two
signature surfaces. No WCAG SC requires dark mode; 1.4.8 is AAA and adjacent at
best.

**What is actually at stake for the user:**
Physical discomfort, and for a smaller group actual exclusion, during the exact
sittings the product is designed around.

**Resolution:**
**Defer the full dark theme; ship the two things that deliver most of its value
and none of its risk, now.**
1. **A4-012 first, unconditionally — it is a P0 and it is the real inclusion
   defect in this cluster.** In Windows High Contrast Mode, form fields have **no
   visible focus indicator at all.** A user in forced-colors is a user who has
   already told the platform they need a different visual system, and the site
   ignores them completely. A3-008 (every progress and orientation cue disappears
   in forced-colors) is the same population. Fix forced-colors before building an
   optional theme, because forced-colors serves exactly the people A3-009 is
   worried about and is a conformance obligation rather than a preference.
2. **Set `color-scheme: light dark` and honour `prefers-color-scheme` for the
   smallest useful subset** — page ground and body text only, mapping `--paper*`
   to the navy scale and `--ink*` to the on-ink scale, leaving navy panels and
   gold accents alone in v1. This is the "smallest useful" version A3 itself
   gestures at. It removes the full-screen ivory glare, which is the actual harm,
   without re-deriving every panel relationship.
3. **The full theme — panel inversion, gold budgets, gradient re-derivation — is
   scheduled after C-002 and C-003 land**, so it is built once against a
   known-good ring and a known-good gradient rather than being re-done.

**Governing rule applied:** Accessibility (2) over design quality (4) — with an
intra-tier sequencing rule: a Level-AA forced-colors failure affecting users who
have already declared their need outranks an optional preference no SC requires.

**What was given up, and its cost:**
A full dark theme, for now. Cost is real and falls on a real population: a parent
with migraine writing at 2am still gets a bright page for the panels and accents
even after step 2. I am not comfortable with this and I would revisit it as soon
as the contrast work lands.

**Is there a third option that satisfies both?**
Yes, and it is cheap: an **in-product light/dark toggle** rather than a
`prefers-color-scheme` inference. It sidesteps the "is this a brand change"
question entirely — the brand's default appearance is untouched and unchanged for
every visitor who does not ask — while giving the affected user an explicit
control. It also serves situational users whose OS is in light mode but whose
room is not. If the owner is uneasy about dark mode as a brand matter, the toggle
is the version to propose.

**Do I disagree with the hierarchy here?** No. But note that "the brand is
settled" is not a hierarchy tier — it is an owner constraint that sits outside
the hierarchy, and it should not be allowed to acquire tier-1 force by habit.
A3-009 is correct that extending an existing navy palette to a second ground is
not a brand change, and if the owner rules otherwise that is their call to make
explicitly rather than by default.

---

## CONFLICT C-016 — Autofill on the author's own name

**Analyses involved:** A4 (conformance) against the project's privacy-by-design posture. Related: A2, A7.

**Finding IDs:** A4-008 (P3), A4-009 (P3), A2-009 (P2), A2-010 (P3).

**Position A, argued at full strength:**
A4-008: the wizard form carries `autoComplete="off"` at form level
(`SectionForm.tsx:86`) and **no field anywhere carries an autocomplete token** —
measured across five sections, every field returns `effectiveAutocomplete: ""`.
SC 1.3.5 Identify Input Purpose (AA) applies only to fields collecting
information *about the user*, and in this tool almost everything is about the
person being cared for — so the strict failure is narrow: `f-authorName`, the
parent's own name. But the cognitive cost is broader: people with tremor, for whom
every avoided keystroke matters; people with dyslexia or memory impairment who
rely on the browser to spell their own name; anyone typing one-handed at
midnight. And some of these parents are themselves disabled.

**Position B, argued at full strength:**
`autocomplete="off"` on a form containing a disabled child's diagnoses, a
doctor's phone number and a description of behavioural crises is a deliberate and
correct privacy decision. Turning any of it on invites the browser to write that
data into an autofill profile which — if the user has Chrome Sync, iCloud Keychain
or Firefox Sync enabled — synchronises to a vendor account and is then offered on
other sites. A4 states this asymmetry against itself: the change "is neither
opt-in nor default-off — it is a hint the browser may act on. It is revocable in
the browser's own autofill settings, not here."

**What is actually at stake for the user:**
Retyping one's own name on one field, against a browser vendor holding one more
copy of a name it already holds.

**Resolution:**
**Add `autocomplete="name"` to `f-authorName` only. Leave `autoComplete="off"` on
everything else, permanently and by rule.** A4's scoping is exactly right and its
"do NOT" list should be lifted into a code comment: no tokens on
`subjectFullName`, the contacts repeater, the medical providers, or anything else
— 1.3.5 does not reach them and a token there would invite the browser to store a
disabled child's name and a doctor's phone number.

**Two items A4 raised that must not be dropped:**
- **Run the 20-minute test A4 could not run.** Modern Chrome ignores
  `autocomplete="off"` for name- and address-shaped fields when deciding what to
  *save*. If that is true here, the current attribute is already providing less
  protection than the code implies, and the entire privacy premise of this
  decision is weaker than anyone believes. This needs a real, non-headless Chrome
  profile. **Nobody should rely on `autocomplete="off"` as a privacy control
  anywhere in this product until that test is run.** That is the most important
  sentence in A4-008 and it is not a conformance point at all.
- **A4-009 and A2-009 are the better prize and are unaffected by any of this.**
  The emergency contact must be typed again after already being entered and
  flagged (SC 3.3.7 Redundant Entry). Offering a pick-from-list of people the
  family has already entered eliminates the keystrokes A4-008 is worried about,
  for more fields, with **zero** privacy cost — the data never leaves the store.
  Same for A2-010's "Today's date" empty picker. Do these first.

**Governing rule applied:** Privacy (1) over accessibility (2) for every field
about the child; accessibility for the one field about the author — see below.

**What was given up, and its cost:**
Nothing meaningful. The 1.3.5 gap closes on the only field it reaches.

**Is there a third option that satisfies both?**
Yes, and it is A4-009/A2-009/A2-010 — in-app prefill from data the store already
holds. It delivers more keystroke savings than autofill would, on more fields,
with no vendor involved at all. This is the answer and the autocomplete token is
a footnote beside it.

**Do I disagree with the hierarchy here? YES, narrowly.** Applied literally,
privacy at tier 1 says leave `autocomplete="off"` on everything including
`f-authorName`, and A4 says it "would not overrule an owner who made it". I would
overrule that, and I think the hierarchy is being over-applied. The "privacy
harm" is the user's own browser remembering the user's own name — a value the
user has given that same browser "a hundred times", in A4's phrase, and which
this site never sees, never transmits and never controls. Counting that as a
tier-1 privacy cost inflates the tier until it can veto anything, which makes it
useless for the cases where it should be decisive (C-006, C-009, C-018). Tier 1
should mean *this product causing information to reach someone who should not
have it.* Here the product causes nothing; the browser does what browsers do. The
accessibility benefit is small but real and it should win. Caveat: this
conclusion is contingent on the Chrome test above. If Chrome is already saving
these values regardless of the attribute, the calculus does not change — it just
means the protection everyone thought they had was never there.

---

## CONFLICT C-017 — Eight new legal documents on a site written for exhausted readers

**Analyses involved:** A8 (policy) against A5 (language) and A2/A3 (cognitive load).

**Finding IDs:** A8-004, A8-005, A8-006 (P0), A8-007 (P1), A8-008, A8-011, A8-012, A8-013, A8-015 against A5-014, A5-016, A5-007, A2-006, A3-014.

**Position A, argued at full strength:**
Each of A8's gaps is individually correct and several are not optional.
**A8-006 (P0): there is no Accessibility Statement on a tool built for disabled
people, whose explainer video has no captions and no transcript.** That is not a
paperwork gap; it is the absence of the one document that would tell a disabled
user what to expect and how to get help. **A8-007 (P1): no data retention or
deletion statement, and the browser can silently delete a family's letter without
anyone being told** — the single highest-harm gap in A8's set. **A8-004: five
CalOPPA elements missing**, in a statute with no revenue threshold that reaches
any commercial operator collecting PII from Californians — no effective date, no
change-notification process, no third-party categories, no review-and-correct
process, no Do Not Track disclosure. **A8-005:** no Terms of Use at all — no
warranty disclaimer, no limitation of liability, no governing law, on a free tool
published by a law firm and used nationally.

**Position B, argued at full strength:**
The reader is defined by the product's own copy as someone who does not know what
"client-side" means — and A5-016 catches the privacy page already naming "local
storage" and "IndexedDB" to that reader. A5-014 finds meta descriptions running
171–206 characters, truncating the privacy promise out of search results.
Adding eight footer links, each to a page of legal register, does three things:
it makes the footer a wall, it dilutes the one document that matters (`/privacy`,
which the site's entire trust proposition rests on), and it signals
institutional caution to an audience the site has worked very hard to speak to
warmly. A8 knows the risk and names it: a Terms of Use is low risk "if kept short
and warm. High if it becomes a wall of capitalised text — that would visibly
contradict the site's whole voice and would cost more in trust than it gains in
protection."

**What is actually at stake for the user:**
Whether a frightened parent can find the one sentence they need, against whether
a disabled user knows the site's accessibility position and whether a family
learns their letter can be silently evicted by their own browser.

**Resolution:** *(consolidate to three documents, not eight, and put the
user-facing content where the user already is)*

1. **`/privacy` absorbs the CalOPPA elements (A8-004) and the retention statement
   (A8-007).** An effective date, a change-notification sentence, a categorised
   third-party list (Google, Vercel, Cloudflare — which also closes A8-001), a
   cross-reference naming `/your-data` as the review-and-correct route, and a Do
   Not Track line. These are five short additions to a page people already read,
   not five pages nobody will.
2. **`/accessibility` ships as its own page (A8-006).** It is the one new document
   that earns a top-level URL, because it is addressed to a distinct reader with a
   distinct need, and because a tool for disabled people that has no accessibility
   statement while its video has no captions is making a statement anyway. Note
   V3's severity correction — harm 5 is too high, and A8-007 outranks it on harm —
   but the P0 tier stands on mission fit.
3. **`/terms` ships, short and warm, linked from the footer and never behind a
   click-through gate** (A8-005's own instruction: "do not add a click-through gate
   in front of a grieving parent").
4. **A8-008 (children's notice) and A8-015 (change log, AI-use position) fold into
   `/privacy` as short sections.** A separate COPPA page for a tool whose users
   are adults writing *about* children would confuse more readers than it protects.
5. **A8-012 (security.txt) and A8-013 (surface SECURITY.md) are not user-facing
   at all** and cost the reader nothing. `security.txt` is a static file;
   SECURITY.md is, as A8 says, "the site's best trust asset and invisible to
   everyone who needs it" — surface it from `/for-professionals` (A9-013), where
   the reader who wants it actually is, not from the footer where it dilutes.
6. **A5's constraint binds every word of the above.** No "IndexedDB" in
   user-facing prose. Every new sentence passes the same reading-level bar as the
   existing copy, which A4-019 found meets AAA everywhere except Medical.

Net: the footer gains **two** links, not eight.

**Governing rule applied:** Clarity (3) over the presentation of legal
completeness — noting that A8-006 and A8-007 are not clarity questions at all.
A8-006 is an accessibility obligation (tier 2) and A8-007 protects against a
family losing hours of writing, which is mission-critical regardless of tier.
Both survive consolidation intact.

**What was given up, and its cost:**
Six standalone documents become sections. Cost: a lawyer auditing the site for
formal compliance finds a Children's Information notice inside `/privacy` rather
than at `/childrens-privacy`, which is marginally less discoverable. Real but
small; CalOPPA and COPPA care about content and conspicuousness, not URL count.

**Is there a third option that satisfies both?**
Yes, and it should be built: a single `/your-rights` hub that indexes every
policy section with one plain-language line each, so the footer carries one link
and the reader who wants detail gets a map instead of a menu. That also gives
A8-015's change log a natural home and gives A8-004's change-notification
requirement somewhere to point.

**Do I disagree with the hierarchy here?** No. But I note the hierarchy has no
tier for legal exposure, and A8-005 is genuinely about protecting the owner
rather than the user. That does not make it unimportant; it makes it invisible to
this ranking, and someone should say so out loud rather than letting it score low
by omission.

---

## CONFLICT C-018 — Spanish

**Analyses involved:** A9 (distribution) against privacy, the client-side-only ruling, and A5 (language).

**Finding IDs:** A9-021 (P2, **architectural** — the only one in the audit). Related: A5-003, A5-013, A7-003, A9-014.

**Position A, argued at full strength:**
A9-021: `<html lang="en">` is the only language declaration in the codebase — no
i18n library, no locale routing, no message catalogue, no Spanish anywhere,
including the PDFs and the emergency sheet. "This is the largest single reach
ceiling on the tool, and it is also the finding most likely to make a PTI or a
hospital decline to distribute it — an organisation with a language-access
obligation cannot hand out an English-only resource as its answer." The
gatekeepers with the most reach — state Parent Training and Information centers
(federally funded, with an obligation to serve underserved populations,
frequently bilingual), Part C early intervention, hospital social work, Arc and
P2P chapters — are precisely the channels A9-014 identifies as the distribution
strategy, and they are substantially bilingual.

**Position B, argued at full strength:**
Three constraints bite, and they compound.
- **Privacy:** the cheap implementation — a runtime translation widget — would
  send page content, and potentially field labels adjacent to user input, to a
  third party, on pages that hold the letter. A9 rules this out itself and it must
  stay ruled out: "Any runtime translation service would send page content … and
  must not be used." That is not a preference; it is the canonical promise.
- **Safety:** "Do not machine-translate this. The content includes end-of-life
  wishes and behavioural crisis guidance, where a mistranslation is genuinely
  harmful, and a bad Spanish version would damage trust with the exact community
  it is meant to serve."
- **Cost:** XL and permanently ongoing. Professional translation of ~25 sections
  plus the marketing surface, translated PDFs, a second font-subset verification,
  and every future copy edit doubling. A5's careful terminology work — six names
  for save (A5-005), five for delete (A5-006), "trustee" undefined (A5-003) —
  is not yet finished in English; forking it into two languages before it is
  stable guarantees drift. New failure modes: a half-translated document handed
  to a family, and a stale Spanish version that is worse than none.

**What is actually at stake for the user:**
A Spanish-speaking parent cannot use this tool at all. Not "with difficulty" —
at all. And a bilingual gatekeeper cannot hand it to them.

**Resolution:**
**Ship A9's interim step now; treat full Spanish as a separately budgeted project,
not a backlog item; and rule out runtime translation permanently in code review.**
1. **One Spanish-language page**, professionally translated, explaining what the
   tool is, what it produces, and stating plainly that the tool itself is
   currently English only — "so a Spanish-speaking family is not left guessing,
   and so a bilingual gatekeeper has something honest to hand over." This is
   cheap, it is honest, and it converts a silent exclusion into a stated one.
2. **Translate the emergency sheet's fixed labels first, if anything is
   translated next.** It is one page, its label set is small and closed, its
   readers include bilingual school and clinical staff, and it is the artifact
   with the highest circulation per unit of translation cost. A bilingual
   emergency sheet — English and Spanish labels on the same page, with the
   family's own typed content untranslated — is a genuinely achievable increment
   that no analysis proposed and that carries no drift risk, because the labels
   are static.
3. **Write the runtime-translation prohibition into `SECURITY.md` and the CSP
   review checklist**, so nobody adds a translate widget in eighteen months as an
   obvious win.
4. **Full localisation stays architectural and unscheduled** until the English
   copy is stable — i.e. until A5-005, A5-006, A5-003 and A5-013 are closed.

**Governing rule applied:** Privacy (1) rules out the cheap implementation
absolutely. What remains is sequenced on cost and on A5's accuracy constraint,
not on the hierarchy.

**What was given up, and its cost:**
Access, for Spanish-speaking families, for the foreseeable future. This is the
largest unaddressed harm in this document and I do not want the surrounding
reasoning to disguise that. The interim page and a bilingual emergency sheet
mitigate the *gatekeeper* problem — an organisation gets something honest to hand
over — while doing almost nothing for the family itself.

**Is there a third option that satisfies both?**
Partially, and it is worth pricing: **the HTML export from C-010 gets browser-native
translation for free.** A self-contained HTML letter can be translated by the
reader's own browser, on their own device, with no third party in the loop that
this product introduced. That does not make the *wizard* usable in Spanish — the
family still has to write it in English — but it means the finished document can
be read in Spanish by a grandparent or a caregiver. A6-012 lists "translation"
among the HTML export's benefits and nobody connected it to A9-021. They should
be connected: it is one more reason to ship the HTML export.

**Do I disagree with the hierarchy here? YES, on the classification, and it
changes the priority.** The hierarchy puts "growth and reach" last, and A9-021 is
filed under reach. That is the wrong tier for it. For a Spanish-speaking parent,
an English-only tool is not a reach limitation — it is an **access** limitation,
indistinguishable in effect from a screen reader that cannot read the page.
"Reach" describes the owner's problem (fewer users); the user's problem is that
they cannot use the product. Language access sits at tier 2 alongside cognitive
accessibility, and the federal language-access obligations attached to the PTIs
and hospitals A9 names exist precisely because the law treats it that way. I have
not let this change the *sequence* — the cost is genuinely XL and the safety
argument against doing it badly is decisive — but it should change how it is
recorded and how it competes for budget. Filed as a tier-5 growth item it will
never be funded. Filed as a tier-2 access gap with an XL price tag, it is at
least an honest open question in front of the owner.

---

## CONFLICT C-019 — The firm's name on the family's cover page

**Analyses involved:** A9 (distribution) against A8 (policy) and A9's own trust findings.

**Finding IDs:** A9-013 (P2, PLAUSIBLE) item 3, against A8 §5.7 / A8-004, and against A9-011 (P2). Related: A6-010, A9-014, A6-015.

**Position A, argued at full strength:**
A9-013: publication by a law firm is simultaneously the strongest and the most
limiting trust asset. It is why a parent believes the content; it is also why
**a competing special-needs attorney will not hand this to their client** — a
competitor firm's name and an ATTORNEY ADVERTISING notice would go into their
client's permanent binder. A9's table names this as the blocker for the single
highest-reach gatekeeper channel. Item 3 asks whether the firm's full name and
the ATTORNEY ADVERTISING block need to be on the *family's cover page*, or
whether they belong on the how-to page behind it — while keeping "Created with
the free Letter of Intent Builder · myletterofintent.com", which A9 calls the
distribution engine and says must stay. A6-010 independently wants the lockup off
the top of the emergency sheet for unrelated reasons.

**Position B, argued at full strength:**
A8 uses the ATTORNEY ADVERTISING notice as load-bearing in two places. In §5.7 it
notes the firm is licensed in Virginia only while the tool is used nationally,
that each state bar has its own advertising rules, and that a few (New York,
Texas) have specific requirements for solicitations reaching their residents —
concluding this is "squarely counsel's own professional-responsibility call".
And in A8-004 the notice is the basis for CalOPPA applicability: "the site's own
ATTORNEY ADVERTISING notice makes the 'commercial' characterisation hard to argue
against." Meanwhile A9-011 pushes in the opposite direction from A9-013 — there
is no "who made this and why", the written attorney bio exists in config and is
rendered nowhere, and for a cold visitor deciding whether to type a diagnosis
into a website, the identifiable attorney behind it is the trust threshold.

**What is actually at stake for the user:**
Whether the family's permanent document reads as their own or as a law firm's
marketing collateral — and whether their own attorney is willing to give it to
them in the first place.

**Resolution:**
**Do not touch the ATTORNEY ADVERTISING block without counsel. Solve the
gatekeeper problem with A9-013's items 1 and 2 instead, which cost nothing and
are not in conflict with anything.**

This is the one conflict in this document where the correct resolution is a
referral rather than a decision. A9-013 is scored PLAUSIBLE, and item 3 sits on
top of a professional-responsibility question that A8 explicitly declines to
answer and that no auditor should answer for a licensed attorney. Removing or
relocating a bar-mandated advertising disclosure to improve distribution is not a
design trade-off; it is a regulatory one with the owner's licence attached.

What proceeds immediately and unblocked:
- **`/for-professionals`** (A9-013 item 1) — currently a 404, referenced by
  A9-010 — written to a professional: what the tool produces, what it does not
  claim, where the data lives, and an explicit "no referral fee, no data sharing,
  no client relationship". This is the neutral surface the branded tool cannot be,
  and it is where SECURITY.md should surface (C-017).
- **The co-brandable one-page handout** (item 2) with a "provided by ____" line
  the professional fills in before printing, generated client-side. This is the
  artifact that actually gets handed over and it solves the competitor-firm
  problem without touching the family's document at all.
- **A9-011's attorney bio gets rendered**, placed per C-013 (after the reading
  view). A9-011 and A9-013 only appear to conflict: A9-011 wants identity on the
  *site*, where a cold visitor is deciding whether to trust it; A9-013 wants less
  firm branding on the *artifact*, which lives in someone else's binder. Those are
  different surfaces and both can have what they want.

**Governing rule applied:** None of the five tiers, and that is the finding. This
is a professional-responsibility constraint that sits outside the hierarchy
entirely, in the same way the owner's settled decisions do. The audit's job is to
surface it clearly to the person who can decide, not to rank it.

**What was given up, and its cost:**
A9-013 item 3, deferred to counsel. Cost: the competing-attorney channel stays
partially closed until the co-brandable handout ships and is tested with a real
attorney outside the firm. The handout probably recovers most of it.

**Is there a third option that satisfies both?**
Yes: **move the ATTORNEY ADVERTISING block from the cover to the "How to use this
letter" page immediately behind it.** The disclosure remains in the document,
conspicuous and one page in — likely satisfying the bar rules whose requirement
is presence and prominence rather than page one — while the family's cover page
becomes theirs. This is A9's own suggestion sharpened into a specific proposal,
and it is the version to put in front of counsel. Note it also interacts with
A6-002: the page footer carrying the legal disclaimer currently renders on no
page of any document, so "the disclaimer is in the document" is not currently
true anywhere.

**Do I disagree with the hierarchy here?** No — but this conflict demonstrates
that the hierarchy is incomplete. It has no tier for the owner's professional
obligations, and a synthesis that ranked only by the five tiers would have
resolved this as growth-versus-nothing and recommended stripping a bar-mandated
notice.

---

## CONFLICT C-020 — Pre-expanded repeaters versus a form that is already too long

**Analyses involved:** A2 (usability), A3 (inclusive).

**Finding IDs:** A2-008 (P1) against A2-003 (P1), A2-012 (P2), A3-004 (P1). Related: A3-005 (P0), A6-008.

**Position A, argued at full strength:**
A2-008: medications and doctors are hidden behind "+ Add" buttons and start at
**zero items**, so the emergency sheet's most safety-critical list is opt-in by
click. A parent who reads "Medications" as a heading, sees no field, and moves on
has silently produced an emergency sheet with no medications on it — and A3-005
shows the sheet downloads anyway with no warning. The fix is one line of default
state: render one empty item in every repeater. `itemHasContent()` already filters
blanks out of storage, the PDF and the emergency sheet, so an untouched empty row
changes no output at all.

**Position B, argued at full strength:**
The form is already the abandonment problem. A2-003 finds the promised 45–90
minutes contradicted by the site's own per-section badges summing to **165
minutes**; A3-004 finds the same 2x contradiction and files it under executive
function and trust. A2-012 finds a wizard section page has exactly one heading —
even Medical, which is 3,596px of form. Progressive disclosure is not decoration
here; it is the mechanism keeping each screen finishable in one sitting, which is
the product's entire pacing strategy ("one more ten-minute sitting"). Adding a
visible empty row to every repeater on every section makes every section taller
and every time estimate worse, on a product whose own time estimates are already
its second-biggest honesty problem.

**What is actually at stake for the user:**
An empty medications list on a sheet handed to a paramedic, against fifteen more
screen-heights of form for a parent who is already being told it takes twice as
long as advertised.

**Resolution:**
**Pre-expand safety-critical repeaters only. Leave the rest collapsed.**
- **One empty row by default on: medications, providers/doctors, and emergency
  contacts.** These are the three that feed the emergency sheet (`derive.ts:184-236`)
  and whose absence reaches a stranger who will act on it. A2-008 itself flags
  contacts as "the single most-used part of the letter".
- **Everything else keeps "+ Add".** The generic case does not carry the same
  harm and the vertical cost is real.
- **A3-005's field badges do the rest of the work at zero vertical cost.** Marking
  the ~10 unlabelled fields that feed the emergency sheet — the copy pattern
  already exists on medications ("These print on the emergency sheet") — tells the
  parent what matters without adding a single row.
- **Fix the time estimate honestly at the same time** (A2-003 / A3-004). If the
  form is getting slightly taller, the number describing it must stop being wrong
  by 2x, or the change compounds the abandonment problem it is trying to avoid.

**Governing rule applied:** Accessibility (2, cognitive) on both sides — resolved
by harm. Silent omission of a medication list produces a wrong document that
reaches a third party; extra scroll produces friction for the author. Wrong
output beats friction.

**What was given up, and its cost:**
Uniformity — repeaters will now behave differently in different sections, which
is a real inconsistency and the kind of thing A5-005 and A5-006 rightly punish
elsewhere in this product. Cost: a user who learns "+ Add" on one section is
briefly surprised by a pre-filled row on another. Mitigate by making the
pre-expanded rows visually identical to a just-added row, so the pattern reads as
"one already started for you" rather than as a different component.

**Is there a third option that satisfies both?**
Yes, and it may be better: **keep every repeater collapsed but make the empty
state a labelled, tappable prompt rather than a bare "+ Add"** — "No medications
added yet. Add the first one." That costs one line instead of a full row, removes
the silent-omission failure (the absence is now stated, not implied), and keeps
the form's height almost unchanged. It needs a quick check that the prompt does
not read as an error state to an anxious reader.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-021 — Add a second path chooser, or simplify the one that exists?

**Analyses involved:** A2 (usability), A4 (conformance).

**Finding IDs:** A2-004 (P1) against A2-011 (P2), A4-010 (P2), A2-006 (P2).

**Position A, argued at full strength:**
A2-004: the hero button labelled "Start your letter" does not start the letter —
it lands on a **5,905px chooser** that asks a second question before a single
field. The remedy is a compact two-button choice in the first viewport of
`/letter` — "Caring for someone with disabilities → Start" / "Caring for an adult
who mostly manages → Start", one line of copy each — keeping the full cards and
the fifteen-section preview below as "read what it asks first". A2 is explicit:
"Nothing needs to be removed."

**Position B, argued at full strength:**
The rest of the audit is trying to reduce the number of controls on this exact
component. **A2-011:** the two chooser cards are buttons whose accessible names
are **94 and 101 words long** — a screen-reader user hears a paragraph where they
expect a label. **A4-010:** the chooser announces itself as `role="tablist"` with
`role="tab"`, `aria-selected` and `aria-controls`, but does not behave as tabs —
and A4's preferred remedy is to *drop* the ARIA and use a plain toggle-button
group, because "dropping it is cheaper and, for this audience, better". **A2-006**
is separately counting how many things a keyboard user passes before reaching a
question. Adding a second, duplicate set of choice controls above the first means:
two controls for one decision in the accessibility tree, two things to name, two
things to keep in sync, and — for a screen-reader user — the same choice offered
twice within one page.

**What is actually at stake for the user:**
Whether a parent who clicked "Start your letter" starts writing, against whether
a screen-reader user can tell what the choice is at all.

**Resolution:**
**Adopt A2-004's outcome by *restructuring* the existing chooser, not by adding a
second one.** The three findings are compatible if the compact control and the
detailed cards are understood as one component with two zones rather than two
components:
1. **Fix A4-010 first: drop the tablist ARIA**, replace with
   `role="group"` + `aria-pressed` toggle buttons. This is the smallest change and
   everything else sits on top of it.
2. **Fix A2-011 in the same edit**: give each button a short accessible name
   ("Caring for someone with disabilities") via `aria-label` or a properly
   associated label, and demote the 94–101 words to described-by body text inside
   the card, not into the button's name.
3. **Then hoist the now-compact buttons into the first viewport**, with the
   detailed cards remaining below as the expanded explanation *of the same
   choice* — not as a second set of controls. One decision, one pair of controls,
   two levels of detail.

Ordering matters: doing A2-004 first creates a duplicate control that A2-011 and
A4-010 then have to be applied to twice, and the second application will be
forgotten.

**Governing rule applied:** Accessibility (2) over clarity (3) on sequencing —
but note both are served by the same end state. This conflict is about *order of
operations*, and getting it wrong doubles the defect.

**What was given up, and its cost:**
A2-004's "nothing needs to be removed" framing. The 94–101-word button names are
removed *from the accessible name* — the words themselves survive as visible copy.
Cost: none identified.

**Is there a third option that satisfies both?**
Yes, and it deserves consideration: **remove the second question entirely for the
default case.** A2-004's real complaint is that a button labelled "Start your
letter" does not start the letter. Route "Start your letter" straight into the
special-needs path (the primary audience by every other signal in the product)
with a persistent, reversible "This is the disability-focused set — switch to the
general set" control inside the wizard. Then the chooser page exists only for
people who navigate to it deliberately. That eliminates the decision rather than
compressing it, which is the strongest possible answer to a cognitive-load
finding. It needs the owner's view on whether the general path is a peer audience
or a secondary one — a product question this audit cannot answer.

**Do I disagree with the hierarchy here?** No.

---

## CONFLICT C-022 — An answer-content library

**Analyses involved:** A9 (distribution) against A5 (language), A7 (privacy/accuracy) and A8 (policy).

**Finding IDs:** A9-004 (P2). Related: A9-001, A9-005, A9-006, A9-007, A7-003, A5-003, A5-013, A8-005, A5-002/A8-014/A9-008.

**Position A, argued at full strength:**
A9-004: the site has no answer-content — nothing that matches how caregivers
actually search. "The incumbents ranking for these queries hand the family a blank
Word template — which is exactly the blank page this tool exists to defeat. The
site is losing to a worse answer because it never entered the conversation."
A9 proposes five pages and caps it there explicitly: `/what-is-a-letter-of-intent`,
`/what-to-include`, `/letter-of-intent-vs-will-vs-trust`, `/faq`,
`/for-professionals`. "Do not start a blog: an abandoned blog is a worse trust
signal than no blog, and this owner has a law practice to run."

**Position B, argued at full strength:**
The site cannot currently keep four sentences accurate. **A7-003:** on-site copy
claims more than the canonical scope **in five places**. **A5-002 / A8-014 /
A9-008 — three separate analyses independently found the same defect:** the
privacy page's meta description is a grammatically broken sentence, live in
production and in search results. **A5-003:** "trustee" is the load-bearing word
of the whole special-needs path and is never defined. **A5-013:** "power of
attorney" is the only term in its sentence with no plain-language gloss. Adding
five new pages of substantive guidance about wills, trusts and legal instruments
— published by a law firm, with no Terms of Use, no warranty disclaimer and no
limitation of liability (A8-005), licensed in one state and read in fifty
(A8 §5.7) — multiplies a surface that is already inaccurate in five places and
adds a category of content with professional-responsibility exposure that the
existing wizard content does not have. A9 concedes the editorial risk in its own
words: content on this subject "badly written … damages trust faster than absence
does", and SEO filler aimed at this audience "would be actively cruel."

**What is actually at stake for the user:**
A parent searching "what is a letter of intent for a special needs child" at 11pm
either finds this tool or finds a blank Word template. Against: whether what they
find, once here, is true.

**Resolution:**
**Sequence it. Fix accuracy first, ship one page, then stop and look.**
1. **Close the accuracy defects before publishing a word of new content.** The
   broken meta description (A5-002 / A8-014 / A9-008) is a single string found by
   three independent analyses and live in search results *right now* — it is the
   cheapest credibility fix in the audit. A7-003's five overclaims and A5-007's
   half-audience meta description come next. Publishing a content library while
   the existing copy overclaims in five places compounds the problem it is meant
   to solve.
2. **Ship A8-005's Terms of Use before, not after, the guidance pages.** A law
   firm publishing substantive guidance without a warranty disclaimer or
   limitation of liability is a different exposure from a law firm publishing a
   form-filling tool. A9's own list includes `/for-professionals`, which is
   partly a disclaimer document.
3. **Ship exactly one page: `/what-is-a-letter-of-intent`** — A9's own mitigation
   ("ship one page and stop"). Define "trustee" (A5-003) and "power of attorney"
   (A5-013) in it, so the page discharges two P2 comprehension findings while it
   earns its keyword. It must be the owner's or the attorney's voice; A9 is right
   that it is worthless otherwise.
4. **`/for-professionals` ships in parallel** — it is required by C-019 and
   referenced by a currently-404 link (A9-010), so it is not really new scope.
5. **The remaining three pages wait** for evidence the first one is read and
   accurate. A9-003 (no search-console verification — "the owner is flying blind")
   should be fixed first so that evidence can exist at all.
6. **A9-001 is a prerequisite for `/what-to-include`.** All 25 wizard section
   pages currently tell Google they are duplicates of the homepage, so the
   deep-links that page depends on go nowhere. A9 says so itself.

**Governing rule applied:** Clarity (3) over growth and reach (5). An inaccurate
answer that ranks is worse for a frightened parent than a correct absence — and
the audit already has three independent findings proving the site cannot currently
keep one meta description grammatical.

**What was given up, and its cost:**
Four of five pages, deferred. Cost is real and compounds over time: search
rankings accrue slowly, so a six-month delay is a six-month delay in every family
who would have found the tool. If the owner has editorial capacity now, shipping
two pages instead of one is a defensible variation. What is not defensible is
shipping five while five overclaims are live.

**Is there a third option that satisfies both?**
Yes, and it is close to free: **A9-005 and A9-022 turn existing, already-vetted
content into crawlable answer-content.** The richest keyword surface on the site
— the question previews — is invisible to crawlers; render it server-side. And a
video transcript (A9-022) is simultaneously the WCAG 1.2.3 media alternative
(A4-002), the caption source (A4-001, the Level A legal floor), and several
hundred words of the owner's own already-correct prose about exactly the topic
A9-004 wants to rank for. That is one piece of work discharging a P0 accessibility
obligation and the growth objective at once, with **zero** new editorial risk
because the words already exist and have already been said. This is the highest
combined-value item in the entire audit and it should be done before any new page
is written.

**Do I disagree with the hierarchy here?** No.

---

## Cross-cutting observations

**1. The two structural failures that produced C-001 and C-003 are the same
failure.** Independent analysis catches more; it also guarantees that some pairs
of findings will contradict each other and that neither will know. In C-001 two
analyses reached opposite conclusions on a Level AA criterion. In C-003 two
*verifiers* did, because they were lane-partitioned and did not cross-read. Both
were only resolvable by someone reading across all files with a browser open. If
this audit method is used again, budget for the cross-read explicitly — it is not
overhead, it is where these two findings were found.

**2. "A CSS property exists that would address X" is not evidence.** It was the
mechanism of A3-017's error (a `scroll-margin-top` rule whose selector did not
match) and it is adjacent to A1-002's 7.77 (a number read off the wrong axis of
its own table) and A1-008's inverted remedy (darkening a gold that needed
lightening). All three came from the analysis that ran with Bash unavailable and
performed no axe scan. A1's arithmetic reproduced to two decimal places in every
case — the failures were all in what the arithmetic was applied to. That is a
specific, correctable methodological lesson, not a general caution.

**3. Three analyses independently found the same broken meta description**
(A5-002, A8-014, A9-008) and three independently found the same dead email form
(A3-007, A5-004, A9-015). Unanimity across lanes is the strongest signal in the
dataset and both should be actioned before anything contested in this document.

**4. Two tier assignments in the hierarchy are doing damage and should be
reconsidered by the owner.** Pinned privacy *messaging* is being protected as
tier 1 when it is tier 3 (C-011), and language access is filed as tier 5 growth
when it is tier 2 access (C-018). Both misfilings push the resolution away from
the frightened parent. The hierarchy is sound; these two applications of it are
not.

**5. One item resolves four conflicts at once and should be scheduled first
among the large pieces: the video transcript and captions.** It is A4-001's
Level A legal floor, A4-002's media alternative, A2-018's comprehension gap,
A3-002's deaf/HoH/second-language exclusion, the substance of A8-006's
accessibility statement, and — per C-022 — several hundred words of correct,
already-written, crawlable prose. Nothing else in this audit pays out across that
many lanes.
