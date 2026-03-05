#!/usr/bin/env ts-node

/**
 * test-network.ts
 * -----------------
 * Test network connectivity and DNS resolution for LiteAPI.
 */

import { execSync } from "child_process";
import { createLogger } from "./utils/logger";

const log = createLogger("NetworkTest");

function runCommand(command: string, description: string): string {
  try {
    log.info(`Running: ${description}`);
    const result = execSync(command, { encoding: "utf8", timeout: 10000 });
    log.success(`${description}: SUCCESS`);
    return result;
  } catch (err) {
    log.error(`${description}: FAILED - ${(err as Error).message}`);
    return "";
  }
}

async function testDNSResolution(): Promise<void> {
  log.info("Testing DNS resolution for api.liteapi.travel...");
  
  // Test with nslookup
  runCommand("nslookup api.liteapi.travel", "DNS lookup with nslookup");
  
  // Test with dig
  runCommand("dig api.liteapi.travel", "DNS lookup with dig");
  
  // Test with ping
  runCommand("ping -c 3 api.liteapi.travel", "Ping test");
  
  // Test with curl
  runCommand("curl -I --connect-timeout 10 https://api.liteapi.travel", "HTTP connectivity test");
}

async function testNetworkSettings(): Promise<void> {
  log.info("Testing network settings...");
  
  // Show current DNS servers
  runCommand("scutil --dns | grep 'nameserver' | head -5", "Current DNS servers");
  
  // Show network interfaces
  runCommand("ifconfig | grep 'inet ' | head -5", "Network interfaces");
  
  // Test with Google DNS
  log.info("Testing with Google DNS (8.8.8.8)...");
  runCommand("nslookup api.liteapi.travel 8.8.8.8", "DNS lookup with Google DNS");
}

async function main(): Promise<void> {
  log.info("Network Connectivity Test Starting...");
  
  await testDNSResolution();
  await testNetworkSettings();
  
  log.info("Network test completed. Check the output above for any issues.");
  log.info("If DNS resolution fails, try:");
  log.info("1. Switching to Google DNS (8.8.8.8, 8.8.4.4)");
  log.info("2. Checking your firewall settings");
  log.info("3. Contacting your network administrator");
}

if (require.main === module) {
  main().catch((err) => {
    log.error((err as Error).message);
    process.exit(1);
  });
}