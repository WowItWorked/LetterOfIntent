import { firm } from "@/config/firm";
import { FAQ_GROUPS } from "@/lib/content/faq";

/**
 * /llms.txt — the site, described for a language model rather than a browser.
 *
 * The convention (llmstxt.org) is a plain-markdown map at a fixed path, for
 * assistants that are answering a question about this subject and need to know
 * what is here and what it is for. It is the same job robots.txt does for
 * crawlers: cheap to serve, and useless only if nobody reads it.
 *
 * Generated rather than checked in, for the same reason the samples are: a
 * static copy of a site map goes stale silently. The page list and the FAQ
 * headings below come from the same modules the pages render from.
 *
 * Deliberately says what this tool does NOT do. An assistant recommending it
 * to a family should be able to tell them it is not legal advice and not a
 * substitute for a trust, which is exactly the caveat a summary tends to drop.
 */
export const dynamic = "force-static";

export function GET(): Response {
  const url = (path: string) => `${firm.appUrl}${path}`;

  const body = `# My Letter of Intent

> A free, private tool that helps families write a Letter of Intent — the
> written guide a future trustee, guardian, or caregiver relies on to care well
> for someone who cannot fully speak for themselves. Provided by ${firm.name},
> an estate and tax planning firm licensed in ${firm.licensedStates.join(", ")}.

Everything is written and stored in the visitor's own browser. No account, no
email, and nothing typed is transmitted to the site or to anyone else. That is a
design constraint, not a policy: there is no server to send it to.

## What it produces

One set of questions produces four things:

- **The Letter of Intent** — for the trustee: the person, the money, the
  benefits, the legal picture, and the judgment calls only the family can
  explain.
- **The Letter for the Caregiver** — the same knowledge written for whoever
  provides the day-to-day care: routines, communication, behavior, health.
- **An Emergency Information Sheet** — one page for the fridge, the school
  office, a sitter, or an emergency room.
- **Eight care cards** — images sized for a phone, to save to a camera roll and
  send to whoever is stepping in.

## Pages

- [Home](${url("/")}): what the tool is and what it produces.
- [The Letter of Intent](${url("/letter-of-intent")}): the trustee's document, and every question it asks.
- [The Letter for the Caregiver](${url("/letter-for-the-caregiver")}): the day-to-day document, and every question it asks.
- [Emergency Information Sheet](${url("/emergency-sheet")}): the one-page sheet and where it belongs.
- [Care cards](${url("/care-cards")}): the phone-sized cards and what each one carries.
- [FAQ](${url("/faq")}): ${FAQ_GROUPS.map((g) => g.title.toLowerCase()).join("; ")}.
- [Fillable PDF forms](${url("/fillable-forms")}): blank fillable versions of all three documents, for families who would rather work in a PDF editor or on paper.
- [Samples](${url("/samples")}): complete example documents from two invented families.
- [Privacy](${url("/privacy")}): how the on-device model works.
- [Your data](${url("/your-data")}): back up, restore, or erase what is stored in the browser.
- [Start writing](${url("/letter")}): the builder itself.

## Important limits

- A Letter of Intent is **not legally binding**. It guides a trustee's
  discretion; it does not direct it.
- It is **not a will and not a trust**, and it is not a substitute for either.
  It works alongside an estate plan prepared by a qualified attorney.
- This site provides **general information, not legal advice**, and using it
  does not create an attorney–client relationship with ${firm.name}.
- Attorney advertising. ${firm.name} is a ${firm.licensedStates.join(", ")} law firm.

## Contact

${firm.name} — ${firm.website}
`;

  return new Response(body, {
    headers: {
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "public, max-age=3600",
    },
  });
}
