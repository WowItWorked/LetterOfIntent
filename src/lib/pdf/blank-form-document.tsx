import {
  Document,
  Page,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "@react-pdf/renderer";
import { allSections } from "@/lib/content/config";
import type { FieldDef, RepeaterItemField, SectionDef } from "@/lib/content/types";
import type { LetterProjection } from "./projections";
import { projects } from "./projections";
import {
  FAINT,
  GOLD,
  GOLD_DEEP,
  GOLD_TINT,
  GRAY,
  INK,
  LINE,
  NAVY,
  RULE_ON_PAPER,
  SANS,
  SERIF,
  registerBrandFonts,
} from "./theme";

/**
 * The blank, fillable version of a letter — the paper path for a family that
 * would rather sit at a desk with Acrobat than answer questions in a browser.
 *
 * Three things make this a different document from the letters, not a variant
 * of them:
 *
 * 1. It asks EVERY question in the projection. The web form is adaptive: the
 *    onboarding answers decide which sections and fields are ever shown, and
 *    a question that does not fit is never asked. A static PDF has to commit
 *    at generation time, and it has no answers to route on, so it commits to
 *    all of them and tells the reader to skip what does not apply. That is
 *    why showWhen is deliberately NOT consulted here.
 *
 * 2. Every answer is a widget, which the letters' bodies are not. In the
 *    letters only the notes box is editable, because the prose repaginates as
 *    it grows and a form widget cannot reflow (see loi-document.tsx). Here
 *    every box is fixed-size BY DESIGN — nothing flows around it, so the
 *    hazard that rules out editable prose does not apply. What does apply is
 *    the other half of the same constraint: type past the bottom of an
 *    AcroForm box and Acrobat keeps the text but will not print it. The cover
 *    page says so in as many words, and the boxes are sized generously.
 *
 * 3. It carries no data and touches no store, so it is safe to hand to anyone.
 *
 * Field names must be unique across the document: two widgets sharing a name
 * in PDF share one value, so every box with that name would mirror the rest.
 * `${section.key}.${field.id}` is unique by construction, and repeater entries
 * append their index and item id.
 */

/* ----------------------------------------------------------------- sizing */

const LINE_H = 13;
const SINGLE_LINE = 22;

/** Box height for one field, in points. Generous on purpose — see above. */
function boxHeight(field: FieldDef): number {
  if (field.kind === "repeater") return SINGLE_LINE;
  if (field.kind !== "textarea") return SINGLE_LINE;
  // rows is the form's own hint at how much someone will write. Four lines is
  // the floor: a two-line box invites a two-line answer.
  const rows = Math.max(field.rows ?? 4, 4);
  return Math.min(rows, 9) * LINE_H + 12;
}

/**
 * How many blank records to print for a repeating question. There is no "add
 * another" on paper, so the count is the ceiling — chosen from what families
 * actually list rather than a uniform number, and the form says to use the
 * web builder or a second sheet if it is not enough.
 */
const REPEATS: Record<string, number> = {
  medications: 6,
  contacts: 5,
  items: 4, // allergies
  providers: 4,
};
const DEFAULT_REPEATS = 3;

function repeatCount(field: FieldDef): number {
  return REPEATS[field.id] ?? DEFAULT_REPEATS;
}

/** Printable height of one LETTER page, less the page padding. */
const USABLE_PAGE = 792 - 54 - 58;

/** Box height for one item, given how many lines its textareas may take. */
function itemBoxHeight(item: RepeaterItemField, textareaLines: number): number {
  return item.kind === "textarea" ? textareaLines * LINE_H + 10 : SINGLE_LINE;
}

/** Height of one item row: label, optional hint, and the box. */
function itemHeight(item: RepeaterItemField, textareaLines: number): number {
  if (item.kind === "checkbox") return 17;
  return 6 + 11 + 10 + 4 + itemBoxHeight(item, textareaLines);
}

/**
 * Roughly how tall one blank record will be. Only ever used to decide whether
 * a record can be kept whole, so it errs high: over-estimating costs a page
 * break that was not strictly needed, under-estimating costs a clipped field.
 */
function recordHeight(rows: RepeaterItemField[][], textareaLines: number): number {
  const chrome = 8 + 2 + 16 + 13;
  return (
    chrome +
    rows.reduce((h, row) => h + Math.max(...row.map((i) => itemHeight(i, textareaLines))), 0)
  );
}

/**
 * The most generous textarea a record can afford before it has to be split.
 */
function textareaLinesFor(rows: RepeaterItemField[][]): number {
  for (const lines of [3, 2, 1]) {
    if (recordHeight(rows, lines) <= CHUNK_LIMIT) return lines;
  }
  return 1;
}

/**
 * The tallest block this file will ever ask the layout engine to place whole.
 * Half a page, so a block always fits somewhere — on the current page if there
 * is room, on the next one otherwise, and never neither.
 */
const CHUNK_LIMIT = USABLE_PAGE / 2;

/**
 * Splits a record's rows into blocks that each fit within CHUNK_LIMIT.
 *
 * This exists because of one specific failure. Records are laid out whole
 * (wrap={false}) so that no form widget can be cut by a page break — a widget
 * that straddles a break gets its annotation rectangle written from its
 * pre-break position and arrives two points tall: invisible, unclickable, and
 * silent, in a PDF that still reports a full count of /Widget objects.
 *
 * But "lay this out whole" is really "go and find room for this", and when no
 * page can offer the room the search does not converge — it runs the
 * coordinate out to -1.8e+21 and the render dies with no file at all. The
 * medications record is around 620pt tall, close enough to a full page that it
 * fits when little precedes it and fits nowhere once the rest of the health
 * section is in front of it. That is exactly why the Letter of Intent built
 * cleanly while the caregiver letter, which asks for more of the same section,
 * produced nothing.
 *
 * Chunking removes the condition rather than working around it: no block is
 * ever large enough to be unplaceable, so nothing has to be searched for and
 * nothing straddles.
 */
function chunkRows(
  rows: RepeaterItemField[][],
  textareaLines: number
): RepeaterItemField[][][] {
  const chunks: RepeaterItemField[][][] = [];
  let current: RepeaterItemField[][] = [];
  let height = 39; // record chrome
  for (const row of rows) {
    const rowH = Math.max(...row.map((i) => itemHeight(i, textareaLines)));
    if (current.length > 0 && height + rowH > CHUNK_LIMIT) {
      chunks.push(current);
      current = [];
      height = 39;
    }
    current.push(row);
    height += rowH;
  }
  if (current.length > 0) chunks.push(current);
  return chunks;
}

/* ------------------------------------------- wording the paper path cannot keep */

/**
 * Item fields that exist only to steer a document this form does not make.
 * "Keep off shareable cards" has nothing to keep anything off: filling in a
 * PDF produces the letter and nothing else.
 */
const OMIT_ITEM_IDS = new Set(["keepOffCards"]);

/**
 * The two labels that name another document. Everything else is handled by
 * scrubbing whole sentences out of the help text, but a label is a single
 * phrase with nowhere to cut, so these are rewritten by hand.
 */
const ITEM_LABEL_OVERRIDES: Record<string, string> = {
  "contacts.roles": "This person is",
  "contacts.emergency": "Emergency contact",
};

/**
 * Keyed by section and field. Only one entry, and it is a disambiguation
 * rather than a removal: "Where the cards, records, and directives are kept"
 * means the insurance cards, which is obvious in a builder that has just been
 * talking about insurance and not obvious at all on a blank form that has been
 * talking about care cards. Naming them is clearer for every reader.
 */
const FIELD_LABEL_OVERRIDES: Record<string, string> = {
  "health.recordsLocation": "Where the insurance cards, records, and directives are kept",
};

/**
 * Prose that promises something only the builder does.
 *
 * The catalogue is written for the web form, where "this prints on the
 * Emergency card" is simply true. On a form somebody fills in by hand it is a
 * promise about a document that will never exist, and it sends a reader
 * looking for cards they were never going to get.
 *
 * Deliberately narrow rather than /card/i, because the catalogue also contains
 * cards that have nothing to do with this app — "the card game" in a weekly
 * routine, "the insurance cards" in where-records-are-kept — and losing those
 * would quietly damage real questions. The lookahead spares the card game; the
 * insurance cards survive because "the cards" only matches as a bare phrase.
 */
const NAMES_ANOTHER_DOCUMENT =
  /\b(?:emergency|medications|identity\s*&\s*contacts|daily routine|allergies|personal care|communication)\s+cards?\b|\bshareable cards?\b|\bcare cards?\b|\bthe cards?\b(?!\s+game)|\bemergency sheet\b/i;

/**
 * Drops whole sentences that name another document, keeping the rest of the
 * guidance. Sentence-level because most of this help is one useful sentence
 * plus one about where the answer prints.
 */
export function scrubHelp(text: string | undefined): string | undefined {
  if (!text) return undefined;
  const kept = text
    .split(/(?<=[.!?])\s+/)
    .filter((sentence) => !NAMES_ANOTHER_DOCUMENT.test(sentence));
  const out = kept.join(" ").trim();
  return out.length > 0 ? out : undefined;
}

/** Every label and help string a blank form will print, for the guard test. */
export function blankFormStrings(projection: LetterProjection): string[] {
  const out: string[] = [];
  for (const def of projectedSections(projection)) {
    out.push(def.title, def.navTitle);
    for (const field of def.fields) {
      out.push(FIELD_LABEL_OVERRIDES[`${def.key}.${field.id}`] ?? field.label);
      const help = scrubHelp(field.help);
      if (help) out.push(help);
      if (field.kind !== "repeater") continue;
      for (const item of field.itemFields) {
        if (OMIT_ITEM_IDS.has(item.id)) continue;
        out.push(ITEM_LABEL_OVERRIDES[`${field.id}.${item.id}`] ?? item.label);
        const itemHelp = optionHint(item) ?? scrubHelp(item.help);
        if (itemHelp) out.push(itemHelp);
      }
    }
  }
  return out;
}

/* ----------------------------------------------------------------- styles */

const s = StyleSheet.create({
  page: {
    paddingTop: 54,
    paddingBottom: 58,
    paddingHorizontal: 54,
    fontFamily: SANS,
    fontSize: 9.5,
    color: INK,
    lineHeight: 1.45,
  },

  /* cover */
  coverRule: { height: 2, backgroundColor: GOLD, marginBottom: 18 },
  eyebrow: {
    fontFamily: SANS,
    fontSize: 8,
    letterSpacing: 2,
    color: GOLD_DEEP,
    textTransform: "uppercase",
  },
  coverTitle: {
    fontFamily: SERIF,
    fontSize: 30,
    fontWeight: 600,
    color: NAVY,
    marginTop: 10,
    lineHeight: 1.15,
  },
  coverLead: { marginTop: 12, fontSize: 10.5, color: GRAY, lineHeight: 1.6 },
  howBox: {
    marginTop: 22,
    borderWidth: 1,
    borderColor: GOLD,
    backgroundColor: GOLD_TINT,
    borderRadius: 3,
    padding: 16,
  },
  howTitle: {
    fontFamily: SANS,
    fontWeight: 700,
    fontSize: 10,
    color: NAVY,
    marginBottom: 7,
  },
  howItem: { flexDirection: "row", marginTop: 5 },
  /**
   * A drawn square, not a "◆" character. Mulish has no glyph at U+25C6, and
   * the missing glyph does not come out blank — it prints as "Æ" in every
   * bullet on the cover. A View cannot go missing from a font.
   */
  howDot: {
    width: 4,
    height: 4,
    marginTop: 5,
    marginRight: 7,
    backgroundColor: GOLD_DEEP,
  },
  howText: { flex: 1, fontSize: 9.5, color: INK, lineHeight: 1.5 },
  coverFoot: { marginTop: 20, fontSize: 9, color: FAINT, lineHeight: 1.55 },

  /* sections */
  sectionHead: { marginBottom: 12 },
  sectionTitle: {
    fontFamily: SERIF,
    fontSize: 19,
    fontWeight: 600,
    color: NAVY,
    marginTop: 4,
  },
  sectionIntro: { marginTop: 6, fontSize: 9, color: GRAY, lineHeight: 1.5 },
  sectionRule: { height: 1, backgroundColor: GOLD, marginTop: 10 },

  /* fields */
  field: { marginTop: 13 },
  label: { fontFamily: SANS, fontWeight: 600, fontSize: 9.5, color: INK },
  help: { fontSize: 8.5, color: GRAY, marginTop: 2, lineHeight: 1.45 },
  box: {
    marginTop: 4,
    borderWidth: 1,
    borderColor: RULE_ON_PAPER,
    borderRadius: 2,
    paddingHorizontal: 5,
    paddingVertical: 3,
  },
  /**
   * flexGrow is load-bearing, not cosmetic. Without it the widget has no
   * intrinsic height, the annotation rectangle comes out zero-high, and
   * Acrobat draws nothing at all — the box prints (it is a View) but there is
   * no field to click. The document still carries /AcroForm and the right
   * number of /Widget entries, so byte-level checks pass while the form is
   * completely unusable. loi-document.tsx's notes field has always done this;
   * this file did not, and that is the bug.
   */
  input: { flexGrow: 1, fontFamily: SANS, fontSize: 9.5, color: INK },

  /* repeaters */
  record: {
    marginTop: 8,
    borderWidth: 1,
    borderColor: LINE,
    borderRadius: 2,
    padding: 8,
  },
  recordNo: {
    fontFamily: SANS,
    fontSize: 7.5,
    letterSpacing: 1.2,
    color: GOLD_DEEP,
    textTransform: "uppercase",
    marginBottom: 3,
  },
  itemLabel: { fontFamily: SANS, fontWeight: 600, fontSize: 8.5, color: INK },
  itemHelp: { fontSize: 7.5, color: FAINT, marginTop: 1 },
  row: { flexDirection: "row", gap: 8 },
  half: { flex: 1 },
  checkRow: { flexDirection: "row", alignItems: "center", gap: 5, marginTop: 6 },
  checkSquare: { width: 9, height: 9, borderWidth: 1, borderColor: NAVY },

  /* footer */
  footer: {
    position: "absolute",
    bottom: 30,
    left: 54,
    right: 54,
    flexDirection: "row",
    justifyContent: "space-between",
    fontSize: 7.5,
    color: FAINT,
  },
});

/* ------------------------------------------------------------------ parts */

function Footer({ label }: { label: string }) {
  return (
    <View style={s.footer} fixed>
      <Text>{label}</Text>
      <Text
        render={({ pageNumber, totalPages }) => `${pageNumber} of ${totalPages}`}
      />
    </View>
  );
}

/**
 * The name a widget carries. Never derived from the label — labels are
 * adaptive prose and two of them can collide; ids cannot.
 */
function widgetName(parts: readonly (string | number)[]): string {
  return parts.join(".");
}

function Box({
  name,
  height,
  multiline,
}: {
  name: string;
  height: number;
  multiline?: boolean;
}) {
  // The widget carries its own height rather than growing into the frame.
  // flexGrow alone was enough for most boxes but not for the handful that land
  // on a page boundary: those resolve against a parent that has not been given
  // its final height yet, and they came out with a zero-high rectangle — one
  // invisible, unfillable field every few pages, in a document with 200 of
  // them. An explicit height does not depend on when layout settles.
  // 8 = the frame's 3pt padding and 1pt border, top and bottom.
  return (
    <View style={{ ...s.box, height }}>
      <TextInput
        name={name}
        multiline={multiline}
        fontSize={9.5}
        style={{ ...s.input, height: height - 8 }}
      />
    </View>
  );
}

/** A select's options are printed rather than made a dropdown widget. */
function optionHint(item: RepeaterItemField): string | undefined {
  if (item.kind === "select" || item.kind === "multiselect") {
    return item.options.map((o) => o.label).join("  ·  ");
  }
  return undefined;
}

function ItemField({
  item,
  name,
  textareaLines,
  label,
}: {
  item: RepeaterItemField;
  name: string;
  textareaLines: number;
  label: string;
}) {
  if (item.kind === "checkbox") {
    return (
      <View style={s.checkRow}>
        <View style={s.checkSquare} />
        <Text style={s.itemLabel}>{label}</Text>
      </View>
    );
  }
  const hint = optionHint(item) ?? scrubHelp(item.help);
  const boxH = itemBoxHeight(item, textareaLines);
  return (
    // wrap={false} keeps the label with its box; minPresenceAhead is what
    // actually saves the widget. A record may be taller than a page and has to
    // be allowed to break, so items meet page boundaries constantly — and
    // wrap={false} alone only moves the drawn box. The annotation rectangle is
    // still written at the position the item had BEFORE the move, so the field
    // arrives clipped to whatever was left at the bottom of the page: 2pt tall,
    // invisible, impossible to click. Reserving the height up front means the
    // break happens first and the item is laid out once, in its final place.
    <View style={{ marginTop: 6 }} wrap={false}>
      <Text style={s.itemLabel}>{label}</Text>
      {hint ? <Text style={s.itemHelp}>{hint}</Text> : null}
      <Box name={name} height={boxH} multiline={item.kind === "textarea"} />
    </View>
  );
}

function Repeater({ field, sectionKey }: { field: FieldDef; sectionKey: string }) {
  if (field.kind !== "repeater") return null;
  const count = repeatCount(field);
  // Half-width item fields pair up, exactly as they do in the web form.
  const rows: RepeaterItemField[][] = [];
  let pending: RepeaterItemField | null = null;
  for (const item of field.itemFields.filter((f) => !OMIT_ITEM_IDS.has(f.id))) {
    if (item.width === "half" && item.kind !== "checkbox") {
      if (pending) {
        rows.push([pending, item]);
        pending = null;
      } else {
        pending = item;
      }
    } else {
      if (pending) {
        rows.push([pending]);
        pending = null;
      }
      rows.push([item]);
    }
  }
  if (pending) rows.push([pending]);

  /*
   * The records are siblings of the label, not children of a wrapper View, and
   * that is the whole fix for the broken fields.
   *
   * wrap={false} keeps a block whole, and it works correctly on a direct child
   * of a Page — that is why no plain scalar field was ever damaged. Nested one
   * level down, inside a wrapping View, it does not: the block is moved to the
   * next page but the form widget's annotation rectangle is still written from
   * the position it had before the move, so the field lands clipped to the
   * scrap of space left at the bottom of the previous page. Two points tall,
   * invisible, impossible to click, and completely silent — the PDF still
   * carries its /AcroForm dictionary and the full count of /Widget objects.
   *
   * Wrapping every record instead put fields across page breaks; keeping every
   * record whole inside the wrapper sent the caregiver form's layout into a
   * runaway ("unsupported number: -1.8e+21") and it produced no file at all.
   * Flattening the tree is what actually resolves it, and the height guard
   * below stays as a backstop: a record too tall for any page must be allowed
   * to break, because the alternative is not a worse document, it is none.
   */
  /*
   * Records are placed with explicit page breaks rather than by asking the
   * engine to keep them whole, and the difference matters more than it looks.
   *
   * wrap={false} does not mean "do not split" so much as "go and find room" —
   * and when the room is not there the search does not converge. That is what
   * killed the caregiver form: no file at all, and a render that died with
   * "unsupported number: -1.8e+21".
   *
   * Letting records wrap always builds, but then fields land across page
   * boundaries, and a widget that straddles a break has its annotation
   * rectangle written from its pre-break position — two points tall,
   * invisible, unclickable, in a PDF that still reports a healthy /AcroForm
   * and the full count of /Widget objects. Silent both ways.
   *
   * A hard `break` is no better: on a record that already sits at the top of a
   * page it asks for a break that cannot be taken, and the render hangs.
   *
   * minPresenceAhead is the one that neither searches nor forces. It reserves
   * the space a record needs; if the page cannot offer it the record starts on
   * the next one, and otherwise it lays out where it stands. The 1.1 is slack
   * for the estimate being an estimate, and the cap keeps a tall record from
   * demanding more room than a page has — which would be a demand that can
   * never be met, and we are back to a hang.
   */
  const textareaLines = textareaLinesFor(rows);
  const chunks = chunkRows(rows, textareaLines);
  return (
    <>
      <View style={s.field} wrap={false}>
        <Text style={s.label}>{FIELD_LABEL_OVERRIDES[`${sectionKey}.${field.id}`] ?? field.label}</Text>
        {scrubHelp(field.help) ? <Text style={s.help}>{scrubHelp(field.help)}</Text> : null}
      </View>
      {Array.from({ length: count }, (_, i) =>
        chunks.map((chunk, c) => (
          <View key={`${i}-${c}`} style={s.record} wrap={false}>
            <Text style={s.recordNo}>
              {field.itemNoun} {i + 1}
              {c > 0 ? ", continued" : ""}
            </Text>
            {chunk.map((row, r) => (
              <View key={r} style={row.length > 1 ? s.row : undefined}>
                {row.map((item) => (
                  <View key={item.id} style={row.length > 1 ? s.half : undefined}>
                    <ItemField
                      item={item}
                      name={widgetName([sectionKey, field.id, i, item.id])}
                      textareaLines={textareaLines}
                      label={
                        ITEM_LABEL_OVERRIDES[`${field.id}.${item.id}`] ?? item.label
                      }
                    />
                  </View>
                ))}
              </View>
            ))}
          </View>
        ))
      )}
    </>
  );
}

function Field({ field, sectionKey }: { field: FieldDef; sectionKey: string }) {
  if (field.kind === "repeater") {
    return <Repeater field={field} sectionKey={sectionKey} />;
  }
  const boxH = boxHeight(field);
  return (
    <View style={s.field} wrap={false}>
      <Text style={s.label}>{FIELD_LABEL_OVERRIDES[`${sectionKey}.${field.id}`] ?? field.label}</Text>
      {scrubHelp(field.help) ? <Text style={s.help}>{scrubHelp(field.help)}</Text> : null}
      <Box
        name={widgetName([sectionKey, field.id])}
        height={boxH}
        multiline={field.kind === "textarea"}
      />
    </View>
  );
}

/* ------------------------------------------------------------------ cover */

const HOW_TO_USE: readonly string[] = [
  "Type straight into the boxes in Acrobat, Preview, or any PDF editor — or print it and write by hand.",
  "Every question is here, including ones that will not apply to you. Skip anything that does not fit; nothing is required.",
  "Boxes are a fixed size. If you type more than fits, the extra is kept on screen but will NOT print — finish long answers on a separate sheet, or use the builder at myletterofintent.com, which has no limit.",
  "Save your filled-in copy somewhere you will find it again. This file is yours; nothing is sent anywhere.",
];

function Cover({
  eyebrow,
  title,
  lead,
}: {
  eyebrow: string;
  title: string;
  lead: string;
}) {
  return (
    <>
      <View style={s.coverRule} />
      <Text style={s.eyebrow}>{eyebrow}</Text>
      <Text style={s.coverTitle}>{title}</Text>
      <Text style={s.coverLead}>{lead}</Text>
      <View style={s.howBox}>
        <Text style={s.howTitle}>HOW TO USE THIS FORM</Text>
        {HOW_TO_USE.map((line) => (
          <View key={line} style={s.howItem}>
            <View style={s.howDot} />
            <Text style={s.howText}>{line}</Text>
          </View>
        ))}
      </View>
      <Text style={s.coverFoot}>
        This is not a will, a trust, or a legal instrument, and it is not a substitute
        for one. It is what you know, written down for whoever comes next.
      </Text>
    </>
  );
}

/* -------------------------------------------------------------- documents */

export interface BlankFormProps {
  projection: LetterProjection;
  eyebrow: string;
  title: string;
  lead: string;
  footer: string;
}

/**
 * Sections in roster order, keeping only what this letter projects — the same
 * table the letters themselves consume, so a blank form can never ask for
 * something the letter would not print.
 */
function projectedSections(projection: LetterProjection): SectionDef[] {
  return allSections()
    .filter((def) => projection[def.key] !== undefined)
    .map((def) => ({
      ...def,
      fields: def.fields.filter((f) => projects(projection, def.key, f.id)),
    }))
    .filter((def) => def.fields.length > 0);
}

export function BlankLetterForm({
  projection,
  eyebrow,
  title,
  lead,
  footer,
}: BlankFormProps) {
  registerBrandFonts();
  const sections = projectedSections(projection);

  return (
    <Document title={title} author="My Letter of Intent">
      <Page size="LETTER" style={s.page}>
        <Cover eyebrow={eyebrow} title={title} lead={lead} />
        <Footer label={footer} />
      </Page>

      {sections.flatMap((def) => {
        /*
         * A section becomes one page for its ordinary questions and one page
         * per repeating question, rather than a single page that flows.
         *
         * This is the fix for the failure that cost the most to find. Records
         * are laid out whole (wrap={false}) so no form widget can be sliced by
         * a page break — a sliced widget gets its rectangle written from its
         * pre-break position and lands two points tall, invisible and
         * unclickable, in a file that still reports a full count of widgets.
         * But wrap={false} means "find room for this", and when a long section
         * has already filled the page there is no room to find: the search
         * runs the coordinate out to -1.8e+21 and the render dies with no file
         * at all.
         *
         * It was not a property of any one question. Every health field built
         * on its own, and the section only failed once thirteen of them were
         * asked together — which is why the Letter of Intent was fine while
         * the caregiver letter, which asks for all of them, produced nothing.
         *
         * Starting each repeater on its own page bounds what any page has to
         * hold. A record chunk is at most half a page and always meets an
         * empty one, so there is never a search that can fail.
         */
        const scalars = def.fields.filter((f) => f.kind !== "repeater");
        const repeaters = def.fields.filter((f) => f.kind === "repeater");
        const groups = [
          ...(scalars.length > 0 ? [scalars] : []),
          ...repeaters.map((r) => [r]),
        ];
        return groups.map((fields, g) => (
          <Page key={`${def.key}-${g}`} size="LETTER" style={s.page}>
            <View style={s.sectionHead}>
              <Text style={s.eyebrow}>{def.navTitle.replace(/\{name\}/g, "them")}</Text>
              <Text style={s.sectionTitle}>
                {def.title.replace(/\{name\}/g, "them")}
                {g > 0 ? ", continued" : ""}
              </Text>
              <View style={s.sectionRule} />
            </View>
            {fields.map((field) => (
              <Field key={field.id} field={field} sectionKey={def.key} />
            ))}
            <Footer label={footer} />
          </Page>
        ));
      })}
    </Document>
  );
}

/**
 * The emergency sheet's blank form is shaped like the sheet itself rather than
 * like a section of the letter: it is one page that ends up on a fridge, so
 * the boxes stand where the printed sheet puts them. Its questions are the
 * ones derive.ts emergencyInfo() reads, minus the legacy fallbacks — asking
 * both a question and the older question it replaced would be asking twice.
 */
interface EmergencyBox {
  name: string;
  label: string;
  help?: string;
  lines: number;
}

const EMERGENCY_IDENTITY: readonly EmergencyBox[] = [
  { name: "person.fullName", label: "Full name", lines: 1 },
  { name: "person.preferred", label: "Goes by", lines: 1 },
  { name: "person.dateOfBirth", label: "Date of birth", lines: 1 },
  { name: "health.insurancePlans", label: "Insurance", lines: 1 },
  { name: "health.preferredHospital", label: "Preferred hospital", lines: 1 },
  { name: "familySupport.firstCall", label: "Call first", lines: 1 },
];

const EMERGENCY_BOXES: readonly EmergencyBox[] = [
  {
    name: "health.conditions",
    label: "DIAGNOSES",
    help: "Conditions a stranger needs to know about in the first minute.",
    lines: 4,
  },
  {
    name: "health.allergies",
    label: "ALLERGIES",
    help: "What they react to, and what the reaction looks like.",
    lines: 4,
  },
  {
    name: "health.medications",
    label: "CURRENT MEDICATIONS",
    help: "Name, dose, and what it is for — one per line.",
    lines: 7,
  },
  {
    name: "emergencyPlan.responseSteps",
    label: "IN AN EMERGENCY — PROTOCOL",
    help: "What to do first, second, third. When to call 911.",
    lines: 6,
  },
  {
    name: "communication.how",
    label: "HOW THEY COMMUNICATE",
    help: "How they say yes and no, and how pain shows when they will not say it.",
    lines: 5,
  },
  {
    name: "behavior.deEscalation",
    label: "IF THEY BECOME OVERWHELMED",
    help: "What sets it off, what helps, and what makes it worse.",
    lines: 5,
  },
  {
    name: "familySupport.contacts",
    label: "EMERGENCY CONTACTS",
    help: "Name, relationship, and phone number — most important first.",
    lines: 6,
  },
];

export function BlankEmergencyForm({ footer }: { footer: string }) {
  registerBrandFonts();
  return (
    <Document title="Emergency Information Sheet — blank form" author="My Letter of Intent">
      <Page size="LETTER" style={s.page}>
        <Cover
          eyebrow="Blank fillable form"
          title="Emergency Information Sheet"
          lead={
            "One page for the fridge, the school office, the sitter, and the ER. Fill " +
            "it in, print it, and put it where someone would look for it in a hurry."
          }
        />
        <Footer label={footer} />
      </Page>

      <Page size="LETTER" style={s.page}>
        <View style={s.sectionHead}>
          <Text style={s.eyebrow}>Emergency information</Text>
          <Text style={s.sectionTitle}>Who this is, and who to call</Text>
          <View style={s.sectionRule} />
        </View>

        <View style={s.record}>
          {EMERGENCY_IDENTITY.map((b) => (
            <View key={b.name} style={{ marginTop: 4 }} wrap={false}>
              <Text style={s.itemLabel}>{b.label}</Text>
              <Box name={b.name} height={SINGLE_LINE} />
            </View>
          ))}
        </View>

        {EMERGENCY_BOXES.map((b) => (
          <View key={b.name} style={s.field} wrap={false}>
            <Text style={s.label}>{b.label}</Text>
            {b.help ? <Text style={s.help}>{b.help}</Text> : null}
            <Box name={b.name} height={b.lines * LINE_H + 10} multiline />
          </View>
        ))}

        <Footer label={footer} />
      </Page>
    </Document>
  );
}
