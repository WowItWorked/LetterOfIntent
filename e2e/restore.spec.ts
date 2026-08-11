import { expect, test, type Page } from "@playwright/test";
import { FULL_LETTER, seedLetter } from "./fixture";

/**
 * Loading a backup is the one place a family can lose work, so every branch
 * gets exercised: the happy path, the v1 file from the two-path era (which
 * must import cleanly forever), the damaged file, and the file we cannot
 * read at all.
 */

const json = (value: unknown) => ({
  name: "backup.json",
  mimeType: "application/json",
  buffer: Buffer.from(JSON.stringify(value)),
});

async function upload(page: Page, file: ReturnType<typeof json>) {
  await page.goto("/your-data");
  await page.locator('input[type="file"]').setInputFiles(file);
}

test("a v1 general-era backup loads cleanly, its answers carried into the letter", async ({
  page,
}) => {
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 1,
      meta: { letterPath: "general" },
      data: {
        gettingStarted: { subjectPreferredName: "Emily", authorName: "Andy" },
        steppingIn: { firstWeek: "Call Hannah first." },
      },
    })
  );

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await expect(page.getByText(/older version of this tool/i)).toBeVisible();
  await page.goto("/letter/for-whoever-steps-in");
  await expect(page.getByLabel(/what the first week should look like/i)).toHaveValue(
    "Call Hannah first."
  );
});

test("a v1 special-needs backup with no letterPath at all still lands canonical", async ({
  page,
}) => {
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 1,
      // No meta.letterPath — the shape of an older export.
      data: {
        gettingStarted: { subjectPreferredName: "Alex" },
        trustee: { moneyIsFor: "A life, not a ledger." },
      },
    })
  );

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await page.goto("/letter/guidance-for-the-trustee");
  await expect(page.getByLabel(/what is it paying for/i)).toHaveValue(
    "A life, not a ledger."
  );
});

test("a shared-sections-only v1 file loads silently — nobody is asked which letter it was", async ({
  page,
}) => {
  await upload(
    page,
    json({
      gettingStarted: { subjectPreferredName: "Alex" },
      familySupport: { firstCall: "Dana" },
    })
  );

  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await page.goto("/letter/family-and-support");
  await expect(page.getByLabel(/who would you call first/i)).toHaveValue("Dana");
});

test("a v1 file holding BOTH old shapes keeps both answers, joined for review", async ({
  page,
}) => {
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 1,
      meta: { letterPath: "special-needs" },
      data: {
        typicalDay: { goodDay: "He hums at dinner." },
        typicalWeek: { goodDay: "The garden is in it." },
      },
    })
  );

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await expect(page.getByText(/both were kept together/i)).toBeVisible();
  await page.goto("/letter/typical-days");
  const value = await page.getByLabel(/good day/i).inputValue();
  expect(value).toContain("hums");
  expect(value).toContain("garden");
});

test("a damaged backup restores what it can and says what it could not", async ({
  page,
}) => {
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 1,
      meta: { letterPath: "special-needs" },
      data: {
        gettingStarted: { subjectPreferredName: "Alex" },
        medical: { allergies: "Penicillin" },
        about: "this section is corrupt",
        behavior: ["so is this one"],
      },
    })
  );

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await expect(page.getByText(/could not be read/i)).toBeVisible();

  await page.goto("/letter/health-and-medical");
  await expect(page.getByLabel(/allergies/i).first()).toHaveValue("Penicillin");
});

test("an unreadable file apologises and changes nothing", async ({ page }) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/your-data");

  await page.locator('input[type="file"]').setInputFiles({
    name: "holiday-photo.pdf",
    mimeType: "application/pdf",
    buffer: Buffer.from("%PDF-1.7 this is definitely not a backup"),
  });

  await expect(page.getByText(/sorry/i)).toBeVisible();
  await expect(page.getByRole("dialog")).toBeHidden();

  // The letter that was already here is untouched.
  await page.goto("/letter/getting-started");
  await expect(page.getByLabel("What they like to be called")).toHaveValue("Alex");
});

test("another app's export is refused", async ({ page }) => {
  await upload(page, json({ app: "some-other-tool", version: 3, data: { x: 1 } }));
  await expect(page.getByText(/does not look like a letter of intent backup/i)).toBeVisible();
});

test("a backup carrying a __proto__ key cannot pollute the page", async ({ page }) => {
  await page.goto("/your-data");
  await page.locator('input[type="file"]').setInputFiles({
    name: "hostile.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      '{"gettingStarted":{"subjectPreferredName":"Alex"},' +
        '"trustee":{"moneyIsFor":"A life"},' +
        '"__proto__":{"polluted":"yes"}}'
    ),
  });

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  const polluted = await page.evaluate(
    () => ({} as Record<string, unknown>).polluted ?? null
  );
  expect(polluted).toBeNull();
});

test("downloaded files are named by document and date, never by person or question set", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/letter/review");

  const names: string[] = [];
  page.on("download", (d) => names.push(d.suggestedFilename()));
  await page.getByRole("button", { name: /download all three together/i }).click();
  await expect.poll(() => names.length, { timeout: 60_000 }).toBeGreaterThanOrEqual(3);

  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  expect(names).toEqual(
    expect.arrayContaining([
      `Letter-of-Intent-${iso}.pdf`,
      `Emergency-Information-Sheet-${iso}.pdf`,
      `Letter-of-Intent-Backup-${iso}.json`,
    ])
  );
  // FULL_LETTER is about "Alex"; no filename may say so — and with one form,
  // no filename qualifies a question set either.
  for (const n of names) {
    expect(n.toLowerCase()).not.toContain("alex");
    expect(n).not.toMatch(/Disabilities|Anyone/);
  }
});

test("the sample documents still render watermarked, drawn in the page", async ({
  page,
}) => {
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));

  // The sample viewer renders the document rather than handing over a file.
  await page.goto("/samples/letter-of-intent-disabilities");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  expect(downloads).toEqual([]);
});
