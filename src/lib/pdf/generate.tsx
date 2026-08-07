import { pdf } from "@react-pdf/renderer";
import { firm } from "@/config/firm";
import { sanitizeForFilename } from "@/lib/backup";
import { emergencyInfo, letterDateIso, preferredName } from "@/lib/derive";
import type { LetterData } from "@/lib/schema";
import { LoiDocument } from "./loi-document";
import { EmergencyDocument } from "./emergency-document";

/**
 * Everything in this module runs in the browser, on demand (the review screen
 * imports it dynamically so @react-pdf/renderer stays out of the main bundle).
 */

export interface LoadedLogo {
  dataUrl: string;
  /** Intrinsic width / height — measured, so the mark is never stretched. */
  aspect: number;
}

async function loadLogo(): Promise<LoadedLogo | undefined> {
  if (!firm.logoPath || typeof window === "undefined") return undefined;
  try {
    const res = await fetch(firm.logoPath);
    if (!res.ok) return undefined;
    const blob = await res.blob();
    const dataUrl = await new Promise<string | undefined>((resolve) => {
      const reader = new FileReader();
      reader.onload = () => resolve(typeof reader.result === "string" ? reader.result : undefined);
      reader.onerror = () => resolve(undefined);
      reader.readAsDataURL(blob);
    });
    if (!dataUrl) return undefined;
    const aspect = await new Promise<number>((resolve) => {
      const img = document.createElement("img");
      img.onload = () =>
        resolve(img.naturalHeight > 0 ? img.naturalWidth / img.naturalHeight : 1);
      img.onerror = () => resolve(1);
      img.src = dataUrl;
    });
    return { dataUrl, aspect: Math.min(5, Math.max(0.2, aspect)) };
  } catch {
    return undefined;
  }
}

/**
 * Two-pass render: pass 1 records which page each section lands on (via
 * render-prop side effects during layout), pass 2 prints those numbers in the
 * table of contents. Layout is identical between passes, so numbers hold.
 */
export async function generateLetterPdfBlob(data: LetterData): Promise<Blob> {
  const logo = await loadLogo();
  const registry: Record<string, number> = {};
  await pdf(
    <LoiDocument data={data} logo={logo} registry={registry} toc={null} />
  ).toBlob();
  return pdf(
    <LoiDocument data={data} logo={logo} registry={null} toc={registry} />
  ).toBlob();
}

export async function generateEmergencyPdfBlob(data: LetterData): Promise<Blob> {
  return pdf(<EmergencyDocument info={emergencyInfo(data)} />).toBlob();
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
