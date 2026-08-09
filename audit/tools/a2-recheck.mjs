/**
 * A2 — two checks that needed a stricter method than the first pass used.
 *
 *  1. Does a soft validation hint actually block moving on? (The first attempt's
 *     waitForURL pattern matched the page it was already on, so the answer was
 *     not trustworthy. This one watches the pathname change directly.)
 *  2. What the app does when localStorage cannot be written at all.
 *
 *   node audit/tools/a2-recheck.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const KEY = "twl-loi-letter-v1";
const seed = () => JSON.stringify({ version: 1, state: { data: {}, meta: { letterPath: "special-needs" } } });

const out = { base: BASE, capturedAt: new Date().toISOString() };

async function hintBlocking(browser) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addInitScript(
    ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
    [KEY, seed()]
  );
  const page = await ctx.newPage();
  await page.goto(`${BASE}/letter/family-and-support`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("form");
  await page.locator("form fieldset > button").first().click();
  await page.waitForTimeout(300);
  await page.locator("input[type=email]").first().fill("dana@");
  await page.locator("h1").click();                        // blur
  await page.waitForTimeout(500);

  const hintShown = await page.evaluate(() =>
    /doesn.t look like a full email/i.test(document.body.innerText)
  );
  const before = new URL(page.url()).pathname;
  const next = page.getByRole("link", { name: /^Next:/ }).first();
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await page.waitForFunction(
    (p) => location.pathname !== p,
    before,
    { timeout: 15_000 }
  ).catch(() => {});
  await page.waitForLoadState("networkidle");
  const after = new URL(page.url()).pathname;

  await page.goto(`${BASE}/letter/family-and-support`, { waitUntil: "networkidle" });
  await page.waitForTimeout(900);
  const kept = await page.locator("input[type=email]").first().inputValue();

  await ctx.close();
  return {
    hintShown,
    pathBefore: before,
    pathAfter: after,
    blockedNavigation: before === after,
    valueKeptAfterLeavingAndReturning: kept,
    hintIsSoftAndNonBlocking: before !== after,
  };
}

async function storageFailure(browser) {
  const block = () => {
    const proto = Object.getPrototypeOf(window.localStorage);
    const orig = proto.setItem;
    proto.setItem = function (k, v) {
      if (String(k).includes("twl-loi")) {
        const e = new Error("The quota has been exceeded.");
        e.name = "QuotaExceededError";
        throw e;
      }
      return orig.call(this, k, v);
    };
    window.__consoleErrors = [];
    const ce = console.error;
    console.error = (...a) => { window.__consoleErrors.push(a.map(String).join(" ").slice(0, 240)); ce(...a); };
  };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addInitScript(block);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).split("\n")[0].slice(0, 200)));

  await page.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForTimeout(4000);

  const snapshot = await page.evaluate(() => {
    const t = (el) => (el?.innerText || "").replace(/\s+/g, " ").trim();
    return {
      formPresent: Boolean(document.querySelector("form")),
      inputCount: document.querySelectorAll("form input, form textarea").length,
      skeletonPresent: /Loading your saved work/i.test(document.body.innerHTML),
      whatIsOnScreen: t(document.querySelector("article")).slice(0, 400),
      saveIndicatorStatus: document.querySelector("[data-save-status]")?.getAttribute("data-save-status") ?? null,
      anyErrorCopy: /couldn.t save|not saved|problem saving|private browsing|unable to save|storage/i.test(
        document.body.innerText
      ),
      consoleErrors: (window.__consoleErrors || []).slice(0, 6),
    };
  });

  // If a form did render, try typing and see whether the app admits the failure.
  let typed = null;
  if (snapshot.inputCount > 0) {
    const el = page.locator("form input").first();
    await el.click();
    await el.pressSequentially("Maria Alvarez", { delay: 8 });
    await page.waitForTimeout(1800);
    typed = await page.evaluate(() => ({
      saveIndicatorStatus: document.querySelector("[data-save-status]")?.getAttribute("data-save-status") ?? null,
      saveIndicatorText: (document.querySelector("[data-save-status]")?.innerText || "").trim(),
      anyErrorCopy: /couldn.t save|not saved|problem saving|private browsing|unable to save/i.test(
        document.body.innerText
      ),
      consoleErrors: (window.__consoleErrors || []).slice(0, 6),
    }));
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2500);
    typed.valueAfterReload = await page
      .locator("form input")
      .first()
      .inputValue()
      .catch(() => "NO-FORM-AFTER-RELOAD");
    typed.workLost = typed.valueAfterReload !== "Maria Alvarez";
  }

  await ctx.close();
  return {
    method:
      "localStorage.setItem patched to throw QuotaExceededError for this app's key only. This is " +
      "the behaviour of Safari private browsing, 'block all cookies'/'prevent cross-site tracking' " +
      "in some configurations, and a genuinely full storage quota.",
    onFirstLoad: snapshot,
    afterTyping: typed,
    uncaughtPageErrors: pageErrors.slice(0, 6),
  };
}

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [n, f] of [["hintBlocking", hintBlocking], ["storageFailure", storageFailure]]) {
    try { console.log("--- " + n); out[n] = await f(browser); console.log(JSON.stringify(out[n], null, 1)); }
    catch (e) { out[n] = { FAILED: String(e).slice(0, 400) }; console.error(String(e).slice(0, 400)); }
  }
  await browser.close();
  await writeFile(path.join(OUT, "recheck.json"), JSON.stringify(out, null, 2));
  console.log("  -> audit/evidence/a2/recheck.json");
};
main().catch((e) => { console.error(e); process.exit(1); });
