/**
 * V1 verifier, pass 2 — corrected for the real storage key
 * ("twl-loi-letter-v1", not "mloi.*") and the real repeater field ids.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const DEV = "http://localhost:3000";
const KEY = "twl-loi-letter-v1";
const out = {};
const browser = await chromium.launch();

const ONE_PER_SECTION = {
  gettingStarted: { authorName: "Maria Alvarez" },
  about: { dateOfBirth: "2009-04-02" },
  familySupport: { firstCall: "My sister Dana." },
  typicalDay: { morningRoutine: "Wakes at 6:30." },
  communication: { how: "Short sentences." },
  medical: { allergies: "Penicillin." },
  behavior: { triggers: "Loud rooms." },
  educationWork: { currentProgram: "Northside High." },
  housing: { currentLiving: "Lives at home." },
  benefitsFinances: { programs: "SSI." },
  socialFaith: { friends: "Two close friends." },
  legalAdvocacy: { decisionStatus: "No guardianship." },
  trustee: { moneyIsFor: "Comfort and outings." },
  finalWishes: { funeral: "Keep it simple." },
  personalMessage: { toCaregivers: "I love you." },
};

const seedScript = (data, meta) => `
  localStorage.setItem(${JSON.stringify(KEY)}, JSON.stringify({
    state: { data: ${JSON.stringify(data)}, meta: ${JSON.stringify(meta)} },
    version: 1
  }));
`;

/* ============================ A2-001 on PRODUCTION with the correct key */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const uncaught = [];
  page.on("pageerror", (e) => uncaught.push(String(e).slice(0, 160)));
  await page.addInitScript((k) => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key, v) {
      if (String(key) === k) {
        const e = new Error("The quota has been exceeded.");
        e.name = "QuotaExceededError";
        throw e;
      }
      return real.call(this, key, v);
    };
  }, KEY);
  const res = {};
  for (const route of ["/", "/letter", "/letter/getting-started", "/letter/medical", "/letter/review", "/your-data"]) {
    uncaught.length = 0;
    try {
      await page.goto(PROD + route, { waitUntil: "networkidle", timeout: 45000 });
    } catch { /* keep going, capture whatever rendered */ }
    await page.waitForTimeout(1800);
    res[route] = await page.evaluate(() => ({
      formInputs: document.querySelectorAll("main input, main textarea, main select").length,
      mainVisibleChars: (document.querySelector("main")?.innerText ?? "").trim().length,
      errorBoundaryShown: /couldn.{0,3}t load|reload to try again/i.test(document.body.innerText),
      visibleText: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 220),
    }));
    res[route].uncaughtErrors = [...uncaught];
  }
  out.A2_001_prod_blocked = res;
  await ctx.close();
}

