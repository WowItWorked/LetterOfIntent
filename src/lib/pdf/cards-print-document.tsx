/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { CardBlock, CardData } from "@/lib/cards/types";
import { SANS, SERIF, registerBrandFonts } from "./theme";

registerBrandFonts();

/**
 * The print-at-home format of the care cards: the same CardData the phone
 * PNGs are derived from (one derivation, two renderers — deciding content
 * twice would let the formats disagree), laid out on US Letter sheets.
 *
 * Geometry, from the approved spec in docs/output-matrix.md:
 * - Card faces at credit-card width in portrait — 2.55in × 4.53in, the 9:16
 *   face at wallet width — six per sheet (2 × 3) with crop marks.
 * - A 4×6in variant, one per sheet, for the fridge and the binder.
 * - The static "Which Cards To Send" index card ships on the final sheet.
 *
 * Type scales from the 1080px-wide phone face: body 39/1080 ≈ 3.6% of card
 * width ≈ 6.6pt at wallet size and 10.4pt at 4×6 — above the print floor at
 * reading distance, and the pocket format is a companion to the phone card,
 * not a replacement for it.
 */

const PT_PER_IN = 72;
const WALLET_W = 2.55 * PT_PER_IN;
const WALLET_H = 4.5333 * PT_PER_IN;
const BIG_W = 4 * PT_PER_IN;
const BIG_H = (4 * PT_PER_IN * 16) / 9;
const CROP = 10;

const s = StyleSheet.create({
  sheet: {
    padding: 28,
    fontFamily: SANS,
    alignItems: "center",
    justifyContent: "center",
  },
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
  },
  cell: { padding: CROP + 2 },
  sheetNote: {
    position: "absolute",
    bottom: 12,
    left: 0,
    right: 0,
    textAlign: "center",
    fontSize: 6.5,
    color: "#8A8F98",
  },
});

/** Percentage-of-width helper: the faces scale like the 1080px design. */
function pct(cardW: number, of1080: number): number {
  return (cardW * of1080) / 1080;
}

function CropMarks({ w, h }: { w: number; h: number }) {
  const line = { position: "absolute" as const, backgroundColor: "#B8BCC4" };
  const len = CROP - 2;
  return (
    <>
      {/* Four corners, two hairlines each — outside the trim box. */}
      <View style={{ ...line, top: CROP, left: 0, width: len, height: 0.6 }} />
      <View style={{ ...line, top: 0, left: CROP, width: 0.6, height: len }} />
      <View style={{ ...line, top: CROP, right: 0, width: len, height: 0.6 }} />
      <View style={{ ...line, top: 0, right: CROP, width: 0.6, height: len }} />
      <View style={{ ...line, bottom: CROP, left: 0, width: len, height: 0.6 }} />
      <View style={{ ...line, bottom: 0, left: CROP, width: 0.6, height: len }} />
      <View style={{ ...line, bottom: CROP, right: 0, width: len, height: 0.6 }} />
      <View style={{ ...line, bottom: 0, right: CROP, width: 0.6, height: len }} />
      {/* Keeps the cell's box exactly trim + crop margin. */}
      <View style={{ width: w + 2 * CROP, height: h + 2 * CROP, opacity: 0 }} />
    </>
  );
}

function BlockView({ block, w }: { block: CardBlock; w: number }) {
  const critical = block.tone === "critical";
  return (
    <View
      style={{
        marginBottom: pct(w, 26),
        ...(critical
          ? {
              backgroundColor: "#F1EDE4",
              borderLeftWidth: pct(w, 8),
              borderLeftColor: "#00000022",
              padding: pct(w, 22),
            }
          : {}),
      }}
      wrap={false}
    >
      <Text
        style={{
          fontFamily: SANS,
          fontWeight: 700,
          fontSize: pct(w, 26),
          letterSpacing: pct(w, 3),
          color: "#6A7180",
          marginBottom: pct(w, 8),
        }}
      >
        {block.label.toUpperCase()}
      </Text>
      {block.lines.map((ln, i) => (
        <Text
          key={i}
          style={{
            fontFamily: SANS,
            fontSize: pct(w, 34),
            lineHeight: 1.32,
            color: "#3A4456",
          }}
        >
          {ln.k ? (
            <Text style={{ fontWeight: 700, color: "#1A2233" }}>{ln.k}</Text>
          ) : null}
          {ln.v}
        </Text>
      ))}
    </View>
  );
}

