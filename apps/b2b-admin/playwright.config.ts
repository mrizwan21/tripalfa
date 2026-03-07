/**
 * Playwright E2E Configuration — B2B Admin
 *
 * Runs against the Vite dev server (port 5177).
 * API calls are intercepted per-test via Playwright route handlers
 * (no real backend required).
 *
 * Auth state is bootstrapped once in the "setup" project by injecting
 * mock localStorage values, then reused by all feature-test projects
 * via storageState.
 */
import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",

  timeout: 45000,
  expect: { timeout: 10000 },

  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 2 : undefined,

  reporter: [
    ["list"],
    ["html", { outputFolder: "playwright-report", open: "never" }],
    ["json", { outputFile: "test-results/results.json" }],
  ],

  use: {
    baseURL: process.env.BASE_URL || "http://localhost:5177",

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 15000,
    navigationTimeout: 30000,

    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    // ── Auth setup ──────────────────────────────────────────────────────────
    // Injects mock session data into localStorage and saves storageState.json.
    {
      name: "setup",
      testMatch: /auth\.setup\.ts/,
    },

    // ── Feature tests (Chromium) ────────────────────────────────────────────
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "tests/fixtures/storageState.json",
      },
      dependencies: ["setup"],
    },

    // ── Auth tests run without saved state ─────────────────────────────────
    {
      name: "auth",
      testMatch: /auth\/.+\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  outputDir: "test-results/",

  webServer: {
    command: "pnpm run dev",
    url: "http://localhost:5177",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
