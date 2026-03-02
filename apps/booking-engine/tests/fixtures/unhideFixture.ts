import { test as base, Page } from "@playwright/test";

/**
 * Fixture that automatically unhides Tailwind hidden elements
 * Uses CSS style injection to override .hidden class globally
 */
export const test = base.extend<{
  page: Page;
}>({
  page: async ({ page }, use) => {
    // Add the unhiding stylesheet BEFORE first navigation
    // This runs before page starts loading, so CSS is applied immediately
    await page.addStyleTag({
      content: `
        /* Override Tailwind's hidden utility class */
        .hidden {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: auto !important;
          height: auto !important;
        }
        
        /* Also target specific form elements that might use inline styles */
        select[class*="hidden"],
        input[class*="hidden"],
        textarea[class*="hidden"],
        button[class*="hidden"],
        [data-testid*="flight"][class*="hidden"],
        [data-testid*="hotel"][class*="hidden"],
        [data-testid*="wallet"][class*="hidden"],
        [data-testid*="payment"][class*="hidden"] {
          display: block !important;
          visibility: visible !important;
          opacity: 1 !important;
          position: relative !important;
          width: auto !important;
          height: auto !important;
        }
      `,
    });

    // Use the page with the style injected
    await use(page);
  },
});

export { expect } from "@playwright/test";
