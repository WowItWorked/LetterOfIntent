# A5 — Plain Language and Content

Analyst A5, working blind to the other eight. Analysis only; no application code,
content, or configuration was modified. The only files I created are this one and
three read-only measurement tools under `audit/tools/` with their JSON output under
`audit/evidence/`.

---

## HEADLINE: the copy is better than its reputation, and the defects are in the seams

The single most important thing I can tell the owner is that **this site already
passes the plain-language target it is being audited against**, by measurement, not
impression. Average Flesch-Kincaid grade **5.8** against a 6–8 target; Gunning Fog
**8.42** against an 8–10 target; Flesch Reading Ease **75.45** ("fairly easy").
Zero hits for pity framing, inspiration framing, infantilising language, legalese,
or presumptive family/faith/income language. The error messages are the best I have
audited on any site. The emotional calibration in the behavior and final-wishes
sections is genuinely expert.

So this report is **not** "rewrite the copy." Almost every finding below is a seam:
a place where copy that was carefully written in one file contradicts copy in
another, or where the generated document says something the site would never say.
The two that matter most are both in that category, and one of them is in the PDF
a caregiver reads in a crisis.

---

## MEASURED READABILITY

Tool: `audit/tools/readability.mjs` → `audit/evidence/readability.json`.
Run against the local dev server (`http://localhost:3000`), 30 routes, 2026-08-09.

### Method, and why the first two attempts were wrong

I report this because it changes how much weight the numbers carry.

My first extraction cloned `document.body` and read `innerText`. A **detached** node
has no layout, so `innerText` silently degrades to `textContent`, which concatenates
adjacent blocks with no separator — fusing every heading into the paragraph after it
("…parking situation.Food, appetite, and mealtimesWhat they eat…"). That produced
22.4 words/sentence and FK **13.7**. Wrong, and wrong in the alarming direction.

My second attempt read the live DOM one block at a time and terminated each block —
but then counted every field label and button as a sentence, producing 6.6
words/sentence and FK **4.6**. Wrong in the flattering direction.

Both are wrong for the same reason: **readability formulas are defined over
continuous prose, and a wizard screen is mostly labels.** The final method scores
only blocks the author terminated as a sentence and that run ≥12 words. Field
labels, headings and buttons are inventoried separately (`fragmentInventory` per
route) and judged on jargon instead of grade level.

**Syllable counting is heuristic, not dictionary-exact.** Measured accuracy is
published in the output: **88.4% exact, mean absolute error 0.116** over 86
held-out words that are not in the exceptions table. That moves aggregate grade
levels by well under one grade, but no individual word's count should be relied on.

### Site averages (prose only)

| Metric | Site | Target | Verdict |
|---|---|---|---|
| Flesch-Kincaid grade | **5.80** | 6–8 | **passes** (easier than target) |
| Gunning Fog | **8.42** | 8–10 | **passes** |
| SMOG | **8.94** | — | consistent |
| Flesch Reading Ease | **75.45** | ≥60 | **passes** ("fairly easy") |
| Words per sentence | **12.32** | ≤20 | **passes** |

### Per route

| Route | FK | Fog | SMOG | Ease | wps | prose words |
|---|---|---|---|---|---|---|
| home | 6.53 | 9.21 | 9.33 | 75.55 | 15.33 | 598 |
| letter-chooser | 6.05 | 7.95 | 8.28 | 76.83 | 14.13 | 226 |
| sn/getting-started | 5.67 | 8.94 | 9.52 | 74.28 | 11.17 | 134 |
| sn/about | 4.91 | 7.36 | 8.26 | 79.70 | 11.15 | 290 |
| sn/family-and-support | 5.48 | 8.86 | 9.44 | 76.55 | 11.67 | 105 |
| sn/a-typical-day | 3.64 | 6.21 | 7.48 | 85.54 | 9.32 | 177 |
| sn/communication | 5.60 | 7.38 | 8.19 | 75.92 | 11.79 | 165 |
| sn/medical | 5.51 | 7.65 | 8.38 | 77.24 | 12.15 | 158 |
| sn/behavioral-support | 5.17 | 7.45 | 8.42 | 76.38 | 10.31 | 361 |
| sn/school-and-work | 5.80 | 8.99 | 9.52 | 75.49 | 12.38 | 99 |
| sn/housing | 6.68 | 9.15 | 9.66 | 66.93 | 11.08 | 144 |
| sn/benefits-and-finances | 7.20 | 8.61 | 9.28 | **63.25** | 11.11 | 211 |
| sn/friends-joy-and-faith | 5.64 | 8.43 | 9.15 | 73.79 | 10.78 | 97 |
| **sn/legal-and-advocacy** | 6.80 | **10.67** | **10.50** | **64.15** | 10.00 | 120 |
| sn/guidance-for-the-trustee | 5.35 | 8.06 | 8.72 | 78.91 | 12.48 | 287 |
| sn/final-wishes | 4.82 | 7.70 | 8.47 | 81.69 | 11.88 | 95 |
| sn/a-personal-message | 3.93 | 6.72 | 7.55 | **87.67** | 11.67 | 175 |
| gen/about-them | 5.00 | 7.54 | 8.38 | 79.72 | 11.50 | 299 |
| gen/a-typical-week | 4.51 | 6.97 | 8.03 | 80.91 | 10.21 | 194 |
| gen/talking-with-them | 5.57 | 7.23 | 7.91 | 77.32 | 12.45 | 249 |
| **gen/health-and-medical** | 6.39 | **10.72** | **10.61** | 68.06 | 10.57 | 148 |
| gen/home-and-daily-living | 5.25 | 7.23 | 7.71 | 80.93 | 13.21 | 185 |
| gen/money-and-documents | 5.46 | 9.51 | 9.92 | 77.49 | 12.12 | 206 |
| gen/work-and-obligations | 6.37 | 9.29 | 9.24 | 78.15 | 16.14 | 113 |
| gen/faith-joy-and-community | 6.50 | 8.73 | 8.84 | 75.74 | 15.30 | 153 |
| gen/legal-and-decisions | 6.87 | 9.84 | 10.04 | 71.67 | 14.54 | 189 |
| gen/for-whoever-steps-in | 5.36 | 8.57 | 9.17 | 78.76 | 12.41 | 211 |
| review | 6.89 | 8.94 | 9.52 | 65.70 | 11.25 | 45 |
| privacy | 7.49 | 9.47 | 9.54 | 69.13 | 15.59 | 717 |
| your-data | 7.44 | 9.09 | 9.09 | 69.97 | 15.87 | 365 |

Only **two routes breach Gunning Fog 10**: `legal-and-advocacy` (10.67) and
`health-and-medical` (10.72). Both are the pages carrying the most unavoidable
terms of art. That is a precise, small target, not a sitewide problem.

### Legal fine print, scored separately

Legal boilerplate typically scores FK 15–18. This site's does not:

| Text | FK | Fog | Ease |
|---|---|---|---|
| `disclaimerShort` | 7.60 | 10.16 | 72.63 |
| `disclaimerFull` | 9.11 | 11.59 | 61.11 |
| `advertisingNotice` | 7.86 | 12.30 | 55.35 |
| `privacyPromise` | **3.71** | 6.53 | **83.32** |
| `attorneyBioBlurb` | 10.87 | 12.66 | 46.52 |

**No finding here.** The disclaimers are already plain. I am reporting the numbers
so nobody spends effort "fixing" text that is not broken.

---

## TERMINOLOGY AUDIT

Tool: `audit/tools/terminology.mjs` → `audit/evidence/terminology.json`. Counts are
over extracted **copy only** (string literals + JSX text across 90 files);
identifiers, class names and imports cannot inflate a count.

| Concept | Names | Uses | Variants (count) | Verdict |
|---|---|---|---|---|
| **Backup / moving it** | **6** | 96 | download (29) · backup-bare (24) · export (19) · backup file (11) · load a backup (9) · back up v. (4) | **Defect** — see A5-005 |
| **Deletion** | **5** | 27 | delete (10) · clear (7) · remove (5) · erase (4) · gone (1) | **Defect** — see A5-006 |
| The document itself | 8 | 212 | letter-bare (87) · Letter of Intent (48) · document (29) · notes (20) · emergency sheet (18) · guide (7) · companion (2) · LOI (1) | Mostly fine; `notes` is the problem — A5-009 |
| The act of writing it | 7 | 133 | write (57) · record (29) · build (18) · answer (12) · create (9) · write down (6) · fill in (2) | Acceptable register variation |
| The future reader | 9 | 69 | trustee (22) · caregiver (20) · sibling (8) · a new doctor (5) · whoever steps in (4) · guardian (3) · helper (3) · sitter (3) · the next team (1) | Deliberate and good — these are genuinely different people |
| Saving / persistence | 6 | 90 | save (22) · keep (22) · store/storage (17) · lives (16) · stays/remains (12) | Acceptable |
| Where the data is | 5 | 40 | this device (22) · your device (9) · this browser (4) · your browser (4) · IndexedDB (1) | **Precision issue** — A5-012 |
| The person written about | 4 | 170 | them/they (155) · loved one (11) · child (3) · "the person this letter is about" (1) | Good — deliberately non-presumptive |

The two clusters that are genuine accessibility barriers are **backup** and
**deletion**, because those are the two places where a user must take an action to
avoid irreversible loss. Nine names between them for two operations.

---

## ACRONYM / TERM-OF-ART FIRST USE

Tool: `audit/tools/acronyms.mjs` → `audit/evidence/acronyms.json`. The tool
flagged 19 terms; **I read every one in context and most were false positives** —
the tool's regex demanded an "X is …" gloss and missed definitions phrased another
way. Reporting only what survived hand verification.

