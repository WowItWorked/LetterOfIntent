"use client";

import { useSettingsStore, type TextSize } from "@/lib/settings-store";
import { cn } from "@/lib/cn";

/**
 * Text-size and contrast controls. They live on the navy masthead, so they
 * use the header palette tokens.
 */

const SIZES: Array<{ value: TextSize; label: string; className: string }> = [
  { value: 1, label: "Standard text size", className: "text-[0.8rem]" },
  { value: 2, label: "Large text size", className: "text-[0.95rem]" },
  { value: 3, label: "Largest text size", className: "text-[1.1rem]" },
];

export function TextSizeControl() {
  const textSize = useSettingsStore((s) => s.textSize);
  const setTextSize = useSettingsStore((s) => s.setTextSize);
  return (
    <div role="group" aria-label="Text size" className="flex items-end">
      {SIZES.map((size) => (
        <button
          key={size.value}
          type="button"
          aria-label={size.label}
          aria-pressed={textSize === size.value}
          onClick={() => setTextSize(size.value)}
          className={cn(
            "flex min-h-11 min-w-9 items-end justify-center rounded-md px-1 pb-2 font-serif leading-none",
            size.className,
            textSize === size.value
              ? "text-[var(--header-fg)] shadow-[inset_0_-2px_0_var(--header-accent)]"
              : "text-[var(--header-muted)] hover:text-[var(--header-fg)]"
          )}
        >
          <span aria-hidden="true">A</span>
        </button>
      ))}
    </div>
  );
}

export function ContrastToggle() {
  const contrast = useSettingsStore((s) => s.contrast);
  const setContrast = useSettingsStore((s) => s.setContrast);
  const on = contrast === "high";
  return (
    <button
      type="button"
      aria-pressed={on}
      onClick={() => setContrast(on ? "default" : "high")}
      className={cn(
        "flex min-h-11 items-center gap-1.5 rounded-md px-2 text-sm font-medium",
        on
          ? "text-[var(--header-fg)] shadow-[inset_0_-2px_0_var(--header-accent)]"
          : "text-[var(--header-muted)] hover:text-[var(--header-fg)]"
      )}
    >
      <span
        aria-hidden="true"
        className="inline-block size-3.5 rounded-full border border-current"
        style={{ background: "linear-gradient(90deg, currentColor 50%, transparent 50%)" }}
      />
      Contrast
    </button>
  );
}
