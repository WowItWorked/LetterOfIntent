/* eslint-disable jsx-a11y/alt-text */
import { Document, Font, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { firm } from "@/config/firm";
import { sectionDefs } from "@/lib/content/sections";
import type { FieldDef, RepeaterItemField, SectionDef } from "@/lib/content/types";
import {
  fieldHasContent,
  fillName,
  formatDateLong,
  itemHasContent,
  letterDateIso,
  readerName,
  sectionHasContent,
} from "@/lib/derive";
import type { LetterData } from "@/lib/schema";

// Keep long family-written words intact — no auto-hyphenation.
Font.registerHyphenationCallback((word) => [word]);

const NAVY = firm.brand.navy;
const GOLD = firm.brand.gold;
const GOLD_DEEP = firm.brand.goldDeep;
const INK = "#1f2735";
const GRAY = "#5e6878";
const FAINT = "#8a92a0";
const LINE = "#d8d2c4";

const s = StyleSheet.create({
  page: {
    paddingTop: 56,
    paddingHorizontal: 64,
    paddingBottom: 78,
    fontFamily: "Times-Roman",
    fontSize: 11,
    lineHeight: 1.5,
    color: INK,
  },
  coverPage: {
    padding: 64,
    fontFamily: "Times-Roman",
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
    fontFamily: "Helvetica",
    fontSize: 7.5,
    color: GRAY,
    flex: 1,
    marginRight: 14,
    lineHeight: 1.35,
  },
  footerPage: { fontFamily: "Helvetica", fontSize: 7.5, color: GRAY },

  sectionEyebrow: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 1.4,
    color: GOLD_DEEP,
  },
  sectionTitle: { fontFamily: "Times-Bold", fontSize: 20, color: NAVY, marginTop: 3 },
  sectionRule: { width: 56, height: 2, backgroundColor: GOLD, marginTop: 7, marginBottom: 16 },

  fieldBlock: { marginBottom: 13 },
  fieldLabel: {
    fontFamily: "Helvetica-Bold",
    fontSize: 8,
    letterSpacing: 0.9,
    color: GRAY,
    marginBottom: 3,
  },
  value: { fontSize: 11, lineHeight: 1.55 },
  valueGap: { height: 5 },

  itemCard: {
    borderWidth: 0.75,
    borderColor: LINE,
    borderRadius: 3,
    padding: 10,
    marginBottom: 7,
  },
  itemTitle: { fontFamily: "Times-Bold", fontSize: 11.5 },
  itemLine: { fontSize: 10.5, lineHeight: 1.45, marginTop: 1.5 },
  itemTag: {
    fontFamily: "Helvetica-Bold",
    fontSize: 7.5,
    color: GOLD_DEEP,
    letterSpacing: 0.8,
    marginTop: 3.5,
  },

  noteBox: {
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: "#faf5ea",
    padding: 10,
    marginBottom: 14,
  },
  noteBoxText: { fontSize: 10, lineHeight: 1.5, color: INK },

  notesArea: { marginTop: 14 },
  notesLine: { borderBottomWidth: 0.75, borderBottomColor: "#c9c3b4", height: 22 },

  tocRow: {
    flexDirection: "row",
    alignItems: "flex-end",
    marginBottom: 9,
  },
  tocNumber: {
    fontFamily: "Helvetica",
    fontSize: 9,
    color: FAINT,
    width: 22,
  },
  tocTitle: { fontSize: 12 },
  tocLeader: {
    flex: 1,
    borderBottomWidth: 0.75,
    borderBottomColor: LINE,
    borderBottomStyle: "dotted",
    marginHorizontal: 6,
    marginBottom: 2.5,
  },
  tocPage: { fontFamily: "Helvetica", fontSize: 10, color: GRAY },

  howToPara: { fontSize: 11.5, lineHeight: 1.6, marginBottom: 10 },
  howToBullet: { flexDirection: "row", marginBottom: 8 },
  howToDot: { width: 14, fontSize: 11.5, color: GOLD_DEEP },
  howToBulletText: { flex: 1, fontSize: 11.5, lineHeight: 1.55 },
});

export interface LoiDocumentProps {
  data: LetterData;
  /** Firm logo with its measured aspect ratio, if it loaded. */
  logo?: { dataUrl: string; aspect: number };
  /** Pass 1: section key → first page number gets recorded here. */
  registry: Record<string, number> | null;
  /** Pass 2: the recorded map, used to print TOC page numbers. */
  toc: Record<string, number> | null;
}

