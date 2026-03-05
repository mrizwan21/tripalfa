# LiteAPI Timeout Fixes

This document outlines the fixes implemented to resolve timeout and DNS resolution issues with the LiteAPI static data sync.

## Issues Identified

1. **DNS Resolution Failures**: `getaddrinfo ENOTFOUND api.liteapi.travel`
2. **Timeout Issues**: 180-second timeout too long, causing hanging requests
3. **Insufficient Retry Logic**: Only 3 retries with basic backoff
4. **No Connection Pooling**: Each request creates new connections
5. **No Circuit Breaker**: No protection against repeated failures

## Fixes Implemented

### 1. Enhanced Timeout Configuration

**File**: `scripts/sync-liteapi.ts`
- Reduced request timeout from 180s to 120s
- Added connection timeout of 30s
- Increased retry attempts from 3 to 5
- Added circuit breaker with 5 failure threshold

**File**: `.env`
```bash
LITEAPI_CONNECTION_TIMEOUT_MS=30000
LITEAPI_REQUEST_TIMEOUT_MS=120000
LITEAPI_MAX_RETRY_ATTEMPTS=5
LITEAPI_CIRCUIT_BREAKER_THRESHOLD=5
LITEAPI_CIRCUIT_BREAKER_RESET_MS=60000
```

### 2. Circuit Breaker Implementation

**File**: `scripts/utils/http.ts`
- Added circuit breaker pattern to prevent cascading failures
- Tracks failure count and automatically opens circuit after 5 failures
- Resets circuit after 60 seconds of no failures
- Includes exponential backoff with jitter

### 3. Enhanced Retry Logic

**File**: `scripts/utils/retry.ts`
- Increased max attempts from 3 to 5
- Increased initial delay from 500ms to 1000ms
- Added jitter to prevent thundering herd effect
- Better error handling and logging

### 4. Network Diagnostics

**File**: `scripts/monitor-liteapi.ts`
- Comprehensive connectivity testing
- Performance benchmarking
- Detailed error diagnosis
- Specific guidance for different error types

**File**: `scripts/test-network.ts`
- DNS resolution testing
- Network connectivity verification
- DNS server configuration checks
- Alternative DNS testing

## Usage

### 1. Test Connectivity

```bash
cd database/static-db
npx ts-node scripts/monitor-liteapi.ts
```

This will test all LiteAPI endpoints and provide detailed diagnostics.

### 2. Test Network

```bash
cd database/static-db
npx ts-node scripts/test-network.ts
```

This will test DNS resolution and network connectivity.

### 3. Run Sync with Monitoring

```bash
cd database/static-db
nohup npx ts-node scripts/sync-liteapi.ts > nohup.out 2>&1 &
```

### 4. Check Logs

```bash
tail -f database/static-db/nohup.out
```

## Troubleshooting

### DNS Resolution Issues

If you see `ENOTFOUND api.liteapi.travel`:

1. **Check Internet Connection**:
   ```bash
   ping 8.8.8.8
   ```

2. **Test DNS Resolution**:
   ```bash
   nslookup api.liteapi.travel
   ```

3. **Change DNS Servers**:
   - Use Google DNS: `8.8.8.8` and `8.8.4.4`
   - Use Cloudflare DNS: `1.1.1.1` and `1.0.0.1`

4. **Flush DNS Cache**:
   ```bash
   sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder
   ```

### Timeout Issues

If requests are timing out:

1. **Check Network Latency**:
   ```bash
   ping api.liteapi.travel
   ```

2. **Reduce Concurrency**:
   ```bash
   export SYNC_CONCURRENCY=1
   ```

3. **Increase Timeouts**:
   ```bash
   export LITEAPI_REQUEST_TIMEOUT_MS=180000
   ```

4. **Check API Rate Limits**:
   - LiteAPI may have rate limits
   - Increase `LITEAPI_API_CALL_DELAY_MS` if needed

### Authentication Issues

If you see 401/403 errors:

1. **Verify API Key**:
   ```bash
   echo $LITEAPI_KEY
   ```

