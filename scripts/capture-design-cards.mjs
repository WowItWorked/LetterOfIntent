/**
 * Captures live, hydrated screens of the LOI Builder as self-contained HTML
 * files for the Trusts & Wealth Design System project (Claude Design).
 *
 * Usage:  node scripts/capture-design-cards.mjs <outputDir> [baseUrl]
 * Needs the dev (or prod) server already running at baseUrl (default :3000).
 */
import { chromium } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { FULL_LETTER } from "../e2e/fixture.ts";

const outDir = process.argv[2];
const baseUrl = process.argv[3] ?? "http://localhost:3000";
if (!outDir) {
  console.error("Usage: node scripts/capture-design-cards.mjs <outputDir> [baseUrl]");
  process.exit(1);
}
fs.mkdirSync(outDir, { recursive: true });

const LETTER_KEY = "twl-loi-letter-v1";
const seededState = JSON.stringify({
  state: { data: FULL_LETTER, meta: { finalWishesAck: true } },
  version: 1,
});

/** Serializes the current page into one self-contained HTML document. */
async function capture(page) {
  return page.evaluate(() => {
    const cssChunks = [];
    for (const sheet of document.styleSheets) {
      try {
        cssChunks.push(
          Array.from(sheet.cssRules)
            .map((r) => r.cssText)
            .join("\n")
        );
      } catch {
        /* cross-origin sheet — none expected */
      }
    }
    const root = document.documentElement.cloneNode(true);
    root
      .querySelectorAll(
        "script, style, link, nextjs-portal, [data-nextjs-toolbox], template"
      )
      .forEach((n) => n.remove());
    const body = root.querySelector("body");
    body.removeAttribute("style");
    const head =
      '<meta charset="utf-8">' +
      '<meta name="viewport" content="width=device-width, initial-scale=1">' +
      `<style>\n${cssChunks.join("\n")}\n</style>`;
    return `<!DOCTYPE html>\n<html lang="en">\n<head>${head}</head>\n${body.outerHTML}\n</html>`;
  });
}

function finalize(html, marker) {
  // The DS project hosts the same monogram — point at it instead of app-served
  // copies (covers both plain and next/image-optimized URLs).
  const rewritten = html
    .replace(/src="\/_next\/image\?[^"]*monogram[^"]*"/g, 'src="../../assets/monogram-gold.png"')
    .replace(/src="\/monogram-gold\.png"/g, 'src="../../assets/monogram-gold.png"')
    .replace(/srcset="[^"]*monogram[^"]*"/g, "");
  return `${marker}\n${rewritten}`;
}

function card(name, subtitle, viewport) {
  return `<!-- @dsCard group="LOI Builder" viewport="${viewport}" name="${name}" subtitle="${subtitle}" -->`;
}

const browser = await chromium.launch();

async function desktopPage(seed) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  if (seed) {
    await ctx.addInitScript(
      ([k, v]) => window.localStorage.setItem(k, v),
      [LETTER_KEY, seededState]
    );
  }
  return ctx.newPage();
}

/* ------------------------------------------------------------ landing (fresh) */
{
  const page = await desktopPage(false);
  await page.goto(`${baseUrl}/`, { waitUntil: "networkidle" });
  await page.getByRole("link", { name: /start your letter/i }).waitFor();
  const html = await capture(page);
  fs.writeFileSync(
    path.join(outDir, "index.html"),
    finalize(html, card("LOI Builder — Landing", "First-visit landing: hero, privacy promise, how it works, 15 sections", "1280x900"))
  );
  await page.context().close();
  console.log("captured landing");
}

/* -------------------------------------------------- wizard section (seeded) */
{
  const page = await desktopPage(true);
  await page.goto(`${baseUrl}/letter/behavioral-support`, { waitUntil: "networkidle" });
  await page.getByLabel(/known triggers/i).waitFor();
  const disclosure = page.getByRole("button", { name: /see an example/i }).first();
  await disclosure.click();
  const html = await capture(page);
  fs.writeFileSync(
    path.join(outDir, "wizard-section.html"),
    finalize(html, card("Wizard — Behavioral support", "Section form with rail nav, progress, helper copy, open example disclosure", "1280x900"))
  );
  await page.context().close();
  console.log("captured wizard section");
}

/* --------------------------------------------------------- review (seeded) */
{
  const page = await desktopPage(true);
  await page.goto(`${baseUrl}/letter/review`, { waitUntil: "networkidle" });
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /download the letter/i }).click();
  await dl;
  await page.getByRole("heading", { name: /yearly review/i }).waitFor();
  const html = await capture(page);
  fs.writeFileSync(
    path.join(outDir, "review.html"),
    finalize(html, card("Review & download", "Post-download state: both documents, yearly reminder, single consultation CTA, reading view", "1280x900"))
  );
  await page.context().close();
  console.log("captured review");
}

/* --------------------------------------------------------- mobile (seeded) */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 812 } });
  await ctx.addInitScript(
    ([k, v]) => window.localStorage.setItem(k, v),
    [LETTER_KEY, seededState]
  );
  const page = await ctx.newPage();
  await page.goto(`${baseUrl}/letter/a-typical-day`, { waitUntil: "networkidle" });
  await page.getByLabel(/morning routine/i).waitFor();
  await page.locator("details > summary").filter({ hasText: "Sections" }).click();
  const html = await capture(page);
  fs.writeFileSync(
    path.join(outDir, "wizard-mobile.html"),
    finalize(html, card("Wizard — 375px mobile", "A typical day on a phone, sections menu open", "375x812"))
  );
  await ctx.close();
  console.log("captured mobile");
}

await browser.close();
console.log("DONE");
