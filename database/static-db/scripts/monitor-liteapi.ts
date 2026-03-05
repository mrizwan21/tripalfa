#!/usr/bin/env ts-node

/**
 * monitor-liteapi.ts
 * -------------------
 * Monitor LiteAPI connectivity and diagnose timeout issues.
 */

import * as dotenv from "dotenv";
dotenv.config();

import { createLiteApiClient, get } from "./utils/http";
import { createLogger } from "./utils/logger";

const log = createLogger("Monitor");

async function testConnectivity(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) {
    log.error("LITEAPI_KEY is not set");
    process.exit(1);
  }

  const client = createLiteApiClient(apiKey);
  
  log.info("Testing LiteAPI connectivity...");
  
  try {
    // Test basic connectivity
    log.info("1. Testing countries endpoint...");
    const countries = await get<unknown[]>(client, "/data/countries");
    log.success(`Countries endpoint: ${countries.length} countries returned`);
    
    // Test a specific country
    log.info("2. Testing cities for US...");
    const cities = await get<unknown[]>(client, "/data/cities", { countryCode: "US" });
    log.success(`Cities endpoint: ${cities.length} cities returned for US`);
    
    // Test hotels endpoint
    log.info("3. Testing hotels for US (limit 10)...");
    const hotels = await get<Array<{ id: string }>>(client, "/data/hotels", {
      countryCode: "US", 
      limit: 10 
    });
    log.success(`Hotels endpoint: ${hotels.length} hotels returned for US`);
    
    // Test hotel detail
    if (hotels.length > 0) {
      const hotelId = hotels[0].id;
      log.info(`4. Testing hotel detail for ${hotelId}...`);
      const detail = await get<{ name?: string }>(client, "/data/hotel", { hotelId });
      log.success(`Hotel detail: ${detail.name ?? "(unnamed)"} details returned`);
    }
    
    log.success("All connectivity tests passed!");
    
  } catch (err) {
    log.error(`Connectivity test failed: ${(err as Error).message}`);
    
    // Additional diagnostics
    log.info("Running diagnostics...");
    
    // Check if it's a DNS issue
    if ((err as Error).message.includes("ENOTFOUND")) {
      log.error("DNS Resolution Issue: api.liteapi.travel cannot be resolved");
      log.info("Possible solutions:");
      log.info("1. Check your internet connection");
      log.info("2. Try pinging api.liteapi.travel");
      log.info("3. Check your DNS settings");
      log.info("4. Try using a different DNS server (e.g., 8.8.8.8)");
    }
    
    // Check if it's a timeout issue
    if ((err as Error).message.includes("timeout")) {
      log.error("Timeout Issue: Request timed out");
      log.info("Possible solutions:");
      log.info("1. Increase timeout settings");
      log.info("2. Check network latency");
      log.info("3. Reduce concurrency");
      log.info("4. Check API rate limits");
    }
    
    // Check if it's an authentication issue
    if ((err as Error).message.includes("401") || (err as Error).message.includes("403")) {
      log.error("Authentication Issue: Invalid API key");
      log.info("Please verify your LITEAPI_KEY is correct");
    }
    
    process.exit(1);
  }
}

async function testPerformance(): Promise<void> {
  const apiKey = process.env.LITEAPI_KEY;
  if (!apiKey) {
    log.error("LITEAPI_KEY is not set");
    return;
  }

  const client = createLiteApiClient(apiKey);
  
  log.info("Testing API performance...");
  
  const tests = [
    { name: "Countries", endpoint: "/data/countries", params: {} },
    { name: "Cities (US)", endpoint: "/data/cities", params: { countryCode: "US" } },
    { name: "Hotels (US, 10)", endpoint: "/data/hotels", params: { countryCode: "US", limit: 10 } },
  ];
  
  for (const test of tests) {
    const start = Date.now();
    try {
      const result = await get<unknown[]>(client, test.endpoint, test.params);
      const duration = Date.now() - start;
      log.info(`${test.name}: ${duration}ms (${result.length} items)`);
    } catch (err) {
      const duration = Date.now() - start;
      log.warn(`${test.name}: ${duration}ms - FAILED: ${(err as Error).message}`);
    }
  }
}

async function main(): Promise<void> {
  log.info("LiteAPI Monitor Starting...");
  
  await testConnectivity();
  await testPerformance();
  
  log.success("Monitor completed successfully!");
}

if (require.main === module) {
  main().catch((err) => {
    log.error((err as Error).message);
    process.exit(1);
  });
}