/**
 * A5 — terminology consistency audit.
 *
 * Inconsistent naming of the same concept is a cognitive-accessibility barrier,
 * not a style preference: a reader who is exhausted, distracted, or has a
 * reading or memory disability has to re-resolve "letter" / "document" /
 * "guide" as the same object every time the name changes.
 *
 * This counts COPY only. Source is reduced to string literals and JSX text
 * before matching, so identifiers, imports, CSS classes and type names cannot
 * inflate a term's count. Each hit records its file so a variant can be found.
 *
 * ANALYSIS ONLY. Reads the tree; changes nothing.
 *
 *   node audit/tools/terminology.mjs
 * Writes audit/evidence/terminology.json.
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join, relative } from "node:path";

const ROOT = "src";
const OUT = "audit/evidence";

const files = [];
(function walk(dir) {
  for (const entry of readdirSync(dir)) {
    const p = join(dir, entry);
    const st = statSync(p);
    if (st.isDirectory()) {
      if (!/node_modules|\.next|\.git/.test(p)) walk(p);
    } else if (/\.(tsx?|mdx?)$/.test(entry) && !/\.test\./.test(entry)) {
      files.push(p);
    }
  }
})(ROOT);

/**
 * Reduce a source file to the words a user could actually read.
 * String literals (labels, help, intros) plus JSX text nodes.
 */
