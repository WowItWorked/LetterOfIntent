// V2 adversarial verifier — pass A. Analysis only; touches no app code.
import { chromium } from "@playwright/test";
import fs from "node:fs";

const BASE = "http://localhost:3000";
const out = {};

function paintProbe() {
  // Resolve any CSS colour (color-mix, oklab, var()) to sRGB by painting it.
  return (expr) => {
    const d = document.createElement("div");
    d.style.color = expr;
    document.body.appendChild(d);
    const c = getComputedStyle(d).color;
    d.remove();
    return c;
  };
}

const rgb = (s) => (s.match(/[\d.]+/g) || []).slice(0, 3).map(Number);
const lum = ([r, g, b]) => {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
};
const ratio = (a, b) => {
  const la = lum(rgb(a)), lb = lum(rgb(b));
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return Math.round(((hi + 0.05) / (lo + 0.05)) * 100) / 100;
};
const toHex = (s) =>
  "#" + rgb(s).map((n) => Math.round(n).toString(16).padStart(2, "0")).join("");

const browser = await chromium.launch();

/* ============================================ 1. tokens resolved in-browser */
{
  const ctx = await browser.newContext();
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "domcontentloaded" });
  out.tokens = await p.evaluate(() => {
    const cs = getComputedStyle(document.documentElement);
    const probe = (expr) => {
      const d = document.createElement("div");
      d.style.color = expr;
      document.body.appendChild(d);
      const c = getComputedStyle(d).color;
      d.remove();
      return c;
    };
    const names = [
      "--focus-ring", "--paper", "--paper-2", "--gold-500", "--gold-400",
      "--gold-700", "--navy-700", "--navy-800", "--navy-900", "--control-border",
      "--ink-500", "--ink-faint", "--accent-text", "--gold-100", "--gradient-gold",
    ];
    const o = {};
    for (const n of names) {
      const raw = cs.getPropertyValue(n).trim();
      o[n] = { raw, painted: raw.startsWith("linear-gradient") ? null : probe(`var(${n})`) };
    }
    return o;
  });
  out.tokens_hex = {};
  for (const [k, v] of Object.entries(out.tokens)) {
    if (v.painted) out.tokens_hex[k] = toHex(v.painted);
  }
  out.focusRingRatios = {
    vs_paper: ratio(out.tokens["--focus-ring"].painted, out.tokens["--paper"].painted),
    vs_paper2: ratio(out.tokens["--focus-ring"].painted, out.tokens["--paper-2"].painted),
    vs_white: ratio(out.tokens["--focus-ring"].painted, "rgb(255,255,255)"),
    vs_navy800: ratio(out.tokens["--focus-ring"].painted, out.tokens["--navy-800"].painted),
    vs_navy900: ratio(out.tokens["--focus-ring"].painted, out.tokens["--navy-900"].painted),
  };
  await ctx.close();
}

