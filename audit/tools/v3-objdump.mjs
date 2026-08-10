// V3 — dump specific PDF object bodies (dictionaries only, truncated). READ-ONLY.
import fs from "node:fs";
const target = process.argv[2];
const wanted = process.argv.slice(3).map(Number);
const bytes = fs.readFileSync(target);
const raw = bytes.toString("latin1");
const objRe = /(\d+)\s+(\d+)\s+obj\b/g;
const objs = [];
let m;
while ((m = objRe.exec(raw)) !== null) objs.push({ num: +m[1], start: m.index, headEnd: objRe.lastIndex });
for (let i = 0; i < objs.length; i++) {
  const nextStart = i + 1 < objs.length ? objs[i + 1].start : raw.length;
  const e = raw.indexOf("endobj", objs[i].headEnd);
  objs[i].end = e !== -1 && e < nextStart ? e : nextStart;
  objs[i].body = raw.slice(objs[i].headEnd, objs[i].end);
}
if (wanted.length === 0) {
  for (const o of objs) {
    const si = o.body.indexOf("stream");
    const head = (si === -1 ? o.body : o.body.slice(0, si)).replace(/\s+/g, " ").trim();
    console.log(`--- obj ${o.num} (${o.end - o.start} raw bytes) ---`);
    console.log(head.slice(0, 500));
  }
} else {
  for (const n of wanted) {
    const o = objs.find((x) => x.num === n);
    if (!o) { console.log(`--- obj ${n}: NOT FOUND ---`); continue; }
    const si = o.body.indexOf("stream");
    const head = (si === -1 ? o.body : o.body.slice(0, si)).replace(/\s+/g, " ").trim();
    console.log(`--- obj ${n} ---`);
    console.log(head.slice(0, 1200));
  }
}
