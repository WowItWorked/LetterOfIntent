/**
 * A2 — scripted persona runs with hard numbers.
 *
 * P1 exhausted parent, iPhone 390x844, CDP-throttled 3G, interrupted twice.
 * P2 grandparent, 1024 desktop at 200% zoom (approximated: 512x384 CSS px at
 *    deviceScaleFactor 2 — see note in the output; this is NOT real browser zoom).
 * P3 keyboard-only traversal (PROXY for a screen reader, not a screen reader).
 * P5 attorney reviewing a partially finished letter.
 *
 * Timings are from a DEV server (unminified, per-module) — absolute numbers are
 * NOT production. A production comparison run is included separately.
 *
 *   node audit/tools/a2-personas.mjs
 */
import { chromium, devices } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const KEY = "twl-loi-letter-v1";

const results = { base: BASE, capturedAt: new Date().toISOString(), notes: [], phases: {} };
const note = (s) => { results.notes.push(s); console.log("  NOTE " + s); };

/* Chrome DevTools "Slow 3G" preset. */
const SLOW_3G = {
  offline: false,
  downloadThroughput: (400 * 1024) / 8,
  uploadThroughput: (400 * 1024) / 8,
  latency: 2000,
};
/* Chrome DevTools "Fast 3G" preset. */
const FAST_3G = {
  offline: false,
  downloadThroughput: (1.6 * 1024 * 1024) / 8,
  uploadThroughput: (750 * 1024) / 8,
  latency: 562.5,
};

const PERF_INIT = () => {
  window.__lcp = 0;
  try {
    new PerformanceObserver((l) => {
      for (const e of l.getEntries()) window.__lcp = Math.max(window.__lcp, e.startTime);
    }).observe({ type: "largest-contentful-paint", buffered: true });
  } catch {}
};

const timings = (page) =>
  page.evaluate(() => {
    const n = performance.getEntriesByType("navigation")[0] || {};
    const fcp = performance.getEntriesByName("first-contentful-paint")[0];
    return {
      responseEnd: Math.round(n.responseEnd || 0),
      domContentLoaded: Math.round(n.domContentLoadedEventEnd || 0),
      load: Math.round(n.loadEventEnd || 0),
      fcp: fcp ? Math.round(fcp.startTime) : null,
      lcp: Math.round(window.__lcp || 0),
      transferBytes: performance
        .getEntriesByType("resource")
        .reduce((s, r) => s + (r.transferSize || 0), 0) + (n.transferSize || 0),
      requests: performance.getEntriesByType("resource").length + 1,
    };
  });

