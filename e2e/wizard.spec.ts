import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { LETTER_KEY, SECTION_SLUGS } from "./fixture";

test("work survives a reload and the home page offers to resume", async ({ page }) => {
  await page.goto("/letter/getting-started");
  await page.getByLabel("Your name").fill("Maria Alvarez");
  await page.getByLabel("What they like to be called").fill("Alex");
  await page.waitForTimeout(1000);

  await page.goto("/letter/a-typical-day");
  await page.getByLabel("Describe a good day").fill("No surprises. Trains after program.");
  await page.waitForTimeout(1000);

  await page.reload();
  await expect(page.getByLabel("Describe a good day")).toHaveValue(
    "No surprises. Trains after program."
  );

  // The app now speaks Alex's name (works on any viewport).
  await page.goto("/letter/about");
  await expect(page.getByRole("heading", { level: 1, name: "About Alex" })).toBeVisible();
  await page.goto("/letter/a-typical-day");

  await page.goto("/");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await expect(page.getByText(/2 of 15 sections/)).toBeVisible();
  await page.getByRole("link", { name: /pick up where you left off/i }).click();
  await expect(page).toHaveURL(/a-typical-day/);
});

test("every section is reachable with the Next button and empty fields draw no errors", async ({
  page,
}) => {
  await page.goto("/letter/getting-started");
  for (let i = 0; i < SECTION_SLUGS.length - 1; i++) {
    await expect(page).toHaveURL(new RegExp(SECTION_SLUGS[i].replace(/\//g, "\\/")));
    // No validation messages anywhere on an untouched form.
    await expect(page.getByText(/doesn't look/i)).toHaveCount(0);
    const next = page.getByRole("link", { name: /^Next:/ });
    if (await next.count()) {
      await next.click();
    } else {
      // Final wishes shows its gentle gate instead of a Next button.
      await page.getByRole("link", { name: /skip for now/i }).click();
    }
  }
  await expect(page).toHaveURL(/a-personal-message/);
  // Scoped to the article: the sidebar has its own "Review & download" link.
  await page.locator("article").getByRole("link", { name: /review & download/i }).click();
  await expect(page.getByText(/nothing to review yet/i)).toBeVisible();
});

test("the final-wishes interstitial is gentle, skippable, and remembered", async ({
  page,
}) => {
  await page.goto("/letter/final-wishes");
  await expect(page.getByText(/a gentle note before this section/i)).toBeVisible();
  await expect(page.getByLabel(/funeral or memorial/i)).toHaveCount(0);

  await page.getByRole("link", { name: /skip for now/i }).click();
  await expect(page).toHaveURL(/a-personal-message/);

  await page.goto("/letter/final-wishes");
  await expect(page.getByText(/a gentle note before this section/i)).toBeVisible();
  await page.getByRole("button", { name: /i'm ready/i }).click();
  await expect(page.getByLabel(/funeral or memorial/i)).toBeVisible();

  await page.reload();
  await expect(page.getByLabel(/funeral or memorial/i)).toBeVisible();
});

test("export → delete-all → import round-trips the letter", async ({ page }, testInfo) => {
  await page.goto("/letter/getting-started");
  await page.getByLabel("What they like to be called").fill("Alex");
  await page.waitForTimeout(1000);

  await page.goto("/your-data");
  const dl = page.waitForEvent("download");
  await page.getByRole("button", { name: /download backup file/i }).click();
  const backupPath = testInfo.outputPath("backup.json");
  await (await dl).saveAs(backupPath);
  const backup = JSON.parse(fs.readFileSync(backupPath, "utf8"));
  expect(backup.app).toBe("twl-letter-of-intent");
  expect(backup.data.gettingStarted.subjectPreferredName).toBe("Alex");

  // Delete everything, and verify the tool checked its own work.
  await page.getByRole("button", { name: /delete all my data/i }).click();
  await page.getByRole("button", { name: /yes, delete it all/i }).click();
  await expect(page.getByText(/this device now holds nothing/i)).toBeVisible();
  const stored = await page.evaluate((k) => window.localStorage.getItem(k), LETTER_KEY);
  expect(stored).toBeNull();

  // Import brings it back.
  const chooser = page.waitForEvent("filechooser");
  await page.getByRole("button", { name: /choose a backup file/i }).click();
  await (await chooser).setFiles(backupPath);
  await expect(page.getByText(/backup loaded/i)).toBeVisible();

  await page.goto("/letter/getting-started");
  await expect(page.getByLabel("What they like to be called")).toHaveValue("Alex");
});

test("the wizard works at 375px: mobile section menu navigates", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("/letter/getting-started");
  // The <summary> also contains a decorative glyph, so match by hasText.
  await page.locator("details > summary").filter({ hasText: "Sections" }).click();
  await page
    .getByRole("navigation", { name: "Letter sections" })
    .getByRole("link", { name: /medical/i })
    .click();
  await expect(page).toHaveURL(/medical/);
  await expect(page.getByRole("heading", { level: 1, name: /medical/i })).toBeVisible();
});
