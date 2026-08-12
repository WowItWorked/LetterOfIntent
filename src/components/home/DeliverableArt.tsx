/**
 * Calm, brand-drawn stands-ins for the deliverables: shapes and the house
 * palette only, nothing legible. Decorative — the surrounding heading and
 * copy carry the meaning, so the art is hidden from assistive tech. Shared
 * by the home page's what-you-get tiles and the chooser's sample cards.
 *
 * "letter" and "caregiver" are deliberately different drawings. They sit
 * side by side on the home page, and two identical panels would read as a
 * rendering bug rather than as two documents.
 */
export function DeliverableArt({
  kind,
}: {
  kind: "letter" | "caregiver" | "sheet" | "cards";
}) {
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
  if (kind === "caregiver") {
    return (
      <div aria-hidden="true" className="flex h-full items-center justify-center bg-white">
        {/* A page of ordered steps rather than a letterhead: the gold rule at
            the head, then a run of timed lines. What this letter looks like
            from across a kitchen is a list of the day in order. */}
        {/* 34%, not the sheet tile's 52%: this page is portrait, so its height
            is driven by its width times 11/8.5. At 46% it stood nearly panel-
            high and read as heavier than its three neighbours; at 34% it takes
            about 70% of the panel, matching their breathing room. */}
        <div
          className="w-[34%] overflow-hidden rounded-[6px] border border-line bg-white"
          style={{ boxShadow: "var(--shadow-md)", aspectRatio: "8.5 / 11" }}
        >
          <div className="h-[7%]" style={{ background: "var(--gradient-gold)" }} />
          <div className="px-[12%] pt-[11%]">
            {[82, 68, 76, 60, 71].map((width, i) => (
              <div key={width} className={i === 0 ? "flex items-center gap-[7%]" : "mt-[11%] flex items-center gap-[7%]"}>
                <span className="tw-diamond tw-diamond--sm flex-none" />
                <span
                  className="h-[5px] rounded-full bg-line"
                  style={{ width: `${width}%` }}
                />
              </div>
            ))}
          </div>
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
          {/* Six boxes in two columns, which is what the real sheet is: a navy
              identity band over bordered boxes, with allergies ruled in red,
              the emergency protocol in gold, and contacts in navy. The old art
              showed two bare line-pairs and one red block, so it read as a
              memo rather than the dense one-pager it stands for. Order matches
              the document column by column — the grid fills row-wise, so the
              pairs below are [left, right] of each row. */}
          <div className="h-[20%] bg-navy800" />
          <div className="grid grid-cols-2 gap-x-[7%] gap-y-[5%] p-[6%]">
            {(
              [
                ["var(--line)", 78, 58],
                ["var(--line)", 70, 62],
                ["var(--card-emergency)", 62, 48],
                ["var(--line)", 74, 55],
                ["var(--gold-500)", 66, 52],
                ["var(--navy-800)", 72, 45],
              ] as const
            ).map(([accent, w1, w2], i) => (
              <div
                key={i}
                className="overflow-hidden rounded-[3px] border border-line px-[8%] py-[7%]"
              >
                <div
                  className="h-[3px] rounded-full"
                  style={{ width: `${w1}%`, background: accent, opacity: 0.7 }}
                />
                <div
                  className="mt-[14%] h-[3px] rounded-full bg-line"
                  style={{ width: `${w2}%` }}
                />
              </div>
            ))}
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
