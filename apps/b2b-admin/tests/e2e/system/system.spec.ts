/**
 * E2E — B2B Admin: System Module
 *
 * Covers:
 *   /system                     — SystemHealth
 *   /system/monitoring          — SystemMonitoring
 *   /system/runtime-settings    — BookingEngineRuntimeSettings
 *   /system/permission-manager  — PermissionManager
 *   /system/content-settings    — ContentSettings
 *   /organizations              — OrganizationsList
 *
 * Uses pre-authenticated storageState (chromium project).
 */
import { test, expect } from "../../fixtures/test.fixture";
import { mockAdminApi } from "../../helpers/api-mocks";

const systemRoutes = [
  { name: "System health", path: "/system" },
  { name: "System monitoring", path: "/system/monitoring" },
  { name: "Runtime settings", path: "/system/runtime-settings" },
  { name: "Permission manager", path: "/system/permission-manager" },
  { name: "Content settings", path: "/system/content-settings" },
  { name: "Organizations list", path: "/organizations" },
];

for (const { name, path } of systemRoutes) {
  test.describe(name, () => {
    test.beforeEach(async ({ page }) => {
      await mockAdminApi(page);
      await page.goto(path);
      await page.waitForLoadState("networkidle");
    });

    test(`renders ${name} page without crashing`, async ({ page }) => {
      await expect(page.locator("h1, h2, main").first()).toBeVisible();
    });
  });
}
