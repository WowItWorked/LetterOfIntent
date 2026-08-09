/**
 * Throwaway comparison: the share card on white vs on the site's ivory,
 * rendered as the two candidates and as a mock of how each sits inside a real
 * message bubble — which is the only context that actually decides it.
 *
 *   node audit/tools/og-compare.mjs
 */
import { chromium } from "playwright";
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const LOGO = path.resolve("public/social-logo.png");
const OUT = path.resolve("audit/evidence/og-options");
const W = 1200;
const H = 630;

const OPTIONS = [
  { name: "white", bg: "#ffffff", label: "Option A — pure white #ffffff" },
  { name: "ivory", bg: "#fbfaf6", label: "Option B — site ivory #fbfaf6" },
];

const card = (uri, bg) => `
  <div style="width:${W}px;height:${H}px;background:${bg};display:flex;
              align-items:center;justify-content:center;">
    <img src="${uri}" style="max-width:620px;max-height:500px;width:auto;height:auto;" />
  </div>`;

async function main() {
  await mkdir(OUT, { recursive: true });
  const buf = await readFile(LOGO);
  const uri = `data:image/png;base64,${buf.toString("base64")}`;

  const browser = await chromium.launch();

  // The two candidates, at true size.
  for (const o of OPTIONS) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
       <style>html,body{margin:0;padding:0}</style></head>
       <body>${card(uri, o.bg)}</body></html>`,
      { waitUntil: "networkidle" }
    );
    await page.screenshot({ path: path.join(OUT, `og-${o.name}.png`), type: "png" });
    await page.close();
  }

  /*
   * In situ. A share card is never seen on a neutral backdrop — it is seen
   * inside a chat bubble or a feed card, and that surrounding colour is what
   * makes an off-white read as either "warm" or "grubby". Comparing the two
   * candidates in isolation would not answer the question being asked.
   */
  const bubble = (o) => `
    <div style="margin:0 0 34px 0;">
      <div style="font:600 15px/1.4 -apple-system,Segoe UI,sans-serif;color:#111;
                  margin:0 0 10px 2px;">${o.label}</div>

      <!-- iMessage-ish: grey bubble on white -->
      <div style="display:inline-block;background:#e9e9eb;border-radius:18px;
                  padding:0;overflow:hidden;width:430px;vertical-align:top;
                  margin-right:22px;">
        <img src="${o.uri}" style="display:block;width:430px;height:226px;object-fit:cover;
                                   object-position:center;" />
        <div style="padding:9px 13px 12px;font:400 13px/1.35 -apple-system,Segoe UI,sans-serif;">
          <div style="color:#000;font-weight:600;">Write down what only you know…</div>
          <div style="color:#7c7c80;margin-top:2px;">myletterofintent.com</div>
        </div>
      </div>

      <!-- Feed-ish: white card on a grey feed background -->
      <div style="display:inline-block;background:#f0f2f5;padding:14px;border-radius:10px;
                  width:430px;vertical-align:top;">
        <div style="background:#fff;border:1px solid #dadde1;border-radius:8px;overflow:hidden;">
          <img src="${o.uri}" style="display:block;width:428px;height:224px;object-fit:cover;" />
          <div style="padding:10px 12px;font:400 13px/1.35 -apple-system,Segoe UI,sans-serif;">
            <div style="color:#65676b;text-transform:uppercase;font-size:11px;">myletterofintent.com</div>
            <div style="color:#050505;font-weight:600;margin-top:3px;">Write down what only you know…</div>
          </div>
        </div>
      </div>
    </div>`;

  const rendered = [];
  for (const o of OPTIONS) {
    const page = await browser.newPage({ viewport: { width: W, height: H } });
    await page.setContent(
      `<!doctype html><html><head><meta charset="utf-8">
       <style>html,body{margin:0;padding:0}</style></head>
       <body>${card(uri, o.bg)}</body></html>`,
      { waitUntil: "networkidle" }
    );
    const shot = await page.screenshot({ type: "png" });
    await page.close();
    rendered.push({ ...o, uri: `data:image/png;base64,${shot.toString("base64")}` });
  }

  const page = await browser.newPage({ viewport: { width: 960, height: 760 } });
  await page.setContent(
    `<!doctype html><html><head><meta charset="utf-8"></head>
     <body style="margin:0;padding:26px 24px;background:#fff;">
       <div style="font:700 17px/1.3 -apple-system,Segoe UI,sans-serif;margin:0 0 20px;">
         How each reads in a real message bubble and a real feed card
       </div>
       ${rendered.map(bubble).join("")}
     </body></html>`,
    { waitUntil: "networkidle" }
  );
  await page.screenshot({ path: path.join(OUT, "in-situ.png"), fullPage: true });
  await page.close();

  await browser.close();
  console.log(`  -> ${OUT}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
