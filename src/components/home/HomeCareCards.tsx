"use client";

import { useMemo, useSyncExternalStore } from "react";
import { deriveCard } from "@/lib/cards/derive";
import type { CardData } from "@/lib/cards/types";
import { CareCard } from "@/components/cards/CareCard";
import { HOME_CARD_KEYS, SAMPLE_CARD_LETTER } from "@/components/home/sample-card-data";

/**
 * The /care-cards page's gallery: every card, as a real CareCard component
 * derived from the Anderson sample letter (CareCard's own crop-box +
 * transform pattern, at a larger scale than the working page's previews —
 * this page exists to be read).
 *
 * Deliberately the cheap path for a slow connection: no capture, no PNG
 * generation, no pagination measurement — just seven scaled DOM renders. The
 * fixture is kept small enough that each card fits one frame without the
 * pagination the cards page would apply (the unit test on the fixture guards
 * derivation; the fixture's own comment covers size).
 *
 * The cards render only after mount. The page is statically generated, and a
 * card header carries the person's age computed from today's date — HTML baked
 * at build time would disagree with the client the day her birthday passes,
 * and a hydration mismatch is a worse cost than one frame of placeholder.
 * Same-shaped placeholders hold the space so nothing shifts when they arrive.
 */

const SCALE = 0.3;
const CARD_W = Math.round(1080 * SCALE);
const CARD_H = Math.round(1920 * SCALE);

/** Hydration gate without an effect: false in server HTML, true on the client. */
const emptySubscribe = () => () => {};
const clientSnapshot = () => true;
const serverSnapshot = () => false;

export function HomeCareCards({ children }: { children?: React.ReactNode }) {
  const mounted = useSyncExternalStore(emptySubscribe, clientSnapshot, serverSnapshot);

  const cards = useMemo(() => {
    if (!mounted) return [];
    return HOME_CARD_KEYS.map((key) => deriveCard(SAMPLE_CARD_LETTER, key)).filter(
      (c): c is CardData => c !== null
    );
  }, [mounted]);

  return (
    // A grid gallery rather than a scroll strip: at this size the cards are
    // for reading. `children` (the page's benefit copy) leads the grid from
    // the upper-left, spanning two tracks, so seven cards land as
    // text + card / 3 / 3 on a wide screen with no orphan anywhere.
    <div role="group" aria-label="Sample care cards">
      <div className="grid grid-cols-1 justify-items-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
        {children ? (
          <div
            className="min-w-0 justify-self-stretch self-center sm:col-span-2 xl:col-span-2"
            // Aligns the text's left edge with the card rendered below it: a
            // card (324px at SCALE 0.3) centers inside its track, so the
            // two-track cell's inset to that edge is (width − 2·324 − 24px
            // gap) / 4 — the same expression at both the 2- and 3-column
            // breakpoints. Clamped at 0 for the single-column stack.
            style={{ paddingLeft: "max(0px, calc((100% - 672px) / 4))" }}
          >
            {children}
          </div>
        ) : null}
        {cards.length > 0
          ? cards.map((card) => (
              <div key={card.key} className="flex-none">
                <CareCard card={card} scale={SCALE} />
              </div>
            ))
          : HOME_CARD_KEYS.map((key) => (
              <div
                key={key}
                aria-hidden="true"
                className="flex-none rounded-[6px] border border-line bg-surface"
                style={{ width: CARD_W, height: CARD_H, boxShadow: "var(--shadow-sm)" }}
              />
            ))}
      </div>
    </div>
  );
}
