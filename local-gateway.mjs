#!/usr/bin/env node
import express from "express";
import http from "http";

const app = express();
const PORT = process.env.LOCAL_GATEWAY_PORT || 8000;

const BOOKING_SERVICE_HOST = "localhost:3001";
const BOOKING_ENGINE_HOST = "localhost:3021";
const STATIC_DATA_HOST = "localhost:3022";

function getBaseUrl(host) { return `http://${host}`; }

function proxyPath(targetHost, targetPath, req, res) {
  const targetUrl = getBaseUrl(targetHost) + targetPath;
  console.log(`[Proxy] ${req.method} ${req.originalUrl || req.url} → ${targetUrl}`);
  
  const headers = { ...req.headers };
  delete headers['host'];
  delete headers['connection'];
  
  const parsedUrl = new URL(targetUrl);
  const options = {
    method: req.method,
    headers,
    hostname: parsedUrl.hostname,
    port: parsedUrl.port,
    path: parsedUrl.pathname + parsedUrl.search,
  };

  const proxyReq = http.request(targetUrl, options, (proxyRes) => {
    res.status(proxyRes.statusCode || 500);
    Object.entries(proxyRes.headers).forEach(([k, v]) => {
      if (k !== 'transfer-encoding' && k !== 'connection' && k !== 'content-encoding') res.setHeader(k, v);
    });
    if (!res.get('Access-Control-Allow-Origin')) res.set('Access-Control-Allow-Origin', '*');
    proxyRes.pipe(res);
  });

  proxyReq.on('error', (e) => {
    console.error(`[Proxy Error] ${req.originalUrl || req.url}: ${e.message}`);
    res.status(502).json({ error: "Proxy error", message: e.message });
  });

  if (['POST', 'PUT', 'PATCH'].includes(req.method)) {
    req.pipe(proxyReq);
  } else {
    proxyReq.end();
  }
}

app.use(express.json());

app.use((req, res, next) => {
  if (req.method === 'OPTIONS') {
    res.set('Access-Control-Allow-Origin', '*');
    res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,x-sales-channel,x-tenant-id,X-API-Key');
    res.set('Access-Control-Expose-Headers', 'X-Request-Id');
    res.set('Access-Control-Max-Age', '3600');
    res.status(204).end();
    return;
  }
  next();
});

app.get("/api/gateway/health-status", (req, res) => {
  res.json({ status: "healthy", service: "local-gateway", timestamp: new Date().toISOString() });
});

app.get("/api/gateway/audit-logs", (req, res) => {
  res.json({ logs: [], message: "Audit logs not available in local gateway" });
});

app.use((req, res, next) => {
  const url = req.originalUrl || req.url;
  console.log(`[Gateway] ${req.method} ${url}`);

  if (url.startsWith('/tenant')) {
    const suffix = url.substring('/tenant'.length) || '/';
    return proxyPath(BOOKING_SERVICE_HOST, '/api/tenant' + suffix, req, res);
  }
  if (url.startsWith('/auth')) {
    const suffix = url.substring('/auth'.length) || '/';
    return proxyPath(BOOKING_SERVICE_HOST, '/api/auth' + suffix, req, res);
  }
  if (url.startsWith('/user')) {
    const suffix = url.substring('/user'.length) || '/';
    return proxyPath(BOOKING_SERVICE_HOST, '/api/user' + suffix, req, res);
  }

  if (url.startsWith('/api/tenant')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/branding')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/call-center')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/b2b')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/companies')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/agents')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/super-admin')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/search')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/bookings')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/flight-booking')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/hotel-booking')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/duffel')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/flights/ancillary')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/airline-credits')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/payment')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/payments')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/wallet')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/wallets')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/rules')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/liteapi')) return proxyPath(BOOKING_SERVICE_HOST, url, req, res);
  if (url.startsWith('/api/rates')) return proxyPath(STATIC_DATA_HOST, url, req, res);
  if (url.startsWith('/api/static')) return proxyPath(BOOKING_ENGINE_HOST, url, req, res);
  if (url.startsWith('/api/hotels')) return proxyPath(BOOKING_ENGINE_HOST, url, req, res);
  if (url.startsWith('/api/offline-requests')) return proxyPath(BOOKING_ENGINE_HOST, url, req, res);

  next();
});

app.use((req, res) => {
  console.log(`[Local Gateway] No route for ${req.method} ${req.originalUrl}`);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,x-sales-channel,x-tenant-id,X-API-Key');
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

app.use((err, req, res, next) => {
  console.error("[Local Gateway Error]", err.message);
  res.set('Access-Control-Allow-Origin', '*');
  res.set('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.set('Access-Control-Allow-Headers', 'Authorization,Content-Type,X-Requested-With,x-sales-channel,x-tenant-id,X-API-Key');
  res.status(500).json({ error: "Gateway error", message: err.message });
});

app.listen(PORT, () => {
  console.log(`[Local Gateway] Running on http://localhost:${PORT}`);
  console.log(`[Local Gateway] → Booking Service: http://${BOOKING_SERVICE_HOST}`);
  console.log(`[Local Gateway] → Booking Engine Service: http://${BOOKING_ENGINE_HOST}`);
  console.log(`[Local Gateway] → Static Data API: http://${STATIC_DATA_HOST}`);
});