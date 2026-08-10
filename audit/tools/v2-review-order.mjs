import { chromium } from "@playwright/test";
import fs from "node:fs";
const j = JSON.parse(fs.readFileSync("audit/evidence/fill-levels.json","utf8"));
const data = j.levels.typical;
const envelope = { version: 1, state: { data, meta: { letterPath: "special-needs", lastVisitedSlug: "about", startedAt: "2026-08-09T07:00:00.000Z", updatedAt: "2026-08-09T07:00:00.000Z" } } };
const b = await chromium.launch();
const c = await b.newContext({ viewport: { width: 1024, height: 900 } });
const p = await c.newPage();
await p.goto("http://localhost:3000/letter", { waitUntil: "domcontentloaded" });
await p.evaluate((e) => localStorage.setItem("twl-loi-letter-v1", JSON.stringify(e)), envelope);
await p.goto("http://localhost:3000/letter/review", { waitUntil: "networkidle" });
await p.waitForTimeout(5000);
const res = await p.evaluate(() => {
  const want = { downloads:/^Download all three$/i, year:/^Come back in a year\.?$/i, pass:/^You know how hard this was to start\.$/i, cta:/a trust protects their future/i, read:/^Read it through$/i, empty:/^Sections without notes yet$/i };
  const marks = {};
  for (const el of document.querySelectorAll("h1,h2,h3,p")) {
    const t = (el.innerText||"").replace(/\s+/g," ").trim();
    for (const [k,re] of Object.entries(want)) if (marks[k]===undefined && re.test(t)) marks[k] = Math.round(el.getBoundingClientRect().top + window.scrollY);
  }
  return { pageHeight: document.documentElement.scrollHeight, marks, bodyLen: document.body.innerText.length };
});
console.log(JSON.stringify(res,null,2));
for (const [k,v] of Object.entries(res.marks)) console.log(k.padEnd(12), v, Math.round(v/res.pageHeight*100)+"%");
await b.close();
