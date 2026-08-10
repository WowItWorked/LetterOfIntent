// V2 adversarial verifier — pass C. Analysis only.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const out = {};
const browser = await chromium.launch();

/* ============ 1. forced-colors focus, driven by REAL keyboard Tab (A4-012) */
for (const forced of ["active", "none"]) {
  const ctx = await browser.newContext({
    viewport: { width: 1280, height: 1000 },
    forcedColors: forced,
  });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);

  const snap = async (label) =>
    p.evaluate((label) => {
      const el = document.activeElement;
      if (!el || el === document.body) return { label, none: true };
      const c = getComputedStyle(el);
      return {
        label,
        tag: el.tagName,
        id: el.id || null,
        name: (el.innerText || el.getAttribute("aria-label") || "").replace(/\s+/g, " ").trim().slice(0, 34),
        outlineStyle: c.outlineStyle,
        outlineWidth: c.outlineWidth,
        outlineColor: c.outlineColor,
        boxShadow: c.boxShadow.slice(0, 90),
        borderColor: c.borderColor,
        focusVisible: el.matches(":focus-visible"),
      };
    }, label);

  // Tab until we land on a real form field, recording the first link stop too.
  const stops = [];
  let firstLink = null, firstField = null;
  for (let i = 0; i < 40 && (!firstLink || !firstField); i++) {
    await p.keyboard.press("Tab");
    const s = await snap(`tab${i + 1}`);
    stops.push(s);
    if (!firstLink && s.tag === "A") firstLink = s;
    if (!firstField && (s.tag === "INPUT" || s.tag === "TEXTAREA")) firstField = s;
  }
  // and the unfocused baseline for the same field
  const fieldUnfocused = await p.evaluate(() => {
    const el = document.querySelector("main input, main textarea");
    if (!el) return null;
    el.blur();
    const c = getComputedStyle(el);
    return {
      tag: el.tagName,
      outlineStyle: c.outlineStyle,
      outlineWidth: c.outlineWidth,
      outlineColor: c.outlineColor,
      boxShadow: c.boxShadow.slice(0, 90),
      borderColor: c.borderColor,
    };
  });
  out[`forced_${forced}`] = { firstLink, firstField, fieldUnfocused, stopCount: stops.length };
  await ctx.close();
}

/* ============================= 2. label-in-name sweep across routes (A3-012) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  const routes = ["/", "/letter", "/letter/getting-started", "/letter/medical", "/letter/review", "/privacy", "/your-data"];
  out.labelInName = {};
  for (const r of routes) {
    await p.goto(BASE + r, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    out.labelInName[r] = await p.evaluate(() => {
      const bad = [];
      for (const el of document.querySelectorAll("a[href],button,[role=button],summary")) {
        const label = el.getAttribute("aria-label");
        if (!label) continue;
        const visible = (el.innerText || "").replace(/\s+/g, " ").trim();
        if (!visible) continue;
        if (!label.toLowerCase().includes(visible.toLowerCase())) {
          bad.push({ tag: el.tagName, visibleText: visible.slice(0, 40), accessibleName: label.slice(0, 90) });
        }
      }
      return bad;
    });
  }
}

/* ================ 3. mobile: what /letter/review link sits outside <details> */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  out.mobileReviewLinks = await p.evaluate(() =>
    [...document.querySelectorAll('a[href="/letter/review"]')].map((a) => ({
      text: a.innerText.replace(/\s+/g, " ").trim(),
      insideDetails: !!a.closest("details"),
      insideFooter: !!a.closest("footer"),
      insideNav: !!a.closest("nav"),
      visible: a.getBoundingClientRect().height > 0,
    }))
  );
  out.mobileFooterHasReview = out.mobileReviewLinks.some((l) => l.insideFooter);
  await ctx.close();
}

/* =============== 4. reminder panel gold gradient once the email looks valid */
{
  const ctx = await browser.newContext({ viewport: { width: 1024, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/review`, { waitUntil: "networkidle" });
  await p.waitForTimeout(2500);
  await p.fill("#reminder-email", "a@b.com").catch(() => {});
  await p.waitForTimeout(500);
  out.reminderValid = await p.evaluate(() => {
    const inp = document.getElementById("reminder-email");
    const btn = inp?.closest("form")?.querySelector('button[type="submit"]');
    const calendarBtn = [...document.querySelectorAll("a,button")].find((e) =>
      /calendar|remind me|\.ics|add to/i.test(e.innerText)
    );
    return {
      btnBg: btn ? getComputedStyle(btn).backgroundImage.slice(0, 110) : null,
      btnColor: btn ? getComputedStyle(btn).color : null,
      calendarBtnText: calendarBtn?.innerText.replace(/\s+/g, " ").trim().slice(0, 40) ?? null,
      calendarBtnBg: calendarBtn ? getComputedStyle(calendarBtn).backgroundImage.slice(0, 60) : null,
    };
  });
  await ctx.close();
}

/* ==================================== 5. reading level spot check (A4-019) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  out.readingLevel = {};
  for (const r of ["/", "/letter/medical", "/privacy", "/letter/review"]) {
    await p.goto(BASE + r, { waitUntil: "networkidle" });
    await p.waitForTimeout(1500);
    out.readingLevel[r] = await p.evaluate(() => {
      const text = document.querySelector("main")?.innerText ?? "";
      const sentences = text.split(/[.!?]+(?=\s|$)/).filter((s) => s.trim().split(/\s+/).length > 1);
      const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) ?? [];
      const syll = (w) => {
        w = w.toLowerCase().replace(/[^a-z]/g, "");
        if (w.length <= 3) return 1;
        w = w.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "").replace(/^y/, "");
        return (w.match(/[aeiouy]{1,2}/g) || ["x"]).length;
      };
      const S = sentences.length || 1, W = words.length || 1;
      const SY = words.reduce((a, w) => a + syll(w), 0);
      return {
        words: W, sentences: S,
        avgWordsPerSentence: Math.round((W / S) * 10) / 10,
        fleschKincaidGrade: Math.round((0.39 * (W / S) + 11.8 * (SY / W) - 15.59) * 10) / 10,
        fleschReadingEase: Math.round((206.835 - 1.015 * (W / S) - 84.6 * (SY / W)) * 10) / 10,
      };
    });
  }
  await ctx.close();
}

fs.writeFileSync("audit/evidence/v2/verify-c.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
