import 'dotenv/config';
import liteApiClient from './src/services/LiteAPIClient';

async function diag() {
    console.log('Testing getCities for US...');
    const cities = await liteApiClient.getCities('US', 5, 0);
    console.log('US Cities Count:', cities.length);
    if (cities.length > 0) {
        console.log('First US City structure:', JSON.stringify(cities[0], null, 2));
    }

    console.log('\nTesting getCities for AR...');
    const arCities = await liteApiClient.getCities('AR', 5, 0);
    console.log('AR Cities Count:', arCities.length);
    if (arCities.length > 0) {
        console.log('First AR City structure:', JSON.stringify(arCities[0], null, 2));
    }
}

diag().catch(console.error);
