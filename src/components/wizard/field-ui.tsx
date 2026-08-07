"use client";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { Disclosure } from "@/components/ui/Disclosure";

export const inputClasses =
  "w-full min-h-11 rounded-md border border-control bg-surface px-3 py-2.5 text-ink placeholder:text-faint";

export const textareaClasses = `${inputClasses} leading-relaxed`;

/** Digs a message out of RHF's (possibly nested) error object. */
export function errMessage(
  errors: FieldErrors,
  path: Array<string | number>
): string | undefined {
  let cur: unknown = errors;
  for (const p of path) {
    if (!cur || typeof cur !== "object") return undefined;
    cur = (cur as Record<string, unknown>)[String(p)];
  }
  if (cur && typeof cur === "object" && "message" in cur) {
    const m = (cur as { message?: unknown }).message;
    return typeof m === "string" && m ? m : undefined;
  }
  return undefined;
}

interface FieldShellProps {
  htmlFor: string;
  label: string;
  help?: string;
  helpId?: string;
  hint?: string;
  hintId?: string;
  example?: string;
  children: ReactNode;
}

/**
 * Standard wrapper for a single question: label, helper text, the input,
 * a gentle format hint (never blocking, never red), and an optional
 * "See an example" disclosure.
 */
export function FieldShell({
  htmlFor,
  label,
  help,
  helpId,
  hint,
  hintId,
  example,
  children,
}: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-medium text-ink">
        {label}
      </label>
      {help ? (
        <p id={helpId} className="mt-1 max-w-prose text-sm text-muted">
          {help}
        </p>
      ) : null}
      <div className="mt-1.5">{children}</div>
      <div aria-live="polite">
        {hint ? (
          <p id={hintId} className="mt-1.5 flex max-w-prose gap-1.5 text-sm text-hint">
            <span aria-hidden="true">✻</span>
            {hint}
          </p>
        ) : null}
      </div>
      {example ? (
        <Disclosure label="See an example" className="mt-0.5">
          <blockquote className="max-w-prose rounded-md border-l-2 border-goldline bg-paper2 px-3.5 py-3 text-sm text-body">
            <p className="italic">“{example}”</p>
            <footer className="mt-1.5 not-italic text-muted">
              — a sample answer, to show the level of detail. Yours can be shorter.
            </footer>
          </blockquote>
        </Disclosure>
      ) : null}
    </div>
  );
}

/** aria-describedby helper: joins only the ids that exist. */
export function describedBy(...ids: Array<string | false | undefined>): string | undefined {
  const list = ids.filter(Boolean);
  return list.length ? list.join(" ") : undefined;
}
