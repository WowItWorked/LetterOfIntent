// V3 — per-page text item dump. READ-ONLY.
import fs from "node:fs";
const { getDocument } = await import("pdfjs-dist/legacy/build/pdf.mjs");
const target = process.argv[2];
const pages = process.argv[3] ? process.argv[3].split(",").map(Number) : null;
const doc = await getDocument({ data: new Uint8Array(fs.readFileSync(target)) }).promise;
for (let i = 1; i <= doc.numPages; i++) {
  if (pages && !pages.includes(i)) continue;
  const pg = await doc.getPage(i);
  const tc = await pg.getTextContent();
  console.log(`--- page ${i}: ${tc.items.length} items ---`);
  for (const it of tc.items) {
    if (!it.str) continue;
    console.log(`  [${(it.transform?.[5] ?? 0).toFixed(1)}] ${JSON.stringify(it.str)}`);
  }
}
