# A9 — Distribution and Adoption

Analyst A9. Working blind to the other eight. No application code, styles, content or
configuration was modified; this file is the only file I created inside the repo.

**Framing I was given and accepted:** the artifact is a disabled person's medical and
behavioural history. Nobody shares it. Share loops are the wrong model. What moves this
tool is (a) being found by a caregiver who is already searching in their own words, and
(b) being handed over by a gatekeeper the family already trusts. Everything below is
judged against those two, plus a third that most growth analysis skips: **a channel that
delivers a parent who then bounces off a broken trust signal is worse than no channel.**

**Where this sits in the governing hierarchy.** Distribution is rank 5 of 5. Several of
my findings therefore carry a deliberate self-limit: I say so where a growth-flavoured
recommendation would trade against privacy, accessibility or clarity, and in those cases
I recommend against my own instinct. Two of my findings (A9-010, A9-008) are *not*
really growth findings at all — they are trust and correctness defects that happen to
surface in the distribution lane, and they outrank everything else here.

**Environment note.** `audit/evidence/screenshots/` was captured from
`http://localhost:3000` (`audit/tools/capture-artifacts.mjs:16`), so screenshot evidence
is **local**, and shows the uncommitted navy video section. Everything I fetched with
curl/Playwright below is **production**. Where I say MEASURED against production, I ran
it myself during this audit.

---

## FINDINGS

