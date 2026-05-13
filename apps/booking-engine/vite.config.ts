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
        replacement: path.resolve(__dirname, "./src/components/ui"),
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
        find: /^@tripalfa\/design-tokens$/,
        replacement: path.resolve(__dirname, "../../packages/design-tokens"),
      },
      {
        find: /@tripalfa\/design-tokens\/(.*)/,
        replacement: path.resolve(__dirname, "../../packages/design-tokens/$1"),
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
      // Proxy API requests through Kong gateway (default: http://localhost:8000)
      "/api": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // User endpoints (preferences, profile, bookings)
      "/user": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // Auth endpoints
      "/auth": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // Static data endpoints
      "/static": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // Notifications endpoints
      "/notifications": {
        target: process.env.VITE_GATEWAY_URL || "http://localhost:8000",
        changeOrigin: true,
      },
      // Duffel API proxy (external supplier)
      "/duffel-api": {
        target: "https://api.duffel.com/air",
        changeOrigin: true,
        rewrite: (p) => p.replace(/^\/duffel-api/, ""),
      },
      // Kiwi Tequila / Nomad — multi-city only
      "/kiwi": {
        target: "https://api.tequila.kiwi.com",
        changeOrigin: true,
        secure: true,
        rewrite: (p) => p.replace(/^\/kiwi/, ""),
      },
    },
  },
});
