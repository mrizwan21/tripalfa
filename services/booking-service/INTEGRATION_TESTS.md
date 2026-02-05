Running integration tests (Redis + Neon)

This project uses Neon (hosted Postgres) for the canonical `notifications` table. The local Docker Compose here only provides Redis for BullMQ job processing.

Steps:

1) Start Redis locally via Docker Compose

```bash
cd services/booking-service
docker compose -f docker-compose.integration.yml up -d
```

2) Ensure your Neon connection string is available as `DATABASE_URL` (or `PG_CONN`). Example format:

```
postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=require
```

3) Run the integration test (this will require Redis from step 1 and a reachable Neon DB with the notifications migration applied):

```bash
cd services/booking-service
export DATABASE_URL="<your neon connection string>"
USE_DOTENV=true npm run test:server:ci
```

Notes:
- Apply the migration `database/migrations/20260129_create_notifications_table.sql` to your Neon database before running the test.

Applying the migration
----------------------

You can apply the migration in one of two ways:

- Using `psql` (recommended if available):

```bash
export DATABASE_URL="postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=require"
./scripts/apply_migration_neon.sh
```

- Using the provided Node helper (uses `pg` and Node SSL options):

```bash
export DATABASE_URL="postgres://<user>:<pass>@<host>:<port>/<db>?sslmode=require"
node src/notifications/scripts/apply_migration_neon.js
```

- The compose intentionally does not run Postgres locally — use Neon for DB to match production environment and SSL requirements.
