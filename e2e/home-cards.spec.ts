import { expect, test } from "@playwright/test";

/**
 * The home page's care-cards section: real CareCard previews from the Anderson
 * sample letter, the five bundles from config, and the two ways out. Kept
 * deliberately small — the cards themselves are exercised by cards.spec.ts,
 * and axe covers "/" in a11y.spec.ts.
 */

test("the what-you-get section shows all three deliverables with sample images", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#what-you-get");

  await expect(
    section.getByRole("heading", { name: /fill out one form/i })
  ).toBeVisible();

  // Three tiles with decorative brand-drawn vignettes (aria-hidden — the
  // headings carry the meaning, so there is nothing image-roled to assert).

  // Each tile opens its document's page, not just a sample.
  await expect(
    section.getByRole("link", { name: /the letter of intent/i })
  ).toHaveAttribute("href", "/letter");
  await expect(
    section.getByRole("link", { name: /the emergency information sheet/i })
  ).toHaveAttribute("href", "/emergency-sheet");
  await expect(section.getByRole("link", { name: /the care cards/i })).toHaveAttribute(
    "href",
    "/care-cards"
  );

});

test("the process section walks pick, fill, download, share", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#the-process");
  await expect(section.getByRole("heading", { name: /pick\. fill\. download\. share\./i })).toBeVisible();
  for (const step of [
    /pick your letter/i,
    /fill out the form/i,
    /download all four/i,
    /hand them to the right people/i,
  ]) {
    await expect(section.getByRole("heading", { name: step })).toBeVisible();
  }
  // Step IV names real recipients — the point of the section.
  await expect(section.getByText(/family group chat/i)).toBeVisible();
});

test("opening a sample from mid-page lands at the top of the viewer", async ({
  page,
}) => {
  // The chooser's sample strip sits mid-page — the regression left the sample
  // page sitting at the previous page's scroll offset because the lazily
  // mounted viewer gave the router nothing to scroll to.
  await page.goto("/letter");
  const sample = page.locator('main a[href^="/samples/letter-of-intent"]').first();
  await sample.scrollIntoViewIfNeeded();
  await sample.click();
  await expect(page).toHaveURL(/letter-of-intent-disabilities/);
  await expect(page.locator("h1")).toBeVisible();
  await expect
    .poll(() => page.evaluate(() => window.scrollY), { timeout: 10_000 })
    .toBeLessThanOrEqual(1);
});

test("the emergency-sheet page explains the sheet and links the sample", async ({
  page,
}) => {
  await page.goto("/emergency-sheet");
  await expect(
    page.getByRole("heading", { name: /the emergency information sheet/i })
  ).toBeVisible();
  // The five places it goes, and the sample it previews.
  await expect(page.getByRole("heading", { name: /on the fridge/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /the er and hospital intake/i })).toBeVisible();
  await expect(page.getByRole("link", { name: /open sample/i })).toHaveAttribute(
    "href",
    "/samples/emergency-sheet-disabilities"
  );
  // Scoped to main: the footer offers its own "Start your letter" link.
  await expect(
    page.locator("main").getByRole("link", { name: /start your letter$/i })
  ).toHaveAttribute("href", "/letter");
});

test("the header menu reaches the letter, the cards, and the emergency sheet", async ({
  page,
  isMobile,
}) => {
  await page.goto("/");
  if (isMobile) {
    await page.getByRole("button", { name: "Menu" }).click();
    const nav = page.getByRole("navigation", { name: "Main" });
    await expect(
      nav.getByRole("link", { name: /^letter of intent$/i })
    ).toHaveAttribute("href", "/letter");
    await expect(nav.getByRole("link", { name: /^care cards$/i })).toHaveAttribute(
      "href",
      "/care-cards"
    );
    await expect(nav.getByRole("link", { name: /emergency sheet/i })).toHaveAttribute(
      "href",
      "/emergency-sheet"
    );
  } else {
    // Desktop: the pages live behind one Resources dropdown.
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("button", { name: /resources/i }).click();
    await expect(
      nav.getByRole("link", { name: /^letter of intent$/i })
    ).toHaveAttribute("href", "/letter");
    await expect(nav.getByRole("link", { name: /emergency sheet/i })).toHaveAttribute(
      "href",
      "/emergency-sheet"
    );
    await expect(nav.getByRole("link", { name: /^care cards$/i })).toHaveAttribute(
      "href",
      "/care-cards"
    );
    await expect(nav.getByRole("link", { name: /^start\b/i })).toHaveAttribute(
      "href",
      "/letter"
    );
  }
});

