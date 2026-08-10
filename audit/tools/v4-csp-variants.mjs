const urls = [
  ["HTML /", "https://myletterofintent.com/"],
  ["mp4", "https://myletterofintent.com/what-is-a-letter-of-intent.mp4"],
  ["static chunk", "https://myletterofintent.com/_next/static/immutable/chunks/40j7zhhvzkl0b.js"],
  ["og-image", "https://myletterofintent.com/og-image.png"],
  ["image optimizer", "https://myletterofintent.com/_next/image?url=%2Fog-image.png&w=640&q=75"],
  ["RSC", "https://myletterofintent.com/privacy?_rsc=1"],
];
for (const [label, u] of urls) {
  try {
    const r = await fetch(u, { headers: { accept: "text/html,*/*", RSC: label === "RSC" ? "1" : undefined } });
    console.log("--- " + label + " (" + r.status + ")");
    console.log("    ACAO: " + r.headers.get("access-control-allow-origin"));
    console.log("    CORP: " + r.headers.get("cross-origin-resource-policy"));
    console.log("    CSP:  " + (r.headers.get("content-security-policy") || "(none)").slice(0, 200));
    console.log("    x-nextjs-prerender: " + r.headers.get("x-nextjs-prerender") + "  x-nextjs-postponed: " + r.headers.get("x-nextjs-postponed") + "  x-matched-path: " + r.headers.get("x-matched-path") + "  x-vercel-cache: " + r.headers.get("x-vercel-cache") + "  content-type: " + r.headers.get("content-type"));
  } catch (e) {
    console.log("--- " + label + " ERROR " + e);
  }
}
