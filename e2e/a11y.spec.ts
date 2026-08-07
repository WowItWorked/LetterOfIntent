import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { FULL_LETTER, SECTION_SLUGS, seedLetter } from "./fixture";

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

for (const path of ["/", "/privacy", "/your-data", "/letter/review"]) {
  test(`axe clean: ${path}`, async ({ page }) => {
    await page.goto(path);
    await page.waitForSelector("h1");
    await expectNoViolations(page);
  });
}

for (const slug of SECTION_SLUGS) {
  test(`axe clean: /letter/${slug}`, async ({ page }) => {
    await page.goto(`/letter/${slug}`);
    await page.waitForSelector("h1");
    // Wait for the hydrated form (or the final-wishes gate) to be on screen.
    await page
      .locator("form, [class*=rounded-xl]:has-text('gentle note')")
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

test("axe clean: a section with example disclosures open and hints showing", async ({
  page,
}) => {
  await page.goto("/letter/family-and-support");
  await page.getByRole("button", { name: /add a person/i }).click();
  await page.getByLabel("Email").fill("not-an-email");
  await page.getByLabel("Email").blur();
  await page.getByText(/doesn't look like a full email/i).waitFor();
  const disclosure = page.getByRole("button", { name: /see an example/i }).first();
  await disclosure.click();
  await expectNoViolations(page);
});
