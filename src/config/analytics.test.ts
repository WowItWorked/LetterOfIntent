import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { ANALYTICS_HOSTS, GA_MEASUREMENT_ID } from "@/config/analytics";

/**
 * next.config.ts cannot import this module: Next transpiles the config to
 * CommonJS at the repo root before running it, and a runtime require of a
 * TypeScript file under src/ fails — it takes `next dev` down with it.
 *
 * So the host list is written out in both places, and this test is what keeps
 * them honest. If they drift, the Content-Security-Policy either blocks
 * analytics silently or allows a host nothing needs.
 */
const configSource = fs.readFileSync(
  path.resolve(process.cwd(), "next.config.ts"),
  "utf8"
);

describe("analytics config and the CSP agree", () => {
  it("lists every analytics host in the Content-Security-Policy", () => {
    for (const host of ANALYTICS_HOSTS) {
      expect(configSource, `${host} missing from next.config.ts`).toContain(host);
    }
  });

  it("does not permit a host the app does not use", () => {
    const inConfig = [...configSource.matchAll(/"(https:\/\/[^"]+)"/g)].map((m) => m[1]);
    for (const host of inConfig) {
      expect(ANALYTICS_HOSTS as readonly string[], `${host} is not in ANALYTICS_HOSTS`).toContain(
        host
      );
    }
  });

  it("keeps connect-src limited to self, data:, and analytics", () => {
    // data: is not a host — a data: URL carries its own bytes and a fetch of
    // one sends nothing anywhere (react-pdf's WASM engine loads this way).
    // The promise this test guards is unchanged: no NETWORK destination
    // beyond the analytics hosts.
    const connect = /`connect-src 'self' data: \$\{ga\}`/.test(configSource);
    expect(
      connect,
      "connect-src must be 'self' + data: plus the analytics hosts only"
    ).toBe(true);
  });

  it("has a measurement ID in the shape Google issues", () => {
    expect(GA_MEASUREMENT_ID).toMatch(/^G-[A-Z0-9]{8,}$/);
  });
});
