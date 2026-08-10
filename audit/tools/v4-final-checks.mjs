import { readFileSync } from "node:fs";

const home = readFileSync("audit/evidence/v4/prod-https_myletterofintent_com_.html", "utf8");
const priv = readFileSync("audit/evidence/v4/prod-https_myletterofintent_com_privacy.html", "utf8");
const text = (h) => h.replace(/<script[\s\S]*?<\/script>/gi, " ").replace(/<[^>]+>/g, " ").replace(/&#x27;/g, "'").replace(/&amp;/g, "&").replace(/\s+/g, " ");

console.log("--- A7-003 homepage strings ---");
for (const s of [
  "never shared",
  "It saves only on your device",
  "Private by design",
  "nothing you type ever leaves your device",
  "Everything stays on your device",
]) console.log("  " + JSON.stringify(s) + " -> " + home.includes(s));

console.log("--- A8-004 privacy page absences ---");
const pt = text(priv).toLowerCase();
for (const s of ["do not track", "global privacy control", "updated", "effective", "changes to this policy", "last reviewed", "20"]) {
  console.log("  " + JSON.stringify(s) + " present: " + pt.includes(s));
}
console.log("  any 4-digit year: " + JSON.stringify((text(priv).match(/\b(19|20)\d{2}\b/g) || []).slice(0, 8)));
console.log("  any date-like: " + JSON.stringify((text(priv).match(/\b(January|February|March|April|May|June|July|August|September|October|November|December)\s+\d{1,2},?\s+\d{4}/gi) || [])));

console.log("--- A8-009 homepage health link ---");
console.log("  /health|consumer health/i in home: " + /health|consumer health/i.test(home));
const links = [...home.matchAll(/href="([^"]+)"/g)].map((m) => m[1]);
console.log("  hrefs matching health: " + JSON.stringify(links.filter((l) => /health/i.test(l))));
console.log("  all internal hrefs: " + JSON.stringify([...new Set(links.filter((l) => l.startsWith("/")))].slice(0, 30)));

console.log("--- A7-005 email-decode offset (browser-less fetch) ---");
console.log("  offset in home: " + home.indexOf("email-decode"));
console.log("  chars before it: " + JSON.stringify(home.slice(home.indexOf("email-decode") - 140, home.indexOf("email-decode"))));

console.log("--- A7-004 beacon in plain fetch ---");
console.log("  cloudflareinsights present: " + home.includes("cloudflareinsights"));
