/**
 * Collapse nine analyses and five verification passes into one machine-readable
 * index, so synthesis reasons over a table rather than 750KB of prose.
 *
 * Priority tiers are computed here, from the brief's own rules, rather than
 * assigned by judgement — so the same inputs always produce the same tiers and
 * nobody has to trust that a tier was applied consistently across 157 items.
 *
 *   node audit/tools/build-index.mjs
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";

const RAW = path.resolve("audit/raw");
const AUDIT = path.resolve("audit");

/** Minimal YAML-ish reader for the flat finding blocks the schema defines. */
function parseFindings(md, sourceFile) {
  const out = [];
  // Each finding starts at a line like "- id: A4-007"
  const chunks = md.split(/\n(?=\s*-\s+id:\s*A\d+-\d+)/);
  for (const chunk of chunks) {
    const idM = chunk.match(/^\s*-\s+id:\s*(A\d+-\d+)/m);
    if (!idM) continue;
    const get = (key) => {
      const m = chunk.match(new RegExp(`^\\s{2,}${key}:\\s*(.*)$`, "m"));
      if (!m) return null;
      let v = m[1].trim();
      v = v.replace(/^["'|>]\s*/, "").replace(/["']$/, "");
      return v || null;
    };
    const num = (key) => {
      const v = get(key);
      if (!v) return null;
      const m = String(v).match(/-?\d+/);
      return m ? parseInt(m[0], 10) : null;
    };
    out.push({
      id: idM[1],
      analysis: idM[1].split("-")[0],
      sourceFile,
      title: get("title"),
      category: get("category"),
      confidence: (get("confidence") || "").toUpperCase().replace(/[^A-Z_]/g, "") || null,
      scope: (get("scope") || "").toLowerCase().includes("arch") ? "architectural" : "current",
      effort: (get("effort") || "").trim().split(/\s|\|/)[0] || null,
      mission_impact: num("mission_impact"),
      reach: num("reach"),
      harm_if_unfixed: num("harm_if_unfixed"),
      environment: get("environment"),
      standard_reference: get("standard_reference"),
      risk_of_change: get("risk_of_change"),
      privacy_impact_present: /privacy_impact:\s*(?!none)\S/i.test(chunk),
    });
  }
  return out;
}

/** Verdicts live as "### A4-007 — CONFIRMED" headings in the verification files. */
function parseVerdicts(md, sourceFile) {
  const out = {};
  const re = /^#{2,4}\s*(A\d+-\d+)\s*[—–\-:]+\s*(CONFIRMED|PLAUSIBLE|REFUTED|NOT[_ ]VERIFIABLE)/gim;
  let m;
  while ((m = re.exec(md))) {
    const id = m[1];
    const verdict = m[2].toUpperCase().replace(/\s/g, "_");
    /*
     * Body = from the END OF THIS HEADING LINE to the start of the next
     * heading. Slicing from `start + 1` instead looks right and is not: that
     * lands mid-heading, and `^` under the /m flag also matches at string
     * position 0, so the "next heading" is found immediately and every body
     * comes back one character long.
     */
    const start = m.index;
    const lineEnd = md.indexOf("\n", start);
    const from = lineEnd === -1 ? md.length : lineEnd + 1;
    const nextRel = md.slice(from).search(/^#{2,4}\s*A\d+-\d+/m);
    const body = nextRel === -1 ? md.slice(from) : md.slice(from, from + nextRel);
    /**
     * Verifiers wrote these as markdown — `**already_fixed:** **true** — ...`
     * — so the value is wrapped in emphasis. Strip all markdown first, then
     * read the leading word, rather than trying to anticipate every way an
     * asterisk can be arranged around it.
     */
    const flag = (name) => {
      const m = body.match(new RegExp(`${name}:\\s*([^\\n]*)`, "i"));
      if (!m) return { value: false, raw: null };
      const raw = m[1].replace(/[*_\`]/g, "").trim();
      const lead = raw.toLowerCase().split(/[\s—–-]/)[0];
      return { value: /^(true|yes|partial|partially)$/.test(lead), raw: raw.slice(0, 160) || null };
    };
    const af = flag("already_fixed");
    const wsev = flag("wrong_severity");
    const wstd = flag("wrong_standard");
    out[id] = {
      verdict,
      already_fixed: af.value,
      already_fixed_note: af.value ? af.raw : null,
      wrong_severity: wsev.value,
      wrong_severity_note: wsev.value ? wsev.raw : null,
      wrong_standard: wstd.value,
      wrong_standard_note: wstd.value ? wstd.raw : null,
      verifiedBy: sourceFile,
    };
  }
  return out;
}

/**
 * The brief's tiering rules, applied mechanically.
 *
 * P0 is deliberately keyword-driven rather than score-driven: the brief defines
 * it by KIND of harm (someone excluded, data leaves the device, promise
 * inaccurate, legal requirement unmet, work silently lost), not by arithmetic,
 * and a 4/4/4 finding is not automatically an emergency.
 */
const P0_PATTERNS = [
  /silently lost|work is lost|loses? (their )?work|data loss/i,
  /excluded|cannot complete|unusable|blocks? completion|no path forward/i,
  /leaves the device|exfiltrat|sent to (a )?third part/i,
  /promise (is )?(inaccurate|false|overclaim)|overclaims?/i,
  /level a\b|section 508|legally required|legal floor/i,
];

function tierFor(f, v) {
  const mi = f.mission_impact ?? 0;
  const harm = f.harm_if_unfixed ?? 0;
  const hay = `${f.title || ""} ${f.standard_reference || ""}`;

  if (v?.verdict === "REFUTED") return "REFUTED";

  const p0Signal = P0_PATTERNS.some((re) => re.test(hay));
  if (p0Signal && harm >= 4) return "P0";
  if (harm >= 5 && mi >= 4) return "P0";
  if (mi >= 4 && harm >= 3) return "P1";
  if (mi >= 3 || harm >= 3) return "P2";
  return "P3";
}

const EFFORT_ORDER = { S: 0, M: 1, L: 2, XL: 3 };

async function main() {
  const files = (await readdir(RAW)).filter((f) => f.endsWith(".md")).sort();
  let findings = [];
  for (const f of files) {
    const md = await readFile(path.join(RAW, f), "utf8");
    findings = findings.concat(parseFindings(md, f));
  }

  const vfiles = (await readdir(AUDIT)).filter((f) => /^verification-/.test(f)).sort();
  let verdicts = {};
  for (const f of vfiles) {
    const md = await readFile(path.join(AUDIT, f), "utf8");
    verdicts = { ...verdicts, ...parseVerdicts(md, f) };
  }

  for (const f of findings) {
    const v = verdicts[f.id] || null;
    f.verification = v;
    f.tier = tierFor(f, v);
    f.score = (f.mission_impact ?? 0) + (f.reach ?? 0) + (f.harm_if_unfixed ?? 0);
  }

  findings.sort((a, b) => {
    const t = ["P0", "P1", "P2", "P3", "REFUTED"];
    const d = t.indexOf(a.tier) - t.indexOf(b.tier);
    if (d !== 0) return d;
    const e = (EFFORT_ORDER[a.effort] ?? 9) - (EFFORT_ORDER[b.effort] ?? 9);
    if (e !== 0) return e;
    return b.score - a.score;
  });

  const byTier = {};
  const byCategory = {};
  const byAnalysis = {};
  const byVerdict = {};
  for (const f of findings) {
    byTier[f.tier] = (byTier[f.tier] || 0) + 1;
    byCategory[f.category || "uncategorised"] = (byCategory[f.category || "uncategorised"] || 0) + 1;
    byAnalysis[f.analysis] = (byAnalysis[f.analysis] || 0) + 1;
    const vd = f.verification?.verdict || "NO_VERDICT_PARSED";
    byVerdict[vd] = (byVerdict[vd] || 0) + 1;
  }

  const index = {
    builtAt: null, // stamped by the caller; Date is unavailable in workflow scripts
    totals: {
      findings: findings.length,
      analyses: files.length,
      verificationFiles: vfiles.length,
      alreadyFixed: findings.filter((f) => f.verification?.already_fixed).length,
      wrongSeverity: findings.filter((f) => f.verification?.wrong_severity).length,
      wrongStandard: findings.filter((f) => f.verification?.wrong_standard).length,
      architectural: findings.filter((f) => f.scope === "architectural").length,
      withPrivacyImpact: findings.filter((f) => f.privacy_impact_present).length,
    },
    byTier,
    byVerdict,
    byCategory,
    byAnalysis,
    findings,
  };

  await writeFile(path.join(AUDIT, "findings-index.json"), JSON.stringify(index, null, 2));

  console.log("findings parsed:", findings.length, "from", files.length, "analyses");
  console.log("verdicts parsed:", Object.keys(verdicts).length, "from", vfiles.length, "files");
  console.log("");
  console.log("BY TIER    ", JSON.stringify(byTier));
  console.log("BY VERDICT ", JSON.stringify(byVerdict));
  console.log("already_fixed:", index.totals.alreadyFixed,
    " wrong_severity:", index.totals.wrongSeverity,
    " wrong_standard:", index.totals.wrongStandard);
  console.log("architectural:", index.totals.architectural);
  console.log("");
  console.log("P0 FINDINGS:");
  for (const f of findings.filter((x) => x.tier === "P0")) {
    console.log(`  ${f.id} [${f.effort || "?"}] ${(f.title || "").slice(0, 88)}`);
  }
  console.log("");
  console.log("UNPARSED VERDICTS (findings with no verification entry):");
  const missing = findings.filter((f) => !f.verification).map((f) => f.id);
  console.log("  " + (missing.length ? missing.join(", ") : "(none)"));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
