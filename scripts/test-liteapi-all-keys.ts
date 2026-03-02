#!/usr/bin/env npx tsx
/**
 * LiteAPI Sandbox - Test All Discovered Keys
 *
 * Usage:
 *   pnpm dlx tsx scripts/test-liteapi-all-keys.ts
 */

import fs from "fs";
import path from "path";
import { execSync } from "child_process";

interface LiteApiKey {
  key: string;
  source: string;
  displayName: string;
}

class LiteApiMultiKeyTester {
  private keys: LiteApiKey[] = [];
  private readonly allowedKeyVariables = new Set([
    "LITEAPI_API_KEY",
    "LITEAPI_SANDBOX_API_KEY",
    "VITE_LITEAPI_TEST_API_KEY",
    "LITEAPI_PROD_API_KEY",
  ]);

  async run() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║   LiteAPI Sandbox - Comprehensive Multi-Key Test Suite   ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    this.discoverAllKeys();

    if (!this.keys.length) {
      this.showNoKeysError();
      process.exit(1);
    }

    this.displayDiscoveredKeys();
    await this.runTestsWithAllKeys();
  }

  private discoverAllKeys() {
    const unique = new Set<string>();

    const envVars = [
      "LITEAPI_API_KEY",
      "LITEAPI_SANDBOX_API_KEY",
      "VITE_LITEAPI_TEST_API_KEY",
    ];

    envVars.forEach((varName) => {
      const value = process.env[varName];
      if (value && this.isValidKey(value) && !unique.has(value)) {
        unique.add(value);
        this.keys.push({
          key: value,
          source: `env:${varName}`,
          displayName: `Environment Variable (${varName})`,
        });
      }
    });

    const secretFiles = [
      { file: "secrets/liteapi_api_key.txt", name: "Primary LiteAPI Key" },
      { file: "secrets/liteapi_sandbox_key.txt", name: "Sandbox Key" },
      { file: "secrets/liteapi_test_key.txt", name: "Test Key" },
      { file: "secrets/liteapi_key.txt", name: "LiteAPI Key" },
    ];

    secretFiles.forEach(({ file, name }) => {
      const fullPath = path.join(process.cwd(), file);
      if (!fs.existsSync(fullPath)) {
        return;
      }

      try {
        const content = fs.readFileSync(fullPath, "utf8").trim();
        if (this.isValidKey(content) && !unique.has(content)) {
          unique.add(content);
          this.keys.push({
            key: content,
            source: `file:${file}`,
            displayName: `Secrets File (${name})`,
          });
        }
      } catch {
        // Ignore bad secret file reads
      }
    });

    const envFiles = [".env", ".env.local", ".env.test", ".env.development"];

    envFiles.forEach((fileName) => {
      const filePath = path.join(process.cwd(), fileName);
      if (!fs.existsSync(filePath)) {
        return;
      }

      try {
        const content = fs.readFileSync(filePath, "utf8");
        const lines = content
          .split("\n")
          .map((line) => line.trim())
          .filter(
            (line) => line && !line.startsWith("#") && line.includes("="),
          );

        lines.forEach((line) => {
          const [key, rawValue] = line.split(/=(.*)/s);
          const variableName = String(key || "").trim();
          if (!this.allowedKeyVariables.has(variableName)) {
            return;
          }

          const value = String(rawValue || "")
            .trim()
            .replace(/^['"]|['"]$/g, "");

          if (!this.isValidKey(value) || unique.has(value)) {
            return;
          }

          unique.add(value);
          this.keys.push({
            key: value,
            source: `file:${fileName}:${variableName}`,
            displayName: `.env File (${fileName} -> ${variableName})`,
          });
        });
      } catch {
        // Ignore .env parse errors
      }
    });
  }

  private isValidKey(key: string): boolean {
    if (!key || key.length < 12) {
      return false;
    }

    const lowered = key.toLowerCase();
    if (
      lowered.includes("changeme") ||
      lowered.includes("example") ||
      lowered.includes("your_") ||
      lowered.includes("${") ||
      lowered.includes("placeholder")
    ) {
      return false;
    }

    return true;
  }

  private displayDiscoveredKeys() {
    console.log("📍 Discovered LiteAPI Keys:\n");

    this.keys.forEach((keyInfo, index) => {
      const keyMask =
        keyInfo.key.length > 14
          ? `${keyInfo.key.substring(0, 8)}...${keyInfo.key.substring(keyInfo.key.length - 4)}`
          : `${keyInfo.key.substring(0, 2)}...${keyInfo.key.substring(keyInfo.key.length - 2)}`;

      console.log(`${index + 1}. ${keyMask}`);
      console.log(`   Source: ${keyInfo.displayName}`);
    });

    console.log(`\n✓ Total: ${this.keys.length} key(s) found\n`);
  }

  private async runTestsWithAllKeys() {
    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║              RUNNING TESTS WITH ALL KEYS                 ║");
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

    for (let index = 0; index < this.keys.length; index++) {
      const keyInfo = this.keys[index];
      const keyMask =
        keyInfo.key.length > 14
          ? `${keyInfo.key.substring(0, 8)}...${keyInfo.key.substring(keyInfo.key.length - 4)}`
          : `${keyInfo.key.substring(0, 2)}...${keyInfo.key.substring(keyInfo.key.length - 2)}`;

      console.log(
        `➤ Testing with Key ${index + 1}/${this.keys.length}: ${keyMask}`,
      );
      console.log(`  Source: ${keyInfo.displayName}`);
      console.log("  Running...\n");

      const startedAt = Date.now();

      try {
        const command = `LITEAPI_API_KEY=\"${keyInfo.key}\" pnpm dlx tsx scripts/test-liteapi-direct.ts`;

        execSync(command, {
          cwd: process.cwd(),
          stdio: "pipe",
          timeout: 180000,
        });

        const duration = Date.now() - startedAt;
        results.push({
          keyIndex: index + 1,
          keyMask,
          success: true,
          duration,
        });

        console.log(`  ✓ Success in ${(duration / 1000).toFixed(2)}s\n`);
      } catch (error: any) {
        const duration = Date.now() - startedAt;
        const message = String(error?.message || "Unknown error").split(
          "\n",
        )[0];

        results.push({
          keyIndex: index + 1,
          keyMask,
          success: false,
          duration,
          error: message,
        });

        console.log(`  ✗ Failed after ${(duration / 1000).toFixed(2)}s`);
        console.log(`  Error: ${message}\n`);
      }
    }

    this.displaySummary(results);
  }

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
    console.log("║           MULTI-KEY TEST EXECUTION SUMMARY               ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    let successCount = 0;
    let failureCount = 0;
    let totalDuration = 0;

    results.forEach((result) => {
      const symbol = result.success ? "✓" : "✗";
      console.log(
        `  ${symbol} Key ${result.keyIndex}: ${result.keyMask.padEnd(22)} ${(result.duration / 1000).toFixed(2)}s`,
      );

      if (result.success) {
        successCount++;
      } else {
        failureCount++;
        if (result.error) {
          console.log(`     └─ ${result.error.substring(0, 80)}`);
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

    process.exit(failureCount > 0 ? 1 : 0);
  }

  private showNoKeysError() {
    console.log("❌ ERROR: No valid LiteAPI sandbox keys found\n");
    console.log("Set one of these values and retry:\n");
    console.log('  export LITEAPI_API_KEY="your_liteapi_key"');
    console.log('  echo "your_liteapi_key" > secrets/liteapi_api_key.txt\n');
    console.log("Then run:");
    console.log("  pnpm dlx tsx scripts/test-liteapi-direct.ts\n");
  }
}

async function main() {
  const tester = new LiteApiMultiKeyTester();
  await tester.run();
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
