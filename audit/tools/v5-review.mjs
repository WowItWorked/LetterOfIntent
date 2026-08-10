// V5: render the production /letter/review screen with a seeded letter and
// harvest every outbound link, then request each one. Read-only.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "https://myletterofintent.com";
const OUT = process.argv[2] || "v5-review.json";

const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

await page.goto(`${BASE}/letter`, { waitUntil: "domcontentloaded", timeout: 60000 });
await page.evaluate(() => {
  const seed = {
    state: {
      data: {
        gettingStarted: {
          subjectFullName: "Sample Person",
          subjectPreferredName: "Sample",
          authorName: "Sample Parent",
          authorRelationship: "mother",
        },
      },
      meta: {
        letterPath: "special-needs",
        startedAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      },
    },
    version: 1,
  };
  localStorage.setItem("twl-loi-letter-v1", JSON.stringify(seed));
});
await page.goto(`${BASE}/letter/review`, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(4000);

const state = await page.evaluate(() => ({
  bodyStart: document.body.innerText.slice(0, 400).replace(/\s+/g, " "),
  links: [...document.querySelectorAll("a[href^='http']")].map((a) => ({
    text: a.textContent.trim().replace(/\s+/g, " ").slice(0, 60),
    href: a.href,
  })),
  reminderForm: !!document.querySelector("#reminder-email"),
}));

const results = [];
for (const l of state.links) {
  try {
    const r = await page.request.get(l.href, { maxRedirects: 5, timeout: 25000 });
    results.push({ ...l, status: r.status() });
  } catch (e) {
    results.push({ ...l, status: "ERR " + e.message.slice(0, 60) });
  }
}

let reminderAnnounce = null;
if (state.reminderForm) {
  await page.fill("#reminder-email", "verify@example.com");
  await page.click("button:has-text('Send me the reminder')");
  await page.waitForTimeout(800);
  reminderAnnounce = await page.evaluate(() => {
    const live = [...document.querySelectorAll("[aria-live='polite']")]
      .map((e) => e.textContent.trim().replace(/\s+/g, " "))
      .filter(Boolean);
    return live;
  });
}

await browser.close();
writeFileSync(OUT, JSON.stringify({ ...state, results, reminderAnnounce }, null, 2));
console.log(JSON.stringify({ bodyStart: state.bodyStart, reminderForm: state.reminderForm, results, reminderAnnounce }, null, 2));
