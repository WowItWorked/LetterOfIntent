// V2 verifier — independent WCAG contrast arithmetic.
// Analysis only. Writes nothing into src/.
function hex(h) {
  h = h.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  return [
    parseInt(h.slice(0, 2), 16),
    parseInt(h.slice(2, 4), 16),
    parseInt(h.slice(4, 6), 16),
  ];
}
function lum([r, g, b]) {
  const f = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
}
function ratio(a, b) {
  const la = lum(typeof a === "string" ? hex(a) : a);
  const lb = lum(typeof b === "string" ? hex(b) : b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}
const r2 = (x) => Math.round(x * 100) / 100;

const T = {
  navy900: "#16223a",
  navy800: "#1d2c46",
  navy700: "#253551",
  gold700: "#8a6a38",
  gold600: "#a87e45",
  gold500: "#c9a063",
  gold400: "#d9b97f",
  gold300: "#e3c89b",
  gold100: "#f7eedf",
  ink900: "#1a2233",
  ink700: "#3a4456",
  ink500: "#5e6878",
  inkFaint: "#646d7b",
  paper: "#fbfaf6",
  paper2: "#f4efe6",
  white: "#ffffff",
  controlBorder: "#6e7889",
  accentText: "#7d5f31",
  onInkBody: "#c3ccdd",
};

const pairs = [
  // A3-001 / A4-003 claims about --focus-ring. Resolved value measured in browser
  // (see v2-browser.mjs); the analysts both report rgb(226,202,170) = #e2caaa.
  ["FOCUS RING #e2caaa vs --paper #fbfaf6  (A3/A4 claim 1.52)", "#e2caaa", T.paper],
  ["FOCUS RING #e2caaa vs --paper-2 #f4efe6 (claim 1.38)", "#e2caaa", T.paper2],
  ["FOCUS RING #e2caaa vs white (claim 1.58)", "#e2caaa", T.white],
  ["FOCUS RING #e2caaa vs --navy-800 (claim 8.84)", "#e2caaa", T.navy800],
  ["FOCUS RING #e2caaa vs --navy-900 (A3 claim 10.02)", "#e2caaa", T.navy900],
  ["control-border #6e7889 vs white (claim 4.46)", T.controlBorder, T.white],
  ["gold-400 #d9b97f vs white (claim 1.88)", T.gold400, T.white],
  // A4-004
  ["navy-900 text on gradient darkest #a87e45 (claim 4.33)", T.navy900, T.gold600],
  ["navy-900 on proposed #b28a4d (claim 4.89)", T.navy900, "#b28a4d"],
  ["#101828 on #a87e45 (A4-004 option B claim 4.85)", "#101828", T.gold600],
  // A3-016 / A4-011
  ["gold-500 dot vs white (claim 2.42)", T.gold500, T.white],
  ["gold-500 vs gold-100 (claim 2.10 / ~2.3)", T.gold500, T.gold100],
  ["gold-700 #8a6a38 vs white (A4-011 claim 4.3; A3-001 claims 4.9 on ivory)", T.gold700, T.white],
  ["gold-700 #8a6a38 vs --paper #fbfaf6", T.gold700, T.paper],
  ["accent-text #7d5f31 vs paper (A3-016 claim 4.5)", T.accentText, T.paper],
  // A3-001 recommendation
  ["navy-700 #253551 vs paper (A3 claim 10.4)", T.navy700, T.paper],
  ["navy-700 #253551 vs white (A4 claim 12.3)", T.navy700, T.white],
  ["navy-700 #253551 vs paper-2 (A4 claim 10.6)", T.navy700, T.paper2],
  // A4-012
  ["#000000 vs #37006E (claim 1.39)", "#000000", "#37006E"],
  // A4-017
  ["ink-muted #5e6878 on paper-2 (claim 4.92)", T.ink500, T.paper2],
  ["ink-faint #646d7b on paper-2 (claim 4.92)", T.inkFaint, T.paper2],
  ["ink-muted proposed #4c5666 on paper-2 (claim 6.2)", "#4c5666", T.paper2],
  ["ink-faint #646d7b on paper #fbfaf6", T.inkFaint, T.paper],
];

for (const [label, a, b] of pairs) {
  console.log(String(r2(ratio(a, b))).padStart(6) + "  " + label);
}

// Gradient full ramp against navy-900 — is #a87e45 really the worst stop?
console.log("\n--- gradient stops vs navy-900 ---");
for (const s of ["#e3c89b", "#c9a063", "#a87e45"]) {
  console.log(String(r2(ratio(s, T.navy900))).padStart(6) + "  " + s);
}
