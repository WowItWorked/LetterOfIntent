import { expect, test } from "@playwright/test";

/**
 * The home page's care-cards section: real CareCard previews from the Anderson
 * sample letter, the five bundles from config, and the two ways out. Kept
 * deliberately small — the cards themselves are exercised by cards.spec.ts,
 * and axe covers "/" in a11y.spec.ts.
 */

test("the what-you-get section shows all four deliverables with sample images", async ({
  page,
}) => {
  await page.goto("/");
  const section = page.locator("#what-you-get");

  await expect(
    section.getByRole("heading", { name: /fill out one form/i })
  ).toBeVisible();

  // Four tiles with decorative brand-drawn vignettes (aria-hidden — the
  // headings carry the meaning, so there is nothing image-roled to assert).

  // Each tile opens its document's page, not just a sample. The whole tile is
  // the link, so its accessible name is title + blurb + call to action — these
  // match on a substring, and each phrase now appears in exactly one tile.
  // (It did not always: the Letter of Intent tile used to carry a footnote
  // naming the caregiver letter, which is why that tile now exists instead.)
  await expect(
    section.getByRole("link", { name: /the letter of intent/i })
  ).toHaveAttribute("href", "/letter-of-intent");
  await expect(
    section.getByRole("link", { name: /the letter for the caregiver/i })
  ).toHaveAttribute("href", "/letter-for-the-caregiver");
  await expect(
    section.getByRole("link", { name: /the emergency information sheet/i })
  ).toHaveAttribute("href", "/emergency-sheet");
  await expect(section.getByRole("link", { name: /the care cards/i })).toHaveAttribute(
    "href",
    "/care-cards"
  );

  // The count is the point of the section's promise: exactly four, no orphan.
  await expect(section.getByRole("listitem")).toHaveCount(4);
});

test("the process section walks answer, write, download, hand over", async ({ page }) => {
  await page.goto("/");
  const section = page.locator("#the-process");
  await expect(
    section.getByRole("heading", { name: /answer\. write\. download\. hand over\./i })
  ).toBeVisible();
  for (const step of [
    // "Answer eight questions", not "Pick your letter": one adaptive form, and
    // the count must match ONBOARDING_QUESTIONS.
    /answer eight questions/i,
    /fill out the form/i,
    /download the set/i,
    /hand them to the right people/i,
  ]) {
    await expect(section.getByRole("heading", { name: step })).toBeVisible();
  }
  // Both letters named, not one — the audience answer decides which generate.
  await expect(section.getByText(/the letter of intent, the letter for the caregiver/i)).toBeVisible();
  // The cards leave as images in a zip, not as a print sheet.
  await expect(section.getByText(/phone-ready images in a zip/i)).toBeVisible();
  // Step IV names real recipients — the point of the section.
  await expect(section.getByText(/family group chat/i)).toBeVisible();
});

