# DRAFT — Security Practices page

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by Claire
> Kelly, Esq. and by whoever maintains the code. **Do not publish as-is.**
>
> **Prerequisite:** fix finding A8-002 first. `SECURITY.md` currently contains two
> claims that production contradicts — *"No other analytics"* and *"No external
> scripts are loaded"* — and this page is derived from it. Publishing before the
> correction would put those errors in front of the public.

**Suggested route:** `/security` · **Link from:** footer, and from `/privacy`
section 01

---

## Why this document exists

**Priority: P1 — and it is the highest trust-return item in the whole audit
relative to effort.**

`SECURITY.md` is 15,452 bytes of careful, specific, honestly self-critical
analysis, including a section headed *"Known weakness, stated plainly"*. It sits
in a repository where no family and no referring attorney will ever see it.

The audience that matters here is **special needs trust attorneys deciding
whether to refer clients.** They are doing diligence on a free tool that handles a
disabled child's medical history, and the artifact that would satisfy that
diligence already exists. Publishing a plain-language version converts a private
engineering document into the most persuasive page on the site.

**Legally required?** No. This is a trust and growth item that happens to support
every disclosure obligation in the audit.

**Who must review:** Claire Kelly, plus engineering for accuracy.

**Maintenance:** review whenever `SECURITY.md` changes. Derive the page from it,
do not maintain two sources of truth.

---

# How this is built

**Last reviewed `[[DATE]]` · [Full technical assessment](`[[link or omit]]`)**

## The one thing worth knowing

**We run a test on every single change to this site that types a letter and then
watches every request the browser sends. If a single word of that letter ever
appeared in any request — to us, to Google, to anyone — the test fails and the
change cannot ship.**

That sentence is the whole page. Everything below is detail.

## There is no server, and that is the point

Most privacy promises are a promise about what a company chooses to do with data
it holds. Ours is different: we do not hold anything.

This site is a set of files. There is no database, no account system, no login,
and no server that receives what you write. Your letter is created in your
browser and stays there. We could not read it if we were asked to, subpoenaed
for it, or hacked — there is nothing on our side to read, produce, or steal.

That single decision removes most of the ways websites fail. It also means the
responsibility for keeping your letter safe sits with your own device, which is
why we ask you to [download backups](/your-data).

## What the browser is allowed to do

We tell your browser, in a rule it enforces for us, exactly which other websites
this page may talk to. The list is: **this site, and Google Analytics.** Nothing
else. If a bug — or a compromised piece of software we depend on — ever tried to
send your letter somewhere, your browser would block it before it left your
machine.

We also tell your browser to refuse to display this site inside another site's
frame, to send no referring information anywhere, and to deny access to the
camera, microphone, and location outright. None of those are needed here, so
nothing can ask for them.

## What is stored, and where

| What | Where | Can we see it? |
| --- | --- | --- |
| Your letter | Your browser's local storage | No |
| Photographs you add | Your browser's IndexedDB | No |
| That a page was opened | Google Analytics | Yes — the count, never the content |

[How long each of these lasts](/your-data#how-long).

## Files you load back in

When you load a backup file, that file is untrusted input — it might have been
edited, or it might not be ours at all. So we check it hard before we use it: a
size limit before we even read it, a limit on how deeply nested it may be, a
check that every section matches the shape we expect, a refusal of files that
name a different application, and specific protection against a class of attack
that abuses JavaScript's object model. A section that fails its check is skipped
and reported, rather than taking your whole letter down with it.

Photographs are checked by looking at the actual bytes of the file rather than
trusting its name or its label — which is how we refuse an image that is really
a document with a script inside it.

## The numbers we do not ask for

This tool has **no field** for a Social Security number, an account number, or a
policy number — and a test fails the build if anyone ever adds one. A Letter of
Intent is meant to be copied and handed around, so it should not carry numbers
that can be abused. It records *where* those things are kept instead.

We also keep names out of file names. Your download is
`Letter-of-Intent-Disabilities-2026-08-09.pdf`, not your child's name — because a
file name is read by anyone who can see a downloads folder, a sync notification,
or a shared drive.

## Where we are not perfect

`[[Owner: keep this section. Its honesty is what makes the rest of the page
persuasive. A security page with no weaknesses reads as marketing.]]`

**Our browser rules are slightly looser than we would like in one respect.** The
framework this site is built with needs to run a small amount of code written
directly into the page, and because the site is published as fixed files with no
server, we cannot use the stricter technique that would normally close that gap.
The practical risk is low — there is nowhere on this site for someone else's code
to get in — but it is a genuine gap and we would rather say so than not.

Closing it properly would mean moving to a different kind of hosting, which would
add cost and complexity to a site whose main asset is not secret. We have judged
that trade-off not to be worth it. If you disagree, we would like to hear why.

`[[Owner: add anything else that is true. The credibility of this section is
proportional to how uncomfortable it is.]]`

## Found something?

Please tell us. See our [vulnerability disclosure policy](/security/disclosure)
or write to `[[security contact]]`.

---

## Implementation notes

1. Route at `src/app/security/page.tsx`; add to `src/app/sitemap.ts`; link from
   the footer's "The tool" column and from `/privacy` section 01.
2. **Fix A8-002 in `SECURITY.md` before publishing this**, and add a section
   there titled "What the edge adds" that reasons about the production response
   rather than the repository — the Cloudflare beacon was invisible to a
   `src/`-only analysis.
3. **Verify the headline claim before publishing it.** I relied on
   `SECURITY.md`'s description of `e2e/privacy-network.spec.ts`; I did not open
   or run the spec. If its canary assertions are narrower than described, weaken
   the sentence to match. It is the most valuable sentence on the site and it
   must be exactly true.
4. Decide whether to publish `SECURITY.md` itself alongside this page. My view:
   yes, as a linked appendix. The audience that wants it is small, technical, and
   disproportionately influential.
