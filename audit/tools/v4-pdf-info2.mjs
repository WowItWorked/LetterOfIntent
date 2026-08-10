import { readdirSync, readFileSync } from "node:fs";
const dir = "audit/evidence/pdfs";

function hexToText(hex) {
  const clean = hex.replace(/\s+/g, "");
  const bytes = Buffer.from(clean, "hex");
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: Buffer.from(bytes.slice(2)).swap16().toString("utf16le"), enc: "UTF-16BE hex" };
  }
  return { text: bytes.toString("latin1"), enc: "hex" };
}

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".pdf")) continue;
  const s = readFileSync(dir + "/" + f).toString("latin1");
  console.log("=== " + f);
  const infoRef = s.match(/\/Info\s+(\d+)\s+(\d+)\s+R/);
  console.log("   trailer /Info ref: " + (infoRef ? infoRef[0] : "NONE"));
  if (infoRef) {
    const objRe = new RegExp("(?:^|[^0-9])" + infoRef[1] + "\\s+" + infoRef[2] + "\\s+obj([\\s\\S]{0,1600}?)endobj");
    const m = s.match(objRe);
    if (m) {
      const body = m[1];
      console.log("   raw Info obj: " + body.replace(/\s+/g, " ").slice(0, 900));
      for (const key of ["Title", "Author", "Producer", "Creator", "CreationDate", "ModDate"]) {
        const hm = body.match(new RegExp("/" + key + "\\s*<([0-9A-Fa-f\\s]+)>"));
        if (hm) {
          const v = hexToText(hm[1]);
          console.log("   /" + key + " [" + v.enc + "] = " + JSON.stringify(v.text));
        }
      }
    } else {
      console.log("   Info object not found uncompressed (likely in an object stream)");
    }
  }
}
