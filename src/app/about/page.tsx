import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { firm } from "@/config/firm";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: `About ${firm.name}`,
  description:
    // attorneyName ends in "Esq." — never place it at the end of a sentence,
    // here or in the copy below, or it renders a doubled full stop.
    `My Letter of Intent is provided free by ${firm.name}, the Virginia law firm ` +
    `${firm.attorneyName} founded. Who is behind the tool, why it costs nothing, ` +
    `and how to reach the firm if you would like to talk with someone.`,
  alternates: { canonical: "/about" },
};

/**
 * Everything on this page is sourced from config/firm.ts. A law firm's own
 * page is the last place to improvise a credential, so no bar admission, year,
 * award, or result appears here that the config does not state — and where a
 * fact is missing, the sentence is left unwritten rather than filled in.
 *
 * The practice list below is the blurb's own parenthetical, split into lines:
 * "estate and tax planning attorney" and "special needs trusts, public
 * benefits, and guardianship". Nothing is added to it.
 */
const PRACTICE = [
  "Estate and tax planning",
  "Special needs trusts",
  "Public benefits",
  "Guardianship",
] as const;

/**
 * The relationship between the firm and the tool, in the three statements the
 * disclaimer makes. Written as cards because each is a separate promise, and a
 * reader looking for the one about becoming a client should not have to parse
 * a paragraph to find it.
 */
const RELATIONSHIP = [
  {
    title: "The firm provides it, free",
    body: (
      <>
        My Letter of Intent is offered by {firm.name} as a free public resource, for
        families writing for someone they care for. There is no account, no fee, and
        nothing to buy at the end of it.
      </>
    ),
  },
  {
    title: "Using it does not make you a client",
    body: (
      <>
        No attorney&ndash;client relationship is formed by using this tool. It describes
        legal concepts in general terms and does not give legal advice about your family
        or your situation.
      </>
    ),
  },
  {
    title: "It sits beside a plan, never instead of one",
    body: (
      <>
        A Letter of Intent is not a will, not a trust, and not legally binding on anyone.
        It works best alongside a special needs trust and a complete estate plan prepared
        with a qualified attorney in your state.
      </>
    ),
  },
] as const;

/** The reach-the-firm facts, as a labelled list rather than a paragraph. */
const CONTACT: { label: string; value: string; href: string; external?: boolean }[] = [
  { label: "Phone", value: firm.phone, href: firm.phoneHref },
  { label: "Email", value: firm.email, href: `mailto:${firm.email}` },
  { label: "Website", value: firm.websiteLabel, href: firm.website, external: true },
];

/**
 * The gap between the page's stacked blocks. One constant because it drifted:
 * the facts card sat at mt-10 while everything below it was mt-14, so the
 * column of boxes stepped 40px, 56px, 56px down the page.
 */
const SECTION_GAP = "mt-14";

