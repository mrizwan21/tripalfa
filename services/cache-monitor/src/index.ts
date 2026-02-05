import Redis from 'ioredis';
import { PrismaClient } from '@prisma/client';
import http from 'http';

const prisma = new PrismaClient();
const redis = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

const monitorInterval = parseInt(process.env.MONITOR_INTERVAL || '30000');

async function monitorCachePerformance() {
  try {
    const info = await redis.info('stats');
    const lines = info.split('\r\n');
    const stats: Record<string, number> = {};
    
    lines.forEach(line => {
      if (line.startsWith('cmd_')) {
        const [key, value] = line.split(':');
        stats[key] = parseInt(value);
      }
    });

    const hitRate = (stats.cmd_get - stats.cmd_del) / (stats.cmd_get || 1);
    
    await prisma.cachePerformance.create({
      data: {
        cacheKey: 'global',
        hitCount: stats.cmd_get - stats.cmd_del,
        missCount: stats.cmd_del,
        hitRate: hitRate > 1 ? 1 : hitRate,
      },
    });

    console.log('Cache performance monitored:', {
      hits: stats.cmd_get - stats.cmd_del,
      misses: stats.cmd_del,
      hitRate: hitRate.toFixed(4),
    });
  } catch (error) {
    console.error('Error monitoring cache performance:', error);
  }
}

console.log('Cache performance monitor started');
setInterval(monitorCachePerformance, monitorInterval);

// Health check endpoint
const server = http.createServer((req, res) => {
  if (req.url === '/health') {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.end(JSON.stringify({ status: 'healthy', timestamp: new Date().toISOString() }));
  } else {
    res.writeHead(404);
    res.end();
  }
});

server.listen(3012, () => {
  console.log('Cache performance monitor health check listening on port 3012');
});