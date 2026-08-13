/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, Text, View } from "@react-pdf/renderer";
import { firm } from "@/config/firm";
import { sectionsForMeta } from "@/lib/content/config";
import {
  fieldHasContent,
  fillName,
  formatDateLong,
  keyPoints,
  keyPointsHaveContent,
  letterDateIso,
  readerName,
} from "@/lib/derive";
import type { LetterData, LetterMeta } from "@/lib/schema";
import { CAREGIVER_PROJECTION, projects } from "./projections";
import {
  s,
  MultilineValue,
  PdfCredit,
  PdfFooter,
  SampleWatermark,
  SectionPage,
  type LoadedImage,
} from "./loi-document";
import { ENGRAVED, GOLD, GOLD_DEEP, GRAY, INK, NAVY, SANS, SERIF } from "./theme";

/**
 * The Letter for the Caregiver: the companion document to the Letter of
 * Intent. Daily life,
 * routine, communication, behavior, health as it is lived, the home, and the
 * words written to whoever steps in. It prints the CAREGIVER_PROJECTION of
 * the canonical schema (docs/output-matrix.md), and it opens with the
 * at-a-glance page — this letter's reader is the one holding it in a kitchen
 * at 7am, so the first five minutes come first.
 *
 * Like the Letter of Intent, it is explicitly not a legal document; unlike
 * it, nothing here touches money, benefits eligibility, or decision
 * authority beyond the practical pointers a caregiver needs.
 */

export interface CaregiverDocumentProps {
  data: LetterData;
  /** Stamp SAMPLE on every page — the live sample documents. */
  watermark?: boolean;
  meta?: LetterMeta;
  appLogo?: LoadedImage;
  familyPhoto?: LoadedImage & { caption?: string };
  /** Pass 1: section key → first page number gets recorded here. */
  registry: Record<string, number> | null;
  /** Pass 2: the recorded map, used to print TOC page numbers. */
  toc: Record<string, number> | null;
}

export function CaregiverDocument({
  data,
  watermark = false,
  meta = {},
  appLogo,
  familyPhoto,
  registry,
  toc,
}: CaregiverDocumentProps) {
  const name = readerName(data);
  const fullName = data.gettingStarted?.subjectFullName?.trim() || name;
  const author = data.gettingStarted?.authorName?.trim();
  const relationship = data.gettingStarted?.authorRelationship?.trim();
  const dateLong = formatDateLong(letterDateIso(data)) ?? letterDateIso(data);

  const included = sectionsForMeta(meta, data).filter(
    (def) =>
      CAREGIVER_PROJECTION[def.key] &&
      def.fields.some(
        (f) =>
          projects(CAREGIVER_PROJECTION, def.key, f.id) &&
          fieldHasContent(data[def.key] as Record<string, unknown> | undefined, f)
      )
  );
  const numberOf = new Map(included.map((def, i) => [def.key, i + 1]));

  const points = keyPoints(data);
  const showKeyPoints = keyPointsHaveContent(points);

  const footerLine = `This letter is not a legal document and is not legally binding. It is a family's guide for whoever cares for ${name}. Last updated ${dateLong}.`;

  return (
    <Document
      title={`Letter for the Caregiver — ${fullName}`}
      author={author ?? "Prepared with the Letter of Intent Builder"}
      creator={`Letter of Intent Builder — ${firm.name}`}
      producer={firm.name}
      language="en"
    >
      {/* ------------------------------------------------------------ cover */}
      <Page size="LETTER" style={s.coverPage}>
        {watermark ? <SampleWatermark /> : null}
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
            FOR WHOEVER CARES FOR
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
          <Text
            style={{
              fontFamily: SERIF,
              fontStyle: "italic",
              fontSize: 15,
              color: INK,
              marginTop: 10,
            }}
          >
            The Letter for the Caregiver
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
          {/* Same credit as the page feet and the other covers. */}
          <PdfCredit center />
        </View>
      </Page>

      {/* ----------------------------------------------------- how to use */}
      <Page size="LETTER" style={s.page}>
        <PdfFooter line={footerLine} />
        {watermark ? <SampleWatermark /> : null}
        <Text style={s.sectionEyebrow}>TO THE READER</Text>
        <Text style={s.sectionTitle}>How to use this letter</Text>
        <View style={s.sectionRule} />
        <Text style={s.howToPara}>
          You are holding this because you are caring for {name} — tonight, this
          week, or from now on.
          {author ? ` ${author} wrote it` : " It was written"} to hand you what a
          family learns over years: the routines, the signals, the small things
          that make the difference between a hard day and a good one.
        </Text>
        {[
          "Start with the next page. It is the handful of things a new person needs in the first five minutes.",
          `Then read "A typical day" and "Communication." They will carry you through the first week.`,
          "Nothing here is legally binding, and nothing about money or legal authority lives in this letter — that belongs to the Letter of Intent, which the family keeps with their trustee and advisors.",
          "Check the date on the cover. Routines, medications, and contacts drift. If this letter is more than a year old, verify the medical details before relying on them.",
          "No Social Security, account, or policy numbers appear here, on purpose. It says where those are kept instead.",
          "Write on this document. The margins and the ruled lines are for you — it is meant to be used, not preserved.",
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

      {/* ----------------------------------------------- key points, first */}
      {showKeyPoints ? (
        <Page size="LETTER" style={s.page}>
          <PdfFooter line={footerLine} />
        {watermark ? <SampleWatermark /> : null}
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
              <Text style={s.pointTitle}>Living situations the family would not want</Text>
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

      {/* ------------------------------------------------------- contents */}
      {included.length > 0 ? (
        <Page size="LETTER" style={s.page}>
          <PdfFooter line={footerLine} />
        {watermark ? <SampleWatermark /> : null}
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
          watermark={watermark}
          projection={CAREGIVER_PROJECTION}
          familyPhoto={def.photoSlot ? familyPhoto : undefined}
        />
      ))}
    </Document>
  );
}
