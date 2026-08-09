# DRAFT — Accessibility Statement

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by Claire
> Kelly, Esq. **Do not publish as-is.**
>
> **Critical:** the "Known limitations" section below must be reconciled with
> whatever the other audit analysts found before publication. I examined only the
> caption question. **Publishing a conformance claim the site cannot support is
> worse than publishing nothing** — an accessibility statement that overstates is
> both a credibility failure and, in a demand letter, an admission. State a
> *target* and honest *gaps*, never bare "conformance", unless a full audit backs
> it.
>
> Bracketed `[[…]]` items are decisions for the owner.

**Suggested route:** `/accessibility` · **Link from:** site footer, "The tool"
column, beneath "Privacy & your data"

---

## Why this document exists

**Priority: P0.** This is a tool built for families of people with disabilities.
Many of its users are themselves disabled. Shipping it without an accessibility
statement is a credibility problem before it is a legal one.

**Legally required?** No US statute requires an accessibility statement as such.
ADA Title III (28 C.F.R. Part 36) requires accessible places of public
accommodation, and whether a standalone website is one remains unsettled in the
Fourth Circuit (Virginia). The nexus theory — that a law firm's website is a
service of its physical office — is the more likely route to exposure here. An
accessibility statement is not a defence, but it is strong evidence of good
faith, and in practice it deflects a meaningful share of demand letters by giving
a complainant somewhere to go first.

**What it protects against:** demand letters that begin because there was no
other channel; and, more importantly, a deaf parent silently giving up on the
video and assuming the rest of the tool will fail them too.

**Who must review:** Claire Kelly, plus whoever owns the remediation backlog. Do
not publish a date nobody has committed to.

**Maintenance:** review twice a year and after any significant release. Update
the "Known limitations" list every time one is fixed — a stale list is worse than
a short one.

---

# Accessibility

**Last reviewed `[[DATE]]`**

## What we are aiming for

We want every part of this tool to work for the person using it — including with
a screen reader, with a keyboard alone, with speech control, at large text sizes,
with reduced motion, and on a phone.

Our target is **WCAG 2.2 Level AA**. We are not claiming we have reached it
everywhere. Below is where we know we fall short.

## What works today

`[[Owner: verify each of these against the other audit analysts' findings before
publishing. Delete anything not confirmed. An unverified claim here is worse than
an omission.]]`

- Every page can be reached and used with a keyboard alone, and there is a "Skip
  to main content" link at the top of each page.
- Text can be enlarged in your browser without content being lost or overlapping.
- Motion and animation are reduced automatically if your device is set to prefer
  reduced motion.
- No part of the tool has a time limit. Nothing expires while you are writing.
- Your work saves as you go, so a long pause costs you nothing.
- Nothing flashes.
- The tool works without an account, without a password, and without a CAPTCHA.

## What does not work yet — stated plainly

**The explainer video on the home page has no captions and no transcript.**
This is a Level A failure of WCAG 2.2 Success Criterion 1.2.2 (Captions,
Prerecorded). If you are deaf or hard of hearing, or if you simply cannot play
sound, you currently cannot get what that video says. The written explanation
beside the player covers the same subject, but it is not a transcript of the
video and we are not going to pretend otherwise.

**We are fixing this.** `[[Owner: insert a real date. A date you will meet.
"Within 30 days" is better than "soon" and infinitely better than a date you
miss.]]` Both a caption track and a full written transcript will be added.

`[[Owner: add any further known issues from the other audit analysts here. If
they found colour-contrast, focus-order, or form-labelling problems, list them.
The credibility of this whole page rests on the list being honest rather than
short.]]`

## Tell us what we got wrong

If any part of this tool does not work for you, please tell us. We will take it
seriously and we will tell you what we are going to do about it.

- **Call:** (703) 745-5565
- **Email:** contact@trustsandwealth.com
- **Post:** `[[Owner: postal address]]`

**We aim to reply within `[[two]]` business days**, and to tell you either that it
is fixed or when it will be.

If you need any part of this tool in another format — the guidance read aloud, a
large-print version of a sample, or help completing a letter over the phone —
ask. We would rather do that than have you go without.

## How we test

`[[Owner: describe what is actually done. Suggested, if accurate: "We run
automated accessibility checks on every change, and we test the whole letter with
a keyboard alone and with a screen reader before each release." Do not claim
manual screen-reader testing unless someone actually does it — an inaccurate
claim here is exactly the kind that gets quoted back.]]`

Automated tools catch perhaps a third of accessibility problems. The rest need a
person. If you find one, you will be telling us something our tools cannot.

## Standards we measure against

- **Web Content Accessibility Guidelines (WCAG) 2.2, Level AA** — our target.
- We also take account of Section 508 and, for anyone reaching us from Europe,
  EN 301 549.

---

## Implementation notes

1. **Add the route** at `src/app/accessibility/page.tsx` and add it to
   `src/app/sitemap.ts` (currently six URL groups, none of them policies).
2. **Add the footer link** in `src/components/chrome/SiteFooter.tsx`, in the
   existing "The tool" nav column (lines 49–62) beneath "Privacy & your data".
3. **Fix the video while you are here.** Add
   `<track kind="captions" srclang="en" label="English" default src="/what-is-a-letter-of-intent.vtt">`
   inside the `<video>` at `src/components/home/VideoPlayer.tsx:203`, and remove
   the now-obsolete comment at lines 201–202. Transcribe the audio by hand or
   locally — **do not** send the audio to a third-party transcription service;
   that would be a new outbound data flow for no good reason.
4. **Publish a labelled transcript** beneath the player, inside a
   `<details>`/`<summary>` so it does not dominate the layout, with the summary
   reading "Read the transcript" rather than "Transcript" — the imperative gets
   clicked.
5. **Ship the statement even if the captions slip.** The statement is the
   honest-status document; it does not depend on the fix landing first. That is
   the entire point of publishing known limitations.
