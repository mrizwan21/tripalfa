/**
 * Hotelston API Integration
 * SOAP-based API client for Hotelston hotel booking service
 */

import axios from 'axios';

// API Configuration
const HOTELSTON_API_ENDPOINT = 'https://dev.hotelston.com/ws/HotelServiceV2/HotelServiceHttpSoap11Endpoint/';
const HOTELSTON_STATIC_API_ENDPOINT = 'https://dev.hotelston.com/ws/StaticDataServiceV2/StaticDataServiceHttpSoap11Endpoint/';

const HOTELSTON_CREDENTIALS = {
  username: 'technocense@gmail.com',
  password: '6614645@Dubai'
};

// SOAP Namespace
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
function parseSoapResponse(response: string): any {
  // Simple XML parsing for SOAP response
  const xml = response;

  // Extract the response content between the actionResponse tags
  const responseMatch = xml.match(new RegExp(`<hot:.*Response>(.*?)</hot:.*Response>`, 's'));
  if (!responseMatch) {
    throw new Error('Invalid SOAP response format');
  }

  // Extract individual elements
  const result: any = {};
  const elementRegex = /<hot:(\w+)>(.*?)<\/hot:\1>/g;
  let match;

  while ((match = elementRegex.exec(responseMatch[1])) !== null) {
    const [, key, value] = match;
    result[key] = value;
  }

  return result;
}

// Static Data API Functions

/**
 * Get list of countries
 */
export async function getCountries() {
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getCountries', soapBody);

    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCountries"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Get countries error:', error);
    throw error;
  }
}

/**
 * Get list of cities
 */
export async function getCities() {
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getCities', soapBody);

    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getCities"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Get cities error:', error);
    throw error;
  }
}

/**
 * Get list of hotels
 */
export async function getHotels() {
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getHotels', soapBody);

    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotels"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Get hotels error:', error);
    throw error;
  }
}

/**
 * Get hotel details by ID
 */
export async function getHotelDetails(hotelId: string) {
  try {
    const soapBody = `<hot:hotelId>${hotelId}</hot:hotelId>`;
    const envelope = createSoapEnvelope('getHotelDetails', soapBody);

    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelDetails"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Get hotel details error:', error);
    throw error;
  }
}

/**
 * Get hotel rooms by hotel ID
 */
