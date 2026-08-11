"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMemo, useState } from "react";
import { cn } from "@/lib/cn";
import { sectionsForMeta } from "@/lib/content/config";
import { previewPrompts } from "@/lib/content/preview-prompts";
import { resolveSectionWording } from "@/lib/content/types";
import { displayName, fillName } from "@/lib/derive";
import type { LetterMeta } from "@/lib/schema";
import { useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";
import { Eyebrow } from "@/components/ui/Eyebrow";

/**
 * The onboarding sequence: one adaptive form, shaped by these answers. The
 * questions, tokens, and gating live in docs/onboarding-questions.md; the
 * answers live in meta (routing state), never in the letter itself, and every
 * one of them can be changed later without losing a word of written work.
 */

interface OnboardingOption {
  value: string;
  label: string;
  hint?: string;
}

interface OnboardingQuestion {
  id: keyof LetterMeta & string;
  eyebrow: string;
  question: string;
  help?: string;
  options: OnboardingOption[];
  /** Multi-select questions store a string[] (schoolWork). */
  multi?: boolean;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "audience",
    eyebrow: "The letter",
    question: "Who do you most need this letter to reach?",
    help: "A trust is money set aside with someone appointed to manage it. This decides which documents you get; you can add the other at any time.",
    options: [
      {
        value: "trustee",
        label: "Whoever will manage money for them",
        hint: "A trustee, or the person who will one day take that role",
      },
      {
        value: "caregiver",
        label: "Whoever will provide day-to-day care",
        hint: "Family, or someone paid to help",
      },
      { value: "both", label: "Both" },
    ],
  },
  {
    id: "stage",
    eyebrow: "About them",
    question: "Is {name} a child or an adult?",
    options: [
      { value: "child", label: "A child" },
      { value: "adult", label: "An adult" },
    ],
  },
  {
    id: "supportLevel",
    eyebrow: "Day to day",
    question: "How much day-to-day support does {name} need right now?",
    options: [
      {
        value: "mostlyIndependent",
        label: "They mostly manage",
        hint: "Someone quietly fills the gaps",
      },
      { value: "someDailyHelp", label: "Help with parts of every day" },
      { value: "substantial", label: "Hands-on help through most of the day" },
      {
        value: "roundTheClock",
        label: "Someone with them, or on call, around the clock",
      },
    ],
  },
  {
    id: "communicationDiffers",
    eyebrow: "Communication",
    question:
      "Does {name} communicate differently than a stranger might expect?",
    help: "Speech that takes knowing them, a device or app that speaks for them, signs, or mostly without words.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "behaviorEscalates",
    eyebrow: "Hard moments",
    question: "Are there moments that can escalate?",
    help: "Meltdowns, wandering or bolting, aggression, or anything that could bring the police or 911 into it.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "cognitionChanging",
    eyebrow: "Memory",
    question: "Is {name}'s memory or thinking changing?",
    options: [
      { value: "yes", label: "Yes" },
      { value: "early", label: "Early signs" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "hasTrust",
    eyebrow: "Money",
    question: "Is there a trust for {name}, or a plan to create one?",
    help: "A trust is money set aside with someone appointed to manage it.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "planned", label: "We're planning one" },
      { value: "no", label: "No" },
      { value: "notSure", label: "I'm not sure" },
    ],
  },
  {
    id: "hasBenefits",
    eyebrow: "Benefits",
    question: "Does {name} receive public benefits, or might they apply?",
    help: "SSI, SSDI, Medicaid, Medicare, or a waiver. SSI is a monthly check for people with disabilities and limited income; a waiver pays for support at home.",
    options: [
      { value: "yes", label: "Yes" },
      { value: "maybe", label: "Maybe, or applying" },
      { value: "no", label: "No" },
    ],
  },
  {
    id: "schoolWork",
    eyebrow: "Their days",
    question: "Is school, a day program, work, or volunteering part of {name}'s life?",
    help: "Choose everything that applies.",
    multi: true,
    options: [
      { value: "school", label: "School or a day program" },
      { value: "work", label: "Work or volunteering" },
      { value: "neither", label: "Neither right now" },
    ],
  },
  {
    id: "livesWith",
    eyebrow: "Home",
    question: "Where does {name} live?",
    options: [
      { value: "withWriter", label: "With me" },
      { value: "ownHome", label: "In their own home" },
      { value: "withOthers", label: "With family or a roommate" },
      { value: "facility", label: "In a facility or supported residence" },
    ],
  },
];

type Answers = Partial<Record<string, string | string[]>>;

function answersFromMeta(meta: LetterMeta): Answers {
  const out: Answers = {};
  for (const q of ONBOARDING_QUESTIONS) {
    const v = meta[q.id as keyof LetterMeta];
    if (typeof v === "string" || Array.isArray(v)) out[q.id] = v as string | string[];
  }
  return out;
}

export function Onboarding() {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  // Mount the stateful sequence only after hydration, so its initial state
  // can read the persisted answers directly — no effect, no setState cascade.
  if (!hydrated) return null;
  return <OnboardingInner />;
}

function OnboardingInner() {
  const router = useRouter();
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const setMetaAnswers = useLetterStore((s) => s.setMetaAnswers);

  const name = displayName(data);
  // Pre-filled from meta on mount: a migrated letter arrives with inferred
  // answers, and a returning family sees what they chose.
  const [answers, setAnswers] = useState<Answers>(() => answersFromMeta(meta));
  const [step, setStep] = useState(0);
  const [editing, setEditing] = useState(false);

  const showSequence = !meta.onboardingDone || editing;
  const inferred = meta.onboardingInferred === true && !meta.onboardingDone;

  const finish = (final: Answers) => {
    setMetaAnswers({
      ...final,
      onboardingDone: true,
      onboardingInferred: false,
    } as Partial<LetterMeta>);
    setEditing(false);
    if (!meta.onboardingDone) router.push("/letter/getting-started");
  };

  return (
    <section id="start" className="mt-11 scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]">
      {showSequence ? (
        <QuestionSequence
          name={name}
          answers={answers}
          setAnswers={setAnswers}
          step={step}
          setStep={setStep}
          inferred={inferred}
          onFinish={finish}
          onCancel={meta.onboardingDone ? () => setEditing(false) : undefined}
        />
      ) : (
        <AnswersCard
          name={name}
          answers={answers}
          onEdit={(index) => {
            setStep(index);
            setEditing(true);
          }}
        />
      )}

      <QuestionPreview />
    </section>
  );
}

/* -------------------------------------------------------------- sequence */

function QuestionSequence({
  name,
  answers,
  setAnswers,
  step,
  setStep,
  inferred,
  onFinish,
  onCancel,
}: {
  name: string;
  answers: Answers;
  setAnswers: (a: Answers) => void;
  step: number;
  setStep: (n: number) => void;
  inferred: boolean;
  onFinish: (a: Answers) => void;
  onCancel?: () => void;
}) {
  const q = ONBOARDING_QUESTIONS[step];
  const total = ONBOARDING_QUESTIONS.length;
  const last = step === total - 1;
  const current = answers[q.id];

  const choose = (value: string) => {
    let next: Answers;
    if (q.multi) {
      const list = Array.isArray(current) ? [...current] : [];
      const has = list.includes(value);
      // "Neither" clears the others; picking anything clears "neither".
      const cleaned =
        value === "neither"
          ? []
          : list.filter((v) => v !== "neither");
      next = {
        ...answers,
        [q.id]: has ? cleaned.filter((v) => v !== value) : [...cleaned, value],
      };
      setAnswers(next);
      return;
    }
    next = { ...answers, [q.id]: value };
    setAnswers(next);
    // Single-choice advances on tap; the last question finishes.
    if (last) onFinish(next);
    else setStep(step + 1);
  };

  return (
    <div className="tw-card" style={{ padding: "30px clamp(24px, 3vw, 40px) 34px" }}>
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <Eyebrow>{q.eyebrow}</Eyebrow>
        <p className="text-xs text-faint">
          Question {step + 1} of {total}
        </p>
      </div>

      {inferred && step === 0 ? (
        <p className="mt-4 max-w-[70ch] rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-3.5 text-[0.9375rem] leading-[1.65] text-body">
          We read these answers from the letter you have already written. Nothing
          you wrote has changed. Confirm or adjust them, once, and the form will
          fit itself to {name}.
        </p>
      ) : null}

      <h2 className="mt-4 font-serif text-[clamp(1.5rem,3.5vw,2rem)] font-semibold tracking-[-0.01em] text-ink">
        {fillName(q.question, name)}
      </h2>
      {q.help ? (
        <p className="mt-2.5 max-w-[70ch] leading-[1.65] text-muted">
          {fillName(q.help, name)}
        </p>
      ) : null}

      <div
        className="mt-6 grid gap-3"
        style={{ gridTemplateColumns: "repeat(auto-fit, minmax(min(280px, 100%), 1fr))" }}
      >
        {q.options.map((o) => {
          const active = q.multi
            ? Array.isArray(current) && current.includes(o.value)
            : current === o.value;
          return (
            <button
              key={o.value}
              type="button"
              aria-pressed={active}
              onClick={() => choose(o.value)}
              className={cn(
                "min-h-[64px] rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
                active
                  ? "border-navy600 bg-paper2"
                  : "border-line bg-surface hover:border-gold500"
              )}
            >
              <span className="block font-semibold text-ink">{fillName(o.label, name)}</span>
              {o.hint ? (
                <span className="mt-1 block text-[0.9375rem] leading-[1.55] text-muted">
                  {fillName(o.hint, name)}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-5">
        <div className="flex items-center gap-4">
          {step > 0 ? (
            <button
              type="button"
              onClick={() => setStep(step - 1)}
              className="min-h-11 text-[0.9375rem] font-semibold text-muted hover:text-ink"
            >
              ← Back
            </button>
          ) : null}
          {onCancel ? (
            <button
              type="button"
              onClick={onCancel}
              className="min-h-11 text-[0.9375rem] text-muted underline underline-offset-[3px] hover:text-ink"
            >
              Keep my current answers
            </button>
          ) : null}
        </div>
        {q.multi ? (
          <Button onClick={() => (last ? onFinish(answers) : setStep(step + 1))}>
            {last ? "Finish and begin" : "Continue"}
          </Button>
        ) : last ? (
          <Button onClick={() => onFinish(answers)}>Finish and begin</Button>
        ) : (
          <button
            type="button"
            onClick={() => setStep(step + 1)}
            className="min-h-11 text-[0.9375rem] text-muted underline underline-offset-[3px] hover:text-ink"
          >
            Skip this question
          </button>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------------------------------- answers card */

function AnswersCard({
  name,
  answers,
  onEdit,
}: {
  name: string;
  answers: Answers;
  onEdit: (index: number) => void;
}) {
  const answerLabel = (q: OnboardingQuestion): string => {
    const v = answers[q.id];
    if (Array.isArray(v)) {
      const labels = v
        .map((t) => q.options.find((o) => o.value === t)?.label ?? t)
        .filter(Boolean);
      return labels.length ? labels.join(" · ") : "Not answered";
    }
    return q.options.find((o) => o.value === v)?.label ?? "Not answered";
  };

  return (
    <div
      id="answers"
      className="tw-card scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]"
      style={{ padding: "30px clamp(24px, 3vw, 40px) 34px" }}
    >
      <Eyebrow>Your answers</Eyebrow>
      <h2 className="mt-3 font-serif text-[1.75rem] font-semibold text-ink">
        The form is shaped around {name}.
      </h2>
      <p className="mt-3 max-w-[70ch] leading-[1.7] text-muted">
        These answers decide which questions you see, never what you have
        written. Change any of them and the letter re-fits itself; nothing is
        lost.
      </p>
      <ul className="mt-5 list-none divide-y divide-line rounded-[var(--radius-sm)] border border-line bg-surface p-0">
        {ONBOARDING_QUESTIONS.map((q, i) => (
          <li key={q.id} className="flex items-center gap-4 px-4 py-3">
            <span className="min-w-0 flex-1">
              <span className="block text-xs font-semibold uppercase tracking-[0.08em] text-faint">
                {q.eyebrow}
              </span>
              <span className="block text-[0.9375rem] text-ink">
                {fillName(answerLabel(q), name)}
              </span>
            </span>
            <button
              type="button"
              onClick={() => onEdit(i)}
              className="min-h-11 flex-none text-[0.9375rem] font-semibold text-accent underline-offset-[3px] hover:underline"
            >
              Change
              <span className="sr-only">: {fillName(q.question, name)}</span>
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}

/* ------------------------------------------------------- question preview */

/**
 * Every question this configuration will ask, before writing a word — the
 * question-set preview the old chooser carried, now driven by the live
 * answers. Sections show and hide as answers change, which doubles as the
 * plainest demonstration that the form adapts.
 */
function QuestionPreview() {
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const [open, setOpen] = useState<string | null>(null);
  const name = displayName(data);

  const sections = useMemo(() => sectionsForMeta(meta, data), [meta, data]);

  return (
    <section id="questions" className="mt-14 scroll-mt-[calc(clamp(64px,19vw,124px)+48px)]">
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
        These are the {sections.length} sections your answers put in play. Open any
        one to read what it asks for. Nothing is required. A section you skip
        simply will not appear in the letter.
      </p>

      <ul
        className="mt-7 list-none overflow-hidden rounded-[var(--radius-md)] border border-line bg-surface p-0"
        style={{ boxShadow: "var(--shadow-sm)" }}
      >
        {sections.map((def, i) => {
          const isOpen = open === def.slug;
          const prompts = previewPrompts[def.slug];
          const wording = resolveSectionWording(def, meta);
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
                <span className="flex-1 text-base text-ink">
                  {fillName(wording.navTitle, name)}
                  {def.optionalTag ? <span className="text-muted"> (optional)</span> : null}
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
