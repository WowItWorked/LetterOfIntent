# A6 — PDF AND DOCUMENT OUTPUT

Analyst A6. Working blind to the other eight. Analysis only — no application file was
modified. The only files I created are this one and the raw veraPDF reports under
`audit/evidence/verapdf/`.

Environment note: the `Bash` tool was unavailable for the whole session (model-classifier
outage). All commands were run through `PowerShell`. Node 24.19.0 portable, veraPDF 1.28
via the supplied `verapdf.bat`, Java 21.0.12+8 — all three ran successfully.

---

## FINDINGS

```yaml
- id: A6-001
  title: The Emergency Information Sheet is never US Letter size — its page grows or shrinks with the content
  category: print-fidelity / emergency-use
  what_i_observed: >
    `<Page size="LETTER" style={s.page} wrap={false}>` in emergency-document.tsx:163.
    In @react-pdf/renderer, `wrap={false}` on a Page makes the page box size itself to the
    content instead of honouring `size="LETTER"`. Every emergency sheet I measured has a
    612pt width but a content-dependent height, and none is 792pt:
      minimal--Emergency-Information-Sheet   612 x 441.54pt  = 8.50 x  6.13 in
      typical--Emergency-Information-Sheet   612 x 742.84pt  = 8.50 x 10.32 in
      maximal--Emergency-Information-Sheet   612 x 1113.19pt = 8.50 x 15.46 in
    This is not an artefact of the synthetic maximal fixture. The two SHIPPED SAMPLES on
    the public site — hand-written realistic content — are also wrong:
      public/samples/sample-emergency-information-sheet-anyone.pdf        612 x 739.19pt = 10.27 in
      public/samples/sample-emergency-information-sheet-disabilities.pdf  612 x 852.69pt = 11.84 in
    The disabilities sample is 11.84 in tall — taller than the 11 in paper it is meant to
    be printed on. The LOI itself is correctly 612x792pt on every page of every fill level,
    so this is specific to the emergency sheet.
  evidence:
    type: measurement
    detail: >
      pdfjs-dist getViewport({scale:1}) per page, across all 6 audit PDFs and all 4 shipped
      sample PDFs. Script and full output retained in scratchpad; numbers above are verbatim.
      Code: src/lib/pdf/emergency-document.tsx:163.
  confidence: MEASURED
  who_is_affected: >
    Everyone who prints the emergency sheet — which is precisely the population the sheet
    exists for: paramedics, ER triage nurses, school offices, respite sitters, the fridge door.
  why_it_matters: >
    This is the one document in the product designed to be read under time pressure by a
    stranger, and it is the one document that does not fit the paper. A home printer given a
    15.46 in page on Letter stock does one of two things: shrink-to-fit (the default in Chrome,
    Acrobat and Preview), which scales everything to 71% — the 9pt body becomes 6.4pt and the
    6.8pt footnote becomes 4.8pt, below the legibility floor for a stressed adult in bad light —
    or clip, silently dropping the bottom of the page, which in the disabilities sample is the
    EMERGENCY CONTACTS box. Either failure mode lands on the information that matters most.
    The 6.13 in minimal case is the mirror image: a stubby page that reads as a broken document
    and undermines confidence in everything else the family produced.
  standard_reference: >
    No formal SC. This is a print-production defect. Adjacent: WCAG 2.2 SC 1.4.4 Resize Text
    (in spirit — forced downscaling defeats the user's ability to control text size) and
    SC 1.4.10 Reflow. PDF/UA-1 has no page-size clause.
  recommendation: >
    Remove `wrap={false}` from the Page and instead control overflow with content budgets.
    Concretely: keep `size="LETTER"` authoritative, let the Page wrap, and tighten the existing
    `clamp()` budgets in emergency-document.tsx:103-108 so realistic content lands on one page.
    Then add a build-time or test-time assertion that the generated emergency sheet is exactly
    one 612x792pt page for the typical and maximal fixtures — this defect is invisible on screen
    and only appears at the printer, so it needs an automated guard. If content genuinely
    overflows, a clean second Letter page is far better than a single 15 in page.
  scope: current
  privacy_impact: none — no data leaves the device; this is a layout constant.
  cost_and_maintenance: >
    No new dependency, no infra. Adds one assertion to the existing vitest suite. Ongoing cost
    is the discipline of keeping the clamp budgets tuned as fields are added.
  effort: M
  risk_of_change: >
    Medium. Removing `wrap={false}` changes layout for every existing user's next download.
    Needs visual regression against all three fill levels plus both shipped samples before ship.
  mission_impact: 5
  reach: 5
  harm_if_unfixed: 5
  environment: both

- id: A6-002
  title: The page footer — legal disclaimer AND "Page N of M" — is rendered hundreds of thousands of points off-page and appears on no page of any letter
  category: correctness / document-integrity
  what_i_observed: >
    `PdfFooter` (loi-document.tsx:486-496) renders a `fixed` absolutely-positioned View
    containing the non-binding disclaimer, the person's name, the "Last updated" date, and a
    `render`-prop `Page N of M`. It is present in the content stream but translated outside the
    page box on every content page.
    Decompressed content stream of maximal page 8 (page object 39, contents object 37) begins:
        1 0 0 -1 0 792 cm
        q q q q /Gs2 gs q
        64 -426389.1875 m
        548 -426389.1875 l
        ...
        1 0 0 1 64 -426389.1875 cm
    and the three footer text runs (`/F28 7.5 Tf ... TJ`, including the one that decodes to the
    "Page 8 of 64" string) sit inside that translated group. The page box is 0..792pt.
    Scanning every page of every letter for an x=64 group translated outside 0..792:
        minimal LOI:  3 of 4 pages affected  (page 1 is the cover, which has no footer by design)
        typical LOI: 10 of 11 pages affected
        maximal LOI: 62 of 64 pages affected
    Offsets are -6834.5pt on most pages and -426389.1875pt on some.
    Independent confirmation via text extraction: the string "Page " occurs 0 times in the
    minimal, typical and maximal letters AND 0 times in all four shipped sample PDFs. The
    footer's disclaimer sentence also never appears in the body (the single
    "not a legal document" hit in each letter is `firm.disclaimerShort` on the cover).
    pdfjs reports exactly 1 text item on maximal page 8 — the NOTES label — and nothing else.
  evidence:
    type: measurement
    detail: >
      Raw zlib-inflated page content streams (offsets quoted verbatim above), cross-checked
      against pdfjs getTextContent() across 10 PDFs. Code: src/lib/pdf/loi-document.tsx:58-78
      (styles), 486-496 (component), 370/402/420/520 (call sites).
  confidence: MEASURED
  who_is_affected: >
    Every reader of every letter ever produced by this tool, and most acutely anyone handling a
    printed copy that has been dropped, re-sorted, partially copied, or partially faxed.
  why_it_matters: >
    Two separate losses, both serious. First, page numbers: a 64-page — or even an 11-page —
    document with no pagination cannot be checked for completeness. A trustee or ER clerk
    handed a stack has no way to know a page is missing, and no way to reassemble it if
    dropped. This is the single most load-bearing piece of furniture in a long printed
    document and it is absent. Second, the disclaimer: the footer is where the letter says on
    every page that it is not legally binding and when it was last updated. The product's own
    "How to use this letter" page tells the reader "Check the date on the cover" — but the
    per-page date, which is what protects a reader who is holding a photocopy of pages 12-14
    with no cover, never renders. In 2041 someone will read three loose pages of this with no
    date and no page numbers and no statement that it is non-binding.
  standard_reference: >
    No WCAG SC. This is a correctness defect against the code's own stated intent
    (loi-document.tsx:237 constructs `footerLine` explicitly for this purpose).
  recommendation: >
    Fix the fixed-footer positioning. The most likely cause is the combination of
    `position:"absolute"` + `fixed` + the footer being declared as the FIRST child of `<Page>`
    in a build of @react-pdf/renderer 4.5.1 that resolves absolute offsets against the
    unpaginated flow rather than the page box. Reproduce in isolation, then either (a) move the
    footer to the LAST child of each Page, (b) drop `position:absolute` and rely on `fixed` with
    `marginTop:"auto"`, or (c) pin the react-pdf version once a working configuration is found.
    Whatever the fix, add a test that asserts "Page 1 of N" is extractable from page 1 of a
    generated letter — this defect survived into production and into the shipped marketing
    samples precisely because nothing checks it.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: One extraction assertion in the existing vitest suite.
  effort: M
  risk_of_change: >
    Low-to-medium. Restoring the footer consumes ~30pt at the foot of every page, which will
    reflow paginated content. Re-check the orphan behaviour in A6-007 afterwards.
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 4
  environment: both

- id: A6-003
  title: The "SECTION N" eyebrow above every section title never renders, so the printed sections carry no numbers even though the contents page numbers them
  category: correctness / navigation
  what_i_observed: >
    `SectionPage` renders `<Text style={s.sectionEyebrow} render={({pageNumber}) => {...; return
    `SECTION ${number}`}} />` (loi-document.tsx:523-531). The string "SECTION" occurs 0 times in
    the extracted text of the minimal, typical and maximal letters. In the decompressed content
    stream of a section-start page (typical page 5, "Getting started") the section group opens at
    `1 0 0 1 64 56 cm`, and the very next operators are `1 0 0 1 0 4 cm` (the title's `marginTop:4`)
    followed immediately by `/F3 22 Tf` — the 22pt title. There is no 9pt font selection and no
    text-showing operator between them: the eyebrow element occupies zero height and emits no
    glyphs. By contrast the three eyebrows that are plain children rather than render props —
    "CONTENTS", "TO THE READER", "IF YOU READ ONE PAGE" — do render (e.g. "C O N T E N T S" at
    y=727.2 on the contents page). The side-effect inside the render callback still fires: the
    two-pass TOC page numbers are correct (typical contents lists 5,6,7,8,9,10,11 and those are
    the real section start pages), so the function runs but its return value is discarded.
  evidence:
    type: measurement
    detail: >
      pdfjs text extraction across 3 letters (0 hits for "SECTION"), plus the inflated content
      stream of typical page 5 quoted above. Code: src/lib/pdf/loi-document.tsx:523-531.
  confidence: MEASURED
  who_is_affected: Every reader of a printed or on-screen letter.
  why_it_matters: >
    The contents page promises a numbered document — it prints "1", "2", "3" against each
    section title — and the body then delivers unnumbered sections. A reader told "see section 6"
    by a trustee, an attorney or the family cannot find section 6 by looking; they must count
    section titles from the front. Combined with A6-002 (no page numbers) the letter has no
    working addressing scheme at all: you cannot cite a location in this document.
  standard_reference: >
    No WCAG SC. Correctness against the code's stated intent and against the document's own
    contents page.
  recommendation: >
    Split the two jobs the render prop is doing. Keep a `render`-prop Text purely for the
    registry side effect (it can return an empty string), and print the eyebrow as a plain
    `<Text style={s.sectionEyebrow}>SECTION {number}</Text>` — `number` is already computed and
    passed in as a prop (loi-document.tsx:471), so nothing about the two-pass mechanism needs to
    change. Assert "SECTION 1" is extractable in a test.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Negligible.
  effort: S
  risk_of_change: Low. Adds ~13.5pt above each section title; re-check pagination after.
  mission_impact: 3
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A6-004
  title: Every PDF is completely untagged — no structure tree, no MarkInfo, no XMP metadata, no document language. PDF/UA-1 fails on all six audit files and all four shipped samples
  category: accessibility
  what_i_observed: >
    veraPDF 1.28, profile ua1, run against all six audit PDFs. All six FAIL, with the same five
    rules failing in every file:
        6.2-1    Catalog must contain MarkInfo with Marked true          — 1 failure each
        7.1-11   Logical structure must be rooted in StructTreeRoot      — 1 failure each
        7.1-8    Catalog must contain a Metadata stream (XMP)            — 1 failure each
        7.1-3    Content must be marked as Artifact or tagged as real content
        7.2-34   Natural language for text in page content must be determinable
    Failed-check counts:
        minimal  Emergency  53 total   (7.1-3 x30,   7.2-34 x20)
        typical  Emergency 132 total   (7.1-3 x80,   7.2-34 x49)
        maximal  Emergency 220 total   (7.1-3 x124,  7.2-34 x93)
        minimal  LOI       170 total   (7.1-3 x93,   7.2-34 x74)
        typical  LOI       489 total   (7.1-3 x288,  7.2-34 x198)
        maximal  LOI      3836 total   (7.1-3 x2020, 7.2-34 x1813)
    Direct catalog inspection confirms it: `/Type /Catalog /Pages 1 0 R /Names 2 0 R
    /ViewerPreferences 5 0 R >>` — no /StructTreeRoot, no /MarkInfo, no /Metadata, no /Lang,
    no /Outlines. pdfjs reports `Language: null` and no XMP for every file. The four shipped
    samples show the same: /Lang null, XMP NO.
    Two things ARE right: `/ViewerPreferences` with `DisplayDocTitle` true is present, and a
    document `Title` is set (loi-document.tsx:250, emergency-document.tsx:159).
  evidence:
    type: axe
    detail: >
      Not axe — veraPDF. Raw machine-readable reports saved to
      audit/evidence/verapdf/{fill}--{doc}--ua1.xml (6 files). Rule clauses and failure counts
      quoted verbatim above. Re-run with:
      `$env:JAVA_HOME="C:\Users\patri\AppData\Local\java-portable\jdk-21.0.12+8"; $env:Path="$env:JAVA_HOME\bin;$env:Path"; & "C:\Users\patri\AppData\Local\verapdf\verapdf.bat" -f ua1 --format text "<pdf>"`
  confidence: MEASURED
  who_is_affected: >
    Blind and low-vision readers using a screen reader; anyone using reflow / large-text mode in
    a PDF reader; anyone using automatic translation. Note who the readers of THIS document are:
    adult siblings taking over care, aging grandparents becoming guardians, and — the site's own
    stated audience — people who have disabilities themselves. A disabled sibling inheriting
    care responsibilities is a completely realistic reader of this file.
  why_it_matters: >
    An untagged PDF has no headings, no lists, no reading order, no table structure and no
    language. A screen reader falls back to guessing from the text layer's drawing order. On the
    emergency sheet that is actively dangerous: the layout is two columns
    (emergency-document.tsx:61-63), and untagged two-column PDFs commonly linearise by
    interleaving the columns — which is exactly what my own y-ordered extraction reproduced
    ("D I A G N O S E SH OW T H E Y CO M M U N I C AT E" is the DIAGNOSES title and the HOW THEY
    COMMUNICATE title colliding on one visual line). A caregiver who cannot see the page may
    hear the allergy box and the communication box shredded together. Missing /Lang additionally
    means a screen reader may read English content with the user's default voice rules, and
    translation tools have no language to translate from.
  standard_reference: >
    ISO 14289-1 (PDF/UA-1) clauses 6.2, 7.1 and 7.2 as listed. Mapped to WCAG 2.2 via WCAG2ICT:
    SC 1.3.1 Info and Relationships (no structure), SC 1.3.2 Meaningful Sequence (no reading
    order), SC 3.1.1 Language of Page (no /Lang), SC 2.4.6 Headings and Labels.
  recommendation: >
    Be honest about what is achievable here. @react-pdf/renderer exposes no API for emitting a
    structure tree, MarkInfo, or an XMP metadata stream — I found no tagging props in its
    surface and all ten of its outputs here are untagged — so "make the PDF PDF/UA compliant"
    is NOT implementable in the current architecture. Recommending it as a to-do would be
    technically correct and practically useless.
    The realistic answer is A6-012: ship a self-contained HTML version of both documents
    alongside the PDFs. HTML gets real headings, real reading order, a `lang` attribute, reflow,
    and browser translation for free, with no new dependency and no privacy change. That is
    strictly better for the disabled reader than a tagged PDF would be, and it is achievable
    this week.
    If the PDF must also be conformant later, that is a SCOPE: architectural change — replacing
    or supplementing @react-pdf/renderer with an engine that emits tagged output.
  scope: current
  privacy_impact: none — the HTML file is generated in the browser and downloaded, same as the PDF.
  cost_and_maintenance: >
    See A6-012. The "fix the PDF engine" alternative would be XL and would put a second
    rendering path in permanent maintenance.
  effort: L
  risk_of_change: Low — additive.
  mission_impact: 4
  reach: 2
  harm_if_unfixed: 5
  environment: both

- id: A6-005
  title: 85-98% of every PDF's bytes is one decorative logo embedded at roughly 1,150-1,700 DPI
  category: performance / file-size
  what_i_observed: >
    I expected embedded fonts to be the cause. They are not — the fonts ARE subsetted (subset
    prefixes are present, e.g. `XPJXNA+Cinzel-SemiBold`, `IAXAWI+CormorantGaramond-Regular`) and
    the total FontFile2 stream bytes are a rounding error. The bytes are one image.
    In EVERY file, object 9 is the same image:
        << /Type /XObject /Subtype /Image /BitsPerComponent 8 /Width 3716 /Height 2782
           /Filter /FlateDecode /ColorSpace /DeviceRGB /SMask ... /Length 903664 >>
    903,672 bytes plus its 138,914-byte alpha SMask = 1,042,586 bytes.
    Source asset: public/mloi-lockup-stacked.png — 3716 x 2782 px, 828,742 bytes on disk
    (`firm.appLogoPath`, config/firm.ts:82).
    Second offender: public/monogram-gold.png, 395 x 578 px, embedded as 137,578 + 4,761 =
    142,339 bytes (`firm.logoPath`, config/firm.ts:80).
    Displayed sizes vs embedded resolution:
        app lockup on the LOI cover      230pt wide = 3.19 in  -> 3716px / 3.19 in ≈ 1,164 DPI
        app lockup on the emergency sheet 158pt wide = 2.19 in -> 3716px / 2.19 in ≈ 1,694 DPI
        firm monogram on the cover        22pt tall = 0.306 in ->  578px / 0.306 in ≈ 1,890 DPI
    Resulting share of file size:
        minimal  Emergency  1,042,586 / 1,058,927 = 98.5%
        typical  Emergency  1,042,586 / 1,062,282 = 98.1%
        maximal  Emergency  1,042,586 / 1,064,386 = 98.0%
        minimal  LOI        1,184,925 / 1,224,619 = 96.8%
        typical  LOI        1,184,925 / 1,243,801 = 95.3%
        maximal  LOI        1,184,925 / 1,391,973 = 85.1%
    The minimal emergency sheet carries about 575 characters of actual emergency information
    inside a 1.06 MB file.
  evidence:
    type: measurement
    detail: >
      Per-object stream-length analysis of the raw PDFs (dictionaries quoted verbatim above),
      plus PNG IHDR width/height read directly from the source assets. Config:
      src/config/firm.ts:80,82. Draw sizes: src/lib/pdf/loi-document.tsx:259,341 and
      src/lib/pdf/emergency-document.tsx:172.
  confidence: MEASURED
  who_is_affected: >
    Families on slow or metered connections, families emailing the sheet to a school or
    caregiver (1 MB attachments still bounce off some school and hospital mail gateways), anyone
    on an old phone where @react-pdf must hold and deflate a 31-megapixel RGBA bitmap in memory
    to produce a one-page document, and anyone storing 20 years of yearly revisions.
  why_it_matters: >
    Print output above roughly 300 DPI is discarded by every consumer printer, so ~1 MB of every
    download is bytes no reader will ever perceive. It also makes the emergency sheet — the
    document most likely to be emailed, texted, or uploaded to a school portal — 1 MB when it
    could be ~20 KB. On a low-end Android phone the decode-and-deflate step is also the most
    likely single cause of a failed or very slow "Download all three".
  standard_reference: None — engineering quality.
  recommendation: >
    Resize the source assets to the resolution actually used. For 300 DPI at the largest
    displayed size (230pt = 3.19 in) the lockup needs ~960 px wide, not 3716 — about a 15x
    reduction in pixel count. The monogram at 22pt tall needs ~92 px, not 578. Ship
    print-resolution variants (e.g. `mloi-lockup-stacked-print.png` at 960px,
    `monogram-gold-print.png` at 120px) referenced only by the PDF path, so the web pages can
    keep whatever resolution they want. Expected result: both PDFs drop to well under 150 KB.
    Consider also whether the emergency sheet needs the full lockup at all — see A6-010.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: >
    Two extra image files in /public and two extra lines in firm.ts. No new dependency. Ongoing
    cost is remembering to regenerate the print variants when the brand assets change — worth a
    one-line comment in firm.ts.
  effort: S
  risk_of_change: Very low. Visual output at print resolution is unchanged.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A6-006
  title: Every letterspaced label extracts and copies as broken text — "DIAGNOSES" comes out as "D I A G N O S E S"
  category: accessibility / interoperability
  what_i_observed: >
    All small-caps labels use `letterSpacing`. In the PDF this is emitted as per-glyph kerning
    inside a single TJ array with no space glyphs, e.g. the NOTES label on maximal page 8:
        [<0013> -112.5 <0015> -69.5 <0004> -112.5 <0009> -102.5 ... ] TJ
    Text extraction reconstructs spurious spaces. Verbatim strings pdfjs returns:
        "N OT E S — FO R H A N DW R I T T E N A D D I T I O N S"
        "C O N T E N T S"
        "D I AG N O S E S A N D CO N D I T I O N S"
        "YO U R R E LAT I O N S H I P TO T H E M"
        "TO DAY ' S DAT E"
        "W H O WO U L D YO U CA L L F I R ST I N A N E M E R G E N CY ?"
    The effect is threshold-dependent. The emergency sheet's `headerTitle` at
    `letterSpacing: 0.6` extracts cleanly ("EMERGENCY INFORMATION — MAX"), and `subLabel` at
    0.7 is mixed ("SIGNS OF PAIN OR ILLNESS" clean, "Y ES / NO" broken), while everything at
    >= 0.8 breaks consistently. Affected declarations: loi-document.tsx:85 (1.6), :96 (0.9),
    :117 (0.8), :157 (1.2), :178 (0.8), :266 (3.2), :281 (3.2), :327 (1.4), :345 (1.8);
    emergency-document.tsx:74 (0.9), :82 (0.7).
    Field VALUES — the family's actual prose — extract cleanly. Only the labels are affected.
  evidence:
    type: measurement
    detail: >
      pdfjs getTextContent() item strings quoted verbatim above; the TJ operator array is from
      the inflated content stream of maximal page 8, contents object 37.
  confidence: MEASURED
  who_is_affected: >
    Screen reader users (an untagged PDF is read from this same text layer — see A6-004);
    anyone pasting the letter into Google Translate or a translation service, which is a very
    realistic need for a caregiver whose first language is not English; anyone copying a section
    into an email to a doctor or school; and any future migration that re-imports the PDF text.
  why_it_matters: >
    The labels are the document's entire semantic skeleton — "ALLERGIES", "CURRENT MEDICATIONS",
    "IN AN EMERGENCY — PROTOCOL". Because the PDF has no tag tree, that text layer IS what
    assistive technology and translation tools consume. A translation engine handed
    "D I AG N O S E S" will not translate it; it will pass it through as gibberish or drop it,
    stripping the headings out of the translated document and leaving a caregiver with unlabelled
    blocks of prose. This compounds A6-004 rather than duplicating it: even a perfectly tagged
    PDF would still hand over broken label strings.
  standard_reference: >
    WCAG 2.2 SC 1.3.1 Info and Relationships and SC 1.1.1 (text alternatives must be
    programmatically determinable) via WCAG2ICT. PDF/UA-1 7.2 (natural language and text
    semantics). Also the well-established accessibility guidance against faking letterspacing
    with per-character advances rather than a font feature.
  recommendation: >
    Two options, in order of preference.
    (1) Reduce `letterSpacing` on the small-caps labels to <= 0.6 and recover the airy look with
    the existing weight/colour contrast. This preserves the brand's typographic voice — the
    engraved feel comes mostly from Cinzel and the caps, not the tracking — and is a one-line
    change per declaration. The 3.2 tracking on the two cover lines is the most visually
    load-bearing; those two are short, low-information strings ("A LETTER OF INTENT FOR") and
    could keep their tracking if the value is judged worth the cost.
    (2) If wide tracking must stay, add a hidden, correctly-spelled duplicate of each label —
    but @react-pdf gives no mechanism to mark it as an artifact or hide it from the text layer
    without also hiding it from extraction, so this does not actually work. Option 1 is the
    real answer.
    Either way, A6-012's HTML export sidesteps this entirely, because CSS `letter-spacing` in
    HTML does not corrupt the text content.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Negligible — eleven numeric literals.
  effort: S
  risk_of_change: >
    Low functionally, but it is a visible brand-typography change and the brand system is
    explicitly off the table for redesign. This is a legibility/interop fix within the existing
    system, not a change to it — worth confirming with the owner before shipping.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A6-007
  title: Long letters produce near-blank pages containing only the "NOTES" ruled-lines block, and two-line widows
  category: pagination
  what_i_observed: >
    Each section page ends with `<View style={s.notesArea} wrap={false}>` — a label plus five
    ruled lines, ~132pt tall and unbreakable (loi-document.tsx:561-566). When it does not fit,
    it is pushed whole onto a fresh page.
    In the maximal letter (64 pages), pages 8, 12, 41 and 64 contain exactly one text item —
    the NOTES label — and nothing else. Verified directly: pdfjs reports `items=1` for page 8,
    the single item being "N OT E S — FO R H A N DW R I T T E N A D D I T I O N S". Page 46
    carries a two-line widow ("...not guess. Sentence 12..." / "future caregiver would need...")
    followed by the NOTES block, 210 characters on an otherwise empty page.
    This is length-dependent and does NOT occur at realistic lengths: 0 such pages in the
    minimal letter and 0 in the typical letter. `minPresenceAhead={90}` on the section header
    block (loi-document.tsx:520) is already doing its job — section titles do not strand.
  evidence:
    type: measurement
    detail: >
      Per-page text-item counts and full item dumps via pdfjs across all three fill levels.
      Code: src/lib/pdf/loi-document.tsx:561-566.
  confidence: MEASURED
  who_is_affected: >
    Families who write at length — which correlates with the families who have the most to say
    and the most complex situations. The maximal fixture is synthetic, but a parent describing a
    complicated medical history, a detailed behaviour plan, and a long personal message will get
    there.
  why_it_matters: >
    Moderate. A page that is blank except for a heading reads as a printing error and invites
    the reader to think pages are missing — a worry that A6-002 makes impossible to resolve,
    since there are no page numbers to check against. It also wastes paper on a document
    families are told to print several copies of.
  standard_reference: None — typographic quality.
  recommendation: >
    Give the notes block an orphan guard rather than an all-or-nothing wrap. Either set
    `minPresenceAhead` on the notes View so it only starts where it can show the label plus at
    least two rules, or let it wrap (`wrap` default) so the rules can split across the page
    break, or simplest: render the notes block only when at least ~150pt of vertical space
    remains. Lowest-effort acceptable fix is to allow wrapping — ruled lines are meaningless
    individually and split harmlessly.
    Do this AFTER fixing A6-002, since restoring the footer changes the available height on
    every page.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Negligible.
  effort: S
  risk_of_change: Low.
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 2
  environment: both

- id: A6-008
  title: The emergency sheet omits the treating doctors, even though the letter collects their names, specialties and phone numbers
  category: emergency-use / content-design
  what_i_observed: >
    `emergencyInfo()` (derive.ts:184-236) builds the sheet from `familySupport.contacts`
    (filtered to `emergency === true`), `familySupport.firstCall`, medications, allergies,
    diagnoses, communication, behaviour and `preferredHospital`. It never reads
    `medical.providers` — the repeater defined at sections/06-medical.ts:15-32 with `name`,
    `specialty` and `phone` per provider. The rendered sheet's EMERGENCY CONTACTS box
    (emergency-document.tsx:317-336) therefore lists only family contacts. Confirmed in the
    shipped sample: the disabilities emergency sheet shows only "Jessie Anderson — (Aunt)" and
    "Hannah Phillips — (Neighbor)". Bonnie's doctors are collected in the letter and are absent
    from the sheet.
    Also absent from the schema entirely (searched sections/06-medical.ts and the general-path
    equivalent): weight, blood type, and pharmacy.
  evidence:
    type: code
    detail: >
      src/lib/derive.ts:184-236 (no reference to `providers`); src/lib/content/sections/06-medical.ts:15-32
      (the providers repeater); src/lib/pdf/emergency-document.tsx:317-336 (contacts box);
      public/samples/sample-emergency-information-sheet-disabilities.png (rendered result).
  confidence: INSPECTED
  who_is_affected: >
    Every ER, urgent care, school nurse and paramedic who receives this sheet, and the family
    member who has to answer their questions.
  why_it_matters: >
    "Who is their doctor, and can we call them?" is one of the first three questions asked at
    triage, and the treating specialist is often the only person who can authorise or advise on
    care for a complex patient. The letter already asks the family for exactly this — name,
    specialty, phone — so the family has done the work and the sheet silently discards it. The
    sheet's whole premise is "the things you need in fifteen seconds"; the neurologist's phone
    number belongs there more than the diagnoses paragraph does.
    Weight is a genuine second gap: for a child or a small adult, weight drives emergency
    medication dosing, and a caregiver who is not the parent frequently does not know it.
    I am flagging weight/blood type as a content-design suggestion rather than a defect —
    adding fields has a cost in wizard length, which is itself a completion risk.
  standard_reference: >
    No formal standard. Compare the widely-used Emergency Information Form for Children With
    Special Needs (AAP/ACEP), which places treating physicians and weight in its top block.
    Cited as a design reference, not a compliance requirement.
  recommendation: >
    Add `providers` to `EmergencyInfo` and render the first 2-3 in the EMERGENCY CONTACTS box
    under a "TREATING DOCTORS" sub-label, using the same `clamp()` discipline. This is a small,
    contained change to derive.ts and emergency-document.tsx and costs the family nothing —
    the data is already captured.
    Separately, consider adding a single optional "Weight (for medication dosing)" text field to
    the medical section. Do NOT add blood type: it is rarely known by families, is re-typed by
    the hospital anyway, and would be a field most people leave blank — which makes the form
    feel longer for no benefit.
    Note this competes for space with A6-001. Fix the page size first, then spend the recovered
    space on the doctors.
  scope: current
  privacy_impact: >
    none in the "leaves the device" sense. Worth noting the sheet is the document most likely to
    be handed to strangers, and adding provider phone numbers slightly increases what a lost copy
    discloses. That is the correct trade for an emergency document and matches what families
    already put on fridge cards.
  cost_and_maintenance: Small. One field on an interface, one block in a component.
  effort: S
  risk_of_change: Low, but it consumes vertical space — sequence after A6-001.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A6-009
  title: There are no PDF bookmarks, so a 64-page letter has no navigation pane
  category: navigation / accessibility
  what_i_observed: >
    `getOutline()` returns null and the catalog contains no `/Outlines` entry, in all six audit
    PDFs and all four shipped samples. The contents page (loi-document.tsx:400-415) prints
    section titles and page numbers but the entries are not links either — they are plain Text
    with a dotted-leader View, no `<Link>`.
  evidence:
    type: measurement
    detail: >
      pdfjs getOutline() = null for all 10 files; raw catalog scan shows no /Outlines. Code:
      src/lib/pdf/loi-document.tsx:400-415.
  confidence: MEASURED
  who_is_affected: >
    Anyone reading on screen, which is most people most of the time — the trustee opening the
    file on a laptop, the attorney reviewing it, the sibling reading it on a phone.
  why_it_matters: >
    On a typical 11-page letter this is a minor convenience. On a long one it is the difference
    between a usable and an unusable document: the maximal letter is 64 pages with no bookmarks,
    no page numbers (A6-002), no section numbers (A6-003) and unclickable contents entries.
    There is literally no way to jump to "Medical" except scrolling. For a reader with a motor
    impairment or limited stamina, scrolling 64 pages to find the medication list is a real
    access barrier, not just an annoyance.
  standard_reference: >
    PDF/UA-1 does not mandate outlines. WCAG 2.2 SC 2.4.5 Multiple Ways and SC 2.4.1 Bypass
    Blocks (via WCAG2ICT) are the relevant principles for a long document.
  recommendation: >
    @react-pdf/renderer supports internal linking via `<Link src="#id">` paired with a
    `<Text id="...">` target, and this is the cheapest large win: make the contents page entries
    real internal links. That alone gives every reader one-click access to every section and
    costs a handful of lines, reusing the section keys already in `numberOf`.
    True `/Outlines` bookmarks appear not to be exposed by the library — I could not find an API
    for them and none of the ten generated files has an outline — so I am NOT recommending them
    as a current-scope item. If the HTML export in A6-012 ships, it provides the navigation pane
    equivalent for free.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Small.
  effort: S
  risk_of_change: Low.
  mission_impact: 2
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A6-010
  title: The emergency sheet is laid out for the family, not for the stranger reading it in fifteen seconds
  category: emergency-use / information-design
  what_i_observed: >
    From the rendered sheet (public/samples/sample-emergency-information-sheet-disabilities.png)
    and emergency-document.tsx:
      - The brand lockup is drawn 158pt wide at the very top (emergency-document.tsx:166-175),
        occupying roughly the top sixth of the sheet, ABOVE the navy "EMERGENCY INFORMATION"
        bar. The largest single element on an emergency document is a logo.
      - Box order is source-order, not urgency-order. Left column runs DIAGNOSES → ALLERGIES →
        CURRENT MEDICATIONS → PROTOCOL (emergency-document.tsx:227-269). DIAGNOSES, the least
        actionable of the four, is first and visually identical to the rest.
      - ALLERGIES is the only box given emphasis (red border + red title,
        emergency-document.tsx:233-241). CURRENT MEDICATIONS and IN AN EMERGENCY — PROTOCOL are
        plain or gold-tinted.
      - The two columns are independently packed, so the left column ends well short of the
        right one, leaving a large dead area in the lower-left of the sample while the right
        column is dense.
      - Body text is 9pt, box titles 7.5pt, sub-labels 7pt, footnote 6.8pt
        (emergency-document.tsx:26,73,81,96).
      - Medications are capped at 8 with "+ N more — see full letter"
        (emergency-document.tsx:153,253-257).
  evidence:
    type: screenshot
    detail: >
      public/samples/sample-emergency-information-sheet-disabilities.png (the shipped sample
      render, viewed at full size), corroborated line-by-line against
      src/lib/pdf/emergency-document.tsx as cited.
  confidence: INSPECTED
  who_is_affected: >
    Paramedics, ER triage staff, school nurses, substitute caregivers, respite workers — every
    reader the sheet was made for.
  why_it_matters: >
    The brief for this document is "medications and behavioural triggers in under fifteen
    seconds." The current design does not serve that. A reader's eye lands first on a logo, then
    on a diagnoses paragraph. The two pieces of information that change what a first responder
    DOES in the first minute — what they are allergic to, and what they are currently taking —
    are one emphasised box and one unemphasised box, in the middle of the page. Meanwhile the
    7-7.5pt labels are at the bottom of what is legible under fluorescent light at arm's length,
    and A6-001 means the whole thing is likely to be printed at 71% scale, taking those labels
    to ~5pt.
    I want to be careful not to over-claim here: the sheet's CONTENT selection is genuinely good
    — allergies, meds, protocol, triggers, what helps, what to avoid, who to call is the right
    list, and the "AVOID — MAKES IT WORSE" box is a thoughtful inclusion most templates miss.
    The problem is hierarchy and scale, not substance.
  standard_reference: >
    No formal standard. WCAG 2.2 SC 1.4.1 Use of Color is adjacent — the allergy box's urgency
    is carried by red alone, which is lost in the black-and-white printing this document will
    mostly receive (see A6-011 for the measured grayscale values).
  recommendation: >
    Reorder and re-weight, without adding anything:
      1. Move the brand lockup to the FOOT of the sheet, or shrink it to a small monogram beside
         the navy bar. The navy "EMERGENCY INFORMATION — <NAME>" bar should be the first thing
         on the page. This also removes the largest image (A6-005) from the sheet.
      2. Promote ALLERGIES and CURRENT MEDICATIONS to a single full-width band directly under
         the identity row, above the two columns. Give medications the same red-border treatment
         allergies has, or give both a heavy rule rather than colour so the emphasis survives
         monochrome printing.
      3. Demote DIAGNOSES below them.
      4. Raise the minimum type size on the sheet: 7pt sub-labels to 8pt, 6.8pt footnote to 8pt.
         Space for this comes from the reclaimed logo area.
    Do NOT add more content to this sheet. Its value is that it is short.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Layout-only change to one component.
  effort: M
  risk_of_change: >
    Medium — it is a visible redesign of the product's most-shown artifact, and the shipped
    sample PNGs and PDFs would need regenerating.
  mission_impact: 5
  reach: 4
  harm_if_unfixed: 4
  environment: both

- id: A6-011
  title: Two text colours fail WCAG contrast, and the tinted "warning" backgrounds carry no signal at all in black and white
  category: accessibility / print-fidelity
  what_i_observed: >
    Computed contrast ratios against white paper (sRGB relative luminance, WCAG formula):
        INK    #1F2735  body 12pt              15.00:1   ok
        NAVY   #253551  section title 22pt     12.30:1   ok
        GRAY   #5E6878  footer / labels        5.63:1    ok
        GRAY   #5E6878  on CREAM (pointSource) 4.92:1    ok
        FAINT  #8A92A0  TOC numbers 9pt        3.13:1    FAILS 1.4.3
        FAINT  #8A92A0  cover credit 7.5pt     3.13:1    FAILS 1.4.3
        GOLD_DEEP #A87E45 eyebrows 9pt         3.66:1    FAILS 1.4.3
    FAINT is used at loi-document.tsx:134 (tocNumber, 9pt) and :362 (cover credit line, 7.5pt).
    GOLD_DEEP is used at :86 (sectionEyebrow, 9pt), :148 (howToDot bullets, decorative), :118
    (itemTag, 7.5pt) and emergency-document.tsx:265 (the PROTOCOL box title, 7.5pt). All are
    normal-size text, so the 4.5:1 threshold applies, not 3:1.
    Grayscale values as a monochrome printer renders them (0=black, 255=white):
        CREAM background       #F4EFE6 -> 239
        GOLD_TINT background   #F7EEDF -> 239
        warning background     #F6E9E7 -> 236
        protocol background    #faf5ea -> 245
        paper                            255
    The "warning" point box and the normal point box differ by 3 levels out of 255 in
    monochrome — indistinguishable. Borders do survive: DANGER #A64545 -> 90, LINE #D8D2C4 -> 210,
    GOLD #C9A063 -> 164, NAVY #253551 -> 52.
    One thing the code got right: RULE_ON_PAPER #C9C3B4 -> 195 for the handwriting rules, with
    an explicit comment (theme.ts:64-65) that anything lighter disappears on paper. That
    judgement is sound.
  evidence:
    type: measurement
    detail: >
      WCAG 2.x relative-luminance and contrast-ratio computation over the exact hex values in
      src/lib/pdf/theme.ts:52-65 and the inline colours in emergency-document.tsx:18-19.
      Full computed table above.
  confidence: MEASURED
  who_is_affected: >
    Low-vision readers, older readers (the site explicitly serves aging grandparents becoming
    guardians), and everyone printing on a monochrome laser or photocopying the sheet — which is
    what a school office or hospital ward will do.
  why_it_matters: >
    FAINT at 3.13:1 on the TOC numbers means the one navigational aid the letter has is its
    least legible element. GOLD_DEEP at 3.66:1 on the emergency sheet's PROTOCOL box title is
    worse in context: that box contains the seizure/choking/wandering instructions.
    The monochrome finding matters because this document's real life is photocopied. The
    designers used background tint to mean "this is different" — a note box, a warning box, a
    protocol box — and that meaning is entirely lost the first time someone runs it through a
    copier. The borders carry it; the fills do not.
  standard_reference: >
    WCAG 2.2 SC 1.4.3 Contrast (Minimum), 4.5:1 for text under 18pt / 14pt bold — applied to PDF
    via WCAG2ICT. SC 1.4.1 Use of Color for the tint-only distinction.
  recommendation: >
    Darken two constants in theme.ts. FAINT #8A92A0 needs to go to roughly #6B7382 to clear
    4.5:1; GOLD_DEEP #A87E45 needs roughly #8A6636. Both stay recognisably within the existing
    palette — this is a tonal adjustment inside the brand system, not a change to it, and
    GOLD_DEEP is already the "darker accent" role in firm.ts.
    For monochrome, do not remove the tints — they are pleasant in colour. Instead make sure
    every tinted box also carries a border weight or rule that encodes the same meaning, which
    the pointBox already does (3pt left border) and the noteBox already does (1pt gold border).
    The specific gap is `pointBoxWarn` (loi-document.tsx:172): it changes fill and border colour
    but not border WEIGHT, so in monochrome it reads as a normal box with a slightly darker
    edge. Give it a thicker left border.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Two hex constants and one style rule.
  effort: S
  risk_of_change: Low, but it is a visible palette adjustment — confirm with the owner.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A6-012
  title: There is no HTML or plain-text version of either document, and for this product HTML should be a first-class output
  category: format-strategy / accessibility
  what_i_observed: >
    The review screen offers exactly three files (ReviewScreen.tsx:148-171): the Letter PDF, the
    emergency sheet PDF, and a backup .json. The .json is explicitly described in the UI as "a
    machine-readable format the builder reads rather than a person" (ReviewScreen.tsx:169) — it
    is a save file, not a readable document. There is a browser-printable "reading view"
    (ReviewScreen.tsx:483-561) with a small print stylesheet (globals.css:432-450), but it is a
    page on the site, not a file the family can keep, send, or open in ten years without the
    site existing.
  evidence:
    type: code
    detail: >
      src/components/review/ReviewScreen.tsx:148-171 (the three files), :169 (the JSON's stated
      role), :483-561 (reading view); src/app/globals.css:432-450 (the entire print stylesheet:
      hide chrome, white background, black links, avoid breaking sections).
  confidence: INSPECTED
  who_is_affected: >
    Blind and low-vision readers; readers who need large text or reflow; readers who need
    translation; and — over the long run — everyone, because this is a document meant to be
    revised annually for decades.
  why_it_matters: >
    I was asked to argue this both ways and commit, so:
    THE CASE FOR PDF AS PRIMARY. It is the right choice and should stay. A Letter of Intent is
    handed to people, put in a binder, and stored with the trust documents. Fixed pagination is a
    feature when a trustee and an attorney need to refer to the same thing. It prints predictably.
    And there is a non-trivial emotional argument: a parent who has spent hours on the hardest
    document of their life should receive something that looks like a document, not a web page.
    The cover page in the sample is genuinely dignified and that dignity is part of what gets
    people to finish.
    THE CASE FOR HTML. Everything in A6-004 and A6-006. An untagged PDF with corrupted label
    text is, for a screen reader user, a substantially worse artifact than a plain HTML file
    would be — and the fix inside PDF is not available in this architecture. HTML also gives
    reflow on a phone at midnight, browser-native translation, OS-level text scaling, and a
    ~20 KB file instead of 1.2 MB. For the emergency sheet specifically, HTML is better on almost
    every axis that matters at 3am on a phone.
    COMMITMENT: keep the PDF as the primary, headline output. ADD a single self-contained
    `.html` file per document as a third and fourth download — inline `<style>`, no external
    references, no scripts, `lang="en"`, real `<h1>/<h2>`, real `<dl>`, a `<title>` — generated
    from the same data by the same client-side code path. Present it in the UI as "for screen
    readers, phones, and translation", not as a downgrade. Make it the RECOMMENDED format for
    the emergency sheet, because that is the one that gets read on a phone.
    Do NOT make HTML the primary letter format. It would lose the binder/handoff use case and
    the sense of occasion, for a benefit most users do not need.
  standard_reference: >
    WCAG 2.2 across the board — an HTML document can actually satisfy 1.3.1, 1.3.2, 3.1.1, 1.4.4,
    1.4.10 and 2.4.5, none of which the current PDFs satisfy (see A6-004).
  recommendation: >
    Add `generateLetterHtml(data, path): string` and `generateEmergencyHtml(...)` beside the
    existing generators in src/lib/pdf/ (or a sibling src/lib/html/), returning a complete
    self-contained document string, and download it as a Blob with the existing
    `triggerDownload` helper and the existing `documentFilename` naming discipline (extend
    `DocumentKind` with the html variants). The section/field content model in
    src/lib/content/sections is already fully declarative, so the HTML renderer is a
    straightforward second consumer of the same data — no new data plumbing.
    Embed the photo as a data: URI so the file stays a single self-contained artifact.
  scope: current
  privacy_impact: >
    none. The HTML is built in the browser from data already in memory and saved to disk by the
    same mechanism as the PDFs. No network call, no new origin, no change to the promise.
    Explicitly: nothing leaves the device, so the standard PRIVACY IMPACT block does not apply.
  cost_and_maintenance: >
    No new dependency, no infra, no hosting change — it is string generation plus a Blob. The
    real ongoing cost is honest and worth stating: a second rendering path that must be kept in
    sync with the PDF as sections and fields evolve. Mitigate by driving both from the same
    section definitions and adding a test that asserts every section key present in the PDF
    output is present in the HTML output.
  effort: L
  risk_of_change: >
    Low — purely additive, nothing existing changes. The main risk is UI clutter on the review
    screen; five downloads instead of three needs careful copy so it does not feel like a
    decision the exhausted parent has to make. Suggest grouping: "Download all three" stays the
    primary button, with the HTML versions offered as a quieter secondary line.
  mission_impact: 4
  reach: 2
  harm_if_unfixed: 5
  environment: both

- id: A6-013
  title: The document tells the reader how to read it but never tells the family who to give it to or where to keep it
  category: content-design / durability
  what_i_observed: >
    The letter's page 2, "How to use this letter" (loi-document.tsx:369-397), is addressed
    entirely to the future READER — six bullets about legal status, where to start, what to do in
    a crisis, checking the date, why no ID numbers appear, and writing on the document. There is
    no page addressed to the WRITER about distribution or storage.
    The only distribution guidance anywhere is incidental: one clause inside the crisis bullet
    ("keep copies where sitters, school, and the ER can grab them",
    loi-document.tsx:245-246) and two half-sentences in the review screen's file list
    ("to print, put in a binder, and hand to a trustee or sibling" / "one page for the fridge,
    the school office, the sitter, the ER", ReviewScreen.tsx:154,161). A repo-wide search for
    storage/distribution guidance returned only those, plus a "safe deposit box" example in an
    unrelated general-path field.
    What IS handled well: the yearly review is taken seriously — a dedicated "Come back in a
    year" card with .ics download and Google/Outlook deep links (ReviewScreen.tsx:376-479), and
    the .ics description tells the family exactly what to update. The backup .json is versioned
    (`"version": 1`) and carries `exportedAt`, which is a real durability win.
  evidence:
    type: content
    detail: >
      Quoted verbatim above from src/lib/pdf/loi-document.tsx:379-391 (the six bullets),
      :245-246 (crisisPointer), and src/components/review/ReviewScreen.tsx:154,161.
      Grep across src/ for copy/store/keep-a-copy guidance returned only these.
  confidence: INSPECTED
  who_is_affected: The family who just finished, and everyone who should have received a copy and did not.
  why_it_matters: >
    This is the failure mode the brief names: a finished document sitting in a downloads folder
    has failed. The product does an unusually good job of getting a parent to the finish line and
    then stops one step short. A parent who has just spent three hours on this is at their peak
    willingness to act and their lowest reserve of initiative — that is exactly the moment to
    hand them a short, concrete list, not to leave them to invent a distribution plan.
    The gap is sharper because the letter deliberately contains no ID numbers and says where
    documents are kept instead (loi-document.tsx:384, :536-543) — a design that only works if
    the right people actually hold a copy.
  standard_reference: None — content design.
  recommendation: >
    Two small additions, both current-scope:
    (1) Add a short "Who should have a copy" block to the review screen, after the downloads and
        before the yearly-review card. Make it a checklist of concrete roles rather than prose —
        the trustee or future guardian; a second family member in a different household; the
        school or day program; the primary doctor's office; the special needs attorney who drafted
        the trust; and one copy where the emergency sheet is physically visible. Six checkboxes,
        no persistence needed.
    (2) Add one page (or a half page appended to "How to use this letter") to the PDF itself,
        addressed to the family: where this copy came from, who else has one, when it was last
        updated, and when to review it. Include a blank "Copies given to:" ruled list — the
        letter already establishes the convention that the reader should write on it
        (loi-document.tsx:385), so this fits the document's own voice.
    (2) is the more durable of the two because it travels with the artifact; (1) is the one that
    changes behaviour on the day.
  scope: current
  privacy_impact: >
    none — a printed checklist. Worth stating that the checklist should NOT collect names into
    the app; it should be a printed blank for the family to fill in by hand, which keeps it out
    of localStorage entirely.
  cost_and_maintenance: Copy plus one component; one extra PDF page.
  effort: M
  risk_of_change: >
    Low. Main risk is lengthening the review screen, which is already long — sequence it above
    the "Pass it along" and firm-marketing cards, since it serves the family rather than the firm.
  mission_impact: 4
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A6-014
  title: A reader in 2041 can date the letter but cannot tell whether it is the current version
  category: durability
  what_i_observed: >
    Dating is present and reasonably well handled: the cover prints "LAST UPDATED — <DATE>" in a
    bordered box (loi-document.tsx:313-333), the how-to page tells the reader to check it and to
    verify medical details if the letter is over a year old (:383), the emergency sheet header
    carries "Updated <date>" and "Verify if older than one year" (emergency-document.tsx:179-180),
    and the PDF `CreationDate` is set (observed `D:20260809202804Z`).
    What is missing is any notion of revision identity. There is no version or revision number,
    no "supersedes all earlier versions" statement, and the filename carries only a date
    (`Letter-of-Intent-Disabilities-2026-08-09.pdf`, filenames.ts:34-52) — so two letters printed
    on the same day are indistinguishable, and a reader holding two copies dated eleven months
    apart has no statement telling them which governs. The backup JSON does carry `version: 1`,
    but that is a schema version, not a document revision.
    Authorship is partial: the cover prints "Written by <author> — <relationship>" and the PDF
    `Author` field is set, but only when `authorName` was filled; there is no fallback identifying
    who to contact about the document.
  evidence:
    type: code
    detail: >
      src/lib/pdf/loi-document.tsx:230,237,313-333,383; src/lib/pdf/emergency-document.tsx:153,179-180;
      src/lib/filenames.ts:34-52; observed PDF Info dictionary CreationDate/Author via pdfjs.
  confidence: INSPECTED
  who_is_affected: >
    Any reader more than a year downstream — which, for a document whose entire purpose is to be
    read after the writer is gone, is the primary reader.
  why_it_matters: >
    The document's trustworthiness rests on the reader knowing it is current. "Last updated
    August 9, 2026" answers when, but not whether something newer exists. A guardian who finds
    two copies in two places — the binder and the school office — has no basis to choose, and the
    stakes of choosing the older one are medication lists and behavioural protocols. The product
    already understands this problem (it built a yearly-reminder flow around it); it just has not
    given the artifact the identity it needs to benefit.
  standard_reference: None — document control practice.
  recommendation: >
    Small and cheap. On the cover, beneath the LAST UPDATED box, add a single line:
    "This version replaces any earlier Letter of Intent for <name>. If you are holding an older
    copy, use this one." That one sentence resolves the ambiguity without any new data.
    Optionally add a monotonic revision count to `meta` in the store, increment it on each
    download, print it as "Revision N" on the cover and in the footer, and append it to the
    filename. That is a slightly larger change and needs care because the store is per-device —
    a family restoring a backup on a new laptop must not reset to Revision 1, so it belongs in
    the backup JSON. The one-sentence version delivers most of the value at a fraction of the
    risk; recommend it first.
  scope: current
  privacy_impact: none — a revision counter is not personal data and stays on device.
  cost_and_maintenance: One line of copy; optionally one integer in the persisted store.
  effort: S
  risk_of_change: Very low for the copy change.
  mission_impact: 3
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A6-015
  title: The filename deliberately hides the person's name; the PDF document title displays it, and DisplayDocTitle is on
  category: privacy-consistency
  what_i_observed: >
    filenames.ts:9-19 states an explicit and well-argued policy: "The name never says *who* it is
    about. Downloads land in shared folders, get synced to cloud drives, and are read out by
    screen readers in open-plan offices; a filename carrying 'Letter-of-Intent-Alex' discloses a
    disability to anyone who glances at the screen."
    The PDF metadata does exactly what the filename policy forbids. Observed Info dictionaries:
        Title: "Letter of Intent — Maximal Subject With A Notably Long Legal Name"
        Title: "Emergency information — Maximal Subject With A Notably Long Legal Name"
        Author: "Maximal Author With A Notably Long Legal Name"
    Set at loi-document.tsx:250-251 and emergency-document.tsx:159. And the catalog contains
    `/ViewerPreferences` with `DisplayDocTitle` true — verified present in the raw file — which
    instructs every viewer to show the Title, not the filename, in its window title bar and tab.
    So the name the filename carefully omits is the name displayed in the title bar, announced by
    screen readers on document open, and surfaced in file-manager preview panes and desktop
    search indexes.
  evidence:
    type: network
    detail: >
      Not network — direct metadata extraction. pdfjs getMetadata().info for all six audit PDFs
      and all four shipped samples (titles quoted verbatim above), plus a raw scan of the file
      confirming `/ViewerPreferences` and `DisplayDocTitle` are present in the catalog. Policy
      text quoted verbatim from src/lib/filenames.ts:9-19.
  confidence: MEASURED
  who_is_affected: >
    Any family whose device is shared, screen-shared, or used in a public or workplace setting —
    the exact scenario filenames.ts was written to protect against.
  why_it_matters: >
    This is not a violation of the canonical privacy promise — nothing is transmitted, and the
    name is inside the document anyway by design. It is an internal inconsistency, and I flag it
    because the reasoning in filenames.ts is deliberate and good, and it is being silently undone
    one file away. The screen-reader case in that comment is the strongest one: a screen reader
    announces the document title on open, so a blind parent opening their own letter in a shared
    office announces their child's full name to the room, while the filename that was carefully
    sanitised is never spoken.
    There is a real tension to name: PDF/UA-1 7.1-8 requires a title AND DisplayDocTitle true, so
    the accessible fix (A6-004) pushes toward MORE title prominence, not less. These two goals
    genuinely conflict and the owner should decide consciously rather than by default.
  standard_reference: >
    PDF/UA-1 clause 7.1 (document title and DisplayDocTitle). No WCAG SC is violated by having a
    title — the finding is about which string is in it.
  recommendation: >
    Use the preferred/first name rather than the full legal name in the document Title:
    `Letter of Intent — Bonnie` rather than `Letter of Intent — Bonnie Marie Anderson`.
    `preferredName()` already exists in derive.ts:8-15 and is already used for the reader-facing
    body copy. This keeps a meaningful, PDF/UA-satisfying title, keeps the file distinguishable
    when several are open, and materially reduces what a glance or an announcement discloses.
    Keep DisplayDocTitle true. Do not remove the Title.
    Leave `Author` as-is — it is the writer's own name, not the disabled person's, and the writer
    chose to sign the document.
    Whatever is decided, add a sentence to the comment block in filenames.ts recording that the
    metadata title is a deliberate exception (or that it now follows the same rule), so the next
    person does not have to rediscover this.
  scope: current
  privacy_impact: >
    This recommendation REDUCES disclosure; no data leaves the device either way, so the full
    PRIVACY IMPACT block does not apply. For completeness: what would leave the device — nothing.
  cost_and_maintenance: One expression in each of two components.
  effort: S
  risk_of_change: Very low.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A6-016
  title: The four sample PDFs shown to prospective users carry every defect above, including the two worst
  category: trust / marketing-artifact
  what_i_observed: >
    public/samples/ contains four PDFs served by the /samples route. Measured:
        sample-letter-of-intent-disabilities.pdf   11 pages  612x792pt   1,247,411 bytes
        sample-letter-of-intent-anyone.pdf         12 pages  612x792pt   1,249,746 bytes
        sample-emergency-information-sheet-disabilities.pdf  1 page  612x852.69pt (11.84 in)  1,062,946 bytes
        sample-emergency-information-sheet-anyone.pdf        1 page  612x739.19pt (10.27 in)  1,061,744 bytes
    All four: `/Lang` null, no XMP, no StructTreeRoot, no MarkInfo, no /Outlines, and the string
    "Page " occurs 0 times. The two emergency samples are not Letter size. The disabilities
    emergency sample is 11.84 in — it does not fit the paper.
  evidence:
    type: measurement
    detail: >
      pdfjs page viewports, metadata and text extraction over public/samples/*.pdf; figures
      quoted verbatim above.
  confidence: MEASURED
  who_is_affected: >
    Every prospective user evaluating whether to invest hours in this tool, and every special
    needs attorney deciding whether to refer families here.
  why_it_matters: >
    These files are the product demo. An attorney who downloads the sample emergency sheet to
    assess the tool gets a 1 MB, 11.84-inch, unpaginated, untagged PDF. That is the first
    impression, and referral from attorneys is a stated acquisition channel. It also means the
    defects in A6-001 and A6-002 are not hypothetical or fixture-dependent — they are visible in
    hand-authored, realistic content that someone reviewed and shipped.
  standard_reference: None.
  recommendation: >
    Regenerate all four samples as the last step after A6-001, A6-002 and A6-003 land, and add
    the regeneration to whatever script produced them so they cannot drift again. Worth adding a
    cheap CI assertion over public/samples/*.pdf: every page is 612x792pt, and "Page 1 of" is
    extractable. Those two checks would have caught both headline defects.
  scope: current
  privacy_impact: none — the samples use simulated data and are already watermarked SAMPLE.
  cost_and_maintenance: One regeneration step; two assertions.
  effort: S
  risk_of_change: None — regenerating samples cannot break the app.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A6-017
  title: The emergency sheet silently truncates several fields at character limits that are tight for real medical content
  category: content-integrity
  what_i_observed: >
    `clamp(v, max)` (emergency-document.tsx:103-108) cuts at a character count and appends
    "… (see full letter)". Applied limits: diagnoses 230, allergies 190, protocol 460,
    communication 240, yesNo 120, pain 150, triggers 190, deEscalation 240, makesWorse 140,
    insurance 130, hospital 90. Medications are capped at 8 with "+ N more — see full letter";
    emergency contacts are capped at 4 with NO overflow indicator (emergency-document.tsx:155 —
    `info.contacts.slice(0, 4)` and nothing reports the remainder).
    Unlike `clampToWord` in derive.ts:277-284, which trims to a word boundary, `clamp` cuts
    mid-word.
    Three fields are NOT clamped at all: `fullName`, `preferred`, and `dateOfBirth`
    (emergency-document.tsx:196-208) — in the maximal fixture the unclamped `dateOfBirth` alone
    consumed roughly a quarter of the sheet.
  evidence:
    type: code
    detail: >
      src/lib/pdf/emergency-document.tsx:103-108 (the clamp), :153-155 (the caps), :196-208
      (unclamped identity fields), :229/239/267/277/282/288/299/305/311/212/218 (call sites with
      limits). Compare src/lib/derive.ts:277-284 (`clampToWord`, word-boundary aware).
  confidence: INSPECTED
  who_is_affected: Families with complex medical pictures, and the clinicians reading their sheet.
  why_it_matters: >
    Moderate and nuanced. Truncating is the right instinct — a one-page sheet that runs to two
    pages is not a one-page sheet, and the code says so explicitly and honestly in the footnote
    ("Long entries may be shortened here"). But 190 characters of allergies is about two entries
    with reactions; a child with five drug allergies loses three of them below a "…" that a
    reader in a hurry may not register as meaning "there are more". The contacts cap is the worst
    of these because it is silent: contacts 5 and 6 vanish with no indicator at all, unlike
    medications which at least say "+ N more".
    I want to be measured: the sheet cannot hold everything, and the design decision to cap is
    correct. The specific gaps are (a) the silent contact overflow, (b) mid-word cutting, and
    (c) the unclamped identity fields.
  standard_reference: None.
  recommendation: >
    Three small fixes, in priority order:
    1. Give contacts the same "+ N more — see full letter" indicator medications already have.
       Silent data loss on an emergency document is the one truly unacceptable case here.
    2. Use `clampToWord` (already written and tested in derive.ts) instead of `clamp`, so cuts
       land on word boundaries. It already strips trailing punctuation and appends an ellipsis.
    3. Clamp `fullName`, `preferred` and `dateOfBirth` defensively.
    Do NOT raise the character budgets — that trades a known, labelled truncation for the
    unbounded page growth in A6-001.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Small; reuses an existing tested helper.
  effort: S
  risk_of_change: Low.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 3
  environment: both

- id: A6-018
  title: An unembedded Helvetica font object is present in the emergency sheet
  category: pdf-hygiene
  what_i_observed: >
    The emergency sheets list four BaseFonts, one of which has no subset prefix and no embedded
    font file: `Helvetica` (object 19 in the typical emergency sheet), alongside the three
    properly subsetted faces `PAEXEQ+Cinzel-SemiBold`, `SSKFJQ+Mulish-Regular`,
    `UHUGYQ+Mulish-Bold`. The letter PDFs do not contain it (they list six subsetted faces only).
    I checked whether it is actually drawn: the page Resources /Font map is
    `/F2 11 0 R /F6 12 0 R /F1 14 0 R /F12 15 0 R` — object 19 is not in it — and the only fonts
    referenced by a `Tf` operator across all inflated content streams are F1, F2, F6 and F12.
    So on the evidence I have, Helvetica is declared but not used to draw anything on the page.
  evidence:
    type: measurement
    detail: >
      Raw object scan for /BaseFont and /FontFile2 across all six audit PDFs; Resources /Font
      dictionary and all `Tf` operators from every inflated content stream of
      typical--Emergency-Information-Sheet-2026-08-09.pdf. Values quoted verbatim above.
  confidence: MEASURED
  who_is_affected: Nobody, on current evidence.
  why_it_matters: >
    Low. I am reporting it because an unembedded base-14 font in an otherwise fully-embedded
    document is usually a symptom of a style that silently fell back to the renderer default, and
    if it ever DID draw text the result would render in a substitute face on machines without
    Helvetica and would additionally fail PDF/UA font-embedding requirements. On this evidence it
    is dead weight rather than a rendering risk.
    I could not determine WHY it is emitted — it may be a @react-pdf/renderer default that is
    always written, or it may be a real fallback from a style I did not identify. I did not find
    a style in emergency-document.tsx lacking a resolvable fontFamily.
  standard_reference: PDF/UA-1 clause 7.21.4.1 (fonts must be embedded) — not currently triggered, since no text uses it.
  recommendation: >
    Low priority. Confirm whether any glyph is ever drawn with it by rendering an emergency sheet
    with every optional field populated and re-checking the `Tf` set — if it stays unused, ignore
    it. If it is ever used, find the style that is falling back and give it an explicit
    `fontFamily: SANS`. Not worth chasing ahead of anything else in this report.
  scope: current
  privacy_impact: none.
  cost_and_maintenance: Negligible.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 1
  environment: both
```

