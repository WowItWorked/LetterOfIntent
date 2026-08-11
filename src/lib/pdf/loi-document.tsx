/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { Style } from "@react-pdf/types";
import type { ReactNode } from "react";
import { firm } from "@/config/firm";
import { sectionsForMeta } from "@/lib/content/config";
import type { FieldDef, RepeaterItemField, SectionDef } from "@/lib/content/types";
import {
  fieldHasContent,
  fillName,
  formatDateLong,
  formatItemValue,
  itemHasContent,
  keyPoints,
  keyPointsHaveContent,
  letterDateIso,
  readerName,
  sectionHasContent,
} from "@/lib/derive";
import type { LetterData, LetterMeta } from "@/lib/schema";
import {
  CREAM,
  DANGER,
  ENGRAVED,
  FAINT,
  GOLD,
  GOLD_DEEP,
  GOLD_TINT,
  GRAY,
  INK,
  LINE,
  NAVY,
  NAVY_DEEP,
  RULE_ON_PAPER,
  SANS,
  SERIF,
  registerBrandFonts,
} from "./theme";

registerBrandFonts();

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingHorizontal: 64,
    paddingBottom: 78,
    fontFamily: SERIF,
    fontSize: 12,
    lineHeight: 1.5,
    color: INK,
  },
  coverPage: {
    padding: 64,
    fontFamily: SERIF,
    color: INK,
    display: "flex",
    flexDirection: "column",
  },
  footer: {
    position: "absolute",
    bottom: 26,
    left: 64,
    right: 64,
    borderTopWidth: 0.75,
    borderTopColor: LINE,
    paddingTop: 6,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
  footerText: {
    fontFamily: SANS,
    fontSize: 7.5,
    color: GRAY,
    flex: 1,
    marginRight: 14,
    lineHeight: 1.35,
  },
  footerPage: { fontFamily: SANS, fontSize: 7.5, color: GRAY },

  /* Cinzel only at 9pt and above; everything smaller is Mulish bold caps. */
  sectionEyebrow: {
    fontFamily: ENGRAVED,
    fontSize: 9,
    fontWeight: 600,
    letterSpacing: 1.6,
    color: GOLD_DEEP,
  },
  sectionTitle: { fontFamily: SERIF, fontWeight: 600, fontSize: 22, color: NAVY, marginTop: 4 },
  sectionRule: { width: 56, height: 2, backgroundColor: GOLD, marginTop: 7, marginBottom: 16 },

  fieldBlock: { marginBottom: 13 },
  fieldLabel: {
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 0.9,
    color: GRAY,
    marginBottom: 3,
  },
  value: { fontSize: 12, lineHeight: 1.5 },
  valueGap: { height: 5 },

  itemCard: {
    borderWidth: 0.75,
    borderColor: LINE,
    borderRadius: 3,
    padding: 10,
    marginBottom: 7,
  },
  itemTitle: { fontFamily: SERIF, fontWeight: 600, fontSize: 12.5 },
  itemLine: { fontSize: 11, lineHeight: 1.45, marginTop: 1.5 },
  itemTag: {
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: 7.5,
    color: GOLD_DEEP,
    letterSpacing: 0.8,
    marginTop: 3.5,
  },

  noteBox: {
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: GOLD_TINT,
    padding: 10,
    marginBottom: 14,
  },
  noteBoxText: { fontSize: 11, lineHeight: 1.5, color: INK },

  notesArea: { marginTop: 14 },
  notesLine: { borderBottomWidth: 0.75, borderBottomColor: RULE_ON_PAPER, height: 22 },

  tocRow: { flexDirection: "row", alignItems: "flex-end", marginBottom: 9 },
  tocNumber: { fontFamily: SANS, fontSize: 9, color: FAINT, width: 22 },
  tocTitle: { fontSize: 13 },
  tocLeader: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
    borderBottomStyle: "dotted",
    marginHorizontal: 6,
    marginBottom: 2.5,
  },
  tocPage: { fontFamily: SANS, fontSize: 10, color: GRAY },

  howToPara: { fontSize: 12.5, lineHeight: 1.55, marginBottom: 10 },
  howToBullet: { flexDirection: "row", marginBottom: 8 },
  howToDot: { width: 14, fontSize: 12.5, color: GOLD_DEEP },
  howToBulletText: { flex: 1, fontSize: 12.5, lineHeight: 1.5 },

  /* -------------------------------------------- key points at a glance */
  callBand: { backgroundColor: NAVY_DEEP, padding: 14, marginBottom: 16 },
  callBandLabel: {
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: 8,
    letterSpacing: 1.2,
    color: GOLD,
    marginBottom: 6,
  },
  callBandLine: { fontFamily: SANS, fontSize: 10.5, color: "#F6F4EE", marginBottom: 2.5 },

  pointBox: {
    borderWidth: 0.75,
    borderColor: LINE,
    borderLeftWidth: 3,
    borderLeftColor: GOLD,
    backgroundColor: CREAM,
    padding: 11,
    marginBottom: 10,
  },
  pointBoxWarn: { borderColor: DANGER, borderLeftColor: DANGER, backgroundColor: "#F6E9E7" },
  pointTitle: { fontFamily: SERIF, fontWeight: 600, fontSize: 14, color: NAVY },
  pointSource: {
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 0.8,
    color: GRAY,
    marginTop: 2,
    marginBottom: 5,
  },
  pointText: { fontSize: 11.5, lineHeight: 1.5 },

  neverBox: { borderWidth: 1, borderColor: GOLD, padding: 12, marginTop: 4 },

  photoCaption: {
    fontFamily: SANS,
    fontSize: 8.5,
    color: GRAY,
    marginTop: 5,
    textAlign: "center",
  },
});

