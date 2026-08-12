"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { CSSProperties } from "react";
import { CARD_KEYS, INDEX_CARD, type CardKey } from "@/lib/content/cards";
import { captureCardPng } from "@/lib/cards/capture";
import { deriveCard } from "@/lib/cards/derive";
import { cardFilename } from "@/lib/cards/filenames";
import { paginateCard, type CardPagination } from "@/lib/cards/paginate";
import { cardTitle } from "@/lib/cards/status";
import type { CardData } from "@/lib/cards/types";
import { preferredName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { CareCard } from "@/components/cards/CareCard";
import { pageCards } from "@/components/cards/selection";
import type { ZipEntry } from "@/lib/zip";

/**
 * The card pack, as one reusable pipeline: derive every ready card, measure
 * it, rasterize each of its pages to PNG, and add the static index card.
 *
 * This lives apart from CardsScreen because three places now need it — the
 * cards page, the review page's gallery, and the your-data archive — and the
 * sequence is too particular to copy. Every rule here was paid for in the
 * care-card-raster spike:
 *
 *  - The host is offscreen but LAID OUT. Never display:none: fonts and
 *    geometry must compute or the capture draws a blank.
 *  - A card mounts once at scale 1 to be measured, then once per page to be
 *    captured. Two animation frames separate the mount from the read, because
 *    React's commit is not the browser's paint.
 *  - Everything is same-origin: the seven topic cards are drawn from the
 *    letter on this device, and the eighth is a static PNG from public/. No
 *    request carries a word of the letter, which is what keeps the privacy
 *    e2e green.
 */

/** Offscreen but fully laid out: capture and measurement both need geometry. */
export const OFFSCREEN: CSSProperties = {
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
 * reset effect.
 */
export interface Measured {
  card: CardData;
  pagination: CardPagination;
}

/** Mounts one card at scale 1, waits for fonts, and paginates it. */
export function MeasureMount({
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

export interface CardPack {
  /** True once every ready card has been measured and can be captured. */
  ready: boolean;
  /** How many PNGs the pack will contain, index card included. */
  fileCount: number;
  /** The cards that will be in the pack, for a gallery to preview. */
  cards: { key: CardKey; card: CardData; pagination: CardPagination }[];
  /** Rasterize the whole pack. Sequential: eight canvases at once thrashes. */
  buildEntries: (onProgress?: (done: number, total: number) => void) => Promise<ZipEntry[]>;
  /** Mount this somewhere in the tree — the pipeline renders into it. */
  host: React.ReactNode;
}

export function useCardPack(): CardPack {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);

  const [measured, setMeasured] = useState<Partial<Record<CardKey, Measured>>>({});
  const [capture, setCapture] = useState<CardData | null>(null);
  const captureHostRef = useRef<HTMLDivElement>(null);
  const captureReady = useRef<((node: HTMLElement) => void) | null>(null);

  const derived = useMemo(() => {
    const m = new Map<CardKey, CardData>();
    if (!hydrated) return m;
    for (const key of CARD_KEYS) {
      const card = deriveCard(data, key);
      if (card) m.set(key, card);
    }
    return m;
  }, [hydrated, data]);

  const handleMeasured = useCallback((card: CardData, pagination: CardPagination) => {
    setMeasured((prev) =>
      prev[card.key]?.card === card ? prev : { ...prev, [card.key]: { card, pagination } }
    );
  }, []);

  const readyKeys = useMemo(() => [...derived.keys()], [derived]);

  const pagination = useCallback(
    (key: CardKey): CardPagination | undefined => {
      const entry = measured[key];
      return entry && entry.card === derived.get(key) ? entry.pagination : undefined;
    },
    [measured, derived]
  );

  const toMeasure = readyKeys.filter((k) => !pagination(k));
  const ready = readyKeys.length > 0 && toMeasure.length === 0;

  const cards = useMemo(() => {
    const out: CardPack["cards"] = [];
    for (const key of readyKeys) {
      const card = derived.get(key);
      const pag = pagination(key);
      if (!card || !pag) continue;
      out.push({ key, card, pagination: pag });
    }
    return out;
  }, [readyKeys, derived, pagination]);

  /**
   * The jobs, in CARD_KEYS order. An emergency protocol that spills onto a
   * second card is dropped rather than split: a responder holding card 1 of 2
   * is worse off than a family asked to trim it (the rule CardsScreen states).
   */
  const buildJobs = useCallback(() => {
    const person = preferredName(data);
    const jobs: { card: CardData; filename: string }[] = [];
    for (const { key, card, pagination: pag } of cards) {
      if (pag.overflow === "emergency-overflow") continue;
      for (const page of pageCards(card, pag.pages)) {
        jobs.push({
          card: page,
          filename: cardFilename(cardTitle(key), {
            personName: person,
            pageIndex: page.pageIndex,
            pageCount: page.pageCount,
          }),
        });
      }
    }
    return jobs;
  }, [cards, data]);

  const fileCount = ready ? buildJobs().length + 1 : 0;

  // Mount one page, let the browser paint twice, hand its frame to capture.
  useEffect(() => {
    if (!capture) return;
    const host = captureHostRef.current;
    if (!host) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const frame = host.querySelector<HTMLElement>("[data-card-frame]");
        const resolve = captureReady.current;
        captureReady.current = null;
        if (frame && resolve) resolve(frame);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [capture]);

  const renderForCapture = useCallback(
    (card: CardData) =>
      new Promise<HTMLElement>((resolve) => {
        captureReady.current = resolve;
        setCapture(card);
      }),
    []
  );

  const buildEntries = useCallback(
    async (onProgress?: (done: number, total: number) => void): Promise<ZipEntry[]> => {
      const jobs = buildJobs();
      const total = jobs.length + 1;
      const entries: ZipEntry[] = [];

      for (let i = 0; i < jobs.length; i++) {
        onProgress?.(i, total);
        const frame = await renderForCapture(jobs[i].card);
        const png = await captureCardPng(frame);
        entries.push({
          name: jobs[i].filename,
          bytes: new Uint8Array(await png.arrayBuffer()),
        });
      }

      // The eighth card: a fixed asset from this site's own public folder, so
      // the request is same-origin and carries nothing about the family.
      onProgress?.(jobs.length, total);
      const res = await fetch(INDEX_CARD.asset);
      if (!res.ok) throw new Error(`index card fetch failed: ${res.status}`);
      entries.push({
        name: cardFilename(INDEX_CARD.title),
        bytes: new Uint8Array(await (await res.blob()).arrayBuffer()),
      });

      onProgress?.(total, total);
      setCapture(null);
      return entries;
    },
    [buildJobs, renderForCapture]
  );

  const host = (
    <>
      <div aria-hidden="true" style={OFFSCREEN}>
        {toMeasure.map((key) => (
          <MeasureMount key={key} card={derived.get(key)!} onMeasured={handleMeasured} />
        ))}
      </div>
      <div ref={captureHostRef} aria-hidden="true" style={OFFSCREEN}>
        {capture ? <CareCard card={capture} scale={1} /> : null}
      </div>
    </>
  );

  return { ready, fileCount, cards, buildEntries, host };
}
