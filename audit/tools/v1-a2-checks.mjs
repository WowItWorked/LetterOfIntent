/**
 * V1 verifier — adversarial reproduction of A2's usability measurements.
 * Runs against PRODUCTION where A2 claimed production, and against the running
 * dev server where A2 claimed local. Nothing is typed into production beyond
 * an in-page localStorage patch in an ephemeral browser context.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const DEV = "http://localhost:3000";
const BASE = process.env.V1_BASE || DEV;
const out = { base: BASE };
const browser = await chromium.launch();

/* ======================================= A2-001: localStorage refuses writes */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const uncaught = [];
  page.on("pageerror", (e) => uncaught.push(String(e).slice(0, 140)));
  await page.addInitScript(() => {
    const real = Storage.prototype.setItem;
    Storage.prototype.setItem = function (k, v) {
      if (String(k).startsWith("mloi")) {
        const e = new Error("The quota has been exceeded.");
        e.name = "QuotaExceededError";
        throw e;
      }
      return real.call(this, k, v);
    };
  });
  const res = {};
  for (const route of ["/", "/letter", "/letter/getting-started", "/letter/medical", "/letter/review"]) {
    uncaught.length = 0;
    await page.goto(PROD + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    res[route] = await page.evaluate(() => ({
      formInputs: document.querySelectorAll("main input, main textarea, main select").length,
      mainChars: (document.querySelector("main")?.innerText ?? "").trim().length,
      bodyStart: document.body.innerText.replace(/\s+/g, " ").trim().slice(0, 150),
      errorBoundaryText: /couldn.t load|reload to try again/i.test(document.body.innerText),
    }));
    res[route].uncaughtErrors = [...uncaught];
  }
  out.A2_001_storageBlockedProd = res;
  await ctx.close();
}
/* control run, same URLs, no patch */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const res = {};
  for (const route of ["/letter/getting-started", "/letter/medical"]) {
    await page.goto(PROD + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1200);
    res[route] = await page.evaluate(() => ({
      formInputs: document.querySelectorAll("main input, main textarea, main select").length,
      mainChars: (document.querySelector("main")?.innerText ?? "").trim().length,
    }));
  }
  out.A2_001_controlProd = res;
  await ctx.close();
}

/* ====================== A2-002: progress with one answer per section (dev) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter", { waitUntil: "networkidle" });
  // Seed exactly one scalar answer in each of the 15 special-needs sections.
  const seeded = await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("mloi"));
    const data = {
      gettingStarted: { preferredName: "Alex" },
      about: { strengths: "Loves trains." },
      familySupport: { firstCall: "My sister Dana." },
      typicalDay: { morning: "Wakes at 6:30." },
      communication: { howTheyCommunicate: "Short sentences." },
      medical: { allergies: "Penicillin." },
      behavior: { triggers: "Loud rooms." },
      educationWork: { school: "Northside High." },
      housing: { current: "Lives at home." },
      benefitsFinances: { benefits: "SSI." },
      socialFaith: { faith: "Goes on Sundays." },
      legalAdvocacy: { guardianship: "None." },
      trustee: { whoIsTrustee: "Aunt Ruth." },
      finalWishes: { wishes: "Keep it simple." },
      personalMessage: { message: "I love you." },
    };
    localStorage.setItem(
      key || "mloi.letter",
      JSON.stringify({
        state: { data, meta: { letterPath: "specialNeeds", updatedAt: new Date().toISOString() } },
        version: 1,
      })
    );
    return { storageKey: key || "mloi.letter", sections: Object.keys(data).length };
  });
  await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_002 = {
    seeded,
    rail: await page.evaluate(() => {
      const bars = [...document.querySelectorAll("div,span")].filter((e) => {
        const s = e.getAttribute("style") || "";
        return /width:\s*\d+%/.test(s) && /gradient|gold/.test(s + e.className);
      });
      const nav = document.querySelector("nav, aside, details");
      return {
        barStyles: bars.map((b) => b.getAttribute("style").slice(0, 90)),
        railText: (nav?.innerText ?? "").replace(/\s+/g, " ").slice(0, 320),
        anyEverySectionHasNotes: /every section has notes/i.test(document.body.innerText),
        bodyMentions: (document.body.innerText.match(/You.?ve added notes to [^.]*\./) || [])[0] ?? null,
      };
    }),
  };
  await page.goto(BASE + "/letter/review", { waitUntil: "networkidle" });
  await page.waitForTimeout(1800);
  out.A2_002.review = await page.evaluate(() => ({
    everySectionHasNotes: /every section has notes/i.test(document.body.innerText),
    lead: (document.body.innerText.match(/Every section has notes\.[^\n]*/) || [])[0] ?? null,
  }));
  await ctx.close();
}