2. **Test with Monitor**:
   ```bash
   npx ts-node scripts/monitor-liteapi.ts
   ```

3. **Contact LiteAPI Support** if key is invalid

## Monitoring and Logs

### Log Levels

The sync script provides detailed logging:
- `INFO`: Progress updates and status
- `WARN`: Non-critical issues and retries
- `ERROR`: Critical failures
- `SUCCESS`: Successful operations

### Progress Tracking

The script tracks progress in the `sync_progress` table:
```sql
SELECT * FROM sync_progress ORDER BY updated_at DESC;
```

### Performance Metrics

The monitor script provides performance benchmarks:
- Countries endpoint: ~100-500ms
- Cities endpoint: ~200-1000ms
- Hotels endpoint: ~500ms-2s
- Hotel detail: ~1-5s

## Configuration Options

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `SYNC_CONCURRENCY` | 1 | Number of concurrent requests |
| `LITEAPI_ALL_COUNTRIES` | true | Sync all countries |
| `LITEAPI_MAX_HOTELS` | -1 | Max hotels per country (-1 for all) |
| `LITEAPI_HOTEL_DETAIL_LIMIT` | 100 | Max hotel details per country |
| `LITEAPI_API_CALL_DELAY_MS` | 300 | Delay between API calls |
| `LITEAPI_BATCH_SIZE` | 100 | Batch size for database operations |
| `LITEAPI_MAX_RETRY_ATTEMPTS` | 5 | Max retry attempts |
| `LITEAPI_CONNECTION_TIMEOUT_MS` | 30000 | Connection timeout |
| `LITEAPI_REQUEST_TIMEOUT_MS` | 120000 | Request timeout |
| `LITEAPI_CIRCUIT_BREAKER_THRESHOLD` | 5 | Circuit breaker failure threshold |
| `LITEAPI_CIRCUIT_BREAKER_RESET_MS` | 60000 | Circuit breaker reset timeout |

### Circuit Breaker States

1. **CLOSED**: Normal operation, requests pass through
2. **OPEN**: Too many failures, requests are blocked
3. **HALF_OPEN**: Testing if service is back online

## Recovery Procedures

### After DNS Issues

1. **Verify DNS Resolution**:
   ```bash
   npx ts-node scripts/test-network.ts
   ```

2. **Test Connectivity**:
   ```bash
   npx ts-node scripts/monitor-liteapi.ts
   ```

3. **Resume Sync**:
   ```bash
   nohup npx ts-node scripts/sync-liteapi.ts > nohup.out 2>&1 &
   ```

### After Timeout Issues

1. **Reduce Concurrency**:
   ```bash
   export SYNC_CONCURRENCY=1
   ```

2. **Increase Delays**:
   ```bash
   export LITEAPI_API_CALL_DELAY_MS=500
   ```

3. **Monitor Performance**:
   ```bash
   npx ts-node scripts/monitor-liteapi.ts
   ```

### After Circuit Breaker Opens

The circuit breaker will automatically reset after 60 seconds. If issues persist:

1. **Check API Status**: Verify LiteAPI is operational
2. **Reduce Load**: Lower concurrency and increase delays
3. **Contact Support**: If issues continue, contact LiteAPI support

## Best Practices

1. **Monitor Logs**: Regularly check `nohup.out` for issues
2. **Test Connectivity**: Run monitor script before starting sync
3. **Use Circuit Breaker**: Don't disable circuit breaker protection
4. **Adjust Concurrency**: Start with low concurrency and increase gradually
5. **Backup Progress**: The sync is resumable, progress is tracked in database
6. **Network Stability**: Ensure stable internet connection during sync
7. **Resource Monitoring**: Monitor CPU and memory usage during sync

## Support

If issues persist after applying these fixes:

1. **Check Logs**: Review `nohup.out` for specific error messages
2. **Run Diagnostics**: Use monitor and network test scripts
3. **Verify Configuration**: Double-check all environment variables
4. **Contact Support**: Reach out with logs and diagnostic output