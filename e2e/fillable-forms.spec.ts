import fs from "node:fs";
import { expect, test } from "@playwright/test";

/**
 * The blank fillable forms — the paper path for a family that would rather sit
 * with Acrobat than a browser.
 *
 * These are checked by parsing the bytes rather than by trusting the button,
 * because every way this feature breaks is silent. A form that renders but
 * carries no AcroForm dictionary still looks perfect on screen; nobody finds
 * out it will not accept typing until they are sitting in front of it with an
 * afternoon set aside. Same for the field names: two widgets sharing a name
 * share one value in PDF, so a naming collision would make every box in a
 * section echo the others, and it would look fine until someone typed.
 */

/** Counts non-overlapping occurrences of a marker in the file. */
function count(buf: Buffer, marker: string): number {
  const needle = Buffer.from(marker);
  let n = 0;
  let at = buf.indexOf(needle);
  while (at !== -1) {
    n++;
    at = buf.indexOf(needle, at + needle.length);
  }
  return n;
}

interface Widget {
  name: string;
  height: number;
  width: number;
  /** PDF field type: Tx text, Btn checkbox, Ch dropdown. */
  kind: string;
}

/**
 * Every named form widget, with the size of its annotation rectangle.
 *
 * The rectangle is the whole point. Counting "/Widget" only proves the objects
 * exist, and that is exactly what shipped a form where every field had a
 * zero-high rect: Acrobat drew nothing to click, while a byte-level check
 * reported a healthy 200 widgets and passed. A field nobody can type into is
 * indistinguishable from a working one until someone opens it.
 */
function widgets(buf: Buffer): Widget[] {
  const out: Widget[] = [];
  const objects = buf.toString("latin1").matchAll(/\d+ 0 obj([\s\S]*?)endobj/g);
  for (const [, body] of objects) {
    if (!body.includes("/Widget")) continue;
    const rect = body.match(
      /\/Rect\s*\[\s*(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s+(-?[\d.]+)\s*\]/
    );
    const name = body.match(/\/T\s*\(([^)]*)\)/);
    if (!rect || !name) continue;
    out.push({
      name: name[1],
      kind: body.match(/\/FT\s*\/(\w+)/)?.[1] ?? "?",
      width: Math.abs(Number(rect[3]) - Number(rect[1])),
      height: Math.abs(Number(rect[4]) - Number(rect[2])),
    });
  }
  return out;
}

const FORMS = [
  {
    card: "The Letter of Intent",
    file: "Letter-of-Intent-Fillable-Form.pdf",
    // A field only this letter's projection reaches.
    proof: "moneyBenefits.",
    minWidgets: 40,
    sharedName: true,
    expectControls: true,
  },
  {
    card: "The Letter for the Caregiver",
    file: "Letter-for-the-Caregiver-Fillable-Form.pdf",
    proof: "behavior.",
    minWidgets: 40,
    sharedName: true,
    expectControls: true,
  },
  {
    card: "The Emergency Information Sheet",
    file: "Emergency-Information-Sheet-Fillable-Form.pdf",
    proof: "health.allergies",
    minWidgets: 10,
    // One short document with its own identity block, not a run of section
    // pages, so there is nothing for a repeated header field to solve.
    sharedName: false,
    // Free-text throughout by design: an emergency sheet is read in a hurry,
    // and a tick box says less than a sentence to whoever is holding it.
    expectControls: false,
  },
] as const;

