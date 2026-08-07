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
        className="inline-flex min-h-11 items-center gap-1.5 py-1 text-sm font-medium text-accent underline-offset-4 hover:underline"
      >
        <span aria-hidden="true" className={cn("text-xs transition-transform motion-reduce:transition-none", open && "rotate-90")}>
          ▶
        </span>
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