---

## WHAT I EXAMINED, AND WHAT I COULD NOT

### Examined directly
- **All six audit PDFs** in `audit/evidence/pdfs/` — page count, page geometry, Info dictionary,
  XMP presence, outline, per-page text extraction, per-page image draws, per-object stream sizes,
  and zlib-inflated raw content streams for selected pages.
- **All four shipped sample PDFs** in `public/samples/` — same treatment. These turned out to be
  the strongest evidence for A6-001 and A6-002 because their content is realistic rather than
  synthetic.
- **veraPDF against PDF/UA-1** on all six audit PDFs. Reports saved to
  `audit/evidence/verapdf/*.xml` (6 files, machine-readable `mrr` format).
- **The PDF source**: `src/lib/pdf/theme.ts`, `loi-document.tsx`, `emergency-document.tsx`,
  `generate.tsx`; plus `src/lib/filenames.ts`, `src/lib/derive.ts`, `src/lib/ics.ts`,
  `src/config/firm.ts`, `src/lib/content/sections/06-medical.ts`,
  `src/components/review/ReviewScreen.tsx`, and the print block in `src/app/globals.css`.
- **The generated non-PDF outputs**: the three backup `.json` files and the three `.ics` files.
- **Source image assets** in `public/` — pixel dimensions read from PNG IHDR chunks.
- **The two rendered sample PNGs** for the disabilities path, viewed at full size.
- **The production network capture** — but only to confirm the font-loading story (all 44 font
  requests are same-origin `myletterofintent.com`; the only third-party hosts across 431 requests
  are googletagmanager, google-analytics and cloudflareinsights).
