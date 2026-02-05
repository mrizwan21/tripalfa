import axios from 'axios';

const GATEWAY_URL = 'http://localhost:3000'; // Test Gateway directly first

async function testFlightSearch() {
    console.log('--- Testing Flight Search (Duffel Sandbox) ---');
    try {
        const response = await axios.post(`${GATEWAY_URL}/route`, {
            intent: 'READ_REALTIME',
            body: {
                provider: 'duffel',
                origin: 'LHR',
                destination: 'JFK',
                departureDate: '2026-05-20',
                slices: [
                    {
                        origin: 'LHR',
                        destination: 'JFK',
                        departure_date: '2026-05-20'
                    }
                ],
                passengers: [{ type: 'adult' }]
            },
            meta: { adapter: 'duffel' }
        });

        console.log(`Flight Search Status: ${response.status}`);
        const flights = Array.isArray(response.data) ? response.data : [];
        console.log(`Results Count: ${flights.length}`);
        if (flights.length > 0) {
            console.log(`Sample Flight: ${flights[0].airline} - ${flights[0].amount} ${flights[0].currency}`);
        }
        if (response.data.results && response.data.results.length > 0) {
            console.log('Sample Result:', JSON.stringify(response.data.results[0], null, 2));
        }
    } catch (error: any) {
        console.error('Flight Search Failed:', error.response?.data || error.message);
    }
}

// Define HotelResult type for better type safety
interface HotelResult {
    id: string;
    name: string;
    location: string;
    price: number;
    currency: string;
    rating: number;
    image: string;
    description: string;
}

// Helper function to map LiteAPI v3.0 response to HotelResult[]
function mapLiteApiHotelResponse(data: any): HotelResult[] {
    // v3.0 response might be in data.hotels or similar
    const hotels = data.data?.hotels || data.hotels || (Array.isArray(data) ? data : []);
    if (!Array.isArray(hotels)) return [];

    return hotels.map((hotel: any) => ({
        id: hotel.id || hotel.hotelId,
        name: hotel.name,
        location: hotel.city || hotel.location?.city || 'Unknown',
        price: hotel.price || hotel.rates?.[0]?.price || 0,
        currency: hotel.currency || hotel.rates?.[0]?.currency || 'USD',
        rating: hotel.rating || hotel.stars || 0,
        image: hotel.image || hotel.main_photo || hotel.images?.[0] || '',
        description: hotel.description || ''
    }));
}

async function testHotelSearch() {
    console.log('\n--- Testing Hotel Search (LiteAPI Sandbox) ---');
    try {
        const response = await axios.post(`${GATEWAY_URL}/route`, {
            intent: 'READ_REALTIME',
            body: {
                provider: 'liteapi',
                location: 'London',
                checkin: '2026-06-01',
                checkout: '2026-06-05',
                adults: 2,
                children: 0,
                currency: 'USD'
            },
            meta: { adapter: 'liteapi' }
        });

        console.log(`Hotel Search Status: ${response.status}`);
        // Use the mapping function for LiteAPI v3.0 response
        const hotels = mapLiteApiHotelResponse(response.data);
        console.log(`Results Count: ${hotels.length}`);
        if (hotels.length > 0) {
            console.log(`Sample Hotel: ${hotels[0].name} - ${hotels[0].price} ${hotels[0].currency}`);
        }
        // Keep original logging for 'results' property if it exists
        if (response.data.results && response.data.results.length > 0) {
            console.log('Sample Result (raw):', JSON.stringify(response.data.results[0], null, 2));
        }
    } catch (error: any) {
        console.error('Hotel Search Failed:', error.response?.data || error.message);
    }
}

async function runTests() {
    await testFlightSearch();
    await testHotelSearch();
}

runTests();
