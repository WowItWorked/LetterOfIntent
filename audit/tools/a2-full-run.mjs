/**
 * A2 — tasks 5, 6 and the error/recovery surface.
 *
 *  - a real end-to-end completion of all fifteen special-needs sections,
 *    counting every navigation click, repeater click and character typed;
 *  - PDF generation at the end of it;
 *  - validation / error states and whether recovery loses work;
 *  - what happens when localStorage cannot be written (private browsing,
 *    blocked site data, quota) — the failure mode that costs a whole evening;
 *  - the backup -> delete -> restore round trip that is the only route back in
 *    after a cleared browser.
 *
 *   node audit/tools/a2-full-run.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import os from "node:os";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");
const KEY = "twl-loi-letter-v1";
const TMP = path.join(os.tmpdir(), "a2-backup");

const SN_SLUGS = [
  "getting-started", "about", "family-and-support", "a-typical-day",
  "communication", "medical", "behavioral-support", "school-and-work",
  "housing", "benefits-and-finances", "friends-joy-and-faith",
  "legal-and-advocacy", "guidance-for-the-trustee", "final-wishes",
  "a-personal-message",
];

/* What a real family writes: a couple of sentences, not a word. */
const ANSWER =
  "He does best with a warm bath at seven and the blue weighted blanket after. " +
  "If he starts pacing the hallway that is the first sign, and quiet helps more than talking.";
const SHORT = "Maria Alvarez";

const seed = () =>
  JSON.stringify({ version: 1, state: { data: {}, meta: { letterPath: "special-needs" } } });

const results = { base: BASE, capturedAt: new Date().toISOString() };

async function ctxWith(browser, opts = {}, extraInit = null) {
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 }, acceptDownloads: true, ...opts });
  if (extraInit) await ctx.addInitScript(extraInit);
  await ctx.addInitScript(
    ([k, v]) => { try { if (localStorage.getItem(k) === null) localStorage.setItem(k, v); } catch {} },
    [KEY, seed()]
  );
  return ctx;
}

