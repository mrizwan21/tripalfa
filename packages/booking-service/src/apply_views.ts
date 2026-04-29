import pg from 'pg';
import * as dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const { Client } = pg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load env
dotenv.config({ path: join(__dirname, '../../../.env') });

async function applyViews() {
    // Use DIRECT_DATABASE_URL and explicitly enable SSL as required by Neon
    const connectionString = process.env.DIRECT_DATABASE_URL;

    if (!connectionString) {
        console.error('DIRECT_DATABASE_URL not found');
        process.exit(1);
    }

    console.log(`Connecting to: ${connectionString.split('@')[1]}`);

    const client = new Client({
        connectionString: connectionString,
        ssl: {
            rejectUnauthorized: false // Required for Neon in some environments
        }
    });

    try {
        await client.connect();
        console.log('Connected. Applying dashboard analytics views...');

        await client.query(`
      CREATE OR REPLACE VIEW dashboard_metrics AS
      SELECT 
          (SELECT COUNT(*) FROM rule_executions WHERE started_at > NOW() - INTERVAL '24 hours') as total_requests,
          (SELECT 
              CASE 
                  WHEN COUNT(*) = 0 THEN '0%'
                  ELSE CONCAT(ROUND(COUNT(CASE WHEN status = 'completed' THEN 1 END)::numeric / COUNT(*) * 100, 1), '%')
              END
           FROM rule_executions WHERE started_at > NOW() - INTERVAL '24 hours') as success_rate,
          (SELECT CONCAT(ROUND(AVG(duration), 0), 'ms') FROM rule_executions WHERE started_at > NOW() - INTERVAL '24 hours') as avg_response_time,
          (SELECT COUNT(*) FROM rule_executions WHERE status = 'error' AND started_at > NOW() - INTERVAL '24 hours') as error_count,
          (SELECT COUNT(*) FROM rules WHERE enabled = true) as active_rules;
    `);

        await client.query(`
      CREATE OR REPLACE VIEW request_trends AS
      SELECT 
          date_trunc('hour', started_at) as hour,
          COUNT(*) as count
      FROM rule_executions
      WHERE started_at > NOW() - INTERVAL '24 hours'
      GROUP BY 1
      ORDER BY 1;
    `);

        console.log('Views applied successfully!');
    } catch (error) {
        console.error('Error applying views:', error);
        process.exit(1);
    } finally {
        await client.end();
    }
}

applyViews();
