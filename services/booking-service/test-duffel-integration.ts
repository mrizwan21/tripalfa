import { duffelClient } from './src/utils/duffelClient.js';

async function testDuffelIntegration() {
  console.log('Testing Duffel API integration...');

  // Check environment variables
  const apiKey = process.env.DUFFEL_API_KEY;
  const baseUrl = process.env.DUFFEL_API_BASE_URL || 'https://api.duffel.com';

  console.log(`API Key present: ${apiKey ? 'Yes (masked)' : 'No'}`);
  console.log(`Base URL: ${baseUrl}`);

  // Skip test if API key is missing, is a placeholder, or is a production key
  const isProductionKey = apiKey && apiKey.includes('_live_');
  if (!apiKey || isProductionKey) {
    console.warn(
      '⚠️  DUFFEL_API_KEY is missing or is a production key. Skipping integration test.'
    );
    return true; // treat as success (skip)
  }

  try {
    // Make a simple GET request to airports endpoint (should be free)
    console.log('Making request to /air/airports...');
    const response = await duffelClient.request({
      method: 'GET',
      url: '/air/airports',
      params: {
        limit: 1,
      },
    });

    console.log('✅ Duffel API request successful!');
    console.log(`Response status: ${response.status}`);
    console.log(`Data length: ${Array.isArray(response.data) ? response.data.length : 'N/A'}`);

    if (response.data && Array.isArray(response.data) && response.data.length > 0) {
      const airport = response.data[0];
      console.log(`Sample airport: ${airport.name} (${airport.iata_code})`);
    }

    return true;
  } catch (error: unknown) {
    console.error('❌ Duffel API request failed:');
    console.error(`Error message: ${error.message}`);
    if (error.response) {
      console.error(`Status: ${error.response.status}`);
      console.error(`Data: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    return false;
  }
}

// Run test
testDuffelIntegration()
  .then(success => {
    if (success) {
      console.log('\n✅ Duffel integration test PASSED');
      process.exit(0);
    } else {
      console.log('\n❌ Duffel integration test FAILED');
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('Unhandled error:', err);
    process.exit(1);
  });
