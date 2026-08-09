/**
 * A2 — form inventory. Walks every wizard section of BOTH paths in the running
 * app and records what the app actually renders: labelled controls, repeaters,
 * declared minutes, intro length, example disclosures, page height.
 *
 * Everything here is read out of the DOM, not out of the source, so the numbers
 * are what a family meets.
 *
 *   node audit/tools/a2-inventory.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const LETTER_KEY = "twl-loi-letter-v1";

const SN_SLUGS = [
  "getting-started", "about", "family-and-support", "a-typical-day",
  "communication", "medical", "behavioral-support", "school-and-work",
  "housing", "benefits-and-finances", "friends-joy-and-faith",
  "legal-and-advocacy", "guidance-for-the-trustee", "final-wishes",
  "a-personal-message",
];
const GEN_SLUGS = [
  "getting-started", "about-them", "family-and-support", "a-typical-week",
  "talking-with-them", "health-and-medical", "home-and-daily-living",
  "money-and-documents", "work-and-obligations", "faith-joy-and-community",
  "legal-and-decisions", "for-whoever-steps-in", "final-wishes",
  "a-personal-message",
];

const seed = (letterPath) => ({
  version: 1,
  state: { data: {}, meta: { letterPath } },
});

async function inventorySection(page, slug) {
  return page.evaluate(() => {
    const q = (s) => Array.from(document.querySelectorAll(s));
    const txt = (el) => (el ? el.textContent.replace(/\s+/g, " ").trim() : "");
    const words = (s) => (s.match(/[A-Za-z0-9’'-]+/g) || []).length;

    const article = document.querySelector("article") || document.body;
    const eyebrow = txt(article.querySelector("p.tw-engraved"));
    const h1 = txt(article.querySelector("h1"));

    // Intro paragraphs live in the navy header panel, after the h1.
    const headerPanel = article.querySelector("h1")?.parentElement;
    const introParas = headerPanel
      ? Array.from(headerPanel.querySelectorAll("p")).slice(1).map(txt)
      : [];
    const note = txt(article.querySelector("aside"));

    const form = article.querySelector("form");
    const controls = form ? q("form input, form textarea, form select") : [];

    // Top-level questions: FieldShell renders <label class="block font-semibold">
    const topLabels = form
      ? Array.from(form.querySelectorAll(":scope > div > label")).map(txt)
      : [];
    const helps = form
      ? Array.from(form.querySelectorAll(":scope > div > p")).map(txt)
      : [];

    const repeaters = form
      ? Array.from(form.querySelectorAll("fieldset")).map((fs) => ({
          legend: txt(fs.querySelector("legend")),
          help: txt(fs.querySelector(":scope > p")),
          addLabel: txt(fs.querySelector(":scope > button")),
          itemFieldCount: 0, // filled after one item is added
        }))
      : [];

    const examples = form
      ? Array.from(form.querySelectorAll("details, [data-disclosure]")).length
      : 0;
    const exampleButtons = form
      ? Array.from(form.querySelectorAll("button")).filter((b) =>
          /see an example/i.test(b.textContent)
        ).length
      : 0;

    const byType = {};
    for (const c of controls) {
      const t = c.tagName === "TEXTAREA" ? "textarea" : c.type || "text";
      byType[t] = (byType[t] || 0) + 1;
    }

    return {
      eyebrow,
      h1,
      introWordCount: introParas.reduce((n, p) => n + words(p), 0),
      introParagraphs: introParas.length,
      noteWordCount: words(note),
      note,
      controlCount: controls.length,
      controlsByType: byType,
      topLevelQuestionCount: topLabels.length,
      topLabels,
      helpWordCount: helps.reduce((n, p) => n + words(p), 0),
      repeaters,
      exampleDisclosures: exampleButtons || examples,
      scrollHeight: document.documentElement.scrollHeight,
      bodyWordCount: words(document.body.innerText || ""),
    };
  });
}

async function run(browser, letterPath, slugs) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(
    ([k, v]) => { try { localStorage.setItem(k, v); } catch {} },
    [LETTER_KEY, JSON.stringify(seed(letterPath))]
  );
  const page = await ctx.newPage();
  const out = [];
  for (const slug of slugs) {
    await page.goto(`${BASE}/letter/${slug}`, { waitUntil: "networkidle", timeout: 60_000 });
    // Emotional gate: click through so the real form is measured.
    // NB the label uses a typographic apostrophe ("I’m ready"), so match loosely.
    const ready = page.getByRole("button", { name: /ready/i });
    let gated = false;
    if (await ready.count()) {
      gated = true;
      await ready.first().click();
      await page.waitForTimeout(400);
    }
    await page.waitForSelector("form", { timeout: 20_000 }).catch(() => {});
    const base = await inventorySection(page, slug);

    // Expand every repeater once to count the fields inside one item.
    const addButtons = page.locator("form fieldset > button");
    const n = await addButtons.count();
    for (let i = 0; i < n; i++) await addButtons.nth(i).click();
    await page.waitForTimeout(300);
    const expanded = await page.evaluate(() =>
      Array.from(document.querySelectorAll("form fieldset")).map((fs) => ({
        legend: (fs.querySelector("legend")?.textContent || "").trim(),
        itemFieldCount: fs.querySelectorAll("input, textarea, select").length,
        itemLabels: Array.from(fs.querySelectorAll("label"))
          .map((l) => l.textContent.replace(/\s+/g, " ").trim())
          .filter(Boolean),
      }))
    );
    const afterExpand = await page.evaluate(
      () => document.querySelectorAll("form input, form textarea, form select").length
    );

    out.push({
      slug,
      gated,
      ...base,
      repeaterDetail: expanded,
      controlsWithOneItemPerRepeater: afterExpand,
      declaredMinutes: Number((base.eyebrow.match(/about (\d+)/i) || [])[1] || 0),
      sectionOfTotal: base.eyebrow.match(/Section (\d+) of (\d+)/i)?.slice(1, 3) || null,
    });
    console.log(
      `  ${letterPath}/${slug}: ${base.controlCount} controls, ` +
        `${afterExpand} with 1 item per repeater, ${base.introWordCount} intro words`
    );
  }
  await ctx.close();
  return out;
}

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const specialNeeds = await run(browser, "special-needs", SN_SLUGS);
  const general = await run(browser, "general", GEN_SLUGS);
  await browser.close();

  const sum = (a, f) => a.reduce((n, x) => n + f(x), 0);
  const summary = {
    specialNeeds: {
      sections: specialNeeds.length,
      declaredMinutesSum: sum(specialNeeds, (s) => s.declaredMinutes),
      controlsNoRepeaterItems: sum(specialNeeds, (s) => s.controlCount),
      controlsOneItemPerRepeater: sum(specialNeeds, (s) => s.controlsWithOneItemPerRepeater),
      topLevelQuestions: sum(specialNeeds, (s) => s.topLevelQuestionCount),
      introWords: sum(specialNeeds, (s) => s.introWordCount),
      helpWords: sum(specialNeeds, (s) => s.helpWordCount),
      totalReadableWords: sum(specialNeeds, (s) => s.bodyWordCount),
    },
    general: {
      sections: general.length,
      declaredMinutesSum: sum(general, (s) => s.declaredMinutes),
      controlsNoRepeaterItems: sum(general, (s) => s.controlCount),
      controlsOneItemPerRepeater: sum(general, (s) => s.controlsWithOneItemPerRepeater),
      topLevelQuestions: sum(general, (s) => s.topLevelQuestionCount),
      introWords: sum(general, (s) => s.introWordCount),
      helpWords: sum(general, (s) => s.helpWordCount),
      totalReadableWords: sum(general, (s) => s.bodyWordCount),
    },
  };
  console.log(JSON.stringify(summary, null, 2));
  await writeFile(
    path.join(OUT, "inventory.json"),
    JSON.stringify({ base: BASE, capturedAt: new Date().toISOString(), summary, specialNeeds, general }, null, 2)
  );
  console.log("  -> audit/evidence/a2/inventory.json");
};

main().catch((e) => { console.error(e); process.exit(1); });
