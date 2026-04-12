// Unified LiteAPI endpoints test
import fetch from 'node-fetch';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const BASE_URL = 'https://api.liteapi.travel/v3.0/data';
const API_KEY = process.env.LITEAPI_API_KEY;

interface EndpointResult {
    endpoint: string;
    status?: number;
    available: boolean;
    size?: number;
    duration?: number;
    records?: number;
    error: string | null;
}

class LiteAPIEndpointTester {
    async testEndpoint(endpoint: string): Promise<EndpointResult> {
        console.log(`\n🧪 Testing ${endpoint}...`);
        try {
            const url = `${BASE_URL}/${endpoint}`;
            const startTime = Date.now();

            const response = await fetch(url, {
                headers: {
                    'X-API-Key': API_KEY || '',
                },
                timeout: 30000,
            });

            const duration = Date.now() - startTime;
            const contentType = response.headers.get('content-type');
            const text = await response.text();
            const size = text.length;

            console.log(`   Status: ${response.status}`);
            console.log(`   Duration: ${duration}ms`);
            console.log(`   Content-Type: ${contentType}`);
            console.log(`   Response Size: ${size} bytes`);

            if (size === 0) {
                console.log(`   ⚠️  Empty response`);
                return {
                    endpoint,
                    status: response.status,
                    available: false,
                    size,
                    duration,
                    records: 0,
                    error: 'Empty response from API',
                };
            }

            if (text[0] !== '{') {
                console.log(`   ⚠️  Not JSON response`);
                return {
                    endpoint,
                    status: response.status,
                    available: false,
                    size,
                    duration,
                    records: 0,
                    error: 'Invalid JSON response',
                };
            }

            const data = JSON.parse(text);
            const records = Array.isArray(data.data) ? data.data.length : 0;

            console.log(`   ✅ Available`);
            console.log(`   Records: ${records}`);

            return {
                endpoint,
                status: response.status,
                available: records > 0,
                size,
                duration,
                records,
                error: null,
            };
        } catch (error) {
            console.log(`   ❌ Error: ${(error as Error).message}`);
            return {
                endpoint,
                available: false,
                error: (error as Error).message,
                records: 0,
            };
        }
    }

    async runTests(): Promise<EndpointResult[]> {
        console.log('\n🌐 LiteAPI Endpoint Test Suite\n');
        console.log(`API Key: ${API_KEY ? '✅ Configured' : '❌ Missing'}\n`);

        const endpoints = [
            'currencies',
            'airports',
            'cities',
            'facilities',
            'countries',
            'languages',
            'hoteltypes',
            'iatacodes',
        ];

        const results: EndpointResult[] = [];
        for (const endpoint of endpoints) {
            const result = await this.testEndpoint(endpoint);
            results.push(result);
            // Add delay between requests
            await new Promise(resolve => setTimeout(resolve, 500));
        }

        console.log('\n\n📊 Test Summary:\n');
        console.log('| Endpoint | Status | Records | Size | Duration | Available |');
        console.log('|----------|--------|---------|------|----------|-----------|');

        for (const result of results) {
            const status = result.status || 'N/A';
            const records = result.records || 0;
            const size = result.size ? `${(result.size / 1024).toFixed(2)}KB` : 'N/A';
            const duration = result.duration ? `${result.duration}ms` : 'N/A';
            const available = result.available ? '✅ Yes' : '❌ No';

            console.log(
                `| ${result.endpoint.padEnd(8)} | ${status} | ${records} | ${size} | ${duration} | ${available} |`
            );
        }

        console.log('\n✓ Test suite complete\n');
        return results;
    }
}

const tester = new LiteAPIEndpointTester();
tester.runTests().catch(console.error);
