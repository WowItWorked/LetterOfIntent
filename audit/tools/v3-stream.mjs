// V3 — inflate a page content stream and print it (or a window around a pattern). READ-ONLY.
import fs from "node:fs";
import zlib from "node:zlib";
const target = process.argv[2];
const objNum = Number(process.argv[3]);
const pattern = process.argv[4] || null;
const win = Number(process.argv[5] || 400);

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
const o = objs.find((x) => x.num === objNum);
if (!o) { console.error("no obj"); process.exit(1); }
const si = o.body.indexOf("stream");
let s = o.headEnd + si + 6;
if (raw[s] === "\r") s++;
if (raw[s] === "\n") s++;
const len = +(/\/Length\s+(\d+)/.exec(o.body.slice(0, si))?.[1] ?? 0);
let buf = bytes.subarray(s, s + len);
let inf;
try { inf = zlib.inflateSync(buf); } catch { inf = buf; }
const txt = inf.toString("latin1");
if (!pattern) { console.log(txt.slice(0, 6000)); process.exit(0); }
const re = new RegExp(pattern, "g");
let k = 0, hit;
while ((hit = re.exec(txt)) !== null && k < 12) {
  console.log(`=== hit ${++k} @${hit.index} ===`);
  console.log(txt.slice(Math.max(0, hit.index - win), hit.index + win));
  console.log("");
}
if (k === 0) console.log("NO MATCH for " + pattern);
