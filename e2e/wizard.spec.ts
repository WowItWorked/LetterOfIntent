import { expect, test } from "@playwright/test";
import fs from "node:fs";
import { LETTER_KEY, SECTION_SLUGS } from "./fixture";

test("work survives a reload and the letter page offers to resume", async ({ page }) => {
  await page.goto("/letter/getting-started");
  await page.getByLabel("Your name").fill("Maria Alvarez");
  await page.getByLabel("What they like to be called").fill("Alex");
  await page.waitForTimeout(1000);

  await page.goto("/letter/typical-days");
  await page.getByLabel("Describe a good day").fill("No surprises. Trains after program.");
  await page.waitForTimeout(1000);

  await page.reload();
  await expect(page.getByLabel("Describe a good day")).toHaveValue(
    "No surprises. Trains after program."
  );

  // The app now speaks Alex's name (works on any viewport).
  await page.goto("/letter/about-them");
  await expect(page.getByRole("heading", { level: 1, name: "About Alex" })).toBeVisible();
  // Back to the section we were actually working in, so "last visited" is it.
  await page.goto("/letter/typical-days");

  await page.goto("/letter");
  await expect(page.getByText(/welcome back/i)).toBeVisible();
  await expect(page.getByText(/2 of \d+ sections/)).toBeVisible();
  await page.getByRole("link", { name: /pick up where you left off/i }).click();
  await expect(page).toHaveURL(/typical-days/);
});

test("every active section is reachable with the Next button and empty fields draw no errors", async ({
  page,
}) => {
  await page.goto("/letter/getting-started");
  // Walk the whole configuration by Next (or the gentle gate's skip). The
  // roster is finite; the bound only guards against a loop.
  for (let i = 0; i < SECTION_SLUGS.length + 2; i++) {
    // No validation messages anywhere on an untouched form.
    await expect(page.getByText(/doesn't look/i)).toHaveCount(0);
    if (page.url().includes("a-personal-message")) break;
    const next = page.getByRole("link", { name: /^Next:/ });
    if (await next.count()) {
      await next.click();
    } else {
      // An emotional section shows its gentle gate instead of a Next button.
      await page.getByRole("link", { name: /skip for now/i }).click();
    }
  }
  await expect(page).toHaveURL(/a-personal-message/);
  // The last section is emotional too — acknowledge it, then leave via the
  // article's own review link.
  await page.getByRole("button", { name: /ready/i }).click();
  await page.locator("article").getByRole("link", { name: /review & download/i }).click();
  await expect(page.getByText(/nothing to review yet/i)).toBeVisible();
});

test("the onboarding answers shape the form — an aging configuration drops the sharp sections", async ({
  page,
}) => {
  await page.goto("/letter");

  // The ten questions, one tap each (multi-select advances via Continue).
  await page.getByRole("button", { name: /day-to-day care/i }).click();
  await page.getByRole("button", { name: /^An adult$/ }).click();
  await page.getByRole("button", { name: /they mostly manage/i }).click();
  await page.getByRole("button", { name: /^No$/ }).click(); // communicates differently
  await page.getByRole("button", { name: /^No$/ }).click(); // escalates
  await page.getByRole("button", { name: /early signs/i }).click();
  await page.getByRole("button", { name: /^No$/ }).click(); // trust
  await page.getByRole("button", { name: /^No$/ }).click(); // benefits
  await page.getByRole("button", { name: /neither right now/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /in their own home/i }).click();

  await expect(page).toHaveURL(/getting-started/);

  // The rail (or the mobile menu) reflects the configuration: the week-shaped
  // routine section, no trustee guidance, no behavior section.
  const menu = page.locator("details > summary").filter({ hasText: "Sections" });
  if (await menu.isVisible()) await menu.click();
  const nav = page
    .getByRole("navigation", { name: "Letter sections" })
    .filter({ visible: true })
    .first();
  await expect(nav.getByRole("link", { name: /a typical week/i })).toBeVisible();
  await expect(nav.getByRole("link", { name: /for the trustee/i })).toHaveCount(0);
  await expect(nav.getByRole("link", { name: /behavior support/i })).toHaveCount(0);

  // The adaptive section carries its aging wording.
  await page.goto("/letter/typical-days");
  await expect(
    page.getByRole("heading", { level: 1, name: /a typical week/i })
  ).toBeVisible();
});

test("changing an answer later re-gates the form without losing work", async ({ page }) => {
  await page.goto("/letter/getting-started");
  await page.getByLabel("What they like to be called").fill("Bob");
  await page.waitForTimeout(1000);

  // Behavior is gated off with no answers…
  await page.goto("/letter");
  const answersButton = page.getByRole("button", { name: /day-to-day care/i });
  await expect(answersButton).toBeVisible();

  // …until the escalation answer opens it. Walk the sequence with yes.
  await answersButton.click();
  await page.getByRole("button", { name: /^A child$/ }).click();
  await page.getByRole("button", { name: /around the clock/i }).click();
  await page.getByRole("button", { name: /^Yes$/ }).click(); // communicates differently
  await page.getByRole("button", { name: /^Yes$/ }).click(); // escalates
  await page.getByRole("button", { name: /^No$/ }).click(); // cognition
  await page.getByRole("button", { name: /not sure/i }).click(); // trust
  await page.getByRole("button", { name: /^Yes$/ }).click(); // benefits
  await page.getByRole("button", { name: /school or a day program/i }).click();
  await page.getByRole("button", { name: /continue/i }).click();
  await page.getByRole("button", { name: /^With me$/ }).click();

  await expect(page).toHaveURL(/getting-started/);
  // The earlier work survived the re-gating.
  await expect(page.getByLabel("What they like to be called")).toHaveValue("Bob");
  // And the behavior section is now in the rail.
  const menu = page.locator("details > summary").filter({ hasText: "Sections" });
  if (await menu.isVisible()) await menu.click();
  const nav = page
    .getByRole("navigation", { name: "Letter sections" })
    .filter({ visible: true })
    .first();
  await expect(nav.getByRole("link", { name: /behavior support/i })).toBeVisible();
});

test("every canonical section renders, and the retired two-path slugs redirect", async ({
  page,
}) => {
  for (const slug of SECTION_SLUGS) {
    await page.goto(`/letter/${slug}`);
    await expect(page.locator("h1")).toBeVisible();
  }
  // A bookmark from the two-path era lands on the canonical section.
  await page.goto("/letter/medical");
  await expect(page).toHaveURL(/health-and-medical/);
  await page.goto("/letter/a-typical-week");
  await expect(page).toHaveURL(/typical-days/);
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
  expect(backup.version).toBe(2);
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
    .getByRole("link", { name: /health & medical/i })
    .click();
  await expect(page).toHaveURL(/health-and-medical/);
  await expect(page.getByRole("heading", { level: 1, name: /health and medical/i })).toBeVisible();
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
