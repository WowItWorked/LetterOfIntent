# A7 — Privacy and Security Verification

Analyst A7. Working blind to the other eight. Everything below is from my own
investigation of this site.

**Environment note.** Production = `https://myletterofintent.com`, probed live on
2026-08-09. Code citations are from the local working tree (HEAD `d5ec230`, with
`src/app/page.tsx` and `src/components/home/VideoPlayer.tsx` uncommitted as the
brief describes). Where production and local disagree I say so.

---

## THE VERDICT, UP FRONT

**"Everything you type stays on your device" is ACCURATE as worded.** I tried
hard to break it and could not. 309 search needles across 17 canary values in 24
encodings, against every outbound URL, header, and body in a 431-request
production session: **zero hits**. I then ran three further live production
sessions of my own — typing, downloading a real PDF, deleting everything — and
found no typed value in any outbound request. The scoping to *typed content* is
doing real work and it holds.

**But three things around that promise are not accurate today:**

1. **Typing now generates a Google Analytics event.** GA4 Enhanced Measurement
   "Form interactions" is switched on. The first keystroke in any section fires
   `en=form_start` carrying `ep.first_field_name` (e.g. `diagnoses`,
   `allergies`), `ep.form_destination` (e.g. `/letter/medical`), and
   `epn.form_length`. **No field values.** So the letter is not leaking — but
   this is more than "a page view", and it directly falsifies the privacy page's
   own invitation to check ("type into the letter... after that, silence, no
   matter how much you write"). A parent who follows the site's instructions
   will see a second request fire. **A7-002.**

2. **Cloudflare injects two scripts into every page that are in nobody's
   codebase and on nobody's disclosure.** One (`static.cloudflareinsights.com`
   RUM beacon) is blocked by the site's own CSP and has never executed — good
   luck, not design. One (`/cdn-cgi/.../email-decode.min.js`) is served
   same-origin, passes `script-src 'self'`, and **does execute** with full access
   to the localStorage holding the letter. **A7-004, A7-005.**

3. **"Delete all my data" tells the family "this device now holds nothing from
   this tool" and that is measurably false** — the IndexedDB database survives,
   an empty localStorage key is recreated on next load, and both Google
   Analytics cookies remain for ~13 months. The letter *content* is genuinely
   gone. The *fact that the tool was used* is not. **A7-007.**

Nothing here means a family's words have leaked. Everything here means the
site currently promises slightly more than it delivers, in ways that are cheap
to fix.

---

## FINDINGS

