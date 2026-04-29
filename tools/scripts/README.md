# Curated Scripts

Legacy script sprawl has been removed. This folder now keeps only current operational scripts.

## Structure

- `bin/`: runnable shell wrappers.
- `db/`: SQL/bootstrap/verification scripts for frontend app databases.
- `gateway/`: build tooling for Kong config from Wicked definitions.
- `static/`: static-data related utilities (do not run against frontend app DBs).

## Key commands

- `bash tools/scripts/bin/verify_databases.sh`
- `bash tools/scripts/bin/health_check.sh`
- `pnpm gateway:build`
- `pnpm gateway:preflight`
- `pnpm gateway:verify-routes`
- `pnpm gateway:start`
- `pnpm gateway:status`
- `pnpm gateway:stop`
- `bash tools/scripts/bin/gateway_sync_local.sh`
- `node tools/scripts/static/fix-static-data-import.js`
