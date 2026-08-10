/**
 * V1 verifier — independent recomputation of every contrast number in A1.
 * No browser, no trust in the analyst's arithmetic. Pure math from first
 * principles: sRGB -> linear -> oklab mix -> back, then WCAG 2.x relative
 * luminance and contrast ratio.
 */

const srgbToLinear = (c) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);
const linearToSrgb = (c) => (c <= 0.0031308 ? c * 12.92 : 1.055 * c ** (1 / 2.4) - 0.055);

function hexToRgb(hex) {
  const h = hex.replace("#", "");
  const f = h.length === 3 ? h.split("").map((c) => c + c).join("") : h;
  return [parseInt(f.slice(0, 2), 16), parseInt(f.slice(2, 4), 16), parseInt(f.slice(4, 6), 16)];
}
const rgbToHex = (r) => "#" + r.map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, "0")).join("");

/** WCAG 2.x relative luminance. */
function luminance(hex) {
  const [r, g, b] = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}
function contrast(a, b) {
  const la = luminance(a), lb = luminance(b);
  const [hi, lo] = la > lb ? [la, lb] : [lb, la];
  return (hi + 0.05) / (lo + 0.05);
}

/* ---------------------------------------------------- oklab, per CSS Color 4 */
function srgbToOklab(hex) {
  const [R, G, B] = hexToRgb(hex).map((v) => srgbToLinear(v / 255));
  const l = Math.cbrt(0.4122214708 * R + 0.5363325363 * G + 0.0514459929 * B);
  const m = Math.cbrt(0.2119034982 * R + 0.6806995451 * G + 0.1073969566 * B);
  const s = Math.cbrt(0.0883024619 * R + 0.2817188376 * G + 0.6299787005 * B);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}
function oklabToSrgb([L, a, bb]) {
  const l = (L + 0.3963377774 * a + 0.2158037573 * bb) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * bb) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * bb) ** 3;
  const R = 4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s;
  const G = -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s;
  const B = -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s;
  return rgbToHex([R, G, B].map((v) => linearToSrgb(v) * 255));
}
/** color-mix(in oklab, A p%, B) */
function mixOklab(hexA, pct, hexB) {
  const A = srgbToOklab(hexA), B = srgbToOklab(hexB);
  const w = pct / 100;
  return oklabToSrgb([0, 1, 2].map((i) => A[i] * w + B[i] * (1 - w)));
}

const T = {
  "navy-900": "#16223a", "navy-800": "#1d2c46", "navy-700": "#253551",
  "gold-700": "#8a6a38", "gold-600": "#a87e45", "gold-500": "#c9a063",
  "gold-400": "#d9b97f", "gold-300": "#e3c89b", "gold-100": "#f7eedf",
  paper: "#fbfaf6", "paper-2": "#f4efe6", "paper-3": "#ece5d8", white: "#ffffff",
  "ink-900": "#1a2233", "ink-700": "#3a4456", "ink-faint": "#646d7b",
  "accent-text": "#7d5f31",
};

const out = {};

/* ============================================================ A1-002 */
const focusRing = mixOklab(T["gold-500"], 55, "#ffffff");
out["A1-002"] = {
  focusRingResolved: focusRing,
  analystClaimed: "#e2caaa",
  deltaFromClaim: hexToRgb(focusRing).map((v, i) => v - hexToRgb("#e2caaa")[i]),
  ratios: {},
  analystRatios: { paper: 1.52, "paper-2": 1.38, "paper-3": 1.26, "gold-100": 1.38, white: 1.58, "navy-900": 10.02, "navy-700": 7.77 },
};
for (const g of ["paper", "paper-2", "paper-3", "gold-100", "white", "navy-900", "navy-700"]) {
  out["A1-002"].ratios[g] = +contrast(focusRing, T[g]).toFixed(2);
}
// recommendation check: navy-700 as a ring on paper
out["A1-002"].navy700_vs_paper = +contrast(T["navy-700"], T.paper).toFixed(2);

/* ============================================================ A1-008 */
// --gradient-gold stops: #e3c89b 0%, #c9a063 42%, #a87e45 78%, #c9a063 100%
out["A1-008"] = {
  perStopVsNavy900: {
    "0%_#e3c89b": +contrast("#e3c89b", T["navy-900"]).toFixed(2),
    "42%_#c9a063": +contrast("#c9a063", T["navy-900"]).toFixed(2),
    "78%_#a87e45": +contrast("#a87e45", T["navy-900"]).toFixed(2),
    "100%_#c9a063": +contrast("#c9a063", T["navy-900"]).toFixed(2),
  },
  analystClaimed: { "0%": 9.82, "42%": 6.56, "78%": 4.33 },
  proposedFix_9a7340_vsNavy900: +contrast("#9a7340", T["navy-900"]).toFixed(2),
};

/* ============================================================ sanity: tokens the file claims */
out.tokenClaims = {
  "ink-faint vs paper (claims >=4.5)": +contrast(T["ink-faint"], T.paper).toFixed(2),
  "ink-faint vs paper-2": +contrast(T["ink-faint"], T["paper-2"]).toFixed(2),
  "control-border #6e7889 vs white (claims 3:1)": +contrast("#6e7889", "#ffffff").toFixed(2),
  "accent-text vs paper (claims 4.5)": +contrast(T["accent-text"], T.paper).toFixed(2),
  "on-ink-body #c3ccdd vs navy-900": +contrast("#c3ccdd", T["navy-900"]).toFixed(2),
  "gold-300 vs navy-900 (Watch pill? no, on navy800)": +contrast(T["gold-300"], T["navy-800"]).toFixed(2),
};

console.log(JSON.stringify(out, null, 2));
