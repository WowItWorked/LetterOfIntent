/**
 * V1 verifier — A1-008 decided by real painted pixels, not geometry argument.
 * Screenshots the gold accent button, decodes the PNG back inside the page via
 * canvas (no new npm dependency), then for every non-glyph pixel inside the
 * label's bounding box computes contrast against the navy label colour.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1425, height: 900 }, deviceScaleFactor: 1 });
const page = await ctx.newPage();
await page.goto(PROD, { waitUntil: "networkidle" });
await page.waitForTimeout(1500);

const targets = await page.evaluate(() => {
  const btns = [...document.querySelectorAll("a,button")].filter((b) =>
    getComputedStyle(b).backgroundImage.includes("gradient")
  );
  return btns.map((b, i) => {
    b.setAttribute("data-v1", String(i));
    const br = b.getBoundingClientRect();
    const r = document.createRange();
    r.selectNodeContents(b);
    const tr = r.getBoundingClientRect();
    return {
      i,
      label: b.textContent.trim().slice(0, 40),
      color: getComputedStyle(b).color,
      textBox: {
        x: Math.round(tr.left - br.left), y: Math.round(tr.top - br.top),
        w: Math.round(tr.width), h: Math.round(tr.height),
      },
    };
  });
});

const out = [];
for (const t of targets) {
  const buf = await page.locator(`[data-v1="${t.i}"]`).screenshot();
  const dataUrl = "data:image/png;base64," + buf.toString("base64");
  const res = await page.evaluate(
    async ({ dataUrl, t }) => {
      const img = new Image();
      img.src = dataUrl;
      await img.decode();
      const c = document.createElement("canvas");
      c.width = img.width; c.height = img.height;
      const g = c.getContext("2d", { willReadFrequently: true });
      g.drawImage(img, 0, 0);
      const d = g.getImageData(0, 0, c.width, c.height).data;
      const s2l = (v) => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
      const lum = (r, gg, b) => 0.2126 * s2l(r / 255) + 0.7152 * s2l(gg / 255) + 0.0722 * s2l(b / 255);
      const [fr, fg, fb] = t.color.match(/\d+/g).slice(0, 3).map(Number);
      const fl = lum(fr, fg, fb);
      const ratio = (a, b) => { const [hi, lo] = a > b ? [a, b] : [b, a]; return (hi + 0.05) / (lo + 0.05); };
      let min = Infinity, minAt = null, below = 0, counted = 0, glyph = 0;
      for (let py = Math.max(0, t.textBox.y); py < Math.min(c.height, t.textBox.y + t.textBox.h); py++) {
        for (let px = Math.max(0, t.textBox.x); px < Math.min(c.width, t.textBox.x + t.textBox.w); px++) {
          const i = (c.width * py + px) << 2;
          const r = d[i], gg = d[i + 1], b = d[i + 2];
          const L = lum(r, gg, b);
          if (L < 0.16) { glyph++; continue; } // navy ink + its antialiasing
          counted++;
          const cr = ratio(L, fl);
          if (cr < min) { min = cr; minAt = { px, py, rgb: [r, gg, b] }; }
          if (cr < 4.5) below++;
        }
      }
      return {
        png: [c.width, c.height],
        glyphPixelsSkipped: glyph,
        backgroundPixelsSampled: counted,
        minContrastUnderLabel: +min.toFixed(3),
        minAt,
        pixelsBelow4_5: below,
        pctOfLabelBoxBelow4_5: +((below / Math.max(1, counted)) * 100).toFixed(1),
      };
    },
    { dataUrl, t }
  );
  out.push({ label: t.label, labelColor: t.color, textBox: t.textBox, ...res });
}

await browser.close();
writeFileSync(new URL("../evidence/v1/gradient-pixels.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
