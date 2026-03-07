# 🚀 Quick Start - Local Infrastructure Deployment

**Status**: Ready for Local Machine Deployment  
**Completed**: March 5, 2026

---

## TL;DR - Start Everything Now

```bash
# Terminal 1: Start core services
bash scripts/start-local-dev.sh

# Terminal 2: Start monitoring (after services are up)
bash scripts/start-monitoring-local.sh
```

## Access Your Application

| Component | URL | Default Credentials |
|-----------|-----|-------------------|
| **Booking Engine** | http://localhost:5174 | N/A |
| **B2B Admin** | http://localhost:5173 | Check .env |
| **API Gateway** | http://localhost:3000 | N/A |
| **Prometheus** | http://localhost:9090 | N/A |
| **Grafana** | http://localhost:3500 | admin / admin |
| **Loki** | http://localhost:3100 | N/A |

## What's Running?

### Application Services (start-local-dev.sh)
- ✅ API Gateway (3000)
- ✅ Booking Service (3001)
- ✅ User Service (3004)
- ✅ Organization Service (3006)
- ✅ Payment Service (3007)
- ✅ Wallet Service (3008)
- ✅ Notification Service (3009)
- ✅ Rule Engine Service (3010)
- ✅ KYC Service (3011)
- ✅ Marketing Service (3012)
- ✅ B2B Admin Service (3020)
- ✅ Booking Engine Service (3021)
- ✅ Booking Engine App (5174)
- ✅ B2B Admin App (5173)

### Infrastructure & Monitoring (start-monitoring-local.sh)
- ✅ Prometheus (9090) - Metrics collection
- ✅ Grafana (3500) - Visualization dashboard
- ✅ Loki (3100) - Log aggregation
- ✅ Nginx (80) - Reverse proxy (optional, auto-configured)

## Installation (One-Time Setup)

```bash
# macOS
brew install prometheus grafana loki nginx

# Ubuntu
sudo apt-get install nginx prometheus grafana-server loki

# Or use package managers: apt, dnf, pacman, etc.
```

## Common Commands

### View Logs
```bash
# Service logs
tail -f .logs/*.log

# Monitoring stack logs
tail -f .logs/monitoring/*.log
```

### Stop Services
```bash
# Stop local dev services
pkill -f "tsx watch"

# Stop monitoring stack
pkill -f "prometheus\|grafana-server\|loki"
```

### Check Service Health
```bash
# API Gateway health
curl http://localhost:3000/health | jq

# All services health
curl http://localhost:9090/api/v1/targets
```

## Documentation

For detailed information, see:

1. **LOCAL_INFRASTRUCTURE_SETUP.md** - Complete infrastructure guide
   - Architecture details
   - Nginx configuration
   - Prometheus setup
   - Grafana dashboards
   - Troubleshooting

2. **WICKED_API_GATEWAY_GUIDE.md** - Wicked API Gateway guide
   - API management
   - Route configuration
   - Authentication setup
   - Best practices

3. **INFRASTRUCTURE_CORRECTION_SUMMARY.md** - What was done
   - Configuration updates
   - Verification results
   - Quick start steps

## Troubleshooting

### Port Already in Use
```bash
# Find what's using the port
lsof -i :3000

# Kill the process
kill -9 <PID>
```

### Services Not Starting
```bash
# Check environment
echo $NODE_ENV
echo $DATABASE_URL

# Verify .env files
cat .env
cat services/api-gateway/.env
```

### Prometheus Not Scraping
```bash
# Check Prometheus targets
curl http://localhost:9090/api/v1/targets | jq

# Test service metrics endpoint
curl http://localhost:3000/metrics
```

### Grafana Can't Connect to Prometheus
1. Go to http://localhost:3009
2. Settings > Data Sources
3. Edit Prometheus datasource
4. Test connection (should show green checkmark)

## Key Configuration Files

```
✅ Infrastructure configured for localhost:

infrastructure/
├── nginx/nginx.conf                    ← Reverse proxy routing
├── wicked-config/                      ← API Gateway configuration
│   └── static/env/box.json            ← Local environment (localhost)
└── monitoring/
    ├── prometheus.yml                  ← Metrics scrape targets
    ├── grafana.ini                     ← Grafana settings
    ├── loki.yml                        ← Log aggregation
    └── promtail.yml                    ← Log shipper

scripts/
├── start-local-dev.sh                  ← Start application services
└── start-monitoring-local.sh           ← Start monitoring stack

docs/
├── LOCAL_INFRASTRUCTURE_SETUP.md       ← Full guide
└── WICKED_API_GATEWAY_GUIDE.md        ← API Gateway guide
```

## Performance Tips

1. **For Local Development**:
   - Run only services you need (modify start-local-dev.sh)
   - Use Prometheus with short retention: `--storage.tsdb.retention.time=1d`
   - Keep Grafana refresh rate at 10s or higher

2. **Monitoring Best Practices**:
   - Create dashboards for your use case
   - Set up alerts for critical metrics
   - Archive old dashboards monthly
   - Keep logs retention to 7 days locally

3. **Service Performance**:
   - Monitor request latency in Prometheus
   - Check error rates in Grafana
   - Review logs in Loki for issues
   - Use circuit breakers for resilience

## Git Status

All changes are tracked in git:
```bash
git status
git diff infrastructure/
git diff scripts/
git diff docs/
```

Rollback any change:
```bash
git checkout -- <file>
```

## What's Ready

✅ Wicked API Gateway configuration (local mode)  
✅ Nginx reverse proxy (localhost configured)  
✅ Prometheus metrics collection (all services)  
✅ Grafana visualization dashboard  
✅ Loki log aggregation  
✅ Startup scripts (automated)  
✅ Complete documentation  
✅ No Docker required  
✅ No configuration needed (just run scripts)  

## Next Steps

1. **Install Requirements** (if not done):
   ```bash
   brew install prometheus grafana loki
   ```

2. **Start Services**:
   ```bash
   bash scripts/start-local-dev.sh
   ```

3. **Start Monitoring** (in another terminal):
   ```bash
   bash scripts/start-monitoring-local.sh
   ```

4. **Access Grafana**:
   - Navigate to http://localhost:3500
   - Login with admin/admin
   - Create your dashboards

5. **Read Documentation**:
   - Check `docs/LOCAL_INFRASTRUCTURE_SETUP.md`
   - Review `docs/WICKED_API_GATEWAY_GUIDE.md`

## Emergency Reset

If something goes wrong:

```bash
# Kill all related processes
pkill -f "tsx watch"
pkill -f "prometheus\|grafana\|loki\|promtail"
sleep 2

# Start fresh
bash scripts/start-local-dev.sh
bash scripts/start-monitoring-local.sh
```

## Support

For detailed help, see:
- **Infrastructure Issues**: LOCAL_INFRASTRUCTURE_SETUP.md
- **API Gateway Issues**: WICKED_API_GATEWAY_GUIDE.md
- **Monitoring Issues**: Prometheus/Grafana official docs
- **Service Issues**: Service-specific README files

---

**Status**: ✅ Ready for Local Deployment  
**Last Updated**: March 5, 2026  
**Autonomous Operations**: Complete
