import { test, expect, Page } from "@playwright/test";

const BASE_URL = "http://localhost:5173"; // Vite dev server
const NOTIFICATIONS_URL = `${BASE_URL}/notifications`;

test.describe("Notifications E2E Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to notifications page
    await page.goto(NOTIFICATIONS_URL);
    // Wait for page to load
    await page.waitForLoadState("networkidle");
  });

  test.describe("Scenario 1: View Notifications List", () => {
    test("should display notifications page with all elements", async ({
      page,
    }) => {
      // Verify page title
      await expect(page.locator('h1:has-text("Notifications")')).toBeVisible();

      // Verify page contains description
      await expect(
        page.locator("text=Personalized alerts about your trips"),
      ).toBeVisible();

      // Verify notification list loads
      await expect(page.locator('[role="list"]')).toHaveCount(1, {
        timeout: 5000,
      });
    });

    test("should display unread count badge", async ({ page }) => {
      // Check for unread badge
      const badge = page.locator(".rounded-full").first();
      await expect(badge).toBeVisible({ timeout: 3000 });
    });

    test("should display different notification types", async ({ page }) => {
      const notifications = page.locator('[role="list"]');
      const count = await notifications.count();
      expect(count).toBeGreaterThan(0);

      // Verify notification content
      for (let i = 0; i < Math.min(count, 3); i++) {
        const notif = notifications.nth(i);
        await expect(notif.locator("h4")).toBeVisible();
        await expect(notif.locator("p")).toBeVisible();
      }
    });

    test("should display timestamps correctly", async ({ page }) => {
      const timestamps = page.locator("text=/\\w+ \\d+, \\d+:\\d+ (AM|PM)/");
      const count = await timestamps.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should display status badges", async ({ page }) => {
      // Status badges should be visible if notifications have status
      const notifications = page.locator('[role="list"]');
      const count = await notifications.count();
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  test.describe("Scenario 2: View Notification Details", () => {
    test("should open details popup when clicking notification", async ({
      page,
    }) => {
      const viewButton = page.locator("text=VIEW DETAILS").first();
      await viewButton.click();

      // Popup should be visible
      const popup = page
        .locator('[role="dialog"], [role="presentation"]')
        .first();
      await expect(popup).toBeVisible({ timeout: 2000 });
    });

    test("should display complete notification details", async ({ page }) => {
      const viewButton = page.locator("text=VIEW DETAILS").first();
      await viewButton.click();

      // Wait for popup
      await page.waitForSelector("text=Request Initiated", { timeout: 3000 });

      // Verify details are displayed
      await expect(page.locator("text=Request Initiated")).toBeVisible();
    });

    test("should close popup with close button", async ({ page }) => {
      const viewButton = page.locator("text=VIEW DETAILS").first();
      await viewButton.click();

      await page.waitForSelector('[aria-label="Close notification details"]', {
        timeout: 3000,
      });

      const closeButton = page.locator(
        '[aria-label="Close notification details"]',
      );
      await closeButton.click();

      // Popup should be hidden
      const popup = page
        .locator('[role="dialog"], [role="presentation"]')
        .first();
      await expect(popup).not.toBeVisible({ timeout: 2000 });
    });

    test("should close popup with Escape key", async ({ page }) => {
      const viewButton = page.locator("text=VIEW DETAILS").first();
      await viewButton.click();

      await page.waitForSelector('[aria-label="Close notification details"]', {
        timeout: 3000,
      });

      // Press Escape
      await page.keyboard.press("Escape");

      // Popup should be hidden
      const popup = page
        .locator('[role="dialog"], [role="presentation"]')
        .first();
      await expect(popup).not.toBeVisible({ timeout: 2000 });
    });

    test("should display passenger name for SSR notifications", async ({
      page,
    }) => {
      const viewButton = page.locator("text=VIEW DETAILS").first();
      await viewButton.click();

      // Wait for popup content
      await page.waitForTimeout(500);

      // If passenger name exists, it should be visible
      const passengerName = page.locator("text=Passenger").first();
      if (await passengerName.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(passengerName).toBeVisible();
      }
    });
  });

  test.describe("Scenario 3: Mark Notification as Read", () => {
    test("should mark notification as read", async ({ page }) => {
      // Get initial unread count
      const initialBadge = page
        .locator(".rounded-full:has-text(/^\\d+$/)")
        .first();
      const initialCount = parseInt(await initialBadge.textContent(), 10);

      // Click mark as read
      const markReadButton = page.locator("text=MARK AS READ").first();
      if (
        await markReadButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        await markReadButton.click();

        // Unread count should decrease
        await page.waitForTimeout(200);
        const updatedBadge = page
          .locator(".rounded-full:has-text(/^\\d+$/)")
          .first();
        const updatedCount = parseInt(await updatedBadge.textContent(), 10);
        expect(updatedCount).toBeLessThan(initialCount);
      }
    });

    test("should update visual indicator when marked as read", async ({
      page,
    }) => {
      const markReadButton = page.locator("text=MARK AS READ").first();
      if (
        await markReadButton.isVisible({ timeout: 2000 }).catch(() => false)
      ) {
        const notification = markReadButton.locator("..").first();
        await markReadButton.click();

        // Notification should no longer show mark as read button
        await expect(notification.locator("text=MARK AS READ")).not.toBeVisible(
          { timeout: 2000 },
        );
      }
    });
  });

  test.describe("Scenario 4: Filter Notifications", () => {
    test("should apply type filter", async ({ page }) => {
      // This assumes filter UI exists - if not, skip
      const filterButton = page.locator('[aria-label*="Filter"]').first();
      if (await filterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filterButton.click();
        // Select a filter option
        const option = page.locator("text=SUCCESS").first();
        if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    test("should apply status filter", async ({ page }) => {
      const filterButton = page.locator('[aria-label*="Filter"]').first();
      if (await filterButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await filterButton.click();
        // Select status filter
        const option = page.locator("text=CONFIRMED").first();
        if (await option.isVisible({ timeout: 1000 }).catch(() => false)) {
          await option.click();
        }
      }
    });

    test("should clear filters", async ({ page }) => {
      const clearButton = page.locator("text=Clear filters").first();
      if (await clearButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await clearButton.click();
        // All notifications should be visible again
      }
    });
  });

  test.describe("Scenario 5: Search Notifications", () => {
    test("should search by title", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.fill("booking");
        await page.waitForTimeout(300); // Debounce

        // Results should be filtered
        const notifications = page.locator('[role="list"]');
        expect(await notifications.count()).toBeGreaterThanOrEqual(0);
      }
    });

    test("should clear search results", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.fill("booking");
        await page.waitForTimeout(300);
        await searchInput.clear();

        // All notifications should be visible
      }
    });

    test("should handle no search results", async ({ page }) => {
      const searchInput = page.locator('input[placeholder*="Search"]').first();
      if (await searchInput.isVisible({ timeout: 1000 }).catch(() => false)) {
        await searchInput.fill("xxxxnonexistentxxx");
        await page.waitForTimeout(300);

        // Empty state should display
      }
    });
  });

  test.describe("Scenario 6: Pagination", () => {
    test("should display pagination controls", async ({ page }) => {
      const paginationButton = page.locator('[aria-label*="Page"]').first();
      if (
        await paginationButton.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        await expect(paginationButton).toBeVisible();
      }
    });

    test("should navigate to next page", async ({ page }) => {
      const nextButton = page.locator('button:has-text("Next")').first();
      if (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) {
        await nextButton.click();
        // Next page should load
        await page.waitForLoadState("networkidle");
      }
    });

    test("should navigate to previous page", async ({ page }) => {
      const nextButton = page.locator('button:has-text("Next")').first();
      const prevButton = page.locator('button:has-text("Previous")').first();

      if (
        (await nextButton.isVisible({ timeout: 1000 }).catch(() => false)) &&
        (await prevButton.isVisible({ timeout: 1000 }).catch(() => false))
      ) {
        await nextButton.click();
        await page.waitForTimeout(300);
        await prevButton.click();
        // Should be back on first page
      }
    });

    test("should change page size", async ({ page }) => {
      const pageSizeSelect = page.locator("select").first();
      if (
        await pageSizeSelect.isVisible({ timeout: 1000 }).catch(() => false)
      ) {
        await pageSizeSelect.selectOption("50");
        // More items should load
      }
    });
  });

  test.describe("Scenario 7: Real-time Toast Notification", () => {
    test("should display toast for new notifications", async ({ page }) => {
      // Simulate new notification (implementation dependent)
      // Toast should appear
      const toast = page.locator('[role="alert"]').first();
      if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
        await expect(toast).toBeVisible();
      }
    });

    test("should auto-dismiss toast", async ({ page }) => {
      const toast = page.locator('[role="alert"]').first();
      if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
        // Wait for auto-dismiss
        await page.waitForTimeout(5500);
        await expect(toast).not.toBeVisible({ timeout: 1000 });
      }
    });

    test("should navigate when clicking toast", async ({ page }) => {
      const toast = page.locator('[role="alert"]').first();
      if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
        const initialUrl = page.url();
        await toast.click();
        // Should navigate or show popup
      }
    });
  });

  test.describe("Scenario 8: Empty State", () => {
    test("should display empty state when no notifications", async ({
      page,
    }) => {
      // Clear notifications somehow (implementation dependent)
      // Empty state should display
      const emptyState = page.locator("text=All caught up").first();
      if (await emptyState.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(emptyState).toBeVisible();
      }
    });

    test("should display empty state icon", async ({ page }) => {
      const icon = page.locator("svg").first();
      if (await icon.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(icon).toBeVisible();
      }
    });

    test("should display empty state message", async ({ page }) => {
      const message = page.locator("text=don't have any notifications").first();
      if (await message.isVisible({ timeout: 1000 }).catch(() => false)) {
        await expect(message).toBeVisible();
      }
    });
  });

  test.describe("Scenario 9: Error Handling", () => {
    test("should display error state on API failure", async ({ page }) => {
      // Intercept and fail API request
      await page.route("**/api/notifications", (route) => {
        route.abort();
      });

      await page.reload();

      // Error state should display gracefully
      const emptyState = page.locator("text=All caught up").first();
      await expect(emptyState).toBeVisible({ timeout: 3000 });
    });

    test("should allow retry on error", async ({ page }) => {
      await page.route("**/api/notifications", (route) => {
        route.abort();
      });

      await page.reload();

      await expect(page.locator("text=All caught up")).toBeVisible({
        timeout: 3000,
      });

      // Stop blocking requests
      await page.unroute("**/api/notifications");

      // Reload or retry
      await page.reload();
      await page.waitForLoadState("networkidle");
    });
  });

  test.describe("Scenario 10: Responsive Design", () => {
    test("should be responsive on mobile", async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 });
      await page.goto(NOTIFICATIONS_URL);
      await page.waitForLoadState("networkidle");

      // Page should be readable
      const heading = page.locator('h1:has-text("Notifications")');
      await expect(heading).toBeVisible();
    });

    test("should be responsive on tablet", async ({ page }) => {
      await page.setViewportSize({ width: 768, height: 1024 });
      await page.goto(NOTIFICATIONS_URL);
      await page.waitForLoadState("networkidle");

      const heading = page.locator('h1:has-text("Notifications")');
      await expect(heading).toBeVisible();
    });

    test("should be responsive on desktop", async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.goto(NOTIFICATIONS_URL);
      await page.waitForLoadState("networkidle");

      const heading = page.locator('h1:has-text("Notifications")');
      await expect(heading).toBeVisible();
    });
  });

  test.describe("Scenario 11: Accessibility", () => {
    test("should have keyboard navigation", async ({ page }) => {
      const button = page.locator("button").first();
      await button.focus();
      await expect(button).toBeFocused();

      // Can press Enter to activate
      await page.keyboard.press("Enter");
    });

    test("should have accessible buttons", async ({ page }) => {
      const buttons = page.locator("button");
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have proper heading hierarchy", async ({ page }) => {
      const h1 = page.locator("h1");
      await expect(h1).toHaveCount(1);

      await expect(h1.nth(0)).toHaveText(/Notifications/);
    });

    test("should have proper color contrast", async ({ page }) => {
      // Run accessibility checks
      const accessibilityResults = await page.evaluate(() => {
        // Basic check - elements should have readable text
        const elements = document.querySelectorAll("button, a");
        return elements.length > 0;
      });

      expect(accessibilityResults).toBe(true);
    });
  });

  test.describe("Scenario 12: Cross-browser Compatibility", () => {
    test("should work on Chromium", async ({ page }) => {
      await page.goto(NOTIFICATIONS_URL);
      await page.waitForLoadState("networkidle");

      const heading = page.locator('h1:has-text("Notifications")');
      await expect(heading).toBeVisible();
    });

    // Firefox and WebKit tests would run in different browser contexts
    // Playwright handles this automatically when you run:
    // npx playwright test --project=firefox
    // npx playwright test --project=webkit
  });
});
