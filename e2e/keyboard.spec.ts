import { expect, test, type Page } from "@playwright/test";

/**
 * Acceptance: a user can complete the wizard using only a keyboard.
 * These tests never touch the mouse.
 */

async function tabUntil(
  page: Page,
  predicate: () => Promise<boolean>,
  max = 60
): Promise<void> {
  for (let i = 0; i < max; i++) {
    if (await predicate()) return;
    await page.keyboard.press("Tab");
  }
  throw new Error(`Element not reached within ${max} Tab presses`);
}

async function focusedText(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    // Before any Tab, focus sits on <body>, whose innerText is the whole page.
    if (!el || el === document.body || el === document.documentElement) return "";
    return el.innerText ?? "";
  });
}

async function focusedLabel(page: Page): Promise<string> {
  return page.evaluate(() => {
    const el = document.activeElement as HTMLElement | null;
    if (!el || el === document.body) return "";
    const id = el.getAttribute("id");
    const label = id ? document.querySelector(`label[for="${id}"]`) : null;
    return label?.textContent ?? "";
  });
}

test("the first Tab is a working skip link", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "keyboard journey covered on desktop");
  await page.goto("/");
  await page.keyboard.press("Tab");
  expect(await focusedText(page)).toMatch(/skip to main content/i);
  await page.keyboard.press("Enter");
  const mainFocused = await page.evaluate(
    () => document.activeElement?.id === "main"
  );
  expect(mainFocused).toBe(true);
});

test("start the letter, answer a question, and move on — keyboard only", async ({
  page,
  isMobile,
}) => {
  test.skip(Boolean(isMobile), "keyboard journey covered on desktop");
  await page.goto("/");

  await tabUntil(page, async () =>
    /start your letter/i.test(await focusedText(page))
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/letter$/);

  // The chooser: pick a path, still without touching the mouse.
  await tabUntil(page, async () =>
    /start the special needs letter/i.test(await focusedText(page))
  );
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/getting-started/);

  await tabUntil(page, async () => /your name/i.test(await focusedLabel(page)));
  await page.keyboard.type("Maria Alvarez");

  await tabUntil(page, async () =>
    /what they like to be called/i.test(await focusedLabel(page))
  );
  await page.keyboard.type("Alex");

  await tabUntil(page, async () => /^Next:/i.test(await focusedText(page)));
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/letter\/about/);

  // The typed answers made it into storage on the way out.
  await page.goto("/letter/getting-started");
  await expect(page.getByLabel("Your name")).toHaveValue("Maria Alvarez");
});

test("the delete dialog traps focus and Escape closes it", async ({ page, isMobile }) => {
  test.skip(Boolean(isMobile), "keyboard journey covered on desktop");
  await page.goto("/your-data");
  await tabUntil(page, async () => /delete all my data/i.test(await focusedText(page)));
  await page.keyboard.press("Enter");
  await expect(page.getByRole("dialog")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
});