/** Everything a person can actually see without scrolling, plus offsets. */
const foldReport = (page) =>
  page.evaluate(() => {
    const vh = window.innerHeight;
    const inFold = (el) => {
      const r = el.getBoundingClientRect();
      return r.top < vh && r.bottom > 0 && r.width > 0 && r.height > 0;
    };
    const t = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
    const words = (s) => (s.match(/[A-Za-z0-9’'-]+/g) || []).length;

    const ctas = Array.from(document.querySelectorAll("a, button"))
      .filter((el) => /start|begin|create your letter|see what it asks/i.test(t(el)))
      .map((el) => ({
        label: t(el).slice(0, 70),
        y: Math.round(el.getBoundingClientRect().top + window.scrollY),
        inFirstViewport: inFold(el),
        w: Math.round(el.getBoundingClientRect().width),
        h: Math.round(el.getBoundingClientRect().height),
      }));

    // The privacy promise, wherever it first appears.
    const promiseEl = Array.from(document.querySelectorAll("p, h1, h2, h3, li, span")).find(
      (el) => /stays on (your|this) device|never leaves|nothing is uploaded|on this device only/i.test(t(el))
    );

    const foldText = Array.from(document.querySelectorAll("h1,h2,h3,p,li,a,button"))
      .filter(inFold)
      .map(t)
      .filter(Boolean);

    return {
      viewport: { w: window.innerWidth, h: vh },
      documentHeight: document.documentElement.scrollHeight,
      screensOfScroll: +(document.documentElement.scrollHeight / vh).toFixed(1),
      horizontalOverflow: document.documentElement.scrollWidth > window.innerWidth + 1,
      scrollWidth: document.documentElement.scrollWidth,
      ctas,
      firstCtaY: ctas.length ? Math.min(...ctas.map((c) => c.y)) : null,
      anyCtaInFirstViewport: ctas.some((c) => c.inFirstViewport),
      privacyPromise: promiseEl
        ? {
            text: t(promiseEl).slice(0, 160),
            y: Math.round(promiseEl.getBoundingClientRect().top + window.scrollY),
            inFirstViewport: inFold(promiseEl),
          }
        : null,
      wordsInFirstViewport: foldText.reduce((n, s) => n + words(s), 0),
      firstViewportText: foldText.slice(0, 30),
    };
  });

const seed = (data, meta = {}) =>
  JSON.stringify({ version: 1, state: { data, meta: { letterPath: "special-needs", ...meta } } });

const readStore = (page) =>
  page.evaluate((k) => {
    try { return JSON.parse(localStorage.getItem(k) || "null"); } catch { return null; }
  }, KEY);

async function newCtx(browser, opts = {}, storage = null) {
  const ctx = await browser.newContext({ ...opts });
  await ctx.addInitScript(PERF_INIT);
  if (storage !== null) {
    // Seed ONCE. addInitScript runs on every navigation, so an unconditional
    // setItem would silently wipe whatever the app saved and make every
    // reload/resume test look like data loss. Guard it.
    await ctx.addInitScript(
      ([k, v]) => {
        try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {}
      },
      [KEY, storage]
    );
  }
  return ctx;
}

/* ------------------------------------------------------------------ warm-up */
async function warm(browser) {
  const ctx = await browser.newContext();
  const page = await ctx.newPage();
  for (const r of ["/", "/letter", "/letter/getting-started", "/letter/medical",
                   "/letter/final-wishes", "/letter/review", "/your-data", "/privacy"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 120_000 }).catch(() => {});
  }
  await ctx.close();
  console.log("  dev routes compiled (warm-up done)");
}

/* ======================================================== P1 — exhausted parent */
async function p1(browser) {
  const out = { persona: "P1 exhausted parent, iPhone 390x844, Slow 3G", tasks: {} };
  const iphone = { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } };

  /* -- Task 1: homepage in 10 seconds, throttled ------------------------- */
  for (const [label, profile] of [["slow3g", SLOW_3G], ["fast3g", FAST_3G], ["unthrottled", null]]) {
    const ctx = await newCtx(browser, iphone, seed({}));
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (profile) await cdp.send("Network.emulateNetworkConditions", profile);
    const t0 = Date.now();
    let ok = true;
    try {
      await page.goto(BASE + "/", { waitUntil: "load", timeout: 180_000 });
    } catch { ok = false; }
    const wall = Date.now() - t0;
    await page.waitForTimeout(1200);
    out.tasks[`task1_home_${label}`] = {
      ok,
      wallMsToLoadEvent: wall,
      ...(await timings(page)),
      fold: await foldReport(page),
    };
    console.log(`  P1 home ${label}: ${wall}ms wall`);
    await ctx.close();
  }

  /* -- Task 2: begin a letter — count taps ------------------------------ */
  {
    const ctx = await newCtx(browser, iphone, seed({}));
    const page = await ctx.newPage();
    await page.goto(BASE + "/", { waitUntil: "networkidle" });
    let taps = 0;
    const trail = [];
    // On a 390px phone the masthead collapses to a hamburger (COMPACT_BELOW=1100),
    // so the header CTA costs an extra tap. Record whether it is directly usable.
    const headerCta = page.locator("header nav a").filter({ hasText: /start your letter/i }).first();
    trail.push(
      `header Start visible without opening the menu: ${
        (await headerCta.count()) ? await headerCta.isVisible().catch(() => false) : false
      }`
    );
    const hero = page.getByRole("link", { name: /start your letter/i }).first();
    await hero.scrollIntoViewIfNeeded();
    await hero.click(); taps++; trail.push("hero CTA 'Start your letter · it's free'");
    await page.waitForURL("**/letter", { timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    trail.push(`-> ${new URL(page.url()).pathname}`);

    if (new URL(page.url()).pathname === "/letter") {
      // Both start controls are <button>, not <a>. The PathChooser option card is
      // ALSO a button whose accessible name is the whole card — recorded below.
      const cardNames = await page.evaluate(() =>
        Array.from(document.querySelectorAll("section#pick button")).map((b) => {
          const n = (b.innerText || "").replace(/\s+/g, " ").trim();
          return { chars: n.length, words: (n.match(/\S+/g) || []).length, name: n.slice(0, 120) };
        })
      );
      trail.push(`PathChooser option cards are buttons with these accessible-name sizes: ${JSON.stringify(cardNames.map((c) => ({ chars: c.chars, words: c.words })))}`);
      out.tasks.pathChooserCardNames = cardNames;

      const start = page
        .getByRole("button", { name: "Start the special needs letter", exact: true })
        .first();
      const startY = await start
        .evaluate((el) => Math.round(el.getBoundingClientRect().top + window.scrollY))
        .catch(() => null);
      trail.push(`'Start the special needs letter' sits at y=${startY} on /letter`);
      await start.scrollIntoViewIfNeeded();
      await start.click(); taps++;
      trail.push("Start the special needs letter");
      await page.waitForURL(/\/letter\/[a-z-]+$/, { timeout: 30_000 }).catch(() => {});
      await page.waitForLoadState("networkidle");
      trail.push(`-> ${new URL(page.url()).pathname}`);
    }
    const firstField = page.locator("form input, form textarea").first();
    await firstField.waitFor({ timeout: 20_000 }).catch(() => {});
    const scrollToField = await page
      .evaluate(() => {
        const el = document.querySelector("form input, form textarea");
        return el ? Math.round(el.getBoundingClientRect().top + window.scrollY) : null;
      })
      .catch(() => null);
    out.tasks.task2_begin = {
      taps, trail, landedOn: new URL(page.url()).pathname,
      pxToScrollToFirstField: scrollToField,
      screensToFirstField: scrollToField ? +(scrollToField / 844).toFixed(2) : null,
      fold: await foldReport(page),
    };
    console.log(`  P1 begin: ${taps} taps, first field at y=${scrollToField}`);
    await ctx.close();
  }

  /* -- Task 3: complete one section, real keystrokes -------------------- */
  {
    const ctx = await newCtx(browser, iphone, seed({}));
    const page = await ctx.newPage();
    await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
    await page.waitForSelector("form input", { timeout: 20_000 });
    const answers = ["Maria Alvarez", "Mother", "Alexander James Alvarez", "Alex", "2026-08-09"];
    const controls = page.locator("form input, form textarea");
    const n = await controls.count();
    let keystrokes = 0;
    const t0 = Date.now();
    for (let i = 0; i < n; i++) {
      const el = controls.nth(i);
      const type = await el.getAttribute("type");
      const val = answers[i] ?? "Some answer";
      await el.scrollIntoViewIfNeeded();
      if (type === "date") { await el.fill(val); keystrokes += 8; }
      else { await el.click(); await el.pressSequentially(val, { delay: 12 }); keystrokes += val.length; }
    }
    const typingMs = Date.now() - t0;
    await page.waitForTimeout(900);
    const stored = await readStore(page);
    out.tasks.task3_one_section = {
      section: "getting-started",
      fields: n,
      keystrokes,
      typingMs,
      taps: n, // one focus tap per field
      savedAfter900ms: Boolean(stored?.state?.data?.gettingStarted?.subjectPreferredName),
      storedSection: stored?.state?.data?.gettingStarted ?? null,
      hasVisibleSaveIndicator: await page.evaluate(() =>
        /saved|saving/i.test(document.body.innerText)
      ),
      saveIndicatorText: await page.evaluate(() => {
        const m = (document.body.innerText || "").match(/[^\n]*sav(ed|ing)[^\n]*/i);
        return m ? m[0].trim().slice(0, 120) : null;
      }),
    };
    console.log(`  P1 section: ${n} fields, ${keystrokes} keystrokes, saved=${out.tasks.task3_one_section.savedAfter900ms}`);
    await ctx.close();
  }

  /* -- Task 4: interruptions -------------------------------------------- */
  {
    const survive = {};

    // (a) reload IMMEDIATELY after the last character — inside the 600ms debounce.
    {
      const ctx = await newCtx(browser, iphone, seed({}));
      const page = await ctx.newPage();
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForSelector("form input");
      const el = page.locator("form input").first();
      await el.click();
      await el.pressSequentially("Maria Alvarez", { delay: 5 });
      await page.reload({ waitUntil: "networkidle" }); // no wait: simulates a fast interruption
      await page.waitForTimeout(1200);
      survive.a_reload_immediately = {
        method: "typed 13 chars then reload() with zero delay (inside the 600ms autosave debounce)",
        valueAfter: await page.locator("form input").first().inputValue(),
        preserved: (await page.locator("form input").first().inputValue()) === "Maria Alvarez",
      };
      await ctx.close();
    }

    // (b) reload AFTER the debounce.
    {
      const ctx = await newCtx(browser, iphone, seed({}));
      const page = await ctx.newPage();
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForSelector("form input");
      const el = page.locator("form input").first();
      await el.click();
      await el.pressSequentially("Maria Alvarez", { delay: 5 });
      await page.waitForTimeout(900);
      await page.reload({ waitUntil: "networkidle" });
      await page.waitForTimeout(1200);
      survive.b_reload_after_debounce = {
        method: "typed then waited 900ms then reload()",
        valueAfter: await page.locator("form input").first().inputValue(),
        preserved: (await page.locator("form input").first().inputValue()) === "Maria Alvarez",
      };
      await ctx.close();
    }

    // (c) in-app navigation away immediately (unmount flush path).
    {
      const ctx = await newCtx(browser, iphone, seed({}));
      const page = await ctx.newPage();
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForSelector("form input");
      const el = page.locator("form input").first();
      await el.click();
      await el.pressSequentially("Maria Alvarez", { delay: 5 });
      const next = page.getByRole("link", { name: /^Next:/ }).first();
      await next.scrollIntoViewIfNeeded();
      await next.click();
      await page.waitForLoadState("networkidle");
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      survive.c_in_app_nav_immediately = {
        method: "typed then clicked Next with no pause (component unmount flush)",
        valueAfter: await page.locator("form input").first().inputValue(),
        preserved: (await page.locator("form input").first().inputValue()) === "Maria Alvarez",
      };
      await ctx.close();
    }

    // (d) tab/browser closed immediately (context.close, no unload flush chance).
    let storageAfterClose = null;
    {
      const ctx = await newCtx(browser, iphone, seed({}));
      const page = await ctx.newPage();
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForSelector("form input");
      const el = page.locator("form input").first();
      await el.click();
      await el.pressSequentially("Maria Alvarez", { delay: 5 });
      // Read localStorage the instant typing stops — this is what a hard close keeps.
      storageAfterClose = await readStore(page);
      await page.waitForTimeout(800);
      const after = await readStore(page);
      await ctx.close();
      survive.d_hard_close_immediately = {
        method:
          "typed 13 chars, read localStorage with zero delay (what a killed tab keeps), " +
          "then read again 800ms later",
        storedValueAtZeroDelay: storageAfterClose?.state?.data?.gettingStarted?.authorName ?? null,
        storedValueAfter800ms: after?.state?.data?.gettingStarted?.authorName ?? null,
        preserved: Boolean(storageAfterClose?.state?.data?.gettingStarted?.authorName),
        autosaveDebounceMs: 600,
        unloadFlushHandlerNote:
          "grep of src/ finds no beforeunload / pagehide / visibilitychange listener; " +
          "the only flush is SectionForm's React unmount cleanup.",
      };
    }

    // (e) browser restart: brand new context, storage carried over.
    {
      const prior = seed(
        { gettingStarted: { authorName: "Maria Alvarez", subjectPreferredName: "Alex" } },
        { lastVisitedSlug: "about", startedAt: "2026-08-08T23:10:00.000Z", updatedAt: "2026-08-08T23:12:00.000Z" }
      );
      const ctx = await newCtx(browser, iphone, prior);
      const page = await ctx.newPage();
      await page.goto(BASE + "/", { waitUntil: "networkidle" });
      const resume = await page.evaluate(() => {
        const t = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
        const el = Array.from(document.querySelectorAll("a, button, section, div")).find((e) =>
          /pick up where you left off|continue|resume|keep going/i.test(t(e))
        );
        return el ? { tag: el.tagName, text: t(el).slice(0, 200) } : null;
      });
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      survive.e_new_browser_session = {
        method: "brand-new browser context seeded with the same localStorage (a browser restart)",
        valueAfter: await page.locator("form input").first().inputValue(),
        preserved: (await page.locator("form input").first().inputValue()) === "Maria Alvarez",
        resumeAffordanceOnHome: resume,
      };
      await ctx.close();
    }

    // (f) 30-minute idle — SIMULATED by rewriting meta.updatedAt, not by waiting.
    {
      const thirtyAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      const prior = seed(
        { gettingStarted: { authorName: "Maria Alvarez", subjectPreferredName: "Alex" } },
        { lastVisitedSlug: "about", startedAt: thirtyAgo, updatedAt: thirtyAgo }
      );
      const ctx = await newCtx(browser, iphone, prior);
      const page = await ctx.newPage();
      await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
      await page.waitForTimeout(900);
      survive.f_thirty_minute_idle_simulated = {
        method:
          "SIMULATED: meta.startedAt/updatedAt rewritten to 30 minutes ago, then the app opened cold. " +
          "No real 30-minute wait was performed.",
        valueAfter: await page.locator("form input").first().inputValue(),
        preserved: (await page.locator("form input").first().inputValue()) === "Maria Alvarez",
        anyExpiryOrTimeoutCopy: await page.evaluate(() =>
          /expire|timed out|session|log ?in/i.test(document.body.innerText)
        ),
      };
      await ctx.close();
    }

    out.tasks.task4_leave_and_return = survive;
    console.log("  P1 interruption results:", JSON.stringify(
      Object.fromEntries(Object.entries(survive).map(([k, v]) => [k, v.preserved])), null, 0));
  }

  return out;
}

/* ===================================== P2 — grandparent, 1024 desktop @200% zoom */
async function p2(browser) {
  const out = {
    persona: "P2 grandparent, 1024 desktop at 200% zoom",
    zoomMethod:
      "APPROXIMATION. Real browser zoom was not driven. 200% zoom on a 1024x768 window was " +
      "emulated as a 512x384 CSS-pixel viewport at deviceScaleFactor 2, which reproduces the " +
      "CSS layout consequence (halved CSS viewport) but not font-boosting or browser chrome.",
    routes: {},
  };
  const ctx = await newCtx(
    browser,
    { viewport: { width: 512, height: 384 }, deviceScaleFactor: 2 },
    seed({ gettingStarted: { authorName: "Maria Alvarez", subjectPreferredName: "Alex" } })
  );
  const page = await ctx.newPage();
  for (const r of ["/", "/letter", "/letter/getting-started", "/letter/medical", "/letter/review", "/your-data"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(500);
    const fold = await foldReport(page);
    const chrome = await page.evaluate(() => {
      const sticky = Array.from(document.querySelectorAll("*")).filter((el) => {
        const cs = getComputedStyle(el);
        return (cs.position === "sticky" || cs.position === "fixed") && el.getBoundingClientRect().height > 8;
      });
      const header = document.querySelector("header");
      const small = Array.from(document.querySelectorAll("a, button, input, textarea, select"))
        .map((el) => ({ r: el.getBoundingClientRect(), t: (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim() }))
        .filter((x) => x.r.width > 0 && x.r.height > 0 && (x.r.height < 24 || x.r.width < 24))
        .map((x) => ({ label: x.t.slice(0, 50), w: Math.round(x.r.width), h: Math.round(x.r.height) }));
      return {
        headerHeight: header ? Math.round(header.getBoundingClientRect().height) : null,
        headerPctOfViewport: header
          ? Math.round((header.getBoundingClientRect().height / window.innerHeight) * 100)
          : null,
        stickyOrFixedCount: sticky.length,
        smallTargets: small.slice(0, 12),
        smallTargetCount: small.length,
        baseFontPx: parseFloat(getComputedStyle(document.body).fontSize),
      };
    });
    out.routes[r] = { ...fold, ...chrome };
    console.log(`  P2 ${r}: hOverflow=${fold.horizontalOverflow} scrollW=${fold.scrollWidth} screens=${fold.screensOfScroll} header=${chrome.headerPctOfViewport}% of viewport`);
  }
  await ctx.close();
  return out;
}

/* ===================================== P3 — keyboard only (screen-reader PROXY) */
async function p3(browser) {
  const out = {
    persona: "P3 blind screen reader user — KEYBOARD ONLY",
    disclosure:
      "NVDA/VoiceOver were NOT driven. This is a keyboard traversal plus an accessibility-tree " +
      "read via Playwright. It is a PROXY: it cannot tell you what is actually announced, in what " +
      "order, or whether a live region fires. Every P3 finding is INSPECTED, not MEASURED.",
    routes: {},
  };
  const ctx = await newCtx(
    browser,
    { viewport: { width: 1280, height: 900 } },
    seed({ gettingStarted: { authorName: "Maria Alvarez", subjectPreferredName: "Alex" } })
  );
  const page = await ctx.newPage();

  for (const r of ["/", "/letter/getting-started", "/letter/review"]) {
    await page.goto(BASE + r, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(600);

    const structure = await page.evaluate(() => {
      const t = (el) => (el.innerText || el.textContent || "").replace(/\s+/g, " ").trim();
      return {
        headings: Array.from(document.querySelectorAll("h1,h2,h3,h4,h5,h6")).map(
          (h) => `${h.tagName} ${t(h).slice(0, 70)}`
        ),
        landmarks: Array.from(
          document.querySelectorAll("header,nav,main,aside,footer,[role=banner],[role=navigation],[role=main],[role=contentinfo],[role=complementary]")
        ).map((el) => `${el.tagName.toLowerCase()}${el.getAttribute("aria-label") ? `[${el.getAttribute("aria-label")}]` : ""}`),
        liveRegions: Array.from(document.querySelectorAll("[aria-live]")).map((el) => ({
          politeness: el.getAttribute("aria-live"),
          atomic: el.getAttribute("aria-atomic"),
          currentText: t(el).slice(0, 90),
          srOnly: /sr-only/.test(el.className || ""),
          parentTag: el.parentElement?.tagName,
        })),
        skipLinkFirst: (() => {
          const a = document.querySelector("a[href^='#']");
          return a ? t(a).slice(0, 60) : null;
        })(),
        formLandmark: Boolean(document.querySelector("form[aria-label]")),
        formAriaLabel: document.querySelector("form")?.getAttribute("aria-label") || null,
        h1Count: document.querySelectorAll("h1").length,
        unlabelledControls: Array.from(document.querySelectorAll("input,textarea,select")).filter(
          (el) => {
            const id = el.id;
            const lab = id && document.querySelector(`label[for="${CSS.escape(id)}"]`);
            return !lab && !el.getAttribute("aria-label") && !el.getAttribute("aria-labelledby") && !el.closest("label");
          }
        ).length,
      };
    });

    // Tab traversal from the very top of the document.
    await page.evaluate(() => { document.body.focus(); window.scrollTo(0, 0); });
    await page.keyboard.press("Home");
    const order = [];
    let firstFieldTabIndex = null;
    let firstSectionNavTabIndex = null;
    for (let i = 1; i <= 90; i++) {
      await page.keyboard.press("Tab");
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        const cs = getComputedStyle(el);
        const r = el.getBoundingClientRect();
        return {
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type"),
          role: el.getAttribute("role"),
          name: (el.innerText || el.getAttribute("aria-label") || el.getAttribute("placeholder") || (el.labels && el.labels[0]?.innerText) || "")
            .replace(/\s+/g, " ").trim().slice(0, 60),
          href: el.getAttribute("href"),
          visibleOutline: cs.outlineStyle !== "none" || cs.boxShadow !== "none",
          offscreen: r.width === 0 || r.height === 0,
          inForm: Boolean(el.closest("form")),
          inNav: Boolean(el.closest("nav")),
        };
      });
      if (!info) break;
      order.push(info);
      if (firstFieldTabIndex === null && info.inForm && (info.tag === "input" || info.tag === "textarea"))
        firstFieldTabIndex = i;
      if (firstSectionNavTabIndex === null && info.inNav && /section|nav/i.test(info.name + (info.href || "")))
        firstSectionNavTabIndex = i;
      if (firstFieldTabIndex !== null && i > firstFieldTabIndex + 12) break;
    }

    out.routes[r] = {
      ...structure,
      tabsToFirstFormField: firstFieldTabIndex,
      tabStopsRecorded: order.length,
      tabOrder: order.map((o) => `${o.tag}${o.type ? ":" + o.type : ""} "${o.name}"${o.offscreen ? " [0x0]" : ""}${o.visibleOutline ? "" : " [NO-FOCUS-STYLE]"}`),
      focusStopsWithoutVisibleStyle: order.filter((o) => !o.visibleOutline).length,
    };
    console.log(`  P3 ${r}: ${firstFieldTabIndex ?? "n/a"} tabs to first field, ${structure.liveRegions.length} live regions, skip link = ${structure.skipLinkFirst}`);
  }
  await ctx.close();
  return out;
}

/* ============================== P5 — attorney reviewing a partial letter + PDFs */
async function p5(browser) {
  const out = { persona: "P5 special needs trust attorney", checks: {} };

  const partial = {
    gettingStarted: { authorName: "Maria Alvarez", subjectFullName: "Alexander James Alvarez", subjectPreferredName: "Alex", letterDate: "2026-08-09" },
    about: { diagnoses: "Autism spectrum disorder, level 2. Epilepsy." },
    medical: { allergies: "Penicillin — hives." },
  };

  const ctx = await newCtx(
    browser,
    { viewport: { width: 1280, height: 1000 }, acceptDownloads: true },
    seed(partial)
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter/review", { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(1200);

  out.checks.reviewPage = await page.evaluate(() => {
    const t = (el) => (el?.innerText || "").replace(/\s+/g, " ").trim();
    const body = document.body.innerText;
    const missingHeading = Array.from(document.querySelectorAll("h3")).find((h) =>
      /without notes/i.test(t(h))
    );
    return {
      leadParagraph: t(document.querySelector("h1")?.parentElement?.querySelector("p:last-of-type")),
      saysHowManySections: /\d+ of \d+ sections/i.test(body),
      countLine: (body.match(/[^\n]*\d+ of \d+ sections[^\n]*/i) || [])[0] || null,
      listsMissingSections: Boolean(missingHeading),
      missingSectionNames: missingHeading
        ? Array.from(missingHeading.parentElement.querySelectorAll("li a")).map((a) => t(a))
        : [],
      hasLastUpdatedDate: /last updated/i.test(body),
      hasWrittenBy: /written by/i.test(body),
      downloadButtons: Array.from(document.querySelectorAll("button"))
        .map((b) => t(b))
        .filter((s) => /download|prepar/i.test(s)),
    };
  });

  /* PDF generation timing at this fill level. */
  const t0 = Date.now();
  let dl = null;
  try {
    [dl] = await Promise.all([
      page.waitForEvent("download", { timeout: 120_000 }),
      page.getByRole("button", { name: /^Download$/ }).first().click(),
    ]);
  } catch (e) { out.checks.pdfError = e.message.slice(0, 160); }
  out.checks.letterPdf = {
    ms: Date.now() - t0,
    filename: dl ? dl.suggestedFilename() : null,
  };
  console.log(`  P5 letter PDF: ${out.checks.letterPdf.ms}ms -> ${out.checks.letterPdf.filename}`);
  await ctx.close();

  /* Same generation on a CPU-throttled phone (4x slowdown) at maximal fill. */
  try {
    const maxData = {};
    const long = Array.from({ length: 10 }, (_, i) =>
      `Sentence ${i + 1} of the kind of detail a family actually writes here.`).join(" ");
    for (const k of ["gettingStarted", "about", "familySupport", "typicalDay", "communication",
      "medical", "behavior", "educationWork", "housing", "benefitsFinances", "socialFaith",
      "legalAdvocacy", "trustee", "finalWishes", "personalMessage"]) {
      maxData[k] = { note: long, summary: long, detail: long };
    }
    maxData.gettingStarted = { authorName: "Maria Alvarez", subjectFullName: "Alexander James Alvarez", subjectPreferredName: "Alex", letterDate: "2026-08-09" };
    const ctx2 = await newCtx(
      browser,
      { ...devices["iPhone 13"], viewport: { width: 390, height: 844 }, acceptDownloads: true },
      seed(maxData)
    );
    const page2 = await ctx2.newPage();
    const cdp = await ctx2.newCDPSession(page2);
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    await page2.goto(BASE + "/letter/review", { waitUntil: "networkidle", timeout: 120_000 });
    await page2.waitForTimeout(1500);
    const t1 = Date.now();
    let d2 = null;
    try {
      [d2] = await Promise.all([
        page2.waitForEvent("download", { timeout: 180_000 }),
        page2.getByRole("button", { name: /download all three/i }).first().click(),
      ]);
    } catch (e) { out.checks.mobilePdfError = e.message.slice(0, 160); }
    // Wait for the busy state to clear (all three files).
    await page2
      .waitForFunction(() => !/Preparing/i.test(document.body.innerText), { timeout: 240_000 })
      .catch(() => {});
    out.checks.mobileAllThreePdf = {
      cpuThrottle: "4x slowdown via CDP Emulation.setCPUThrottlingRate (an approximation of a mid-range phone)",
      msUntilBusyCleared: Date.now() - t1,
      firstFile: d2 ? d2.suggestedFilename() : null,
      anyProgressIndicatorText: await page2.evaluate(() => {
        const m = (document.body.innerText || "").match(/[^\n]*prepar[^\n]*/i);
        return m ? m[0].trim().slice(0, 120) : null;
      }),
    };
    console.log(`  P5 mobile all-three: ${out.checks.mobileAllThreePdf.msUntilBusyCleared}ms`);
    await ctx2.close();
  } catch (e) {
    out.checks.mobileAllThreeError = String(e).slice(0, 200);
  }

  return out;
}

/* ========================== Task 7 — return the next day to revise one answer */
async function task7(browser) {
  const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
  const data = {
    gettingStarted: { authorName: "Maria Alvarez", subjectFullName: "Alexander James Alvarez", subjectPreferredName: "Alex", letterDate: "2026-08-08" },
    medical: { allergies: "Penicillin", primaryDoctor: "Dr Chen" },
  };
  const ctx = await newCtx(
    browser,
    { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } },
    seed(data, { lastVisitedSlug: "medical", startedAt: yesterday, updatedAt: yesterday })
  );
  const page = await ctx.newPage();
  await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 90_000 });
  const homeResume = await page.evaluate(() => {
    const t = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
    const el = Array.from(document.querySelectorAll("a,button")).find((e) =>
      /pick up|continue|resume|keep going|where you left/i.test(t(e))
    );
    return el
      ? { text: t(el).slice(0, 120), href: el.getAttribute("href"), y: Math.round(el.getBoundingClientRect().top + window.scrollY), inFirstViewport: el.getBoundingClientRect().top < window.innerHeight }
      : null;
  });

  let taps = 0;
  const trail = [];
  trail.push(`resume affordance on "/" : ${homeResume ? "yes" : "NONE"}`);

  // Shortest real route on a phone: hero CTA -> /letter -> ResumeCard.
  const hero = page.getByRole("link", { name: /start your letter/i }).first();
  await hero.scrollIntoViewIfNeeded();
  await hero.click(); taps++; trail.push("hero CTA -> /letter");
  await page.waitForURL("**/letter", { timeout: 30_000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(600);

  const resumeCard = await page.evaluate(() => {
    const t = (el) => (el.innerText || "").replace(/\s+/g, " ").trim();
    const a = Array.from(document.querySelectorAll("a")).find((e) => /pick up where you left off/i.test(t(e)));
    return a
      ? {
          text: t(a),
          href: a.getAttribute("href"),
          y: Math.round(a.getBoundingClientRect().top + window.scrollY),
          inFirstViewport: a.getBoundingClientRect().top < window.innerHeight && a.getBoundingClientRect().bottom > 0,
        }
      : null;
  });
  trail.push(`ResumeCard on /letter: ${resumeCard ? JSON.stringify(resumeCard) : "NONE"}`);

  if (resumeCard) {
    const link = page.getByRole("link", { name: /pick up where you left off/i }).first();
    await link.scrollIntoViewIfNeeded();
    await link.click(); taps++; trail.push("Pick up where you left off");
    await page.waitForURL(/\/letter\/[a-z-]+$/, { timeout: 30_000 }).catch(() => {});
    await page.waitForLoadState("networkidle");
    trail.push(`-> ${new URL(page.url()).pathname}`);
  }

  // Now reach the medical section and change the allergy answer.
  if (new URL(page.url()).pathname !== "/letter/medical") {
    const details = page.locator("details").filter({ hasText: /sections/i }).first();
    if (await details.count()) {
      await details.locator("summary").click(); taps++; trail.push("open the 'Sections' accordion");
      await page.waitForTimeout(300);
    }
    const link = page.getByRole("link", { name: /^Medical$/ }).first();
    if (await link.count()) {
      await link.scrollIntoViewIfNeeded();
      await link.click(); taps++; trail.push("Medical");
      await page.waitForURL(/\/letter\/medical$/, { timeout: 30_000 }).catch(() => {});
      await page.waitForLoadState("networkidle");
    }
  }
  await page.waitForSelector("form input, form textarea", { timeout: 20_000 }).catch(() => {});
  const yOfAllergy = await page.evaluate(() => {
    const lab = Array.from(document.querySelectorAll("label")).find((l) => /allerg/i.test(l.innerText));
    if (!lab) return null;
    return Math.round(lab.getBoundingClientRect().top + window.scrollY);
  });

  const out = {
    task: "7 — return the next day and revise one answer",
    homeResumeAffordance: homeResume,
    taps,
    trail,
    landedOn: new URL(page.url()).pathname,
    pxScrollToTheAnswerBeingRevised: yOfAllergy,
    screensOfScrollToIt: yOfAllergy ? +(yOfAllergy / 844).toFixed(2) : null,
    anyFindOrSearch: await page.evaluate(() =>
      Boolean(document.querySelector("input[type=search], [role=search]"))
    ),
  };
  console.log(`  Task7: ${taps} taps, landed ${out.landedOn}, answer at y=${yOfAllergy}`);
  await ctx.close();
  return out;
}

/* ===================== production comparison (read-only, nothing is typed) */
async function production(browser) {
  const out = {
    what: "Read-only load timings on the real production site, iPhone 390x844. Nothing was typed.",
    runs: {},
  };
  const iphone = { ...devices["iPhone 13"], viewport: { width: 390, height: 844 } };
  for (const [label, profile] of [["slow3g", SLOW_3G], ["fast3g", FAST_3G], ["unthrottled", null]]) {
    const ctx = await newCtx(browser, iphone);
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    if (profile) await cdp.send("Network.emulateNetworkConditions", profile);
    const t0 = Date.now();
    let ok = true;
    try {
      await page.goto("https://myletterofintent.com/", { waitUntil: "load", timeout: 180_000 });
    } catch { ok = false; }
    const wall = Date.now() - t0;
    await page.waitForTimeout(1500);
    out.runs[label] = { ok, wallMsToLoadEvent: wall, ...(await timings(page)) };
    if (label === "unthrottled") out.runs[label].fold = await foldReport(page);
    console.log(`  PROD home ${label}: ${wall}ms wall, fcp=${out.runs[label].fcp} lcp=${out.runs[label].lcp} bytes=${out.runs[label].transferBytes}`);
    await ctx.close();
  }
  return out;
}

/* --------------------------------------------------------------------- main */
const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  note("Dev server (next dev) — load timings are unminified per-module and are NOT production numbers.");
  await warm(browser);

  const only = (process.env.A2_PHASES || "").split(",").filter(Boolean);
  for (const [name, fn] of [["P1", p1], ["P2", p2], ["P3", p3], ["P5", p5], ["task7", task7], ["production", production]]) {
    if (only.length && !only.includes(name)) continue;
    try {
      console.log(`--- ${name}`);
      results.phases[name] = await fn(browser);
    } catch (e) {
      results.phases[name] = { FAILED: String(e).slice(0, 400) };
      console.error(`  ${name} FAILED:`, String(e).slice(0, 300));
    }
  }
  await browser.close();
  const file = only.length ? `persona-runs-${only.join("-")}.json` : "persona-runs.json";
  await writeFile(path.join(OUT, file), JSON.stringify(results, null, 2));
  console.log(`  -> audit/evidence/a2/${file}`);
};

main().catch((e) => { console.error(e); process.exit(1); });
