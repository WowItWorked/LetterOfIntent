import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { BUNDLES, INDEX_CARD } from "@/lib/content/cards";
import { CardTag } from "@/components/cards/CardTag";
import { CardsScreen } from "@/components/cards/CardsScreen";
import { buttonClasses, buttonStyle } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { HomeCareCards } from "@/components/home/HomeCareCards";

export const metadata: Metadata = {
  title: "Care cards: pocket-size help for your phone",
  description:
    "Pocket-size care cards drawn from your Letter of Intent: one topic each, " +
    "sized for a phone screen, ready to text to whoever is stepping in. Free, " +
    "made on your device.",
  alternates: { canonical: "/care-cards" },
};

/**
 * The one cards page: the story, the gallery, the bundles, and — embedded at
 * the bottom — the working picker where a family actually makes theirs
 * (formerly its own route at /letter/cards, which now redirects here).
 */
export default function CareCardsPage() {
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
            Care cards for your phone
          </p>
          <h1 className="mt-3 font-serif text-[clamp(1.85rem,5.5vw,3rem)] font-semibold tracking-[-0.015em] text-onink">
            The letter for the trustee. The cards for the sitter.
          </h1>
          <p className="mt-4 max-w-[72ch] text-lg leading-[1.7] text-oninkbody">
            Pocket-size care cards, drawn from your letter: one topic each, sized for
            a phone screen, ready to message whoever is stepping in.
          </p>
        </div>
      </div>

    <div style={{ padding: "clamp(10px, 2vw, 24px) var(--gutter) clamp(48px, 6vw, 84px)" }}>
      <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>

        {/*
          Real cards, derived from the same sample family as the sample PDFs,
          presented in the same tw-card panel the cards page presents its
          previews in. The panel is also what keeps the axe gate green: the
          CareCard's interior is a fixed visual artifact (aria-hidden behind
          one labelled img role), and axe's contrast rule abstains for text
          under a tw-card exactly as it does on /letter/cards.
        */}
        <div className="tw-card mt-10">
          <div style={{ padding: "26px clamp(20px, 2.6vw, 32px) 22px" }}>
            <HomeCareCards>
              {/* The benefit copy rides inside the gallery grid, filling the
                  last row beside the seventh card. */}
              <Eyebrow>For the person helping tonight</Eyebrow>
              <h2 className="mt-4 font-serif text-[clamp(1.9rem,3vw,2.5rem)] font-semibold leading-[1.15] tracking-[-0.015em] text-ink">
                One card says exactly enough.
              </h2>
              <p className="mt-6 max-w-[62ch] text-lg leading-[1.75]">
                The letter holds the whole story. A care card hands over just the
                piece the moment calls for: the emergency steps, the medications,
                the bedtime routine. One topic per card, in type large enough to
                follow at a glance, at arm&rsquo;s length, on a hard night.
              </p>
              <p className="mt-5 max-w-[62ch] text-lg leading-[1.75]">
                Each card is an image, sized for a phone screen and drawn from what
                you have already written. Save them to your phone (an album of
                their own, or marked as favorites) and they are always on hand:
                message one to tonight&rsquo;s sitter, or send the set to the family
                group chat. No app, no online account, nothing to install.
              </p>
              <p className="mt-5 max-w-[62ch] leading-[1.75] text-muted">
                Like the letter, the cards are free and made entirely on your
                device. Nothing is uploaded, and we never see a word.
              </p>
            </HomeCareCards>
            {/* The cards themselves are stamped SAMPLE now, so the caption no
                longer has to explain that they are examples — only that the
                person is invented. */}
            <p className="mt-4 flex items-center justify-center gap-2.5 text-[0.9375rem] leading-[1.6] text-muted">
              <span className="tw-diamond flex-none" aria-hidden="true" />
              Invented details, not a real person.
            </p>
          </div>
        </div>

        {/* ---------------------------------------------------------- bundles */}
        <div className="mt-[clamp(44px,6vw,72px)]">
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              Think in Bundles
            </Eyebrow>
          </div>
          <h2 className="text-center font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.015em] text-ink">
            Named sets, same cards
          </h2>
          <p className="mx-auto mt-4 max-w-[62ch] text-center text-lg leading-[1.7] text-muted">
            A bundle is a list of card keys and nothing more, so a new one is a line of
            configuration. Families can also hand-pick. Each file downloads named for
            the person &mdash; Danny &mdash; Emergency Protocol.png &mdash; so the
            camera roll stays legible.
          </p>

          {/* One box holding both: the bundle rows on the left, and on the
              right the static Which Cards To Send index card — the same list
              in card form, shipped in every download. The real PNG is shown
              rather than a re-rendering that could drift from what actually
              downloads. */}
          <div
            className="mt-7 overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            <div className="grid lg:grid-cols-[1fr_minmax(300px,360px)]">
              {/* Two-column rows (name beside chips) keep the list compact, so
                  the box stays close to the height of the card it holds. */}
              <ul className="m-0 list-none divide-y divide-line p-0">
                {BUNDLES.map((bundle) => (
                  <li
                    key={bundle.name}
                    className="flex flex-col gap-3 px-[clamp(20px,3vw,34px)] py-5 sm:grid sm:gap-x-7"
                    style={{ gridTemplateColumns: "minmax(150px, 200px) 1fr" }}
                  >
                    <div>
                      <span className="block font-serif text-[1.375rem] font-semibold text-ink">
                        {bundle.name}
                      </span>
                      <span className="mt-1 block text-[0.9375rem] text-muted">
                        {bundle.cards.length} cards
                      </span>
                    </div>
                    <div className="min-w-0">
                      <span className="flex flex-wrap gap-2">
                        {/* Not decorative here: these chips ARE the row's
                            content, so they must reach a screen reader. */}
                        {bundle.cards.map((k) => (
                          <CardTag key={k} cardKey={k} decorative={false} />
                        ))}
                      </span>
                      <span className="mt-3 block text-[0.9375rem] leading-[1.6] text-muted">
                        {bundle.note}
                      </span>
                    </div>
                  </li>
                ))}
              </ul>

              {/* The card sits inside the column, matted: the box's own ground
                  wraps it on every side, and the card keeps its edges — no
                  caption, the card speaks for itself. */}
              <figure className="m-0 flex items-center justify-center border-t border-line bg-surface p-[clamp(22px,2.5vw,34px)] lg:border-l lg:border-t-0">
                <Image
                  src={INDEX_CARD.asset}
                  alt={
                    "The Which Cards To Send index card: the five bundles beside " +
                    "it in card form, one row per hand-off with the color chips " +
                    "of the cards to send."
                  }
                  width={1080}
                  height={1920}
                  className="h-auto w-full max-w-[340px] rounded-[12px]"
                  style={{ boxShadow: "var(--shadow-md)" }}
                />
              </figure>
            </div>
          </div>
        </div>

        {/* Make yours: renders only when the visitor's letter can actually
            light a card — a letter-less visitor sees the story and the CTA,
            not a requirements checklist. The heading lives inside the screen
            so it disappears with the picker. */}
        <CardsScreen embedded />

        <div className="mt-10 flex flex-col items-center gap-4">
          <Link
            href="/letter"
            className={buttonClasses("accent", undefined, "lg")}
            style={buttonStyle("accent")}
          >
            Make your cards
          </Link>
          <p className="text-[0.9375rem] text-muted">The cards draw from your letter.</p>
        </div>
      </div>
    </div>
    </>
  );
}
