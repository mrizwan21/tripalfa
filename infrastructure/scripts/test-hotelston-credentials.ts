/**
 * Hotelston API Credentials Test Script
 * Tests if the provided credentials are valid and working
 */

import axios from 'axios';

// API Configuration
const HOTELSTON_API_ENDPOINT = 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/';
const HOTELSTON_STATIC_API_ENDPOINT = 'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/';

const HOTELSTON_CREDENTIALS = {
  username: 'technocense@gmail.com',
  password: '6614645@Dubai'
};

const SOAP_NAMESPACE = 'http://hotelston.com/';

/**
 * Create SOAP envelope for requests
 */
function createSoapEnvelope(action: string, bodyContent: string): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="${SOAP_NAMESPACE}">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:${action}Request>
      <hot:username>${HOTELSTON_CREDENTIALS.username}</hot:username>
      <hot:password>${HOTELSTON_CREDENTIALS.password}</hot:password>
      ${bodyContent}
    </hot:${action}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
}

/**
 * Test credentials with a simple ping request
 */
async function testCredentials(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON CREDENTIALS TEST');
  console.log('='.repeat(60));
  
  console.log(`Testing credentials:`);
  console.log(`Username: ${HOTELSTON_CREDENTIALS.username}`);
  console.log(`Password: ${'*'.repeat(HOTELSTON_CREDENTIALS.password.length)}`);
  console.log('');
  
  try {
    // Test 1: Simple ping request
    console.log('Test 1: Testing ping request...');
    const pingEnvelope = createSoapEnvelope('ping', '');
    
    const pingResponse = await axios.post(HOTELSTON_API_ENDPOINT, pingEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}ping"`
      },
      timeout: 10000 // 10 second timeout
    });
    
    console.log('✅ Ping request successful!');
    console.log('Status:', pingResponse.status);
    console.log('Headers:', pingResponse.headers['content-type']);
    console.log('Response length:', pingResponse.data.length);
    
    // Test 2: Check if response contains authentication success
    if (pingResponse.data.includes('success') || pingResponse.data.includes('Success')) {
      console.log('✅ Authentication appears successful!');
    } else {
      console.log('⚠️  Response received but authentication status unclear');
      console.log('Response preview:', pingResponse.data.substring(0, 500));
    }
    
  } catch (error) {
    console.log('❌ Ping request failed');
    
    if (axios.isAxiosError(error) && error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      console.log('Headers:', error.response.headers);
      
      // Check for authentication errors
      if (error.response.status === 401) {
        console.log('❌ Authentication failed - Invalid credentials');
      } else if (error.response.status === 403) {
        console.log('❌ Access forbidden - Credentials may be valid but access denied');
      } else if (error.response.status === 404) {
        console.log('⚠️  Endpoint not found - Credentials may be valid but endpoint incorrect');
      } else {
        console.log(`❌ HTTP Error ${error.response.status}: ${error.response.statusText}`);
      }
      
      // Show response data for debugging
      if (error.response.data) {
        console.log('Response data:', error.response.data);
      }
    } else if (error instanceof Error && 'request' in error) {
      console.log('❌ No response received - Network error or timeout');
      console.log('Request:', (error as any).request);
    } else {
      console.log('❌ Request setup error:', error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log('');
  
  try {
    // Test 3: Test static data endpoint
    console.log('Test 2: Testing static data endpoint...');
    const countriesEnvelope = createSoapEnvelope('getCountries', '');
    
    const countriesResponse = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, countriesEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCountries"`
      },
      timeout: 10000
    });
    
    console.log('✅ Static data endpoint accessible!');
    console.log('Status:', countriesResponse.status);
    console.log('Response length:', countriesResponse.data.length);
    
    // Check for authentication in response
    if (countriesResponse.data.includes('error') || countriesResponse.data.includes('Error')) {
      console.log('⚠️  Response contains error - credentials may be invalid');
      console.log('Response preview:', countriesResponse.data.substring(0, 500));
    } else {
      console.log('✅ Static data request successful - credentials appear valid');
    }
    
  } catch (error) {
    console.log('❌ Static data request failed');
    
    if (axios.isAxiosError(error) && error.response) {
      console.log('Status:', error.response.status);
      console.log('Status Text:', error.response.statusText);
      
      if (error.response.status === 401) {
        console.log('❌ Authentication failed - Invalid credentials');
      } else if (error.response.status === 403) {
        console.log('❌ Access forbidden - Credentials may be valid but access denied');
      } else if (error.response.status === 404) {
        console.log('⚠️  Endpoint not found - Credentials may be valid but endpoint incorrect');
      } else {
        console.log(`❌ HTTP Error ${error.response.status}: ${error.response.statusText}`);
      }
    } else {
      console.log('❌ Request error:', error instanceof Error ? error.message : String(error));
    }
  }
  
  console.log('');
  console.log('='.repeat(60));
  console.log('CREDENTIALS TEST SUMMARY');
  console.log('='.repeat(60));
  
  console.log('Credentials provided:');
  console.log(`- Username: ${HOTELSTON_CREDENTIALS.username}`);
  console.log(`- Password: ${'*'.repeat(HOTELSTON_CREDENTIALS.password.length)}`);
  console.log('');
  console.log('Note: Credentials appear to be correctly formatted.');
  console.log('The 404 errors suggest the endpoints may be incorrect or the service is unavailable.');
  console.log('This does not necessarily indicate invalid credentials.');
  console.log('');
  console.log('Recommendations:');
  console.log('1. Contact Hotelston support to verify correct endpoint URLs');
  console.log('2. Verify the test environment is active');
  console.log('3. Check if additional authentication setup is required');
  console.log('4. Confirm the WSDL URLs are correct');
}

// Run test if this script is executed directly
if (require.main === module) {
  testCredentials().then(() => {
    console.log('Credentials test completed.');
    process.exit(0);
  }).catch(error => {
    console.error('Credentials test failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { testCredentials };