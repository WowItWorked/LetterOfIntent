/**
 * Calm, brand-drawn stands-ins for the three deliverables: shapes and the
 * house palette only, nothing legible. Decorative — the surrounding heading
 * and copy carry the meaning, so the art is hidden from assistive tech.
 * Shared by the home page's what-you-get tiles and the chooser's sample
 * cards.
 */
export function DeliverableArt({ kind }: { kind: "letter" | "sheet" | "cards" }) {
  if (kind === "letter") {
    return (
      <div aria-hidden="true" className="flex h-full items-center justify-center bg-white">
        {/* No page outline: on the white ground the emblem and its text lines
            stand alone, larger, like a letterhead rather than a boxed page. */}
        <div className="w-[52%] px-[4%] py-[5%]">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/emblem-envelope.png" alt="" className="mx-auto w-[58%]" />
          <div
            className="mx-auto mt-[7%] h-[3px] w-[64%]"
            style={{ background: "var(--gradient-gold)" }}
          />
          <div className="mx-auto mt-[6%] h-[6px] w-[82%] rounded-full bg-line" />
          <div className="mx-auto mt-[4.5%] h-[6px] w-[70%] rounded-full bg-line" />
        </div>
      </div>
    );
  }
  if (kind === "sheet") {
    return (
      <div aria-hidden="true" className="flex h-full items-center justify-center bg-white">
        <div
          className="w-[52%] overflow-hidden rounded-[6px] border border-line bg-white"
          style={{ boxShadow: "var(--shadow-md)", aspectRatio: "11 / 8.5" }}
        >
          <div className="h-[22%] bg-navy800" />
          <div className="grid grid-cols-2 gap-[6%] p-[7%]">
            <div>
              <div className="h-[5px] w-[85%] rounded-full bg-line" />
              <div className="mt-[9%] h-[5px] w-[70%] rounded-full bg-line" />
            </div>
            <div>
              <div className="h-[5px] w-[80%] rounded-full bg-line" />
              <div className="mt-[9%] h-[5px] w-[65%] rounded-full bg-line" />
            </div>
            <div
              className="col-span-2 rounded-[4px] px-[4%] py-[3.5%]"
              style={{ background: "var(--danger-bg, #f7e9e9)" }}
            >
              <div
                className="h-[5px] w-[46%] rounded-full"
                style={{ background: "var(--card-emergency)", opacity: 0.55 }}
              />
            </div>
          </div>
        </div>
      </div>
    );
  }
  return (
    <div aria-hidden="true" className="relative h-full bg-white">
      {(
        [
          ["var(--card-identity)", "-14%", "rotate(-8deg)"],
          ["var(--card-meds)", "14%", "rotate(8deg)"],
          ["var(--card-emergency)", "0%", "none"],
        ] as const
      ).map(([color, shift, rotate]) => (
        <div
          key={color}
          className="absolute left-1/2 top-1/2 w-[26%] overflow-hidden rounded-[7px] border border-line bg-white"
          style={{
            aspectRatio: "9 / 16",
            transform: `translate(calc(-50% + ${shift === "0%" ? "0px" : shift}), -50%) ${
              rotate === "none" ? "" : rotate
            }`,
            boxShadow: "var(--shadow-md)",
          }}
        >
          <div className="h-[30%]" style={{ background: color }} />
          <div className="p-[10%]">
            <div className="h-[4px] w-[80%] rounded-full bg-line" />
            <div className="mt-[12%] h-[4px] w-[62%] rounded-full bg-line" />
            <div className="mt-[12%] h-[4px] w-[72%] rounded-full bg-line" />
          </div>
        </div>
      ))}
    </div>
  );
}
