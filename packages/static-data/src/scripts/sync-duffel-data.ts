/**
 * Sync Duffel Data Script
 * =======================
 * Synchronizes flight data from Duffel API.
 * 
 * Required environment variables:
 * - DUFFEL_ACCESS_TOKEN: Your Duffel API access token
 * - DUFFEL_BASE_URL: Optional, defaults to https://api.duffel.com
 */

import { createClient } from '@duffel/api';

const DUFFEL_TOKEN = process.env.DUFFEL_ACCESS_TOKEN;
const BASE_URL = process.env.DUFFEL_BASE_URL || 'https://api.duffel.com';

if (!DUFFEL_TOKEN) {
  console.error('Error: DUFFEL_ACCESS_TOKEN environment variable is required');
  console.error('Set it with: export DUFFEL_ACCESS_TOKEN=your_token_here');
  process.exit(1);
}

const duffel = createClient({
  token: DUFFEL_TOKEN,
  baseUrl: BASE_URL,
});

async function syncFlights() {
  console.log('Starting Duffel data sync...');
  // Implementation here
}

syncFlights().catch(console.error);
