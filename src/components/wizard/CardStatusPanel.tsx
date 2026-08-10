"use client";

import { sectionCardStatuses } from "@/lib/cards/status";
import { useLetterStore } from "@/lib/store";
import type { LetterPath, SectionKey } from "@/lib/schema";

/**
 * One quiet line per care card this section feeds, judged by the same derive
 * functions that decide whether a card renders — so this panel can never
 * promise a card the share screen would refuse. It reads the persisted
 * letter, so every autosave re-renders it. Deliberately not a checklist:
 * no error tone, no red, nothing blocks — the cards are a bonus on top of
 * the letter, not homework.
 */
export function CardStatusPanel({
  section,
  path,
}: {
  section: SectionKey;
  path: LetterPath;
}) {
  const data = useLetterStore((s) => s.data);
  const statuses = sectionCardStatuses(data, path, section);
  if (statuses.length === 0) return null;

  return (
    <aside
      aria-label="Care cards"
      className="mt-9 max-w-[66ch] rounded-[var(--radius-sm)] border border-line bg-paper2 p-4"
    >
      <p className="tw-engraved text-xs tracking-[0.2em] text-faint">Care cards</p>
      <ul className="mt-2.5 list-none space-y-2 p-0">
        {statuses.map((s) => (
          <li
            key={s.key}
            className="flex items-start gap-2.5 text-[0.9375rem] text-body"
          >
            {/* The card's topic color, as on the cards themselves; the
                sentence carries the meaning, the dot only says which card. */}
            <span
              aria-hidden="true"
              className="mt-[7px] size-2 shrink-0 rounded-full"
              style={{ background: `var(--card-${s.key})` }}
            />
            <span>{s.text}</span>
          </li>
        ))}
      </ul>
    </aside>
  );
}
