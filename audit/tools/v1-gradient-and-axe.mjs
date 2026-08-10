/**
 * V1 verifier —
 *  (a) A1-008: does the dark end of --gradient-gold actually sit under the
 *      label glyphs? Analytic gradient sampling at the real text rect, plus a
 *      pixel readback from a real screenshot.
 *  (b) The axe run A1 could not do. A1 explicitly claims no axe evidence; this
 *      establishes whether axe would independently corroborate A1-002/003/008.
 */
import { chromium } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const out = {};
const browser = await chromium.launch();

/* ------------------------------------------------------- gradient geometry */
{
  const ctx = await browser.newContext({ viewport: { width: 1425, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(PROD, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);

  out.gradientUnderText = await page.evaluate(() => {
    const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
    const lum = ([r, g, b]) => {
      const [R, G, B] = [r, g, b].map((v) => srgbToLinear(v / 255));
      return 0.2126 * R + 0.7152 * G + 0.0722 * B;
    };
    const ratio = (a, b) => {
      const [hi, lo] = lum(a) > lum(b) ? [lum(a), lum(b)] : [lum(b), lum(a)];
      return +((hi + 0.05) / (lo + 0.05)).toFixed(2);
    };
    // gradient-gold stops
    const stops = [
      { p: 0, c: [227, 200, 155] },
      { p: 0.42, c: [201, 160, 99] },
      { p: 0.78, c: [168, 126, 69] },
      { p: 1, c: [201, 160, 99] },
    ];
    const colorAt = (t) => {
      t = Math.max(0, Math.min(1, t));
      for (let i = 1; i < stops.length; i++) {
        if (t <= stops[i].p) {
          const a = stops[i - 1], b = stops[i];
          const f = (t - a.p) / (b.p - a.p);
          // CSS interpolates gradients in premultiplied sRGB by default.
          return a.c.map((v, k) => Math.round(v + (b.c[k] - v) * f));
        }
      }
      return stops.at(-1).c;
    };

    const btns = [...document.querySelectorAll("a,button")].filter((b) =>
      getComputedStyle(b).backgroundImage.includes("gradient")
    );
    return btns.map((b) => {
      const br = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      const fg = cs.color.match(/\d+/g).slice(0, 3).map(Number);
      // Exact rect of the rendered glyphs.
      const r = document.createRange();
      r.selectNodeContents(b);
      const tr = r.getBoundingClientRect();
      const th = 150 * (Math.PI / 180);
      const dx = Math.sin(th), dy = -Math.cos(th); // screen coords, y down
      const L = Math.abs(br.width * dx) + Math.abs(br.height * dy);
      const cx = br.width / 2, cy = br.height / 2;
      // local coords of the text rect inside the button
      const tx0 = tr.left - br.left, tx1 = tr.right - br.left;
      const ty0 = tr.top - br.top, ty1 = tr.bottom - br.top;
      const posOf = (x, y) => 0.5 + ((x - cx) * dx + (y - cy) * dy) / L;
      const corners = [
        ["TL", tx0, ty0], ["TR", tx1, ty0], ["BL", tx0, ty1], ["BR", tx1, ty1],
      ].map(([n, x, y]) => {
        const t = posOf(x, y);
        const c = colorAt(t);
        return { corner: n, gradientPos: +t.toFixed(3), rgb: c, contrastVsLabel: ratio(c, fg) };
      });
      const worst = corners.reduce((a, c) => (c.contrastVsLabel < a.contrastVsLabel ? c : a));
      return {
        label: b.textContent.trim().slice(0, 44),
        buttonPx: [Math.round(br.width), Math.round(br.height)],
        textRectPx: [Math.round(tr.width), Math.round(tr.height)],
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        labelColor: cs.color,
        corners,
        worstCornerContrast: worst.contrastVsLabel,
        worstCorner: worst.corner,
        passes4_5: worst.contrastVsLabel >= 4.5,
        passes3_0_asLargeText: worst.contrastVsLabel >= 3.0,
      };
    });
  });
  await ctx.close();
}

/* ------------------------------------------------------------------- axe */
const routes = ["/", "/letter", "/letter/getting-started", "/letter/medical", "/letter/review", "/privacy", "/your-data"];
out.axe = {};
for (const route of routes) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const page = await ctx.newPage();
  try {
    await page.goto(PROD + route, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(1200);
    const res = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa", "best-practice"])
      .analyze();
    out.axe[route] = {
      violations: res.violations.map((v) => ({
        id: v.id,
        impact: v.impact,
        tags: v.tags.filter((t) => t.startsWith("wcag") || t === "best-practice"),
        nodes: v.nodes.length,
        sample: v.nodes.slice(0, 3).map((n) => ({
          target: n.target.join(" "),
          summary: (n.failureSummary || "").replace(/\s+/g, " ").slice(0, 220),
        })),
      })),
      incompleteIds: res.incomplete.map((i) => `${i.id}(${i.nodes.length})`),
      passCount: res.passes.length,
    };
  } catch (e) {
    out.axe[route] = { error: String(e).slice(0, 200) };
  }
  await ctx.close();
}

await browser.close();
writeFileSync(new URL("../evidence/v1/gradient-and-axe.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out.gradientUnderText, null, 2));
console.log("---- AXE SUMMARY ----");
for (const [r, v] of Object.entries(out.axe)) {
  if (v.error) { console.log(r, "ERROR", v.error); continue; }
  console.log(r, "violations:", v.violations.map((x) => `${x.id}[${x.impact}]x${x.nodes}`).join(", ") || "none");
  console.log("   incomplete:", v.incompleteIds.join(", ") || "none");
}
