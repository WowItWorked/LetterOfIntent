"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  nextSection,
  prevSection,
  resolveSlug,
  sectionInPlay,
  sectionPosition,
} from "@/lib/content/config";
import type { SectionDef } from "@/lib/content/types";
import { resolveSectionWording } from "@/lib/content/types";
import { displayName, fillName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { CardStatusPanel } from "@/components/wizard/CardStatusPanel";
import { SectionForm } from "@/components/wizard/SectionForm";
import { PhotoFields } from "@/components/wizard/PhotoFields";
import { Button, buttonClasses } from "@/components/ui/Button";

export function SectionScreen({ slug }: { slug: string }) {
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const setLastVisited = useLetterStore((s) => s.setLastVisited);

  const def = resolveSlug(slug);

  useEffect(() => {
    if (!hydrated || !def) return;
    setLastVisited(def.slug);
  }, [hydrated, def, setLastVisited]);

  if (!def) return null; // the server component already 404s unknown slugs

  const name = displayName(data);
  const wording = resolveSectionWording(def, meta);
  const { index, total } = sectionPosition(def.slug, meta, data);
  const acked =
    meta.emotionalAcks?.includes(def.slug) ??
    (def.slug === "final-wishes" && meta.finalWishesAck === true);
  const showGate = Boolean(def.emotional && hydrated && !acked);
  const next = nextSection(def.slug, meta, data);
  const inPlay = sectionInPlay(def, meta, data);

  return (
    <article>
      {/* ------------------------------------------------------ header panel */}
      <div
        className="rounded-[var(--radius-md)]"
        style={{
          background: "linear-gradient(168deg, var(--navy-800) 0%, var(--navy-900) 82%)",
          boxShadow: "var(--shadow-md)",
          padding: "clamp(26px, 3.4vw, 44px) clamp(24px, 3.4vw, 44px)",
        }}
      >
        <p className="tw-engraved text-xs tracking-[0.22em] text-gold400">
          {index > 0 ? `Section ${String(index).padStart(2, "0")} of ${total}` : "Section"}
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.01em] text-onink">
          {fillName(wording.title, name)}
        </h1>
        {fillName(wording.intro, name)
          .split("\n\n")
          .map((p, i) => (
            <p key={i} className="mt-[18px] max-w-[62ch] text-lg leading-[1.7] text-oninkbody">
              {p}
            </p>
          ))}
      </div>

      {/* A section the current answers would not ask, opened anyway (an old
          link, an old bookmark): the family's work still shows, with a quiet
          note instead of a dead end. */}
      {hydrated && !inPlay ? (
        <aside className="mt-6 max-w-[66ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4 text-[0.9375rem] text-body">
          Your answers about {name} do not usually include this section. It is
          still yours to write in, and anything here stays in the letter.{" "}
          <Link href="/letter" className="font-semibold underline underline-offset-[3px]">
            Change your answers
          </Link>
        </aside>
      ) : null}

      {def.note ? (
        <aside className="mt-6 max-w-[66ch] rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-4 text-[0.9375rem] text-body">
          {fillName(def.note, name)}
        </aside>
      ) : null}

      {hydrated ? <LegacyEcho def={def} /> : null}

      <div className="mt-[34px]">
        {!hydrated ? (
          <FormSkeleton />
        ) : showGate ? (
          <EmotionalGate def={def} name={name} nextSlug={next?.slug} />
        ) : (
          <>
            <SectionForm key={def.slug} def={def} />
            {def.photoSlot ? (
              <div className="mt-[34px]">
                <PhotoFields name={name} />
              </div>
            ) : null}
          </>
        )}
      </div>

      {/* After the form, before the nav: the letter comes first, and a card
          line is something noticed on the way out, not a bar to clear. */}
      {hydrated && !showGate ? <CardStatusPanel section={def.key} /> : null}

      {!showGate ? <NextPrev slug={def.slug} name={name} /> : null}
    </article>
  );
}

/**
 * Blob coexistence, made visible: when a structured section (or a sharper
 * question) shadows a free-text answer the family already wrote, quote their
 * own words back above the new form. Nothing is parsed or moved for them —
 * the quote just says where the prose lives, so retyping an entry below never
 * feels like their paragraph was lost. Renders only when the older field
 * actually holds something.
 */
