// V3 — independent WCAG contrast + grayscale recomputation. READ-ONLY.
const hex = (h) => {
  h = h.replace("#", "");
  return [0, 2, 4].map((i) => parseInt(h.slice(i, i + 2), 16));
};
const lin = (v) => {
  const c = v / 255;
  return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
};
const L = (h) => {
  const [r, g, b] = hex(h);
  return 0.2126 * lin(r) + 0.7152 * lin(g) + 0.0722 * lin(b);
};
const ratio = (a, b) => {
  const la = L(a), lb = L(b);
  const hi = Math.max(la, lb), lo = Math.min(la, lb);
  return (hi + 0.05) / (lo + 0.05);
};
const gray601 = (h) => { const [r, g, b] = hex(h); return Math.round(0.299 * r + 0.587 * g + 0.114 * b); };
const gray709 = (h) => { const [r, g, b] = hex(h); return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b); };
const grayLumSRGB = (h) => Math.round(255 * Math.pow(L(h), 1 / 2.2));

const pairs = [
  ["INK #1F2735 on white (body 12pt)", "#1F2735", "#FFFFFF", 4.5],
  ["NAVY #253551 on white (title 22pt)", "#253551", "#FFFFFF", 3.0],
  ["GRAY #5E6878 on white (footer 7.5pt)", "#5E6878", "#FFFFFF", 4.5],
  ["GRAY #5E6878 on CREAM #F4EFE6 (pointSource 7.5pt)", "#5E6878", "#F4EFE6", 4.5],
  ["GRAY #5E6878 on warn #F6E9E7", "#5E6878", "#F6E9E7", 4.5],
  ["GRAY #5E6878 on protocol #faf5ea (EMERG protocol TITLE, 7.5pt)", "#5E6878", "#faf5ea", 4.5],
  ["GRAY #5E6878 on GOLD_TINT #F7EEDF", "#5E6878", "#F7EEDF", 4.5],
  ["FAINT #8A92A0 on white (TOC number 9pt)", "#8A92A0", "#FFFFFF", 4.5],
  ["FAINT #8A92A0 on white (cover credit 7.5pt)", "#8A92A0", "#FFFFFF", 4.5],
  ["GOLD_DEEP #A87E45 on white (eyebrow 9pt)", "#A87E45", "#FFFFFF", 4.5],
  ["GOLD_DEEP #A87E45 on white (itemTag 7.5pt)", "#A87E45", "#FFFFFF", 4.5],
  ["GOLD_DEEP #A87E45 on white (cover 11pt caps)", "#A87E45", "#FFFFFF", 4.5],
  ["GOLD_DEEP #A87E45 on protocol #faf5ea", "#A87E45", "#faf5ea", 4.5],
  ["RED #a64545 on white (ALLERGIES title 7.5pt)", "#a64545", "#FFFFFF", 4.5],
  ["headerRight #e8e4d8 on NAVY (8pt)", "#e8e4d8", "#253551", 4.5],
  ["headerTitle white on NAVY (15pt)", "#FFFFFF", "#253551", 4.5],
  ["callBandLabel GOLD #C9A063 on NAVY_DEEP #16223A (8pt)", "#C9A063", "#16223A", 4.5],
  ["callBandLine #F6F4EE on NAVY_DEEP (10.5pt)", "#F6F4EE", "#16223A", 4.5],
  ["medDetail #39424f on white (8.5pt)", "#39424f", "#FFFFFF", 4.5],
  ["GRAY on white 9pt (photoText 7pt / idLabel)", "#5E6878", "#FFFFFF", 4.5],
];
console.log("PAIR".padEnd(64), "RATIO", " NEED", " VERDICT");
for (const [label, fg, bg, need] of pairs) {
  const r = ratio(fg, bg);
  console.log(label.padEnd(64), r.toFixed(2).padStart(6), String(need).padStart(5), r >= need ? "  pass" : "  FAIL");
}
console.log("\nGRAYSCALE (0=black,255=white)");
console.log("HEX".padEnd(12), "Rec601", "Rec709", "sRGB-lum-gamma");
for (const h of ["#F4EFE6", "#F7EEDF", "#F6E9E7", "#faf5ea", "#FFFFFF", "#A64545", "#D8D2C4", "#C9A063", "#253551", "#C9C3B4", "#8A92A0", "#A87E45", "#5E6878", "#1F2735"]) {
  console.log(h.padEnd(12), String(gray601(h)).padStart(6), String(gray709(h)).padStart(6), String(grayLumSRGB(h)).padStart(14));
}
