// V5 adversarial verification of A9 (distribution) findings.
// Read-only against production. Writes nothing into the app.
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const BASE = "https://myletterofintent.com";
const OUT = process.argv[2] || "v5-verify.json";
const result = {};

const browser = await chromium.launch();

// ---------------------------------------------------------------- 1. hosts
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const hosts = new Set();
  const urls = [];
  page.on("request", (r) => {
    try {
      hosts.add(new URL(r.url()).host);
      urls.push(r.url());
    } catch {}
  });
  await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(6000);
  result.homepageHosts = [...hosts].sort();
  result.cloudflareBeacon = urls.filter((u) => /cloudflareinsights/.test(u));
  result.gaCollect = urls.filter((u) => /\/g\/collect|\/collect\?/.test(u));
  // og / head inventory as the browser sees it
  result.headTags = await page.evaluate(() =>
    [...document.head.querySelectorAll("meta,link,title,script")].map((e) => {
      const a = {};
      for (const at of e.attributes) a[at.name] = at.value;
      return { tag: e.tagName.toLowerCase(), ...a };
    })
  );
  result.jsonLdCount = await page.evaluate(
    () => document.querySelectorAll('script[type="application/ld+json"]').length
  );
  await ctx.close();
}

// ------------------------------------------------- 2. share tile geometry
{
  result.shareTiles = {};
  for (const w of [320, 375, 768, 1440]) {
    const ctx = await browser.newContext({ viewport: { width: w, height: 900 } });
    const page = await ctx.newPage();
    await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
    await page.waitForTimeout(2500);
    const boxes = await page.evaluate(() => {
      const grid = [...document.querySelectorAll("div")].find(
        (d) => d.className && String(d.className).includes("grid-cols-8")
      );
      if (!grid) return null;
      const anchors = [...grid.querySelectorAll("a")];
      const cs = getComputedStyle(grid);
      return {
        gap: cs.gap,
        count: anchors.length,
        boxes: anchors.map((a) => {
          const r = a.getBoundingClientRect();
          return {
            label: a.getAttribute("aria-label"),
            w: Math.round(r.width * 10) / 10,
            h: Math.round(r.height * 10) / 10,
            cx: Math.round(r.x + r.width / 2),
          };
        }),
      };
    });
    result.shareTiles[w] = boxes;
    await ctx.close();
  }
}

// --------------------------------------------------- 3. review CTA links
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(`${BASE}/letter`, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.evaluate(() => {
    const seed = {
      state: {
        meta: {
          letterPath: "special-needs",
          subjectFullName: "Sample Person",
          authorName: "Sample Parent",
          authorRelationship: "mother",
        },
        answers: { about: { subjectFullName: "Sample Person" } },
      },
      version: 0,
    };
    localStorage.setItem("twl-loi-letter-v1", JSON.stringify(seed));
  });
  await page.goto(`${BASE}/letter/review`, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);
  const links = await page.evaluate(() =>
    [...document.querySelectorAll("a[href^='http']")].map((a) => ({
      text: a.textContent.trim().replace(/\s+/g, " ").slice(0, 60),
      href: a.href,
    }))
  );
  result.reviewOutboundLinks = links;
  result.reviewHasReminderForm = await page.evaluate(
    () => !!document.querySelector("#reminder-email")
  );
  // press the dead button and capture the announced result
  if (result.reviewHasReminderForm) {
    await page.fill("#reminder-email", "verify@example.com");
    await page.click("button:has-text('Send me the reminder')");
    await page.waitForTimeout(600);
    result.reminderAfterSubmit = await page.evaluate(() => {
      const live = document.querySelector("[aria-live='polite']");
      return live ? live.textContent.trim().replace(/\s+/g, " ") : null;
    });
  }
  await ctx.close();
}

// ------------------------------------------------------------- 4. video
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(2000);
  result.videoBefore = await page.evaluate(() => ({
    videoCount: document.querySelectorAll("video").length,
    posterButton: !!document.querySelector(
      "button[aria-label^='Play the video']"
    ),
    captionText:
      [...document.querySelectorAll("p")]
        .map((p) => p.textContent.trim())
        .find((t) => /^Watch ·/.test(t)) || null,
  }));
  const btn = await page.$("button[aria-label^='Play the video']");
  if (btn) {
    await btn.click();
    await page.waitForTimeout(6000);
  }
  result.videoAfter = await page.evaluate(() => {
    const v = document.querySelector("video");
    if (!v) return { videoCount: 0 };
    return {
      videoCount: 1,
      tracks: v.querySelectorAll("track").length,
      textTracks: v.textTracks ? v.textTracks.length : null,
      duration: v.duration,
      src: v.getAttribute("src"),
      poster: v.getAttribute("poster"),
    };
  });
  await ctx.close();
}

// ----------------------------------------------- 5. GA4 events (stubbed)
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const ga = [];
  await ctx.route(/google-analytics\.com|analytics\.google\.com/, async (route) => {
    const u = route.request().url();
    ga.push(u + (route.request().postData() || ""));
    await route.fulfill({ status: 204, body: "" });
  });
  await page.goto(BASE, { waitUntil: "domcontentloaded", timeout: 60000 });
  await page.waitForTimeout(4000);
  const start = await page.$("a[href='/letter']");
  if (start) {
    await start.click();
    await page.waitForTimeout(14000);
  }
  result.gaEvents = ga
    .map((u) => (u.match(/[?&]en=([a-z_]+)/) || [])[1])
    .filter(Boolean);
  result.gaRaw = ga.slice(0, 12).map((u) => u.slice(0, 260));
  await ctx.close();
}

await browser.close();
writeFileSync(OUT, JSON.stringify(result, null, 2));
console.log("wrote", OUT);
