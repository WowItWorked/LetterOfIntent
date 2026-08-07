import { beforeEach, describe, expect, it } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { SectionForm } from "@/components/wizard/SectionForm";
import { communication } from "@/lib/content/sections/05-communication";
import { familySupport } from "@/lib/content/sections/03-family-support";
import { useLetterStore } from "@/lib/store";

describe("SectionForm", () => {
  beforeEach(() => {
    localStorage.clear();
    useLetterStore.setState({ data: {}, meta: {}, hasHydrated: true });
  });

  it("associates a real <label> with every input and autosaves to the store", async () => {
    const user = userEvent.setup();
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

  it("adds repeater items with generated ids and saves them", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    await user.click(screen.getByRole("button", { name: /add a person/i }));
    await user.type(screen.getByLabelText("Name"), "Dana Alvarez");
    await user.click(
      screen.getByLabelText(/emergency contact — include on the emergency sheet/i)
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
  });

  it("shows a gentle hint for an odd email, and no hint when empty", async () => {
    const user = userEvent.setup();
    render(<SectionForm def={familySupport} />);

    await user.click(screen.getByRole("button", { name: /add a person/i }));
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
