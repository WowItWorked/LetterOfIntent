/** V1 verifier — crop regions out of the shared screenshots so the claimed
 *  Next.js dev badge (A1-012) can be looked at directly. */
import { chromium } from "@playwright/test";
import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

const jobs = [
  ["home-1440.png", 0, 250, 260, 200],
  ["wizard-medical-1440.png", 0, 470, 260, 200],
  ["wizard-medical-768.png", 0, 500, 260, 200],
];

const browser = await chromium.launch();
const page = await (await browser.newContext({ viewport: { width: 900, height: 900 } })).newPage();

for (const [file, x, y, w, h] of jobs) {
  const b64 = readFileSync(
    new URL(`../evidence/screenshots/${file}`, import.meta.url)
  ).toString("base64");
  await page.setContent(
    `<body style="margin:0;background:#222">
       <div style="width:${w * 2}px;height:${h * 2}px;overflow:hidden;position:relative">
         <img id="i" src="data:image/png;base64,${b64}"
              style="position:absolute;left:${-x * 2}px;top:${-y * 2}px;transform-origin:0 0;transform:scale(2)">
       </div>
     </body>`
  );
  await page.waitForFunction(() => document.getElementById("i")?.complete);
  const dims = await page.evaluate(() => {
    const i = document.getElementById("i");
    return { w: i.naturalWidth, h: i.naturalHeight };
  });
  console.log(file, "natural size", dims);
  const buf = await page.locator("div").first().screenshot();
  writeFileSync(fileURLToPath(new URL(`../evidence/v1/crop-${file}`, import.meta.url)), buf);
}
await browser.close();
console.log("done");
