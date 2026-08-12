import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { ALL_SECTION_SLUGS, FULL_LETTER, FULL_META, seedLetter } from "./fixture";
import type { LetterMeta } from "../src/lib/schema";

/** Acceptance: axe reports zero WCAG 2.1 A/AA violations on every step,
 *  across the configurations the adaptive form can produce. */

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

/** The aging caregiver-only configuration — the other pole of the form. */
const AGING_META: LetterMeta = {
  audience: "caregiver",
  stage: "adult",
  supportLevel: "mostlyIndependent",
  communicationDiffers: "no",
  behaviorEscalates: "no",
  cognitionChanging: "early",
  hasTrust: "no",
  hasBenefits: "no",
  schoolWork: ["work"],
  livesWith: "ownHome",
  onboardingDone: true,
};

for (const path of [
  "/",
  "/letter",
  "/letter-of-intent",
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

test("axe clean: the onboarding mid-sequence", async ({ page }) => {
  await page.goto("/letter");
  // Answer the first question so the sequence is genuinely mid-flight.
  await page.getByRole("button", { name: /day-to-day care/i }).click();
  await page.getByText(/question 2 of/i).waitFor();
  await expectNoViolations(page);
});

test("axe clean: the question catalogue with a row open", async ({ page }) => {
  // The catalogue lives on the Letter of Intent page now, and reads the same
  // for a first-time visitor as for a family mid-letter — it takes nothing
  // from the store.
  await page.goto("/letter-of-intent");
  await page.getByRole("button", { name: /getting started/i }).click();
  await page.getByText(/be ready to write about/i).waitFor();
  await expectNoViolations(page);
});

test("axe clean: the answers card once onboarding is done", async ({ page }) => {
  await seedLetter(page, {}, FULL_META);
  await page.goto("/letter");
  await page.getByRole("heading", { name: /shaped around/i }).waitFor();
  await expectNoViolations(page);
});

// The maximal configuration: every section in play, every field asked.
for (const slug of ALL_SECTION_SLUGS) {
  test(`axe clean: /letter/${slug} (full configuration)`, async ({ page }) => {
    await seedLetter(page, {}, FULL_META);
    await page.goto(`/letter/${slug}`);
    await page.waitForSelector("h1");
    // Wait for the hydrated form (or an emotional section's gate) to land.
    await page
      .locator("form, :text('A gentle note before this section')")
      .first()
      .waitFor({ timeout: 15_000 });
    await expectNoViolations(page);
  });
}

// The aging configuration exercises the adaptive wording variants.
for (const slug of [
  "about-them",
  "typical-days",
  "communication",
  "health-and-medical",
  "home-and-daily-living",
  "money-and-benefits",
  "friends-joy-and-faith",
] as const) {
  test(`axe clean: /letter/${slug} (aging configuration)`, async ({ page }) => {
    await seedLetter(page, {}, AGING_META);
    await page.goto(`/letter/${slug}`);
    await page.waitForSelector("h1");
    await page.locator("form").first().waitFor({ timeout: 15_000 });
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

test("axe clean: the live reading view with gaps showing", async ({ page }) => {
  // A letter mid-writing, so the view holds both kinds of content: written
  // sections and the gentle gap cards between them.
  await seedLetter(page, {
    gettingStarted: FULL_LETTER.gettingStarted,
    person: FULL_LETTER.person,
  });
  await page.goto("/letter/read");
  await page.getByRole("heading", { name: /your letter so far/i }).waitFor();
  await page.getByText(/would not yet know/i).first().waitFor();
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
