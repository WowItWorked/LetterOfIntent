/**
 * Raster-spike driver: proves (or disproves) that SVG-foreignObject capture
 * reproduces the emergency care card pixel-for-pixel.
 *
 * Per browser it saves a Playwright element screenshot as ground truth, runs
 * the in-page capture, diffs the two IN THE PAGE (canvas ImageData, per-channel
 * tolerance 8 — no image libs in Node), and runs the explicit checks the diff
 * alone would not catch: exact 1080x1920 output, spine column red, spine glyphs
 * present, and a fonts-omitted control capture that must differ substantially.
 *
 *   node spikes/care-card-raster/verify.mjs [--browser=chromium|webkit]
 *
 * Spawns serve.mjs itself on port 4400; artifacts land in out/.
 */
import { spawn } from "node:child_process";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pw from "@playwright/test";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "out");
const PORT = 4400;
const URL_ = `http://localhost:${PORT}/spike.html`;

const browserName = (process.argv.find((a) => a.startsWith("--browser=")) || "--browser=chromium").split("=")[1];
const browserType = pw[browserName];
if (!browserType) {
  console.error(`Unknown browser: ${browserName}`);
  process.exit(2);
}

const dataUrlToBuffer = (dataUrl) => Buffer.from(dataUrl.split(",")[1], "base64");
const bufferToDataUrl = (buf) => "data:image/png;base64," + buf.toString("base64");

/** Wait for the spike server to accept connections. */
async function waitForServer(url, tries = 50) {
  for (let i = 0; i < tries; i++) {
    try {
      const res = await fetch(url);
      if (res.ok) return;
    } catch {
      /* not up yet */
    }
    await new Promise((r) => setTimeout(r, 100));
  }
  throw new Error("spike server never came up on " + url);
}

/**
 * Everything pixel-level runs inside the page: browsers already know how to
 * decode PNGs and hand back ImageData, so Node needs no image dependency.
 * Returns diff stats plus a visual diff (faint grayscale base, red mismatches).
 */
const PAGE_DIFF_FN = async ([aUrl, bUrl, tolerance, structuralTolerance]) => {
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("diff image failed to load"));
    img.src = src;
  });
  const toImageData = (img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return ctx.getImageData(0, 0, c.width, c.height);
  };
  const [imgA, imgB] = await Promise.all([load(aUrl), load(bUrl)]);
  if (imgA.naturalWidth !== imgB.naturalWidth || imgA.naturalHeight !== imgB.naturalHeight) {
    return { sizeMismatch: true,
      a: [imgA.naturalWidth, imgA.naturalHeight], b: [imgB.naturalWidth, imgB.naturalHeight] };
  }
  const A = toImageData(imgA), B = toImageData(imgB);
  const w = A.width, h = A.height, n = w * h;
  const out = new Uint8ClampedArray(n * 4);
  let differing = 0;
  let structural = 0;
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    const d = Math.max(
      Math.abs(A.data[j] - B.data[j]),
      Math.abs(A.data[j + 1] - B.data[j + 1]),
      Math.abs(A.data[j + 2] - B.data[j + 2]),
      Math.abs(A.data[j + 3] - B.data[j + 3])
    );
    if (d > structuralTolerance) structural++;
    if (d > tolerance) {
      differing++;
      out[j] = 255; out[j + 1] = 0; out[j + 2] = 0; out[j + 3] = 255;
    } else {
      const g = (A.data[j] + A.data[j + 1] + A.data[j + 2]) / 3;
      out[j] = g; out[j + 1] = g; out[j + 2] = g; out[j + 3] = 70;
    }
  }
  const c = document.createElement("canvas");
  c.width = w; c.height = h;
  c.getContext("2d").putImageData(new ImageData(out, w, h), 0, 0);
  return { sizeMismatch: false, width: w, height: h, pixels: n, differing, structural,
    pct: (100 * differing) / n, structuralPct: (100 * structural) / n,
    diffDataUrl: c.toDataURL("image/png") };
};

/**
 * Structural checks on the captured PNG itself. The diff proves "same as the
 * DOM"; these prove the risky features are actually THERE — a capture that
 * dropped the spine entirely could still diff cleanly against a broken truth.
 */