/* ============================ A2-004: /letter geometry on a 390x844 phone */
{
  const ctx = await browser.newContext({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 3,
    isMobile: true,
    hasTouch: true,
  });
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_004 = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button,a")].find((e) =>
      /start the special needs letter/i.test(e.textContent)
    );
    const cards = [...document.querySelectorAll("button")].filter(
      (b) => b.getBoundingClientRect().height > 300
    );
    return {
      documentHeight: document.documentElement.scrollHeight,
      screensOfScroll: +(document.documentElement.scrollHeight / 844).toFixed(1),
      startButtonY: btn ? Math.round(btn.getBoundingClientRect().top + window.scrollY) : null,
      startButtonLabel: btn?.textContent.trim().slice(0, 50) ?? null,
      bigOptionCards: cards.map((c) => ({
        h: Math.round(c.getBoundingClientRect().height),
        tag: c.tagName,
        nameChars: c.textContent.replace(/\s+/g, " ").trim().length,
        nameWords: c.textContent.replace(/\s+/g, " ").trim().split(" ").length,
        namePreview: c.textContent.replace(/\s+/g, " ").trim().slice(0, 70),
      })),
    };
  });
  // A2-004 also: header CTA hidden behind a hamburger below 1100px
  out.A2_004.headerCtaVisibleWithoutMenu = await page.evaluate(() => {
    const h = document.querySelector("header");
    return /start your letter/i.test(h?.innerText ?? "");
  });
  await ctx.close();
}

