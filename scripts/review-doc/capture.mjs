/**
 * Pass one of the attorney review pack: walk the running site, photograph every
 * section, and pull out the words inside it.
 *
 * Text is read from the rendered page rather than from source, because what the
 * reviewer marks up has to be what a family actually sees — JSX splits
 * sentences across lines, hides them behind entities, and assembles some of
 * them from config at run time. The original wording is kept verbatim in the
 * manifest so pass three can find it again in the source tree.
 *
 *   node scripts/review-doc/capture.mjs            # needs the dev server up
 *   node scripts/review-doc/capture.mjs --base http://localhost:3001
 */
import { chromium } from "playwright";
import { mkdir, writeFile, rm } from "node:fs/promises";
import path from "node:path";

const argBase = process.argv.indexOf("--base");
const BASE = argBase > -1 ? process.argv[argBase + 1] : "http://localhost:3000";
const OUT = path.resolve("review-pack/build");
const SHOTS = path.join(OUT, "shots");

/** Wide enough to be the desktop the design was drawn for, 2x so Word prints it sharp. */
const VIEWPORT = { width: 1280, height: 900 };

/** A letter with enough in it that the review screen renders its real self. */
const SEEDED_LETTER = {
  version: 1,
  state: {
    data: {
      gettingStarted: {
        authorName: "Sample Author",
        authorRelationship: "Mother",
        subjectFullName: "Sample Person",
        subjectPreferredName: "Sam",
        letterDate: "2026-08-09",
      },
      about: {
        dateOfBirth: "2014-04-02",
        diagnoses: "Example diagnosis text.",
        lifeHistory: "Example life history text.",
        firstFiveMinutes: "Example first-five-minutes text.",
        importantToKnow: "Example note.",
      },
    },
    meta: {
      letterPath: "special-needs",
      lastVisitedSlug: "about",
      startedAt: "2026-08-09T07:00:00.000Z",
      updatedAt: "2026-08-09T07:00:00.000Z",
    },
  },
};

const DISABILITIES_SLUGS = [
  "getting-started",
  "about",
  "family-and-support",
  "a-typical-day",
  "communication",
  "medical",
  "behavioral-support",
  "school-and-work",
  "housing",
  "benefits-and-finances",
  "friends-joy-and-faith",
  "legal-and-advocacy",
  "guidance-for-the-trustee",
  "final-wishes",
  "a-personal-message",
];

/**
 * Four of these share a route with the disabilities set but carry different
 * intro copy depending on which letter is in progress, so they are captured
 * twice rather than assumed identical.
 */
const GENERAL_SLUGS = [
  "getting-started",
  "about-them",
  "family-and-support",
  "a-typical-week",
  "talking-with-them",
  "health-and-medical",
  "home-and-daily-living",
  "money-and-documents",
  "work-and-obligations",
  "faith-joy-and-community",
  "legal-and-decisions",
  "for-whoever-steps-in",
  "final-wishes",
  "a-personal-message",
];

const titleCase = (slug) =>
  slug.replace(/-/g, " ").replace(/^./, (c) => c.toUpperCase());

/** Part 1: the pages anyone can reach without starting a letter. */
const PUBLIC_ROUTES = [
  { code: "HOME", title: "Home", url: "/", chrome: true },
  { code: "CHOOSE", title: "Create your letter", url: "/letter" },
  { code: "REVIEW", title: "Review & download", url: "/letter/review", seed: true },
  { code: "PRIV", title: "Privacy & how your data works", url: "/privacy" },
  { code: "DATA", title: "Your data", url: "/your-data" },
];

/** Part 2: one entry per section, per letter set. */
const WIZARD_ROUTES = [
  ...DISABILITIES_SLUGS.map((slug, i) => ({
    code: `D${String(i + 1).padStart(2, "0")}`,
    title: `Disabilities ${i + 1}. ${titleCase(slug)}`,
    url: `/letter/${slug}`,
    seed: true,
    letterPath: "special-needs",
    part: 2,
  })),
  ...GENERAL_SLUGS.map((slug, i) => ({
    code: `G${String(i + 1).padStart(2, "0")}`,
    title: `General ${i + 1}. ${titleCase(slug)}`,
    url: `/letter/${slug}`,
    seed: true,
    letterPath: "general",
    part: 2,
  })),
];

/**
 * Read the words out of one container, in the order a person meets them.
 *
 * Runs in the page. Only "leaf" text holders are taken: when a paragraph
 * contains a link, the paragraph is recorded whole and the link is not
 * recorded again, so the reviewer edits a sentence rather than its fragments.
 */
/**
 * Read the words out of one container, in the order a person meets them.
 *
 * A real function, not a string: Playwright evaluates a bare string as an
 * expression, so a stringified arrow just returns the function object and
 * every section comes back empty.
 */
