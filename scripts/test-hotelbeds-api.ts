/**
 * Test script to verify Hotelbeds API credentials
 * Usage: npx tsx scripts/test-hotelbeds-api.ts
 */

import 'dotenv/config';
import axios from 'axios';
import crypto from 'crypto';

function generateSignature(apiKey: string, apiSecret: string): string {
  const timestamp = Math.floor(Date.now() / 1000);
  const toHash = apiKey + apiSecret + timestamp;
  return crypto.createHash('sha256').update(toHash).digest('hex');
}

async function testCredentialSet(key: string | undefined, secret: string | undefined, name: string) {
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Testing ${name}`);
  console.log(`${'='.repeat(50)}\n`);

  if (!key || !secret) {
    console.log(`❌ ${name}: Credentials not set`);
    return false;
  }

  try {
    const signature = generateSignature(key, secret);
    const BASE_URL = process.env.HOTELBEDS_BASE_URL || 'https://api.hotelbeds.com/hotel-api/1.0';

    const response = await axios.get(`${BASE_URL}/hotels`, {
      params: {
        page: 1,
        hotelsPerPage: 1,
        language: 'ENG',
      },
      headers: {
        'Api-Key': key,
        'X-Signature': signature,
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    console.log(`✅ ${name}: SUCCESS!`);
    console.log(`   Total hotels: ${response.data.hotels?.total || 'N/A'}`);
    console.log(`   Environment: ${response.data.auditData?.environment || 'N/A'}`);
    return true;
  } catch (error: unknown) {
    const axiosError = error as { response?: { status?: number; data?: unknown } };
    console.log(`❌ ${name}: Failed`);
    console.log(`   Status: ${axiosError.response?.status || 'Unknown'}`);
    console.log(`   Error: ${JSON.stringify(axiosError.response?.data || error)}`);
    return false;
  }
}

async function main() {
  console.log('Testing all Hotelbeds API credentials...\n');

  const results = [
    await testCredentialSet(
      process.env.HOTELBEDS_API_KEY,
      process.env.HOTELBEDS_API_SECRET,
      'Primary Credentials (API_KEY)'
    ),
    await testCredentialSet(
      process.env.HOTELBEDS_API_KEY_2,
      process.env.HOTELBEDS_API_SECRET_2,
      'Secondary Credentials (API_KEY_2)'
    ),
    await testCredentialSet(
      process.env.HOTELBEDS_API_KEY_3,
      process.env.HOTELBEDS_API_SECRET_3,
      'Tertiary Credentials (API_KEY_3)'
    ),
  ];

  const working = results.filter(r => r).length;
  console.log(`\n${'='.repeat(50)}`);
  console.log(`Summary: ${working} of ${results.length} credential sets working`);
  console.log(`${'='.repeat(50)}\n`);

  if (working === 0) {
    console.log('⚠️  None of the Hotelbeds API credentials are working.');
    console.log('Please check:');
    console.log('  1. API keys are valid and not expired');
    console.log('  2. API has permissions for the hotels endpoint');
    console.log('  3. Contact Hotelbeds to enable API access');
  }
}

main();
