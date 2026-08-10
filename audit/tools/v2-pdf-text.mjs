// V2 verifier — extract text from the evidence PDFs. Analysis only.
import fs from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");

const files = process.argv.slice(2);
for (const f of files) {
  const data = new Uint8Array(fs.readFileSync(f));
  const doc = await pdfjs.getDocument({ data, useSystemFonts: true }).promise;
  console.log("=".repeat(70));
  console.log(f, "— pages:", doc.numPages);
  for (let n = 1; n <= doc.numPages; n++) {
    const page = await doc.getPage(n);
    const tc = await page.getTextContent();
    const text = tc.items.map((i) => ("str" in i ? i.str : "")).join(" ").replace(/\s+/g, " ").trim();
    console.log(`--- page ${n} (${text.length} chars) ---`);
    console.log(text.slice(0, 1800));
  }
}
