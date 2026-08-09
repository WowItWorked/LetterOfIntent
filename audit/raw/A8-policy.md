# A8 — Policy and Legal Documents

---

## ⚠️ STANDING NOTICE — READ FIRST

**Everything in this file and everything in `audit/policies/` is DRAFTING WORK
PRODUCT PREPARED FOR REVIEW BY A LICENSED ATTORNEY. It is NOT legal advice, it
is NOT a legal opinion, and it does NOT create an attorney–client relationship.**

I am an automated analyst. I am not a lawyer and I am not licensed in any
jurisdiction. Statutes change, agency guidance changes, and my training has a
cutoff. Where I reason about a statute I have tried to say so explicitly and to
separate *what I observed on this site* (high confidence) from *what the law
does with that observation* (lower confidence, and counsel's call).

The site is operated by a law firm. **Claire Kelly, Esq. — or outside privacy
counsel — must review, verify against current statutory text, and adopt or
reject every draft in `audit/policies/` before any of it is published.** Nothing
in `audit/policies/` should be pushed to the site as-is.

Applicability of every statute discussed below turns on facts I cannot see from
outside: the firm's revenue, its consumer counts by state, its GA4 property
configuration, and its contracts with Vercel and Cloudflare. Those must be
confirmed, not assumed.

---

## 1. Scope of this review

**Reviewed:** the live privacy policy at `https://myletterofintent.com/privacy`
and its source at `src/app/privacy/page.tsx`, against what the site actually
does in production; the absence of every other policy document; and what
additional documents this site needs.

**Evidence base:** `audit/evidence/network/capture-production.json` (431
requests, 9 routes, 4 hosts), plus my own live verification against production
on 2026-08-09, plus the repository at local HEAD.

**Not reviewed by me (other analysts' lanes):** accessibility conformance
testing, PDF output quality, visual design, copy tone outside legal text. I
touch accessibility only where it creates a *document* obligation (the
Accessibility Statement).

---

## 2. What the site actually does — established facts

These are the factual predicates for everything below. All were verified by me
directly, not assumed.

| Fact | How established |
| --- | --- |
| Four hosts are contacted: `myletterofintent.com`, `www.googletagmanager.com`, `www.google-analytics.com`, `static.cloudflareinsights.com` | `capture-production.json` → `.uniqueHosts` |
| **Zero** canary strings reached any outbound request; 72 occurrences sit in `localStorage` | Searched `.requests` (200,493 chars) for `ZQXCANARY` and `ZQXTYPEDCANARY` → 0 hits each; searched `.storageByRoute` → 72 hits |
| No request in the entire capture carries a POST body | `.requests \| where postData` → count 0 |
| GA4 transmits `page_view` only, carrying page URL + page title + device/locale/screen | Decoded `g/collect` query strings: `en=page_view`, `dl=https://myletterofintent.com/letter/about`, `dt=About your loved one…` |
| Two cookies, both Google's, both 400-day lifetime, both `Secure=false` | `.cookies`: `_ga` and `_ga_90YXKXB5TC`, `domain=.myletterofintent.com`, expiry epoch 1820867112 = **2027-09-13**, 400 days from capture |
| Cloudflare injects a Web Analytics beacon into **every** production page | Live fetch of `/privacy`: `<script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/..." data-cf-beacon='{"version":"2024.11.0","token":"faa290b919f94379b17a9d697c7a4c83","r":1}'>` |
| That beacon is **currently blocked** by the site's own CSP | Live browser console on `myletterofintent.com/privacy`: `Loading the script 'https://static.cloudflareinsights.com/beacon.min.js/…' violates the following Content Security Policy directive: "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com …". The action has been blocked.` It is also the **only** one of 431 captured requests with no matching response |
| Cloudflare also rewrites page HTML for email obfuscation | Live fetch of `/`: 3 matches for `__cf_email__` / `email-protection`; browser network log shows `GET /cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js → 200` |
| The site does **not** call `navigator.storage.persist()` | `grep -r "storage\.persist\|navigator\.storage\|persisted(" src/` → no matches |
| The site has **no** AI features of any kind | `grep -ri "openai\|anthropic\|gemini\|claude\|LLM\|machine learning" src/` → no substantive matches |
| The explainer video has **no** caption track | Production `/` HTML: `<track>` count = 0, `<video>` count = 1. Source comment at `src/components/home/VideoPlayer.tsx:201-202` states this deliberately |
| Data collected spans health, disability, education, religion, finances, law-enforcement history, and end-of-life wishes — about a named minor | `audit/evidence/fill-levels.json` → `.schemaSections`: `diagnoses`, `allergies`, `therapies`, `iepHistory`, `faith`, `lawEnforcement`, `organDonation`, `funeral`, `benefitsFinances`, `repPayee` … 25 sections |
| Existing site documents: **privacy page only** | `src/app` contains routes for `/`, `/letter/*`, `/privacy`, `/your-data`, `/samples/*`. No `/terms`, no `/accessibility`, no `/security`, no `/.well-known/security.txt` in `public/` |
| `SECURITY.md` exists in-repo (15,452 bytes) but is not published anywhere | Repo root file listing; no corresponding route or public asset |

---

## 3. Readability — the brief's hypothesis was NOT borne out

The brief anticipated "a privacy policy at a 14th-grade reading level protecting
a document written at an 8th-grade level." **That is not what I measured.** I am
reporting this against the brief's expectation because the honest number matters
more than confirming a hypothesis.

Measured with a no-dependency Flesch/Fog/SMOG implementation over the prose of
the live `/privacy` page (headings, nav, and labels excluded):

| Metric | `/privacy` prose | Legal fine print alone |
| --- | --- | --- |
| Words | 855 | 170 |
| Sentences | 54 | 11 |
| Avg words / sentence | 15.83 | 15.45 |
| Avg syllables / word | 1.411 | 1.453 |
| Polysyllabic words | 5.6% | 9.4% |
| **Flesch Reading Ease** | **71.4** ("fairly easy") | 68.2 |
| **Flesch-Kincaid Grade** | **7.2** | 7.6 |
| **Gunning Fog** | **8.6** | 9.9 |
| **SMOG** | **8.5** | 10.0 |
| Sentences over 25 words | 8 | 0 |

**Verdict: the current privacy page reads at roughly a 7th-to-8th grade level.
It is one of the most readable privacy policies I have measured.** It is short,
it is in the second person, it uses concrete nouns, and it explains *why* rather
than only *what*. That is a real achievement and it should be protected.

The problem with this policy is **not readability. It is completeness and
accuracy.** It omits legally expected elements (effective date, change process,
rights, retention, named third parties, DNT/GPC) and it makes at least one
absolute factual claim that production contradicts in form if not yet in effect.

**This changes the recommendation.** The layered approach is still right, but for
a different reason than the brief assumed: layering is the mechanism by which
you can *add* the missing legal content without destroying the grade-7 summary a
tired parent will actually read. The summary stays at grade 7–8; the added
completeness lives beneath it in a "Full detail" layer. See
`audit/policies/privacy-policy-layered.md`. I measured my own Layer 1 draft
rather than assert a number for it: **Flesch-Kincaid grade 3.5, Reading Ease
86.9, Gunning Fog 4.6, SMOG 5.6**, across 197 words and 21 sentences. (Discount
the 3.5 a little — Flesch-Kincaid rewards short declarative sentences and
understates the true register, which is nearer grade 5. It is comfortably inside
the grade-8 target either way.)

> **The single biggest risk to this site's privacy page is a well-meaning
> compliance rewrite that turns grade 7 into grade 14.** If counsel will only
> accept boilerplate, put the boilerplate in Layer 3 and leave Layer 1 alone.

---

## 4. The COPPA question, reasoned rather than asserted

The brief was right that this is not obvious. Here is my reasoning. **This is
analysis for counsel, not a conclusion counsel can rely on.**

### 4.1 The two independent triggers

COPPA (15 U.S.C. §§ 6501–6506; 16 C.F.R. Part 312) attaches to an operator only
if **either**:

- **(a)** the website or online service is **directed to children** under 13; **or**
- **(b)** the operator has **actual knowledge** it is collecting personal
  information **from a child** under 13.

Both limbs require **collection *from a child***. COPPA has never regulated
information *about* a child supplied by an adult. That is the crux here.

### 4.2 Is this site "directed to children"?

The § 312.2 multi-factor test looks at subject matter, visual and audio content,
animated characters, child-oriented activities and incentives, music, age of
models, presence of child celebrities, advertising directed to children, and
competent and reliable empirical evidence of actual audience composition.

Applied to this site: the subject matter is *about* children with disabilities,
but the register, vocabulary, visual design (Cinzel/Cormorant, navy and gold, a
law-firm masthead), the reading level, the tasks demanded (recalling IEP history,
naming a trustee, describing end-of-life wishes), and the referral channel
(special needs trust attorneys) are all unmistakably adult. There are no
animated characters, no games, no child-appealing incentives.

**A site *about* children is not a site *directed to* children.** The FTC has
consistently drawn this line for parenting sites, pediatric practices, and
school-communication tools. I assess this limb as **not met**, with reasonable
confidence.

### 4.3 Is information collected "from a child"?

No. Every field is filled in by an adult author — the schema's very first field
is `authorName` with `authorRelationship`, and the whole document is framed as
"what I know about the person I care for." The subject of the information never
touches the keyboard in the intended flow.

Information *about* a minor entered by their parent is, on the plain text of the
statute, not "personal information … collected from a child." I assess this limb
as **not met**, with high confidence as to the site's design.

### 4.4 The harder question the brief asked: does "collection by an operator" attach at all if the operator never receives the data?

This is the genuinely interesting question and I want to be careful.

**§ 312.2 defines "collects or collection" as "the gathering of any personal
information from a child by any means," including "(a) Requesting, prompting, or
encouraging a child to submit personal information online; (b) Enabling a child
to make personal information publicly available in identifiable form…; (c)
Passive tracking of a child online."**

Two readings are available:

- **The "gathering" reading (operator-receipt required).** "Gathering … by an
  operator" naturally implies the information comes into the operator's
  possession or the possession of someone acting for it. On this reading, a
  purely client-side application that writes to the user's own `localStorage`
  and never transmits has not "gathered" anything. The FTC's own historical
  guidance on mobile apps has taken essentially this line: information that
  stays on the user's device and is never transmitted to the developer or a
  third party is generally not "collected" for COPPA purposes. **On the facts I
  verified here — zero canary strings in 431 requests, zero POST bodies — this
  reading cleanly exculpates the letter content.**

- **The "prompting" reading (operator-receipt not required).** Limb (a) speaks
  of "requesting, prompting, or encouraging a child to submit personal
  information *online*." A very aggressive reader could argue that a form field
  in a browser is "online submission" regardless of destination. I think this
  reading is wrong — limb (a) is best read as describing *how* gathering occurs,
  not as an independent trigger divorced from gathering — but it is not
  frivolous, and it is the reading a plaintiff's lawyer would advance.

**Why it does not matter much here:** because limbs 4.2 and 4.3 already fail,
the collection question is not reached. The client-side architecture is a
*second*, independent defense, not the only one. That is a comfortable position
and it is worth writing down so a future feature does not silently destroy it.

**Note the 2025 amendments.** 16 C.F.R. Part 312 was amended in 2025 with
staged compliance dates. I have not read the amended text and **I am reasoning
partly from general knowledge of the pre-amendment rule.** Counsel must verify
the current definitions of "collects," "personal information," and "directed to
children" against the operative text. Flagged as `INFERRED`, not `INSPECTED`.

### 4.5 The analytics limb — where COPPA *would* bite if the premises changed

This is the part that deserves attention.

Google Analytics **does** transmit. The capture shows a persistent client
identifier `cid=242789107.1786307073` and cookies `_ga` / `_ga_90YXKXB5TC` with a
400-day life. Under § 312.2, "personal information" expressly includes **"a
persistent identifier that can be used to recognize a user over time and across
different Web sites or online services."** And limb (c) — "passive tracking of a
child online" — is precisely what an analytics cookie is.

So the structure is:

> If the site were ever child-directed, or if the operator ever gained actual
> knowledge that a user was under 13, **the GA identifier would be COPPA-covered
> personal information collected from a child** — and neither the client-side
> architecture nor the absence of a login would help, because the GA identifier
> is transmitted.

**Practical consequences I would put in front of counsel:**

1. **Do not add child-appealing content, characters, games, or incentives.** The
   defense in 4.2 is the load-bearing one and it is a design property, not a
   legal one.
2. **Do not add an age gate.** It feels protective but it manufactures the
   "actual knowledge" that limb (b) requires, and it puts a friction wall in
   front of an exhausted parent at 11pm. State an adults-only intent in the
   Terms instead. (This is a case where the technically-tidy answer is the wrong
   answer for the actual user.)
3. **Do not add any feature that lets the subject of the letter fill it in
   directly** without re-running this analysis — e.g. a "send this to my teenager
   to complete" flow would change the answer.
4. **Confirm in the GA4 property that Google Signals is OFF.** Google Signals
   builds cross-device advertising profiles and would strengthen any argument
   that the persistent identifier is being used for more than counting. I cannot
   see property settings from outside. This is the single most important thing I
   could not verify.

### 4.6 Bottom line

**COPPA very probably does not attach to this site.** But the reasoning has three
independent legs and only one of them (client-side storage) is architectural.
The other two (not child-directed; no collection from a child) are properties of
product decisions that a future feature could quietly reverse. **Write the
analysis down in a Children's Information notice so the next person to touch the
product knows what they are standing on.** Draft at
`audit/policies/childrens-information.md`.

---

## 5. Other statutory frameworks — applicability analysis

Same caveat: **this is analysis for counsel, not a compliance opinion.** Every
threshold below turns on facts about the firm that I cannot observe.

### 5.1 CCPA/CPRA (California) — probably out of scope by threshold, but check CalOPPA

CCPA/CPRA applies to a "business" that meets at least one of: (i) annual gross
revenue over $25M; (ii) buys, sells, or shares the personal information of
100,000+ California consumers or households annually; (iii) derives 50%+ of
annual revenue from selling or sharing personal information. **A single-attorney
Virginia estate-planning firm running a free tool almost certainly meets none.**
Confirm the numbers; do not assume them.

**But CalOPPA (Cal. Bus. & Prof. Code § 22575 et seq.) has no size threshold
at all.** It applies to any operator of a commercial website or online service
that collects personally identifiable information about California residents.
Given the site carries an `ATTORNEY ADVERTISING` notice — which rather concedes
its commercial character — the safe assumption is that CalOPPA applies.

CalOPPA requires the policy to:

| Requirement | Current `/privacy` | Gap |
| --- | --- | --- |
| Be conspicuously posted | ✅ Footer + persistent `PrivacyStrip` banner | — |
| Identify **categories** of PII collected | ⚠️ Described in prose, not categorised | Partial |
| Identify **categories of third parties** it may be shared with | ⚠️ Names Google only; does not name Vercel, Cloudflare | **Gap** |
| Describe the process to review and request changes to one's PII | ❌ Absent | **Gap** (though arguably satisfied by `/your-data`, which is not cross-referenced as such) |
| Describe how the operator notifies consumers of policy changes | ❌ Absent | **Gap** |
| Include an **effective date** | ❌ Absent | **Gap** |
| Disclose the response to **Do Not Track** signals | ❌ Absent | **Gap** — this is the AB 370 amendment and it is explicit |
| Disclose whether third parties may collect PII across sites over time | ❌ Absent | **Gap** — Google does exactly this |

**Five clear CalOPPA element gaps, in a statute with no revenue threshold. This
is the sharpest, most concrete legal exposure I found, and it is also the
cheapest to fix.**

### 5.2 Virginia VCDPA — the firm's home state

Applies to persons conducting business in Virginia who, in a calendar year,
control or process the personal data of at least 100,000 consumers, **or** at
least 25,000 consumers while deriving over 50% of gross revenue from the sale of
personal data. Almost certainly not met. But the firm is a *Virginia* law firm
whose home regulator is the Virginia AG, and "we exceed our home state's
standard voluntarily" is a defensible and cheap posture.

### 5.3 The 2024–25 wave — two laws with NO numeric threshold

Most of the wave (CO, CT, UT, OR, MT, DE, IA, NH, NJ, TN, MN, IN, KY, RI, FL,
MD) carries a threshold in the 25,000–175,000 consumer range that this site is
unlikely to meet. **Two are structured differently and deserve a look:**

- **Texas TDPSA** has **no numeric threshold.** It applies to any person who
  conducts business in Texas or produces a product or service consumed by Texas
  residents, processes or sells personal data, and **is not a small business as
  defined by the U.S. SBA.** The firm is almost certainly an SBA small business
  and therefore largely exempt — **but the exemption carves back: even a small
  business must obtain consent before selling sensitive personal data.** Health
  and disability data about a minor is sensitive personal data. The site does
  not sell anything, so this should be comfortable — but it should be *stated*.
- **Nebraska Data Privacy Act** uses the same SBA small-business structure with
  the same sensitive-data-sale carve-back.

- **Maryland MODPA** has a lower threshold (35,000 consumers) and, unusually, an
  outright **ban** on selling sensitive personal data plus a strict
  data-minimisation duty. Threshold probably not met, but MODPA is the one most
  likely to catch this site as it grows.

**Universal opt-out signals (GPC).** CA, CO, CT, TX, MT, DE, NE, NJ, NH, OR, MN,
and MD now require honoring a universal opt-out mechanism where the law applies.
The site does not detect or honor Global Privacy Control. Whether that matters
depends entirely on (a) applicability and (b) whether the GA4 configuration
constitutes a "sale," "share," or "targeted advertising" — which turns on the
Google Signals and Google-services data-sharing settings I could not inspect.
**Honoring GPC costs about 15 lines of client-side code and moots the question.**
Recommended regardless of applicability.

### 5.4 Washington My Health My Data Act — the highest-stakes statute here, and the most uncertain

I am raising this prominently because it is, in my assessment, **the only
statute in scope with a private right of action**, and because this site's data
sits squarely in its subject matter.

- **No revenue threshold.** It reaches any "regulated entity" that conducts
  business in Washington or targets Washington consumers and determines the
  purpose and means of collecting consumer health data.
- **"Consumer health data" is defined extraordinarily broadly** — bodily
  functions, vital signs, symptoms, diagnoses, treatment, medications, and "any
  information that a regulated entity processes to associate or identify a
  consumer with" those. The `medical`, `behavior`, `about`, and `healthMedical`
  sections of this schema are a textbook match.
- It requires a **separate and distinct Consumer Health Data Privacy Policy**,
  reachable by its **own dedicated link on the homepage** — not folded into the
  general privacy policy.
- It is enforceable through the **Washington Consumer Protection Act, including
  by private plaintiffs.** Nevada SB 370 is the parallel statute without the
  private right of action.

**The threshold question — and it is genuinely unsettled.** MHMDA defines
"collect" as "to buy, rent, access, retain, receive, acquire, infer, derive, or
otherwise process consumer health data in any manner." Does an operator whose
JavaScript writes to the *consumer's own* `localStorage`, and which verifiably
never receives a byte of it, "access, retain, receive or acquire" that data?

I think the better argument is **no** — the operator supplies a tool; the
consumer holds the data; the operator has no copy, no key, and no capability to
obtain one. The canary evidence here is unusually strong support for that
position: 431 requests, zero leakage, zero POST bodies. **But "otherwise process
… in any manner" is broad language and I have not found authority resolving it
for purely client-side software.** I flag this as `NOT_VERIFIED` on the legal
question and `MEASURED` on the factual predicate.

**What I would recommend regardless of how counsel resolves it:** publish the
architecture as a documented, testable commitment (the `e2e/privacy-network.spec.ts`
canary test described in `SECURITY.md` is genuinely excellent evidence), and
consider a short, plain "Health information" section in the privacy policy that
does the MHMDA disclosure work voluntarily. Doing it voluntarily costs a page of
text; being found to have needed it and not done it costs a CPA claim.

### 5.5 GDPR / UK GDPR

**Art. 3(2)(a) — offering goods or services to data subjects in the Union.**
EDPB Guidelines 3/2018 are clear that mere accessibility of a website is not
enough; there must be evidence of an *intention to target*. Against targeting:
`.com` TLD, English only, a US phone number, a Virginia-only licensed firm,
US-specific subject matter throughout (SSI, Medicaid waivers, ABLE accounts,
IEPs, rep payees). **Strong argument that 3(2)(a) is not met.**

**Art. 3(2)(b) — monitoring of behaviour in the Union.** Weaker but not zero:
GA4 sets a persistent cross-site identifier on any EU visitor who lands on the
site. Most practitioners treat untargeted analytics on a demonstrably US-focused
site as low risk. **This is checkable and I cannot check it: look at the GA4
property's country breakdown. If EU/UK sessions are a rounding error, document
that and move on. If they are not, the analysis changes.**

**If there is meaningful EU/UK traffic, the binding constraint is not GDPR but
the ePrivacy Directive Art. 5(3)**, which requires *prior consent* for
non-essential cookies. `_ga` and `_ga_90YXKXB5TC` are set on page load with no
consent mechanism of any kind. That is a straightforward ePrivacy problem
independent of any transfer analysis. (The 2022 DPA decisions against Google
Analytics turned largely on transfers; the EU–US Data Privacy Framework adequacy
decision of July 2023 materially weakened that particular argument for
DPF-certified recipients. The *consent* point survives it.)

**Proportionate answer, given that removing GA is off the table:** implement
Google **Consent Mode v2** with `analytics_storage: 'denied'` as the default,
and show a minimal consent choice **only** to EEA/UK visitors. On a static
export this can be done client-side with a timezone/locale heuristic (no infra,
`SCOPE: current`) or properly with a Cloudflare Worker reading `CF-IPCountry`
(`SCOPE: architectural`). See finding A8-010.

### 5.6 HIPAA and FERPA — not applicable, and say so

Neither applies. The firm is not a covered entity or business associate, and it
is not an educational agency. **But families will assume otherwise** — they are
typing medication lists and IEP history, and "medical information" reads as
"HIPAA" to almost everyone. One sentence in the privacy policy saying *this tool
is not covered by HIPAA, and here is why that does not matter given nothing is
transmitted* prevents a predictable and corrosive misunderstanding. This is a
clarity finding, not a compliance one, and it ranks above several of the
compliance ones under the governing hierarchy.

### 5.7 Attorney advertising and multi-jurisdictional practice

The site carries an `ATTORNEY ADVERTISING` notice and a clear no-attorney–client
disclaimer, and both are well drafted. The firm is licensed in Virginia only,
and the tool is used nationally. Each state bar has its own advertising rules,
and a few (notably New York and Texas) have specific requirements for
solicitations reaching their residents. **This is squarely counsel's own
professional-responsibility call, not mine.** I flag only that the tool's reach
is national and the licence is not, and that the current disclaimer language
("talk with a special needs planning attorney **in your state**") is the right
instinct.

---

## 6. FINDINGS

```yaml
- id: A8-001
  title: Cloudflare is an undisclosed processor, and a second analytics beacon is injected into every production page
  category: privacy-disclosure-accuracy
  what_i_observed: >
    The privacy policy names exactly one third party (Google) and refers to the
    infrastructure provider only as "Our host", singular and unnamed. In
    production the site sits behind Cloudflare, and Cloudflare injects a Web
    Analytics RUM beacon into the HTML of every page — token
    faa290b919f94379b17a9d697c7a4c83 — which is not present anywhere in the
    codebase and is not mentioned in the policy. Cloudflare also rewrites page
    HTML for email obfuscation, which means it is actively transforming
    response bodies. Cloudflare terminates TLS for the entire site and
    therefore sees every request in cleartext at its edge. Vercel and GitHub
    are likewise unnamed. The beacon is currently blocked by the site's own CSP
    (see A8-003), so no data reaches Cloudflare Web Analytics today — but the
    zone-level configuration that produces the beacon is switched on, which
    means a processing relationship is configured and could begin functioning
    on any CSP edit.
  evidence:
    type: network + content
    detail: >
      capture-production.json .uniqueHosts includes "static.cloudflareinsights.com".
      Live GET https://myletterofintent.com/privacy returns, verbatim:
      <script type="module" src="https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496"
      integrity="sha512-ZE9pZaUXND66v380QUtch/5sE9tPFh2zg45pR2PB0CVkCtOREv2AJKkSidISWkysEuQ0EH8faUU5du78bx87UQ=="
      data-cf-beacon='{"version":"2024.11.0","token":"faa290b919f94379b17a9d697c7a4c83","r":1}'
      crossorigin="anonymous">
      Response headers on / include: server: cloudflare; cf-ray: a2897c198a0c9d25-IAD;
      x-vercel-cache: HIT; x-vercel-id: iad1::vql52-1786307070988-4c800543906e.
      Browser network log on / shows GET /cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js -> 200,
      and the homepage HTML contains 3 matches for __cf_email__ / email-protection.
      Current policy text, src/app/privacy/page.tsx:257-259: "Our host also keeps
      ordinary web server logs — the sort every website receives, including the
      address a request came from — and those are used only to keep the site up
      and secure."
  confidence: MEASURED
  who_is_affected: Every visitor. Materially, the attorneys who refer families here and vouch for the privacy claim.
  why_it_matters: >
    The policy's credibility is its product. A referring special-needs attorney
    who opens dev tools and finds a third-party analytics beacon that the policy
    does not mention will not read it as "blocked by CSP, harmless" — they will
    read it as "the policy is not accurate", and they will stop referring. The
    legal point is narrower but real: CalOPPA requires disclosure of the
    categories of third parties, and every state comprehensive law requires
    identification of categories of recipients. "Our host", unnamed and
    singular, does not do that work when there are in fact three infrastructure
    parties (Vercel, Cloudflare, GitHub) and a second analytics vendor
    configured at the edge.
  standard_reference: Cal. Bus. & Prof. Code 22575(b)(1) (categories of third parties); GDPR Art. 13(1)(e) (recipients or categories of recipients); FTC Act 5 (deceptive omission)
  recommendation: >
    (1) Decide, deliberately, whether Cloudflare Web Analytics should be ON or
    OFF. If OFF, turn it off in the Cloudflare dashboard so the beacon stops
    being injected — do not rely on CSP to suppress it. If ON, add
    static.cloudflareinsights.com to script-src, disclose it in the policy, and
    accept it as a second analytics vendor. Leaving it configured-but-blocked is
    the worst of the three options because the state is undocumented and
    accidental. (2) Name Vercel, Cloudflare, and GitHub in the policy with one
    sentence each on what they see and why. (3) Decide whether Data Processing
    Addenda with Vercel and Cloudflare should be on file — for a firm handling
    special-needs planning this is cheap insurance and both vendors offer
    standard DPAs. (4) Either disable Cloudflare Email Address Obfuscation or
    note it, since it makes the firm's contact address unreadable without
    JavaScript.
  scope: current
  privacy_impact: >
    N/A — this recommendation removes or discloses a third-party data flow. It
    does not create one. If Cloudflare Web Analytics is deliberately switched ON,
    that decision requires its own PRIVACY IMPACT block; my recommendation is
    that it be switched OFF, since GA4 already answers the same question and a
    second vendor doubles the disclosure surface for no new insight.
  cost_and_maintenance: Zero ongoing cost. One dashboard toggle plus one policy paragraph. DPAs are one-time paperwork.
  effort: S
  risk_of_change: Very low. Turning Cloudflare Web Analytics off changes nothing the site relies on.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 3
  environment: production

- id: A8-002
  title: SECURITY.md's third-party claims are contradicted by production and it says the opposite of what is true
  category: documentation-accuracy
  what_i_observed: >
    SECURITY.md is a genuinely strong document — it names the file that enforces
    each claim, it cites tests, and it was clearly written honestly. But two of
    its factual assertions are now false in production, and one of them is the
    exact assertion a security reviewer would rely on. It states "No other
    analytics — no Vercel Analytics, no heatmaps, no session recording, no
    advertising pixels" and, under OWASP A08, "No external scripts are loaded,
    so SRI is moot." Production loads (attempts to load) an external script from
    static.cloudflareinsights.com on every page, and that script is Cloudflare
    Web Analytics. The document also states there are "exactly two network calls
    in the entire application" — true of src/, but not true of what a browser
    actually does on the production site.
  evidence:
    type: code + network
    detail: >
      SECURITY.md lines 81-82: "**No other analytics** — no Vercel Analytics, no
      heatmaps, no session recording, no advertising pixels."
      SECURITY.md line 170 (OWASP A08 row): "No external scripts are loaded, so
      SRI is moot."
      Contradicted by the live beacon tag quoted in A8-001, which ironically
      carries its own integrity= attribute.
  confidence: MEASURED
  who_is_affected: Any security reviewer, referring attorney, or future maintainer who trusts this document.
  why_it_matters: >
    SECURITY.md's whole rhetorical strategy is "every claim names the file that
    enforces it or the test that proves it, so this document can be re-checked
    rather than believed." That is the right strategy, and it fails the moment a
    checkable claim turns out to be wrong — because the reader who checks one
    claim and finds it false will not check the other forty. The root cause is
    structural, not careless: the document reasons entirely about src/, and the
    beacon is injected at the Cloudflare edge, which src/ cannot see. That gap
    will recur.
  standard_reference: None (internal accuracy). Adjacent to FTC Act 5 if SECURITY.md is ever shown to a client or referral partner.
  recommendation: >
    Correct the two claims. More importantly, add a section titled "What the
    edge adds" that reasons about the production response rather than the
    repository, and add an automated check: the existing
    e2e/privacy-network.spec.ts already asserts on hosts — point a variant of it
    at the production URL in CI so an edge-injected script fails a build rather
    than being discovered in an audit. That is the durable fix.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: One edit plus roughly an hour to add a production-target variant of the existing Playwright spec.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 3
  environment: both

- id: A8-003
  title: The policy's strongest sentence is currently true only by accident of CSP
  category: privacy-disclosure-accuracy
  what_i_observed: >
    The privacy page states, in its most emphatic callout: "no script on this
    page reads them, sends them, or records your screen." As a statement about
    what reaches a third party today, this is TRUE and I verified it — the
    Cloudflare beacon is blocked by the site's own Content-Security-Policy and
    is the only one of 431 captured requests with no matching response. But the
    sentence is phrased as a claim about scripts ON THE PAGE, and there IS a
    third-party analytics script tag on the page. It is inert only because
    script-src does not list static.cloudflareinsights.com. Anyone who adds a
    host to script-src for an unrelated reason — a font, an embed, a chat widget
    — silently converts a true sentence into a false one, with no test failing.
  evidence:
    type: network
    detail: >
      Live browser console at https://myletterofintent.com/privacy, verbatim:
      "Loading the script
      'https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496'
      violates the following Content Security Policy directive: \"script-src
      'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com
      https://www.google-analytics.com https://*.google-analytics.com
      https://*.analytics.google.com\". Note that 'script-src-elem' was not
      explicitly set, so 'script-src' is used as a fallback. The action has been
      blocked."
      Corroborated: in capture-production.json the beacon URL is requested in all
      11 phases and is the ONLY request URL in the entire capture with no
      corresponding entry in .responses.
      Policy text, src/app/privacy/page.tsx:241-244.
  confidence: MEASURED
  who_is_affected: Every user relies on this sentence; the harm lands on whoever is affected the day it stops being true.
  why_it_matters: >
    This is the site's central promise expressed in its most absolute form. A
    promise that is true because of a defensive control accidentally catching an
    undocumented injection is not a promise, it is a coincidence. The fix is not
    to weaken the sentence — the sentence is good and families deserve it — but
    to make the fact underneath it deliberate: turn the beacon off at source, so
    that the sentence is true because nothing is there, not because something is
    blocked.
  standard_reference: FTC Act 5 (deceptive statement); the site's own canonical promise
  recommendation: >
    Turn Cloudflare Web Analytics off at the zone (see A8-001) so no third-party
    script tag exists in the HTML at all. Then keep the sentence exactly as
    written — it will be true by construction. Additionally, add a CI assertion
    that the production HTML contains no <script> with a src outside the site's
    own origin and googletagmanager.com; that converts this from a fact someone
    has to remember into a fact the build enforces.
  scope: current
  privacy_impact: N/A — this reduces third-party exposure.
  cost_and_maintenance: One dashboard toggle. The CI assertion is ~20 lines and near-zero maintenance.
  effort: S
  risk_of_change: None.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 4
  environment: production

- id: A8-004
  title: Five CalOPPA elements are missing, in a statute with no revenue threshold
  category: legal-compliance
  what_i_observed: >
    The privacy page has no effective or last-updated date anywhere, no
    statement of how users will be told when it changes, no Do Not Track
    disclosure, no explicit statement that a third party may collect information
    about the user across other sites over time, and no categorised list of the
    third parties involved. Every other privacy-law obligation discussed in this
    report depends on a threshold the firm probably does not meet. CalOPPA does
    not — it reaches any commercial website operator collecting PII from
    California residents, and the site's own ATTORNEY ADVERTISING notice makes
    the "commercial" characterisation hard to argue against.
  evidence:
    type: content
    detail: >
      Full text of the production /privacy page read and searched. It contains no
      date of any kind, no occurrence of "Do Not Track", "updated", "effective",
      or "changes to this policy". The only third party named is Google. The
      infrastructure sentence reads in full: "Our host also keeps ordinary web
      server logs — the sort every website receives, including the address a
      request came from — and those are used only to keep the site up and
      secure." (src/app/privacy/page.tsx:257-259)
  confidence: INSPECTED
  who_is_affected: California visitors as a matter of law; every visitor as a matter of trust — a policy with no date cannot be relied on.
  why_it_matters: >
    An undated privacy policy is the single most common reason a policy fails to
    do the one job it exists to do, which is to be a checkable representation as
    of a moment in time. A family that read the promise in 2026 has no way to
    know whether they are reading the same policy in 2028. For a document whose
    subject is a letter that families are told to revisit yearly, the absence of
    a date is doubly odd. All five gaps are cheap: they are a paragraph and a
    line of metadata.
  standard_reference: Cal. Bus. & Prof. Code 22575(b)(1)-(b)(7), incl. the AB 370 Do-Not-Track amendment at 22575(b)(5)-(6)
  recommendation: >
    Add: an effective date and a "last reviewed" date rendered from a single
    constant so they cannot drift; a short "When this changes" paragraph
    committing to a dated change log (see A8-015); a Do Not Track / Global
    Privacy Control statement; a sentence acknowledging that Google may recognise
    the visitor across other sites; and a categorised third-party table. Draft
    at audit/policies/privacy-policy-layered.md, Layer 2. Honor GPC in code as
    well as describing it — roughly 15 lines gating the gtag config on
    navigator.globalPrivacyControl.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: A half-day to write and wire the dates. Ongoing: one date edit per policy change, which the change log makes routine.
  effort: M
  risk_of_change: Low. The risk is stylistic — adding these badly would damage the grade-7 readability. Layering protects it.
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A8-005
  title: There are no Terms of Use — no warranty disclaimer, no limitation of liability, no governing law
  category: missing-document
  what_i_observed: >
    The site has exactly one legal document: the privacy page. There is no Terms
    of Use route, no acceptance mechanism, no disclaimer of warranties, no
    limitation of liability, no acceptable-use terms, no statement of who owns
    the generated documents, and no governing law or venue clause. The footer
    disclaimer covers the "not legal advice / not a legal document" point well,
    but that is a professional-responsibility disclaimer, not a contract.
  evidence:
    type: code
    detail: >
      src/app/ contains only: page.tsx, layout.tsx, robots.ts, sitemap.ts,
      favicon.ico, globals.css, and the directories letter/, privacy/, samples/,
      your-data/. No terms route exists. src/app/sitemap.ts lists exactly six
      URL groups and none is a terms page. The only liability-adjacent text on
      the site is firm.disclaimerShort and firm.disclaimerFull
      (src/config/firm.ts:98-110), neither of which disclaims warranties or
      limits liability.
  confidence: INSPECTED
  who_is_affected: The firm. Secondarily any family relying on output the tool got wrong.
  why_it_matters: >
    This tool produces an Emergency Information Sheet that families are
    explicitly encouraged to hand to schools, hospitals, and paramedics. Consider
    the realistic failure: a long allergy entry is truncated in the PDF layout, a
    paramedic reads the sheet, and a child is given something they react to. The
    firm's exposure there is not theoretical, and the ordinary mitigation — a
    conspicuous disclaimer of warranties and a cap on liability, presented before
    the document is generated — costs a page of text and nothing else. There is
    also a quieter question with no current answer: who owns the letter, and does
    the firm assert any licence over it? The right answer is "the family owns it
    outright and the firm claims nothing", and that answer is worth stating,
    because silence invites the opposite assumption.
  standard_reference: Not legally required. Standard commercial practice; UCC 2-316-style conspicuousness expectations for warranty disclaimers; state consumer-protection limits on liability caps.
  recommendation: >
    Publish a Terms of Use at /terms. Keep it short and readable — this audience
    will not read six pages. Cover: what the service is and is not; no
    attorney-client relationship (cross-reference, do not restate differently);
    the document is not legally binding; AS-IS warranty disclaimer; a liability
    limitation drafted to survive Virginia's unconscionability limits; the family
    owns its content and the firm claims no licence; acceptable use; the service
    may change or end and users should keep backups; adults 18+ intended; and
    governing law. Link it from the footer, not behind a modal — do not add a
    click-through gate in front of a grieving parent. Draft at
    audit/policies/terms-of-use.md.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: One page. Counsel review is the real cost. Review annually.
  effort: M
  risk_of_change: >
    Low if kept short and warm. High if it becomes a wall of capitalised text —
    that would visibly contradict the site's whole voice and would cost more in
    trust than it gains in protection.
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 3
  environment: both

- id: A8-006
  title: No Accessibility Statement, on a tool built for disabled people, whose explainer video has no captions and no transcript
  category: missing-document
  what_i_observed: >
    There is no accessibility statement, no declared conformance target, no
    published list of known limitations, no feedback channel for accessibility
    problems, and no remediation commitment. The homepage explainer video has
    zero <track> elements in production and there is no transcript. The source
    carries a deliberate comment acknowledging this and offering the adjacent
    prose column as the substitute — but that column is general expository copy
    about what a Letter of Intent is, not a labelled transcript of the video's
    audio, and it is not synchronised.
  evidence:
    type: code + content + manual-a11y
    detail: >
      Production GET https://myletterofintent.com/ : <track> tag count = 0,
      <video> tag count = 1.
      src/components/home/VideoPlayer.tsx:201-202, verbatim: "// No caption track:
      the same explanation is written out in full in\n// the column beside this
      player."
      The referenced column is src/app/page.tsx:267-289 — two paragraphs of
      expository copy plus a disclaimer line. It is not presented or labelled as
      a media alternative.
      WCAG 2.2 SC 1.2.2 Captions (Prerecorded), Level A: captions are required
      for all prerecorded audio content in synchronised media. Adjacent
      unsynchronised prose does not satisfy 1.2.2. SC 1.2.3 (Audio Description or
      Media Alternative, Level A) could in principle be met by a full text
      alternative, but only if it is a genuine alternative for the media and is
      clearly labelled as such; neither condition holds here.
      No /accessibility route exists in src/app/.
  confidence: MEASURED
  who_is_affected: >
    Deaf and hard-of-hearing visitors — who are disproportionately represented in
    this audience, since many of these families are themselves disabled, and
    since the brief notes some users have disabilities. Also anyone in a quiet
    room, on a phone at midnight beside a sleeping child, or on a slow connection.
  why_it_matters: >
    A tool whose entire purpose is to serve families of people with disabilities,
    which ships an uncaptioned video and has no accessibility statement, has a
    credibility problem that no amount of ARIA conformance elsewhere repairs. The
    accessibility statement matters independently of the captions: it is the
    document that tells a disabled visitor "we know, here is the timeline, here is
    who to email" — which is the difference between a barrier and a barrier with a
    door in it. Publishing known limitations honestly is worth more than claiming
    conformance you cannot support.
  standard_reference: WCAG 2.2 SC 1.2.2 (Level A); SC 1.2.3 (Level A); ADA Title III (28 C.F.R. Part 36; nexus theory in the Fourth Circuit is unsettled); Section 508 by analogy; EN 301 549 for any EU exposure
  recommendation: >
    (1) Publish an Accessibility Statement at /accessibility stating the target
    (WCAG 2.2 Level AA), the current honest status, the known limitations
    including the uncaptioned video by name, a named human feedback channel with
    a response-time commitment, and a dated remediation timeline. Draft at
    audit/policies/accessibility-statement.md. (2) Add a caption track. For a
    short explainer this is genuinely a two-hour job: transcribe, write a .vtt,
    add <track kind="captions" srclang="en" label="English" default>. (3) Publish
    a labelled transcript beneath the player — it also helps search, and it is
    the only way a screen-reader user gets the content without playing media.
    Note that the accessibility statement should ship EVEN IF the captions slip;
    it is the honest-status document, not the fix.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: >
    Statement: one page, reviewed twice a year and after any significant release.
    Captions: 1-2 hours for this video. Both self-hosted; no third-party captioning
    service is needed and none should be used, since sending the audio to a
    transcription vendor is an unnecessary third-party flow.
  effort: M
  risk_of_change: >
    Low technically. The real risk is publishing a conformance claim the site
    cannot support — which is why the draft states a target and known gaps rather
    than asserting conformance.
  mission_impact: 3
  reach: 3
  harm_if_unfixed: 5
  environment: both

- id: A8-007
  title: No data retention or deletion statement, and the browser can silently delete a family's letter without anyone being told
  category: missing-document
  what_i_observed: >
    There is no retention or deletion document. More consequentially, the privacy
    page tells families that "If you or a cleanup tool clear this site's data, the
    letter is gone" — framing loss as something the USER or a cleanup tool does.
    It does not say that the BROWSER may do it unprompted. The site does not call
    navigator.storage.persist() anywhere, so its localStorage and IndexedDB are
    "best-effort" storage: subject to eviction under storage pressure on
    Chromium, and — critically — subject to Safari's Intelligent Tracking
    Prevention, which deletes all script-writable storage after a period of no
    user interaction with the site. A parent who writes half a letter on an
    iPhone, closes the tab, and comes back after a fortnight may find it gone.
  evidence:
    type: code + content
    detail: >
      grep for "storage\.persist|navigator\.storage|persisted\(" across src/
      returns NO MATCHES. Storage in use, per SECURITY.md lines 50-54 and
      confirmed in capture-production.json .storageByRoute: localStorage key
      "twl-loi-letter-v1", IndexedDB database "twl-loi-photos" v1, localStorage
      key "mloi.video.whatIsALetterOfIntent.position".
      Current policy text, src/app/privacy/page.tsx:179-181: "If you or a cleanup
      tool clear this site's data, the letter is gone. Download a backup now and
      then. It takes one click."
      The Safari ITP script-writable-storage eviction behaviour is documented by
      Apple/WebKit; I did not reproduce it in this audit. Flagged accordingly in
      confidence.
  confidence: INSPECTED
  who_is_affected: >
    Every user on Safari or iOS — which for this audience is a large share, since
    many are working on a phone. Worst affected are exactly the people the brief
    describes: a parent who starts at 11pm, gets through four sections, and
    intends to come back.
  why_it_matters: >
    This is the finding I would put first if I could only fix one. Everything else
    in this report is about documents; this one is about a family losing hours of
    the hardest writing they will ever do, and being given no warning that it
    could happen. The privacy page's framing — "if YOU clear this site's data" —
    actively misleads, because it locates the risk in the user's own action. A
    parent who never clears anything will reasonably conclude their letter is
    safe. Retention is normally the most boring section of a privacy policy. Here
    it is the section with the highest mission impact in the entire document.
  standard_reference: >
    Cal. Bus. & Prof. Code 22575(b) (process to review/change information);
    state comprehensive laws' retention-disclosure duties where applicable;
    WA MHMDA if it applies. But the governing reason here is the site's own
    mission, not a statute.
  recommendation: >
    (1) Call navigator.storage.persist() on first write and record the result.
    This is a handful of lines, it materially reduces eviction risk on Chromium,
    and Firefox will prompt. (2) Where persistence is NOT granted, say so in the
    interface — one quiet line near the autosave indicator: "Your browser may
    clear this if you do not come back for a while. Download a backup." (3)
    Publish a Data Retention and Deletion statement covering client-side storage
    specifically: what is stored, where, how long "as long as your browser keeps
    it" actually means in practice per browser, what deletes it, and what the
    firm retains (nothing, because it never had anything) versus what Google and
    the hosts retain (GA4 property retention setting; Vercel and Cloudflare log
    retention). Draft at audit/policies/data-retention-and-deletion.md. (4) Amend
    the privacy page sentence so the browser is named as an actor, not only the
    user.
  scope: current
  privacy_impact: >
    N/A for the document. The persist() call creates no data flow; it is a
    request to the local browser. Note it may surface a permission prompt in
    Firefox, which is a UX consideration, not a privacy one.
  cost_and_maintenance: Statement is one page. The persist() work is under two hours. Near-zero maintenance.
  effort: M
  risk_of_change: >
    Low. The one caution: do not turn the warning into a scary modal. A parent
    who is already frightened does not need a dialog telling them their work is
    at risk — a quiet line beside the save indicator is the right register.
  mission_impact: 5
  reach: 4
  harm_if_unfixed: 4
  environment: both

- id: A8-008
  title: No Children's Information notice, and the COPPA position is undocumented and therefore fragile
  category: missing-document
  what_i_observed: >
    The site collects an extraordinary volume of information about a named minor
    — diagnoses, medications, therapies, behavioural triggers, law-enforcement
    interactions, IEP history, religious practice, end-of-life wishes — and says
    nothing anywhere about children's privacy. The COPPA analysis (section 4 of
    this report) concludes the statute very probably does not attach, and rests
    on three independent legs: the site is not directed to children; information
    is not collected from a child; and nothing typed is transmitted at all. Two
    of those three legs are product decisions, not architectural facts, and
    nothing in the repository or on the site records that they are load-bearing.
  evidence:
    type: content + code
    detail: >
      audit/evidence/fill-levels.json .schemaSections enumerates 25 sections
      including: about.diagnoses, medical.allergies, medical.therapies,
      medical.emergencyProtocol, behavior.triggers, behavior.lawEnforcement,
      educationWork.iepHistory, socialFaith.faith, finalWishes.organDonation,
      finalWishes.funeral, benefitsFinances.repPayee.
      Production /privacy full text searched: no occurrence of "child",
      "children", "COPPA", "minor", or "under 13" in any privacy context.
      GA4 does transmit a persistent identifier: capture-production.json shows
      cid=242789107.1786307073 and cookies _ga / _ga_90YXKXB5TC with a 400-day
      lifetime expiring 2027-09-13.
  confidence: INSPECTED
  who_is_affected: The children who are the subject of these letters. Also referring attorneys, who will ask this question.
  why_it_matters: >
    Not because COPPA is likely to be enforced here — I do not think it applies —
    but because a future feature could quietly destroy the defence and nobody
    would notice. A "let your teenager add their own section" flow, or an age
    gate added with good intentions, or a set of child-appealing illustrations,
    each independently changes the analysis. A written notice turns a conclusion
    that currently lives nowhere into a constraint the next person has to
    consciously override. It is also, separately, the answer to a question every
    thoughtful parent on this site is quietly asking.
  standard_reference: COPPA, 15 U.S.C. 6501-6506; 16 C.F.R. Part 312 (as amended 2025 — counsel must verify against operative text)
  recommendation: >
    Publish a short Children's Information notice at /childrens-information or as
    a clearly-anchored section of the privacy policy. It should say plainly: this
    tool is for adults; information about a child is entered by an adult and stays
    on that adult's device; we never receive it; we do not knowingly collect
    information from anyone under 13; here is how to contact us. Keep the internal
    COPPA reasoning in a companion engineering note (not published) listing the
    three legs and the specific product changes that would break each. Explicitly
    recommend AGAINST adding an age gate: it manufactures the actual knowledge
    COPPA's second trigger requires, and it puts a wall in front of an exhausted
    parent for no protective gain. Draft at
    audit/policies/childrens-information.md.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: Half a page. Re-read whenever a feature touches who fills in the form.
  effort: S
  risk_of_change: None.
  mission_impact: 2
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A8-009
  title: Washington My Health My Data Act — the one statute here with a private right of action, and the applicability question is genuinely open
  category: legal-compliance
  what_i_observed: >
    The data this site handles is a textbook match for MHMDA's definition of
    consumer health data: diagnoses, medications, therapies, allergies, symptoms,
    treatment history, emergency protocols. MHMDA has no revenue or volume
    threshold, requires a SEPARATE and DISTINCT consumer health data privacy
    policy linked by its own dedicated link on the homepage, and is enforceable
    by private plaintiffs through the Washington Consumer Protection Act. The site
    has no such policy and no such link. Nevada SB 370 is the parallel statute
    without the private right of action.
  evidence:
    type: content
    detail: >
      Sections and fields that map to consumer health data, from
      audit/evidence/fill-levels.json: medical.allergies,
      medical.emergencyProtocol, medical.therapies, medical.equipment,
      medical.preferredHospital, about.diagnoses, behavior.triggers,
      behavior.earlyWarnings, behavior.crisisPlan, healthMedical.conditions,
      healthMedical.pharmacy, healthMedical.recordsLocation,
      dailyCommunication.hearingVisionMemory.
      Production homepage HTML contains no link matching /health|consumer health/i.
      The countervailing fact, verified: zero canary strings appear in any of the
      431 captured requests, and no request in the capture carries a POST body.
  confidence: NOT_VERIFIED
  who_is_affected: Washington and Nevada residents using the tool; the firm, as the party facing a possible CPA claim.
  why_it_matters: >
    Every other statute discussed in this report is enforced by an attorney
    general with prosecutorial discretion and, realistically, bigger targets.
    MHMDA is enforced by anyone with a lawyer. That asymmetry is the reason to
    take it seriously even though I think the better argument is that the firm
    does not "collect" anything within the meaning of the Act.
  standard_reference: Wash. Rev. Code ch. 19.373 (My Health My Data Act), esp. the consumer health data privacy policy and homepage-link requirements; Nev. SB 370 (2023)
  recommendation: >
    Put this specific question to counsel: does an operator "collect" consumer
    health data under MHMDA's definition — "to buy, rent, access, retain, receive,
    acquire, infer, derive, or otherwise process … in any manner" — when its
    JavaScript writes to the consumer's own browser storage and the operator
    verifiably never receives a byte? I believe the better answer is no, and the
    canary evidence in this audit is unusually strong support. But "otherwise
    process … in any manner" is broad and I found no authority resolving it for
    purely client-side software. If counsel wants belt and braces, the mitigation
    is cheap: a short "Health information" section written to MHMDA's disclosure
    shape, published as its own page with a homepage link. That costs a page and
    moots the argument. Preserve and publicise the canary test — it is the best
    evidence the firm has and it runs on every commit.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: One page plus a homepage link, if adopted. Counsel time is the real cost.
  effort: M
  risk_of_change: Low. A homepage link to a health-data page is a small design intrusion; place it in the footer group with the other policies.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 4
  environment: both

- id: A8-010
  title: Analytics cookies are set on load with no consent mechanism and no Consent Mode, which is a straightforward ePrivacy problem for any EU or UK visitor
  category: legal-compliance
  what_i_observed: >
    Two Google Analytics cookies are set on page load with no consent step of any
    kind. The GA4 requests carry no gcs= consent-state parameter, which indicates
    Google Consent Mode is not implemented. Both cookies carry Secure=false. The
    site is US-focused by every available signal — .com, English only, a US phone
    number, Virginia-only licensure, and subject matter built entirely around US
    programs (SSI, Medicaid waivers, ABLE accounts, IEPs, representative payees) —
    which is a strong argument against GDPR Art. 3(2)(a). But ePrivacy Art. 5(3)
    consent for non-essential cookies does not depend on targeting; it attaches to
    terminal equipment in the EU.
  evidence:
    type: network
    detail: >
      capture-production.json .cookies, verbatim fields:
      _ga | domain=.myletterofintent.com | path=/ | expires=1820867112.867853 |
      httpOnly=False | secure=False | sameSite=Lax
      _ga_90YXKXB5TC | domain=.myletterofintent.com | path=/ |
      expires=1820867112.867652 | httpOnly=False | secure=False | sameSite=Lax
      Expiry 1820867112 = 2027-09-13 20:25 UTC, i.e. exactly 400 days from the
      capture at 2026-08-09.
      The g/collect query strings contain gcd=13l3l3l3l1l1 and npa=0 but NO gcs=
      parameter, consistent with Consent Mode not being configured.
      Implementation: src/app/layout.tsx:114-123 loads gtag and calls
      gtag('config', 'G-90YXKXB5TC') unconditionally on every page.
  confidence: MEASURED
  who_is_affected: EU/UK visitors. Volume unknown to me — see "what I could not examine".
  why_it_matters: >
    The exposure is proportional to EU traffic, which is checkable in the GA4
    property and which I could not see. If it is a rounding error, this is a
    low-priority item and should be documented as a considered decision rather
    than left as an unexamined default. If it is not, it is a real gap. Either
    way, Consent Mode v2 with analytics_storage denied by default costs almost
    nothing and converts an open question into a closed one. Honoring Global
    Privacy Control at the same time closes the US universal-opt-out question in
    the same handful of lines.
  standard_reference: ePrivacy Directive 2002/58/EC Art. 5(3); GDPR Arts. 3(2), 6(1)(a), 13; UK PECR reg. 6; EDPB Guidelines 3/2018 on the territorial scope of the GDPR
  recommendation: >
    Do NOT add a global cookie banner — for this audience, at this moment in their
    lives, a consent interstitial is a real cost and the US-facing legal case for
    it is weak. Instead: (1) implement Google Consent Mode v2 with
    analytics_storage:'denied' as the default, granted only where consent is not
    required or has been given; (2) show a minimal, dismissible consent choice
    ONLY to EEA/UK visitors; (3) honor navigator.globalPrivacyControl by not
    initialising gtag at all when it is set. Region detection on a static export:
    a client-side Intl.DateTimeFormat().resolvedOptions().timeZone heuristic works
    with no infrastructure (SCOPE: current, imperfect); reading Cloudflare's
    CF-IPCountry in a Worker is accurate but adds a runtime component (SCOPE:
    architectural). Also set the GA cookie flags to Secure — GA respects a
    cookie_flags config parameter, so this is one line. Confirm in the GA4
    property that Google Signals is OFF and that data retention is set to the
    shortest useful period.
  scope: current
  privacy_impact: >
    Not required — this recommendation reduces data leaving the device. Consent
    Mode with default-denied means fewer analytics hits carry an identifier, and
    honoring GPC means some visitors generate no analytics call at all. No new
    data flow is created and no new third party is introduced.
  cost_and_maintenance: >
    Half a day to implement. Ongoing: Consent Mode occasionally changes on Google's
    side; budget a check once a year. The EEA banner is the only new UI surface and
    it needs to be accessible, which is a real (small) cost.
  effort: M
  risk_of_change: >
    Moderate, and worth naming: a badly built consent banner is itself an
    accessibility and cognitive-load defect, and it would land on exactly the
    users this site exists for. If it cannot be built well, Consent Mode
    default-denied plus GPC alone is a defensible interim position.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 3
  environment: production

- id: A8-011
  title: The Google Analytics disclosure omits the partner-data link and the concrete cookie facts a reader would need to verify it
  category: privacy-disclosure-accuracy
  what_i_observed: >
    Section 04 of the privacy page describes GA accurately and warmly, and offers
    Google's opt-out add-on — which is more than most sites do. But it does not
    name the cookies, state their lifetime, link Google's privacy policy, or link
    Google's "How Google uses information from sites or apps that use our
    services" page. It also says Google's terms "apply to what it collects"
    without saying where to read them. The Google Analytics Terms of Service place
    notice obligations on the customer, and the partner-data link is the
    conventional way those are met.
  evidence:
    type: content + network
    detail: >
      src/app/privacy/page.tsx:230-235, verbatim: "It reports the ordinary things a
      web server sees: which pages were opened, roughly which region the visit came
      from, the browser and device, and the link that brought you here. Google sets
      its own cookies to do that, and its privacy terms apply to what it collects."
      No hyperlink to any Google policy appears on the page. The only external
      Google link is GA_OPT_OUT_URL = https://tools.google.com/dlpage/gaoptout
      (src/config/analytics.ts:31).
      The concrete facts that are missing and that I established from the capture:
      cookie names _ga and _ga_90YXKXB5TC; 400-day lifetime; expiry 2027-09-13;
      measurement ID G-90YXKXB5TC; the payload is a page_view carrying dl (page
      URL), dt (page title), and device/locale/screen fields — and nothing else.
  confidence: INSPECTED
  who_is_affected: Anyone trying to verify the claim rather than take it on faith — which the page explicitly invites them to do.
  why_it_matters: >
    The page's best move is inviting the reader to check for themselves: "open your
    browser's developer tools, go to the network tab, and type into the letter."
    A reader who accepts that invitation will find two cookies the page never
    named. Naming them costs three lines and strengthens the invitation rather
    than complicating it. Publishing the exact GA4 payload — page URL, page title,
    device, region — is also a much stronger claim than "the ordinary things a web
    server sees", because it is falsifiable.
  standard_reference: Google Analytics Terms of Service, privacy/notice obligations (verify current clause text); Cal. Bus. & Prof. Code 22575(b)(6)
  recommendation: >
    Add a short table naming both cookies, their purpose, and their 400-day
    lifetime; link Google's privacy policy and the partner-data page; and state
    the actual GA4 payload in plain words, since it is small and reassuring. This
    is drafted in audit/policies/cookies-and-storage.md, which is designed to slot
    in as a section of the privacy policy rather than a separate page — a separate
    cookie page for two cookies would be ceremony without benefit.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: An hour. Re-check the cookie lifetime if GA changes it.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 4
  harm_if_unfixed: 2
  environment: both

- id: A8-012
  title: No vulnerability disclosure policy and no security.txt — the project's own security document recommended this and it was not done
  category: missing-document
  what_i_observed: >
    A researcher who finds a flaw in this site has no published route to report
    it. There is no /.well-known/security.txt, no /security page, and no security
    contact address. SECURITY.md itself flags this as a recommendation, at item 2
    under "Further security recommendations", and it remains open.
  evidence:
    type: code
    detail: >
      SECURITY.md line 236-238, verbatim: "**Add a `security.txt`** at
      `/.well-known/security.txt` with a contact address, so a researcher who
      finds something has an obvious route."
      public/ directory listing contains no .well-known directory and no
      security.txt: mloi-lockup-horizontal-2x.png, mloi-lockup-stacked.png,
      monogram-gold.png, og-image.png, pdf.worker.min.mjs,
      video-poster-lockup.png, what-is-a-letter-of-intent.mp4, 8 font files, and
      8 sample document files.
  confidence: INSPECTED
  who_is_affected: The firm, and by extension every family — a vulnerability nobody can report is a vulnerability that does not get fixed.
  why_it_matters: >
    The realistic scenario is not a black-hat. It is a security-minded parent, or
    an attorney's IT person, who notices something and has no idea who to tell —
    so they either tell nobody, or they tell the world. RFC 9116 exists precisely
    to make the first outcome less likely. On a static export this is a text file
    in public/.well-known/, and it takes ten minutes.
  standard_reference: RFC 9116 (security.txt); ISO/IEC 29147 (vulnerability disclosure)
  recommendation: >
    Publish public/.well-known/security.txt with Contact, Expires, Preferred-
    Languages, Policy, and Canonical fields, and a short Vulnerability Disclosure
    Policy page it points to. Set a calendar reminder for the Expires date — an
    expired security.txt is worse than none, because it signals abandonment.
    Draft at audit/policies/vulnerability-disclosure.md, which includes the
    security.txt body.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: Ten minutes to publish. One diary entry a year to refresh the Expires field.
  effort: S
  risk_of_change: >
    One consideration: publishing a security contact invites low-quality
    automated reports. The policy draft sets scope and expectations to reduce
    that, and the volume for a site this size will be small.
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 2
  environment: both

- id: A8-013
  title: SECURITY.md is the site's best trust asset and it is invisible to everyone who needs it
  category: missing-document
  what_i_observed: >
    SECURITY.md is 15,452 bytes of careful, specific, honestly self-critical
    security analysis — including a section headed "Known weakness, stated
    plainly" that concedes the unsafe-inline CSP gap. It exists only in the
    repository. No family, and no referring attorney, will ever see it. The site
    has no security page at all.
  evidence:
    type: code
    detail: >
      SECURITY.md exists at the repository root (15,452 bytes). No route under
      src/app/ renders it, it is not in public/, and src/app/sitemap.ts does not
      reference it. The only security-adjacent public content is the privacy page.
  confidence: INSPECTED
  who_is_affected: >
    Referring special-needs trust attorneys — the highest-leverage audience this
    site has, and the one most likely to ask "how do I know?" before sending a
    client.
  why_it_matters: >
    An attorney deciding whether to refer clients to a free tool that handles a
    disabled child's medical history is doing diligence, and the artifact that
    would satisfy that diligence already exists. Publishing a plain-language
    version of it converts a private engineering document into the single most
    persuasive page on the site. This is the highest-return item in this report
    relative to effort, and it is a growth item as much as a compliance one.
  standard_reference: None. Best practice; supports every disclosure obligation discussed above.
  recommendation: >
    Publish a Security Practices page at /security aimed at a non-engineer, with
    the technical detail beneath. Keep the honesty — including the unsafe-inline
    concession, restated in plain words — because the honesty is what makes it
    persuasive. Include the canary test as the headline claim: "we run a test on
    every code change that types a letter and fails the build if a single word of
    it reaches any server, including Google's." That sentence is worth more than
    the rest of the page. Keep SECURITY.md as the engineering source of truth and
    have the page cite it. Draft at audit/policies/security-practices.md.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: One page derived from a document that already exists. Review whenever SECURITY.md changes.
  effort: M
  risk_of_change: >
    Real but manageable: a published security page must not drift from the code.
    Mitigate by deriving it from SECURITY.md and reviewing both together — and by
    fixing A8-002 first, so it does not inherit two false claims.
  mission_impact: 2
  reach: 2
  harm_if_unfixed: 2
  environment: both

- id: A8-014
  title: The privacy page's meta description contains a broken sentence fragment, live in production and in search results
  category: content-defect
  what_i_observed: >
    The <meta name="description"> for /privacy contains a leftover fragment from
    an earlier edit. It reads "...we count page visits and nothing else. of any
    kind. Here is exactly how that works, in plain words." The stray "of any
    kind." is an orphaned clause. This is the text Google shows under the search
    result for the privacy policy of a site whose entire proposition is that it
    can be trusted with a disabled child's medical history.
  evidence:
    type: content
    detail: >
      Live GET https://myletterofintent.com/privacy, meta description verbatim:
      "Everything you type stays on your device. No account, and nothing you write
      is ever captured — we count page visits and nothing else. of any kind. Here
      is exactly how that works, in plain words."
      Source: src/app/privacy/page.tsx:9-12, where the string concatenation is
      "...we count page visits and nothing else. " + "of any kind. Here is exactly
      how that works, in plain words."
  confidence: MEASURED
  who_is_affected: Anyone who finds the privacy policy through search, and anyone who shares its link.
  why_it_matters: >
    Tiny defect, outsized signal. A visibly unproofread sentence on the privacy
    page is precisely the kind of detail that makes a careful reader wonder what
    else was not checked. It is a two-minute fix and it sits on the page that
    carries the most trust weight on the site.
  standard_reference: None.
  recommendation: >
    Delete "of any kind. " from the metadata description in
    src/app/privacy/page.tsx. While there, consider whether the description
    should mention the effective date once A8-004 is implemented.
  scope: current
  privacy_impact: N/A
  cost_and_maintenance: Two minutes.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 1
  environment: both

- id: A8-015
  title: No policy change log and no AI-use position, on a site whose credibility depends on being checkable over time
  category: missing-document
  what_i_observed: >
    There is no record of when any policy changed or what changed. Combined with
    the absence of an effective date (A8-004), there is no way for a family, an
    attorney, or a regulator to establish what the site promised on any given
    date. Separately, the codebase contains no AI features of any kind — I
    searched and found nothing — and no statement about AI. That absence is
    currently an unstated fact rather than a commitment.
  evidence:
    type: code
    detail: >
      grep -ri "openai|anthropic|gemini|claude|LLM|machine learning" across src/
      returns no substantive matches (only CSS section comments and JSX <section>
      tags matched the case-insensitive \bAI\b pattern). No CHANGELOG file exists
      at the repository root: the root contains .gitignore, AGENTS.md, CLAUDE.md,
      eslint.config.mjs, next-env.d.ts, next.config.ts, package.json,
      package-lock.json, playwright.config.ts, postcss.config.mjs, README.md,
      SECURITY.md, tsconfig.json, vitest.config.ts. No /changelog route.
  confidence: INSPECTED
  who_is_affected: Anyone relying on a promise made at a point in time — families, referring attorneys, and the firm defending a claim.
  why_it_matters: >
    A privacy promise this strong is only as good as the ability to show it was in
    force when someone relied on it. A dated change log is the cheapest possible
    evidentiary record and it costs three lines per change. The AI point is
    forward-looking: the pressure to add "help me write this section" is going to
    arrive, and any such feature would send a parent's description of their child
    to a third-party model — the single clearest violation of the canonical
    promise available. Writing the position down NOW, while it costs nothing,
    makes that a decision someone has to consciously reverse in public rather than
    a feature that ships on a Tuesday.
  standard_reference: Cal. Bus. & Prof. Code 22575(b)(4) (process for notifying consumers of material changes)
  recommendation: >
    (1) Publish a policy change log at /policy-changes — a dated table, newest
    first, one line per change, with a plain-English "what this means for you"
    column. Draft at audit/policies/policy-changelog.md. (2) Publish a short AI Use
    statement saying the tool uses no AI and that no content a family writes is
    ever sent to any AI system; commit that any future AI feature would run
    entirely on-device or not at all, and that this page would change first. Draft
    at audit/policies/ai-use.md. If an AI feature is ever contemplated, it MUST
    carry the full PRIVACY IMPACT block — a cloud model call is user data leaving
    the device, opt-in or not.
  scope: current
  privacy_impact: >
    N/A for these documents. Recorded here as a forward guard: any future AI
    feature that sends letter content off-device would require the core promise to
    be reworded from "Everything you type stays on your device" to something
    materially weaker, and would create subpoena exposure at the model provider
    for a disabled child's medical and behavioural history. A client-side
    alternative (on-device model, or template-based prompts with no network call)
    should be the only option considered.
  cost_and_maintenance: Change log: three lines per policy change. AI statement: half a page, reviewed annually.
  effort: S
  risk_of_change: None.
  mission_impact: 1
  reach: 2
  harm_if_unfixed: 2
  environment: both
```

---

## 7. Recommended document set — priority, necessity, reviewer, and cost

"Legally required" below means *required by a statute I believe plausibly
applies*. Counsel must confirm applicability; see the caveats in section 5.

| # | Document | Priority | Status | Legally required? | Who must review | Maintenance |
| --- | --- | --- | --- | --- | --- | --- |
| 1 | **Privacy Policy (layered rewrite)** — `audit/policies/privacy-policy-layered.md` | **P0** | Drafted | **Yes** — CalOPPA elements are missing today and CalOPPA has no size threshold | Privacy counsel + Claire Kelly | Annual review; edit on any third-party change |
| 2 | **Accessibility Statement** — `audit/policies/accessibility-statement.md` | **P0** | Drafted | Advisable; ADA Title III risk is unsettled in the 4th Circuit but real | Claire Kelly + whoever owns a11y remediation | Twice yearly, and after any significant release |
| 3 | **Data Retention & Deletion (client-side)** — `audit/policies/data-retention-and-deletion.md` | **P0** | Drafted | Advisable as a document; the underlying *fact* (browser eviction) is a mission-critical disclosure | Claire Kelly | Annual; edit if storage strategy changes |
| 4 | **Terms of Use** — `audit/policies/terms-of-use.md` | **P1** | Drafted | Advisable, not required. Protects the firm | Claire Kelly (own liability — do not delegate) | Annual |
| 5 | **Children's Information Notice** — `audit/policies/childrens-information.md` | **P1** | Drafted | Advisable. Documents the COPPA position | Privacy counsel | Re-read on any change to who fills in the form |
| 6 | **Security Practices page** — `audit/policies/security-practices.md` | **P1** | Drafted | No. Highest trust-return item in this report | Claire Kelly + engineering | Whenever `SECURITY.md` changes |
| 7 | **Cookies & Storage notice** — `audit/policies/cookies-and-storage.md` | **P1** | Drafted (as a policy *section*, not a separate page) | Partly — CalOPPA third-party/DNT elements | Privacy counsel | On any analytics change |
| 8 | **Vulnerability Disclosure + `security.txt`** — `audit/policies/vulnerability-disclosure.md` | **P2** | Drafted | No | Claire Kelly | Refresh `Expires` annually |
| 9 | **AI Use statement** — `audit/policies/ai-use.md` | **P2** | Drafted | No. Forward guard | Claire Kelly | On any AI proposal — which is the point |
| 10 | **Policy Change Log** — `audit/policies/policy-changelog.md` | **P2** | Drafted | Supports the CalOPPA change-notification element | Whoever edits a policy | Three lines per change |
| 11 | **Consumer Health Data policy (WA/NV)** | **P2, conditional** | **Not drafted** | Open question — see A8-009 | Privacy counsel first | Only if adopted |
| 12 | **Data Processing Addenda with Vercel and Cloudflare** | **P2** | Not a website document | No, but prudent for a firm handling this data | Claire Kelly | One-time; re-check on vendor change |

**Deliberately NOT recommended:**

- **A cookie consent banner shown to all visitors.** Weak US legal case, real
  cognitive cost for this audience. Region-scoped only, if at all. (A8-010)
- **An age gate.** Manufactures COPPA actual knowledge and adds friction for the
  exact user this site exists for. (A8-008)
- **A separate stand-alone Cookie Policy page.** Two cookies do not warrant a
  page; it belongs as a section of the privacy policy. Ceremony is not
  compliance.
- **A click-through Terms acceptance gate.** A parent who is frightened and tired
  should not meet a modal before they can write about their child.

---

## 8. What I examined, and what I could NOT examine

### Examined directly

- `src/app/privacy/page.tsx` in full (355 lines), and the live rendered page.
- `src/config/firm.ts`, `src/config/analytics.ts`, `src/app/layout.tsx`,
  `next.config.ts`, `src/app/robots.ts`, `src/app/sitemap.ts`,
  `src/components/chrome/SiteFooter.tsx`, `src/components/chrome/PrivacyStrip.tsx`,
  `src/components/review/ReminderPanel.tsx`, `src/app/your-data/page.tsx`,
  `SECURITY.md` in full.
- `audit/evidence/network/capture-production.json` in full — all 431 requests,
  all responses, cookies, and per-route storage; searched programmatically for
  every canary.
- `audit/evidence/fill-levels.json` — the 25-section schema, for the data-category
  analysis.
- Live production: fetched `/` and `/privacy`, read response headers, read the
  browser console, read the browser network log. This is how the Cloudflare
  beacon and its CSP block were established rather than inferred.
- Readability, computed with a self-written Flesch/Fog/SMOG implementation over
  the extracted prose.
- Greps across `src/` for storage persistence, AI usage, caption tracks, and
  existing policy routes.

### Could NOT examine, and why

1. **The GA4 property configuration.** Google Signals on/off, data retention
   period, Google-services data sharing, IP handling, and the country breakdown
   of sessions. All require dashboard access. **This is the single largest gap
   in this report** — it determines whether GA is a "sale"/"share"/"targeted
   advertising" under state law, whether COPPA's persistent-identifier concern
   is amplified, and whether GDPR is a live question at all.
2. **The Cloudflare zone configuration.** I established that Web Analytics is
   configured (the beacon token is in the HTML) and that Email Obfuscation is on.
   I could not see what else is enabled, whether Bot Fight Mode injects anything
   further, or what log retention applies.
3. **Vercel and Cloudflare log retention periods**, and whether DPAs exist. Both
   are answerable in an afternoon by the account holder; neither is answerable
   from outside.
4. **The firm's revenue and per-state consumer counts.** Every threshold in
   section 5 depends on these. I assumed the firm is small; that assumption is
   load-bearing and unverified.
5. **The operative 2025 text of 16 C.F.R. Part 312.** My COPPA reasoning uses
   the rule as I understand it; the 2025 amendments have staged compliance dates
   and I did not read the amended text. Marked `INFERRED`.
6. **Whether Safari ITP actually evicts this site's storage in practice.** I
   established that `navigator.storage.persist()` is never called, which is the
   code fact. The eviction behaviour itself I did not reproduce — that needs a
   real device test over a real interval.
7. **`e2e/privacy-network.spec.ts`.** `SECURITY.md` describes it in detail and I
   relied on that description in A8-013. I did not open or run the spec. If its
   canary assertions are weaker than described, my recommendation to publicise it
   is weaker too.
8. **Bash was unavailable for the entire session** (tool classifier outage). I
   worked around it with PowerShell and read-only tools, which cost nothing
   material, but it is worth recording that some checks were done with different
   tooling than usual.

---

## 9. Three highest-confidence findings

1. **A8-001 / A8-003 — Cloudflare Web Analytics is injected into every production
   page and is blocked only by CSP.** `MEASURED` three independent ways: the host
   appears in the shared capture; I fetched the production HTML and read the
   `<script>` tag with its token verbatim; and I loaded the page in a browser and
   read the CSP violation from the console. It is also the only one of 431
   requests with no matching response. There is no interpretation involved.
2. **A8-006 — the explainer video has no captions and there is no accessibility
   statement.** `MEASURED`: zero `<track>` elements in the production HTML, a
   source comment stating the omission deliberately, and no `/accessibility`
   route. The WCAG 2.2 SC 1.2.2 mapping is unambiguous for prerecorded
   synchronised media.
3. **A8-014 — the broken meta description is live.** `MEASURED` by direct fetch,
   traced to the exact source lines. Trivial to fix and impossible to dispute.

Honourable mention, because it is the most important thing I verified and it is
*good news*: **zero canary strings appear in any of the 431 captured requests,
and no request carries a POST body.** The canonical promise holds. Every
criticism in this report is a criticism of the *documentation* of an
architecture that is, on the evidence, sound.

## 10. Three least-confident findings

1. **A8-009 — Washington MHMDA applicability.** `NOT_VERIFIED`, and I want to be
   explicit that this is the finding most likely to be wrong in either direction.
   The factual predicate is measured; the legal question — whether "otherwise
   process … in any manner" reaches an operator whose code writes only to the
   consumer's own device — is genuinely unresolved and I found no authority. I
   could be overstating the risk, or understating it.
2. **A8-010 — the GDPR/ePrivacy exposure.** The territorial-scope reasoning is
   sound but the *materiality* depends entirely on EU traffic volume, which I
   cannot see. If the GA4 property shows a handful of EU sessions a month, this
   finding should drop several priority levels. I have written it as if the
   answer is unknown, because it is.
3. **A8-007's Safari eviction claim.** I am confident about the code fact
   (`persist()` is never called) and about the general browser behaviour, but I
   did not reproduce eviction on a real device over a real interval. The
   recommendation stands regardless — calling `persist()` is correct either way —
   but the severity I assigned assumes the eviction behaviour bites in practice.

I also want to flag one place where I disagree with the brief's premise:
**the readability hypothesis was wrong.** The policy measures at grade 7.2, not
grade 14. I have written section 3 to say so plainly rather than reshaping the
finding to fit the expectation.

## 11. What I would need to be more certain

| To resolve | I would need | Effort for the owner |
| --- | --- | --- |
| Whether GA is a "sale"/"share" under state law; whether COPPA's identifier concern is amplified; whether GDPR is live | A screenshot of GA4 Admin → Data Settings (Google Signals, retention, data sharing) and Reports → Demographics → Country for the last 12 months | 10 minutes |
| Whether the Cloudflare beacon should exist at all | Cloudflare dashboard → Analytics → Web Analytics: is the site listed, and was it enabled deliberately? | 5 minutes |
| Whether "our host" disclosure is adequate | Vercel and Cloudflare log-retention periods; whether DPAs are executed | Half a day |
| Every state-law threshold in section 5 | The firm's gross revenue and an estimate of unique visitors from CA, WA, TX, and the EU | 30 minutes with GA4 open |
| The COPPA conclusion | The operative 2025 text of 16 C.F.R. Part 312, read by counsel against section 4 of this report | Counsel time |
| The MHMDA question | Counsel's view on "collect … otherwise process … in any manner" as applied to client-side-only software. This is a genuinely novel question and worth a proper memo | Counsel time |
| Whether the Safari eviction risk is real in practice | A real iPhone, a half-finished letter, and a fortnight | Two weeks elapsed, 15 minutes of work |
| Whether A8-013's headline claim is safe to publish | Reading and running `e2e/privacy-network.spec.ts` to confirm the canary assertions match `SECURITY.md`'s description | An hour |

---

## 12. Where a recommendation is technically correct but would not really help that parent

The brief asked for this explicitly, and it matters more than the findings list.

- **The cookie banner.** Technically defensible under ePrivacy. In practice it is
  an interstitial in front of a frightened person at 11pm, and it would be the
  first thing they meet. **Do not ship a global one.** Region-scope it or skip it.
- **The age gate.** Feels like child protection. Is actually a friction wall that
  manufactures the legal knowledge it is meant to avoid. **Do not build it.**
- **A long, complete, regulator-proof privacy policy.** The current page's
  greatest asset is that a tired parent will actually finish it. A compliance
  rewrite that pushes it to grade 14 would be a net loss even if every element
  were technically present. **Layer, do not replace.**
- **A separate Cookie Policy page.** Two cookies. A page for that is ceremony.
- **Click-through Terms acceptance.** Legally marginally stronger. Emotionally
  wrong for this doorway.

And conversely, the one item in this report that is *not* a document and matters
more than all of them: **`navigator.storage.persist()` and an honest sentence
about browser eviction (A8-007).** No policy in `audit/policies/` will help a
parent who loses four sections of the hardest writing of their life because
Safari cleared their storage while they were not looking. That is the finding to
act on first.

---

*Prepared 2026-08-09 by A8 (policy and legal documents), working blind to the
other eight analysts. Not legal advice. All drafts require attorney review before
publication.*
