import fs from 'fs';

const type = process.argv[2];

function escape(str: string | null | undefined): string {
    if (str === null || str === undefined) return 'NULL';
    return "'" + String(str).replace(/'/g, "''") + "'";
}

async function run(): Promise<void> {
    const input = fs.readFileSync(0, 'utf8');
    if (!input) return;

    const data = JSON.parse(input).data || JSON.parse(input);
    if (!Array.isArray(data)) return;

    for (const item of data) {
        if (type === 'countries') {
            console.log(`INSERT INTO shared.countries (code, name, updated_at) VALUES (${escape(item.code)}, ${escape(item.name)}, NOW()) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();`);
        } else if (type === 'hotelTypes') {
            console.log(`INSERT INTO hotel.types (id, name, updated_at) VALUES (${item.id}, ${escape(item.name)}, NOW()) ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();`);
        } else if (type === 'iataCodes') {
            console.log(`INSERT INTO hotel.iata_airports (code, name, latitude, longitude, country_code) VALUES (${escape(item.code)}, ${escape(item.name)}, ${item.latitude || 'NULL'}, ${item.longitude || 'NULL'}, ${escape(item.countryCode)}) ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, latitude = EXCLUDED.latitude, longitude = EXCLUDED.longitude, country_code = EXCLUDED.country_code;`);
        } else if (type === 'cities') {
            const countryCode = process.argv[3];
            if (item.city) {
                console.log(`INSERT INTO hotel.cities (country_code, city_name) VALUES (${escape(countryCode)}, ${escape(item.city)}) ON CONFLICT (country_code, city_name) DO NOTHING;`);
            }
        }
    }
}

run().catch(err => {
    console.error(err);
    process.exit(1);
});
