import { expect, test, type Page } from "@playwright/test";
import fs from "node:fs";
import { FULL_LETTER, seedLetter } from "./fixture";

/**
 * The tool's core promise: no user data in any network request.
 * We record every request across a full journey — including PDF generation —
 * and assert none of them left localhost.
 */

function trackExternal(page: Page): string[] {
  const external: string[] = [];
  page.on("request", (req) => {
    try {
      const u = new URL(req.url());
      // blob:/data:/about: never leave the browser — only real network
      // protocols can exfiltrate anything.
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      if (u.hostname !== "localhost" && u.hostname !== "127.0.0.1") {
        external.push(req.url());
      }
    } catch {
      // unparsable URL — internal scheme
    }
  });
  return external;
}

test("typing, saving, and generating a PDF makes zero non-local requests", async ({
  page,
}, testInfo) => {
  const external = trackExternal(page);

  await page.goto("/");
  await page.getByRole("link", { name: /start your letter/i }).click();
  await expect(page).toHaveURL(/getting-started/);

  await page.getByLabel("Your name").fill("Maria Alvarez");
  await page.getByLabel("Their full name").fill("Alexander Alvarez");
  await page.getByLabel("What they like to be called").fill("Alex");
  await page.waitForTimeout(1000); // let the debounced autosave land

  // One section filled → the PDF must still render correctly.
  await page.goto("/letter/review");
  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: /download the letter/i }).click();
  const download = await downloadPromise;
  const file = testInfo.outputPath("letter-one-section.pdf");
  await download.saveAs(file);

  const buf = fs.readFileSync(file);
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buf.length).toBeGreaterThan(5_000);
  expect(download.suggestedFilename()).toMatch(/^Letter-of-Intent-Alex-.*\.pdf$/);

  expect(external, `external requests seen: ${external.join(", ")}`).toEqual([]);
});

test("a fully filled letter renders both PDFs, still with zero external requests", async ({
  page,
}, testInfo) => {
  const external = trackExternal(page);
  await seedLetter(page, FULL_LETTER);

  await page.goto("/letter/review");
  // Scoped to the review article — the same phrase also sits in the (possibly
  // hidden) sidebar progress note.
  await expect(
    page.locator("article").getByText(/every section has notes/i)
  ).toBeVisible();

  const letterDl = page.waitForEvent("download");
  await page.getByRole("button", { name: /download the letter/i }).click();
  const letter = await letterDl;
  const letterPath = testInfo.outputPath("letter-full.pdf");
  await letter.saveAs(letterPath);
  const letterBuf = fs.readFileSync(letterPath);
  expect(letterBuf.subarray(0, 5).toString()).toBe("%PDF-");
  // 15 sections + cover + how-to + TOC — a real multi-page document.
  expect(letterBuf.length).toBeGreaterThan(20_000);

  const emergencyDl = page.waitForEvent("download");
  await page.getByRole("button", { name: /download the emergency sheet/i }).click();
  const emergency = await emergencyDl;
  const emergencyPath = testInfo.outputPath("emergency.pdf");
  await emergency.saveAs(emergencyPath);
  const emergencyBuf = fs.readFileSync(emergencyPath);
  expect(emergencyBuf.subarray(0, 5).toString()).toBe("%PDF-");

  // The post-download follow-ups appear: yearly reminder + a single CTA.
  const icsDl = page.waitForEvent("download");
  await page.getByRole("button", { name: /yearly reminder/i }).click();
  const ics = await icsDl;
  const icsPath = testInfo.outputPath("reminder.ics");
  await ics.saveAs(icsPath);
  const icsText = fs.readFileSync(icsPath, "utf8");
  expect(icsText).toContain("BEGIN:VCALENDAR");
  expect(icsText).toContain("Review Alex's Letter of Intent");

  expect(external, `external requests seen: ${external.join(", ")}`).toEqual([]);
});
