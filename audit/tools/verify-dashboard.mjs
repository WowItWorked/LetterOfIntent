/**
 * Holds the dashboard to the standard it reports on.
 *
 * An inaccessible accessibility report is self-refuting, and a report that
 * phones home while auditing a site whose promise is that nothing leaves the
 * device would be worse. Both are checked here, along with whether the
 * decision controls actually survive a reload — an export button that loses
 * the reviewer's work is not a feature.
 *
 *   node audit/tools/verify-dashboard.mjs
 */
import { chromium } from "playwright";
import AxeBuilder from "@axe-core/playwright";
import { writeFile } from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

const FILE = path.resolve("audit/index.html");
const URL_ = pathToFileURL(FILE).href;

async function main() {
  const browser = await chromium.launch();
  const ctx = await browser.newContext();

  const external = [];
  ctx.on("request", (r) => {
    const u = r.url();
    if (!u.startsWith("file://") && !u.startsWith("data:") && !u.startsWith("blob:")) {
      external.push(`${r.method()} ${u}`);
    }
  });

  const page = await ctx.newPage();
  const consoleErrors = [];
  page.on("console", (m) => { if (m.type() === "error") consoleErrors.push(m.text()); });
  page.on("pageerror", (e) => consoleErrors.push("pageerror: " + e.message));

  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(600);

  /* ---------------------------------------------------------------- axe */
  // Every panel must be scanned, not just the one that happens to be open —
  // hidden panels are exactly where an inaccessible control would hide.
  const tabIds = await page.$$eval('[role="tab"]', (els) => els.map((e) => e.id));
  const results = [];
  for (const id of tabIds) {
    await page.click("#" + id);
    await page.waitForTimeout(250);
    const r = await new AxeBuilder({ page }).withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22aa"]).analyze();
    results.push({ tab: id, violations: r.violations });
  }
  const allViolations = results.flatMap((r) =>
    r.violations.map((v) => ({
      tab: r.tab,
      id: v.id,
      impact: v.impact,
      help: v.help,
      nodes: v.nodes.length,
      // Keep the actual targets and failure text — a violation count alone is
      // not actionable, and guessing which element failed wastes a whole run.
      detail: v.nodes.slice(0, 4).map((n) => ({
        target: n.target.join(" "),
        summary: (n.failureSummary || "").replace(/\s+/g, " ").slice(0, 220),
      })),
    }))
  );

  /* ------------------------------------------------- decision controls */
  await page.click("#tab-find");
  await page.waitForTimeout(250);

  const firstRadio = page.locator('.quick input[type="radio"][value="accept"]').first();
  const fid = await firstRadio.evaluate((el) => el.name.slice(2));
  await firstRadio.check();

  // The guidance box lives in the collapsed body, so exercise the disclosure
  // too — if the toggle is broken, the note is unreachable.
  await page.locator(`#f-${fid} .tog`).click();
  await page.waitForTimeout(200);
  const ta = page.locator(`textarea[name="n-${fid}"]`);
  await ta.fill("Verification note: keep the gold, fix only the sheet.");
  await page.waitForTimeout(300);

  const stored = await page.evaluate(() => localStorage.getItem("loi-audit-decisions-v1"));

  // Reload: does the reviewer's work survive?
  await page.reload({ waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.click("#tab-find");
  await page.waitForTimeout(250);
  const restoredChecked = await page
    .locator(`input[name="d-${fid}"][value="accept"]`)
    .isChecked()
    .catch(() => false);
  await page.locator(`#f-${fid} .tog`).click().catch(() => {});
  await page.waitForTimeout(200);
  const restoredNote = await page
    .locator(`textarea[name="n-${fid}"]`)
    .inputValue()
    .catch(() => "");

  /* ------------------------------------------------------------ filters */
  await page.selectOption("#f-tier", "P0");
  await page.waitForTimeout(300);
  const p0Shown = await page.locator(".finding:not(.hidden)").count();
  await page.selectOption("#f-tier", "");
  await page.waitForTimeout(300);
  const allShown = await page.locator(".finding:not(.hidden)").count();

  /* ------------------------------------------------ keyboard operability */
  // Fresh load first. Tabbing after the filter interactions above measures
  // wherever focus happened to be sitting, which tells us nothing about what a
  // keyboard user meets on arrival.
  await page.goto(URL_, { waitUntil: "networkidle" });
  await page.waitForTimeout(400);
  await page.keyboard.press("Tab");
  const firstFocus = await page.evaluate(() => {
    const a = document.activeElement;
    if (!a) return "none";
    return `${a.tagName}${a.className ? "." + String(a.className).split(" ")[0] : ""}` +
      `${a.textContent ? ' "' + a.textContent.trim().slice(0, 28) + '"' : ""}`;
  });
  // And confirm the skip link actually goes somewhere.
  const skipTargetExists = await page.evaluate(() => {
    const l = document.querySelector("a.skip");
    if (!l) return false;
    const id = l.getAttribute("href").slice(1);
    return !!document.getElementById(id);
  });

  await browser.close();

  const report = {
    file: FILE,
    externalRequests: external,
    consoleErrors,
    axe: {
      tabsScanned: tabIds.length,
      totalViolations: allViolations.length,
      violations: allViolations,
    },
    decisions: {
      testedFinding: fid,
      storedAfterInput: !!stored && stored.includes(fid),
      survivedReload: restoredChecked,
      noteSurvivedReload: restoredNote.startsWith("Verification note"),
    },
    filters: { p0Shown, allShown },
    firstTabStop: firstFocus,
    skipTargetExists,
  };

  await writeFile(path.resolve("audit/evidence/dashboard-verification.json"), JSON.stringify(report, null, 2));

  const ok = (b) => (b ? "PASS" : "FAIL");
  console.log("  external requests      ", external.length, ok(external.length === 0), external.slice(0, 5).join(" | "));
  console.log("  console errors         ", consoleErrors.length, ok(consoleErrors.length === 0));
  console.log("  axe tabs scanned       ", tabIds.length);
  console.log("  axe violations         ", allViolations.length, ok(allViolations.length === 0));
  for (const v of allViolations) {
    console.log(`      ${v.tab}: ${v.id} (${v.impact}) x${v.nodes} — ${v.help}`);
    for (const d of v.detail) console.log(`         ${d.target}\n            ${d.summary}`);
  }
  console.log("  decision stored        ", ok(report.decisions.storedAfterInput));
  console.log("  survived reload        ", ok(report.decisions.survivedReload));
  console.log("  note survived reload   ", ok(report.decisions.noteSurvivedReload));
  console.log("  filter P0 / all        ", p0Shown, "/", allShown);
  console.log("  first tab stop         ", firstFocus);
  console.log("  skip link target exists", ok(skipTargetExists));
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
