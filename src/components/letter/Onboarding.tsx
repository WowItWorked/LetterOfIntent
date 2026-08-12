"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { cn } from "@/lib/cn";
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
  /**
   * The document(s) this answer produces, shown as the option's title. Only
   * the audience question sets it: it is the one answer that decides what
   * comes out the other end, and a family choosing here is really choosing
   * between letters. `label` stays the answer to the question, so the answers
   * card below still summarises what was chosen rather than what it yields.
   */
  produces?: string;
  /**
   * Drop the label bullet. "Both" says nothing under a title that already
   * names both readers — but `label` stays the answer the answers card
   * summarises, so it cannot simply be deleted.
   */
  omitLabelPoint?: boolean;
  /**
   * The option, as bullets: who it reaches, what the letter carries, and where
   * it is thinner. The "thinner" line is not editorial — it is
   * lib/pdf/projections.ts read back in plain words, because which sections a
   * letter drops is the one thing a family cannot discover until they print.
   * Only `produces` is bold; these carry no emphasis of their own.
   */
  points?: readonly string[];
}

interface OnboardingQuestion {
  id: keyof LetterMeta & string;
  eyebrow: string;
  question: string;
  help?: string;
  options: OnboardingOption[];
  /** One bulleted line under the grid: what every option produces alike. */
  sharedPoint?: string;
  /** Multi-select questions store a string[] (schoolWork). */
  multi?: boolean;
}

export const ONBOARDING_QUESTIONS: OnboardingQuestion[] = [
  {
    id: "audience",
    eyebrow: "The letter",
    question: "Who do you most need this letter to reach?",
    help: "A trust is money set aside with someone appointed to manage it. This is the one answer that decides which letters you get; you can add the other at any time, and nothing you have written is lost when you do.",
    options: [
      {
        value: "trustee",
        produces: "The Trustee",
        label: "Whoever will manage money for them",
        points: [
          "A trustee, or the person who will one day take that role",
          "One letter is made: the Letter of Intent",
          "Focus area: the money, the benefits, the legal authority, and enough of the person that a trustee who never met them can judge well",
        ],
      },
      {
        value: "caregiver",
        produces: "The Caregiver",
        label: "Whoever will provide day-to-day care",
        points: [
          "Family, or someone paid to help",
          "One letter is made: the Letter for the Caregiver",
          "Focus area: the routines, the communication, the behavior, and health as it is actually lived — read in a kitchen at 7am",
        ],
      },
      {
        value: "both",
        produces: "Both the Trustee and Caregiver",
        label: "Both",
        omitLabelPoint: true,
        points: [
          "Two letters are made: the Letter of Intent and the Letter for the Caregiver",
          "Each written for its reader, from the one set of answers",
          "Focus area: everything, split so neither reader is handed what belongs to the other",
        ],
      },
    ],
    // True of every option, so it is said once under the grid rather than
    // three times inside it: audience gates only the two guidance sections and
    // one money field, none of which feeds a card (content/cards.ts SOURCES).
    // card-reachability.test.ts holds that fact.
    // "Eight", not seven: the pack is the seven topic cards plus the Which
    // Cards To Send index card (content/cards.ts), and the review page counts
    // it. Proper names for both documents, as everywhere else the tool names
    // what it produces.
    sharedPoint:
      "The Emergency Information Sheet and all eight care cards are created with every option, from the same answers.",
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
  // hasTrust was here. It gated exactly one optional field
  // (moneyBenefits.trusts), and that field was OR-gated with
  // audience ∈ {trustee, both} — so for two of the three audience answers the
  // question was inert, and its help text repeated question 1's first sentence
  // verbatim. The field is now asked of everyone; nobody loses access to it,
  // and the sequence loses a step.
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
  // livesWith was here. Its four options collapsed to one binary
  // (ownHome/withOthers) gating two fields, both in Home and daily living —
  // and that section's first question, "Current living situation: where they
  // live, with whom, and how it works day to day", already asks it in prose.
  // The two fields are now always asked, so the answer is given once, in the
  // section it belongs to, instead of twice.
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
                // flex-col, not the default block: a button centres its content
                // box vertically, so in a stretched grid row the shorter options
                // floated to the middle while their neighbours filled the card.
                "flex min-h-[64px] flex-col rounded-[var(--radius-sm)] border p-4 text-left transition-colors",
                active
                  ? "border-navy600 bg-paper2"
                  : "border-line bg-surface hover:border-gold500"
              )}
            >
              {/* The title is the only bold thing in the box; everything below
                  it is one weight, so the eye lands on the document produced
                  and then reads the bullets as a level list. Spans, not a ul —
                  a button's content model is phrasing content only. */}
              {o.produces ? (
                <>
                  <span className="block font-serif text-[1.3125rem] font-semibold leading-snug text-ink">
                    {fillName(o.produces, name)}
                  </span>
                  {[
                    ...(o.omitLabelPoint ? [] : [o.label]),
                    ...(o.points ?? []),
                  ].map((point) => (
                    <span
                      key={point}
                      className="mt-2 flex gap-2.5 text-[0.9375rem] leading-[1.55] text-muted"
                    >
                      <span className="tw-diamond mt-[7px] flex-none" aria-hidden="true" />
                      <span className="flex-1">{fillName(point, name)}</span>
                    </span>
                  ))}
                </>
              ) : (
                <>
                  <span className="block font-semibold text-ink">
                    {fillName(o.label, name)}
                  </span>
                  {o.hint ? (
                    <span className="mt-1 block text-[0.9375rem] leading-[1.55] text-muted">
                      {fillName(o.hint, name)}
                    </span>
                  ) : null}
                </>
              )}
            </button>
          );
        })}
      </div>

      {q.sharedPoint ? (
        // The list is already flush with the options grid, but the diamond is a
        // 7px square rotated 45° (globals.css), so what it PAINTS is 7√2 ≈ 9.9px
        // wide and hangs ~1.45px past its layout box on each side — enough for
        // the tip to sit outside the boxes' left border instead of on it.
        // Nudging by exactly that bleed puts the two edges on one line.
        <ul
          className="mt-5 list-none p-0"
          style={{ paddingLeft: "calc((7px * 1.4142136 - 7px) / 2)" }}
        >
          <li className="flex gap-2.5 text-[0.9375rem] leading-[1.6] text-body">
            <span className="tw-diamond mt-[8px] flex-none" aria-hidden="true" />
            <span className="flex-1">{fillName(q.sharedPoint, name)}</span>
          </li>
        </ul>
      ) : null}

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

