/** Why does a plain fetch not see the CF beacon that a browser does? */
const BROWSER_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/151.0.0.0 Safari/537.36";
const cases = [
  ["node default (no UA, no Accept)", {}],
  ["browser UA only", { "user-agent": BROWSER_UA }],
  ["Accept: text/html only", { accept: "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8" }],
  [
    "browser UA + Accept + sec-fetch",
    {
      "user-agent": BROWSER_UA,
      accept: "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
      "accept-language": "en-US,en;q=0.9",
      "sec-fetch-dest": "document",
      "sec-fetch-mode": "navigate",
      "sec-fetch-site": "none",
      "sec-fetch-user": "?1",
      "upgrade-insecure-requests": "1",
    },
  ],
];
for (const [label, headers] of cases) {
  const r = await fetch("https://myletterofintent.com/", { headers });
  const h = await r.text();
  console.log(
    label.padEnd(34) +
      " len=" + String(h.length).padEnd(7) +
      " beacon=" + String(h.includes("cloudflareinsights")).padEnd(6) +
      " emailDecode=" + h.includes("email-decode") +
      " cf-cache=" + r.headers.get("cf-cache-status")
  );
}
