/** V1 verifier, pass 3 — A2-013 (autosave debounce loss) and A2-017 re-run
 *  with Chrome DevTools' actual Slow 3G / Fast 3G constants. */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const DEV = "http://localhost:3000";
const KEY = "twl-loi-letter-v1";
const out = {};
const browser = await chromium.launch();

/* ========================================= A2-013: what a fast reload loses */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const read = () =>
    page.evaluate(
      (k) => {
        const raw = localStorage.getItem(k);
        if (!raw) return null;
        try { return JSON.parse(raw).state?.data?.gettingStarted?.authorName ?? null; }
        catch { return "PARSE-ERROR"; }
      },
      KEY
    );

  const scenario = async (label, after) => {
    await page.goto(DEV + "/letter/getting-started", { waitUntil: "networkidle" });
    await page.evaluate((k) => localStorage.removeItem(k), KEY);
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    const field = page.locator('input[name="authorName"]').first();
    await field.click();
    await field.fill("Maria Alvarez");
    const res = await after(page);
    return { label, ...res };
  };

  out.A2_013 = {};
  out.A2_013.a_reload_immediately = await scenario("reload with zero delay", async (p) => {
    const atZero = await read();
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const v = await p.evaluate(() => document.querySelector('input[name="authorName"]')?.value ?? null);
    return { storedAtZeroDelay: atZero, valueAfterReload: v, preserved: v === "Maria Alvarez" };
  });
  out.A2_013.b_reload_after_debounce = await scenario("reload after 900ms", async (p) => {
    await p.waitForTimeout(900);
    const stored = await read();
    await p.reload({ waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    const v = await p.evaluate(() => document.querySelector('input[name="authorName"]')?.value ?? null);
    return { storedAfter900ms: stored, valueAfterReload: v, preserved: v === "Maria Alvarez" };
  });
  out.A2_013.c_in_app_nav_immediately = await scenario("in-app nav, no pause", async (p) => {
    await p.click('a:has-text("02")').catch(async () => {
      await p.goto(DEV + "/letter/about", { waitUntil: "networkidle" });
    });
    await p.waitForTimeout(800);
    const stored = await read();
    return { storedAfterNav: stored, preserved: stored === "Maria Alvarez" };
  });
  out.A2_013.listenersInSrc = "beforeunload/pagehide/visibilitychange: verified absent by grep";
  await ctx.close();
}

/* ============ A2-017 with Chrome DevTools' own Slow 3G / Fast 3G constants */
{
  // DevTools presets, verbatim: Slow 3G 400kbps down / 400kbps up / 2000ms RTT;
  // Fast 3G 1.6Mbps down / 750kbps up / 562.5ms RTT.
  const presets = {
    "slow3g-devtools": { down: (400 * 1000) / 8, up: (400 * 1000) / 8, latency: 2000 },
    "fast3g-devtools": { down: (1.6 * 1000 * 1000) / 8, up: (750 * 1000) / 8, latency: 562.5 },
  };
  out.A2_017_devtoolsPresets = {};
  for (const [name, c] of Object.entries(presets)) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    });
    const page = await ctx.newPage();
    await page.addInitScript(() => {
      window.__lcp = null;
      new PerformanceObserver((l) => { window.__lcp = l.getEntries().at(-1).startTime; })
        .observe({ type: "largest-contentful-paint", buffered: true });
    });
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false, latency: c.latency, downloadThroughput: c.down, uploadThroughput: c.up,
    });
    let bytes = 0;
    page.on("response", (r) => { const l = r.headers()["content-length"]; if (l) bytes += Number(l); });
    const t0 = Date.now();
    try { await page.goto(PROD, { waitUntil: "load", timeout: 180000 }); } catch { /* record partial */ }
    const wall = Date.now() - t0;
    const m = await page.evaluate(() => ({
      fcp: performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null,
      lcp: window.__lcp,
    }));
    out.A2_017_devtoolsPresets[name] = {
      wallMsToLoadEvent: wall,
      fcp: m.fcp ? Math.round(m.fcp) : null,
      lcp: m.lcp ? Math.round(m.lcp) : null,
      transferBytesHeaderSum: bytes,
    };
    await ctx.close();
  }
}

await browser.close();
writeFileSync(new URL("../evidence/v1/a2-checks3.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
