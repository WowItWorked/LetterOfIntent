import { cn } from "@/lib/cn";
import type { ComponentPropsWithRef } from "react";

export type ButtonVariant = "primary" | "secondary" | "quiet" | "danger";

export const buttonClasses = (variant: ButtonVariant = "primary", className?: string) =>
  cn(
    "inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-5 py-2 text-[0.95rem] font-medium",
    "transition-colors motion-reduce:transition-none disabled:pointer-events-none disabled:opacity-50",
    variant === "primary" &&
      "bg-[var(--btn-bg)] text-[var(--btn-fg)] hover:bg-[var(--btn-bg-hover)]",
    variant === "secondary" &&
      "border border-control bg-surface text-ink hover:bg-paper2",
    variant === "quiet" && "px-3 text-accent underline-offset-4 hover:underline",
    variant === "danger" &&
      "border border-danger bg-surface text-danger hover:bg-dangerbg",
    className
  );

interface ButtonProps extends ComponentPropsWithRef<"button"> {
  variant?: ButtonVariant;
}

export function Button({ variant = "primary", className, type, ...rest }: ButtonProps) {
  return (
    <button type={type ?? "button"} className={buttonClasses(variant, className)} {...rest} />
  );
}
