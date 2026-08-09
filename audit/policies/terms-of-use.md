# DRAFT — Terms of Use

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is **not a lawyer**, is not licensed
> anywhere, and cannot advise on the enforceability of a single clause below.
> This is a structural starting point, not a contract.
>
> **This document in particular must be drafted or adopted by Claire Kelly
> personally.** It concerns the firm's own liability, and several clauses —
> especially the limitation of liability — are subject to state-law limits on
> unconscionability and to professional-responsibility rules about what a law firm
> may disclaim to a member of the public. Those are exactly the judgements I
> cannot make. **Do not publish as-is.**

**Suggested route:** `/terms` · **Link from:** site footer fine-print row

---

## Why this document exists

**Priority: P1.**

The site has exactly one legal document today. There is no warranty disclaimer,
no limitation of liability, no statement of who owns the generated documents, and
no governing law.

The realistic exposure is concrete rather than abstract. This tool produces an
**Emergency Information Sheet** that families are explicitly encouraged to hand
to schools, hospitals, and paramedics. Picture the failure: a long allergy entry
is clipped by the PDF layout, a paramedic reads the sheet, and a child is given
something they react to. Whether or not that claim would succeed, the ordinary
mitigation — a conspicuous AS-IS disclaimer and a liability cap, presented before
the document is generated — costs one page.

There is also a quieter question with no current answer: **who owns the letter?**
The right answer is "the family, outright, and the firm claims nothing." Silence
invites the opposite assumption, particularly from an attorney reading on a
client's behalf.

**Legally required?** No. Advisable, and standard for any site that generates a
document someone will rely on.

**Who must review:** Claire Kelly personally. Do not delegate this one.

**Maintenance:** annual, and on any material feature change.

---

## Drafting constraints — please honour these

The register of this site is warm, plain, and second-person. **A wall of
capitalised boilerplate would visibly contradict everything else on it and would
cost more in trust than it gains in protection.** Specifically:

- **No click-through acceptance gate.** A frightened parent should not meet a
  modal before writing about their child. Footer link, browsewrap, done. Counsel
  should weigh the (real) enforceability cost of browsewrap against the (also
  real) cost of a consent wall in front of this particular doorway. My view, for
  what it is worth: the doorway wins.
- **Conspicuousness without shouting.** Where a warranty disclaimer needs to be
  conspicuous, use a bordered callout in the site's existing style rather than
  ALL CAPS. `[[Counsel to confirm this satisfies the applicable conspicuousness
  standard — if it does not, capitals in one short block only.]]`
- **Do not restate the attorney disclaimer differently.** It already exists at
  `src/config/firm.ts:103-110` and is well drafted. Cross-reference it; two
  slightly different versions of the same disclaimer is worse than one.

---

# Terms of Use

**Effective `[[DATE]]`**

## In short

This is a free tool from a law firm. It helps you write something; it does not
advise you. What you write is yours. We do not promise the tool is perfect, and
we cannot be responsible for decisions made from what it produces. Please keep
your own backups.

The full version follows.

## 1. What this is

My Letter of Intent is a free tool provided by Trusts & Wealth, PLLC. It asks you
questions and turns your answers into a Letter of Intent and a one-page Emergency
Information Sheet, both created entirely in your own browser.

## 2. What this is not

**This tool does not give legal advice, and using it does not make you a client
of Trusts & Wealth, PLLC.** A Letter of Intent is not a will, not a trust, not a
power of attorney, and not legally binding on anyone. It cannot appoint a
guardian, transfer property, or direct a trustee. It works alongside — never
instead of — a special needs trust and a complete estate plan prepared with a
qualified attorney licensed in your state.

Trusts & Wealth, PLLC is licensed in Virginia. Anyone anywhere may use this tool,
but nothing on this site should be taken as advice about the law of any other
state.

