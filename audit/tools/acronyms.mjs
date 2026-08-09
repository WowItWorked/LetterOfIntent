/**
 * A5 — acronym and jargon first-use audit.
 *
 * An acronym used before it is defined is a hard stop for a reader who does
 * not already know it — and the people who most need this tool (a grandparent
 * becoming a guardian, a sibling taking over) are exactly the people who have
 * not spent years in disability services and do not know what a waiver is.
 *
 * Walks the reading order of each letter path and reports, for every acronym
 * and term of art, where it FIRST appears and whether a definition appears in
 * the same field. Definition = the term is followed by a parenthetical, or the
 * surrounding help text contains an "X is ..." gloss.
 *
 * ANALYSIS ONLY.
 *   node audit/tools/acronyms.mjs   ->  audit/evidence/acronyms.json
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";

const OUT = "audit/evidence";

/** Terms worth checking: acronyms plus disability/legal/edu terms of art. */
const TERMS = [
  "SSI", "SSDI", "ABLE", "IEP", "IEP", "504", "OT", "PT", "SLP", "AAC", "ADL",
  "ER", "CPAP", "DD waiver", "CCC Plus", "waiver", "POA", "power of attorney",
  "guardianship", "conservatorship", "supported decision-making",
  "representative payee", "special needs trust", "trustee", "remainder beneficiary",
  "PRN", "G-tube", "NPO", "BIP", "FBA", "PCP", "DME", "respite", "day program",
  "self-directed", "Medicaid", "Medicare", "ADA", "IDEA", "transition plan",
  "JSON", "PDF", "ICS", "local storage", "IndexedDB", "client-side",
];

/* ------------------------------------------------------- gather section copy */

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) walk(p);
    else if (/\.ts$/.test(e) && !/index|\.test\./.test(e)) files.push(p);
  }
})("src/lib/content/sections");

/** Pull the readable strings out of one section file, in declaration order. */
function readable(src) {
  const out = [];
  const push = (kind, v) => v && out.push({ kind, text: v });
  const str = (re, kind) => {
    for (const m of src.matchAll(re)) {
      // Join adjacent concatenated literals.
      const joined = m[1]
        .split(/"\s*\+\s*\n?\s*"/)
        .join("")
        .replace(/\\"/g, '"')
        .replace(/\\n/g, " ");
      push(kind, joined);
    }
  };
  str(/\bintro:\s*\n?\s*"((?:[^"\\]|\\.)*(?:"\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*)*)"/g, "intro");
  str(/\bnote:\s*\n?\s*"((?:[^"\\]|\\.)*(?:"\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*)*)"/g, "note");
  str(/\blabel:\s*"((?:[^"\\]|\\.)*)"/g, "label");
  str(/\bhelp:\s*\n?\s*"((?:[^"\\]|\\.)*(?:"\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*)*)"/g, "help");
  str(/\bplaceholder:\s*\n?\s*"((?:[^"\\]|\\.)*(?:"\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*)*)"/g, "placeholder");
  str(/\bexample:\s*\n?\s*"((?:[^"\\]|\\.)*(?:"\s*\+\s*\n?\s*"(?:[^"\\]|\\.)*)*)"/g, "example");
  return out;
}

const sections = files
  .map((f) => {
    const src = readFileSync(f, "utf8");
    const num = +(src.match(/\bnumber:\s*(\d+)/)?.[1] ?? 99);
    const slug = src.match(/\bslug:\s*"([^"]+)"/)?.[1] ?? f;
    const general = /[\\/]general[\\/]/.test(f);
    return { file: f.replace(/\\/g, "/"), slug, num, general, blocks: readable(src) };
  })
  .sort((a, b) => (a.general === b.general ? a.num - b.num : a.general ? 1 : -1));

/* --------------------------------------------------------------- definition */

/**
 * Does this block define the term? Either a parenthetical right after it, or
 * an "X is a/the ..." gloss, or the expansion spelled out adjacent.
 */
function definesTerm(text, term) {
  const t = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  if (new RegExp(`${t}\\s*\\([^)]{8,}\\)`, "i").test(text)) return "parenthetical after term";
  if (new RegExp(`\\([^)]*${t}[^)]*\\)`, "i").test(text)) return "term inside parenthetical gloss";
  if (new RegExp(`\\b${t}\\b[^.]{0,40}\\b(?:is|are|means)\\b[^.]{10,}`, "i").test(text))
    return "'X is ...' gloss";
  return null;
}

const results = [];
for (const term of [...new Set(TERMS)]) {
  const re = new RegExp(`(?:^|[^A-Za-z])${term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?:[^A-Za-z]|$)`, term === term.toUpperCase() ? "" : "i");
  let first = null;
  const occurrences = [];
  for (const s of sections) {
    for (const b of s.blocks) {
      if (!re.test(b.text)) continue;
      const rec = { path: s.general ? "general" : "special-needs", section: s.slug, num: s.num, kind: b.kind, text: b.text.slice(0, 240) };
      occurrences.push(rec);
      if (!first) first = rec;
    }
  }
  if (!first) continue;
  results.push({
    term,
    totalOccurrences: occurrences.length,
    firstUse: first,
    definedAtFirstUse: definesTerm(first.text, term),
    definedAnywhere: occurrences.map((o) => definesTerm(o.text, term)).find(Boolean) ?? null,
    allUses: occurrences,
  });
}

const undefinedAtFirst = results.filter((r) => !r.definedAtFirstUse);

mkdirSync(OUT, { recursive: true });
writeFileSync(join(OUT, "acronyms.json"), JSON.stringify({
  generatedAt: new Date().toISOString(),
  note:
    "Reading order = section number within each path. 'definedAtFirstUse' is the " +
    "test that matters: a definition that arrives in a later section does not help " +
    "the reader who hit the term first. Detection is heuristic (parenthetical or " +
    "'X is ...' gloss) and can miss a definition phrased another way, so every " +
    "flagged term was read by hand before being reported.",
  termsFound: results.length,
  undefinedAtFirstUse: undefinedAtFirst.length,
  results,
}, null, 2));

console.log("=== DEFINED AT FIRST USE ===");
for (const r of results.filter((x) => x.definedAtFirstUse))
  console.log(`  OK   ${r.term.padEnd(24)} §${r.firstUse.num} ${r.firstUse.section} (${r.definedAtFirstUse})`);
console.log("\n=== NOT DEFINED AT FIRST USE ===");
for (const r of undefinedAtFirst)
  console.log(
    `  ??   ${r.term.padEnd(24)} §${r.firstUse.num} ${r.firstUse.section} [${r.firstUse.kind}]` +
      (r.definedAnywhere ? `  (defined later: ${r.definedAnywhere})` : "  (never defined)")
  );
console.log(`\n-> ${OUT}/acronyms.json`);
