/**
 * Shared evidence capture for the multi-perspective audit.
 *
 * This is neutral evidence, not analysis. It runs once and every analysis
 * reads from it, so that nine agents are not each hammering production with
 * their own session and so that they are all reasoning about the *same*
 * observed traffic. No conclusions are drawn here.
 *
 * Canary strings are planted in every field before any navigation, so that
 * A7 can search the complete outbound capture for them. Each canary is
 * globally unique and improbable, so a substring hit anywhere in a URL,
 * header, or body is meaningful rather than coincidental.
 *
 *   node audit/tools/capture-production.mjs --target production
 *   node audit/tools/capture-production.mjs --target local
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const argTarget = process.argv.indexOf("--target");
const TARGET = argTarget > -1 ? process.argv[argTarget + 1] : "production";
const BASE =
  TARGET === "production" ? "https://myletterofintent.com" : "http://localhost:3000";

const OUT = path.resolve("audit/evidence");

/**
 * Improbable, unique, and easy to grep. If any of these ever appears in an
 * outbound request the privacy promise is broken, and the specific canary
 * tells us which field leaked.
 */
const CANARY = {
  authorName: "ZQXCANARYAUTHOR7781",
  authorRelationship: "ZQXCANARYREL7782",
  subjectFullName: "ZQXCANARYSUBJECT7783",
  subjectPreferredName: "ZQXCANARYPREF7784",
  diagnoses: "ZQXCANARYDIAGNOSIS7785",
  lifeHistory: "ZQXCANARYHISTORY7786",
  firstFiveMinutes: "ZQXCANARYFIRST5-7787",
  importantToKnow: "ZQXCANARYIMPORTANT7788",
};

const LETTER_KEY = "twl-loi-letter-v1";

/** A letter seeded entirely with canaries, so every stored value is traceable. */
const SEEDED = {
  version: 1,
  state: {
    data: {
      gettingStarted: {
        authorName: CANARY.authorName,
        authorRelationship: CANARY.authorRelationship,
        subjectFullName: CANARY.subjectFullName,
        subjectPreferredName: CANARY.subjectPreferredName,
        letterDate: "2026-08-09",
      },
      about: {
        dateOfBirth: "2014-04-02",
        diagnoses: CANARY.diagnoses,
        lifeHistory: CANARY.lifeHistory,
        firstFiveMinutes: CANARY.firstFiveMinutes,
        importantToKnow: CANARY.importantToKnow,
      },
    },
    meta: {
      letterPath: "special-needs",
      lastVisitedSlug: "about",
      startedAt: "2026-08-09T07:00:00.000Z",
      updatedAt: "2026-08-09T07:00:00.000Z",
    },
  },
};

const ROUTES = [
  "/",
  "/letter",
  "/letter/getting-started",
  "/letter/about",
  "/letter/medical",
  "/letter/review",
  "/privacy",
  "/your-data",
  "/samples/letter-of-intent-disabilities",
];

async function main() {
  await mkdir(path.join(OUT, "network"), { recursive: true });

  const browser = await chromium.launch();
  const ctx = await browser.newContext({ viewport: { width: 1280, height: 900 } });

  /* ---------------------------------------------------------- request log */
  const requests = [];
  ctx.on("request", (req) => {
    let postData = null;
    try {
      postData = req.postData();
    } catch {
      /* binary or unavailable */
    }
    requests.push({
      phase: currentPhase,
      method: req.method(),
      url: req.url(),
      host: (() => {
        try {
          return new URL(req.url()).host;
        } catch {
          return "(unparseable)";
        }
      })(),
      resourceType: req.resourceType(),
      headers: req.headers(),
      postData,
      isNavigation: req.isNavigationRequest(),
    });
  });

  const responses = [];
  ctx.on("response", (res) => {
    responses.push({
      phase: currentPhase,
      url: res.url(),
      status: res.status(),
      headers: res.headers(),
    });
  });

  let currentPhase = "boot";

  const page = await ctx.newPage();

  // Seed the canary letter before any navigation so it is present for every
  // subsequent request, including any that fire on load.
  await ctx.addInitScript(
    ([key, val]) => {
      try {
        localStorage.setItem(key, val);
      } catch {}
    },
    [LETTER_KEY, JSON.stringify(SEEDED)]
  );

  const storageByRoute = {};

  for (const route of ROUTES) {
    currentPhase = route;
    try {
      await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 60_000 });
    } catch {
      // A slow route should not abort the whole capture.
      try {
        await page.goto(BASE + route, { waitUntil: "domcontentloaded", timeout: 60_000 });
      } catch {
        continue;
      }
    }
    await page.waitForTimeout(1200);

    storageByRoute[route] = await page.evaluate(() => {
      const dump = (s) => {
        const o = {};
        try {
          for (let i = 0; i < s.length; i++) {
            const k = s.key(i);
            o[k] = s.getItem(k);
          }
        } catch {}
        return o;
      };
      return {
        localStorage: dump(localStorage),
        sessionStorage: dump(sessionStorage),
        cookies: document.cookie,
        title: document.title,
        url: location.href,
        indexedDBNames: null, // filled below via the async API
      };
    });

    // IndexedDB requires the async API.
    storageByRoute[route].indexedDBNames = await page
      .evaluate(async () => {
        try {
          if (!indexedDB.databases) return "(databases() unsupported)";
          const dbs = await indexedDB.databases();
          return dbs.map((d) => ({ name: d.name, version: d.version }));
        } catch (e) {
          return `(error: ${e.message})`;
        }
      })
      .catch(() => "(unavailable)");
  }

  /* ------------------------------------------------- typing a real canary */
  // Storage seeding proves persistence; actually typing proves the input path
  // does not transmit. Both are needed.
  currentPhase = "typing";
  try {
    await page.goto(BASE + "/letter/about", { waitUntil: "networkidle", timeout: 60_000 });
    const boxes = page.locator("textarea, input[type='text']");
    const n = Math.min(await boxes.count(), 4);
    for (let i = 0; i < n; i++) {
      await boxes.nth(i).fill(`ZQXTYPEDCANARY${9900 + i}`).catch(() => {});
      await page.waitForTimeout(400);
    }
    // Blur and idle, so any debounced or unload-triggered send has a chance to fire.
    await page.keyboard.press("Tab").catch(() => {});
    await page.waitForTimeout(3000);
  } catch {
    /* recorded by absence */
  }

  /* -------------------------------------------------- unload / beacon path */
  currentPhase = "unload";
  try {
    await page.goto(BASE + "/", { waitUntil: "networkidle", timeout: 60_000 });
    await page.waitForTimeout(2000);
  } catch {}

  const cookies = await ctx.cookies();

  await browser.close();

  const capture = {
    capturedAt: new Date().toISOString(),
    target: TARGET,
    base: BASE,
    canaries: CANARY,
    typedCanaryPrefix: "ZQXTYPEDCANARY",
    routes: ROUTES,
    requestCount: requests.length,
    uniqueHosts: [...new Set(requests.map((r) => r.host))].sort(),
    requests,
    responses,
    cookies,
    storageByRoute,
  };

  const file = path.join(OUT, "network", `capture-${TARGET}.json`);
  await writeFile(file, JSON.stringify(capture, null, 2));

  console.log(`  target        ${TARGET} (${BASE})`);
  console.log(`  requests      ${requests.length}`);
  console.log(`  unique hosts  ${capture.uniqueHosts.length}`);
  for (const h of capture.uniqueHosts) console.log(`                  ${h}`);
  console.log(`  cookies       ${cookies.length}`);
  console.log(`  -> ${file}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
