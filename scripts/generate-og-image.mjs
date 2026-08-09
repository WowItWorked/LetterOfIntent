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

/**
 * Deliberately its own asset, not the document lockup. mloi-lockup-stacked.png
 * is firm.appLogoPath and prints on every PDF cover a family keeps — pointing
 * both at one file would mean a future social-image tweak silently restyling
 * documents that have already been printed and handed to a trustee.
 */
const LOGO = path.resolve("public/social-logo.png");
const OUT = path.resolve("public/og-image.png");
const W = 1200;
const H = 630;

/**
 * White rather than the site's --paper ivory.
 *
 * Both were rendered inside a mocked message bubble and feed card before
 * choosing — see audit/tools/og-compare.mjs. The honest trade: on a white
 * feed card this loses its edge and the artwork floats with no boundary,
 * where ivory would have held a visible warm panel. White wins on being the
 * more predictable neutral across every surface a link gets pasted into,
 * including dark mode, where a warm off-white is the harder colour to place.
 */
const BACKGROUND = "#ffffff";

async function main() {
  const logoBuf = await readFile(LOGO);
  const logoDataUri = `data:image/png;base64,${logoBuf.toString("base64")}`;

  const html = `<!doctype html>
<html><head><meta charset="utf-8"><style>
  html,body{margin:0;padding:0;width:${W}px;height:${H}px;background:${BACKGROUND};}
  .wrap{width:${W}px;height:${H}px;display:flex;align-items:center;justify-content:center;}
  img{max-width:620px;max-height:500px;width:auto;height:auto;}
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
