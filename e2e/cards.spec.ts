import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { FULL_LETTER, seedLetter } from "./fixture";

/**
 * The care-cards page: pick, preview, download. Everything renders and
 * rasterizes in the browser — the privacy gate (privacy-network.spec.ts)
 * keeps holding because this page adds no network calls.
 */

/**
 * Reads a stored-entry ZIP's central directory. Written here rather than
 * imported from lib/zip.ts on purpose: an archive checked only by the code
 * that wrote it proves nothing about whether a phone can open it.
 */
function readZipEntries(zip: Buffer): { name: string; bytes: Buffer }[] {
  const eocd = zip.lastIndexOf(Buffer.from([0x50, 0x4b, 0x05, 0x06]));
  expect(eocd, "no End of Central Directory record").toBeGreaterThan(-1);
  const count = zip.readUInt16LE(eocd + 10);
  let at = zip.readUInt32LE(eocd + 16);

  const out: { name: string; bytes: Buffer }[] = [];
  for (let i = 0; i < count; i++) {
    expect(zip.readUInt32LE(at)).toBe(0x02014b50);
    const size = zip.readUInt32LE(at + 24);
    const nameLen = zip.readUInt16LE(at + 28);
    const extraLen = zip.readUInt16LE(at + 30);
    const commentLen = zip.readUInt16LE(at + 32);
    const localAt = zip.readUInt32LE(at + 42);
    const name = zip.subarray(at + 46, at + 46 + nameLen).toString("utf8");

    const dataAt =
      localAt + 30 + zip.readUInt16LE(localAt + 26) + zip.readUInt16LE(localAt + 28);
    out.push({ name, bytes: zip.subarray(dataAt, dataAt + size) });
    at += 46 + nameLen + extraLen + commentLen;
  }
  return out;
}

test("the review page hands over the whole card pack as PNGs in one zip", async ({
  page,
}, testInfo) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/letter/review");

  // The gallery shows the cards themselves, not a description of a file.
  const download = page.waitForEvent("download");
  await page
    .getByRole("button", { name: /download all \d+ cards \(zip\)/i })
    .click({ timeout: 60_000 });
  const file = testInfo.outputPath("care-cards.zip");
  await (await download).saveAs(file);

  const entries = readZipEntries(fs.readFileSync(file));

  // Seven topic cards plus the static index card. More is fine — a card that
  // runs long pages onto a second image — but never fewer.
  expect(entries.length).toBeGreaterThanOrEqual(8);
  for (const e of entries) {
    expect(e.name, "every member is a PNG").toMatch(/\.png$/);
    // The magic bytes: proof these are real images, not empty or truncated
    // members that only look right in a file listing.
    expect(
      e.bytes.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
      `${e.name} is not a PNG`
    ).toBe(true);
    expect(e.bytes.length, `${e.name} is suspiciously small`).toBeGreaterThan(2_000);
  }

  // The cards are named for the person on purpose — this is what makes a
  // camera roll searchable — and the eighth card is the bundle guide.
  expect(entries.filter((e) => e.name.startsWith("Alex — "))).not.toHaveLength(0);
  expect(entries.some((e) => /Which Cards To Send/.test(e.name))).toBe(true);
});

test("the five bundles render, and picking one shows every card as a preview", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/care-cards");

  // All five bundles, names and notes verbatim from content/cards.ts.
  for (const bundle of [
    "Quick trip",
    "Afternoon sitter",
    "Evening / bedtime",
    "Overnight respite",
    "School or camp intake",
  ]) {
    await expect(page.getByRole("button", { name: new RegExp(bundle, "i") })).toBeVisible();
  }
  // .first(): the note appears in the marketing bundles list and the picker tile.
  await expect(
    page.getByText("An hour in a waiting room", { exact: false }).first()
  ).toBeVisible();

  await page.getByRole("button", { name: /quick trip/i }).click();

  // Previews are role="img" with a spoken label (CareCard's own labelling).
  // FULL_LETTER's Alex was born 2004-03-14, so the header eyebrow carries an age.
  await expect(
    page.getByRole("img", { name: /identity & contacts care card for alex/i })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /emergency protocol care card for alex/i })
  ).toBeVisible();
  await expect(
    page.getByRole("img", { name: /behavior & communication care card for alex/i })
  ).toBeVisible();
});

