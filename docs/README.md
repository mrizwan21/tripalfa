# TripAlfa - Travel Booking Platform

A modern microservices-based travel booking platform with B2C Booking Engine, B2B Admin Panel, and Super Admin Panel.

## 🏗️ Project Structure

```text
TripAlfa/
├── apps/                    # Frontend applications
│   ├── booking-engine/      # B2C Booking Engine (Vite + React)
│   ├── b2b-admin/           # B2B Admin Panel (Next.js)
│   └── super-admin/         # Super Admin Panel (Vite + React)
│
├── services/                # Backend microservices
│   ├── api-gateway/         # Centralized API Gateway
│   ├── booking-service/     # Booking management
│   ├── inventory-service/   # Inventory & suppliers
│   ├── payment-service/     # Payment processing
│   ├── user-service/        # User authentication
│   ├── notification-service/# Email/SMS notifications
│   └── analytics-service/   # Reporting & analytics
│
├── packages/                # Shared libraries
│   ├── shared-types/        # TypeScript types
│   ├── shared-utils/        # Common utilities
│   └── ui-components/       # Shared React components
│
├── infrastructure/          # Infrastructure configs
│   ├── compose/             # Docker Compose configurations
│   ├── k8s/                 # Kubernetes manifests
│   ├── nginx/               # NGINX configs
│   ├── monitoring/          # Prometheus, Grafana
│   ├── scripts/             # Deployment scripts
│   └── wicked/              # Wicked API management configs
│
├── database/                # Database schemas
│   └── prisma/              # Prisma schema & migrations
│
└── docs/                    # Documentation
    ├── architecture/        # Architecture documentation
    ├── api/                 # API documentation
    └── guides/              # Development guides
```

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm (workspaces enabled)

### Installation

```bash
# Install all dependencies
npm install

# Generate Prisma client
npm run db:generate

# Start development
npm run dev
```

### Running Individual Apps

```bash
# Booking Engine (port 3001)
npm run dev --workspace=@tripalfa/booking-engine

# B2B Admin (port 3000)
npm run dev --workspace=@tripalfa/b2b-admin

# Super Admin (port 3002)
npm run dev --workspace=@tripalfa/super-admin
```

### Running Services

```bash
# Start all services with Docker
docker-compose -f infrastructure/compose/docker-compose.yml up -d

# Or run individual service
npm run dev --workspace=@tripalfa/booking-service
```

## 📖 Documentation

- [Architecture Overview](./docs/architecture/microservices.md)
- [System Design](./docs/architecture/system-design.md)
- [API Gateway](./docs/api/gateway.md)
- [Deployment Guide](./docs/guides/deployment.md)
- [Quick Start Guide](./docs/guides/quick-start.md)

## 🛠️ Development

### Workspaces

This project uses npm workspaces for monorepo management:

| Workspace | Description | Port |
| -------- | ----------- | --- |
| `@tripalfa/booking-engine` | B2C Booking Frontend | 3001 |
| `@tripalfa/b2b-admin` | B2B Admin Frontend | 3000 |
| `@tripalfa/super-admin` | Super Admin Frontend | 3002 |
| `@tripalfa/api-gateway` | API Gateway | 3000 |
| `@tripalfa/booking-service` | Booking Service | 3001 |

### Database

```bash
# Run migrations
npm run db:migrate

# Push schema changes
npm run db:push

# Generate Prisma client
npm run db:generate
```

## 📦 Services Overview

| Service | Port | Description |
| ----- | --- | ----------- |
| API Gateway | 3000 | Request routing, auth, rate limiting |
| Booking Service | 3001 | Flight/hotel bookings |
| Inventory Service | 3002 | Real-time inventory |
| Payment Service | 3003 | Payment processing |
| User Service | 3004 | Authentication & profiles |
| Notification Service | 3009 | Email/SMS notifications |
| Analytics Service | 3006 | Business intelligence |

## 🤝 Contributing

We welcome contributions! Please follow these steps:

### Development Setup

1. **Fork the repository**

   ```bash
   git clone https://github.com/your-username/tripalfa.git
   cd tripalfa
   ```

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Set up the database**

   ```bash
   npm run db:generate
   npm run db:migrate
   ```

4. **Start development servers**

   ```bash
   npm run dev
   ```

### Development Workflow

1. **Create a feature branch**

   ```bash
   git checkout -b feature/your-feature-name
   ```

2. **Make your changes**
   - Follow the existing code style
   - Add tests for new features
   - Update documentation as needed

3. **Run quality checks**

   ```bash
   # Type checking
   npx tsc -p tsconfig.json --noEmit

   # Build verification
   npm run build

   # Run tests
   npm test
   ```

4. **Commit your changes**

   ```bash
   git add .
   git commit -m "feat: add your feature description"
   ```

5. **Push and create a PR**

   ```bash
   git push origin feature/your-feature-name
   ```

### Code Quality Standards

- **TypeScript**: Strict type checking enabled
- **Testing**: Write tests for new features
- **Linting**: Follow ESLint configuration
- **Commits**: Use conventional commit format
- **PRs**: Include description and link to issues

### Architecture Guidelines

- **Frontend**: React with TypeScript, Vite for building
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Microservices**: Independent services with API Gateway
- **State Management**: React Query for client state

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
