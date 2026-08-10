import type { CSSProperties } from "react";
import type { CardBlock, CardData } from "@/lib/cards/types";

/**
 * Faithful React port of the approved design export (CareCard.dc.html): the
 * same six zones — crop-box, spine, header, gold rule, body, footer — with the
 * export's exact px values inline. Inline styles on purpose: the capture
 * pipeline serializes this DOM into an SVG foreignObject, where document
 * stylesheets do not exist, so anything expressed as a class would silently
 * vanish from the PNG.
 *
 * Fonts are the one exception — they ride as CSS variables (set by
 * next/font in the root layout) because the family names are build-time
 * hashes. The capture path resolves and inlines them onto its clone; this
 * component never needs to know the real names.
 *
 * The card is a visual artifact, not a document: the root is one img-role
 * element with a spoken label, and the interior is hidden from the tree so a
 * screen reader is never marched through 40 absolutely-sized divs.
 */

export interface CareCardProps {
  card: CardData;
  /** Preview scale; at 1 the frame is exactly 1080x1920 for capture. */
  scale?: number;
  theme?: "ivory" | "navy";
}

const FONT_BODY = "var(--font-mulish), 'Helvetica Neue', Arial, sans-serif";
const FONT_ENGRAVED = "var(--font-cinzel), 'Trajan Pro', Georgia, serif";
const FONT_DISPLAY = "var(--font-cormorant), 'EB Garamond', Georgia, serif";

interface Surfaces {
  paper: string;
  ink: string;
  inkStrong: string;
  faint: string;
  hair: string;
  labelColor: string;
}

/** The export's renderVals() color mapping, as a pure function. */
export function cardSurfaces(card: CardData, theme: "ivory" | "navy"): Surfaces {
  const dark = theme === "navy";
  return {
    paper: dark ? "#16223A" : "#FBFAF6",
    ink: dark ? "rgba(243,241,234,.86)" : "#3A4456",
    inkStrong: dark ? "#FFFFFF" : "#1A2233",
    faint: dark ? "rgba(243,241,234,.42)" : "#8A92A0",
    hair: dark ? "rgba(243,241,234,.28)" : "#CFC7B4",
    labelColor: dark ? "#D9B97F" : card.deep || card.color,
  };
}

interface BlockStyle {
  labelColor: string;
  bg: string;
  leftBar: string;
  radius: string;
  pad: string;
}

/** Per-block styling — critical blocks get the tint panel and topic-color bar. */
export function blockStyle(
  block: CardBlock,
  card: CardData,
  theme: "ivory" | "navy",
  s: Surfaces
): BlockStyle {
  const dark = theme === "navy";
  const crit = block.tone === "critical";
  return {
    labelColor: crit && !dark ? card.deep || card.color : s.labelColor,
    bg: crit ? (dark ? "rgba(255,255,255,.07)" : card.tint || "#F4EFE6") : "transparent",
    leftBar: crit ? `8px solid ${card.color}` : "0",
    radius: crit ? "4px 10px 10px 4px" : "0",
    pad: crit ? "24px 28px 26px" : "0",
  };
}

