/**
 * V4: (a) DNS facts for A7-006 via DoH (CAA + DNSKEY + NS + A), which the
 *     original analyst could not query; (b) re-read the delete-confirmation
 *     notice text for A7-007.
 */
import { chromium } from "playwright";
import { writeFileSync } from "node:fs";

const out = {};

/* --------------------------------------------------------------- (a) DNS -- */
async function doh(name, type) {
  const r = await fetch(
    `https://cloudflare-dns.com/dns-query?name=${name}&type=${type}`,
    { headers: { accept: "application/dns-json" } }
  );
  const j = await r.json();
  return { status: j.Status, ad: j.AD, answers: (j.Answer || []).map((a) => ({ type: a.type, data: a.data })), authority: (j.Authority || []).map((a) => a.data) };
}
for (const t of ["A", "NS", "CAA", "DNSKEY", "DS"]) {
  try { out["dns_" + t] = await doh("myletterofintent.com", t); }
  catch (e) { out["dns_" + t] = { error: String(e) }; }
}
// second resolver for independence
try {
  const r = await fetch("https://dns.google/resolve?name=myletterofintent.com&type=CAA");
  out.dns_CAA_google = await r.json();
} catch (e) { out.dns_CAA_google = { error: String(e) }; }
try {
  const r = await fetch("https://hstspreload.org/api/v2/status?domain=myletterofintent.com");
  out.hstsPreload = await r.json();
} catch (e) { out.hstsPreload = { error: String(e) }; }

/* ---------------------------------------------- (b) delete notice text ----- */
const browser = await chromium.launch();
const ctx = await browser.newContext();
const page = await ctx.newPage();
await page.goto("https://myletterofintent.com/letter/about", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2000);
const f = page.locator("form textarea:visible, form input[type=text]:visible").first();
await f.click();
await page.keyboard.type("delete notice check", { delay: 25 });
await page.waitForTimeout(2000);
await page.goto("https://myletterofintent.com/your-data", { waitUntil: "networkidle", timeout: 60000 });
await page.waitForTimeout(2500);
await page.getByRole("button", { name: /Delete all my data/i }).click();
await page.waitForTimeout(600);
await page.getByRole("button", { name: /Yes, delete it all/i }).click();
await page.waitForTimeout(2500);
out.ariaLiveRegions = await page.evaluate(() =>
  [...document.querySelectorAll("[aria-live]")].map((e) => ({
    live: e.getAttribute("aria-live"),
    text: (e.innerText || "").trim().slice(0, 300),
  }))
);
out.pageTextHasWeChecked = await page.evaluate(() =>
  document.body.innerText.includes("We checked")
);
out.noticeParagraph = await page
  .locator("text=/Deleted\\./")
  .first()
  .innerText()
  .catch(() => "(not found)");
await browser.close();

writeFileSync("audit/evidence/v4/dns-and-notice.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