function extractBlocks(root, opts) {
  const skip = (opts && opts.skip) || null;
  const CANDIDATES =
    "h1,h2,h3,h4,h5,h6,p,li,button,label,legend,summary,figcaption,blockquote,dt,dd,th,td,option";
  const nodes = Array.from(root.querySelectorAll(CANDIDATES)).filter((el) => {
    if (!skip) return true;
    // Relative to this root: the section navigation is chrome that repeats on
    // all 29 wizard pages, and it renders twice over (a mobile disclosure and
    // a desktop list), so it would otherwise dominate the review pack.
    const hit = el.closest(skip);
    return !(hit && hit !== root && root.contains(hit));
  });
  const set = new Set(nodes);
  const out = [];
  const seen = new Set();

  const kindOf = (el) => {
    const t = el.tagName.toLowerCase();
    if (/^h[1-6]$/.test(t)) return "Heading";
    if (t === "button") return "Button";
    if (t === "label") return "Field label";
    if (t === "legend") return "Fieldset legend";
    if (t === "summary") return "Disclosure";
    if (t === "li") return "List item";
    if (t === "figcaption") return "Caption";
    if (t === "blockquote") return "Quote";
    if (t === "option") return "Menu option";
    if (t === "th" || t === "td") return "Table cell";
    if (t === "dt" || t === "dd") return "Definition";
    if (el.classList && el.classList.contains("tw-engraved")) return "Eyebrow";
    return "Body";
  };

  for (const el of nodes) {
    if (el.closest('[aria-hidden="true"]')) continue;
    // A candidate nested inside another candidate is a fragment of it, so the
    // reviewer gets the whole sentence rather than the link inside it.
    let p = el.parentElement;
    let nested = false;
    while (p && p !== root) {
      if (set.has(p)) {
        nested = true;
        break;
      }
      p = p.parentElement;
    }
    if (nested) continue;

    const text = (el.innerText || "").replace(/\s+/g, " ").trim();
    if (text.length < 2) continue;

    const key = kindOf(el) + "||" + text;
    if (seen.has(key)) continue;
    seen.add(key);

    out.push({ kind: kindOf(el), text, srOnly: !!el.closest(".sr-only") });
  }

  // Alt text is copy too, and it is the only copy a screen-reader user gets
  // for an image. Worth a lawyer's eyes, so it rides along at the end.
  for (const img of Array.from(root.querySelectorAll("img[alt]"))) {
    const alt = (img.getAttribute("alt") || "").trim();
    if (!alt) continue;
    const key = "Image alt||" + alt;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ kind: "Image alt", text: alt, srOnly: false });
  }

  return out;
}

async function shoot(handle, file) {
  await handle.screenshot({ path: file, animations: "disabled", scale: "css" });
  return path.basename(file);
}

