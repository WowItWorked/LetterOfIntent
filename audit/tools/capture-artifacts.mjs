/**
 * Shared visual and document evidence for the audit.
 *
 * Screenshots at the four briefed viewports, and real generated PDFs at three
 * fill levels. Field names are read out of the zod schema rather than typed by
 * hand here, so "maximally filled" genuinely means every field the app knows
 * about — a hand-written list would silently drift and quietly understate the
 * pagination stress A6 is looking for.
 *
 *   node audit/tools/capture-artifacts.mjs
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = "http://localhost:3000";
const OUT = path.resolve("audit/evidence");
const LETTER_KEY = "twl-loi-letter-v1";

const VIEWPORTS = [
  { name: "320", width: 320, height: 720 },
  { name: "768", width: 768, height: 1024 },
  { name: "1024", width: 1024, height: 900 },
  { name: "1440", width: 1440, height: 900 },
];

const ROUTES = [
  ["home", "/"],
  ["letter-chooser", "/letter"],
  ["wizard-getting-started", "/letter/getting-started"],
  ["wizard-medical", "/letter/medical"],
  ["review", "/letter/review"],
  ["privacy", "/privacy"],
  ["your-data", "/your-data"],
];

/** Pull `sectionKey -> [fieldNames]` straight out of the schema source. */
async function readSchemaShape() {
  const src = await readFile(path.resolve("src/lib/schema.ts"), "utf8");

  // Every `export const fooSchema = z.object({ ... })` and its plain fields.
  const schemas = {};
  for (const m of src.matchAll(
    /export const (\w+)Schema\s*=\s*z\.object\(\{([\s\S]*?)\n\}\)/g
  )) {
    const [, name, body] = m;
    const fields = [];
    for (const f of body.matchAll(/^\s{2}(\w+):\s*(s|z\.string\(\))/gm)) fields.push(f[1]);
    schemas[name] = fields;
  }

  // letterDataSchema maps section keys onto those schemas.
  const letterBlock = src.match(
    /export const letterDataSchema\s*=\s*z\.object\(\{([\s\S]*?)\n\}\)/
  );
  const sections = {};
  if (letterBlock) {
    for (const m of letterBlock[1].matchAll(/^\s{2}(\w+):\s*(\w+)Schema/gm)) {
      const [, key, schemaName] = m;
      sections[key] = schemas[schemaName] || [];
    }
  }
  return sections;
}

const LONG = (label, n) =>
  `${label}. ` +
  Array.from(
    { length: n },
    (_, i) =>
      `Sentence ${i + 1} describing this in the kind of detail a family actually writes, ` +
      `including specifics a future caregiver would need and could not guess.`
  ).join(" ");

function buildLevels(sections) {
  const keys = Object.keys(sections);

  const minimal = {
    gettingStarted: {
      authorName: "Minimal Author",
      subjectFullName: "Minimal Subject",
      subjectPreferredName: "Min",
      letterDate: "2026-08-09",
    },
  };

  const typical = { ...minimal };
  for (const k of keys.slice(0, 7)) {
    typical[k] = typical[k] || {};
    for (const f of sections[k].slice(0, 4)) {
      typical[k][f] = `Typical answer for ${f}. About what a real family writes here.`;
    }
  }

  // Every section, every known field, long enough to force pagination stress.
  const maximal = {};
  for (const k of keys) {
    maximal[k] = {};
    for (const f of sections[k]) maximal[k][f] = LONG(`${k}.${f}`, 12);
  }
  maximal.gettingStarted = {
    ...(maximal.gettingStarted || {}),
    authorName: "Maximal Author With A Notably Long Legal Name",
    subjectFullName: "Maximal Subject With A Notably Long Legal Name",
    subjectPreferredName: "Max",
    letterDate: "2026-08-09",
  };

  return { minimal, typical, maximal };
}

const envelope = (data) => ({
  version: 1,
  state: {
    data,
    meta: {
      letterPath: "special-needs",
      lastVisitedSlug: "about",
      startedAt: "2026-08-09T07:00:00.000Z",
      updatedAt: "2026-08-09T07:00:00.000Z",
    },
  },
});

async function main() {
  await mkdir(path.join(OUT, "screenshots"), { recursive: true });
  await mkdir(path.join(OUT, "pdfs"), { recursive: true });

  const sections = await readSchemaShape();
  const levels = buildLevels(sections);

  console.log("  schema sections found:", Object.keys(sections).length);
  console.log(
    "  fields per level:",
    Object.entries(levels)
      .map(([k, v]) => `${k}=${Object.values(v).reduce((n, o) => n + Object.keys(o).length, 0)}`)
      .join(" ")
  );

  const browser = await chromium.launch();

  /* --------------------------------------------------------- screenshots */
  for (const vp of VIEWPORTS) {
    const ctx = await browser.newContext({
      viewport: { width: vp.width, height: vp.height },
      reducedMotion: "reduce",
    });
    await ctx.addInitScript(
      ([key, val]) => {
        try {
          localStorage.setItem(key, val);
        } catch {}
      },
      [LETTER_KEY, JSON.stringify(envelope(levels.typical))]
    );
    const page = await ctx.newPage();

    for (const [slug, route] of ROUTES) {
      try {
        await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60_000 });
      } catch {
        continue;
      }
      await page.waitForTimeout(700);
      const file = path.join(OUT, "screenshots", `${slug}-${vp.name}.png`);
      await page
        .screenshot({ path: file, fullPage: true, animations: "disabled", scale: "css" })
        .catch(() => {});
    }
    await ctx.close();
    console.log(`  screenshots @${vp.name}px done`);
  }

  /* ---------------------------------------------------------------- pdfs */
  for (const [levelName, data] of Object.entries(levels)) {
    const ctx = await browser.newContext({
      viewport: { width: 1280, height: 900 },
      acceptDownloads: true,
    });
    await ctx.addInitScript(
      ([key, val]) => {
        try {
          localStorage.setItem(key, val);
        } catch {}
      },
      [LETTER_KEY, JSON.stringify(envelope(data))]
    );
    const page = await ctx.newPage();
    try {
      await page.goto(BASE + "/letter/review", { waitUntil: "networkidle", timeout: 60_000 });
      await page.waitForTimeout(1500);

      const buttons = page.getByRole("button", { name: /download/i });
      const count = await buttons.count();
      let saved = 0;
      for (let i = 0; i < count; i++) {
        const label = (await buttons.nth(i).innerText().catch(() => "")) || `btn${i}`;
        try {
          const [dl] = await Promise.all([
            page.waitForEvent("download", { timeout: 90_000 }),
            buttons.nth(i).click(),
          ]);
          const suggested = dl.suggestedFilename();
          const ext = path.extname(suggested) || ".bin";
          const target = path.join(
            OUT,
            "pdfs",
            `${levelName}--${suggested.replace(/\.[^.]+$/, "")}${ext}`
          );
          await dl.saveAs(target);
          saved += 1;
        } catch {
          console.log(`    (${levelName}) no download from "${label.trim().slice(0, 30)}"`);
        }
        await page.waitForTimeout(800);
      }
      console.log(`  pdfs ${levelName}: ${saved} file(s) from ${count} download control(s)`);
    } catch (e) {
      console.log(`  pdfs ${levelName}: FAILED — ${e.message.slice(0, 90)}`);
    }
    await ctx.close();
  }

  await browser.close();

  await writeFile(
    path.join(OUT, "fill-levels.json"),
    JSON.stringify({ schemaSections: sections, levels }, null, 2)
  );
  console.log("  -> audit/evidence/");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
