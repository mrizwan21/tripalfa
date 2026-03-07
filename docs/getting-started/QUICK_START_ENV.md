# Quick Start Environment

## Minimum Variables

Create local env file:

```bash
cp .env.example .env.local
```

Set values:

```dotenv
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=...
```

Optional:

```dotenv
STATIC_DATABASE_URL=postgresql://...
DUFFEL_API_KEY=...
LITEAPI_API_KEY=...
```

## Run

```bash
./start-all-services.sh
```

## Validate

```bash
for p in 3000 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
  printf "Checking :%s ... " "$p"
  curl -fsS "http://localhost:$p/health" >/dev/null && echo ok || echo down
done
```

## Stop

```bash
./stop-all-services.sh
```
