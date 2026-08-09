/**
 * A5 — plain-language copy lint.
 *
 * Pattern checks that plainlanguage.gov calls out explicitly, plus register
 * checks specific to this audience. Every hit is a candidate, not a verdict:
 * the output is read by hand before anything is reported, because most of
 * these patterns have legitimate uses.
 *
 * ANALYSIS ONLY.
 *   node audit/tools/copy-lint.mjs  ->  audit/evidence/copy-lint.json
 */
import { readdirSync, statSync, readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const files = [];
(function walk(d) {
  for (const e of readdirSync(d)) {
    const p = join(d, e);
    if (statSync(p).isDirectory()) { if (!/node_modules|\.next/.test(p)) walk(p); }
    else if (/\.(tsx?)$/.test(e) && !/\.test\./.test(e)) files.push(p.replace(/\\/g, "/"));
  }
})("src");

/**
 * Each rule: why plainlanguage.gov or this audience cares.
 * `re` runs against extracted copy lines only.
 */
const RULES = [
  ["non-US register", /\b(fortnight|whilst|amongst|towards the|organise|realise|recognise|colour|centre|programme|holiday(?=\s+(?:period|season))|mum\b|nappy|pram|torch\b|lift\b(?!\s*(?:it|the))|flat\b(?=\s+(?:in|at|near)))\b/i,
    "US audience (a Virginia firm); a non-US word is a stumble and is inconsistent with the surrounding copy"],
  ["latin abbreviation", /\b(?:i\.e\.|viz\.|etc\.|et al\.|per se|inter alia)/i,
    "plainlanguage.gov: avoid Latin abbreviations; 'e.g.' is allowed here as a labelled example marker"],
  ["hidden verb (nominalization)", /\b(?:make (?:a )?(?:determination|decision|application)|provide (?:assistance|notification)|conduct (?:a )?review|give consideration|is applicable to|in the event that|prior to|subsequent to|utilize|utilise)\b/i,
    "plainlanguage.gov: use the verb, not the noun form"],
  ["legalese", /\b(?:heretofore|hereinafter|aforementioned|thereof|therein|pursuant to|notwithstanding|shall be deemed|said (?:document|letter|person))\b/i,
    "plainlanguage.gov: legalese excludes non-lawyers"],
  ["passive + blame", /\b(?:you (?:failed|forgot|did not|didn't) (?:to )?\w+|invalid|illegal|error occurred|incorrect entry|you must not)\b/i,
    "error messages must not blame the reader"],
  ["vague error", /\b(?:something went wrong|an error (?:has )?occurred|oops|unknown error|try again later|failed to)\b/i,
    "an error must say what happened and what to do next"],
  ["infantilising / pity register", /\b(?:suffers? from|afflicted|victim of|confined to a wheelchair|wheelchair[- ]bound|special little|angel|differently[- ]abled|handicapped|retard|crippled|invalid person|normal (?:kids?|children|people))\b/i,
    "disability-community register: person-first or identity-first, never pity framing"],
  ["inspiration framing", /\b(?:inspir(?:ing|ation)|brave little|so strong|hero(?:ic)? journey|overcome (?:their|his|her) disability)\b/i,
    "'inspiration porn' framing is widely rejected by disabled people"],
  ["presumptive family/faith/income", /\b(?:your (?:husband|wife|church|pastor|spouse's) |both parents|mom and dad (?:will|should)|when you retire|your savings will)\b/i,
    "presumes family structure, faith, or income the reader may not have"],
  ["undefined tech term", /\b(?:client[- ]side|localStorage|IndexedDB|JSON blob|serializ|cache|cookie(?!s? to)|API|endpoint|payload)\b/i,
    "must be explained or avoided for a reader who does not know what it means"],
  ["doubled sentence punctuation", /[.!?]\s+(?:of|and|or|but|the|a|an|in|to|for)\s+\w+[^.]{0,30}\.(?:\s|$)/,
    "reads as a string-concatenation break rather than a sentence"],
  ["second person shift", /\bone (?:should|must|may wish to)\b/i,
    "site voice is second person ('you'); 'one should' is a register break"],
];

/** Pull readable copy lines with their line numbers. */
function copyLines(src) {
  const out = [];
  const lines = src.split("\n");
  lines.forEach((line, i) => {
    // string literals
    for (const m of line.matchAll(/"((?:[^"\\]|\\.){6,})"|'((?:[^'\\]|\\.){6,})'/g)) {
      const t = m[1] ?? m[2];
      if (/^[@./#]/.test(t)) continue;
      if (/(?:^|\s)(?:flex|grid|mt-|mx-|px-|py-|text-\[|bg-|border-|rounded-|font-|leading-|tracking-|gap-|w-|h-|min-|max-)/.test(t)) continue;
      out.push({ line: i + 1, text: t });
    }
    // JSX text
    const jsx = line.match(/>\s*([A-Za-z][^<>{}]{8,})/);
    if (jsx) out.push({ line: i + 1, text: jsx[1].trim() });
    // bare prose continuation lines inside JSX
    const bare = line.trim();
    if (/^[A-Za-z][a-z]/.test(bare) && bare.length > 20 && !/[{}<>=]/.test(bare)) {
      out.push({ line: i + 1, text: bare });
    }
  });
  return out;
}

const hits = [];
for (const f of files) {
  const src = readFileSync(f, "utf8");
  for (const { line, text } of copyLines(src)) {
    for (const [rule, re, why] of RULES) {
      const m = text.match(re);
      if (m) hits.push({ rule, why, file: f, line, match: m[0], text: text.slice(0, 200) });
    }
  }
}

const byRule = {};
for (const h of hits) (byRule[h.rule] ??= []).push(h);

mkdirSync("audit/evidence", { recursive: true });
writeFileSync("audit/evidence/copy-lint.json", JSON.stringify({
  generatedAt: new Date().toISOString(),
  note:
    "CANDIDATES, not findings. Every rule here has legitimate uses (a privacy " +
    "page must say 'cookie'; 'e.g.' is a deliberate example marker). Each hit " +
    "was read in context before anything was reported.",
  totalHits: hits.length,
  byRule,
}, null, 2));

for (const [rule, list] of Object.entries(byRule)) {
  console.log(`\n=== ${rule}  (${list.length}) ===`);
  console.log(`    why: ${list[0].why}`);
  const seen = new Set();
  for (const h of list) {
    const k = h.file + h.line + h.match;
    if (seen.has(k)) continue;
    seen.add(k);
    console.log(`  ${h.file}:${h.line}  [${h.match}]`);
    console.log(`      ${h.text.slice(0, 150)}`);
  }
}
console.log(`\n${hits.length} candidates -> audit/evidence/copy-lint.json`);
