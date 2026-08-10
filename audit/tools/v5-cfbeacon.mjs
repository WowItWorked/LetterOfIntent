// V5: does the edge-injected Cloudflare RUM beacon actually EXECUTE on
// production, or is it blocked by the site's own CSP? Read-only.
import { chromium } from "playwright";

const BASE = "https://myletterofintent.com";
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();

const console_ = [];
const requests = [];
const responses = [];
const failed = [];
page.on("console", (m) => console_.push(`${m.type()}: ${m.text().slice(0, 200)}`));
page.on("request", (r) => requests.push(`${r.method()} ${r.url().slice(0, 140)}`));
page.on("response", (r) => responses.push(`${r.status()} ${r.url().slice(0, 140)}`));
page.on("requestfailed", (r) =>
  failed.push(`${r.url().slice(0, 140)} :: ${r.failure()?.errorText}`)
);

await page.goto(BASE, { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(9000);
// beacon posts on unload/visibility too
await page.evaluate(() => document.dispatchEvent(new Event("visibilitychange")));
await page.waitForTimeout(3000);

const beaconInDom = await page.evaluate(
  () => !!document.querySelector("script[data-cf-beacon]")
);
const beaconGlobal = await page.evaluate(() =>
  Object.keys(window).filter((k) => /cf|beacon|rum/i.test(k)).slice(0, 20)
);

console.log("beacon script tag in DOM:", beaconInDom);
console.log("cf-ish globals:", beaconGlobal);
console.log("--- requests mentioning cloudflare/rum ---");
console.log(requests.filter((r) => /cloudflare|rum|cdn-cgi/i.test(r)).join("\n") || "(none)");
console.log("--- responses mentioning cloudflare/rum ---");
console.log(responses.filter((r) => /cloudflare|rum|cdn-cgi/i.test(r)).join("\n") || "(none)");
console.log("--- failed requests ---");
console.log(failed.join("\n") || "(none)");
console.log("--- console CSP / errors ---");
console.log(
  console_.filter((c) => /csp|content security|refus|error|block/i.test(c)).join("\n") ||
    "(none)"
);
await browser.close();
