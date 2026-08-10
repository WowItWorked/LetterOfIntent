import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { GENERAL_SECTION_SLUGS, LETTER_KEY, SECTION_SLUGS } from "./fixture";

test("work survives a reload and the chooser offers to resume", async ({ page }) => {
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
  // Back to the section we were actually working in, so "last visited" is it.
  await page.goto("/letter/a-typical-day");

  await page.goto("/letter");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await expect(page.getByText(/2 of 20 sections/)).toBeVisible();
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
  // Scoped to the article: the rail has its own "Review & download" link.
  await page.locator("article").getByRole("link", { name: /review & download/i }).click();
  await expect(page.getByText(/nothing to review yet/i)).toBeVisible();
});

test("choosing the general path switches the rail to its nineteen sections", async ({
  page,
}) => {
  await page.goto("/letter");
  // Both the option card and the closing card offer this; take the card.
  await page.getByRole("button", { name: /start the general letter/i }).first().click();
  await expect(page).toHaveURL(/getting-started/);

  // The rail (or the mobile menu) now lists the general set. Both are in the
  // DOM at every width — only one of them is visible.
  const menu = page.locator("details > summary").filter({ hasText: "Sections" });
  if (await menu.isVisible()) await menu.click();
  const nav = page
    .getByRole("navigation", { name: "Letter sections" })
    .filter({ visible: true })
    .first();
  await expect(nav.getByRole("link", { name: /a typical week/i })).toBeVisible();
  await expect(nav.getByRole("link", { name: /for the trustee/i })).toHaveCount(0);

  await page.goto("/letter/a-typical-week");
  await expect(
    page.getByRole("heading", { level: 1, name: /a typical week/i })
  ).toBeVisible();
  await expect(page.getByText(/of 19 ·/i).first()).toBeVisible();
});

test("every general-path section renders", async ({ page }) => {
  for (const slug of GENERAL_SECTION_SLUGS) {
    await page.goto(`/letter/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
  }
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
  await page.getByRole("button", { name: /ready/i }).click();
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
  await page.getByRole("button", { name: /delete all my data…/i }).click();
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
    .getByRole("link", { name: /^Medical$/i })
    .click();
  await expect(page).toHaveURL(/medical/);
  await expect(page.getByRole("heading", { level: 1, name: /medical/i })).toBeVisible();
});

test("the header collapses to a menu on a narrow screen", async ({ page, isMobile }) => {
  test.skip(!isMobile, "mobile project only");
  await page.goto("/");
  const menuButton = page.getByRole("button", { name: "Menu" });
  await expect(menuButton).toBeVisible();
  await menuButton.click();
  // Matched on the leading word so the test survives copy tweaks to the
  // reassurance half of the label ("Start · it's free").
  await page.getByRole("navigation", { name: "Main" }).getByRole("link", { name: /^Start\b/ }).click();
  await expect(page).toHaveURL(/\/letter$/);
});
