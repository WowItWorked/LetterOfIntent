import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CareCard } from "@/components/cards/CareCard";
import type { CardData } from "@/lib/cards/types";

/**
 * Structure and theming only: jsdom does not rasterize, so pixel fidelity is
 * the raster spike's and Phase G's job. What jsdom CAN prove is that the six
 * zones exist, the critical treatment is more than a color (panel + bar +
 * padding), and the aria contract holds.
 */

function sampleCard(overrides: Partial<CardData> = {}): CardData {
  return {
    key: "emergency",
    color: "#a64545",
    deep: "#7f3232",
    tint: "#f6e9e7",
    t1: "Emergency",
    t2: "Protocol",
    titleSize: 74,
    spineLabel: "Emergency Protocol",
    purpose: "What to do, in order — and when to call 911.",
    iconPath: "M21.73 18 13.73 4a2 2 0 0 0-3.46 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z",
    personLine: "Bonnie, 11",
    footerMeta: "Updated August 8, 2026 · Not a medical document",
    blocks: [
      {
        label: "Allergies",
        tone: "critical",
        lines: [{ k: "Bee stings — ", v: "anaphylaxis." }],
      },
      {
        label: "What to do",
        lines: [
          { k: "1 · ", v: "Auto-injector, outer thigh." },
          { k: "2 · ", v: "Call 911." },
        ],
      },
    ],
    ...overrides,
  };
}

const ZONES = ["crop", "spine", "header", "rule", "body", "footer"] as const;

describe("CareCard", () => {
  it("renders as one labelled image with the interior hidden from the tree", () => {
    render(<CareCard card={sampleCard()} />);
    const img = screen.getByRole("img", {
      name: "Emergency Protocol care card for Bonnie, 11",
    });
    expect(img).toBeInTheDocument();
    expect(img.querySelector("[data-card-frame]")).toHaveAttribute("aria-hidden", "true");
  });

  it("renders all six zones", () => {
    const { container } = render(<CareCard card={sampleCard()} />);
    for (const zone of ZONES) {
      expect(container.querySelector(`[data-zone="${zone}"]`), zone).not.toBeNull();
    }
  });

  it("is exactly 1080x1920 at scale 1, and the crop-box shrinks with the scale", () => {
    const { container, rerender } = render(<CareCard card={sampleCard()} />);
    const crop = () => container.querySelector('[data-zone="crop"]') as HTMLElement;
    const frame = () => container.querySelector("[data-card-frame]") as HTMLElement;
    expect(crop().style.width).toBe("1080px");
    expect(crop().style.height).toBe("1920px");
    expect(frame().style.width).toBe("1080px");
    expect(frame().style.height).toBe("1920px");
    expect(frame().style.transform).toBe("scale(1)");

    rerender(<CareCard card={sampleCard()} scale={0.33} />);
    expect(crop().style.width).toBe(`${Math.round(1080 * 0.33)}px`);
    expect(frame().style.width).toBe("1080px"); // frame never changes; only the transform
    expect(frame().style.transform).toBe("scale(0.33)");
  });

  it("gives a critical block the tint panel and left bar; plain blocks get neither", () => {
    const { container } = render(<CareCard card={sampleCard()} />);
    const critical = container.querySelector('[data-block-tone="critical"]') as HTMLElement;
    const plain = container.querySelector('[data-block-tone="plain"]') as HTMLElement;

    const criticalStyle = critical.getAttribute("style") ?? "";
    expect(criticalStyle).toMatch(/border-left:\s*8px solid/);
    expect(criticalStyle).toMatch(/#f6e9e7|rgb\(246,\s*233,\s*231\)/i);
    expect(critical.style.padding).toBe("24px 28px 26px");

    const plainStyle = plain.getAttribute("style") ?? "";
    expect(plainStyle).not.toMatch(/8px solid/);
    expect(plain.style.padding).toBe("0px");
  });

  it("keys and values render inside their block, keys bold-marked", () => {
    render(<CareCard card={sampleCard()} />);
    expect(screen.getByText("Bee stings —", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("anaphylaxis.", { exact: false })).toBeInTheDocument();
    expect(screen.getByText("2 ·", { exact: false })).toBeInTheDocument();
  });

  it("navy theme swaps the paper surface", () => {
    const { container } = render(<CareCard card={sampleCard()} theme="navy" />);
    const body = container.querySelector('[data-zone="body"]') as HTMLElement;
    expect(body.getAttribute("style") ?? "").toMatch(/#16223A|rgb\(22,\s*34,\s*58\)/i);
  });

  it("shows the person zone only when the card carries a person", () => {
    const { container, rerender } = render(<CareCard card={sampleCard()} />);
    expect(container.textContent).not.toContain("Photo");

    rerender(
      <CareCard
        card={sampleCard({
          key: "identity",
          person: { name: "Bonnie Marie Kelly", sub: "Goes by Bonnie", sub2: "12 Maple Street" },
        })}
      />
    );
    expect(container.textContent).toContain("Photo");
    expect(container.textContent).toContain("Bonnie Marie Kelly");
    expect(container.textContent).toContain("12 Maple Street");
  });

  it("stamps each block with its index for pagination measurement", () => {
    const { container } = render(<CareCard card={sampleCard()} />);
    const blocks = Array.from(container.querySelectorAll<HTMLElement>("[data-block-index]"));
    expect(blocks.map((b) => b.dataset.blockIndex)).toEqual(["0", "1"]);
  });

  it("shows the continuation marker on the header meta line of a multi-page card", () => {
    const { container } = render(<CareCard card={sampleCard({ pageIndex: 2, pageCount: 3 })} />);
    const header = container.querySelector('[data-zone="header"]') as HTMLElement;
    expect(header.textContent).toContain("Bonnie, 11 · 2 of 3");
    // The spoken label carries the page too, or every continuation card would
    // sound identical to page 1.
    expect(
      screen.getByRole("img", {
        name: "Emergency Protocol care card for Bonnie, 11, page 2 of 3",
      })
    ).toBeInTheDocument();
  });

  it("shows no marker on a single-page card", () => {
    const { container, rerender } = render(<CareCard card={sampleCard()} />);
    const header = () => container.querySelector('[data-zone="header"]') as HTMLElement;
    expect(header().textContent).toContain("Bonnie, 11");
    expect(header().textContent).not.toContain(" of ");

    rerender(<CareCard card={sampleCard({ pageIndex: 1, pageCount: 1 })} />);
    expect(header().textContent).not.toContain(" of ");
  });

  it("drops the meta separator when there is no person line", () => {
    const { container } = render(
      <CareCard card={sampleCard({ personLine: "", pageIndex: 1, pageCount: 2 })} />
    );
    const header = container.querySelector('[data-zone="header"]') as HTMLElement;
    expect(header.textContent).toContain("1 of 2");
    expect(header.textContent).not.toContain("· 1 of 2");
  });

  it("omits the second title line when t2 is absent", () => {
    const { container } = render(
      <CareCard card={sampleCard({ t1: "Medications", t2: undefined, spineLabel: "Medications" })} />
    );
    const header = container.querySelector('[data-zone="header"]') as HTMLElement;
    expect(header.textContent).toContain("Medications");
    expect(header.textContent).not.toContain("Protocol");
  });
});