test("a downloaded card is a real PNG named for the person — the deliberate inverse of the PDF rule", async ({
  page,
}, testInfo) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/care-cards");

  // One small card (identity) keeps capture time sane under CI browsers.
  await page.getByRole("button", { name: /individual cards/i }).click();
  await page.getByRole("checkbox", { name: /identity & contacts/i }).check();

  const names: string[] = [];
  page.on("download", (d) => names.push(d.suggestedFilename()));
  const downloadPromise = page.waitForEvent("download");
  // One picked card + the always-included Which Cards To Send index = 2 files.
  await page.getByRole("button", { name: /download 2 cards/i }).click();
  const download = await downloadPromise;

  /**
   * OWNER DECISION — the exact inverse of restore.spec.ts's PDF assertion:
   * document filenames never carry the person's name, but a care card's face
   * carries it in 70px type either way, so its filename says who it is for.
   * FULL_LETTER is about "Alex", and the filename SHOULD contain Alex.
   */
  expect(download.suggestedFilename()).toBe("Alex — Identity & Contacts.png");

  // The static index card rides along, name-free: its face carries no name,
  // so (by the same rule) neither does its filename.
  await expect.poll(() => names.length, { timeout: 90_000 }).toBeGreaterThanOrEqual(2);
  expect(names).toContain("Which Cards To Send.png");

  // PNG only, never JPEG: check the actual bytes, not just the extension.
  const file = testInfo.outputPath("identity-card.png");
  await download.saveAs(file);
  const buf = fs.readFileSync(file);
  expect(buf.subarray(0, 8)).toEqual(
    Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
  );
  expect(buf.length).toBeGreaterThan(10_000);
});

test("a bundle downloads one PNG per card, every filename patterned the same way", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/care-cards");

  await page.getByRole("button", { name: /quick trip/i }).click();

  const names: string[] = [];
  page.on("download", (d) => names.push(d.suggestedFilename()));
  // Quick trip = identity + emergency + behavior, all single-page with
  // FULL_LETTER, plus the always-included index card: exactly four files.
  await page.getByRole("button", { name: /download 4 cards/i }).click();
  await expect.poll(() => names.length, { timeout: 90_000 }).toBeGreaterThanOrEqual(4);

  expect(names).toEqual(
    expect.arrayContaining([
      "Alex — Identity & Contacts.png",
      "Alex — Emergency Protocol.png",
      "Alex — Behavior & Communication.png",
      "Which Cards To Send.png",
    ])
  );
  // "{Preferred name} — {Card title}.png", continuations "… 2 of 3.png" —
  // except the static index card, whose nameless face keeps its filename
  // nameless too.
  for (const n of names) {
    expect(n).toMatch(/^(Alex — [A-Za-z&' ]+( \d+ of \d+)?|Which Cards To Send)\.png$/);
  }
});

test("cards that are not ready are named gently and cannot be picked", async ({ page }) => {
  // A letter with just enough for the identity card and nothing else.
  await seedLetter(page, {
    gettingStarted: { subjectFullName: "Alexander James Alvarez", subjectPreferredName: "Alex" },
    familySupport: { contacts: [{ id: "c1", name: "Dana Alvarez", phone: "(703) 555-0142" }] },
  });
  await page.goto("/care-cards");

  await page.getByRole("button", { name: /individual cards/i }).click();

  const identity = page.getByRole("checkbox", { name: /identity & contacts/i });
  await expect(identity).toBeEnabled();

  // The missing-piece phrase (status.ts MISSING_COPY), never an error tone.
  const meds = page.getByRole("checkbox", { name: /medications/i });
  await expect(meds).toBeDisabled();
  await expect(page.getByText(/the medications card needs at least one medication/i)).toBeVisible();
});
