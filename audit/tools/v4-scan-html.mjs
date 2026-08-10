import { readdirSync, readFileSync } from "node:fs";
const dir = "audit/evidence/v4";
for (const f of readdirSync(dir)) {
  if (!f.endsWith(".html")) continue;
  const h = readFileSync(dir + "/" + f, "utf8");
  console.log("=== " + f + " len=" + h.length);
  console.log("  cloudflareinsights: " + h.includes("cloudflareinsights"));
  console.log("  cf-beacon: " + h.includes("cf-beacon"));
  console.log("  beacon.min.js: " + h.includes("beacon.min.js"));
  console.log("  <video count: " + (h.match(/<video/g) || []).length);
  console.log("  mp4 ref: " + h.includes("what-is-a-letter-of-intent.mp4"));
  const og = h.match(/<meta property="og:image"[^>]*>/);
  console.log("  og:image: " + (og ? og[0] : "NONE"));
  console.log("  cdn-cgi count: " + (h.match(/cdn-cgi/g) || []).length);
  const ep = h.match(/\/cdn-cgi\/l\/email-protection[^"']{0,60}/);
  console.log("  email-protection href: " + (ep ? ep[0] : "NONE"));
  console.log("  mailto: count: " + (h.match(/mailto:/g) || []).length);
}