```yaml
- id: A7-001
  title: No user-typed content leaves the device — verified adversarially against production
  category: privacy-verification
  what_i_observed: |
    I searched the entire outbound production capture for every planted canary in
    plaintext and in 23 obfuscated forms, and found nothing. Then I reproduced the
    result in three independent live sessions of my own.

    Corpus searched: all 431 requests in audit/evidence/network/capture-production.json,
    decomposed into 2,582 outbound text fields (every request URL, every query-string,
    every request header value, every postData body, plus every cookie record) —
    91,595 characters in total.

    Needles: 309, built from 17 values — the 8 planted canaries (.canaries:
    ZQXCANARYAUTHOR7781, ZQXCANARYREL7782, ZQXCANARYSUBJECT7783, ZQXCANARYPREF7784,
    ZQXCANARYDIAGNOSIS7785, ZQXCANARYHISTORY7786, ZQXCANARYFIRST5-7787,
    ZQXCANARYIMPORTANT7788), the 6 typed canaries (ZQXTYPEDCANARY9900..9905), the
    seeded date of birth 2014-04-02, and the storage key twl-loi-letter-v1 — each
    expanded into these forms:

      plain, plain-lower, plain-upper, urlencoded, urlencoded-twice, base64,
      base64-unpadded, base64url, base64 at byte-offset 1, base64 at byte-offset 2,
      hex, md5, sha1, sha256, md5/sha1/sha256 of the lowercased value, reversed, rot13

    Plus 5 bare-prefix sweeps that would catch any encoding I did not enumerate:
    "ZQX", "zqx", "WlFY" (base64 of ZQX), "WlFYQ0FOQVJZ" (base64 of ZQXCANARY),
    "WlFYVFlQRUQ" (base64 of ZQXTYPED).

    RESULT: 0 hits anywhere. 0 hits on third-party hosts. Also: 0 of the 431
    requests carried a postData body of any kind, and every `referer` header in the
    capture was empty (Referrer-Policy: no-referrer is working).

    I then ran my own live production sessions rather than trusting the shared
    capture alone: typed ZQXFORMCANARY7171 / ZQXREPRO5555 into /letter/about,
    /letter/medical, /letter/behavioral-support and /letter/getting-started,
    generated and downloaded a real Letter of Intent PDF
    (Letter-of-Intent-Disabilities-2026-08-09.pdf), and searched every GA hit.
    Canary present: false, in plain, url-encoded and base64 form.
  evidence:
    type: network
    detail: |
      Script and full output retained. Summary line from the run:
        requests 431 / outbound fields 2582 (91595 chars searched) / needles 309
        unique hosts: myletterofintent.com, static.cloudflareinsights.com,
                      www.google-analytics.com, www.googletagmanager.com
        3rd-party reqs 25
        === HITS (any host) === NONE
        === HITS ON THIRD-PARTY HOSTS === NONE
      Live re-verification (my own session, production):
        "canary present in GA traffic: false" on 4/4 wizard routes.
      Supporting code: src/lib/store.ts:50-52 (localStorage only),
      src/lib/photos.ts:1-14 ("There is no upload path anywhere in this module"),
      src/lib/download.ts:1-14 (blob: object URL, no network),
      src/lib/share.ts:12-99 (share targets carry static strings and the bare site
      URL only — no letter data anywhere near them).
  confidence: MEASURED
  who_is_affected: every family using the tool
  why_it_matters: |
    This is the promise the whole product rests on, and it survives an adversarial
    test. That deserves to be stated as plainly as the defects. The client-side-only
    architecture is not marketing — connect-src is pinned, there is no upload path,
    and the canaries prove it end to end.
  standard_reference: NIST Privacy Framework CT.DM-P1 (data processed limited to identified purpose); the site's own canonical promise
  recommendation: |
    Keep this. Also make it a standing regression test rather than a one-off audit
    result — see A7-012, which is the reason A7-002 slipped through.
  scope: current
  privacy_impact: none — this finding is a confirmation, not a change
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 5
  reach: 5
  harm_if_unfixed: 1
  environment: both

- id: A7-002
  title: Typing into the letter fires a Google Analytics form_start event carrying field names and section identity
  category: privacy
  what_i_observed: |
    GA4 Enhanced Measurement "Form interactions" is enabled on property
    G-90YXKXB5TC. The moment a parent types into any wizard section, a second
    /g/collect request fires with en=form_start.

    Reproduced 4 times out of 4, each in a fresh browser context, on production:

      /letter/about            en=form_start  ep.first_field_id=f-diagnoses
                                              ep.first_field_name=diagnoses
                                              ep.form_destination=https://myletterofintent.com/letter/about
                                              epn.form_length=7  epn.first_field_position=2
      /letter/about (repeat)   identical
      /letter/medical          ep.first_field_id=f-allergies
                               ep.first_field_name=allergies
                               ep.form_destination=.../letter/medical
                               epn.form_length=13 epn.first_field_position=1
      /letter/getting-started  ep.first_field_id=f-authorName
                               ep.first_field_name=authorName  ep.first_field_type=text
                               ep.form_destination=.../letter/getting-started
                               epn.form_length=5

    Every hit also carries _et (engagement time in ms), cid (the persistent
    client id), and dt (the document title, e.g. "Medical — Letter of Intent
    Builder").

    CRITICALLY: no field VALUES. My canary never appeared in any of these hits.
    The canonical promise, scoped to typed content, is NOT violated.

    What Google does now receive is: "this browser began entering data in the
    Medical section of a special-needs Letter of Intent, starting with the
    allergies field, and stayed engaged for 3.7 seconds." That is a behavioural
    profile of a caregiving household, and first_field_name=diagnoses is a
    health-adjacent inference about a real disabled person.

    This is a GA property setting, not code. Nobody changed the repository. The
    code comment at src/config/analytics.ts:11-15 ("It records that a page was
    opened... there is no event that carries form values") is still literally true
    about values, but is no longer a complete account of what GA sends.
  evidence:
    type: network
    detail: |
      Live production run, verbatim from the form_start hit on /letter/about:
        en = form_start
        ep.form_id =
        ep.form_destination = https://myletterofintent.com/letter/about
        epn.form_length = 7
        ep.first_field_id = f-diagnoses
        ep.first_field_name = diagnoses
        epn.first_field_position = 2
        _et = 4068
        dl = https://myletterofintent.com/letter/about
        dt = About your loved one — Letter of Intent Builder
      Contradicted copy, quoted exactly from src/app/privacy/page.tsx:152-156 and
      live on https://myletterofintent.com/privacy:
        "You can confirm this yourself: open your browser's developer tools, go to
         the network tab, and type into the letter. Nothing is sent. You will see
         the analytics request that counts the page when it first loads — and after
         that, silence, no matter how much you write."
      Note: the shared capture at audit/evidence/network/capture-production.json
      does NOT contain a form_start hit — its typing phase used .fill() on a route
      where the event did not land within the capture window. I found this only by
      running my own sessions. Anyone relying on the shared capture alone will miss it.
  confidence: MEASURED
  who_is_affected: every family who types anything — i.e. every user who starts a letter
  why_it_matters: |
    Two separate harms, and the second is worse than the first.

    (a) Google receives section-level engagement signals about disability
    caregiving. Not content, but not nothing.

    (b) The privacy page dares the reader to verify the promise, and the
    verification now fails. This audience includes attorneys who refer families
    here and parents who are already frightened. A parent who opens devtools
    because the site told them to, and sees a request fire as they type, has no
    way to know it carried only a field name. The most likely reading is "they
    lied". Inviting a check you fail is more damaging than never inviting one.
  standard_reference: |
    GDPR Art. 5(1)(a) transparency and Art. 9 (health-related inference);
    NIST Privacy Framework CM.AW-P1 (mechanisms for individuals to understand
    data processing); the site's own canonical promise scope
  recommendation: |
    Do all four, in this order. None of them removes Google Analytics.

    1. Turn OFF "Form interactions" in GA4 Admin → Data Streams → the web stream →
       Enhanced measurement. Also turn off "File downloads" and "Site search" —
       neither is wanted here and both are on by default. This is a settings
       change, takes two minutes, and stops the event at source. Verify by
       repeating my test.
    2. Fix the copy at src/app/privacy/page.tsx:152-156 so it is true whatever
       Google turns on next. Suggested wording that stays falsifiable without
       being hostage to a vendor default: "...type into the letter, and watch what
       leaves. You will see requests that count the visit — the page you opened,
       and that you started filling something in. What you will never see is a
       single word you wrote. That is the line, and you can hold us to it."
    3. Pin it in code so a future GA default cannot silently re-widen the surface:
       gtag('config', GA_MEASUREMENT_ID, { send_page_view: true }) is not enough,
       because Enhanced Measurement is server-side. The durable guard is the
       regression test in A7-012.
    4. Update the comment block at src/config/analytics.ts:11-15 to describe what
       GA actually sends today, since that file explicitly claims to be the single
       source of truth the privacy page and CSP are derived from.
  scope: current
  privacy_impact: |
    This recommendation REDUCES data leaving the device. No new egress. The
    PRIVACY IMPACT block is not required for a reduction, but for completeness:
    after the change, what leaves the device is a GA4 page_view only — the same
    thing the owner has already ruled acceptable.
  cost_and_maintenance: none — a settings toggle plus a copy edit
  effort: S
  risk_of_change: very low — turning off an Enhanced Measurement sub-feature affects no site code
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 3
  environment: production

- id: A7-003
  title: On-site copy claims more than the canonical scope in five places, and the privacy page's meta description is a broken sentence in production
  category: content-accuracy
  what_i_observed: |
    The canonical scope is USER-TYPED CONTENT. Several strings drop that scoping
    and claim something broader, which analytics traffic contradicts.

    Overclaims (each quoted exactly, with where it appears):

    (1) src/app/layout.tsx:38-41 — site-wide meta description, live on every page
        including the homepage:
          "...Everything stays on your device."
        Not "everything you type". This is the string that appears in Google
        results and in link previews, so it is the version most people read first.

    (2) src/app/privacy/page.tsx:91 — the first of three claim cards, as a
        standalone heading:
          "Nothing is uploaded"
        Page views are uploaded.

    (3) src/app/privacy/page.tsx:239-244 — the gold callout:
          "Nothing you type into any field is captured, by us or by anyone else
           through this site. The words stay in this browser's own storage, and no
           script on this page reads them, sends them, or records your screen."
        The values claim is true and I verified it. But "by anyone else through
        this site" and "no script on this page" are categorical claims about code
        the owner does not control and did not put there — and A7-005 shows a
        Cloudflare-injected script does run on this page, same-origin, with access
        to that storage. It does not read the letter. The sentence still promises
        something the architecture cannot guarantee.

    (4) src/components/chrome/PrivacyStrip.tsx:22-23 — the band under the
        masthead, on every page:
          "Private by design. Everything you type stays on your device and is
           never sent anywhere."
        Correctly scoped to "you type" — this one is fine. Noted so the owner does
        not change it by mistake while fixing the others.

    (5) src/app/page.tsx:170 (LOCAL ONLY, uncommitted) —
          "Your data remains on your device and is never shared."
        I confirmed the string "never shared" IS present in the production HTML, so
        this claim is live regardless of the uncommitted state of page.tsx.

    Separately, a plain content defect. src/app/privacy/page.tsx:9-12 concatenates
    three fragments and the middle one was clearly edited without removing the tail
    of the old sentence. Live in production right now:

      <meta name="description" content="Everything you type stays on your device.
      No account, and nothing you write is ever captured — we count page visits and
      nothing else. of any kind. Here is exactly how that works, in plain words."/>

    "nothing else. of any kind." — an orphaned fragment, lowercase, mid-description.
    This is the snippet Google shows for the privacy page.
  evidence:
    type: content
    detail: |
      Fetched https://myletterofintent.com/privacy and read the head:
        name="description" content="Everything you type stays on your device. No
        account, and nothing you write is ever captured — we count page visits and
        nothing else. of any kind. Here is exactly how that works, in plain words."
      Fetched https://myletterofintent.com/ and confirmed each claim string is
      present in the served HTML: "never shared" true, "It saves only on your
      device" true, "Private by design" true, "nothing you type ever leaves your
      device" true, "Everything stays on your device" true.
      Source: src/app/layout.tsx:38-41; src/app/privacy/page.tsx:9-12, 91, 239-244;
      src/components/chrome/PrivacyStrip.tsx:22-23.
  confidence: MEASURED
  who_is_affected: everyone who reads the site, and every attorney who vets it before referring families
  why_it_matters: |
    The site's credibility is its product. It is unusually careful elsewhere —
    lib/filenames.ts reasons about screen readers in open-plan offices — so a
    reader who catches one loose claim will reasonably doubt the careful ones too.
    The broken meta description is worse than it looks: it is the sentence a
    frightened parent reads in a search result before deciding whether this is a
    serious tool.
  standard_reference: FTC Act §5 (deceptive claims); GDPR Art. 5(1)(a) transparency
  recommendation: |
    1. Fix src/app/privacy/page.tsx:9-12 — delete the orphaned "of any kind."
       This is a one-word edit and should ship today, independent of everything else.
    2. Add the two missing words to src/app/layout.tsx:41: "Everything you type
       stays on your device."
    3. Change the card heading at privacy/page.tsx:91 from "Nothing is uploaded" to
       "Your letter is never uploaded". Same length, same reassurance, now true.
    4. Narrow privacy/page.tsx:239-244 from a claim about all scripts to a claim
       about the letter: keep "Nothing you type into any field is captured", and
       replace "no script on this page reads them" with a statement of the
       enforcement mechanism, which is stronger and checkable: "The browser itself
       is instructed to refuse to send anything from this page to anyone except the
       page counter — so even a script we did not write could not carry your words
       away." That is exactly what connect-src 'self' does, and it is a better
       promise because it does not depend on trusting an inventory of scripts.
    5. Leave PrivacyStrip.tsx alone.
  scope: current
  privacy_impact: none — copy only, and it narrows claims rather than widening them
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 2
  reach: 5
  harm_if_unfixed: 2
  environment: both

- id: A7-004
  title: Cloudflare injects a third-party analytics beacon into every page; it is in no codebase, on no disclosure, and is blocked only by accident
  category: third-party
  what_i_observed: |
    Every HTML response from production carries a script tag that does not exist
    anywhere in this repository. Cloudflare's edge adds it:

      <script type="module"
        src="https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496"
        integrity="sha512-ZE9pZaUXND66v380QUtch/5sE9tPFh2zg45pR2PB0CVkCtOREv2AJKkSidISWkysEuQ0EH8faUU5du78bx87UQ=="
        data-cf-beacon='{"version":"2024.11.0","token":"faa290b919f94379b17a9d697c7a4c83","r":1}'
        crossorigin="anonymous"></script>

    This is Cloudflare Web Analytics / Browser Insights RUM. Enabled in the
    Cloudflare dashboard, injected at the edge, invisible to `git`.

    It requests the beacon on all 11 phases of the shared capture (every route,
    plus typing, plus unload) — but there are ZERO responses recorded for any of
    those 11 requests. I confirmed why, live:

      securitypolicyviolation event, disposition "enforce":
        blockedURI: https://static.cloudflareinsights.com/beacon.min.js/v45132...
        violatedDirective: script-src-elem
      console: "Loading the script ... violates the following Content Security
        Policy directive: script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
        https://www.googletagmanager.com ... The action has been blocked."
      requestfailed reason: "csp"
      window.__cfBeacon: undefined  (never executed)

    So today Cloudflare receives NOTHING from this beacon. The site's own CSP —
    written to protect the letter — is what is stopping it.

    That is a good outcome reached by accident. The CSP does not list
    static.cloudflareinsights.com because nobody knew the tag was there. If anyone
    ever adds that host to script-src to "fix the console error", or if Cloudflare
    switches this feature to same-origin delivery under /cdn-cgi/ (which it does in
    some configurations, and which `connect-src 'self'` would then permit), the
    beacon starts working immediately with no code change and no review.

    Disclosure status: /privacy discloses Google Analytics in section 04 and says
    "Our host also keeps ordinary web server logs". It never mentions Cloudflare.
    SECURITY.md:81-82 states: "No other analytics — no Vercel Analytics, no
    heatmaps, no session recording, no advertising pixels." That statement is
    incomplete as written.
  evidence:
    type: network
    detail: |
      HTML fetch of https://myletterofintent.com/ — beacon tag quoted verbatim above,
      found at byte offset 99918 of the served document.
      Live Playwright probe against production, both / and /letter/about:
        [{"route":"/","v":[{"blockedURI":"https://static.cloudflareinsights.com/beacon.min.js/v4513226cdae34746b4dedf0b4dfa099e1781791509496",
          "violatedDirective":"script-src-elem","effectiveDirective":"script-src-elem","disposition":"enforce"}]},
         {"route":"/letter/about","v":[{ ...identical... }]}]
        cfBeaconScriptInDom: true, hasCfBeaconGlobal: false
      Shared capture: 11 requests to static.cloudflareinsights.com, 0 responses.
      Undisclosed: SECURITY.md:81-82; src/app/privacy/page.tsx section 04 (lines 220-261).
  confidence: MEASURED
  who_is_affected: every visitor; the owner, who is unaware this is being served under their domain
  why_it_matters: |
    The owner is currently unable to answer "what third parties does my site
    contact" from their own repository, because the answer is partly set in a
    Cloudflare dashboard. For a law firm publishing a privacy promise to families
    of disabled children, the gap between "what the code does" and "what is served"
    is the whole risk. Right now the gap is harmless. It is one dashboard click,
    or one well-meaning CSP edit, from not being.
  standard_reference: GDPR Art. 13(1)(e) recipients of personal data; OWASP ASVS v4 14.2 (dependency and third-party content inventory)
  recommendation: |
    1. Decide deliberately, then act. My recommendation is to turn Browser Insights
       / Web Analytics OFF in the Cloudflare dashboard (Analytics → Web Analytics,
       and Speed → Optimization → Browser Insights). The owner already has GA and
       has ruled it deliberate; a second, undisclosed analytics vendor buys nothing
       and costs a disclosure obligation.
    2. Do NOT resolve the console error by adding static.cloudflareinsights.com to
       script-src. That would silently switch on a third-party analytics collector.
       If the owner *does* want Cloudflare analytics, it must be a disclosed
       decision on /privacy alongside GA, with the same reasoning.
    3. Add a production smoke test that asserts the set of hosts contacted equals
       exactly {myletterofintent.com, www.googletagmanager.com,
       www.google-analytics.com} and fails on any new one. This is the control that
       would have caught the beacon on day one.
  scope: current
  privacy_impact: |
    Turning the beacon off REMOVES a potential data flow. Nothing new leaves the
    device. If instead the owner chooses to keep it, that choice would need this
    block filled in and the answer to "what data would leave the device" is:
    page URL, referrer, timing/Core-Web-Vitals metrics, user agent, and a
    Cloudflare-assigned visitor signal — sent to Cloudflare, Inc. That is a
    disclosure the site does not currently make.
  cost_and_maintenance: none — a dashboard toggle; removes a vendor rather than adding one
  effort: S
  risk_of_change: none — the beacon has never executed, so turning it off changes nothing observable
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 3
  environment: production

- id: A7-005
  title: Cloudflare Email Obfuscation rewrites the HTML and runs its own JavaScript same-origin on every page, including the wizard pages holding the letter
  category: third-party
  what_i_observed: |
    Cloudflare's Email Obfuscation feature is on. It rewrites the served HTML
    before it reaches the browser. Two changes, both present in production:

    (a) The firm's mailto: link is replaced with an obfuscated redirect. From the
        served homepage, immediately after the footer disclaimer:
          <a href="/cdn-cgi/l/email-protection#5b64282e39313e382f661a7e696b3d293e3e7e...">
    (b) A decoder script is injected, immediately after the footer:
          <script data-cfasync="false"
                  src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>

    Unlike the RUM beacon in A7-004, this one is served from the site's OWN origin
    path (/cdn-cgi/...). It therefore satisfies `script-src 'self'` and it
    EXECUTES. It returned HTTP 200 in the shared capture and appears in
    performance.getEntriesByType("resource") on live page loads.

    It is requested on all 11 captured phases — including /letter/about,
    /letter/medical and /letter/review, i.e. the pages where the letter is in
    localStorage and photographs are in IndexedDB. Being same-origin, that script
    has full read access to both.

    I want to be precise about severity: Cloudflare's email-decode script does not
    read localStorage. It walks the DOM for .__cf_email__ spans and rewrites them.
    It is not malicious and this is not an incident. The finding is structural —
    a third party is executing arbitrary JavaScript inside the site's own security
    origin, on the pages that hold the most sensitive data, and the site's privacy
    page states that "no script on this page reads them" (privacy/page.tsx:243).

    Secondary, non-privacy observation while I was here: after React hydrates,
    the CF-rewritten link is replaced by React's own mailto:, so the obfuscation
    is undone on the client anyway. On /letter/about post-hydration I measured
    emailProtectionLinks: [] and cfEmailSpans: 0. The feature is therefore doing
    very little except adding a script and a hydration-mismatch risk. Users with
    JavaScript disabled get the /cdn-cgi/l/email-protection URL instead of a
    working mailto:.
  evidence:
    type: network
    detail: |
      Served HTML from https://myletterofintent.com/, quoted verbatim at offset 53053:
        "...nothing you type ever leaves your device.</p></div></div></footer>
         <script data-cfasync="false" src="/cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js"></script>"
      Shared capture: 11 requests to /cdn-cgi/scripts/5c5dd728/cloudflare-static/email-decode.min.js
      (phases /, /letter, /letter/getting-started, /letter/about, /letter/medical,
      /letter/review, /privacy, /your-data, /samples/..., typing, unload) and a
      recorded "RES 200" for it.
      Live probe: performance resource entry present for the same URL.
      Contradicted copy: src/app/privacy/page.tsx:243 "no script on this page reads
      them, sends them, or records your screen".
  confidence: MEASURED
  who_is_affected: every visitor on every page, including all wizard pages
  why_it_matters: |
    This is the concrete, already-happening version of the abstract risk in A7-006.
    "The letter never leaves the device" is enforced by code that the owner writes
    and by a CSP that the owner sets — but the HTML those protections live in is
    being edited in transit by a third party, and that third party can add
    same-origin executing script at will. Today it adds an email decoder. The
    mechanism is not limited to email decoders.
  standard_reference: OWASP ASVS v4 14.2.3 (third-party content integrity); GDPR Art. 32 (integrity of processing)
  recommendation: |
    Turn Email Obfuscation OFF in Cloudflare (Scrape Shield → Email Obfuscation).
    Justification, in order:
      - It is the only third-party script currently EXECUTING inside this origin.
      - React undoes its only user-visible effect during hydration anyway, so the
        anti-scraping benefit is close to zero on this site.
      - It degrades the contact link for no-JS users on a site whose audience
        includes people on old devices and locked-down library machines.
      - It removes a live contradiction of the privacy page's own wording.
    If the firm wants the anti-scraping benefit, get it in application code instead:
    render the address from parts, or route contact through the firm's existing
    contact page (already linked at privacy/page.tsx:328-334).
  scope: current
  privacy_impact: |
    Turning it off REMOVES third-party code execution from the origin. Nothing
    new leaves the device. The email address becomes plainly visible in the HTML
    again, which is a spam-harvesting tradeoff, not a family-privacy one — the
    address is the law firm's own published business address.
  cost_and_maintenance: none — a dashboard toggle
  effort: S
  risk_of_change: low — the contact link reverts to a plain mailto:, which is what React already renders post-hydration
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 3
  environment: production

- id: A7-006
  title: Cloudflare terminates TLS, rewrites HTML, and runs the DNS — and appears nowhere in the threat model or the privacy disclosure
  category: supply-chain
  what_i_observed: |
    The brief asked me to address honestly that whoever serves the JavaScript can
    change it. Here is the actual chain for this site, measured:

      DNS authority:   kinsley.ns.cloudflare.com, steven.ns.cloudflare.com
      Public IPs:      104.21.50.242, 172.67.215.2  (Cloudflare anycast)
      TLS termination: Cloudflare  (server: cloudflare; CF-RAY on every response)
      Origin:          Vercel      (x-vercel-id: iad1::..., x-vercel-cache: HIT)
      Edge rewriting:  demonstrated — see A7-004 and A7-005
      Error reporting: Cloudflare NEL is configured on every response —
                       Nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
                       report-to endpoint: https://a.nel.cloudflare.com/report/v4?s=...
                       (success_fraction 0.0, so only failures report; it would carry
                       the request URL, not letter content)

    So three organisations can each observe or alter what a family's browser
    executes: Cloudflare (DNS, cert, TLS termination, HTML rewriting — the most
    capable), Vercel (origin), and the domain registrar. Cloudflare has already
    demonstrated the capability twice, benignly.

    DNSSEC: a DNSKEY query for myletterofintent.com returned no DNSKEY records
    (SOA only in the authority section), which indicates DNSSEC is not enabled.
    CAA: I could not query CAA records — the PowerShell resolver on this machine
    does not support the CAA type. NOT VERIFIED.
    HSTS: max-age=63072000; includeSubDomains; preload is served, and http:// is
    308-redirected to https://. Whether the domain is actually ON the browser
    preload list I could not check (hstspreload.org not reachable from this
    session). NOT VERIFIED.

    SECURITY.md has a section headed "What Vercel and GitHub see" (line 89) and
    reasons carefully about both. Cloudflare — the party with the most capability
    in this chain — is not mentioned anywhere in the file.

    SECURITY.md:170 states: "No external scripts are loaded, so SRI is moot."
    That is false in production. Two external scripts are requested:
    googletagmanager.com/gtag/js (loads and executes, no integrity attribute) and
    the Cloudflare beacon (which does carry an SRI hash, added by Cloudflare, not
    by this project). SRI is not moot; it is simply not achievable for gtag.js,
    which is a versioned, dynamically-generated file — Google does not publish a
    stable hash for it. That is a real and unavoidable residual risk and it should
    be stated as such rather than dismissed.
  evidence:
    type: network
    detail: |
      Resolve-DnsName myletterofintent.com -Type A  -> 104.21.50.242, 172.67.215.2
      Resolve-DnsName myletterofintent.com -Type NS -> kinsley.ns.cloudflare.com,
                                                       steven.ns.cloudflare.com
      Resolve-DnsName myletterofintent.com -Type DNSKEY -> no DNSKEY records returned
      Raw response headers from https://myletterofintent.com/ :
        server: cloudflare
        CF-RAY: a289a0905bd82063-IAD
        x-vercel-cache: HIT / x-vercel-id: iad1::nphn5-1786308564551-8a280c3071a1
        strict-transport-security: max-age=63072000; includeSubDomains; preload
        Nel: {"report_to":"cf-nel","success_fraction":0.0,"max_age":604800}
        Report-To: {"group":"cf-nel","max_age":604800,"endpoints":[{"url":"https://a.nel.cloudflare.com/report/v4?s=..."}]}
      http://myletterofintent.com/ -> HTTP 308
      Source claims contradicted: SECURITY.md:89 (section scope), SECURITY.md:170 (SRI).
  confidence: MEASURED
  who_is_affected: every user; this is the residual risk that client-side-only architecture cannot remove
  why_it_matters: |
    This is the honest limit of the promise, and the site should own it rather
    than leave it unstated. "Everything you type stays on your device" is true of
    the code as written and as served today — and I verified both. It is a promise
    about behaviour, not a mathematical guarantee, because the code is delivered
    fresh on every visit by parties who could deliver different code. No amount of
    client-side engineering changes that. A family cannot verify tomorrow's build.

    Saying so plainly costs the site nothing and is the difference between a
    privacy claim and a privacy argument. The audience includes attorneys who will
    respect the distinction.
  standard_reference: OWASP ASVS v4 14.2 (dependency/integrity), 1.14 (trust boundaries); NIST SP 800-161 (supply chain)
  recommendation: |
    Documentation and configuration, not architecture. In priority order:

    1. Correct SECURITY.md:170. Replace "No external scripts are loaded, so SRI is
       moot" with the true position: one external script (gtag.js) executes with
       full DOM access and cannot carry an SRI hash because Google does not publish
       a stable one. State the compensating control, which is real: connect-src
       pins where anything can be sent, so even a hostile gtag.js could not post the
       letter anywhere.
    2. Add a "What Cloudflare sees and can do" section to SECURITY.md alongside the
       existing Vercel and GitHub sections. It should say: Cloudflare terminates
       TLS, therefore sees every request in plaintext at the edge; Cloudflare can
       and does rewrite the served HTML (cite A7-004 and A7-005 as the evidence);
       Cloudflare is the DNS authority. This is the section that makes the rest of
       the document credible.
    3. Add one honest paragraph to /privacy. Suggested: "This tool is delivered to
       you over the internet by our host and our network provider. They cannot see
       what you write — it never reaches them. They do deliver the program that runs
       in your browser, so, as with every website, you are trusting that what
       arrives is what we wrote. We keep the list of who is involved short on
       purpose, and it is on this page."
    4. Enable DNSSEC in the Cloudflare dashboard. One click, no ongoing cost, and it
       closes DNS-level redirection of the domain.
    5. Add a CAA record restricting issuance to the CAs actually in use, once the
       current CAA state is checked.
    6. Confirm the domain is on the HSTS preload list at hstspreload.org, and submit
       it if not — the header already declares preload, so the intent is there.
  scope: current
  privacy_impact: |
    None of the above causes user data to leave the device. Items 1-3 are documentation;
    items 4-6 are DNS/TLS hardening that carries no user data.
  cost_and_maintenance: |
    DNSSEC and CAA are free and effectively zero-maintenance on Cloudflare. The
    documentation must be revisited whenever hosting changes — which is the point.
  effort: M
  risk_of_change: |
    Low. DNSSEC misconfiguration can take a domain offline, so enable it through
    Cloudflare's own one-click flow (which manages the DS record) rather than by hand.
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 2
  environment: production

- id: A7-007
  title: "Delete all my data" leaves three traces behind and then tells the family the device holds nothing
  category: privacy
  what_i_observed: |
    I ran the real flow on production: seeded a letter and a photograph, opened
    /your-data, clicked "Delete all my data…", then "Yes, delete it all", and
    measured storage before and after.

    WHAT IS CORRECTLY DELETED — the letter content is genuinely gone:
      localStorage twl-loi-letter-v1 : 286 chars  ->  key absent
      photos in IndexedDB store      : 1          ->  0

    WHAT SURVIVES:
      1. The IndexedDB DATABASE itself. indexedDB.databases() still returns
         [{"name":"twl-loi-photos"}] after deletion. src/lib/photos.ts:131-137
         calls store.clear(), never indexedDB.deleteDatabase(). The database is
         empty but present, and its name announces what the tool was for.
      2. The localStorage key comes back. After one reload the key
         twl-loi-letter-v1 exists again at 43 chars — zustand's persist middleware
         rewriting the empty state {"state":{"data":{},"meta":{}},"version":1}.
         Harmless in content; still a residue that names the tool.
      3. Both Google Analytics cookies survive untouched:
           _ga            = GA1.1.2004512096.1786308265
           _ga_90YXKXB5TC = GS2.1.s1786308264$o1$g1$t1786308265$j59$l0$h0
           expires 2027-09-13 (~13 months), secure=false, httpOnly=false, SameSite=Lax
         So the browser stays identifiable to Google as a returning visitor to this
         specific site for over a year after the family pressed delete.

    THE MESSAGE SHOWN, captured verbatim from the live aria-live region:
      "Deleted. We checked: this device now holds nothing from this tool."

    The check behind that sentence is src/components/data/DataControls.tsx:124 —
      const letterGone = localStorage.getItem(LETTER_STORAGE_KEY) === null;
    It verifies one key. It does not look at IndexedDB or at cookies, and it says
    "We checked" — which invites more trust than the check earns.
  evidence:
    type: measurement
    detail: |
      Live production session, my own, output verbatim:
        === BEFORE DELETE ===
          localStorage: {"twl-loi-letter-v1": 286}
          indexedDB: ["twl-loi-photos"]   photosInStore: 1
          cookie: "_ga=GA1.1.2004512096.1786308265; _ga_90YXKXB5TC=GS2.1.s1786308264$o1$g1$t1786308265$j59$l0$h0"
        === NOTICE SHOWN TO USER ===
          polite: Deleted. We checked: this device now holds nothing from this tool.
        === AFTER DELETE (no reload) ===
          localStorage: {}          indexedDB: ["twl-loi-photos"]   photosInStore: 0
          cookies: _ga ... secure=false httpOnly=false expires=2027-09-13T20:44:25.345Z
                   _ga_90YXKXB5TC ... secure=false httpOnly=false expires=2027-09-13T20:44:25.345Z
        === AFTER DELETE + RELOAD ===
          localStorage: {"twl-loi-letter-v1": 43}   indexedDB: ["twl-loi-photos"]   photosInStore: 0
      (First run of this test re-seeded on reload via my own init script; I
      corrected the harness to seed once and re-ran. The numbers above are the
      corrected run.)
      Code: src/lib/photos.ts:131-137; src/components/data/DataControls.tsx:119-136.
  confidence: MEASURED
  who_is_affected: |
    Anyone on a shared or family device — which is the exact scenario the site's
    own privacy page tells them to use this button for.
  why_it_matters: |
    src/app/privacy/page.tsx:187-198 says: "On a shared computer — At a library or
    on a family machine, use Delete all my data when you finish". A parent follows
    that instruction, is told the device holds nothing, and walks away. The next
    person at that library machine cannot read the letter — that part works. But
    the browser still shows a database named "twl-loi-photos" and a storage key
    named "twl-loi-letter-v1" on myletterofintent.com, and Google still holds a
    13-month identifier for that browser's visit to a special-needs planning tool.

    What leaks is not the content but the FACT of use, and for a family who has not
    told relatives about a diagnosis, on a shared machine, that fact is the
    disclosure they were trying to avoid. The gap between the button's promise and
    its behaviour is small in bytes and large in meaning.
  standard_reference: GDPR Art. 17 (erasure); NIST Privacy Framework CT.DM-P4 (data deleted per policy); WCAG 2.2 SC 3.3.1 is not implicated — this is accuracy, not accessibility
  recommendation: |
    Make the button do what the sentence says. All four are small and local.

    1. src/lib/photos.ts — after clearing the store, delete the database:
       add a deleteDatabase() helper that awaits indexedDB.deleteDatabase(DB_NAME),
       and call it from deleteAllPhotos() (or from handleDelete after it).
       Be aware deleteDatabase blocks while a connection is open; the module already
       closes the db on transaction complete (photos.ts:82), so this is safe, but
       handle the onblocked path rather than hanging.
    2. src/components/data/DataControls.tsx:120-122 — after clearStorage(), also
       localStorage.removeItem(LETTER_STORAGE_KEY) once more on the next tick, so
       the persist middleware's rewrite does not leave a key behind.
    3. Expire the GA cookies in the same handler. They are not httpOnly, so this is
       three lines of document.cookie writes for _ga and _ga_<MEASUREMENT_ID> on
       domain .myletterofintent.com, path /. This does NOT remove Google Analytics
       from the site — it means "delete my data" also clears the identifier this
       site caused to be set, which is the plain reading of the button.
    4. Widen the verification behind "We checked" to cover all three, and make the
       message name what was removed. Honest replacement:
         "Deleted. The letter, any photographs, and this site's cookies are gone
          from this browser. If you are on a shared computer, clearing this site's
          data in your browser settings is the belt-and-braces version."
       If any check fails, keep the existing danger-toned fallback.
  scope: current
  privacy_impact: |
    Reduces what remains on the device. Nothing new leaves it. Clearing the _ga
    cookie means Google can no longer link this browser's future visits to the
    previous ones; that is a reduction in data sharing, not an increase.
  cost_and_maintenance: negligible — a few lines in two existing files
  effort: S
  risk_of_change: |
    Low. The one thing to test is that deleteDatabase does not hang when a
    connection is open, and that the success path still reports success.
  mission_impact: 2
  reach: 3
  harm_if_unfixed: 4
  environment: both

- id: A7-008
  title: Both Google Analytics cookies are set without the Secure flag
  category: security
  what_i_observed: |
    Observed in the shared capture and reconfirmed in my own live sessions:
      _ga            secure=false  httpOnly=false  SameSite=Lax  domain=.myletterofintent.com  expires ~13 months
      _ga_90YXKXB5TC secure=false  httpOnly=false  SameSite=Lax  domain=.myletterofintent.com  expires ~13 months

    These are set by gtag.js, not by site code. src/app/layout.tsx:118-123 calls
    gtag('config', GA_MEASUREMENT_ID) with no options object, so GA's defaults apply.

    Practical exploitability here is genuinely low: the site sends
    Strict-Transport-Security: max-age=63072000; includeSubDomains; preload, and
    http:// is 308-redirected. A browser that has ever seen the HSTS header, or
    that has the domain in its preload list, will never send these cookies in
    plaintext. The residual window is a first-ever visit on a device where the
    preload list has not taken effect.

    httpOnly=false is not a defect — GA's own JavaScript must read these.
  evidence:
    type: network
    detail: |
      From audit/evidence/network/capture-production.json cookies array, verbatim:
        {"name":"_ga","value":"GA1.1.242789107.1786307073","domain":".myletterofintent.com",
         "path":"/","expires":1820867112.867853,"httpOnly":false,"secure":false,"sameSite":"Lax"}
        {"name":"_ga_90YXKXB5TC","value":"GS2.1.s1786307072$o1$g1$t1786307112$j20$l0$h0",
         "domain":".myletterofintent.com","path":"/","expires":1820867112.867652,
         "httpOnly":false,"secure":false,"sameSite":"Lax"}
      Reconfirmed live: expires=2027-09-13T20:44:25.345Z, secure=false, httpOnly=false.
      Code: src/app/layout.tsx:118-123.
  confidence: MEASURED
  who_is_affected: all visitors, marginally
  why_it_matters: |
    Low real-world risk given HSTS with preload. Worth fixing because it is a
    one-line change, because it removes an item a reviewing attorney or a
    security questionnaire will flag, and because cookie flags are exactly the
    kind of detail this project gets right everywhere else.
  standard_reference: OWASP ASVS v4 3.4.1 (Secure attribute on cookies); RFC 6265bis §4.1.2.5
  recommendation: |
    src/app/layout.tsx:122 — pass cookie flags in the config call:
      gtag('config', '${GA_MEASUREMENT_ID}', { cookie_flags: 'SameSite=Lax;Secure' });
    Also consider shortening cookie_expires from the 2-year default; GA accepts
    e.g. { cookie_expires: 60 * 60 * 24 * 90 } for 90 days. A shorter identifier
    lifetime on a site about a disabled child is a proportionate default, and it
    does not affect the page-view counting the owner wants.
  scope: current
  privacy_impact: reduces cookie lifetime and transmission surface; nothing new leaves the device
  cost_and_maintenance: none
  effort: S
  risk_of_change: very low — GA continues to function identically
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 1
  environment: production

- id: A7-009
  title: Generated PDFs embed the child's name in /Title and the parent's name in /Author, contradicting the project's own deliberate filename policy
  category: privacy
  what_i_observed: |
    I extracted and decoded the Info dictionary from all six PDFs in
    audit/evidence/pdfs/. Every Letter of Intent carries:

      /Title    = "Letter of Intent — <subject's full name>"        (UTF-16BE)
      /Author   = "<the parent's full name>"
      /Producer = "Trusts & Wealth, PLLC"
      /Creator  = "Letter of Intent Builder — Trusts & Wealth, PLLC"
      /CreationDate = e.g. D:20260809202819Z   (UTC, to the second)

    And every Emergency Information Sheet carries:
      /Title    = "Emergency information — <subject's full name>"

    Source: src/lib/pdf/loi-document.tsx:249-253 and
    src/lib/pdf/emergency-document.tsx:158-161.

    Set against src/lib/filenames.ts:9-18, which reasons at length about exactly
    this and reaches the opposite conclusion:
      "2. The name never says *who* it is about. Downloads land in shared folders,
       get synced to cloud drives, and are read out by screen readers in open-plan
       offices; a filename carrying 'Letter-of-Intent-Alex' discloses a disability
       to anyone who glances at the screen. The person's name is inside the
       document, where the family chose to put it."

    The filename policy is implemented correctly — I downloaded a real PDF from
    production and got "Letter-of-Intent-Disabilities-2026-08-09.pdf", no name.
    But /Title is what PDF viewers display in the window title bar and browser tab
    — Acrobat, Preview and Chrome's built-in viewer all prefer /Title over the
    filename. So the name the filename was engineered to hide is displayed in the
    title bar anyway. It is also indexed by Windows Search and Spotlight, making
    the name searchable across a shared machine.

    Clean results worth recording: no /Encrypt, no /JavaScript, no /EmbeddedFile,
    no /Launch, no /OpenAction, no XMP packet, and no filesystem paths or
    usernames anywhere in any of the six files. Nothing unintended leaked from the
    generating machine. Also of note (accessibility, adjacent to my scope): no
    /MarkInfo, /StructTreeRoot or /Lang in the catalog — the PDFs are untagged.
  evidence:
    type: measurement
    detail: |
      Decoded Info dictionaries, verbatim:
        maximal--Letter-of-Intent-Disabilities-2026-08-09.pdf
          /Title  = "Letter of Intent — Maximal Subject With A Notably Long Legal Name"
          /Author = "Maximal Author With A Notably Long Legal Name"
          /Producer = "Trusts & Wealth, PLLC"   /CreationDate = "D:20260809202819Z"
        maximal--Emergency-Information-Sheet-2026-08-09.pdf
          /Title  = "Emergency information — Maximal Subject With A Notably Long Legal Name"
        typical--Letter-of-Intent-Disabilities-2026-08-09.pdf
          /Title  = "Letter of Intent — Typical answer for subjectFullName. ..."
          /Author = "Typical answer for authorName. ..."
      Catalog on all six: << /Type /Catalog /Pages 1 0 R /Names 2 0 R /ViewerPreferences 5 0 R >>
        — no /MarkInfo, /StructTreeRoot or /Lang.
      Code: src/lib/pdf/loi-document.tsx:249-253; src/lib/pdf/emergency-document.tsx:158-161.
      Contradicted policy: src/lib/filenames.ts:9-18.
  confidence: MEASURED
  who_is_affected: every family who downloads a document, and everyone who later receives one
  why_it_matters: |
    I want to be balanced here, because the obvious recommendation is not
    obviously right. Putting the name in /Title has real benefits: a trustee or
    attorney with a dozen of these open can tell them apart, and a screen reader
    announces the document title on open, which genuinely helps.

    The problem is the inconsistency, not the metadata as such. The project made a
    considered decision that the name should not be visible on the outside of the
    file, wrote that reasoning down, implemented it in the filename — and then the
    same fact escapes through a channel that is displayed more prominently than
    the filename in most viewers. Whichever policy is right, the two should agree,
    and right now a reader of filenames.ts would be misled about the product's
    actual behaviour.

    /Author is the weaker case for keeping. A document designed to be handed to
    hospitals, schools and caregivers does not need the parent's legal name in a
    machine-readable field that survives forwarding.
  standard_reference: NIST Privacy Framework CT.DM-P1 (data minimisation); ISO 32000-1 §14.3 (document information dictionary)
  recommendation: |
    Pick one policy and make both channels obey it. My recommendation:

    1. Use the PREFERRED name, not the full legal name, in /Title:
         title={`Letter of Intent — ${preferred ?? "for a loved one"}`}
       This keeps the document distinguishable for a trustee and keeps the screen
       reader benefit, while not putting a full legal name in a field that is
       indexed by desktop search. The emergency sheet at
       emergency-document.tsx:159 already prefers info.fullName ?? info.preferred —
       reverse that precedence.
    2. Drop /Author entirely, or set it to the fixed string already used as the
       fallback at loi-document.tsx:251 ("Prepared with the Letter of Intent
       Builder"). The parent's name is inside the letter, where they chose to put it.
    3. Round /CreationDate to the day rather than the second. The date is useful
       for versioning; the second is a fingerprint that helps nobody.
    4. Add a line to filenames.ts's comment, or a short shared note, recording that
       the policy governs metadata as well as filenames — so the next person
       touching either file finds the reasoning.

    Honest note on priority: this is a real inconsistency and worth fixing, but it
    is NOT what stops a parent finishing the document at 11pm, and nothing here
    causes data to leave the device. It should queue behind A7-002 and A7-007.
  scope: current
  privacy_impact: |
    Reduces personal data embedded in a file designed to be shared. No data leaves
    the device as a result of this change; the change makes the file the family
    chooses to share carry less than it does today.
  cost_and_maintenance: none
  effort: S
  risk_of_change: |
    Low, but not zero: any test asserting on PDF title strings will need updating,
    and a trustee who has already filed documents by title would see a format change.
  mission_impact: 1
  reach: 4
  harm_if_unfixed: 3
  environment: both

- id: A7-010
  title: SECURITY.md justifies keeping 'unsafe-inline' on the premise that the site is a static export — it is not, and the fix it calls out as costly is available today
  category: documentation-accuracy
  what_i_observed: |
    SECURITY.md:219-227 states:
      "script-src still allows 'unsafe-inline'. Next.js injects inline bootstrap
       and hydration scripts, and this site is statically exported, so there is no
       server to mint a per-request nonce."
      "Recommendation. If this is worth closing, the route is Next.js middleware
       issuing a per-request nonce, which requires moving off pure static export to
       a runtime that executes middleware. That is a real trade-off in hosting cost..."

    The site is not statically exported. Evidence, all from production:
      - x-nextjs-prerender: 1, x-nextjs-stale-time: 300 on HTML responses
      - x-nextjs-postponed: 2 on RSC responses (Partial Prerendering resume — this
        cannot happen without a runtime)
      - x-matched-path: /letter/medical.rsc  and  /privacy.segments/_tree.segment.rsc
      - x-vercel-cache: HIT / PRERENDER
      - content-type: text/x-component on _rsc fetches
    And decisively: next.config.ts:90-93 uses `async headers()`, which Next ignores
    entirely under output: "export" — yet the CSP and all other security headers
    ARE being served. next.config.ts contains no `output` key at all.

    So the stated blocker does not exist. The site already runs on a Vercel Next.js
    runtime that executes middleware; there is no middleware.ts in the repo today,
    but adding one requires no hosting change and no new cost tier.

    I am not saying the nonce work should therefore be done — see the
    recommendation, where I argue the opposite. I am saying the decision is
    currently being made on a false premise, and the owner deserves to make it on a
    true one.
  evidence:
    type: network
    detail: |
      curl-equivalent of https://myletterofintent.com/letter/medical with RSC: 1 —
        status 200
        content-type = text/x-component
        x-nextjs-prerender = 1
        x-matched-path = /letter/medical.rsc
        x-vercel-cache = PRERENDER
      https://myletterofintent.com/privacy?_rsc=... response headers included:
        x-nextjs-postponed: 2
        x-matched-path: /privacy.segments/_tree.segment.rsc
      next.config.ts:88-94 — no `output` key; `async headers()` present and effective.
      Repo search for middleware.ts / middleware.js under the project: none (only
      node_modules matches).
      Contradicted text: SECURITY.md:219-227.
  confidence: MEASURED
  who_is_affected: the owner and any reviewer relying on SECURITY.md
  why_it_matters: |
    SECURITY.md is an unusually good document and is clearly meant to be handed to
    people who ask hard questions. A factual error in the one section headed "Known
    weakness, stated plainly" undermines exactly the part that was written to build
    trust. It also means the cost/benefit of the CSP hardening has never actually
    been weighed, because the cost was assumed to be a hosting migration.
  standard_reference: OWASP ASVS v4 1.1.2 (documented and reviewed security architecture)
  recommendation: |
    1. Correct SECURITY.md:219-227. The accurate statement is: the site runs on
       Vercel's Next.js runtime with Partial Prerendering, so middleware IS
       available and a nonce IS technically achievable; the reason for keeping
       'unsafe-inline' is a deliberate trade-off, not an architectural block.
    2. State the real trade-off, which is caching, not hosting: a per-request nonce
       must vary per request, so the HTML can no longer be served from the CDN cache
       as a static hit (x-vercel-cache: HIT today). On a site whose audience
       includes people on slow connections and old phones, giving up edge-cached
       HTML to close a gap with no known sink is a bad trade.
    3. Record why the gap is low-risk here, because it genuinely is and the
       reasoning is worth keeping: I searched the entire src/ tree for
       dangerouslySetInnerHTML, innerHTML, outerHTML, insertAdjacentHTML,
       document.write, eval and new Function — zero matches. There is no
       user-controlled HTML sink anywhere. 'unsafe-inline' is a latent risk with no
       current path to exploit it.
    4. Take the cheap half of the win instead — see A7-011, script-src-attr 'none'.
  scope: current
  privacy_impact: none — documentation and header configuration only
  cost_and_maintenance: none for the documentation fix
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 2
  environment: both

- id: A7-011
  title: CSP is strong but can be tightened without touching 'unsafe-inline', and CSP violations are reported nowhere
  category: security
  what_i_observed: |
    Production serves this CSP on HTML (verbatim from the response headers):

      default-src 'self'; script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'
      https://www.googletagmanager.com https://www.google-analytics.com
      https://*.google-analytics.com https://*.analytics.google.com;
      style-src 'self' 'unsafe-inline'; img-src 'self' data: blob: <ga hosts>;
      media-src 'self' blob:; font-src 'self' data:; connect-src 'self' <ga hosts>;
      worker-src 'self' blob:; object-src 'none'; base-uri 'self';
      form-action 'self'; frame-ancestors 'none'

    Assessment, honestly: this is a well-built CSP and connect-src 'self' plus the
    GA hosts is the single control that makes the whole privacy promise
    enforceable rather than aspirational. It already stopped an undisclosed
    third-party analytics beacon (A7-004) without anyone knowing.

    Four gaps:

    1. No script-src-attr. Because script-src includes 'unsafe-inline', inline
       event-handler attributes (onclick=, onerror=) are currently permitted.
       That is the half of 'unsafe-inline' that matters most for injected markup,
       and it can be removed at zero cost — React attaches listeners with
       addEventListener and uses no inline handlers.
    2. No frame-src. It falls back to default-src 'self', so same-origin iframes
       are allowed. The site uses no iframes at all.
    3. base-uri is 'self' where it could be 'none' — no <base> tag is used, and
       'none' removes base-tag hijacking of every relative URL on the page.
    4. NO REPORTING. There is no report-uri or report-to on the CSP. The direct
       consequence is measurable: the Cloudflare beacon has been violating this CSP
       on every single page load, on every route, and nobody found out until I ran
       a browser and read the console. A CSP that blocks silently is a CSP whose
       failures you learn about from an auditor.

    I also observed four DIFFERENT CSP variants across response types (HTML/RSC
    with GA hosts; static chunks without; the .mp4 without; and Next's image
    optimiser serving "script-src 'none'; frame-src 'none'; sandbox;"). That is
    normal Next/Vercel behaviour, not a defect — noting it so it is not mistaken
    for one.
  evidence:
    type: network
    detail: |
      CSP quoted verbatim above from https://myletterofintent.com/ response headers,
      matching next.config.ts:31-52.
      Silent-failure proof: 11 requests to static.cloudflareinsights.com in the
      shared capture with 0 responses, and a live securitypolicyviolation event with
      disposition "enforce" — none of which produced any signal to the owner.
      XSS sink search across src/: dangerouslySetInnerHTML|innerHTML|eval\(|new
      Function|document\.write|outerHTML|insertAdjacentHTML -> "No matches found".
  confidence: MEASURED
  who_is_affected: all users (defence in depth); the owner (blind to violations)
  why_it_matters: |
    The CSP is the mechanism that makes "your words cannot be sent anywhere" a
    property of the browser rather than a promise about code. It is worth
    maintaining deliberately. And the reporting gap is the reason a whole
    third-party script has been silently blocked on every page load for an unknown
    length of time — that could equally have been a legitimate resource failing.
  standard_reference: OWASP ASVS v4 14.4.3 (CSP), 14.5; CSP Level 3 §6.1 (script-src-attr), §7 (reporting)
  recommendation: |
    EXACT RECOMMENDED CSP for this site — replace the array at next.config.ts:34-51
    with these directives (changes marked):

      default-src 'self';
      base-uri 'none';                                                    # was 'self'
      object-src 'none';
      frame-ancestors 'none';
      frame-src 'none';                                                   # NEW
      form-action 'self';
      script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com;
      script-src-attr 'none';                                             # NEW - highest value
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: blob: https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com;
      media-src 'self' blob:;
      font-src 'self' data:;
      connect-src 'self' https://www.googletagmanager.com https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com;
      worker-src 'self' blob:;
      manifest-src 'self';                                                # NEW
      upgrade-insecure-requests                                           # NEW

    Notes on what I deliberately did NOT change:
      - 'unsafe-inline' in script-src STAYS. See A7-010: the nonce alternative costs
        edge-cached HTML, and there is no HTML sink in this codebase to exploit.
        script-src-attr 'none' takes most of the remaining risk off the table for free.
      - 'unsafe-inline' in style-src STAYS. This codebase uses React inline style
        props heavily (e.g. privacy/page.tsx:58-61, 66-70); removing it would break
        the layout.
      - font-src keeps `data:`. Fonts are same-origin (next/font woff2 under
        /_next/static/immutable/media/, plus public/fonts/*.ttf for the PDFs), so
        `'self'` alone may well be sufficient — but I did not verify that no font is
        inlined as a data: URL by Tailwind or @react-pdf. Test before tightening.
      - static.cloudflareinsights.com is NOT added. See A7-004.

    On reporting — this is the one item that needs the privacy block:
      Ship the tightened CSP first in Content-Security-Policy-Report-Only alongside
      the enforcing one, for one release, to confirm nothing legitimate breaks.
      For ongoing visibility, the client-side option needs no third party at all:
      add a small listener for the securitypolicyviolation event that surfaces
      blocked URIs in the console during development only. That gives the owner the
      signal without any egress.
  scope: current
  privacy_impact: |
    The header changes themselves cause NO data to leave the device — they only
    restrict what the browser may do.

    If the owner instead chooses a hosted CSP reporting endpoint (report-to), that
    WOULD create egress and needs this block:
      What data would leave the device: the URL of the page being viewed (which for
        wizard routes reveals which section was open, e.g. /letter/medical), the
        blocked resource URI, the violated directive, and the user agent. Never any
        typed content — CSP reports do not carry page content.
      To where, and who could access it: whichever reporting service is chosen, plus
        its subprocessors. If self-hosted, it would require a server, which this
        architecture deliberately does not have.
      Whether it is opt-in, default-off, revocable: CSP reporting cannot be made
        opt-in per user — it is a header, sent to every browser. That alone is a
        strong argument against it here.
      What the core promise would have to be reworded to: no change to "everything
        you type stays on your device" (still true), but /privacy would need to
        disclose a new recipient receiving page URLs.
      What breach or subpoena exposure this creates: a third-party log of which
        pages of a disability planning tool were viewed, tied to IP address. Small,
        but non-zero, and it is exactly the category this site avoids elsewhere.
      Client-side alternative considered, and why it is insufficient: the
        securitypolicyviolation listener above catches violations only on machines
        the owner controls, so it will not surface a violation that only occurs in
        one user's browser. That is a real limitation — and given the data involved,
        I judge it the right trade. RECOMMEND AGAINST the hosted endpoint.
  cost_and_maintenance: |
    Header changes: none. The report-only rollout costs one release cycle of
    attention. The hosted reporting endpoint, if chosen against my advice, costs a
    vendor relationship and a DPA.
  effort: M
  risk_of_change: |
    Moderate — a CSP change can break a page in a way that is invisible until a
    user hits it. This is precisely why the report-only rollout is part of the
    recommendation rather than optional. frame-src 'none' and script-src-attr
    'none' are the two I am most confident are safe here.
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 2
  environment: production

- id: A7-012
  title: The egress test exempts every analytics host and asserts nothing about which analytics events fire — this is why A7-002 went unnoticed
  category: test-coverage
  what_i_observed: |
    e2e/privacy-network.spec.ts is a genuinely good test and it is the project's
    main defence for the core promise. It records every request across a full
    journey — typing, photo upload, backup restore, PDF generation, .ics download —
    and asserts two things: that no request carried letter content, and that no
    request went anywhere unexpected.

    But at line 57 it does this:

      if (ANALYTICS_HOST.test(u.hostname)) return;

    Any request to google-analytics.com, analytics.google.com or googletagmanager.com
    is returned from before it reaches the `external` array. The only check that
    still applies to analytics traffic is the LETTER_SECRETS value scan at lines
    22-30 and 47-48.

    So the test proves that analytics never carries letter VALUES — which is the
    most important property, and it holds. What it cannot notice is a change in
    which EVENTS analytics sends. When GA4 Enhanced Measurement began firing
    form_start with field names and section identity, this suite stayed green,
    because form_start carries no value from LETTER_SECRETS.

    This is not a criticism of the test's design so much as an observation that the
    threat model behind it assumed the GA surface was fixed. It is not — it is a
    dashboard setting owned by Google's defaults.
  evidence:
    type: code
    detail: |
      e2e/privacy-network.spec.ts:15
        const ANALYTICS_HOST = /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)$/;
      e2e/privacy-network.spec.ts:51-58
        try {
          const u = new URL(url);
          if (u.protocol !== "http:" && u.protocol !== "https:") return;
          if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return;
          if (ANALYTICS_HOST.test(u.hostname)) return;
          external.push(url);
      e2e/privacy-network.spec.ts:22-30 — LETTER_SECRETS is a value list only.
      src/config/analytics.test.ts:20-44 — asserts CSP/host-list agreement; asserts
      nothing about runtime event behaviour.
  confidence: INSPECTED
  who_is_affected: the owner — this is the control that should have caught A7-002 before I did
  why_it_matters: |
    Of everything in this report, this is the finding with the longest half-life.
    A7-002 can be fixed with a toggle, but the same class of change will happen
    again — vendors turn features on by default, and this project's entire
    privacy posture depends on GA's surface staying narrow. A test is the only
    thing that notices.
  standard_reference: OWASP ASVS v4 1.1.2; general regression-testing practice for third-party-dependent behaviour
  recommendation: |
    Extend the existing spec rather than adding a new one. In trackExternal, before
    the early return at line 57, capture the GA event name:

      if (ANALYTICS_HOST.test(u.hostname)) {
        const en = u.searchParams.get("en");
        if (en) analyticsEvents.push(en);
        return;
      }

    Then in the "typing, saving, and generating a PDF" test, assert:

      expect([...new Set(analyticsEvents)]).toEqual(["page_view"]);

    That one line would have failed the moment form_start appeared, and it fails on
    any future Enhanced Measurement feature Google enables — file_download,
    scroll, video_start, form_submit — without anyone having to think of them in
    advance.

    Two supporting additions:
      - Assert the host set exactly, rather than only asserting the absence of
        unexpected hosts, so a NEW analytics host (A7-004) also fails the build.
      - Extend LETTER_SECRETS to include a field NAME as well as values, e.g.
        "diagnoses", so metadata leakage is caught alongside content leakage.
        Note this specific one will fail today until A7-002 is fixed — which is the
        correct behaviour and a good way to confirm the fix landed.
  scope: current
  privacy_impact: none — test code only
  cost_and_maintenance: negligible; it makes maintenance cheaper by catching vendor drift automatically
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 5
  harm_if_unfixed: 3
  environment: local

- id: A7-013
  title: HTML and RSC responses carry access-control-allow-origin - *
  category: security
  what_i_observed: |
    Every HTML document and RSC payload from production includes:
      access-control-allow-origin: *
    alongside:
      cross-origin-resource-policy: same-origin
      cross-origin-opener-policy: same-origin

    The two are working against each other in intent — CORP is set to same-origin
    to isolate the browsing context, while ACAO: * grants any origin's JavaScript
    permission to read the response body via CORS.

    The header is not in next.config.ts:31-77. It is emitted by the hosting layer.

    I want to be accurate about impact, because it is easy to overstate this one:
    NO user data is exposed. There is no server-side state, no session, no
    authentication, and nothing in an HTML or RSC response that is not already
    public to anyone who visits the URL. A cross-origin script that reads
    https://myletterofintent.com/ learns exactly what curl would learn. The letter
    lives in localStorage, which same-origin policy protects and which CORS does
    not touch.

    So this is a configuration inconsistency and a questionnaire flag, not a
    vulnerability.
  evidence:
    type: network
    detail: |
      Raw response headers from https://myletterofintent.com/ :
        access-control-allow-origin: *
        cross-origin-opener-policy: same-origin
        cross-origin-resource-policy: same-origin
      Same combination observed on /privacy?_rsc=... and /letter?_rsc=... .
      Absent from the .mp4 response, and absent from next.config.ts:31-77 — so it
      originates at Vercel/Cloudflare, not in this repository.
  confidence: MEASURED
  who_is_affected: nobody directly, today
  why_it_matters: |
    Worth knowing rather than worth panicking about. It matters mainly because
    SECURITY.md reasons carefully about COOP/CORP as deliberate isolation choices,
    and a header that contradicts them is arriving from the platform without
    anyone having chosen it. If a server-side surface is ever added, this header
    becomes materially more interesting.
  standard_reference: OWASP ASVS v4 14.4.7 / 14.5.3 (CORS configuration); Fetch Standard §3.2
  recommendation: |
    Low priority. Establish where it comes from (Vercel emits ACAO on prerendered
    and static responses in some configurations) and, if it can be removed without
    breaking the RSC prefetch flow, remove it — the site needs no cross-origin
    reads. If it cannot be removed, add a line to SECURITY.md recording that it is
    platform-emitted, that it exposes only already-public content, and that this
    was checked. Do not spend engineering effort fighting the platform over it.
  scope: current
  privacy_impact: none — no user data is reachable through this header
  cost_and_maintenance: none
  effort: S
  risk_of_change: |
    Removing it could break RSC prefetching if the platform relies on it. Verify
    navigation between wizard sections still prefetches before shipping.
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 1
  environment: production

- id: A7-014
  title: ICS text escaping does not handle a lone carriage return
  category: correctness
  what_i_observed: |
    src/lib/ics.ts:12-18 escapes ICS text per RFC 5545:
      .replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,")
      .replace(/\r?\n/g, "\\n")
    The final pattern requires a \n. A lone \r (CR with no LF) passes through
    unescaped into the SUMMARY line built at ics.ts:51 from the person's name.

    I am reporting this at its true severity, which is very low. To reach it a
    parent would have to get a bare CR into the preferred-name field, which
    browsers normalise away in <input> and convert to \r\n in <textarea>. The
    resulting file is generated on their device, downloaded by them, and opened in
    their own calendar. There is no attacker and no crossing of a trust boundary —
    the worst case is a family's own calendar event looking wrong.
  evidence:
    type: code
    detail: |
      src/lib/ics.ts:12-18
        export function escapeIcsText(v: string): string {
          return v
            .replace(/\\/g, "\\\\")
            .replace(/;/g, "\\;")
            .replace(/,/g, "\\,")
            .replace(/\r?\n/g, "\\n");
        }
      src/lib/ics.ts:51
        const summary = escapeIcsText(`Review ${personLabel}'s Letter of Intent`);
  confidence: INSPECTED
  who_is_affected: effectively nobody
  why_it_matters: |
    Almost not at all. I include it because I found it by inspection and it costs
    one character to fix, not because it represents real risk. If it competes for
    attention with anything else in this report, drop it.
  standard_reference: RFC 5545 §3.3.11 (TEXT value escaping)
  recommendation: |
    src/lib/ics.ts:17 — change /\r?\n/g to /\r\n|\r|\n/g.
    The existing test file src/lib/ics.test.ts is the natural place for a case.
  scope: current
  privacy_impact: none
  cost_and_maintenance: none
  effort: S
  risk_of_change: none
  mission_impact: 1
  reach: 1
  harm_if_unfixed: 1
  environment: both
