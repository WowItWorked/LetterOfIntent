import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

export type EyebrowTone = "gold" | "light" | "navy";

/**
 * The engraved all-caps label that precedes section titles, with a gold
 * diamond marker — optionally flanked by a second one when centered.
 *
 * The brand system sets the gold tone to --gold-600. At 12px that lands at
 * 3.6:1 on ivory, so small gold text uses --accent-text (the same champagne,
 * darkened to clear 4.5:1). The site's audience is older caregivers and the
 * build gates on zero axe violations.
 */
export function Eyebrow({
  children,
  align = "left",
  tone = "gold",
  flanked = false,
  diamonds = true,
  className,
}: {
  children: ReactNode;
  align?: "left" | "center";
  tone?: EyebrowTone;
  flanked?: boolean;
  /** False drops the diamond markers entirely — for the hero, where the gold
   *  rule directly above already carries one. */
  diamonds?: boolean;
  className?: string;
}) {
  const color =
    tone === "light" ? "text-gold300" : tone === "navy" ? "text-navy600" : "text-accent";

  return (
    <span
      className={cn(
        "tw-engraved inline-flex items-center gap-3 text-xs font-medium",
        "tracking-[0.26em]",
        color,
        align === "center" ? "justify-center" : "justify-start",
        className
      )}
    >
      {diamonds ? <span className="tw-diamond tw-diamond--sm" aria-hidden="true" /> : null}
      {children}
      {diamonds && flanked ? (
        <span className="tw-diamond tw-diamond--sm" aria-hidden="true" />
      ) : null}
    </span>
  );
}