function LegacyEcho({ def }: { def: SectionDef }) {
  const data = useLetterStore((s) => s.data);
  const refs = def.legacyRefs ?? [];
  const filled = refs
    .map((ref) => {
      const section = data[ref.sectionKey] as Record<string, unknown> | undefined;
      const value = section?.[ref.fieldKey];
      const text = typeof value === "string" ? value.trim() : "";
      return { ref, text };
    })
    .filter((r) => r.text !== "");
  if (filled.length === 0) return null;

  return (
    <aside className="mt-6 max-w-[66ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4">
      <p className="text-[0.9375rem] font-semibold text-ink">
        You wrote this earlier — it stays in the letter exactly as written.
      </p>
      {filled.map(({ ref, text }) => (
        <blockquote
          key={`${ref.sectionKey}.${ref.fieldKey}`}
          className="mt-3 border-l-2 border-gold400 pl-3.5"
        >
          <p className="text-xs font-semibold uppercase tracking-wider text-muted">
            {ref.label}
          </p>
          <p className="mt-1 whitespace-pre-wrap text-[0.9375rem] italic leading-[1.6] text-body">
            &ldquo;{text}&rdquo;
          </p>
        </blockquote>
      ))}
    </aside>
  );
}

function FormSkeleton() {
  return (
    <div>
      <p className="sr-only">Loading your saved work…</p>
      <div aria-hidden="true" className="space-y-8 motion-safe:animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="h-4 w-48 rounded bg-line" />
            <div className="mt-2.5 h-11 rounded-[var(--radius-sm)] bg-paper2" />
          </div>
        ))}
      </div>
    </div>
  );
}

/** Per-section interstitial copy. The default covers any emotional section
 *  without its own words; nothing here rushes anyone. */
const GATE_COPY: Record<string, (name: string) => string> = {
  "final-wishes": (name) =>
    `The next questions are about funerals, burial, and end-of-life wishes for ${name}. ` +
    "Some families find it a relief to write these things down. Others aren't ready — " +
    "and some choose to leave them out entirely. All of those are right.",
  "behavioral-support": (name) =>
    `The next questions ask about ${name}'s hardest moments — what sets them off, ` +
    "what a crisis looks like, and what you would want a police officer to know. " +
    "Writing it down is not a betrayal. It is the manual you had to learn the hard " +
    "way, handed to someone who loves them next.",
  "a-personal-message": () =>
    "This page is not instructions. It is you, speaking to the people you love, " +
    "in your own voice. Many families say it is the page that matters most — and " +
    "the one that takes the most out of them. There is no hurry.",
};

function EmotionalGate({
  def,
  name,
  nextSlug,
}: {
  def: SectionDef;
  name: string;
  nextSlug?: string;
}) {
  const ackEmotional = useLetterStore((s) => s.ackEmotional);
  const body =
    GATE_COPY[def.slug]?.(name) ??
    `The next questions can be heavy to write. Take them at your own pace — a ` +
      `single line is a real contribution, and skipping is always allowed.`;
  return (
    <div className="tw-card max-w-[66ch] p-6">
      <h2 className="font-serif text-[1.375rem]">A gentle note before this section</h2>
      <p className="mt-3 text-body">{body}</p>
      <p className="mt-3 text-body">
        If you skip this, the letter simply won&rsquo;t mention it. You can come back any
        time — deferring is not failing.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={() => ackEmotional(def.slug)}>I&rsquo;m ready</Button>
        {nextSlug ? (
          <Link href={`/letter/${nextSlug}`} className={buttonClasses("secondary")}>
            Skip for now →
          </Link>
        ) : null}
      </div>
    </div>
  );
}

function NextPrev({ slug, name }: { slug: string; name: string }) {
  const meta = useLetterStore((s) => s.meta);
  const data = useLetterStore((s) => s.data);
  const prev = prevSection(slug, meta, data);
  const next = nextSection(slug, meta, data);

  return (
    <div className="mt-11 flex flex-wrap items-center justify-between gap-3.5 border-t border-line pt-[26px]">
      {prev ? (
        <Link href={`/letter/${prev.slug}`} className={buttonClasses("outline")}>
          ← {fillName(prev.navTitle, name)}
        </Link>
      ) : (
        <span aria-hidden="true" />
      )}
      {next ? (
        <Link href={`/letter/${next.slug}`} className={buttonClasses("primary")}>
          Next: {fillName(next.navTitle, name)} →
        </Link>
      ) : (
        <Link href="/letter/review" className={buttonClasses("primary")}>
          Review &amp; download →
        </Link>
      )}
    </div>
  );
}
