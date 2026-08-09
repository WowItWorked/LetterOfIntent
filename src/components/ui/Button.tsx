import { cn } from "@/lib/cn";
import type { ComponentPropsWithRef } from "react";

export type ButtonVariant =
  | "primary"
  | "secondary"
  | "quiet"
  | "danger"
  /** Gold gradient on navy text — the single loudest control on a screen. */
  | "accent"
  /** Ivory on navy grounds. */
  | "ivory"
  /** Hairline outline, for the quieter of a pair. */
  | "outline"
  /**
   * The same, on a navy ground. A separate variant rather than a className
   * override because `cn` is a plain joiner — two competing text-* classes
   * would be resolved by stylesheet order, not by intent.
   */
  | "outlineOnInk";

export type ButtonSize = "sm" | "md" | "lg";

const sizes: Record<ButtonSize, string> = {
  sm: "min-h-11 gap-2 px-4 text-[13px]",
  md: "min-h-11 gap-2.5 px-6 py-3 text-sm",
  lg: "min-h-[52px] gap-3 px-[34px] py-[15px] text-[15px]",
};

/**
 * The brand button face: uppercase Mulish 600 with generous tracking.
 *
 * Labels wrap rather than run off the edge. The design draws these on one
 * line, and at any comfortable width they still are — but "Download all three
 * together" in a 375px column is wider than the phone, and a clipped call to
 * action is worse than a two-line one.
 */
const engravedFace =
  "font-semibold uppercase tracking-[0.04em] leading-tight text-center text-balance";

export const buttonClasses = (
  variant: ButtonVariant = "primary",
  className?: string,
  size: ButtonSize = "md"
) =>
  cn(
    // Border width only — every variant sets its own colour. A shared
    // `border-transparent` here would fight the variants' colours, and `cn`
    // is a plain joiner with no conflict resolution.
    // max-w-full so a long label can never push a control past its container.
    "inline-flex max-w-full items-center justify-center rounded-[var(--radius-sm)] border-[1.5px]",
    "transition-[background,color,border-color,transform,box-shadow] duration-[var(--dur-fast)]",
    "motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-45",
    sizes[size],
    variant === "primary" &&
      `${engravedFace} border-navy700 bg-navy700 text-onink hover:bg-navy800`,
    variant === "accent" &&
      `${engravedFace} border-transparent text-navy900 hover:-translate-y-px hover:brightness-105 motion-reduce:transform-none`,
    variant === "ivory" &&
      `${engravedFace} border-gold400 bg-paper text-navy900 hover:-translate-y-px hover:border-gold500 hover:bg-white motion-reduce:transform-none`,
    variant === "outline" &&
      `${engravedFace} border-navy600 bg-transparent text-navy700 hover:border-gold500 hover:text-gold700`,
    variant === "outlineOnInk" &&
      `${engravedFace} border-navy500 bg-transparent text-gold300 hover:-translate-y-px hover:border-gold500 hover:text-gold200 motion-reduce:transform-none`,
    variant === "secondary" &&
      "min-h-11 rounded-md border border-control bg-surface px-5 py-2 text-[0.95rem] font-medium text-ink hover:bg-paper2",
    variant === "quiet" &&
      "min-h-11 rounded-md border-transparent px-3 py-2 text-[0.95rem] font-medium text-accent underline-offset-4 hover:underline",
    variant === "danger" &&
      "min-h-11 rounded-md border border-danger bg-surface px-5 py-2 text-[0.95rem] font-medium text-danger hover:bg-dangerbg",
    className
  );

/** Inline style for variants the token system expresses as a gradient. */
export const buttonStyle = (variant: ButtonVariant) =>
  variant === "accent"
    ? { background: "var(--gradient-gold)", boxShadow: "var(--shadow-gold)" }
    : undefined;

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
  size?: ButtonSize;
}

export function Button({
  variant = "primary",
  size = "md",
  className,
  type,
  style,
  ...rest
}: ButtonProps) {
  return (
    <button
      type={type ?? "button"}
      className={buttonClasses(variant, className, size)}
      style={{ ...buttonStyle(variant), ...style }}
      {...rest}
    />
  );
}
