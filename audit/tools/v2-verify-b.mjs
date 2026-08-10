// V2 adversarial verifier — pass B. Analysis only.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const out = {};
const browser = await chromium.launch();

const CANVAS_READ = `(expr) => {
  const c = document.createElement("canvas");
  c.width = c.height = 1;
  const g = c.getContext("2d", { willReadFrequently: true });
  // Paint through a live element so color-mix / oklab / var() all resolve.
  const d = document.createElement("div");
  d.style.color = expr;
  document.body.appendChild(d);
  const resolved = getComputedStyle(d).color;
  d.remove();
  g.fillStyle = "#ffffff"; g.fillRect(0,0,1,1);
  g.fillStyle = resolved; g.fillRect(0,0,1,1);
  const p = g.getImageData(0,0,1,1).data;
  return { expr, resolved, srgb: [p[0], p[1], p[2]] };
}`;

/* ================================= 1. canvas readback of the focus ring token */
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  out.canvasReadback = await p.evaluate(
    ([fn, exprs]) => {
      const f = eval(fn);
      return exprs.map(f);
    },
    [
      CANVAS_READ,
      [
        "var(--focus-ring)",
        "color-mix(in oklab, #c9a063 55%, white)",
        "var(--gold-500)",
        "var(--navy-700)",
      ],
    ]
  );
  await ctx.close();
}

/* =========================================================== 2. forced colors */
{
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    forcedColors: "active",
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.fill("#f-allergies", "peanuts").catch(() => {});
  await p.waitForTimeout(1200);
  out.forcedColors = await p.evaluate(() => {
    const g = (e) => {
      if (!e) return null;
      const c = getComputedStyle(e);
      const r = e.getBoundingClientRect();
      return {
        bg: c.backgroundColor,
        bgImg: c.backgroundImage,
        borderLeftColor: c.borderLeftColor,
        color: c.color,
        w: Math.round(r.width * 100) / 100,
        h: Math.round(r.height * 100) / 100,
      };
    };
    const aside = document.querySelector("aside");
    const links = [...(aside?.querySelectorAll('nav[aria-label="Letter sections"] a') ?? [])];
    const cur = links.find((a) => a.getAttribute("aria-current") === "page");
    const other = links.find((a) => a.getAttribute("aria-current") !== "page");
    const dot = cur?.parentElement?.parentElement
      ? [...aside.querySelectorAll("a span.rounded-full")][0]
      : null;
    const diamond = document.querySelector(".tw-diamond");
    const bar = aside?.querySelector('div[aria-hidden="true"] > div');

    const input = document.querySelector("main textarea, main input");
    const beforeInput = input
      ? {
          outlineStyle: getComputedStyle(input).outlineStyle,
          outlineWidth: getComputedStyle(input).outlineWidth,
          outlineColor: getComputedStyle(input).outlineColor,
          boxShadow: getComputedStyle(input).boxShadow,
          borderColor: getComputedStyle(input).borderColor,
        }
      : null;
    input?.focus();
    const afterInput = input
      ? {
          outlineStyle: getComputedStyle(input).outlineStyle,
          outlineWidth: getComputedStyle(input).outlineWidth,
          outlineColor: getComputedStyle(input).outlineColor,
          boxShadow: getComputedStyle(input).boxShadow,
          borderColor: getComputedStyle(input).borderColor,
        }
      : null;

    const link = document.querySelector("main a[href]");
    const beforeLink = link ? { outlineStyle: getComputedStyle(link).outlineStyle, outlineColor: getComputedStyle(link).outlineColor } : null;
    link?.focus();
    const afterLink = link ? { outlineStyle: getComputedStyle(link).outlineStyle, outlineColor: getComputedStyle(link).outlineColor } : null;

    return {
      forcedActive: matchMedia("(forced-colors: active)").matches,
      railCurrent: g(cur),
      railOther: g(other),
      dot: g(dot),
      diamond: g(diamond),
      progressBar: g(bar),
      input: { before: beforeInput, after: afterInput },
      link: { before: beforeLink, after: afterLink },
    };
  });
  await ctx.close();
}

/* ============================================== 3. dark colour-scheme (A3-009) */
{
  for (const scheme of ["dark", "light"]) {
    const ctx = await browser.newContext({ colorScheme: scheme });
    const p = await ctx.newPage();
    await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    out[`colorScheme_${scheme}`] = await p.evaluate(() => ({
      bodyBg: getComputedStyle(document.body).backgroundColor,
      inputBg: getComputedStyle(document.querySelector("main textarea, main input")).backgroundColor,
      rootColorScheme: getComputedStyle(document.documentElement).colorScheme,
      metaColorScheme: document.querySelector('meta[name="color-scheme"]')?.content ?? null,
      prefersDark: matchMedia("(prefers-color-scheme: dark)").matches,
    }));
    await ctx.close();
  }
}

