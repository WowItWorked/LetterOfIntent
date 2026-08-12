"use client";

import Link from "next/link";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { allSections } from "@/lib/content/config";
import { previewPrompts } from "@/lib/content/preview-prompts";
import { resolveSectionWording } from "@/lib/content/types";
import { fillName } from "@/lib/derive";
import type { LetterMeta } from "@/lib/schema";

/**
 * Every question the letter can ask, read by someone who has not started one.
 *
 * The sibling of the wizard-side preview this replaced: that one showed the
 * sections ONE letter's answers put in play, driven by the store. This is the
 * whole roster, ungated and store-free, because a reader deciding whether to
 * begin is asking what they would be taking on — not what their (nonexistent)
 * answers have selected. Nothing here reads or writes the letter, so the page
 * stays the same page for a first-time visitor and for a search engine.
 */

/** No answers given: every section shows, in its broadest-audience wording. */
const NO_META: LetterMeta = {};

/** Content strings carry {name}; with no letter there is no name to fill. */
const NEUTRAL_NAME = "your loved one";

export function QuestionCatalog() {
  const [open, setOpen] = useState<string | null>(null);
  const sections = allSections();

  return (
    <section id="questions" className="scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]">
      <p className="tw-engraved flex items-center gap-3.5 text-xs tracking-[0.16em] text-accent">
        Prepare
        <span
          aria-hidden="true"
          className="h-px flex-1 opacity-45"
          style={{ background: "var(--gradient-gold)" }}
        />
      </p>
      <h2 className="mt-3.5 font-serif text-[clamp(1.7rem,4vw,2.25rem)] font-semibold tracking-[-0.01em] text-ink">
        Every question, before you start.
      </h2>
      <p className="mt-3 max-w-[76ch] text-lg leading-[1.7] text-muted">
        These are the {sections.length} sections the letter can ask about. Open any one
        to read what it asks for. You will not see all of them: a few questions at the
        start shape the form around the person you care for, and the sections that do
        not fit are never asked. Nothing is required, and a section you skip simply
        will not appear in the letter.
      </p>

      <ul
        className="mt-7 list-none overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-0"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {sections.map((def, i) => {
          const isOpen = open === def.slug;
          const prompts = previewPrompts[def.slug];
          const wording = resolveSectionWording(def, NO_META);
          return (
            <li key={def.slug} className={i === 0 ? undefined : "border-t border-line"}>
              <button
                type="button"
                onClick={() => setOpen(isOpen ? null : def.slug)}
                aria-expanded={isOpen}
                className={cn(
                  "flex min-h-[56px] w-full items-center gap-4 border-0 border-l-2 px-6 py-3.5 text-left transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none",
                  isOpen
                    ? "border-l-gold500 bg-paper2"
                    : "border-l-transparent bg-transparent hover:bg-paper"
                )}
              >
                <span
                  aria-hidden="true"
                  className={cn(
                    "tw-engraved w-[2.4ch] flex-none text-xs",
                    isOpen ? "text-accent" : "text-faint"
                  )}
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {/* No "(optional)" tag here, unlike the wizard rail: every
                    question in the letter is optional, so marking seven of the
                    twenty-one implies the other fourteen are not. The intro
                    above says it once, for all of them. */}
                <span className="flex-1 text-base text-ink">
                  {fillName(wording.navTitle, NEUTRAL_NAME)}
                </span>
                <svg
                  aria-hidden="true"
                  viewBox="0 0 16 16"
                  className={cn(
                    "size-3.5 flex-none transition-transform duration-[var(--dur-base)] motion-reduce:transition-none",
                    isOpen ? "rotate-180 text-accent" : "text-faint"
                  )}
                >
                  <path
                    d="M4 6l4 4 4-4"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                  />
                </svg>
              </button>

              {isOpen && prompts ? (
                <div className="bg-paper2 pb-[26px] pl-[62px] pr-[26px] pt-0.5">
                  <p className="tw-engraved mb-3 text-xs tracking-[0.18em] text-accent">
                    Be ready to write about
                  </p>
                  <ul className="list-none p-0">
                    {prompts.map((p) => (
                      <li key={p} className="mb-2.5 flex gap-3 last:mb-0">
                        <span className="tw-diamond mt-2 flex-none" aria-hidden="true" />
                        <span className="flex-1 text-[0.9375rem] leading-[1.65]">{p}</span>
                      </li>
                    ))}
                  </ul>
                  <p className="mt-[18px]">
                    <Link
                      href={`/letter/${def.slug}`}
                      className="text-[0.9375rem] font-semibold text-accent underline-offset-4 hover:underline"
                    >
                      Open this section &rarr;
                    </Link>
                  </p>
                </div>
              ) : null}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
