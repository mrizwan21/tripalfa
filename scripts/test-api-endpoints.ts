/**
 * API Endpoint Testing Suite
 * Tests all critical endpoints across services
 */

import http from "http";
import https from "https";

interface ApiTest {
  method: "GET" | "POST" | "PUT" | "DELETE";
  url: string;
  headers?: Record<string, string>;
  body?: Record<string, unknown>;
  expectedStatus?: number;
  description: string;
}

const serviceTests: ApiTest[] = [
  // Health checks
  {
    method: "GET",
    url: "http://localhost:3000/health",
    description: "API Gateway health check",
    expectedStatus: 200,
  },
  {
    method: "GET",
    url: "http://localhost:3002/health",
    description: "Static Data service health check",
    expectedStatus: 200,
  },

  // Static data endpoints (no auth required)
  {
    method: "GET",
    url: "http://localhost:3002/api/countries",
    description: "Get list of countries",
    expectedStatus: 200,
  },
  {
    method: "GET",
    url: "http://localhost:3002/api/cities",
    description: "Get list of cities",
    expectedStatus: 200,
  },
  {
    method: "GET",
    url: "http://localhost:3002/api/airports",
    description: "Get list of airports",
    expectedStatus: 200,
  },
  {
    method: "GET",
    url: "http://localhost:3002/api/hotels",
    description: "Get list of hotels",
    expectedStatus: 200,
  },

  // Auth endpoints
  {
    method: "POST",
    url: "http://localhost:3000/auth/register",
    body: {
      email: `test-${Date.now()}@example.com`,
      password: "Test@123456",
      firstName: "Test",
      lastName: "User",
    },
    description: "User registration",
    expectedStatus: 201,
  },

  {
    method: "POST",
    url: "http://localhost:3000/auth/login",
    body: {
      email: "test@example.com",
      password: "Test@123456",
    },
    description: "User login",
    expectedStatus: 200,
  },
];

async function makeRequest(test: ApiTest): Promise<{
  success: boolean;
  status: number;
  time: number;
  error?: string;
}> {
  return new Promise((resolve) => {
    const url = new URL(test.url);
    const client = url.protocol === "https:" ? https : http;

    const startTime = Date.now();
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: test.method,
      headers: {
        "Content-Type": "application/json",
        ...test.headers,
      },
    };

    const req = client.request(options, (res) => {
      let data = "";
      res.on("data", (chunk) => {
        data += chunk;
      });
      res.on("end", () => {
        resolve({
          success:
            !test.expectedStatus || res.statusCode === test.expectedStatus,
          status: res.statusCode || 0,
          time: Date.now() - startTime,
        });
      });
    });

    req.on("error", (error) => {
      resolve({
        success: false,
        status: 0,
        time: Date.now() - startTime,
        error: error.message,
      });
    });

    if (test.body) {
      req.write(JSON.stringify(test.body));
    }
    req.end();
  });
}

async function runTests() {
  console.log(
    "\n📊 API Endpoint Testing Suite\n" +
      "================================\n"
  );

  let passed = 0;
  let failed = 0;

  for (const test of serviceTests) {
    const result = await makeRequest(test);
    const status =
      result.success && !result.error
        ? "✅ PASS"
        : "❌ FAIL";
    const time = result.time ? `${result.time}ms` : "N/A";

    console.log(
      `${status} | ${test.method} ${test.url.split("//")[1]?.split("/")[1]}/... | ${result.status} | ${time}`
    );
    if (result.error) {
      console.log(`     Error: ${result.error}`);
    }
    console.log(`     ${test.description}`);

    if (result.success && !result.error) {
      passed++;
    } else {
      failed++;
    }
  }

  console.log(
    `\n📈 Results: ${passed} passed, ${failed} failed\n`
  );
  process.exit(failed > 0 ? 1 : 0);
}

runTests().catch(console.error);
