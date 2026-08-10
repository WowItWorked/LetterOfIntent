/**
 * V4 adversarial verification against PRODUCTION.
 * Analysis only — no site code touched.
 *
 * Checks, in one run:
 *  1. Which hosts a real browser contacts; whether the Cloudflare RUM beacon tag
 *     is present in the DOM at all (A7-004, A8-001/002/003).
 *  2. CSP violations (securitypolicyviolation) with disposition.
 *  3. GA4 event names fired on page load and on typing (A7-002, A7-012).
 *  4. Whether a canary typed into a field ever appears outbound (A7-001).
 *  5. Cookie flags (A7-008, A8-010) and gcs= consent param (A8-010).
 *  6. <video>/<track> post-hydration on the homepage (A8-006).
 *  7. navigator.storage.persisted() state (A8-007).
 *  8. email-decode script execution + post-hydration mailto (A7-005).
 */
import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";

const OUT = "audit/evidence/v4";
mkdirSync(OUT, { recursive: true });
const BASE = "https://myletterofintent.com";
const CANARY = "ZQXV4CANARY4242";

const result = {};

const browser = await chromium.launch();

function attach(page, bucket) {
  bucket.requests = [];
  bucket.gaEvents = [];
  bucket.cspViolations = [];
  bucket.console = [];
  bucket.failed = [];
  page.on("request", (r) => {
    const u = r.url();
    bucket.requests.push({ url: u, method: r.method(), post: r.postData() || null });
    if (/google-analytics\.com|analytics\.google\.com|googletagmanager\.com/.test(u)) {
      try {
        const q = new URL(u).searchParams;
        const en = q.get("en");
        const rec = { en, dl: q.get("dl"), dt: q.get("dt"), gcs: q.get("gcs"), cid: q.get("cid") };
        for (const [k, v] of q.entries()) {
          if (k.startsWith("ep.") || k.startsWith("epn.")) rec[k] = v;
        }
        if (en || /\/g\/collect/.test(u)) bucket.gaEvents.push(rec);
        // GA can batch multiple events in the POST body
        const pd = r.postData();
        if (pd) {
          for (const line of pd.split("\n")) {
            const p = new URLSearchParams(line);
            if (p.get("en")) {
              const rec2 = { en: p.get("en"), _from: "postBody" };
              for (const [k, v] of p.entries()) if (k.startsWith("ep.") || k.startsWith("epn.")) rec2[k] = v;
              bucket.gaEvents.push(rec2);
            }
          }
        }
      } catch {}
    }
  });
  page.on("requestfailed", (r) =>
    bucket.failed.push({ url: r.url(), reason: r.failure()?.errorText })
  );
  page.on("console", (m) => bucket.console.push(m.type() + ": " + m.text().slice(0, 400)));
}

async function installCspListener(page) {
  await page.addInitScript(() => {
    window.__csp = [];
    document.addEventListener("securitypolicyviolation", (e) => {
      window.__csp.push({
        blockedURI: e.blockedURI,
        violatedDirective: e.violatedDirective,
        disposition: e.disposition,
      });
    });
  });
}

/* ---------------------------------------------- 1. plain load of / and /privacy */
for (const route of ["/", "/privacy", "/letter/about"]) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bucket = {};
  attach(page, bucket);
  await installCspListener(page);
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(3000);

  const dom = await page.evaluate(() => ({
    csp: window.__csp || [],
    cfBeaconScriptInDom: !!document.querySelector('script[src*="cloudflareinsights"]'),
    hasCfBeaconGlobal: typeof window.__cfBeacon !== "undefined",
    emailDecodeInDom: !!document.querySelector('script[src*="email-decode"]'),
    emailDecodePerfEntry: performance
      .getEntriesByType("resource")
      .some((e) => e.name.includes("email-decode")),
    emailProtectionLinks: [...document.querySelectorAll('a[href*="email-protection"]')].map(
      (a) => a.getAttribute("href")
    ),
    cfEmailSpans: document.querySelectorAll(".__cf_email__").length,
    mailtoLinks: [...document.querySelectorAll('a[href^="mailto:"]')].map((a) =>
      a.getAttribute("href")
    ),
    videoCount: document.querySelectorAll("video").length,
    trackCount: document.querySelectorAll("track").length,
    videoSrc: [...document.querySelectorAll("video")].map(
      (v) => v.currentSrc || v.getAttribute("src") || [...v.querySelectorAll("source")].map((s) => s.src).join(",")
    ),
    resourceHosts: [
      ...new Set(
        performance.getEntriesByType("resource").map((e) => {
          try {
            return new URL(e.name).host;
          } catch {
            return e.name;
          }
        })
      ),
    ],
  }));

  const storagePersisted = await page.evaluate(async () => {
    try {
      return { persisted: await navigator.storage.persisted(), api: true };
    } catch (e) {
      return { error: String(e), api: false };
    }
  });

  const cookies = await ctx.cookies();
  result["load" + route] = {
    dom,
    storagePersisted,
    cookies: cookies.map((c) => ({
      name: c.name,
      domain: c.domain,
      secure: c.secure,
      httpOnly: c.httpOnly,
      sameSite: c.sameSite,
      expires: c.expires,
      expiresISO: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : null,
    })),
    gaEvents: bucket.gaEvents,
    uniqueHosts: [...new Set(bucket.requests.map((r) => { try { return new URL(r.url).host; } catch { return r.url; } }))],
    failed: bucket.failed,
    cspFromConsole: bucket.console.filter((c) => /Content Security Policy|violates/i.test(c)),
  };
  await ctx.close();
}