/* ============================ 4. resume-on-home (A3-010) + mobile rail (A3-011) */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.fill("#f-allergies", "peanuts, latex").catch(() => {});
  await p.waitForTimeout(1500);
  out.mobileRail = await p.evaluate(() => {
    const d = document.querySelector("details");
    const summary = d?.querySelector("summary");
    return {
      detailsPresent: !!d,
      open: d?.open ?? null,
      summaryText: summary?.innerText.trim() ?? null,
      progressVisibleOutsideDetails: (() => {
        const m = [...document.querySelectorAll("p")].find((e) =>
          /You've added notes to|Start anywhere/.test(e.textContent)
        );
        if (!m) return "not-found";
        return m.closest("details") ? "inside-details" : "outside-details";
      })(),
      bodyTextHasProgress: /You've added notes to \d+ of \d+/.test(document.body.innerText),
      reviewLinkOutsideDetails: [...document.querySelectorAll('a[href="/letter/review"]')].some(
        (a) => !a.closest("details")
      ),
    };
  });

  // localStorage written? then load home
  out.storedKeys = await p.evaluate(() => Object.keys(localStorage));
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  out.homeAfterProgress = await p.evaluate(() => ({
    hasResume: /pick up where you left|continue your letter|resume/i.test(document.body.innerText),
    firstHeadingish: document.querySelector("h1")?.innerText.replace(/\s+/g, " ").trim() ?? null,
  }));
  // and /letter for contrast
  await p.goto(`${BASE}/letter`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  out.chooserAfterProgress = await p.evaluate(() => ({
    hasResume: /pick up where you left/i.test(document.body.innerText),
  }));
  await ctx.close();
}

/* ================================================ 5. tabs pattern on /letter */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  const before = await p.evaluate(() =>
    [...document.querySelectorAll('[role="tab"]')].map((t) => t.getAttribute("aria-selected"))
  );
  await p.evaluate(() => document.querySelector('[role="tab"]').focus());
  await p.keyboard.press("ArrowRight");
  await p.waitForTimeout(400);
  out.tabs = await p.evaluate((before) => {
    const tabs = [...document.querySelectorAll('[role="tab"]')];
    const panel = document.getElementById("question-set");
    return {
      before,
      after: tabs.map((t) => t.getAttribute("aria-selected")),
      focusedName: document.activeElement?.innerText.replace(/\s+/g, " ").trim().slice(0, 50),
      tablistLabel: document.querySelector('[role="tablist"]')?.getAttribute("aria-label"),
      tabIndexAttrs: tabs.map((t) => t.getAttribute("tabindex")),
      tabIds: tabs.map((t) => t.id || null),
      ariaControls: tabs.map((t) => t.getAttribute("aria-controls")),
      panel: panel
        ? {
            exists: true,
            role: panel.getAttribute("role"),
            labelledby: panel.getAttribute("aria-labelledby"),
            tabindex: panel.getAttribute("tabindex"),
          }
        : { exists: false },
    };
  }, before);
  await ctx.close();
}

/* ========================================== 6. sample viewer (A4-005) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const resp = await p.goto(`${BASE}/samples/letter-of-intent-disabilities`, {
    waitUntil: "networkidle",
  });
  await p.waitForTimeout(6000);
  out.sample = await p.evaluate(() => {
    const cs = [...document.querySelectorAll("canvas")];
    const first = cs[0];
    return {
      status: "ok",
      canvasCount: cs.length,
      firstCanvas: first
        ? {
            role: first.getAttribute("role"),
            ariaLabel: first.getAttribute("aria-label"),
            textContentLength: first.textContent.length,
            cssWidth: Math.round(first.getBoundingClientRect().width),
            intrinsicWidth: first.width,
          }
        : null,
      hasTextLayer: !!document.querySelector(".textLayer"),
      bodyTextChars: document.body.innerText.length,
    };
  });
  out.sampleHttp = resp?.status() ?? null;
  await p.setViewportSize({ width: 320, height: 640 });
  await p.waitForTimeout(2500);
  out.sample320 = await p.evaluate(() => {
    const c = document.querySelector("canvas");
    if (!c) return null;
    const css = c.getBoundingClientRect().width;
    return {
      cssWidth: Math.round(css),
      intrinsicWidth: c.width,
      scale: Math.round((css / c.width) * 1000) / 1000,
      effectiveBodyTextCssPx: Math.round((css / c.width) * (10 / 72) * 96 * 100) / 100,
    };
  });
  await ctx.close();
}

/* ============================== 7. skip-link tab count + route-change focus */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.evaluate(() => window.scrollTo(0, 0));
  await p.keyboard.press("Tab"); // skip link
  const skipName = await p.evaluate(() => document.activeElement?.innerText?.trim());
  await p.keyboard.press("Enter");
  await p.waitForTimeout(400);
  let n = 0, info = null;
  for (; n < 60; n++) {
    await p.keyboard.press("Tab");
    info = await p.evaluate(() => {
      const el = document.activeElement;
      return {
        tag: el?.tagName,
        inForm: !!el?.closest("form"),
        text: (el?.innerText || el?.id || "").toString().replace(/\s+/g, " ").trim().slice(0, 40),
      };
    });
    if (info.inForm) break;
  }
  out.skipToFirstField = { skipName, n: n + 1, ...info };
  out.railInsideMain = await p.evaluate(
    () => !!document.querySelector('main nav[aria-label="Letter sections"]')
  );

  await p.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.getByRole("link", { name: /^Next:/ }).first().click();
  await p.waitForTimeout(1500);
  out.routeChangeFocus = await p.evaluate(() => ({
    url: location.pathname,
    activeTag: document.activeElement?.tagName,
    isBody: document.activeElement === document.body,
    title: document.title,
    scrollY: window.scrollY,
  }));
  await ctx.close();
}

