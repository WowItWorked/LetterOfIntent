import { expect, test } from "@playwright/test";
import { FULL_LETTER, LETTER_KEY, persistedState, seedLetter } from "./fixture";
import type { LetterData } from "../src/lib/schema";

/**
 * /letter/read — the letter taking shape. Filled sections read exactly as the
 * review view prints them; open sections show a gentle gap naming what a
 * reader would not yet know; a not-applicable mark is an answer and shows
 * nothing. The route is strictly read-only.
 */

/** A letter mid-writing: two sections down, behavior marked not applicable. */
const PARTIAL: LetterData = {
  gettingStarted: FULL_LETTER.gettingStarted,
  person: FULL_LETTER.person,
  marks: { behavior: "not_applicable" },
};

test("the live reading interleaves written sections with gentle gaps", async ({
  page,
}) => {
  await seedLetter(page, PARTIAL);
  await page.goto("/letter/read");

  // The letter masthead, from the letter's own data. (The full name also
  // reads inside the Getting Started section, hence first().)
  await expect(page.getByText("Alexander James Alvarez").first()).toBeVisible();

  // A written section reads as the letter.
  await expect(page.getByRole("heading", { name: /about alex/i })).toBeVisible();
  await expect(page.getByText(/prouder of his library job/i)).toBeVisible();

  // An open section is a gap naming the consequence for a reader…
  const emergencyGap = page.getByText(
    /would not yet know what to do if something goes wrong/i
  );
  await expect(emergencyGap).toBeVisible();

  // …but the section marked not applicable is a decision, not a gap.
  await expect(page.getByText(/triggers hard moments/i)).toHaveCount(0);

  // The gap leads straight to the section that would fill it.
  await page.locator('main a[href="/letter/emergency-plan"]').click();
  await expect(page).toHaveURL(/emergency-plan/);
});

test("the rail reaches the reading view from any section", async ({ page }) => {
  await seedLetter(page, PARTIAL);
  await page.goto("/letter/about-them");
  // On mobile the rail folds into the Sections disclosure; open it first.
  const menu = page.locator("details > summary").filter({ hasText: "Sections" });
  if (await menu.isVisible()) await menu.click();
  await page.getByRole("link", { name: /read it as a letter/i }).click();
  await expect(page).toHaveURL(/\/letter\/read$/);
  await expect(page.getByRole("heading", { name: /your letter so far/i })).toBeVisible();
});

// The same policy privacy-network.spec holds the whole app to: analytics may
// talk to Google, nothing else may talk to anyone, and no request anywhere
// may carry a word of the letter.
const ANALYTICS_HOST =
  /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)$/;

test("reading the letter is read-only and leaks nothing", async ({ page }) => {
  const external: string[] = [];
  const leaks: string[] = [];
  page.on("request", (req) => {
    let body = "";
    try {
      body = req.postData() ?? "";
    } catch {
      // binary body — the URL check still applies
    }
    const haystack = `${req.url()} ${body}`;
    for (const secret of ["Alexander", "Alvarez", "library job"]) {
      if (haystack.includes(secret)) leaks.push(`${secret} in ${req.url().slice(0, 120)}`);
    }
    try {
      const u = new URL(req.url());
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return;
      if (ANALYTICS_HOST.test(u.hostname)) return;
      external.push(req.url());
    } catch {
      // internal scheme
    }
  });

  await seedLetter(page, PARTIAL);
  const expected = persistedState(PARTIAL);

  await page.goto("/letter/read");
  await expect(page.getByText("Alexander James Alvarez").first()).toBeVisible();

  // The init script re-seeds on navigation, so read storage AFTER the page
  // settles: any write this screen made would show here.
  const stored = await page.evaluate(
    (key) => window.localStorage.getItem(key),
    LETTER_KEY
  );
  expect(stored).toBe(expected);
  expect(leaks, "letter content found in a request").toEqual([]);
  expect(external, `unexpected external requests: ${external.join(", ")}`).toEqual([]);
});
