import type { NextConfig } from "next";

/**
 * The analytics hosts, duplicated from src/config/analytics.ts on purpose.
 *
 * Next transpiles this file to CommonJS at the repo root before running it, so
 * a runtime import of a TypeScript module under src/ cannot resolve — `next
 * dev` fails outright. `analytics.test.ts` fails the build if these two lists
 * ever disagree, which is the guard the import was there to provide.
 */
const ANALYTICS_HOSTS = [
  "https://www.googletagmanager.com",
  "https://www.google-analytics.com",
  "https://*.google-analytics.com",
  "https://*.analytics.google.com",
];

const ga = ANALYTICS_HOSTS.join(" ");

/**
 * The CSP backs the tool's core promise at the browser level.
 *
 * connect-src is the important line: it lists every host the browser may send
 * anything to. Google Analytics is on it, because analytics is on the site;
 * nothing else is, so a bug or a bad dependency still could not post a
 * family's letter anywhere. What GA is allowed to send and what it actually
 * sends are both documented in config/analytics.ts and on /privacy.
 *
 * Applied in production only (dev tooling needs eval and websockets).
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // wasm-unsafe-eval: @react-pdf's yoga layout engine is WebAssembly.
      `script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval' ${ga}`,
      "style-src 'self' 'unsafe-inline'",
      // GA falls back to an image beacon on browsers that block fetch.
      `img-src 'self' data: blob: ${ga}`,
      // blob: is the explainer video's fallback source on hosts that do not
      // answer range requests — the file is fetched once and re-served locally.
      "media-src 'self' blob:",
      "font-src 'self' data:",
      // data:: @react-pdf loads its yoga WASM engine with fetch(data:...) on
      // first PDF build. A data: URL carries its own bytes — fetching one
      // sends nothing anywhere, so the "no host but GA" promise is untouched.
      `connect-src 'self' data: ${ga}`,
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  {
    key: "Permissions-Policy",
    // Nothing here needs a device sensor or a payment sheet. Denying them
    // outright means a compromised dependency cannot ask either.
    value:
      "camera=(), microphone=(), geolocation=(), payment=(), usb=(), " +
      "serial=(), bluetooth=(), midi=(), display-capture=(), " +
      "accelerometer=(), gyroscope=(), magnetometer=(), " +
      "interest-cohort=(), browsing-topics=()",
  },
  // Belt and braces with frame-ancestors above, for anything that only knows
  // the older header.
  { key: "X-Frame-Options", value: "DENY" },
  // Two years, preloadable: this site is HTTPS-only and always will be.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // The letter lives in this origin's storage. Isolating the browsing context
  // keeps a cross-origin opener or a Spectre-style side channel away from it.
  { key: "Cross-Origin-Opener-Policy", value: "same-origin" },
  { key: "Cross-Origin-Resource-Policy", value: "same-origin" },
];

/**
 * Local dev on a OneDrive-synced folder hits intermittent EPERM lock errors in
 * the build directory. OneDrive never syncs anything under a folder named
 * node_modules, so locally the output goes there. Hosted builders (Vercel, CI)
 * expect the standard .next and cache node_modules separately — they must keep
 * the default.
 */
const isHostedBuild = Boolean(process.env.VERCEL || process.env.CI);

const nextConfig: NextConfig = {
  ...(isHostedBuild ? {} : { distDir: "node_modules/.cache/next-build" }),
  async headers() {
    if (process.env.NODE_ENV !== "production") return [];
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  async redirects() {
    // The working picker moved onto /care-cards; saved links keep working.
    return [{ source: "/letter/cards", destination: "/care-cards", permanent: true }];
  },
};

export default nextConfig;