export async function getHotelRooms(hotelId: string) {
  try {
    const soapBody = `<hot:hotelId>${hotelId}</hot:hotelId>`;
    const envelope = createSoapEnvelope('getHotelRooms', soapBody);

    const response = await axios.post(HOTELSTON_STATIC_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelRooms"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Get hotel rooms error:', error);
    throw error;
  }
}

// Hotel Search and Booking API Functions

/**
 * Search for hotels
 */
export async function searchHotels(params: {
  destination: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  currency?: string;
}) {
  try {
    const soapBody = `
      <hot:destination>${params.destination}</hot:destination>
      <hot:checkIn>${params.checkIn}</hot:checkIn>
      <hot:checkOut>${params.checkOut}</hot:checkOut>
      <hot:adults>${params.adults}</hot:adults>
      <hot:children>${params.children || 0}</hot:children>
      <hot:rooms>${params.rooms || 1}</hot:rooms>
      <hot:currency>${params.currency || 'USD'}</hot:currency>
    `;

    const envelope = createSoapEnvelope('searchHotels', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}searchHotels"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Hotel search error:', error);
    throw error;
  }
}

/**
 * Get hotel availability
 */
export async function getHotelAvailability(hotelId: string, params: {
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
}) {
  try {
    const soapBody = `
      <hot:hotelId>${hotelId}</hot:hotelId>
      <hot:checkIn>${params.checkIn}</hot:checkIn>
      <hot:checkOut>${params.checkOut}</hot:checkOut>
      <hot:adults>${params.adults}</hot:adults>
      <hot:children>${params.children || 0}</hot:children>
      <hot:rooms>${params.rooms || 1}</hot:rooms>
    `;

    const envelope = createSoapEnvelope('getHotelAvailability', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getHotelAvailability"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Hotel availability error:', error);
    throw error;
  }
}

/**
 * Hold a hotel room
 */
export async function holdHotelRoom(params: {
  hotelId: string;
  roomId: string;
  checkIn: string;
  checkOut: string;
  adults: number;
  children?: number;
  rooms?: number;
  guestDetails: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
  };
}) {
  try {
    const soapBody = `
      <hot:hotelId>${params.hotelId}</hot:hotelId>
      <hot:roomId>${params.roomId}</hot:roomId>
      <hot:checkIn>${params.checkIn}</hot:checkIn>
      <hot:checkOut>${params.checkOut}</hot:checkOut>
      <hot:adults>${params.adults}</hot:adults>
      <hot:children>${params.children || 0}</hot:children>
      <hot:rooms>${params.rooms || 1}</hot:rooms>
      <hot:guestDetails>
        <hot:firstName>${params.guestDetails.firstName}</hot:firstName>
        <hot:lastName>${params.guestDetails.lastName}</hot:lastName>
        <hot:email>${params.guestDetails.email}</hot:email>
        <hot:phone>${params.guestDetails.phone}</hot:phone>
      </hot:guestDetails>
    `;

    const envelope = createSoapEnvelope('holdHotelRoom', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}holdHotelRoom"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Hotel hold error:', error);
    throw error;
  }
}

/**
 * Confirm a hotel booking
 */
export async function confirmHotelBooking(params: {
  holdId: string;
  paymentDetails: {
    paymentMethod: 'credit_card' | 'wallet';
    amount: number;
    currency: string;
    cardToken?: string;
  };
}) {
  try {
    const soapBody = `
      <hot:holdId>${params.holdId}</hot:holdId>
      <hot:paymentDetails>
        <hot:paymentMethod>${params.paymentDetails.paymentMethod}</hot:paymentMethod>
        <hot:amount>${params.paymentDetails.amount}</hot:amount>
        <hot:currency>${params.paymentDetails.currency}</hot:currency>
        ${params.paymentDetails.cardToken ? `<hot:cardToken>${params.paymentDetails.cardToken}</hot:cardToken>` : ''}
      </hot:paymentDetails>
    `;

    const envelope = createSoapEnvelope('confirmHotelBooking', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}confirmHotelBooking"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Hotel confirmation error:', error);
    throw error;
  }
}

/**
 * Get booking details
 */
export async function getBookingDetails(bookingId: string) {
  try {
    const soapBody = `<hot:bookingId>${bookingId}</hot:bookingId>`;
    const envelope = createSoapEnvelope('getBookingDetails', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getBookingDetails"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Booking details error:', error);
    throw error;
  }
}

/**
 * Cancel a booking
 */
export async function cancelBooking(bookingId: string, reason?: string) {
  try {
    const soapBody = `
      <hot:bookingId>${bookingId}</hot:bookingId>
      <hot:reason>${reason || 'Customer request'}</hot:reason>
    `;

    const envelope = createSoapEnvelope('cancelBooking', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}cancelBooking"`
      }
    }) as any;

    return parseSoapResponse(response.data);
  } catch (error) {
    console.error('Booking cancellation error:', error);
    throw error;
  }
}

// Utility Functions

/**
 * Format date for Hotelston API (YYYY-MM-DD)
 */
export function formatDate(date: Date): string {
  return date.toISOString().split('T')[0];
}

/**
 * Format currency with symbol
 */
export function formatCurrency(amount: number, currency: string = 'USD'): string {
  const currencySymbols: Record<string, string> = {
    'USD': '$',
    'EUR': '€',
    'GBP': '£',
    'AED': 'د.إ',
    'INR': '₹',
  };

  const symbol = currencySymbols[currency] || currency;
  return `${symbol}${amount.toLocaleString()}`;
}

/**
 * Test connection to Hotelston API
 */
export async function testConnection(): Promise<any> {
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('ping', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}ping"`
      }
    });

    const result: any = parseSoapResponse(response.data as string);
    return { success: true, message: 'Connection successful', data: result };
  } catch (error) {
    console.error('Connection test failed:', error);
    return { success: false, error: error };
  }
}

/**
 * Get API status
 */
export async function getApiStatus() {
  try {
    const soapBody = '';
    const envelope = createSoapEnvelope('getApiStatus', soapBody);

    const response = await axios.post(HOTELSTON_API_ENDPOINT, envelope, {
      headers: {
        'Content-Type': 'text/xml; charset=utf-8',
        'SOAPAction': `"${SOAP_NAMESPACE}getApiStatus"`
      }
    });

    return parseSoapResponse(response.data as string);
  } catch (error) {
    console.error('API status error:', error);
    throw error;
  }
}