/* ================================================ 2. home page: video, names */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(BASE, { waitUntil: "networkidle" });

  out.home = await p.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      (b.getAttribute("aria-label") || "").toLowerCase().includes("play the video")
    );
    const fig = document.querySelector("figcaption");
    return {
      videoPlayButton: btn
        ? {
            ariaLabel: btn.getAttribute("aria-label"),
            visibleText: btn.innerText.trim(),
            allText: btn.textContent.trim(),
          }
        : null,
      figcaptionText: fig ? fig.innerText.replace(/\s+/g, " ").trim() : null,
      transcriptAffordances: [...document.querySelectorAll("a,button,summary,details")]
        .map((e) => e.textContent.trim())
        .filter((t) => /transcript|caption|subtitle/i.test(t)),
      resumeAffordanceOnHome: /pick up where you left|continue your letter|resume/i.test(
        document.body.innerText
      ),
      ogImage: document.querySelector('meta[property="og:image"]')?.content ?? null,
    };
  });

  // press play, then measure the video
  const playBtn = p.locator('button[aria-label*="Play the video"]');
  if (await playBtn.count()) {
    await playBtn.click();
    await p.waitForSelector("video", { timeout: 15000 });
    await p.waitForTimeout(3500);
    out.video = await p.evaluate(async () => {
      const v = document.querySelector("video");
      if (!v) return null;
      if (!v.duration || Number.isNaN(v.duration)) {
        await new Promise((r) => {
          v.addEventListener("loadedmetadata", r, { once: true });
          setTimeout(r, 8000);
        });
      }
      return {
        duration: v.duration,
        trackEls: v.querySelectorAll("track").length,
        textTracks: v.textTracks.length,
        controls: v.controls,
        tabIndex: v.tabIndex,
        childHTML: v.innerHTML,
        src: v.currentSrc,
      };
    });

    // key handler: does Space get preventDefault'd?
    out.videoKeys = await p.evaluate(() => {
      const v = document.querySelector("video");
      v.focus();
      const log = [];
      for (const key of [" ", "Enter", "f", "k", "ArrowRight"]) {
        const ev = new KeyboardEvent("keydown", { key, bubbles: true, cancelable: true });
        const notCancelled = v.dispatchEvent(ev);
        log.push({ key, defaultPrevented: ev.defaultPrevented, notCancelled });
      }
      return { log, activeIsVideo: document.activeElement === v };
    });
  }
  await ctx.close();
}

/* ==================================== 3. wizard: focus ring, rail, autocomplete */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1200);

  out.focusedInput = await p.evaluate(() => {
    const el = document.querySelector("main input[type=text], main input, main textarea");
    if (!el) return null;
    const before = getComputedStyle(el);
    const unfocused = {
      outlineStyle: before.outlineStyle,
      borderColor: before.borderColor,
      boxShadow: before.boxShadow,
    };
    el.focus();
    const after = getComputedStyle(el);
    return {
      id: el.id,
      tag: el.tagName,
      unfocused,
      focused: {
        outlineStyle: after.outlineStyle,
        outlineColor: after.outlineColor,
        outlineWidth: after.outlineWidth,
        borderColor: after.borderColor,
        boxShadow: after.boxShadow,
      },
      matchesFocusVisible: el.matches(":focus-visible"),
    };
  });

  // rail markers — need content so the "has notes" dot renders
  await p.fill("#f-allergies", "peanuts").catch(() => {});
  await p.waitForTimeout(1200);
  out.rail = await p.evaluate(() => {
    const links = [...document.querySelectorAll('nav[aria-label="Letter sections"] a')];
    const cur = links.find((a) => a.getAttribute("aria-current") === "page");
    const other = links.find((a) => a.getAttribute("aria-current") !== "page");
    const dot = document.querySelector(
      'nav[aria-label="Letter sections"] a span[aria-hidden="true"].rounded-full'
    );
    const g = (e) => {
      const c = getComputedStyle(e);
      return {
        bg: c.backgroundColor,
        color: c.color,
        borderLeftColor: c.borderLeftColor,
        borderLeftWidth: c.borderLeftWidth,
        fontWeight: c.fontWeight,
        textDecorationLine: c.textDecorationLine,
      };
    };
    const dotBox = dot?.getBoundingClientRect();
    return {
      current: cur ? g(cur) : null,
      other: other ? g(other) : null,
      dot: dot
        ? {
            bg: getComputedStyle(dot).backgroundColor,
            w: Math.round(dotBox.width * 100) / 100,
            h: Math.round(dotBox.height * 100) / 100,
          }
        : null,
      srOnlyHasNotes: [...document.querySelectorAll(".sr-only")].some((s) =>
        /has notes/i.test(s.textContent)
      ),
      progressText: document.body.innerText.match(/You've added notes to \d+ of \d+ sections/)?.[0] ?? null,
    };
  });
  if (out.rail?.dot) {
    out.railDotRatio = {
      vs_white: ratio(out.rail.dot.bg, "rgb(255,255,255)"),
      vs_current_bg: out.rail.current ? ratio(out.rail.dot.bg, out.rail.current.bg) : null,
    };
  }
  if (out.rail?.current) {
    out.railCurrentBorderRatio = ratio(out.rail.current.borderLeftColor, out.rail.current.bg);
  }

  // autocomplete sweep
  out.autocomplete = {};
  for (const slug of ["getting-started", "about", "family-and-support", "medical"]) {
    await p.goto(`${BASE}/letter/${slug}`, { waitUntil: "networkidle" });
    await p.waitForTimeout(800);
    out.autocomplete[slug] = await p.evaluate(() => {
      const form = document.querySelector("form");
      return {
        formAutocomplete: form?.getAttribute("autocomplete") ?? null,
        fields: [...document.querySelectorAll("form input, form textarea, form select")].map(
          (f) => ({
            id: f.id,
            autocomplete: f.getAttribute("autocomplete"),
            effective: f.autocomplete,
          })
        ),
      };
    });
  }
  await ctx.close();
}

