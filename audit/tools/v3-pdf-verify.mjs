// V3 adversarial verifier — independent re-measurement of the PDFs.
// READ-ONLY. Writes nothing except stdout.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

const { getDocument } = await import(
  "pdfjs-dist/legacy/build/pdf.mjs"
);

const files = [];
const auditDir = path.join(root, "audit", "evidence", "pdfs");
for (const f of fs.readdirSync(auditDir)) {
  if (f.endsWith(".pdf")) files.push({ label: "audit/" + f, p: path.join(auditDir, f) });
}
const sampleDir = path.join(root, "public", "samples");
if (fs.existsSync(sampleDir)) {
  for (const f of fs.readdirSync(sampleDir)) {
    if (f.endsWith(".pdf")) files.push({ label: "sample/" + f, p: path.join(sampleDir, f) });
  }
}

const out = [];
for (const { label, p } of files) {
  const bytes = new Uint8Array(fs.readFileSync(p));
  const size = bytes.length;
  const doc = await getDocument({ data: bytes, useSystemFonts: false }).promise;
  const rec = { label, bytes: size, pages: doc.numPages, geometry: [], flags: {} };

  let allText = "";
  const perPageItemCounts = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const pg = await doc.getPage(i);
    const vp = pg.getViewport({ scale: 1 });
    rec.geometry.push({ page: i, w: +vp.width.toFixed(2), h: +vp.height.toFixed(2) });
    const tc = await pg.getTextContent();
    perPageItemCounts.push(tc.items.length);
    allText += "\n<<<PAGE " + i + ">>>\n" + tc.items.map((it) => it.str).join("|");
  }
  rec.perPageItemCounts = perPageItemCounts;
  rec.pagesWithOneItem = perPageItemCounts
    .map((c, idx) => (c <= 1 ? idx + 1 : null))
    .filter(Boolean);

  // text probes
  rec.probes = {
    "Page ": (allText.match(/Page /g) || []).length,
    "SECTION": (allText.match(/SECTION/g) || []).length,
    "S E CT": (allText.match(/S E ?CT/g) || []).length,
    "CONTENTS_spaced": (allText.match(/C O N T E N T S/g) || []).length,
    "DIAGNOSES_spaced": (allText.match(/D I ?AG ?N O S E S/g) || []).length,
    "not a legal document": (allText.match(/not a legal document/g) || []).length,
  };

  const md = await doc.getMetadata();
  rec.info = {
    Title: md.info?.Title ?? null,
    Author: md.info?.Author ?? null,
    CreationDate: md.info?.CreationDate ?? null,
    Producer: md.info?.Producer ?? null,
    Language: md.info?.Language ?? null,
  };
  rec.hasXMP = !!md.metadata;
  rec.outline = await doc.getOutline();

  // raw catalog probes
  const raw = Buffer.from(bytes).toString("latin1");
  rec.flags = {
    StructTreeRoot: raw.includes("/StructTreeRoot"),
    MarkInfo: raw.includes("/MarkInfo"),
    Metadata: raw.includes("/Metadata"),
    Lang: /\/Lang\s*\(/.test(raw),
    Outlines: raw.includes("/Outlines"),
    ViewerPreferences: raw.includes("/ViewerPreferences"),
    DisplayDocTitle: raw.includes("/DisplayDocTitle"),
  };

  // image objects
  const imgs = [];
  const re = /\/Subtype\s*\/Image[^>]*?\/Length\s+(\d+)/g;
  let m;
  const imgRe = /<<([^<>]|<<[^>]*>>)*?\/Subtype\s*\/Image([^<>]|<<[^>]*>>)*?>>/g;
  // simpler: scan for "/Subtype /Image" then grab surrounding dict text
  let idx = 0;
  while ((idx = raw.indexOf("/Subtype /Image", idx)) !== -1) {
    const start = raw.lastIndexOf("<<", idx);
    const end = raw.indexOf("stream", idx);
    const dict = raw.slice(start, end);
    const w = /\/Width\s+(\d+)/.exec(dict)?.[1];
    const h = /\/Height\s+(\d+)/.exec(dict)?.[1];
    const len = /\/Length\s+(\d+)/.exec(dict)?.[1];
    imgs.push({ w: +w, h: +h, len: +len });
    idx += 15;
  }
  rec.images = imgs;
  rec.imageBytes = imgs.reduce((a, b) => a + (b.len || 0), 0);
  rec.imageShare = +((rec.imageBytes / size) * 100).toFixed(1);

  // fonts
  const fonts = [...raw.matchAll(/\/BaseFont\s*\/([A-Za-z0-9+\-]+)/g)].map((x) => x[1]);
  rec.fonts = [...new Set(fonts)];
  rec.fontFile2Count = (raw.match(/\/FontFile2/g) || []).length;

  out.push(rec);
}

console.log(JSON.stringify(out, null, 2));
