/**
 * A5 — plain-language readability measurement.
 *
 * Extracts the rendered prose from each route on the running dev server and
 * scores it with four independent formulas. Four rather than one because each
 * has a known failure mode on this corpus: Flesch-Kincaid and Flesch Reading
 * Ease are syllable-driven and so are punished by proper nouns and by the
 * unavoidable multi-syllable terms of art here ("Medicaid", "guardianship");
 * Gunning Fog and SMOG are polysyllable-count-driven and so are punished by
 * long sentences instead. Where all four agree the reading is trustworthy.
 * Where they diverge, the divergence itself is diagnostic and is reported.
 *
 * Usage:
 *   node audit/tools/readability.mjs                 # localhost:3000
 *   node audit/tools/readability.mjs --base https://myletterofintent.com
 *
 * Writes audit/evidence/readability.json.
 *
 * ANALYSIS ONLY. Reads the site; changes nothing.
 */
import { chromium } from "playwright";
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";

const argBase = process.argv.indexOf("--base");
const BASE = argBase > -1 ? process.argv[argBase + 1] : "http://localhost:3000";
const OUT = path.resolve("audit/evidence");

const SN_SLUGS = [
  "getting-started", "about", "family-and-support", "a-typical-day", "communication",
  "medical", "behavioral-support", "school-and-work", "housing",
  "benefits-and-finances", "friends-joy-and-faith", "legal-and-advocacy",
  "guidance-for-the-trustee", "final-wishes", "a-personal-message",
];
const GEN_SLUGS = [
  "about-them", "a-typical-week", "talking-with-them", "health-and-medical",
  "home-and-daily-living", "money-and-documents", "work-and-obligations",
  "faith-joy-and-community", "legal-and-decisions", "for-whoever-steps-in",
];

const ROUTES = [
  ["home", "/"],
  ["letter-chooser", "/letter"],
  ...SN_SLUGS.map((s) => [`wizard-sn-${s}`, `/letter/${s}`]),
  ...GEN_SLUGS.map((s) => [`wizard-gen-${s}`, `/letter/${s}`]),
  ["review", "/letter/review"],
  ["privacy", "/privacy"],
  ["your-data", "/your-data"],
  ["samples-loi", "/samples/letter-of-intent"],
];

/* ------------------------------------------------------------------ syllables */

/**
 * Heuristic English syllable counter: vowel-group counting with the standard
 * corrections for silent terminal -e, non-syllabic -ed/-es, and vowel hiatus.
 *
 * Exact counting needs a pronunciation dictionary, which is not available
 * offline here. This is therefore an APPROXIMATION, and its measured accuracy
 * is published alongside the scores (see `validate()` below and the
 * `syllableAccuracy` field of the output) rather than asserted. Residual error
 * is roughly symmetric — hiatus cases undercount, internal silent -e
 * overcounts — so aggregate grade levels are stable to well under one grade,
 * but no single word's count should be relied on.
 */
const SYLL_EXCEPTIONS = {
  // High-frequency in this corpus, and reliably mis-heuristicked.
  caregiver: 3, caregivers: 3, caregiving: 3, medicaid: 3, medicare: 3,
  guardianship: 4, guardian: 3, guardians: 3, beneficiary: 5, trustee: 2,
  trustees: 2, everyone: 3, everything: 3, anyone: 3, area: 3, areas: 3,
  being: 2, business: 2, created: 3, creates: 2, diagnosis: 4, diagnoses: 4,
  familiar: 3, family: 3, families: 3, favorite: 3, general: 3, hospital: 3,
  ideas: 3, idea: 3, medicine: 3, orientation: 5, quiet: 2, science: 2,
  seizure: 2, seizures: 2, serious: 3, several: 3, social: 2, special: 2,
  therapies: 3, therapy: 3, usually: 4, various: 3, violent: 2,
};

