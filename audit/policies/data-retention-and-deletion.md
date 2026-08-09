# DRAFT — Data Retention and Deletion (client-side storage)

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by Claire
> Kelly, Esq. **Do not publish as-is.** Bracketed `[[…]]` items need real values
> the owner must obtain.

**Suggested placement:** a section of `/your-data` under the anchor `#how-long`,
cross-linked from the privacy policy. **Not a separate page** — the people who
need this are already on `/your-data` looking at the backup button, and sending
them somewhere else loses them.

---

## Why this document exists

**Priority: P0 — and the underlying fact matters more than the document.**

This is the only item in this whole audit that can cost a family their work. The
current privacy page says *"If you or a cleanup tool clear this site's data, the
letter is gone"* — which locates the risk entirely in the user's own action. A
parent who never clears anything will reasonably conclude their letter is safe.

It may not be. The site never calls `navigator.storage.persist()`, so its
`localStorage` and IndexedDB are "best-effort" storage: browsers may evict it
under storage pressure, and Safari in particular clears script-writable storage
after a period without a return visit. The parent described in the brief — the
one who starts at 11pm, gets four sections in, and means to come back — is
exactly the person this hits.

**Legally required?** As a standalone document, no. Retention disclosure is an
element of several state comprehensive laws and of CalOPPA's "process to review
and request changes" requirement, so it has a compliance dimension. But the
reason to write it is the parent, not the statute.

**What it protects against:** a family losing hours of the hardest writing they
will ever do, with no warning that it could happen.

**Who must review:** Claire Kelly for the wording; an engineer for the facts,
which must be verified per browser rather than taken from this draft.

**Maintenance:** annual, plus any time the storage strategy changes.

---

# How long your letter lasts {#how-long}

**Short answer: as long as your browser keeps it — and your browser does not
promise forever. Download a backup.**

## Where it is

| What | Where it is kept | Name |
| --- | --- | --- |
| Your letter | This browser's local storage | `twl-loi-letter-v1` |
| Photographs you added | This browser's IndexedDB | `twl-loi-photos` |
| Where you got to in the video | This browser's local storage | `mloi.video.whatIsALetterOfIntent.position` |

All three live on this device, under this website's name only. No other website
can read them. We cannot read them. There is no copy anywhere else unless you
made one.

## What removes it

**Things you do**

- Clearing this site's data, cookies, or "browsing data" in your browser settings.
- Running a cleanup or privacy tool — many of them clear site storage by default.
- Using [Delete all my data](/your-data), which is the deliberate way to do it.
- Closing a private or incognito window. Nothing written in one survives it.
- Uninstalling the browser, or resetting or replacing the device.

**Things your browser does on its own**

- **When storage runs low.** If your device is nearly full, browsers free up
  space by clearing storage for sites you have not used recently.
- **On iPhone, iPad, and Safari on a Mac, after a period away.** Safari clears
  storage for websites you have not returned to for a while. This is a privacy
  feature and it applies to us like any other site.
  `[[Engineer: verify the current interval against Apple's published behaviour
  before publishing. Do not state a number you have not checked.]]`
- **Some managed or school-issued devices** are set to wipe browser data at
  logout or overnight.

We cannot prevent any of this, and we cannot recover from it, because we never
had a copy.

## What we keep

**Nothing.** We have no server that receives your letter, no database that holds
it, and no backup of it. There is nothing for us to retain and nothing for us to
delete on your behalf. That is the whole design.

## What other companies keep

| Who | What | For how long |
| --- | --- | --- |
| Google Analytics | That a page was opened, plus browser, device, and rough region. Never anything you typed. | `[[Owner: the GA4 property's Data Retention setting — 2 or 14 months. Check GA4 Admin → Data Settings → Data Retention and state it.]]` |
| Google's cookies on your device | Two cookies that let it count returning visits | 400 days from your last visit `[[verified from production 2026-08-09: `_ga` and `_ga_90YXKXB5TC`, expiring 2027-09-13]]` |
| Our hosting companies (Vercel, Cloudflare) | Ordinary web server logs: internet address, time, page requested, browser | `[[Owner: confirm with both vendors and state real numbers. "Ordinary logs" is not a retention period.]]` |

## What to do about it

**Download a backup, and do it more than once.** [Your data](/your-data) →
Download a backup. It is a single file. Put it somewhere that is not this device:
email it to yourself, save it to cloud storage, copy it to a USB stick, or all
three.

A good rhythm: **back up when you finish a session, and again whenever you have
written something you would hate to lose.**

If the worst happens, loading a backup takes one click and puts everything back
exactly as it was.

## Deleting on purpose

[Your data](/your-data) → **Delete all my data**. It clears both stores and then
checks that they are actually gone rather than assuming it.

Two things it cannot reach:

- **Files you already downloaded.** PDFs, the backup file, and the calendar file
  are ordinary files in your Downloads folder. Delete them yourself if you want
  them gone.
- **Copies you shared.** Anything you emailed, printed, or handed to someone is
  theirs now.

**On a shared or public computer** — a library, a school, a family machine —
delete your data before you walk away, and take your backup file with you. Or use
a private window from the start and export a backup before you close it.

---

## Implementation notes — do these before publishing the words

The document is the smaller half of this finding. The code is the larger half.

1. **Call `navigator.storage.persist()`** on the first write to storage. It is a
   handful of lines. On Chromium it materially reduces eviction risk; on Firefox
   it prompts the user; on Safari it is currently a no-op, which is precisely why
   the honest sentence about Safari has to stay.
2. **Record the result** of `navigator.storage.persisted()` and, where
   persistence was **not** granted, show one quiet line near the autosave
   indicator: *"Your browser may clear this if you do not come back for a while.
   Download a backup."* — with the backup link inline.
   **Not a modal. Not a warning banner. Not red.** A parent who is already
   frightened does not need a dialog telling them their work is at risk. The
   register should match the autosave indicator beside it.
3. **Amend the privacy page** at `src/app/privacy/page.tsx:179-181` so the
   browser is named as an actor, not only the user. Suggested replacement text is
   in `privacy-policy-layered.md`, section 02.
4. **Consider prompting for a backup after a meaningful amount of writing** — for
   instance the first time a family finishes a section. Once, gently, dismissible
   forever. This is the single highest-value nudge available and it costs one
   component.
5. **Verify every browser claim in the table above before publishing it.** I did
   not reproduce eviction on a device; I established only that `persist()` is
   never called. Do not publish a specific Safari interval on my word.