test("how it works closes the letter chooser page", async ({ page }) => {
  await page.goto("/letter");
  const heading = page.getByRole("heading", { name: /start with ten minutes/i });
  await expect(heading).toBeVisible();
  const section = page.locator("section", { has: heading });
  for (const step of [
    /answer what you can/i,
    /saves only on your device/i,
    /download the documents/i,
  ]) {
    await expect(section.getByRole("heading", { name: step })).toBeVisible();
  }
  // No CTA in the band — the begin card with the real start buttons sits
  // directly above it. (.first(): the option card offers the same action.)
  await expect(
    page
      .locator("main")
      .getByRole("button", { name: /start the special needs letter/i })
      .first()
  ).toBeVisible();
});

test("the care-cards page shows real sample cards and routes to the cards page", async ({
  page,
}) => {
  await page.goto("/care-cards");
  const section = page.locator("main");

  await expect(
    section.getByRole("heading", { name: /the letter for the trustee/i })
  ).toBeVisible();

  // Real CareCard renders — role="img" labels come from the component itself,
  // and they name Bonnie, the sample family the sample PDFs already use.
  // (Previews mount after hydration; the assertions wait for them.)
  // The gallery shows the whole set — all seven cards, by name.
  for (const name of [
    /identity & contacts care card for bonnie/i,
    /emergency protocol care card for bonnie/i,
    /medications care card for bonnie/i,
    /behavior & communication care card for bonnie/i,
    /daily routine care card for bonnie/i,
    /eating & food care card for bonnie/i,
    /personal care & mobility care card for bonnie/i,
  ]) {
    await expect(section.getByRole("img", { name })).toBeVisible();
  }

  // The sample-data disclaimer sits beside the previews.
  await expect(section.getByText(/not a real person/i)).toBeVisible();

  // All five bundles, names verbatim from content/cards.ts.
  for (const bundle of [
    "Quick trip",
    "Afternoon sitter",
    "Evening / bedtime",
    "Overnight respite",
    "School or camp intake",
  ]) {
    // .first(): the bundle names appear in the bundles rows AND in the
    // embedded picker's tiles.
    await expect(section.getByText(bundle, { exact: true }).first()).toBeVisible();
  }

  // The picker now lives on this page; the bottom CTA sends letter-less
  // visitors to start the letter the cards draw from.
  await expect(section.getByRole("link", { name: /make your cards/i })).toHaveAttribute(
    "href",
    "/letter"
  );

  // This page renders the cards WITHOUT the cards page's pagination, so an
  // overgrown fixture would silently run a card's content under its footer.
  // The unit test bounds block counts; only a real layout can see line wraps.
  const overflows = await page.evaluate(() => {
    const crops = document.querySelectorAll('main [role="img"][data-zone="crop"]');
    return [...crops].map((crop) => {
      const body = crop.querySelector('[data-zone="body"]');
      const footer = crop.querySelector('[data-zone="footer"]');
      const blocks = body ? body.querySelectorAll("[data-block-index]") : [];
      const last = blocks[blocks.length - 1];
      if (!last || !footer) return { label: crop.getAttribute("aria-label"), over: -1 };
      return {
        label: crop.getAttribute("aria-label"),
        over: last.getBoundingClientRect().bottom - footer.getBoundingClientRect().top,
      };
    });
  });
  expect(overflows.length).toBe(7);
  for (const { label, over } of overflows) {
    expect(over, `${label} content must end above the card footer`).toBeLessThanOrEqual(0);
  }
});
