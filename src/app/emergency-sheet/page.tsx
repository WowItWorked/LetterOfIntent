import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

export const metadata: Metadata = {
  title: "The Emergency Information Sheet: one page with the essentials",
  description:
    "A one-page emergency sheet drawn from your Letter of Intent: allergies, " +
    "medications, who to call. For the fridge, the school office, the sitter, " +
    "the ER. Free, made on your device.",
  alternates: { canonical: "/emergency-sheet" },
};

/** Where one printed page earns its keep — lead phrase set apart from the rest. */
const PLACES = [
  {
    title: "On the fridge",
    lead: "The first place EMTs and sitters are trained to look.",
    body: "The sheet answers their first three questions before anyone has to.",
  },
  {
    title: "The school or program office",
    lead: "One page for the file.",
    body: "The front desk knows the allergies, the medications, and who to call, without leafing through a binder.",
  },
  {
    title: "With the sitter or respite worker",
    lead: "Tucked in the folder or texted as a photo.",
    body: "Whoever is stepping in tonight holds the essentials, not a stack of paperwork.",
  },
  {
    title: "The ER and hospital intake",
    lead: "Hand it over at the desk.",
    body: "Diagnoses, medications, allergies, and the preferred hospital, legible in a hallway at 2 a.m.",
  },
  {
    title: "The car, the go-bag, the wallet",
    lead: "Anywhere your loved one travels.",
    body: "A folded copy weighs nothing and answers everything a stranger would need in the first five minutes.",
  },
];

export default function EmergencySheetPage() {
  return (
    <>
      {/* Full-bleed header band, flush under the privacy strip — the same
          treatment as the letter page. */}
      <div
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
        }}
      >
        <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
          <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
            One page, always ready
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            The Emergency Information Sheet.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            The letter is for reading ahead of time. This is for the moment there is
            no time: one page with the essentials, drawn from what you have already
            written.
          </p>
        </div>
      </div>

    <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
      <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>

        <div
          className="mt-11 grid items-start gap-[clamp(30px,4vw,64px)]"
          style={{
            gridTemplateColumns: "repeat(auto-fit, minmax(min(330px, 100%), 1fr))",
          }}
        >
          <div>
            <Eyebrow>What it holds</Eyebrow>
            <h2 className="mt-3.5 font-serif text-[1.75rem] font-semibold tracking-[-0.01em] text-ink">
              The first five minutes, on one page.
            </h2>
            <p className="mt-[18px] max-w-[56ch] leading-[1.7]">
              Who they are and what they like to be called. Diagnoses, allergies, and
              every medication. How they communicate, and what calms them. Who to
              call, in order, with numbers. And the preferred hospital, so nobody
              has to decide under pressure.
            </p>
            <p className="mt-4 max-w-[56ch] leading-[1.7]">
              It fills itself in from your letter as you write, and carries its own
              &ldquo;updated&rdquo; date, so anyone holding it knows how fresh it
              is. When a medication changes, download it again: one click, current
              everywhere you put it.
            </p>
            <p className="mt-4 max-w-[56ch] text-[0.9375rem] leading-[1.7] text-muted">
              Free, printable, and made entirely on your device. Nothing is uploaded,
              and we never see a word.
            </p>
          </div>

          <Link
            href="/samples/emergency-sheet-disabilities"
            className="group block rounded-[var(--radius-md)] focus-visible:outline-offset-4"
          >
            <span
              className="relative block overflow-hidden rounded-[var(--radius-md)] border border-line bg-white transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] group-hover:-translate-y-[3px] group-hover:border-gold400 motion-reduce:transform-none motion-reduce:transition-none"
              style={{ aspectRatio: "16 / 12", boxShadow: "var(--shadow-sm)" }}
            >
              <Image
                src="/samples/sample-emergency-information-sheet-disabilities.png"
                alt="The sample one-page Emergency Information Sheet, watermarked as a sample"
                fill
                sizes="(max-width: 700px) 90vw, 560px"
                className="object-cover object-top"
              />
              {/* The same solid navy bar the letter-page samples wear — it
                  covers the crop's ragged edge and carries the affordance. */}
              <span
                className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-1.5 py-3 text-xs font-semibold uppercase tracking-[0.14em] text-onink"
                style={{ background: "var(--navy-800)" }}
              >
                Open sample
                <svg
                  aria-hidden="true"
                  viewBox="0 0 24 24"
                  className="size-3 flex-none fill-none stroke-current"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M7 17 17 7M9 7h8v8" />
                </svg>
              </span>
            </span>
          </Link>
        </div>

        <div className="mt-12">
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              Where it goes
            </Eyebrow>
          </div>
          <h2 className="text-center font-serif text-[clamp(1.5rem,3.4vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
            Print it more than once.
          </h2>
          {/* Divided rows rather than a card grid: five cards always leave an
              orphan on the second line, and a stack reads top to bottom the
              way the advice does. */}
          <ul
            className="mt-9 list-none divide-y divide-line overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-0"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {PLACES.map((place, i) => (
              <li
                key={place.title}
                className="flex flex-col gap-2 px-[clamp(20px,3vw,34px)] py-6 sm:grid sm:gap-x-8"
                style={{ gridTemplateColumns: "minmax(180px, 240px) 1fr" }}
              >
                <div>
                  {/* text-accent, not gold600: at 13px this is small text and
                      the lighter gold misses 4.5:1 on white (axe caught it). */}
                  <span
                    aria-hidden="true"
                    className="tw-engraved block text-[13px] tracking-[0.14em] text-accent"
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <h3 className="mt-1 font-serif text-[1.375rem] font-semibold leading-snug text-ink">
                    {place.title}
                  </h3>
                </div>
                {/* text-body, not text-muted: at 15px this is small text and
                    muted misses the 4.5:1 floor (axe caught it). */}
                <p className="self-center text-[0.9375rem] leading-[1.7] sm:border-l sm:border-line sm:pl-8">
                  <strong className="font-semibold text-ink">{place.lead}</strong>{" "}
                  <span className="text-body">{place.body}</span>
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/letter"
            className={buttonClasses("accent", undefined, "lg")}
            style={buttonStyle("accent")}
          >
            Start your letter
          </Link>
          <p className="text-[0.9375rem] text-muted">
            Already writing?{" "}
            <Link
              href="/letter/review"
              className="font-semibold text-accent underline underline-offset-[3px] hover:text-gold700"
            >
              Download your sheet
            </Link>{" "}
            from Review &amp; download.
          </p>
        </div>
      </div>
    </div>
    </>
  );
}
