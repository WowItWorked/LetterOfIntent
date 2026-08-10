import { describe, expect, it } from "vitest";
import { sectionBySlug } from "@/lib/content/sections";
import {
  defaultValuesForSection,
  displayName,
  emergencyInfo,
  fieldHasContent,
  fillName,
  formatDateLong,
  formatItemValue,
  preferredName,
  readerName,
  sectionHasContent,
  startedCount,
} from "@/lib/derive";
import type { LetterData } from "@/lib/schema";

describe("naming", () => {
  it("prefers the preferred name, falls back to first name, then a warm default", () => {
    expect(preferredName({ gettingStarted: { subjectPreferredName: "Alex" } })).toBe("Alex");
    expect(
      preferredName({ gettingStarted: { subjectFullName: "Alexander James Alvarez" } })
    ).toBe("Alexander");
    expect(preferredName({})).toBeUndefined();
    expect(displayName({})).toBe("your loved one");
    expect(readerName({})).toBe("this person");
  });

  it("fills every {name} token", () => {
    expect(fillName("{name} loves {name}'s routine", "Alex")).toBe(
      "Alex loves Alex's routine"
    );
  });
});

describe("content detection", () => {
  const familySupport = sectionBySlug("family-and-support")!;

  it("whitespace-only answers don't count as content", () => {
    const data: LetterData = { typicalDay: { goodDay: "   " } };
    expect(sectionHasContent(data, sectionBySlug("a-typical-day")!)).toBe(false);
    expect(startedCount(data)).toBe(0);
  });

  it("a repeater with one real item counts; an empty or checkbox-only item doesn't", () => {
    const empty: LetterData = {
      familySupport: { contacts: [{ id: "1", emergency: true }] },
    };
    expect(sectionHasContent(empty, familySupport)).toBe(false);

    const real: LetterData = {
      familySupport: { contacts: [{ id: "1", name: "Dana", emergency: true }] },
    };
    expect(sectionHasContent(real, familySupport)).toBe(true);
    expect(startedCount(real)).toBe(1);
  });

  it("fieldHasContent handles missing section values", () => {
    const field = familySupport.fields.find((f) => f.id === "firstCall")!;
    expect(fieldHasContent(undefined, field)).toBe(false);
  });
});

describe("form defaults", () => {
  it("gives every scalar a string and every repeater an array with ids", () => {
    const def = sectionBySlug("medical")!;
    const values = defaultValuesForSection(def, {
      medical: { medications: [{ name: "Keppra" }] },
    });
    expect(values.allergies).toBe("");
    const meds = values.medications as Array<Record<string, unknown>>;
    expect(meds).toHaveLength(1);
    expect(meds[0].name).toBe("Keppra");
    expect(typeof meds[0].id).toBe("string");
    expect((meds[0].id as string).length).toBeGreaterThan(0);
    expect(meds[0].dose).toBe("");
  });
});

describe("dates", () => {
  it("formats ISO dates and passes through anything else", () => {
    expect(formatDateLong("2026-08-07")).toBe("August 7, 2026");
    expect(formatDateLong("sometime in June")).toBe("sometime in June");
    expect(formatDateLong(undefined)).toBeUndefined();
  });
});

describe("repeater value display", () => {
  const severity = {
    id: "severity",
    label: "How serious",
    kind: "select",
    options: [{ value: "life-threatening", label: "Life-threatening" }],
  } as const;
  const schedule = {
    id: "schedule",
    label: "When",
    kind: "multiselect",
    options: [{ value: "morning", label: "Morning" }],
  } as const;
  const plain = { id: "name", label: "Name", kind: "text" } as const;

  it("renders stored tokens through their option labels", () => {
    expect(formatItemValue(severity, "life-threatening")).toBe("Life-threatening");
  });

  it("joins arrays with a spaced separator, unknown tokens verbatim", () => {
    expect(formatItemValue(schedule, ["morning", "14:30"])).toBe("Morning · 14:30");
    expect(formatItemValue(schedule, [])).toBe("");
  });

  it("leaves plain text fields alone", () => {
    expect(formatItemValue(plain, "  Dana  ")).toBe("Dana");
    expect(formatItemValue(plain, undefined)).toBe("");
  });
});

describe("emergency sheet data", () => {
  const data: LetterData = {
    gettingStarted: { subjectFullName: "Alexander Alvarez", subjectPreferredName: "Alex" },
    about: { diagnoses: "Autism; epilepsy" },
    familySupport: {
      firstCall: "Dana — 703-555-0142",
      contacts: [
        { id: "1", name: "Dana Alvarez", phone: "703-555-0142", emergency: true },
        { id: "2", name: "Ray", phone: "703-555-0000", emergency: false },
        { id: "3", emergency: true }, // no content — must be dropped
      ],
    },
    medical: {
      medications: [
        { id: "m1", name: "Keppra", dose: "500 mg", purpose: "Seizures" },
        { id: "m2" }, // empty — dropped
      ],
      allergies: "Penicillin",
      emergencyProtocol: "Time the seizure; rescue med after 3 minutes; call 911.",
    },
    behavior: { triggers: "Fire alarms" },
  };

  it("pulls only flagged, non-empty contacts and non-empty medications", () => {
    const info = emergencyInfo(data);
    expect(info.contacts.map((c) => c.name)).toEqual(["Dana Alvarez"]);
    expect(info.medications.map((m) => m.name)).toEqual(["Keppra"]);
    expect(info.preferred).toBe("Alex");
    expect(info.diagnoses).toContain("Autism");
    expect(info.triggers).toBe("Fire alarms");
    expect(info.protocol).toContain("911");
  });
});
