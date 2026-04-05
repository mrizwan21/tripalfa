# TripAlfa Setup

## 1. Prerequisites

- Node.js 18+
- `pnpm`

## 2. Install Dependencies

```bash
pnpm install
```

## 3. Configure Environment

```bash
cp .env.example .env.local
```

Set at least:

```dotenv
DATABASE_URL=postgresql://...
DIRECT_DATABASE_URL=postgresql://...
JWT_SECRET=...
```

## 4. Start Local Stack

```bash
./start-all-services.sh
```

## 5. Verify

```bash
for p in 3000 3001 3003 3006 3007 3008 3009 3010 3011 3012 3020 3021; do
  printf "Checking :%s ... " "$p"
  curl -fsS "http://localhost:$p/health" >/dev/null && echo ok || echo down
done
```

Expected primary endpoints:

- `http://localhost:5173`
- `http://localhost:5174`

## 6. Stop Stack

```bash
./stop-all-services.sh
```

## Next References

- `LOCAL_DEVELOPMENT.md`
- `services-port-reference.md`
- `docs/architecture/BACKEND_SERVICES.md`
