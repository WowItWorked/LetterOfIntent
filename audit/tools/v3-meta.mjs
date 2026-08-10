// V3 — re-fetch production + local metadata for verification. READ-ONLY (network GET only).
const routes = [
  "/", "/privacy", "/your-data", "/letter", "/letter/review",
  "/letter/getting-started", "/letter/medical",
  "/samples/letter-of-intent-disabilities",
  "/samples/emergency-information-sheet-disabilities",
];
const bases = { production: "https://myletterofintent.com", local: "http://localhost:3000" };
const pick = (html, re) => (re.exec(html) || [])[1] ?? null;
const dec = (s) =>
  s == null ? null : s.replace(/&amp;/g, "&").replace(/&#x27;|&#39;/g, "'").replace(/&quot;/g, '"').replace(/&lt;/g, "<").replace(/&gt;/g, ">").replace(/&mdash;/g, "—");

const out = {};
for (const [env, base] of Object.entries(bases)) {
  out[env] = {};
  for (const r of routes) {
    try {
      const res = await fetch(base + r, { redirect: "follow" });
      const html = await res.text();
      const desc = dec(pick(html, /<meta name="description" content="([^"]*)"/));
      const title = dec(pick(html, /<title[^>]*>([^<]*)<\/title>/));
      const ogImg = dec(pick(html, /<meta property="og:image" content="([^"]*)"/));
      const ogDesc = dec(pick(html, /<meta property="og:description" content="([^"]*)"/));
      const h1 = dec(pick(html, /<h1[^>]*>([\s\S]*?)<\/h1>/))?.replace(/<[^>]+>/g, "").trim();
      out[env][r] = {
        status: res.status,
        title, titleLen: title?.length ?? null,
        description: desc, descLen: desc?.length ?? null,
        ogImage: ogImg, ogDescSameAsDesc: ogDesc === desc,
        h1,
      };
    } catch (e) {
      out[env][r] = { error: String(e) };
    }
  }
}
console.log(JSON.stringify(out, null, 2));
