import { expect, test, type Page } from "@playwright/test";
import { FULL_LETTER, seedLetter } from "./fixture";

/**
 * Loading a backup is the one place a family can lose work, so every branch
 * gets exercised: the happy path, the file that predates the second letter,
 * the file we cannot tell apart, and the file we cannot read at all.
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

test("a backup that names its letter loads without asking anything", async ({ page }) => {
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
  await page.goto("/letter/for-whoever-steps-in");
  await expect(page.getByLabel(/what the first week should look like/i)).toHaveValue(
    "Call Hannah first."
  );
});

test("a backup from before the second letter existed is matched by its sections", async ({
  page,
}) => {
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 1,
      // No meta.letterPath at all — the shape of an older export.
      data: {
        gettingStarted: { subjectPreferredName: "Alex" },
        trustee: { moneyIsFor: "A life, not a ledger." },
      },
    })
  );

  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  await expect(page.getByText(/did not say which letter/i)).toBeVisible();
  await page.goto("/letter/guidance-for-the-trustee");
  await expect(page.getByLabel(/what is it paying for/i)).toHaveValue(
    "A life, not a ledger."
  );
});

test("a backup that cannot be told apart asks which letter it is", async ({ page }) => {
  await upload(
    page,
    json({
      gettingStarted: { subjectPreferredName: "Alex" },
      familySupport: { firstCall: "Dana" },
    })
  );

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  await expect(dialog.getByText(/which letter is this/i)).toBeVisible();

  await dialog.getByRole("button", { name: /aging & general care/i }).click();
  await expect(page.getByText(/backup loaded/i)).toBeVisible();

  // It went into the set the person picked. Asserted on the section header
  // rather than the rail, which is inside a collapsed menu on a narrow screen.
  await page.goto("/letter/a-typical-week");
  await expect(page.locator("h1")).toBeVisible();
  await expect(page.getByText(/Section \d+ of 14/i)).toBeVisible();
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

  await page.goto("/letter/medical");
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
    // Includes a special-needs-only section so the file identifies itself and
    // loads straight through — this test is about the payload, not the chooser.
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

test("downloaded files are named by document and date, never by person", async ({
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
      `Letter-of-Intent-Disabilities-${iso}.pdf`,
      `Emergency-Information-Sheet-${iso}.pdf`,
      `Letter-of-Intent-Disabilities-Backup-${iso}.json`,
    ])
  );
  // FULL_LETTER is about "Alex"; no filename may say so.
  for (const n of names) expect(n.toLowerCase()).not.toContain("alex");
});

test("the home page offers watermarked samples, drawn in the page", async ({ page }) => {
  const downloads: string[] = [];
  page.on("download", (d) => downloads.push(d.suggestedFilename()));

  await page.goto("/");
  const links = page.locator('#who-this-is-for a[href^="/samples/"]');
  await expect(links).toHaveCount(4);

  for (const link of await links.all()) {
    expect(await link.getAttribute("target")).toBe("_blank");
    expect(await link.getAttribute("rel")).toContain("noopener");
    // The viewer, not the raw file — whether a browser opens or downloads a
    // PDF is a per-browser setting we do not control.
    expect(await link.getAttribute("href")).not.toMatch(/\.pdf$/);
  }

  // Following one renders the document rather than handing over a file.
  await page.goto("/samples/letter-of-intent-disabilities");
  await expect(page.locator("canvas").first()).toBeVisible({ timeout: 60_000 });
  expect(downloads).toEqual([]);
});
