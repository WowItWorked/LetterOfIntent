import type { Metadata } from "next";
import Link from "next/link";
import { firm } from "@/config/firm";
import { FAQ_GROUPS, allFaqItems } from "@/lib/content/faq";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";

export const metadata: Metadata = {
  title: "Letter of Intent FAQ: what trustees need, and how to keep it current",
  description:
    "Answers to what a Letter of Intent is, whether it is legally binding, what " +
    "belongs in it, how often to update it, and who should hold a copy — for " +
    "families writing one for a trustee or guardian. Free, and written on your " +
    "own device.",
  alternates: { canonical: "/faq" },
  openGraph: {
    title: "Letter of Intent FAQ",
    description:
      "What a Letter of Intent is, what belongs in it, how often to update it, " +
      "and who reads it. Written for families planning for a loved one's future.",
    url: "/faq",
    type: "article",
  },
};

/**
 * The FAQ, and the machine-readable copy of it.
 *
 * Both come from lib/content/faq.ts. The structured data is not a second
 * hand-written version of the page — it is generated from the same array the
 * page renders, so the two cannot drift. Structured data that disagrees with
 * the page it describes is worse than none: it is the version assistants
 * quote, and nobody proof-reads it because nobody sees it.
 *
 * Answers are in the markup rather than behind a disclosure. A <details> body
 * is technically in the DOM, but this page exists to be read by people
 * scanning for one fact, by crawlers, and by assistants pulling a single
 * answer out of context — and all three are better served by text that is
 * simply there.
 */
export default function FaqPage() {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: allFaqItems().map((item) => ({
      "@type": "Question",
      name: item.q,
      acceptedAnswer: { "@type": "Answer", text: item.a },
    })),
  };

  return (
    <>
      {/* The only dangerouslySetInnerHTML on the site, and it is the standard
          way to emit JSON-LD. The payload is JSON.stringify of an object built
          from a checked-in module — no user input reaches it, and there is no
          user input on this page to reach it. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            Questions &amp; answers
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            The Letter of Intent, answered.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            What it is, what belongs in it, how often to update it, and who ends up
            reading it. Written for families planning for someone who will need help
            after they are gone.
          </p>
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            General information, not legal advice. A Letter of Intent works alongside a
            plan your attorney prepares &mdash; never instead of one.
          </p>
        </div>
      </div>

      <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          {/* ------------------------------------------------------------ jump */}
          <nav
            aria-label="On this page"
            className="mt-10 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
            <div className="px-[clamp(20px,3vw,34px)] pb-6 pt-5">
              <p className="tw-engraved text-xs tracking-[0.22em] text-accent">
                On this page
              </p>
              <ul
                className="mt-4 grid list-none gap-x-8 gap-y-2.5 p-0"
                style={{
                  gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))",
                }}
              >
                {FAQ_GROUPS.map((group) => (
                  <li key={group.id} className="flex gap-3 leading-[1.6]">
                    <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                    <a
                      href={`#${group.id}`}
                      className="flex-1 font-semibold text-accent underline-offset-[3px] hover:underline"
                    >
                      {group.title}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </nav>

          {/* --------------------------------------------------------- the answers */}
          {FAQ_GROUPS.map((group) => (
            <section key={group.id} id={group.id} className="mt-14">
              {/* The heading only. An Eyebrow above it printed the same words
                  in small caps directly over the same words in serif. */}
              <h2 className="font-serif text-[clamp(1.5rem,3.4vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
                {group.title}
              </h2>
              <p className="mt-2.5 max-w-[68ch] leading-[1.7] text-muted">{group.lead}</p>
              <div className="mt-7 grid gap-5">
                {group.items.map((item) => (
                  <article
                    key={item.q}
                    className="tw-card px-[clamp(20px,3vw,32px)] pb-7 pt-6"
                    style={{ boxShadow: "var(--shadow-sm)" }}
                  >
                    <h3 className="font-serif text-[1.3rem] font-semibold leading-snug text-ink">
                      {item.q}
                    </h3>
                    <p className="mt-3 max-w-[76ch] leading-[1.75] text-body">{item.a}</p>
                  </article>
                ))}
              </div>
            </section>
          ))}

          {/* ------------------------------------------------------------ where next */}
          <div
            className="mt-14 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
            <div className="px-[clamp(20px,3vw,34px)] pb-8 pt-7">
              <h2 className="font-serif text-[1.5rem] font-semibold leading-snug text-ink">
                Where to go from here
              </h2>
              <ul className="mt-5 grid list-none gap-3 p-0">
                <li className="flex gap-3 leading-[1.7] text-body">
                  <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                  <span className="flex-1">
                    <Link
                      href="/letter-of-intent"
                      className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
                    >
                      What the Letter of Intent covers
                    </Link>{" "}
                    &mdash; the document itself, and every question it asks.
                  </span>
                </li>
                <li className="flex gap-3 leading-[1.7] text-body">
                  <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                  <span className="flex-1">
                    <Link
                      href="/letter-for-the-caregiver"
                      className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
                    >
                      The Letter for the Caregiver
                    </Link>{" "}
                    &mdash; the same knowledge, written for whoever gives the day-to-day
                    care.
                  </span>
                </li>
                <li className="flex gap-3 leading-[1.7] text-body">
                  <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                  <span className="flex-1">
                    <Link
                      href="/fillable-forms"
                      className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
                    >
                      Fillable PDF forms
                    </Link>{" "}
                    &mdash; if you would rather work at a desk in Acrobat, or on paper.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/letter"
              className={buttonClasses("accent", undefined, "lg")}
              style={buttonStyle("accent")}
            >
              Start your letter
            </Link>
            <p className="max-w-[70ch] text-center text-[0.9375rem] leading-[1.7] text-muted">
              Free, no account, and you can stop after one section and come back. Nothing
              you type leaves your device until you decide to share it.
            </p>
          </div>

          <p className="mx-auto mt-12 max-w-[76ch] text-center text-[0.8125rem] leading-[1.7] text-muted">
            {firm.disclaimerFull}
          </p>
        </div>
      </div>
    </>
  );
}
