import type { SectionDef } from "@/lib/content/types";
import type { LetterPath } from "@/lib/schema";
import { sectionDefs } from "@/lib/content/sections";
import { generalSectionDefs } from "@/lib/content/sections/general";

export type { LetterPath };

export const DEFAULT_PATH: LetterPath = "special-needs";

export interface LetterPathDef {
  id: LetterPath;
  /** The gold-diamond eyebrow under "Option N" on the chooser's cards. */
  optionName: string;
  /** Engraved eyebrow on the option card. */
  audience: string;
  /** Serif promise line. */
  promise: string;
  /** Short body, used on the home page. */
  blurb: string;
  /** Longer body, used on the chooser. */
  longBlurb: string;
  /** "What this one adds" / "covers instead". */
  differenceLabel: string;
  difference: string;
  countWord: string;
  minutesLabel: string;
  /** Tab label on the chooser, and its count line. */
  tabLabel: string;
  /** The joined navy panel under the tabs. */
  setHeading: string;
  setBlurb: string;
  /** The line offering the other set. */
  otherPrompt: string;
  startLabel: string;
  sections: SectionDef[];
  // The example documents live in lib/content/samples.ts, keyed by path — the
  // viewer route needs them too, and one list is easier to keep true.
}

export const LETTER_PATHS: LetterPathDef[] = [
  {
    id: "special-needs",
    optionName: "Disabilities and Special Needs Form",
    audience: "For a loved one with disabilities",
    promise: "The letter a trustee will read.",
    blurb:
      "For families with a special needs trust. It carries what no attorney can draft " +
      "for you: how your child communicates, what calms them, which doctor to call, " +
      "and what the trustee needs to know.",
    longBlurb:
      "If your plan includes a special needs trust, this is the companion no attorney " +
      "can draft for you: how your child communicates, what calms them, which doctor " +
      "to call, what a good day looks like. Written for the sibling, trustee, or " +
      "guardian who will one day take over.",
    differenceLabel: "What this one adds:",
    difference:
      "behavior support, benefits & money, legal & advocacy, and a section written " +
      "directly to the trustee.",
    // Five optional card-data sections (~5 minutes each) joined the roster;
    // the floor stays where it was because they can all be skipped, and the
    // ceiling moves honestly to cover filling them in.
    countWord: "Twenty",
    minutesLabel: "45 minutes–2 hours",
    tabLabel: "Disability & special needs",
    setHeading: "It assumes daily support, and maybe a trust",
    setBlurb:
      "Written on the assumption that a trust or public benefits may be involved. It " +
      "goes further into medical detail, communication, behavior, and what a trustee " +
      "needs to know: the things a paid caregiver or a sibling taking over would " +
      "otherwise learn the hard way.",
    otherPrompt: "Caring for someone who mostly manages on their own?",
    startLabel: "Start the special needs letter",
    sections: sectionDefs,
  },
  {
    id: "general",
    optionName: "Anyone You Care For",
    audience: "For anyone you care for",
    promise: "The letter only you can write.",
    blurb:
      "For an aging parent, a spouse, a sibling you look after. The week as it really " +
      "runs, the help that is welcome, who to call, and the hundred small things it " +
      "would take a stranger years to learn.",
    longBlurb:
      "An aging parent, a spouse, a sibling you look after, a child still finding " +
      "their footing. Its own set of questions: the week as it really runs, the help " +
      "that is welcome and the help that offends, the people to call, the hundred " +
      "small things it would take a stranger years to learn.",
    differenceLabel: "What this one covers instead:",
    difference:
      "home & daily living, work & obligations, money & documents, and whoever steps " +
      "in. No trust or benefits questions.",
    countWord: "Nineteen",
    minutesLabel: "40 minutes–2 hours",
    tabLabel: "Aging & general care",
    setHeading: "It assumes an adult who mostly manages",
    setBlurb:
      "Written for the person you quietly fill the gaps for. It asks about the week " +
      "as it really runs, the help that is welcome and the help that offends, who to " +
      "call, and where the documents live. No benefits questions, no trustee section, " +
      "no behavior plan.",
    otherPrompt: "Caring for a loved one who needs daily support?",
    startLabel: "Start the general letter",
    sections: generalSectionDefs,
  },
];

export function pathDef(path: LetterPath): LetterPathDef {
  return LETTER_PATHS.find((p) => p.id === path) ?? LETTER_PATHS[0];
}

export function sectionsFor(path: LetterPath): SectionDef[] {
  return pathDef(path).sections;
}

export function sectionBySlugInPath(
  slug: string,
  path: LetterPath
): SectionDef | undefined {
  return sectionsFor(path).find((s) => s.slug === slug);
}

/**
 * Which paths a slug belongs to. Four sections are shared, so a slug can
 * belong to both — in which case the letter's current path stays put.
 */
export function pathsForSlug(slug: string): LetterPath[] {
  return LETTER_PATHS.filter((p) => p.sections.some((s) => s.slug === slug)).map(
    (p) => p.id
  );
}

/**
 * The path a slug should be read in, given where the letter currently is.
 * Opening a section that only exists in the other set is how a family switches
 * — the chooser's "Start the general letter" is exactly that link.
 */
export function resolvePath(slug: string, current: LetterPath): LetterPath {
  const owners = pathsForSlug(slug);
  if (owners.length === 0 || owners.includes(current)) return current;
  return owners[0];
}

export function anySectionBySlug(slug: string): SectionDef | undefined {
  for (const p of LETTER_PATHS) {
    const found = p.sections.find((s) => s.slug === slug);
    if (found) return found;
  }
  return undefined;
}

/** Every slug across both paths, deduplicated — used to prerender the wizard. */
export function allSectionSlugs(): string[] {
  return [...new Set(LETTER_PATHS.flatMap((p) => p.sections.map((s) => s.slug)))];
}

export function nextInPath(slug: string, path: LetterPath): SectionDef | undefined {
  const list = sectionsFor(path);
  const i = list.findIndex((s) => s.slug === slug);
  return i >= 0 ? list[i + 1] : undefined;
}

export function prevInPath(slug: string, path: LetterPath): SectionDef | undefined {
  const list = sectionsFor(path);
  const i = list.findIndex((s) => s.slug === slug);
  return i > 0 ? list[i - 1] : undefined;
}
