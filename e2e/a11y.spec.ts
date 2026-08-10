import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SECTION_SLUGS, FULL_LETTER, seedLetter } from "./fixture";

/** Acceptance: axe reports zero WCAG 2.1 A/AA violations on every step. */

const WCAG_TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

async function expectNoViolations(page: import("@playwright/test").Page) {
  const results = await new AxeBuilder({ page }).withTags(WCAG_TAGS).analyze();
  expect(
    results.violations.map((v) => ({
      id: v.id,
      impact: v.impact,
      nodes: v.nodes.map((n) => n.target.join(" ")).slice(0, 5),
    }))
  ).toEqual([]);
}

for (const path of [
  "/",
  "/letter",
  "/privacy",
  "/your-data",
  "/letter/review",
  "/care-cards",
  "/emergency-sheet",
]) {
  test(`axe clean: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector("h1");
    await expectNoViolations(page);
  });
}

test("axe clean: the chooser with a section row open", async ({ page }) => {
  await page.goto("/letter");
  await page.getByRole("tab", { name: /aging & general care/i }).click();
  await page.getByRole("button", { name: /a typical week/i }).click();
  await page.getByText(/be ready to write about/i).waitFor();
  await expectNoViolations(page);
});

for (const slug of ALL_SECTION_SLUGS) {
  test(`axe clean: /letter/${slug}`, async ({ page }) => {
    await page.goto(`/letter/${slug}`);
    await page.waitForSelector("h1");
    // Wait for the hydrated form (or the final-wishes gate) to be on screen.
    await page
      .locator("form, :text('A gentle note before this section')")
      .first()
      .waitFor({ timeout: 15_000 });
    await expectNoViolations(page);
  });
}

test("axe clean: review page with a full letter, including the reading view", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/letter/review");
  await page.getByRole("heading", { name: /read it through/i }).waitFor();
  await expectNoViolations(page);
});

test("axe clean: care cards with a bundle picked and previews showing", async ({
  page,
}) => {
  await seedLetter(page, FULL_LETTER);
  await page.goto("/care-cards");
  await page.getByRole("button", { name: /quick trip/i }).click();
  // "for Alex": the page's Bonnie gallery renders a same-titled card, so the
  // seeded preview must be pinned by person.
  await page
    .getByRole("img", { name: /emergency protocol care card for alex/i })
    .waitFor({ timeout: 15_000 });
  await expectNoViolations(page);
});

test("axe clean: a section with example disclosures open and hints showing", async ({
  page,
}) => {
  await page.goto("/letter/family-and-support");
  // A repeater now starts with one blank record, so the Email field is
  // already on screen — no "Add a person" click needed first.
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Email").blur();
  await page.getByText(/doesn't look like a full email/i).waitFor();
  const disclosure = page.getByRole("button", { name: /see an example/i }).first();
  await disclosure.click();
  await expectNoViolations(page);
});