/* ================================= 4. sticky header / focus obscured (A4-007) */
{
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });
  const p = await ctx.newPage();
  await p.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1000);
  await p.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await p.waitForTimeout(400);
  // Focus the last focusable, then Shift+Tab backwards, measuring each stop.
  const stops = [];
  await p.evaluate(() => {
    const all = [...document.querySelectorAll("a[href],button,input,textarea,select,[tabindex]")].filter(
      (e) => e.offsetParent !== null || e.tagName === "BODY"
    );
    all[all.length - 1]?.focus();
  });
  for (let i = 0; i < 40; i++) {
    await p.keyboard.press("Shift+Tab");
    const s = await p.evaluate(() => {
      const el = document.activeElement;
      const header = document.querySelector("header");
      if (!el || el === document.body || !header) return null;
      const r = el.getBoundingClientRect();
      const h = header.getBoundingClientRect();
      const covered = Math.max(0, Math.min(r.bottom, h.bottom) - Math.max(r.top, h.top));
      return {
        name: (el.innerText || el.getAttribute("aria-label") || el.id || el.tagName)
          .toString()
          .replace(/\s+/g, " ")
          .trim()
          .slice(0, 44),
        tag: el.tagName,
        rectTop: Math.round(r.top),
        rectBottom: Math.round(r.bottom),
        heightPx: Math.round(r.height),
        headerBottom: Math.round(h.bottom),
        inHeader: header.contains(el),
        coveredPx: Math.round(covered),
        fullyHidden: covered >= r.height - 0.5 && r.height > 0 && !header.contains(el),
      };
    });
    if (s) stops.push(s);
  }
  out.focusObscured = {
    headerHeight: await p.evaluate(
      () => Math.round(document.querySelector("header").getBoundingClientRect().height)
    ),
    stopsMeasured: stops.length,
    fullyHidden: stops.filter((s) => s.fullyHidden),
    partiallyCovered: stops.filter((s) => s.coveredPx > 0 && !s.fullyHidden && !s.inHeader),
  };

  // header % of viewport at reflow sizes
  out.headerPct = {};
  for (const [w, h] of [[320, 256], [400, 320], [375, 667], [1280, 900], [640, 512]]) {
    await p.setViewportSize({ width: w, height: h });
    await p.waitForTimeout(350);
    const hh = await p.evaluate(
      () => Math.round(document.querySelector("header").getBoundingClientRect().height)
    );
    out.headerPct[`${w}x${h}`] = { headerH: hh, pct: Math.round((hh / h) * 100) };
  }
  await ctx.close();
}

fs.writeFileSync(
  "audit/evidence/v2/verify-a.json",
  JSON.stringify(out, null, 2)
);
console.log(JSON.stringify(out, null, 2));
await browser.close();