test("opening a sample from mid-page lands at the top of the viewer", async ({
  page,
}) => {
  // The sample link sits mid-page — the regression left the sample page
  // sitting at the previous page's scroll offset because the lazily mounted
  // viewer gave the router nothing to scroll to.
  await page.goto("/emergency-sheet");
  const sample = page.locator('main a[href^="/samples/"]').first();
  await sample.scrollIntoViewIfNeeded();
  await sample.click();
  await expect(page).toHaveURL(/\/samples\//);
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

test("the Letter of Intent page explains the document and lists every question", async ({
  page,
}) => {
  await page.goto("/letter-of-intent");
  await expect(
    page.getByRole("heading", { name: /^the letter of intent\.$/i })
  ).toBeVisible();

  // What it is, and who ends up reading it.
  await expect(
    page.getByRole("heading", { name: /everything a stranger could never guess/i })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^the trustee$/i })).toBeVisible();
  await expect(page.getByRole("heading", { name: /the sibling who steps in/i })).toBeVisible();

  await expect(page.getByRole("link", { name: /open sample/i })).toHaveAttribute(
    "href",
    "/samples/letter-of-intent-disabilities"
  );

  // The two letters, each as a list of what it holds — no "what it drops"
  // half, and no limit bullet: the panel beneath carries the reassurance that
  // choosing one loses nothing, which is the fear the two cards create.
  await expect(
    page.getByRole("heading", { name: /two letters, narrowed for their readers/i })
  ).toBeVisible();
  await expect(page.getByRole("heading", { name: /^the letter for the caregiver$/i })).toBeVisible();
  await expect(page.getByText(/^what it contains$/i)).toHaveCount(2);
  await expect(page.getByText(/money, the benefits, and the trust/i)).toBeVisible();
  await expect(page.getByText(/how they communicate, and how to talk with them/i)).toBeVisible();
  // The panel under both cards makes one point: the choice is not really a
  // choice, because one form writes both letters.
  await expect(page.getByText(/one form can write both/i)).toBeVisible();
  // The caregiver card is the one with somewhere to go; this page is the
  // trustee letter's own, so only one of the pair carries a link.
  await expect(
    page.getByRole("link", { name: /more about the caregiver letter/i })
  ).toHaveAttribute("href", "/letter-for-the-caregiver");
  await expect(page.getByText(/never type anything twice/i)).toBeVisible();

  // The question catalogue: every section, ungated, with its prompts one tap
  // away — and it must not depend on a letter existing on this device.
  await expect(
    page.getByRole("heading", { name: /every question, before you start/i })
  ).toBeVisible();
  await page.getByRole("button", { name: /getting started/i }).click();
  await expect(page.getByText(/be ready to write about/i)).toBeVisible();

  // Scoped to main: the footer offers its own "Start your letter" link.
  await expect(
    page.locator("main").getByRole("link", { name: /start your letter$/i })
  ).toHaveAttribute("href", "/letter");
});

test("the Caregiver letter page explains the document and admits what it drops", async ({
  page,
}) => {
  await page.goto("/letter-for-the-caregiver");
  await expect(
    page.getByRole("heading", { name: /^the letter for the caregiver\.$/i })
  ).toBeVisible();

  // What it contains, as a list.
  await expect(page.getByRole("heading", { name: /^what it contains$/i })).toBeVisible();
  await expect(page.getByText(/how they communicate, and how to talk with them/i)).toBeVisible();
  await expect(page.getByText(/behavior: what sets it off/i)).toBeVisible();

  // The Hale sample, deliberately not the Ruiz one the Letter of Intent page
  // shows: two families across the two pages is what shows the form's range.
  await expect(page.getByRole("link", { name: /open sample/i })).toHaveAttribute(
    "href",
    "/samples/letter-for-the-caregiver-aging-parent"
  );
  await expect(page.getByText(/a daughter writing about her mother/i)).toBeVisible();
  await expect(page.getByRole("heading", { name: /whoever arrives on monday/i })).toBeVisible();

  // The same panel the Letter of Intent page carries, pointed the other way.
  await expect(page.getByText(/one form can write both/i)).toBeVisible();
  await expect(
    page.getByRole("link", { name: /more about the letter of intent/i })
  ).toHaveAttribute("href", "/letter-of-intent");

  // Its own question catalogue, filtered to what THIS letter prints. Listing
  // all twenty-one would promise a section the caregiver letter never
  // contains — "For the trustee" belongs to the other document.
  await expect(
    page.getByRole("heading", { name: /every question, before you start/i })
  ).toBeVisible();
  const catalogue = page.locator("#questions");
  await expect(catalogue.getByRole("button", { name: /for whoever steps in/i })).toBeVisible();
  await expect(catalogue.getByRole("button", { name: /^\d+\s*for the trustee$/i })).toHaveCount(0);
  await catalogue.getByRole("button", { name: /getting started/i }).click();
  await expect(page.getByText(/be ready to write about/i)).toBeVisible();
  await expect(
    page.locator("main").getByRole("link", { name: /start your letter$/i })
  ).toHaveAttribute("href", "/letter");
});

test("the letter page is the builder, and sends the curious to the explainer", async ({
  page,
}) => {
  await page.goto("/letter");
  // The onboarding, and nothing that belongs on the content page.
  await expect(page.getByText(/question 1 of/i)).toBeVisible();

  // The audience question names the reader each answer reaches, above bullets
  // describing it — the title is the only bold thing in the box. Anchored to
  // the start of the accessible name: the whole box is one long string, and
  // "the Letter of Intent" appears inside two of the three.
  await expect(page.getByRole("button", { name: /^the trustee\b/i })).toBeVisible();
  await expect(
    page.getByRole("button", { name: /^both the trustee and caregiver/i })
  ).toBeVisible();
  // A single-reader choice has to say so: one letter, not two.
  await expect(page.getByText(/one letter is made: the letter of intent$/i)).toBeVisible();
  await expect(
    page.getByText(/one letter is made: the letter for the caregiver/i)
  ).toBeVisible();
  // What every option produces alike, said once under the grid. Eight cards:
  // the seven topic cards plus the index card, which is what the review page
  // counts — a stale "seven" here is exactly what this pins.
  await expect(
    page.getByText(/emergency information sheet and all eight care cards are created/i)
  ).toBeVisible();

  await expect(
    page.getByRole("heading", { name: /every question, before you start/i })
  ).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: /start with ten minutes/i })
  ).toHaveCount(0);
  await expect(
    page.locator("main").getByRole("link", { name: /read what a letter of intent is/i })
  ).toHaveAttribute("href", "/letter-of-intent");
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
    ).toHaveAttribute("href", "/letter-of-intent");
    await expect(nav.getByRole("link", { name: /^care cards$/i })).toHaveAttribute(
      "href",
      "/care-cards"
    );
    await expect(nav.getByRole("link", { name: /emergency sheet/i })).toHaveAttribute(
      "href",
      "/emergency-sheet"
    );
  } else {
    // Desktop: the pages live behind one Menu dropdown.
    const nav = page.getByRole("navigation", { name: "Main" });
    await nav.getByRole("button", { name: /^menu$/i }).click();
    await expect(
      nav.getByRole("link", { name: /^letter of intent$/i })
    ).toHaveAttribute("href", "/letter-of-intent");
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

test("how it works closes the Letter of Intent page", async ({ page }) => {
  await page.goto("/letter-of-intent");
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
  // The band closes with the one start button of the one form.
  await expect(
    section.getByRole("button", { name: /start your letter|continue your letter/i })
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
  // and they name Danny, the Ruiz family the sample PDFs already use.
  // (Previews mount after hydration; the assertions wait for them.)
  // The gallery shows the whole set — all seven cards, by name.
  for (const name of [
    /identity & contacts care card for danny/i,
    /emergency protocol care card for danny/i,
    /medications care card for danny/i,
    /behavior & communication care card for danny/i,
    /daily routine care card for danny/i,
    /eating & food care card for danny/i,
    /personal care & mobility care card for danny/i,
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