/* ================= A2-005: returning visitor lands on "/" with a letter */
{
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter", { waitUntil: "networkidle" });
  await page.evaluate(() => {
    const key = Object.keys(localStorage).find((k) => k.startsWith("mloi")) || "mloi.letter";
    const yesterday = new Date(Date.now() - 24 * 3600 * 1000).toISOString();
    localStorage.setItem(
      key,
      JSON.stringify({
        state: {
          data: { gettingStarted: { preferredName: "Alex" }, medical: { allergies: "Penicillin." } },
          meta: { letterPath: "specialNeeds", lastVisitedSlug: "medical", startedAt: yesterday, updatedAt: yesterday },
        },
        version: 1,
      })
    );
  });
  await page.goto(BASE + "/", { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  out.A2_005 = {
    home: await page.evaluate(() => ({
      pickUpWhereYouLeftOff: /pick up where you left off/i.test(document.body.innerText),
      continueYourLetter: /continue your letter/i.test(document.body.innerText),
      mentionsAlex: /alex/i.test(document.body.innerText),
      headerText: (document.querySelector("header")?.innerText ?? "").replace(/\s+/g, " ").slice(0, 120),
    })),
  };
  await page.goto(BASE + "/letter", { waitUntil: "networkidle" });
  await page.waitForTimeout(1600);
  out.A2_005.letterPage = await page.evaluate(() => ({
    pickUpWhereYouLeftOff: /pick up where you left off/i.test(document.body.innerText),
  }));
  await ctx.close();
}

/* =================== A2-006 / A2-012 / A2-015: keyboard + headings + search */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  const res = {};
  for (const route of ["/letter/getting-started", "/letter/medical"]) {
    await page.goto(BASE + route, { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    await page.evaluate(() => { document.body.focus(); if (document.activeElement) document.activeElement.blur(); });
    const trail = [];
    let stops = 0, hit = null;
    for (let i = 0; i < 70; i++) {
      await page.keyboard.press("Tab");
      stops++;
      const info = await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return null;
        return {
          tag: el.tagName.toLowerCase(),
          type: el.getAttribute("type") ?? null,
          name: (el.getAttribute("aria-label") || el.textContent || el.getAttribute("name") || "")
            .replace(/\s+/g, " ").trim().slice(0, 40),
          isField: ["input", "textarea", "select"].includes(el.tagName.toLowerCase()),
          inMainArticle: !!el.closest("article, form"),
        };
      });
      trail.push(info ? `${info.tag}${info.type ? ":" + info.type : ""} ${info.name}` : "(body)");
      if (info?.isField) { hit = stops; break; }
    }
    res[route] = {
      tabsToFirstFormField: hit,
      tabTrail: trail,
      headingsInMain: await page.evaluate(() =>
        [...document.querySelectorAll("main h1,main h2,main h3,main h4")].map(
          (h) => `${h.tagName} ${h.textContent.trim().slice(0, 40)}`
        )
      ),
      searchAffordance: await page.evaluate(() => ({
        roleSearch: document.querySelectorAll('[role="search"]').length,
        searchInput: document.querySelectorAll('input[type="search"]').length,
      })),
      railInsideMain: await page.evaluate(() => {
        const main = document.querySelector("main");
        const nav = main?.querySelector("nav, details");
        return !!nav;
      }),
      skipLinkTarget: await page.evaluate(() => {
        const a = [...document.querySelectorAll("a")].find((x) => /skip to/i.test(x.textContent));
        return a ? { text: a.textContent.trim(), href: a.getAttribute("href") } : null;
      }),
      pageScrollHeight: await page.evaluate(() => document.documentElement.scrollHeight),
    };
  }
  out.A2_006_012_015 = res;
  await ctx.close();
}

/* ===================================== A2-007: 200% zoom emulation, 512x384 */
{
  for (const [label, vp, dsf] of [
    ["zoom200-512x384", { width: 512, height: 384 }, 2],
    ["zoom100-1024x768", { width: 1024, height: 768 }, 1],
  ]) {
    const ctx = await browser.newContext({ viewport: vp, deviceScaleFactor: dsf });
    const page = await ctx.newPage();
    await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
    await page.waitForTimeout(1500);
    out.A2_007 ??= {};
    out.A2_007[label] = await page.evaluate((vh) => {
      const h = document.querySelector("header");
      const hr = h?.getBoundingClientRect();
      // The privacy strip is the element immediately after the header.
      const strip = h?.nextElementSibling;
      const sr = strip?.getBoundingClientRect();
      const stripIsPrivacy = /private|device|never sent/i.test(strip?.innerText ?? "");
      const headerH = Math.round(hr?.height ?? 0);
      const stripH = stripIsPrivacy ? Math.round(sr?.height ?? 0) : 0;
      return {
        viewportH: vh,
        headerH,
        stripH,
        headerPosition: h ? getComputedStyle(h).position : null,
        chromePctOfViewport: Math.round(((headerH + stripH) / vh) * 100),
        usableRows: vh - headerH - stripH,
        screens: +(document.documentElement.scrollHeight / vh).toFixed(1),
        horizontalOverflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
        scrollWidth: document.documentElement.scrollWidth,
        firstFieldY: (() => {
          const f = document.querySelector("main input, main textarea");
          return f ? Math.round(f.getBoundingClientRect().top + window.scrollY) : null;
        })(),
      };
    }, vp.height);
    await ctx.close();
  }
}

/* ================== A2-008 / A2-010: repeaters empty, date field empty */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter/medical", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_008 = await page.evaluate(() => ({
    controlCount: document.querySelectorAll("main input, main textarea, main select").length,
    addButtons: [...document.querySelectorAll("button")]
      .filter((b) => /^\+?\s*add/i.test(b.textContent.trim()))
      .map((b) => b.textContent.trim()),
    emptyRepeaterCopy: (document.body.innerText.match(/Nothing here yet[^\n]*/g) || []),
  }));
  await page.goto(BASE + "/letter/family-and-support", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_008.familyAndSupport = await page.evaluate(() => ({
    controlCount: document.querySelectorAll("main input, main textarea, main select").length,
    emptyRepeaterCopy: (document.body.innerText.match(/Nothing here yet[^\n]*/g) || []),
    firstCallLabel: [...document.querySelectorAll("label")]
      .map((l) => l.textContent.trim())
      .filter((t) => /call first/i.test(t)),
  }));
  await page.goto(BASE + "/letter/getting-started", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_010 = await page.evaluate(() => {
    const d = document.querySelector('input[type="date"]');
    const lab = d ? document.querySelector(`label[for="${d.id}"]`) : null;
    return {
      dateInputPresent: !!d,
      value: d?.value ?? null,
      label: lab?.textContent.trim() ?? null,
      helpNearby: d?.closest("div")?.innerText.replace(/\s+/g, " ").slice(0, 160) ?? null,
    };
  });
  await ctx.close();
}

/* =============================== A2-011: PathChooser accessible name length */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  const page = await ctx.newPage();
  await page.goto(BASE + "/letter", { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.A2_011 = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("button")].filter(
      (b) => b.textContent.trim().length > 200
    );
    return btns.map((b) => {
      const t = b.textContent.replace(/\s+/g, " ").trim();
      return {
        chars: t.length,
        words: t.split(" ").length,
        headingsInside: b.querySelectorAll("h1,h2,h3,h4,h5,h6").length,
        preview: t.slice(0, 90),
      };
    });
  });
  await ctx.close();
}

await browser.close();
writeFileSync(new URL("../evidence/v1/a2-checks.json", import.meta.url), JSON.stringify(out, null, 2));
console.log("written");