function syllables(word) {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!w) return 0;
  if (SYLL_EXCEPTIONS[w]) return SYLL_EXCEPTIONS[w];
  if (w.length <= 3) return 1;

  // Count maximal vowel runs.
  let n = 0;
  let prevVowel = false;
  for (const ch of w) {
    const v = "aeiouy".includes(ch);
    if (v && !prevVowel) n++;
    prevVowel = v;
  }

  // Hiatus: a vowel run where the pair is genuinely two nuclei ("di-al",
  // "cre-ate", "u-al"), except in the -tion/-sion/-cious families where it
  // is one. Counted once per qualifying run.
  const hiatus = w.match(/[iue][ao]/g);
  if (hiatus) {
    const suppressed = (w.match(/[ts]io|cio|gio/g) ?? []).length;
    n += Math.max(0, hiatus.length - suppressed);
  }

  // Silent terminal -e ("care", "make"), but NOT consonant+le ("table",
  // "little"), where the e is the nucleus of its own syllable.
  if (w.endsWith("e") && !/[^aeiouy]le$/.test(w) && n > 1) n--;

  // Terminal -ed is a syllable only after t or d ("wanted" yes, "asked" no).
  if (/[^td]ed$/.test(w) && n > 1) n--;

  // Terminal -es is a syllable only after a sibilant ("boxes" yes, "makes" no).
  if (/[^sxzcgh]es$/.test(w) && n > 1) n--;

  return Math.max(1, n);
}

/** Measured, not claimed. Reported in the output so the scores can be discounted. */
const VALIDATION = {
  hello: 2, syllable: 3, communication: 5, the: 1, table: 2, little: 2,
  medicaid: 3, guardianship: 4, every: 3, people: 2, simple: 2, created: 3,
  caregiver: 3, individualized: 6, letter: 2, intent: 2, device: 2,
  browser: 2, storage: 2, download: 2, backup: 2, private: 3, privacy: 3,
  analytics: 4, emergency: 4, document: 3, section: 2, question: 2,
  optional: 3, sitting: 2, minutes: 2, disability: 5, disabilities: 5,
  behavior: 3, behavioral: 4, communicate: 4, communicates: 4, routine: 2,
  routines: 2, trustee: 2, attorney: 3, benefits: 3, finances: 3,
  insurance: 3, hospital: 3, therapy: 3, therapies: 3, seizure: 2,
  allergies: 3, medication: 4, medications: 4, calming: 2, wishes: 2,
  personal: 3, message: 2, review: 2, sample: 2, chooser: 2, wizard: 2,
  answers: 2, uploaded: 3, transmitted: 3, captured: 2, counted: 2,
  because: 2, paralyzing: 4, companion: 3, plain: 1, language: 2,
  written: 2, writing: 2, remember: 3, important: 3, difficult: 3,
  situation: 4, situations: 4, information: 4, education: 4, decision: 3,
  decisions: 3, relationship: 4, preferred: 2, nickname: 2, allergy: 3,
  equipment: 3, supplements: 3, protocol: 3, wandering: 3, diabetic: 4,
  rescue: 2, calendar: 3, reminder: 3, yearly: 2, service: 2, address: 2,
};

function validate() {
  let exact = 0, off = 0, total = 0, sumAbs = 0;
  const misses = [];
  for (const [w, expected] of Object.entries(VALIDATION)) {
    if (SYLL_EXCEPTIONS[w]) continue; // don't score the lookup table against itself
    total++;
    const got = syllables(w);
    sumAbs += Math.abs(got - expected);
    if (got === expected) exact++;
    else { off++; misses.push(`${w}: expected ${expected}, got ${got}`); }
  }
  return {
    wordsTested: total,
    exact,
    exactPercent: +((exact / total) * 100).toFixed(1),
    meanAbsoluteError: +(sumAbs / total).toFixed(3),
    misses,
  };
}