const PAGE_CHECK_FN = async ([pngUrl]) => {
  const img = await new Promise((resolve, reject) => {
    const el = new Image();
    el.onload = () => resolve(el);
    el.onerror = () => reject(new Error("check image failed to load"));
    el.src = pngUrl;
  });
  const c = document.createElement("canvas");
  c.width = img.naturalWidth; c.height = img.naturalHeight;
  const ctx = c.getContext("2d", { willReadFrequently: true });
  ctx.drawImage(img, 0, 0);
  const px = (x, y) => ctx.getImageData(x, y, 1, 1).data;

  // Spine column: x=32 is the center of the 64px spine. Background is topic
  // red #A64545 (166,69,69); the vertical label's translucent white glyphs run
  // through this very column, so "most" — not "all" — of the height is red.
  const band = ctx.getImageData(32, 0, 1, img.naturalHeight).data;
  let red = 0;
  for (let y = 0; y < img.naturalHeight; y++) {
    const j = y * 4;
    if (Math.abs(band[j] - 166) <= 40 && Math.abs(band[j + 1] - 69) <= 40 && Math.abs(band[j + 2] - 69) <= 40) red++;
  }

  // Spine glyphs: rgba(255,255,255,.6) over the red gives ~(220,180,180) — a
  // green channel far above the background's 69. Sample the middle band where
  // the centered vertical label must sit.
  let glyph = 0;
  const region = ctx.getImageData(8, 700, 48, 520).data;
  for (let i = 0; i < region.length; i += 4) {
    if (region[i + 1] > 130) glyph++;
  }

  return {
    width: img.naturalWidth,
    height: img.naturalHeight,
    spineRedPct: (100 * red) / img.naturalHeight,
    spineGlyphPixels: glyph,
    cornerPixel: Array.from(px(2, 2)),
  };
};

async function runBrowser() {
  const browser = await browserType.launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  const results = { browser: browserName, checks: {} };
  try {
    await page.goto(URL_, { waitUntil: "networkidle" });
    await page.evaluate(() => document.fonts.ready);

    // (a) Ground truth: what the live DOM actually looks like.
    const truthBuf = await page.locator("#card").screenshot();
    const truthPath = path.join(OUT, `${browserName}-ground-truth.png`);
    await writeFile(truthPath, truthBuf);

    // (b) In-page foreignObject capture, fonts embedded.
    const capturedUrl = await page.evaluate("window.__runCapture(true)");
    const capturedPath = path.join(OUT, `${browserName}-capture.png`);
    await writeFile(capturedPath, dataUrlToBuffer(capturedUrl));

    // Control capture with the font data: URIs deliberately omitted.
    const noFontsUrl = await page.evaluate("window.__runCapture(false)");
    await writeFile(path.join(OUT, `${browserName}-capture-nofonts.png`), dataUrlToBuffer(noFontsUrl));

    // (c) Diff capture vs ground truth, in-page. pctTol8 is the headline
    // number; the PASS gate is the tolerance-64 count, because measurement
    // showed DOM-vs-SVG-image rasterization jitters glyph-edge antialiasing by
    // up to ~107/255 while identical shapes sit under 64 almost everywhere —
    // a real misrender (wrong font: 13.1%, dropped element) blows well past it.
    const diff = await page.evaluate(PAGE_DIFF_FN, [bufferToDataUrl(truthBuf), capturedUrl, 8, 64]);
    if (diff.sizeMismatch) {
      results.checks.diff = { pass: false, detail: `size mismatch: truth ${diff.a} vs capture ${diff.b}` };
    } else {
      await writeFile(path.join(OUT, `${browserName}-diff.png`), dataUrlToBuffer(diff.diffDataUrl));
      results.checks.diff = {
        pass: diff.structuralPct < 0.5,
        pctTol8: Number(diff.pct.toFixed(4)),
        pctTol64: Number(diff.structuralPct.toFixed(4)),
        differingTol8: diff.differing,
        pixels: diff.pixels,
      };
    }

    // (d) Explicit structural checks on the capture.
    const s = await page.evaluate(PAGE_CHECK_FN, [capturedUrl]);
    results.checks.size = { pass: s.width === 1080 && s.height === 1920, width: s.width, height: s.height };
    results.checks.spineRed = { pass: s.spineRedPct >= 60, pct: Number(s.spineRedPct.toFixed(1)) };
    results.checks.spineGlyphs = { pass: s.spineGlyphPixels >= 300, pixels: s.spineGlyphPixels };

    // Font-embed proof: without the data: URI fonts the SVG image falls back to
    // Georgia/Arial, so a substantial pixel delta proves the embedded fonts —
    // not luck — produced the glyphs in the real capture.
    const fontDiff = await page.evaluate(PAGE_DIFF_FN, [capturedUrl, noFontsUrl, 8, 64]);
    results.checks.fontEmbedProof = fontDiff.sizeMismatch
      ? { pass: false, detail: "control capture size mismatch" }
      : { pass: fontDiff.pct >= 0.5, pct: Number(fontDiff.pct.toFixed(4)) };
  } catch (e) {
    results.error = e.message;
  } finally {
    await browser.close();
  }
  return results;
}

await mkdir(OUT, { recursive: true });
const server = spawn(process.execPath, [path.join(ROOT, "serve.mjs"), String(PORT)], { stdio: "ignore" });
try {
  await waitForServer(URL_);
  const results = await runBrowser();
  await writeFile(path.join(OUT, `${browserName}-results.json`), JSON.stringify(results, null, 2));
  console.log(JSON.stringify(results, null, 2));
  const failed = results.error || Object.values(results.checks).some((c) => !c.pass);
  process.exitCode = failed ? 1 : 0;
} finally {
  server.kill();
}