/* ============================================ tasks 5 + 6: the whole document */
async function fullCompletion(browser) {
  const ctx = await ctxWith(browser);
  const page = await ctx.newPage();
  const per = [];
  let navClicks = 0, repeaterClicks = 0, chars = 0, controlsFilled = 0, gateClicks = 0;
  const t0 = Date.now();

  await page.goto(`${BASE}/letter/${SN_SLUGS[0]}`, { waitUntil: "networkidle", timeout: 90_000 });

  for (let si = 0; si < SN_SLUGS.length; si++) {
    const slug = SN_SLUGS[si];
    const st = Date.now();
    await page.waitForTimeout(200);

    const ready = page.getByRole("button", { name: /ready/i });
    if (await ready.count()) { await ready.first().click(); gateClicks++; await page.waitForTimeout(350); }
    await page.waitForSelector("form", { timeout: 20_000 }).catch(() => {});

    // Give every repeater one item, so nothing is silently skipped.
    const adds = page.locator("form fieldset > button");
    const na = await adds.count();
    for (let i = 0; i < na; i++) { await adds.nth(i).click(); repeaterClicks++; }
    await page.waitForTimeout(250);

    const controls = page.locator("form input, form textarea");
    const n = await controls.count();
    let sectionChars = 0;
    for (let i = 0; i < n; i++) {
      const el = controls.nth(i);
      const type = await el.getAttribute("type");
      if (type === "checkbox") { await el.check(); continue; }
      const val =
        type === "date" ? "2026-08-09"
          : type === "email" ? "dana@example.com"
            : type === "tel" ? "703-555-0134"
              : (await el.evaluate((e) => e.tagName)) === "TEXTAREA" ? ANSWER : SHORT;
      await el.fill(val);
      sectionChars += val.length;
      controlsFilled++;
    }
    chars += sectionChars;
    await page.waitForTimeout(750); // let the 600ms autosave land

    per.push({
      slug,
      controls: n,
      repeaterAddClicks: na,
      charsTyped: sectionChars,
      mechanicalMs: Date.now() - st,
      pageHeightPx: await page.evaluate(() => document.documentElement.scrollHeight),
    });

    if (si < SN_SLUGS.length - 1) {
      const next = page.getByRole("link", { name: /^Next:/ }).first();
      await next.scrollIntoViewIfNeeded();
      await next.click(); navClicks++;
      await page.waitForURL(/\/letter\/[a-z-]+$/, { timeout: 30_000 }).catch(() => {});
      await page.waitForLoadState("networkidle");
    }
  }

  const mechanicalMs = Date.now() - t0;

  // The progress rail's own view of "finished".
  const progress = await page.evaluate(() => {
    const t = (el) => (el?.innerText || "").replace(/\s+/g, " ").trim();
    const aside = document.querySelector("aside");
    return {
      railText: t(aside).slice(0, 220),
      barWidthPct: (() => {
        const bar = aside?.querySelector("div[aria-hidden='true'] > div");
        return bar ? bar.style.width : null;
      })(),
    };
  });

  // Task 6 — go to review, download everything.
  const toReview = page.getByRole("link", { name: /review & download/i }).first();
  await toReview.scrollIntoViewIfNeeded();
  await toReview.click(); navClicks++;
  await page.waitForURL("**/letter/review", { timeout: 30_000 }).catch(() => {});
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(1200);

  const reviewLead = await page.evaluate(() => {
    const b = document.body.innerText;
    return (b.match(/[^\n]*sections have notes[^\n]*/i) || [])[0]
      || (b.match(/[^\n]*Every section has notes[^\n]*/i) || [])[0] || null;
  });

  const tPdf = Date.now();
  const downloads = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));
  await page.getByRole("button", { name: /download all three/i }).first().click();
  navClicks++;
  await page
    .waitForFunction(() => !/Preparing/i.test(document.body.innerText), { timeout: 300_000 })
    .catch(() => {});
  await page.waitForTimeout(1500);
  const pdfMs = Date.now() - tPdf;

  const store = await page.evaluate((k) => JSON.parse(localStorage.getItem(k) || "null"), KEY);
  const bytes = await page.evaluate((k) => (localStorage.getItem(k) || "").length, KEY);

  await ctx.close();

  /* Time model — INFERRED, not measured. Playwright fills instantly; a person
     types, and stops to think about what a stranger will need to know. */
  const WPM = 33;                    // average adult, typing on a laptop
  const charsPerMin = WPM * 5;
  const typingMin = chars / charsPerMin;
  const thinkSecPerQuestion = 45;    // conservative for prose questions about a child
  const thinkMin = (controlsFilled * thinkSecPerQuestion) / 60;

  return {
    sections: SN_SLUGS.length,
    controlsFilled,
    charsTyped: chars,
    navigationClicks: navClicks,
    repeaterAddClicks: repeaterClicks,
    emotionalGateClicks: gateClicks,
    mechanicalWallMs: mechanicalMs,
    perSection: per,
    railAtEnd: progress,
    reviewLeadAtEnd: reviewLead,
    downloadAllThreeMs: pdfMs,
    filesDownloaded: downloads,
    storedBytes: bytes,
    storedSectionKeys: store ? Object.keys(store.state?.data || {}) : [],
    humanTimeModelINFERRED: {
      assumption: `${WPM} wpm typing, ${thinkSecPerQuestion}s of thinking per question`,
      typingMinutes: +typingMin.toFixed(0),
      thinkingMinutes: +thinkMin.toFixed(0),
      totalMinutes: +(typingMin + thinkMin).toFixed(0),
      siteClaim: "45–90 minutes (chooser header, getting-started intro)",
      sumOfPerSectionBadges: 165,
    },
  };
}

