/**
 * Playwright auth setup project.
 *
 * Injects mock auth tokens directly into localStorage (no UI login needed —
 * the MSW handler paths don't match the app's actual API paths) then saves
 * the resulting storage state to tests/fixtures/storageState.json so every
 * feature test starts already authenticated.
 *
 * Note: the booking-engine Layout does not guard routes, so having a valid
 * accessToken in localStorage is sufficient for feature tests to run.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const STORAGE_STATE_PATH = path.resolve(
  __dirname,
  "../fixtures/storageState.json",
);

setup("inject auth tokens into localStorage", async ({ page }) => {
  // Navigate to the app root to establish the correct origin for localStorage
  await page.goto("/");
  await page.waitForLoadState("networkidle");

  // Inject mock tokens directly — avoids the need for a working login endpoint
  await page.evaluate(() => {
    localStorage.setItem("accessToken", "mock_jwt_token_12345");
    localStorage.setItem("refreshToken", "mock_refresh_token_67890");
  });

  // Reload so the app module picks up the tokens from localStorage on init
  await page.reload();
  await page.waitForLoadState("networkidle");

  const accessToken = await page.evaluate(() =>
    localStorage.getItem("accessToken"),
  );
  expect(accessToken).toBeTruthy();

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
