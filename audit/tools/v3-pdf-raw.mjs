// V3 adversarial verifier — raw object-level inspection (inflates ObjStm + content streams).
// READ-ONLY.
import fs from "node:fs";
import path from "node:path";
import zlib from "node:zlib";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(here, "..", "..");

const target = process.argv[2];
const mode = process.argv[3] || "summary";

const bytes = fs.readFileSync(target);
const raw = bytes.toString("latin1");

// Enumerate "N 0 obj ... endobj" spans
const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
const objs = [];
let m;
while ((m = objRe.exec(raw)) !== null) {
  objs.push({ num: +m[1], gen: +m[2], start: m.index, headEnd: objRe.lastIndex });
}
for (let i = 0; i < objs.length; i++) {
  const nextStart = i + 1 < objs.length ? objs[i + 1].start : raw.length;
  const endIdx = raw.indexOf("endobj", objs[i].headEnd);
  objs[i].end = endIdx !== -1 && endIdx < nextStart ? endIdx : nextStart;
  objs[i].body = raw.slice(objs[i].headEnd, objs[i].end);
}

function streamOf(o) {
  const si = o.body.indexOf("stream");
  if (si === -1) return null;
  let s = o.headEnd + si + 6;
  if (raw[s] === "\r") s++;
  if (raw[s] === "\n") s++;
  const dict = o.body.slice(0, si);
  const lenM = /\/Length\s+(\d+)/.exec(dict);
  let len = lenM ? +lenM[1] : null;
  if (len === null) {
    const e = raw.indexOf("endstream", s);
    len = e - s;
  }
  return { dict, buf: bytes.subarray(s, s + len) };
}

function inflate(buf) {
  try { return zlib.inflateSync(buf); } catch { try { return zlib.inflateRawSync(buf); } catch { return null; } }
}

const report = { file: path.basename(target), objects: objs.length };

// --- ObjStm expansion: gather all dictionary text including compressed objects
let expanded = raw;
for (const o of objs) {
  if (!/\/Type\s*\/ObjStm/.test(o.body)) continue;
  const st = streamOf(o);
  if (!st) continue;
  const inf = inflate(st.buf);
  if (inf) expanded += "\n%%OBJSTM " + o.num + "\n" + inf.toString("latin1");
}
report.objStmCount = (raw.match(/\/Type\s*\/ObjStm/g) || []).length;

report.flags = {
  StructTreeRoot: /\/StructTreeRoot/.test(expanded),
  MarkInfo: /\/MarkInfo/.test(expanded),
  Metadata: /\/Metadata/.test(expanded),
  Lang: /\/Lang\s*[\(<]/.test(expanded),
  Outlines: /\/Outlines/.test(expanded),
  ViewerPreferences: /\/ViewerPreferences/.test(expanded),
  DisplayDocTitle: /\/DisplayDocTitle/.test(expanded),
};
const catM = /\/Type\s*\/Catalog[^]{0,400}?>>/.exec(expanded);
report.catalog = catM ? catM[0].replace(/\s+/g, " ").slice(0, 400) : null;

// --- Images
const images = [];
for (const o of objs) {
  if (!/\/Subtype\s*\/Image/.test(o.body)) continue;
  const st = streamOf(o);
  const w = /\/Width\s+(\d+)/.exec(o.body)?.[1];
  const h = /\/Height\s+(\d+)/.exec(o.body)?.[1];
  const len = /\/Length\s+(\d+)/.exec(o.body)?.[1];
  const isMask = /\/ColorSpace\s*\/DeviceGray/.test(o.body) || /\/Subtype\s*\/Image[^]*\/Decode/.test(o.body);
  images.push({ obj: o.num, w: +w, h: +h, len: +len, gray: /DeviceGray/.test(o.body) });
}
report.images = images;
report.imageBytes = images.reduce((a, b) => a + (b.len || 0), 0);
report.fileBytes = bytes.length;
report.imageSharePct = +((report.imageBytes / bytes.length) * 100).toFixed(1);

// --- Fonts
const fonts = [];
for (const o of objs) {
  const bm = /\/BaseFont\s*\/([A-Za-z0-9+\-,]+)/.exec(o.body);
  if (bm) fonts.push({ obj: o.num, base: bm[1], hasFontFile: /\/FontFile/.test(o.body), type: (/\/Subtype\s*\/(\w+)/.exec(o.body) || [])[1] });
}
report.fonts = fonts;
report.fontFileObjs = objs.filter((o) => /\/FontFile2|\/FontFile3|\/FontFile\b/.test(o.body)).map((o) => o.num);
let fontFileBytes = 0;
for (const o of objs) {
  if (!/\/Length1|\/FontFile/.test(o.body)) continue;
}
// FontFile streams are separate objects referenced by /FontFile2 N 0 R
const ffRefs = [...expanded.matchAll(/\/FontFile2\s+(\d+)\s+0\s+R/g)].map((x) => +x[1]);
for (const n of new Set(ffRefs)) {
  const o = objs.find((x) => x.num === n);
  if (o) { const st = streamOf(o); if (st) fontFileBytes += st.buf.length; }
}
report.fontFileBytes = fontFileBytes;

// --- Page content streams: find footer translations + Tf sets
if (mode === "pages" || mode === "all") {
  const pageObjs = objs.filter((o) => /\/Type\s*\/Page\b/.test(o.body));
  const pageInfo = [];
  for (const po of pageObjs) {
    const cRef = /\/Contents\s+(\d+)\s+0\s+R/.exec(po.body)?.[1];
    const fontMap = /\/Font\s*<<([^>]*)>>/.exec(po.body)?.[1]?.replace(/\s+/g, " ").trim();
    let translations = [], tfs = [];
    if (cRef) {
      const co = objs.find((x) => x.num === +cRef);
      if (co) {
        const st = streamOf(co);
        const inf = st ? inflate(st.buf) : null;
        if (inf) {
          const txt = inf.toString("latin1");
          translations = [...txt.matchAll(/1 0 0 1 (-?[\d.]+) (-?[\d.]+) cm/g)].map((x) => ({ x: +x[1], y: +x[2] }));
          tfs = [...new Set([...txt.matchAll(/\/(F\d+)\s+([\d.]+)\s+Tf/g)].map((x) => x[1]))];
        }
      }
    }
    const offPage = translations.filter((t) => t.y < -100 || t.y > 900);
    pageInfo.push({ obj: po.num, contents: cRef ? +cRef : null, fontMap, tfs, offPageTranslations: offPage.slice(0, 4), offPageCount: offPage.length });
  }
  report.pages = pageInfo;
  report.pagesWithOffPageGroups = pageInfo.filter((p) => p.offPageCount > 0).length;
  report.pageCount = pageInfo.length;
}

console.log(JSON.stringify(report, null, 2));
