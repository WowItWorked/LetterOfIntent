/**
 * One-off characterization of the chromium diff: is the 2.6% a structural
 * misrender or sub-pixel glyph jitter? Sweeps the diff tolerance, histograms
 * per-pixel deltas, and saves 3x zoomed side-by-side crops for eyeballing.
 *
 *   node spikes/care-card-raster/analyze.mjs [--browser=chromium|webkit]
 */
import { spawn } from "node:child_process";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import * as pw from "@playwright/test";

const ROOT = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(ROOT, "out");
const PORT = 4400;
const browserName = (process.argv.find((a) => a.startsWith("--browser=")) || "--browser=chromium").split("=")[1];

const toUrl = (buf) => "data:image/png;base64," + buf.toString("base64");

const ANALYZE = async ([aUrl, bUrl, crops]) => {
  const load = (src) => new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("load failed"));
    img.src = src;
  });
  const [imgA, imgB] = await Promise.all([load(aUrl), load(bUrl)]);
  const draw = (img) => {
    const c = document.createElement("canvas");
    c.width = img.naturalWidth; c.height = img.naturalHeight;
    const ctx = c.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0);
    return ctx;
  };
  const A = draw(imgA).getImageData(0, 0, imgA.naturalWidth, imgA.naturalHeight);
  const B = draw(imgB).getImageData(0, 0, imgB.naturalWidth, imgB.naturalHeight);
  const n = A.width * A.height;

  // Tolerance sweep + max-delta histogram
  const tols = [8, 16, 32, 48, 64, 96];
  const counts = new Array(tols.length).fill(0);
  let maxDelta = 0;
  const hist = { "1-8": 0, "9-16": 0, "17-32": 0, "33-64": 0, "65-128": 0, "129-255": 0 };
  for (let i = 0; i < n; i++) {
    const j = i * 4;
    const d = Math.max(
      Math.abs(A.data[j] - B.data[j]),
      Math.abs(A.data[j + 1] - B.data[j + 1]),
      Math.abs(A.data[j + 2] - B.data[j + 2])
    );
    if (d > maxDelta) maxDelta = d;
    if (d >= 1) {
      if (d <= 8) hist["1-8"]++; else if (d <= 16) hist["9-16"]++; else if (d <= 32) hist["17-32"]++;
      else if (d <= 64) hist["33-64"]++; else if (d <= 128) hist["65-128"]++; else hist["129-255"]++;
    }
    for (let t = 0; t < tols.length; t++) if (d > tols[t]) counts[t]++;
  }

  // 3x zoomed side-by-side crops (truth on top, capture below)
  const cropUrls = crops.map(([x, y, w, h]) => {
    const c = document.createElement("canvas");
    c.width = w * 3; c.height = h * 6 + 6;
    const ctx = c.getContext("2d");
    ctx.imageSmoothingEnabled = false;
    ctx.fillStyle = "#00ff00";
    ctx.fillRect(0, 0, c.width, c.height);
    ctx.drawImage(imgA, x, y, w, h, 0, 0, w * 3, h * 3);
    ctx.drawImage(imgB, x, y, w, h, 0, h * 3 + 6, w * 3, h * 3);
    return c.toDataURL("image/png");
  });

  return {
    sweep: Object.fromEntries(tols.map((t, i) => ["tol" + t, Number(((100 * counts[i]) / n).toFixed(4))])),
    hist, maxDelta, cropUrls,
  };
};

const server = spawn(process.execPath, [path.join(ROOT, "serve.mjs"), String(PORT)], { stdio: "ignore" });
try {
  const browser = await pw[browserName].launch();
  const page = await browser.newPage({ viewport: { width: 1200, height: 2000 }, deviceScaleFactor: 1 });
  for (let i = 0; i < 50; i++) {
    try { await page.goto(`http://localhost:${PORT}/spike.html`); break; }
    catch { await new Promise((r) => setTimeout(r, 100)); }
  }
  const truth = await readFile(path.join(OUT, `${browserName}-ground-truth.png`));
  const capture = await readFile(path.join(OUT, `${browserName}-capture.png`));
  // Crops: bold+regular body line, eyebrow row, Cinzel title fragment, spine text
  const crops = [
    [155, 530, 260, 60],   // "Bee stings —" bold Mulish 39px
    [120, 285, 400, 50],   // purpose line, Mulish 400 white-on-red
    [130, 90, 400, 80],    // Cinzel EMERGENCY fragment
    [8, 800, 52, 200],     // vertical spine text
  ];
  const r = await page.evaluate(ANALYZE, [toUrl(truth), toUrl(capture), crops]);
  console.log(JSON.stringify({ sweep: r.sweep, hist: r.hist, maxDelta: r.maxDelta }, null, 2));
  const names = ["crop-bold-body", "crop-purpose", "crop-cinzel", "crop-spine"];
  for (let i = 0; i < names.length; i++) {
    await writeFile(path.join(OUT, `${browserName}-${names[i]}.png`), Buffer.from(r.cropUrls[i].split(",")[1], "base64"));
  }
  await browser.close();
} finally {
  server.kill();
}
