/**
 * Vite configuration for E2E (Playwright) test runs.
 *
 * Identical to vite.config.ts except all backend proxy rules are removed so
 * that page navigation to routes like /bookings or /hotels is handled by
 * Vite's SPA fallback (serving index.html) instead of being forwarded to a
 * backend service that is not running during E2E tests.
 */
import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: [
      {
        find: "@/components/ui",
        replacement: path.resolve(__dirname, "./src/components/ui"),
      },
      {
        find: "@tripalfa/shared-utils",
        replacement: path.resolve(__dirname, "../../packages/shared-utils"),
      },
      {
        find: "@tripalfa/ui-components",
        replacement: path.resolve(__dirname, "../../packages/ui-components"),
      },
      {
        find: "@tripalfa/shared-types",
        replacement: path.resolve(__dirname, "../../packages/shared-types"),
      },
      { find: "@", replacement: path.resolve(__dirname, "./src") },
    ],
  },
  build: {
    outDir: "dist",
  },
  server: {
    host: "0.0.0.0",
    port: 5174,
    // No proxy rules — all requests to /bookings, /hotels, /search, etc. are
    // served by Vite's SPA fallback (index.html).  API fetch calls are then
    // intercepted by Playwright's page.route() stubs in the test fixtures.
    proxy: {},
  },
});
