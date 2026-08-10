// V4 verifier: fetch production HTML + headers, dump facts for A7/A8 verification.
// Analysis only. Writes to audit/evidence/v4/ .
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const OUT = join(process.cwd(), "audit", "evidence", "v4");
mkdirSync(OUT, { recursive: true });

const urls = [
  "https://myletterofintent.com/",
  "https://myletterofintent.com/privacy",
  "https://myletterofintent.com/letter/about",
  "https://myletterofintent.com/your-data",
];

const report = {};

for (const url of urls) {
  try {
    const res = await fetch(url, { redirect: "follow" });
    const html = await res.text();
    const headers = {};
    for (const [k, v] of res.headers.entries()) headers[k] = v;

    const metaDesc = html.match(/<meta name="description" content="([^"]*)"/);
    const cfBeacon = html.match(
      /<script[^>]*static\.cloudflareinsights\.com[^>]*>/
    );
    const emailDecode = html.match(
      /<script[^>]*cdn-cgi\/scripts\/[^>]*email-decode[^>]*>/
    );
    const cfEmailProtect = (html.match(/email-protection/g) || []).length;
    const cfEmailSpan = (html.match(/__cf_email__/g) || []).length;
    const trackCount = (html.match(/<track\b/g) || []).length;
    const videoCount = (html.match(/<video\b/g) || []).length;
    const scriptSrcs = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map(
      (m) => m[1]
    );

    report[url] = {
      status: res.status,
      headers,
      metaDescription: metaDesc ? metaDesc[1] : null,
      cfBeaconTag: cfBeacon ? cfBeacon[0] : null,
      cfBeaconOffset: cfBeacon ? html.indexOf(cfBeacon[0]) : null,
      emailDecodeTag: emailDecode ? emailDecode[0] : null,
      emailDecodeOffset: emailDecode ? html.indexOf(emailDecode[0]) : null,
      cfEmailProtectMatches: cfEmailProtect,
      cfEmailSpanMatches: cfEmailSpan,
      trackCount,
      videoCount,
      scriptSrcs,
      htmlLength: html.length,
      containsPhrases: {
        neverShared: html.includes("never shared"),
        everythingStaysOnYourDevice: html.includes(
          "Everything stays on your device"
        ),
        everythingYouTypeStays: html.includes(
          "Everything you type stays on your device"
        ),
        nothingIsUploaded: html.includes("Nothing is uploaded"),
        noScriptOnThisPage: html.includes("no script on this page reads them"),
        privateByDesign: html.includes("Private by design"),
        doNotTrack: /do not track/i.test(html),
        ofAnyKindOrphan: html.includes("nothing else. of any kind."),
        about2Minutes: html.includes("about 2 minutes"),
        under5Minutes: html.includes("under 5 minutes"),
        ogImage: /property="og:image"/.test(html),
        consumerHealth: /consumer health/i.test(html),
        termsRoute: html.includes('href="/terms"'),
        accessibilityRoute: html.includes('href="/accessibility"'),
      },
    };
    writeFileSync(
      join(OUT, "prod-" + url.replace(/[^a-z0-9]+/gi, "_") + ".html"),
      html
    );
  } catch (e) {
    report[url] = { error: String(e) };
  }
}

// extra: routes that should 404
for (const p of [
  "/terms",
  "/accessibility",
  "/security",
  "/.well-known/security.txt",
  "/robots.txt",
  "/og-image.png",
]) {
  try {
    const res = await fetch("https://myletterofintent.com" + p, {
      redirect: "manual",
    });
    report["EXISTS " + p] = { status: res.status };
  } catch (e) {
    report["EXISTS " + p] = { error: String(e) };
  }
}

// http -> https
try {
  const res = await fetch("http://myletterofintent.com/", {
    redirect: "manual",
  });
  report["http-redirect"] = {
    status: res.status,
    location: res.headers.get("location"),
  };
} catch (e) {
  report["http-redirect"] = { error: String(e) };
}

writeFileSync(join(OUT, "prod-report.json"), JSON.stringify(report, null, 2));
console.log(JSON.stringify(report, (k, v) => (k === "headers" ? v : v), 2).slice(0, 12000));
