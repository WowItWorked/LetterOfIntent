/**
 * The published example documents. One place, because the linking pages, the
 * viewer route, and its static params all have to agree.
 *
 * Samples are GENERATED LIVE from the two fixture families
 * (src/lib/content/samples/ruiz.ts, hale.ts) — never served from static
 * files, so a sample cannot drift from the schema by construction, and never
 * rendered from the visitor's own letter. The download button on the viewer
 * produces the same watermarked PDF on demand, entirely on the visitor's
 * device.
 *
 * The two families exercise the two poles of the one adaptive form: the Ruiz
 * family ("both", high support) and the Hale family (caregiver-only, an
 * aging parent).
 */
export interface SampleDoc {
  /**
   * URL segment — /samples/<slug>, in the form {document}-{family}.
   *
   * Renamed once, deliberately. Three slugs were inherited from the two-path
   * era and had stopped telling the truth: "letter-of-intent-anyone" rendered
   * the CAREGIVER letter, and "letter-for-the-caregiver" gave no hint which of
   * the two families it belonged to. next.config.ts permanently redirects the
   * old names, so anything already linked still lands.
   */
  slug: string;
  /** Which fixture family renders this document. */
  family: "high-support" | "aging-parent";
  /** Which document of that family's set. */
  kind: "letter" | "caregiver" | "emergency";
  /** What the family calls it, on linking cards. */
  label: string;
  /** What it is for, on the card. */
  detail: string;
  /** Heading on the viewer page. */
  title: string;
  subtitle: string;
  /** Optional reassurance, shown in the navy panel above the pages. */
  note?: string;
  /** The watermarked download's filename. Says SAMPLE; never a person. */
  downloadName: string;
}

/**
 * The emergency sheet is the most misunderstood thing the tool makes: it looks
 * like a separate document, so people assume it is a separate form. It is not.
 */
const NO_SECOND_FORM =
  "You never fill this in separately. The emergency sheet is built from answers you " +
  "have already given in the letter — the medications, the allergies, the people to " +
  "call. There is no second form to complete.";

export const SAMPLE_DOCS: SampleDoc[] = [
  {
    slug: "letter-of-intent-disabilities",
    family: "high-support",
    kind: "letter",
    label: "The Letter of Intent",
    detail: "For the trustee",
    title: "Letter of Intent — the Ruiz family sample",
    subtitle:
      "The trustee's document, printed exactly as the builder produces it: the " +
      "cover, a guide for whoever reads it, the contents, and the money, benefits, " +
      "legal, and guidance sections — written by a mother about her adult son.",
    downloadName: "SAMPLE-Letter-of-Intent.pdf",
  },
  {
    slug: "letter-for-the-caregiver-disabilities",
    family: "high-support",
    kind: "caregiver",
    label: "The Letter for the Caregiver",
    detail: "For whoever steps in",
    title: "Letter for the Caregiver — the Ruiz family sample",
    subtitle:
      "The companion document: daily life, routines, communication, behavior, and " +
      "the at-a-glance page up front — written to be read in a kitchen at 7am.",
    downloadName: "SAMPLE-Letter-for-the-Caregiver.pdf",
  },
  {
    slug: "emergency-sheet-disabilities",
    family: "high-support",
    kind: "emergency",
    label: "Emergency sheet",
    detail: "For the fridge",
    title: "Emergency information sheet — the Ruiz family sample",
    subtitle:
      "One page for the fridge, the day program, the sitter, and the ER: conditions, " +
      "medications, allergies, how he communicates, and who to call first.",
    note: NO_SECOND_FORM,
    downloadName: "SAMPLE-Emergency-Information-Sheet.pdf",
  },
  {
    slug: "letter-for-the-caregiver-aging-parent",
    family: "aging-parent",
    kind: "caregiver",
    label: "The Letter for the Caregiver",
    detail: "For an aging parent",
    title: "Letter for the Caregiver — the Hale family sample",
    subtitle:
      "The same form, a different life: a daughter writing about her mother. The " +
      "week as it really runs, the unfinished conversations, and what must never " +
      "change — with none of the sections this family was never asked.",
    downloadName: "SAMPLE-Letter-for-the-Caregiver-Aging-Parent.pdf",
  },
  {
    slug: "emergency-sheet-aging-parent",
    family: "aging-parent",
    kind: "emergency",
    label: "Emergency sheet",
    detail: "For the fridge",
    title: "Emergency information sheet — the Hale family sample",
    subtitle:
      "One page for the fridge, the pharmacy, and the ER: conditions, medications, " +
      "allergies, how to talk with her, and who to call first.",
    note: NO_SECOND_FORM,
    downloadName: "SAMPLE-Emergency-Information-Sheet-Aging-Parent.pdf",
  },
];

export function sampleBySlug(slug: string): SampleDoc | undefined {
  return SAMPLE_DOCS.find((s) => s.slug === slug);
}
