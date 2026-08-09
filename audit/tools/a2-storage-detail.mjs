/**
 * A2 — exactly what a family sees when localStorage writes fail.
 * Captures a screenshot and the full visible text, on the wizard and on /letter.
 *
 *   node audit/tools/a2-storage-detail.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const BASE = process.env.A2_BASE || "http://localhost:3000";
const OUT = path.resolve("audit/evidence/a2");

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
};

const main = async () => {
  await mkdir(path.join(OUT, "storage-failure"), { recursive: true });
  const browser = await chromium.launch();
  const report = { method: "localStorage.setItem throws QuotaExceededError for the app's key", routes: {} };

  for (const [name, route] of [
    ["wizard-getting-started", "/letter/getting-started"],
    ["chooser", "/letter"],
    ["review", "/letter/review"],
    ["home", "/"],
    ["your-data", "/your-data"],
  ]) {
    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    await ctx.addInitScript(block);
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e).split("\n")[0].slice(0, 160)));
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 90_000 });
    await page.waitForTimeout(4000);
    const shot = path.join(OUT, "storage-failure", `${name}.png`);
    await page.screenshot({ path: shot, fullPage: false });
    report.routes[route] = {
      screenshot: path.relative(process.cwd(), shot).replace(/\\/g, "/"),
      uncaughtErrors: [...new Set(errs)],
      headerRendered: await page.evaluate(() => Boolean(document.querySelector("header img"))),
      mainVisibleText: await page.evaluate(
        () => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 500)
      ),
      mainVisibleTextLength: await page.evaluate(
        () => (document.querySelector("main")?.innerText || "").trim().length
      ),
      formInputs: await page.evaluate(() => document.querySelectorAll("form input, form textarea").length),
      anyExplanationShown: await page.evaluate(() =>
        /couldn.t save|not saved|problem|storage|private|browser settings|try again/i.test(
          document.querySelector("main")?.innerText || ""
        )
      ),
    };
    console.log(
      `  ${route}: main text ${report.routes[route].mainVisibleTextLength} chars, ` +
        `${report.routes[route].formInputs} inputs, errors: ${report.routes[route].uncaughtErrors.join(" | ") || "none"}`
    );
    await ctx.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "storage-failure.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/storage-failure.json");
};
main().catch((e) => { console.error(e); process.exit(1); });