/* ---------------------------------------------- 2. TYPING -> form_start test */
const typingRoutes = ["/letter/about", "/letter/medical", "/letter/getting-started"];
for (const route of typingRoutes) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bucket = {};
  attach(page, bucket);
  await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  const beforeTyping = bucket.gaEvents.length;

  // Find the first visible textarea/input and type character-by-character.
  const field = page
    .locator("textarea:visible, input[type=text]:visible")
    .first();
  let fieldInfo = null;
  try {
    await field.waitFor({ timeout: 15000 });
    fieldInfo = await field.evaluate((el) => ({
      tag: el.tagName,
      id: el.id,
      name: el.getAttribute("name"),
      inForm: !!el.closest("form"),
    }));
    await field.click();
    await page.keyboard.type(CANARY, { delay: 90 });
    await page.waitForTimeout(1500);
    await page.keyboard.type(" more words here", { delay: 60 });
  } catch (e) {
    fieldInfo = { error: String(e) };
  }
  await page.waitForTimeout(5000);
  // blur + navigate away to flush any queued GA hits
  await page.evaluate(() => document.activeElement && document.activeElement.blur());
  await page.waitForTimeout(3000);

  const canaryHits = bucket.requests.filter(
    (r) =>
      r.url.includes(CANARY) ||
      r.url.includes(encodeURIComponent(CANARY)) ||
      (r.post && r.post.includes(CANARY))
  );

  result["typing" + route] = {
    fieldInfo,
    formCount: await page.evaluate(() => document.querySelectorAll("form").length),
    gaEventsAll: bucket.gaEvents,
    gaEventsAfterTyping: bucket.gaEvents.slice(beforeTyping),
    gaEventNames: [...new Set(bucket.gaEvents.map((e) => e.en).filter(Boolean))],
    canaryHits: canaryHits.map((r) => r.url.slice(0, 300)),
    canaryInAnyOutbound: canaryHits.length > 0,
  };
  await ctx.close();
}

/* ---------------------------------------------- 3. DELETE ALL MY DATA test */
{
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  const bucket = {};
  attach(page, bucket);
  await page.goto(BASE + "/letter/about", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2000);
  // Type something real so the store persists, then add a photo record directly
  const field = page.locator("textarea:visible, input[type=text]:visible").first();
  await field.click();
  await page.keyboard.type("V4 delete test content", { delay: 30 });
  await page.waitForTimeout(2500);

  // seed an IndexedDB photo record the same way the app would
  await page.evaluate(async () => {
    await new Promise((resolve, reject) => {
      const req = indexedDB.open("twl-loi-photos", 1);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "slot" });
      };
      req.onsuccess = () => {
        const db = req.result;
        const t = db.transaction("photos", "readwrite");
        t.objectStore("photos").put({
          slot: "recent",
          blob: new Blob(["x"]),
          type: "image/jpeg",
          name: "a.jpg",
          addedAt: new Date().toISOString(),
        });
        t.oncomplete = () => { db.close(); resolve(); };
        t.onerror = () => reject(t.error);
      };
      req.onerror = () => reject(req.error);
    });
  });

  const snap = async () =>
    page.evaluate(async () => {
      const ls = {};
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        ls[k] = (localStorage.getItem(k) || "").length;
      }
      let dbs = [];
      try { dbs = (await indexedDB.databases()).map((d) => d.name); } catch {}
      let photoCount = -1;
      try {
        photoCount = await new Promise((resolve) => {
          const req = indexedDB.open("twl-loi-photos", 1);
          req.onsuccess = () => {
            const db = req.result;
            try {
              const t = db.transaction("photos", "readonly");
              const c = t.objectStore("photos").count();
              c.onsuccess = () => { resolve(c.result); db.close(); };
              c.onerror = () => { resolve(-2); db.close(); };
            } catch { resolve(-3); db.close(); }
          };
          req.onerror = () => resolve(-4);
        });
      } catch {}
      return { localStorage: ls, indexedDB: dbs, photoCount, cookieString: document.cookie };
    });

  await page.goto(BASE + "/your-data", { waitUntil: "networkidle", timeout: 60000 });
  await page.waitForTimeout(2500);
  const before = await snap();

  await page.getByRole("button", { name: /Delete all my data/i }).click();
  await page.waitForTimeout(800);
  await page.getByRole("button", { name: /Yes, delete it all/i }).click();
  await page.waitForTimeout(2500);

  const notice = await page
    .locator('[aria-live="polite"]')
    .first()
    .innerText()
    .catch(() => "(none)");
  const after = await snap();
  const cookiesAfter = await ctx.cookies();

  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const afterReload = await snap();

  result.deleteFlow = {
    before,
    noticeShown: notice,
    afterNoReload: after,
    cookiesAfterDelete: cookiesAfter.map((c) => ({
      name: c.name, secure: c.secure, httpOnly: c.httpOnly, sameSite: c.sameSite,
      expiresISO: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : null,
    })),
    afterReload,
  };
  await ctx.close();
}

await browser.close();
writeFileSync(OUT + "/prod-browser.json", JSON.stringify(result, null, 2));
console.log(JSON.stringify(result, null, 2));
