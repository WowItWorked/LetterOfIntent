/**
 * A2 — is the autosave reassurance actually visible to the person typing?
 * Measured at phone, zoomed-desktop and desktop widths while typing.
 *
 *   node audit/tools/a2-save-visibility.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2/save-indicator");
const KEY = "twl-loi-letter-v1";
const seed = JSON.stringify({ version: 1, state: { data: {}, meta: { letterPath: "special-needs" } } });

const VPS = [
  ["phone-390", { width: 390, height: 844 }, 1],
  ["zoom200-512", { width: 512, height: 384 }, 2],
  ["desktop-1280", { width: 1280, height: 900 }, 1],
];

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = {};
  for (const [label, vp, dsf] of VPS) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf });
    await ctx.addInitScript(
      ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
      [KEY, seed]
    );
    const page = await ctx.newPage();
    // A long section, so the person is scrolled away from the top while typing.
    await page.goto(`${BASE}/letter/a-typical-day`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForSelector("form textarea", { timeout: 20_000 });

    const areas = page.locator("form textarea");
    const last = areas.nth((await areas.count()) - 1);
    await last.scrollIntoViewIfNeeded();
    await last.click();
    await last.pressSequentially("Bath at seven, then the blue blanket.", { delay: 10 });

    const during = await page.evaluate(() => {
      const el = document.querySelector("[data-save-status]");
      if (!el) return { present: false };
      const r = el.getBoundingClientRect();
      const cs = getComputedStyle(el);
      return {
        present: true,
        status: el.getAttribute("data-save-status"),
        text: (el.innerText || "").trim(),
        rect: { top: Math.round(r.top), h: Math.round(r.height), w: Math.round(r.width) },
        inViewport: r.top < window.innerHeight && r.bottom > 0 && r.width > 0,
        fontSizePx: parseFloat(cs.fontSize),
        scrollY: Math.round(window.scrollY),
      };
    });
    await page.screenshot({ path: path.join(OUT, `${label}--while-typing.png`) });
    await page.waitForTimeout(900);
    const after = await page.evaluate(() => {
      const el = document.querySelector("[data-save-status]");
      const r = el?.getBoundingClientRect();
      return {
        status: el?.getAttribute("data-save-status") ?? null,
        text: (el?.innerText || "").trim(),
        inViewport: r ? r.top < window.innerHeight && r.bottom > 0 && r.width > 0 : false,
        headerIsSticky: (() => {
          const h = document.querySelector("header");
          return h ? getComputedStyle(h).position : null;
        })(),
      };
    });
    await page.screenshot({ path: path.join(OUT, `${label}--after-save.png`) });
    report[label] = { whileTyping: during, afterSave: after };
    console.log(
      `  ${label}: typing -> "${during.text}" visible=${during.inViewport}; ` +
        `saved -> "${after.text}" visible=${after.inViewport}`
    );
    await ctx.close();
  }
  await browser.close();
  await writeFile(path.join(OUT, "measurements.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/save-indicator/");
};
main().catch((e) => { console.error(e); process.exit(1); });
