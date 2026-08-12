import { pdf } from "@react-pdf/renderer";
import { firm } from "@/config/firm";
import { documentFilename } from "@/lib/filenames";
import { emergencyInfo } from "@/lib/derive";
import { blobToDataUrl, getPhoto } from "@/lib/photos";
import type { LetterData, LetterMeta } from "@/lib/schema";
import { LoiDocument } from "./loi-document";
import { CaregiverDocument } from "./caregiver-document";
import { EmergencyDocument } from "./emergency-document";

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

/*
 * The print-at-home card sheet was here. It rendered the same derived cards
 * onto US Letter with crop marks — a second renderer for the one derivation.
 *
 * Removed because it answered the wrong question. A care card exists to sit
 * in a camera roll and be sent to whoever is arriving tonight; a PDF cannot
 * be favourited, attached to a text, or opened in Photos, so the print sheet
 * was the least-used form of the most-shared document. The cards now leave as
 * PNGs in a zip (components/cards/card-pack.tsx + lib/zip.ts), which is the
 * form the family actually needs.
 */

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
