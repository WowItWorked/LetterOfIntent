import type { LetterPath } from "@/lib/schema";

/**
 * The published example documents. One place, because the home page cards,
 * the viewer route, and its static params all have to agree.
 */
export interface SampleDoc {
  /** URL segment — /samples/<slug>. */
  slug: string;
  path: LetterPath;
  /** What the family calls it, on the card. */
  label: string;
  /**
   * What it is for, on the card. Page counts are deliberately not shown —
   * they change every time a sample is regenerated, and a number of pages
   * reads as a workload rather than a benefit.
   */
  detail: string;
  /** Heading on the viewer page. */
  title: string;
  subtitle: string;
  /** Optional reassurance, shown in the navy panel above the pages. */
  note?: string;
  pdf: string;
  thumb: string;
  alt: string;
}

/**
 * The emergency sheet is the most misunderstood thing the tool makes: it looks
 * like a separate document, so people assume it is a separate form. It is not.
 */
const NO_SECOND_FORM =
  "You never fill this in separately. The emergency sheet is built from answers you " +
  "have already given in the Letter of Intent — the medications, the allergies, the " +
  "people to call. There is no second form to complete.";

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    slug: "letter-of-intent-disabilities",
    path: "special-needs",
    label: "The Letter of Intent",
    detail: "The full document",
    title: "Letter of Intent — for a loved one with disabilities",
    subtitle:
      "A part-finished letter, printed exactly as the builder would produce it: the " +
      "cover, a guide for whoever reads it, the contents, key points at a glance, and " +
      "seven sections.",
    pdf: "/samples/sample-letter-of-intent-disabilities.pdf",
    thumb: "/samples/sample-letter-of-intent-disabilities.png",
    alt: "First page of the sample Letter of Intent: the cover, marked SAMPLE",
  },
  {
    slug: "emergency-sheet-disabilities",
    path: "special-needs",
    label: "Emergency sheet",
    detail: "For the fridge",
    title: "Emergency information sheet — for a loved one with disabilities",
    subtitle:
      "One page for the fridge, the school office, the sitter, and the ER: diagnoses, " +
      "medications, allergies, how they communicate, and who to call first.",
    note: NO_SECOND_FORM,
    pdf: "/samples/sample-emergency-information-sheet-disabilities.pdf",
    thumb: "/samples/sample-emergency-information-sheet-disabilities.png",
    alt: "The sample one-page emergency information sheet, marked SAMPLE",
  },
  {
    slug: "letter-of-intent-anyone",
    path: "general",
    label: "The Letter of Intent",
    detail: "The full document",
    title: "Letter of Intent — for anyone you care for",
    subtitle:
      "A part-finished letter for an aging parent, printed exactly as the builder " +
      "would produce it: the cover, a guide for whoever reads it, the contents, key " +
      "points at a glance, and seven sections.",
    pdf: "/samples/sample-letter-of-intent-anyone.pdf",
    thumb: "/samples/sample-letter-of-intent-anyone.png",
    alt: "First page of the sample Letter of Intent: the cover, marked SAMPLE",
  },
  {
    slug: "emergency-sheet-anyone",
    path: "general",
    label: "Emergency sheet",
    detail: "For the fridge",
    title: "Emergency information sheet — for anyone you care for",
    subtitle:
      "One page for the fridge, the pharmacy, and the ER: conditions, medications, " +
      "allergies, how to talk with them, and who to call first.",
    note: NO_SECOND_FORM,
    pdf: "/samples/sample-emergency-information-sheet-anyone.pdf",
    thumb: "/samples/sample-emergency-information-sheet-anyone.png",
    alt: "The sample one-page emergency information sheet, marked SAMPLE",
  },
];

export function samplesForPath(path: LetterPath): SampleDoc[] {
  return SAMPLE_DOCS.filter((s) => s.path === path);
}

export function sampleBySlug(slug: string): SampleDoc | undefined {
  return SAMPLE_DOCS.find((s) => s.slug === slug);
}
