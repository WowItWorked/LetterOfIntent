/**
 * V4: hard adversarial re-test of A7-002 (GA4 form_start on typing).
 * Tries every flush path: slow typing, blur, scroll, click other fields,
 * SPA navigation, and full unload (sendBeacon). Also inspects the gtag.js
 * payload for enhanced-measurement form-interaction configuration.
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "audit/evidence/v4";
mkdirSync(OUT, { recursive: true });
const BASE = "https://myletterofintent.com";
const out = {};

/* -------- 1. inspect the gtag bootstrap for enhanced-measurement flags ---- */
const gtagRes = await fetch(
  "https://www.googletagmanager.com/gtag/js?id=G-90YXKXB5TC",
  { headers: { "user-agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) Chrome/151" } }
);
const gtagJs = await gtagRes.text();
writeFileSync(OUT + "/gtag.js", gtagJs);
out.gtagBootstrap = {
  status: gtagRes.status,
  length: gtagJs.length,
  hasFormStartToken: gtagJs.includes("form_start"),
  hasFormSubmitToken: gtagJs.includes("form_submit"),
  hasFileDownloadToken: gtagJs.includes("file_download"),
  hasScrollToken: gtagJs.includes("scroll"),
  hasVideoStartToken: gtagJs.includes("video_start"),
  hasViewSearchResults: gtagJs.includes("view_search_results"),
  // the enhanced-measurement bitmask lives near the config; capture context
  emContext: [...gtagJs.matchAll(/.{140}form_start.{140}/gs)].slice(0, 4).map((m) => m[0]),
};

/* ---------------- 2. drive the browser, flush every way possible ---------- */
const browser = await chromium.launch();

for (const route of ["/letter/about", "/letter/medical"]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const ga = [];
  const allGaUrls = [];
  page.on("request", (r) => {
    const u = r.url();
    if (/google-analytics\.com|analytics\.google\.com/.test(u)) {
      allGaUrls.push(u);
      try {
        const q = new URL(u).searchParams;
        const rec = { en: q.get("en"), _et: q.get("_et"), dl: q.get("dl") };
        for (const [k, v] of q.entries())
          if (k.startsWith("ep.") || k.startsWith("epn.")) rec[k] = v;
        ga.push(rec);
      } catch {}
      const pd = r.postData();
      if (pd)
        for (const line of pd.split("\n")) {
          const p = new URLSearchParams(line);
          if (p.get("en")) {
            const rec = { en: p.get("en"), _from: "post" };
            for (const [k, v] of p.entries())
              if (k.startsWith("ep.") || k.startsWith("epn.")) rec[k] = v;
            ga.push(rec);
          }
        }
    }
  });

  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  // dataLayer / gtag presence + GTM enhanced-measurement runtime state
  const gtagState = await page.evaluate(() => ({
    hasGtag: typeof window.gtag === "function",
    dataLayerLen: (window.dataLayer || []).length,
    // google_tag_data holds the enhanced measurement handlers when enabled
    hasTagData: typeof window.google_tag_data !== "undefined",
    tagDataKeys:
      typeof window.google_tag_data !== "undefined"
        ? Object.keys(window.google_tag_data)
        : [],
    formCount: document.querySelectorAll("form").length,
    firstFieldId: (document.querySelector("form textarea, form input") || {}).id,
  }));

  // Type slowly, character by character, into the first field.
  const field = page.locator("form textarea:visible, form input[type=text]:visible").first();
  await field.click();
  await page.keyboard.type("V4FORMSTART", { delay: 160 });
  await page.waitForTimeout(4000);

  // change focus to a second field (another "interaction")
  const second = page.locator("form textarea:visible, form input[type=text]:visible").nth(1);
  if (await second.count()) {
    await second.click().catch(() => {});
    await page.keyboard.type("second field", { delay: 120 }).catch(() => {});
  }
  await page.waitForTimeout(4000);

  const afterTyping = [...ga];

  // scroll (would trigger enhanced-measurement `scroll` if enabled)
  await page.mouse.wheel(0, 4000);
  await page.waitForTimeout(3000);
  const afterScroll = [...ga];

  // SPA nav — flushes queued events
  await page.evaluate(() => window.history.pushState({}, "", "/letter/medical"));
  await page.waitForTimeout(2000);

  // hard unload — sendBeacon flush
  await page.goto(BASE + "/privacy", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(4000);

  out["route" + route] = {
    gtagState,
    gaEventNamesAfterTyping: [...new Set(afterTyping.map((e) => e.en).filter(Boolean))],
    gaEventNamesAfterScroll: [...new Set(afterScroll.map((e) => e.en).filter(Boolean))],
    gaEventNamesFinal: [...new Set(ga.map((e) => e.en).filter(Boolean))],
    allGaEvents: ga,
    gaRequestCount: allGaUrls.length,
    anyEpFirstField: ga.some((e) => e["ep.first_field_name"] || e["ep.first_field_id"]),
  };
  await ctx.close();
}

await browser.close();
writeFileSync(OUT + "/form-start.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 20000));
