# DRAFT — Privacy Policy (layered)

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer and is not licensed in any
> jurisdiction. This is drafting work product for review by Claire Kelly, Esq. or
> outside privacy counsel. **Do not publish as-is.** Every factual claim below was
> verified against production on 2026-08-09, but facts change: re-verify the
> third-party list and cookie details before publishing, and again on every
> release that touches analytics or hosting.
>
> Bracketed `[[…]]` items are decisions for counsel or the site owner.

---

## Why layered

The existing `/privacy` page measures at **Flesch-Kincaid grade 7.2** — genuinely
excellent, and the reason people finish it. The problem is not readability, it is
that several legally expected elements are missing (effective date, change
process, Do Not Track, named third parties, retention).

Adding those elements the usual way would push the page toward grade 12–14 and
destroy its one great virtue. **Layering is how you add completeness without
paying for it in readability.**

- **Layer 1 — The short version.** Six statements, no jargon. Target: grade 8 or
  below. **Measured**: Flesch-Kincaid grade **3.5**, Flesch Reading Ease **86.9**,
  Gunning Fog **4.6**, SMOG **5.6** (197 words, 21 sentences, 9.4 words per
  sentence, 2.0% polysyllabic). Treat the 3.5 with a pinch of salt — Flesch-Kincaid
  rewards short declarative sentences and understates the real register, which is
  nearer grade 5. The point is that it is comfortably inside the target. A tired
  parent reads only this.
- **Layer 2 — How it works, in plain words.** Essentially the existing page,
  which is already good, plus the missing elements written in the same voice.
- **Layer 3 — The detail.** Tables, dates, named vendors, statutory language.
  Nobody reads it; everybody needs it to exist.

Keep the existing on-page contents nav. Add Layer 1 above it in the navy header
panel where the current summary sentence lives.

---

# Privacy

**Effective `[[DATE]]` · Last reviewed `[[DATE]]` · [What changed](/policy-changes)**

---

## Layer 1 — The short version

**Everything you type stays on your device.** Your letter is saved in this
browser, on this computer or phone. It is never sent to us, and we have no way to
read it.

**There is no account.** We never ask for your name, your email, or a password to
use this tool.

**We count visits, and nothing more.** Google Analytics tells us how many people
open each page. It is never given a single word of your letter. You can turn it
off, and the tool works the same either way.

**We never ask for the numbers that get abused.** No Social Security numbers, no
account numbers, no policy numbers. The letter says where your family keeps
those, not what they are.

**Your browser can lose your letter.** If you clear this site's data — or if your
browser does it on its own after a long gap — the letter is gone, and we cannot
get it back. **Download a backup. It takes one click.**

**You are in charge of it.** Back it up, move it, or erase everything, any time,
from [Your data](/your-data).

Questions? Call Trusts & Wealth, PLLC at (703) 745-5565 or write to
contact@trustsandwealth.com. A person will answer.

---

## Layer 2 — How it works, in plain words

> **Note to counsel/editor:** sections 01, 02, 03 and 05 below are the existing
> page text, which is well drafted and should be kept close to verbatim. Sections
> 04, 06, 07 and 08 are new or materially rewritten. Changes to existing text are
> marked **[CHANGED]**.

### 01 · Where your answers live

Everything you type is stored in your browser, on this device, in features called
local storage and IndexedDB. It is never uploaded, transmitted, or synced by us.
Trusts & Wealth has no server that receives it, no database that holds it, and no
way to see it.

You can confirm this yourself: open your browser's developer tools, go to the
network tab, and type into the letter. Nothing is sent. You will see the
analytics request that counts the page when it first loads — and after that,
silence, no matter how much you write.

**[CHANGED — new paragraph]** We test this on every single change we make to the
site. An automated test fills in a letter with distinctive made-up words, then
watches every request the browser sends. If any one of those words ever appeared
in any request — to us, to Google, to anyone — the test fails and the change
cannot ship. [More about how we build this](/security).

### 02 · What that means in practice

**Your work stays here.** Another computer or phone will not see it unless you
move it there yourself with a backup file.

