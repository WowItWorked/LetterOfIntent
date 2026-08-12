import type { Metadata } from "next";
import Link from "next/link";
import { FillableFormDownloads } from "@/components/forms/FillableFormDownloads";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "Fillable PDF forms: the paper path",
  description:
    "Blank, fillable PDFs of the Letter of Intent, the Letter for the Caregiver, " +
    "and the Emergency Information Sheet. Type into them in Acrobat or Preview, " +
    "or print them and write by hand. Free, and built on your device.",
  alternates: { canonical: "/fillable-forms" },
};

/**
 * Honest about the trade, in both directions. The builder is better for most
 * people and the page says why; the forms are genuinely better for some, and
 * the page says that too rather than treating them as a consolation prize.
 */
const TRADE = [
  {
    title: "What the forms give you",
    points: [
      "Work offline, at a desk, in the PDF editor you already use.",
      "Print them and write by hand, or hand a section to someone else to fill in.",
      "Nothing to learn and nothing to come back to — it is one file.",
    ],
  },
  {
    title: "What the builder gives you",
    points: [
      "It asks only the questions that fit your situation, instead of all of them.",
      "It saves as you go, so ten minutes at a time is enough.",
      "It writes all three documents at once, from one set of answers.",
      // The one thing the forms genuinely cannot do, and the only bullet that
      // links out — the reader has to be able to see what a care card is.
      <>
        It makes the eight{" "}
        <Link
          href="/care-cards"
          className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
        >
          care cards
        </Link>
        , as images for your phone. No form can.
      </>,
      "No box to overflow: an answer can be as long as it needs to be.",
    ],
  },
] as const;

export default function FillableFormsPage() {
  return (
    <>
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            The paper path
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            Fillable PDF forms.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            Blank versions of all three documents, with a box for every question. Type
            into them in Acrobat, Preview, or any PDF editor &mdash; or print them and
            write by hand. The{" "}
            <Link
              href="/care-cards"
              className="font-semibold text-gold400 underline underline-offset-[3px] hover:text-gold300"
            >
              care cards
            </Link>{" "}
            are the one thing these forms cannot make: those are images for your phone,
            and only the builder creates them.
          </p>
          <p className="mt-5 border-t border-navy500 pt-[18px] text-[0.9375rem] text-oninkbody">
            Free, and built on your device when you press the button. Nothing you type
            into them ever comes back here.
          </p>
        </div>
      </div>

      <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <FillableFormDownloads />

          {/* -------------------------------------------------- before you start */}
          <div
            className="mt-12 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="h-[3px]" style={{ background: "var(--gradient-gold)" }} />
            <div className="px-[clamp(20px,3vw,34px)] pb-8 pt-7">
              <h2 className="font-serif text-[1.5rem] font-semibold leading-snug text-ink">
                Two things to know before you start
              </h2>
              <ul className="mt-5 grid list-none gap-3 p-0">
                <li className="flex gap-3 leading-[1.7] text-body">
                  <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                  <span className="flex-1">
                    <strong className="font-semibold text-ink">
                      These forms ask every question.
                    </strong>{" "}
                    The builder is adaptive &mdash; a few questions at the start shape it
                    around the person you care for, and anything that does not fit is
                    never asked. A PDF cannot do that, so it asks everything. Skip what
                    does not apply; nothing is required.
                  </span>
                </li>
                <li className="flex gap-3 leading-[1.7] text-body">
                  <span className="tw-diamond mt-[9px] flex-none" aria-hidden="true" />
                  <span className="flex-1">
                    <strong className="font-semibold text-ink">
                      The boxes are a fixed size.
                    </strong>{" "}
                    If you type past the bottom of one, most PDF readers keep the text on
                    screen but will not print it. The boxes are sized generously, but for
                    a long answer, finish it on a separate sheet &mdash; or use the
                    builder, where an answer can be as long as it needs to be.
                  </span>
                </li>
              </ul>
            </div>
          </div>

          {/* -------------------------------------------------------- the trade */}
          <div
            className="mt-6 grid gap-6"
            style={{
              gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))",
            }}
          >
            {TRADE.map((col) => (
              <div
                key={col.title}
                className="tw-card p-[clamp(20px,2.6vw,30px)]"
                style={{ boxShadow: "var(--shadow-sm)" }}
              >
                <Eyebrow>{col.title}</Eyebrow>
                <ul className="mt-4 grid list-none gap-2.5 p-0">
                  {/* Index keys: one point is markup, not a string, so there
                      is no stable text to key on. The list is static. */}
                  {col.points.map((p, i) => (
                    <li key={i} className="flex gap-3 leading-[1.65] text-body">
                      <span className="tw-diamond mt-[8px] flex-none" aria-hidden="true" />
                      <span className="flex-1">{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-col items-center gap-4">
            <Link
              href="/letter"
              className="inline-flex max-w-full items-center justify-center rounded-[var(--radius-sm)] border-[1.5px] border-transparent px-[34px] py-[15px] text-center text-[15px] font-semibold uppercase leading-tight tracking-[0.04em] text-navy900 transition-[background,color,border-color,transform,box-shadow] duration-[var(--dur-fast)] hover:-translate-y-px hover:brightness-105 motion-reduce:transform-none motion-reduce:transition-none"
              style={{
                background: "var(--gradient-gold)",
                boxShadow: "var(--shadow-gold)",
                minHeight: "52px",
              }}
            >
              Try the builder instead
            </Link>
            <p className="max-w-[70ch] text-center text-[0.9375rem] leading-[1.7] text-muted">
              It is free, there is no account, and you can stop after one section and
              come back. If it is not for you, the forms above are here.
            </p>
          </div>
        </div>
      </div>
    </>
  );
}
