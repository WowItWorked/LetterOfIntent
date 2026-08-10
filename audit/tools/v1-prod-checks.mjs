/**
 * V1 verifier — adversarial reproduction of A1's production measurements.
 * Everything here is measured fresh against https://myletterofintent.com.
 */
import { chromium } from "@playwright/test";
import { writeFileSync } from "node:fs";

const PROD = "https://myletterofintent.com";
const out = {};

const browser = await chromium.launch();

/* ================================================== 1. homepage, 1425px wide */
{
  const ctx = await browser.newContext({ viewport: { width: 1425, height: 900 } });
  const page = await ctx.newPage();
  const requests = [];
  page.on("request", (r) => requests.push(r.url()));
  await page.goto(PROD, { waitUntil: "networkidle" });
  await page.waitForTimeout(3000);

  out.videoNetwork = {
    mp4Requested: requests.some((u) => u.includes(".mp4")),
    mp4Urls: requests.filter((u) => u.includes(".mp4")),
    totalRequests: requests.length,
  };

  out.videoDom = await page.evaluate(() => {
    const v = document.querySelector("video");
    const posterImg = document.querySelector('img[src*="video-poster"]');
    const playBtn = document.querySelector('button[aria-label*="Play the video"]');
    return {
      videoElementPresentOnLoad: !!v,
      videoPreload: v?.preload ?? null,
      videoPoster: v?.poster ?? null,
      trackCount: v ? v.querySelectorAll("track").length : null,
      textTracks: v ? v.textTracks.length : null,
      posterImagePresent: !!posterImg,
      playButtonAriaLabel: playBtn?.getAttribute("aria-label") ?? null,
      transcriptLike: [...document.querySelectorAll("details, summary, h2, h3")]
        .map((e) => e.textContent.trim().slice(0, 80))
        .filter((t) => /transcript|read this instead|caption/i.test(t)),
      durationLabel: [...document.querySelectorAll("p")]
        .map((p) => p.textContent.trim())
        .filter((t) => /^Watch ·/.test(t)),
    };
  });

  /* ---- A1-003: elements rendering at <= 11.5px ---- */
  out.smallType = await page.evaluate(() => {
    const own = [...document.querySelectorAll("body *")].filter((el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    );
    const rows = own
      .map((el) => {
        const cs = getComputedStyle(el);
        return {
          fs: parseFloat(cs.fontSize),
          ls: cs.letterSpacing,
          tt: cs.textTransform,
          fam: cs.fontFamily.split(",")[0].replace(/["']/g, ""),
          cls: el.className?.toString?.().slice(0, 60) ?? "",
          text: el.textContent.trim().slice(0, 42),
        };
      })
      .filter((r) => r.fs <= 11.5);
    return { count: rows.length, rows };
  });

  /* ---- A1-010: distinct fs/lh/family combos ---- */
  out.typeCombos = await page.evaluate(() => {
    const own = [...document.querySelectorAll("body *")].filter((el) =>
      [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim())
    );
    const set = new Map();
    const bySize = new Map();
    for (const el of own) {
      const cs = getComputedStyle(el);
      const fs = parseFloat(cs.fontSize);
      const lh = parseFloat(cs.lineHeight);
      const fam = cs.fontFamily.split(",")[0].replace(/["']/g, "");
      set.set(`${fs}|${lh}|${fam}`, (set.get(`${fs}|${lh}|${fam}`) ?? 0) + 1);
      if (!bySize.has(fs)) bySize.set(fs, new Set());
      bySize.get(fs).add(lh);
    }
    return {
      distinctCombos: set.size,
      leadingsPerSize: [...bySize.entries()]
        .map(([fs, lhs]) => ({ fs, lineHeights: [...lhs].sort((a, b) => a - b) }))
        .filter((r) => r.lineHeights.length > 1)
        .sort((a, b) => a.fs - b.fs),
    };
  });

  /* ---- A1-011: "What is a Letter of Intent" section ground ---- */
  out.whatIsSection = await page.evaluate(() => {
    const h = [...document.querySelectorAll("h1,h2,h3")].find((e) =>
      /what is a letter of intent/i.test(e.textContent)
    );
    if (!h) return { headingFound: false };
    const sec = h.closest("section") ?? h.parentElement;
    const cs = getComputedStyle(sec);
    return {
      headingFound: true,
      sectionClass: sec.className?.toString?.() ?? "",
      backgroundColor: cs.backgroundColor,
      backgroundImage: cs.backgroundImage.slice(0, 80),
      headingColor: getComputedStyle(h).color,
    };
  });

  /* ---- A1-009: "View sample" hover-only overlay ---- */
  out.viewSample = await page.evaluate(() => {
    const els = [...document.querySelectorAll("*")].filter(
      (e) =>
        [...e.childNodes].some((n) => n.nodeType === 3) &&
        /^view sample$/i.test(e.textContent.trim())
    );
    return els.map((e) => {
      const cs = getComputedStyle(e);
      const link = e.closest("a");
      return {
        opacity: cs.opacity,
        visibility: cs.visibility,
        fontSize: cs.fontSize,
        cls: e.className?.toString?.().slice(0, 120) ?? "",
        linkText: link ? link.textContent.replace(/\s+/g, " ").trim().slice(0, 70) : null,
        linkTarget: link?.getAttribute("target") ?? null,
      };
    });
  });

  /* ---- A1-002: focus ring, resolved and actually applied ---- */
  out.focusRing = await page.evaluate(() => {
    const probe = document.createElement("div");
    probe.style.color = "var(--focus-ring)";
    document.body.appendChild(probe);
    const resolved = getComputedStyle(probe).color;
    probe.remove();
    const ringVar = getComputedStyle(document.documentElement)
      .getPropertyValue("--focus-ring")
      .trim();
    const ring = getComputedStyle(document.documentElement).getPropertyValue("--ring").trim();
    return { resolvedRGB: resolved, rawVar: ringVar, ringToken: ring };
  });
  // Focus a real link and read the painted outline.
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  out.focusRingApplied = await page.evaluate(() => {
    const el = document.activeElement;
    const cs = getComputedStyle(el);
    let bgEl = el, bg = "rgba(0, 0, 0, 0)";
    while (bgEl && bg === "rgba(0, 0, 0, 0)") {
      bg = getComputedStyle(bgEl).backgroundColor;
      bgEl = bgEl.parentElement;
    }
    return {
      activeTag: el.tagName,
      activeText: el.textContent.trim().slice(0, 40),
      outlineColor: cs.outlineColor,
      outlineWidth: cs.outlineWidth,
      outlineStyle: cs.outlineStyle,
      groundBehind: bg,
    };
  });

  /* ---- A1-008: does the 78% gradient stop fall under the accent label? ---- */
  out.accentButton = await page.evaluate(() => {
    const btns = [...document.querySelectorAll("a,button")].filter((b) =>
      getComputedStyle(b).backgroundImage.includes("gradient")
    );
    return btns.map((b) => {
      const r = b.getBoundingClientRect();
      const cs = getComputedStyle(b);
      // A 150deg linear-gradient's axis length for a w x h box:
      // L = |w*sin(a)| + |h*cos(a)| with a measured from the "to top" origin.
      const a = (150 * Math.PI) / 180;
      const L = Math.abs(r.width * Math.sin(a)) + Math.abs(r.height * Math.cos(a));
      return {
        text: b.textContent.trim().slice(0, 44),
        w: Math.round(r.width),
        h: Math.round(r.height),
        fontSize: cs.fontSize,
        fontWeight: cs.fontWeight,
        color: cs.color,
        gradientAxisPx: Math.round(L),
        pxTo78pct: Math.round(L * 0.78),
        bgImage: cs.backgroundImage.slice(0, 90),
      };
    });
  });

  /* ---- A2-005: resume affordance on "/" ---- */
  out.homeResume = await page.evaluate(() => {
    const t = document.body.innerText;
    return {
      hasPickUpWhereYouLeftOff: /pick up where you left off/i.test(t),
      hasContinueYourLetter: /continue your letter/i.test(t),
    };
  });

  /* ---- A2-017 / A2-015 corroboration ---- */
  out.homeSearch = await page.evaluate(() => ({
    roleSearch: document.querySelectorAll('[role="search"]').length,
    searchInputs: document.querySelectorAll('input[type="search"]').length,
  }));

  await ctx.close();
}

/* ==================================== 2. /letter/medical textarea measure */
{
  const ctx = await browser.newContext({ viewport: { width: 1425, height: 900 } });
  const page = await ctx.newPage();
  await page.goto(`${PROD}/letter/medical`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  out.textareaMeasure = await page.evaluate(() => {
    const tas = [...document.querySelectorAll("textarea")];
    if (!tas.length) return { count: 0 };
    const measure = (el) => {
      const cs = getComputedStyle(el);
      const inner =
        el.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight);
      const span = document.createElement("span");
      span.style.cssText = `position:absolute;visibility:hidden;white-space:pre;font-family:${cs.fontFamily};font-size:${cs.fontSize};font-weight:${cs.fontWeight};letter-spacing:${cs.letterSpacing}`;
      // Representative lowercase English, not digits.
      const sample =
        "the quick brown fox jumps over the lazy dog and writes a calm note about seizures";
      span.textContent = sample;
      document.body.appendChild(span);
      const per = span.getBoundingClientRect().width / sample.length;
      span.remove();
      return {
        name: el.name || el.id || "(unnamed)",
        innerPx: Math.round(inner),
        fontSize: cs.fontSize,
        lineHeight: cs.lineHeight,
        maxWidth: cs.maxWidth,
        perCharPx: +per.toFixed(3),
        chars: Math.round(inner / per),
      };
    };
    return { count: tas.length, fields: tas.map(measure) };
  });
  await ctx.close();
}

/* ============ 3. A1-005: prerendered header at 320px, JS disabled */
{
  const ctx = await browser.newContext({
    viewport: { width: 320, height: 700 },
    javaScriptEnabled: false,
  });
  const page = await ctx.newPage();
  await page.goto(PROD, { waitUntil: "domcontentloaded" });
  out.prerenderHeader320 = await page.evaluate(() => {
    const h = document.querySelector("header");
    const t = h ? h.innerText.replace(/\s+/g, " ").trim() : null;
    return {
      headerText: t,
      hasMenuButton: !!document.querySelector('[aria-label="Menu"], [aria-label="menu"]'),
      hasStartCta: /start your letter/i.test(t ?? ""),
      hasShare: /share/i.test(t ?? ""),
      headerScrollWidth: h?.scrollWidth ?? null,
      headerClientWidth: h?.clientWidth ?? null,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
    };
  });
  await ctx.close();
}

/* ============ 4. A1-005 settled state: JS on, clean load at 320px */
{
  const ctx = await browser.newContext({ viewport: { width: 320, height: 700 } });
  const page = await ctx.newPage();
  await page.goto(PROD, { waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  out.settledHeader320 = await page.evaluate(() => {
    const h = document.querySelector("header");
    return {
      hasMenuButton: !!document.querySelector('[aria-label="Menu"], [aria-label="menu"]'),
      headerText: h ? h.innerText.replace(/\s+/g, " ").trim() : null,
      docScrollWidth: document.documentElement.scrollWidth,
      docClientWidth: document.documentElement.clientWidth,
      overflow: document.documentElement.scrollWidth - document.documentElement.clientWidth,
    };
  });
  await ctx.close();
}

await browser.close();
writeFileSync(
  new URL("../evidence/v1/prod-checks.json", import.meta.url),
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