/* ================================================ 8. share button (A4-014) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await ctx.grantPermissions(["clipboard-read", "clipboard-write"]).catch(() => {});
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  const btn = p.getByRole("button", { name: /share to help another family/i }).first();
  const has = (await btn.count()) > 0;
  if (has) {
    const textBefore = (await btn.innerText()).trim();
    const liveBefore = await p.evaluate(() =>
      [...document.querySelectorAll("[aria-live]")].map((e) => e.textContent.trim()).join("|")
    );
    await btn.click();
    await p.waitForTimeout(900);
    const textAfter = (await btn.innerText()).trim();
    const liveAfter = await p.evaluate(() =>
      [...document.querySelectorAll("[aria-live]")].map((e) => e.textContent.trim()).join("|")
    );
    out.share = {
      hasNativeShare: await p.evaluate(() => !!navigator.share),
      textBefore, textAfter, labelChanged: textBefore !== textAfter,
      liveBefore, liveAfter, liveChanged: liveBefore !== liveAfter,
    };
  } else out.share = { found: false };
  await ctx.close();
}

/* ============================== 9. gradient CTA text colour + target sizes */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/`, { waitUntil: "networkidle" });
  await p.waitForTimeout(900);
  out.gradientCtas = await p.evaluate(() => {
    const res = [];
    for (const el of document.querySelectorAll("a,button")) {
      const c = getComputedStyle(el);
      if (/gradient/.test(c.backgroundImage)) {
        res.push({
          text: el.innerText.replace(/\s+/g, " ").trim().slice(0, 50),
          color: c.color,
          fontSize: c.fontSize,
          fontWeight: c.fontWeight,
          bgImage: c.backgroundImage.slice(0, 120),
        });
      }
    }
    return res;
  });
  out.targetSize375 = await p.evaluate(() => {
    const small = [];
    for (const el of document.querySelectorAll(
      "a[href],button,input,select,textarea,[role=button]"
    )) {
      const r = el.getBoundingClientRect();
      if (r.width === 0 && r.height === 0) continue;
      const min = Math.min(r.width, r.height);
      if (min < 24)
        small.push({
          text: (el.innerText || el.getAttribute("aria-label") || el.tagName)
            .replace(/\s+/g, " ")
            .trim()
            .slice(0, 40),
          w: Math.round(r.width * 10) / 10,
          h: Math.round(r.height * 10) / 10,
          inline: getComputedStyle(el).display === "inline",
        });
    }
    return small;
  });
  await ctx.close();
}

/* ==================================================== 10. review page order */
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);
  await p.fill("#f-subjectFullName", "Sam Rivera").catch(() => {});
  await p.fill("#f-authorName", "Dana Rivera").catch(() => {});
  await p.waitForTimeout(1200);
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  await p.fill("#f-allergies", "peanuts").catch(() => {});
  await p.waitForTimeout(1200);
  await p.goto(`${BASE}/letter/review`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  out.review = await p.evaluate(() => {
    const doc = document.documentElement;
    const marks = {};
    const wanted = [
      /download all three/i,
      /come back in a year/i,
      /pass it along/i,
      /a trust protects/i,
      /read it through/i,
      /sections without notes/i,
    ];
    for (const el of document.querySelectorAll("h1,h2,h3,p,a,button")) {
      const t = el.innerText?.replace(/\s+/g, " ").trim() ?? "";
      for (const w of wanted) {
        if (w.test(t) && marks[w.source] === undefined) {
          marks[w.source] = Math.round(el.getBoundingClientRect().top + window.scrollY);
        }
      }
    }
    return { pageHeight: doc.scrollHeight, marks };
  });
  out.reminderPanel = await p.evaluate(() => {
    const inp = document.getElementById("reminder-email");
    const btn = inp?.closest("form")?.querySelector('button[type="submit"]');
    return {
      inputPresent: !!inp,
      inputType: inp?.type,
      autoComplete: inp?.getAttribute("autocomplete"),
      buttonText: btn?.innerText.trim(),
      buttonBgBefore: btn ? getComputedStyle(btn).backgroundImage.slice(0, 60) : null,
    };
  });
  await ctx.close();
}

fs.writeFileSync("audit/evidence/v2/verify-b.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
