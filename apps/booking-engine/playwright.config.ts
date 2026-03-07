import { defineConfig, devices } from "@playwright/test";

/**
 * Playwright E2E Configuration — Booking Engine
 *
 * Runs against the Vite dev server in test mode (VITE_TEST_MODE=true)
 * which activates MSW service-worker mocks so no real backend is required.
 *
 * Auth state is bootstrapped once in the "setup" project and reused
 * by all feature-test projects via storageState.
 */
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
    baseURL: process.env.BASE_URL || "http://localhost:5174",

    trace: "retain-on-failure",
    screenshot: "only-on-failure",
    video: "retain-on-failure",

    actionTimeout: 15000,
    navigationTimeout: 30000,

    viewport: { width: 1440, height: 900 },
    ignoreHTTPSErrors: true,
  },

  projects: [
    // ── Auth setup ─────────────────────────────────────────────────────────
    // Performs a single login and saves localStorage to storageState.json.
    // All feature projects depend on this and reuse the saved state.
    {
      name: "setup",
      testDir: "./tests/helpers",
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

    // ── Auth tests run without saved state (they test the login page itself)
    {
      name: "auth",
      testMatch: /auth\/.+\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },
  ],

  outputDir: "test-results/",

  webServer: {
    command: "pnpm run dev:test",
    url: "http://localhost:5174",
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
