import { pdf } from "@react-pdf/renderer";
import { firm } from "@/config/firm";
import { documentFilename } from "@/lib/filenames";
import { emergencyInfo, preferredName } from "@/lib/derive";
import { deriveCard } from "@/lib/cards/derive";
import type { CardData } from "@/lib/cards/types";
import { CARD_KEYS, INDEX_CARD } from "@/lib/content/cards";
import { blobToDataUrl, getPhoto } from "@/lib/photos";
import type { LetterData, LetterMeta } from "@/lib/schema";
import { LoiDocument } from "./loi-document";
import { CaregiverDocument } from "./caregiver-document";
import { EmergencyDocument } from "./emergency-document";
import { CardsPrintDocument } from "./cards-print-document";

/**
 * Everything in this module runs in the browser, on demand (the review screen
 * imports it dynamically so @react-pdf/renderer stays out of the main bundle).
 */

export interface LoadedImage {
  dataUrl: string;
  /** Intrinsic width / height — measured, so nothing is stretched. */
  aspect: number;
}

/** Measures an image without drawing it, so aspect ratios are never guessed. */
function measure(dataUrl: string): Promise<number> {
  return new Promise((resolve) => {
    const img = document.createElement("img");
    img.onload = () => resolve(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
    img.onerror = () => resolve(1);
    img.src = dataUrl;
  });
}

async function loadLogo(path: string | null): Promise<LoadedImage | undefined> {
  if (!path || typeof window === "undefined") return undefined;
  try {
    const res = await fetch(path);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const dataUrl = await blobToDataUrl(blob);
    const aspect = await measure(dataUrl);
    return { dataUrl, aspect: Math.min(5, Math.max(0.2, aspect)) };
  } catch {
    return undefined;
  }
}

async function loadPhoto(
  slot: "recent" | "family"
): Promise<(LoadedImage & { caption?: string }) | undefined> {
  try {
    const record = await getPhoto(slot);
    if (!record) return undefined;
    const dataUrl = await blobToDataUrl(record.blob);
    const aspect = await measure(dataUrl);
    return {
      dataUrl,
      aspect: Math.min(5, Math.max(0.2, aspect)),
      caption: record.caption?.trim() || undefined,
    };
  } catch {
    return undefined;
  }
}

/**
 * Two-pass render: pass 1 records which page each section lands on (via
 * render-prop side effects during layout), pass 2 prints those numbers in the
 * table of contents. Layout is identical between passes, so numbers hold.
 * The letter prints the sections this letter's configuration put in play —
 * the meta answers travel with the data.
 */
export async function generateLetterPdfBlob(
  data: LetterData,
  meta: LetterMeta = {},
  opts: { watermark?: boolean } = {}
): Promise<Blob> {
  const [logo, appLogo, familyPhoto] = await Promise.all([
    loadLogo(firm.logoPath),
    loadLogo(firm.appLogoPath),
    opts.watermark ? Promise.resolve(undefined) : loadPhoto("family"),
  ]);
  const registry: Record<string, number> = {};
  await pdf(
    <LoiDocument
      data={data}
      meta={meta}
      watermark={opts.watermark}
      logo={logo}
      appLogo={appLogo}
      familyPhoto={familyPhoto}
      registry={registry}
      toc={null}
    />
  ).toBlob();
  return pdf(
    <LoiDocument
      data={data}
      meta={meta}
      watermark={opts.watermark}
      logo={logo}
      appLogo={appLogo}
      familyPhoto={familyPhoto}
      registry={null}
      toc={registry}
    />
  ).toBlob();
}

/**
 * The Letter for the Caregiver — same two-pass TOC dance as the trustee
 * letter, its own cover and at-a-glance front matter.
 */
export async function generateCaregiverPdfBlob(
  data: LetterData,
  meta: LetterMeta = {},
  opts: { watermark?: boolean } = {}
): Promise<Blob> {
  const [appLogo, familyPhoto] = await Promise.all([
    loadLogo(firm.appLogoPath),
    opts.watermark ? Promise.resolve(undefined) : loadPhoto("family"),
  ]);
  const registry: Record<string, number> = {};
  await pdf(
    <CaregiverDocument
      data={data}
      meta={meta}
      watermark={opts.watermark}
      appLogo={appLogo}
      familyPhoto={familyPhoto}
      registry={registry}
      toc={null}
    />
  ).toBlob();
  return pdf(
    <CaregiverDocument
      data={data}
      meta={meta}
      watermark={opts.watermark}
      appLogo={appLogo}
      familyPhoto={familyPhoto}
      registry={null}
      toc={registry}
    />
  ).toBlob();
}

export async function generateEmergencyPdfBlob(
  data: LetterData,
  opts: { watermark?: boolean } = {}
): Promise<Blob> {
  const [appLogo, photo] = await Promise.all([
    loadLogo(firm.appLogoPath),
    opts.watermark ? Promise.resolve(undefined) : loadPhoto("recent"),
  ]);
  return pdf(
    <EmergencyDocument
      info={emergencyInfo(data)}
      appLogo={appLogo}
      photo={photo}
      watermark={opts.watermark}
    />
  ).toBlob();
}

/**
 * A sample document, generated live from a fixture family — never from the
 * visitor's own letter, never touching the store, and always watermarked.
 * The fixtures cannot go stale: they are LetterData, so they ride every
 * schema change through the same pipeline a real letter does.
 */
export async function generateSamplePdfBlob(
  kind: "letter" | "caregiver" | "emergency",
  family: "high-support" | "aging-parent"
): Promise<Blob> {
  const [{ RUIZ_LETTER, RUIZ_META }, { HALE_LETTER, HALE_META }] = await Promise.all([
    import("@/lib/content/samples/ruiz"),
    import("@/lib/content/samples/hale"),
  ]);
  const data = family === "high-support" ? RUIZ_LETTER : HALE_LETTER;
  const meta = family === "high-support" ? RUIZ_META : HALE_META;
  if (kind === "letter") return generateLetterPdfBlob(data, meta, { watermark: true });
  if (kind === "caregiver") return generateCaregiverPdfBlob(data, meta, { watermark: true });
  return generateEmergencyPdfBlob(data, { watermark: true });
}

/**
 * The print-at-home card sheet: the SAME derived cards as the phone PNGs
 * (one derivation, two renderers), on US Letter with crop marks, plus the
 * static index card on the final sheet.
 *
 * A card that runs long degrades gracefully rather than clipping: trailing
 * blocks past the face's line budget are replaced by a plain pointer to the
 * full letter — the family chooses what to trim, software never silently
 * cuts mid-sentence.
 */
const PRINT_LINE_BUDGET = 26;

function clampCardForPrint(card: CardData): CardData {
  const lineCount = (i: number) => card.blocks[i].lines.length + 1;
  let used = 0;
  let keep = card.blocks.length;
  for (let i = 0; i < card.blocks.length; i++) {
    used += lineCount(i);
    if (used > PRINT_LINE_BUDGET) {
      keep = i;
      break;
    }
  }
  if (keep >= card.blocks.length) return card;
  return {
    ...card,
    blocks: [
      ...card.blocks.slice(0, Math.max(1, keep)),
      {
        label: "There is more",
        lines: [{ v: "This card runs long in print. The full detail is in the letter, and on the phone version of this card." }],
      },
    ],
  };
}

export async function generateCardsPrintPdfBlob(data: LetterData): Promise<Blob> {
  const cards = CARD_KEYS.map((key) => deriveCard(data, key))
    .filter((c): c is CardData => c !== null)
    .map(clampCardForPrint);

  // The static index card, fetched from this site's own public folder —
  // same-origin, no family data in the request.
  let indexCard: { dataUrl: string } | undefined;
  try {
    const res = await fetch(INDEX_CARD.asset);
    if (res.ok) indexCard = { dataUrl: await blobToDataUrl(await res.blob()) };
  } catch {
    // The pack still prints without it.
  }

  return pdf(
    <CardsPrintDocument cards={cards} indexCard={indexCard} personName={preferredName(data)} />
  ).toBlob();
}

/**
 * Filenames carry the document type and the date, never the person's name —
 * see lib/filenames.ts for why.
 */
export function letterPdfFilename(): string {
  return documentFilename("letter");
}

export function caregiverPdfFilename(): string {
  return documentFilename("caregiver");
}

export function emergencyPdfFilename(): string {
  return documentFilename("emergency");
}

export function cardsPrintPdfFilename(): string {
  return documentFilename("cards");
}
