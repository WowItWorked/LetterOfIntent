/**
 * A2 — is the progress indicator honest about how much is left?
 * Seeds exactly ONE answer in each of the fifteen sections and reads what the
 * rail, the review page and the chooser then say.
 *
 *   node audit/tools/a2-progress-honesty.mjs
 */
import { chromium } from "playwright";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const KEY = "twl-loi-letter-v1";

/* One field per section — a real "I answered the first question and moved on". */
/* Field ids taken from audit/evidence/fill-levels.json's schemaSections, so
   every one of them is a field the app really has. */
const ONE_EACH = {
  gettingStarted: { authorName: "Maria" },
  about: { dateOfBirth: "2004-03-14" },
  familySupport: { firstCall: "My sister Dana" },
  typicalDay: { morningRoutine: "Up at six" },
  communication: { how: "Short sentences" },
  medical: { allergies: "Penicillin" },
  behavior: { triggers: "Loud rooms" },
  educationWork: { currentProgram: "Fairfax High" },
  housing: { currentLiving: "Lives with us" },
  benefitsFinances: { programs: "SSI" },
  socialFaith: { friends: "Nora next door" },
  legalAdvocacy: { decisionStatus: "Guardianship, us both" },
  trustee: { moneyIsFor: "Whatever makes his life bigger" },
  finalWishes: { funeral: "Simple service" },
  personalMessage: { toCaregivers: "Be patient with him" },
};

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  const report = {};

  for (const [label, data] of [["one-answer-per-section", ONE_EACH], ["one-section-only", { gettingStarted: { authorName: "Maria Alvarez" } }]]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    await ctx.addInitScript(
      ([k, v]) => { try { localStorage.setItem(k, v); } catch {} },
      [KEY, JSON.stringify({ version: 1, state: { data, meta: { letterPath: "special-needs" } } })]
    );
    const page = await ctx.newPage();

    await page.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(1000);
    const rail = await page.evaluate(() => {
      const aside = document.querySelector("aside");
      const bar = aside?.querySelector("div[aria-hidden='true'] > div");
      return {
        text: (aside?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 200),
        barWidth: bar ? bar.style.width : null,
        dotsShown: aside ? aside.querySelectorAll("span.bg-gold500").length : 0,
      };
    });

    await page.goto(`${BASE}/letter/review`, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const review = await page.evaluate(() => {
      const b = document.body.innerText;
      return {
        lead: (b.match(/[^\n]*(sections have notes|Every section has notes)[^\n]*/i) || [])[0] || null,
        listsMissing: /Sections without notes yet/i.test(b),
        missingCount: (() => {
          const h = Array.from(document.querySelectorAll("h3")).find((x) => /without notes/i.test(x.innerText));
          return h ? h.parentElement.querySelectorAll("li").length : 0;
        })(),
      };
    });

    report[label] = {
      answersGiven: Object.values(data).reduce((n, o) => n + Object.keys(o).length, 0),
      questionsAvailable: 83,
      rail,
      review,
    };
    console.log(`  ${label}: ${report[label].answersGiven} of 83 questions answered -> rail bar "${rail.barWidth}", rail says "${rail.text.slice(0, 90)}", review says "${review.lead}"`);
    await ctx.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "progress-honesty.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/progress-honesty.json");
};
main().catch((e) => { console.error(e); process.exit(1); });