export function LoiDocument({ data, logo, registry, toc }: LoiDocumentProps) {
  const name = readerName(data);
  const fullName = data.gettingStarted?.subjectFullName?.trim() || name;
  const author = data.gettingStarted?.authorName?.trim();
  const relationship = data.gettingStarted?.authorRelationship?.trim();
  const dateLong = formatDateLong(letterDateIso(data)) ?? letterDateIso(data);
  const included = sectionDefs.filter((def) => sectionHasContent(data, def));

  const footerLine = `This Letter of Intent is not a legal document and is not legally binding. It is intended to guide those who care for ${name}. Last updated ${dateLong}.`;

  return (
    <Document
      title={`Letter of Intent — ${fullName}`}
      author={author ?? "Prepared with the Letter of Intent Builder"}
      creator={`Letter of Intent Builder — ${firm.name}`}
      producer={firm.name}
    >
      {/* ------------------------------------------------------------ cover */}
      <Page size="LETTER" style={s.coverPage}>
        <View style={{ alignItems: "center" }}>
          {logo ? (
            // Height-led sizing at the mark's true aspect — never stretched.
            <Image
              src={logo.dataUrl}
              style={{ height: 56, width: 56 * logo.aspect, marginBottom: 12 }}
            />
          ) : null}
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 9,
              letterSpacing: 2.2,
              color: GRAY,
            }}
          >
            {firm.name.toUpperCase()}
          </Text>
        </View>

        <View style={{ flexGrow: 1, justifyContent: "center", alignItems: "center" }}>
          <Text
            style={{
              fontFamily: "Helvetica-Bold",
              fontSize: 11,
              letterSpacing: 3.2,
              color: GOLD_DEEP,
            }}
          >
            LETTER OF INTENT
          </Text>
          <Text
            style={{
              fontFamily: "Times-Bold",
              fontSize: 34,
              color: NAVY,
              marginTop: 14,
              textAlign: "center",
            }}
          >
            {fullName}
          </Text>
          <View style={{ width: 72, height: 2.5, backgroundColor: GOLD, marginTop: 18 }} />
          {author ? (
            <Text style={{ fontFamily: "Times-Italic", fontSize: 13, marginTop: 20 }}>
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
                fontFamily: "Helvetica-Bold",
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
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 7.5,
              color: GRAY,
              textAlign: "center",
              lineHeight: 1.5,
              maxWidth: 420,
            }}
          >
            {firm.disclaimerShort}
          </Text>
          <Text
            style={{
              fontFamily: "Helvetica",
              fontSize: 7.5,
              color: FAINT,
              marginTop: 8,
            }}
          >
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
          learns over a lifetime — so you don't have to relearn it the hard way.
        </Text>
        {[
          "Nothing here is legally binding. This letter informs your judgment; it doesn't replace it — or any court order, care plan, or trust document.",
          `If you are new to ${name}, start with "A typical day" and "Communication." They will carry you through the first week.`,
          `In a crisis, go straight to "Medical" and "Behavioral support." There is also a separate one-page emergency sheet that pairs with this letter — keep copies where sitters, school, and the ER can grab them.`,
          "Check the date on the cover. Routines, medications, and contacts drift. If this letter is more than a year old, verify the medical details before relying on them.",
          "No Social Security, account, or policy numbers appear in this letter, on purpose. It says where those are kept instead.",
          "The ruled lines at the end of each section are for you. Write on this document — it is meant to be used, not preserved.",
        ].map((b, i) => (
          <View key={i} style={s.howToBullet}>
            <Text style={s.howToDot}>◆</Text>
            <Text style={s.howToBulletText}>{b}</Text>
          </View>
        ))}
        <Text style={{ ...s.howToPara, fontFamily: "Times-Italic", marginTop: 8 }}>
          Thank you for caring for {name}.
        </Text>
      </Page>

      {/* ------------------------------------------------------- contents */}
      {included.length > 0 ? (
        <Page size="LETTER" style={s.page}>
          <PdfFooter line={footerLine} />
          <Text style={s.sectionEyebrow}>CONTENTS</Text>
          <Text style={s.sectionTitle}>What's in this letter</Text>
          <View style={s.sectionRule} />
          {included.map((def) => (
            <View key={def.slug} style={s.tocRow}>
              <Text style={s.tocNumber}>{def.number}</Text>
              <Text style={s.tocTitle}>{fillName(def.title, name)}</Text>
              <View style={s.tocLeader} />
              <Text style={s.tocPage}>{toc?.[def.key] ?? " "}</Text>
            </View>
          ))}
        </Page>
      ) : null}

      {/* ------------------------------------------------------- sections */}
      {included.map((def) => (
        <SectionPage
          key={def.slug}
          def={def}
          data={data}
          name={name}
          registry={registry}
          footerLine={footerLine}
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
  data,
  name,
  registry,
  footerLine,
}: {
  def: SectionDef;
  data: LetterData;
  name: string;
  registry: Record<string, number> | null;
  footerLine: string;
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
            return `SECTION ${def.number}`;
          }}
        />
        <Text style={s.sectionTitle}>{fillName(def.title, name)}</Text>
        <View style={s.sectionRule} />
      </View>

      {def.key === "benefitsFinances" ? (
        <View style={s.noteBox}>
          <Text style={s.noteBoxText}>
            On purpose, this letter contains no Social Security, account, or policy
            numbers. The last entry in this section says where the family keeps them.
          </Text>
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
function MultilineValue({ text }: { text: string }) {
  const lines = text.replace(/\r\n/g, "\n").split("\n");
  const nodes: ReactNode[] = [];
  lines.forEach((line, i) => {
    if (line.trim() === "") {
      if (i > 0 && i < lines.length - 1) nodes.push(<View key={`gap-${i}`} style={s.valueGap} />);
    } else {
      nodes.push(
        <Text key={i} style={s.value}>
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
  const first = textFields.find((f) => String(item[f.id] ?? "").trim() !== "");
  const rest = textFields.filter(
    (f) => f !== first && String(item[f.id] ?? "").trim() !== ""
  );
  const tags = itemFields.filter((f) => f.kind === "checkbox" && item[f.id] === true);

  return (
    <View style={s.itemCard} wrap={false}>
      {first ? <Text style={s.itemTitle}>{String(item[first.id]).trim()}</Text> : null}
      {rest.map((f) => (
        <Text key={f.id} style={s.itemLine}>
          <Text style={{ fontFamily: "Helvetica", fontSize: 8, color: GRAY }}>
            {`${fillName(f.label, name).toUpperCase()}  `}
          </Text>
          {String(item[f.id]).trim()}
        </Text>
      ))}
      {tags.map((f) => (
        <Text key={f.id} style={s.itemTag}>
          ◆ {fillName(f.label, name).replace(/ — .*/, "").toUpperCase()}
        </Text>
      ))}
    </View>
  );
}
