/**
 * Which focus-ring colour actually works on THIS site?
 *
 * SC 1.4.11 wants 3:1 for a focus indicator against adjacent colour. The site
 * has both ivory and navy grounds, so a single colour has to clear 3:1 on
 * both — or the indicator has to be two-tone. This measures candidates against
 * every real ground rather than picking one that looks fine on the homepage.
 *
 *   node audit/tools/ring-candidates.mjs
 */
const hex = (h) => {
  const s = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(s.slice(i, i + 2), 16));
};
const lin = (c) => {
  const s = c / 255;
  return s <= 0.04045 ? s / 12.92 : Math.pow((s + 0.055) / 1.055, 2.4);
};
const lum = (h) => {
  const [r, g, b] = hex(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p);
  return (x + 0.05) / (y + 0.05);
};

/** Every surface a focused control can actually sit on. */
const GROUNDS = {
  "paper (page)": "#fbfaf6",
  "white (cards/inputs)": "#ffffff",
  "paper-2 (bands)": "#f4efe6",
  "navy-800 (panel top)": "#1d2c46",
  "navy-900 (panel base)": "#16223a",
  "gold-500 (CTA mid)": "#c9a063",
  "gold-600 (CTA dark end)": "#a87e45",
};

const CANDIDATES = {
  "CURRENT --focus-ring (gold500+white 55%)": "#e2caaa",
  "--navy-700 (the unused --ring)": "#253551",
  "--navy-900": "#16223a",
  "--gold-700": "#8a6a38",
  "--ink (#1a2233)": "#1a2233",
  "white": "#ffffff",
  "paper": "#fbfaf6",
};

const PASS = 3.0;

console.log("Focus indicator contrast vs every real ground (SC 1.4.11 needs 3:1)\n");
const header = ["candidate".padEnd(42), ...Object.keys(GROUNDS).map((g) => g.slice(0, 11).padStart(12))].join("");
console.log(header);
console.log("-".repeat(header.length));

const results = {};
for (const [name, col] of Object.entries(CANDIDATES)) {
  const cells = [];
  let worst = Infinity;
  for (const g of Object.values(GROUNDS)) {
    const r = ratio(col, g);
    worst = Math.min(worst, r);
    cells.push((r.toFixed(2) + (r >= PASS ? " " : "!")).padStart(12));
  }
  results[name] = worst;
  console.log(name.padEnd(42) + cells.join(""));
}

console.log("\n! = below 3:1\n");
console.log("WORST-CASE per candidate (a single-colour ring must clear 3:1 here):");
for (const [n, w] of Object.entries(results).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${w.toFixed(2).padStart(6)}  ${w >= PASS ? "PASS" : "FAIL"}  ${n}`);
}

/*
 * A two-tone ring passes everywhere by construction: whichever half the ground
 * defeats, the other half survives. Worth stating the numbers rather than
 * asserting it.
 */
console.log("\nTWO-TONE (navy-900 core + paper halo) — the relevant number is the BEST of the pair per ground:");
for (const [gname, g] of Object.entries(GROUNDS)) {
  const a = ratio("#16223a", g);
  const b = ratio("#fbfaf6", g);
  const best = Math.max(a, b);
  console.log(
    `  ${gname.padEnd(26)} navy ${a.toFixed(2).padStart(6)}  paper ${b.toFixed(2).padStart(6)}  -> best ${best.toFixed(2)} ${best >= PASS ? "PASS" : "FAIL"}`
  );
}
