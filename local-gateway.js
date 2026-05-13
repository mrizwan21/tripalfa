#!/usr/bin/env node
import express from "express";
import http from "http";
import cors from "cors";
import "dotenv/config";

const app = express();
const PORT = process.env.LOCAL_GATEWAY_PORT || 8000;

const BOOKING_SERVICE = process.env.BOOKING_SERVICE_URL || "http://localhost:3001";
const BOOKING_ENGINE_SERVICE = process.env.BOOKING_ENGINE_SERVICE_URL || "http://localhost:3021";
const STATIC_DATA_API = process.env.VITE_STATIC_API_URL || "http://localhost:3022";

console.log('Starting Local Gateway...');
console.log('BOOKING_SERVICE:', BOOKING_SERVICE);
console.log('STATIC_DATA_API:', STATIC_DATA_API);

app.use(cors({
  origin: "*",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Authorization", "Content-Type", "X-Requested-With", "x-sales-channel", "x-tenant-id", "X-API-Key"],
  exposedHeaders: ["X-Request-Id"],
  credentials: true,
  maxAge: 3600
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

function parseTarget(targetUrl) {
  const parts = targetUrl.replace('http://', '').replace('https://', '').split('/');
  const hostPort = parts[0].split(':');
  return {
    hostname: hostPort[0],
    port: hostPort[1] ? parseInt(hostPort[1]) : 80,
    basePath: parts.length > 1 ? '/' + parts.slice(1).join('/') : ''
  };
}

function proxyTo(targetUrl, req, res) {
  const target = parseTarget(targetUrl);
  const finalPath = target.basePath + req.originalUrl;

  const headers = {};
  for (const [key, value] of Object.entries(req.headers)) {
    if (key.toLowerCase() !== 'host' && key.toLowerCase() !== 'connection') {
      headers[key] = value;
    }
  }

  if (req.body && typeof req.body === 'object') {
    const bodyStr = JSON.stringify(req.body);
    headers['Content-Length'] = Buffer.byteLength(bodyStr);
  }

  const options = {
    hostname: target.hostname,
    port: target.port,
    path: finalPath,
    method: req.method,
    headers: headers,
    timeout: 15000
  };

  const proxyReq = http.request(options, (proxyRes) => {
    res.writeHead(proxyRes.statusCode, proxyRes.headers);
    proxyRes.pipe(res, { end: true });
  });

  proxyReq.on('timeout', () => {
    proxyReq.destroy();
    res.status(504).json({ error: "Gateway timeout" });
  });

  proxyReq.on('error', (err) => {
    res.status(502).json({ error: "Proxy error", message: err.message });
  });

  if (req.body && typeof req.body === 'object') {
    proxyReq.write(JSON.stringify(req.body));
  }
  proxyReq.end();
}

// Health check endpoints first
app.get("/api/gateway/health-status", (req, res) => {
  res.json({ status: "healthy", service: "local-gateway", timestamp: new Date().toISOString() });
});

app.get("/api/gateway/audit-logs", (req, res) => {
  res.json({ logs: [], message: "Audit logs not available in local gateway" });
});

// Static data routes (passthrough)
app.use("/airports", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/airlines", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/currencies", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/countries", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/popular-destinations", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/api/liteapi", (req, res) => proxyTo(STATIC_DATA_API, req, res));
app.use("/api/rates", (req, res) => proxyTo(STATIC_DATA_API, req, res));

// Booking service routes (keep full path)
app.use("/api", (req, res) => proxyTo(BOOKING_SERVICE, req, res));

// Booking engine service routes
app.use("/engine", (req, res) => proxyTo(BOOKING_ENGINE_SERVICE, req, res));

// Fallback
app.use((req, res) => {
  res.status(404).json({ error: "Not found", path: req.originalUrl });
});

app.listen(PORT, () => {
  console.log(`[Local Gateway] Running on http://localhost:${PORT}`);
  console.log(`[Local Gateway] → Booking Service: ${BOOKING_SERVICE}`);
  console.log(`[Local Gateway] → Booking Engine Service: ${BOOKING_ENGINE_SERVICE}`);
  console.log(`[Local Gateway] → Static Data API: ${STATIC_DATA_API}`);
});