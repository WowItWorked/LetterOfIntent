# DRAFT — Children's Information Notice

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. The COPPA reasoning in
> Part B rests partly on general knowledge of 16 C.F.R. Part 312 **as I
> understand it, which may predate the 2025 amendments.** Counsel must verify it
> against the operative text. For review by privacy counsel. **Do not publish
> as-is.**

**Suggested placement:** a clearly-anchored section of `/privacy` (`#children`),
plus a footer link. A separate page is also fine; what matters is that it is
findable by a parent who goes looking.

---

## Why this document exists

**Priority: P1.**

This tool collects an extraordinary volume of information about a named minor —
diagnoses, medications, therapies, behavioural triggers, law-enforcement
interactions, IEP history, religious practice, end-of-life wishes — and currently
says nothing anywhere about children's privacy. A thoughtful parent will notice
the silence.

The COPPA analysis (full version at `audit/raw/A8-policy.md` section 4) concludes
the statute very probably does not attach. But that conclusion rests on **three
independent legs, and two of them are product decisions rather than architectural
facts.** Nothing in the codebase records that they are load-bearing. A future
feature could quietly knock one out and nobody would notice.

**Legally required?** Not on the current analysis. **Advisable**, both as a
disclosure and — more importantly — as a durable internal constraint.

**What it protects against:** a future feature silently destroying a defence
nobody wrote down; and a parent's unanswered question.

**Who must review:** privacy counsel, against current 16 C.F.R. Part 312.

**Maintenance:** re-read whenever a feature changes *who fills in the form*.
That is the only trigger that matters.

---

# Part A — For publication

## Children's information

**Effective `[[DATE]]`**

### This is a tool for adults

My Letter of Intent is written for parents, siblings, grandparents, guardians,
and professional caregivers — adults writing about someone they care for. It is
not designed for use by children, it is not aimed at children, and we do not
knowingly let anyone under 13 use it to give us information.

### A letter is about a child. The information still never reaches us.

Most letters written here are about a child or a young adult, and they hold the
most private things there are: what a diagnosis means day to day, which
medications work, what a hard day looks like, what to do in a crisis.

**None of it comes to us.** Everything you write is stored by your own browser,
on your own device. There is no server that receives it, no database that holds
it, and no way for us to read it. We built it that way deliberately, because the
safest thing to do with information this sensitive is never to hold it.

So while this tool is very much *about* children, we do not collect information
*from* children, and we do not collect the information *about* them either — you
keep it.

### The one thing that does reach anyone

Google Analytics counts that a page was opened. That count is not connected to
any letter, to any name, or to any child. It records the page address, the
browser and device, and roughly which region the visit came from. Nothing else.
See [What we do and do not measure](/privacy#p4).

### If you are under 13

Please do not use this tool without a parent or guardian. If you have already,
nothing you typed has come to us — it is on your own device, and you can remove
it at [Your data](/your-data) → Delete all my data.

### If you are a parent and you have a question

If you believe a child under 13 has given us information, or you want to ask us
anything at all about how this works, call **(703) 745-5565** or write to
**contact@trustsandwealth.com**. A person will answer.

We will also say the honest thing: because nothing reaches us, there is normally
nothing for us to delete on your behalf. What we can do is walk you through
clearing it from the device it is actually on, and we are glad to do that on the
phone.

---

# Part B — Internal engineering note. **DO NOT PUBLISH.**

> Keep this alongside `SECURITY.md`. Its purpose is to make the COPPA position a
> constraint a future developer must consciously override, rather than a
> conclusion that lives only in an audit file nobody reads.

## Why COPPA does not currently attach — and exactly what would change that

COPPA attaches only if **(a)** the service is *directed to children* under 13, or
**(b)** the operator has *actual knowledge* it is collecting personal information
*from* a child under 13. Both limbs require collection **from a child**.

Our position stands on three legs. **Any one of them failing is survivable. Two
failing is not.**

### Leg 1 — Not directed to children (a design property)

The § 312.2 factors — subject matter, visual and audio content, animated
characters, child-oriented activities and incentives, music, age of models, child
celebrities, advertising aimed at children, and audience-composition evidence —
all point the same way. The register, typography, reading level, tasks demanded
(recalling IEP history, naming a trustee, end-of-life wishes), and referral
channel (special needs trust attorneys) are unmistakably adult.

**This leg breaks if we add:** cartoon or animated characters; a game or reward
mechanic; child-voiced audio; bright child-market visual styling; any content
addressed to the child rather than the writer.

### Leg 2 — Information is not collected *from* a child (a product property)

An adult author fills in every field. The schema's very first fields are
`authorName` and `authorRelationship`; the whole document is framed as *what I
know about the person I care for*. The subject never touches the keyboard.

**This leg breaks if we add:** any flow that invites the *subject* to fill in
part of the letter — "send this section to your teenager", a shareable
fill-in link, a child-facing companion app, or a collaborative mode. **This is
the most likely leg to break, because it is the most attractive feature.**

### Leg 3 — Nothing typed is transmitted at all (an architectural property)

Verified in this audit: zero canary strings across 431 production requests, and
no request carries a POST body. This is the strongest leg and it is enforced by
`e2e/privacy-network.spec.ts` on every commit.

**This leg breaks if we add:** any server, any sync, any cloud backup, any
AI-assist call, any error reporter that captures form state, any session
recorder.

### The analytics caveat — read this before dismissing COPPA

GA4 **does** transmit, and it transmits a persistent identifier: `cid` plus the
`_ga` / `_ga_90YXKXB5TC` cookies, 400-day lifetime. Under § 312.2, "personal
information" expressly includes *a persistent identifier that can be used to
recognize a user over time and across different Web sites*, and limb (c) of the
"collection" definition is *passive tracking of a child online*.

**Therefore: if Leg 1 or Leg 2 ever fails, the GA identifier becomes COPPA-covered
personal information collected from a child, and Leg 3 does not save us** — because
Leg 3 is about the letter, and the identifier is not the letter.

Practical consequences:

1. **Confirm Google Signals is OFF** in the GA4 property. It builds cross-device
   advertising profiles and would make the identifier much harder to defend.
2. **Do not add an age gate.** It feels protective; it is not. It manufactures
   the *actual knowledge* limb (b) requires, and it puts a friction wall in front
   of an exhausted parent at 11pm. State an adults-only intent in the Terms
   instead. This is a case where the technically-tidy answer is the wrong answer
   for the actual user.
3. **Any feature that changes who fills in the form triggers a fresh COPPA
   review.** Not a discussion — a review, with counsel.

### Open question for counsel

Does "collection by an operator" attach at all where the operator never receives
the data? § 312.2 defines collection as *"the gathering of any personal
information from a child by any means,"* including *"requesting, prompting, or
encouraging a child to submit personal information online."*

The better reading is that limb (a) describes *how* gathering occurs rather than
being an independent trigger divorced from gathering — so a purely client-side
application that never transmits has not gathered anything. FTC guidance on
mobile apps has historically taken essentially this line for data that stays on
the device.

But it is not the only available reading, and **the 2025 amendments to Part 312
must be checked against this analysis.** Flagged `INFERRED`, not `INSPECTED`.
