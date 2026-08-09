/**
 * A2 / P4 — comprehension. Reads the rendered text of every wizard section and
 * the pages around it, and scores it: Flesch Reading Ease, Flesch–Kincaid grade,
 * long sentences, and undefined domain jargon.
 *
 * Syllable counting is the standard heuristic, so grades are +-1 rather than
 * exact. It is still the right instrument for "is this 6th-grade or 12th-grade".
 *
 * Also records a keyboard-cost comparison at desktop vs phone width, and the
 * heading structure of the longest section.
 *
 *   node audit/tools/a2-comprehension.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const KEY = "twl-loi-letter-v1";

const SN_SLUGS = [
  "getting-started", "about", "family-and-support", "a-typical-day",
  "communication", "medical", "behavioral-support", "school-and-work",
  "housing", "benefits-and-finances", "friends-joy-and-faith",
  "legal-and-advocacy", "guidance-for-the-trustee", "final-wishes",
  "a-personal-message",
];

/* Terms a caregiver without US special-needs-planning background will not know. */
const JARGON = [
  "letter of intent", "special needs trust", "trustee", "trust",
  "guardianship", "guardian", "conservator", "conservatorship",
  "power of attorney", "advance directive", "living will",
  "supported decision-making", "representative payee", "fiduciary",
  "ABLE account", "SSI", "SSDI", "Medicaid", "Medicare", "waiver",
  "IEP", "504", "transition plan", "vocational", "day program",
  "de-escalation", "sensory", "protocol", "respite", "case manager",
  "estate plan", "beneficiary", "public benefits", "means-tested",
  "OT", "PT", "CPAP", "AAC",
];

function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (w.length <= 3) return 1;
  const t = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
  return (t.match(/[aeiouy]{1,2}/g) || []).length || 1;
}

