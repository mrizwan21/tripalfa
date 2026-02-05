import { PrismaClient } from '@prisma/client';
import { performance } from 'perf_hooks';
import http from 'http';

const prisma = new PrismaClient();

const monitorInterval = parseInt(process.env.MONITOR_INTERVAL || '60000');

async function monitorQueryPerformance() {
  try {
    const startTime = performance.now();
    
    // Sample queries to monitor
    const sampleQueries = [
      // Booking queries
      prisma.booking.findMany({ take: 1, orderBy: { createdAt: 'desc' } }),
      prisma.booking.count(),
      
      // User queries
      prisma.user.findMany({ take: 1, orderBy: { createdAt: 'desc' } }),
      prisma.user.count(),
      
      // Flight queries
      prisma.flightRoute.findMany({ take: 1, orderBy: { createdAt: 'desc' } }),
      prisma.flightRoute.count(),
      
      // Hotel queries
      prisma.hotel.findMany({ take: 1, orderBy: { createdAt: 'desc' } }),
      prisma.hotel.count(),
    ];

    const results = await Promise.allSettled(sampleQueries);
    const endTime = performance.now();
    
    const executionTime = endTime - startTime;
    
    await prisma.queryPerformance.create({
      data: {
        queryText: 'Sample performance monitoring queries',
        executionTimeMs: Math.round(executionTime),
        rowsReturned: results.filter(r => r.status === 'fulfilled').length,
        timestamp: new Date(),
      },
    });

    console.log('Query performance monitored:', {
      executionTime: Math.round(executionTime),
      queriesExecuted: results.length,
      successfulQueries: results.filter(r => r.status === 'fulfilled').length,
    });
  } catch (error) {
    console.error('Error monitoring query performance:', error);
  }
}

console.log('Query performance monitor started');
setInterval(monitorQueryPerformance, monitorInterval);

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

server.listen(3011, () => {
  console.log('Query performance monitor health check listening on port 3011');
});