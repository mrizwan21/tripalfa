import { FullConfig } from "@playwright/test";

async function globalTeardown(config: FullConfig) {
  console.log("Starting global teardown for E2E tests...");

  try {
    // Clean up any test artifacts if needed
    const fs = require("fs");
    const path = require("path");

    // Clean up temporary files
    const tempDir = path.join(__dirname, "../temp");
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
      console.log("Cleaned up temporary files");
    }

    // Clean up test results if running in CI
    if (process.env.CI) {
      const testResultsDir = path.join(__dirname, "../test-results");
      if (fs.existsSync(testResultsDir)) {
        // Keep only the latest results, remove old ones
        const files: string[] = fs.readdirSync(testResultsDir);
        const oldFiles = files.filter(
          (file: string) => file.includes("old") || file.includes("temp"),
        );
        oldFiles.forEach((file: string) => {
          fs.unlinkSync(path.join(testResultsDir, file));
        });
        console.log("Cleaned up old test results");
      }
    }

    console.log("Global teardown completed successfully");
  } catch (error) {
    console.error("Global teardown failed:", error);
    // Don't throw error in teardown to avoid breaking the test run
  }
}

export default globalTeardown;