```

---

## WHAT I EXAMINED, AND WHAT I COULD NOT

### Examined directly

- **The full shared capture**, `audit/evidence/network/capture-production.json` —
  431 requests decomposed into 2,582 outbound fields, all 420 responses, all
  cookies, and the per-route localStorage/sessionStorage/IndexedDB dumps for all
  9 routes.
- **Four live production sessions of my own**, driven with the project's own
  Playwright 1.62.1: a CSP-violation probe, a delete-everything test, a
  typing-and-download test, and a `form_start` reproduction across four wizard
  routes in four fresh browser contexts.
- **Raw production HTML** for `/` and `/privacy`, fetched independently of the
  browser, to find edge-injected markup.
- **Source**: `next.config.ts`, `src/app/layout.tsx`, `src/app/privacy/page.tsx`,
  `src/config/analytics.ts`, `src/lib/store.ts`, `src/lib/photos.ts`,
  `src/lib/backup.ts`, `src/lib/ics.ts`, `src/lib/share.ts`, `src/lib/download.ts`,
  `src/lib/filenames.ts`, `src/lib/pdf/generate.tsx`, the two PDF documents,
  `src/components/data/DataControls.tsx`, `src/components/boot/ClientBoot.tsx`,
  `src/components/chrome/PrivacyStrip.tsx`, `src/components/samples/SampleViewer.tsx`,
  `e2e/privacy-network.spec.ts`, `src/config/analytics.test.ts`, `SECURITY.md`.
- **All six generated PDFs** in `audit/evidence/pdfs/` — Info dictionary decoded,
  ~42 MB of inflated stream data per file scanned for embedded paths, usernames,
  XMP, JavaScript, embedded files and launch actions.
- **Dependency tree** — `npm audit`: **0 vulnerabilities**. 9 direct runtime
  dependencies, all mainstream. No `process.env` usage in `src/` at all; the only
  two references are build-time flags in `next.config.ts:86,91`.
- **Git history** — no `.env`, secret, `.pem` or key file has ever been added on
  any branch; `.gitignore` covers `.env*` and `*.pem`. Working tree matches the
  brief exactly: `src/app/page.tsx` and `src/components/home/VideoPlayer.tsx`
  modified, nothing else.
- **Source maps** — probed six production chunks; none carries a
  `sourceMappingURL`, and all six `.map` URLs return **403**.
- **XSS sinks** — searched all of `src/` for `dangerouslySetInnerHTML`,
  `innerHTML`, `outerHTML`, `insertAdjacentHTML`, `document.write`, `eval(`,
  `new Function`: **zero matches**.
- **DNS** — A, NS, DNSKEY, SOA.

### Could NOT examine, and why

- **CAA records.** The Windows PowerShell resolver on this machine does not
  support the `CAA` record type (`Unable to match the identifier name CAA to a
  valid enumerator name`). Unverified.
- **HSTS preload list membership.** The header declares `preload`, but confirming
  the domain is actually on the browser preload list requires hstspreload.org,
  which I could not reach from this session. Unverified.
- **DNSSEC — partially.** A `DNSKEY` query returned SOA only, which normally means
  no DNSKEY exists, but I could not confirm with a DNSSEC-aware resolver (`dig
  +dnssec` was not available). Treat "DNSSEC is off" as strongly indicated, not
  proven.
- **TLS cipher/protocol negotiation details.** I confirmed HTTPS, the 308 redirect
  from http, and HSTS, but ran no handshake-level scan (no `openssl`/`testssl.sh`
  in this environment). Cloudflare defaults are almost certainly fine; unverified.
- **The GA4 property's admin settings.** I inferred that Enhanced Measurement
  "Form interactions" is on from its observable output, which is solid evidence of
  behaviour. I could not log in to confirm which other sub-features are enabled —
  so I cannot rule out that `file_download`, `scroll` or `video_start` will fire
  under conditions I did not reproduce. I DID confirm no `file_download` event
  fired on a real PDF download.
- **The browser pane** could not reach production (navigation denied), so all live
  work went through Playwright instead. No finding depends on the browser pane.
- **Cloudflare dashboard state.** I inferred Email Obfuscation and Browser
  Insights are enabled from the injected markup. I could not confirm in the
  dashboard, or determine whether the owner enabled them knowingly.

### One disclosure about independence

While grepping the repository for `static export`, ripgrep returned two matching
lines from `audit/raw/A8-policy.md`. I did not open that file, and I have not read
any other file under `audit/raw/`. Nothing in this report derives from those two
fragments. I excluded `audit/raw/` from subsequent searches.

I also accidentally created a zero-byte file named `$null` in the repository root
via a PowerShell `2>$null` redirect, and deleted it immediately. `git status` is
back to the expected two modified files. No application code, style, content or
configuration was modified at any point.

---

## MY THREE HIGHEST-CONFIDENCE FINDINGS

1. **A7-001 — no typed content leaves the device.** 309 needles, 24 encodings,
   91,595 characters of outbound data, zero hits — then reproduced independently
   in three live production sessions including a real PDF download. This is the
   most thoroughly tested claim in the report and it passes.

2. **A7-002 — `form_start` fires on typing.** Reproduced 4/4 in fresh browser
   contexts across four different routes, with the full parameter list captured
   verbatim each time. The event, its parameters, and the privacy-page sentence it
   contradicts are all quoted directly.

3. **A7-004 / A7-005 — Cloudflare injects two scripts.** Both tags quoted verbatim
   from the served HTML at known byte offsets; the beacon's CSP block confirmed by
   a `securitypolicyviolation` event with `disposition: "enforce"` plus
   `window.__cfBeacon === undefined`; the email decoder's execution confirmed by a
   200 response and a performance resource entry.

## MY THREE LEAST-CONFIDENT FINDINGS

1. **A7-006's DNSSEC and CAA claims.** DNSSEC is strongly indicated but not proven
   with a DNSSEC-aware resolver; CAA I could not query at all. Everything else in
   that finding (Cloudflare in the TLS/DNS/rewriting path, NEL reporting, the
   SECURITY.md omissions) is measured and solid — the DNS hardening
   recommendations rest on the weaker part.

2. **A7-013 — `access-control-allow-origin: *`.** I measured the header reliably,
   but I could not determine which layer emits it or whether removing it would
   break RSC prefetching. My assessment that it exposes nothing is reasoned from
   the architecture (no server-side user state) rather than tested against a real
   cross-origin read.

3. **A7-014 — the ICS lone-CR nit.** INSPECTED, not reproduced. I did not
   construct an input that actually gets a bare `\r` through a browser field,
   because I do not believe one exists in normal use. I am reporting it as found
   and scoring it at the bottom accordingly.

## WHAT I WOULD NEED TO BE MORE CERTAIN

- **Read access to the GA4 property admin and the Cloudflare dashboard.** This is
  the biggest gap by far. Roughly half of this site's third-party privacy surface
  is configured outside the repository, and I could only observe its output. I
  cannot tell the owner what else is switched on — only what I managed to trigger.
- **`dig +dnssec` and a CAA-capable resolver**, plus a check against
  hstspreload.org, to close out A7-006.
- **A capture from a real family session rather than a synthetic one.** My typing
  used `.fill()`, which sets values in one shot. Real keystroke-by-keystroke
  typing over minutes may trigger GA behaviour that a fast synthetic session does
  not — the shared capture's typing phase missed `form_start` entirely for exactly
  this kind of reason, which is why I re-ran it myself. Anyone repeating this work
  should not trust a single capture.
- **A second observation over time.** Everything here is a snapshot of
  2026-08-09. The two findings that worry me most (A7-002 and A7-004) are both
  cases where behaviour changed without the code changing. The right answer is not
  a better audit; it is the standing test in A7-012.

## THE BAR — DOES ANY OF THIS HELP THE PARENT AT 11PM?

Directly, mostly no, and I should say so plainly.

Nothing in this report stops a frightened parent from finishing the document
tonight, and nothing here means their words have gone anywhere. Ranked by whether
they actually help that person:

- **A7-007 genuinely helps.** A parent on a library or shared family computer
  presses a button that says their data is gone, and is told it is. Making that
  sentence true is a direct service to the person the site is most trying to
  protect.
- **A7-002 and A7-003 help indirectly but really.** They are the difference
  between a parent trusting the tool enough to write the hardest paragraphs, and
  a parent hedging. The privacy page invites verification; verification must
  succeed. And the orphaned "of any kind." in the privacy page's search snippet is
  a one-word fix that shapes the first impression of the whole tool.
- **A7-004, A7-005, A7-006, A7-010, A7-011, A7-012** help the *owner* hold the
  line over time. They are governance, not user experience. Correct and worth
  doing, but no family will ever notice them.
- **A7-009, A7-013, A7-014** are correctness and consistency. A7-009 is a real
  inconsistency with the project's own documented reasoning and deserves fixing,
  but if it competes with A7-007 for a weekend, A7-007 wins.

If only one thing ships: turn off GA4 Form interactions and fix the privacy page
sentence (A7-002). It costs about twenty minutes, it restores a promise the site
already made and can keep, and it is the only finding here where a careful parent
who does exactly what the site tells them to do currently ends up with evidence
that the site was not telling the truth.