**[CHANGED] Your browser can erase it — and not only when you ask.** If you or a
cleanup tool clear this site's data, the letter is gone. Browsers also clear
storage on their own: to free up space when a device is full, and — on iPhone and
iPad in particular — after a stretch of time when you have not come back to the
site. We cannot prevent that and we cannot recover from it.
[Download a backup](/your-data) now and then. It takes one click.
[More about how long things last](/your-data#how-long).

**On a shared computer.** At a library or on a family machine, use
[Delete all my data](/your-data) when you finish, or work in a private window and
export a backup first.

### 03 · Why we never ask for Social Security or account numbers

*(Unchanged. This section is good.)*

A Letter of Intent is meant to be copied and handed around: to caregivers,
schools, hospitals, a trustee. Documents that travel should not carry numbers
that can be abused.

So this tool never asks for Social Security numbers, account numbers, or policy
numbers. Instead, the letter records *where* your family keeps those, so the
right person can find them and nobody else can.

### 04 · What we do and do not measure **[CHANGED]**

We use Google Analytics for one purpose: to understand how many people visit and
how the site is used, so we can improve the Letter of Intent Builder. Knowing
which pages families open, which ones they never find, and where they stop is
what tells us what to fix next — a question we have no other way to answer,
because we never see the letters themselves.

Here is exactly what a page view sends to Google:

- the address of the page you opened, such as `myletterofintent.com/letter/medical`
- the page's title
- your browser, device type, screen size, and language
- roughly which region you are in, worked out from your internet address
- the link that brought you here, if there was one

That is the whole list. **It does not include anything you typed.**

> **What it never sees is the letter. Nothing you type into any field is
> captured, by us or by anyone else through this site.** The words stay in this
> browser's own storage, and no script on this page reads them, sends them, or
> records your screen. Analytics counts that a page was opened, never what was
> written on it.

Google sets two cookies to do this counting. They are listed in
[Layer 3](#cookies-and-storage) with what they do and how long they last. Google
can recognise the same browser across other websites that also use Google
Analytics; that is how the service works, and it is worth knowing.
[How Google uses information from sites that use its services](https://policies.google.com/technologies/partner-sites)
· [Google's privacy policy](https://policies.google.com/privacy)

**Turning it off.** Google's own
[opt-out add-on](https://tools.google.com/dlpage/gaoptout) turns the counting off
across every site, and most ad and tracker blockers do the same. **[CHANGED]** If
your browser sends a Global Privacy Control or Do Not Track signal, we do not
load analytics at all. The builder works exactly the same either way.
`[[Counsel: this sentence must not be published until GPC handling is actually
implemented. If it ships without the code, delete the sentence.]]`

### 05 · The yearly reminder

*(Unchanged. This section is good and unusually honest.)*

At the end of the builder we offer a reminder to update your letter a year from
now. Take the calendar file: it is made here on your device and sends nothing
anywhere.

The panel beside it offers an emailed reminder from Trusts & Wealth. **That
service is not running yet.** Nothing is collected, stored, or transmitted if you
type an address into it today. When it does run, this page will say so first, and
the only thing sent will be your email address and the date — never a word of
your letter.

The two calendar links we offer beside the file, Google Calendar and Outlook,
open those services with the reminder pre-filled. Only the event's title and date
travel there, and only if you click them. Their own privacy terms apply once you
are on their site. The same is true of the share buttons: they open another
service with a message already written, and nothing from your letter goes with
it.

### 06 · Who else is involved **[NEW]**

Running a website means other companies are part of it. Here is every one, and
what each can see.

**The companies that serve you this website** — Vercel, which stores the site's
files, and Cloudflare, which sits in front of it to keep it fast and to block
attacks. They see what every web server sees: your internet address, the time,
which page you asked for, and what browser you used. They keep those in ordinary
server logs. **They never see your letter, because your letter is never in a
request.** `[[Owner: confirm log retention periods with both and state them here
— "for N days" is checkable; "ordinary logs" is not.]]`

**Google**, for counting page views, as described above.

**GitHub**, which holds the site's source code. It has never held anyone's
letter, and there is no mechanism that could put one there.

That is the complete list. There is no advertising network, no heatmap tool, no
session recorder, no chat widget, and no customer-tracking service on this site.

### 07 · Health, disability, and education information **[NEW]**

A Letter of Intent is full of information most laws treat as especially
sensitive: diagnoses, medications, therapies, hospital preferences, behavioural
plans, IEP history, religious practice, and end-of-life wishes — usually about a
person who cannot speak for themselves.

We designed this tool the way we did *because* of that. The most protective thing
we can do with information that sensitive is never to hold it, so we do not hold
it.

Two things families often ask:

**Is this covered by HIPAA?** No — and it does not need to be. HIPAA governs
doctors, hospitals, and insurers. We are a law firm offering a free writing tool,
and more to the point, HIPAA protects information a company holds about you. We
hold none.

**What about our child's school records?** FERPA governs schools. Anything you
write here about an IEP is your own account of it, kept on your own device. No
school is involved and no record is requested from one.

### 08 · Your choices, and how to use them **[NEW]**

Because we never receive anything you write, most of the rights privacy laws
give you have nothing to act on here — there is no file of yours for us to hand
over, correct, or delete. What we can offer is more direct:

| You want to | Do this |
| --- | --- |
| See everything stored about you | [Your data](/your-data) → Download a backup. It is a plain file you can open. |
| Correct something | Edit the letter. It is yours; nothing is locked. |
| Delete everything | [Your data](/your-data) → Delete all my data. It clears both stores and checks that they are gone. |
| Move it to another device | [Your data](/your-data) → Download a backup, then load it on the other device. |
| Stop being counted | [Google's opt-out add-on](https://tools.google.com/dlpage/gaoptout), any tracker blocker, or turn on Global Privacy Control in your browser. |
| Ask us something | (703) 745-5565 or contact@trustsandwealth.com. |

If you live somewhere with specific privacy rights — California, Virginia,
Colorado, Connecticut, Washington, or anywhere else — write to us and we will
answer. We will not ask you to prove who you are before answering a general
question, because usually there is nothing of yours for us to protect.

### 09 · When this changes **[NEW]**

We keep a dated record of every change to this page at
[What changed](/policy-changes). If we ever change something that matters — a new
company involved, a new kind of information, a change to the promise at the top —
we will say so there, and we will note the date on this page.

**The promise at the top of this page is the one we will not change.** If it ever
had to change, we would say so before it took effect, not after.

---

## Layer 3 — The detail

### Cookies and storage {#cookies-and-storage}

See the full table in `audit/policies/cookies-and-storage.md`, which is drafted
to slot in here rather than as a separate page. Two cookies do not warrant a page
of their own.

### Data retention

See `audit/policies/data-retention-and-deletion.md`.

### Legal notices

*(Existing section 06 text — `firm.disclaimerFull` and `firm.advertisingNotice`
— unchanged. It is well drafted.)*

This tool is offered by Trusts & Wealth, PLLC as a free public resource. It does
not provide legal advice, and no attorney–client relationship is formed by using
it. A Letter of Intent is not a will, not a trust, and not legally binding on
anyone. It works best alongside — never instead of — a special needs trust and a
complete estate plan prepared with a qualified attorney in your state. If you
have questions about protecting a loved one's benefits or future, talk with a
special needs planning attorney.

ATTORNEY ADVERTISING. Trusts & Wealth, PLLC is a Virginia law firm. This tool
describes legal concepts in general terms and is not a prediction or guarantee of
any outcome.

### Who we are, for the record

Trusts & Wealth, PLLC · Virginia · (703) 745-5565 ·
contact@trustsandwealth.com · https://trustsandwealth.com
`[[Counsel: add a postal address. Several state statutes and CalOPPA-adjacent
practice expect one. If a home office address is undesirable, a registered agent
or PO box is normal.]]`

### Notices for specific states `[[COUNSEL: adopt, adapt, or delete]]`

`[[Counsel: these are drafted defensively. Whether any of them is required
depends on thresholds only the firm can confirm — see audit/raw/A8-policy.md
section 5. Publishing a right you are not obliged to give is generally safe;
describing a law as applying when it does not is not. Prefer the framing "we
offer this regardless of whether the law requires it of us."]]`

**California.** We do not sell or share personal information, and we have never
done so. We do not use personal information for cross-context behavioural
advertising. If your browser sends a Do Not Track or Global Privacy Control
signal, we do not load analytics. Third parties (Google Analytics) may collect
information about your browsing across other websites over time; see section 04.

**Washington and Nevada.** `[[Counsel: decide whether a separate Consumer Health
Data Privacy Policy with a dedicated homepage link is warranted. See A8-009 —
the applicability question is genuinely open and MHMDA is the only statute here
with a private right of action.]]`

**Outside the United States.** This tool is built for families in the United
States and is not offered to people outside it.
`[[Counsel: if GA4 shows meaningful EU/UK traffic, this sentence is not enough —
see A8-010 on Consent Mode v2 and a region-scoped consent choice.]]`

---

## Implementation notes for whoever builds this

1. **Render the effective date from one constant**, alongside `firm` in
   `src/config/`, so the page, the change log, and the metadata cannot drift.
2. **Fix the broken meta description** in `src/app/privacy/page.tsx:9-12` — delete
   the stray `"of any kind. "` (finding A8-014).
3. **Do not ship section 04's GPC sentence before the GPC code.** A promise the
   code does not keep is worse than no promise.
4. **Add `/privacy`'s new anchors to the existing `CONTENTS` array** at
   `src/app/privacy/page.tsx:18-25`, and add any new routes to
   `src/app/sitemap.ts`.
5. **Keep Layer 1 in the navy header panel.** It replaces the current single
   summary paragraph. Do not let it grow — every sentence added to Layer 1 is a
   sentence a tired parent may not finish.
6. **Measure before publishing.** Re-run the readability check on Layer 1. If it
   exceeds grade 8, cut rather than simplify vocabulary — length is usually the
   culprit, not word choice.
