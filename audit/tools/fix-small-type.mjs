/**
 * A1-003 — raise the engraved caps to the design system's own stated 12px floor
 * and pull the tracking back at the small end.
 *
 * Two changes, and the second matters as much as the first: wide tracking buys
 * elegance at display sizes and costs legibility at small ones, so promoting
 * 10–11px to 12px while leaving 0.22em spacing would only half-fix it.
 *
 * Arbitrary values are replaced with Tailwind's `text-xs` (0.75rem) rather than
 * `text-[0.75rem]` — same result, one fewer ad-hoc value in the built CSS.
 *
 *   node audit/tools/fix-small-type.mjs [--dry]
 */
import { readFile, writeFile } from "node:fs/promises";
import { glob } from "node:fs/promises";
import path from "node:path";

const DRY = process.argv.includes("--dry");

/** Sizes below the system's 12px floor, and what they become. */
const SIZE = [
  [/text-\[0\.6875rem\]/g, "text-xs"], // 11px
  [/text-\[0\.625rem\]/g, "text-xs"],  // 10px
  [/text-\[10px\]/g, "text-xs"],       // 10px
];

/**
 * Tracking, but ONLY on lines that carried a sub-12px size. Wide tracking is
 * correct on the large engraved wordmark and must not be touched there, so
 * this is deliberately scoped rather than global.
 */
const TRACK = [
  [/tracking-\[0\.24em\]/g, "tracking-[0.16em]"],
  [/tracking-\[0\.22em\]/g, "tracking-[0.16em]"],
  [/tracking-\[0\.2em\]/g, "tracking-[0.15em]"],
];

const SMALL = /text-\[(0\.6875rem|0\.625rem|10px)\]/;

async function main() {
  const files = [];
  for await (const f of glob("src/**/*.tsx")) files.push(f);

  let sizeHits = 0, trackHits = 0, touched = 0;
  const log = [];

  for (const file of files) {
    const src = await readFile(file, "utf8");
    const lines = src.split("\n");
    let changed = false;

    for (let i = 0; i < lines.length; i++) {
      const wasSmall = SMALL.test(lines[i]);
      let line = lines[i];

      for (const [re, to] of SIZE) {
        const n = (line.match(re) || []).length;
        if (n) { line = line.replace(re, to); sizeHits += n; }
      }
      // Scoped to lines that were small — see note above.
      if (wasSmall) {
        for (const [re, to] of TRACK) {
          const n = (line.match(re) || []).length;
          if (n) { line = line.replace(re, to); trackHits += n; }
        }
      }

      if (line !== lines[i]) {
        log.push(`  ${path.relative(".", file)}:${i + 1}`);
        lines[i] = line;
        changed = true;
      }
    }

    if (changed) {
      touched++;
      if (!DRY) await writeFile(file, lines.join("\n"));
    }
  }

  console.log(DRY ? "DRY RUN — nothing written\n" : "");
  log.forEach((l) => console.log(l));
  console.log(`\n  files touched : ${touched}`);
  console.log(`  sizes raised  : ${sizeHits}  (to text-xs / 0.75rem)`);
  console.log(`  tracking eased: ${trackHits}`);
}

main().catch((e) => { console.error(e); process.exit(1); });
