import { describe, expect, it } from "vitest";
import { z } from "zod";
import {
  CAREGIVER_PROJECTION,
  TRUSTEE_PROJECTION,
  projects,
  type LetterProjection,
} from "@/lib/pdf/projections";
import { SOURCES } from "@/lib/content/cards";
import { emergencyInfo } from "@/lib/derive";
import { sectionKeys, sectionSchemas, type LetterData, type SectionKey } from "@/lib/schema";

/**
 * Output integrity, test-enforced. The projections are docs/output-matrix.md
 * as data, and the two letter renderers print exactly {projected ∩ filled} —
 * so holding the projections to the schema holds the letters to the matrix.
 * The guard this file exists for: a future consolidation that quietly starves
 * an output must fail loudly here, not surface in a family's download.
 */

function fieldsOf(section: SectionKey): string[] {
  return Object.keys(sectionSchemas[section].shape);
}

function projectionEntries(p: LetterProjection): Array<[SectionKey, string]> {
  const out: Array<[SectionKey, string]> = [];
  for (const [section, sel] of Object.entries(p) as Array<
    [SectionKey, "all" | readonly string[]]
  >) {
    const all = fieldsOf(section);
    for (const f of sel === "all" ? all : sel) out.push([section, f]);
  }
  return out;
}

describe("projections stay true to the schema", () => {
  it.each([
    ["trustee", TRUSTEE_PROJECTION],
    ["caregiver", CAREGIVER_PROJECTION],
  ] as const)("every %s-projected field exists in the canonical schema", (_name, p) => {
    for (const [section, field] of projectionEntries(p)) {
      expect(
        fieldsOf(section),
        `projection names unknown field ${section}.${field}`
      ).toContain(field);
    }
  });

  it("every canonical field lands in at least one output — asked but never printed is banned", () => {
    // The four outputs' sources: the two letter projections, the cards'
    // SOURCES, and the emergency sheet's readers (checked separately below).
    const covered = new Set<string>();
    for (const p of [TRUSTEE_PROJECTION, CAREGIVER_PROJECTION]) {
      for (const [s2, f] of projectionEntries(p)) covered.add(`${s2}.${f}`);
    }
    for (const sources of Object.values(SOURCES)) {
      for (const src of sources) covered.add(`${src.section}.${src.field}`);
    }
    // The emergency sheet's direct reads (see emergencyInfo).
    for (const key of [
      "gettingStarted.subjectFullName",
      "gettingStarted.subjectPreferredName",
      "person.dateOfBirth",
      "health.conditions",
      "communication.how",
      "communication.howToSpeak",
      "communication.yesNo",
      "communication.hearingVisionMemory",
      "communication.pain",
      "communication.wontAdmit",
      "health.allergies",
      "health.medications",
      "emergencyPlan.responseSteps",
      "health.emergencyProtocol",
      "behavior.triggers",
      "behavior.deEscalation",
      "communication.whatHelps",
      "behavior.makesWorse",
      "communication.whatToAvoid",
      "familySupport.contacts",
      "familySupport.firstCall",
      "health.insurancePlans",
      "health.preferredHospital",
    ]) {
      covered.add(key);
    }

    for (const section of sectionKeys) {
      for (const field of fieldsOf(section)) {
        expect(covered.has(`${section}.${field}`), `${section}.${field} prints nowhere`).toBe(
          true
        );
      }
    }
  });

  it("the projections honor the merge vetoes — the defects cannot re-enter through a letter", () => {
    // The trustee letter carries the money-adjacent fields at emergency-sheet
    // strictness; the caregiver letter carries the daily mechanics.
    expect(projects(TRUSTEE_PROJECTION, "health", "insurancePlans")).toBe(true);
    expect(projects(TRUSTEE_PROJECTION, "health", "recordsLocation")).toBe(true);
    expect(projects(TRUSTEE_PROJECTION, "health", "emergencyProtocol")).toBe(false);
    expect(projects(CAREGIVER_PROJECTION, "health", "emergencyProtocol")).toBe(true);
    expect(projects(CAREGIVER_PROJECTION, "health", "appointmentHelp")).toBe(true);
    // Money machinery stays out of the caregiver letter…
    expect(projects(CAREGIVER_PROJECTION, "moneyBenefits", "trusts")).toBe(false);
    expect(projects(CAREGIVER_PROJECTION, "trusteeGuidance", "moneyIsFor")).toBe(false);
    // …and the caregiver guidance stays out of the trustee letter.
    expect(projects(TRUSTEE_PROJECTION, "caregiverGuidance", "firstWeek")).toBe(false);
    // Both letters keep the personal messages.
    expect(projects(TRUSTEE_PROJECTION, "personalMessage", "toCaregivers")).toBe(true);
    expect(projects(CAREGIVER_PROJECTION, "personalMessage", "toCaregivers")).toBe(true);
  });

  it("repeater projections point at real arrays", () => {
    for (const p of [TRUSTEE_PROJECTION, CAREGIVER_PROJECTION]) {
      for (const [section, field] of projectionEntries(p)) {
        const shape = (sectionSchemas[section].shape as Record<string, z.ZodTypeAny>)[field];
        expect(shape, `${section}.${field}`).toBeDefined();
      }
    }
  });
});

describe("the emergency sheet prints distinguishable text from every source", () => {
  it("every heading is fed, and by its own field", () => {
    const data: LetterData = {
      gettingStarted: { subjectFullName: "FULLNAME_X", subjectPreferredName: "PREF_X" },
      person: { dateOfBirth: "2001-01-01" },
      health: {
        conditions: "CONDITIONS_X",
        allergies: "ALLERGIES_X",
        insurancePlans: "INSURANCE_X",
        recordsLocation: "RECORDS_X",
        preferredHospital: "HOSPITAL_X",
        emergencyProtocol: "PROTOCOL_X",
        appointmentHelp: "APPT_X",
        medications: [{ id: "m1", name: "MED_X" }],
      },
      communication: { how: "HOW_X", yesNo: "YESNO_X", pain: "PAIN_X" },
      behavior: { triggers: "TRIGGERS_X", deEscalation: "CALM_X", makesWorse: "WORSE_X" },
      familySupport: {
        firstCall: "FIRSTCALL_X",
        contacts: [{ id: "c1", name: "CONTACT_X", emergency: true }],
      },
      emergencyPlan: { responseSteps: "STEPS_X" },
    };
    const info = emergencyInfo(data);
    expect(info.fullName).toBe("FULLNAME_X");
    expect(info.diagnoses).toBe("CONDITIONS_X");
    expect(info.allergies).toBe("ALLERGIES_X");
    expect(info.insurance).toBe("INSURANCE_X"); // never RECORDS_X
    expect(info.hospital).toBe("HOSPITAL_X");
    expect(info.protocol).toBe("STEPS_X"); // structured steps first, never APPT_X
    expect(info.communication).toBe("HOW_X");
    expect(info.yesNo).toBe("YESNO_X");
    expect(info.pain).toBe("PAIN_X");
    expect(info.triggers).toBe("TRIGGERS_X");
    expect(info.deEscalation).toBe("CALM_X");
    expect(info.makesWorse).toBe("WORSE_X");
    expect(info.firstCall).toBe("FIRSTCALL_X");
    expect(info.contacts[0]?.name).toBe("CONTACT_X");
    expect(info.medications[0]?.name).toBe("MED_X");
    expect(JSON.stringify(info)).not.toContain("APPT_X");
    expect(JSON.stringify(info)).not.toContain("RECORDS_X");
  });
});
