#!/usr/bin/env node

/**
 * Debug script to examine Innstant Travel API response structure
 */

import fetch from 'node-fetch';

// Innstant Travel API Configuration
const INNSTANT_API_KEY = '$2y$10$yWot7dUYoc7.viH8vK1s0OG.D0n5uKm19Z84WznDiB.ESBnPOikr6';
const INNSTANT_BASE_URL = 'https://static-data.innstant-servers.com';

const ENDPOINTS = [
  '/airports',
  '/airlines', 
  '/countries',
  '/cities',
  '/currencies',
  '/hotel-chains',
  '/hotel-facilities',
  '/hotel-types',
  '/loyalty-programs'
];

async function debugAPI(): Promise<void> {
  console.log('🔍 Debugging Innstant Travel API Response Structure\n');

  for (const endpoint of ENDPOINTS) {
    console.log(`📡 Testing ${endpoint}...`);
    
    try {
      const response = await fetch(`${INNSTANT_BASE_URL}${endpoint}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${INNSTANT_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        console.log(`❌ HTTP ${response.status}: ${response.statusText}\n`);
        continue;
      }

      const data = await response.json();
      console.log(`✅ Response received (${JSON.stringify(data).length} bytes)`);
      console.log(`📋 Data type: ${typeof data}`);
      console.log(`📋 Data keys: ${Object.keys(data).join(', ')}`);
      
      // Show first few items if it's an array
      if (Array.isArray(data)) {
        console.log(`📋 Array length: ${data.length}`);
        if (data.length > 0) {
          console.log(`📋 First item keys: ${Object.keys(data[0]).join(', ')}`);
        }
      } else if (typeof data === 'object' && data !== null) {
        // Show keys of the object
        for (const [key, value] of Object.entries(data)) {
          console.log(`📋 ${key}: ${typeof value} (${Array.isArray(value) ? value.length : 'object'})`);
          if (Array.isArray(value) && value.length > 0) {
            console.log(`📋   First ${key} item keys: ${Object.keys(value[0]).join(', ')}`);
          }
        }
      }
      
      console.log('');
    } catch (error) {
      console.log(`❌ Error: ${error instanceof Error ? error.message : String(error)}\n`);
    }
  }
}

debugAPI().catch(console.error);