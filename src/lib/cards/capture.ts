import { CARD_CONSTRAINTS } from "@/lib/content/cards";

/**
 * Zero-dependency card capture: serialize the rendered card DOM into an SVG
 * <foreignObject>, draw it to a canvas, and hand back a PNG blob.
 *
 * This is the exact mechanism the care-card-raster spike proved viable in
 * Chromium and WebKit (spikes/care-card-raster/verify.mjs), and it carries
 * the spike's three hard-won rules verbatim:
 *
 *  1. The SVG must load via a data: URL — a blob: URL taints the canvas in
 *     Chromium and toBlob throws SecurityError (measured in the spike).
 *  2. await img.decode() after onload — onload alone fires before the
 *     embedded data:-URI fonts finish, and glyphs miss the draw.
 *  3. foreignObject content sees NO document stylesheets — font families must
 *     be inlined resolved onto the clone, and every @font-face must ride
 *     inside the SVG as a base64 data: URI.
 */

/* ------------------------------------------------------------------ errors */

export type CaptureStage = "fonts" | "serialize" | "decode" | "draw";

/**
 * Every failure names its stage so the caller can show the house busy/error
 * pattern with something actionable instead of a generic "could not save".
 */
export class CaptureError extends Error {
  readonly stage: CaptureStage;

  constructor(stage: CaptureStage, message: string, cause?: unknown) {
    super(`Card capture failed at ${stage}: ${message}`);
    this.name = "CaptureError";
    this.stage = stage;
    this.cause = cause;
  }
}

/* --------------------------------------------------------------- font CSS */

/**
 * The families the cards use. next/font renames each to a build-time hash
 * ("__Cinzel_abc123"), so matching is by substring of the declared family —
 * the hashed name always contains the human one.
 */
const CARD_FONT_FAMILIES = /cinzel|cormorant|mulish/i;

/** Structural types so the builder is unit-testable without real CSSOM classes. */
export interface FontFaceRuleLike {
  cssText?: string;
  style: { getPropertyValue(name: string): string };
}
export interface StyleSheetLike {
  href?: string | null;
  cssRules?: ArrayLike<unknown>;
}

function isFontFaceRule(rule: unknown): rule is FontFaceRuleLike {
  if (!rule || typeof rule !== "object") return false;
  const r = rule as FontFaceRuleLike;
  return (
    typeof r.cssText === "string" &&
    r.cssText.trimStart().startsWith("@font-face") &&
    typeof r.style?.getPropertyValue === "function"
  );
}