- **Contrast and grayscale**: computed from the exact hex constants in `theme.ts`.

### Could NOT examine, and why
- **Visual rendering of the audit PDFs.** `pdftoppm`/poppler is not installed, so the `Read`
  tool could not rasterise them, and I had no working rasteriser in Node. Everything visual in
  this report is derived from geometry, content-stream operators, and text-item coordinates —
  or from the two pre-rendered sample PNGs in `public/samples/`. **This means I have not seen
  the broken footer with my own eyes.** I consider A6-002 fully established anyway, because the
  translation offsets are quoted from the decompressed content stream and are corroborated by
  zero occurrences of "Page " in ten independent files — but a human should open one PDF and
  confirm before acting.
- **Actual screen-reader behaviour.** I did not run NVDA/JAWS/VoiceOver over these PDFs. The
  column-interleaving claim in A6-004 is grounded in the untagged structure (measured) plus my
  own extraction reproducing the interleave — the specific behaviour of a given screen reader is
  INFERRED, and I have labelled it that way in the finding's reasoning.
- **Actual printer output.** No physical print test. The 71% shrink-to-fit figure in A6-001 is
  arithmetic from the measured page height (15.46 in → 11 in), and shrink-to-fit being the
  default is general knowledge about Chrome/Acrobat/Preview, not something I verified here.
