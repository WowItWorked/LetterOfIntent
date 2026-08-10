/**
 * A2 / P2 — evidence screenshots at the grandparent's zoom level.
 * 1024x768 window at 200% browser zoom is approximated as a 512x384 CSS-pixel
 * viewport at deviceScaleFactor 2. This reproduces the layout consequence, not
 * the browser's own font boosting.
 *
 *   node audit/tools/a2-zoom-shots.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2/zoom-200");
const KEY = "twl-loi-letter-v1";
const seed = JSON.stringify({
  version: 1,
  state: {
    data: { gettingStarted: { authorName: "Maria Alvarez", subjectPreferredName: "Alex" } },
    meta: { letterPath: "special-needs" },
  },
});

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = {};
  for (const [label, vp] of [
    ["zoom200-512x384", { width: 512, height: 384, deviceScaleFactor: 2 }],
    ["zoom100-1024x768", { width: 1024, height: 768, deviceScaleFactor: 1 }],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: vp.width, height: vp.height }, deviceScaleFactor: vp.deviceScaleFactor });
    await ctx.addInitScript(
      ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
      [KEY, seed]
    );
    const page = await ctx.newPage();
    for (const [n, r] of [["home", "/"], ["wizard", "/letter/getting-started"], ["review", "/letter/review"]]) {
      await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 90_000 });
      await page.waitForTimeout(700);
      await page.screenshot({ path: path.join(OUT, `${n}--${label}.png`), fullPage: false });
      const m = await page.evaluate(() => {
        const h = document.querySelector("header");
        const strip = h?.nextElementSibling;
        const hh = h ? h.getBoundingClientRect().height : 0;
        const sh = strip && strip.tagName !== "MAIN" ? strip.getBoundingClientRect().height : 0;
        const firstQ = document.querySelector("form label, article h1");
        return {
          viewportH: window.innerHeight,
          headerH: Math.round(hh),
          stripH: Math.round(sh),
          chromePctOfViewport: Math.round(((hh + sh) / window.innerHeight) * 100),
          usableRows: Math.round(window.innerHeight - hh - sh),
          firstThingY: firstQ ? Math.round(firstQ.getBoundingClientRect().top + window.scrollY) : null,
          docHeight: document.documentElement.scrollHeight,
          screens: +(document.documentElement.scrollHeight / window.innerHeight).toFixed(1),
        };
      });
      report[`${n}@${label}`] = m;
      console.log(`  ${n} ${label}: header ${m.headerH}px + strip ${m.stripH}px = ${m.chromePctOfViewport}% of a ${m.viewportH}px viewport; ${m.screens} screens tall`);
    }
    await ctx.close();
  }
  await browser.close();
  await writeFile(path.join(OUT, "measurements.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/zoom-200/");
};
main().catch((e) => { console.error(e); process.exit(1); });