function copyOf(src) {
  let out = "";
  // String and template literals of reasonable length.
  const lit = /"(?:[^"\\]|\\.)*"|'(?:[^'\\]|\\.)*'|`(?:[^`\\]|\\.)*`/g;
  for (const m of src.match(lit) ?? []) {
    const body = m.slice(1, -1);
    // Skip things that are plainly not prose: imports, classNames, css.
    if (body.length < 4) continue;
    if (/^[@./#]/.test(body)) continue;
    if (/^[a-z0-9-]+$/.test(body) && !/ /.test(body)) continue;
    if (/(?:^|\s)(?:flex|grid|mt-|mx-|px-|py-|text-|bg-|border-|rounded-|font-|leading-|tracking-|gap-|w-|h-|max-w|min-h|clamp\()/.test(body))
      continue;
    out += " " + body;
  }
  // JSX text nodes: >Some words here<
  for (const m of src.matchAll(/>\s*([A-Za-z][^<>{}\n]{5,})/g)) out += " " + m[1];
  return out;
}

const corpusByFile = new Map();
let corpus = "";
for (const f of files) {
  const c = copyOf(readFileSync(f, "utf8"));
  corpusByFile.set(relative(".", f).replace(/\\/g, "/"), c.toLowerCase());
  corpus += " " + c;
}
corpus = corpus.toLowerCase();

/** Concept -> the competing names the site actually uses for it. */
const CONCEPTS = {
  "The document itself": [
    ["Letter of Intent", /letter of intent/g],
    ["letter (bare)", /\bletters?\b(?! of intent)/g],
    ["document", /\bdocuments?\b/g],
    ["LOI", /\bloi\b/g],
    ["guide", /\bguide\b/g],
    ["companion", /\bcompanion\b/g],
    ["notes", /\bnotes\b/g],
    ["emergency sheet", /emergency (?:information )?sheet/g],
  ],
  "The person being written about": [
    ["loved one", /loved ones?/g],
    ["child", /\bchild(?:ren)?\b/g],
    ["them / they", /\bthey\b|\bthem\b/g],
    ["beneficiary", /\bbeneficiar(?:y|ies)\b/g],
    ["dependent", /\bdependents?\b/g],
    ["person you care for", /person you care for/g],
    ["person you love", /person you love/g],
    ["the person this letter is about", /person this letter is about/g],
    ["your person", /\byour person\b/g],
  ],
  "The future reader / who takes over": [
    ["caregiver", /\bcaregivers?\b/g],
    ["guardian", /\bguardians?\b/g],
    ["trustee", /\btrustees?\b/g],
    ["sibling", /\bsiblings?\b/g],
    ["helper", /\bhelpers?\b/g],
    ["sitter", /\bsitters?\b/g],
    ["whoever steps in", /whoever steps in/g],
    ["the next team", /the next team/g],
    ["successor", /\bsuccessors?\b/g],
    ["a new doctor", /\ba new (?:doctor|caregiver)\b/g],
  ],
  "Saving / persistence": [
    ["save(s/d)", /\bsaves?\b|\bsaved\b|\bsaving\b/g],
    ["store(s/d) / storage", /\bstores?\b|\bstored\b|\bstorage\b/g],
    ["keep(s)", /\bkeeps?\b/g],
    ["stays / remains", /\bstays\b|\bremains\b/g],
    ["written to", /written to/g],
    ["lives / live", /\blives\b|\blive\b/g],
  ],
  "Backup / moving it": [
    ["backup file", /backup file/g],
    ["backup (bare)", /\bbackups?\b(?! file)/g],
    ["back up (verb)", /\bback (?:it |your |the )?up\b/g],
    ["export", /\bexports?\b|\bexported\b/g],
    ["download", /\bdownloads?\b|\bdownloaded\b/g],
    ["restore", /\brestores?\b|\brestored\b/g],
    ["load a backup", /load(?:ing)? a backup/g],
  ],
  "Deletion": [
    ["delete", /\bdeletes?\b|\bdeleted\b/g],
    ["erase", /\berases?\b|\berased\b/g],
    ["clear", /\bclears?\b|\bcleared\b|\bclearing\b/g],
    ["remove", /\bremoves?\b|\bremoved\b/g],
    ["gone", /\bgone\b/g],
    ["wipe", /\bwipes?\b|\bwiped\b/g],
  ],
  "Where the data is": [
    ["this device", /this device/g],
    ["your device", /your device/g],
    ["this browser", /this browser/g],
    ["your browser", /your browser/g],
    ["on this computer", /this computer/g],
    ["locally / local storage", /\blocally\b|local storage/g],
    ["client-side", /client-side/g],
    ["IndexedDB", /indexeddb/g],
  ],
  "The act of writing it": [
    ["write / writing", /\bwrites?\b|\bwriting\b|\bwritten\b/g],
    ["fill in / fill out", /\bfill (?:in|out)\b|\bfilled in\b/g],
    ["answer", /\banswers?\b|\banswered\b/g],
    ["record", /\brecords?\b|\brecorded\b/g],
    ["note down / write down", /\bwrite down\b|\bnote down\b|\bwritten down\b/g],
    ["create", /\bcreates?\b|\bcreated\b/g],
    ["build", /\bbuilds?\b|\bbuilder\b/g],
  ],
};

const report = {};
for (const [concept, variants] of Object.entries(CONCEPTS)) {
  const rows = [];
  for (const [label, re] of variants) {
    const hits = corpus.match(re) ?? [];
    if (!hits.length) continue;
    const where = [];
    for (const [f, text] of corpusByFile) {
      const n = (text.match(re) ?? []).length;
      if (n) where.push(`${f} (${n})`);
    }
    rows.push({
      variant: label,
      count: hits.length,
      files: where.length,
      topFiles: where.sort((a, b) => +b.match(/\((\d+)\)$/)[1] - +a.match(/\((\d+)\)$/)[1]).slice(0, 5),
    });
  }
  rows.sort((a, b) => b.count - a.count);
  report[concept] = {
    distinctVariantsInUse: rows.length,
    total: rows.reduce((a, r) => a + r.count, 0),
    variants: rows,
  };
}

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "terminology.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  filesScanned: files.length,
  note:
    "Counts are over extracted COPY only (string literals + JSX text), not " +
    "identifiers. A high variant count is not automatically a defect — register " +
    "shifts are sometimes deliberate — but every concept with 3+ competing names " +
    "in user-facing copy is listed so the deliberate ones can be separated from " +
    "the accidental.",
  concepts: report,
}, null, 2));

for (const [concept, r] of Object.entries(report)) {
  console.log(`\n=== ${concept}  (${r.distinctVariantsInUse} names, ${r.total} uses) ===`);
  for (const v of r.variants) {
    console.log(`  ${String(v.count).padStart(4)}  ${v.variant.padEnd(32)} in ${v.files} file(s)`);
  }
}
console.log(`\nscanned ${files.length} files -> audit/evidence/terminology.json`);
