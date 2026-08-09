/**
 * Renders the social share image at the standard 1200x630 Open Graph size.
 *
 * Built with Playwright rather than a raster library: the repo already
 * carries Playwright for e2e and the review pack, and laying the logo out in
 * real HTML/CSS means the exact brand color and centering come from the
 * source of truth (globals.css) instead of being retyped as hex literals in
 * a second place that could drift from it.
 *
 * 1200x630 clears Facebook, LinkedIn, and iMessage's rich-link preview without
 * letterboxing or an awkward crop — the dimensions Twitter's "summary_large_image"
 * card and Facebook's og:image guidance both converge on.
 *
 *   node scripts/generate-og-image.mjs
 */
import { chromium } from "playwright";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const LOGO = path.resolve("public/mloi-lockup-stacked.png");
const OUT = path.resolve("public/og-image.png");
const W = 1200;
const H = 630;

async function main() {
  const logoBuf = await readFile(LOGO);
  const logoDataUri = `data:image/png;base64,${logoBuf.toString("base64")}`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${W}px;height:${H}px;background:#fbfaf6;}
  .wrap{width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center;}
  img{max-width:640px;max-height:520px;width:auto;height:auto;}
</style></head>
<body><div class="wrap"><img src="${logoDataUri}" /></div></body></html>`;

  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: W, height: H } });
  await page.setContent(html, { waitUntil: "networkidle" });
  const buf = await page.screenshot({ type: "png" });
  await browser.close();

  await writeFile(OUT, buf);
  console.log(`  ${W}x${H} -> ${OUT} (${(buf.length / 1024).toFixed(0)} KB)`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
