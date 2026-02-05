/**
 * Hotelston API Test Script
 * Tests the Hotelston SOAP API integration
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
 * Parse SOAP response
 */
function parseSoapResponse(response: string): Record<string, string> {
  const xml = response;
  
  // Extract the response content between the actionResponse tags
  const responseMatch = xml.match(new RegExp(`<hot:.*Response>(.*?)</hot:.*Response>`, 's'));
  if (!responseMatch) {
    throw new Error('Invalid SOAP response format');
  }
  
  // Extract individual elements
  const result: Record<string, string> = {};
  const elementRegex = /<hot:(\w+)>(.*?)<\/hot:\1>/g;
  let match;
  
  while ((match = elementRegex.exec(responseMatch[1])) !== null) {
    const [, key, value] = match;
    result[key] = value;
  }
  
  return result;
}

/**
 * Test connection to Hotelston API
 */
async function testConnection(): Promise<{
  success: boolean;
  message: string;
  data?: Record<string, string>;
  error?: string;
}> {
  console.log('Testing Hotelston API connection...');
  
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('ping', soapBody);
    
    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}ping"`
      }
    });
    
    console.log('Connection test successful!');
    console.log('Response:', response.data);
    
    const result = parseSoapResponse(response.data);
    console.log('Parsed result:', result);
    
    return { success: true, message: 'Connection successful', data: result };
  } catch (error) {
    console.error('Connection test failed:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    return { success: false, message: 'Connection test failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Test static data API
 */
async function testStaticData(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  console.log('\nTesting Hotelston Static Data API...');
  
  try {
    // Test getCountries
    console.log('Testing getCountries...');
    const countriesEnvelope = createSoapEnvelope('getCountries', '');
    
    const countriesResponse = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, countriesEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCountries"`
      }
    });
    
    console.log('Countries response:', countriesResponse.data);
    
    // Test getCities
    console.log('Testing getCities...');
    const citiesEnvelope = createSoapEnvelope('getCities', '');
    
    const citiesResponse = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, citiesEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCities"`
      }
    });
    
    console.log('Cities response:', citiesResponse.data);
    
    // Test getHotels
    console.log('Testing getHotels...');
    const hotelsEnvelope = createSoapEnvelope('getHotels', '');
    
    const hotelsResponse = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, hotelsEnvelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotels"`
      }
    });
    
    console.log('Hotels response:', hotelsResponse.data);
    
    return { success: true, message: 'Static data tests completed' };
  } catch (error) {
    console.error('Static data test failed:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    return { success: false, message: 'Static data test failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Test hotel search API
 */
async function testHotelSearch(): Promise<{
  success: boolean;
  message: string;
  error?: string;
}> {
  console.log('\nTesting Hotelston Hotel Search API...');
  
  try {
    const soapBody = `
      <hot:destination>Dubai</hot:destination>
      <hot:checkIn>2026-03-01</hot:checkIn>
      <hot:checkOut>2026-03-05</hot:checkOut>
      <hot:adults>2</hot:adults>
      <hot:children>0</hot:children>
      <hot:rooms>1</hot:rooms>
      <hot:currency>USD</hot:currency>
    `;
    
    const envelope = createSoapEnvelope('searchHotels', soapBody);
    
    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}searchHotels"`
      }
    });
    
    console.log('Hotel search response:', response.data);
    
    return { success: true, message: 'Hotel search test completed' };
  } catch (error) {
    console.error('Hotel search test failed:', error instanceof Error ? error.message : String(error));
    if (axios.isAxiosError(error) && error.response) {
      console.error('Status:', error.response.status);
      console.error('Headers:', error.response.headers);
      console.error('Data:', error.response.data);
    }
    return { success: false, message: 'Hotel search test failed', error: error instanceof Error ? error.message : String(error) };
  }
}

/**
 * Run all tests
 */
async function runTests(): Promise<Array<{
  test: string;
  success: boolean;
  message: string;
  error?: string;
  data?: Record<string, string>;
}>> {
  console.log('='.repeat(50));
  console.log('HOTELSTON API INTEGRATION TESTS');
  console.log('='.repeat(50));
  
  const results: Array<{
    test: string;
    success: boolean;
    message: string;
    error?: string;
    data?: Record<string, string>;
  }> = [];
  
  // Test 1: Connection
  const connectionResult = await testConnection();
  results.push({ test: 'Connection Test', ...connectionResult });
  
  // Test 2: Static Data
  const staticDataResult = await testStaticData();
  results.push({ test: 'Static Data Test', ...staticDataResult });
  
  // Test 3: Hotel Search
  const hotelSearchResult = await testHotelSearch();
  results.push({ test: 'Hotel Search Test', ...hotelSearchResult });
  
  // Summary
  console.log('\n' + '='.repeat(50));
  console.log('TEST SUMMARY');
  console.log('='.repeat(50));
  
  results.forEach((result, index) => {
    console.log(`${index + 1}. ${result.test}: ${result.success ? 'PASSED' : 'FAILED'}`);
    if (!result.success) {
      console.log(`   Error: ${result.error}`);
    }
  });
  
  const passedTests = results.filter(r => r.success).length;
  console.log(`\nTotal Tests: ${results.length}, Passed: ${passedTests}, Failed: ${results.length - passedTests}`);
  
  return results;
}

// Run tests if this script is executed directly
if (require.main === module) {
  runTests().then(results => {
    const allPassed = results.every(r => r.success);
    process.exit(allPassed ? 0 : 1);
  }).catch(error => {
    console.error('Test execution failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { runTests, testConnection, testStaticData, testHotelSearch };