- **Whether @react-pdf/renderer can emit tagged PDFs at all.** I inferred this from ten untagged
  outputs and the absence of tagging props in the code that uses it. I did not read the library
  source or its changelog. A6-004's recommendation depends on this, so it is worth 20 minutes of
  confirmation before anyone concludes tagging is impossible.
- **The root cause of A6-002.** I established the symptom conclusively but not the mechanism. My
  hypothesis about `position:absolute` + `fixed` + first-child ordering is INFERRED and I have
  said so in the recommendation.
- **The live production site's PDF generation.** The supplied network capture covers 9 routes
  plus typing and unload phases but does not include a PDF download, so I could not confirm at
  runtime that the `/fonts/*.ttf` files are fetched same-origin. `theme.ts:23-43` uses
  root-relative paths, so this is same-origin by construction — INSPECTED, not MEASURED.
- **The `.docx` review-pack pipeline** in `scripts/review-doc/` — flagged as known in-flight and
  out of scope.

### A note on the maximal fixture
The maximal fill puts ~1,400 characters of prose into every one of 138 fields, including fields
like "Date of birth" that would never hold prose. I have been careful not to build findings on
that artefact. A6-007 (orphan pages) is explicitly reported as length-dependent and absent at
realistic lengths. A6-001 does not depend on it at all — the shipped sample, with hand-written
realistic content, is already 11.84 inches.