/* ================= A2-002 with the correct key, on PRODUCTION and DEV */
for (const [envName, base] of [["prod", PROD], ["dev", DEV]]) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await page.goto(base + "/letter", { waitUntil: "networkidle" });
  await page.evaluate(
    ({ k, data }) => {
      localStorage.setItem(
        k,
        JSON.stringify({
          state: {
            data,
            meta: { letterPath: "specialNeeds", lastVisitedSlug: "medical", updatedAt: new Date().toISOString() },
          },
          version: 1,
        })
      );
    },
    { k: KEY, data: ONE_PER_SECTION }
  );
  await page.goto(base + "/letter/getting-started", { waitUntil: "networkidle" });
  await page.waitForTimeout(2000);
  const rail = await page.evaluate(() => {
    const bar = [...document.querySelectorAll("div")].find((e) =>
      (e.getAttribute("style") || "").includes("gradient-gold") &&
      (e.getAttribute("style") || "").includes("width")
    );
    return {
      barStyle: bar?.getAttribute("style") ?? null,
      notesLine: (document.body.innerText.match(/You've added notes to [^\n]*/) || [])[0] ?? null,
      everySectionHasNotes: (document.body.innerText.match(/Every section has notes\.[^\n]*/) || [])[0] ?? null,
    };
  });
  await page.goto(base + "/letter/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(2200);
  const review = await page.evaluate(() => ({
    everySectionHasNotes: (document.body.innerText.match(/Every section has notes\.[^\n]*/) || [])[0] ?? null,
    mentionsUnanswered: /haven.t (written|answered)|nothing yet|not written/i.test(document.body.innerText),
  }));
  out[`A2_002_${envName}`] = { rail, review };
  // A2-005: does "/" show a resume affordance with a real letter present?
  await page.goto(base + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out[`A2_005_${envName}`] = await page.evaluate(() => ({
    homePickUp: /pick up where you left off/i.test(document.body.innerText),
    homeContinue: /continue your letter/i.test(document.body.innerText),
    headerCta: (document.querySelector("header")?.innerText ?? "").replace(/\s+/g, " ").trim(),
  }));
  await page.goto(base + "/letter", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out[`A2_005_${envName}`].letterPagePickUp = await page.evaluate(() =>
    /pick up where you left off/i.test(document.body.innerText)
  );
  await ctx.close();
}

/* ====== A2-004: the explicit "Start the special needs letter" button y ====== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(PROD + "/letter", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out.A2_004_prod = await page.evaluate(() => {
    const exact = [...document.querySelectorAll("button,a")].filter(
      (e) => e.textContent.replace(/\s+/g, " ").trim().toLowerCase() === "start the special needs letter"
    );
    const anyCtaFirstViewport = [...document.querySelectorAll("button,a")].some((e) => {
      const r = e.getBoundingClientRect();
      return r.top >= 0 && r.top < 844 && /start/i.test(e.textContent);
    });
    return {
      documentHeight: document.documentElement.scrollHeight,
      screensOfScroll: +(document.documentElement.scrollHeight / 844).toFixed(1),
      exactStartButtons: exact.map((e) => ({
        y: Math.round(e.getBoundingClientRect().top + window.scrollY),
        tag: e.tagName,
        text: e.textContent.trim(),
      })),
      anyStartCtaInFirstViewport: anyCtaFirstViewport,
      headerHasStartCta: /start your letter/i.test(document.querySelector("header")?.innerText ?? ""),
    };
  });
  await ctx.close();
}

/* ======== A2-017: production first paint under Slow 3G / Fast 3G / none ==== */
{
  const presets = {
    slow3g: { download: (500 * 1024) / 8, upload: (500 * 1024) / 8, latency: 400 },
    fast3g: { download: (1.6 * 1024 * 1024) / 8, upload: (750 * 1024) / 8, latency: 150 },
    none: null,
  };
  out.A2_017 = {};
  for (const [name, cond] of Object.entries(presets)) {
    const ctx = await browser.newContext({
      viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", {
      offline: false,
      latency: cond?.latency ?? 0,
      downloadThroughput: cond?.download ?? -1,
      uploadThroughput: cond?.upload ?? -1,
    });
    let bytes = 0;
    page.on("response", async (r) => {
      const l = r.headers()["content-length"];
      if (l) bytes += Number(l);
    });
    const t0 = Date.now();
    try {
      await page.goto(PROD, { waitUntil: "load", timeout: 120000 });
    } catch { /* record what we have */ }
    const wall = Date.now() - t0;
    const paints = await page.evaluate(() => {
      const fcp = performance.getEntriesByName("first-contentful-paint")[0]?.startTime ?? null;
      const lcps = performance.getEntriesByType("largest-contentful-paint");
      return { fcp, lcp: lcps.length ? lcps.at(-1).startTime : null };
    });
    out.A2_017[name] = {
      wallMsToLoadEvent: wall,
      fcp: paints.fcp ? Math.round(paints.fcp) : null,
      lcp: paints.lcp ? Math.round(paints.lcp) : null,
      transferBytesHeaderSum: bytes,
    };
    await ctx.close();
  }
}

/* ======== A2-016: "Download all three" busy duration, 4x CPU throttle ==== */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 }, deviceScaleFactor: 3, isMobile: true, hasTouch: true,
    acceptDownloads: true,
  });
  const page = await ctx.newPage();
  await page.goto(DEV + "/letter", { waitUntil: "networkidle" });
  await page.evaluate(
    ({ k, data }) => {
      localStorage.setItem(k, JSON.stringify({
        state: { data, meta: { letterPath: "specialNeeds", updatedAt: new Date().toISOString() } },
        version: 1,
      }));
    },
    { k: KEY, data: ONE_PER_SECTION }
  );
  await page.goto(DEV + "/letter/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(2500);
  const cdp = await ctx.newCDPSession(page);
  await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
  const btn = page.locator("button", { hasText: /download all three/i }).first();
  const found = (await btn.count()) > 0;
  let ms = null, progressText = null;
  if (found) {
    const t0 = Date.now();
    await btn.click();
    for (let i = 0; i < 200; i++) {
      const state = await page.evaluate(() => {
        const b = [...document.querySelectorAll("button")].find((x) =>
          /download all three|preparing your files/i.test(x.textContent)
        );
        return { busy: !!b && (b.disabled || /preparing/i.test(b.textContent)), label: b?.textContent.trim() };
      });
      if (!state.busy) { ms = Date.now() - t0; break; }
      progressText ??= state.label;
      await page.waitForTimeout(250);
    }
  }
  out.A2_016 = { buttonFound: found, msUntilBusyCleared: ms, busyLabel: progressText, cpuThrottle: "4x" };
  await ctx.close();
}

await browser.close();
writeFileSync(new URL("../evidence/v1/a2-checks2.json", import.meta.url), JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 1));
