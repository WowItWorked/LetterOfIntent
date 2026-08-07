import { defineConfig, devices } from "@playwright/test";

/**
 * E2E runs against the production build (`next start`) so the security
 * headers and real bundles are exercised. Run `npm run build` first.
 */
export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  timeout: 90_000,
  expect: { timeout: 10_000 },
  retries: process.env.CI ? 2 : 0,
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://localhost:3100",
    trace: "retain-on-failure",
  },
  webServer: {
    command: "npm run start -- -p 3100",
    url: "http://localhost:3100",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
  projects: [
    { name: "desktop", use: { ...devices["Desktop Chrome"] } },
    // 375px-wide viewport — the acceptance floor for mobile usability.
    // Pixel preset (Chromium-based; only Chromium is installed), narrowed to 375.
    {
      name: "mobile-375",
      use: { ...devices["Pixel 7"], viewport: { width: 375, height: 667 } },
    },
  ],
});
