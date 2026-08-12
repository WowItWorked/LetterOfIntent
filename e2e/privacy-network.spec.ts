import { expect, test, type Download, type Page } from "@playwright/test";
import fs from "node:fs";
import { FULL_LETTER, seedLetter } from "./fixture";

/**
 * The tool's core promise: no user data in any network request.
 * We record every request across a full journey — including PDF generation —
 * and assert none of them left localhost.
 */

/**
 * Analytics is allowed to talk to Google. Nothing else is allowed to talk to
 * anyone, and nothing at all may carry a word of the letter.
 */
const ANALYTICS_HOST = /(^|\.)(google-analytics\.com|analytics\.google\.com|googletagmanager\.com)$/;

/**
 * Distinctive strings from the seeded letter. If any of these ever appear in a
 * request URL or body, the tool's core promise is broken — that is the thing
 * this file exists to catch, and adding analytics must not weaken it.
 */
const LETTER_SECRETS = [
  "Alexander",
  "Alvarez",
  "Penicillin",
  "Levetiracetam",
  "Keppra",
  "trainspotting",
  "fireproof",
];

function trackExternal(page: Page): { external: string[]; leaks: string[] } {
  const external: string[] = [];
  const leaks: string[] = [];

  page.on("request", (req) => {
    const url = req.url();

    // Whatever the destination, no request may carry letter content.
    let body = "";
    try {
      body = req.postData() ?? "";
    } catch {
      // Binary or unavailable body — the URL check below still applies.
    }
    const haystack = `${url} ${body}`;
    for (const secret of LETTER_SECRETS) {
      if (haystack.includes(secret)) leaks.push(`${secret} in ${url.slice(0, 120)}`);
    }

    try {
      const u = new URL(url);
      // blob:/data:/about: never leave the browser — only real network
      // protocols can exfiltrate anything.
      if (u.protocol !== "http:" && u.protocol !== "https:") return;
      if (u.hostname === "localhost" || u.hostname === "127.0.0.1") return;
      if (ANALYTICS_HOST.test(u.hostname)) return;
      external.push(url);
    } catch {
      // unparsable URL — internal scheme
    }
  });

  return {
    get external() {
      return external;
    },
    get leaks() {
      return leaks;
    },
  } as { external: string[]; leaks: string[] };
}

test("typing, saving, and generating a PDF makes zero non-local requests", async ({
  page,
}, testInfo) => {
  const traffic = trackExternal(page);

  await page.goto("/");
  // The header and footer carry the same words — deliberately, so one
  // destination reads as one offer — so scope this to the hero.
  await page
    .locator("#main")
    .getByRole("link", { name: /start your letter · it/i })
    .click();
  await expect(page).toHaveURL(/\/letter$/);
  // Through the onboarding — every tap is local state, nothing may leave.
  // "Both" keeps the trustee letter in the set this journey downloads. Matched
  // on the option's title rather than /^Both$/: the audience options carry the
  // document they produce, what it leaves out, and the cards, so the exact
  // accessible name is a paragraph.
  await page.getByRole("button", { name: /^both the trustee and caregiver/i }).click();
  await page.getByRole("button", { name: /^A child$/ }).click();
  await page.getByRole("button", { name: /around the clock/i }).click();
  await page.getByRole("button", { name: /^Yes$/ }).click();
  await page.getByRole("button", { name: /^Yes$/ }).click();
  await page.getByRole("button", { name: /^No$/ }).click();
  await page.getByRole("button", { name: /^Yes$/ }).click();
  await page.getByRole("button", { name: /school or a day program/i }).click();
  await page.getByRole("button", { name: /finish and begin/i }).click();
  await expect(page).toHaveURL(/getting-started/);

  await page.getByLabel("Your name").fill("Maria Alvarez");
  await page.getByLabel("Their full name").fill("Alexander Alvarez");
  await page.getByLabel("What they like to be called").fill("Alex");
  await page.waitForTimeout(1000); // let the debounced autosave land

  // One section filled → the PDF must still render correctly.
  await page.goto("/letter/review");
  const rows = page.getByRole("listitem");
  const downloadPromise = page.waitForEvent("download");
  await rows
    .filter({ hasText: "The Letter of Intent (PDF)" })
    .getByRole("button", { name: "Download" })
    .click();
  const download = await downloadPromise;
  const file = testInfo.outputPath("letter-one-section.pdf");
  await download.saveAs(file);

  const buf = fs.readFileSync(file);
  expect(buf.subarray(0, 5).toString()).toBe("%PDF-");
  expect(buf.length).toBeGreaterThan(5_000);
  // Names the document and the date, never the person — see lib/filenames.ts.
  expect(download.suggestedFilename()).toMatch(
    /^Letter-of-Intent-\d{4}-\d{2}-\d{2}\.pdf$/
  );

  // Each section's notes box is a real AcroForm widget, so the letter can be
  // annotated in Acrobat and saved. Worth a test precisely because losing it
  // is silent: the box still prints, and nobody notices it stopped accepting
  // typing until they are sitting in front of it.
  expect(
    buf.includes(Buffer.from("/AcroForm")),
    "the letter carries no AcroForm dictionary"
  ).toBe(true);
  expect(
    buf.includes(Buffer.from("notes-gettingStarted")),
    "the Getting started notes field is missing or misnamed"
  ).toBe(true);

  expect(traffic.leaks, "letter content found in a request").toEqual([]);
  expect(
    traffic.external,
    `unexpected third-party requests: ${traffic.external.join(", ")}`
  ).toEqual([]);
});

