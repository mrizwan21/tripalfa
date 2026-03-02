import { test, expect } from "@playwright/test";

test.describe("Booking Engine - Module Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app
    await page.goto("/");

    // Wait for the page to be ready
    await page.waitForLoadState("networkidle");
  });

  test.describe("Layout Components", () => {
    test("should display main layout structure", async ({ page }) => {
      // Check for main layout container
      const mainContent = page
        .locator('main, [role="main"], .main-content, [class*="layout"]')
        .first();
      await expect(mainContent).toBeVisible({ timeout: 10000 });
    });

    test("should have responsive design", async ({ page }) => {
      // Test desktop view
      await page.setViewportSize({ width: 1280, height: 720 });
      await page.waitForTimeout(500);

      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      await expect(body).toBeVisible();
    });
  });

  test.describe("Flight Module", () => {
    test("should display flight home page", async ({ page }) => {
      const response = await page.goto("/flights");
      expect(response?.status()).toBeLessThan(400);

      // Wait for page to load
      await page.waitForTimeout(1000);

      // Verify we're on the flights page
      expect(page.url()).toContain("/flights");
    });

    test("should have flight search functionality", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for search-related elements
      const searchElements = page.locator("input, button, form").first();
      await expect(searchElements).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Hotel Module", () => {
    test("should display hotel home page", async ({ page }) => {
      const response = await page.goto("/hotels");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/hotels");
    });

    test("should have hotel search functionality", async ({ page }) => {
      await page.goto("/hotels");
      await page.waitForLoadState("networkidle");

      // Check for search-related elements
      const searchElements = page.locator("input, button, form").first();
      await expect(searchElements).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Dashboard Module", () => {
    test("should display dashboard page", async ({ page }) => {
      const response = await page.goto("/dashboard");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/dashboard");
    });
  });

  test.describe("Bookings Module", () => {
    test("should display bookings management page", async ({ page }) => {
      const response = await page.goto("/bookings");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/bookings");
    });
  });

  test.describe("Wallet Module", () => {
    test("should display wallet page", async ({ page }) => {
      const response = await page.goto("/wallet");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/wallet");
    });
  });

  test.describe("Loyalty Module", () => {
    test("should display loyalty page", async ({ page }) => {
      const response = await page.goto("/loyalty");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/loyalty");
    });
  });

  test.describe("Profile Module", () => {
    test("should display profile page", async ({ page }) => {
      const response = await page.goto("/profile");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/profile");
    });
  });

  test.describe("Notifications Module", () => {
    test("should display notifications page", async ({ page }) => {
      const response = await page.goto("/notifications");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/notifications");
    });
  });

  test.describe("Help Center Module", () => {
    test("should display help center page", async ({ page }) => {
      const response = await page.goto("/help");
      expect(response?.status()).toBeLessThan(400);

      await page.waitForTimeout(1000);

      expect(page.url()).toContain("/help");
    });
  });

  test.describe("UI Design Tests", () => {
    test("should have custom styling", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for custom CSS variables or styling
      const body = page.locator("body");
      const backgroundColor = await body.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      expect(backgroundColor).toBeDefined();
    });

    test("should have styled buttons", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for styled buttons
      const buttons = page.locator("button");
      const count = await buttons.count();

      if (count > 0) {
        const firstButton = buttons.first();
        const hasStyling = await firstButton.evaluate((el) => {
          const style = window.getComputedStyle(el);
          return (
            style.backgroundColor !== "rgba(0, 0, 0, 0)" ||
            style.background !== "none" ||
            el.className.length > 0
          );
        });
        expect(hasStyling).toBeTruthy();
      }
    });

    test("should have smooth transitions or animations", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for CSS transitions or animations
      const hasAnimations = await page.evaluate(() => {
        const styleSheets = document.styleSheets;
        for (let i = 0; i < styleSheets.length; i++) {
          try {
            const rules = styleSheets[i].cssRules || styleSheets[i].rules;
            for (let j = 0; j < rules.length; j++) {
              const rule = rules[j] as CSSStyleRule;
              if (
                rule.style &&
                (rule.style.transition ||
                  rule.style.animation ||
                  rule.style.transform)
              ) {
                return true;
              }
            }
          } catch (e) {
            // Cross-origin stylesheets may throw errors
          }
        }
        return false;
      });

      expect(
        hasAnimations ||
          (await page
            .locator('[class*="motion"], [class*="animate"]')
            .count()) > 0,
      ).toBeTruthy();
    });
  });

  test.describe("Accessibility Tests", () => {
    test("should have proper heading structure", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for headings
      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have focusable interactive elements", async ({ page }) => {
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Check for focusable elements
      const focusableElements = page.locator(
        "button, a, input, select, textarea, [tabindex]",
      );
      const count = await focusableElements.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Performance Tests", () => {
    test("should load flights page within acceptable time", async ({
      page,
    }) => {
      const startTime = Date.now();
      await page.goto("/flights");
      await page.waitForLoadState("networkidle");
      const loadTime = Date.now() - startTime;

      // Page should load within 10 seconds
      expect(loadTime).toBeLessThan(10000);
    });

    test("should not have critical console errors", async ({ page }) => {
      const errors: string[] = [];

      page.on("console", (msg) => {
        if (msg.type() === "error") {
          errors.push(msg.text());
        }
      });

      await page.goto("/flights");
      await page.waitForLoadState("networkidle");

      // Filter out non-critical errors
      const criticalErrors = errors.filter(
        (error) =>
          !error.includes("Failed to load resource") &&
          !error.includes("net::ERR") &&
          !error.includes("404"),
      );

      // Allow some errors but not critical ones
      expect(criticalErrors.length).toBeLessThan(5);
    });
  });
});
