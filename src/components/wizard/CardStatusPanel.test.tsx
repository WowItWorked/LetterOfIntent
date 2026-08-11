import { beforeEach, describe, expect, it } from "vitest";
import { act, render, screen } from "@testing-library/react";
import { CardStatusPanel } from "@/components/wizard/CardStatusPanel";
import { useLetterStore } from "@/lib/store";

describe("CardStatusPanel", () => {
  beforeEach(() => {
    localStorage.clear();
    useLetterStore.setState({ data: {}, meta: {}, hasHydrated: true });
  });

  it("says warmly what a card still needs, from an empty letter", () => {
    render(<CardStatusPanel section="gettingStarted" />);

    expect(screen.getByRole("complementary", { name: "Care cards" })).toBeInTheDocument();
    expect(
      screen.getByText(
        "The Identity & Contacts card needs their name and at least one person to call."
      )
    ).toBeInTheDocument();
  });

  it("updates live through the same store the autosave writes to", () => {
    render(<CardStatusPanel section="gettingStarted" />);
    expect(screen.getByText(/Identity & Contacts card needs/)).toBeInTheDocument();

    act(() => {
      useLetterStore.setState({
        data: {
          gettingStarted: { subjectFullName: "Alex Rivera" },
          familySupport: { contacts: [{ id: "c1", name: "Dana" }] },
        },
      });
    });

    expect(
      screen.getByText("The Identity & Contacts card has what it needs.")
    ).toBeInTheDocument();
  });

  it("does not count a record the family kept off the cards", () => {
    useLetterStore.setState({
      hasHydrated: true,
      meta: {},
      data: {
        gettingStarted: { subjectFullName: "Alex Rivera" },
        familySupport: { contacts: [{ id: "c1", name: "Dana", keepOffCards: true }] },
      },
    });
    render(<CardStatusPanel section="familySupport" />);

    expect(
      screen.getByText("The Identity & Contacts card needs at least one person to call.")
    ).toBeInTheDocument();
  });

  it("lists every card the section feeds, and only those", () => {
    render(<CardStatusPanel section="health" />);

    const lines = screen.getAllByRole("listitem");
    expect(lines).toHaveLength(4); // identity, emergency, meds, care
    expect(screen.queryByText(/Daily Routine/)).not.toBeInTheDocument();
  });

  it("renders nothing at all for a section that feeds no card", () => {
    const { container } = render(
      <CardStatusPanel section="finalWishes" />
    );
    expect(container).toBeEmptyDOMElement();
  });
});
