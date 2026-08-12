"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
  type CSSProperties,
} from "react";
import {
  BUNDLES,
  CARD_KEYS,
  type CardBundle,
  type CardKey,
} from "@/lib/content/cards";
import { deriveCard } from "@/lib/cards/derive";
import { paginateCard, type CardPagination } from "@/lib/cards/paginate";
import { cardStatus, cardTitle, type CardStatus } from "@/lib/cards/status";
import type { CardData } from "@/lib/cards/types";
import { cn } from "@/lib/cn";
import { displayName, readerName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { CareCard } from "@/components/cards/CareCard";
import {
  emergencyOverflowCopy,
  overflowNotice,
  oversizedNotice,
} from "@/components/cards/copy";
import {
  pageCards,
  selectionKeys,
  splitByReady,
  type CardSelection,
} from "@/components/cards/selection";
import { buttonClasses } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The cards page: pick a bundle (or individual cards) and preview every page,
 * so a family can see what a hand-off actually contains before they send it.
 * Downloading happens on the review page, which hands over the whole pack as
 * one zip. Everything renders on this device — the page adds no network
 * calls, keeping the privacy gate exactly as it was.
 *
 * Pagination drives the preview: each selected card mounts ONCE at scale 1 in
 * an offscreen (absolutely positioned, aria-hidden, never display:none —
 * fonts and layout must compute) container, paginateCard measures it, and
 * every page then renders as its own scaled preview. Measuring page 1 with
 * all blocks is valid for every page because the header — including the meta
 * line the "2 of 3" marker rides — repeats identically and nothing else on
 * the card moves (Phase F's rule).
 */

const CARD_GAP = "mt-[22px]";
const PREVIEW_SCALE = 0.21;

/** Offscreen but fully laid out: capture and measurement both need real geometry. */
const OFFSCREEN: CSSProperties = {
  position: "absolute",
  left: -20000,
  top: 0,
  width: 1080,
  height: 0,
  overflow: "hidden",
  pointerEvents: "none",
};


/**
 * A measurement remembers WHICH CardData it measured, so a letter edit — a new
 * derived card object — makes the old numbers unmatchable instead of needing a
 * reset effect. Stale entries are simply overwritten on re-measure.
 */
interface Measured {
  card: CardData;
  pagination: CardPagination;
}

export function CardsScreen({ embedded = false }: { embedded?: boolean }) {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);

  const [selection, setSelection] = useState<CardSelection>({ kind: "none" });
  const [measured, setMeasured] = useState<Partial<Record<CardKey, Measured>>>({});

  /* ------------------------------------------------------------ derivation */

  const derived = useMemo(() => {
    const m = new Map<CardKey, CardData>();
    if (!hydrated) return m;
    for (const key of CARD_KEYS) {
      const card = deriveCard(data, key);
      if (card) m.set(key, card);
    }
    return m;
  }, [hydrated, data]);

  const statuses = useMemo(() => {
    const m = new Map<CardKey, CardStatus>();
    if (!hydrated) return m;
    for (const key of CARD_KEYS) m.set(key, cardStatus(data, key));
    return m;
  }, [hydrated, data]);

  const handleMeasured = useCallback((card: CardData, pagination: CardPagination) => {
    setMeasured((prev) =>
      prev[card.key]?.card === card ? prev : { ...prev, [card.key]: { card, pagination } }
    );
  }, []);

  /** The pagination for a key, only if it was measured against the CURRENT card. */
  const paginationFor = (key: CardKey): CardPagination | undefined => {
    const entry = measured[key];
    return entry && entry.card === derived.get(key) ? entry.pagination : undefined;
  };

  /* ------------------------------------------------------------- selection */

  const chosen = selectionKeys(selection);
  const readySet = useMemo(() => new Set(derived.keys()), [derived]);
  const { ready: readyChosen, waiting: waitingChosen } = splitByReady(chosen, readySet);
  const toMeasure = readyChosen.filter((k) => !paginationFor(k));

  const enterIndividual = () =>
    setSelection((prev) =>
      prev.kind === "individual"
        ? prev
        : { kind: "individual", keys: new Set(selectionKeys(prev)) }
    );

  const toggleCard = (key: CardKey) =>
    setSelection((prev) => {
      const keys = new Set(prev.kind === "individual" ? prev.keys : []);
      if (keys.has(key)) keys.delete(key);
      else keys.add(key);
      return { kind: "individual", keys };
    });

  /* --------------------------------------------------------------- render */

  const name = displayName(data);

  // Embedded on the marketing page, a letter-less visitor sees nothing here:
  // the page above already tells the story, and a requirements checklist on a
  // first visit reads as homework. The picker appears the moment their letter
  // can light a card.
  if (!hydrated) {
    if (embedded) return null;
    return (
      <Wrap embedded={embedded} lead="Pocket-size cards drawn from your letter: one topic each, sized for a phone screen.">
        <p className={`${CARD_GAP} text-body`}>Loading your letter…</p>
      </Wrap>
    );
  }

  if (derived.size === 0) {
    if (embedded) return null;
    return (
      <Wrap embedded={embedded} lead="Pocket-size cards drawn from your letter: one topic each, sized for a phone screen, easy to text to whoever is stepping in.">
        <section className={`tw-card ${CARD_GAP}`}>
          <div style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}>
            <h2 className="font-serif text-[1.75rem] font-semibold text-ink">
              The cards draw on the letter, and it needs a little more first.
            </h2>
            <p className="mt-3 max-w-[70ch] leading-[1.7]">
              Nothing here is homework. Each card appears on its own the moment the
              letter holds what it needs:
            </p>
            <ul className="mt-4 list-none space-y-2 p-0">
              {CARD_KEYS.map((key) => (
                <li key={key} className="flex items-start gap-3 text-[0.9375rem] leading-[1.65]">
                  <span className="tw-diamond mt-1.5 flex-none" aria-hidden="true" />
                  <span>{statuses.get(key)?.text}</span>
                </li>
              ))}
            </ul>
            <Link href="/letter" className={buttonClasses("primary", "mt-6")}>
              Back to the letter
            </Link>
          </div>
        </section>
      </Wrap>
    );
  }

  return (
    <Wrap
      embedded={embedded}
      lead={`Pocket-size cards drawn from what you have already written about ${name}, one topic each, sized for a phone screen, easy to text to whoever is stepping in. Every card is drawn right here on your device: nothing is uploaded.`}
    >
      {embedded ? (
        <div className="mt-[clamp(44px,6vw,72px)]">
          <div className="mb-3.5 flex justify-center">
            <Eyebrow align="center" flanked>
              Make yours
            </Eyebrow>
          </div>
          <h2 className="text-center font-serif text-[clamp(1.75rem,4vw,2.5rem)] font-semibold tracking-[-0.015em] text-ink">
            Pick a set and see what it holds.
          </h2>
        </div>
      ) : null}

      {/* ----------------------------------------------------------- picker */}
      <section className={`tw-card ${CARD_GAP}`} aria-labelledby="cards-pick-heading">
        <div style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}>
          <Eyebrow>Pick the moment</Eyebrow>
          <h2
            id="cards-pick-heading"
            className="mt-3 font-serif text-[1.75rem] font-semibold text-ink"
          >
            What kind of hand-off is this?
          </h2>
          <p className="mt-3 max-w-[70ch] leading-[1.7]">
            Each bundle is the small set of cards that moment actually needs. Or skip the
            bundles and choose cards one by one.
          </p>

          <div className="mt-5 grid gap-3 sm:grid-cols-2">
            {BUNDLES.map((bundle) => (
              <BundleTile
                key={bundle.name}
                bundle={bundle}
                active={selection.kind === "bundle" && selection.name === bundle.name}
                readyCount={bundle.cards.filter((k) => readySet.has(k)).length}
                onPick={() => setSelection({ kind: "bundle", name: bundle.name })}
              />
            ))}
            <button
              type="button"
              aria-pressed={selection.kind === "individual"}
              onClick={enterIndividual}
              className={cn(
                "rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
                selection.kind === "individual"
                  ? "border-navy600 bg-paper2"
                  : "border-line bg-surface hover:border-navy600"
              )}
            >
              <span className="block font-semibold text-ink">Individual cards</span>
              <span className="mt-1 block text-[0.9375rem] leading-[1.6] text-muted">
                Choose exactly which cards to make, one checkbox at a time.
              </span>
            </button>
          </div>

          {selection.kind === "individual" ? (
            <fieldset className="mt-5 border-0 p-0">
              <legend className="text-[0.9375rem] font-semibold text-ink">
                The seven cards
              </legend>
              <ul className="mt-3 grid list-none gap-2.5 p-0 sm:grid-cols-2">
                {CARD_KEYS.map((key) => {
                  const ready = readySet.has(key);
                  const checked = selection.keys.has(key);
                  return (
                    <li
                      key={key}
                      className="rounded-[var(--radius-sm)] border border-line bg-paper2 p-3.5"
                    >
                      <label className="flex items-start gap-3">
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={!ready}
                          onChange={() => toggleCard(key)}
                          className="mt-0.5 h-5 w-5 flex-none accent-[var(--navy-700)]"
                        />
                        <span className="min-w-0">
                          <span className="block font-semibold text-ink">
                            {cardTitle(key)}
                          </span>
                          {!ready ? (
                            <span className="mt-0.5 block text-[0.9375rem] leading-[1.6] text-muted">
                              {statuses.get(key)?.text}
                            </span>
                          ) : null}
                        </span>
                      </label>
                    </li>
                  );
                })}
              </ul>
            </fieldset>
          ) : null}
        </div>
      </section>

      {/* ---------------------------------------------------------- preview */}
      {chosen.length > 0 ? (
        <section className={`tw-card ${CARD_GAP}`} aria-labelledby="cards-preview-heading">
          <div style={{ padding: "28px clamp(24px, 2.6vw, 36px) 30px" }}>
            <Eyebrow>Preview</Eyebrow>
            <h2
              id="cards-preview-heading"
              className="mt-3 font-serif text-[1.75rem] font-semibold text-ink"
            >
              {readyChosen.length === 1
                ? "Your card, exactly as it will arrive"
                : "Your cards, exactly as they will arrive"}
            </h2>

            {waitingChosen.length > 0 ? (
              <div className="mt-4 max-w-[74ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4">
                <p className="text-[0.9375rem] leading-[1.65] text-body">
                  {waitingChosen.length === 1
                    ? "One card in this bundle will join the set as the letter grows (never an error, just not ready yet):"
                    : `${waitingChosen.length} cards in this bundle will join the set as the letter grows (never an error, just not ready yet):`}
                </p>
                <ul className="mt-2 list-none space-y-1.5 p-0">
                  {waitingChosen.map((key) => (
                    <li
                      key={key}
                      className="text-[0.9375rem] leading-[1.6] text-muted"
                    >
                      {statuses.get(key)?.text}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}

            <div className="mt-6 space-y-8">
              {readyChosen.map((key) => (
                <CardPreview
                  key={key}
                  cardKey={key}
                  card={derived.get(key)!}
                  pagination={paginationFor(key)}
                  personName={readerName(data)}
                />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      {/* A "Download this set" section stood here, handing over one loose PNG
          per card. The review page now delivers the whole pack as a single
          zip — the same job done better — and two download mechanisms for one
          deliverable is one too many, especially when the worse of them is the
          one a family meets first. This page keeps the work only it does:
          showing which cards a bundle holds, and what each will say. */}
      <p className={`${CARD_GAP} text-[0.9375rem] text-muted`}>
        Your cards download as one zip from{" "}
        <Link
          href="/letter/review"
          className="font-semibold underline underline-offset-[3px]"
        >
          Review &amp; download
        </Link>
        .
      </p>

      {/* Offscreen scale-1 mounts, so pagination can be measured for the
          previews above. No capture host: nothing on this page rasterizes. */}
      <div aria-hidden="true" style={OFFSCREEN}>
        {toMeasure.map((key) => (
          <MeasureMount key={key} card={derived.get(key)!} onMeasured={handleMeasured} />
        ))}
      </div>
    </Wrap>
  );
}

/* ------------------------------------------------------------------ pieces */

function HeaderPanel({ lead }: { lead: string }) {
  return (
    <div
      style={{
        background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
        padding: "clamp(32px, 4.5vw, 56px) var(--gutter) clamp(34px, 4.5vw, 60px)",
      }}
    >
      <div className="mx-auto" style={{ maxWidth: "var(--container)" }}>
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
          A bonus for your phone
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.01em] text-onink">
          Care cards
        </h1>
        <p className="mt-4 max-w-[66ch] text-lg leading-[1.7] text-oninkbody">{lead}</p>
      </div>
    </div>
  );
}

/**
 * Full-bleed header band flush under the privacy strip (the home-page hero
 * treatment), then the page's own centered container. The route page renders
 * the screen bare so the band can reach both edges.
 */
/**
 * Standalone, the screen carries its own header band and container (Shell).
 * Embedded on /care-cards, the host page owns both — the screen renders as a
 * plain anchored section the review page can deep-link to. Module-level on
 * purpose: a component defined inside render would remount on every keystroke.
 */
function Wrap({
  embedded,
  lead,
  children,
}: {
  embedded: boolean;
  lead: string;
  children: React.ReactNode;
}) {
  if (!embedded) return <Shell lead={lead}>{children}</Shell>;
  return (
    <section id="make-yours" style={{ scrollMarginTop: "clamp(76px, 20vw, 140px)" }}>
      {children}
    </section>
  );
}

function Shell({ lead, children }: { lead: string; children: React.ReactNode }) {
  return (
    <>
      <HeaderPanel lead={lead} />
      <div
        className="mx-auto w-full"
        style={{
          maxWidth: "var(--container)",
          padding: "clamp(10px, 2vw, 24px) var(--gutter) 72px",
        }}
      >
        {children}
      </div>
    </>
  );
}

function BundleTile({
  bundle,
  active,
  readyCount,
  onPick,
}: {
  bundle: CardBundle;
  active: boolean;
  readyCount: number;
  onPick: () => void;
}) {
  const total = bundle.cards.length;
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onPick}
      className={cn(
        "rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
        active ? "border-navy600 bg-paper2" : "border-line bg-surface hover:border-navy600"
      )}
    >
      <span className="block font-semibold text-ink">{bundle.name}</span>
      <span className="mt-1 block text-[0.9375rem] leading-[1.6] text-muted">
        {bundle.note}
      </span>
      <span className="mt-1.5 block text-[0.8125rem] font-semibold uppercase tracking-[0.08em] text-accent">
        {readyCount === total
          ? `All ${total} cards ready`
          : `${readyCount} of ${total} cards ready now`}
      </span>
    </button>
  );
}

/**
 * One selected card: its pages as scaled previews, plus any pagination
 * warnings. Until the offscreen measurement lands there is a quiet
 * placeholder, never a spinner — measurement takes a frame or two.
 */
function CardPreview({
  cardKey,
  card,
  pagination,
  personName,
}: {
  cardKey: CardKey;
  card: CardData;
  pagination: CardPagination | undefined;
  personName: string;
}) {
  const title = cardTitle(cardKey);
  if (!pagination) {
    return (
      <div>
        <h3 className="font-sans text-base font-semibold text-ink">{title}</h3>
        <p className="mt-2 text-[0.9375rem] text-muted">Preparing the preview…</p>
      </div>
    );
  }

  const pages = pageCards(card, pagination.pages);
  const emergencyBlocked = pagination.overflow === "emergency-overflow";
  const leftOff = pagination.overflowBlocks.map((i) => card.blocks[i]?.label ?? "");
  const oversized = pagination.oversizedBlocks.map((i) => card.blocks[i]?.label ?? "");

  return (
    <div>
      <h3 className="font-sans text-base font-semibold text-ink">
        {title}
        {pages.length > 1 ? (
          <span className="ml-2 font-normal text-muted">
            {pages.length} cards: it runs long, so it continues
          </span>
        ) : null}
      </h3>
      <div className="mt-3 flex flex-wrap gap-4">
        {pages.map((page, i) => (
          <CareCard key={`${cardKey}-${i}`} card={page} scale={PREVIEW_SCALE} />
        ))}
      </div>

      {emergencyBlocked ? (
        <div className="mt-4 max-w-[62ch] rounded-[var(--radius-sm)] border border-danger bg-dangerbg p-4">
          <p className="font-semibold text-danger">
            This card holds too much to hand to a stranger yet.
          </p>
          <p className="mt-1.5 text-[0.9375rem] leading-[1.65] text-body">
            {emergencyOverflowCopy(personName)}
          </p>
          <p className="mt-2.5 text-[0.9375rem]">
            <Link
              href="/letter/emergency-plan"
              className="font-semibold underline underline-offset-[3px]"
            >
              Open the Emergency plan section
            </Link>
          </p>
        </div>
      ) : null}

      {!emergencyBlocked && leftOff.length > 0 ? (
        <p className="mt-3 max-w-[62ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4 text-[0.9375rem] leading-[1.65] text-body">
          {overflowNotice(leftOff)}
        </p>
      ) : null}

      {oversized.length > 0 ? (
        <p className="mt-3 max-w-[62ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4 text-[0.9375rem] leading-[1.65] text-body">
          {oversizedNotice(oversized)}
        </p>
      ) : null}
    </div>
  );
}

/**
 * Mounts one card at scale 1 purely to be measured, reports its pagination,
 * and is unmounted by the parent once the numbers are in. Fonts settle first:
 * a measurement taken mid font-swap would paginate the fallback face.
 */
function MeasureMount({
  card,
  onMeasured,
}: {
  card: CardData;
  onMeasured: (card: CardData, p: CardPagination) => void;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      try {
        await document.fonts?.ready;
      } catch {
        // Fonts API unavailable — measure with whatever is rendered.
      }
      if (cancelled) return;
      const frame = ref.current?.querySelector<HTMLElement>("[data-card-frame]");
      if (!frame) return;
      onMeasured(card, paginateCard(frame, card));
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [card, onMeasured]);

  return (
    <div ref={ref}>
      <CareCard card={card} scale={1} />
    </div>
  );
}
