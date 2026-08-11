import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionForm } from "@/components/wizard/SectionForm";
import { communication } from "@/lib/content/sections/05-communication";
import { familySupport } from "@/lib/content/sections/03-family-support";
import { health } from "@/lib/content/sections/06-health";
import { useLetterStore } from "@/lib/store";

describe("SectionForm", () => {
  beforeEach(() => {
    localStorage.clear();
    useLetterStore.setState({ data: {}, meta: {}, hasHydrated: true });
  });

  it("associates a real <label> with every input and autosaves to the store", async () => {
    const user = userEvent.setup();
    // The sharp communication questions are gated; open the gate so the
    // field under test is asked.
    useLetterStore.setState({
      data: {},
      meta: { communicationDiffers: "yes" },
      hasHydrated: true,
    });
    render(<SectionForm def={communication} />);

    const input = screen.getByLabelText("How they communicate");
    await user.type(input, "AAC device, about twenty signs");

    await waitFor(
      () => {
        expect(useLetterStore.getState().data.communication?.how).toBe(
          "AAC device, about twenty signs"
        );
      },
      { timeout: 3000 }
    );
  });

  it("starts with one blank record, saves it with a generated id, and adds more", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    // No click needed: a repeater never starts empty.
    await user.type(screen.getByLabelText("Name"), "Dana Alvarez");
    await user.click(
      screen.getByLabelText(/emergency contact: include on the emergency sheet/i)
    );

    await waitFor(
      () => {
        const contacts = useLetterStore.getState().data.familySupport?.contacts;
        expect(contacts).toHaveLength(1);
        expect(contacts?.[0]?.name).toBe("Dana Alvarez");
        expect(contacts?.[0]?.emergency).toBe(true);
        expect(typeof contacts?.[0]?.id).toBe("string");
      },
      { timeout: 3000 }
    );

    await user.click(screen.getByRole("button", { name: /add a person/i }));
    expect(screen.getAllByLabelText("Name")).toHaveLength(2);
  });

  it("removing the last record leaves a fresh blank, never an empty list", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    await user.type(screen.getByLabelText("Name"), "Ray");
    await user.clear(screen.getByLabelText("Name"));
    await user.click(screen.getAllByRole("button", { name: /^remove/i })[0]);

    // Still exactly one (blank) record on screen.
    expect(screen.getByLabelText("Name")).toHaveValue("");
  });

  it("collapses a stored record to a one-line summary and expands it back", async () => {
    useLetterStore.setState({
      hasHydrated: true,
      meta: {},
      data: {
        familySupport: {
          contacts: [
            {
              id: "c1",
              name: "Dana Alvarez",
              relationship: "Aunt",
              phone: "(703) 555-0142",
            },
          ],
        },
      },
    });
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    const toggle = screen.getByRole("button", {
      name: /person 1:\s*Dana Alvarez — Aunt, \(703\) 555-0142/i,
    });
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    // Collapsed: the inputs are off the screen entirely.
    expect(screen.queryByLabelText("Name")).not.toBeInTheDocument();

    await user.click(toggle);
    expect(screen.getByLabelText("Name")).toHaveValue("Dana Alvarez");
    expect(
      screen.getByRole("button", { name: /^person 1$/i })
    ).toHaveAttribute("aria-expanded", "true");
  });

  it("joins checked schedule tokens and a typed custom time into one array", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={health} />);

    await user.click(screen.getByLabelText("Morning"));
    await user.type(screen.getByLabelText("Custom time"), "14:30");
    await user.click(screen.getByRole("button", { name: /add time/i }));

    await waitFor(
      () => {
        const meds = useLetterStore.getState().data.health?.medications;
        expect(meds?.[0]?.schedule).toEqual(["morning", "14:30"]);
      },
      { timeout: 3000 }
    );
  });

  it("shows a gentle hint for an odd email, and no hint when empty", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    const email = screen.getByLabelText("Email");
    await user.type(email, "not-an-email");
    await user.tab(); // blur triggers the gentle check

    expect(
      await screen.findByText(/doesn't look like a full email address yet/i)
    ).toBeInTheDocument();

    await user.clear(email);
    await waitFor(() => {
      expect(
        screen.queryByText(/doesn't look like a full email address yet/i)
      ).not.toBeInTheDocument();
    });
  });
});
