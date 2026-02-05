import cron from 'node-cron';
import {
    ingestLiteAPIHotels,
    ingestAmadeusBulk,
    ingestOpenExchangeCurrencies,
    ingestDuffelAirports,
    ingestDuffelAirlines,
    ingestDuffelAircraft,
    ingestLiteAPIChains,
    ingestLiteAPIStaticExtras
} from './static-importer';
import { ingestGiataHotels as _ingestGiataHotels } from './giata-importer';

console.log('⏰ Static Data Scheduler Started...');

// 1. Weekly Hotel Update (De-duplication happens inside ingestLiteAPIHotels)
// Run every Sunday at 00:00
cron.schedule('0 0 * * 0', async () => {
    console.log('[Scheduler] Starting Weekly Hotel Ingestion...');
    try {
        await ingestLiteAPIChains();
        await ingestLiteAPIStaticExtras();
        await ingestLiteAPIHotels();

        console.log('[Scheduler] Starting Weekly GIATA Ingestion...');
        await _ingestGiataHotels();

        console.log('[Scheduler] Weekly Hotel & GIATA Ingestion Complete.');
    } catch (error: any) {
        console.error('[Scheduler] Weekly Ingestion Failed:', error.message);
    }
});

// 2. Monthly Flight Update
// Run on the 1st of every month at 00:00
cron.schedule('0 0 1 * *', async () => {
    console.log('[Scheduler] Starting Monthly Flight Data Ingestion...');
    try {
        await ingestOpenExchangeCurrencies();
        await ingestDuffelAirports();
        await ingestDuffelAirlines();
        await ingestDuffelAircraft();
        await ingestAmadeusBulk();
        console.log('[Scheduler] Monthly Flight Data Ingestion Complete.');
    } catch (error: any) {
        console.error('[Scheduler] Monthly Flight Data Ingestion Failed:', error.message);
    }
});

console.log('✅ Cron generic schedules:');
console.log('   - Hotels: Weekly (Sunday 00:00)');
console.log('   - Flights: Monthly (1st of month 00:00)');
