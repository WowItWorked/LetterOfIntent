"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { sectionBySlug, sectionDefs } from "@/lib/content/sections";
import { useLetterStore } from "@/lib/store";

/** /letter → resume at the last-edited section, or start at the beginning. */
export default function LetterIndex() {
  const router = useRouter();
  const hydrated = useLetterStore((s) => s.hasHydrated);
  const lastVisited = useLetterStore((s) => s.meta.lastVisitedSlug);

  useEffect(() => {
    if (!hydrated) return;
    const target =
      lastVisited && sectionBySlug(lastVisited) ? lastVisited : sectionDefs[0].slug;
    router.replace(`/letter/${target}`);
  }, [hydrated, lastVisited, router]);

  return <p className="py-10 text-muted">Opening your letter…</p>;
}