/** First url(...) in an @font-face src, preferring the woff2 candidate. */
export function pickFontUrl(src: string): string | undefined {
  const urls: Array<{ url: string; format?: string }> = [];
  const re = /url\((["']?)([^"')]+)\1\)(?:\s*format\((["']?)([^"')]+)\3\))?/g;
  for (let m = re.exec(src); m; m = re.exec(src)) {
    urls.push({ url: m[2], format: m[4]?.toLowerCase() });
  }
  return (urls.find((u) => u.format === "woff2") ?? urls[0])?.url;
}

function bytesToBase64(bytes: Uint8Array): string {
  // Chunked so a 100KB font never blows the argument limit of String.fromCharCode.
  let binary = "";
  const CHUNK = 0x8000;
  for (let i = 0; i < bytes.length; i += CHUNK) {
    binary += String.fromCharCode(...bytes.subarray(i, i + CHUNK));
  }
  return btoa(binary);
}

/**
 * Builds the @font-face CSS that rides inside the capture SVG: every card
 * font declared in the document's stylesheets, with its src fetched (they are
 * same-origin next/font assets — connect-src 'self' permits it) and embedded
 * as a base64 data: URI. unicode-range is preserved because next/font splits
 * each family into subset faces that depend on it.
 *
 * Injectable sheets/fetch/base so the pure logic is testable in jsdom; the
 * pixel path itself is covered by the raster spike and Phase G's e2e.
 */
export async function buildFontFaceCss(
  sheets: ArrayLike<StyleSheetLike>,
  fetchImpl: (url: string) => Promise<{ ok: boolean; arrayBuffer(): Promise<ArrayBuffer> }>,
  baseHref: string
): Promise<string> {
  const base = new URL(baseHref);
  const rules: Array<{ rule: FontFaceRuleLike; ruleBase: URL }> = [];
  for (const sheet of Array.from(sheets)) {
    let cssRules: ArrayLike<unknown>;
    try {
      cssRules = sheet.cssRules ?? [];
    } catch {
      // A cross-origin sheet throws on cssRules access; card fonts are
      // same-origin, so anything unreadable cannot be one of ours.
      continue;
    }
    // A relative src is relative to the SHEET that declares it, not the page:
    // next/font's production CSS says url(../media/x.woff2) beside
    // /_next/static/css/, which resolved against the page URL is a 404
    // (measured in Phase G). Only an hrefless sheet — inline <style>, or the
    // structural sheets unit tests build — falls back to the document base.
    let ruleBase = base;
    if (sheet.href) {
      try {
        ruleBase = new URL(sheet.href, base);
      } catch {
        // Unparsable href — keep the document base.
      }
    }
    for (const rule of Array.from(cssRules)) {
      if (!isFontFaceRule(rule)) continue;
      const family = rule.style.getPropertyValue("font-family");
      if (CARD_FONT_FAMILIES.test(family)) rules.push({ rule, ruleBase });
    }
  }

  const parts = await Promise.all(
    rules.map(async ({ rule, ruleBase }) => {
      const src = rule.style.getPropertyValue("src");
      const url = pickFontUrl(src);
      if (!url) return "";
      const resolved = new URL(url, ruleBase);
      if (resolved.origin !== base.origin) return ""; // never fetch cross-origin
      const res = await fetchImpl(resolved.href);
      if (!res.ok) throw new CaptureError("fonts", `font fetch failed: ${resolved.pathname}`);
      const bytes = new Uint8Array(await res.arrayBuffer());
      const dataUri = `data:font/woff2;base64,${bytesToBase64(bytes)}`;
      const family = rule.style.getPropertyValue("font-family");
      const style = rule.style.getPropertyValue("font-style") || "normal";
      const weight = rule.style.getPropertyValue("font-weight") || "400";
      const range = rule.style.getPropertyValue("unicode-range");
      return (
        `@font-face{font-family:${family};font-style:${style};font-weight:${weight};` +
        (range ? `unicode-range:${range};` : "") +
        `src:url(${dataUri}) format('woff2');}`
      );
    })
  );
  return parts.filter(Boolean).join("\n");
}

/**
 * Built once per session: the fonts do not change between captures, and the
 * base64 work on ~5 subset faces is the slowest part of the pipeline.
 */
let fontCssCache: Promise<string> | null = null;

function cachedFontCss(): Promise<string> {
  if (!fontCssCache) {
    fontCssCache = buildFontFaceCss(
      document.styleSheets as unknown as ArrayLike<StyleSheetLike>,
      fetch.bind(window),
      document.baseURI
    ).catch((e) => {
      fontCssCache = null; // a transient fetch failure should not poison the session
      throw e;
    });
  }
  return fontCssCache;
}

/* ------------------------------------------------------------- clone inline */

/**
 * Copies each element's RESOLVED font-family onto the clone as an inline
 * style. The component styles fonts via CSS variables, and variables — like
 * every other stylesheet-dependent value — do not exist inside foreignObject;
 * the computed value is the only form that survives serialization.
 *
 * Fonts are the only var()-dependent values on a card: CareCard writes every
 * color as a literal precisely so this walk stays one property wide. If a
 * var() color ever lands in the component, it must be resolved here too.
 */
export function inlineResolvedFonts(source: Element, clone: Element): void {
  if (clone instanceof HTMLElement || clone instanceof SVGElement) {
    const family = getComputedStyle(source).fontFamily;
    if (family) clone.style.fontFamily = family;
  }
  const s = source.children;
  const c = clone.children;
  for (let i = 0; i < s.length && i < c.length; i++) {
    inlineResolvedFonts(s[i], c[i]);
  }
}

/* ---------------------------------------------------------------- markup */

/**
 * XMLSerializer stamps xmlns="http://www.w3.org/1999/xhtml" on the root and
 * keeps the inline icon in the SVG namespace — both required for the markup
 * to be legal foreignObject content.
 */
export function buildSvgMarkup(node: Element, fontCss: string, w: number, h: number): string {
  const xhtml = new XMLSerializer().serializeToString(node);
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${w}" height="${h}">` +
    `<style>${fontCss}</style>` +
    `<foreignObject x="0" y="0" width="${w}" height="${h}">${xhtml}</foreignObject></svg>`
  );
}

export function toSvgDataUrl(svgMarkup: string): string {
  // data: URL, never blob: — spike rule 1.
  return `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svgMarkup)}`;
}

/* ---------------------------------------------------------------- capture */

/**
 * Renders the given card frame (the unscaled 1080x1920 element, i.e. the
 * [data-card-frame] node) to a PNG blob. Throws CaptureError naming the
 * failed stage.
 */
export async function captureCardPng(node: HTMLElement): Promise<Blob> {
  const { w, h } = CARD_CONSTRAINTS.canvas;

  let fontCss: string;
  try {
    // Wait for the document's own fonts first, so computed families resolve
    // to real faces rather than fallbacks mid-swap.
    await document.fonts.ready;
    fontCss = await cachedFontCss();
  } catch (e) {
    if (e instanceof CaptureError) throw e;
    throw new CaptureError("fonts", "could not embed the card fonts", e);
  }

  let svgUrl: string;
  try {
    const clone = node.cloneNode(true) as HTMLElement;
    inlineResolvedFonts(node, clone);
    svgUrl = toSvgDataUrl(buildSvgMarkup(clone, fontCss, w, h));
  } catch (e) {
    throw new CaptureError("serialize", "could not serialize the card", e);
  }

  const img = new Image();
  try {
    await new Promise<void>((resolve, reject) => {
      img.onload = () => resolve();
      img.onerror = () => reject(new Error("SVG image failed to load"));
      img.src = svgUrl;
    });
    // decode() lets the rasterizer finish loading the data:-URI fonts before
    // pixels are sampled — spike rule 2. Some engines reject decode() on SVG
    // even after a successful load; the draw below is the real gate.
    if (img.decode) await img.decode().catch(() => {});
  } catch (e) {
    throw new CaptureError("decode", "the serialized card did not decode", e);
  }

  try {
    const canvas = document.createElement("canvas");
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("2d context unavailable");
    ctx.drawImage(img, 0, 0, w, h);
    const blob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob(resolve, "image/png")
    );
    if (!blob) throw new Error("toBlob returned null (tainted canvas?)");
    return blob;
  } catch (e) {
    if (e instanceof CaptureError) throw e;
    throw new CaptureError("draw", "could not draw the card to a canvas", e);
  }
}
