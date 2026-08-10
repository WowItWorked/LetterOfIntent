"use client";

import Link from "next/link";
import { useEffect } from "react";
import {
  DEFAULT_PATH,
  nextInPath,
  prevInPath,
  resolvePath,
  sectionBySlugInPath,
  sectionsFor,
  type LetterPath,
} from "@/lib/content/paths";
import type { SectionDef } from "@/lib/content/types";
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
  const setLetterPath = useLetterStore((s) => s.setLetterPath);

  const current = meta.letterPath ?? DEFAULT_PATH;
  const path = resolvePath(slug, current);
  const def = sectionBySlugInPath(slug, path);
  const total = sectionsFor(path).length;

  useEffect(() => {
    if (!hydrated || !def) return;
    setLastVisited(def.slug);
    // Opening a section that only belongs to the other set is how a family
    // switches paths — the chooser's start buttons are exactly that link.
    if (path !== current) setLetterPath(path);
  }, [hydrated, def, path, current, setLastVisited, setLetterPath]);

  if (!def) return null; // the server component already 404s unknown slugs

  const name = displayName(data);
  const showGate = Boolean(def.emotional && hydrated && !meta.finalWishesAck);
  const next = nextInPath(def.slug, path);

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
          Section {String(def.number).padStart(2, "0")} of {total} · about {def.minutes}{" "}
          minutes
        </p>
        <h1 className="mt-3 font-serif text-[clamp(1.75rem,5vw,2.75rem)] font-semibold tracking-[-0.01em] text-onink">
          {fillName(def.title, name)}
        </h1>
        {fillName(def.intro, name)
          .split("\n\n")
          .map((p, i) => (
            <p key={i} className="mt-[18px] max-w-[62ch] text-lg leading-[1.7] text-oninkbody">
              {p}
            </p>
          ))}
      </div>

      {def.note ? (
        <aside className="mt-6 max-w-[66ch] rounded-[var(--radius-sm)] border border-goldline bg-goldtint p-4 text-[0.9375rem] text-body">
          {fillName(def.note, name)}
        </aside>
      ) : null}

      {hydrated ? <LegacyEcho def={def} path={path} /> : null}

      <div className="mt-[34px]">
        {!hydrated ? (
          <FormSkeleton />
        ) : showGate ? (
          <EmotionalGate name={name} nextSlug={next?.slug} />
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
      {hydrated && !showGate ? <CardStatusPanel section={def.key} path={path} /> : null}

      {!showGate ? <NextPrev slug={def.slug} name={name} /> : null}
    </article>
  );
}

/**
 * Blob coexistence, made visible: when a structured card section shadows a
 * free-text answer the family already wrote (medical.allergies, the typical
 * day's food and routines), quote their own words back above the new form.
 * Nothing is parsed or moved for them — the quote just says where the prose
 * lives, so retyping an entry below never feels like their paragraph was
 * lost. Renders only when the older field actually holds something.
 */
function LegacyEcho({ def, path }: { def: SectionDef; path: LetterPath }) {
  const data = useLetterStore((s) => s.data);
  const refs = def.legacyRefs?.[path] ?? [];
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
        You wrote this earlier — the entries below are what reach the cards.
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

function EmotionalGate({ name, nextSlug }: { name: string; nextSlug?: string }) {
  const ackFinalWishes = useLetterStore((s) => s.ackFinalWishes);
  return (
    <div className="tw-card max-w-[66ch] p-6">
      <h2 className="font-serif text-[1.375rem]">A gentle note before this section</h2>
      <p className="mt-3 text-body">
        The next questions are about funerals, burial, and end-of-life wishes for {name}.
        Some families find it a relief to write these things down. Others aren&rsquo;t
        ready — and some choose to leave them out entirely. All of those are right.
      </p>
      <p className="mt-3 text-body">
        If you skip this, the letter simply won&rsquo;t mention it. You can come back any
        time.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={ackFinalWishes}>I&rsquo;m ready</Button>
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
  const path = resolvePath(slug, meta.letterPath ?? DEFAULT_PATH);
  const prev = prevInPath(slug, path);
  const next = nextInPath(slug, path);

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
