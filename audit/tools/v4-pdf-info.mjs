/** V4: independently decode the /Info dictionary of every audit PDF (A7-009). */
import { readdirSync, readFileSync } from "node:fs";

const dir = "audit/evidence/pdfs";

function decodePdfString(raw) {
  // raw is the bytes between ( and ) in a literal string, already unescaped-ish
  if (raw.startsWith("\\376\\377") || raw.startsWith("þÿ")) return null;
  return raw;
}

function parseLiteral(buf, start) {
  // start points at '('
  let depth = 0;
  let i = start;
  const out = [];
  for (; i < buf.length; i++) {
    const c = buf[i];
    if (c === 0x5c) {
      // backslash escape
      const n = buf[i + 1];
      if (n >= 0x30 && n <= 0x37) {
        // octal, up to 3 digits
        let oct = "";
        let j = i + 1;
        while (j < buf.length && oct.length < 3 && buf[j] >= 0x30 && buf[j] <= 0x37) {
          oct += String.fromCharCode(buf[j]);
          j++;
        }
        out.push(parseInt(oct, 8));
        i = j - 1;
      } else {
        const map = { 110: 10, 114: 13, 116: 9, 98: 8, 102: 12 };
        out.push(map[n] !== undefined ? map[n] : n);
        i++;
      }
      continue;
    }
    if (c === 0x28) {
      depth++;
      if (depth === 1) continue;
    }
    if (c === 0x29) {
      depth--;
      if (depth === 0) break;
    }
    out.push(c);
  }
  const bytes = Buffer.from(out);
  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    return { text: bytes.slice(2).swap16().toString("utf16le"), enc: "UTF-16BE" };
  }
  return { text: bytes.toString("latin1"), enc: "PDFDoc" };
}

for (const f of readdirSync(dir)) {
  if (!f.endsWith(".pdf")) continue;
  const buf = readFileSync(dir + "/" + f);
  const s = buf.toString("latin1");
  console.log("=== " + f);
  for (const key of ["Title", "Author", "Producer", "Creator", "CreationDate", "ModDate", "Subject", "Keywords"]) {
    const re = new RegExp("/" + key + "\\s*\\(", "g");
    let m;
    while ((m = re.exec(s)) !== null) {
      const v = parseLiteral(buf, m.index + m[0].length - 1);
      console.log("   /" + key + " [" + v.enc + "] = " + JSON.stringify(v.text));
      break;
    }
  }
  const catalog = s.match(/\/Type\s*\/Catalog[^>]*>>/);
  console.log("   catalog: " + (catalog ? catalog[0].replace(/\s+/g, " ") : "not found"));
  for (const tok of ["/Encrypt", "/JavaScript", "/EmbeddedFile", "/Launch", "/OpenAction", "/MarkInfo", "/StructTreeRoot", "/Lang", "<?xpacket", "/Metadata"]) {
    if (s.includes(tok)) console.log("   PRESENT: " + tok);
  }
}