for (const form of FORMS) {
  test(`the ${form.card} downloads as a real fillable PDF`, async ({ page }, testInfo) => {
    await page.goto("/fillable-forms");

    const card = page.getByRole("listitem").filter({ hasText: form.card });
    const downloadPromise = page.waitForEvent("download");
    await card.getByRole("button", { name: /^download pdf$/i }).click();
    const download = await downloadPromise;

    expect(download.suggestedFilename()).toBe(form.file);

    // Await saveAs before reading: fire-and-forget here races the reader under
    // a loaded worker pool, and the failure looks like a missing file.
    const path = testInfo.outputPath(form.file);
    await download.saveAs(path);
    const buf = fs.readFileSync(path);

    expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
    expect(buf.length).toBeGreaterThan(5_000);

    expect(
      buf.includes(Buffer.from("/AcroForm")),
      "the form carries no AcroForm dictionary — it is not fillable"
    ).toBe(true);
    expect(
      count(buf, "/Widget"),
      "far fewer form widgets than this document has questions"
    ).toBeGreaterThanOrEqual(form.minWidgets);
    expect(
      buf.includes(Buffer.from(form.proof)),
      `a field this document must carry (${form.proof}) is missing or misnamed`
    ).toBe(true);

    const found = widgets(buf);
    expect(found.length, "no named widgets could be read back").toBeGreaterThanOrEqual(
      form.minWidgets
    );

    // Every control must be big enough to hit and to hold its answer. This is
    // the assertion that would have caught the shipped-broken version, where
    // every field had a zero-high rectangle.
    //
    // The floor depends on the control: a checkbox is meant to be about 10pt
    // square, so holding it to a text field's width would fail every one of
    // them. Both still have to be big enough to click.
    const tooSmall = found.filter((w) =>
      w.kind === "Btn" ? w.height < 7 || w.width < 7 : w.height < 8 || w.width < 40
    );
    expect(
      tooSmall.map((w) => `${w.kind} ${w.name} ${w.width}x${w.height}`),
      "form fields with no usable area — invisible and unfillable in Acrobat"
    ).toEqual([]);

    // The forms are meant to be answerable, not just typed into: a closed set
    // of answers gets checkboxes or a dropdown, never a run of prose listing
    // the options and no way to pick one.
    if (form.expectControls) {
      expect(
        found.filter((w) => w.kind === "Btn").length,
        "no checkboxes — multi-answer questions have nothing to tick"
      ).toBeGreaterThan(10);
    }

    // Two widgets sharing a name share one value in PDF, so a collision makes
    // a whole section echo itself. Names are built from section and field ids
    // precisely to make that impossible; this checks the construction held.
    //
    // One name is shared on purpose: the person's name in every page header.
    // Sharing is exactly the point there — filling it in once names them on
    // every page — so it is excluded rather than the rule being weakened.
    const SHARED_ON_PURPOSE = "person.preferredName";
    const names = found.map((w) => w.name).filter((n) => n !== SHARED_ON_PURPOSE);
    expect(
      names.filter((n, i) => names.indexOf(n) !== i),
      "duplicate field names — these boxes would mirror each other's text"
    ).toEqual([]);

    // And it really is on every page, which is the whole reason to share it.
    if (form.sharedName) {
      expect(
        found.filter((w) => w.name === SHARED_ON_PURPOSE).length,
        "the shared name field is missing from some pages"
      ).toBeGreaterThan(1);
    }
  });
}

test("the page is honest about what the forms cannot do, and every document page reaches it", async ({
  page,
}) => {
  await page.goto("/fillable-forms");

  // The two caveats are the reason this page exists rather than three bare
  // download links. Losing either one is how someone silently loses an answer.
  await expect(page.getByText(/these forms ask every question/i)).toBeVisible();
  await expect(page.getByText(/the boxes are a fixed size/i)).toBeVisible();

  for (const path of [
    "/letter-of-intent",
    "/letter-for-the-caregiver",
    "/emergency-sheet",
  ]) {
    await page.goto(path);
    const callout = page.getByRole("complementary").filter({ hasText: /fillable PDF/i });
    await expect(callout, `${path} has no fillable-form callout`).toBeVisible();
    // Every callout points at the shared page, never at one file: someone on
    // the paper path almost never wants a single document in isolation.
    await expect(callout.getByRole("link", { name: /see all three forms/i })).toHaveAttribute(
      "href",
      "/fillable-forms"
    );
  }
});
