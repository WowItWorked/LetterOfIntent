import { pdf } from "@react-pdf/renderer";
import { firm } from "@/config/firm";
import { sanitizeForFilename } from "@/lib/backup";
import { DEFAULT_PATH } from "@/lib/content/paths";
import { emergencyInfo, letterDateIso, preferredName } from "@/lib/derive";
import { blobToDataUrl, getPhoto } from "@/lib/photos";
import type { LetterData, LetterPath } from "@/lib/schema";
import { LoiDocument } from "./loi-document";
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
 */
export async function generateLetterPdfBlob(
  data: LetterData,
  path: LetterPath = DEFAULT_PATH
): Promise<Blob> {
  const [logo, appLogo, familyPhoto] = await Promise.all([
    loadLogo(firm.logoPath),
    loadLogo(firm.appLogoPath),
    loadPhoto("family"),
  ]);
  const registry: Record<string, number> = {};
  await pdf(
    <LoiDocument
      data={data}
      path={path}
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
      path={path}
      logo={logo}
      appLogo={appLogo}
      familyPhoto={familyPhoto}
      registry={null}
      toc={registry}
    />
  ).toBlob();
}

export async function generateEmergencyPdfBlob(
  data: LetterData,
  path: LetterPath = DEFAULT_PATH
): Promise<Blob> {
  const [appLogo, photo] = await Promise.all([
    loadLogo(firm.appLogoPath),
    loadPhoto("recent"),
  ]);
  return pdf(
    <EmergencyDocument info={emergencyInfo(data, path)} appLogo={appLogo} photo={photo} />
  ).toBlob();
}

function nameSlug(data: LetterData): string {
  const n = preferredName(data);
  return n ? `-${sanitizeForFilename(n)}` : "";
}

export function letterPdfFilename(data: LetterData): string {
  return `Letter-of-Intent${nameSlug(data)}-${letterDateIso(data)}.pdf`;
}

export function emergencyPdfFilename(data: LetterData): string {
  return `Emergency-Sheet${nameSlug(data)}-${letterDateIso(data)}.pdf`;
}
