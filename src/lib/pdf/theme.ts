import { Font } from "@react-pdf/renderer";

/**
 * The brand faces, served same-origin from /public/fonts so the CSP's
 * connect-src 'self' still holds and no request ever leaves the origin.
 *
 * Registration is idempotent and happens on first import of either document.
 */

export const SERIF = "CormorantGaramond";
export const SANS = "Mulish";
export const ENGRAVED = "Cinzel";

let registered = false;

export function registerBrandFonts() {
  if (registered) return;
  registered = true;

  Font.register({
    family: SERIF,
    fonts: [
      { src: "/fonts/CormorantGaramond-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/CormorantGaramond-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/CormorantGaramond-Italic.ttf", fontWeight: 400, fontStyle: "italic" },
    ],
  });

  Font.register({
    family: SANS,
    fonts: [
      { src: "/fonts/Mulish-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Mulish-SemiBold.ttf", fontWeight: 600 },
      { src: "/fonts/Mulish-Bold.ttf", fontWeight: 700 },
    ],
  });

  Font.register({
    family: ENGRAVED,
    fonts: [
      { src: "/fonts/Cinzel-Regular.ttf", fontWeight: 400 },
      { src: "/fonts/Cinzel-SemiBold.ttf", fontWeight: 600 },
    ],
  });

  // Keep long family-written words intact — no auto-hyphenation.
  Font.registerHyphenationCallback((word) => [word]);
}

/* --------------------------------------------------------------- palette */

export const NAVY = "#253551";
export const NAVY_DEEP = "#16223A";
export const GOLD = "#C9A063";
export const GOLD_DEEP = "#A87E45";
export const GOLD_TINT = "#F7EEDF";
export const INK = "#1F2735";
export const GRAY = "#5E6878";
export const FAINT = "#8A92A0";
export const LINE = "#D8D2C4";
export const DANGER = "#A64545";
export const CREAM = "#F4EFE6";

/** Note rules print at this value; anything lighter disappears on paper. */
export const RULE_ON_PAPER = "#C9C3B4";