---

## THREE HIGHEST-CONFIDENCE FINDINGS

1. **A6-001 — the emergency sheet is never Letter size.** Measured on ten files including both
   shipped samples. Single-line root cause (`wrap={false}`, emergency-document.tsx:163) with a
   documented library behaviour. The disabilities sample at 11.84 in is unambiguous.
2. **A6-002 — the footer renders off-page on every content page.** Two independent methods agree:
   the raw inflated content stream shows the group translated to y = -6834.5 / -426389.1875 in a
   0..792 page box, and "Page " occurs zero times in ten separately-generated PDFs. 62 of 64 pages
   affected in the maximal letter.
3. **A6-004 — every PDF is completely untagged.** veraPDF, the reference implementation, run on
   all six files with reports on disk; corroborated by direct catalog inspection showing no
   `/StructTreeRoot`, `/MarkInfo`, or `/Metadata`. Not a judgement call.

## THREE LEAST-CONFIDENT FINDINGS

1. **A6-018 — the unembedded Helvetica.** I established that it exists and that nothing currently
   draws with it, but not why it is emitted. It may be an inert library default. I have scored it
   1/1/1 accordingly and would not action it.
2. **A6-010 — the emergency sheet's information hierarchy.** The observations are solid (I can
   cite every line), but the conclusion that it fails the fifteen-second test is a design
   judgement I could not validate with a real reader. It deserves five minutes with an actual ER
   nurse or paramedic more than it deserves my opinion.
