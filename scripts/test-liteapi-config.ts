#!/usr/bin/env npx tsx
/**
 * LiteAPI Sandbox Configuration Discovery
 *
 * Usage:
 *   pnpm dlx tsx scripts/test-liteapi-config.ts
 */

import fs from "fs";
import path from "path";

interface LiteApiConfig {
  apiKey: string;
  source: string;
  isLikelyValid: boolean;
}

class LiteApiConfigDiscovery {
  private configs: LiteApiConfig[] = [];
  private readonly allowedKeyVariables = new Set([
    "LITEAPI_API_KEY",
    "LITEAPI_SANDBOX_API_KEY",
    "VITE_LITEAPI_TEST_API_KEY",
    "LITEAPI_PROD_API_KEY",
  ]);

  async discoverConfigs() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║     LiteAPI Sandbox Configuration Discovery Tool          ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    this.checkEnvironmentVariables();
    this.checkSecretsDirectory();
    this.checkEnvFiles();
    this.displayResults();
  }

  private checkEnvironmentVariables() {
    const envVars = [
      "LITEAPI_API_KEY",
      "LITEAPI_SANDBOX_API_KEY",
      "VITE_LITEAPI_TEST_API_KEY",
    ];

    console.log("📍 Checking Environment Variables:");

    envVars.forEach((varName) => {
      const value = process.env[varName];
      if (value?.trim()) {
        console.log(`   ✓ Found: ${varName}`);
        this.configs.push({
          apiKey: value.trim(),
          source: `Environment Variable: ${varName}`,
          isLikelyValid: this.validateApiKey(value.trim()),
        });
      }
    });

    if (!this.configs.length) {
      console.log("   ✗ No LiteAPI keys found in environment variables");
    }
  }

  private checkSecretsDirectory() {
    console.log("\n📍 Checking Secrets Directory:");

    const secretFiles = [
      "secrets/liteapi_api_key.txt",
      "secrets/liteapi_sandbox_key.txt",
      "secrets/liteapi_test_key.txt",
      "secrets/liteapi_key.txt",
    ];

    secretFiles.forEach((relativePath) => {
      const fullPath = path.join(process.cwd(), relativePath);
      if (!fs.existsSync(fullPath)) {
        return;
      }

      try {
        const content = fs.readFileSync(fullPath, "utf8").trim();
        if (!content || content === "changeme") {
          console.log(`   ⚠ Found but empty/placeholder: ${relativePath}`);
          return;
        }

        console.log(`   ✓ Found: ${relativePath}`);
        this.configs.push({
          apiKey: content,
          source: `Secrets File: ${relativePath}`,
          isLikelyValid: this.validateApiKey(content),
        });
      } catch {
        console.log(`   ✗ Error reading: ${relativePath}`);
      }
    });
  }

  private checkEnvFiles() {
    console.log("\n📍 Checking .env Files:");

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

        const matchedLines = lines.filter((line) => {
          const [key] = line.split("=", 1);
          return this.allowedKeyVariables.has(String(key || "").trim());
        });

        if (!matchedLines.length) {
          return;
        }

        console.log(
          `   ✓ Found in ${fileName}: ${matchedLines.length} LiteAPI key value(s)`,
        );

        matchedLines.forEach((match) => {
          const keyValue = match.trim();
          const [, value] = keyValue.split("=");
          if (!value?.trim()) {
            return;
          }

          const normalized = value.trim().replace(/^['"]|['"]$/g, "");
          if (!normalized || normalized === "changeme") {
            return;
          }

          const isLikelyValid = this.validateApiKey(normalized);
          if (!isLikelyValid) {
            return;
          }

          this.configs.push({
            apiKey: normalized,
            source: `.env File: ${fileName}`,
            isLikelyValid,
          });
        });
      } catch {
        // Ignore .env read issues
      }
    });
  }

  private validateApiKey(apiKey: string): boolean {
    if (!apiKey || apiKey.length < 12) {
      return false;
    }

    const lower = apiKey.toLowerCase();
    if (
      lower.includes("changeme") ||
      lower.includes("example") ||
      lower.includes("your_") ||
      lower.includes("${") ||
      lower.includes("placeholder")
    ) {
      return false;
    }

    return /^[a-z0-9_\-.]+$/i.test(apiKey);
  }

  private displayResults() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║                    DISCOVERY RESULTS                     ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    const uniqueConfigs = [
      ...new Map(this.configs.map((cfg) => [cfg.apiKey, cfg])).values(),
    ];

    if (!uniqueConfigs.length) {
      console.log("❌ No LiteAPI sandbox key found\n");
      this.showSetupInstructions();
      return;
    }

    console.log(`✓ Found ${uniqueConfigs.length} LiteAPI key(s):\n`);

    uniqueConfigs.forEach((cfg, index) => {
      const masked =
        cfg.apiKey.length > 14
          ? `${cfg.apiKey.substring(0, 8)}...${cfg.apiKey.substring(cfg.apiKey.length - 4)}`
          : `${cfg.apiKey.substring(0, 2)}...${cfg.apiKey.substring(cfg.apiKey.length - 2)}`;

      const sources = this.configs
        .filter((c) => c.apiKey === cfg.apiKey)
        .map((c) => c.source)
        .join(", ");

      console.log(`${index + 1}. ${masked}`);
      console.log(`   Source: ${sources}`);
      console.log(
        `   Status: ${cfg.isLikelyValid ? "✓ Likely valid" : "⚠ Verify key format"}`,
      );
      console.log();
    });

    const key = uniqueConfigs[0].apiKey;
    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║                      NEXT STEPS                          ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );
    console.log("Run hotel E2E flow tests with discovered key:\n");
    console.log(
      `  LITEAPI_API_KEY=\"${key}\" pnpm dlx tsx scripts/test-liteapi-direct.ts\n`,
    );
    console.log("Run all discovered keys:\n");
    console.log("  pnpm dlx tsx scripts/test-liteapi-all-keys.ts\n");
    console.log("Verbose mode:\n");
    console.log(
      `  LITEAPI_API_KEY=\"${key}\" VERBOSE=true pnpm dlx tsx scripts/test-liteapi-direct.ts\n`,
    );
  }

  private showSetupInstructions() {
    console.log("📖 Setup Instructions:\n");
    console.log("1. Get LiteAPI sandbox credentials from LiteAPI dashboard.");
    console.log("2. Save your key using one of the following options:\n");
    console.log("   Option A - Environment Variable:");
    console.log('   export LITEAPI_API_KEY="your_liteapi_sandbox_key"');
    console.log();
    console.log("   Option B - Secrets File:");
    console.log(
      '   echo "your_liteapi_sandbox_key" > secrets/liteapi_api_key.txt',
    );
    console.log();
    console.log("   Option C - .env File:");
    console.log('   echo "LITEAPI_API_KEY=your_liteapi_sandbox_key" >> .env');
    console.log();
    console.log("3. Validate and run E2E tests:");
    console.log("   pnpm dlx tsx scripts/test-liteapi-config.ts");
    console.log("   pnpm dlx tsx scripts/test-liteapi-direct.ts");
  }
}

async function main() {
  const discovery = new LiteApiConfigDiscovery();
  await discovery.discoverConfigs();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