**Correctly defined at first use** (this is the site's own standard, and it is good):
SSI, SSDI, ABLE account, AAC, IEP, conservatorship, supported decision-making,
representative payee, special needs trust, supported employment.

**Genuinely undefined:**

| Term | First use | Ever defined? |
|---|---|---|
| **trustee** | home page hero + `01-getting-started.ts:12` | **never** — §13 describes what one *does*, never what one *is* |
| **power of attorney** | `12-legal-advocacy.ts:19` | never — and the two terms beside it in the *same sentence* both get parentheticals |
| waiver / DD waiver / CCC Plus | `06-medical.ts:96`, `10-benefits-finances.ts:27` | never |
| OT | `06-medical.ts:81` (placeholder) | never |
| day program | `08-education-work.ts:18` | never |

Medicaid, Medicare, ER and CPAP are also undefined; I judge these **not** to be real
barriers for a US audience and am not raising them as findings.

---

## FINDINGS

```yaml
- id: A5-001
  title: The generated PDF tells a caregiver in a crisis to read sections that are not in the document
  category: content-accuracy / output-integrity
  what_i_observed: >
    The "How to use this letter" page of every generated Letter of Intent carries two
    fixed navigation bullets: "If you are new to {name}, start with 'A typical day' and
    'Communication.'" and "In a crisis, go straight to 'Medical' and 'Behavioral
    support.'" Both are selected only by which of the two question sets the family
    chose. Neither is conditioned on whether those sections actually contain anything.
    In the minimal-fill PDF in the shared evidence — one section completed — the
    contents page reads, in full, "1 Getting started 4", yet page 2 still directs the
    reader to four sections that do not exist in the file. This is the direct
    consequence of the site's own (correct) encouragement to ship a partial letter:
    "A letter with three sections filled in is already worth more to a future caregiver
    than the perfect letter that never got written."
  evidence:
    type: measurement + code
    detail: >
      Text extracted with pdfjs-dist from audit/evidence/pdfs/minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf.
      Page 3 (contents) in full: "CONTENTS  What's in this letter  1 Getting started 4".
      Page 2 contains verbatim: "In a crisis, go straight to \"Medical\" and \"Behavioral
      support.\"" Root cause at src/lib/pdf/loi-document.tsx:239-246 — firstWeekPointer
      and crisisPointer branch on `path` only. The list of sections that DO have content
      is computed twelve lines earlier and never consulted:
        line 231: const included = sectionsFor(path).filter((def) => sectionHasContent(data, def));
        line 239: const firstWeekPointer = path === "general" ? ... : ...;
      Contrast: the key-points page is correctly gated (`showKeyPoints`, line 235) and
      the contents page is correctly gated (`included.length > 0`, line 400). The
      navigation bullets are the only unconditional claim on the page.
      Verified resolved at higher fill: typical--Letter-of-Intent-Disabilities lists
      seven sections including Medical and Behavioral support, so the bullets are true there.
  confidence: MEASURED
  who_is_affected: >
    Whoever opens the letter in an emergency — a sitter, a school nurse, an ER
    clinician, a sibling on the worst day — when the family shipped a partial letter,
    which is the case the site actively and rightly encourages.
  why_it_matters: >
    This is the one finding that survives the site itself. The PDF is the artifact that
    outlives the browser, the tool, and eventually the parent. Sending a reader to
    "Medical" during a crisis when there is no Medical section costs them the seconds
    they least have, and the first thing it teaches them is that this document cannot
    be trusted — which then discounts the parts that ARE filled in. It is also a
    self-inflicted wound: the same file already knows exactly which sections exist.
  standard_reference: >
    plainlanguage.gov, "Write for your audience" and "Be complete" — do not tell a
    reader to do something the document cannot support. WCAG 2.2 SC 3.2.4 Consistent
    Identification is the nearest formal analogue (a cross-reference must identify
    something that exists), though this is primarily a content-accuracy defect.
  recommendation: >
    Build the two bullets from `included` rather than from `path`. Name only sections
    that are present, drop the bullet entirely when none of its targets exist, and add
    an honest bullet when the letter is thin. Concrete replacement copy is in the
    "REWRITES" section below (Rewrite 1).
  scope: current
  privacy_impact: none — no data leaves the device; this is a pure rendering change
  cost_and_maintenance: >
    One-off. Slightly REDUCES maintenance: the strings stop being duplicated per path
    and become derived, so adding a third question set cannot silently break them.
  effort: S
  risk_of_change: >
    Low. Confined to one file, affects only generated output, and the fallback
    (omitting a bullet) is strictly safer than the current behaviour. Worth a snapshot
    test at minimal/typical/maximal fill, which the evidence set already provides.
  mission_impact: 5
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A5-002
  title: The privacy page's meta description is grammatically broken, and it is live in production
  category: content-defect / trust
  what_i_observed: >
    The meta description for /privacy contains an orphaned sentence fragment left over
    from a string-concatenation edit. It reads: "Everything you type stays on your
    device. No account, and nothing you write is ever captured — we count page visits
    and nothing else. of any kind. Here is exactly how that works, in plain words."
    The fragment "of any kind." sits between two complete sentences, lowercase, with a
    full stop before and after it.
  evidence:
    type: network + code
    detail: >
      Fetched from https://myletterofintent.com/privacy on 2026-08-09 via
      audit/tools/meta-check.mjs; captured verbatim in audit/evidence/metadata.json
      under pages.production["/privacy"].description. Confirmed identical in local
      source at src/app/privacy/page.tsx:9-12:
        description:
          "Everything you type stays on your device. No account, and nothing you write is " +
          "ever captured — we count page visits and nothing else. " +
          "of any kind. Here is exactly how that works, in plain words.",
      Local and production agree, so this is not a deployment gap — it is shipped.
  confidence: MEASURED
  who_is_affected: >
    Anyone who finds the privacy page through a search engine, and anyone to whom the
    privacy page is shared in a chat app — including the special needs trust attorneys
    who vet this tool before referring families to it.
  why_it_matters: >
    Of all 31 pages, this is the worst one to have visibly broken text. The privacy
    page's entire job is to be believed by someone who cannot verify the claim
    themselves. A visible grammatical break in its own search snippet is a credibility
    signal pointing the wrong way, and it is the first thing a referring attorney sees.
    The cost to fix is one line.
  standard_reference: plainlanguage.gov "Be concise"; basic editorial correctness
  recommendation: See Rewrite 2 — replacement description at 156 characters.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one-line edit, no ongoing cost
  effort: S
  risk_of_change: none
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A5-003
  title: "Trustee" is the load-bearing word of the whole special-needs path and is never defined
  category: comprehension / jargon
  what_i_observed: >
    "Trustee" appears 22 times in user-facing copy. Its first appearance is the second
    paragraph on the home page. It is the entire promise line of the primary path card
    ("The letter a trustee will read."). It titles section 13. It is never defined
    anywhere on the site. Section 13's intro comes closest — "One day a trustee — maybe
    a relative, maybe a professional who never met you — will make judgment calls in
    your place" — which says what a trustee DOES in this scenario, arriving in section
    13 of 15, long after the reader needed it. This is conspicuous because the site
    defines everything else: SSI, SSDI, ABLE, AAC, IEP, conservatorship, supported
    decision-making, representative payee, special needs trust and supported employment
    all get inline glosses at first use. The site has a standard; trustee is the
    exception to it.
  evidence:
    type: code
    detail: >
      audit/tools/acronyms.mjs walked both paths in reading order; result in
      audit/evidence/acronyms.json. First use src/lib/content/sections/01-getting-started.ts:12
      "everything a future caregiver, trustee, or guardian would need to know". Earlier
      still in the funnel: src/app/page.tsx:91 "A Letter of Intent is the guide a future
      caregiver, trustee, or guardian will rely on". Promise line
      src/lib/content/paths.ts:42 "The letter a trustee will read." Compare the site's
      own standard at src/lib/content/sections/10-benefits-finances.ts:26 "SSI is a
      monthly check for people with disabilities and limited income."
  confidence: INSPECTED
  who_is_affected: >
    Specifically the audiences the brief names as arriving without a background in this:
    aging grandparents becoming guardians, adult siblings taking over, and any parent
    at the very start of estate planning who has not yet met an attorney. A parent who
    already has a special needs trust knows the word. The people who most need the tool
    are the ones who do not.
  why_it_matters: >
    An undefined term in the second sentence of the home page is a comprehension wall
    at exactly the moment the reader is deciding whether this tool is for them. Worse,
    it appears in the card that is choosing BETWEEN the two paths — a reader who does
    not know what a trustee is cannot tell which of the two letters they should write,
    which is the single decision the whole /letter page exists to support.
  standard_reference: >
    plainlanguage.gov, "Avoid jargon" and "Define your terms" — define a term of art at
    first use, in the same sentence or the one after.
  recommendation: >
    A five-word appositive at each of the three high-traffic first uses; do not add a
    glossary. See Rewrite 3.
  scope: current
  privacy_impact: none
  cost_and_maintenance: three string edits; no ongoing cost
  effort: S
  risk_of_change: >
    Low, but it lengthens a hero sentence and a card promise line that were tuned for
    rhythm. The promise line "The letter a trustee will read." is doing real work as a
    short serif line; my rewrite keeps it short and moves the gloss to the blurb below.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A5-004
  title: The email reminder form invites an action it cannot perform, and only says so after the click
  category: actionability / trust
  what_i_observed: >
    On the review page, the second reminder option presents a fully working email
    field — type="email", autoComplete="email", placeholder "you@example.com" — and a
    submit button labelled "Send me the reminder". The button styling changes to the
    active gold gradient the moment the address is valid, which is the site's standard
    signal that a control will work. Only after submitting does the user learn: "Email
    reminders aren't switched on yet, so nothing was sent and your address was not
    saved or transmitted anywhere." The disclosure that exists beforehand is an
    11px engraved eyebrow, "Option two · not switched on yet", and a sentence in the
    body — both easy to skip past on the way to a form field.
  evidence:
    type: code
    detail: >
      src/components/review/ReminderPanel.tsx:73-83 — the submit button's className is
      selected by `valid`, applying `background: var(--gradient-gold)` and
      `boxShadow` when the address parses, i.e. the affordance strengthens as the user
      gets closer to an action that cannot happen. Line 63: autoComplete="email" on a
      field that is guaranteed to be discarded. Line 48-51: onSubmit does nothing but
      setTried(true) — there is genuinely no endpoint, which confirms the privacy claim
      is accurate but makes the invitation worse, not better.
      I verified the privacy page's corresponding claim is TRUE: src/app/privacy/page.tsx:271-279
      states the service is not running and nothing is collected, and the component
      confirms it. The problem is not honesty; it is sequencing.
  confidence: INSPECTED
  who_is_affected: >
    Everyone who reaches the review page — the end of the funnel, where the user has
    just finished the hardest writing of their life and is at their most depleted.
  why_it_matters: >
    Two harms. First, plain actionability: the user does not know what will happen
    when they act, which is the definition of an unusable control. Second, and worse
    given this site's premises — this is the one moment in the flow where the site
    asks the user to hand over a piece of personal data, and the interaction teaches
    them that the site's promises about data are approximate. Every other privacy claim
    on the site is asking for trust that cannot be independently verified by a
    non-technical parent. Spending that trust here, for a feature that does not exist,
    is a bad trade.
  standard_reference: >
    plainlanguage.gov "Tell your reader what to do"; WCAG 2.2 SC 3.2.2 On Input and the
    general principle that a control's affordance must match its capability.
  recommendation: >
    Disable the field and button until the service exists, and say so in the control
    itself rather than above it. Keep the panel — the promise of a future reminder is
    worth advertising. See Rewrite 4.
  scope: current
  privacy_impact: >
    Strictly reduces exposure. Today an email address is typed into a live field and
    held in React state; after this change it is never typed at all. Nothing new leaves
    the device in either case.
  cost_and_maintenance: >
    One component. Slightly reduces maintenance — removes a form handler that exists
    only to reject its own submission.
  effort: S
  risk_of_change: >
    Low. The only loss is the (currently useless) signal of demand for the feature; if
    the owner wants that signal, it is measurable via GA on the panel, not via a form.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A5-005
  title: Six competing names for the one action that prevents total data loss
  category: terminology / cognitive accessibility
  what_i_observed: >
    The backup operation is named six ways across 96 uses of user-facing copy —
    "download" (29), bare "backup" (24), "export" (19), "backup file" (11), "load a
    backup" (9), "back up" as a verb (4). On a single screen (/your-data) a user meets
    the card title "Download a backup", the button "Download backup file", body copy
    "One file holds your whole letter", a callout "This file is the only copy that
    outlives this browser", a separate card "Download the documents", and a third card
    "Load a backup" whose button reads "Choose a backup file…". The word "export"
    survives in code-adjacent copy while the UI says "download".
  evidence:
    type: measurement + code
    detail: >
      audit/tools/terminology.mjs over 90 source files, copy-only extraction; full
      counts in audit/evidence/terminology.json under concepts["Backup / moving it"].
      Co-located examples from src/components/data/DataControls.tsx: line 157 title
      "Download a backup"; line 161 button "Download backup file"; line 186 title
      "Download the documents"; line 218 title "Load a backup"; line 177 "The .json
      file is written for the builder to read, not for a person."
      The handler that implements it is named `handleExport` (line 76) and the library
      function is `serializeBackup` — a third and fourth vocabulary that has not yet
      leaked into copy but is one careless label away from doing so.
  confidence: MEASURED
  who_is_affected: >
    Everyone, but the harm concentrates on exactly the users the brief describes:
    exhausted, on a phone at midnight, or with a cognitive or reading disability. Each
    rename forces a re-resolution of "is this the same thing I already did?"
  why_it_matters: >
    This is the only action that stands between a family and losing everything they
    wrote. The site is admirably blunt about that — "There is no account, so there is
    nothing for us to restore for you" — but a user who is not certain that "download a
    backup", "export", and "back up" are one operation may reasonably conclude they
    have already done it when they have not. Inconsistent naming is a genuine
    accessibility barrier here, not a style nit, because the consequence of the
    confusion is irreversible.
  standard_reference: >
    plainlanguage.gov "Use the same terms consistently"; WCAG 2.2 SC 3.2.4 Consistent
    Identification (components with the same function must be identified consistently).
  recommendation: >
    Pick one noun and one verb and enforce them: the noun is "backup file", the verb is
    "download" / "load". Retire "export" from copy entirely. See Rewrite 5 for the
    full label set.
  scope: current
  privacy_impact: none
  cost_and_maintenance: >
    A dozen string edits, then near-zero. Worth a one-line note in AGENTS.md/CLAUDE.md
    so the vocabulary survives the next contributor.
  effort: S
  risk_of_change: low — labels only, no behaviour
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 4
  environment: both

- id: A5-006
  title: Five names for an irreversible destructive action
  category: terminology / safety
  what_i_observed: >
    Deletion is named five ways in 27 uses: "delete" (10), "clear" (7), "remove" (5),
    "erase" (4), "gone" (1). The /your-data delete card alone uses three of them: the
    eyebrow says "Erase", the title says "Delete all my data", and the body says
    "Erases everything this tool has stored on this device". The privacy page uses a
    fourth framing for the same outcome — "Clearing browser data erases it" and "If you
    or a cleanup tool clear this site's data, the letter is gone."
  evidence:
    type: measurement + code
    detail: >
      audit/evidence/terminology.json, concepts["Deletion"]. Co-located in
      src/components/data/DataControls.tsx:236-249 — eyebrow "Erase" (line 237), title
      "Delete all my data" (238), button "Delete all my data…" (241), body "Erases
      everything this tool has stored on this device" (246). Dialog title at line 273
      "Delete everything on this device?"; confirm button line 283 "Yes, delete it all".
      Privacy page src/app/privacy/page.tsx:177-184 uses "Clearing browser data erases
      it" for the accidental version of the same outcome.
  confidence: MEASURED
  who_is_affected: All users, with the consequence falling hardest on anyone who misreads it.
  why_it_matters: >
    Two distinct events are being described with an overlapping, interchangeable
    vocabulary: the deliberate destructive action the user takes, and the accidental
    loss caused by a browser or cleanup tool. Those need to be clearly DIFFERENT words,
    because the user's response to each is opposite — one they should be able to do
    confidently, the other they must be warned against. Right now "erase", "clear" and
    "delete" all do duty for both.
  standard_reference: >
    plainlanguage.gov "Use the same terms consistently"; WCAG 2.2 SC 3.3.4
    Error Prevention (destructive actions must be clearly identified).
  recommendation: >
    Reserve "delete" exclusively for the deliberate action the user takes here, and
    "cleared" / "lost" exclusively for accidental browser-side loss. See Rewrite 6.
  scope: current
  privacy_impact: none
  cost_and_maintenance: ~8 string edits
  effort: S
  risk_of_change: low
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 4
  environment: both

- id: A5-007
  title: The site-wide meta description describes only half the audience, and inherits onto most pages
  category: clarity / reach
  what_i_observed: >
    The default description is "A free, private tool that guides parents of a person
    with disabilities through writing a Letter of Intent — and turns it into a polished
    PDF plus a one-page emergency sheet. Everything stays on your device." It names one
    audience (parents) and one situation (disabilities). The site actually offers two
    equal paths, the second explicitly "For anyone you care for — an aging parent, a
    spouse, a sibling you look after". Because per-page descriptions are only set on
    /letter, /privacy, /your-data and the sample routes, this description is what
    /letter/review and every one of the 25 wizard routes serves to search engines and
    link previews.
  evidence:
    type: network
    detail: >
      audit/evidence/metadata.json, fetched from production 2026-08-09. Identical
      description returned for "/", "/letter/review", "/letter/getting-started" and
      "/letter/medical". Source src/app/layout.tsx:38-41. Contrast the /letter page's
      own description, which does get it right: "Two sets of questions — one for a
      loved one with disabilities, one for anyone you care for."
      Length 206 characters — see A5-014 for the truncation consequence.
  confidence: MEASURED
  who_is_affected: >
    The general-path audience the site built fourteen sections for: adult children of
    aging parents, spouses, and siblings. Also the named audiences excluded by
    "parents" specifically — grandparents, adult siblings, professional caregivers.
  why_it_matters: >
    A daughter searching for help documenting her father's care reads a description
    that says this tool is for parents of a person with disabilities and correctly
    concludes it is not for her. Half the product is invisible at the point of
    discovery. This is a growth issue by the governing hierarchy (rank 5), but it is
    also a clarity issue (rank 3): the description contradicts what the site says about
    itself one click later.
  standard_reference: plainlanguage.gov "Write for your audience"
  recommendation: See Rewrite 7 — 158-character replacement naming both paths.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one constant; optionally per-route descriptions later
  effort: S
  risk_of_change: >
    Low, but note this string is also the OpenGraph and Twitter description and, per
    src/lib/share.ts:8-10, Facebook and LinkedIn discard the pre-filled share message
    and show this instead — so it must read as an invitation standing alone.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A5-008
  title: The sticky header says "Start your letter" to someone who is already writing one
  category: clarity / actionability
  what_i_observed: >
    On /letter/medical — section 6 of 15, with the user mid-letter — the sticky
    masthead's only filled control reads "START YOUR LETTER · IT'S FREE". It links to
    /letter, the chooser. It does not link to the letter in progress. The label is
    correct on the home page and wrong from the moment the user starts writing.
  evidence:
    type: measurement
    detail: >
      Playwright against the local dev server at 1280x900, navigated to
      /letter/medical, header innerText read after network idle:
        "START YOUR LETTER · IT'S FREE | SHARE"
      Source src/components/chrome/SiteHeader.tsx:95-101 (desktop nav) and 139-146
      (mobile menu) — the label is a literal in both, with no awareness of store state.
      At 375px the header collapses to a hamburger and the string is not visible until
      the menu is opened, so the impact is confined to viewports >= 1100px.
      Mitigating: /letter does render ResumeCard when a letter exists
      (src/components/home/ResumeCard.tsx:21), so the destination is recoverable.
  confidence: MEASURED
  who_is_affected: Desktop and large-tablet users partway through the letter.
  why_it_matters: >
    Nothing is destroyed, so this is not a data-loss finding. It is a calm finding:
    on a site with no account, no login and an explicit "there is nothing for us to
    restore for you", a prominent button offering to START something is read by an
    anxious user as an offer to start OVER. The site is otherwise scrupulous about
    reassuring this exact anxiety; this is the one control that undercuts it.
  standard_reference: >
    plainlanguage.gov "Tell your reader what to do"; WCAG 2.2 SC 2.4.6 Headings and
    Labels (labels must describe purpose) and SC 3.2.4 Consistent Identification.
  recommendation: >
    Swap the label on the store's `hasHydrated && startedCount > 0`, as ResumeCard
    already does. See Rewrite 8.
  scope: current
  privacy_impact: >
    none — reads store state that is already client-side; the header is already a
    client component and already renders SaveIndicator from the same store.
  cost_and_maintenance: >
    Small. One caveat worth stating: SiteHeader currently renders identically for every
    visitor, and making it depend on persisted state means it will differ between
    first paint and hydration. ResumeCard handles this by rendering nothing until
    hydrated; the header should do the same for the label (keep "Start your letter"
    as the pre-hydration default) to avoid a flash.
  effort: S
  risk_of_change: >
    Low-moderate — the hydration flash is the real risk, not the copy. If the owner
    would rather not take that risk, changing the label to the neutral "Your letter"
    is a zero-risk alternative that is correct in both states.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A5-009
  title: The site calls the user's writing "notes", which both diminishes it and collides with a field label
  category: register / terminology
  what_i_observed: >
    Progress everywhere is counted in "sections with notes": "You've added notes to 3
    of 15 sections", "3 of 15 sections have notes so far", "Nothing to review yet —
    your letter doesn't have any notes so far", "Backup loaded — 7 of 15 sections have
    notes", "(3 of 15 sections have notes)". Separately, "Notes" is also the literal
    label of one textarea inside the contacts repeater. So the same word names both
    the whole of what the user has written and one small optional field.
  evidence:
    type: code
    detail: >
      src/components/home/ResumeCard.tsx:34 "You've added notes to {count} of
      {def.sections.length} sections"; src/components/review/ReviewScreen.tsx:95
      "your letter doesn't have any notes so far" and :120 "{count} of {total} sections
      have notes so far"; src/components/data/DataControls.tsx:166 "({count} of {total}
      sections have notes)"; src/components/data/RestoreFlow.tsx:63 "Backup loaded —
      ${filled} of ${total} sections have notes."
      Collision: src/lib/content/sections/03-family-support.ts:45-48 defines a field
      with label "Notes".
      Counted 20 uses of "notes" for the document concept in audit/evidence/terminology.json.
      Contrast the PDF, which calls the same content "the family's own words"
      (src/lib/pdf/loi-document.tsx, key-points footnote) and "what a family learns over
      a lifetime" (line 376).
  confidence: INSPECTED
  who_is_affected: Everyone, at every progress checkpoint.
  why_it_matters: >
    A parent who has just spent twenty minutes writing about their child's seizure
    protocol, or the paragraph about what should never be changed, is told they have
    added "notes". The word is accurate and cold, and it lands at precisely the moments
    the site is otherwise using to encourage — the resume card, the review header, the
    empty state. The site's own emotional register everywhere else is markedly warmer
    and better ("A letter with three sections filled in is already worth more to a
    future caregiver than the perfect letter that never got written"). This is the one
    place the clinical voice leaks through, and it leaks into the progress counter,
    which is the most-repeated string in the product.
  standard_reference: >
    Not a conformance issue. plainlanguage.gov "Use the right tone for your audience";
    the site's own established register is the standard it is failing against.
  recommendation: >
    Replace "sections have notes" with "sections started" / "sections you've written",
    and rename the repeater field to "Anything else about this person". See Rewrite 9.
  scope: current
  privacy_impact: none
  cost_and_maintenance: five strings plus one field label; the field label is a schema key change only if renamed at the id level — recommend changing the LABEL only, not the id
  effort: S
  risk_of_change: >
    Low if only labels change. Do NOT change the field `id` — that is a persistence
    key and renaming it would orphan existing saved answers and existing backup files.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A5-010
  title: "Fortnight" — a non-US word, in a US tool, contradicted by the example directly beneath it
  category: comprehension / register
  what_i_observed: >
    The general path's "For whoever steps in" section asks "What the first week should
    look like", with help text "In order. What to do on day one, who to call, and what
    can safely wait a fortnight." The worked example immediately below it says
    "Everything financial can wait two weeks." Same concept, two words, one of which is
    not American English.
  evidence:
    type: code
    detail: >
      src/lib/content/sections/general/12-stepping-in.ts:20 (help) and :25 (example).
      Detected by audit/tools/copy-lint.mjs; full output audit/evidence/copy-lint.json.
      It was one of only two register hits across the entire codebase — the copy is
      otherwise clean.
      Context: src/config/firm.ts:79 licensedStates ["Virginia"]; the audience is US.
  confidence: INSPECTED
  who_is_affected: US readers unfamiliar with the term, and ESL readers.
  why_it_matters: >
    Small, but free to fix, and it is inconsistent with the sentence three lines below
    it. Every unfamiliar word in help text is a moment the reader stops writing and
    starts decoding — and this section's whole premise is that the reader is already
    overwhelmed.
  standard_reference: plainlanguage.gov "Use simple words and phrases" / "Use words your audience knows"
  recommendation: '"...and what can safely wait two weeks." (matches the example verbatim)'
  scope: current
  privacy_impact: none
  cost_and_maintenance: one word
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both

- id: A5-011
  title: The privacy page makes one claim that is literally false and easy to falsify
  category: trust language / accuracy
  what_i_observed: >
    The section 04 callout reads "Nothing you type into any field is captured, by us or
    by anyone else through this site. The words stay in this browser's own storage, and
    no script on this page reads them, sends them, or records your screen." The clause
    "no script on this page reads them" is not true: the application's own JavaScript
    reads every keystroke — that is how it saves to local storage, derives the emergency
    sheet, and builds the PDF. The intended and defensible meaning is that no script
    SENDS them, and no third-party script touches them.
  evidence:
    type: content + code
    detail: >
      Exact current text, src/app/privacy/page.tsx:236-245:
        "What it never sees is the letter. Nothing you type into any field is captured,
        by us or by anyone else through this site. The words stay in this browser's own
        storage, and no script on this page reads them, sends them, or records your
        screen. Analytics counts that a page was opened, never what was written on it."
      Contradicted by the tool's own architecture: src/lib/store.ts persists via zustand
      to localStorage on change; src/lib/pdf/generate.tsx reads the full letter to render
      the PDF. Both are first-party scripts on the page that read what the user typed.
      I did NOT find any evidence of leakage — the surrounding claims appear sound, and
      the canary-seeded production capture exists in audit/evidence/network/ for A7 to
      adjudicate definitively. This is a wording defect, not a privacy defect.
  confidence: INSPECTED
  who_is_affected: >
    Technically literate readers, which for this site specifically includes the special
    needs trust attorneys who vet the tool before referring families, and any
    security-minded parent who opens devtools — which the same page explicitly invites
    them to do two sections earlier.
  why_it_matters: >
    The page's persuasive strategy is verifiability: section 01 says "You can confirm
    this yourself: open your browser's developer tools, go to the network tab, and type
    into the letter." That is an excellent move and the claim it makes is true. But a
    reader who takes up that invitation and then reads "no script on this page reads
    them" can falsify that sentence in ten seconds. One overclaim adjacent to several
    true claims discounts all of them. The fix strengthens the page — the true version
    is more impressive than the false one.
  standard_reference: >
    Owner's canonical promise ("Everything you type stays on your device") — this claim
    exceeds it. plainlanguage.gov "Be accurate".
  recommendation: See Rewrite 10 — states the stronger, true claim.
  scope: current
  privacy_impact: >
    None in the operative sense: no data movement changes. It brings a written claim
    into line with actual behaviour, which is the direction the governing hierarchy
    requires.
  cost_and_maintenance: one sentence
  effort: S
  risk_of_change: none
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 3
  environment: both

- id: A5-012
  title: The promise says "device"; the storage is per-browser, and the site says both
  category: trust language / precision
  what_i_observed: >
    The persistent privacy strip on every page says "Everything you type stays on your
    device and is never sent anywhere." The footer says "nothing you type ever leaves
    your device." But the actual scope is a single browser profile on that device, and
    the site says so elsewhere: the home page says "it saves in THIS browser only",
    /your-data says "If this browser's data is ever cleared", and the privacy page says
    "stored in your browser, on this device". Counts across copy: "this device" 22,
    "your device" 9, "this browser" 4, "your browser" 4.
  evidence:
    type: measurement + content
    detail: >
      audit/evidence/terminology.json, concepts["Where the data is"].
      Device framing: src/components/chrome/PrivacyStrip.tsx:22-23; src/components/chrome/SiteFooter.tsx:122-123.
      Browser framing: src/app/page.tsx:42-44 "No account and no login, so it saves in
      <em>this</em> browser only: download a backup file to switch devices";
      src/components/data/DataControls.tsx:168-169 "If this browser's data is ever
      cleared, the backup is how you get everything back"; src/app/privacy/page.tsx:145-149.
  confidence: INSPECTED
  who_is_affected: >
    Anyone who uses more than one browser, and anyone on a shared or family computer.
  why_it_matters: >
    The imprecision runs in the direction that costs a family their work. A parent who
    reads "stays on your device", writes half a letter in Safari, then opens the site
    in Chrome on the same laptop, finds nothing and reasonably concludes the tool lost
    it. There is no account and no recovery, so the misunderstanding is unrecoverable
    unless they happened to download a backup. The site's longer-form copy is correct
    and even elegant about this; it is the one-line shorthand — the line repeated on
    every page — that is loose.
    I am NOT recommending changing the canonical promise. "Everything you type stays on
    your device" is true and is the owner's ruling. The fix is to add the browser
    qualifier where the consequence bites, not to reword the promise.
  standard_reference: >
    plainlanguage.gov "Be accurate"; the owner's canonical promise, which this does not
    contradict but does under-specify.
  recommendation: >
    Leave the strip and the promise alone. Make the browser scope explicit at the two
    moments it has consequences — first entry to the wizard, and the backup card.
    See Rewrite 11.
  scope: current
  privacy_impact: >
    None — no behaviour change. This makes an existing true statement more precise.
    It does not weaken the canonical promise; it narrows it to what is actually
    guaranteed, which is the safer direction.
  cost_and_maintenance: two or three strings
  effort: S
  risk_of_change: >
    Low, with one genuine tension: adding "in this browser" to prominent copy makes the
    promise sound smaller. I judge the trade worth it because the failure mode is
    silent, total, and unrecoverable. The owner may reasonably disagree for the strip;
    I would not accept that trade for the backup card.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A5-013
  title: "Power of attorney" is the only term in its own sentence not given a plain-language gloss
  category: comprehension / jargon
  what_i_observed: >
    The legal-and-advocacy section's help text reads "Is there a guardianship or
    conservatorship (a court gave someone authority)? A power of attorney? A supported
    decision-making agreement ({name} keeps authority, with named helpers)? Who holds
    each role — and where are the papers?" Two of the three legal arrangements get a
    parenthetical gloss. The middle one does not. Separately, "waiver" (and "DD waiver",
    "CCC Plus") appear in help and placeholder text with no explanation, and "OT" and
    "day program" appear undefined.
  evidence:
    type: measurement + code
    detail: >
      audit/tools/acronyms.mjs, results in audit/evidence/acronyms.json; every flag
      hand-verified because the tool's gloss detection produced false positives on
      ABLE, AAC, IEP, representative payee, special needs trust and supported
      decision-making (all of which ARE defined).
      Verbatim source, src/lib/content/sections/12-legal-advocacy.ts:19.
      Waiver: src/lib/content/sections/06-medical.ts:96 "Virginia Medicaid — CCC Plus
      waiver."; src/lib/content/sections/10-benefits-finances.ts:26 "any waiver programs",
      :27 "on the DD waiver waitlist since 2021".
      OT: src/lib/content/sections/06-medical.ts:81. Day program: 08-education-work.ts:18.
  confidence: MEASURED
  who_is_affected: >
    Grandparents and siblings newly taking over, who have not spent years inside
    disability services. A parent who has been in the system for a decade knows all of
    these words; the successor caregiver often does not, and the successor is
    increasingly the person filling this in.
  why_it_matters: >
    Lower stakes than A5-003 because these appear deep in the letter rather than at the
    entry point, and because the fields remain optional and skippable. Raising it chiefly
    because the site has such a clear and well-executed standard for this — the gloss in
    the same sentence — that these read as oversights rather than decisions, and the
    fix is mechanical.
    "Waiver" is the most consequential of the group: it is unglossed in two sections,
    it is unguessable from context, and it names the thing many families' entire
    benefits picture depends on.
  standard_reference: plainlanguage.gov "Avoid jargon" / "Define your terms"
  recommendation: See Rewrite 12. Leave Medicaid, Medicare, ER and CPAP alone.
  scope: current
  privacy_impact: none
  cost_and_maintenance: four string edits
  effort: S
  risk_of_change: >
    Low, but each gloss lengthens help text that is already the densest on the site —
    legal-and-advocacy is one of only two routes above Gunning Fog 10 (10.67). Rewrite
    12 is written to add clarity without adding length, by trading a word elsewhere.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A5-014
  title: Meta descriptions run 171–206 characters, truncating the privacy promise out of search results
  category: content / discoverability
  what_i_observed: >
    Five of nine sampled routes serve descriptions over the ~160-character point at
    which search engines truncate: "/" and the three wizard/review routes that inherit
    it at 206 characters, "/privacy" at 194, and the sample letter route at 171. On the
    home page the text that falls past the cut is "Everything stays on your device" —
    the site's single strongest differentiator and the thing a privacy-anxious searcher
    is scanning for.
  evidence:
    type: network
    detail: >
      audit/evidence/metadata.json, production fetch 2026-08-09. Lengths computed in
      audit/tools/meta-check.mjs. Home description 206 chars; the ~160-char cut lands
      mid-phrase at "...plus a one-page..." leaving the privacy claim unrendered.
  confidence: MEASURED
  who_is_affected: Anyone finding the tool through search — per ReviewScreen's own copy, "Most families find this tool by searching."
  why_it_matters: >
    Governed at rank 5 (growth), so this is the lowest-priority category here. It is
    worth fixing only because the specific text being cut is the privacy promise, which
    makes it incidentally a trust-communication issue too. Cheap to fix alongside
    A5-002 and A5-007, which touch the same two strings.
  standard_reference: Search engine display conventions (~155–160 chars). Not a formal standard.
  recommendation: Rewrites 2 and 7 are both written to fit under 160 characters with the privacy promise inside the cut.
  scope: current
  privacy_impact: none
  cost_and_maintenance: two constants
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 1
  environment: both

- id: A5-015
  title: The download filename discloses disability, in a file whose own code comment forbids disclosure
  category: trust language / privacy-adjacent
  what_i_observed: >
    Generated files are named "Letter-of-Intent-Disabilities-2026-08-09.pdf" and
    "Letter-of-Intent-Disabilities-Backup-2026-08-09.json". The module that produces
    them states its own rationale: the name "never says *who* it is about" because
    "a filename carrying 'Letter-of-Intent-Alex' discloses a disability to anyone who
    glances at the screen." The chosen name does not disclose who, but it does disclose
    the category — to the same glancing observer, the same shared folder, the same
    screen reader in the same open-plan office the comment describes.
  evidence:
    type: code
    detail: >
      src/lib/filenames.ts:14-18 (the stated rule) and :23-26 (PATH_LABEL mapping
      "special-needs" -> "Disabilities"), :44 and :50 (the templates).
      Confirmed against real output: audit/evidence/pdfs/ contains
      minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf and
      typical--Letter-of-Intent-Disabilities-Backup-2026-08-09.json.
      Note the emergency sheet is already exempt (line 47-48) and is named
      "Emergency-Information-Sheet-{date}.pdf" with no path qualifier.
  confidence: INSPECTED
  who_is_affected: >
    Families who email the PDF to a school or employer, sync it to a shared cloud
    drive, or open it on a work laptop. Also anyone who has not disclosed a family
    member's disability in a given context and does not intend to.
  why_it_matters: >
    Modest harm — it reveals a category, not an identity, and the family chose to
    generate it. Raising it because the inconsistency is internal and explicit: the
    file argues for a privacy principle in its own comment and then does not apply it
    to the one token it does control. Under the governing hierarchy privacy outranks
    everything, so an internal contradiction on a privacy rationale is worth surfacing
    even when the magnitude is small.
    Honest counterweight: the qualifier exists so a family running both letters can
    tell two backups apart, which is a real need. A neutral token would harm usability.
  standard_reference: The module's own stated rule, src/lib/filenames.ts:14-18.
  recommendation: >
    Split the two cases. The PDF is the file that travels and gets glanced at — drop
    the qualifier there. The .json backup stays with the family and is the one that
    needs disambiguating — keep it. See Rewrite 13.
  scope: current
  privacy_impact: >
    Strictly reduces disclosure. No data movement changes; nothing leaves the device
    that did not before. The only trade is that a family running both letters sees two
    PDFs distinguished by date rather than by set — mitigated by keeping the qualifier
    on the backup, which is the file they actually manage.
  cost_and_maintenance: one function; note that changing filenames does not affect restore, which reads file CONTENT not name (src/lib/backup.ts parseBackup)
  effort: S
  risk_of_change: >
    Low. Verified that restore does not depend on the filename — RestoreFlow parses
    content and infers the path from the sections present. One user-visible knock-on:
    the error copy in RestoreFlow.tsx:54 cites an example filename and would need to
    match.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A5-016
  title: "Local storage" and "IndexedDB" are named to a reader defined as not knowing what "client-side" means
  category: comprehension / trust language
  what_i_observed: >
    The privacy page's first substantive sentence is "Everything you type is stored in
    your browser, on this device, in features called local storage and IndexedDB."
    Neither is explained. The framing "in features called X and Y" does signal that
    these are just names, which is a reasonable handling — but the page's stated
    purpose is "One page, no legalese", and these are the only two unexplained
    technical terms on it.
  evidence:
    type: content + code
    detail: >
      Exact text, src/app/privacy/page.tsx:145-149. Flagged by audit/tools/copy-lint.mjs
      as the only user-facing undefined-tech-term hit on the site
      (the other two hits are in code, not copy). Full output audit/evidence/copy-lint.json.
      The page's own promise, src/app/privacy/page.tsx:80: "One page, no legalese."
  confidence: INSPECTED
  who_is_affected: >
    Exactly the reader the brief specifies: someone who does not know what "client-side"
    means and needs the privacy promise to be understandable anyway.
  why_it_matters: >
    Low harm — the sentence survives being skimmed, and naming the mechanism is what
    makes the claim checkable, which is the page's best quality. Reporting it because
    a five-word gloss converts two opaque nouns into a reassurance, at no cost to the
    verifiability that makes the page work.
  standard_reference: plainlanguage.gov "Avoid jargon" / "Define your terms"
  recommendation: See Rewrite 14.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one sentence
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both

- id: A5-017
  title: The one error message that does not meet the standard set by all the others
  category: error messaging
  what_i_observed: >
    Every failure path on this site says what happened, reassures, and says what to do
    next — except one. When deletion does not fully clear, the message is "Something
    didn't clear. Please also clear this site's data in your browser settings." It does
    not say what remains, does not say how to reach browser settings, and "something"
    is exactly the vagueness the site's other messages avoid.
  evidence:
    type: code
    detail: >
      src/components/data/DataControls.tsx:131-134. Compare the standard set elsewhere
      in the same codebase — src/components/data/RestoreFlow.tsx:38-42: "Sorry — that
      file could not be read. A backup from this tool is a .json file; a PDF or a
      document from another program will not open here. Nothing on this device was
      changed." That message names the cause, the constraint, and the reassurance.
      Also compare the graceful PDF failure, ReviewScreen.tsx:82-85, which offers a
      working fallback ("use your browser's Print button").
      Detected by audit/tools/copy-lint.mjs "vague error" rule; it was the only copy hit.
  confidence: INSPECTED
  who_is_affected: >
    A user deliberately erasing their data — very plausibly on a shared or library
    computer, i.e. the person with the strongest reason to need certainty.
  why_it_matters: >
    The user asked for certainty about deletion and received ambiguity. On a shared
    machine that is the difference between leaving and not leaving. The success path
    of this same function is exemplary — "Deleted. We checked: this device now holds
    nothing from this tool." — which makes the failure path's vagueness more jarring,
    not less.
  standard_reference: plainlanguage.gov error-message guidance; WCAG 2.2 SC 3.3.3 Error Suggestion.
  recommendation: See Rewrite 15.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one string
  effort: S
  risk_of_change: none
  mission_impact: 2
  reach: 1
  harm_if_unfixed: 3
  environment: both

- id: A5-018
  title: The only worked example for family traditions is a Christmas one
  category: register / inclusion
  what_i_observed: >
    The "Holidays and family traditions" field's sole example is "Christmas Eve is
    pajamas, one gift, and The Muppet Christmas Carol — the DVD, not streaming, because
    the menu music is part of it. Her birthday cake is yellow with chocolate frosting
    from the box. Never bakery. She checks." The field it illustrates is carefully
    non-presumptive ("Congregation, practices, holidays, dietary rules"), as is the
    faith field beside it.
  evidence:
    type: code
    detail: >
      src/lib/content/sections/11-social-faith.ts:41-44 (the example) and :32-33 (the
      faith field, which is correctly written: "Congregation, practices, holidays,
      dietary rules — and who from that community knows and loves {name}.").
      This was NOT caught by audit/tools/copy-lint.mjs — the presumptive-language rule
      found zero hits sitewide. I found it by reading.
  confidence: INSPECTED
  who_is_affected: Jewish, Muslim, Hindu, and non-religious families, among others.
  why_it_matters: >
    Genuinely minor, and I want to be honest about that rather than inflate it. The
    field labels do the inclusive work correctly; the example is one family's specifics
    and is explicitly framed as one family's specifics ("a sample answer, to show the
    level of detail. Yours can be shorter"). The example is also very good writing — the
    DVD detail is exactly the kind of thing the tool exists to capture, and I would not
    trade that specificity for a bland multi-faith example.
    The cheap fix is the second sentence, which is already faith-neutral: leading with
    the birthday-cake detail and keeping Christmas as the follow-on costs nothing.
  standard_reference: plainlanguage.gov "Write for your audience"; general inclusive-content practice.
  recommendation: >
    Reorder so the faith-neutral detail leads. See Rewrite 16. Do not remove the
    Christmas detail — specificity is the point of the example.
  scope: current
  privacy_impact: none
  cost_and_maintenance: one string
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both

- id: A5-019
  title: Sample page titles stack four em-dash segments
  category: content / metadata
  what_i_observed: >
    Production serves the title "Sample — Emergency information sheet — for a loved one
    with disabilities — Letter of Intent Builder": four segments, three em dashes, 98
    characters. Read aloud by a screen reader or shown in a browser tab, the useful
    words arrive last.
  evidence:
    type: network
    detail: >
      audit/evidence/metadata.json, production fetch. Both sample routes affected.
      Produced by the layout template `%s — Letter of Intent Builder`
      (src/app/layout.tsx:49) composed with a per-doc title that already contains
      "Sample — ... — ...".
  confidence: MEASURED
  who_is_affected: Screen reader users, tab-switchers, and anyone scanning search results.
  why_it_matters: Small. Reported for completeness because it was measured, not because it is urgent.
  standard_reference: plainlanguage.gov "Be concise"; WCAG 2.2 SC 2.4.2 Page Titled (a title should be descriptive, which a four-part stack undermines).
  recommendation: 'Shorten the per-doc title to "Sample emergency sheet — for a loved one with disabilities" so the template adds the only remaining dash.'
  scope: current
  privacy_impact: none
  cost_and_maintenance: two strings in src/lib/content/samples.ts
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both
```

---

## WHAT IS ALREADY RIGHT (and should not be "improved")

Stated explicitly because a list of nineteen findings misrepresents this site, and
because several of these are the kind of thing a later reviewer might "fix" and make
worse.

1. **The error messages are the best I have audited.** RestoreFlow's four failure
   branches each name the cause, state a constraint, and reassure that nothing was
   lost — "Nothing on this device was changed, so your current letter is safe. If you
   have another copy of the file, try that one." (`RestoreFlow.tsx:44-49`). Do not
   shorten these.
2. **The emergency sheet's empty state is safety-critical and correct.** "None
   recorded — confirm with family." (verified in the generated minimal PDF). It tells
   a clinician the absence is *unknown*, not *negative*. This is the single best line
   of copy in the product.
3. **The emotional gate before Final wishes** (`SectionScreen.tsx:116-140`) resolves
   what would otherwise be a serious ambiguity, and does it with unusual grace: "Some
   families find it a relief to write these things down. Others aren't ready — and
   some choose to leave them out entirely. All of those are right."
4. **The behavior section's framing.** "You are not betraying {name} by writing this.
   You are handing someone the manual you had to learn the hard way."
5. **The police/first-responder guidance**, and its example: "that is fear, not
   defiance." This is content that can prevent a fatal misreading.
6. **Format hints never blame.** "This doesn't look like a full email address yet —
   worth a quick check." (`validation.ts:23-25`) — and they never block saving.
7. **The example footnote.** "— a sample answer, to show the level of detail. Yours
   can be shorter." Directly defuses the performance anxiety that stops people writing.
8. **The PDF's letter to the reader**, ending "Thank you for caring for {name}."
9. **Zero pity, inspiration, or infantilising language sitewide** — measured, not
   assumed (`copy-lint.mjs`, 0 hits across 9 register rules over 90 files). Person-first
   language is used consistently; "special needs" appears almost exclusively inside the
   fixed legal term "special needs trust", and the audience-facing tab leads with
   "Disability".
10. **The legal disclaimers are already plain** (FK 7.6–9.1 where legal boilerplate
    typically scores 15–18). Leave them.

---

## REWRITES — current vs proposed, ready to paste

### Rewrite 1 — A5-001, the PDF navigation bullets
`src/lib/pdf/loi-document.tsx:239-246`

**Current** (unconditional, branches only on `path`):
```
If you are new to {name}, start with "A typical day" and "Communication." They
will carry you through the first week.

In a crisis, go straight to "Medical" and "Behavioral support." There is also a
separate one-page emergency sheet that pairs with this letter — keep copies where
sitters, school, and the ER can grab them.
```

**Proposed** — build from `included` (already computed at line 231). Name only
sections present; drop a bullet when it has no targets; add an honesty bullet when
the letter is thin:

| Condition | Bullet |
|---|---|
| ≥1 of the orientation sections present | `If you are new to {name}, start with {list of those present}. They will carry you through the first week.` |
| ≥1 of the crisis sections present | `In a crisis, go straight to {list of those present}. There is also a separate one-page emergency sheet that pairs with this letter — keep copies where sitters, school, and the ER can grab them.` |
| none of the crisis sections present | `This letter does not yet cover medical or behavioral detail. In an emergency, ask the family directly — and use the one-page emergency sheet that pairs with this letter.` |
| `included.length <= 2` | `This is an early draft — it covers {n} section{s} so far. What is here was written deliberately; what is missing has not been answered yet, so do not read an empty topic as "nothing to report."` |

**Reason:** the last row is the important one. Without it, a reader cannot tell a
deliberate omission from an unanswered question — and on a partial letter that
distinction is the difference between "no allergies" and "allergies unknown". This
mirrors the emergency sheet's already-correct "None recorded — confirm with family."

---

### Rewrite 2 — A5-002, the broken privacy description
`src/app/privacy/page.tsx:9-12`

**Current** (194 chars, contains an orphaned fragment):
> Everything you type stays on your device. No account, and nothing you write is ever captured — we count page visits and nothing else. of any kind. Here is exactly how that works, in plain words.

**Proposed** (156 chars):
> Everything you type stays on your device. No account, and nothing you write is ever captured — we count page visits, nothing more. Here is exactly how.

**Reason:** removes the orphaned "of any kind."; fits inside the search snippet so
the promise survives truncation; keeps the page's own plain register.

---

### Rewrite 3 — A5-003, defining "trustee"

**3a.** `src/app/page.tsx:91-93`
- Current: "A Letter of Intent is the guide a future caregiver, trustee, or guardian will rely on to care well for the person you love"
- Proposed: "A Letter of Intent is the guide a future caregiver, guardian, or trustee — the person who will manage money set aside for them — will rely on to care well for the person you love"

**3b.** `src/lib/content/paths.ts:42-46` — keep the promise line short, gloss in the blurb.
- Current promise: "The letter a trustee will read." *(unchanged)*
- Current blurb: "For families with a special needs trust. It carries what no attorney can draft for you: how your child communicates, what calms them, which doctor to call, and what the trustee needs to know."
- Proposed blurb: "For families with a special needs trust. It carries what no attorney can draft for you: how your child communicates, what calms them, which doctor to call, and what the trustee — whoever manages that trust money — needs to know."

**3c.** `src/lib/content/sections/01-getting-started.ts:11-13`
- Current: "everything a future caregiver, trustee, or guardian would need to know but could never guess"
- Proposed: "everything a future caregiver, guardian, or trustee (whoever manages money left for them) would need to know but could never guess"

**Reason:** a five-word appositive at the three first uses, matching the site's own
existing pattern (`SSI is a monthly check for…`). No glossary page, no new UI.

---

### Rewrite 4 — A5-004, the not-yet-available email reminder
`src/components/review/ReminderPanel.tsx`

| Element | Current | Proposed |
|---|---|---|
| Eyebrow | `Option two · not switched on yet` | `Option two · coming later` |
| Heading | `Let us remind you` | `An email reminder, one day` |
| Body | "One day Trusts & Wealth will send a single email… **That service is not running yet**, so for now please use the calendar reminder beside this." | "One day Trusts & Wealth will send a single email, one year from today, reminding you to update your documents. One email, not a newsletter. **We have not built it yet, so there is nothing to sign up for.** Use the calendar reminder beside this — it works today." |
| Field | live `<input type="email" autoComplete="email">` | **remove the field entirely** |
| Button | `Send me the reminder` (gold when valid) | **remove**; replace with the note below |
| Note | `When it does run, the only thing sent will be your email address…` | "When we build it, this page will say so first — and the only thing that would ever be sent is your email address, never a word of your letter." |

**Reason:** a control must not offer what it cannot do. Removing the field is
better than disabling it: a disabled email box still reads as "sign up here, later",
and it is the one place the site invites personal data it does not need. Keeping the
panel preserves the roadmap signal.

---

### Rewrite 5 — A5-005, one vocabulary for backup

Canonical: the noun is **backup file**; the verbs are **download** and **load**.
"Export" is retired from copy.

| Location | Current | Proposed |
|---|---|---|
| `DataControls.tsx:156-157` | eyebrow "Keep a copy" / title "Download a backup" | eyebrow "Keep a copy" / title "Download your backup file" |
| `DataControls.tsx:161` | button "Download backup file" | "Download backup file" *(unchanged — this is the canonical form)* |
| `DataControls.tsx:216-218` | eyebrow "Continue elsewhere" / title "Load a backup" | eyebrow "Continue elsewhere" / title "Load a backup file" |
| `RestoreFlow.tsx:177` | button "Choose a backup file…" | "Choose a backup file…" *(unchanged)* |
| `ReviewScreen.tsx:168` | "Your backup file (.json)" | *(unchanged — canonical)* |
| `DataControls.tsx:186` | title "Download the documents" | "Download the two documents" |
| `ReviewScreen.tsx:470` | "Either way, keep your backup file." | *(unchanged)* |
| everywhere | bare "backup" as a noun | "backup file" |
| everywhere | "export" | "download" |

**Reason:** one name for the thing, one name for each direction it moves. The
distinction between the *backup file* (for the builder) and the *documents* (for
people) is already well drawn in the copy — this just stops the words drifting.

---

### Rewrite 6 — A5-006, separating deliberate deletion from accidental loss

**Rule:** "delete" only for what the user chooses to do here. "cleared" / "lost"
only for what a browser or cleanup tool does to them.

| Location | Current | Proposed |
|---|---|---|
| `DataControls.tsx:237` | eyebrow "Erase" | "Delete" |
| `DataControls.tsx:246` | "Erases everything this tool has stored on this device" | "Deletes everything this tool has stored on this device" |
| `privacy/page.tsx:177` | heading "Clearing browser data erases it" | "If your browser data is cleared, the letter is lost" |
| `privacy/page.tsx:180` | "If you or a cleanup tool clear this site's data, the letter is gone." | "If you or a cleanup tool clears this site's data, the letter is lost — and we have no copy." |
| `DataControls.tsx:168` | "If this browser's data is ever cleared, the backup is how you get everything back." | *(unchanged — correct already)* |

**Reason:** the user's response to the two events is opposite. One is a button they
should be able to press with confidence; the other is a risk they must be warned
about. They should not share a verb.

---

### Rewrite 7 — A5-007 + A5-014, the site-wide description
`src/app/layout.tsx:38-41`

**Current** (206 chars, names one audience):
> A free, private tool that guides parents of a person with disabilities through writing a Letter of Intent — and turns it into a polished PDF plus a one-page emergency sheet. Everything stays on your device.

**Proposed** (158 chars):
> A free, private tool for writing down what a future caregiver needs to know about someone you care for. Two documents at the end. Nothing leaves your device.

**Reason:** covers both paths and all named audiences (parents, siblings,
grandparents, professional caregivers); fits inside the search snippet with the
privacy promise *inside* the cut; still reads as an invitation standing alone, which
it must because Facebook and LinkedIn show it in place of the share message
(`src/lib/share.ts:8-10`).

---

### Rewrite 8 — A5-008, the header CTA
`src/components/chrome/SiteHeader.tsx:95-101` and `139-146`

| State | Current | Proposed |
|---|---|---|
| No letter yet, or pre-hydration | `Start your letter · it's free` | *(unchanged)* |
| Letter in progress | `Start your letter · it's free` → `/letter` | `Continue your letter` → `/letter/{lastVisitedSlug}` |

Zero-risk alternative if the owner prefers to avoid hydration-dependent chrome:
label it `Your letter` in both states.

**Reason:** the label must not offer to start something the user is already doing,
on a site with no undo. Keep "Start your letter" as the pre-hydration default so
there is no flash — the pattern `ResumeCard.tsx:21` already uses.

---

### Rewrite 9 — A5-009, retiring "notes" as the word for the user's work

| Location | Current | Proposed |
|---|---|---|
| `ResumeCard.tsx:34` | "You've added notes to 3 of 15 sections of the …letter." | "You've written 3 of the 15 sections of the …letter." |
| `ReviewScreen.tsx:95` | "Nothing to review yet — your letter doesn't have any notes so far." | "Nothing to review yet — you haven't written a section yet." |
| `ReviewScreen.tsx:120` | "3 of 15 sections have notes so far, which is already worth printing." | "You've written 3 of 15 sections, which is already worth printing." |
| `DataControls.tsx:166` | "(3 of 15 sections have notes)" | "(3 of 15 sections written)" |
| `RestoreFlow.tsx:63` | "Backup loaded — 7 of 15 sections have notes." | "Backup loaded — 7 of 15 sections written." |
| `ReviewScreen.tsx:543` | heading "Sections without notes yet" | "Sections you haven't written yet" |
| `03-family-support.ts:46` | field label "Notes" | "Anything else about this person" |

**Do not change the field `id`** (`notes`) — it is a persistence key, and renaming
it would orphan existing saved answers and every backup file already downloaded.
Label only.

**Reason:** "notes" is cold at the exact moments the site is otherwise using to
encourage, it is the most-repeated string in the product, and it collides with a
field label. "Written" matches the register the rest of the site earns.

---

### Rewrite 10 — A5-011, the privacy overclaim
`src/app/privacy/page.tsx:236-245`

**Current:**
> What it never sees is the letter. **Nothing you type into any field is captured**, by us or by anyone else through this site. The words stay in this browser's own storage, and **no script on this page reads them, sends them, or records your screen**. Analytics counts that a page was opened, never what was written on it.

**Proposed:**
> What it never sees is the letter. **Nothing you type into any field is ever sent anywhere**, by us or by anyone else through this site. The only code that touches your words is the builder itself, running in this browser, and all it does is save them here and turn them into your documents. **No third-party script can read them, and nothing records your screen.** Analytics counts that a page was opened, never what was written on it.

**Reason:** the current sentence is falsifiable in ten seconds by a reader the page
itself invited to open devtools two sections earlier. The proposed version is both
true and more reassuring, because it names what the first-party code does and why —
"save them here and turn them into your documents" — rather than denying that any
code runs at all.

---

### Rewrite 11 — A5-012, browser scope where it has consequences

Leave the strip (`PrivacyStrip.tsx:22-23`), the footer, and the canonical promise
**unchanged**. Add the qualifier at the two points of consequence only.

| Location | Current | Proposed |
|---|---|---|
| `letter/page.tsx:46-48` | "It saves as you go, on this device only. About 45–90 minutes in total, in as many sittings as you need." | "It saves as you go, in this browser on this device — so it will not appear in a different browser unless you move it there with a backup file. About 45–90 minutes in total, in as many sittings as you need." |
| `DataControls.tsx:172-175` | "**There is no account**, so there is nothing for us to restore for you. This file is the only copy that outlives this browser." | "**There is no account**, so there is nothing for us to restore for you. Your letter lives in this one browser on this one device; this file is the only copy that outlives it." |

**Reason:** the failure mode — write in Safari, open in Chrome, find nothing — is
silent, total and unrecoverable. Precision belongs where the consequence is, not in
the one-line shorthand repeated on every page.

---

### Rewrite 12 — A5-013, the remaining undefined terms

| Location | Current | Proposed |
|---|---|---|
| `12-legal-advocacy.ts:19` | "Is there a guardianship or conservatorship (a court gave someone authority)? A power of attorney? A supported decision-making agreement ({name} keeps authority, with named helpers)? Who holds each role — and where are the papers?" | "Is there a guardianship or conservatorship (a court gave someone authority)? A power of attorney ({name} signed the authority over)? A supported decision-making agreement ({name} keeps authority, with named helpers)? Who holds each role — and where are the papers?" |
| `10-benefits-finances.ts:26` | "…Add Medicaid, Medicare, and any waiver programs." | "…Add Medicaid, Medicare, and any waiver programs (a waiver pays for support at home instead of in an institution)." |
| `06-medical.ts:81` | "e.g., Speech on Tuesdays at 4 with Ms. Kim; OT every other Friday" | "e.g., Speech on Tuesdays at 4 with Ms. Kim; occupational therapy every other Friday" |
| `08-education-work.ts:18` | label "Current school or day program" | *(unchanged)*; add help: "A day program is where many adults spend weekdays after school ends — activities, work training, or support." |

**Reason:** each is one parenthetical, in the pattern the site already uses well.
The power-of-attorney gloss costs six words and removes an inconsistency inside a
single sentence. Note `legal-and-advocacy` is one of only two routes above Gunning
Fog 10, so the gloss there is deliberately the shortest of the four.

---

### Rewrite 13 — A5-015, filenames
`src/lib/filenames.ts:42-51`

| File | Current | Proposed |
|---|---|---|
| Letter PDF | `Letter-of-Intent-Disabilities-2026-08-09.pdf` | `Letter-of-Intent-2026-08-09.pdf` |
| Emergency PDF | `Emergency-Information-Sheet-2026-08-09.pdf` | *(unchanged — already correct)* |
| Backup JSON | `Letter-of-Intent-Disabilities-Backup-2026-08-09.json` | *(unchanged — the family manages this one and needs to tell two apart)* |

Also update the example filename in `RestoreFlow.tsx:54` so the error copy still
matches a real name.

**Reason:** the PDF is the file that travels, gets emailed to a school, and lands in
shared folders — the exact scenario `filenames.ts:14-18` warns about. The backup
stays with the family, so the disambiguating token keeps its value where the risk is
lowest. Restore is unaffected: `parseBackup` reads content, not filename.

---

### Rewrite 14 — A5-016, glossing the storage mechanism
`src/app/privacy/page.tsx:145-149`

**Current:**
> Everything you type is stored in your browser, on this device, in features called local storage and IndexedDB. It is never uploaded, transmitted, or synced by us.

**Proposed:**
> Everything you type is stored in your browser, on this device — in two places browsers set aside for exactly this, called local storage and IndexedDB. They are part of your browser, not somewhere on the internet. It is never uploaded, transmitted, or synced by us.

**Reason:** keeps the mechanism named (which is what makes the claim checkable) and
adds the one thing the non-technical reader needs: these are not remote servers.

---

### Rewrite 15 — A5-017, the deletion failure message
`src/components/data/DataControls.tsx:131-134`

**Current:**
> Something didn't clear. Please also clear this site's data in your browser settings.

**Proposed:**
> Most of it was deleted, but something is still stored here — probably because this browser is blocking changes to site data. To be certain nothing is left, clear this site's data in your browser settings (usually under Privacy, then "Cookies and site data"), or close this private window if you are in one.

**Reason:** matches the standard RestoreFlow already sets — says what happened, why
it probably happened, and exactly what to do. The person seeing this message is
plausibly on a library computer and needs certainty, not "something".

---

### Rewrite 16 — A5-018, the traditions example
`src/lib/content/sections/11-social-faith.ts:41-44`

**Current:**
> "Christmas Eve is pajamas, one gift, and The Muppet Christmas Carol — the DVD, not streaming, because the menu music is part of it. Her birthday cake is yellow with chocolate frosting from the box. Never bakery. She checks."

**Proposed:**
> "Her birthday cake is yellow with chocolate frosting, from the box. Never bakery — she checks. Christmas Eve is pajamas, one gift, and The Muppet Christmas Carol on DVD, not streaming, because the menu music is part of it."

**Reason:** the faith-neutral detail leads, so a family that does not celebrate
Christmas still sees itself in the first line. Keeps every specific — the specificity
is what makes the example work.

---

## WHAT I EXAMINED, AND WHAT I COULD NOT

### Examined
- Every user-facing string in `src/` — 90 files: all 25 section definitions across both
  paths, all page components, all chrome, all dialogs, all error and confirmation
  paths, all form labels/help/placeholder/example text, the share message set, the
  firm config, and both PDF documents.
- 30 live routes on the local dev server, prose extracted from the rendered DOM with
  disclosures force-opened so example text was included.
- 9 routes on **production** for title/description/H1 comparison against local.
- Generated PDF output at minimal and typical fill, text-extracted with pdfjs-dist
  from the shared evidence set.
- The legal disclaimers, scored separately from page prose.

### Could NOT examine, and why
- **The explainer video's spoken script.** Video captions are in scope per the brief
  and the video has no caption track, so there is no text to audit. Its script is
  therefore entirely unaudited content — I cannot tell you whether the words spoken
  match the site's register, define "trustee", or repeat the privacy promise
  accurately. **This is my largest coverage gap**, and it compounds A5-003: if the
  narration also uses "trustee" undefined, a deaf or hard-of-hearing user gets neither
  the word nor a definition. A transcript would close both the accessibility gap and
  this audit gap at once.
- **The `maximal` PDF** — I extracted minimal and typical only. Maximal is unlikely to
  change any finding (more content strictly helps A5-001) but I did not verify it.
- **The `/samples/*` routes' rendered prose.** I fetched their metadata from production
  successfully, but the route 404s on the local dev server under the slug I used, so
  their on-page copy is not in the readability corpus. The sample *viewer* chrome copy
  (`SampleViewer.tsx`) I read in source but did not score.
- **The `.ics` calendar file's user-visible text** — I read `ics.ts` in passing for the
  privacy claim but did not audit the event title/description as copy.
- **Real users.** Every readability number is a formula, not a comprehension test. No
  parent read any of this. Formulas cannot see that "trustee" is unknown to the
  reader — that finding comes from reading, not measuring, and it is the kind of thing
  five minutes of user testing would confirm or kill faster than any tool I wrote.
- **Whether GA4 receives anything typed.** Out of my lane (A7 owns it) and the
  canary-seeded capture exists for that purpose. I verified only that the *written
  claims* about analytics are internally consistent and that the email reminder
  genuinely has no endpoint.

### Deployment gap
**No copy-level gap.** Local and production returned byte-identical titles and
descriptions on all 9 sampled routes — including the broken `/privacy` description,
which is why A5-002 is `environment: both` and not a local-only defect. I did not
audit the home page's video section, which the brief flags as
locally-modified-but-undeployed.

**One correction to the stated build state, offered as an observation rather than a
finding.** The brief says two files are uncommitted (`src/app/page.tsx`,
`src/components/home/VideoPlayer.tsx`). `git status` at HEAD `d5ec230` shows **four**
modified files plus one untracked asset:

```
 M public/og-image.png
 M scripts/generate-og-image.mjs
 M src/app/page.tsx
 M src/components/home/VideoPlayer.tsx
?? public/social-logo.png
```

I read the diff of `scripts/generate-og-image.mjs` and it contains **no text
changes** — it swaps the source logo to a new dedicated `social-logo.png`, changes
the background from ivory `#fbfaf6` to white, and resizes the artwork. So this
does not affect any A5 finding, and I raise it only because it means the social
link preview in production is the older ivory image while local has the newer white
one. That is the same class of expected deployment gap as the video section, not a
defect. It is worth knowing alongside A5-007, since the OG image and the OG
description are shown together in a link preview and only one of them would change
on the next deploy.

---

## THREE HIGHEST-CONFIDENCE FINDINGS

1. **A5-001 — the PDF sends a crisis reader to sections that do not exist.**
   MEASURED. I extracted the text from a real generated PDF in the shared evidence
   set: the contents page lists one section, page 2 names four. The root cause is two
   lines of code and the correct data is already computed twelve lines above them.
2. **A5-002 — the privacy page's meta description is broken in production.**
   MEASURED. Fetched from `https://myletterofintent.com/privacy` and quoted verbatim;
   confirmed against the source string concatenation that produced it.
3. **A5-005 / A5-006 — the backup and deletion vocabularies.** MEASURED by a
   copy-only extraction across 90 files, with counts and co-located examples on a
   single screen. The numbers are not a matter of judgement; whether six names is too
   many is, and I think for an irreversible action it plainly is.

## THREE LEAST-CONFIDENT FINDINGS

1. **A5-018 — the Christmas example.** INSPECTED, and honestly borderline. My
   copy-lint found zero presumptive-language hits sitewide; I found this by reading
   and I am not certain it clears the bar. The example is *framed* as one family's
   specifics, and its specificity is exactly what makes it useful. A reasonable
   editor could decline this and be right. I would not spend the parent's goodwill on
   it if it competed with anything else.
2. **A5-012 — "device" vs "browser".** INSPECTED. I am confident about the technical
   fact and about the failure mode. I am *not* confident about the remedy: adding
   "in this browser" makes the promise sound smaller, and the owner has ruled on the
   canonical wording. I have scoped my rewrite to leave the promise alone precisely
   because I am unsure — but I may still be over-correcting.
3. **A5-008 — the header CTA.** MEASURED as to the fact (I read the header text on
   `/letter/medical`), INFERRED as to the harm. I have no evidence any user has
   misread "Start your letter" as "start over"; that is me reasoning about anxiety
   from the site's own framing, not an observation. The hydration-flash risk in my
   recommendation is also real, which is why I offered a zero-risk alternative.

Also worth flagging as INFERRED rather than measured: my claim in **A5-003** that
grandparents and siblings do not know what a trustee is. The *absence of a
definition* is a fact I verified across both paths. That the audience needs one is
an inference from the brief's description of who uses this site.

## WHAT WOULD MAKE ME MORE CERTAIN

1. **Five comprehension interviews**, at 15 minutes each, with people who have never
   seen the site: two grandparents, two adult siblings, one parent of a newly
   diagnosed child. Ask exactly three things — "what is a trustee?", "what would you
   do to make sure you don't lose this?", and "what does this promise about your
   privacy?" That would confirm or kill A5-003, A5-005 and A5-012 faster and more
   decisively than every tool I wrote, and those three are 60% of the value here.
2. **A transcript of the explainer video.** Closes my largest coverage gap and is
   required for the caption finding the brief put in scope regardless.
3. **A snapshot test over the generated PDF at the three fill levels**, asserting that
   every section named in "How to use this letter" appears in the contents. The
   evidence set already contains the three fixtures; this would have caught A5-001
   before it shipped and would keep it caught.
4. **A dictionary-backed syllable count** (CMUdict) to replace my heuristic. Current
   measured accuracy is 88.4% exact / MAE 0.116, which is good enough for the
   conclusions I drew — all of which turn on comparisons well inside the error bars —
   but would remove the caveat entirely.
5. **Confirmation from the owner on two judgement calls I could not make:** whether
   "trustee" is assumed knowledge for the intended referral audience (attorneys send
   families here, and those families may arrive already knowing the word), and whether
   the general/aging-care path is meant to be discoverable through search at all or is
   deliberately secondary. A5-003 and A5-007 both soften considerably if the answer to
   either is "yes, deliberate."

---

## TOOLS AND EVIDENCE PRODUCED

| Path | What it does |
|---|---|
| `audit/tools/readability.mjs` | Prose-only readability over 30 live routes; 4 formulas; publishes its own syllable-counter accuracy |
| `audit/tools/terminology.mjs` | Copy-only concept/variant counts across 90 source files |
| `audit/tools/acronyms.mjs` | Acronym and term-of-art first-use in reading order, per path |
| `audit/tools/copy-lint.mjs` | 12 plainlanguage.gov + register pattern rules |
| `audit/tools/meta-check.mjs` | Title/description/H1, local vs production |
| `audit/evidence/readability.json` | Per-route scores, fragment inventories, longest sentences, top complex words |
| `audit/evidence/terminology.json` | Full variant counts with per-file locations |
| `audit/evidence/acronyms.json` | Every term, first use, and definition status |
| `audit/evidence/copy-lint.json` | All rule hits with file:line and context |
| `audit/evidence/metadata.json` | Local vs production metadata, with detected problems |

All five tools are read-only. None modifies application code, content, or
configuration.
