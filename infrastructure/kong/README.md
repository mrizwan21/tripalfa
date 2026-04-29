# Kong Gateway (Local Deployment)

This repository does not deploy Kong via Docker/compose.

Kong is expected to run locally on your machine, and this project provides:

- Wicked-style API definitions under `infrastructure/wicked-config/apis`
- Route mapping catalog under `infrastructure/wicked-config/routes/platform-core-routes.json`
- Generated Kong declarative config at `infrastructure/kong/kong.yml`

## Build Kong Config from Wicked Catalog

```bash
pnpm gateway:preflight
pnpm gateway:build
pnpm gateway:verify-routes
```

## Start/Stop Local Kong

```bash
pnpm gateway:start
pnpm gateway:status
pnpm gateway:stop
```

## Load/Refresh Config in Running Kong

Kong runs in DB-less mode with Admin API `http://localhost:8001`:

```bash
bash tools/scripts/bin/gateway_sync_local.sh
```

Optional environment overrides:

- `KONG_ADMIN_URL`
- `KONG_CONFIG_FILE`

If `kong` is not installed on your machine, install Kong Gateway first, then run `pnpm gateway:start`.
If Homebrew formula availability is limited, use the official Kong installation instructions:
[Kong Install Guide](https://developer.konghq.com/gateway/install/?install=oss).