export function CareCard({ card, scale = 1, theme = "ivory" }: CareCardProps) {
  const s = scale;
  const surf = cardSurfaces(card, theme);
  const color = card.color || "#253551";
  const title = [card.t1, card.t2].filter(Boolean).join(" ");
  // The export specifies overflow only as "same header, numbered", with no
  // continuation design of its own — so the page marker rides the header meta
  // line in that line's existing type style, and nothing else on the card
  // moves. The spoken label carries the same page so continuation cards are
  // distinguishable to a screen reader.
  const pageMarker =
    card.pageCount && card.pageCount > 1 ? `${card.pageIndex ?? 1} of ${card.pageCount}` : "";
  const metaLine = [card.personLine, pageMarker].filter(Boolean).join(" · ");
  const base = card.personLine ? `${title} care card for ${card.personLine}` : `${title} care card`;
  const label = pageMarker ? `${base}, page ${pageMarker}` : base;

  const cropStyle: CSSProperties = {
    width: Math.round(1080 * s),
    height: Math.round(1920 * s),
    overflow: "hidden",
    flex: "none",
    borderRadius: Math.max(4, Math.round(28 * s)),
    boxShadow: "0 2px 8px rgba(22,34,58,.10), 0 18px 44px rgba(22,34,58,.14)",
  };

  const frameStyle: CSSProperties = {
    width: 1080,
    height: 1920,
    transform: `scale(${s})`,
    transformOrigin: "top left",
    display: "flex",
    flexDirection: "row",
    overflow: "hidden",
    background: surf.paper,
    fontFamily: FONT_BODY,
    WebkitFontSmoothing: "antialiased",
  };

  return (
    <div role="img" aria-label={label} data-zone="crop" style={cropStyle}>
      <div aria-hidden="true" data-card-frame style={frameStyle}>
        {/* Spine.
            One deliberate deviation from the design export, everywhere white
            text sits on a topic color: the export faded these to 60-92%
            alpha, which lands below WCAG's 3:1 large-text floor on the
            lighter grounds (60% white on the medications gold measures
            2.09:1; even solid white only reaches 3.17:1 there). Solid white
            is the only value that passes on all seven grounds. */}
        <div
          data-zone="spine"
          style={{
            width: 64,
            flex: "none",
            background: color,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            padding: "56px 0",
          }}
        >
          <span
            style={{
              writingMode: "vertical-rl",
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: ".3em",
              textTransform: "uppercase",
              color: "#FFFFFF",
              whiteSpace: "nowrap",
              overflow: "hidden",
            }}
          >
            {card.spineLabel}
          </span>
        </div>

        <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
          {/* Header */}
          <div
            data-zone="header"
            style={{
              flex: "none",
              background: color,
              padding: "38px 58px 44px",
              display: "flex",
              alignItems: "flex-start",
              gap: 36,
            }}
          >
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{ display: "flex", alignItems: "center", gap: 18, marginBottom: 26 }}
              >
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 700,
                    letterSpacing: ".22em",
                    textTransform: "uppercase",
                    color: "#FFFFFF",
                  }}
                >
                  Care card
                </span>
                <span
                  style={{
                    width: 9,
                    height: 9,
                    background: "#E3C89B",
                    transform: "rotate(45deg)",
                    display: "inline-block",
                    flex: "none",
                  }}
                />
                <span
                  style={{
                    fontSize: 25,
                    fontWeight: 700,
                    letterSpacing: ".22em",
                    textTransform: "uppercase",
                    color: "#FFFFFF",
                  }}
                >
                  {metaLine}
                </span>
              </div>
              <div
                style={{
                  fontFamily: FONT_ENGRAVED,
                  fontWeight: 400,
                  fontSize: card.titleSize || 74,
                  lineHeight: 1.04,
                  letterSpacing: ".085em",
                  textTransform: "uppercase",
                  color: "#FFFFFF",
                }}
              >
                {card.t1}
              </div>
              {card.t2 ? (
                <div
                  style={{
                    fontFamily: FONT_ENGRAVED,
                    fontWeight: 400,
                    fontSize: card.titleSize || 74,
                    lineHeight: 1.04,
                    letterSpacing: ".085em",
                    textTransform: "uppercase",
                    color: "#FFFFFF",
                  }}
                >
                  {card.t2}
                </div>
              ) : null}
              <div
                style={{
                  marginTop: 24,
                  fontSize: 34,
                  lineHeight: 1.34,
                  color: "#FFFFFF",
                  maxWidth: 640,
                  textWrap: "pretty",
                }}
              >
                {card.purpose}
              </div>
            </div>
            <svg
              viewBox="0 0 24 24"
              width={112}
              height={112}
              fill="none"
              stroke="#FFFFFF"
              strokeWidth={1.4}
              strokeLinecap="round"
              strokeLinejoin="round"
              style={{ flex: "none", opacity: 0.55, marginTop: 6 }}
            >
              <path d={card.iconPath} />
            </svg>
          </div>

          {/* Gold rule */}
          <div
            data-zone="rule"
            style={{
              height: 5,
              flex: "none",
              background:
                "linear-gradient(90deg,#E3C89B 0%,#C9A063 42%,#A87E45 78%,#C9A063 100%)",
            }}
          />

          {/* Body */}
          <div
            data-zone="body"
            style={{
              flex: 1,
              minHeight: 0,
              padding: "42px 58px 28px",
              display: "flex",
              flexDirection: "column",
              gap: 26,
              background: surf.paper,
            }}
          >
            {card.person ? (
              <div style={{ display: "flex", gap: 34, alignItems: "center" }}>
                <div
                  style={{
                    width: 196,
                    height: 236,
                    flex: "none",
                    border: `2px dashed ${surf.hair}`,
                    borderRadius: 8,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    justifyContent: "flex-end",
                    overflow: "hidden",
                    gap: 6,
                    paddingBottom: 14,
                    color: surf.faint,
                    fontSize: 23,
                    letterSpacing: ".16em",
                    textTransform: "uppercase",
                    textAlign: "center",
                    lineHeight: 1.4,
                  }}
                >
                  {/* A soft head-and-shoulders silhouette behind the label:
                      the empty frame reads as a place a person belongs, not a
                      form field. Same faint tone as the caption, at photo
                      opacity. */}
                  <svg
                    aria-hidden="true"
                    viewBox="0 0 100 100"
                    style={{
                      width: 118,
                      height: 118,
                      flex: "none",
                      fill: surf.faint,
                      opacity: 0.38,
                      marginBottom: 2,
                    }}
                  >
                    <circle cx="50" cy="34" r="19" />
                    <path d="M50 58c-21 0-33 13-35 30a4 4 0 0 0 4 4h62a4 4 0 0 0 4-4C83 71 71 58 50 58Z" />
                  </svg>
                  <span>
                    Photo
                    <br />
                    optional
                  </span>
                </div>
                <div style={{ minWidth: 0 }}>
                  <div
                    style={{
                      fontFamily: FONT_DISPLAY,
                      fontWeight: 600,
                      fontSize: 70,
                      lineHeight: 1.06,
                      letterSpacing: "-.01em",
                      color: surf.inkStrong,
                    }}
                  >
                    {card.person.name}
                  </div>
                  {card.person.sub ? (
                    <div
                      style={{ marginTop: 16, fontSize: 38, lineHeight: 1.45, color: surf.ink }}
                    >
                      {card.person.sub}
                    </div>
                  ) : null}
                  {card.person.sub2 ? (
                    <div
                      style={{ marginTop: 6, fontSize: 38, lineHeight: 1.45, color: surf.ink }}
                    >
                      {card.person.sub2}
                    </div>
                  ) : null}
                </div>
              </div>
            ) : null}

            {card.blocks.map((b, bi) => {
              const bs = blockStyle(b, card, theme, surf);
              return (
                <div
                  key={bi}
                  // Pagination (lib/cards/paginate) measures each block by
                  // this handle; body children without it repeat on every page.
                  data-block-index={bi}
                  data-block-tone={b.tone ?? "plain"}
                  style={{
                    background: bs.bg,
                    borderLeft: bs.leftBar,
                    borderRadius: bs.radius,
                    padding: bs.pad,
                  }}
                >
                  <div
                    style={{
                      fontSize: 26,
                      fontWeight: 800,
                      letterSpacing: ".15em",
                      textTransform: "uppercase",
                      color: bs.labelColor,
                      marginBottom: 12,
                    }}
                  >
                    {b.label}
                  </div>
                  {b.lines.map((ln, li) => (
                    <div
                      key={li}
                      style={{
                        fontSize: 39,
                        lineHeight: 1.38,
                        color: surf.ink,
                        marginTop: li === 0 ? 0 : 10,
                        textWrap: "pretty",
                      }}
                    >
                      {ln.k ? (
                        <span style={{ fontWeight: 800, color: surf.inkStrong }}>{ln.k}</span>
                      ) : null}
                      {ln.v}
                    </div>
                  ))}
                </div>
              );
            })}
          </div>

          {/* Footer */}
          <div
            data-zone="footer"
            style={{
              flex: "none",
              background: color,
              padding: "26px 44px 26px 18px",
              display: "flex",
              alignItems: "center",
              gap: 18,
            }}
          >
            <span
              style={{
                fontSize: 32,
                lineHeight: 1,
                fontWeight: 700,
                letterSpacing: 0,
                color: "#FFFFFF",
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              myletterofintent.com
            </span>
            <span
              style={{
                flex: 1,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span
                style={{
                  width: 11,
                  height: 11,
                  background: "#E3C89B",
                  transform: "rotate(45deg)",
                  display: "inline-block",
                  flex: "none",
                }}
              />
            </span>
            <span
              style={{
                fontSize: 27,
                lineHeight: 1,
                color: "#FFFFFF",
                textAlign: "right",
                whiteSpace: "nowrap",
                flex: "none",
              }}
            >
              {card.footerMeta}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
