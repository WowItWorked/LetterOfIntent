# DRAFT — Cookies and Storage notice

> ## ⚠️ NOT LEGAL ADVICE — DRAFT FOR ATTORNEY REVIEW
>
> Prepared by an automated auditor who is not a lawyer. For review by privacy
> counsel. **Do not publish as-is.** All cookie facts below were verified against
> production on **2026-08-09** and must be re-verified before publishing.

**Suggested placement: a section of `/privacy`, not a separate page.** Two
cookies do not warrant a page of their own; a standalone Cookie Policy for this
site would be ceremony rather than compliance, and it would split a story that
reads better whole.

---

## Why this document exists

**Priority: P1.**

The current privacy page says *"Google sets its own cookies to do that, and its
privacy terms apply to what it collects"* — accurate, but it names nothing and
links nowhere. The page's best move is inviting readers to verify for themselves
(*"open your browser's developer tools…"*). A reader who accepts that invitation
finds two cookies the page never named. Naming them costs three lines and makes
the invitation stronger.

There is also a contractual angle: the Google Analytics Terms of Service place
notice obligations on the customer, and the conventional way to meet them
includes linking Google's partner-data page. That link is currently absent.
`[[Counsel to verify the current ToS clause text.]]`

**Legally required?** Partly — CalOPPA's third-party and Do-Not-Track elements
are missing today, and CalOPPA has no size threshold.

**Maintenance:** re-check on any analytics change. The cookie lifetime in
particular is set by Google and can change.

---

# What is stored on your device

Two kinds of thing get stored when you use this site. They are very different and
it is worth knowing which is which.

## 1. Your letter — stored, but not a cookie

Your letter is not in a cookie. Cookies are small and get sent to a server with
every request; your letter is neither. It is kept in two larger stores that stay
on your device and are **never sent anywhere**.

| What | Store | Name | How long |
| --- | --- | --- | --- |
| Your letter | Local storage | `twl-loi-letter-v1` | Until you or your browser clears it — [see how long](/your-data#how-long) |
| Photographs you added | IndexedDB | `twl-loi-photos` | Same |
| Where you got to in the video | Local storage | `mloi.video.whatIsALetterOfIntent.position` | Same |

You can see and remove all of it from [Your data](/your-data).

## 2. Cookies — two, both Google's, both for counting

| Cookie | Set by | What it does | How long it lasts |
| --- | --- | --- | --- |
| `_ga` | Google Analytics | Distinguishes one browser from another so visits can be counted | 400 days from your last visit |
| `_ga_90YXKXB5TC` | Google Analytics | Keeps track of a single visit for the same property | 400 days from your last visit |

*Verified in production on 2026-08-09. Both are set on the domain
`.myletterofintent.com`, with `SameSite=Lax`, and both expire 2027-09-13 —
exactly 400 days out, which is the maximum a browser will now accept.*

**We set no cookies of our own.** There are no advertising cookies, no
preference cookies, and no session cookies on this site, because there is no
session and no account.

Google can recognise the same browser across other websites that also use Google
Analytics. That is how the service works and it is worth knowing.
[How Google uses information from sites that use its services](https://policies.google.com/technologies/partner-sites)
· [Google's privacy policy](https://policies.google.com/privacy)

## What the counting actually sends

Every time a page opens, one message goes to Google containing:

- the page address, such as `myletterofintent.com/letter/medical`
- the page title
- your browser, device type, screen size, and language
- roughly which region you are in, worked out from your internet address
- the link that brought you here, if there was one

**That is the entire list, and it does not include anything you typed.** We
checked this by planting distinctive made-up words in every field of a letter and
then examining all 431 requests a full session makes. None of those words appeared
in any of them.

## Turning it off

- **[Google's own opt-out add-on](https://tools.google.com/dlpage/gaoptout)** —
  turns the counting off on every site you visit, not just this one.
- **Any tracker blocker or privacy browser** does the same.
- **Global Privacy Control.** If your browser sends a GPC signal, we do not load
  analytics at all. `[[Do not publish this line until the code exists — see
  A8-010.]]`
- **Do Not Track.** `[[Counsel: CalOPPA requires a statement of how the site
  responds to DNT, whatever the answer is. If DNT is not honoured, say so
  plainly; a truthful "we do not respond to DNT, but we do honour GPC" satisfies
  the element.]]`

**The builder works exactly the same either way.** Nothing about writing,
saving, or downloading your letter depends on analytics.

## Deleting cookies

Clearing this site's data in your browser removes the cookies **and your letter**.
[Download a backup first](/your-data).

---

## Implementation notes

1. Slot this in as `/privacy` section 04b, or fold the tables into the existing
   section 04. Add the anchor to the `CONTENTS` array at
   `src/app/privacy/page.tsx:18-25`.
2. **Set the GA cookies as `Secure`.** They are currently `secure=false`
   (verified in the production capture). GA accepts a `cookie_flags` parameter,
   so this is one line in the `gtag('config', …)` call at
   `src/app/layout.tsx:118-123`: `{ cookie_flags: 'SameSite=Lax;Secure' }`. The
   site is HTTPS-only with a two-year HSTS preload, so there is no downside.
3. **Re-verify the 400-day figure before publishing.** Browser cookie caps and
   Google's own defaults both change.
4. Do not create a separate `/cookies` route.
