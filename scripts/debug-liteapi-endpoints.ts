// Debugging LiteAPI endpoints
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';
const endpoints = ['hoteltypes', 'languages', 'countries', 'iatacodes'];

async function testEndpoint(endpoint: string): Promise<void> {
    console.log(`\n🔍 Testing ${endpoint}...`);
    try {
        const url = `${BASE_URL}/${endpoint}`;
        console.log(`   URL: ${url}`);

        const response = await fetch(url, {
            headers: {
                'X-API-Key': process.env.LITEAPI_API_KEY || '',
                'Accept': 'application/json',
            },
            // @ts-expect-error - node-fetch timeout option
            timeout: 30000,
        });

        console.log(`   Status: ${response.status}`);
        console.log(`   Content-Type: ${response.headers.get('content-type')}`);

        const text = await response.text();
        console.log(`   Response Length: ${text.length} bytes`);
        console.log(`   First 200 chars: ${text.substring(0, 200)}`);

        if (text.length > 0 && text[0] === '{') {
            try {
                const json = JSON.parse(text);
                console.log(`   Parsed JSON keys: ${Object.keys(json).join(', ')}`);
                if (json.data) {
                    console.log(`   Data type: ${Array.isArray(json.data) ? 'Array' : typeof json.data}`);
                    if (Array.isArray(json.data)) {
                        console.log(`   Data length: ${json.data.length}`);
                    }
                }
            } catch (e) {
                console.log(`   JSON parse error: ${(e as Error).message}`);
            }
        }
    } catch (error) {
        console.log(`   ✗ Error: ${(error as Error).message}`);
    }
}

async function run(): Promise<void> {
    console.log('🌐 LiteAPI Endpoint Debug\n');
    console.log(`API Key present: ${process.env.LITEAPI_API_KEY ? 'Yes' : 'No'}`);

    for (const endpoint of endpoints) {
        await testEndpoint(endpoint);
    }
}

run().catch(console.error);
