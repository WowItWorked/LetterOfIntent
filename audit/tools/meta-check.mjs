/**
 * A5 — metadata copy check, local vs production.
 *
 * Titles and meta descriptions are copy: they are the first sentence most
 * families ever read, in a search result or a text-message preview, and they
 * are the one piece of copy nobody proofreads because it is invisible on the
 * page itself.
 *
 * Production is authoritative here, so both are fetched and compared.
 *
 * ANALYSIS ONLY. Read-only fetches.
 *   node audit/tools/meta-check.mjs   ->  audit/evidence/metadata.json
 */
import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "node:fs";

const ROUTES = [
  "/", "/letter", "/privacy", "/your-data", "/letter/review",
  "/letter/getting-started", "/letter/medical",
  "/samples/letter-of-intent-disabilities",
  "/samples/emergency-sheet-disabilities",
];

const TARGETS = {
  local: "http://localhost:3000",
  production: "https://myletterofintent.com",
};

const GRAB = () => ({
  title: document.title,
  description:
    document.querySelector('meta[name="description"]')?.getAttribute("content") ?? null,
  ogTitle:
    document.querySelector('meta[property="og:title"]')?.getAttribute("content") ?? null,
  ogDescription:
    document.querySelector('meta[property="og:description"]')?.getAttribute("content") ?? null,
  h1: [...document.querySelectorAll("h1")].map((h) => h.innerText.trim()),
  status404: /This page could not be found/.test(document.body.innerText),
});

const browser = await chromium.launch();
const out = {};

for (const [label, base] of Object.entries(TARGETS)) {
  out[label] = {};
  const page = await browser.newPage();
  for (const route of ROUTES) {
    try {
      const res = await page.goto(base + route, { waitUntil: "domcontentloaded", timeout: 40000 });
      out[label][route] = { httpStatus: res?.status() ?? null, ...(await page.evaluate(GRAB)) };
    } catch (e) {
      out[label][route] = { error: String(e.message ?? e) };
    }
  }
  await page.close();
}

await browser.close();

/* --------------------------------------------------------------- analysis */

const problems = [];
for (const [route, p] of Object.entries(out.production)) {
  const l = out.local[route] ?? {};
  if (p.error) { problems.push(`${route}: production unreachable — ${p.error}`); continue; }

  const d = p.description ?? "";
  // Orphaned fragments and doubled punctuation from string concatenation.
  if (/\.\s+(?:of|and|or|the|a|an|in|to|for)\s+\w+[^.]*\.\s*$/i.test(d) ||
      /\.\s+[a-z]/.test(d)) {
    problems.push(`${route}: meta description reads as broken -> "${d}"`);
  }
  if (d && d.length > 160) problems.push(`${route}: meta description ${d.length} chars (>160, will truncate in search)`);
  if (!d) problems.push(`${route}: no meta description`);
  if (p.h1.length !== 1) problems.push(`${route}: ${p.h1.length} h1 elements`);
  if (l.description && p.description && l.description !== p.description)
    problems.push(`${route}: local and production descriptions DIFFER`);
  if (l.title && p.title && l.title !== p.title)
    problems.push(`${route}: local title "${l.title}" vs production "${p.title}"`);
  if (p.status404) problems.push(`${route}: 404 in production`);
  if (l.status404) problems.push(`${route}: 404 in local`);
}

mkdirSync("audit/evidence", { recursive: true });
writeFileSync("audit/evidence/metadata.json", JSON.stringify({
  generatedAt: new Date().toISOString(), targets: TARGETS, problems, pages: out,
}, null, 2));

console.log("=== PROBLEMS ===");
problems.forEach((p) => console.log("  " + p));
console.log("\n=== PRODUCTION DESCRIPTIONS ===");
for (const [route, p] of Object.entries(out.production)) {
  console.log(`\n${route}`);
  console.log(`  title: ${p.title ?? p.error}`);
  console.log(`  desc : ${p.description ?? "(none)"}`);
}
console.log("\n-> audit/evidence/metadata.json");
