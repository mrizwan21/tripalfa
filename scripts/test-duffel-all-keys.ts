#!/usr/bin/env npx tsx
/**
 * Duffel API - Test All Keys
 *
 * Discovers all available Duffel API keys and runs comprehensive tests
 * for each one
 *
 * Usage:
 *   pnpm dlx tsx scripts/test-duffel-all-keys.ts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

// ============================================================================
// CONFIGURATION DISCOVERY
// ============================================================================

interface DuffelKey {
  key: string;
  source: string;
  displayName: string;
}

class DuffelMultiKeyTester {
  private keys: DuffelKey[] = [];

  /**
   * Main entry point
   */
  async run() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║    Duffel API - Comprehensive Multi-Key Test Suite        ║",
    );
    console.log(
      "║                                                           ║",
    );
    console.log("║  Testing all booking flows with all available API keys   ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    // Step 1: Discover API keys
    this.discoverAllKeys();

    if (this.keys.length === 0) {
      this.showNoKeysError();
      process.exit(1);
    }

    // Step 2: Display discovered keys
    this.displayDiscoveredKeys();

    // Step 3: Run tests with each key
    await this.runTestsWithAllKeys();
  }

  /**
   * Discover all available Duffel API keys
   */
  private discoverAllKeys() {
    const keys = new Set<string>();

    // Check environment variables
    const envVars = [
      "DUFFEL_API_KEY",
      "DUFFEL_TEST_TOKEN",
      "DUFFEL_TOKEN",
      "DUFFEL_SANDBOX_TOKEN",
    ];

    envVars.forEach((varName) => {
      const value = process.env[varName];
      if (value && this.isValidKey(value)) {
        keys.add(value);
        this.keys.push({
          key: value,
          source: `env:${varName}`,
          displayName: `Environment Variable (${varName})`,
        });
      }
    });

    // Check secrets directory
    const secretFiles = [
      { file: "secrets/duffel_api_key.txt", name: "Primary Key" },
      { file: "secrets/duffel_test_key.txt", name: "Test Key" },
      { file: "secrets/duffel_sandbox_key.txt", name: "Sandbox Key" },
    ];

    secretFiles.forEach(({ file, name }) => {
      const fullPath = path.join(process.cwd(), file);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8").trim();
          if (this.isValidKey(content) && !keys.has(content)) {
            keys.add(content);
            this.keys.push({
              key: content,
              source: `file:${file}`,
              displayName: `Secrets File (${name})`,
            });
          }
        } catch (error) {
          // Ignore errors
        }
      }
    });

    // Remove duplicates
    const uniqueKeys = Array.from(keys).map((key) => {
      const match = this.keys.find((k) => k.key === key);
      return match || { key, source: "unknown", displayName: "Unknown Source" };
    });

    this.keys = uniqueKeys;
  }

  /**
   * Validate API key format
   */
  private isValidKey(key: string): boolean {
    if (!key || typeof key !== "string") return false;
    return (
      key.startsWith("duffel_") ||
      (key.length > 30 && !key.includes("changeme"))
    );
  }

  /**
   * Display discovered keys
   */
  private displayDiscoveredKeys() {
    console.log("📍 Discovered API Keys:\n");

    this.keys.forEach((keyInfo, index) => {
      const masked = `${keyInfo.key.substring(0, 15)}...${keyInfo.key.substring(keyInfo.key.length - 5)}`;
      console.log(`${index + 1}. ${masked}`);
      console.log(`   Source: ${keyInfo.displayName}`);
    });

    console.log(`\n✓ Total: ${this.keys.length} API Key(s) found\n`);
  }

  /**
   * Run tests with all discovered keys
   */
  private async runTestsWithAllKeys() {
    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║              RUNNING TESTS WITH ALL KEYS                  ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    const results: Array<{
      keyIndex: number;
      keyMask: string;
      success: boolean;
      duration: number;
      error?: string;
    }> = [];

    for (let i = 0; i < this.keys.length; i++) {
      const keyInfo = this.keys[i];
      const keyMask = `${keyInfo.key.substring(0, 15)}...${keyInfo.key.substring(keyInfo.key.length - 5)}`;

      console.log(
        `\n➤ Testing with Key ${i + 1}/${this.keys.length}: ${keyMask}`,
      );
      console.log(`  Source: ${keyInfo.displayName}`);
      console.log("  Running...\n");

      const startTime = Date.now();

      try {
        // Run the direct test script with this API key
        const command = `DUFFEL_API_KEY="${keyInfo.key}" pnpm dlx tsx scripts/test-duffel-direct.ts`;

        execSync(command, {
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 120000, // 2 minutes timeout
        });

        const duration = Date.now() - startTime;

        console.log(`  ✓ Success in ${(duration / 1000).toFixed(2)}s\n`);

        results.push({
          keyIndex: i + 1,
          keyMask,
          success: true,
          duration,
        });
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const errorMsg = error.message || "Unknown error";

        console.log(`  ✗ Failed after ${(duration / 1000).toFixed(2)}s`);
        console.log(`  Error: ${errorMsg.split("\n")[0]}\n`);

        results.push({
          keyIndex: i + 1,
          keyMask,
          success: false,
          duration,
          error: errorMsg,
        });
      }
    }

    // Display summary
    this.displaySummary(results);
  }

  /**
   * Display test summary
   */
  private displaySummary(
    results: Array<{
      keyIndex: number;
      keyMask: string;
      success: boolean;
      duration: number;
      error?: string;
    }>,
  ) {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║           MULTI-KEY TEST EXECUTION SUMMARY                ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    console.log("Results by API Key:\n");

    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    results.forEach((result) => {
      const symbol = result.success ? "✓" : "✗";
      console.log(
        `  ${symbol} Key ${result.keyIndex}: ${result.keyMask.padEnd(30)} ${(result.duration / 1000).toFixed(2)}s`,
      );

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (result.error) {
          const errorLine = result.error.split("\n")[0].substring(0, 60);
          console.log(`     └─ ${errorLine}...`);
        }
      }

      totalDuration += result.duration;
    });

    console.log(
      "\n─────────────────────────────────────────────────────────────",
    );
    console.log(`Total Keys Tested: ${results.length}`);
    console.log(`✓ Successful: ${successCount}`);
    console.log(`✗ Failed: ${failureCount}`);
    console.log(`Total Duration: ${(totalDuration / 1000).toFixed(2)}s`);
    console.log(
      "─────────────────────────────────────────────────────────────\n",
    );

    if (failureCount === 0) {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║   ALL TESTS PASSED WITH ALL API KEYS SUCCESSFULLY ✓      ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(0);
    } else if (successCount > 0) {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        `║   ${successCount}/${results.length} API KEYS PASSED                              ║`,
      );
      console.log(
        "║   Check logs above for failing keys                      ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(1);
    } else {
      console.log(
        "╔═══════════════════════════════════════════════════════════╗",
      );
      console.log(
        "║   ALL TESTS FAILED - CHECK CONFIGURATION                 ║",
      );
      console.log(
        "╚═══════════════════════════════════════════════════════════╝\n",
      );
      process.exit(1);
    }
  }

  /**
   * Show error when no keys found
   */
  private showNoKeysError() {
    console.log("❌ ERROR: No valid Duffel API keys found\n");
    console.log("Please set up at least one API key:\n");
    console.log("1. Get a test token from: https://duffel.com/dashboard");
    console.log("2. Save it using one of these methods:\n");
    console.log("   Option A - Environment Variable:");
    console.log('   export DUFFEL_API_KEY="duffel_test_..."');
    console.log();
    console.log("   Option B - Secrets File:");
    console.log('   echo "duffel_test_..." > secrets/duffel_api_key.txt');
    console.log();
    console.log("3. Run tests:");
    console.log("   pnpm dlx tsx scripts/test-duffel-direct.ts");
    console.log();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const tester = new DuffelMultiKeyTester();
  await tester.run();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