/* ================================================= validation / error states */
async function errorStates(browser) {
  const out = {};
  const ctx = await ctxWith(browser);
  const page = await ctx.newPage();

  // (1) Bad email inside a repeater — soft hint, non-blocking?
  await page.goto(`${BASE}/letter/family-and-support`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("form");
  await page.locator("form fieldset > button").first().click();
  await page.waitForTimeout(250);
  const email = page.locator("input[type=email]").first();
  await email.fill("dana@");
  await page.locator("body").click();          // blur — mode is "onTouched"
  await page.waitForTimeout(400);
  out.badEmail = {
    hintShown: await page.evaluate(() => /doesn.t look like a full email/i.test(document.body.innerText)),
    hintText: await page.evaluate(() => {
      const m = document.body.innerText.match(/[^\n]*email address[^\n]*/i);
      return m ? m[0].trim() : null;
    }),
    blocksNavigation: false, // measured below
    valueKeptAfterNav: null,
  };
  const next = page.getByRole("link", { name: /^Next:/ }).first();
  await next.scrollIntoViewIfNeeded();
  await next.click();
  await page.waitForURL(/\/letter\/[a-z-]+$/, { timeout: 20_000 }).catch(() => {});
  out.badEmail.blocksNavigation = new URL(page.url()).pathname === "/letter/family-and-support";
  await page.goto(`${BASE}/letter/family-and-support`, { waitUntil: "networkidle" });
  await page.waitForTimeout(800);
  out.badEmail.valueKeptAfterNav = await page.locator("input[type=email]").first().inputValue();

  // (2) Bad date.
  await page.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle" });
  await page.waitForSelector("form");
  await page.locator("input[type=date]").first().fill("2026-13-45").catch(() => {});
  await page.locator("body").click();
  await page.waitForTimeout(400);
  out.badDate = {
    nativeInputRejectedIt: (await page.locator("input[type=date]").first().inputValue()) === "",
    hintShown: await page.evaluate(() => /date doesn.t look complete/i.test(document.body.innerText)),
    note: "type=date is a native picker; Chromium refuses an impossible value outright, so the app's own soft hint is never reached from the picker.",
  };

  // (3) Removing a repeater item that has content.
  await page.goto(`${BASE}/letter/medical`, { waitUntil: "networkidle" });
  await page.waitForSelector("form");
  await page.locator("form fieldset > button").first().click();
  await page.waitForTimeout(250);
  await page.locator("form fieldset input").first().fill("Dr Chen");
  await page.waitForTimeout(750);
  let dialogMessage = null;
  page.once("dialog", async (d) => { dialogMessage = d.message(); await d.dismiss(); });
  await page.getByRole("button", { name: /^Remove/ }).first().click();
  await page.waitForTimeout(500);
  out.removeRepeaterItem = {
    confirmDialogShown: Boolean(dialogMessage),
    dialogMessage,
    dialogType: "native window.confirm",
    cancelKeptTheItem: (await page.locator("form fieldset input").first().inputValue()) === "Dr Chen",
  };

  // (4) Unknown section slug.
  const resp = await page.goto(`${BASE}/letter/not-a-real-section`, { waitUntil: "networkidle" }).catch(() => null);
  out.unknownSlug = {
    status: resp ? resp.status() : null,
    bodyMentions404: await page.evaluate(() => /404|not found|couldn.t find/i.test(document.body.innerText)),
    offersWayBack: await page.evaluate(() =>
      Array.from(document.querySelectorAll("a")).some((a) => /letter|home|start/i.test(a.innerText))
    ),
  };

  await ctx.close();
  return out;
}

/* ================================== localStorage unavailable (private mode) */
async function storageFailure(browser) {
  const block = () => {
    // Emulates Safari private browsing / blocked site data: reads work, writes throw.
    const proto = Object.getPrototypeOf(window.localStorage);
    const orig = proto.setItem;
    proto.setItem = function (k, v) {
      if (String(k).includes("twl-loi")) {
        const e = new Error("QuotaExceededError: persistent storage is not available");
        e.name = "QuotaExceededError";
        throw e;
      }
      return orig.call(this, k, v);
    };
    window.__blockedWrites = 0;
    window.addEventListener("error", () => { window.__blockedWrites++; });
    window.__consoleErrors = [];
    const ce = console.error;
    console.error = (...a) => { window.__consoleErrors.push(a.map(String).join(" ").slice(0, 200)); ce(...a); };
  };

  const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
  await ctx.addInitScript(block);
  const page = await ctx.newPage();
  const pageErrors = [];
  page.on("pageerror", (e) => pageErrors.push(String(e).slice(0, 200)));

  await page.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("form", { timeout: 20_000 });
  const el = page.locator("form input").first();
  await el.click();
  await el.pressSequentially("Maria Alvarez", { delay: 8 });
  await page.waitForTimeout(1600);

  const state = await page.evaluate(() => ({
    bodyMentionsProblem: /couldn.t save|not saved|problem saving|storage|private browsing|unable to save/i.test(document.body.innerText),
    saveIndicator: (document.querySelector("[data-save-status]")?.getAttribute("data-save-status")) || null,
    saveIndicatorText: (document.querySelector("[data-save-status]")?.innerText || "").trim(),
    consoleErrors: window.__consoleErrors || [],
    storedValue: (() => { try { return localStorage.getItem("twl-loi-letter-v1"); } catch { return "READ-THREW"; } })(),
  }));

  // Then reload — this is the moment the family finds out.
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(1200);
  const afterReload = await page.locator("form input").first().inputValue();

  await ctx.close();
  return {
    method:
      "localStorage.setItem patched to throw for this app's key only — the behaviour of Safari " +
      "private browsing, 'block all cookies', and a full storage quota.",
    saveIndicatorStatusAttr: state.saveIndicator,
    saveIndicatorVisibleText: state.saveIndicatorText,
    uiTellsTheUserAnythingIsWrong: state.bodyMentionsProblem,
    consoleErrors: state.consoleErrors.slice(0, 5),
    uncaughtPageErrors: pageErrors.slice(0, 5),
    valueSurvivedReload: afterReload,
    workLost: afterReload !== "Maria Alvarez",
  };
}

/* ======================= backup -> delete -> restore, the only route back in */
async function backupRoundTrip(browser) {
  await mkdir(TMP, { recursive: true });
  const ctx = await ctxWith(browser);
  const page = await ctx.newPage();
  const out = { steps: [] };

  await page.goto(`${BASE}/letter/getting-started`, { waitUntil: "networkidle", timeout: 90_000 });
  await page.waitForSelector("form");
  await page.locator("form input").first().fill("Maria Alvarez");
  await page.locator("form input").nth(2).fill("Alexander James Alvarez");
  await page.waitForTimeout(800);
  out.steps.push("typed two answers");

  await page.goto(`${BASE}/your-data`, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);
  const [dl] = await Promise.all([
    page.waitForEvent("download", { timeout: 60_000 }),
    page.getByRole("button", { name: /download backup file/i }).click(),
  ]);
  const file = path.join(TMP, dl.suggestedFilename());
  await dl.saveAs(file);
  out.backupFile = { name: dl.suggestedFilename(), bytes: (await readFile(file)).length };
  out.steps.push("downloaded the backup");
  out.backupNoticeText = await page.evaluate(() => {
    const m = document.body.innerText.match(/[^\n]*Backup downloaded[^\n]*/i);
    return m ? m[0].trim() : null;
  });

  // Delete everything.
  await page.getByRole("button", { name: /delete all my data/i }).first().click();
  await page.waitForTimeout(400);
  out.deleteDialog = await page.evaluate(() => {
    const d = document.querySelector("[role=dialog], dialog");
    return d ? (d.innerText || "").replace(/\s+/g, " ").trim().slice(0, 320) : null;
  });
  await page.getByRole("button", { name: /yes, delete it all/i }).click();
  await page.waitForTimeout(900);
  out.afterDeleteNotice = await page.evaluate(() => {
    const m = document.body.innerText.match(/[^\n]*Deleted[^\n]*/i);
    return m ? m[0].trim() : null;
  });
  out.storeAfterDelete = await page.evaluate((k) => localStorage.getItem(k), KEY);
  out.steps.push("deleted everything");

  // Restore.
  let restoreClicks = 0;
  const restore = page.getByRole("button", { name: /choose a backup file|load a backup|restore/i }).first();
  const hasButton = await restore.count();
  if (hasButton) { await restore.click(); restoreClicks++; await page.waitForTimeout(400); }
  const fileInput = page.locator("input[type=file]").first();
  out.fileInputPresent = (await fileInput.count()) > 0;
  if (out.fileInputPresent) {
    await fileInput.setInputFiles(file);
    restoreClicks++;
    await page.waitForTimeout(1200);
  }
  out.restoreScreen = await page.evaluate(() => (document.body.innerText || "").replace(/\s+/g, " ").slice(0, 600));
  const confirm = page.getByRole("button", { name: /load|replace|restore|continue|yes/i }).first();
  if (await confirm.count()) {
    await confirm.click(); restoreClicks++;
    await page.waitForTimeout(1200);
  }
  out.restoreClicks = restoreClicks;
  out.storeAfterRestore = await page.evaluate((k) => {
    const raw = localStorage.getItem(k);
    if (!raw) return null;
    try { return JSON.parse(raw).state?.data?.gettingStarted ?? null; } catch { return "UNPARSEABLE"; }
  }, KEY);
  out.restored = Boolean(out.storeAfterRestore && out.storeAfterRestore.authorName === "Maria Alvarez");
  out.steps.push(`restored = ${out.restored}`);

  await ctx.close();
  return out;
}

/* --------------------------------------------------------------------- main */
const main = async () => {
  await mkdir(OUT, { recursive: true });
  const browser = await chromium.launch();
  for (const [name, fn] of [
    ["fullCompletion", fullCompletion],
    ["errorStates", errorStates],
    ["storageFailure", storageFailure],
    ["backupRoundTrip", backupRoundTrip],
  ]) {
    try {
      console.log(`--- ${name}`);
      results[name] = await fn(browser);
      console.log("   ", JSON.stringify(results[name]).slice(0, 700));
    } catch (e) {
      results[name] = { FAILED: String(e).slice(0, 500) };
      console.error(`  ${name} FAILED:`, String(e).slice(0, 400));
    }
  }
  await browser.close();
  await writeFile(path.join(OUT, "full-run.json"), JSON.stringify(results, null, 2));
  console.log("  -> audit/evidence/a2/full-run.json");
};

main().catch((e) => { console.error(e); process.exit(1); });
