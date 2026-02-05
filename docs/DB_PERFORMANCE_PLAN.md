Connection (PgBouncer)
- DSN: postgres://postgres:postgres@127.0.0.1:6432/staticdatabase
- Pooling: transaction mode
- Recommended: use prepared statements; avoid session-level SETs

App rollout
- Set DATABASE_URL=postgres://postgres:postgres@127.0.0.1:6432/staticdatabase
- Point all services to port 6432 instead of 5432

Benchmark plan
- Warm up with typical workload
- Collect slow queries:
  - psql -h 127.0.0.1 -p 6432 -U postgres -d staticdatabase -c "SELECT queryid,calls,round(total_exec_time::numeric,2) AS total_ms,round(mean_exec_time::numeric,2) AS mean_ms,rows,substring(query,1,300) AS query FROM pg_stat_statements ORDER BY total_exec_time DESC LIMIT 20;"
- Analyze candidate queries (copy query text):
  - EXPLAIN (ANALYZE, BUFFERS, VERBOSE) ...
- Index tuning guidance:
  - Ensure FK columns are indexed on child tables
  - Create composite indexes on frequently filtered/sorted columns
- Verify improvements:
  - Compare EXPLAIN ANALYZE costs/time before/after
  - Re-run pg_stat_statements and compare mean/total times

PgBouncer admin checks
- SHOW DATABASES; SHOW POOLS;
- RELOAD to apply config changes

Caching strategy (reads)
- Use Redis (localhost:6379) for hot, stable reads with TTL
- Invalidate keys on write/update to keep cache coherent

Notes
- statement_timeout=5s, idle_in_transaction_session_timeout=30s are enabled to prevent stalls
- Telemetry: pg_stat_statements + auto_explain configured