test("a fully filled letter renders both PDFs, still with zero external requests", async ({
  page,
}, testInfo) => {
  const traffic = trackExternal(page);
  await seedLetter(page, FULL_LETTER);

  await page.goto("/letter/review");
  await expect(page.getByText(/every section has notes/i).first()).toBeVisible();

  const rows = page.getByRole("listitem");

  const letterDl = page.waitForEvent("download");
  await rows
    .filter({ hasText: "The Letter of Intent (PDF)" })
    .getByRole("button", { name: "Download" })
    .click();
  const letter = await letterDl;
  const letterPath = testInfo.outputPath("letter-full.pdf");
  await letter.saveAs(letterPath);
  const letterBuf = fs.readFileSync(letterPath);
  expect(letterBuf.subarray(0, 5).toString()).toBe("%PDF-");
  // 15 sections + cover + how-to + TOC + key points — a real document.
  expect(letterBuf.length).toBeGreaterThan(20_000);

  const emergencyDl = page.waitForEvent("download");
  await rows
    .filter({ hasText: "The emergency sheet (PDF)" })
    .getByRole("button", { name: "Download" })
    .click();
  const emergency = await emergencyDl;
  const emergencyPath = testInfo.outputPath("emergency.pdf");
  await emergency.saveAs(emergencyPath);
  const emergencyBuf = fs.readFileSync(emergencyPath);
  expect(emergencyBuf.subarray(0, 5).toString()).toBe("%PDF-");

  // The calendar reminder is built here on the device.
  const icsDl = page.waitForEvent("download");
  await page.getByRole("button", { name: /^Apple$/ }).click();
  const ics = await icsDl;
  const icsPath = testInfo.outputPath("reminder.ics");
  await ics.saveAs(icsPath);
  const icsText = fs.readFileSync(icsPath, "utf8");
  expect(icsText).toContain("BEGIN:VCALENDAR");
  expect(icsText).toContain("Review Alex's Letter of Intent");

  expect(traffic.leaks, "letter content found in a request").toEqual([]);
  expect(
    traffic.external,
    `unexpected third-party requests: ${traffic.external.join(", ")}`
  ).toEqual([]);
});