export default function AboutPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — the same
          treatment as the document pages and the privacy page. */}
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            The firm behind it
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            About {firm.name}
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            This tool is free, and it is provided by {firm.name} &mdash; the firm founded
            by {firm.attorneyName}, whose practice includes special needs planning.
            Families are told to write a Letter of Intent, and most never do: the blank
            page wins. This asks questions instead.
          </p>
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            Free to use. No account. Using it does not make you a client of the firm.
          </p>
        </div>
      </div>

      <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>

          {/* ------------------------------------------------------ the attorney */}
          <div
            className="mt-11 grid items-start gap-[clamp(30px,4vw,64px)]"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))",
            }}
          >
            <div>
              <Eyebrow>About</Eyebrow>
              <h2 className="mt-3.5 font-serif text-[1.75rem] font-semibold tracking-[-0.01em] text-ink">
                {firm.attorneyName}
              </h2>
              <p className="mt-[18px] max-w-[56ch] leading-[1.7]">{firm.attorneyBioBlurb}</p>
              <p className="mt-4 max-w-[56ch] leading-[1.7]">
                The firm is licensed to practice in{" "}
                {firm.licensedStates.join(" and ")}. Families anywhere are welcome to use
                this tool &mdash; it is free, and everything stays on your own device
                &mdash; but the trust and estate plan a letter belongs beside should be
                prepared with an attorney admitted where you live.
              </p>
              <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
                More about the firm, and the rest of what it does, is at{" "}
                <a
                  href={firm.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
                >
                  {firm.websiteLabel}
                </a>
                .
              </p>
            </div>

            {/* Claire's own headshot from trustsandwealth.com, served from
                this origin rather than hot-linked to the firm's CDN: the
                privacy gate forbids any request leaving the page, and an
                external image would be a request on every visit.

                Alone in this column. It sat above the facts card, which made
                the right side tower over the prose beside it — the card is
                now a full-width row below, where it also gets the space to
                put the practice areas and the contact details side by side
                instead of stacked. */}
            <Image
              src="/claire-kelly.webp"
              alt={`${firm.attorneyName}, founder of ${firm.name}`}
              width={1000}
              height={1000}
              sizes="(max-width: 800px) 100vw, 420px"
              className="block w-full max-w-[420px] justify-self-center rounded-[var(--radius-md)] border border-line"
              style={{ boxShadow: "var(--shadow-sm)" }}
            />
          </div>

          {/* The facts, as one card across the width. */}
          <div className={SECTION_GAP}>
              <div className="tw-card" style={{ boxShadow: "var(--shadow-sm)" }}>
              <div className="px-[clamp(20px,3vw,34px)] pb-7 pt-6">
                <span className="tw-engraved block text-[0.6875rem] tracking-[0.16em] text-accent">
                  {firm.name}
                </span>
                {/* Two columns across the card's width, so the practice areas
                    and the ways to reach the firm sit beside each other
                    instead of one long stack. */}
                <div
                  className="mt-4 grid gap-x-[clamp(24px,4vw,56px)] gap-y-6"
                  style={{
                    gridTemplateColumns:
                      "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
                  }}
                >
                <div>
                {/* "Practice areas", not "Her practice includes": the card can
                    be read a long way from the name the pronoun refers to. */}
                <p className="text-[0.9375rem] font-semibold text-ink">
                  Practice areas
                </p>
                <ul className="mt-2.5 list-none p-0">
                  {PRACTICE.map((area) => (
                    <li
                      key={area}
                      className="mb-2 flex gap-2.5 text-[0.9375rem] leading-[1.6] text-body last:mb-0"
                    >
                      <span className="tw-diamond mt-[8px] flex-none" aria-hidden="true" />
                      <span className="flex-1">{area}</span>
                    </li>
                  ))}
                </ul>
                </div>

                <div>
                <p className="text-[0.9375rem] font-semibold text-ink">Reach the firm</p>
                <dl className="mt-2.5 grid gap-2.5">
                  {CONTACT.map((row) => (
                    <div key={row.label} className="flex flex-wrap items-baseline gap-x-3">
                      <dt className="tw-engraved w-[74px] flex-none text-[0.6875rem] tracking-[0.14em] text-accent">
                        {row.label}
                      </dt>
                      <dd className="min-w-0 flex-1 text-[0.9375rem] leading-[1.6]">
                        <a
                          href={row.href}
                          {...(row.external
                            ? { target: "_blank", rel: "noopener noreferrer" }
                            : {})}
                          className="break-words underline underline-offset-[3px] hover:text-gold700"
                        >
                          {row.value}
                        </a>
                      </dd>
                    </div>
                  ))}
                </dl>
                </div>
                </div>
              </div>
              </div>
          </div>

          {/* ------------------------------------------- talk to the firm */}
          {/* A box inside the page rather than a full-bleed band. Edge to
              edge, it read as the end of the page — the visual language this
              site uses for "you have reached the bottom" — which is wrong for
              a section that now sits in the middle with more to follow. */}
          <section
            className={`${SECTION_GAP} overflow-hidden rounded-[var(--radius-md)]`}
            style={{
              background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
              padding: "clamp(36px, 5vw, 60px) clamp(20px, 3vw, 44px)",
              boxShadow: "var(--shadow-sm)",
            }}
          >
          <div className="mx-auto max-w-[760px] text-center">
            <Eyebrow tone="light" align="center" flanked>
              When you are ready
            </Eyebrow>
            <h2 className="mt-5 font-serif text-[clamp(1.75rem,5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
              Talk it through with someone.
            </h2>
            <p className="mx-auto mt-5 max-w-[58ch] text-lg leading-[1.7] text-oninkbody">
              The letter says how your loved one should be cared for. A trust and an
              estate plan are what make it possible. If you would like to talk through how
              the two fit together, {firm.attorneyName} works with families across{" "}
              {firm.licensedStates.join(" and ")}.
            </p>
          </div>

          {/* A grid rather than a flex row so the two calls to action are the
              same width whatever their labels say, and both wrap alike. */}
          <div className="mx-auto mt-9 grid max-w-[620px] gap-4 sm:grid-cols-2">
            <a
              href={firm.consultUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("accent", "w-full", "lg")}
              style={buttonStyle("accent")}
            >
              Book a consultation
            </a>
            <a
              href={firm.contactUrl}
              target="_blank"
              rel="noopener noreferrer"
              className={buttonClasses("outlineOnInk", "w-full", "lg")}
            >
              Contact {firm.shortName}
            </a>
          </div>
          </section>

          {/* -------------------------------------------- the tool and the firm */}
          <div className={SECTION_GAP}>
            <div className="mb-3.5 flex justify-center">
              <Eyebrow align="center" flanked>
                Where this tool stands
              </Eyebrow>
            </div>
            <h2 className="text-center font-serif text-[clamp(1.5rem,3.4vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
              Written by a firm. Free to everyone. Not legal advice.
            </h2>
            <p className="mx-auto mt-4 max-w-[72ch] text-center text-lg leading-[1.7] text-muted">
              Those three things are all true at once, and it is worth being plain about
              how they fit together before you spend an evening writing.
            </p>

            <div
              className="mt-9 grid gap-6"
              style={{
                gridTemplateColumns: "repeat(auto-fit, minmax(min(300px, 100%), 1fr))",
              }}
            >
              {RELATIONSHIP.map((item) => (
                <div
                  key={item.title}
                  className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
                  style={{ boxShadow: "var(--shadow-sm)" }}
                >
                  <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
                  <div className="flex flex-1 flex-col px-[clamp(20px,3vw,30px)] pb-7 pt-6">
                    <h3 className="font-serif text-[1.375rem] font-semibold leading-snug text-ink">
                      {item.title}
                    </h3>
                    <p className="mt-3 text-[0.9375rem] leading-[1.7] text-body">
                      {item.body}
                    </p>
                  </div>
                </div>
              ))}
            </div>

            {/* One point on the gold ground the site keeps for "read this one".
                Body copy only — gold text on this tint fails contrast, so the
                emphasis is weight and ink, and the control is the navy one. */}
            <div className="mt-6 rounded-[var(--radius-md)] border border-goldline bg-goldtint px-[clamp(20px,3vw,34px)] py-6">
              <p className="mx-auto max-w-[76ch] text-center text-lg leading-[1.7] text-body">
                <strong className="font-semibold text-ink">
                  The firm never sees a word of your letter.
                </strong>{" "}
                Everything you type is written to this browser&rsquo;s own storage and is
                never uploaded &mdash;{" "}
                <Link
                  href="/privacy"
                  className="font-semibold text-ink underline underline-offset-[3px]"
                >
                  how that works, in plain words
                </Link>
                .
              </p>
            </div>
          </div>

          {/* --------------------------------------------------- the fine print */}
          <div className={SECTION_GAP}>
            <Eyebrow>The fine print</Eyebrow>
            <h2 className="mt-3.5 font-serif text-[1.75rem] font-semibold tracking-[-0.01em] text-ink">
              Said once more, in full.
            </h2>
            <hr className="mt-3.5 h-px border-0 bg-line" />
            <p className="mt-5 max-w-[72ch] text-[0.9375rem] leading-[1.8] text-muted">
              {firm.disclaimerFull}
            </p>
            {firm.advertisingNotice ? (
              <p className="mt-5 max-w-[72ch] rounded-[var(--radius-sm)] border border-line bg-paper2 px-5 py-4 text-[0.9375rem] leading-[1.7] text-muted">
                {firm.advertisingNotice}
              </p>
            ) : null}
          </div>
        </div>
      </div>

    </>
  );
}
