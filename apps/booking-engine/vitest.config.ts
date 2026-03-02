import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import path from "path";
import { fileURLToPath } from "url";

const dirname = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react() as any],
  test: {
    globals: true,
    environment: "jsdom",
    setupFiles: ["./src/__tests__/setup.ts"],
    coverage: {
      provider: "v8",
      reporter: ["text", "json", "html"],
      exclude: [
        "node_modules/",
        "src/__tests__/",
        "**/*.test.ts",
        "**/*.test.tsx",
        "**/*.spec.ts",
        "**/*.spec.tsx",
      ],
    },
    include: [
      "src/**/*.test.ts",
      "src/**/*.test.tsx",
      "src/**/*.spec.ts",
      "src/**/*.spec.tsx",
    ],
    pool: "forks",
  },
  resolve: {
    alias: {
      "@tripalfa/shared-utils": path.resolve(
        dirname,
        "../../packages/shared-utils",
      ),
      // @tripalfa/static-data removed - static data now comes from LiteAPI
      "lucide-react": path.resolve(
        dirname,
        "./src/__tests__/mocks/lucide-react.ts",
      ),
    },
  },
});
