import { describe, expect, it } from "vitest";
import type { RepeaterField, RepeaterItemMultiselect } from "@/lib/content/types";
import { health } from "@/lib/content/sections/06-health";
import { allergies } from "@/lib/content/sections/08-allergies";
import { defaultValuesForSection } from "@/lib/derive";
import {
  addCustomValue,
  optionLabel,
  orderTokens,
  repeaterItemSummary,
  toggleToken,
} from "@/components/wizard/repeater-logic";

const medsField = health.fields.find(
  (f): f is RepeaterField => f.kind === "repeater" && f.id === "medications"
)!;
const scheduleField = medsField.itemFields.find(
  (f): f is RepeaterItemMultiselect => f.id === "schedule"
)!;
const allergyItems = allergies.fields.find(
  (f): f is RepeaterField => f.kind === "repeater"
)!;

describe("select and multiselect form defaults", () => {
  it("gives selects a string and multiselects a string[]", () => {
    const values = defaultValuesForSection(health, {
      health: { medications: [{ name: "Keppra" }] },
    });
    const meds = values.medications as Array<Record<string, unknown>>;
    expect(meds[0].schedule).toEqual([]);
    expect(meds[0].withFood).toBe(false);
    expect(meds[0].unit).toBe("");

    const stored = defaultValuesForSection(allergies, {
      allergies: { items: [{ id: "a1", allergen: "Penicillin", severity: "serious" }] },
    });
    const items = stored.items as Array<Record<string, unknown>>;
    expect(items[0].severity).toBe("serious");
    expect(items[0].keepOffCards).toBe(false);
  });

  it("keeps stored schedule tokens, dropping only non-strings", () => {
    const values = defaultValuesForSection(health, {
      health: {
        medications: [
          // A hand-edited or older backup could hold junk among the tokens.
          { name: "Keppra", schedule: ["morning", 7, "14:30"] as unknown as string[] },
        ],
      },
    });
    const meds = values.medications as Array<Record<string, unknown>>;
    expect(meds[0].schedule).toEqual(["morning", "14:30"]);
  });

  it("seeds one blank record so a repeater never starts empty", () => {
    const values = defaultValuesForSection(allergies, {});
    const items = values.items as Array<Record<string, unknown>>;
    expect(items).toHaveLength(1);
    expect(typeof items[0].id).toBe("string");
    expect(items[0].allergen).toBe("");
    expect(items[0].keepOffCards).toBe(false);
  });
});

describe("the medication schedule's custom-time join", () => {
  it("typed times join the same array as checked tokens", () => {
    let values: string[] = [];
    values = toggleToken(scheduleField, values, "bedtime");
    values = addCustomValue(scheduleField, values, " 14:30 ");
    values = toggleToken(scheduleField, values, "morning");
    // Known tokens keep day order; the typed time follows them.
    expect(values).toEqual(["morning", "bedtime", "14:30"]);
  });

  it("ignores blanks and duplicates", () => {
    expect(addCustomValue(scheduleField, ["14:30"], "   ")).toEqual(["14:30"]);
    expect(addCustomValue(scheduleField, ["14:30"], "14:30")).toEqual(["14:30"]);
  });

  it("unchecking removes exactly that token, custom or not", () => {
    expect(toggleToken(scheduleField, ["morning", "14:30"], "14:30")).toEqual([
      "morning",
    ]);
    expect(toggleToken(scheduleField, ["morning", "14:30"], "morning")).toEqual([
      "14:30",
    ]);
  });

  it("orders known tokens by the options and leaves the rest in entry order", () => {
    expect(
      orderTokens(scheduleField.options, ["2:30 PM", "bedtime", "morning", "9pm"])
    ).toEqual(["morning", "bedtime", "2:30 PM", "9pm"]);
  });

  it("labels known tokens and renders unknown ones verbatim", () => {
    expect(optionLabel(scheduleField.options, "prn")).toBe("As needed (PRN)");
    expect(optionLabel(scheduleField.options, "14:30")).toBe("14:30");
  });
});

describe("the collapsed record's one-line summary", () => {
  it("reads name — dose, schedule labels", () => {
    const summary = repeaterItemSummary(medsField, {
      name: "Sertraline",
      dose: "25 mg",
      schedule: ["morning"],
      withFood: true,
    });
    expect(summary).toBe("Sertraline — 25 mg, Morning");
  });

  it("select tokens summarize as their labels", () => {
    const summary = repeaterItemSummary(allergyItems, {
      allergen: "Penicillin",
      severity: "life-threatening",
      reaction: "Hives, then trouble breathing",
    });
    expect(summary).toBe("Penicillin — Life-threatening, Hives, then trouble breathing");
  });

  it("checkbox labels join lowercased, without their explanation tails", () => {
    const summary = repeaterItemSummary(medsField, {
      name: "Diazepam",
      isRescue: true,
    });
    // "Rescue medication: for emergencies…" contributes only its head.
    expect(summary).toBe("Diazepam — rescue medication");
  });

  it("multiline steps contribute only their first line, and long summaries clamp", () => {
    const summary = repeaterItemSummary(allergyItems, {
      allergen: "Latex",
      reaction: "Red, itchy skin within minutes\nSwelling if it goes unnoticed",
    });
    expect(summary).toBe("Latex — Red, itchy skin within minutes");
    const long = repeaterItemSummary(allergyItems, {
      allergen: "A".repeat(120),
    });
    expect(long.length).toBeLessThanOrEqual(81); // 80 + the ellipsis
    expect(long.endsWith("…")).toBe(true);
  });

  it("a blank record summarizes to nothing", () => {
    expect(repeaterItemSummary(medsField, { id: "x", name: "", schedule: [] })).toBe("");
  });
});
