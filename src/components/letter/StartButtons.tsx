"use client";

import { useRouter } from "next/navigation";
import { LETTER_PATHS, type LetterPath, pathDef } from "@/lib/content/paths";
import { useLetterStore } from "@/lib/store";
import { Button } from "@/components/ui/Button";

/**
 * Both start buttons. Each one records which set of questions the letter is
 * being written from before opening the first section.
 */
export function StartButtons() {
  const router = useRouter();
  const setLetterPath = useLetterStore((s) => s.setLetterPath);

  const begin = (path: LetterPath) => {
    setLetterPath(path);
    router.push(`/letter/${pathDef(path).sections[0].slug}`);
  };

  return (
    <div className="mt-6 flex flex-wrap gap-3.5">
      {LETTER_PATHS.map((p, i) => (
        <Button
          key={p.id}
          size="lg"
          variant={i === 0 ? "accent" : "outline"}
          onClick={() => begin(p.id)}
        >
          {p.startLabel}
        </Button>
      ))}
    </div>
  );
}
