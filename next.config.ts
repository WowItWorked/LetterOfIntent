import type { NextConfig } from "next";

/**
 * The CSP backs the tool's core promise at the browser level: connect-src
 * 'self' means even a bug or bad dependency could not send form data to a
 * third party. Applied in production only (dev tooling needs eval/websockets).
 */
const securityHeaders = [
  {
    key: "Content-Security-Policy",
    value: [
      "default-src 'self'",
      // wasm-unsafe-eval: @react-pdf's yoga layout engine is WebAssembly.
      "script-src 'self' 'unsafe-inline' 'wasm-unsafe-eval'",
      "style-src 'self' 'unsafe-inline'",
      "img-src 'self' data: blob:",
      // blob: is the explainer video's fallback source on hosts that do not
      // answer range requests — the file is fetched once and re-served locally.
      "media-src 'self' blob:",
      "font-src 'self' data:",
      "connect-src 'self'",
      "worker-src 'self' blob:",
      "object-src 'none'",
      "base-uri 'self'",
      "form-action 'self'",
      "frame-ancestors 'none'",
    ].join("; "),
  },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "no-referrer" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
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
};

export default nextConfig;
