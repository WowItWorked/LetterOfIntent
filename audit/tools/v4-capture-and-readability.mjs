/**
 * V4: (a) re-check every factual claim A7/A8 make about the shared capture;
 *      (b) recompute the /privacy readability figures independently.
 */
import { readFileSync, writeFileSync } from "node:fs";

const out = {};

/* ------------------------------------------------------ (a) the capture ---- */
const cap = JSON.parse(
  readFileSync("audit/evidence/network/capture-production.json", "utf8")
);
out.captureTopLevelKeys = Object.keys(cap);
const reqs = cap.requests || [];
const resps = cap.responses || [];
out.requestCount = reqs.length;
out.responseCount = resps.length;
out.uniqueHosts = cap.uniqueHosts || null;
out.postDataCount = reqs.filter((r) => r.postData).length;
out.hostsFromRequests = [
  ...new Set(
    reqs.map((r) => {
      try { return new URL(r.url).host; } catch { return "?" + r.url; }
    })
  ),
];
const respUrls = new Set(resps.map((r) => r.url));
const noResponse = reqs.filter((r) => !respUrls.has(r.url));
out.requestsWithNoResponse = [...new Set(noResponse.map((r) => r.url))].slice(0, 20);
out.requestsWithNoResponseCount = noResponse.length;
out.beaconRequestCount = reqs.filter((r) => r.url.includes("cloudflareinsights")).length;
out.emailDecodeRequestCount = reqs.filter((r) => r.url.includes("email-decode")).length;
out.emailDecodeResponses = resps
  .filter((r) => r.url.includes("email-decode"))
  .map((r) => r.status);
out.cookies = (cap.cookies || []).map((c) => ({
  name: c.name, domain: c.domain, secure: c.secure, httpOnly: c.httpOnly,
  sameSite: c.sameSite, expires: c.expires,
  expiresISO: c.expires > 0 ? new Date(c.expires * 1000).toISOString() : null,
}));
const capStr = JSON.stringify(reqs);
out.canaryHitsInRequests = {
  ZQXCANARY: (capStr.match(/ZQXCANARY/g) || []).length,
  ZQXTYPEDCANARY: (capStr.match(/ZQXTYPEDCANARY/g) || []).length,
  requestsCharLength: capStr.length,
};
const storStr = JSON.stringify(cap.storageByRoute || {});
out.canaryHitsInStorage = {
  ZQXCANARY: (storStr.match(/ZQXCANARY/g) || []).length,
  ZQXTYPEDCANARY: (storStr.match(/ZQXTYPEDCANARY/g) || []).length,
};
// GA event names present in the capture
const gaEvents = new Set();
for (const r of reqs) {
  if (!/google-analytics|analytics\.google/.test(r.url)) continue;
  try {
    const en = new URL(r.url).searchParams.get("en");
    if (en) gaEvents.add(en);
  } catch {}
}
out.gaEventNamesInCapture = [...gaEvents];
out.referersAllEmpty = reqs.every(
  (r) => !r.headers || !r.headers.referer || r.headers.referer === ""
);
out.sampleRequestKeys = reqs[0] ? Object.keys(reqs[0]) : [];

/* -------------------------------------------- (b) readability of /privacy -- */
const html = readFileSync(
  "audit/evidence/v4/prod-https_myletterofintent_com_privacy.html",
  "utf8"
);
// Strip scripts/styles, take the <main> region, drop nav/headings/labels crudely
let body = html;
body = body.replace(/<script[\s\S]*?<\/script>/gi, " ");
body = body.replace(/<style[\s\S]*?<\/style>/gi, " ");
const mainMatch = body.match(/<main[^>]*>([\s\S]*?)<\/main>/i);
let main = mainMatch ? mainMatch[1] : body;
// remove nav
main = main.replace(/<nav[\s\S]*?<\/nav>/gi, " ");
// collect <p> text only (prose), matching "headings, nav and labels excluded"
const paras = [...main.matchAll(/<p\b[^>]*>([\s\S]*?)<\/p>/gi)].map((m) =>
  m[1]
    .replace(/<[^>]+>/g, "")
    .replace(/&rsquo;/g, "'")
    .replace(/&amp;/g, "&")
    .replace(/&nbsp;/g, " ")
    .replace(/&[a-z]+;/g, " ")
    .replace(/\s+/g, " ")
    .trim()
);
const prose = paras.filter((p) => p.length > 0).join(" ");

function syllables(word) {
  word = word.toLowerCase().replace(/[^a-z]/g, "");
  if (!word) return 0;
  if (word.length <= 3) return 1;
  word = word.replace(/(?:[^laeiouy]es|ed|[^laeiouy]e)$/, "");
  word = word.replace(/^y/, "");
  const m = word.match(/[aeiouy]{1,2}/g);
  return m ? m.length : 1;
}
function metrics(text) {
  const sentences = text.split(/[.!?]+(?:\s|$)/).filter((s) => s.trim().length > 1);
  const words = text.match(/[A-Za-z][A-Za-z'’-]*/g) || [];
  const syl = words.map(syllables);
  const totalSyl = syl.reduce((a, b) => a + b, 0);
  const poly = syl.filter((n) => n >= 3).length;
  const W = words.length, S = sentences.length;
  const asl = W / S, asw = totalSyl / W;
  return {
    words: W,
    sentences: S,
    avgWordsPerSentence: +asl.toFixed(2),
    avgSyllablesPerWord: +asw.toFixed(3),
    polysyllabicPct: +((poly / W) * 100).toFixed(1),
    fleschReadingEase: +(206.835 - 1.015 * asl - 84.6 * asw).toFixed(1),
    fleschKincaidGrade: +(0.39 * asl + 11.8 * asw - 15.59).toFixed(1),
    gunningFog: +(0.4 * (asl + 100 * (poly / W))).toFixed(1),
    smog: +(1.0430 * Math.sqrt(poly * (30 / S)) + 3.1291).toFixed(1),
    sentencesOver25Words: sentences.filter(
      (s) => (s.match(/[A-Za-z][A-Za-z'’-]*/g) || []).length > 25
    ).length,
  };
}
out.privacyProse = metrics(prose);
out.privacyProseSample = prose.slice(0, 400);
out.paraCount = paras.length;

writeFileSync("audit/evidence/v4/capture-readability.json", JSON.stringify(out, null, 2));
console.log(JSON.stringify(out, null, 2).slice(0, 9000));