function readability(text) {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  const sentences = clean.split(/(?<=[.!?])\s+(?=[A-Z“"'(])/).filter((s) => s.trim().length > 1);
  const words = clean.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  if (!sentences.length || !words.length) return null;
  const syl = words.reduce((n, w) => n + syllables(w), 0);
  const wps = words.length / sentences.length;
  const spw = syl / words.length;
  return {
    words: words.length,
    sentences: sentences.length,
    wordsPerSentence: +wps.toFixed(1),
    fleschReadingEase: +(206.835 - 1.015 * wps - 84.6 * spw).toFixed(1),
    fleschKincaidGrade: +(0.39 * wps + 11.8 * spw - 15.59).toFixed(1),
    longSentences: sentences.filter((s) => (s.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length > 25)
      .map((s) => s.trim().slice(0, 180)),
    longestSentenceWords: Math.max(
      ...sentences.map((s) => (s.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length)
    ),
  };
}

const jargonIn = (text) => {
  const t = text.toLowerCase();
  return JARGON.filter((j) => {
    const re = new RegExp(`\\b${j.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "i");
    return re.test(t);
  });
};

const seed = () =>
  JSON.stringify({ version: 1, state: { data: {}, meta: { letterPath: "special-needs" } } });

async function main() {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const out = { base: BASE, capturedAt: new Date().toISOString(), sections: [], pages: {}, keyboard: {} };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  await ctx.addInitScript(
    ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
    [KEY, seed()]
  );
  const page = await ctx.newPage();

  /* ---------------------------------------------------- wizard sections */
  for (const slug of SN_SLUGS) {
    await page.goto(`${BASE}/letter/${slug}`, { waitUntil: "networkidle", timeout: 90_000 });
    const ready = page.getByRole("button", { name: /ready/i });
    if (await ready.count()) { await ready.first().click(); await page.waitForTimeout(400); }
    await page.waitForSelector("form", { timeout: 20_000 }).catch(() => {});

    const parts = await page.evaluate(() => {
      const t = (el) => (el ? (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim() : "");
      const article = document.querySelector("article");
      const panel = article?.querySelector("h1")?.parentElement;
      const intro = panel ? Array.from(panel.querySelectorAll("p")).slice(1).map(t).join(" ") : "";
      const note = t(article?.querySelector("aside"));
      const form = article?.querySelector("form");
      const labels = form ? Array.from(form.querySelectorAll("label, legend")).map(t) : [];
      const helps = form
        ? Array.from(form.querySelectorAll("p")).map(t).filter(Boolean)
        : [];
      const placeholders = form
        ? Array.from(form.querySelectorAll("[placeholder]")).map((e) => e.getAttribute("placeholder"))
        : [];
      return {
        h1: t(article?.querySelector("h1")),
        intro, note,
        labels, helps, placeholders,
        headings: Array.from(document.querySelectorAll("main h1,main h2,main h3,main h4"))
          .map((h) => `${h.tagName} ${t(h).slice(0, 60)}`),
      };
    });

    const all = [parts.intro, parts.note, parts.labels.join(". "), parts.helps.join(" ")].join(" ");
    out.sections.push({
      slug,
      h1: parts.h1,
      headingsInMain: parts.headings,
      intro: readability(parts.intro),
      helpText: readability(parts.helps.join(" ")),
      labelsOnly: readability(parts.labels.join(". ")),
      whole: readability(all),
      jargon: jargonIn(all),
      labelSamples: parts.labels.slice(0, 40),
      longestLabelWords: Math.max(
        0,
        ...parts.labels.map((l) => (l.match(/\S+/g) || []).length)
      ),
      placeholderCount: parts.placeholders.length,
    });
    console.log(
      `  ${slug}: FK grade ${out.sections.at(-1).whole?.fleschKincaidGrade}, ` +
        `ease ${out.sections.at(-1).whole?.fleschReadingEase}, jargon: ${out.sections.at(-1).jargon.join(", ") || "none"}`
    );
  }

  /* ------------------------------------------------------- other pages */
  for (const [name, route] of [["home", "/"], ["chooser", "/letter"], ["review", "/letter/review"], ["yourData", "/your-data"], ["privacy", "/privacy"]]) {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(500);
    const text = await page.evaluate(() => document.querySelector("main")?.innerText || "");
    out.pages[name] = { route, ...readability(text), jargon: jargonIn(text) };
    console.log(`  ${name}: FK grade ${out.pages[name].fleschKincaidGrade}, ease ${out.pages[name].fleschReadingEase}`);
  }
  await ctx.close();

  /* --------------------------------- keyboard cost, desktop vs phone width */
  for (const [label, vp] of [["desktop-1280", { width: 1280, height: 900 }], ["phone-390", { width: 390, height: 844 }]]) {
    const c = await browser.newContext({ viewport: vp });
    await c.addInitScript(
      ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
      [KEY, seed()]
    );
    const p = await c.newPage();
    await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle", timeout: 90_000 });
    await p.waitForSelector("form", { timeout: 20_000 });
    await p.evaluate(() => window.scrollTo(0, 0));
    let tabs = null;
    const seq = [];
    for (let i = 1; i <= 60; i++) {
      await p.keyboard.press("Tab");
      const info = await p.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tag: el.tagName.toLowerCase(),
          inForm: Boolean(el.closest("form")),
          name: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || "")
            .replace(/\s+/g, " ").trim().slice(0, 44),
        };
      });
      if (!info) break;
      seq.push(`${info.tag} "${info.name}"`);
      if (info.inForm && (info.tag === "input" || info.tag === "textarea")) { tabs = i; break; }
    }
    out.keyboard[label] = {
      route: "/letter/medical",
      tabsFromTopOfPageToFirstQuestion: tabs,
      sequence: seq,
      railVisible: await p.evaluate(() => {
        const a = document.querySelector("aside");
        return a ? getComputedStyle(a).display !== "none" : false;
      }),
      mobileSectionsVisible: await p.evaluate(() => {
        const d = document.querySelector("details");
        return d ? getComputedStyle(d).display !== "none" : false;
      }),
      headingsInMain: await p.evaluate(() =>
        Array.from(document.querySelectorAll("main h1,main h2,main h3")).map(
          (h) => `${h.tagName} ${(h.innerText || "").replace(/\s+/g, " ").trim().slice(0, 50)}`
        )
      ),
    };
    console.log(`  keyboard ${label}: ${tabs} tabs to first question on /letter/medical`);
    await c.close();
  }

  await browser.close();

  const grades = out.sections.map((s) => s.whole?.fleschKincaidGrade).filter((n) => typeof n === "number");
  out.summary = {
    sectionGradeMin: Math.min(...grades),
    sectionGradeMax: Math.max(...grades),
    sectionGradeMean: +(grades.reduce((a, b) => a + b, 0) / grades.length).toFixed(1),
    sectionsAtOrBelowGrade8: grades.filter((g) => g <= 8).length,
    sectionsAboveGrade10: grades.filter((g) => g > 10).length,
    totalSections: grades.length,
    jargonAcrossWizard: [...new Set(out.sections.flatMap((s) => s.jargon))].sort(),
  };
  console.log(JSON.stringify(out.summary, null, 2));
  await writeFile(path.join(OUT, "comprehension.json"), JSON.stringify(out, null, 2));
  console.log("  -> audit/evidence/a2/comprehension.json");
}

main().catch((e) => { console.error(e); process.exit(1); });
