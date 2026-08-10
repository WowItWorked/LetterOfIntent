import { chromium } from "@playwright/test";
import fs from "node:fs";
const BASE = "http://localhost:3000";
const out = {};
const browser = await chromium.launch();

/* target size + contact mechanisms across routes */
{
  const ctx = await browser.newContext({ viewport: { width: 375, height: 800 } });
  const p = await ctx.newPage();
  for (const r of ["/", "/letter", "/letter/medical", "/your-data", "/privacy"]) {
    await p.goto(BASE + r, { waitUntil: "networkidle" });
    await p.waitForTimeout(1200);
    out[r] = await p.evaluate(() => {
      const small = [];
      let standaloneUnder44 = 0;
      for (const el of document.querySelectorAll(
        "a[href],button,input,select,textarea,[role=button]"
      )) {
        const r2 = el.getBoundingClientRect();
        if (r2.width === 0 && r2.height === 0) continue;
        const min = Math.min(r2.width, r2.height);
        const inline = getComputedStyle(el).display === "inline";
        if (min < 24)
          small.push({
            text: (el.innerText || el.getAttribute("aria-label") || el.tagName)
              .replace(/\s+/g, " ").trim().slice(0, 34),
            w: Math.round(r2.width * 10) / 10,
            h: Math.round(r2.height * 10) / 10,
            inline,
          });
        if (!inline && min < 44 && min > 2) standaloneUnder44++;
      }
      const contacts = [...document.querySelectorAll('a[href^="tel:"],a[href^="mailto:"]')].map(
        (a) => ({ href: a.getAttribute("href"), inFooter: !!a.closest("footer"), inMain: !!a.closest("main") })
      );
      return { under24: small, standaloneUnder44, contacts };
    });
  }
  await ctx.close();
}
fs.writeFileSync("audit/evidence/v2/verify-d.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2));
await browser.close();