3. **A6-008's weight/blood-type suggestion.** The providers omission is INSPECTED and certain.
   The claim that weight belongs on the sheet is reasoning from the AAP/ACEP emergency form
   pattern, not from anything about this product's users, and adding fields has a real cost in
   completion rate that I cannot quantify from here.

## WHAT I WOULD NEED TO BE MORE CERTAIN

- **poppler-utils installed**, so PDFs can be rasterised and inspected visually. This is the
  single biggest gap in my evidence and it is a five-minute fix for whoever runs this next.
- **One physical print test** of each emergency sheet at 100% scale and at shrink-to-fit on a
  home inkjet and a mono office laser. That would settle A6-001's severity and A6-011's
  monochrome claims definitively.
- **A screen-reader pass** (NVDA on Windows is free) over the typical letter and emergency sheet,
  to confirm or refute the column-interleaving prediction in A6-004.
- **Confirmation of @react-pdf/renderer's tagging capability** — reading the library's source or
  issue tracker for structure-tree support. A6-004's entire recommendation pivots on this.
- **An isolated reproduction of the footer bug** against a minimal @react-pdf document, to
  identify whether it is the `fixed` + `absolute` combination, the child ordering, or a
  regression in 4.5.1. Without this, A6-002's fix is trial and error.
- **Five minutes with a paramedic or ER triage nurse** looking at the emergency sheet. That would
  turn A6-010 from a designer's opinion into a finding.
