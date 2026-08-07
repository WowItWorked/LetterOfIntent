"use client";

import { useEffect, useId, useRef, type ReactNode } from "react";

interface DialogProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
}

/**
 * Accessible modal built on the native <dialog> element: focus trapping,
 * Escape handling, and focus restoration come from the platform.
 */
export function Dialog({ open, onClose, title, children }: DialogProps) {
  const ref = useRef<HTMLDialogElement>(null);
  const titleId = useId();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (open && !el.open) el.showModal();
    if (!open && el.open) el.close();
  }, [open]);

  return (
    <dialog
      ref={ref}
      onClose={onClose}
      onClick={(e) => {
        // A click on the backdrop targets the <dialog> element itself.
        if (e.target === ref.current) onClose();
      }}
      aria-labelledby={titleId}
      className="m-auto w-[min(92vw,34rem)] rounded-lg border border-line bg-surface p-0 text-body shadow-xl backdrop:bg-black/50"
    >
      <div className="p-6">
        <h2 id={titleId} className="mb-3 text-xl">
          {title}
        </h2>
        {children}
      </div>
    </dialog>
  );
}
