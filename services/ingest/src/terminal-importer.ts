import * as fs from 'fs';
import * as path from 'path';

// Manual .env parsing
function getEnv(): Record<string, string> {
    const envDocs: Record<string, string> = {};
    const possiblePaths = ['.env', '../.env', '../../.env', '../../../.env'];
    for (const p of possiblePaths) {
        if (fs.existsSync(p)) {
            try {
                const envFile = fs.readFileSync(p, 'utf8');
                envFile.split('\n').forEach(line => {
                    const parts = line.split('=');
                    if (parts.length >= 2) {
                        const key = parts[0].trim();
                        const value = parts.slice(1).join('=').trim();
                        if (key && value) envDocs[key] = value;
                    }
                });
                return envDocs; // Found one, return
            } catch (e) { }
        }
    }
    return envDocs;
}

const env = getEnv();
const SQL_FILE = path.resolve(__dirname, '../../terminals.sql');

async function main() {
    console.log('Generating terminals.sql...');
    const stream = fs.createWriteStream(SQL_FILE, { flags: 'w' });

    // Mock Data
    const terminalsMock = [
        { code: 'LHR', terminals: ['Terminal 2', 'Terminal 3', 'Terminal 4', 'Terminal 5'] },
        { code: 'JFK', terminals: ['Terminal 1', 'Terminal 4', 'Terminal 5', 'Terminal 7', 'Terminal 8'] },
        { code: 'DXB', terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3'] },
        { code: 'SIN', terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3', 'Terminal 4'] },
        { code: 'HND', terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3'] },
        { code: 'CDG', terminals: ['Terminal 1', 'Terminal 2A', 'Terminal 2B', 'Terminal 2C', 'Terminal 2D', 'Terminal 2E', 'Terminal 2F', 'Terminal 2G', 'Terminal 3'] },
        { code: 'AMS', terminals: ['Main Terminal'] },
        { code: 'FRA', terminals: ['Terminal 1', 'Terminal 2'] },
        { code: 'IST', terminals: ['Main Terminal'] },
        { code: 'LAX', terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3', 'Terminal 4', 'Terminal 5', 'Terminal 6', 'Terminal 7', 'Terminal 8', 'B'] },
        { code: 'ATL', terminals: ['Domestic Terminal', 'International Terminal'] },
        { code: 'PEK', terminals: ['Terminal 2', 'Terminal 3'] },
        { code: 'ORD', terminals: ['Terminal 1', 'Terminal 2', 'Terminal 3', 'Terminal 5'] },
        { code: 'DFW', terminals: ['Terminal A', 'Terminal B', 'Terminal C', 'Terminal D', 'Terminal E'] },
        { code: 'CAN', terminals: ['Terminal 1', 'Terminal 2'] },
        { code: 'PVG', terminals: ['Terminal 1', 'Terminal 2'] }
    ];

    stream.write('BEGIN;\n');

    for (const item of terminalsMock) {
        // We will do a subquery insert to avoid needing DB connection here
        // INSERT INTO airport_terminals ... SELECT id FROM airports WHERE iata_code = ...

        for (const termName of item.terminals) {
            const safeName = termName.replace(/'/g, "''");
            const sql = `
            INSERT INTO airport_terminals (airport_id, name, created_at, updated_at, is_active)
            SELECT id, '${safeName}', NOW(), NOW(), true
            FROM airports WHERE iata_code = '${item.code}'
            ON CONFLICT (airport_id, name) DO NOTHING;
            `;
            stream.write(sql);
        }
    }

    stream.write('COMMIT;\n');
    stream.end();
    console.log(`Generated SQL at ${SQL_FILE}`);
}

main().catch(err => console.error(err));
