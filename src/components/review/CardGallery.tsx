"use client";

import Image from "next/image";
import { INDEX_CARD } from "@/lib/content/cards";
import { cardTitle } from "@/lib/cards/status";
import { CareCard } from "@/components/cards/CareCard";
import { pageCards } from "@/components/cards/selection";
import type { CardPack } from "@/components/cards/card-pack";

/**
 * The card pack, shown as cards rather than described as a file.
 *
 * The whole point of this deliverable is that it is a set of pictures for a
 * phone, so the download page shows the pictures. Each tile is the real
 * CareCard at preview scale — the same component the PNG is rasterized from,
 * so what a family sees here is what lands in their camera roll, not an
 * illustration of it.
 *
 * The eighth tile is the static index card, an <Image> rather than a CareCard
 * because it is a fixed asset with no data behind it.
 */

/** Small enough that eight fit on a laptop screen, large enough to read the topic. */
const PREVIEW_SCALE = 0.19;
const CARD_W = 1080;
const CARD_H = 1920;

export function CardGallery({ pack }: { pack: CardPack }) {
  if (!pack.ready) {
    return (
      <p className="mt-4 text-[0.9375rem] text-muted" aria-live="polite">
        Drawing your cards…
      </p>
    );
  }

  // Continuations are real cards with their own file, so they get their own
  // tile — a family counting eight tiles and downloading nine files would
  // reasonably think something had gone wrong.
  const tiles = pack.cards.flatMap(({ key, card, pagination }) =>
    pagination.overflow === "emergency-overflow"
      ? []
      : pageCards(card, pagination.pages).map((page) => ({
          id: `${key}-${page.pageIndex ?? 1}`,
          label:
            page.pageCount && page.pageCount > 1
              ? `${cardTitle(key)} ${page.pageIndex} of ${page.pageCount}`
              : cardTitle(key),
          page,
        }))
  );

  return (
    <div className="mt-5">
      <ul
        className="grid list-none gap-x-5 gap-y-6 p-0"
        style={{
          gridTemplateColumns: `repeat(auto-fill, minmax(${Math.round(CARD_W * PREVIEW_SCALE)}px, 1fr))`,
        }}
      >
        {tiles.map((tile) => (
          <li key={tile.id} className="flex flex-col items-center">
            <span
              className="block overflow-hidden rounded-[var(--radius-sm)] border border-line bg-white"
              style={{
                width: CARD_W * PREVIEW_SCALE,
                height: CARD_H * PREVIEW_SCALE,
                boxShadow: "var(--shadow-sm)",
              }}
            >
              <CareCard card={tile.page} scale={PREVIEW_SCALE} />
            </span>
            <span className="mt-2 text-center text-[0.8125rem] leading-[1.4] text-muted">
              {tile.label}
            </span>
          </li>
        ))}

        <li className="flex flex-col items-center">
          <span
            className="block overflow-hidden rounded-[var(--radius-sm)] border border-line bg-white"
            style={{
              width: CARD_W * PREVIEW_SCALE,
              height: CARD_H * PREVIEW_SCALE,
              boxShadow: "var(--shadow-sm)",
            }}
          >
            <Image
              src={INDEX_CARD.asset}
              alt=""
              width={CARD_W}
              height={CARD_H}
              className="block h-full w-full object-cover"
            />
          </span>
          <span className="mt-2 text-center text-[0.8125rem] leading-[1.4] text-muted">
            {INDEX_CARD.title}
          </span>
        </li>
      </ul>
    </div>
  );
}
