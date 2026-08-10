import { readdirSync, readFileSync } from "node:fs";
const dir = "audit/evidence/pdfs";

function decodeStr(raw) {
  raw = raw.trim();
  if (raw.startsWith("<")) {
    const bytes = Buffer.from(raw.slice(1, -1).replace(/\s+/g, ""), "hex");
    if (bytes[0] === 0xfe && bytes[1] === 0xff)
      return { enc: "UTF-16BE", text: Buffer.from(bytes.slice(2)).swap16().toString("utf16le") };
    return { enc: "hex/PDFDoc", text: bytes.toString("latin1") };
  }
  // literal (...)
  const inner = raw.slice(1, -1);
  const out = [];
  for (let i = 0; i < inner.length; i++) {
    if (inner[i] === "\\") {
      const rest = inner.slice(i + 1);
      const oct = rest.match(/^[0-7]{1,3}/);
      if (oct) { out.push(parseInt(oct[0], 8)); i += oct[0].length; continue; }
      const map = { n: 10, r: 13, t: 9, b: 8, f: 12 };
      out.push(map[rest[0]] !== undefined ? map[rest[0]] : rest.charCodeAt(0));
      i += 1;
      continue;
    }
    out.push(inner.charCodeAt(i));
  }
  const bytes = Buffer.from(out);
  if (bytes[0] === 0xfe && bytes[1] === 0xff)
    return { enc: "UTF-16BE", text: Buffer.from(bytes.slice(2)).swap16().toString("utf16le") };
  return { enc: "PDFDoc", text: bytes.toString("latin1") };
}

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".pdf")) continue;
  const s = readFileSync(dir + "/" + f).toString("latin1");
  const infoRef = s.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  const objRe = new RegExp("(?:^|[^0-9])" + infoRef[1] + "\\s+" + infoRef[2] + "\\s+obj([\\s\\S]{0,600}?)endobj");
  const body = s.match(objRe)[1];
  console.log("=== " + f);
  for (const m of body.matchAll(/\/(\w+)\s+(\d+)\s+(\d+)\s+R/g)) {
    const [, key, num, gen] = m;
    const vRe = new RegExp("(?:^|[^0-9])" + num + "\\s+" + gen + "\\s+obj([\\s\\S]{0,3000}?)endobj");
    const vm = s.match(vRe);
    if (!vm) { console.log("   /" + key + " -> UNRESOLVED"); continue; }
    const v = decodeStr(vm[1]);
    console.log("   /" + key + " [" + v.enc + "] = " + JSON.stringify(v.text));
  }
}
