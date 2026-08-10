"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
import { LETTER_PATHS, type LetterPath, pathDef } from "@/lib/content/paths";
import { previewPrompts } from "@/lib/content/preview-prompts";
import { fillName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { Eyebrow } from "@/components/ui/Eyebrow";
import { SampleDocuments } from "@/components/home/SampleDocuments";

/** Engraved section label with a gold hairline running out of it. */
function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <p className="tw-engraved flex items-center gap-3.5 text-xs tracking-[0.16em] text-accent">
      {children}
      <span
        aria-hidden="true"
        className="h-px flex-1 opacity-45"
        style={{ background: "var(--gradient-gold)" }}
      />
    </p>
  );
}

/**
 * The chooser: two full option cards, then the tabbed preview of every
 * question in either set. Picking a card sets the letter's path and opens its
 * first section.
 */
export function PathChooser() {
  const router = useRouter();
  const setLetterPath = useLetterStore((s) => s.setLetterPath);
  const storedPath = useLetterStore((s) => s.meta.letterPath);

  const [tab, setTab] = useState<LetterPath>("special-needs");
  const [open, setOpen] = useState<string | null>(null);

  const active = pathDef(tab);

  const begin = (path: LetterPath) => {
    setLetterPath(path);
    router.push(`/letter/${pathDef(path).sections[0].slug}`);
  };

  const pick = (path: LetterPath) => {
    setTab(path);
    setOpen(null);
  };

  return (
    <>
      {/* ---------------------------------------------------------- step one */}
      <section id="pick" className="mt-11 scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]">
        <SectionLabel>Start</SectionLabel>
        <h2 className="mt-3.5 font-serif text-[clamp(1.7rem,4vw,2.25rem)] font-semibold tracking-[-0.01em] text-ink">
          Pick the letter that fits your family.
        </h2>
        <p className="mt-3 max-w-[76ch] text-lg leading-[1.7] text-muted">
          Who you care for decides which letter you write. Option 1 adds what a trustee
          and a special needs trust require. Option 2 covers the same daily ground
          without them.
        </p>

        <div
          className="mt-8 grid gap-7"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}
        >
          {LETTER_PATHS.map((p, i) => (
            <button
              key={p.id}
              type="button"
              onClick={() => begin(p.id)}
              className="flex flex-col overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface text-left transition-[transform,box-shadow,border-color] duration-[var(--dur-base)] hover:-translate-y-[3px] hover:border-gold400 hover:shadow-[var(--shadow-md)] motion-reduce:transform-none motion-reduce:transition-none"
              style={{ boxShadow: "var(--shadow-sm)" }}
            >
              <span
                className="block h-[3px] w-full"
                style={{
                  background: "var(--gradient-gold)",
                  opacity: i === 0 ? 1 : 0.55,
                }}
              />
              <span
                className="flex flex-1 flex-col"
                style={{ padding: "34px clamp(24px, 3vw, 38px)" }}
              >
                <span className="tw-engraved mb-3.5 flex items-center gap-3 text-xs tracking-[0.16em] text-accent">
                  Option {i + 1}
                  <span
                    aria-hidden="true"
                    className="h-px flex-1 opacity-45"
                    style={{ background: "var(--gradient-gold)" }}
                  />
                </span>
                {/* optionName, not audience: the card names the FORM here —
                    the rail keeps audience for who it serves. */}
                <Eyebrow>{p.optionName}</Eyebrow>
                <span className="mt-3.5 block font-serif text-[1.75rem] font-semibold text-ink">
                  {p.promise}
                </span>
                <span className="mt-3.5 block min-h-[136px] leading-[1.7] text-body">
                  {p.longBlurb}
                </span>
                <span className="mt-4 block border-t border-line pt-3.5 text-[0.9375rem] leading-[1.65] text-muted">
                  <strong className="font-semibold text-ink">{p.differenceLabel}</strong>{" "}
                  {p.difference}
                </span>
                <span className="mt-auto block pt-3.5">
                  <span className="block text-xs text-faint">
                    {p.countWord} sections · about {p.minutesLabel}
                  </span>
                  <span className="mt-4 block text-[0.9375rem] font-semibold tracking-[0.02em] text-accent">
                    {p.startLabel} &rarr;
                  </span>
                </span>
              </span>
            </button>
          ))}
        </div>

        {/*
          One sample card per path, aligned under the option cards. They moved
          here from the home page: the moment someone is choosing a letter is
          the moment "what do I actually get?" needs answering. The option
          cards are buttons, so the sample links live outside them — nested
          interactive controls are an axe violation. One shared label, not one
          per column: the same engraved words twice in a row read as an error.
        */}
        <div className="mt-6 border-t border-line pt-5">
          <p className="tw-engraved text-xs tracking-[0.15em] text-accent">See Samples</p>
          <div
            className="mt-3 grid gap-x-7 gap-y-3.5"
            style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(320px, 100%), 1fr))" }}
          >
            {LETTER_PATHS.map((p) => (
              <SampleDocuments key={p.id} path={p.id} letterOnly />
            ))}
          </div>
        </div>
      </section>

      {/* ---------------------------------------------------------- step two */}
      <section
        id="questions"
        className="mt-14 scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]"
      >
        <SectionLabel>Prepare</SectionLabel>
        <h2 className="mt-3.5 font-serif text-[clamp(1.7rem,4vw,2.25rem)] font-semibold tracking-[-0.01em] text-ink">
          Every question, before you start.
        </h2>
        <p className="mt-3 max-w-[76ch] text-lg leading-[1.7] text-muted">
          Pick which set of questions you want to see, then open any section to read what
          it asks for. Nothing is required. A section you skip simply will not appear in
          the letter.
        </p>

        <div
          className="mt-[30px] grid gap-2.5"
          style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(260px, 100%), 1fr))" }}
          role="tablist"
          aria-label="Which set of questions"
        >
          {LETTER_PATHS.map((p) => {
            const on = tab === p.id;
            return (
              <button
                key={p.id}
                type="button"
                role="tab"
                aria-selected={on}
                aria-controls="question-set"
                onClick={() => pick(p.id)}
                className={cn(
                  "flex min-h-[62px] flex-col items-center justify-center rounded-[var(--radius-sm)] border px-[18px] py-3 text-center text-[0.9375rem] font-semibold tracking-[0.02em] transition-colors duration-[var(--dur-fast)] motion-reduce:transition-none",
                  on
                    ? "border-navy700 bg-navy700 text-onink"
                    : "border-line2 bg-transparent text-navy700 hover:border-gold500"
                )}
              >
                <span className="block">{p.tabLabel}</span>
                <span className="mt-[3px] block text-xs font-normal uppercase tracking-[0.08em] opacity-70">
                  {p.sections.length} sections
                </span>
              </button>
            );
          })}
        </div>

        <div id="question-set">
          <div
            className="mt-3.5 rounded-t-[var(--radius-md)] text-left"
            style={{
              background:
                "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
              padding: "26px clamp(22px, 2.6vw, 32px) 24px",
            }}
          >
            <p className="tw-engraved text-xs tracking-[0.15em] text-gold400">
              What this set asks
            </p>
            <p className="mt-2.5 font-serif text-[1.75rem] leading-[1.25] text-onink">
              {active.setHeading}
            </p>
            <p className="mt-3 max-w-[76ch] leading-[1.7] text-oninkbody">
              {active.setBlurb}
            </p>
            <p className="mt-[18px] border-t border-navy500 pt-4 text-[0.9375rem] text-oninkmuted">
              {active.otherPrompt}{" "}
              <button
                type="button"
                onClick={() =>
                  pick(tab === "special-needs" ? "general" : "special-needs")
                }
                className="border-0 bg-transparent p-0 text-[0.9375rem] font-semibold text-gold400 underline underline-offset-[3px] hover:text-onink"
              >
                See the other set &rarr;
              </button>
            </p>
          </div>

          <ul
            className="list-none overflow-hidden rounded-b-[var(--radius-md)] border border-t-0 border-line bg-surface p-0"
            style={{ boxShadow: "var(--shadow-sm)" }}
          >
            {active.sections.map((def, i) => {
              const key = `${tab}-${def.slug}`;
              const isOpen = open === key;
              const prompts = previewPrompts[def.slug];
              return (
                <li key={key} className={i === 0 ? undefined : "border-t border-line"}>
                  <button
                    type="button"
                    onClick={() => setOpen(isOpen ? null : key)}
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
                    <span className="flex-1 text-base text-ink">
                      {fillName(def.navTitle, "them")}
                    </span>
                    <span className="flex-none text-xs text-faint">{def.minutes} min</span>
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
                          onClick={() => setLetterPath(tab)}
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
        </div>

        <p className="mt-[22px] text-[0.9375rem] text-muted">
          Each section shows how long it usually takes, so you can pick one that fits the
          time you have tonight.
          {storedPath ? (
            <>
              {" "}
              You are currently writing the{" "}
              <strong className="font-semibold text-ink">
                {pathDef(storedPath).tabLabel.toLowerCase()}
              </strong>{" "}
              letter.
            </>
          ) : null}
        </p>
      </section>
    </>
  );
}
