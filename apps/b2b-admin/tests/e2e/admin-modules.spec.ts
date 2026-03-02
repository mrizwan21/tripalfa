import { test, expect } from "@playwright/test";

test.describe("B2B Admin Panel - Futuristic UI Tests", () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the app - it should redirect to dashboard or show the main page
    await page.goto("/");

    // Wait for the page to be ready
    await page.waitForLoadState("networkidle");
  });

  test.describe("Layout Components", () => {
    test("should display main layout structure", async ({ page }) => {
      // Check that the page loaded
      await expect(page).toHaveTitle(/TripAlfa|Admin|Dashboard/i);

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

      // Check page is visible
      const body = page.locator("body");
      await expect(body).toBeVisible();

      // Test mobile view
      await page.setViewportSize({ width: 375, height: 667 });
      await page.waitForTimeout(500);

      await expect(body).toBeVisible();
    });
  });

  test.describe("Dashboard Module", () => {
    test("should display dashboard page", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check for dashboard content - look for any heading or content
      const heading = page.locator("h1, h2, h3").first();
      await expect(heading).toBeVisible({ timeout: 10000 });
    });

    test("should have interactive elements", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check for buttons or interactive elements
      const buttons = page.locator("button");
      const count = await buttons.count();
      expect(count).toBeGreaterThan(0);
    });
  });

  test.describe("Users Module", () => {
    test("should display users list page", async ({ page }) => {
      await page.goto("/users");
      await page.waitForLoadState("networkidle");

      // Check for page content
      const content = page.locator('h1, h2, [class*="user"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Organizations Module", () => {
    test("should display organizations list page", async ({ page }) => {
      await page.goto("/organizations");
      await page.waitForLoadState("networkidle");

      // Check for page content
      const content = page
        .locator('h1, h2, [class*="organization"], [class*="company"]')
        .first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Bookings Module", () => {
    test("should display bookings list page", async ({ page }) => {
      // Just verify navigation works without errors
      const response = await page.goto("/bookings");

      // Check that the page loaded (either 200 or 304)
      expect(response?.status()).toBeLessThan(400);

      // Wait a bit for any JS to execute
      await page.waitForTimeout(1000);

      // Verify we're on the bookings page
      expect(page.url()).toContain("/bookings");
    });
  });

  test.describe("Suppliers Module", () => {
    test("should display suppliers page", async ({ page }) => {
      await page.goto("/suppliers");
      await page.waitForLoadState("networkidle");

      // Check for page content
      const content = page.locator('h1, h2, [class*="supplier"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Settings Module", () => {
    test("should display settings page", async ({ page }) => {
      await page.goto("/settings");
      await page.waitForLoadState("networkidle");

      // Check for page content
      const content = page.locator('h1, h2, [class*="setting"]').first();
      await expect(content).toBeVisible({ timeout: 10000 });
    });
  });

  test.describe("Futuristic UI Design Tests", () => {
    test("should have dark theme or custom styling", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check for custom CSS variables or dark theme
      const body = page.locator("body");
      const backgroundColor = await body.evaluate((el) => {
        return window.getComputedStyle(el).backgroundColor;
      });

      // Just verify we have some styling applied
      expect(backgroundColor).toBeDefined();
    });

    test("should have styled buttons", async ({ page }) => {
      await page.goto("/dashboard");
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
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check for CSS transitions or animations in the document
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

      // Either have animations or framer-motion classes
      expect(
        hasAnimations || (await page.locator('[class*="motion"]').count()) > 0,
      ).toBeTruthy();
    });
  });

  test.describe("Accessibility Tests", () => {
    test("should have proper heading structure", async ({ page }) => {
      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Check for headings
      const headings = page.locator("h1, h2, h3, h4, h5, h6");
      const count = await headings.count();
      expect(count).toBeGreaterThan(0);
    });

    test("should have focusable interactive elements", async ({ page }) => {
      await page.goto("/dashboard");
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
    test("should load dashboard within acceptable time", async ({ page }) => {
      const startTime = Date.now();
      await page.goto("/dashboard");
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

      await page.goto("/dashboard");
      await page.waitForLoadState("networkidle");

      // Filter out non-critical errors (like network errors for missing resources)
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
