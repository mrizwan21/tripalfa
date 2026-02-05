/**
 * Hotelston WSDL Analysis Script
 * Attempts to access and analyze Hotelston WSDL files to understand API structure
 */

import axios from 'axios';

// API Endpoints to test
const ENDPOINTS_TO_TEST = [
  'https://dev.hotelston.com/ws/HotelServiceV2?wsdl',
  'https://dev.hotelston.com/ws/StaticDataServiceV2?wsdl',
  'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/',
  'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/',
  'https://dev.hotelston.com/ws/',
  'https://dev.hotelston.com/',
  'https://dev.hotelston.com/api/',
  'https://dev.hotelston.com/api/v1/',
  'https://dev.hotelston.com/api/v2/',
];

/**
 * Test WSDL access
 */
async function testWSDLAccess(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON WSDL ACCESS TEST');
  console.log('='.repeat(60));
  
  console.log('Testing various endpoint URLs...\n');
  
  for (const endpoint of ENDPOINTS_TO_TEST) {
    try {
      console.log(`Testing: ${endpoint}`);
      
      const response = await axios.get(endpoint, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
        }
      });
      
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log(`   Content-Type: ${response.headers['content-type']}`);
      console.log(`   Content-Length: ${response.headers['content-length'] || 'unknown'}`);
      
      // Check if it's WSDL content
      if (response.data.includes('wsdl:') || response.data.includes('definitions')) {
        console.log('   📋 WSDL Content Detected');
        console.log('   Preview:', response.data.substring(0, 200) + '...');
      } else if (response.data.includes('soap:') || response.data.includes('Envelope')) {
        console.log('   📋 SOAP Content Detected');
        console.log('   Preview:', response.data.substring(0, 200) + '...');
      } else {
        console.log('   📋 HTML/Text Content');
        console.log('   Preview:', response.data.substring(0, 200) + '...');
      }
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(`❌ FAILED - Status: ${error.response.status} ${error.response.statusText}`);
        if (error.response.status === 404) {
          console.log('   ⚠️  Endpoint not found');
        } else if (error.response.status === 401) {
          console.log('   🔒 Authentication required');
        } else if (error.response.status === 403) {
          console.log('   🚫 Access forbidden');
        }
      } else if (error instanceof Error && 'request' in error) {
        console.log('❌ FAILED - No response received (network error)');
      } else {
        console.log(`❌ FAILED - Request setup error: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

/**
 * Test SOAP operations with different action names
 */
async function testSOAPActions(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON SOAP ACTIONS TEST');
  console.log('='.repeat(60));
  
  const endpoint = 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/';
  const credentials = {
    username: 'technocense@gmail.com',
    password: '6614645@Dubai'
  };
  
  const soapNamespace = 'http://hotelston.com/';
  
  // Common SOAP action names to test
  const actionsToTest = [
    'ping',
    'getApiStatus',
    'getCountries',
    'getCities',
    'getHotels',
    'searchHotels',
    'getHotelDetails',
    'getHotelAvailability',
    'holdHotelRoom',
    'confirmHotelBooking',
    'getBookingDetails',
    'cancelBooking'
  ];
  
  for (const action of actionsToTest) {
    try {
      console.log(`Testing SOAP action: ${action}`);
      
      const soapBody = `
        <hot:username>${credentials.username}</hot:username>
        <hot:password>${credentials.password}</hot:password>
      `;
      
      const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="${soapNamespace}">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:${action}Request>
      ${soapBody}
    </hot:${action}Request>
  </soapenv:Body>
</soapenv:Envelope>`;
      
      const response = await axios.post(endpoint, envelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"${soapNamespace}${action}"`
        },
        timeout: 10000
      });
      
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log('   Response preview:', response.data.substring(0, 300) + '...');
      
      // Check for authentication success
      if (response.data.includes('success') || response.data.includes('Success')) {
        console.log('   ✅ Authentication appears successful!');
      } else if (response.data.includes('error') || response.data.includes('Error')) {
        console.log('   ⚠️  Response contains error');
      }
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(`❌ FAILED - Status: ${error.response.status} ${error.response.statusText}`);
        if (error.response.status === 404) {
          console.log('   ⚠️  Operation not found - action name may be incorrect');
        } else if (error.response.status === 401) {
          console.log('   🔒 Authentication failed');
        } else if (error.response.status === 500) {
          console.log('   💥 Server error - action may be valid but server issue');
        }
      } else {
        console.log('❌ FAILED - Network error');
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

/**
 * Test with different SOAP namespaces
 */
async function testSOAPNamespaces(): Promise<void> {
  console.log('='.repeat(60));
  console.log('HOTELSTON SOAP NAMESPACE TEST');
  console.log('='.repeat(60));
  
  const endpoint = 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/';
  const credentials = {
    username: 'technocense@gmail.com',
    password: '6614645@Dubai'
  };
  
  // Common SOAP namespaces to test
  const namespacesToTest = [
    'http://hotelston.com/',
    'http://hotelston.com/ws/',
    'http://hotelston.com/HotelService/',
    'http://hotelston.com/StaticDataService/',
    'http://schemas.xmlsoap.org/soap/envelope/',
    'http://schemas.xmlsoap.org/wsdl/',
    'http://schemas.xmlsoap.org/wsdl/soap/',
    'http://tempuri.org/'
  ];
  
  for (const namespace of namespacesToTest) {
    try {
      console.log(`Testing namespace: ${namespace}`);
      
      const soapBody = `
        <hot:username>${credentials.username}</hot:username>
        <hot:password>${credentials.password}</hot:password>
      `;
      
      const envelope = `<?xml version="1.0" encoding="UTF-8"?>
<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:hot="${namespace}">
  <soapenv:Header/>
  <soapenv:Body>
    <hot:pingRequest>
      ${soapBody}
    </hot:pingRequest>
  </soapenv:Body>
</soapenv:Envelope>`;
      
      const response = await axios.post(endpoint, envelope, {
        headers: {
          'Content-Type': 'text/xml; charset=utf-8',
          'SOAPAction': `"${namespace}ping"`
        },
        timeout: 10000
      });
      
      console.log(`✅ SUCCESS - Status: ${response.status}`);
      console.log('   Response preview:', response.data.substring(0, 300) + '...');
      
    } catch (error) {
      if (axios.isAxiosError(error) && error.response) {
        console.log(`❌ FAILED - Status: ${error.response.status} ${error.response.statusText}`);
      } else {
        console.log('❌ FAILED - Network error');
      }
    }
    
    console.log(''); // Empty line for readability
  }
}

/**
 * Run all tests
 */
async function runAllTests(): Promise<void> {
  try {
    await testWSDLAccess();
    await testSOAPActions();
    await testSOAPNamespaces();
    
    console.log('='.repeat(60));
    console.log('TEST SUMMARY');
    console.log('='.repeat(60));
    console.log('All tests completed. Review the output above for:');
    console.log('1. Working WSDL endpoints');
    console.log('2. Valid SOAP actions');
    console.log('3. Correct namespace usage');
    console.log('');
    console.log('If all tests failed with 404 errors, the API may be:');
    console.log('- Temporarily unavailable');
    console.log('- Using different endpoint URLs');
    console.log('- Requiring additional authentication setup');
    console.log('- Located on a different domain');
    
  } catch (error) {
    console.error('Test execution failed:', error instanceof Error ? error.message : String(error));
  }
}

// Run tests if this script is executed directly
if (require.main === module) {
  runAllTests().then(() => {
    console.log('\nWSDL analysis completed.');
    process.exit(0);
  }).catch(error => {
    console.error('WSDL analysis failed:', error instanceof Error ? error.message : String(error));
    process.exit(1);
  });
}

export { testWSDLAccess, testSOAPActions, testSOAPNamespaces, runAllTests };