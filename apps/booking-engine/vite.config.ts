import path from "path";
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react() as any],
  resolve: {
    alias: [
      // More specific aliases must come first before general '@' alias
      {
        find: "@/components/ui",
        replacement: path.resolve(__dirname, "../../packages/ui-components/ui"),
      },
      // General aliases
      {
        find: "@tripalfa/shared-utils",
        replacement: path.resolve(__dirname, "../../packages/shared-utils"),
      },
      // @tripalfa/static-data removed - static data now comes from LiteAPI
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
    rollupOptions: {
      output: {
        manualChunks: {
          // Split mapbox-gl into its own chunk for better caching
          "mapbox-gl": ["mapbox-gl"],
          // Split React ecosystem
          "react-vendor": [
            "react",
            "react-dom",
            "react-router",
            "react-router-dom",
          ],
          // Split TanStack Query
          "tanstack-query": ["@tanstack/react-query"],
          // Split icon library
          "icons-vendor": ["lucide-react"],
        },
      },
    },
    // Increase chunk warning limit since mapbox-gl is inherently large
    chunkSizeWarningLimit: 2000,
  },
  server: {
    host: "0.0.0.0",
    port: 5176,
    proxy: {
      "/duffel-api": {
        target: "https://api.duffel.com/air",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/duffel-api/, ""),
      },
      // ── Kiwi Tequila / Nomad — multi-city only ──────────────────────────────
      "/kiwi": {
        target: "https://api.tequila.kiwi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/kiwi/, ""),
      },
      "/search": {
        target: "http://localhost:3030",
        changeOrigin: true,
        // Booking-service mounts liteApiRoutes at /api — rewrite /search/... → /api/search/...
        rewrite: (p) => `/api${p}`,
      },
      "/route": {
        target: "http://localhost:3030",
        changeOrigin: true,
      },
      "/api": {
        target: "http://localhost:3030",
        changeOrigin: true,
      },
      // LiteAPI: hotel rates & hotel search endpoints
      // Booking-service mounts liteApiRoutes at /api, so /hotels/rates → /api/hotels/rates
      "/hotels": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (p) => `/api${p}`,
      },
      // LiteAPI: prebook & book endpoints (/rates/prebook → /api/rates/prebook)
      "/rates": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (p) => `/api${p}`,
      },
      "/bookings": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (p) => `/api${p}`,
      },
      "/duffel": {
        target: "http://localhost:3030",
        changeOrigin: true,
        rewrite: (p) => `/api${p}`,
      },
      // Static data direct access to packages/static-data running on port 3002
      "/api/static": {
        target: "http://localhost:3002",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/api\/static/, "/api"),
      },
    },
  },
});
