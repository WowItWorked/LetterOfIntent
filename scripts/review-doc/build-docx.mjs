/**
 * Pass two: turn the captured sections into a Word document a lawyer can mark
 * up without needing to know anything about the site.
 *
 * Every piece of copy gets a short reference code. The codes are the whole
 * point: they survive Track Changes, they survive being retyped, and they are
 * how pass three finds the edited sentence again in the source tree. Nothing
 * else in the document is load-bearing.
 *
 *   node scripts/review-doc/build-docx.mjs
 */
import {
  AlignmentType,
  BorderStyle,
  Document,
  Footer,
  HeadingLevel,
  ImageRun,
  Packer,
  PageBreak,
  PageNumber,
  Paragraph,
  ShadingType,
  Table,
  TableCell,
  TableRow,
  TextRun,
  VerticalAlign,
  WidthType,
  convertInchesToTwip,
} from "docx";
import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";

const BUILD = path.resolve("review-pack/build");
const SHOTS = path.join(BUILD, "shots");
const OUT = path.resolve("review-pack");

/* ------------------------------------------------------------------ brand */
const NAVY = "253551";
const GOLD = "A87E45";
const INK = "1A2233";
const GRAY = "5A6472";
const RULE = "D9D3C7";
const BAND = "F2EFE7";

const SERIF = "Georgia";
const SANS = "Calibri";

/** Usable width inside 0.75in margins on Letter. */
const MAX_W_IN = 7.0;
/** Leave room for a caption and a little air; taller shots scale to fit this. */
const MAX_H_IN = 7.6;

/* ------------------------------------------------------------------ helpers */

/** Width and height straight out of a PNG's IHDR chunk. */
function pngSize(buf) {
  if (buf.length < 24) return null;
  return { w: buf.readUInt32BE(16), h: buf.readUInt32BE(20) };
}

const text = (t, opts = {}) =>
  new TextRun({ text: t, font: opts.font || SANS, ...opts });

const para = (runs, opts = {}) =>
  new Paragraph({ children: Array.isArray(runs) ? runs : [runs], ...opts });

const spacer = (pt = 8) => new Paragraph({ spacing: { after: pt * 20 }, children: [] });

function rule(color = RULE) {
  return new Paragraph({
    border: { bottom: { style: BorderStyle.SINGLE, size: 6, color } },
    spacing: { after: 160 },
    children: [],
  });
}

function eyebrow(t) {
  return para(
    text(t.toUpperCase(), { size: 15, color: GOLD, bold: true, characterSpacing: 60 }),
    { spacing: { after: 60 } }
  );
}

/* ------------------------------------------------------------------ blocks */

const CELL_MARGIN = {
  top: convertInchesToTwip(0.06),
  bottom: convertInchesToTwip(0.06),
  left: convertInchesToTwip(0.09),
  right: convertInchesToTwip(0.09),
};

const thinBorders = {
  top: { style: BorderStyle.SINGLE, size: 3, color: RULE },
  bottom: { style: BorderStyle.SINGLE, size: 3, color: RULE },
  left: { style: BorderStyle.SINGLE, size: 3, color: RULE },
  right: { style: BorderStyle.SINGLE, size: 3, color: RULE },
  insideHorizontal: { style: BorderStyle.SINGLE, size: 3, color: RULE },
  insideVertical: { style: BorderStyle.SINGLE, size: 3, color: RULE },
};

function headerCell(label, widthPct) {
  return new TableCell({
    width: { size: widthPct, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: NAVY, color: "auto" },
    margins: CELL_MARGIN,
    verticalAlign: VerticalAlign.CENTER,
    children: [
      para(
        text(label.toUpperCase(), {
          size: 15,
          bold: true,
          color: "FFFFFF",
          characterSpacing: 40,
        })
      ),
    ],
  });
}

/**
 * One row per piece of copy. The reference cell is shaded and the text cell is
 * left deliberately plain — that is the box she types in, and anything else in
 * there competes with her own marks.
 */