const isComplex = (word) => {
  const w = word.toLowerCase().replace(/[^a-z]/g, "");
  if (w.length < 3) return false;
  // Gunning Fog excludes familiar words made polysyllabic by suffixes.
  const stripped = w.replace(/(?:es|ed|ing)$/, "");
  return syllables(stripped || w) >= 3;
};

/* -------------------------------------------------------------------- parsing */

function sentences(text) {
  return text
    // Protect the abbreviations that actually occur in this corpus.
    .replace(/\b(e\.g|i\.e|Mr|Mrs|Ms|Dr|St|vs|approx|etc)\./gi, "$1<DOT>")
    .replace(/\b([A-Z])\./g, "$1<DOT>")
    .split(/(?<=[.!?])[\s"'”’)]+(?=[A-Z0-9"'“‘(])|\n+/)
    .map((s) => s.replace(/<DOT>/g, ".").trim())
    .filter((s) => /[a-z]/i.test(s) && s.split(/\s+/).length >= 2);
}

function words(text) {
  return text
    .replace(/[‘’]/g, "'")
    .split(/\s+/)
    .map((w) => w.replace(/^[^A-Za-z0-9'-]+|[^A-Za-z0-9'-]+$/g, ""))
    .filter((w) => /[A-Za-z0-9]/.test(w));
}

/* --------------------------------------------------------------------- scores */

function score(text) {
  const sents = sentences(text);
  const ws = words(text);
  if (sents.length === 0 || ws.length === 0) return null;

  const nSent = sents.length;
  const nWord = ws.length;
  const nSyll = ws.reduce((a, w) => a + syllables(w), 0);
  const complex = ws.filter(isComplex);
  const nComplex = complex.length;

  const wordsPerSentence = nWord / nSent;
  const syllPerWord = nSyll / nWord;
  const pctComplex = (nComplex / nWord) * 100;

  // Flesch-Kincaid Grade Level
  const fkGrade = 0.39 * wordsPerSentence + 11.8 * syllPerWord - 15.59;
  // Flesch Reading Ease (higher = easier; 60-70 = plain English)
  const fleschEase = 206.835 - 1.015 * wordsPerSentence - 84.6 * syllPerWord;
  // Gunning Fog Index
  const fog = 0.4 * (wordsPerSentence + pctComplex);
  // SMOG (needs >= 30 sentences to be strictly valid; flagged when it is not)
  const smog = 1.0430 * Math.sqrt(nComplex * (30 / nSent)) + 3.1291;

  // Most-frequent complex words, so a rewrite has somewhere to start.
  const freq = new Map();
  for (const w of complex) {
    const k = w.toLowerCase().replace(/[^a-z']/g, "");
    if (k.length > 2) freq.set(k, (freq.get(k) ?? 0) + 1);
  }
  const topComplex = [...freq.entries()]
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, 18)
    .map(([w, n]) => `${w} (${n})`);

  const longSentences = sents
    .map((s) => ({ s, n: words(s).length }))
    .filter((x) => x.n >= 30)
    .sort((a, b) => b.n - a.n)
    .slice(0, 6)
    .map((x) => ({ words: x.n, text: x.s }));

  return {
    counts: { sentences: nSent, words: nWord, syllables: nSyll, complexWords: nComplex },
    wordsPerSentence: +wordsPerSentence.toFixed(2),
    syllablesPerWord: +syllPerWord.toFixed(3),
    percentComplexWords: +pctComplex.toFixed(2),
    fleschKincaidGrade: +fkGrade.toFixed(2),
    fleschReadingEase: +fleschEase.toFixed(2),
    gunningFog: +fog.toFixed(2),
    smog: +smog.toFixed(2),
    smogValid: nSent >= 30,
    topComplexWords: topComplex,
    longestSentences: longSentences,
  };
}

/* ----------------------------------------------------------------- extraction */

/**
 * Prose only, one block element per line.
 *
 * This walks the LIVE DOM rather than a detached clone: `innerText` on a
 * detached node has no layout and silently degrades to `textContent`, which
 * concatenates adjacent blocks with no separator ("...parking situation.Food,
 * appetite, and mealtimesWhat they eat..."). That fuses every heading into the
 * paragraph after it and inflates words-per-sentence — and therefore every
 * grade-level score — badly. Each block is now read individually and
 * terminated, so a heading is its own unit and can never join a sentence.
 *
 * Nav, footer, and the persistent privacy strip repeat on every route and
 * would dominate short pages, so they are excluded here and scored separately.
 */
const EXTRACT = () => {
  const BLOCK =
    "p,h1,h2,h3,h4,h5,h6,li,label,button,a,summary,legend,figcaption,td,th,dt,dd,blockquote";

  const hidden = (el) => {
    if (el.closest("[aria-hidden='true']")) return true;
    const s = getComputedStyle(el);
    return s.display === "none" || s.visibility === "hidden";
  };

  const collect = (root) => {
    if (!root) return [];
    const out = [];
    const seen = new Set();
    for (const el of root.querySelectorAll(BLOCK)) {
      if (hidden(el)) continue;
      // Leaf-ish blocks only, so an <li> wrapping a <p> is not counted twice.
      if (el.querySelector(BLOCK)) continue;
      const t = (el.innerText || "").replace(/ /g, " ").replace(/\s+/g, " ").trim();
      if (!t) continue;
      const key = t.toLowerCase();
      if (seen.has(key)) continue;
      seen.add(key);
      out.push({
        text: t,
        tag: el.tagName.toLowerCase(),
        words: t.split(/\s+/).filter((w) => /[a-z0-9]/i.test(w)).length,
        // Did the AUTHOR terminate it, or is it a bare UI label?
        terminated: /[.!?]["'”’)]?$/.test(t),
      });
    }
    return out;
  };

  const main = document.querySelector("main") || document.body;

  const placeholders = [...document.querySelectorAll("input,textarea,select")]
    .map((el) => (el.getAttribute("placeholder") || "").trim())
    .filter(Boolean);

  return {
    body: collect(main),
    header: collect(document.querySelector("header")),
    footer: collect(document.querySelector("footer")),
    placeholders,
    title: document.title,
    metaDescription:
      document.querySelector('meta[name="description"]')?.getAttribute("content") ?? "",
  };
};

/**
 * Readability formulas are defined over continuous prose. A wizard screen is
 * mostly field labels, headings and buttons — "Preferred hospital or ER",
 * "Add a provider" — which are not sentences and cannot carry a grade level.
 * Mixing them into the same number destroys it in one of two directions:
 * fused into the neighbouring paragraph they inflate words-per-sentence, and
 * counted as sentences in their own right they crash it. So blocks are split,
 * and only real prose is scored. Fragments are inventoried separately and
 * judged on jargon and clarity instead of on a grade level.
 *
 * PROSE = the author terminated it as a sentence AND it is long enough for
 * the formulas to mean anything (>= 12 words).
 */
const PROSE_MIN_WORDS = 12;
const splitBlocks = (blocks) => ({
  prose: blocks.filter((b) => b.terminated && b.words >= PROSE_MIN_WORDS),
  fragments: blocks.filter((b) => !(b.terminated && b.words >= PROSE_MIN_WORDS)),
});

/* ------------------------------------------------------------------------ run */

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });

const results = {};
const chrome = {};
const meta = {};

for (const [name, route] of ROUTES) {
  try {
    await page.goto(BASE + route, { waitUntil: "networkidle", timeout: 45000 });
    await page.waitForTimeout(600);

    // Example text and help live behind disclosures; a user who opens them is
    // reading that copy, so it must be scored.
    await page.evaluate(() => {
      document.querySelectorAll("details").forEach((d) => (d.open = true));
      document
        .querySelectorAll('[aria-expanded="false"]')
        .forEach((b) => b instanceof HTMLElement && b.click());
    });
    await page.waitForTimeout(400);

    const x = await page.evaluate(EXTRACT);

    if (x.body.some((b) => /This page could not be found/.test(b.text))) {
      results[name] = { route, error: "404 — route does not exist" };
      console.log(`${name.padEnd(34)} 404`);
      continue;
    }

    const { prose, fragments } = splitBlocks(x.body);
    const proseText = prose.map((b) => b.text).join("\n");
    const s = score(proseText);

    results[name] = {
      route,
      title: x.title,
      metaDescription: x.metaDescription,
      proseBlocks: prose.length,
      fragmentBlocks: fragments.length,
      // Fragments are copy too; they are judged on jargon, not grade level.
      fragmentInventory: fragments.map((b) => `[${b.tag}] ${b.text}`),
      placeholders: x.placeholders,
      ...s,
    };
    meta[name] = { title: x.title, metaDescription: x.metaDescription };
    if (!chrome.header && x.header.length) {
      chrome.header = { blocks: x.header.map((b) => `[${b.tag}] ${b.text}`) };
    }
    if (!chrome.footer && x.footer.length) {
      chrome.footer = { blocks: x.footer.map((b) => `[${b.tag}] ${b.text}`) };
    }
    console.log(
      `${name.padEnd(34)} FK ${String(s?.fleschKincaidGrade ?? "-").padStart(6)}` +
        `  Fog ${String(s?.gunningFog ?? "-").padStart(6)}` +
        `  SMOG ${String(s?.smog ?? "-").padStart(6)}` +
        `  Ease ${String(s?.fleschReadingEase ?? "-").padStart(6)}` +
        `  wps ${String(s?.wordsPerSentence ?? "-").padStart(5)}` +
        `  (${s?.counts.words ?? 0} prose w / ${fragments.length} frags)`
    );
  } catch (e) {
    results[name] = { route, error: String(e.message ?? e) };
    console.log(`${name.padEnd(26)} FAILED: ${e.message}`);
  }
}

await browser.close();

const scored = Object.values(results).filter((r) => r.fleschKincaidGrade != null);
const avg = (k) => +(scored.reduce((a, r) => a + r[k], 0) / scored.length).toFixed(2);

const out = {
  generatedAt: new Date().toISOString(),
  base: BASE,
  method:
    "Scores cover CONTINUOUS PROSE ONLY: blocks the author terminated as a " +
    "sentence and >=12 words long. Field labels, headings, buttons and other UI " +
    "fragments are excluded (readability formulas are undefined over them) and " +
    "are listed per route under fragmentInventory instead. Text is read from the " +
    "live DOM one block element at a time, so a heading can never fuse with the " +
    "paragraph after it. Header/footer chrome repeats on every route and is " +
    "listed separately rather than scored into each page.",
  caveats:
    "Syllable counts are heuristic, not dictionary-exact — measured accuracy is " +
    "in syllableAccuracy (88.4% exact, MAE 0.116 over 86 held-out words), which " +
    "moves grade levels by well under one grade in aggregate but means no single " +
    "word's count should be relied on. SMOG is only strictly valid at >=30 " +
    "sentences; smogValid flags each route.",
  target: { fleschKincaidGrade: "6-8", gunningFog: "8-10", fleschReadingEase: ">=60" },
  syllableAccuracy: validate(),
  siteAverages: {
    fleschKincaidGrade: avg("fleschKincaidGrade"),
    gunningFog: avg("gunningFog"),
    smog: avg("smog"),
    fleschReadingEase: avg("fleschReadingEase"),
    wordsPerSentence: avg("wordsPerSentence"),
  },
  chrome,
  routes: results,
  titlesAndDescriptions: meta,
};

await mkdir(OUT, { recursive: true });
await writeFile(path.join(OUT, "readability.json"), JSON.stringify(out, null, 2));
console.log("\nsite averages:", out.siteAverages);
console.log("wrote audit/evidence/readability.json");