export interface LoadedImage {
  dataUrl: string;
  /** Intrinsic width / height — measured, so nothing is stretched. */
  aspect: number;
}

export interface LoiDocumentProps {
  data: LetterData;
  /** The letter's routing answers — they decide which sections print. */
  meta?: LetterMeta;
  /** Firm monogram with its measured aspect ratio, if it loaded. */
  logo?: LoadedImage;
  /** The tool's own lockup, shown on the cover. */
  appLogo?: LoadedImage;
  /** The family photo, with its caption. */
  familyPhoto?: LoadedImage & { caption?: string };
  /** Pass 1: section key → first page number gets recorded here. */
  registry: Record<string, number> | null;
  /** Pass 2: the recorded map, used to print TOC page numbers. */
  toc: Record<string, number> | null;
}

export function LoiDocument({
  data,
  meta = {},
  logo,
  appLogo,
  familyPhoto,
  registry,
  toc,
}: LoiDocumentProps) {
  const name = readerName(data);
  const fullName = data.gettingStarted?.subjectFullName?.trim() || name;
  const author = data.gettingStarted?.authorName?.trim();
  const relationship = data.gettingStarted?.authorRelationship?.trim();
  const dateLong = formatDateLong(letterDateIso(data)) ?? letterDateIso(data);
  // The letter prints every in-play section that holds content — one roster,
  // gated by the letter's own answers, content always winning (config.ts).
  const included = sectionsForMeta(meta, data).filter((def) => sectionHasContent(data, def));
  const numberOf = new Map(included.map((def, i) => [def.key, i + 1]));

  const points = keyPoints(data);
  const showKeyPoints = keyPointsHaveContent(points);

  const footerLine = `This Letter of Intent is not a legal document and is not legally binding. It is intended to guide those who care for ${name}. Last updated ${dateLong}.`;

  const hasBehavior = included.some((def) => def.key === "behavior");
  const firstWeekPointer = `If you are new to ${name}, start with "${
    included.find((d) => d.key === "routine")?.navTitle.includes("week")
      ? "A typical week"
      : "A typical day"
  }" and "Communication." They will carry you through the first week.`;
  const crisisPointer = hasBehavior
    ? `In a crisis, go straight to "Health and medical" and "Behavioral support." There is also a separate one-page emergency sheet that pairs with this letter — keep copies where sitters, school, and the ER can grab them.`
    : `In a crisis, go straight to "Health and medical." There is also a separate one-page emergency sheet that pairs with this letter — keep copies where family and the hospital can grab them.`;

  return (
    <Document
      title={`Letter of Intent — ${fullName}`}
      author={author ?? "Prepared with the Letter of Intent Builder"}
      creator={`Letter of Intent Builder — ${firm.name}`}
      producer={firm.name}
      // Sets the catalog /Lang. Without it a screen reader guesses, and may
      // read an English letter in whatever voice the reader's system defaults
      // to — veraPDF counted 198 failed checks on this document for the
      // missing declaration alone. This does NOT make the file tagged; that is
      // a separate and much larger job. It is simply the highest-value line
      // available in this pipeline.
      language="en"
    >
      {/* ------------------------------------------------------------ cover */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={{ alignItems: "center" }}>
          {appLogo ? (
            <Image src={appLogo.dataUrl} style={{ width: 230, height: 230 / appLogo.aspect }} />
          ) : (
            <Text
              style={{
                fontFamily: ENGRAVED,
                fontWeight: 600,
                fontSize: 11,
                letterSpacing: 3.2,
                color: GOLD_DEEP,
              }}
            >
              MY LETTER OF INTENT
            </Text>
          )}
        </View>

        <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <Text
            style={{
              fontFamily: ENGRAVED,
              fontWeight: 600,
              fontSize: 11,
              letterSpacing: 3.2,
              color: GOLD_DEEP,
            }}
          >
            A LETTER OF INTENT FOR
          </Text>
          <Text
            style={{
              fontFamily: SERIF,
              fontWeight: 600,
              fontSize: 36,
              color: NAVY,
              marginTop: 14,
              textAlign: "center",
            }}
          >
            {fullName}
          </Text>
          <View style={{ width: 72, height: 2.5, backgroundColor: GOLD, marginTop: 18 }} />
          {author ? (
            <Text
              style={{
                fontFamily: SERIF,
                fontStyle: "italic",
                fontSize: 14,
                marginTop: 20,
              }}
            >
              Written by {author}
              {relationship ? ` — ${relationship}` : ""}
            </Text>
          ) : null}
          <View
            style={{
              borderWidth: 1,
              borderColor: GOLD,
              paddingVertical: 8,
              paddingHorizontal: 22,
              marginTop: 26,
            }}
          >
            <Text
              style={{
                fontFamily: SANS,
                fontWeight: 700,
                fontSize: 9.5,
                letterSpacing: 1.4,
                color: INK,
              }}
            >
              LAST UPDATED — {dateLong.toUpperCase()}
            </Text>
          </View>
        </View>

        <View style={{ alignItems: "center" }}>
          <View style={{ flexDirection: "row", alignItems: "center", marginBottom: 10 }}>
            {logo ? (
              <Image
                src={logo.dataUrl}
                style={{ height: 22, width: 22 * logo.aspect, marginRight: 7 }}
              />
            ) : null}
            <Text
              style={{ fontFamily: SANS, fontSize: 8.5, letterSpacing: 1.8, color: GRAY }}
            >
              {firm.name.toUpperCase()}
            </Text>
          </View>
          <Text
            style={{
              fontFamily: SANS,
              fontSize: 7.5,
              color: GRAY,
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 420,
            }}
          >
            {firm.disclaimerShort}
          </Text>
          <Text style={{ fontFamily: SANS, fontSize: 7.5, color: FAINT, marginTop: 8 }}>
            Created with the free Letter of Intent Builder · {firm.appUrlLabel}
          </Text>
        </View>
      </Page>

      {/* ----------------------------------------------------- how to use */}
      <Page size="LETTER" style={s.page}>
        <PdfFooter line={footerLine} />
        <Text style={s.sectionEyebrow}>TO THE READER</Text>
        <Text style={s.sectionTitle}>How to use this letter</Text>
        <View style={s.sectionRule} />
        <Text style={s.howToPara}>
          You are reading this because someone trusted you with the care of {name}.
          {author ? ` ${author} wrote it` : " It was written"} to hand you what a family
          learns over a lifetime — so you don&apos;t have to relearn it the hard way.
        </Text>
        {[
          "Nothing here is legally binding. This letter informs your judgment; it doesn't replace it — or any court order, care plan, or trust document.",
          firstWeekPointer,
          crisisPointer,
          "Check the date on the cover. Routines, medications, and contacts drift. If this letter is more than a year old, verify the medical details before relying on them.",
          "No Social Security, account, or policy numbers appear in this letter, on purpose. It says where those are kept instead.",
          "The ruled lines at the end of each section are for you. Write on this document — it is meant to be used, not preserved.",
        ].map((b, i) => (
          <View key={i} style={s.howToBullet}>
            <Text style={s.howToDot}>◆</Text>
            <Text style={s.howToBulletText}>{b}</Text>
          </View>
        ))}
        <Text
          style={{ ...s.howToPara, fontFamily: SERIF, fontStyle: "italic", marginTop: 8 }}
        >
          Thank you for caring for {name}.
        </Text>
      </Page>

      {/* ------------------------------------------------------- contents */}
      {included.length > 0 ? (
        <Page size="LETTER" style={s.page}>
          <PdfFooter line={footerLine} />
          <Text style={s.sectionEyebrow}>CONTENTS</Text>
          <Text style={s.sectionTitle}>What&apos;s in this letter</Text>
          <View style={s.sectionRule} />
          {included.map((def) => (
            <View key={def.slug} style={s.tocRow}>
              <Text style={s.tocNumber}>{numberOf.get(def.key)}</Text>
              <Text style={s.tocTitle}>{fillName(def.title, name)}</Text>
              <View style={s.tocLeader} />
              <Text style={s.tocPage}>{toc?.[def.key] ?? " "}</Text>
            </View>
          ))}
        </Page>
      ) : null}

      {/* --------------------------------------------- key points (page 4) */}
      {showKeyPoints ? (
        <Page size="LETTER" style={s.page}>
          <PdfFooter line={footerLine} />
          <Text style={s.sectionEyebrow}>IF YOU READ ONE PAGE</Text>
          <Text style={s.sectionTitle}>Key points at a glance</Text>
          <View style={s.sectionRule} />

          {points.callOrder.length > 0 ? (
            <View style={s.callBand}>
              <Text style={s.callBandLabel}>CALL IN THIS ORDER</Text>
              {points.callOrder.map((line, i) => (
                <Text key={i} style={s.callBandLine}>
                  {i + 1}. {line}
                </Text>
              ))}
            </View>
          ) : null}

          {points.points.map((p) => (
            <View
              key={p.title}
              style={p.warning ? { ...s.pointBox, ...s.pointBoxWarn } : s.pointBox}
              wrap={false}
            >
              <Text style={s.pointTitle}>{p.title}</Text>
              <Text style={s.pointSource}>FROM “{p.source.toUpperCase()}”</Text>
              <MultilineValue text={p.text} style={s.pointText} />
            </View>
          ))}

          {/* Two distinct boxes on purpose: "never change" (the caregiver's
              ask) and "hard limits" (housing red lines) are different
              questions — the old build piped both into one slot, which was a
              bug, not a merge. */}
          {points.neverChange ? (
            <View style={s.neverBox} wrap={false}>
              <Text style={s.pointTitle}>What we ask never to be changed</Text>
              <Text style={s.pointSource}>FROM “FOR WHOEVER STEPS IN”</Text>
              <MultilineValue text={points.neverChange} style={s.pointText} />
            </View>
          ) : null}
          {points.hardLimits ? (
            <View style={s.neverBox} wrap={false}>
              <Text style={s.pointTitle}>Living situations we would not want</Text>
              <Text style={s.pointSource}>FROM “HOME AND DAILY LIVING”</Text>
              <MultilineValue text={points.hardLimits} style={s.pointText} />
            </View>
          ) : null}

          <Text
            style={{ fontFamily: SANS, fontSize: 8.5, color: GRAY, marginTop: 12, lineHeight: 1.5 }}
          >
            Every point above is a summary. The full answer, in the family&apos;s own
            words, is in the section named beneath each heading.
          </Text>
        </Page>
      ) : null}

      {/* ------------------------------------------------------- sections */}
      {included.map((def) => (
        <SectionPage
          key={def.slug}
          def={def}
          number={numberOf.get(def.key) ?? 1}
          data={data}
          name={name}
          registry={registry}
          footerLine={footerLine}
          familyPhoto={def.photoSlot ? familyPhoto : undefined}
        />
      ))}
    </Document>
  );
}

/* ------------------------------------------------------------------ pieces */

function PdfFooter({ line }: { line: string }) {
  return (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{line}</Text>
      <Text
        style={s.footerPage}
        render={({ pageNumber, totalPages }) => `Page ${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

function SectionPage({
  def,
  number,
  data,
  name,
  registry,
  footerLine,
  familyPhoto,
}: {
  def: SectionDef;
  number: number;
  data: LetterData;
  name: string;
  registry: Record<string, number> | null;
  footerLine: string;
  familyPhoto?: LoadedImage & { caption?: string };
}) {
  const values = (data[def.key] ?? {}) as Record<string, unknown>;
  const filled = def.fields.filter((f) => fieldHasContent(values, f));

  return (
    <Page size="LETTER" style={s.page}>
      <PdfFooter line={footerLine} />
      <View minPresenceAhead={90}>
        <Text
          style={s.sectionEyebrow}
          render={({ pageNumber }) => {
            // Deliberate side channel: pass 1 records where each section
            // lands so pass 2 can print TOC page numbers (see generate.tsx).
            // eslint-disable-next-line react-hooks/immutability
            if (registry) registry[def.key] = pageNumber;
            return `SECTION ${number}`;
          }}
        />
        <Text style={s.sectionTitle}>{fillName(def.title, name)}</Text>
        <View style={s.sectionRule} />
      </View>

      {def.key === "moneyBenefits" ? (
        <View style={s.noteBox}>
          <Text style={s.noteBoxText}>
            On purpose, this letter contains no Social Security, account, or policy
            numbers. The entries in this section say where the family keeps them.
          </Text>
        </View>
      ) : null}

      {familyPhoto ? (
        <View style={{ alignItems: "center", marginBottom: 16 }} wrap={false}>
          <Image
            src={familyPhoto.dataUrl}
            style={{ width: 240, height: 240 / familyPhoto.aspect }}
          />
          {familyPhoto.caption ? (
            <Text style={s.photoCaption}>{familyPhoto.caption}</Text>
          ) : null}
        </View>
      ) : null}

      {filled.map((field) => (
        <PdfField key={field.id} field={field} values={values} name={name} />
      ))}

      <View style={s.notesArea} wrap={false}>
        <Text style={s.fieldLabel}>NOTES — FOR HANDWRITTEN ADDITIONS</Text>
        {[0, 1, 2, 3, 4].map((i) => (
          <View key={i} style={s.notesLine} />
        ))}
      </View>
    </Page>
  );
}

function PdfField({
  field,
  values,
  name,
}: {
  field: FieldDef;
  values: Record<string, unknown>;
  name: string;
}) {
  const label = fillName(field.label, name).toUpperCase();

  if (field.kind === "repeater") {
    const items = (values[field.id] as Array<Record<string, unknown>>).filter((it) =>
      itemHasContent(it)
    );
    return (
      <View style={s.fieldBlock}>
        <Text style={s.fieldLabel}>{label}</Text>
        {items.map((item, i) => (
          <RepeaterCard key={i} item={item} itemFields={field.itemFields} name={name} />
        ))}
      </View>
    );
  }

  const raw = String(values[field.id] ?? "").trim();
  if (field.kind === "date") {
    return (
      <View style={s.fieldBlock} wrap={false}>
        <Text style={s.fieldLabel}>{label}</Text>
        <Text style={s.value}>{formatDateLong(raw) ?? raw}</Text>
      </View>
    );
  }

  return (
    <View style={s.fieldBlock}>
      <Text style={s.fieldLabel}>{label}</Text>
      <MultilineValue text={raw} />
    </View>
  );
}

/** Preserves the writer's line breaks; blank lines become paragraph gaps. */
function MultilineValue({ text, style }: { text: string; style?: Style }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line.trim() === "") {
      if (i > 0 && i < lines.length - 1)
        nodes.push(<View key={`gap-${i}`} style={s.valueGap} />);
    } else {
      nodes.push(
        <Text key={i} style={style ?? s.value}>
          {line}
        </Text>
      );
    }
  });
  return <View>{nodes}</View>;
}

function RepeaterCard({
  item,
  itemFields,
  name,
}: {
  item: Record<string, unknown>;
  itemFields: RepeaterItemField[];
  name: string;
}) {
  const textFields = itemFields.filter((f) => f.kind !== "checkbox");
  const first = textFields.find((f) => formatItemValue(f, item[f.id]) !== "");
  const rest = textFields.filter(
    (f) => f !== first && formatItemValue(f, item[f.id]) !== ""
  );
  const tags = itemFields.filter((f) => f.kind === "checkbox" && item[f.id] === true);

  return (
    <View style={s.itemCard} wrap={false}>
      {first ? (
        <Text style={s.itemTitle}>{formatItemValue(first, item[first.id])}</Text>
      ) : null}
      {rest.map((f) => (
        <Text key={f.id} style={s.itemLine}>
          <Text style={{ fontFamily: SANS, fontWeight: 700, fontSize: 8, color: GRAY }}>
            {`${fillName(f.label, name).toUpperCase()}  `}
          </Text>
          {formatItemValue(f, item[f.id])}
        </Text>
      ))}
      {tags.map((f) => (
        <Text key={f.id} style={s.itemTag}>
          ◆ {fillName(f.label, name).replace(/( — |: ).*/, "").toUpperCase()}
        </Text>
      ))}
    </View>
  );
}