test("uploading a photograph and restoring a backup send nothing", async ({ page }) => {
  const traffic = trackExternal(page);

  // A real photograph, into IndexedDB.
  await page.goto("/letter/about");
  // Two slots on the page; the first is the recent photo.
  await page.locator('input[type="file"][accept*="image"]').first().setInputFiles({
    name: "photo.png",
    mimeType: "image/png",
    // 1×1 PNG — real magic bytes, so it passes the sniff check.
    buffer: Buffer.from(
      "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==",
      "base64"
    ),
  });
  await expect(page.getByRole("button", { name: /^Remove$/ }).first()).toBeVisible();

  // A backup, back in.
  await page.goto("/your-data");
  await page.locator('input[type="file"][accept*="json"]').setInputFiles({
    name: "backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(
      JSON.stringify({
        app: "twl-letter-of-intent",
        version: 1,
        meta: { letterPath: "special-needs" },
        data: { gettingStarted: { subjectPreferredName: "Alex" } },
      })
    ),
  });

  expect(traffic.leaks, "letter content found in a request").toEqual([]);
  expect(
    traffic.external,
    `unexpected third-party requests: ${traffic.external.join(", ")}`
  ).toEqual([]);
});

test("the reminder email panel sends nothing, and says so", async ({ page }) => {
  const traffic = trackExternal(page);
  await seedLetter(page, FULL_LETTER);
  await page.goto("/letter/review");

  await page.getByLabel("Your email address").fill("someone@example.com");
  await page.getByRole("button", { name: /send me the reminder/i }).click();
  await expect(page.getByText(/switched on yet, so nothing was sent/i)).toBeVisible();

  expect(traffic.leaks, "letter content found in a request").toEqual([]);
  expect(
    traffic.external,
    `unexpected third-party requests: ${traffic.external.join(", ")}`
  ).toEqual([]);
});

test("downloading the full set produces all four PDFs and a backup — with zero external requests", async ({
  page,
}, testInfo) => {
  const traffic = trackExternal(page);
  await seedLetter(page, FULL_LETTER);
  await page.goto("/letter/review");

  const downloads: string[] = [];
  // Keep the Download objects, not just their names: saveAs() must be awaited
  // to know the bytes are all on disk. Firing it from the handler and polling
  // existsSync races — the file appears the moment it is created, so a reader
  // can beat the writer to it and see a truncated PDF.
  const received: Download[] = [];
  page.on("download", (d) => {
    downloads.push(d.suggestedFilename());
    received.push(d);
  });

  await page.getByRole("button", { name: /download the full set/i }).click();
  await expect
    .poll(() => downloads.length, { timeout: 120_000 })
    .toBeGreaterThanOrEqual(5);

  expect(downloads.some((f) => /^Letter-of-Intent-\d.*\.pdf$/.test(f))).toBe(true);
  expect(downloads.some((f) => /^Letter-for-the-Caregiver.*\.pdf$/.test(f))).toBe(true);
  expect(downloads.some((f) => /^Emergency-Information-Sheet.*\.pdf$/.test(f))).toBe(true);
  expect(downloads.some((f) => /^Care-Cards-\d.*\.zip$/.test(f))).toBe(true);
  expect(downloads.some((f) => /\.json$/.test(f))).toBe(true);

  // Both letters carry their fillable notes boxes, not just the trustee one —
  // they share SectionPage, and this is what keeps that true. The field name
  // checked here belongs to a section only the caregiver letter prints, so it
  // cannot pass by accidentally reading the other document.
  const caregiver = received.find((d) =>
    /^Letter-for-the-Caregiver/.test(d.suggestedFilename())
  )!;
  const caregiverPath = testInfo.outputPath(caregiver.suggestedFilename());
  await caregiver.saveAs(caregiverPath);
  const caregiverPdf = fs.readFileSync(caregiverPath);
  expect(
    caregiverPdf.includes(Buffer.from("/AcroForm")),
    "the caregiver letter carries no AcroForm dictionary"
  ).toBe(true);
  expect(
    caregiverPdf.includes(Buffer.from("notes-communication")),
    "the caregiver letter's Communication notes field is missing"
  ).toBe(true);

  // The two NEW outputs generate under the same privacy gate as everything
  // else: no request may leave localhost, and none may carry letter content.
  expect(traffic.leaks, "letter content found in a request").toEqual([]);
  expect(
    traffic.external,
    `unexpected third-party requests: ${traffic.external.join(", ")}`
  ).toEqual([]);
  testInfo.attach("downloads", { body: downloads.join("\n") });
});
