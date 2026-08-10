import fs from "node:fs";
const raw = fs.readFileSync("audit/evidence/network/capture-production.json", "utf8");
const j = JSON.parse(raw);
console.log("top keys:", Object.keys(j).slice(0, 20));
const req = j.requests || j.entries || (Array.isArray(j) ? j : null);
console.log("request count:", Array.isArray(req) ? req.length : "n/a");
for (const pat of [".vtt", "captions", "subtitles", "track kind", "og:image", "og-image", "what-is-a-letter-of-intent.mp4", "social-logo"]) {
  const n = raw.split(pat).length - 1;
  console.log(pat.padEnd(34), n);
}
if (Array.isArray(req)) {
  const urls = req.map((r) => r.url || r.request?.url).filter(Boolean);
  console.log("total urls:", urls.length);
  const hosts = [...new Set(urls.map((u) => { try { return new URL(u).host; } catch { return String(u); } }))];
  console.log("hosts:", hosts.join(", "));
  console.log("mp4 urls:", [...new Set(urls.filter((u) => /\.mp4/.test(u)))]);
  console.log("vtt urls:", urls.filter((u) => /\.vtt/.test(u)));
} else {
  // maybe keyed by page
  for (const [k, v] of Object.entries(j).slice(0, 12)) {
    console.log(k, Array.isArray(v) ? `array(${v.length})` : typeof v);
  }
}
