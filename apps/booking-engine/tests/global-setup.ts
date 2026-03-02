import { chromium, FullConfig } from "@playwright/test";

async function globalSetup(config: FullConfig) {
  console.log("🚀 Starting global setup for E2E tests...");

  // Create a browser instance for authentication setup
  const browser = await chromium.launch();
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    // Navigate to the application
    await page.goto(process.env.BASE_URL || "http://localhost:3002");

    // Wait for the application to be ready
    await page.waitForLoadState("networkidle");

    // Check if already authenticated
    const isAuthenticated = await page
      .locator('[data-testid="user-menu"]')
      .isVisible({ timeout: 5000 })
      .catch(() => false);

    if (!isAuthenticated) {
      console.log("🔐 Performing authentication setup...");

      // Navigate to login page
      await page.goto("/login");
      await page.waitForLoadState("networkidle");

      // Fill login form
      await page
        .getByTestId("login-email")
        .fill(process.env.TEST_USER_EMAIL || "testuser1@example.com");
      await page
        .getByTestId("login-password")
        .fill(process.env.TEST_USER_PASSWORD || "Test@123");

      // Submit login form
      await page.getByTestId("login-submit").click();

      // Wait for successful authentication
      await page.waitForSelector('[data-testid="user-menu"]', {
        timeout: 30000,
      });

      console.log("✅ Authentication successful");
    } else {
      console.log("✅ Already authenticated");
    }

    // Save authentication state
    await context.storageState({ path: "./tests/fixtures/storageState.json" });
    console.log("💾 Authentication state saved");
  } catch (error) {
    console.error("❌ Global setup failed:", error);
    throw error;
  } finally {
    await browser.close();
  }

  console.log("✅ Global setup completed successfully");
}

export default globalSetup;
