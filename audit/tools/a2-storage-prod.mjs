/**
 * A2 — the same localStorage-write-failure case, run against PRODUCTION, because
 * the dev overlay is not what a family would see. Read-only: nothing is typed
 * and nothing is submitted.
 *
 *   node audit/tools/a2-storage-prod.mjs
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const PROD = "https://myletterofintent.com";
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
  await mkdir(path.join(OUT, "storage-failure-prod"), { recursive: true });
  const browser = await chromium.launch();
  const report = { site: PROD, capturedAt: new Date().toISOString(), routes: {} };

  for (const [name, route] of [
    ["wizard-getting-started", "/letter/getting-started"],
    ["wizard-medical", "/letter/medical"],
    ["review", "/letter/review"],
    ["chooser", "/letter"],
  ]) {
    // Control run first: same route, storage working.
    const control = await (async () => {
      const c = await browser.newContext({ viewport: { width: 1280, height: 950 } });
      const p = await c.newPage();
      await p.goto(PROD + route, { waitUntil: "networkidle", timeout: 120_000 });
      await p.waitForTimeout(3000);
      const r = {
        inputs: await p.evaluate(() => document.querySelectorAll("form input, form textarea").length),
        mainChars: await p.evaluate(() => (document.querySelector("main")?.innerText || "").trim().length),
      };
      await c.close();
      return r;
    })();

    const ctx = await browser.newContext({ viewport: { width: 1280, height: 950 } });
    await ctx.addInitScript(block);
    const page = await ctx.newPage();
    const errs = [];
    page.on("pageerror", (e) => errs.push(String(e).split("\n")[0].slice(0, 160)));
    await page.goto(PROD + route, { waitUntil: "networkidle", timeout: 120_000 });
    await page.waitForTimeout(4000);
    const shot = path.join(OUT, "storage-failure-prod", `${name}.png`);
    await page.screenshot({ path: shot, fullPage: false });

    report.routes[route] = {
      controlRun: control,
      screenshot: path.relative(process.cwd(), shot).replace(/\\/g, "/"),
      uncaughtErrors: [...new Set(errs)],
      headerRendered: await page.evaluate(() => Boolean(document.querySelector("header img"))),
      formInputs: await page.evaluate(() => document.querySelectorAll("form input, form textarea").length),
      mainVisibleChars: await page.evaluate(
        () => (document.querySelector("main")?.innerText || "").trim().length
      ),
      mainVisibleText: await page.evaluate(
        () => (document.querySelector("main")?.innerText || "").replace(/\s+/g, " ").trim().slice(0, 400)
      ),
      anyExplanationShown: await page.evaluate(() =>
        /couldn.t save|not saved|problem|storage|private|browser settings|something went wrong|try again/i.test(
          document.querySelector("main")?.innerText || ""
        )
      ),
    };
    console.log(
      `  ${route}: control ${control.inputs} inputs / ${control.mainChars} chars  ->  ` +
        `blocked ${report.routes[route].formInputs} inputs / ${report.routes[route].mainVisibleChars} chars; ` +
        `errors: ${report.routes[route].uncaughtErrors.join(" | ") || "none"}`
    );
    await ctx.close();
  }

  await browser.close();
  await writeFile(path.join(OUT, "storage-failure-prod.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/storage-failure-prod.json");
};
main().catch((e) => { console.error(e); process.exit(1); });
