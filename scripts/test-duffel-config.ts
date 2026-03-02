#!/usr/bin/env npx tsx
/**
 * Duffel API Test Configuration & Runner
 *
 * Helps find available Duffel API keys and run comprehensive tests
 *
 * Usage:
 *   pnpm dlx tsx scripts/test-duffel-config.ts
 */

import fs from "fs";
import path from "path";

// ============================================================================
// CONFIGURATION DISCOVERY
// ============================================================================

interface DuffelConfig {
  apiKey: string;
  source: string;
  isValid: boolean;
}

class DuffelConfigDiscovery {
  private configs: DuffelConfig[] = [];

  /**
   * Try to find all available Duffel API keys
   */
  async discoverConfigs() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log(
      "║      Duffel API Configuration Discovery Tool              ║",
    );
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    // 1. Check environment variables
    this.checkEnvironmentVariables();

    // 2. Check secrets file
    this.checkSecretsFile();

    // 3. Check .env file
    this.checkEnvFile();

    // Display results
    this.displayResults();
  }

  private checkEnvironmentVariables() {
    const envVars = [
      "DUFFEL_API_KEY",
      "DUFFEL_TEST_TOKEN",
      "DUFFEL_TOKEN",
      "DUFFEL_SANDBOX_TOKEN",
    ];

    console.log("📍 Checking Environment Variables:");

    envVars.forEach((varName) => {
      const value = process.env[varName];
      if (value) {
        console.log(`   ✓ Found: ${varName}`);
        this.configs.push({
          apiKey: value,
          source: `Environment Variable: ${varName}`,
          isValid: this.validateApiKey(value),
        });
      }
    });

    if (this.configs.length === 0) {
      console.log(`   ✗ No Duffel API keys found in environment variables`);
    }
  }

  private checkSecretsFile() {
    console.log("\n📍 Checking Secrets Directory:");

    const secretFiles = [
      "secrets/duffel_api_key.txt",
      "secrets/duffel_test_key.txt",
      "secrets/duffel_sandbox_key.txt",
    ];

    secretFiles.forEach((filePath) => {
      const fullPath = path.join(process.cwd(), filePath);
      if (fs.existsSync(fullPath)) {
        try {
          const content = fs.readFileSync(fullPath, "utf-8").trim();
          if (content && content !== "changeme" && content.length > 10) {
            console.log(`   ✓ Found: ${filePath}`);
            this.configs.push({
              apiKey: content,
              source: `Secrets File: ${filePath}`,
              isValid: this.validateApiKey(content),
            });
          } else {
            console.log(`   ⚠ Found but empty/placeholder: ${filePath}`);
          }
        } catch (error) {
          console.log(`   ✗ Error reading: ${filePath}`);
        }
      }
    });
  }

  private checkEnvFile() {
    console.log("\n📍 Checking .env Files:");

    const envFiles = [".env", ".env.local", ".env.test", ".env.development"];

    envFiles.forEach((fileName) => {
      const filePath = path.join(process.cwd(), fileName);
      if (fs.existsSync(filePath)) {
        try {
          const content = fs.readFileSync(filePath, "utf-8");
          const matches = content.match(/DUFFEL_[A-Z_]+=([^\n]+)/g);

          if (matches && matches.length > 0) {
            console.log(
              `   ✓ Found in ${fileName}: ${matches.length} Duffel configuration(s)`,
            );

            matches.forEach((match) => {
              const [, value] = match.split("=");
              if (value && value.trim() && value.length > 10) {
                this.configs.push({
                  apiKey: value.trim(),
                  source: `.env File: ${fileName}`,
                  isValid: this.validateApiKey(value.trim()),
                });
              }
            });
          }
        } catch (error) {
          // Ignore read errors
        }
      }
    });
  }

  private validateApiKey(key: string): boolean {
    // Duffel API keys typically start with "duffel_"
    return (
      key.startsWith("duffel_") ||
      (key.length > 30 && !key.includes("changeme"))
    );
  }

  private displayResults() {
    console.log(
      "\n╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║                    DISCOVERY RESULTS                     ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    const uniqueKeys = [...new Set(this.configs.map((c) => c.apiKey))];

    if (uniqueKeys.length === 0) {
      console.log("❌ No valid Duffel API keys found\n");
      this.showSetupInstructions();
    } else {
      console.log(`✓ Found ${uniqueKeys.length} Duffel API Key(s):\n`);

      uniqueKeys.forEach((key, index) => {
        const masked = `${key.substring(0, 15)}...${key.substring(key.length - 5)}`;
        const sources = this.configs
          .filter((c) => c.apiKey === key)
          .map((c) => c.source)
          .join(", ");

        console.log(`${index + 1}. ${masked}`);
        console.log(`   Source: ${sources}`);
        console.log(
          `   Status: ${this.configs.find((c) => c.apiKey === key)?.isValid ? "✓ Valid" : "⚠ May be invalid"}`,
        );
        console.log();
      });

      this.showTestOptions(uniqueKeys);
    }
  }

  private showSetupInstructions() {
    console.log("📖 Setup Instructions:\n");
    console.log("1. Get a Duffel API Key:");
    console.log("   - Visit: https://duffel.com");
    console.log("   - Sign up for an account");
    console.log("   - Go to Settings → API Tokens");
    console.log("   - Create a new token");
    console.log();

    console.log("2. Save the API Key:");
    console.log("   Option A: Environment Variable");
    console.log('   export DUFFEL_API_KEY="duffel_test_..."');
    console.log();
    console.log("   Option B: Secrets File");
    console.log('   echo "duffel_test_..." > secrets/duffel_api_key.txt');
    console.log();
    console.log("   Option C: .env File");
    console.log('   echo "DUFFEL_API_KEY=duffel_test_..." >> .env');
    console.log();

    console.log("3. Run Tests:");
    console.log("   pnpm dlx tsx scripts/test-duffel-direct.ts");
    console.log();
  }

  private showTestOptions(apiKeys: string[]) {
    console.log(
      "╔═══════════════════════════════════════════════════════════╗",
    );
    console.log("║                  TEST OPTIONS                            ║");
    console.log(
      "╚═══════════════════════════════════════════════════════════╝\n",
    );

    console.log("Run tests with discovered API key:\n");
    console.log(
      `  DUFFEL_API_KEY="${apiKeys[0]}" pnpm dlx tsx scripts/test-duffel-direct.ts\n`,
    );

    if (apiKeys.length > 1) {
      console.log("Run tests with all discovered API keys sequentially:\n");
      console.log(`  pnpm dlx tsx scripts/test-duffel-all-keys.ts\n`);
    }

    console.log("Run tests with verbose output:\n");
    console.log(
      `  DUFFEL_API_KEY="${apiKeys[0]}" VERBOSE=true pnpm dlx tsx scripts/test-duffel-direct.ts\n`,
    );

    console.log("Options:");
    console.log("  • DUFFEL_API_KEY  : Specify which API key to use");
    console.log("  • VERBOSE         : Enable verbose logging");
    console.log();
  }
}

// ============================================================================
// MAIN
// ============================================================================

async function main() {
  const discovery = new DuffelConfigDiscovery();
  await discovery.discoverConfigs();
}

main().catch((error) => {
  console.error("Error:", error);
  process.exit(1);
});
