# Operations Runbook

## Health checks

```bash
bash tools/scripts/bin/health_check.sh
```

## Frontend DB verification

```bash
bash tools/scripts/bin/verify_databases.sh
```

## Full repo verification

```bash
pnpm -r build
pnpm -r --if-present test
```

## Static data caution

Do not run destructive DB commands against `tripalfa_local`.