```yaml
- id: A9-001
  title: All 25 wizard section pages tell Google they are duplicates of the homepage
  category: search / technical SEO
  what_i_observed: >
    Every /letter/<slug> page emits <link rel="canonical" href="https://myletterofintent.com"/>
    — the homepage, not itself. The sitemap simultaneously submits all 25 of those URLs at
    priority 0.7–0.8. The site is therefore asking search engines to crawl 25 pages and
    then telling each one "index the homepage instead." /letter and /letter/review are
    correct; only the [slug] segment is affected.
  evidence:
    type: measurement + code
    detail: >
      Production, 9 Aug 2026, curl:
        /letter/medical              -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/getting-started      -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/about                -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/family-and-support   -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/behavioral-support   -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/guidance-for-the-trustee -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/final-wishes         -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/about-them           -> <link rel="canonical" href="https://myletterofintent.com"/>
        /letter/for-whoever-steps-in -> <link rel="canonical" href="https://myletterofintent.com"/>
      Cause, src/app/letter/[slug]/page.tsx:11-17 — generateMetadata returns only
      `{ title }`, so `alternates: { canonical: "/" }` set at src/app/layout.tsx:52 is
      inherited by every section. Contrast src/app/letter/review/page.tsx:4-7, which sets
      its own canonical and is correct. Sitemap: src/app/sitemap.ts:13-18 lists all 25.
  confidence: MEASURED
  who_is_affected: >
    Every family who searches a specific worry rather than the product name — "what to
    write in a letter of intent about behaviour", "guidance for the trustee special
    needs", "what to tell a future caregiver about seizures". Also every gatekeeper who
    wants to deep-link one relevant section rather than the whole tool.
  why_it_matters: >
    These 25 pages are the entire long-tail surface of the site. They are the only URLs
    that speak in the language of a specific problem. Self-cancelling their indexability
    means the site can realistically only ever rank for one thing — its own name — which
    is the one query nobody in the target audience types.
  standard_reference: >
    Google Search Central, "Consolidate duplicate URLs" — rel=canonical must point to the
    page's own preferred URL; a canonical to an unrelated page is treated as a
    de-indexing instruction. Also conflicts with sitemaps.org inclusion semantics.
  recommendation: >
    One line: in src/app/letter/[slug]/page.tsx generateMetadata, add
    `alternates: { canonical: `/letter/${slug}` }` to the returned object. While there,
    add a per-section `description` built from `def.intro` (it already exists and is
    already server-rendered) so the 25 pages stop sharing one identical description.
    Verify afterwards by re-fetching three section pages.
  scope: current
  privacy_impact: >
    None. No user data is involved; these pages contain no user content at any time — the
    letter never leaves localStorage/IndexedDB.
  cost_and_maintenance: Zero ongoing. One line plus a description expression.
  effort: S
  risk_of_change: >
    Very low. Worst case a section page begins ranking for a query the owner would rather
    the homepage owned; that is recoverable by editing the section intro copy.
  mission_impact: 2
  reach: 4
  harm_if_unfixed: 2
  environment: production

- id: A9-010
  title: Both firm call-to-action links on the finished-letter screen return 404
  category: trust / conversion / referral loop
  what_i_observed: >
    On /letter/review — the screen a parent reaches after finishing the hardest document
    they will ever write — the two buttons "Book a conversation" and "Contact Trusts &
    Wealth" point at https://trustsandwealth.com/reserve.html and
    https://trustsandwealth.com/contact.html. Both return HTTP 404. The firm's site has
    since moved to Squarespace routes (/book, /contact, /pricing, /guardianship). The
    footer link to trustsandwealth.com itself is fine, and the /privacy page's "Contact
    the firm" button uses `${firm.website}/contact` which resolves 200 — so the two dead
    URLs are specifically the ones in src/config/firm.ts.
  evidence:
    type: measurement + code
    detail: >
      Playwright against production, real render of /letter/review with a seeded letter,
      9 Aug 2026 — outbound links harvested from the live DOM and then requested:
        STATUS 404  https://trustsandwealth.com/reserve.html   "Book a conversation"
        STATUS 404  https://trustsandwealth.com/contact.html   "Contact Trusts & Wealth"
        STATUS 200  https://trustsandwealth.com/
        STATUS 200  https://g.page/r/CYJI2xbnvpz7EAE/review    "Leave a review"
      Source: src/config/firm.ts:73 consultUrl, :74 contactUrl. Rendered at
      src/components/review/ReviewScreen.tsx:285 and :293.
      Confirmed the live firm site's own nav offers /book, /estate-planning,
      /guardianship, /benefits-consulting, /pricing — no .html routes.
      https://trustsandwealth.com/contact returns 200 with
      <title>Contact — Trusts & Wealth, PLLC ...</title>.
  confidence: MEASURED
  who_is_affected: >
    Every family who finishes a letter and wants to ask a question — which is precisely
    the highest-intent, highest-need moment the product produces. Also every attorney or
    professional evaluating the tool, who will click these two buttons first.
  why_it_matters: >
    This is the referral loop's only revenue-bearing exit, and it is dead. Worse for the
    mission: a frightened parent who has just written about their child's end-of-life
    wishes clicks "Book a conversation" and lands on a 404. That reads as abandonment by
    the one named human on the page, and it is the exact opposite of the reassurance the
    rest of the copy has spent 45–90 minutes building. Under the governing hierarchy this
    is a clarity and trust failure, not a growth one, which is why I rank it above every
    SEO finding in this file.
  standard_reference: >
    Not a WCAG item. WCAG 2.2 SC 2.4.4 (Link Purpose) is satisfied — the link text is
    honest; the destination is simply gone. This is a correctness defect.
  recommendation: >
    Update src/config/firm.ts consultUrl -> https://trustsandwealth.com/book and
    contactUrl -> https://trustsandwealth.com/contact (both verified 200 today), and align
    the /privacy page to use `firm.contactUrl` rather than the hand-built
    `${firm.website}/contact` at src/app/privacy/page.tsx:329 so there is one source of
    truth. Then add a cheap guard so this cannot silently rot again: a test that asserts
    every absolute URL in src/config/firm.ts returns < 400, run in CI on a schedule
    rather than on every build (so an unrelated PR is never blocked by the firm's
    marketing site being briefly down).
  scope: current
  privacy_impact: >
    None from the fix itself. Note the existing Referrer-Policy: no-referrer means the
    firm's site still cannot see where the visitor came from — see A9-019, and the
    privacy trade-off argued there.
  cost_and_maintenance: >
    Minutes to fix. The link-check test is ~1h and adds one scheduled CI job; its failure
    mode is a false alarm when the firm site is down, which is why it should not gate
    deploys.
  effort: S
  risk_of_change: Very low.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 4
  environment: production

- id: A9-002
  title: No structured data of any kind — zero JSON-LD on any page
  category: search / discoverability
  what_i_observed: >
    Grepping the whole repository for `ld+json`, `schema.org`, `JsonLd` or
    `structuredData` returns no matches, and the production homepage HTML contains zero
    occurrences of `ld+json`. There is no Organization, no LegalService, no
    WebApplication/SoftwareApplication, no FAQPage, no HowTo, no BreadcrumbList.
  evidence:
    type: measurement + code
    detail: >
      Repo grep across all files: "No matches found" for /ld\+json|schema\.org|JsonLd|structuredData/.
      Production: `grep -c 'ld+json' <homepage html>` -> 0.
      Full head-tag dump of https://myletterofintent.com/ (9 Aug 2026) contains only:
      charSet, viewport, title, description, canonical, og:* (title/description/url/
      site_name/image/image:width/image:height/image:alt/type), twitter:*
      (card/title/description/image), icon, next-size-adjust. Nothing else.
  confidence: MEASURED
  who_is_affected: >
    Anyone finding the tool through a search engine or an AI assistant. Increasingly the
    second: a parent asking an assistant "is there a free tool for writing a letter of
    intent for my disabled son" is answered from extracted, structured signals.
  why_it_matters: >
    Structured data will not help the parent directly — it is machine-facing. It matters
    because this site's competitive field (verified below) is law-firm blog posts and
    static Word templates, most of which do carry Article/FAQPage markup. Being the only
    genuinely useful *tool* in a field of *articles* and then omitting the one signal
    that says "this is a free tool, here is who publishes it" is losing on a technicality.
  standard_reference: >
    schema.org/WebApplication, schema.org/Organization, schema.org/FAQPage;
    Google Search Central structured data general guidelines.
  recommendation: >
    Add one small server component emitting a single JSON-LD graph in the root layout:
    Organization (the firm, with its real phone/URL/areaServed Virginia),
    WebApplication (name "My Letter of Intent", applicationCategory, `isAccessibleForFree: true`,
    `offers: {price: 0}`), and — only once the content in A9-004 exists — FAQPage on the
    FAQ page. Do NOT mark up Review/AggregateRating; there are no real reviews and
    fabricating them would be both a policy violation and a betrayal of this audience.
    Keep it inline in the HTML (the CSP already allows 'unsafe-inline' for script-src, and
    application/ld+json is not executed anyway).
  scope: current
  privacy_impact: >
    None. Static publisher facts only; no user data of any kind is involved, and nothing
    new is transmitted from the device.
  cost_and_maintenance: >
    Low. One file. Ongoing burden is remembering to update it when firm.ts changes —
    mitigate by generating it from src/config/firm.ts rather than hard-coding.
  effort: S
  risk_of_change: Very low; JSON-LD is inert.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 1
  environment: both

- id: A9-003
  title: No search-console verification present in HTML or /public — the owner is flying blind
  category: measurement / search
  what_i_observed: >
    No <meta name="google-site-verification">, no msvalidate.01, no yandex verification in
    the production homepage head, and no verification file anywhere under public/ (the
    directory contains only lockups, the video, fonts, sample PDFs/PNGs, pdf.worker and
    og-image.png).
  evidence:
    type: measurement
    detail: >
      Production head grep for /google-site-verification|msvalidate|yandex/ -> no matches.
      Repo: full listing of public/** shows no google*.html or BingSiteAuth.xml.
  confidence: INSPECTED
  who_is_affected: The owner, indirectly every family who cannot find the tool.
  why_it_matters: >
    Without Search Console the owner cannot see impressions, the real queries families
    type, or coverage errors — and specifically would never have been told about A9-001,
    which Search Console reports explicitly as "Alternate page with proper canonical tag".
    Every other search recommendation in this file is unfalsifiable until this exists.
  standard_reference: Google Search Console / Bing Webmaster Tools onboarding.
  recommendation: >
    Verify both Google Search Console and Bing Webmaster Tools, and submit
    https://myletterofintent.com/sitemap.xml. Prefer DNS TXT verification over a meta tag
    so no third-party string sits in the page head. Then set a standing habit of reading
    the Queries report quarterly — that report is the only honest source for the "words
    caregivers actually use" question, better than anything I or any keyword tool can
    assert.
  scope: current
  privacy_impact: >
    Search Console exposes aggregate query and click data about how people found the site
    to the site owner and to Google. No user-typed letter content is involved — Google
    already has the query data; verification only grants the owner sight of an aggregate
    of it. No new data leaves any family's device.
  cost_and_maintenance: Free. ~30 min setup, quarterly reading.
  effort: S
  risk_of_change: None to the site.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 1
  environment: production
  caveat: >
    I cannot see DNS records from here, so DNS-based verification cannot be ruled out.
    What I can state is that no HTML or file-based verification exists.

- id: A9-004
  title: The site has no answer-content — nothing that matches how caregivers actually search
  category: content coverage / search intent
  what_i_observed: >
    The entire public surface is: the homepage, /letter (chooser), 25 wizard sections,
    /letter/review, /privacy, /your-data, and four noindexed sample viewers. There is no
    explainer page, no FAQ, no glossary, no "what goes in a letter of intent", no
    "how this differs from a will/trust/guardianship", no state or benefits content, and
    no blog. /about and /for-professionals both 404. The only prose that answers "what is
    this" is ~150 words inside the homepage's navy section.
  evidence:
    type: measurement + external
    detail: >
      Route inventory from src/app/** and production sitemap.xml (30 URLs, listed above).
      https://myletterofintent.com/about -> 404. /for-professionals -> 404.
      Live SERP field for "letter of intent special needs trust template free" (9 Aug 2026)
      is entirely explainer articles and static templates: specialneedsalliance.org
      ("The Special Needs Letter of Intent"), thearc.org/resource/letter-of-intent/,
      yourlegacylegalcare.com, specialneedstrustbystate.com, specialneedstrustsonline.com,
      plus generic template farms (template.net). Same shape for "what happens to my child
      when I die": hightoweradvisors, wg-attorneys, specialneedsalliance, raniacombslaw,
      albaneselawllc, BBC. myletterofintent.com appeared in neither result set.
  confidence: MEASURED
  who_is_affected: >
    The single largest reachable group: caregivers at the "I have just been told to write
    one of these and I do not know what that means" stage. They search a question, not a
    product.
  why_it_matters: >
    The incumbents ranking for these queries hand the family a blank Word template — which
    is exactly the blank page this tool exists to defeat. The site is losing to a worse
    answer because it never entered the conversation. Note the honest limit: content only
    helps if it is genuinely useful to read, not if it is SEO filler. Filler aimed at this
    audience would be actively cruel.
  standard_reference: n/a — editorial.
  recommendation: >
    Add a small number of pages that a real parent would be glad to have read, each one
    written to be finishable in five minutes and each ending in the tool rather than in a
    download:
      1. /what-is-a-letter-of-intent — the definitive plain-language answer, including
         what it is NOT (not a will, not a trust, not binding), who reads it, and when.
      2. /what-to-include — the section list as prose, deep-linking each of the 25 pages
         (only useful once A9-001 is fixed).
      3. /letter-of-intent-vs-will-vs-trust — the single most common confusion.
      4. /faq — the questions the owner is actually asked on the phone. Mark up as FAQPage.
      5. /for-professionals — see A9-013.
    Cap it there. Do not start a blog: an abandoned blog is a worse trust signal than no
    blog, and this owner has a law practice to run.
  scope: current
  privacy_impact: None — static editorial pages, no user data.
  cost_and_maintenance: >
    Real: 1–3 days of writing for the five pages, and the writing must be the owner's or
    the attorney's voice to be worth anything. Ongoing: a yearly re-read. The maintenance
    risk is scope creep into a content programme nobody has time to run.
  effort: XL
  risk_of_change: >
    Editorial risk only — badly written content on this subject damages trust faster than
    absence does. Mitigate by shipping one page (/what-is-a-letter-of-intent) and stopping
    to see whether it is read before writing four more.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A9-005
  title: The richest keyword surface on the site — the question previews — is invisible to crawlers
  category: search / rendering
  what_i_observed: >
    /letter carries a "Every question, before you start" accordion with three concrete
    prompts per section across both letter paths (roughly 78 lines of the most specific,
    most searchable plain language the product owns: "Funeral, burial or cremation, faith
    observances", "Who to call first, and anyone who should not be called", "Paid
    supports: aides, case managers, cleaners, respite"). None of it is in the server HTML —
    it renders only after a click.
  evidence:
    type: measurement + code
    detail: >
      Production /letter HTML (55,495 bytes) contains 0 occurrences of "Be ready to write
      about", 0 of "seizure", 0 of "allergies".
      Cause: src/components/letter/PathChooser.tsx:253 — `{isOpen && prompts ? (...) : null}`,
      where `open` starts at `null` (line 38). Content source: src/lib/content/preview-prompts.ts.
      For contrast, section intro copy IS server-rendered: /letter/medical contains
      "The medical facts a new caregiver" (1 occurrence, from
      src/lib/content/sections/06-medical.ts:11).
  confidence: MEASURED
  who_is_affected: Search-arriving caregivers; also anyone who wants to skim the questions before committing.
  why_it_matters: >
    Search engines do not click accordions. This is the site's best answer to "what do I
    have to write about" and it is sealed behind an interaction. There is also a cognitive
    accessibility angle that is not mine to grade but worth flagging: a parent deciding
    whether they can face this needs to see the questions, and today they must discover
    that rows expand.
  standard_reference: >
    Google Search Central, "Hidden content" / JavaScript SEO basics — content requiring
    user interaction is not indexed.
  recommendation: >
    Render the prompts in the DOM and hide them with CSS rather than conditionally
    mounting them (`hidden` attribute toggled, or a <details>/<summary> pattern which is
    crawlable, keyboard-native and needs no JS at all). <details> is the better answer
    here: it removes JS from the path entirely and degrades perfectly. Keep the visual
    design identical.
    Separately, the five explainer pages in A9-004 give this content a second, fully
    visible home.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: One component refactor; no ongoing cost.
  effort: M
  risk_of_change: >
    Low-moderate: the tab/accordion currently has role="tablist" semantics next to it and
    a <details> swap will change the accessibility tree. Whoever does this should re-run
    the a11y checks rather than assume improvement.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A9-006
  title: The homepage title and H1 contain almost none of the words caregivers search with
  category: search / on-page
  what_i_observed: >
    Title: "Letter of Intent Builder — Trusts & Wealth, PLLC". H1: "Write down what only
    you know, so they'll be cared for the way that only you have." The H1 is the best
    sentence on the site and I would not touch it. But across the whole rendered homepage:
    "SSI" 0, "Medicaid" 0, "IEP" 0, "ABLE account" 0, "autism" 0, "Down syndrome" 0,
    "guardian" 2. "special needs" appears 6 times, "disabilities" 36, "caregiver" 13,
    "trustee" 8.
  evidence:
    type: measurement
    detail: >
      Case-insensitive occurrence counts against the production homepage HTML, 9 Aug 2026.
      Headings on that page: h1 "Write down what only you know…", h2 "Pick your letter and
      get started.", h2 "What is a Letter of Intent?", h2 "Three steps, at your pace.",
      h2 "Someone you know needs this too.", h2 "Start with ten minutes."
      Title source: src/app/layout.tsx:47-50.
  confidence: MEASURED
  who_is_affected: Caregivers searching in benefit/diagnosis language, which is most of them.
  why_it_matters: >
    "Trusts & Wealth, PLLC" occupies roughly a third of the title tag and means nothing to
    a searching parent — it is also, per A9-013, the part most likely to make a competing
    firm decline to refer. The title is the one place where being explicit costs nothing
    emotionally, because nobody reads a title tag as a headline.
  standard_reference: n/a — editorial/SEO practice.
  recommendation: >
    Retitle the homepage to something like "Letter of Intent Builder — free, private, for
    a loved one with disabilities" and let the firm name live in the footer, the
    disclaimer and the JSON-LD publisher field where it already is. Leave the H1 and the
    hero exactly as they are; they are doing emotional work that a keyword would ruin.
    Introduce SSI / Medicaid / IEP / guardianship / ABLE naturally in the A9-004 explainer
    pages, where they belong, rather than salting them into the homepage.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: Trivial.
  effort: S
  risk_of_change: >
    Low, but real: the firm may want its name in the title for attorney-advertising
    comfort. That is the owner's call and a legitimate reason to decline this.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A9-007
  title: The sample documents — the highest-intent asset the site owns — are noindexed and absent from the sitemap
  category: search / content strategy
  what_i_observed: >
    /samples/letter-of-intent-disabilities returns `<meta name="robots" content="noindex, follow">`
    and is not listed in sitemap.xml. The raw PDFs under /samples/*.pdf are, by contrast,
    fully crawlable (robots.txt allows everything) and carry no page around them.
  evidence:
    type: measurement + code
    detail: >
      Production: /samples/letter-of-intent-disabilities ->
      <meta name="robots" content="noindex, follow"/>, canonical self, title
      "Sample — Letter of Intent — for a loved one with disabilities — Letter of Intent Builder".
      Source: src/app/samples/[doc]/page.tsx:20-22, with the reasoning comment
      "A watermarked example is not what should surface in a search result for the tool itself."
      sitemap.ts:10-22 omits /samples entirely. robots.ts:11 allows "/" for all agents.
      Slugs: letter-of-intent-disabilities, emergency-sheet-disabilities,
      letter-of-intent-anyone, emergency-sheet-anyone (src/lib/content/samples.ts).
  confidence: MEASURED
  who_is_affected: >
    Every caregiver whose search is literally "sample letter of intent special needs" or
    "letter of intent example" — a large, extremely high-intent slice of the field
    identified in A9-004. Also every attorney and social worker deciding whether the
    output is good enough to attach their name to; they will want to see the document
    before they refer anyone.
  why_it_matters: >
    I understand the original reasoning and it is half right — a watermarked sample should
    not outrank the homepage for the *brand*. But the current setup achieves the reverse of
    what was intended: the polished, framed viewer page is hidden, while the bare PDF is
    the only crawlable version, so if anything surfaces it will be a context-free PDF with
    no navigation back into the tool. That is the worst of both.
  standard_reference: >
    Google Search Central robots meta tag; PDFs are indexed like pages and rank on their
    own.
  recommendation: >
    Invert it. Index the four sample *viewer* pages (drop the noindex, add them to the
    sitemap), and add a `X-Robots-Tag: noindex` header for `/samples/*.pdf` so the framed
    page is the only indexable form. Give each viewer page a distinct description already
    available in `sample.subtitle`. This is also the natural landing page for a gatekeeper
    link ("here is what it produces") — see the channel map.
  scope: current
  privacy_impact: >
    None. The samples are synthetic; no real family's data is in them (they are
    watermarked SAMPLE, generated by the project's own scripts).
  cost_and_maintenance: >
    Small. The PDF noindex header needs a `headers()` rule in next.config.ts — note this
    site is a Vercel/Next deployment with `headers()` already in use, so it is one entry.
  effort: S
  risk_of_change: >
    Low, but check afterwards that a sample page has not displaced the homepage for the
    brand query; if it does, that is fixable with the page title.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: production

- id: A9-008
  title: The privacy page's meta description ships a broken sentence to search results
  category: content correctness / trust
  what_i_observed: >
    The live meta description on /privacy reads: "Everything you type stays on your
    device. No account, and nothing you write is ever captured — we count page visits and
    nothing else. **of any kind.** Here is exactly how that works, in plain words." The
    orphan fragment "of any kind." is the tail of an earlier edit.
  evidence:
    type: measurement + content
    detail: >
      Production, curl https://myletterofintent.com/privacy:
      <meta name="description" content="Everything you type stays on your device. No
      account, and nothing you write is ever captured — we count page visits and nothing
      else. of any kind. Here is exactly how that works, in plain words."/>
      Source: src/app/privacy/page.tsx:9-12 — the string is concatenated across three
      lines and line 12 begins `"of any kind. Here is exactly how that works…"`.
  confidence: MEASURED
  who_is_affected: >
    Anyone who reaches the privacy page from a search result, or who shares that link and
    has it unfurled by a messaging app.
  why_it_matters: >
    Of all 30 pages, this is the one whose entire job is to make a frightened person
    believe a careful promise. A visibly broken sentence in its search snippet argues the
    opposite — carelessness — before the reader has opened it. It is a two-word fix with
    an outsized trust cost, which is why I rate it above several structurally bigger SEO
    items.
  standard_reference: n/a — copy defect.
  recommendation: Delete "of any kind. " from src/app/privacy/page.tsx:12.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: None.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 3
  environment: production

- id: A9-011
  title: There is no "who made this and why" — the written attorney bio exists in config and is rendered nowhere
  category: trust threshold
  what_i_observed: >
    A parent is asked to type their child's diagnoses, medications, behavioural triggers
    and end-of-life wishes. The only identity signals offered are the firm's name in a
    hero eyebrow, the footer, the disclaimer, and an attorney-advertising notice. There is
    no About page (404), no photo, no named human on the homepage, no credential display,
    no "why we built this", no last-reviewed date. `firm.attorneyBioBlurb` is fully
    written in src/config/firm.ts:91-94 and is referenced by no component — the only
    attorney mention that reaches a user is `firm.attorneyName` on the review screen,
    after they have already finished.
  evidence:
    type: code + screenshot
    detail: >
      Repo-wide grep for /attorneyBioBlurb|attorneyName|testimonial|Trusted by|endorse/
      returns: firm.ts (definition, :51/:65/:91) and exactly one usage —
      src/components/review/ReviewScreen.tsx:275 `{firm.attorneyName}`. Nothing else.
      https://myletterofintent.com/about -> 404.
      audit/evidence/screenshots/home-1440.png (local): full-page homepage shows no
      person, no bio, no credential block, no organisational logos anywhere between the
      masthead and the footer.
  confidence: INSPECTED
  who_is_affected: >
    Every first-time visitor, and disproportionately the ones who arrive cold from a
    search rather than warm from a trusted gatekeeper — exactly the traffic every other
    finding in this file is trying to create.
  why_it_matters: >
    For this artifact, "who made this" is conversion mechanics, not decoration. The
    privacy page argues the technical case well (it even tells the reader to open devtools
    and watch the network tab — an unusually strong, checkable claim). What it never
    answers is the human question: who are you, why did you build this, and what is in it
    for you. Sending traffic here before answering that spends attention the site cannot
    convert.
  standard_reference: >
    Not a standard. Closest analogue: Google's E-E-A-T guidance on "About us" /
    authorship for YMYL (your-money-or-your-life) topics, which this squarely is.
  recommendation: >
    One short page, /about, and a compact block on the homepage: the attorney's name,
    photo, the bio already written in firm.ts, one honest paragraph on why a Virginia
    estate-planning firm publishes a free national tool (including that it is marketing —
    saying so is more persuasive than not saying it), and a "last reviewed" date. Link it
    from the footer's "The tool" column. Feed the same facts into the A9-002 JSON-LD.
  scope: current
  privacy_impact: None — this is the owner's own information, published deliberately.
  cost_and_maintenance: One page plus a yearly date bump.
  effort: M
  risk_of_change: >
    Low technically. Non-trivial editorially: the page must not read as a law-firm
    advertisement, or it damages the very trust it is meant to build, and it worsens
    A9-013.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A9-012
  title: Zero social proof of any kind, and no honest way to get any without breaking the privacy model
  category: trust threshold
  what_i_observed: >
    No testimonials, no usage counts, no organisational endorsements, no professional
    quotes, no "as recommended by", no press. The only third-party trust artifact anywhere
    is an outbound "Leave a review" button on /letter/review pointing at the firm's Google
    Business Profile.
  evidence:
    type: screenshot + code
    detail: >
      audit/evidence/screenshots/home-1440.png (local) — the full homepage, top to
      bottom, carries none. Repo grep for /testimonial|Trusted by|as seen|endorse/ -> no
      matches. src/components/review/ReviewScreen.tsx:248-255 is the only review
      mechanism, and it asks for a review of the *firm* (firm.reviewUrl, verified 200),
      not of the tool.
  confidence: INSPECTED
  who_is_affected: Every cold visitor deciding whether to type a diagnosis into a website.
  why_it_matters: >
    The tool cannot use the ordinary evidence of use — it has no accounts, no analytics on
    outcomes, and it must never quote a family's letter. That constraint is correct and I
    am not proposing to weaken it. But the constraint means social proof has to be
    *sourced from professionals and organisations rather than from users*, and none has
    been sought. That is the single largest untapped conversion lever on the site, and it
    is also the same asset that unlocks the gatekeeper channels.
  standard_reference: n/a.
  recommendation: >
    Pursue, in this order, because each is cheap and each unlocks the next:
      1. Two or three named professional endorsements — a special-needs planning attorney
         outside the firm, a hospital social worker, an Arc or P2P chapter coordinator —
         each a one-sentence quote with name, role and organisation, used with written
         permission.
      2. A "used by" list of organisations that link to it, once any do.
      3. A genuinely honest usage statement only if it can be true and verifiable from
         page views alone (e.g. "families in all 50 states have opened it") — and if it
         cannot be stated honestly, state nothing.
    Never publish a family testimonial that quotes or characterises a letter, and never
    solicit one from someone who has just used the tool at their most vulnerable. If a
    family volunteers one, it must be about the *experience of writing*, never the child.
  scope: current
  privacy_impact: >
    The recommendation as written moves no user data off any device: professional
    endorsements are solicited outside the product, and the "used by" list is public
    information. The variant I explicitly rule out — in-product testimonial capture — would
    move user data and is rejected on that basis, not merely deprioritised.
  cost_and_maintenance: >
    Outreach time, not engineering time. A handful of emails plus permission records.
    Ongoing: revalidate quotes yearly and remove any organisation that stops linking.
  effort: L
  risk_of_change: >
    Reputational: an endorsement from a professional who later dislikes the tool is
    awkward to unwind. Get permission in writing and offer easy withdrawal.
  mission_impact: 3
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A9-013
  title: Publication by a law firm is simultaneously the strongest and the most limiting trust asset
  category: gatekeeper strategy
  what_i_observed: >
    Trusts & Wealth, PLLC branding is present at every level: the hero eyebrow ("A free,
    private Letter of Intent Builder from Trusts & Wealth, PLLC"), the page title, the
    footer masthead, the short disclaimer on every page, an ATTORNEY ADVERTISING notice,
    the review screen's consult CTA, and — most consequentially — the printed PDF, whose
    cover carries `{firm.name.toUpperCase()}` above the firm's disclaimer, and whose
    document metadata sets `producer` and `creator` to the firm.
  evidence:
    type: code + measurement
    detail: >
      src/app/page.tsx:76 hero eyebrow; src/app/layout.tsx:48 title template;
      src/components/chrome/SiteFooter.tsx:35 and :119-120;
      src/config/firm.ts:98-114 disclaimerShort / disclaimerFull / advertisingNotice;
      src/lib/pdf/loi-document.tsx:252-253 (creator/producer) and :347 (firm name on cover),
      :360 (firm disclaimer on cover), :363 (builder URL).
      Production title tag confirms: "Letter of Intent Builder — Trusts & Wealth, PLLC".
  confidence: INSPECTED
  who_is_affected: >
    Referral from every special-needs-planning attorney who is *not* this firm — which is
    all of them — and from any organisation with a neutrality policy (hospitals, school
    districts, federally funded Parent Training and Information centers, and most Arc and
    P2P chapters, which generally cannot appear to endorse one firm).
  why_it_matters: >
    An attorney hands a client a document that will sit in the client's binder for
    twenty years. If it is branded with a competing firm's name and an ATTORNEY
    ADVERTISING notice, most will not hand it over — not out of pettiness but because it
    would be professionally odd and, in some states, awkward under solicitation rules. The
    same logic blocks a hospital social worker and a PTI. Meanwhile the firm branding is
    what makes the tool credible to a *family*, and removing it would be both dishonest
    and against the owner's interest. This is a genuine tension, not an oversight.
  standard_reference: >
    ABA Model Rules 7.1–7.3 (communications concerning a lawyer's services) as the reason
    professionals are cautious; state analogues vary. I am not giving legal advice and the
    owner is the attorney here — this is why the fix is a *neutral surface*, not a change
    to the notice.
  recommendation: >
    Do not de-brand the tool. Instead, create the neutral surface that the branded tool
    cannot be:
      1. A /for-professionals page written to a professional, not a parent: what the tool
         produces, what it does not claim, where the data lives, what to tell a client,
         and a plain statement that it is free and that no referral fee, data sharing or
         client relationship is involved. Link the samples (A9-007) directly.
      2. A printable, co-brandable one-page handout (generated client-side from the same
         brand system, with an optional "provided by ____" line the professional fills in
         before printing). This is the artifact an attorney or social worker actually
         hands over.
      3. An "attribution-light" print option for the documents themselves: keep
         "Created with the free Letter of Intent Builder · myletterofintent.com" — that
         line is the distribution engine and must stay — but consider whether the firm's
         full name and ATTORNEY ADVERTISING block need to be on the family's cover page,
         or whether they belong on the how-to page behind it. That is a call only the
         owner-attorney can make.
  scope: current
  privacy_impact: >
    None. The co-brandable handout would be generated in the browser from static content
    plus a name the professional types on their own machine; it contains no family data
    and needs no network call, exactly like the existing PDF pipeline.
  cost_and_maintenance: >
    The page is ~1 day of writing. The handout reuses @react-pdf and the existing brand
    tokens — perhaps 2 days including layout. Ongoing: near zero.
  effort: XL
  risk_of_change: >
    Editorial and professional-conduct risk sits with the owner. Technically low. The one
    real risk: a co-brandable handout that looks like the professional wrote it could
    obscure the disclaimer — the disclaimer must be non-removable on any generated asset.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A9-014
  title: Nothing on the site is designed to be handed to a family by a gatekeeper
  category: gatekeeper strategy
  what_i_observed: >
    Every asset the site produces is either the family's own private document or a
    web page. There is no printable one-pager, no waiting-room flyer, no paper worksheet,
    no professional explainer, no embeddable link or badge, no copy-paste resource-page
    blurb, no bulk or classroom mode, and no dedicated landing page for any referral
    source. /for-professionals 404s.
  evidence:
    type: measurement + code
    detail: >
      Complete public asset inventory from public/**: two lockups, a monogram, a video
      poster, the mp4, five font files, four sample PDFs + four PNGs, pdf.worker,
      og-image.png. Nothing printable-for-distribution.
      Complete route inventory from sitemap.xml (30 URLs) plus four noindexed sample
      routes — no professional or partner surface.
      https://myletterofintent.com/for-professionals -> 404.
  confidence: MEASURED
  who_is_affected: >
    Every channel in the map below. A discharge planner has ninety seconds and a printer.
    A P2P support parent has a folder of paper. An IEP advocate has a resource sheet. None
    of them can currently hand over anything but a URL spoken aloud.
  why_it_matters: >
    This is the whole of my assignment in one line: the tool is discoverable only by people
    who already know to look for it, and the people who could put it in front of the
    others have nothing to put. Fixing search (A9-001 through A9-007) raises the ceiling
    slowly; giving a hospital social worker a stack of one-pagers raises it in a week.
  standard_reference: n/a.
  recommendation: >
    Build, in this order of value-per-hour:
      1. A single printable PDF one-pager, downloadable from /for-professionals: what a
         Letter of Intent is, why it matters, the URL and a QR code, and a blank
         "provided by" line. Generated client-side by the existing @react-pdf pipeline so
         it costs no new infrastructure.
      2. /for-professionals itself (A9-013).
      3. A copy-paste "resource listing" block — 40 words, a URL and a 200×200 image — so
         an Arc chapter's webmaster can add the tool to a links page in two minutes.
      4. A printable question worksheet (the A9-005 prompts, on paper) for families
         without reliable device access and for support-group sessions. This one has real
         mission value beyond distribution: it is the offline on-ramp the tool currently
         lacks entirely.
    Deliberately NOT recommended: an embeddable iframe widget. It would put the letter
    form inside a third-party page, which complicates the storage-origin story and the
    frame-ancestors: 'none' posture the site correctly ships today. A link is the right
    integration.
  scope: current
  privacy_impact: >
    None. All four artifacts are static or client-generated and contain no family data.
    The QR code must be generated at build time or client-side, never via a third-party
    QR API — that would put the URL through someone else's server for no reason and add a
    host to the CSP.
  cost_and_maintenance: >
    One-pager ~1 day; professionals page ~1 day; resource block ~1 hour; worksheet ~1–2
    days. Ongoing: refresh the one-pager when the copy changes, i.e. rarely.
  effort: XL
  risk_of_change: Low technically. The main risk is building all four before testing whether one gets used.
  mission_impact: 4
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A9-015
  title: A non-functional email form sits at the moment of maximum trust
  category: trust threshold
  what_i_observed: >
    /letter/review's "Come back in a year" block offers two options side by side. Option
    one (calendar file, .ics generated on-device) works. Option two, "Let us remind you",
    renders a labelled email input and a "Send me the reminder" button that, on submit,
    tells the user the service is not running. The panel is honest — it says "not switched
    on yet" in the eyebrow and again in the body, and /privacy section 05 repeats it — and
    nothing is stored or transmitted.
  evidence:
    type: code + content
    detail: >
      src/components/review/ReminderPanel.tsx:31-33 eyebrow "Option two · not switched on
      yet"; :40-43 "That service is not running yet"; :46-51 the form handler does nothing
      but `setTried(true)`; :88-95 the post-submit message. Rendered from
      ReviewScreen.tsx:466. Privacy page callout at src/app/privacy/page.tsx:271-279.
  confidence: INSPECTED
  who_is_affected: >
    Every family reaching the end of the letter, and every professional evaluating the
    tool — this screen is the one they will look at hardest.
  why_it_matters: >
    The honesty is genuinely admirable and I want to be clear I am not calling it
    deceptive. The problem is different: a form that visibly does nothing is the strongest
    "this product is unfinished" signal on the site, and it is placed at the exact moment
    a family has just invested 45–90 minutes and a professional has just decided whether to
    refer. It also spends the reader's remaining attention on a dead end instead of on the
    backup file, which is the thing they must not leave without.
  standard_reference: >
    Not a WCAG failure — the state is announced via aria-live and the constraint is
    disclosed before interaction. This is a product-judgement finding.
  recommendation: >
    Remove the form and keep the promise. Replace the input and button with one sentence:
    "One day we will offer a single emailed reminder. It is not running yet — use the
    calendar reminder beside this." Give the reclaimed space to the calendar option and to
    a stronger restatement that the backup file is the only way back in. Ship the form
    again on the day the sending side exists, not before.
    If the email reminder IS built later, it needs the block below.
  scope: current
  privacy_impact: >
    Removing the form: none — it strictly reduces the amount of personal data the page
    invites. For the future build, the required block:
      PRIVACY IMPACT
        What data would leave the device: one email address, plus the date the reminder
          should fire. No letter content of any kind, and no name — the reminder must not
          say who the letter is about.
        To where, and who could access it: a mail/scheduling provider chosen by the firm,
          plus the firm itself. Anyone with access to that provider's console or database.
        Whether it is opt-in, default-off, and revocable: opt-in by definition, default
          off, and it must carry an unsubscribe link on the single message and a
          delete-my-address path that does not require an account.
        What the core promise would have to be reworded to: the promise is scoped to
          typed *letter* content and survives intact — but /privacy must move this from
          "not running yet" to an active disclosure naming the processor, the retention
          period, and the deletion route.
        What breach or subpoena exposure this creates: a list of email addresses of people
          who have written a Letter of Intent is, by inference, a list of families with a
          disabled member. That inference is the sensitive part, not the address. It is
          subpoenable and breachable, and it did not exist before.
        Client-side alternative considered, and why it is insufficient: the .ics download
          beside it already solves the problem with zero data leaving the device, and it
          is the better product. It is insufficient only for someone who will not use a
          calendar — which, weighed against creating an inferable disability list, does
          not justify the exposure. My recommendation is to not build it.
  cost_and_maintenance: Removal is minutes. Not building the service saves the whole cost.
  effort: S
  risk_of_change: None.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A9-016
  title: Shared links carry no attribution, so every referral channel collapses into "direct"
  category: measurement / share mechanics
  what_i_observed: >
    Every share target, the native share sheet, the copy-link control and the pre-written
    message all send the bare string `https://myletterofintent.com` with no parameter of
    any kind. GA4 therefore cannot distinguish a link texted by one parent to another, a
    link posted in a diagnosis Facebook group, a link on an Arc chapter's resource page,
    and someone typing the URL from a printed handout. All of it lands in one bucket.
  evidence:
    type: code + measurement
    detail: >
      src/lib/share.ts:12 `export const SHARE_URL = firm.appUrl;` — used unmodified in all
      eight targets (:48, :54, :60, :66, :72, :78, :84 via MAIL_BODY:42, :90) and in
      `nativeShareData` (:95-99).
      Observed GA4 hit from production, 9 Aug 2026:
      `...&dl=https%3A%2F%2Fmyletterofintent.com%2F&dt=Letter%20of%20Intent%20Builder...&en=page_view`
      — the landing URL carries nothing that identifies a channel.
  confidence: MEASURED
  who_is_affected: The owner. Indirectly every family, because effort will keep going to channels that may be doing nothing.
  why_it_matters: >
    Referral-source diversity is the metric that actually matters for this product, and it
    is currently unmeasurable. Without it there is no way to learn that (say) the Arc
    chapter link outperforms every social share ten to one, which is exactly the kind of
    finding that would redirect a year of effort.
  standard_reference: GA4 traffic-source attribution / UTM parameter conventions.
  recommendation: >
    Add a channel parameter to outbound-facing links only:
      - each share target gets its own tag (`?s=text`, `?s=email`, `?s=fb`, …) — a short
        custom parameter reads less like surveillance in a message than `utm_source`, and
        GA4 can be configured to read it;
      - each gatekeeper gets a distinct tagged URL or, better, its own short landing path
        so the link is speakable on a phone and printable on a handout;
      - the printed PDFs and the one-pager keep the clean bare URL — a document that will
        be photocopied for twenty years should not carry a campaign tag.
    Explicitly do NOT tag the copy-link control with anything user-identifying. The tag
    must describe the channel, never the sharer.
  scope: current
  privacy_impact: >
    No user data leaves any device. The parameter is a static string chosen at build time
    describing which button was pressed; it contains nothing about the person, and the
    recipient's page view is one that GA4 already receives today. The one thing to avoid is
    any per-share unique identifier, which would turn a channel tag into a social graph —
    that is out of the question and I am not recommending it.
  cost_and_maintenance: >
    A few hours. Ongoing: a naming discipline, and one GA4 configuration step to register
    the custom parameter (or just use utm_source if the owner prefers standard tooling).
  effort: M
  risk_of_change: >
    Low. Cosmetic risk only: a longer, uglier URL in a text message, which is why I prefer
    a short parameter over full UTM strings for the person-to-person channels.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 2
  environment: both

- id: A9-017
  title: The share card leads with the wrong channels and its targets are 22px wide on a small phone
  category: share mechanics
  what_i_observed: >
    The "Pass it along" card presents eight equal icon tiles in a single row, ordered
    Facebook, Nextdoor, Reddit, X, LinkedIn, WhatsApp, Email, SMS. Measured on production:
    22×52 CSS px per tile at a 320px viewport, 29×52 at 375px and 768px, 55×52 at 1440px.
    The two channels a parent actually uses to tell one specific friend — text and email —
    are last in the row and visually identical to X and LinkedIn.
  evidence:
    type: measurement + code
    detail: >
      Playwright against production, 9 Aug 2026, bounding boxes of the eight share anchors:
        320px  -> 22 x 52 (all eight)
        375px  -> 29 x 52
        768px  -> 29 x 52
        1440px -> 55 x 52
      Source: src/components/share/ShareCard.tsx:38 `grid grid-cols-8 gap-2` with
      `h-[52px] w-full` tiles (:9). Order from src/lib/share.ts:44-93.
      All eight endpoints verified reachable in a real browser (Facebook sharer and
      Nextdoor sharekit both return 200 and present a login wall, which is normal).
  confidence: MEASURED
  who_is_affected: Anyone sharing from a phone — the dominant context for this audience.
  why_it_matters: >
    Two separate problems. (a) Ergonomics: 22px-wide targets are hard for a tired parent
    and harder for anyone with a tremor or limited dexterity — and part of this audience
    has disabilities themselves. To be precise and not overclaim: this does **not** fail
    WCAG 2.2 SC 2.5.8, because the spacing exception is met (22px tiles with 8px gaps put
    target centres 30px apart, so 24px-diameter circles do not intersect). It is a
    usability finding, not a conformance failure, and I want that distinction on the
    record. (b) Channel priority: the reframing at the top of this brief is right — nobody
    broadcasts this. The realistic act is one parent telling one other parent, by text.
    That act is currently the seventh and eighth icon in an undifferentiated row.
  standard_reference: >
    WCAG 2.2 SC 2.5.8 Target Size (Minimum) — assessed and NOT failed, via the spacing
    exception. Cited here only to record that I checked rather than assumed.
  recommendation: >
    Restructure the card around the real act: make "Send a text" and "Send an email" two
    full-width labelled buttons at the top (labels, not icons — an icon-only row asks the
    reader to decode glyphs), keep the native share sheet button, and demote the six
    broadcast targets to a smaller secondary row or a "more ways" disclosure. On phones
    the native share sheet is the best control available and should be the most prominent
    thing in the card.
    Keep the pre-written message exactly as it is — it is the strongest asset in this
    section and it correctly carries no payload.
  scope: current
  privacy_impact: >
    None. Every target is a static URL plus the public site address; the card touches no
    letter data, and the existing note "Sharing the link reveals nothing you have written"
    (ShareCard.tsx:83-85) is accurate and should stay.
  cost_and_maintenance: One component; no ongoing cost.
  effort: M
  risk_of_change: >
    Low. Visual-design risk: the eight-tile row is elegant and the owner may prefer it.
    The ergonomic argument is stronger than the aesthetic one here, but it is a judgement
    call and A4/A5 may see it differently.
  mission_impact: 1
  reach: 3
  harm_if_unfixed: 2
  environment: production

- id: A9-018
  title: The emergency sheet — the most-copied artifact the tool produces — does not carry the site address
  category: zero-payload distribution
  what_i_observed: >
    The Letter of Intent PDF's cover carries "Created with the free Letter of Intent
    Builder · myletterofintent.com" at 7.5pt in the faintest grey on the page. The
    emergency information sheet — the single page explicitly designed for the fridge, the
    school office, the sitter and the ER — names the builder and the firm but omits the
    URL entirely.
  evidence:
    type: code
    detail: >
      src/lib/pdf/loi-document.tsx:362-364 —
        <Text style={{ fontFamily: SANS, fontSize: 7.5, color: FAINT, marginTop: 8 }}>
          Created with the free Letter of Intent Builder · {firm.appUrlLabel}
      src/lib/pdf/emergency-document.tsx:340-344 —
        "Long entries may be shortened here — full detail lives in the complete Letter of
         Intent. Prepared with the free Letter of Intent Builder from {firm.name}.
         Not a medical or legal document."
      No `firm.appUrl` / `firm.appUrlLabel` reference anywhere in emergency-document.tsx.
      Sample: src/lib/content/samples.ts:58-61 describes exactly who receives this page.
  confidence: INSPECTED
  who_is_affected: >
    Every professional who ever sees an emergency sheet — school nurses, substitute
    teachers, respite workers, paramedics, ER staff, day-programme managers. This is the
    highest-circulation, highest-professional-density artifact the tool produces, and each
    of those people is themselves a potential gatekeeper for other families.
  why_it_matters: >
    This is the purest distribution opportunity in the whole product: it carries no
    payload risk whatsoever (it is a static string, not user data), it costs nothing, and
    it reaches exactly the professionals who would recommend the tool to the next family.
    A school nurse who reads a beautiful one-page emergency sheet and wants one for
    another student currently has no way to find where it came from.
  standard_reference: n/a.
  recommendation: >
    Add `· {firm.appUrlLabel}` to the emergency sheet's footnote, styled to match the
    letter's cover treatment. Separately, reconsider 7.5pt/FAINT on the letter's cover —
    the point of that line is to be readable by a stranger holding the page in twenty
    years' time, and the current styling optimises for invisibility. Legible-but-quiet
    beats invisible; this is the cheapest reach improvement in the entire audit.
  scope: current
  privacy_impact: >
    None whatsoever. A static, publicly known URL is added to a document the family
    already controls entirely and chooses whether to hand out. No data leaves any device;
    the PDF is generated in the browser.
  cost_and_maintenance: Minutes. No ongoing cost.
  effort: S
  risk_of_change: >
    Layout only — the emergency sheet is deliberately one page, so whoever makes this
    change should re-render the maximal fill level (audit/evidence/pdfs/maximal--*) and
    confirm it has not spilled to a second page.
  mission_impact: 2
  reach: 4
  harm_if_unfixed: 1
  environment: both

- id: A9-019
  title: Referrer-Policy no-referrer means the firm can never attribute a client to the tool
  category: measurement / attribution
  what_i_observed: >
    Production sends `referrer-policy: no-referrer` on every response. I confirmed the
    consequence empirically: clicking an outbound firm link from /letter/review sends no
    Referer header at all. Inbound attribution is unaffected — a soft navigation inside
    the site does populate GA4's `dr` parameter, and an inbound link's referrer is
    governed by the *referring* site's policy, not this one.
  evidence:
    type: network + measurement
    detail: >
      Response header, https://myletterofintent.com/ , 9 Aug 2026:
        referrer-policy: no-referrer
      Source: next.config.ts:54.
      Playwright, real click on "Book a conversation" from a rendered /letter/review:
        --- Referer sent to https://trustsandwealth.com/reserve.html: (NO Referer header)
      Contrast, internal soft navigation GA4 hit:
        en=page_view dl=https://myletterofintent.com/letter dr=https://myletterofintent.com/
  confidence: MEASURED
  who_is_affected: The owner's ability to know whether the tool produces consultations.
  why_it_matters: >
    The tool's entire business rationale is that it introduces families to the firm. That
    link is currently unmeasurable: the firm's own analytics will record those visitors as
    direct traffic forever. Without it, there is no evidence base for continuing to invest
    in the tool at all.
  standard_reference: W3C Referrer Policy; the header is correctly applied.
  recommendation: >
    Keep `no-referrer` as the site default — it is the right call and I am not proposing a
    site-wide change. Instead, either (a) add a channel parameter to the two firm CTA URLs
    (e.g. `?from=loi`) once A9-010 fixes them, which is visible, honest and requires no
    header change, or (b) if a real referrer is wanted, set `referrerPolicy="origin"` on
    those two anchors alone so `https://myletterofintent.com` (origin only, never a path)
    is sent. I recommend (a).
  scope: current
  privacy_impact: >
    Option (a) moves no user data: it adds a static string to a URL the user chose to
    click, and the firm's site already receives the visit. Option (b) does disclose
    something real — that this visitor came from a Letter of Intent site, which implies a
    disabled family member — to the firm and to any analytics on the firm's site. That is
    a genuine, if modest, inference, and it is why I prefer (a): a query parameter is
    visible to the user in their own address bar, whereas a referrer header is invisible.
    Neither option involves any typed letter content, and the canonical promise is
    untouched.
  cost_and_maintenance: Trivial; folds into the A9-010 fix.
  effort: S
  risk_of_change: >
    Low. Note (b) would be a weakening of a deliberate security/privacy posture and should
    not be done casually — hence the preference for (a).
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 2
  environment: production

- id: A9-020
  title: GA4 measures page views and nothing else — none of the metrics that define success exist
  category: measurement
  what_i_observed: >
    The only analytics code in the repository is the gtag bootstrap in the root layout.
    There is not one `gtag('event', …)` call anywhere. Every outcome that would tell the
    owner whether this tool works — did anyone start, did anyone finish, did anyone
    download the documents, did anyone take the backup file, did anyone come back a year
    later and restore it — is invisible.
    I also tested, and disproved, the failure I expected to find: GA4 *does* record
    client-side navigations here. A next/link click from / to /letter produced a
    page_view about six seconds later with the correct URL. So the routing side is fine;
    the gap is purely that no events exist.
  evidence:
    type: measurement + code
    detail: >
      Repo grep for /gtag\(|dataLayer/ returns only src/app/layout.tsx:119-122 and the
      analytics config/test. No event calls in any component.
      Playwright against production with google-analytics.com stubbed to 204 so nothing
      reached Google, 9 Aug 2026:
        two hard navigations -> 2 page_views (dl=/ and dl=/privacy) — baseline correct
        hard / then next/link click to /letter, 30s observation:
          t=0.5s   en=page_view dl=https://myletterofintent.com/
          t=11.7s  en=page_view dl=https://myletterofintent.com/letter dr=https://myletterofintent.com/
        (click occurred at t=5.6s, so the soft-nav page_view lags ~6s but does fire)
      The shared production capture likewise contains only `en=page_view` hits
      (audit/evidence/network/capture-production.json, 6 collect requests, all page_view).
  confidence: MEASURED
  who_is_affected: The owner, and every future decision about where to spend effort.
  why_it_matters: >
    The brief asks for the right metrics, and the right metrics for this product are:
    referral-source diversity, start-to-completion rate, return-for-update rate, and
    gatekeeper adoption. Exactly zero of them are computable today. Page views measure
    whether marketing worked; they cannot tell you whether a single family finished a
    document. Given that most families never finish a Letter of Intent, "did they finish"
    is the only number that matters — and it happens to be perfectly measurable
    client-side without touching a word of anyone's letter.
  standard_reference: GA4 recommended events / custom events.
  recommendation: >
    Add a small, deliberately boring event set. Every one of these is derivable from state
    the browser already has, and none carries a value the family typed:
      - letter_started            (first section opened; parameter: which path)
      - section_completed         (parameter: section slug only — never field values)
      - review_reached
      - document_downloaded       (parameter: "letter" | "emergency" | "backup")
      - backup_restored           (the return-for-update signal)
      - reminder_ics_downloaded
      - share_opened              (parameter: target key)
      - sample_viewed             (parameter: sample slug)
    From these: start-to-completion rate, the exact section where people stop (the single
    most actionable number in the product), download rate, and return rate.
    Hard rules for whoever implements it: no event parameter may ever contain a field
    value, a name, a diagnosis, a free-text string, a character count, or a word count —
    a word count of a "final wishes" section is inference-bearing and must not be sent.
    Add a test alongside src/config/analytics.test.ts that fails if any gtag call passes a
    value not drawn from a fixed allow-list of literals.
    Also enable GA4 Consent Mode, which the brief lists as acceptable — it lets the
    counting continue while honouring a refusal, and costs nothing.
  scope: current
  privacy_impact: >
    PRIVACY IMPACT
      What data would leave the device: the fact that an anonymous visitor started a
        letter, reached a named section, downloaded a document, or restored a backup —
        plus GA4's existing page-level context (approximate region, device, referrer).
        No field value, no name, no diagnosis, no free text, no length, no timing of
        typing. Nothing a family wrote.
      To where, and who could access it: Google Analytics, under the same terms already
        disclosed in /privacy section 04; the owner via the GA4 console.
      Whether it is opt-in, default-off, and revocable: it inherits the current model —
        on by default, revocable by Google's opt-out add-on and by any tracker blocker,
        both already documented on /privacy. Consent Mode would make refusal
        first-class rather than dependent on a browser extension.
      What the core promise would have to be reworded to: the promise — "everything you
        type stays on your device" — remains literally true and needs no rewording. But
        /privacy section 04 currently says analytics "counts that a page was opened,
        never what was written on it", and that sentence must be widened to something
        like "counts that a page was opened and which steps were reached — never what was
        written on any of them." Shipping the events without that edit would make the
        privacy page inaccurate, and that is a worse outcome than not shipping them.
      What breach or subpoena exposure this creates: a GA4 property containing
        "someone in this region started a special-needs Letter of Intent" is an
        inference about an unnamed visitor. It is materially the same class of exposure
        the existing page_view on /letter/final-wishes already creates — GA4 already
        records that URL — so this widens an existing exposure rather than opening a new
        one. It remains subpoenable from Google.
      Client-side alternative considered, and why it is insufficient: completion state
        could be shown to the user on their own device and never transmitted, which is
        strictly better for them and tells the owner nothing. There is no client-side way
        to answer "do families finish this" in aggregate. Given the owner has already
        decided GA4 stays, and given these events add no content and only step-level
        facts, I judge the trade acceptable — but it is a judgement, not a neutral fact,
        and the owner should make it knowingly.
  cost_and_maintenance: >
    Half a day to implement, plus the allow-list test. Ongoing: the discipline never to
    add a parameter carrying user text — which is why the test matters more than the
    events do.
  effort: M
  risk_of_change: >
    Moderate and worth naming plainly: this is the one recommendation in my file that
    increases what leaves the device. A careless later addition — "let's also send how
    many characters they wrote" — would breach the promise. The allow-list test is not
    optional garnish; it is the control that makes this safe.
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 2
  environment: both

- id: A9-021
  title: English only, in channels that are substantially bilingual
  category: reach / equity
  what_i_observed: >
    `<html lang="en">` is the only language declaration in the codebase; there is no i18n
    library, no locale routing, no translated content, and no Spanish anywhere. The PDFs,
    the emergency sheet and the samples are English only.
  evidence:
    type: code
    detail: >
      Repo grep across src for /lang=|i18n|locale|Spanish/ returns exactly one hit:
      src/app/layout.tsx:89 `lang="en"`. No next-intl, no next-i18next, no [locale]
      route segment, no message catalogue.
  confidence: INSPECTED
  who_is_affected: >
    Spanish-speaking families, who are a large share of the caseload at exactly the
    gatekeepers with the most reach: state Parent Training and Information centers (which
    carry a federal obligation to serve underserved populations and are frequently
    bilingual), Part C early intervention, hospital social work, and many Arc and P2P
    chapters.
  why_it_matters: >
    This is the largest single reach ceiling on the tool, and it is also the finding most
    likely to make a PTI or a hospital decline to distribute it — an organisation with a
    language-access obligation cannot hand out an English-only resource as its answer.
  standard_reference: >
    Not WCAG (SC 3.1.1 is satisfied — the page correctly declares its language). This is a
    language-access and equity matter, informed by the language-access obligations
    attached to federally funded PTIs and to hospitals receiving federal funds.
  recommendation: >
    Do not machine-translate this. The content includes end-of-life wishes and behavioural
    crisis guidance, where a mistranslation is genuinely harmful, and a bad Spanish
    version would damage trust with the exact community it is meant to serve.
    If Spanish is pursued, do it properly: professional translation reviewed by a
    bilingual special-needs professional, locale routing, translated PDFs, and a
    commitment to keep both in sync. Treat it as a distinct project with its own budget,
    not a feature.
    A cheap interim step with real value: a single Spanish-language page explaining what
    the tool is and stating plainly that the tool itself is currently English only, so a
    Spanish-speaking family is not left guessing — and so a bilingual gatekeeper has
    something honest to hand over.
  scope: architectural
  privacy_impact: >
    None if implemented as static translated content, which is the only implementation I
    would endorse. Any runtime translation service would send page content — and
    potentially field labels adjacent to user input — to a third party, and must not be
    used.
  cost_and_maintenance: >
    Substantial and ongoing, which is the honest reason this may not be the right next
    move. Professional translation of ~25 sections plus the marketing surface is a
    multi-thousand-dollar engagement; every future copy edit doubles; the PDF pipeline
    needs a second font subset check (the bundled Cormorant/Mulish/Cinzel subsets are
    latin, which covers Spanish, but this needs verifying rather than assuming).
    New failure modes: content drift between locales, a half-translated document handed to
    a family, and a stale Spanish version that is worse than none.
  effort: XL
  risk_of_change: >
    High if done cheaply, low if done properly. The interim single page is near-zero risk.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A9-022
  title: The explainer video has no captions and no transcript — an accessibility failure that also forfeits the site's best crawlable prose
  category: accessibility + content
  what_i_observed: >
    The homepage video is a self-hosted mp4 with no <track> element and no transcript
    anywhere on the site. The component carries an explicit comment acknowledging this:
    "No caption track: the same explanation is written out in full in the column beside
    this player." The column beside it is roughly 150 words; the video is described in its
    own caption as "about 2 minutes", so the two are not equivalent.
  evidence:
    type: code + measurement
    detail: >
      src/components/home/VideoPlayer.tsx:201-215 — the <video> element has src, poster,
      controls, playsInline, preload, tabIndex and handlers, and no child <track>.
      Comment at :201-202. Production HTML confirms:
        <video src="/what-is-a-letter-of-intent.mp4" controls playsInline preload="auto" ...>
      with no <track> and no <source>. No .vtt file exists anywhere under public/.
      Side text: src/app/page.tsx:272-289 (~150 words).
  confidence: MEASURED
  who_is_affected: >
    Deaf and hard-of-hearing visitors — including aging grandparents becoming guardians,
    a named audience for this product. Anyone in a quiet room, a hospital corridor, or a
    waiting area without headphones. Anyone who processes written language more easily
    than speech, which includes a meaningful share of this audience.
  why_it_matters: >
    Primary reason is accessibility, which outranks distribution in the governing
    hierarchy, and I want that recorded even though it is not my lane: the video is the
    only place the "what is this and why should I bother" explanation is given at length,
    and a deaf parent cannot get it. The distribution consequence is secondary but real:
    two minutes of the clearest plain-language explanation the project owns exists only as
    audio, so it contributes nothing to search, nothing to an AI assistant summarising the
    site, and nothing to a gatekeeper skimming for a paragraph to quote.
  standard_reference: >
    WCAG 2.2 SC 1.2.2 Captions (Prerecorded), Level A — prerecorded synchronised media
    requires captions. Also SC 1.2.3 Audio Description or Media Alternative (Prerecorded),
    Level A, which a full transcript would satisfy.
  recommendation: >
    Add a WebVTT caption track (a two-minute video is roughly an hour of careful manual
    captioning, or minutes of machine transcription plus careful human correction — and it
    must be corrected, because this script contains terms a transcriber will mangle).
    Then publish the transcript as visible text on the page, in a <details> below the
    player. The transcript is the version that helps the most people: it is readable,
    skimmable, quotable, printable, translatable, and crawlable, and unlike the video it
    works for someone on a metered connection.
  scope: current
  privacy_impact: >
    None if the .vtt is served from the same origin as everything else. Do not use a
    third-party captioning or video-hosting service that loads a player from another
    domain — that would add a host to a deliberately tight CSP and put a tracker on the
    page. Machine transcription is fine as a drafting aid provided the audio file is
    uploaded by the owner from their own machine, not by the site.
  cost_and_maintenance: >
    A few hours once. Re-do only if the video is re-cut.
  effort: M
  risk_of_change: Very low. Adding a <track> and a <details> block cannot break playback.
  mission_impact: 3
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A9-023
  title: A Cloudflare analytics beacon runs in production, is not in the CSP, and is not disclosed on the privacy page
  category: trust / transparency (cross-lane)
  what_i_observed: >
    The shared production capture records a request to static.cloudflareinsights.com —
    a fourth host, alongside the site itself, googletagmanager and google-analytics. The
    site's CSP `connect-src` and `script-src` list only 'self' and the four Google
    analytics hosts; Cloudflare is on neither. /privacy section 04 discloses Google
    Analytics and "ordinary web server logs" but names no Cloudflare product.
  evidence:
    type: network + measurement
    detail: >
      audit/evidence/network/capture-production.json, uniqueHosts:
        ["myletterofintent.com", "static.cloudflareinsights.com",
         "www.google-analytics.com", "www.googletagmanager.com"]
      Request URL recorded:
        https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496
      Production CSP header (verified myself, 9 Aug 2026) contains no cloudflareinsights:
        script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com
        https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com
      The beacon tag is NOT present in the origin HTML I fetched with curl, which is
      consistent with edge injection by Cloudflare rather than anything in this codebase.
      Also present: Report-To / NEL headers pointing at a.nel.cloudflare.com.
  confidence: MEASURED
  who_is_affected: Anyone reading /privacy and taking it as the complete list.
  why_it_matters: >
    Two things, and only the second is mine. The security/CSP question belongs to another
    analyst and I am not adjudicating it. The distribution-relevant point is that /privacy
    is this product's single most important conversion asset, and its credibility depends
    on being exhaustive. A reader who opens devtools — which that very page invites them to
    do — will see a host the page does not mention. That is a small, avoidable dent in the
    one document that has to be beyond reproach.
  standard_reference: n/a — disclosure completeness.
  recommendation: >
    Establish whether Cloudflare Web Analytics / RUM is enabled on the zone (this is a
    dashboard setting, not a code change). Then either disable it, or disclose it on
    /privacy in the same plain language used for Google. Note the useful side: if it stays,
    Cloudflare Web Analytics is cookieless and would give referral-source data for A9-016
    without adding anything to what GA4 collects.
    I am flagging, not resolving — the CSP implication is another analyst's call.
  scope: current
  privacy_impact: >
    Not assessed by me beyond the disclosure gap. The beacon is a Cloudflare RUM script;
    what it collects is a question for whoever owns the privacy/security lane. It is
    plainly not letter content — no letter data can reach it under the current
    architecture — but the disclosure gap stands regardless.
  cost_and_maintenance: A dashboard toggle plus one paragraph, or one paragraph alone.
  effort: S
  risk_of_change: Low.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 2
  environment: production

- id: A9-024
  title: Production currently shows a posterless video, so referred first-time visitors see a blank player
  category: deployment gap (reported as instructed, not as a defect)
  what_i_observed: >
    Production renders the <video> element directly with no poster button. Local (and
    therefore every screenshot in audit/evidence/screenshots/) shows the navy section with
    the lockup poster and a gold "Watch" pill.
  evidence:
    type: measurement + screenshot
    detail: >
      Production homepage HTML contains, on first paint:
        <video src="/what-is-a-letter-of-intent.mp4" controls playsInline preload="auto"
               tabindex="0" class="absolute inset-0 size-full bg-navy900 object-contain ...">
      i.e. the player is mounted immediately with no poster gate.
      Local build (src/components/home/VideoPlayer.tsx:161-198, uncommitted) mounts a
      poster button first and only mounts <video> after `playing` becomes true.
      audit/evidence/screenshots/home-1440.png (captured from localhost per
      audit/tools/capture-artifacts.mjs:16) shows the poster + Watch pill.
  confidence: MEASURED
  who_is_affected: >
    Every visitor to production right now — including anyone arriving from any of the
    channels this analysis recommends building.
  why_it_matters: >
    Only reason I raise it in a distribution file: the first impression is the conversion
    surface, and today a referred visitor may see a dark, empty player where the local
    build shows a branded poster and a clear invitation. If any gatekeeper outreach begins
    before this ships, it lands on the weaker page.
  standard_reference: n/a.
  recommendation: >
    Sequencing, not engineering: deploy the pending src/app/page.tsx and
    src/components/home/VideoPlayer.tsx changes before any outreach in the channel map
    begins. Not a defect — the fix already exists locally.
  scope: current
  privacy_impact: None.
  cost_and_maintenance: None.
  effort: S
  risk_of_change: n/a — already-written change.
  mission_impact: 1
  reach: 4
  harm_if_unfixed: 1
  environment: production
```

---

## THE GATEKEEPER CHANNEL MAP

What each gatekeeper needs before they will refer, and what the site would have to offer.
Everything in the "what they need" column is a judgement informed by how these
organisations work, not something I measured on this site — I have marked the two places
where I verified an external fact. Everything in the "site has it today" column IS
verified against the code and production.

| Channel | What they actually hand a family | Would they be comfortable? | What the site must offer | Site has it today |
|---|---|---|---|---|
| **Special needs trust / estate attorneys (other firms)** | A packet at signing: trust summary, funding checklist, and usually a blank LOI template | **Not as it stands.** A competitor firm's name and an ATTORNEY ADVERTISING notice go into their client's permanent binder | A neutral `/for-professionals` page; a co-brandable handout with a "provided by ___" line; a sample they can inspect before recommending; explicit "no referral fee, no data sharing, no client relationship" language | None. `/for-professionals` 404s. Branding is on the PDF cover (`loi-document.tsx:347`) and in PDF metadata (`:252-253`) |
| **Trusts & Wealth PLLC itself (the publisher)** | Its own clients | Yes — this is the intended path | Working CTAs and a way to attribute a client to the tool | **Broken today: both CTAs 404 (A9-010) and no attribution (A9-019)** |
| **Special education advocates / IEP consultants** | A resource sheet, usually a Word doc or a links page, given at intake | Yes — they are vendor-neutral by habit and this costs their client nothing | A copy-paste resource blurb + image; a deep link to the education/transition section; ideally a print worksheet for a parent who will not open a laptop | No resource blurb; section deep links are de-indexed (A9-001); no worksheet |
| **Hospital / clinic social workers, care coordinators, discharge planners** | Paper. Photocopied handouts from a drawer, at discharge, under time pressure | Yes, if it is paper and if it is free and requires no account | A printable one-pager with a QR code; a Spanish version; nothing requiring a login | **No printable handout exists.** No Spanish (A9-021). No account is required, which is the one box already ticked |
| **Palliative / hospice teams** | Legacy and advance-planning materials; they are already having the hardest conversation | Yes — the "personal message" and "final wishes" sections map exactly onto their work | The same one-pager, plus honest framing that the tool gates the final-wishes section gently (it already does, `SectionScreen.tsx:116-140` — a real asset worth telling them about) | The gate exists and is good; nothing tells a professional it exists |
| **Parent to Parent USA chapters** | Peer support-parent matches; a folder of local resources | Yes, strongly — but chapters are often Arc-affiliated and neutrality-sensitive | Neutral surface; a link a coordinator can put on a page in two minutes; ideally Spanish | Nothing chapter-facing |
| **The Arc affiliates** | **Verified:** The Arc publishes its own national LOI resource (`thearc.org/resource/letter-of-intent/`) and chapters distribute LOI templates as downloadable files | Only if the tool is positioned as complementing, not competing with, their existing template | A page that says explicitly "if your Arc gave you a template, this fills the same need without the blank page"; the neutral surface again | No such positioning anywhere; the incumbent template is never acknowledged |
| **UCP, Easterseals** | Service-line materials, family resource pages | Yes, with neutrality | Resource blurb + logo-free landing page | None |
| **State Parent Training & Information centers (PTIs)** | Federally funded training and materials; language access is part of their remit | Conditional — English-only is a genuine obstacle for many | Spanish (A9-021); a professional-facing explainer; printable materials | None of the three |
| **Diagnosis-specific national orgs and local chapters** | Newly-diagnosed packets, condition-specific guides | Yes, if the tool is visibly relevant to their diagnosis | Content that uses their words. Today the homepage contains zero occurrences of "autism", "Down syndrome", "IEP", "SSI", "Medicaid", "ABLE" (A9-006) | None |
| **School transition coordinators (14–22 transition planning)** | Transition packets at the annual IEP | Yes — an LOI is a natural transition artifact | A deep link to the school/work and housing sections; a worksheet for a transition meeting | Deep links de-indexed (A9-001); no worksheet |
| **Part C early intervention** | Materials at the first, most overwhelmed moment | Cautiously — an LOI can feel premature at diagnosis | Framing that says "ten minutes now, not a whole document"; the tool already says exactly this ("A ten-minute sitting is a real contribution", `page.tsx:35`) but nothing professional-facing repeats it | Copy exists; no professional surface carries it |
| **Financial advisors in special needs planning** | Funding illustrations, trust coordination materials | Yes — an LOI is outside their scope so there is no conflict | `/for-professionals`; a sample; a statement that nothing is collected | None |
| **ABLE account programs (state-run)** | Enrolment materials, family education | Yes, but they are state entities and neutrality-bound | Neutral surface; content that mentions ABLE accounts at all (currently zero occurrences) | None |
| **Facebook groups by diagnosis and by state** | Peer recommendation in a comment thread | Norm: members share resources constantly; **admins ban vendors who post their own link.** The only acceptable pattern is a member answering someone else's question, or an admin adding it to the pinned resources | An OG preview that reads as an invitation (it does — `og:title` is the hero line and `og:image` is a proper 1200×630 lockup, verified 200); a link with nothing to sign up for | The share preview is genuinely good. What is missing is the admin-facing resource blurb |
| **Reddit (r/SpecialNeedsChildren, r/Autism_Parenting, r/estateplanning, state subs)** | Comment recommendations | Norm: self-promotion is removed; disclosure of affiliation is expected and usually forgiven if the resource is free and genuinely useful. **Never post your own link to a thread you did not answer** | The same neutral surface; a page an unaffiliated commenter can link without it looking like an ad | Share card includes a Reddit target that posts the *homepage* — the wrong pattern for that platform's norms |
| **Forums / listservs by state (special-needs planning, guardianship)** | Long-form posts, often by professionals | Yes, from professionals | `/for-professionals` again | None |

**The single highest-leverage item across the entire table** is the one artifact that
appears in eight rows: a printable, co-brandable one-pager with a QR code, plus the
neutral `/for-professionals` page it downloads from. That is A9-013 and A9-014.

---

## SEARCH: what caregivers type, and what the site answers

Intent, in caregivers' words, and what exists today:

| Query intent | Site's answer today |
|---|---|
| "letter of intent special needs" | Homepage. Reasonable, though the title leads with the firm name |
| "special needs trust letter of intent template" | **Nothing.** The word "template" appears nowhere. The samples that would answer it are `noindex` (A9-007) |
| "what happens to my child when I die" | **Nothing.** No page addresses this question, which is the emotional entry point for most of this audience |
| "who will take care of my disabled child" | **Nothing** |
| "letter of intent example / sample" | Exists (`/samples/*`) and is deliberately de-indexed (A9-007) |
| "what to include in a letter of intent" | The prompts answer this perfectly and are invisible to crawlers (A9-005) |
| "letter of intent vs will" | **Nothing** |
| "letter of intent for adult child with autism" | **Nothing** — "autism" appears zero times |
| "SSI / Medicaid / ABLE and my child's future" | **Nothing** — all zero occurrences |
| "guardianship letter to future guardian" | "guardian" appears twice on the homepage |
| brand: "my letter of intent" | Homepage, correctly |

**Head-tag audit, production, 9 Aug 2026 — complete.** The head contains exactly:
`charSet`, `viewport`, `title`, `description`, `canonical`, `og:title`, `og:description`,
`og:url`, `og:site_name`, `og:image` (+width/height/alt), `og:type`, `twitter:card`,
`twitter:title`, `twitter:description`, `twitter:image`, `icon`, `next-size-adjust`, and
font/script preloads. **No JSON-LD. No verification tag. No `alternate` hreflang. No
`author`. No `theme-color`.** `robots.txt` and `sitemap.xml` are both present, correct in
form, and internally consistent — except that the sitemap submits 25 URLs that
canonicalise away (A9-001) and omits the four sample pages (A9-007). `og-image.png`
resolves 200 (62,358 bytes, image/png), and the reasoning comment at `layout.tsx:60-66`
about why it exists is sound — without it, chat clients were screenshotting whatever page
was open, which for this product could have surfaced a document preview.

---

## THE TRUST THRESHOLD — what is present, what is missing

**Present, and genuinely strong.** The privacy page is the best asset the site owns for
this purpose. It is written in plain words, it is specific, and — unusually — it makes a
*checkable* claim: it tells the reader to open devtools, watch the network tab, and type
(`privacy/page.tsx:151-156`). Almost nobody will do it, but the willingness to invite it
is the most persuasive sentence on the site. The security posture behind it is real: the
production CSP `connect-src` genuinely restricts egress, `Permissions-Policy` denies
sensors outright, and `frame-ancestors 'none'` is set. The design system reads as
serious. The disclaimer is honest about what the tool is not. The share card explicitly
tells the reader that sharing reveals nothing they have written. The final-wishes
emotional gate is a trust signal in its own right.

**Missing.**
1. Any human. No name, no face, no bio on any page a first-time visitor sees, despite a
   written bio sitting unused in `firm.ts:91-94` (A9-011).
2. Any third-party validation whatsoever (A9-012).
3. Any answer to "why is a law firm giving this away" — which a sceptical reader *will*
   ask, and which has a good, honest answer nobody has written down.
4. A "last reviewed" date. For a document about legal-adjacent planning, currency is a
   trust signal and its absence is noticeable.
5. A working way to reach a human at the end (A9-010 — the buttons 404).

The order matters: **fixing the 404s and adding a human beat every SEO item in this
file.** Driving new traffic to a page that cannot answer "who are you" and whose contact
button is broken converts worse than driving no traffic at all.

---

## SHARE MECHANICS THAT CARRY NO PAYLOAD

The existing share section is better than most. It is correctly built (every target is a
static string plus the public URL — `share.ts`), it explicitly reassures that nothing
private travels (`ShareCard.tsx:83-85`), it provides a pre-written message so an
exhausted parent does not have to compose one, and it acknowledges in code comments that
Facebook and LinkedIn strip pre-filled text, which is why the meta description has to
stand alone. All eight targets are live (verified in a real browser). The `og:image`
exists and is correct. This is a thoughtfully built component.

What holds it back is priority and ergonomics, not correctness (A9-017): the two channels
a parent will actually use — a text and an email to one specific person — are the last two
of eight identical 22-to-29px icons, while the first five are broadcast channels that this
audience will rarely use for this.

The mechanic that would move more than any button, and which is entirely unexploited:
**the printed documents themselves.** A Letter of Intent is read by a trustee, a sibling,
a school, a nurse. The emergency sheet goes on a fridge and into a school office. Each of
those readers is a person who might need this tool. Putting the site address legibly on
both — the letter has it at 7.5pt in the faintest grey, the emergency sheet not at all
(A9-018) — is the cheapest, most privacy-neutral distribution available: the family already
controls the document entirely and chooses whether to hand it over.

---

## WHAT I WOULD *NOT* DO — technically correct, but it would not help that parent

Named explicitly, per the bar set in the brief:

- **A blog or content programme.** A9-004 recommends five pages and then stopping. An
  abandoned blog with a two-year-old last post is a worse trust signal than no blog, and
  the owner has a law practice.
- **Any account, sync, or cloud backup**, however carefully opt-in. The backup file is a
  worse UX and a better product. This is the correct trade and I am not reopening it.
- **An embeddable iframe widget.** It would put the form on someone else's origin and
  complicate the storage story for a marginal integration benefit. A link is right.
- **Testimonials from families.** Even a willing one invites a parent to characterise
  their child publicly at a vulnerable moment. Professional endorsements only (A9-012).
- **Per-share unique identifiers.** Channel tags yes (A9-016); anything that could
  reconstruct who told whom, absolutely not.
- **Machine-translated Spanish.** Worse than nothing on content covering behavioural
  crises and end-of-life wishes (A9-021).
- **AggregateRating / Review schema.** There are no reviews of the tool. Marking up any
  would be fabrication.
- **A "share to unlock" or gamified referral mechanic.** Obviously wrong for this
  artifact, and I mention it only to close the door.
- **Rewriting the H1 for keywords.** "Write down what only you know, so they'll be cared
  for the way that only you have" is the best sentence on the site and it is doing work no
  keyword could. Change the title tag instead (A9-006).

---

## WHAT I EXAMINED, AND WHAT I COULD NOT

**Examined directly.**
- All of `src/app/**` (routes, layout, metadata, sitemap, robots) and the components
  bearing on distribution: `SiteHeader`, `SiteFooter`, `ShareCard`, `PathChooser`,
  `SampleDocuments`, `ReviewScreen`, `ReminderPanel`, `SectionScreen`, `VideoPlayer`.
- `src/config/firm.ts`, `src/config/analytics.ts`, `src/lib/share.ts`,
  `src/lib/content/*` (paths, samples, preview-prompts, section definitions),
  `src/lib/pdf/loi-document.tsx`, `src/lib/pdf/emergency-document.tsx`, `next.config.ts`.
- Production HTTP headers and full head-tag inventory for `/`, `/letter`,
  `/letter/medical`, `/letter/getting-started`, `/letter/review`, `/privacy`,
  `/your-data`, `/samples/letter-of-intent-disabilities`, plus canonical spot-checks on
  seven more section pages. `robots.txt` and `sitemap.xml` fetched and parsed.
- Live status of every outbound link on `/letter/review`, harvested from the rendered DOM.
- GA4 behaviour on production, measured with the collect endpoint stubbed to 204 so
  nothing reached Google: hard-vs-soft navigation page_views with timing.
- Share-tile geometry at 320/375/768/1440 on production; all eight share endpoints opened
  in a real browser.
- `audit/evidence/network/capture-production.json` (hosts, GA collect URLs, per-route
  document titles) and `audit/tools/*.mjs` to establish which environment each evidence
  set came from.
- `audit/evidence/screenshots/home-1440.png`.
- Four live web searches to establish the real competitive SERP and the incumbent
  gatekeeper assets.

**Could not examine, and why.**
- **Google Search Console / Bing Webmaster** — no access, and per A9-003 there may be no
  property at all. So I have *no* data on actual impressions, actual queries, actual
  rankings, or whether Google has in fact dropped the section pages. A9-001 is a certain
  cause with an unverified effect.
- **The GA4 property itself** — no access. I could not check retention settings, whether
  Consent Mode or Google Signals is on, what the data-collection region is, or what the
  historical traffic actually looks like. Everything I say about current traffic volume
  or sources is therefore absent, not estimated.
- **Whether the site is indexed at all.** My web searches did not surface it, but that
  search engine is not Google and absence there is weak evidence. I have deliberately not
  claimed the site is unindexed.
- **DNS records**, so DNS-based Search Console verification cannot be ruled out (noted in
  A9-003).
- **Any real gatekeeper.** I did not contact a single attorney, social worker, Arc
  chapter or PTI. Every "would they be comfortable" judgement in the channel map is
  reasoning about how those organisations work, not a finding about this site. The two
  external facts I did verify are marked.
- **The video's audio content** — I did not watch or transcribe it, so I cannot say how
  much of the ~2 minutes is unique information versus a restatement of the side column.
- **The PDF text layer.** `pdftoppm` is not installed and `strings` found nothing in the
  compressed streams, so my PDF findings come from the generating source
  (`loi-document.tsx`, `emergency-document.tsx`), not from reading the rendered output.
  I did not verify the rendered position or legibility of the attribution line — only that
  the code emits it at 7.5pt in the FAINT colour.
- **Cloudflare's zone configuration**, so I could not confirm whether Web Analytics is
  deliberately on (A9-023).

**Files I created:** this file only. Two throwaway measurement scripts live in the session
scratchpad outside the repository and touch nothing in it.

---

## THREE HIGHEST-CONFIDENCE FINDINGS

1. **A9-010 — both firm CTAs 404.** Requested the live URLs harvested from the rendered
   production DOM; both returned 404 twice, by two different methods. The correct
   replacement URLs were confirmed 200. There is no interpretation involved.
2. **A9-001 — all 25 section pages canonicalise to the homepage.** Verified on nine
   distinct section URLs on production, with the exact causing line identified in the
   source and a correctly-behaving sibling route (`/letter/review`) as the control.
3. **A9-020 — GA4 is page_view-only.** Repository-wide grep found no event call, and I
   measured live GA4 traffic with the endpoint stubbed. This one also corrected an
   assumption I arrived with: I expected soft navigations to be uncounted, measured it,
   and found they *are* counted with a ~6-second lag. The finding is narrower and more
   accurate than what I set out to write.

## THREE LEAST-CONFIDENT FINDINGS

1. **A9-013 — the law-firm-publisher referral barrier.** The branding facts are certain;
   the claim that other attorneys will therefore decline to hand it over is my reasoning
   about professional behaviour, with zero evidence from this site's actual referral
   history. It is the load-bearing assumption under half the channel map, and it is the
   single thing I would test first. One phone call to one unaffiliated special-needs
   attorney would confirm or demolish it.
2. **A9-004 — the content gap and its size.** The absence of content is measured. The
   claim that filling it would meaningfully change reach depends on search volume,
   competitive difficulty, and this domain's authority — none of which I could observe.
   The recommendation is XL effort resting on INFERRED benefit, which is the worst
   risk/evidence ratio in my file. This is exactly why A9-003 (Search Console) should
   come first.
3. **A9-021 — English-only reach.** That the site is English-only is certain. That
   Spanish would unlock PTI and hospital distribution is inference from how those
   organisations operate, unquantified for this product, and it recommends the most
   expensive and highest-maintenance change in the file. I would not spend on it before
   one bilingual gatekeeper says it is the blocker.

I will also flag one thing I nearly published and did not: I initially believed GA4 was
missing all client-side navigation page_views, which would have been a dramatic finding.
Two measurements showed it, a third with a longer observation window disproved it. The
claim is not in this file.

## WHAT I WOULD NEED TO BE MORE CERTAIN

1. **Google Search Console access** — the single highest-value item. It would convert
   A9-001's effect, A9-004's sizing, A9-006's keyword argument and A9-007's trade-off
   from inference to measurement, and it would show the real words families type, which
   beats every assumption in this document.
2. **GA4 property access** — current traffic, sources, and the landing-page distribution.
   Without it I cannot say whether the site currently gets ten visitors a month or ten
   thousand, which changes which recommendations are worth doing at all.
3. **Three conversations, ninety minutes total**: one special-needs attorney at another
   firm, one hospital social worker, one Arc or P2P chapter coordinator. Ask each: "would
   you hand this to a family, and if not, what would have to change?" That would validate
   or kill A9-013, A9-014 and the entire channel map faster and more cheaply than any
   further analysis of the site.
4. **The video transcript**, to judge whether the caption/transcript work (A9-022) also
   yields substantial new indexable content or merely restates the side column.
5. **Poppler or another PDF text extractor**, to verify what the attribution line actually
   looks like on a printed page rather than what the source says it should.
