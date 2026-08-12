import { CARD_CHIP_LABELS, type CardKey } from "@/lib/content/cards";

/**
 * One card's tag: its topic colour and its short name.
 *
 * The same chip in three places — the bundle rows on /care-cards, the index
 * card itself, and now beside every form question that feeds a card. That
 * repetition is the point: a family tagging an answer "Emergency" while they
 * write should meet the identical tag on the card that comes out.
 *
 * Decorative by default. Where the tag is the only thing saying which card a
 * question feeds, the caller keeps a screen-reader sentence alongside it —
 * colour and a two-word chip are not an accessible description on their own.
 */
export function CardTag({
  cardKey,
  decorative = true,
}: {
  cardKey: CardKey;
  decorative?: boolean;
}) {
  return (
    <span
      aria-hidden={decorative ? "true" : undefined}
      className="inline-flex items-center gap-1.5 rounded-full border border-line bg-paper2 px-2.5 py-0.5 text-[0.6875rem] font-semibold uppercase tracking-[0.08em] text-ink"
    >
      <span
        aria-hidden="true"
        className="size-2 flex-none rounded-[2px]"
        style={{ background: `var(--card-${cardKey})` }}
      />
      {CARD_CHIP_LABELS[cardKey]}
    </span>
  );
}
