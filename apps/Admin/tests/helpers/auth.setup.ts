/**
 * B2B Admin — Auth setup project.
 *
 * Injects a mock admin session directly into localStorage (no UI login needed
 * since there are no MSW handlers in b2b-admin), then saves the storage state
 * so all feature tests start pre-authenticated.
 */
import { test as setup, expect } from "@playwright/test";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export const STORAGE_STATE_PATH = path.resolve(
  __dirname,
  "../fixtures/storageState.json",
);

const MOCK_TOKEN = "mock_admin_jwt_token_tripalfa";
const MOCK_USER = JSON.stringify({
  id: "admin_001",
  email: "admin@tripalfa.com",
  name: "Test Admin",
  role: "ADMIN",
  permissions: ["*"],
});

setup("inject admin session into localStorage", async ({ page }) => {
  // Navigate to the app root so we have a valid origin for localStorage
  await page.goto("/");

  // Intercept the API gateway call that the login flow would make so the
  // app considers itself authenticated when it reads localStorage on boot.
  await page.evaluate(
    ({ token, user }) => {
      localStorage.setItem("token", token);
      localStorage.setItem("b2b_admin_user", user);
      localStorage.setItem("b2b_admin_role", "ADMIN");
      localStorage.setItem("b2b_admin_permissions", JSON.stringify(["*"]));
    },
    { token: MOCK_TOKEN, user: MOCK_USER },
  );

  // Reload so the AccessControlProvider picks up the injected values
  await page.reload();
  await page.waitForLoadState("networkidle");

  // Verify the token is readable
  const storedToken = await page.evaluate(() => localStorage.getItem("token"));
  expect(storedToken).toBe(MOCK_TOKEN);

  await page.context().storageState({ path: STORAGE_STATE_PATH });
});
