"use client";

import { useId, useState, type ReactNode } from "react";
import { cn } from "@/lib/cn";

interface DisclosureProps {
  label: string;
  children: ReactNode;
  className?: string;
}

/** Small progressive-disclosure toggle ("See an example", "Why no numbers?"). */
export function Disclosure({ label, children, className }: DisclosureProps) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <div className={className}>
      <button
        type="button"
        aria-expanded={open}
        aria-controls={id}
        onClick={() => setOpen((v) => !v)}
        className="inline-flex min-h-11 items-center gap-2 py-1 text-[0.9375rem] font-semibold text-accent underline-offset-4 hover:underline"
      >
        <span
          aria-hidden="true"
          className={cn(
            "tw-diamond transition-transform motion-reduce:transition-none",
            open && "scale-125"
          )}
        />
        {label}
      </button>
      {open ? (
        <div id={id} className="mt-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}
