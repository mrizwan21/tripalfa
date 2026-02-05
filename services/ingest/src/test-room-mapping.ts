import axios from 'axios';
import * as cheerio from 'cheerio';
import { Pool } from 'pg';
import path from 'path';
import dotenv from 'dotenv';

// Load .env
dotenv.config({ path: path.resolve(__dirname, '../../../.env') });

const STATIC_DATABASE_URL = process.env.STATIC_DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/staticdatabase';

const pool = new Pool({
    connectionString: STATIC_DATABASE_URL,
});

async function testRoomExtraction(id: string) {
    console.log(`🏠 Testing Room Extraction for Hotel ID: ${id}...`);
    try {
        const url = `https://giatadrive.com/${id}?lang=en`;
        const { data } = await axios.get(url, {
            headers: {
                'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
            }
        });
        const $ = cheerio.load(data as string);

        const scripts = $('script').map((_, el) => $(el).html()).get();
        console.log(`Found ${scripts.length} script tags.`);

        const roomsToProcess: any[] = [];

        // Pattern 1: variantGroups
        const configScript = scripts.find(s => s && s.includes('variantGroups'));
        if (configScript) {
            console.log('Found variantGroups in script.');
            const match = configScript.match(/\"variantGroups\":\s*(\[.*?\]),/);
            if (match) {
                const groups = JSON.parse(match[1]);
                for (const g of groups) {
                    if (g.variants) {
                        roomsToProcess.push(...g.variants.map((v: any) => ({ name: v.label, variantId: v.variantId })));
                    }
                }
            }
        }

        // Pattern 2: property.roomTypes
        if (roomsToProcess.length === 0) {
            const propertyScript = scripts.find(s => s && (s.includes('window.property =') || s.includes('var property =')) && s.includes('roomTypes'));
            if (propertyScript) {
                console.log('Found property object with roomTypes.');
                // Use regex to extract the JSON object
                const propMatch = propertyScript.match(/(?:window\.|var\s+)property\s*=\s*({.*?});/s);
                if (propMatch) {
                    try {
                        const propertyData = JSON.parse(propMatch[1]);
                        if (propertyData.roomTypes) {
                            roomsToProcess.push(...propertyData.roomTypes);
                        }
                    } catch (e) {
                        console.log('JSON.parse failed for property object, trying fallback regex.');
                        const rtMatch = propertyScript.match(/\"roomTypes\":\s*(\[.*?\])/);
                        if (rtMatch) roomsToProcess.push(...JSON.parse(rtMatch[1]));
                    }
                } else {
                    console.log('Could not match property regex, trying fallback regex.');
                    const rtMatch = propertyScript.match(/\"roomTypes\":\s*(\[.*?\])/);
                    if (rtMatch) roomsToProcess.push(...JSON.parse(rtMatch[1]));
                }
            }
        }

        if (roomsToProcess.length > 0) {
            console.log(`🛏️ Found ${roomsToProcess.length} room types.`);
            for (const room of roomsToProcess) {
                const label = room.name || room.label;
                const features: string[] = [];
                if (label.toLowerCase().includes('balcony')) features.push('Balcony');
                if (label.toLowerCase().includes('terrace')) features.push('Terrace');
                if (label.toLowerCase().includes('view')) features.push('View');

                console.log(`  - Room: ${label} (ID: ${room.variantId})`);
                if (features.length > 0) console.log(`    Features: ${features.join(', ')}`);
            }
        } else {
            console.log('❌ Could not find any room types using known patterns.');
        }
    } catch (error: any) {
        console.error(`❌ Test failed: ${error.message}`);
    } finally {
        await pool.end();
    }
}

testRoomExtraction('119193');