function blockRow(b) {
  const kindRuns = [text(b.kind, { size: 16, color: GRAY })];
  if (b.srOnly) kindRuns.push(text("\nscreen reader only", { size: 14, color: GOLD, italics: true }));
  if (b.hasPlaceholder)
    kindRuns.push(text("\ncontains a placeholder", { size: 14, color: GOLD, italics: true }));

  return new TableRow({
    children: [
      new TableCell({
        width: { size: 12, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: BAND, color: "auto" },
        margins: CELL_MARGIN,
        children: [para(text(b.ref, { size: 15, bold: true, color: NAVY }))],
      }),
      new TableCell({
        width: { size: 16, type: WidthType.PERCENTAGE },
        shading: { type: ShadingType.CLEAR, fill: BAND, color: "auto" },
        margins: CELL_MARGIN,
        children: [para(kindRuns)],
      }),
      new TableCell({
        width: { size: 72, type: WidthType.PERCENTAGE },
        margins: CELL_MARGIN,
        children: [para(text(b.text, { size: 21, color: INK }), { spacing: { line: 300 } })],
      }),
    ],
  });
}

function blockTable(blocks) {
  return new Table({
    width: { size: 100, type: WidthType.PERCENTAGE },
    borders: thinBorders,
    rows: [
      new TableRow({
        tableHeader: true,
        children: [headerCell("Ref", 12), headerCell("Kind", 16), headerCell("Text as published — edit here", 72)],
      }),
      ...blocks.map(blockRow),
    ],
  });
}

/* ------------------------------------------------------------------ images */

async function imageParagraph(file, caption) {
  let buf;
  try {
    buf = await readFile(path.join(SHOTS, file));
  } catch {
    return [para(text(`[screenshot missing: ${file}]`, { size: 16, color: GRAY, italics: true }))];
  }
  const size = pngSize(buf);
  if (!size) return [];

  // Fit the box from the aspect ratio alone. The captures come off at
  // different pixel densities — page sections at CSS scale, PDF canvases at
  // whatever pdf.js painted — so anything that assumes a scale factor is
  // wrong for half of them. Width first; fall back to height for the very
  // tall sections, which would otherwise run off the page.
  const aspect = size.h / size.w;
  let wIn = MAX_W_IN;
  let hIn = MAX_W_IN * aspect;
  if (hIn > MAX_H_IN) {
    hIn = MAX_H_IN;
    wIn = MAX_H_IN / aspect;
  }

  const out = [
    para(
      new ImageRun({
        data: buf,
        type: "png",
        transformation: { width: Math.round(wIn * 96), height: Math.round(hIn * 96) },
      }),
      { spacing: { after: 60 }, alignment: AlignmentType.CENTER }
    ),
  ];
  if (caption) {
    out.push(
      para(text(caption, { size: 15, color: GRAY, italics: true }), {
        alignment: AlignmentType.CENTER,
        spacing: { after: 200 },
      })
    );
  }
  return out;
}

/* ------------------------------------------------------------------ chrome */

function partDivider(n, title, blurb) {
  return [
    new Paragraph({ children: [new PageBreak()] }),
    spacer(70),
    para(text(`PART ${n}`, { size: 18, color: GOLD, bold: true, characterSpacing: 120 }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    para(text(title, { font: SERIF, size: 40, bold: true, color: NAVY }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 160 },
      heading: HeadingLevel.HEADING_1,
    }),
    para(text(blurb, { size: 21, color: GRAY }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 200 },
    }),
  ];
}

