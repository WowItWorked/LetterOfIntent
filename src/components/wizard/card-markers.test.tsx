import { beforeEach, describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SectionForm } from "@/components/wizard/SectionForm";
import { communication } from "@/lib/content/sections/05-communication";
import { emergencyPlan } from "@/lib/content/sections/09-emergency-plan";
import { familySupport } from "@/lib/content/sections/03-family-support";
import { useLetterStore } from "@/lib/store";

/**
 * The markers are config-driven (see lib/cards/status.test.ts for the index
 * itself); these tests pin the wiring — that the line renders near the label
 * and reaches the input through the same aria-describedby channel as help
 * text, without ever being hand-listed in a component.
 */

/** Answers that put every communication question in play. */
const FULL_COMM_META = {
  communicationDiffers: "yes",
  behaviorEscalates: "yes",
  cognitionChanging: "yes",
  stage: "adult",
  supportLevel: "mostlyIndependent",
} as const;

describe("card-field markers", () => {
  beforeEach(() => {
    localStorage.clear();
    useLetterStore.setState({ data: {}, meta: {}, hasHydrated: true });
  });

  it("describes a scalar field's input with the card it appears on", () => {
    render(<SectionForm def={emergencyPlan} />);

    expect(screen.getByLabelText("Call 911 when")).toHaveAccessibleDescription(
      /Appears on the Emergency Protocol card\./
    );
    expect(
      screen.getByLabelText("The rule on over-the-counter medicine")
    ).toHaveAccessibleDescription(/Appears on the Medications card\./);
    expect(screen.getByLabelText("If no one answers")).toHaveAccessibleDescription(
      /Appears on the Identity & Contacts and Emergency Protocol cards\./
    );
  });

  it("marks a repeater once at the group level, not inside every record", () => {
    render(<SectionForm def={familySupport} />);

    expect(
      screen.getAllByText("Appears on the Identity & Contacts and Emergency Protocol cards.")
    ).toHaveLength(1);
    // The per-record fields stay quiet; the record reaches the cards whole.
    expect(screen.getByLabelText("Name")).not.toHaveAccessibleDescription(/Appears on/);
  });

  it("marks exactly the fields SOURCES names, and no others", () => {
    useLetterStore.setState({ data: {}, meta: { ...FULL_COMM_META }, hasHydrated: true });
    render(<SectionForm def={communication} />);

    // communication feeds the behavior card through how, howToSpeak, yesNo,
    // pain, wontAdmit, whatHelps, and whatToAvoid — seven markers, no more.
    expect(screen.getAllByText(/^Appears on the/)).toHaveLength(7);
    expect(screen.getByLabelText("How they communicate")).toHaveAccessibleDescription(
      /Appears on the Behavior & Communication card\./
    );
    expect(
      screen.getByLabelText("How they show they're becoming overwhelmed")
    ).not.toHaveAccessibleDescription(/Appears on/);
  });

  it("a gated-off field's marker disappears with the field, not separately", () => {
    // With no onboarding answers, the sharp communication questions are not
    // asked — so neither they nor their markers render.
    render(<SectionForm def={communication} />);
    expect(screen.queryByLabelText("How they communicate")).not.toBeInTheDocument();
    // The ungated direction still carries its marker.
    expect(
      screen.getByLabelText("How they prefer to be spoken to, and by whom")
    ).toHaveAccessibleDescription(/Appears on the Behavior & Communication card\./);
  });
});
