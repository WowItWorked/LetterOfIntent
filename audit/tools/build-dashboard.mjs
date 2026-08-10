/**
 * Builds audit/index.html — one self-contained file, zero external requests.
 *
 * It has to work offline from file://, and it has to pass WCAG 2.2 AA itself:
 * an inaccessible accessibility report would be self-refuting. So every
 * control is a real labelled form control inside a fieldset, colour is never
 * the only channel, focus is always visible, and the whole thing is keyboard
 * operable.
 *
 * The decision controls are the point of the artifact. Each finding gets
 * Accept / Reject / Defer plus a free-text box; choices persist to
 * localStorage and export as JSON keyed by finding ID, so the reviewer's
 * decisions come back as something executable rather than prose to interpret.
 *
 *   node audit/tools/build-dashboard.mjs
 */
import { readFile, writeFile, readdir, stat } from "node:fs/promises";
import path from "node:path";

const AUDIT = path.resolve("audit");
const RAW = path.join(AUDIT, "raw");

const esc = (s) =>
  String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

/* ------------------------------------------------ richer finding parsing */

/**
 * The index has the scalars. The dashboard needs the prose too, including
 * multi-line block scalars, so this re-reads the raw files rather than
 * widening the index and making it unwieldy for other consumers.
 */
function parseRich(md) {
  const out = {};
  const chunks = md.split(/\n(?=\s*-\s+id:\s*A\d+-\d+)/);
  for (const chunk of chunks) {
    const idM = chunk.match(/^\s*-\s+id:\s*(A\d+-\d+)/m);
    if (!idM) continue;
    const field = (key) => {
      // Inline value, or an indented block that follows.
      const re = new RegExp(`^\\s{2,}${key}:\\s*(.*)$`, "m");
      const m = chunk.match(re);
      if (!m) return null;
      let val = m[1].trim().replace(/^[|>]\s*/, "");
      const after = chunk.slice(m.index + m[0].length);
      const blockLines = [];
      for (const line of after.split("\n")) {
        if (/^\s{4,}\S/.test(line) && !/^\s{2,}\w[\w_]*:/.test(line)) {
          blockLines.push(line.trim());
        } else if (line.trim() === "") {
          if (blockLines.length) break;
        } else break;
      }
      const block = blockLines.join(" ").trim();
      const combined = [val, block].filter(Boolean).join(" ").trim();
      return combined.replace(/^["']|["']$/g, "") || null;
    };
    out[idM[1]] = {
      what_i_observed: field("what_i_observed"),
      evidence_type: field("type"),
      evidence_detail: field("detail"),
      who_is_affected: field("who_is_affected"),
      why_it_matters: field("why_it_matters"),
      recommendation: field("recommendation"),
      privacy_impact: field("privacy_impact"),
      cost_and_maintenance: field("cost_and_maintenance"),
    };
  }
  return out;
}

/* ------------------------------------------------------ tiny md renderer */

/** Deliberately minimal: headings, lists, code, bold, paragraphs. No deps. */
function mdToHtml(md) {
  const lines = md.split("\n");
  let html = "";
  let inCode = false;
  let inList = false;
  const inline = (t) =>
    esc(t)
      .replace(/`([^`]+)`/g, "<code>$1</code>")
      .replace(/\*\*([^*]+)\*\*/g, "<strong>$1</strong>")
      .replace(/(?<!\*)\*([^*\n]+)\*(?!\*)/g, "<em>$1</em>");

  for (const line of lines) {
    if (/^```/.test(line)) {
      if (inList) { html += "</ul>"; inList = false; }
      html += inCode ? "</code></pre>" : '<pre class="block"><code>';
      inCode = !inCode;
      continue;
    }
    if (inCode) { html += esc(line) + "\n"; continue; }

    const h = line.match(/^(#{1,6})\s+(.*)$/);
    if (h) {
      if (inList) { html += "</ul>"; inList = false; }
      const lvl = Math.min(h[1].length + 1, 6);
      html += `<h${lvl}>${inline(h[2])}</h${lvl}>`;
      continue;
    }
    const li = line.match(/^\s*[-*]\s+(.*)$/);
    if (li) {
      if (!inList) { html += "<ul>"; inList = true; }
      html += `<li>${inline(li[1])}</li>`;
      continue;
    }
    if (inList) { html += "</ul>"; inList = false; }
    if (line.trim() === "") continue;
    html += `<p>${inline(line)}</p>`;
  }
  if (inList) html += "</ul>";
  if (inCode) html += "</code></pre>";
  return html;
}

async function readIf(p) {
  try { return await readFile(p, "utf8"); } catch { return null; }
}

/* ---------------------------------------------------------------- build */

async function main() {
  const index = JSON.parse(await readFile(path.join(AUDIT, "findings-index.json"), "utf8"));

  const rawFiles = (await readdir(RAW)).filter((f) => f.endsWith(".md")).sort();
  let rich = {};
  for (const f of rawFiles) rich = { ...rich, ...parseRich(await readFile(path.join(RAW, f), "utf8")) };

  const conflicts = await readIf(path.join(AUDIT, "conflicts.md"));
  const convergence = await readIf(path.join(AUDIT, "convergence.md"));
  const roadmap = await readIf(path.join(AUDIT, "roadmap.md"));
  const changes = await readIf(path.join(AUDIT, "CHANGES-DURING-RUN.md"));
  const vpat = await readIf(path.join(AUDIT, "vpat-draft.md"));

  const findings = index.findings.map((f) => ({ ...f, ...(rich[f.id] || {}) }));

  const T = index.byTier || {};
  const V = index.byVerdict || {};

  const tierClass = (t) => `t-${String(t).toLowerCase()}`;

  const findingCard = (f) => {
    const v = f.verification || {};
    const flags = [];
    if (v.already_fixed) flags.push(["fixed", "Already fixed"]);
    if (v.wrong_severity) flags.push(["warn", "Severity corrected"]);
    if (v.wrong_standard) flags.push(["warn", "Standard miscited"]);
    if (f.scope === "architectural") flags.push(["arch", "Architectural"]);

    const row = (label, val) =>
      val ? `<div class="row"><dt>${esc(label)}</dt><dd>${esc(val)}</dd></div>` : "";

    /*
     * Not <details>/<summary>. The decision controls have to be reachable
     * without expanding anything — a reviewer triaging 157 findings should not
     * have to open 157 disclosures to say "yes" — and putting radios inside a
     * <summary> nests interactive content inside interactive content, which is
     * an accessibility problem in its own right. So: an explicit toggle button
     * with aria-expanded, and the decision controls as its siblings.
     */
    return `
<article class="finding ${tierClass(f.tier)}" id="f-${esc(f.id)}"
  data-tier="${esc(f.tier)}" data-analysis="${esc(f.analysis)}" data-category="${esc(f.category)}"
  data-effort="${esc(f.effort)}" data-scope="${esc(f.scope)}" data-confidence="${esc(f.confidence)}"
  data-verdict="${esc(v.verdict || "")}" data-fixed="${v.already_fixed ? "yes" : "no"}"
  data-text="${esc((f.title + " " + f.id + " " + (f.recommendation || "")).toLowerCase())}">
  <div class="head">
    <button type="button" class="tog" aria-expanded="false" aria-controls="b-${esc(f.id)}">
      <span class="chev" aria-hidden="true"></span>
      <span class="badge ${tierClass(f.tier)}">${esc(f.tier)}</span>
      <span class="fid">${esc(f.id)}</span>
      <span class="ftitle">${esc(f.title)}</span>
      <span class="meta">${esc(f.effort || "?")} &middot; ${esc(v.verdict || "—")}</span>
    </button>
    <fieldset class="quick">
      <legend class="hidden">Decision on ${esc(f.id)}</legend>
      <span class="opt"><input type="radio" id="${esc(f.id)}-a" name="d-${esc(f.id)}" value="accept"><label for="${esc(f.id)}-a">Accept</label></span>
      <span class="opt"><input type="radio" id="${esc(f.id)}-d" name="d-${esc(f.id)}" value="defer"><label for="${esc(f.id)}-d">Defer</label></span>
      <span class="opt"><input type="radio" id="${esc(f.id)}-r" name="d-${esc(f.id)}" value="reject"><label for="${esc(f.id)}-r">Reject</label></span>
    </fieldset>
  </div>
  <div class="body" id="b-${esc(f.id)}" hidden>
    ${flags.length ? `<p class="flags">${flags.map(([c, t]) => `<span class="flag ${c}">${esc(t)}</span>`).join("")}</p>` : ""}
    <dl>
      ${row("What was observed", f.what_i_observed)}
      ${row("Evidence", [f.evidence_type, f.evidence_detail].filter(Boolean).join(" — "))}
      ${row("Who is affected", f.who_is_affected)}
      ${row("Why it matters", f.why_it_matters)}
      ${row("Standard", f.standard_reference)}
      ${row("Recommendation", f.recommendation)}
      ${row("Privacy impact", f.privacy_impact && !/^none$/i.test(f.privacy_impact) ? f.privacy_impact : null)}
      ${row("Cost / maintenance", f.cost_and_maintenance)}
      <div class="row"><dt>Scores</dt><dd>mission ${f.mission_impact ?? "?"} &middot; reach ${f.reach ?? "?"} &middot; harm ${f.harm_if_unfixed ?? "?"} &middot; confidence ${esc(f.confidence || "?")} &middot; ${esc(f.environment || "?")}</dd></div>
      ${v.already_fixed_note ? row("Already fixed", v.already_fixed_note) : ""}
      ${v.wrong_severity_note ? row("Severity correction", v.wrong_severity_note) : ""}
      ${v.wrong_standard_note ? row("Standard correction", v.wrong_standard_note) : ""}
    </dl>
    <div class="guide">
      <label class="note-l" for="${esc(f.id)}-n">Your guidance on ${esc(f.id)} (optional)</label>
      <textarea id="${esc(f.id)}-n" name="n-${esc(f.id)}" rows="2"
        placeholder="e.g. do this but keep the gold, or fix only the emergency sheet"></textarea>
    </div>
  </div>
</article>`;
  };

  const p0 = findings.filter((f) => f.tier === "P0");
  const quickWins = findings
    .filter((f) => f.effort === "S" && (f.harm_if_unfixed ?? 0) >= 3 && f.tier !== "REFUTED")
    .sort((a, b) => b.score - a.score);

  const html = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Audit — myletterofintent.com</title>
<style>
  :root{
    --ink:#16223a; --body:#2c3a53; --muted:#55617a; --line:#d9d3c7;
    --paper:#fbfaf6; --card:#fff; --gold:#8a6a34; --navy:#253551;
    --p0:#8c1d1d; --p1:#8a5b12; --p2:#1f5170; --p3:#4a5568; --ref:#6b7280;
  }
  *{box-sizing:border-box}
  body{margin:0;background:var(--paper);color:var(--body);
    font:16px/1.6 -apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,Helvetica,Arial,sans-serif}
  a{color:#0f4c75}
  .skip{position:absolute;left:-9999px}
  .skip:focus{left:8px;top:8px;z-index:99;background:#fff;padding:10px 14px;border:2px solid var(--navy)}
  header.top{background:var(--navy);color:#f6f4ee;padding:22px clamp(14px,3vw,34px)}
  header.top h1{margin:0 0 4px;font-size:1.5rem}
  header.top p{margin:0;color:#c3ccdd;font-size:.9rem}
  main{padding:0 clamp(14px,3vw,34px) 70px;max-width:1200px;margin:0 auto}
  h2{color:var(--ink);margin:34px 0 12px;font-size:1.25rem;border-bottom:2px solid var(--line);padding-bottom:6px}
  h3{color:var(--ink);margin:22px 0 8px;font-size:1.05rem}
  h4,h5,h6{color:var(--ink);margin:16px 0 6px;font-size:.98rem}
  /* Tabs are real buttons with aria-selected; never colour alone. */
  .tabs{display:flex;flex-wrap:wrap;gap:6px;margin:18px 0 0;padding:0;border-bottom:2px solid var(--line)}
  .tabs button{font:inherit;font-size:.9rem;background:transparent;border:1px solid transparent;
    border-bottom:none;padding:9px 14px;cursor:pointer;color:var(--body);border-radius:6px 6px 0 0}
  .tabs button[aria-selected="true"]{background:var(--card);border-color:var(--line);
    color:var(--ink);font-weight:700;box-shadow:inset 0 3px 0 var(--gold)}
  .panel{background:var(--card);border:1px solid var(--line);border-top:none;padding:20px;border-radius:0 0 8px 8px}
  .grid{display:grid;gap:12px;grid-template-columns:repeat(auto-fit,minmax(150px,1fr));margin:0 0 18px}
  .stat{border:1px solid var(--line);border-radius:8px;padding:12px 14px;background:var(--paper)}
  .stat .n{font-size:1.7rem;font-weight:700;color:var(--ink);line-height:1.1}
  .stat .l{font-size:.78rem;color:var(--muted);text-transform:uppercase;letter-spacing:.06em}
  .filters{display:flex;flex-wrap:wrap;gap:14px;align-items:end;margin:0 0 16px;
    padding:14px;border:1px solid var(--line);border-radius:8px;background:var(--paper)}
  .filters label{display:block;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;
    color:var(--muted);margin-bottom:3px}
  .filters select,.filters input{font:inherit;font-size:.9rem;padding:7px 9px;
    border:1px solid #b9b3a6;border-radius:6px;background:#fff;color:var(--ink)}
  .finding{border:1px solid var(--line);border-left-width:6px;border-radius:8px;margin:0 0 9px;background:var(--card)}
  .finding.t-p0{border-left-color:var(--p0)} .finding.t-p1{border-left-color:var(--p1)}
  .finding.t-p2{border-left-color:var(--p2)} .finding.t-p3{border-left-color:var(--p3)}
  /* Refuted findings are de-emphasised with a background tint, NOT opacity.
     Opacity blends every colour inside toward the page and silently drops the
     text below AA — measured at 2.85:1 and 3.32:1 before this changed. */
  .finding.t-refuted{border-left-color:var(--ref);background:#f7f6f4}
  .head{display:flex;gap:10px;align-items:center;flex-wrap:wrap;padding:8px 12px}
  .tog{flex:1 1 460px;display:flex;gap:10px;align-items:baseline;flex-wrap:wrap;
    font:inherit;text-align:left;background:transparent;border:1px solid transparent;
    border-radius:6px;padding:5px 6px;cursor:pointer;color:inherit}
  .tog:hover{background:var(--paper)}
  .chev::before{content:"\\25B8";color:var(--muted);font-size:.8rem}
  .tog[aria-expanded="true"] .chev::before{content:"\\25BE"}
  fieldset.quick{display:flex;gap:12px;align-items:center;flex-wrap:wrap;
    border:1px solid var(--line);border-radius:20px;padding:4px 12px;margin:0;background:var(--paper)}
  fieldset.quick .opt label{font-size:.8rem}
  .guide{margin-top:12px}
  .badge{font-size:.7rem;font-weight:700;padding:2px 7px;border-radius:4px;color:#fff;letter-spacing:.04em}
  .badge.t-p0{background:var(--p0)} .badge.t-p1{background:var(--p1)}
  .badge.t-p2{background:var(--p2)} .badge.t-p3{background:var(--p3)}
  .badge.t-refuted{background:var(--ref)}
  .fid{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.8rem;color:var(--muted)}
  .ftitle{flex:1 1 320px;color:var(--ink);font-weight:600;font-size:.95rem}
  .meta{font-size:.75rem;color:var(--muted)}
  .body{padding:4px 15px 16px;border-top:1px solid var(--line)}
  dl{margin:12px 0}
  .row{display:grid;grid-template-columns:170px 1fr;gap:12px;padding:6px 0;border-bottom:1px dotted var(--line)}
  dt{font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted)}
  dd{margin:0;font-size:.9rem}
  .flags{margin:10px 0 0;display:flex;gap:6px;flex-wrap:wrap}
  .flag{font-size:.72rem;padding:2px 8px;border-radius:10px;border:1px solid}
  .flag.fixed{border-color:#1b6b3a;color:#1b6b3a;background:#eaf6ee}
  .flag.warn{border-color:#8a5b12;color:#8a5b12;background:#fdf4e3}
  .flag.arch{border-color:#1f5170;color:#1f5170;background:#e8f1f7}
  fieldset.decide{margin:14px 0 0;border:1px solid var(--line);border-radius:8px;padding:12px 14px;background:var(--paper)}
  legend{font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);padding:0 6px}
  .opts{display:flex;gap:16px;flex-wrap:wrap;margin-bottom:9px}
  .opt{display:flex;align-items:center;gap:6px}
  .opt input{width:18px;height:18px;margin:0}
  .opt label{font-size:.88rem;cursor:pointer}
  .note-l{display:block;font-size:.76rem;text-transform:uppercase;letter-spacing:.05em;color:var(--muted);margin-bottom:3px}
  textarea{width:100%;font:inherit;font-size:.88rem;padding:7px 9px;border:1px solid #b9b3a6;border-radius:6px}
  .bar{position:sticky;bottom:0;background:var(--navy);color:#f6f4ee;padding:11px 16px;
    display:flex;gap:14px;align-items:center;flex-wrap:wrap;border-radius:8px;margin-top:18px}
  .bar button{font:inherit;font-size:.86rem;font-weight:600;padding:9px 15px;border-radius:6px;
    border:1px solid #f6f4ee;background:transparent;color:#f6f4ee;cursor:pointer}
  .bar button.primary{background:#f6f4ee;color:var(--navy)}
  .count{font-size:.86rem}
  pre.block{background:#f4f1ea;padding:12px;border-radius:6px;overflow-x:auto;font-size:.82rem;border:1px solid var(--line)}
  /* Explicit colour, not inherited: this same rule sits inside the navy header,
     where inheriting the light heading colour onto a light chip measured
     1.43:1. */
  code{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.86em;
    background:#f4f1ea;color:var(--ink);padding:1px 4px;border-radius:3px}
  pre code{background:none;padding:0}
  .doc{max-width:78ch}
  .doc p,.doc li{font-size:.92rem}
  table{border-collapse:collapse;width:100%;font-size:.88rem;margin:10px 0}
  th,td{border:1px solid var(--line);padding:7px 9px;text-align:left;vertical-align:top}
  th{background:var(--paper);color:var(--ink)}
  .note{background:#fdf4e3;border:1px solid #d9bd7f;border-radius:8px;padding:12px 14px;margin:14px 0;font-size:.9rem}
  .hidden{display:none !important}
  /* Focus must be unmistakable — the audit's own headline finding is an
     invisible focus ring, so this file had better not repeat it. */
  a:focus-visible,button:focus-visible,select:focus-visible,input:focus-visible,
  textarea:focus-visible,summary:focus-visible{outline:3px solid #14507d;outline-offset:2px}
  @media (prefers-reduced-motion:reduce){*{animation:none!important;transition:none!important}}
  @media (max-width:640px){.row{grid-template-columns:1fr;gap:2px}}
</style>
</head>
<body>
<a class="skip" href="#main">Skip to main content</a>
<header class="top">
  <h1>Multi-perspective audit &mdash; myletterofintent.com</h1>
  <p>157 findings from nine independent analyses, adversarially verified. Commit <code>b243107</code>.</p>
</header>

<main id="main">
  <div class="tabs" role="tablist" aria-label="Audit sections">
    <button role="tab" id="tab-sum" aria-controls="p-sum" aria-selected="true">Summary</button>
    <button role="tab" id="tab-find" aria-controls="p-find" aria-selected="false">Findings (${findings.length})</button>
    <button role="tab" id="tab-conf" aria-controls="p-conf" aria-selected="false">Conflicts</button>
    <button role="tab" id="tab-conv" aria-controls="p-conv" aria-selected="false">Convergence</button>
    <button role="tab" id="tab-road" aria-controls="p-road" aria-selected="false">Roadmap</button>
    <button role="tab" id="tab-cov" aria-controls="p-cov" aria-selected="false">Coverage</button>
    <button role="tab" id="tab-vpat" aria-controls="p-vpat" aria-selected="false">VPAT</button>
  </div>

  <section role="tabpanel" id="p-sum" aria-labelledby="tab-sum" tabindex="0" class="panel">
    <h2>Executive summary</h2>
    <div class="grid">
      <div class="stat"><div class="n">${T.P0 || 0}</div><div class="l">P0 &mdash; blocking</div></div>
      <div class="stat"><div class="n">${T.P1 || 0}</div><div class="l">P1</div></div>
      <div class="stat"><div class="n">${T.P2 || 0}</div><div class="l">P2</div></div>
      <div class="stat"><div class="n">${T.P3 || 0}</div><div class="l">P3</div></div>
      <div class="stat"><div class="n">${V.CONFIRMED || 0}</div><div class="l">Confirmed</div></div>
      <div class="stat"><div class="n">${V.REFUTED || 0}</div><div class="l">Refuted</div></div>
    </div>

    <div class="note">
      <strong>Most important thing this week:</strong> A2-001 &mdash; on production, a browser that
      refuses to write <code>localStorage</code> renders &ldquo;This page couldn&rsquo;t load&rdquo; on
      <em>every</em> wizard section, with no form fields and no explanation. Private browsing, a full
      disk, or a locked-down device means the tool is simply unusable, with no path forward. It is the
      only total exclusion in the set.
    </div>

    <h3>Privacy verdict</h3>
    <p>The canonical promise &mdash; <em>&ldquo;everything you type stays on your device&rdquo;</em> &mdash;
    <strong>holds</strong>. Canary strings planted in every field were searched across all 431 captured
    production requests, in plaintext, base64, URL-encoded and hashed forms, and none appeared. Two
    caveats reach your judgement rather than the code: GA4 enhanced measurement transmits
    <em>field identifiers</em> such as <code>f-diagnoses</code> and <code>f-allergies</code> (which
    field, never its contents), and some on-site copy claims more than the canonical scope.</p>

    <h3>Accessibility verdict</h3>
    <p>Automated tooling reports <strong>zero</strong> WCAG A/AA violations across 19 states &mdash; and
    six Tier-1 failures survive anyway, because axe cannot evaluate contrast against a gradient and both
    signature surfaces are gradients. The clean scan was concealing legal-floor failures. The video has
    no captions (SC 1.2.2, <strong>Level A</strong>), the focus ring measures roughly 1.5:1 on light
    grounds, and both generated PDFs are untagged with no declared language.</p>

    <h3>Three biggest risks</h3>
    <ol>
      <li><strong>Total exclusion</strong> for storage-blocked browsers (A2-001).</li>
      <li><strong>Legal floor unmet</strong> &mdash; no captions, Level A (A4-001); untagged PDFs (A4-006, A6-004).</li>
      <li><strong>A silently empty emergency sheet</strong> handed to a caregiver, because the guard
        function that would prevent it is defined but never called (A3-005).</li>
    </ol>

    <h3>Cheapest high-value wins</h3>
    <p>Effort S, harm 3 or higher &mdash; ${quickWins.length} findings:</p>
    <table><caption class="hidden">Quick wins</caption>
      <thead><tr><th scope="col">ID</th><th scope="col">Tier</th><th scope="col">Title</th></tr></thead>
      <tbody>${quickWins.slice(0, 18).map((f) => `<tr><td><code>${esc(f.id)}</code></td><td>${esc(f.tier)}</td><td>${esc(f.title)}</td></tr>`).join("")}</tbody>
    </table>

    ${changes ? `<h3>Changed during the audit</h3><div class="doc">${mdToHtml(changes)}</div>` : ""}
  </section>

  <section role="tabpanel" id="p-find" aria-labelledby="tab-find" tabindex="0" class="panel hidden">
    <h2>Findings</h2>
    <p>Choose Accept, Defer or Reject on any finding and add your own guidance. Your choices are saved
    in this browser and can be exported as JSON at the bottom of the page.</p>

    <div class="filters">
      <div><label for="f-q">Search</label><input type="search" id="f-q" placeholder="id, title, fix"></div>
      <div><label for="f-tier">Tier</label><select id="f-tier"><option value="">All</option><option>P0</option><option>P1</option><option>P2</option><option>P3</option><option>REFUTED</option></select></div>
      <div><label for="f-an">Analysis</label><select id="f-an"><option value="">All</option>${Object.keys(index.byAnalysis).sort().map((a) => `<option>${a}</option>`).join("")}</select></div>
      <div><label for="f-cat">Category</label><select id="f-cat"><option value="">All</option>${Object.keys(index.byCategory).sort().map((c) => `<option>${esc(c)}</option>`).join("")}</select></div>
      <div><label for="f-eff">Effort</label><select id="f-eff"><option value="">All</option><option>S</option><option>M</option><option>L</option><option>XL</option></select></div>
      <div><label for="f-ver">Verdict</label><select id="f-ver"><option value="">All</option><option>CONFIRMED</option><option>PLAUSIBLE</option><option>REFUTED</option></select></div>
      <div><label for="f-sc">Scope</label><select id="f-sc"><option value="">All</option><option value="current">current</option><option value="architectural">architectural</option></select></div>
      <div><label for="f-dec">Decision</label><select id="f-dec"><option value="">All</option><option value="none">Undecided</option><option value="accept">Accepted</option><option value="defer">Deferred</option><option value="reject">Rejected</option></select></div>
    </div>

    <p aria-live="polite" id="shown" class="count">Showing ${findings.length} of ${findings.length}</p>
    <div id="list">${findings.map(findingCard).join("")}</div>
  </section>

  <section role="tabpanel" id="p-conf" aria-labelledby="tab-conf" tabindex="0" class="panel hidden">
    <h2>Conflicts</h2>
    <div class="doc">${conflicts ? mdToHtml(conflicts) : "<p>Not generated.</p>"}</div>
  </section>

  <section role="tabpanel" id="p-conv" aria-labelledby="tab-conv" tabindex="0" class="panel hidden">
    <h2>Convergence and emergent findings</h2>
    <div class="doc">${convergence ? mdToHtml(convergence) : "<p>Not generated.</p>"}</div>
  </section>

  <section role="tabpanel" id="p-road" aria-labelledby="tab-road" tabindex="0" class="panel hidden">
    <h2>Roadmap</h2>
    <div class="doc">${roadmap ? mdToHtml(roadmap) : "<p>Not generated.</p>"}</div>
  </section>

  <section role="tabpanel" id="p-cov" aria-labelledby="tab-cov" tabindex="0" class="panel hidden">
    <h2>Coverage and confidence</h2>
    <div class="note">
      <strong>Read this before trusting anything else.</strong> These are the audit&rsquo;s own weaknesses,
      stated plainly.
    </div>
    <ul>
      <li><strong>No real screen reader was ever run.</strong> NVDA, JAWS and VoiceOver could not be
        driven. The blind-user persona is an accessibility-tree proxy, labelled INSPECTED, not MEASURED.</li>
      <li><strong>A1 ran with no axe scan at all</strong> &mdash; Bash was unavailable for that entire
        session, so its contrast numbers are self-computed arithmetic. A later verifier ran axe and found
        zero WCAG A/AA violations, which contradicted one A1 finding outright.</li>
      <li><strong>The shared screenshots were captured against local dev, not production.</strong> That
        was my error in the setup phase. Findings resting only on those are weaker than they appear.</li>
      <li><strong>The production network capture predates two mid-audit changes</strong> (the social
        image and the video label), so it reflects a slightly older site.</li>
      <li><strong>23 of the 73 findings that cite a standard cited it wrongly</strong> &mdash; 32%,
        concentrated in two analyses. Every citation in this report should be re-checked before it is
        used in a legal or procurement context.</li>
      <li><strong>No real user was observed.</strong> No parent, no caregiver, no assistive-technology
        user. Every usability claim is inference from instrumented runs, not observation of a human being.</li>
    </ul>
    ${roadmap && /coverage/i.test(roadmap) ? "<p>The roadmap tab carries a fuller coverage statement.</p>" : ""}
  </section>

  <section role="tabpanel" id="p-vpat" aria-labelledby="tab-vpat" tabindex="0" class="panel hidden">
    <h2>Accessibility Conformance Report (draft)</h2>
    <div class="note">Draft only. Prepared for review by a qualified accessibility specialist before any
      external use. Note the 32% standard-miscitation rate above.</div>
    <div class="doc">${vpat ? mdToHtml(vpat) : "<p>Not generated.</p>"}</div>
  </section>

  <div class="bar">
    <span class="count" id="dcount" aria-live="polite">No decisions recorded yet</span>
    <button type="button" id="acceptShown">Accept all shown</button>
    <button type="button" id="copy" class="primary">Copy decisions</button>
    <button type="button" id="download">Download decisions.json</button>
    <button type="button" id="clear">Clear all decisions</button>
  </div>
</main>

<script>
(function(){
  "use strict";
  var KEY = "loi-audit-decisions-v1";
  var store = {};
  try { store = JSON.parse(localStorage.getItem(KEY) || "{}"); } catch(e) { store = {}; }

  /* ---- tabs ---- */
  var tabs = [].slice.call(document.querySelectorAll('[role="tab"]'));
  function show(id){
    tabs.forEach(function(t){
      var sel = t.id === id;
      t.setAttribute("aria-selected", sel ? "true" : "false");
      var p = document.getElementById(t.getAttribute("aria-controls"));
      if (p) p.classList.toggle("hidden", !sel);
    });
  }
  tabs.forEach(function(t){
    t.addEventListener("click", function(){ show(t.id); });
    t.addEventListener("keydown", function(e){
      var i = tabs.indexOf(t), n = null;
      if (e.key === "ArrowRight") n = tabs[(i+1) % tabs.length];
      if (e.key === "ArrowLeft")  n = tabs[(i-1+tabs.length) % tabs.length];
      if (e.key === "Home") n = tabs[0];
      if (e.key === "End")  n = tabs[tabs.length-1];
      if (n){ e.preventDefault(); n.focus(); show(n.id); }
    });
  });

  /* ---- expand / collapse ---- */
  document.addEventListener("click", function(e){
    var b = e.target.closest ? e.target.closest(".tog") : null;
    if (!b) return;
    var open = b.getAttribute("aria-expanded") === "true";
    b.setAttribute("aria-expanded", open ? "false" : "true");
    var body = document.getElementById(b.getAttribute("aria-controls"));
    if (body) body.hidden = open;
  });

  /* ---- decisions ---- */
  function save(){
    try { localStorage.setItem(KEY, JSON.stringify(store)); } catch(e){}
    var n = Object.keys(store).filter(function(k){
      return store[k] && (store[k].decision || store[k].note);
    }).length;
    document.getElementById("dcount").textContent =
      n === 0 ? "No decisions recorded yet" : (n + (n===1?" decision":" decisions") + " recorded");
  }
  function ensure(id){ if(!store[id]) store[id] = { decision:null, note:"" }; return store[id]; }

  document.addEventListener("change", function(e){
    var t = e.target;
    if (t.type === "radio" && t.name.indexOf("d-") === 0){
      var id = t.name.slice(2); ensure(id).decision = t.value; save(); applyFilters();
    }
  });
  document.addEventListener("input", function(e){
    var t = e.target;
    if (t.tagName === "TEXTAREA" && t.name && t.name.indexOf("n-") === 0){
      var id = t.name.slice(2); ensure(id).note = t.value; save();
    }
  });

  // Restore
  Object.keys(store).forEach(function(id){
    var d = store[id]; if(!d) return;
    if (d.decision){
      var r = document.querySelector('input[name="d-'+id+'"][value="'+d.decision+'"]');
      if (r) r.checked = true;
    }
    if (d.note){
      var ta = document.querySelector('textarea[name="n-'+id+'"]');
      if (ta) ta.value = d.note;
    }
  });
  save();

  /* ---- filters ---- */
  var ids = ["f-q","f-tier","f-an","f-cat","f-eff","f-ver","f-sc","f-dec"];
  function applyFilters(){
    var q = (document.getElementById("f-q").value||"").toLowerCase().trim();
    var tier = document.getElementById("f-tier").value;
    var an = document.getElementById("f-an").value;
    var cat = document.getElementById("f-cat").value;
    var eff = document.getElementById("f-eff").value;
    var ver = document.getElementById("f-ver").value;
    var sc = document.getElementById("f-sc").value;
    var dec = document.getElementById("f-dec").value;
    var all = document.querySelectorAll(".finding"), shown = 0;
    [].forEach.call(all, function(el){
      var fid = el.id.slice(2);
      var d = store[fid] && store[fid].decision ? store[fid].decision : "none";
      var ok = (!q || el.dataset.text.indexOf(q) !== -1)
        && (!tier || el.dataset.tier === tier)
        && (!an || el.dataset.analysis === an)
        && (!cat || el.dataset.category === cat)
        && (!eff || el.dataset.effort === eff)
        && (!ver || el.dataset.verdict === ver)
        && (!sc || el.dataset.scope === sc)
        && (!dec || d === dec);
      el.classList.toggle("hidden", !ok);
      if (ok) shown++;
    });
    document.getElementById("shown").textContent = "Showing " + shown + " of " + all.length;
  }
  ids.forEach(function(i){
    var el = document.getElementById(i);
    el.addEventListener(el.tagName === "INPUT" ? "input" : "change", applyFilters);
  });

  /* ---- export ---- */
  function payload(){
    var out = { generatedFrom:"myletterofintent.com audit", commit:"b243107", decisions:{} };
    Object.keys(store).forEach(function(id){
      var d = store[id];
      if (d && (d.decision || d.note)) out.decisions[id] = d;
    });
    return JSON.stringify(out, null, 2);
  }
  document.getElementById("copy").addEventListener("click", function(){
    var txt = payload(), btn = this;
    function done(){ var o = btn.textContent; btn.textContent = "Copied"; setTimeout(function(){ btn.textContent = o; }, 1600); }
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(txt).then(done, fallback);
    } else fallback();
    function fallback(){
      var ta = document.createElement("textarea");
      ta.value = txt; document.body.appendChild(ta); ta.select();
      try { document.execCommand("copy"); done(); } catch(e){ window.prompt("Copy the decisions below:", txt); }
      document.body.removeChild(ta);
    }
  });
  document.getElementById("download").addEventListener("click", function(){
    var blob = new Blob([payload()], {type:"application/json"});
    var a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = "decisions.json";
    document.body.appendChild(a); a.click(); document.body.removeChild(a);
    setTimeout(function(){ URL.revokeObjectURL(a.href); }, 2000);
  });
  /*
   * Bulk accept, scoped to whatever the filters are currently showing. Filter
   * to "P0 + effort S", press once, and the obvious work is triaged — which is
   * the only way 157 findings get through in one sitting.
   */
  document.getElementById("acceptShown").addEventListener("click", function(){
    var vis = document.querySelectorAll(".finding:not(.hidden)");
    if (!vis.length) return;
    if (!window.confirm("Mark all " + vis.length + " currently shown findings as Accept?")) return;
    [].forEach.call(vis, function(el){
      var id = el.id.slice(2);
      ensure(id).decision = "accept";
      var r = el.querySelector('input[value="accept"]');
      if (r) r.checked = true;
    });
    save(); applyFilters();
  });

  document.getElementById("clear").addEventListener("click", function(){
    if (!window.confirm("Clear every decision and note? This cannot be undone.")) return;
    store = {}; save();
    [].forEach.call(document.querySelectorAll('.quick input[type=radio]'), function(r){ r.checked = false; });
    [].forEach.call(document.querySelectorAll('.guide textarea'), function(t){ t.value = ""; });
    applyFilters();
  });

  applyFilters();
})();
</script>
</body>
</html>`;

  const out = path.join(AUDIT, "index.html");
  await writeFile(out, html);
  const s = await stat(out);
  console.log(`  findings rendered: ${findings.length}`);
  console.log(`  rich prose parsed: ${Object.keys(rich).length}`);
  console.log(`  ${(s.size / 1024).toFixed(0)} KB -> ${out}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