async function main() {
  await rm(OUT, { recursive: true, force: true });
  await mkdir(SHOTS, { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({
    viewport: VIEWPORT,
    deviceScaleFactor: 2,
    reducedMotion: "reduce",
  });

  const entries = [];
  let shotN = 0;

  const page = await ctx.newPage();

  for (const route of [...PUBLIC_ROUTES, ...WIZARD_ROUTES]) {
    const seed = route.seed
      ? JSON.stringify({
          ...SEEDED_LETTER,
          state: {
            ...SEEDED_LETTER.state,
            meta: {
              ...SEEDED_LETTER.state.meta,
              letterPath: route.letterPath || "special-needs",
            },
          },
        })
      : null;

    await ctx.addInitScript(
      ([s]) => {
        try {
          if (s) localStorage.setItem("twl-loi-letter-v1", s);
          else localStorage.removeItem("twl-loi-letter-v1");
        } catch {}
      },
      [seed]
    );

    await page.goto(BASE + route.url, { waitUntil: "networkidle" });
    // The masthead is sticky; parked over a section it photographs as a band
    // across the top of that section's picture.
    await page.addStyleTag({
      content: "header{position:static !important}*{animation:none !important;transition:none !important}",
    });
    await page.waitForTimeout(350);

    const parts = [];

    if (route.chrome) {
      parts.push({ label: "Masthead", locator: page.locator("header").first() });
      parts.push({
        label: "Privacy strip",
        locator: page.locator("header + div").first(),
      });
    }

    const sections = page.locator("#main > section");
    const n = await sections.count();
    for (let i = 0; i < n; i++) {
      const el = sections.nth(i);
      const id = await el.getAttribute("id");
      const heading = (await el.locator("h1,h2,h3").first().innerText().catch(() => "")) || "";
      const label =
        heading.replace(/\s+/g, " ").trim().slice(0, 60) ||
        (id ? `#${id}` : `Section ${i + 1}`);
      parts.push({ label, locator: el, skip: "nav" });
    }
    // Wizard pages put the form in the page body rather than a <section>.
    if (n === 0) {
      parts.push({
        label: route.title,
        locator: page.locator("#main").first(),
        skip: "nav,details",
      });
    }

    if (route.chrome) {
      parts.push({ label: "Footer", locator: page.locator("footer").first() });
    }

    for (const part of parts) {
      if ((await part.locator.count()) === 0) continue;
      shotN += 1;
      const file = path.join(SHOTS, `${String(shotN).padStart(3, "0")}.png`);
      await part.locator.scrollIntoViewIfNeeded().catch(() => {});
      await page.waitForTimeout(120);
      let image = null;
      try {
        image = await shoot(part.locator, file);
      } catch {
        // A zero-height or detached node is not worth failing the run over.
      }
      let blocks = await part.locator
        .evaluate(extractBlocks, { skip: part.skip || null })
        .catch((err) => {
          process.stdout.write(`    ! extract failed on ${part.label}: ${err.message}\n`);
          return [];
        });
      if (!Array.isArray(blocks)) blocks = [];
      const box = await part.locator.boundingBox().catch(() => null);

      entries.push({
        part: route.part || 1,
        routeCode: route.code,
        routeTitle: route.title,
        url: route.url,
        section: part.label,
        image,
        width: box ? Math.round(box.width) : null,
        height: box ? Math.round(box.height) : null,
        blocks,
      });
    }

    const mine = entries.filter((e) => e.routeCode === route.code);
    const words = mine.reduce((n, e) => n + e.blocks.length, 0);
    process.stdout.write(
      `  ${route.code.padEnd(7)} ${route.url.padEnd(34)} ${String(mine.length).padStart(2)} shots ${String(words).padStart(4)} blocks\n`
    );
  }

  await browser.close();

  /**
   * Values typed in only to make the seeded pages render. They are sample
   * data, not copy, and a reviewer asked to redline "Sample Person" is being
   * wasted.
   */
  const SEED_VALUES = new Set(
    [
      "Sample Author",
      "Mother",
      "Sample Person",
      "Sam",
      "Example diagnosis text.",
      "Example life history text.",
      "Example first-five-minutes text.",
      "Example note.",
      "August 9, 2026",
      "April 2, 2014",
    ].map((s) => s.toLowerCase())
  );

  // Refs are assigned once, here, so every later pass agrees on them. The same
  // sentence appearing on thirty pages is one decision for the reviewer, not
  // thirty, so only its first appearance is carried.
  const counters = {};
  const seenGlobal = new Map();
  let dropped = 0;
  let seedDropped = 0;

  /**
   * Some copy interpolates the loved one's name, so the seeded value turns up
   * mid-sentence. Left alone it invites the reviewer to redline "Sam", which
   * is a placeholder the site fills in per family. Marked instead, so the
   * substitution is visible and she edits the sentence around it.
   */
  const markPlaceholders = (s) =>
    s
      .replace(/\bSample Author\b/g, "[WRITER’S NAME]")
      .replace(/\bSample Person\b/g, "[LOVED ONE’S FULL NAME]")
      .replace(/\bSam\b/g, "[LOVED ONE’S NAME]");

  for (const e of entries) {
    const kept = [];
    for (const b of e.blocks) {
      if (SEED_VALUES.has(b.text.toLowerCase())) {
        seedDropped += 1;
        continue;
      }
      const marked = markPlaceholders(b.text);
      if (marked !== b.text) {
        b.text = marked;
        b.hasPlaceholder = true;
      }
      const key = `${b.kind}||${b.text}`;
      const first = seenGlobal.get(key);
      if (first) {
        dropped += 1;
        continue;
      }
      counters[e.routeCode] = (counters[e.routeCode] || 0) + 1;
      b.ref = `${e.routeCode}-${String(counters[e.routeCode]).padStart(3, "0")}`;
      b.original = b.text;
      seenGlobal.set(key, b.ref);
      kept.push(b);
    }
    e.blocks = kept;
  }

  console.log(
    `\n  ${dropped} repeated blocks folded into their first appearance` +
      `\n  ${seedDropped} seeded sample values dropped`
  );

  const manifest = {
    generatedAt: new Date().toISOString(),
    base: BASE,
    viewport: VIEWPORT,
    entries,
    counts: {
      sections: entries.length,
      blocks: entries.reduce((n, e) => n + e.blocks.length, 0),
    },
  };

  await writeFile(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log(
    `\n${manifest.counts.sections} sections, ${manifest.counts.blocks} text blocks -> ${OUT}`
  );
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