function coverPage(meta) {
  return [
    spacer(90),
    para(text("TRUSTS & WEALTH, PLLC", { size: 18, color: GOLD, bold: true, characterSpacing: 120 }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 240 },
    }),
    para(text("Website copy review", { font: SERIF, size: 56, bold: true, color: NAVY }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 100 },
    }),
    para(text("myletterofintent.com", { font: SERIF, size: 28, color: GRAY, italics: true }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 320 },
    }),
    rule(GOLD),
    para(
      text(
        "Every word the site puts in front of a family, photographed in place and " +
          "set out for redlining. Each piece of copy carries a reference code so " +
          "your edits can be applied back to the site exactly as you make them.",
        { size: 22, color: INK }
      ),
      { alignment: AlignmentType.CENTER, spacing: { after: 400, line: 340 } }
    ),
    spacer(40),
    para(
      [
        text("Prepared for  ", { size: 18, color: GRAY }),
        text("Claire Kelly, Esq.", { size: 18, bold: true, color: INK }),
      ],
      { alignment: AlignmentType.CENTER, spacing: { after: 60 } }
    ),
    para(text(meta.dateLabel, { size: 18, color: GRAY }), {
      alignment: AlignmentType.CENTER,
      spacing: { after: 60 },
    }),
    para(
      text(`${meta.sections} sections · ${meta.blocks} pieces of copy`, { size: 18, color: GRAY }),
      { alignment: AlignmentType.CENTER }
    ),
  ];
}

function howToPage() {
  const bullet = (t, b = "") =>
    para(
      [
        text("◆  ", { size: 20, color: GOLD }),
        ...(b ? [text(b, { size: 21, bold: true, color: INK })] : []),
        text(t, { size: 21, color: INK }),
      ],
      { spacing: { after: 130, line: 320 }, indent: { left: convertInchesToTwip(0.12) } }
    );

  return [
    new Paragraph({ children: [new PageBreak()] }),
    eyebrow("Before you begin"),
    para(text("How to mark up this document", { font: SERIF, size: 34, bold: true, color: NAVY }), {
      heading: HeadingLevel.HEADING_1,
      spacing: { after: 160 },
    }),
    rule(),
    bullet(
      "in Word, then edit the right-hand column of any table directly. Your " +
        "insertions and deletions will be captured, and nothing else in the " +
        "document needs to be touched.",
      "Turn on Track Changes "
    ),
    bullet(
      "in the first column is how each sentence is found again in the site's " +
        "code. Please leave those cells alone — if a code is lost, that edit has " +
        "to be matched by hand.",
      "The reference code "
    ),
    bullet(
      "are filled in per family by the site — [LOVED ONE’S NAME] becomes the " +
        "actual name when a letter is written. Edit the sentence around them, but " +
        "keep the bracketed placeholder itself.",
      "Words in square brackets "
    ),
    bullet(
      "if a comment is easier than a rewrite. Word's Review ▸ New Comment is " +
        "read alongside the tracked changes.",
      "Use a comment "
    ),
    bullet(
      "shows the copy in place, at the size and in the order a visitor meets it. " +
        "The screenshots are for context only — there is nothing to edit on them.",
      "The picture above each table "
    ),
    spacer(10),
    rule(),
    para(
      text(
        "When you are finished, save the file with your changes and send it back. " +
          "Every tracked edit will be read out of the document and applied to the " +
          "site, and anything ambiguous will be raised with you rather than guessed at.",
        { size: 21, color: INK }
      ),
      { spacing: { line: 320 } }
    ),
  ];
}

function sectionHeading(entry, refRange) {
  const meta = [entry.url, entry.sourceFile].filter(Boolean).join("  ·  ");
  return [
    new Paragraph({ children: [new PageBreak()] }),
    eyebrow(entry.routeTitle),
    para(text(entry.section, { font: SERIF, size: 30, bold: true, color: NAVY }), {
      heading: HeadingLevel.HEADING_2,
      spacing: { after: 60 },
    }),
    para(
      [
        text(meta, { size: 16, color: GRAY }),
        ...(refRange ? [text(`  ·  ${refRange}`, { size: 16, color: GOLD, bold: true })] : []),
      ],
      { spacing: { after: 140 } }
    ),
    rule(),
  ];
}

/* ------------------------------------------------------------------ main */

