/* eslint-disable jsx-a11y/alt-text */
import { Document, Image, Page, StyleSheet, Text, View } from "@react-pdf/renderer";
import type { ReactNode } from "react";
import { firm } from "@/config/firm";
import { formatDateLong, type EmergencyInfo } from "@/lib/derive";
import {
  ENGRAVED,
  GOLD_DEEP,
  GRAY,
  INK,
  NAVY,
  SANS,
  registerBrandFonts,
} from "./theme";

registerBrandFonts();

const LINE = "#cfc9bb";
const RED = "#a64545";

const s = StyleSheet.create({
  page: {
    padding: 28,
    fontFamily: SANS,
    fontSize: 9,
    color: INK,
    lineHeight: 1.4,
  },
  header: {
    backgroundColor: NAVY,
    paddingVertical: 10,
    paddingHorizontal: 14,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  // Cinzel is allowed here: 15pt, well clear of the 9pt floor.
  headerTitle: {
    fontFamily: ENGRAVED,
    fontWeight: 600,
    fontSize: 15,
    letterSpacing: 0.6,
    color: "#ffffff",
  },
  headerRight: { fontSize: 8, color: "#e8e4d8", textAlign: "right" },

  identityRow: { flexDirection: "row", marginTop: 10, gap: 10 },
  photoBox: {
    width: 84,
    height: 100,
    borderWidth: 1,
    borderColor: GRAY,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
  },
  photoText: { fontSize: 7, color: GRAY, textAlign: "center", lineHeight: 1.5 },
  identity: { flex: 1 },
  fullName: { fontFamily: SANS, fontWeight: 700, fontSize: 13.5 },

  cols: { flexDirection: "row", marginTop: 10, gap: 10 },
  col: { flex: 1 },

  box: {
    borderWidth: 0.9,
    borderColor: LINE,
    borderRadius: 3,
    padding: 8,
    marginBottom: 8,
  },
  boxTitle: {
    fontFamily: SANS, fontWeight: 700,
    fontSize: 7.5,
    letterSpacing: 0.9,
    color: GRAY,
    marginBottom: 3,
  },
  body: { fontSize: 9, lineHeight: 1.45 },
  subLabel: {
    fontFamily: SANS, fontWeight: 700,
    fontSize: 7,
    letterSpacing: 0.7,
    color: GRAY,
    marginTop: 4,
    marginBottom: 1,
  },
  medRow: { marginBottom: 3 },
  medName: { fontFamily: SANS, fontWeight: 700, fontSize: 9 },
  medDetail: { fontSize: 8.5, color: "#39424f" },

  idLine: { fontSize: 9, marginTop: 2.5 },
  idLabel: { fontFamily: SANS, fontWeight: 700, fontSize: 7.5, color: GRAY },

  footNote: {
    marginTop: 4,
    fontSize: 6.8,
    color: GRAY,
    textAlign: "center",
    lineHeight: 1.5,
  },
});

function clamp(v: string | undefined, max: number): string | undefined {
  const t = v?.trim();
  if (!t) return undefined;
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1).trimEnd()}… (see full letter)`;
}

function Box({
  title,
  children,
  borderColor,
  backgroundColor,
  titleColor,
}: {
  title: string;
  children: ReactNode;
  borderColor?: string;
  backgroundColor?: string;
  titleColor?: string;
}) {
  return (
    <View
      style={{
        ...s.box,
        ...(borderColor ? { borderColor, borderWidth: 1.2 } : {}),
        ...(backgroundColor ? { backgroundColor } : {}),
      }}
      wrap={false}
    >
      <Text style={{ ...s.boxTitle, ...(titleColor ? { color: titleColor } : {}) }}>
        {title}
      </Text>
      {children}
    </View>
  );
}

export function EmergencyDocument({
  info,
  appLogo,
  photo,
}: {
  info: EmergencyInfo;
  /** The tool's lockup, with its measured aspect ratio. */
  appLogo?: { dataUrl: string; aspect: number };
  /** The recent photograph, so a stranger recognizes them straight away. */
  photo?: { dataUrl: string; aspect: number };
}) {
  const displayCaps = (info.preferred ?? info.fullName ?? "—").toUpperCase();
  const updated = formatDateLong(info.updatedIso) ?? info.updatedIso;
  const meds = info.medications.slice(0, 8);
  const medsMore = info.medications.length - meds.length;
  const contacts = info.contacts.slice(0, 4);

  return (
    <Document
      title={`Emergency information — ${info.fullName ?? info.preferred ?? ""}`}
      creator={`Letter of Intent Builder — ${firm.name}`}
      producer={firm.name}
      // See loi-document.tsx — 49 failed checks on this sheet came from the
      // missing language declaration. It matters more here than anywhere: this
      // is the page read aloud in an emergency.
      language="en"
    >
      <Page size="LETTER" style={s.page} wrap={false}>
        {/* Brand row sits above the navy bar so the sheet still reads
            "EMERGENCY INFORMATION" at a glance. */}
        {appLogo ? (
          <View style={{ marginBottom: 10 }}>
            {/* Sized so the wordmark and tagline stay legible in print; the
                sheet has the vertical room even when every box is full. */}
            <Image
              src={appLogo.dataUrl}
              style={{ width: 158, height: 158 / appLogo.aspect }}
            />
          </View>
        ) : null}
        <View style={s.header}>
          <Text style={s.headerTitle}>EMERGENCY INFORMATION — {displayCaps}</Text>
          <View>
            <Text style={s.headerRight}>Updated {updated}</Text>
            <Text style={s.headerRight}>Verify if older than one year</Text>
          </View>
        </View>

        <View style={s.identityRow}>
          {photo ? (
            <Image
              src={photo.dataUrl}
              style={{ width: 84, height: 100, objectFit: "cover" }}
            />
          ) : (
            <View style={s.photoBox}>
              <Text style={s.photoText}>ATTACH{"\n"}RECENT{"\n"}PHOTO</Text>
            </View>
          )}
          <View style={s.identity}>
            {info.fullName ? <Text style={s.fullName}>{info.fullName}</Text> : null}
            {info.preferred && info.preferred !== info.fullName ? (
              <Text style={s.idLine}>
                <Text style={s.idLabel}>GOES BY  </Text>
                {info.preferred}
              </Text>
            ) : null}
            {info.dateOfBirth ? (
              <Text style={s.idLine}>
                <Text style={s.idLabel}>DATE OF BIRTH  </Text>
                {formatDateLong(info.dateOfBirth) ?? info.dateOfBirth}
              </Text>
            ) : null}
            {info.insurance ? (
              <Text style={s.idLine}>
                <Text style={s.idLabel}>INSURANCE / MEDICAID  </Text>
                {clamp(info.insurance, 130)}
              </Text>
            ) : null}
            {info.hospital ? (
              <Text style={s.idLine}>
                <Text style={s.idLabel}>PREFERRED HOSPITAL  </Text>
                {clamp(info.hospital, 90)}
              </Text>
            ) : null}
          </View>
        </View>

        <View style={s.cols}>
          {/* ------------------------------------------------- left column */}
          <View style={s.col}>
            {info.diagnoses ? (
              <Box title="DIAGNOSES">
                <Text style={s.body}>{clamp(info.diagnoses, 230)}</Text>
              </Box>
            ) : null}

            <Box
              title="ALLERGIES"
              borderColor={RED}
              titleColor={RED}
            >
              <Text style={s.body}>
                {clamp(info.allergies, 190) ?? "None recorded — confirm with family."}
              </Text>
            </Box>

            {meds.length > 0 ? (
              <Box title="CURRENT MEDICATIONS">
                {meds.map((m, i) => (
                  <View key={i} style={s.medRow}>
                    <Text style={s.medName}>{m.name?.trim() || "—"}</Text>
                    <Text style={s.medDetail}>
                      {[m.dose?.trim(), m.purpose?.trim()].filter(Boolean).join(" — ")}
                    </Text>
                  </View>
                ))}
                {medsMore > 0 ? (
                  <Text style={{ ...s.medDetail, marginTop: 2 }}>
                    + {medsMore} more — see full letter
                  </Text>
                ) : null}
              </Box>
            ) : null}

            {info.protocol ? (
              <Box
                title="IN AN EMERGENCY — PROTOCOL"
                borderColor={GOLD_DEEP}
                backgroundColor="#faf5ea"
              >
                <Text style={s.body}>{clamp(info.protocol, 460)}</Text>
              </Box>
            ) : null}
          </View>

          {/* ------------------------------------------------ right column */}
          <View style={s.col}>
            {info.communication || info.yesNo || info.pain ? (
              <Box title="HOW THEY COMMUNICATE">
                {info.communication ? (
                  <Text style={s.body}>{clamp(info.communication, 240)}</Text>
                ) : null}
                {info.yesNo ? (
                  <>
                    <Text style={s.subLabel}>YES / NO</Text>
                    <Text style={s.body}>{clamp(info.yesNo, 120)}</Text>
                  </>
                ) : null}
                {info.pain ? (
                  <>
                    <Text style={s.subLabel}>SIGNS OF PAIN OR ILLNESS</Text>
                    <Text style={s.body}>{clamp(info.pain, 150)}</Text>
                  </>
                ) : null}
              </Box>
            ) : null}

            {info.triggers || info.deEscalation || info.makesWorse ? (
              <Box title="IF THEY BECOME OVERWHELMED">
                {info.triggers ? (
                  <>
                    <Text style={s.subLabel}>TRIGGERS</Text>
                    <Text style={s.body}>{clamp(info.triggers, 190)}</Text>
                  </>
                ) : null}
                {info.deEscalation ? (
                  <>
                    <Text style={s.subLabel}>WHAT HELPS</Text>
                    <Text style={s.body}>{clamp(info.deEscalation, 240)}</Text>
                  </>
                ) : null}
                {info.makesWorse ? (
                  <>
                    <Text style={s.subLabel}>AVOID — MAKES IT WORSE</Text>
                    <Text style={s.body}>{clamp(info.makesWorse, 140)}</Text>
                  </>
                ) : null}
              </Box>
            ) : null}

            {info.firstCall || contacts.length > 0 ? (
              <Box title="EMERGENCY CONTACTS" borderColor={NAVY}>
                {info.firstCall ? (
                  <Text style={{ ...s.body, fontFamily: SANS, fontWeight: 700 }}>
                    CALL FIRST: {clamp(info.firstCall, 110)}
                  </Text>
                ) : null}
                {contacts.map((c, i) => (
                  <Text key={i} style={{ ...s.body, marginTop: 2.5 }}>
                    {[
                      c.name?.trim(),
                      c.relationship?.trim() ? `(${c.relationship.trim()})` : undefined,
                      c.phone?.trim(),
                    ]
                      .filter(Boolean)
                      .join(" — ")}
                  </Text>
                ))}
              </Box>
            ) : null}
          </View>
        </View>

        <Text style={s.footNote}>
          Long entries may be shortened here — full detail lives in the complete Letter
          of Intent. Prepared with the free Letter of Intent Builder from {firm.name}.
          Not a medical or legal document.
        </Text>
      </Page>
    </Document>
  );
}
