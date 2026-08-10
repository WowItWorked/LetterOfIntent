// V5 verification: does the generated PDF text layer actually contain the
// site address, and where? Checks the Letter of Intent cover and the
// emergency sheet. Read-only.
import { readFile } from "node:fs/promises";
import { createRequire } from "node:module";

import { pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const pdfjsPath = require.resolve("pdfjs-dist/legacy/build/pdf.mjs");
const pdfjs = await import(pathToFileURL(pdfjsPath).href);

const files = process.argv.slice(2);
const out = {};

for (const f of files) {
  const data = new Uint8Array(await readFile(f));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  const pages = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const tc = await page.getTextContent();
    const items = tc.items.map((it) => ({
      str: it.str,
      x: Math.round(it.transform[4]),
      y: Math.round(it.transform[5]),
      h: Math.round(it.height * 10) / 10,
      font: it.fontName,
    }));
    pages.push({
      page: i,
      viewport: page.getViewport({ scale: 1 }).viewBox,
      text: items.map((i2) => i2.str).join(""),
      items,
    });
  }
  out[f] = {
    numPages: doc.numPages,
    pages: pages.map((p) => ({
      page: p.page,
      viewBox: p.viewport,
      text: p.text,
      urlItems: p.items.filter((i2) => /myletterofintent|Created with|Prepared with/i.test(i2.str)),
    })),
  };
}
console.log(JSON.stringify(out, null, 2));