async function main() {
  const manifest = JSON.parse(await readFile(path.join(BUILD, "manifest.json"), "utf8"));
  let pdfManifest = { entries: [] };
  try {
    pdfManifest = JSON.parse(await readFile(path.join(BUILD, "manifest-pdf.json"), "utf8"));
  } catch {
    console.warn("  (no manifest-pdf.json — Part 3 will be omitted)");
  }

  const all = [...manifest.entries, ...pdfManifest.entries];
  const totalBlocks = all.reduce((n, e) => n + e.blocks.length, 0);
  const dateLabel = new Date(manifest.generatedAt).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const children = [];

  children.push(...coverPage({ dateLabel, sections: all.length, blocks: totalBlocks }));
  children.push(...howToPage());

  const parts = [
    {
      n: 1,
      title: "The public pages",
      blurb: "What anyone reaching the site can read without starting a letter.",
      entries: manifest.entries.filter((e) => e.part === 1),
    },
    {
      n: 2,
      title: "The letter questions",
      blurb:
        "Every section of both letter sets: the questions families answer, and the guidance beside them.",
      entries: manifest.entries.filter((e) => e.part === 2),
    },
    {
      n: 3,
      title: "The printed documents",
      blurb:
        "The pages a family prints and hands on, and the notices that carry the firm's name.",
      entries: pdfManifest.entries,
    },
  ];

  for (const part of parts) {
    if (!part.entries.length) continue;
    children.push(...partDivider(part.n, part.title, part.blurb));

    for (const entry of part.entries) {
      const refs = entry.blocks.map((b) => b.ref);
      const range = refs.length
        ? refs.length === 1
          ? refs[0]
          : `${refs[0]} – ${refs[refs.length - 1]}`
        : "";
      children.push(...sectionHeading(entry, range));

      const images = entry.images || (entry.image ? [entry.image] : []);
      for (let i = 0; i < images.length; i++) {
        const cap =
          images.length > 1 ? `Page ${i + 1} of ${images.length}, as printed` : "As published";
        children.push(...(await imageParagraph(images[i], cap)));
      }

      if (entry.blocks.length) {
        children.push(spacer(6));
        children.push(blockTable(entry.blocks));
      } else {
        children.push(
          para(text("No editable copy in this section.", { size: 20, color: GRAY, italics: true }))
        );
      }
    }
  }

  const doc = new Document({
    creator: "Trusts & Wealth, PLLC",
    title: "Website copy review — myletterofintent.com",
    description: "Section-by-section copy review pack for redlining.",
    styles: {
      default: {
        document: { run: { font: SANS, size: 21, color: INK } },
      },
    },
    sections: [
      {
        properties: {
          page: {
            margin: {
              top: convertInchesToTwip(0.75),
              right: convertInchesToTwip(0.75),
              bottom: convertInchesToTwip(0.75),
              left: convertInchesToTwip(0.75),
            },
          },
        },
        footers: {
          default: new Footer({
            children: [
              new Paragraph({
                alignment: AlignmentType.CENTER,
                children: [
                  text("Website copy review · myletterofintent.com · page ", {
                    size: 15,
                    color: GRAY,
                  }),
                  new TextRun({ children: [PageNumber.CURRENT], size: 15, color: GRAY, font: SANS }),
                ],
              }),
            ],
          }),
        },
        children,
      },
    ],
  });

  const buf = await Packer.toBuffer(doc);
  const outFile = path.join(OUT, "Website-copy-review-myletterofintent.docx");
  await writeFile(outFile, buf);

  // A machine-readable twin of the same refs, so pass three never has to parse
  // prose to know what the original said.
  const index = {};
  for (const e of all) {
    for (const b of e.blocks) {
      index[b.ref] = {
        original: b.original ?? b.text,
        kind: b.kind,
        page: e.routeTitle,
        section: e.section,
        url: e.url,
        sourceFile: e.sourceFile || null,
      };
    }
  }
  await writeFile(path.join(OUT, "copy-index.json"), JSON.stringify(index, null, 2));

  console.log(`\n  ${all.length} sections, ${totalBlocks} blocks`);
  console.log(`  ${(buf.length / 1024 / 1024).toFixed(1)} MB -> ${outFile}`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
