# DRAFT — Policy Change Log

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by Claire
> Kelly, Esq. **Do not publish as-is.** The historical rows below are
> **placeholders showing the intended format** — they are not a record of
> anything. Delete them and start the real log on the day the first policy is
> published.

**Suggested route:** `/policy-changes` · **Link from:** the effective-date line
at the top of every policy page

---

## Why this document exists

**Priority: P2, but it is a prerequisite for the effective dates in A8-004.**

There is currently no record of when any policy changed or what changed. Combined
with the absence of any date on `/privacy`, there is no way for a family, a
referring attorney, or a regulator to establish what the site promised on a given
date.

A privacy promise this strong is only as good as the ability to show it was in
force when someone relied on it. A dated log is the cheapest possible evidentiary
record and costs three lines per change.

**Legally required?** It supports CalOPPA's requirement to describe how consumers
are notified of material changes — an element currently missing entirely. The log
is one clean way to satisfy it.

**Maintenance:** three lines per policy change, written at the same time as the
change. If it is written later, it will not be written.

---

# What changed, and when

**Last reviewed `[[DATE]]`**

We keep a record of every change to our privacy policy, terms, and other
notices — what changed, when, and what it means for you. Newest first.

If we ever change something that matters — a new company involved, a new kind of
information, or a change to the promise at the top of the privacy page — we will
say so here and note the date on the page itself.

**The promise that everything you type stays on your device is the one we will
not change.** If it ever had to change, we would say so before it took effect,
not after.

| Date | Document | What changed | What it means for you |
| --- | --- | --- | --- |
| `[[YYYY-MM-DD]]` | Privacy | *(example format — delete)* Named Vercel and Cloudflare, the companies that serve you this website, and said what each can see. Added the two Google cookies by name, with how long they last. Added dates and this change log. | Nothing about how the tool works changed. We are describing more precisely what was already true. |
| `[[YYYY-MM-DD]]` | Accessibility | *(example format — delete)* First published. States our target, what works, and what does not — including that the explainer video has no captions yet. | You can see what we know is broken, and tell us what we missed. |
| `[[YYYY-MM-DD]]` | Terms of Use | *(example format — delete)* First published. | Says plainly that your letter is yours, that we claim nothing over it, and that you should check what the tool produces before relying on it. |

---

## Format rules — please keep to them

1. **Newest first.** People check the top.
2. **Four columns, always.** The "What it means for you" column is the reason
   this page is worth reading; without it this is a diff, not a communication.
3. **Plain English in both text columns.** "Added a data-processor disclosure" is
   not a change log entry. "Named the companies that serve you this website" is.
4. **Log the boring ones too.** A typo fix gets a row. A log with only dramatic
   entries looks curated, and a curated log is not evidence.
5. **Write the row in the same commit as the change.** Not afterwards.
6. **Never edit or delete a past row.** If a row was wrong, add a new row saying
   so. The value of this page is that it is append-only; an editable change log
   proves nothing.
7. **Keep every version.** `[[Owner: git history is the archive. Consider linking
   each row to its commit — a family, or a court, may one day want to read the
   exact wording that was in force on a particular day. This is the cheapest
   possible evidentiary practice and it is already free, because the repository
   exists.]]`

## Implementation notes

1. Route at `src/app/policy-changes/page.tsx`. Drive it from a typed array in
   `src/config/` so a change is a data edit, not a JSX edit — that is what keeps
   it maintained.
2. Derive the effective date shown on `/privacy`, `/terms`, and the others from
   the **newest row for that document** in the same array, so the dates cannot
   drift from the log. One source of truth.
3. Add to `src/app/sitemap.ts`.
4. Link from the effective-date line at the top of each policy page, not from the
   footer. The person who wants this is already reading a policy and wondering
   whether it is current.