/** One card face — header band, gold rule, blocks, footer — at width w. */
function CardFace({ card, w, h }: { card: CardData; w: number; h: number }) {
  const headerPad = pct(w, 40);
  return (
    <View
      style={{
        width: w,
        height: h,
        backgroundColor: "#FBFAF6",
        overflow: "hidden",
      }}
    >
      {/* Header in the topic color. */}
      <View style={{ backgroundColor: card.color, padding: headerPad }}>
        <Text
          style={{
            fontFamily: SANS,
            fontWeight: 700,
            fontSize: pct(w, 24),
            letterSpacing: pct(w, 4),
            color: "#FFFFFF",
          }}
        >
          CARE CARD{card.personLine ? ` ◆ ${card.personLine.toUpperCase()}` : ""}
        </Text>
        <Text
          style={{
            fontFamily: SERIF,
            fontWeight: 600,
            fontSize: pct(w, 58),
            color: "#FFFFFF",
            marginTop: pct(w, 10),
            lineHeight: 1.08,
          }}
        >
          {[card.t1, card.t2].filter(Boolean).join(" ")}
        </Text>
        <Text
          style={{
            fontFamily: SANS,
            fontSize: pct(w, 27),
            color: "#FFFFFF",
            marginTop: pct(w, 10),
            lineHeight: 1.3,
          }}
        >
          {card.purpose}
        </Text>
      </View>
      {/* Gold rule. */}
      <View style={{ height: pct(w, 5), backgroundColor: "#C9A45C" }} />
      {/* Body. */}
      <View style={{ padding: headerPad, flex: 1 }}>
        {card.blocks.map((b, i) => (
          <BlockView key={i} block={b} w={w} />
        ))}
      </View>
      {/* Footer in the topic color. */}
      <View
        style={{
          backgroundColor: card.color,
          paddingVertical: pct(w, 16),
          paddingHorizontal: headerPad,
          flexDirection: "row",
          justifyContent: "space-between",
        }}
      >
        <Text style={{ fontFamily: SANS, fontWeight: 700, fontSize: pct(w, 22), color: "#FFFFFF" }}>
          {card.footerMeta}
        </Text>
      </View>
    </View>
  );
}

export interface CardsPrintDocumentProps {
  /** Derived cards, in display order — page-sized cards, no pagination. */
  cards: CardData[];
  /** The static Which Cards To Send index card, as an image. */
  indexCard?: { dataUrl: string };
  /** "Bonnie" — for the sheet footer note. */
  personName?: string;
}

export function CardsPrintDocument({ cards, indexCard, personName }: CardsPrintDocumentProps) {
  const note = `Care cards${personName ? ` for ${personName}` : ""} · cut on the marks · printed from the Letter of Intent Builder`;

  // Six wallet cards per sheet.
  const sheets: CardData[][] = [];
  for (let i = 0; i < cards.length; i += 6) sheets.push(cards.slice(i, i + 6));

  return (
    <Document title="Care cards — print at home" language="en">
      {/* ------------------------------------------ wallet sheets, 2 × 3 */}
      {sheets.map((sheet, si) => (
        <Page key={`w-${si}`} size="LETTER" style={s.sheet}>
          <View style={s.grid}>
            {sheet.map((card) => (
              <View key={card.key} style={s.cell}>
                <View style={{ position: "relative" }}>
                  <CropMarks w={WALLET_W} h={WALLET_H} />
                  <View style={{ position: "absolute", top: CROP, left: CROP }}>
                    <CardFace card={card} w={WALLET_W} h={WALLET_H} />
                  </View>
                </View>
              </View>
            ))}
          </View>
          <Text style={s.sheetNote}>{note}</Text>
        </Page>
      ))}

      {/* --------------------------------------------- 4×6 fridge variant */}
      {cards.map((card) => (
        <Page key={`b-${card.key}`} size="LETTER" style={s.sheet}>
          <View style={{ position: "relative" }}>
            <CropMarks w={BIG_W} h={BIG_H} />
            <View style={{ position: "absolute", top: CROP, left: CROP }}>
              <CardFace card={card} w={BIG_W} h={BIG_H} />
            </View>
          </View>
          <Text style={s.sheetNote}>{note} · 4×6 — for the fridge or the binder</Text>
        </Page>
      ))}

      {/* ------------------------------------- the index card, final sheet */}
      {indexCard ? (
        <Page size="LETTER" style={s.sheet}>
          <View style={{ position: "relative" }}>
            <CropMarks w={BIG_W} h={BIG_H} />
            <View style={{ position: "absolute", top: CROP, left: CROP }}>
              <Image src={indexCard.dataUrl} style={{ width: BIG_W, height: BIG_H }} />
            </View>
          </View>
          <Text style={s.sheetNote}>
            Which Cards To Send — the index card, the same in every pack
          </Text>
        </Page>
      ) : null}
    </Document>
  );
}
