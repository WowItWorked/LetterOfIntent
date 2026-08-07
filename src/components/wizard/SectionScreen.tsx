"use client";

import Link from "next/link";
import { useEffect } from "react";
import { nextSection, prevSection, sectionBySlug, sectionDefs } from "@/lib/content/sections";
import { displayName, fillName } from "@/lib/derive";
import { useLetterStore } from "@/lib/store";
import { SectionForm } from "@/components/wizard/SectionForm";
import { Button, buttonClasses } from "@/components/ui/Button";

export function SectionScreen({ slug }: { slug: string }) {
  const def = sectionBySlug(slug);
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const data = useLetterStore((s) => s.data);
  const meta = useLetterStore((s) => s.meta);
  const setLastVisited = useLetterStore((s) => s.setLastVisited);

  useEffect(() => {
    if (hydrated && def) setLastVisited(def.slug);
  }, [hydrated, def, setLastVisited]);

  if (!def) return null; // the server component already 404s unknown slugs

  const name = displayName(data);
  const showGate = Boolean(def.emotional && hydrated && !meta.finalWishesAck);

  return (
    <article className="pb-4">
      <p className="text-[0.8rem] font-semibold uppercase tracking-[0.12em] text-faint">
        Section {def.number} of {sectionDefs.length} · about {def.minutes} minutes
      </p>
      <h1 className="mt-1.5 text-3xl sm:text-4xl">{fillName(def.title, name)}</h1>
      {fillName(def.intro, name)
        .split("\n\n")
        .map((p, i) => (
          <p key={i} className="mt-3 max-w-prose text-body">
            {p}
          </p>
        ))}
      {def.note ? (
        <aside className="mt-5 max-w-prose rounded-lg border border-goldline bg-goldtint p-4 text-sm text-body">
          {fillName(def.note, name)}
        </aside>
      ) : null}

      <div className="mt-8">
        {!hydrated ? (
          <FormSkeleton />
        ) : showGate ? (
          <EmotionalGate name={name} nextSlug={nextSection(def.slug)?.slug} />
        ) : (
          <SectionForm key={def.slug} def={def} />
        )}
      </div>

      {!showGate ? <NextPrev slug={def.slug} name={name} /> : null}
    </article>
  );
}

function FormSkeleton() {
  return (
    <div>
      <p className="sr-only">Loading your saved work…</p>
      <div aria-hidden="true" className="space-y-6 motion-safe:animate-pulse">
        {[0, 1, 2].map((i) => (
          <div key={i}>
            <div className="h-4 w-48 rounded bg-line" />
            <div className="mt-2 h-11 rounded-md bg-paper2" />
          </div>
        ))}
      </div>
    </div>
  );
}

function EmotionalGate({ name, nextSlug }: { name: string; nextSlug?: string }) {
  const ackFinalWishes = useLetterStore((s) => s.ackFinalWishes);
  return (
    <div className="max-w-prose rounded-xl border border-line bg-surface p-6">
      <h2 className="text-xl">A gentle note before this section</h2>
      <p className="mt-3 text-body">
        The next questions are about funerals, burial, and end-of-life wishes for {name}.
        Some families find it a relief to write these things down. Others aren't ready —
        and some choose to leave them out entirely. All of those are right.
      </p>
      <p className="mt-3 text-body">
        If you skip this, the letter simply won't mention it. You can come back any time.
      </p>
      <div className="mt-5 flex flex-wrap gap-3">
        <Button onClick={ackFinalWishes}>I'm ready</Button>
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
  const prev = prevSection(slug);
  const next = nextSection(slug);
  return (
    <div className="mt-10 flex flex-wrap items-center justify-between gap-3 border-t border-line pt-6">
      {prev ? (
        <Link href={`/letter/${prev.slug}`} className={buttonClasses("secondary")}>
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
