"use client";

import type { ReactNode } from "react";
import type { FieldErrors } from "react-hook-form";
import { Disclosure } from "@/components/ui/Disclosure";

/*
 * No `focus:outline-none` here. Suppressing the outline and substituting a
 * soft-gold box-shadow measured 1.58:1 against the white field — effectively
 * invisible, and the single most-converged finding in the audit. The global
 * :focus-visible rule in globals.css now draws a two-tone ring that works on
 * every ground, so these fields only need to not fight it.
 */
export const inputClasses =
  "w-full min-h-11 rounded-[var(--radius-sm)] border border-control bg-surface px-3.5 py-2.5 " +
  "text-base text-ink placeholder:text-faint focus:border-gold400";

/*
 * Capped at the measure the design system already defines. Uncapped, the boxes
 * where parents write the hardest prose in the document ran to 105 characters
 * a line on a wide screen — well past the 45–75 that sustained reading wants,
 * and worst exactly where the writing is most difficult. The box stays as wide
 * as the column; only the text is bounded.
 */
export const textareaClasses = `${inputClasses} resize-y leading-[1.7] max-w-[70ch]`;

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
  /** "Appears on the … card" line from lib/cards/status — config-driven. */
  marker?: string;
  markerId?: string;
  help?: string;
  helpId?: string;
  hint?: string;
  hintId?: string;
  example?: string;
  children: ReactNode;
}

/**
 * Standard wrapper for a single question: label, an optional card marker,
 * helper text, the input, a gentle format hint (never blocking, never red),
 * and an optional "See an example" disclosure.
 */
export function FieldShell({
  htmlFor,
  label,
  marker,
  markerId,
  help,
  helpId,
  hint,
  hintId,
  example,
  children,
}: FieldShellProps) {
  return (
    <div>
      <label htmlFor={htmlFor} className="block font-semibold text-ink">
        {label}
      </label>
      {marker ? (
        <p id={markerId} className="mt-1 text-[0.8125rem] text-muted">
          {marker}
        </p>
      ) : null}
      {help ? (
        <p id={helpId} className="mt-1.5 max-w-[66ch] text-[0.9375rem] text-muted">
          {help}
        </p>
      ) : null}
      <div className="mt-2.5">{children}</div>
      <div aria-live="polite">
        {hint ? (
          <p
            id={hintId}
            className="mt-1.5 flex max-w-[66ch] gap-1.5 text-[0.9375rem] text-hint"
          >
            <span aria-hidden="true">✻</span>
            {hint}
          </p>
        ) : null}
      </div>
      {example ? (
        <Disclosure label="See an example" className="mt-2.5">
          <blockquote className="max-w-[66ch] rounded-r-[var(--radius-sm)] border-l-2 border-gold400 bg-paper2 px-[18px] py-3.5">
            <p className="font-serif text-lg italic leading-[1.6] text-ink">
              &ldquo;{example}&rdquo;
            </p>
            <footer className="mt-2.5 text-xs not-italic text-muted">
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