See also our [full legal notice](/privacy#legal).

## 3. Who this is for

This tool is intended for adults aged 18 and over who are writing about someone
they care for. It is not designed or intended for use by children.

`[[Counsel: this sentence is deliberately a statement of intent rather than an
age gate. An age gate would manufacture the "actual knowledge" that COPPA's
second trigger requires and would put friction in front of the intended user. See
audit/raw/A8-policy.md section 4 for the full reasoning.]]`

## 4. Your content is yours

Everything you write stays on your device and belongs to you. **We claim no
ownership of it and no licence over it.** We could not use it if we wanted to: we
never receive it. See [Privacy](/privacy).

The documents this tool produces are yours to keep, copy, print, and share with
anyone you choose — caregivers, family, doctors, schools, a trustee, an attorney.
That is what they are for.

## 5. Our content

The questions, guidance, sample documents, and design of this site belong to
Trusts & Wealth, PLLC. You may use them for your own family's purposes and share
the site freely. Please do not republish the site's guidance as your own or use
it to build a competing product. `[[Counsel: confirm the scope you actually want
here. A very restrictive clause sits awkwardly beside "please pass it along" in
the footer.]]`

## 6. Please use it in good faith

Do not attempt to break, overload, or interfere with the site, and do not use it
to store or produce anything unlawful. There is not much to break — the tool has
no server and no accounts — but the request stands.

## 7. No warranty

> **We provide this tool "as is" and "as available."** We do not warrant that it
> will be uninterrupted, error-free, compatible with every browser or device, or
> that any document it produces will be complete, accurate, or fit for any
> particular purpose. To the fullest extent permitted by law, we disclaim all
> warranties, express or implied, including any implied warranties of
> merchantability, fitness for a particular purpose, and non-infringement.

**Please read what the tool produces before you rely on it.** In particular,
check the Emergency Information Sheet yourself, every time, before you hand it to
anyone. It is a summary, and no summary is a substitute for your own eyes.

## 8. Keep your own copies

Your letter is stored by your browser, and browsers clear storage — sometimes
without being asked. **We do not hold a copy and we cannot recover one.** Please
download a backup regularly. See [How long your letter lasts](/your-data#how-long).

## 9. Limitation of liability

`[[COUNSEL: draft this clause. Do not adopt a template. The points to cover are
below; the wording, the cap, and whether a cap is even appropriate for a law
firm's free public resource are your calls.]]`

Points to address:

- Exclusion of indirect, incidental, consequential, and special damages.
- A cap on direct damages — noting the tool is free, so the conventional
  "amounts paid" cap resolves to zero, which some courts treat as illusory.
  `[[A nominal figure may be more defensible than zero.]]`
- **A carve-out for anything that cannot lawfully be excluded**, and specifically
  for personal injury caused by negligence, which many states will not permit to
  be disclaimed. This matters here: the foreseeable harm from this tool is
  medical, not financial.
- Consistency with Virginia professional-responsibility rules on what a firm may
  disclaim to a non-client.

## 10. Changes to the tool and to these terms

We may change, suspend, or discontinue this tool at any time. If we ever
discontinue it, we will give notice on the site so families can export their
work — though your letter lives on your device and does not depend on us
continuing.

Changes to these terms will be dated and recorded at
[What changed](/policy-changes).

## 11. Governing law

These terms are governed by the laws of the Commonwealth of Virginia, without
regard to its conflict-of-laws rules. `[[Counsel: decide on venue, and on whether
to include an arbitration or class-waiver clause. My non-lawyer observation, for
you to discard: an arbitration clause on a free tool for families of disabled
children is likely to read badly if it is ever quoted publicly, and it protects
against a risk that is already small.]]`

## 12. Talk to us

Trusts & Wealth, PLLC · (703) 745-5565 · contact@trustsandwealth.com ·
`[[postal address]]`

---

## Implementation notes

1. Route at `src/app/terms/page.tsx`; add to `src/app/sitemap.ts`.
2. Link from the footer fine-print row in
   `src/components/chrome/SiteFooter.tsx` (lines 115–125), beside the existing
   `firm.disclaimerShort`.
3. Consider a single quiet line on the review screen, above the download buttons:
   *"Please read the Emergency Information Sheet before you hand it to anyone."*
   That sentence does more practical good than the whole of section 7.
4. Do **not** add an acceptance checkbox anywhere in the letter flow.
