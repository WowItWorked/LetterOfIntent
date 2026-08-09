/**
 * Part three of the review pack: the documents a family prints and keeps.
 *
 * Two different jobs, deliberately kept apart:
 *
 *   Pictures come from the real generated PDFs, rendered page by page through
 *   the sample viewer the site already ships. What she sees is exactly what
 *   comes out of the tool, watermark and all.
 *
 *   Words come from the source of the PDF templates, not from the PDFs. A
 *   sample letter interleaves template copy with a fictional family's answers,
 *   and asking a reviewer to tell those apart at a glance is a trap. Reading
 *   the templates gives the sentences the firm is actually responsible for —
 *   headings, the how-to page, and the disclaimers that carry its name.
 *
 *   node scripts/review-doc/capture-pdf.mjs
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const argBase = process.argv.indexOf("--base");
const BASE = argBase > -1 ? process.argv[argBase + 1] : "http://localhost:3000";
const OUT = path.resolve("review-pack/build");
const SHOTS = path.join(OUT, "shots");

const DOCS = [
  {
    code: "PDFLOI",
    title: "The Letter of Intent (printed document)",
    slug: "letter-of-intent-disabilities",
    source: "src/lib/pdf/loi-document.tsx",
  },
  {
    code: "PDFEMG",
    title: "The emergency information sheet (printed document)",
    slug: "emergency-sheet-disabilities",
    source: "src/lib/pdf/emergency-document.tsx",
  },
];

/** The legal copy lives in config, and is the highest-stakes text in the project. */
const FIRM_LEGAL = [
  ["disclaimerShort", "Short disclaimer (site footer and PDF)"],
  ["disclaimerFull", "Full disclaimer (privacy page and PDF how-to page)"],
  ["advertisingNotice", "Attorney advertising notice"],
  ["privacyPromise", "Privacy promise"],
  ["attorneyBioBlurb", "Attorney biography"],
];

/**
 * Pull the prose out of a react-pdf template.
 *
 * These are .tsx files, so the copy arrives three ways: as JSX text between
 * tags, as string props like label="...", and as template literals that splice
 * a name in. Style objects and identifiers are filtered out by insisting on
 * something that reads like a sentence.
 */
function prosePieces(src) {
  const found = new Map();
  const add = (raw, how) => {
    const text = raw
      .replace(/\s+/g, " ")
      .replace(/\{"\s*"\}/g, " ")
      // JSX escapes its apostrophes; a reviewer should see the punctuation,
      // not the entity that encodes it.
      .replace(/&apos;|&#39;/g, "’")
      .replace(/&quot;/g, '"')
      .replace(/&mdash;/g, "—")
      .replace(/&ndash;/g, "–")
      .replace(/&rsquo;/g, "’")
      .replace(/&lsquo;/g, "‘")
      .replace(/&nbsp;/g, " ")
      .replace(/&amp;/g, "&")
      .trim();
    if (!text) return;
    const words = text.split(" ").filter(Boolean);
    if (words.length < 4) return;
    if (!/^[A-Z“"(]/.test(text)) return;
    if (/^[A-Z_]+$/.test(text)) return;
    if (/[{}<>]/.test(text)) return;
    if (!found.has(text)) found.set(text, how);
  };

  // JSX text nodes: >  some words  <
  for (const m of src.matchAll(/>([^<>{}]{12,}?)</g)) add(m[1], "Printed text");
  // Double-quoted literals long enough to be a sentence.
  for (const m of src.matchAll(/"([^"\\\n]{20,})"/g)) add(m[1], "Printed text");
  // Template literals that interpolate a name.
  for (const m of src.matchAll(/`([^`]{20,})`/g)) {
    const t = m[1].replace(/\$\{[^}]*\}/g, "[NAME]");
    if (!/[{}]/.test(t)) add(t, "Printed text (name filled in)");
  }
  return [...found].map(([text, kind]) => ({ text, kind }));
}

async function main() {
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1200 },
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });
  const page = await ctx.newPage();

  const entries = [];
  let shotN = 900; // well clear of pass one's numbering

  for (const doc of DOCS) {
    await page.goto(`${BASE}/samples/${doc.slug}`, { waitUntil: "networkidle" });
    // pdf.js paints canvases one at a time; wait for the last one to appear.
    await page.waitForSelector("canvas", { timeout: 60_000 });
    await page.waitForTimeout(2500);

    const canvases = page.locator("canvas");
    const pages = await canvases.count();

    const images = [];
    for (let i = 0; i < pages; i++) {
      shotN += 1;
      const file = path.join(SHOTS, `${shotN}.png`);
      await canvases.nth(i).scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(120);
      try {
        // At CSS scale: pdf.js paints these canvases far wider than any screen,
        // and the full pixel buffer is several times more than a page of Word
        // can show. Capturing at CSS size keeps the pack emailable.
        await canvases
          .nth(i)
          .screenshot({ path: file, animations: "disabled", scale: "css" });
        images.push(path.basename(file));
      } catch {
        // A page that will not paint is worth noting, not worth aborting for.
      }
    }

    const src = await readFile(path.resolve(doc.source), "utf8");
    const blocks = prosePieces(src);

    entries.push({
      part: 3,
      routeCode: doc.code,
      routeTitle: doc.title,
      url: `/samples/${doc.slug}`,
      section: doc.title,
      sourceFile: doc.source,
      images,
      blocks,
    });

    console.log(
      `  ${doc.code.padEnd(7)} ${String(images.length).padStart(2)} page images  ${String(blocks.length).padStart(3)} blocks  (${doc.source})`
    );
  }

  // The firm's legal strings, taken by name so nothing is guessed at.
  const firmSrc = await readFile(path.resolve("src/config/firm.ts"), "utf8");
  const legal = [];
  for (const [key, label] of FIRM_LEGAL) {
    const m = firmSrc.match(new RegExp(`${key}:\\s*((?:"[^"]*"\\s*\\+?\\s*)+)`, "s"));
    if (!m) continue;
    const text = [...m[1].matchAll(/"([^"]*)"/g)]
      .map((x) => x[1])
      .join("")
      .replace(/\s+/g, " ")
      .trim();
    if (text) legal.push({ text, kind: label });
  }
  entries.push({
    part: 3,
    routeCode: "LEGAL",
    routeTitle: "Disclaimers and legal notices",
    url: "src/config/firm.ts",
    section: "Disclaimers and legal notices",
    sourceFile: "src/config/firm.ts",
    images: [],
    blocks: legal,
  });
  console.log(`  LEGAL   ${String(legal.length).padStart(2)} notices              (src/config/firm.ts)`);

  await browser.close();

  // Refs continue the same scheme as pass one.
  const counters = {};
  for (const e of entries) {
    for (const b of e.blocks) {
      counters[e.routeCode] = (counters[e.routeCode] || 0) + 1;
      b.ref = `${e.routeCode}-${String(counters[e.routeCode]).padStart(3, "0")}`;
      b.original = b.text;
    }
  }

  await writeFile(
    path.join(OUT, "manifest-pdf.json"),
    JSON.stringify({ generatedAt: new Date().toISOString(), entries }, null, 2)
  );

  const totals = entries.reduce(
    (a, e) => ({ img: a.img + e.images.length, blk: a.blk + e.blocks.length }),
    { img: 0, blk: 0 }
  );
  console.log(`\n${totals.img} page images, ${totals.blk} text blocks -> ${OUT}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
