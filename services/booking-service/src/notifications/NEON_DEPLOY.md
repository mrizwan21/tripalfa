Neon deployment notes for the Notifications worker

Quick summary
- This worker expects a Postgres connection string in `DATABASE_URL`.
- For Neon (hosted Postgres), set `USE_NEON=true` or `PGSSLMODE=require`.
- Ensure Redis connection env vars (`REDIS_HOST`, `REDIS_PORT`) point to a managed Redis instance accessible from the worker.

Environment variables
- `DATABASE_URL` - the Neon connection string (preferred).
- `USE_NEON=true` - optional shortcut to enable SSL options for Neon.
- `PGSSLMODE=require` - alternative way to enable TLS.
- `REDIS_HOST`, `REDIS_PORT` - BullMQ connection.
- `NOTIFICATIONS_MAX_ATTEMPTS` - optional override for retry attempts.

Applying DB migration on Neon
1. Obtain the Neon connection string (connection URI) from the Neon dashboard.
2. Use psql or your migration tool on CI to run the SQL migration in `database/migrations/20260129_create_notifications_table.sql`.

Example (psql):

```bash
# using psql with Neon connection string
export DATABASE_URL="<your-neon-connection-string>"
# if using psql you may need to set PGSSLMODE=require
export PGSSLMODE=require
psql "$DATABASE_URL" -f database/migrations/20260129_create_notifications_table.sql
```

Notes
- Neon requires TLS; the worker sets `ssl: { rejectUnauthorized: false }` when `USE_NEON=true` or `PGSSLMODE=require` or the connection string contains `neon`.
- For production, prefer using a managed Redis (and configure network rules) and run the worker in the same region for low latency.
