# TripAlfa Resilient Microservices Architecture

**Note**: This document may be outdated. For the most current architecture information, please refer to the actual service implementations and infrastructure configurations.

## 🏗️ Overview

This document describes the fault-tolerant microservices architecture implemented for TripAlfa. The system is designed so that **if one service fails, it does not affect other running services**.

## 📋 Table of Contents

- [Architecture Principles](#architecture-principles)
- [System Architecture Diagram](#system-architecture-diagram)
- [Resilience Patterns](#resilience-patterns)
- [Service Communication](#service-communication)
- [Infrastructure Components](#infrastructure-components)
- [Monitoring & Observability](#monitoring-observability)
- [Deployment Guide](#deployment-guide)
- [Failure Scenarios & Recovery](#failure-scenarios-recovery)

---

## 🎯 Architecture Principles {#architecture-principles}

### 1. **Fault Isolation**

**Note**: The actual fault isolation mechanisms may have been updated. Please refer to the current service configurations.

- Each service runs in its own container with isolated resources
- Service failures are contained and don't cascade to other services
- Circuit breakers prevent cascade failures

### 2. **Loose Coupling**

**Note**: Communication patterns may have evolved. Please verify current service communication methods.

- Services communicate via message queues for async operations
- REST APIs with circuit breakers for sync operations
- No direct database sharing between services

### 3. **Graceful Degradation**

**Note**: Fallback mechanisms may have been updated. Please refer to current service implementations.

- Fallback responses when services are unavailable
- Non-critical features fail silently
- Core functionality continues even when some services are down

### 4. **Self-Healing**

**Note**: Self-healing configurations may have changed. Please verify current health check and recovery settings.

- Automatic service restart on failure
- Circuit breakers auto-recover after timeout
- Health checks trigger automatic re-registration

---

## 🏛️ System Architecture Diagram {#system-architecture-diagram}

**Note**: The system architecture diagram below may be outdated. Please refer to the current infrastructure configurations.

```text
                                    ┌─────────────────────────────────────────────────────────────┐
                                    │                    EXTERNAL CLIENTS                         │
                                    └─────────────────────────┬───────────────────────────────────┘
                                                              │
                                                              ▼
┌─────────────────────────────────────────────────────────────────────────────────────────────────────┐
│                                        API GATEWAY (Port 3000)                                      │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────────────────────┐ │
│  │ Circuit Breaker │  │ Rate Limiting   │  │ Auth Middleware │  │ Service Discovery (Consul)     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  └─────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────────────────────────────────────────┘
                                                              │
                          ┌───────────────────────────────────┼───────────────────────────────────┐
                          │                                   │                                   │
                          ▼                                   ▼                                   ▼
┌─────────────────────────────────┐  ┌─────────────────────────────────┐  ┌─────────────────────────────────┐
│      SYNC COMMUNICATION         │  │      ASYNC COMMUNICATION        │  │      SERVICE DISCOVERY         │
│   (HTTP with Circuit Breaker)   │  │     (RabbitMQ Message Queue)    │  │        (Consul)                 │
└─────────────────────────────────┘  └─────────────────────────────────┘  └─────────────────────────────────┘
                          │                                   │                                   │
                          └───────────────────────────────────┼───────────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    │                                         │                                         │
    ┌───────────────▼───────────────┐   ┌─────────────────────▼─────────────────────┐   ┌───────────────▼───────────────┐
    │       CORE SERVICES           │   │              BUSINESS SERVICES             │   │      SUPPORT SERVICES         │
    │                               │   │                                            │   │                               │
    │  • Booking Service     :3011  │   │  • B2B Admin Service       :3020           │   │  • Notification Service :3009 │
    │  • Payment Service     :3007  │   │  • Booking Engine Service  :3021           │   │  • KYC Service          :3011 │
    │  • User Service        :3004  │   │  • Organization Service    :3006           │   │  • Marketing Service    :3012 │
    │  • Wallet Service      :3008  │   │  • Rule Engine Service     :3010           │   │  Static Data Service
    │                               │   │                                            │   │                               │
    └───────────────────────────────┘   └────────────────────────────────────────────┘   └───────────────────────────────┘
                    │                                         │                                         │
                    └─────────────────────────────────────────┼─────────────────────────────────────────┘
                                                              │
                    ┌─────────────────────────────────────────┼─────────────────────────────────────────┐
                    │                                         │                                         │
    ┌───────────────▼───────────────┐   ┌─────────────────────▼─────────────────────┐   ┌───────────────▼───────────────┐
    │       DATABASES               │   │              MESSAGE QUEUE                 │   │          CACHING              │
    │                               │   │                                            │   │                               │
    │  • PostgreSQL App       :5432 │   │  • RabbitMQ          :5672                 │   │  • Redis               :6379 │
    │  • PostgreSQL Static    :5433 │   │  • RabbitMQ Mgmt UI  :15672                │   │                               │   │
    │                               │   │                                            │   │                               │
    └───────────────────────────────┘   └────────────────────────────────────────────┘   └───────────────────────────────┘

                    ┌─────────────────────────────────────────────────────────────────────────────────────┐
                    │                              MONITORING STACK                                       │
                    │                                                                                     │
                    │  ┌───────────────────┐  ┌───────────────────┐  ┌───────────────────┐               │
                    │  │ Prometheus :9090  │  │   Grafana :3009   │  │    Loki :3100     │               │
                    │  │    (Metrics)      │  │   (Dashboards)    │  │     (Logs)        │               │
                    │  └───────────────────┘  └───────────────────┘  └───────────────────┘               │
                    └─────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 🛡️ Resilience Patterns {#resilience-patterns}

### 1. Circuit Breaker Pattern

**Note**: The circuit breaker implementation details below may be outdated. Please refer to the current resilience package implementation.

Prevents cascade failures by stopping requests to failing services.

```text
┌─────────────┐     ┌─────────────────────────────────────┐     ┌─────────────┐
│   CLOSED    │────▶│  Failures >= Threshold              │────▶│    OPEN     │
│  (Normal)   │     │                                     │     │  (Failing   │
│             │     │  Circuit opens, requests fail fast  │     │   Fast)     │
└─────────────┘     └─────────────────────────────────────┘     └──────┬──────┘
      ▲                                                              │
      │                                                              │ Timeout
      │                                                              │ Elapsed
      │                     ┌─────────────────────────────────────┐  │
      │                     │  Test requests allowed              │  ▼
      │                     │                                     │┌─────────────┐
      └─────────────────────│  Successes >= Threshold            ││  HALF-OPEN  │
             Success        │                                     ││  (Testing)  │
                             └─────────────────────────────────────┘└─────────────┘
```

**Configuration:**

```typescript
const circuitBreakerOptions = {
  failureThreshold: 5, // Open after 5 failures
  successThreshold: 3, // Close after 3 successes
  timeout: 30000, // Try half-open after 30s
  resetTimeout: 60000, // Reset failure count after 60s
};
```

**Usage:**

```typescript
import { createCircuitBreaker } from "@tripalfa/resilience";

const circuit = createCircuitBreaker("payment-service", {
  failureThreshold: 5,
  fallback: async (error) => {
    // Return cached response or default
    return { status: "pending", message: "Payment queued" };
  },
});

const result = await circuit.execute(() => paymentService.processPayment(data));
```

### 2. Retry Pattern

**Note**: The retry pattern implementation details below may be outdated. Please refer to the current resilience package implementation.

Automatically retries transient failures with exponential backoff.

```text
Attempt 1 ──────── Failure ──────── Wait 1s ────────┐
                                                      │
Attempt 2 ◄───────────────────────────────────────────┘
    │
    └─────────────── Failure ──────── Wait 2s ────────┐
                                                      │
Attempt 3 ◄───────────────────────────────────────────┘
    │
    └─────────────── Failure ──────── Wait 4s ────────┐
                                                      │
Attempt 4 ◄───────────────────────────────────────────┘
    │
    └─────────────── Success ✅ OR Exhausted ❌
```

**Usage:**

```typescript
import { retry } from "@tripalfa/resilience";

const result = await retry(() => externalApi.call(), {
  maxRetries: 3,
  baseDelayMs: 1000,
  maxDelayMs: 10000,
  retryableStatusCodes: [408, 429, 500, 502, 503, 504],
});
```

### 3. Service Registry & Health Checks

**Note**: The service registry implementation details below may be outdated. Please refer to the current service discovery implementation.

Automatic service discovery with health monitoring.

```text
┌─────────────────────────────────────────────────────────────────┐
│                     SERVICE REGISTRY                             │
│                                                                  │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Service           Status    Health    Circuit Breaker    │    │
│  ├─────────────────────────────────────────────────────────┤    │
│  │ booking-service   healthy   ✓ 99.9%   CLOSED             │    │
│  │ payment-service   healthy   ✓ 99.8%   CLOSED             │    │
│  │ user-service      degraded  ⚠ 95.2%   HALF_OPEN          │    │
│  │ notification      unhealthy ✗ 0%      OPEN               │    │
│  └─────────────────────────────────────────────────────────┘    │
│                                                                  │
│  Health Check Interval: 30s                                     │
│  Unhealthy Threshold: 3 consecutive failures                    │
│  Healthy Threshold: 2 consecutive successes                     │
└─────────────────────────────────────────────────────────────────┘
```

**Usage:**

```typescript
import { createServiceRegistry } from "@tripalfa/resilience";

const registry = createServiceRegistry({
  healthCheckInterval: 30000,
  unhealthyThreshold: 3,
  enableCircuitBreaker: true,
});

// Register services
registry.register({
  id: "booking-service-1",
  name: "booking-service",
  url: "http://booking-service:3001",
  port: 3001,
});

// Get healthy instance
const instance = registry.getInstance("booking-service");

// Execute with automatic failover
const result = await registry.execute("booking-service", async (instance) => {
  return fetch(`${instance.url}/api/bookings`);
});
```

---

## 📨 Service Communication {#service-communication}

### Synchronous Communication (REST API)

**Note**: The communication patterns below may be outdated. Please refer to the current API gateway and service configurations.

Used for real-time operations requiring immediate response.

```text
Client ──▶ API Gateway ──▶ [Circuit Breaker] ──▶ Service
                                      │
                                      ▼ (if open)
                               [Fallback Response]
```

**Protected HTTP Client:**

```typescript
import { createResilientClient } from "@tripalfa/resilience";

const client = createResilientClient({
  baseUrl: "http://payment-service:3007",
  serviceName: "payment-service",
  timeout: 30000,
  retryOptions: {
    maxRetries: 3,
    baseDelayMs: 1000,
  },
  circuitBreakerOptions: {
    failureThreshold: 5,
    timeout: 30000,
  },
  fallback: async (request, error) => {
    return { status: "queued", message: "Payment will be processed later" };
  },
});

// All requests are protected
const payment = await client.post("/payments", paymentData);
```

### Asynchronous Communication (Message Queue)

**Note**: The message queue implementation details below may be outdated. Please refer to the current message queue package.

Used for operations that don't need immediate response.

```text
Publisher Service                RabbitMQ                   Consumer Service
       │                            │                              │
       │  1. Publish message        │                              │
       │ ─────────────────────────▶ │                              │
       │                            │  2. Store in queue           │
       │                            │ ─────────────────────────────▶│
       │                            │                              │
       │                            │  3. Deliver to consumer      │
       │                            │ ─────────────────────────────▶│
       │                            │                              │
       │                            │         4. Process           │
       │                            │◀─────────────────────────────│
       │                            │         5. Ack/Nack          │
       │                            │                              │
```

**Publisher Example:**

```typescript
import { createMessageQueue, StandardEvents } from "@tripalfa/message-queue";

const mq = createMessageQueue({
  type: "rabbitmq",
  urls: ["amqp://tripalfa:tripalfa123@localhost:5672/tripalfa"],
  username: "tripalfa",
  password: "tripalfa123",
});

await mq.connect();

// Publish booking created event
await mq.publish("booking-events", StandardEvents.BOOKING_CREATED, {
  bookingId: "BK-12345",
  userId: "USR-67890",
  amount: 1500.0,
  currency: "USD",
});
```

**Consumer Example:**

```typescript
// Subscribe to booking events
await mq.subscribe("booking-events", async (message, result) => {
  try {
    // Process the booking
    await processBooking(message.data);

    // Acknowledge successful processing
    await result.ack();
  } catch (error) {
    // Negative acknowledge (requeue for retry)
    await result.nack(true);
  }
});
```

### Standard Event Types

```typescript
export const StandardEvents = {
  // Booking events
  BOOKING_CREATED: "booking.created",
  BOOKING_UPDATED: "booking.updated",
  BOOKING_CANCELLED: "booking.cancelled",
  BOOKING_COMPLETED: "booking.completed",
  BOOKING_FAILED: "booking.failed",

  // Payment events
  PAYMENT_INITIATED: "payment.initiated",
  PAYMENT_COMPLETED: "payment.completed",
  PAYMENT_FAILED: "payment.failed",
  PAYMENT_REFUNDED: "payment.refunded",

  // Notification events
  NOTIFICATION_SEND: "notification.send",
  NOTIFICATION_SENT: "notification.sent",

  // User events
  USER_CREATED: "user.created",
  USER_UPDATED: "user.updated",
  USER_DELETED: "user.deleted",
};
```

---

## 🏗️ Infrastructure Components {#infrastructure-components}

### Message Queue (RabbitMQ)

**Management UI:** <http://localhost:15672>

- Username: `tripalfa`
- Password: `tripalfa123`

**Note**: The queue configuration below may be outdated. Please refer to the current RabbitMQ configuration.

**Queues Configuration:**

| Queue                 | Purpose                   | DLQ | TTL    |
| --------------------- | ------------------------- | --- | ------ |
| `booking-events`      | Booking lifecycle events  | Yes | 7 days |
| `payment-events`      | Payment processing events | Yes | 7 days |
| `notification-events` | Email/SMS notifications   | Yes | 3 days |
| `webhook-events`      | External webhooks         | Yes | 1 day  |

### Service Discovery (Consul)

**UI:** <http://localhost:8500>

**Note**: The service discovery configuration below may be outdated. Please refer to the current Consul configuration.

Services automatically register with Consul and health checks are performed every 30 seconds.

### Cache (Redis)

**Port:** 6379

**Note**: The Redis usage details below may be outdated. Please refer to the current Redis configuration.

Used for:

- Session storage
- API response caching
- Rate limiting counters
- Circuit breaker state

---

## 📊 Monitoring & Observability {#monitoring-observability}

### Prometheus (Metrics)

**URL:** <http://localhost:9090>

**Note**: The Prometheus metrics below may be outdated. Please refer to the current monitoring configuration.

**Key Metrics:**

```promql
# Service health status
up{job="booking-service"}

# HTTP request rate
rate(http_requests_total{service="booking-service"}[5m])

# Error rate
rate(http_requests_total{service="booking-service",status=~"5.."}[5m])

# Circuit breaker state
circuit_breaker_state{service="payment-service"}

# Message queue depth
rabbitmq_queue_messages{queue="booking-events"}
```

### Grafana (Dashboards)

**URL:** <http://localhost:3009>

- Username: `admin`
- Password: `admin123`

**Note**: The Grafana dashboards below may be outdated. Please refer to the current Grafana configuration.

**Pre-configured Dashboards:**

1. **Service Overview** - Health status of all services
2. **API Gateway** - Request rates, latencies, errors
3. **Circuit Breakers** - State transitions and failures
4. **Message Queues** - Queue depths, publish/consume rates

### Loki (Logs)

**URL:** <http://localhost:3100>

**Note**: The Loki configuration below may be outdated. Please refer to the current logging configuration.

Query logs in Grafana:

```logql
{service="booking-service"} |= "error"
{container="tripalfa-api-gateway"} | json | level="error"
```

---

## 🚀 Deployment Guide {#deployment-guide}

### Prerequisites

- Docker 24.0+
- Docker Compose 2.20+
- 16GB RAM minimum
- 4 CPU cores minimum

### Quick Start

**Note**: The deployment commands below may be outdated. Please refer to the current deployment documentation.

```bash
# 1. Clone and navigate to project
cd /path/to/tripalfa

# 2. Create environment file
cp .env.example .env
# Edit .env with your configuration

# 3. Build and start all services
docker-compose -f docker-compose.resilient.yml up -d

# 4. Check service health
docker-compose -f docker-compose.resilient.yml ps

# 5. View logs
docker-compose -f docker-compose.resilient.yml logs -f api-gateway
```

### Starting Individual Services

**Note**: The service startup commands below may be outdated. Please refer to the current deployment documentation.

```bash
# Start only infrastructure
docker-compose -f docker-compose.resilient.yml up -d rabbitmq redis postgres-app postgres-static consul

# Start monitoring stack
docker-compose -f docker-compose.resilient.yml up -d prometheus grafana loki promtail

# Start specific service
docker-compose -f docker-compose.resilient.yml up -d booking-service
```

### Scaling Services

**Note**: The scaling commands below may be outdated. Please refer to the current deployment documentation.

```bash
# Scale booking service to 3 instances
docker-compose -f docker-compose.resilient.yml up -d --scale booking-service=3
```

---

## ⚠️ Failure Scenarios & Recovery {#failure-scenarios-recovery}

### Scenario 1: Service Crash

**Note**: The failure scenarios below may be outdated. Please refer to the current resilience and recovery mechanisms.

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                         SERVICE CRASH RECOVERY                                │
│                                                                               │
│  1. Service crashes                                                          │
│     └─▶ Docker detects unhealthy container                                   │
│     └─▶ Automatic restart (restart: unless-stopped)                          │
│                                                                               │
│  2. Health check fails                                                       │
│     └─▶ Service marked unhealthy in Consul                                   │
│     └─▶ API Gateway routes to healthy instances                              │
│     └─▶ Circuit breaker opens after 5 failures                               │
│                                                                               │
│  3. Service recovers                                                         │
│     └─▶ Health check passes                                                  │
│     └─▶ Service marked healthy in Consul                                     │
│     └─▶ Circuit breaker transitions to half-open                             │
│     └─▶ Normal traffic resumes after 3 successes                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Impact:** Zero downtime for users if multiple instances are running.

### Scenario 2: Database Failure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       DATABASE FAILURE HANDLING                                │
│                                                                               │
│  PostgreSQL App Fails:                                                        │
│  └─▶ Services using App DB fail health checks                                │
│  └─▶ Circuit breakers open                                                   │
│  └─▶ Fallback responses returned where applicable                            │
│                                                                               │
│  Services Still Operational:                                                  │
│  └─▶ Static Data Service (uses separate DB)                                  │
│  └─▶ Notification Service (Redis-backed)                                     │
│  └─▶ Rule Engine Service (Redis-backed)                                      │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Impact:** Core services remain available; booking/payment operations return graceful errors.

### Scenario 3: RabbitMQ Failure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                      MESSAGE QUEUE FAILURE                                     │
│                                                                               │
│  RabbitMQ Fails:                                                              │
│  └─▶ Async operations fail                                                   │
│  └─▶ Services continue with sync operations                                  │
│  └─▶ Messages queued locally in memory (temporary)                           │
│                                                                               │
│  RabbitMQ Recovers:                                                           │
│  └─▶ Services reconnect automatically                                        │
│  └─▶ Queued messages delivered                                               │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Impact:** Notifications may be delayed; core booking operations continue.

### Scenario 4: API Gateway Failure

```text
┌──────────────────────────────────────────────────────────────────────────────┐
│                       API GATEWAY FAILURE                                      │
│                                                                               │
│  Primary Gateway Fails:                                                       │
│  └─▶ Load balancer routes to backup gateway                                  │
│  └─▶ Or: Direct service access (if configured)                               │
│                                                                               │
│  All Services Remain Operational:                                             │
│  └─▶ Services continue processing                                            │
│  └─▶ Message queues continue working                                         │
│  └─▶ Databases remain accessible                                             │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Impact:** Temporary unavailability during failover; no data loss.

---

## 📁 Project Structure

```text
packages/
├── resilience/              # Resilience patterns
│   ├── src/
│   │   ├── circuit-breaker.ts    # Circuit breaker implementation
│   │   ├── retry.ts              # Retry with exponential backoff
│   │   ├── service-registry.ts   # Service discovery & health checks
│   │   ├── resilient-client.ts   # Protected HTTP client
│   │   └── index.ts
│   └── package.json
│
├── message-queue/           # Message queue abstraction
│   ├── src/
│   │   ├── types.ts              # Message types and interfaces
│   │   ├── backends/
│   │   │   ├── rabbitmq.ts       # RabbitMQ backend
│   │   │   └── memory.ts         # In-memory backend (testing)
│   │   └── index.ts
│   └── package.json

infrastructure/
├── monitoring/
│   ├── prometheus.yml            # Prometheus configuration
│   ├── loki.yml                  # Loki configuration
│   ├── promtail.yml              # Log collection config
│   └── grafana/
│       └── provisioning/
│           └── datasources/
│               └── datasources.yml

docker-compose.resilient.yml   # Main deployment configuration
```

---

## 🔧 Configuration Reference

### Environment Variables

| Variable                            | Description                    | Default                  |
| ----------------------------------- | ------------------------------ | ------------------------ |
| `ENABLE_CIRCUIT_BREAKER`            | Enable circuit breaker pattern | `true`                   |
| `CIRCUIT_BREAKER_FAILURE_THRESHOLD` | Failures before circuit opens  | `5`                      |
| `CIRCUIT_BREAKER_SUCCESS_THRESHOLD` | Successes to close circuit     | `3`                      |
| `CIRCUIT_BREAKER_TIMEOUT`           | Timeout before half-open (ms)  | `30000`                  |
| `ENABLE_HEALTH_CHECKS`              | Enable health monitoring       | `true`                   |
| `RABBITMQ_URL`                      | RabbitMQ connection URL        | `amqp://localhost:5672`  |
| `REDIS_URL`                         | Redis connection URL           | `redis://localhost:6379` |
| `CONSUL_HOST`                       | Consul host                    | `localhost`              |
| `CONSUL_PORT`                       | Consul port                    | `8500`                   |

---

## 🧪 Testing Resilience

### Test Circuit Breaker

**Note**: The testing commands below may be outdated. Please refer to the current testing procedures.

```bash
# Simulate service failure
docker-compose -f docker-compose.resilient.yml stop payment-service

# Watch circuit breaker open
curl http://localhost:3000/api/payments
# Returns: {"status": "queued", "message": "Payment will be processed later"}

# Restart service
docker-compose -f docker-compose.resilient.yml start payment-service

# Watch circuit breaker recover
curl http://localhost:3000/api/payments
# Returns normal response after 3 successful requests
```

### Test Message Queue

**Note**: The testing commands below may be outdated. Please refer to the current testing procedures.

```bash
# Stop notification service
docker-compose -f docker-compose.resilient.yml stop notification-service

# Create a booking (message queued)
curl -X POST http://localhost:3000/api/bookings -d '{...}'

# Start notification service
docker-compose -f docker-compose.resilient.yml start notification-service

# Message is processed after service recovers
docker-compose -f docker-compose.resilient.yml logs notification-service
```

---

## 📈 Best Practices

1. **Always use circuit breakers** for external service calls
2. **Implement fallback responses** for non-critical operations
3. **Use message queues** for operations that can be delayed
4. **Monitor health checks** and set up alerts
5. **Run multiple instances** of critical services
6. **Test failure scenarios** regularly
7. **Keep services stateless** for easy scaling
8. **Use health endpoints** for all services

---

## 🆘 Troubleshooting

### Service won't start

**Note**: The troubleshooting commands below may be outdated. Please refer to the current troubleshooting procedures.

```bash
# Check logs
docker-compose -f docker-compose.resilient.yml logs booking-service

# Check dependencies
docker-compose -f docker-compose.resilient.yml ps

# Restart specific service
docker-compose -f docker-compose.resilient.yml restart booking-service
```

### Circuit breaker stuck open

**Note**: The troubleshooting commands below may be outdated. Please refer to the current troubleshooting procedures.

```bash
# Check service health
curl http://localhost:3007/health

# Check Prometheus metrics
curl http://localhost:9090/api/v1/query?query=circuit_breaker_state

# Manual reset (if needed)
curl -X POST http://localhost:3000/admin/circuit-breaker/payment-service/reset
```

### High memory usage

**Note**: The troubleshooting commands below may be outdated. Please refer to the current troubleshooting procedures.

```bash
# Check container stats
docker stats

# Scale down non-critical services
docker-compose -f docker-compose.resilient.yml stop marketing-service
```

---

## 📞 Support

**Note**: The support resources below may be outdated. Please refer to the current documentation structure.

- **Documentation:** `/docs`
- **Architecture Decisions:** `/docs/ADR`
- **API Documentation:** `/docs/api/API_DOCUMENTATION.md`
- **Runbooks:** `/docs/runbooks`

---

Built with ❤️ for resilient microservices
