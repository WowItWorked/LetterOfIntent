/**
 * A2 — what the handed-over document actually says about its own completeness.
 * Extracts text from the already-captured evidence PDFs.
 *
 *   node audit/tools/a2-pdf-text.mjs
 */
import { readFile, writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { createRequire } from "node:module";

const require = createRequire(import.meta.url);
const OUT = path.resolve("audit/evidence/a2");

const FILES = [
  "audit/evidence/pdfs/minimal--Letter-of-Intent-Disabilities-2026-08-09.pdf",
  "audit/evidence/pdfs/typical--Letter-of-Intent-Disabilities-2026-08-09.pdf",
  "audit/evidence/pdfs/minimal--Emergency-Information-Sheet-2026-08-09.pdf",
];

const main = async () => {
  await mkdir(OUT, { recursive: true });
  const { pathToFileURL } = await import("node:url");
  const pdfjs = await import(
    pathToFileURL(require.resolve("pdfjs-dist/legacy/build/pdf.mjs")).href
  );
  const report = {};
  for (const rel of FILES) {
    const buf = await readFile(path.resolve(rel));
    const doc = await pdfjs.getDocument({ data: new Uint8Array(buf), useSystemFonts: true }).promise;
    const pages = [];
    for (let i = 1; i <= doc.numPages; i++) {
      const p = await doc.getPage(i);
      const c = await p.getTextContent();
      pages.push(c.items.map((it) => it.str).join(" ").replace(/\s+/g, " ").trim());
    }
    const all = pages.join("\n");
    report[rel] = {
      pages: doc.numPages,
      mentionsSectionsLeftBlank: /left blank|not (yet )?(filled|answered|written)|without notes|nothing (was )?written|no notes/i.test(all),
      hasContentsPage: /contents|table of contents/i.test(all),
      hasLastUpdated: /last updated/i.test(all),
      hasNotLegallyBinding: /not a legal document|not legally binding/i.test(all),
      firstPage: pages[0]?.slice(0, 700),
      allText: all.slice(0, 4000),
    };
    console.log(
      `  ${path.basename(rel)}: ${doc.numPages} pages, ` +
        `saysBlank=${report[rel].mentionsSectionsLeftBlank}, contents=${report[rel].hasContentsPage}`
    );
  }
  await writeFile(path.join(OUT, "pdf-text.json"), JSON.stringify(report, null, 2));
  console.log("  -> audit/evidence/a2/pdf-text.json");
};
main().catch((e) => { console.error(e); process.exit(1); });
