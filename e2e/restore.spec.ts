import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { FULL_LETTER, LETTER_KEY, persistedState, seedLetter } from "./fixture";

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

test("replacing a populated letter warns with specifics, and dismissing changes nothing", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 2,
      exportedAt: "2025-01-05T10:00:00.000Z",
      data: { gettingStarted: { subjectPreferredName: "Someone Else" } },
    })
  );

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();
  // Specific on both sides, and it says "replace", not "import".
  await expect(dialog.getByText(/replace/i).first()).toBeVisible();
  await expect(dialog.getByText(/on this device now/i)).toBeVisible();
  await expect(dialog.getByText(/in the backup file/i)).toBeVisible();
  // The dangerous direction is named: this file is older and holds less.
  await expect(dialog.getByText(/worth a second look/i)).toBeVisible();

  await dialog.getByRole("button", { name: /^cancel$/i }).click();
  await expect(dialog).toBeHidden();

  // Nothing changed — read storage directly, since the seeding init-script
  // would re-seed the fixture on any navigation and mask a failure.
  const storedName = await page.evaluate(() => {
    const raw = window.localStorage.getItem("twl-loi-letter-v1");
    return raw
      ? (JSON.parse(raw).state?.data?.gettingStarted?.subjectPreferredName ?? null)
      : null;
  });
  expect(storedName).toBe("Alex");
});

test("the safe path saves this device's letter before replacing it", async ({
  page,
}, testInfo) => {
  await seedLetter(page, FULL_LETTER);
  await upload(
    page,
    json({
      app: "twl-letter-of-intent",
      version: 2,
      data: { gettingStarted: { subjectPreferredName: "Someone Else" } },
    })
  );

  const dialog = page.getByRole("dialog");
  await expect(dialog).toBeVisible();

  const dl = page.waitForEvent("download");
  await dialog.getByRole("button", { name: /save this device/i }).click();
  const backupPath = testInfo.outputPath("pre-replace-backup.json");
  await (await dl).saveAs(backupPath);

  // The offered backup holds the letter exactly as it stood…
  const saved = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  expect(saved.data.gettingStarted.subjectPreferredName).toBe("Alex");
  expect(saved.data.behavior.triggers).toContain("Fire alarms");

  // …and only then was the letter replaced. (Read storage directly: the
  // seeding init-script would re-seed the fixture on any navigation.)
  await expect(page.getByText(/backup loaded/i)).toBeVisible();
  const storedName = await page.evaluate(() => {
    const raw = window.localStorage.getItem("twl-loi-letter-v1");
    return raw
      ? (JSON.parse(raw).state?.data?.gettingStarted?.subjectPreferredName ?? null)
      : null;
  });
  expect(storedName).toBe("Someone Else");
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
  await page.getByRole("button", { name: /download the full set/i }).click();
  await expect.poll(() => names.length, { timeout: 120_000 }).toBeGreaterThanOrEqual(5);

  const today = new Date();
  const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(
    today.getDate()
  ).padStart(2, "0")}`;

  expect(names).toEqual(
    expect.arrayContaining([
      `Letter-of-Intent-${iso}.pdf`,
      `Letter-for-the-Caregiver-${iso}.pdf`,
      `Emergency-Information-Sheet-${iso}.pdf`,
      // The archive's own name follows the no-names rule like every document.
      // The PNGs INSIDE it are named for the person on purpose — a camera roll
      // has to be searchable — which is why the loop below checks names, not
      // the archive's contents.
      `Care-Cards-${iso}.zip`,
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

test("opening samples leaves the visitor's own letter byte-identical", async ({
  page,
}) => {
  // A visitor mid-letter browses the samples: generation must be strictly
  // read-only. The init script re-seeds on navigation, so the assertion reads
  // localStorage AFTER each sample finishes drawing — any write the viewer
  // made after load would show up here.
  await seedLetter(page, FULL_LETTER);
  const expected = persistedState(FULL_LETTER);

  for (const slug of [
    "letter-of-intent-disabilities", // Ruiz trustee letter
    "emergency-sheet-anyone", // Hale sheet — the other family and kind
  ]) {
    await page.goto(`/samples/${slug}`);
    // Wait for the full document, not just the first page: the completion
    // note only appears once every page has been drawn.
    await expect(page.getByText(/generated on your device/i)).toBeVisible({
      timeout: 60_000,
    });
    const stored = await page.evaluate(
      (key) => window.localStorage.getItem(key),
      LETTER_KEY
    );
    expect(stored, slug).toBe(expected);
  }
});
