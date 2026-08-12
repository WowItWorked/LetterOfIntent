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
  },
  {
    card: "The Letter for the Caregiver",
    file: "Letter-for-the-Caregiver-Fillable-Form.pdf",
    proof: "behavior.",
    minWidgets: 40,
  },
  {
    card: "The Emergency Information Sheet",
    file: "Emergency-Information-Sheet-Fillable-Form.pdf",
    proof: "health.allergies",
    minWidgets: 10,
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

    // Every box must be big enough to click and to type a line into. This is
    // the assertion that would have caught the shipped-broken version.
    const tooSmall = found.filter((w) => w.height < 8 || w.width < 40);
    expect(
      tooSmall.map((w) => `${w.name} ${w.width}x${w.height}`),
      "form fields with no usable area — invisible and unfillable in Acrobat"
    ).toEqual([]);

    // Two widgets sharing a name share one value in PDF, so a collision makes
    // a whole section echo itself. Names are built from section and field ids
    // precisely to make that impossible; this checks the construction held.
    const names = found.map((w) => w.name);
    expect(
      names.filter((n, i) => names.indexOf(n) !== i),
      "duplicate field names — these boxes would mirror each other's text"
    ).toEqual([]);
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
