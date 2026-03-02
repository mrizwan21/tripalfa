# TripAlfa - Travel Booking Platform

A modern microservices-based travel booking platform with B2C Booking Engine, B2B Admin Panel, and Super Admin Panel.

## 🏗️ Project Structure

```text
TripAlfa - Node/
├── apps/                         # Frontend applications
│   ├── booking-engine/           # B2C booking frontend (Vite + React)
│   └── b2b-admin/                # B2B admin frontend (Vite + React)
├── services/                     # Backend microservices
│   ├── api-gateway/
│   ├── booking-service/
│   ├── booking-engine-service/
│   ├── b2b-admin-service/
│   ├── payment-service/
│   ├── user-service/
│   ├── notification-service/
│   ├── kyc-service/
│   ├── marketing-service/
│   ├── organization-service/
│   ├── wallet-service/
│   └── rule-engine-service/
├── packages/                     # Shared workspace packages
│   ├── api-clients/
│   ├── message-queue/
│   ├── notifications/
│   ├── resilience/
│   ├── rules/
│   ├── shared-database/
│   ├── shared-types/
│   ├── shared-utils/
│   ├── static-data/
│   ├── ui-components/
│   └── wallet/
├── database/
│   ├── prisma/                   # Main Prisma schema & migrations
│   └── static-db/                # Static reference DB assets
├── infrastructure/               # Compose, monitoring, nginx, templates
├── scripts/                      # Local scripts, setup, verification
├── docs/                         # Product, architecture, API, deployment docs
├── types/                        # Global ambient type declarations
└── mcp-wikivoyage/               # Local MCP server workspace
```

For strict placement rules and an enforceable directory map, see [Repository Structure Guide](./REPOSITORY_STRUCTURE.md).

## 🚀 Quick Start

### Prerequisites

- Node.js 18+
- Docker & Docker Compose
- npm (workspaces enabled)

### Installation

```bash
# Install all dependencies
pnpm install

# Generate Prisma client
pnpm run db:generate

# Start development
pnpm run dev
```

### Running Individual Apps

```bash
# Booking Engine (port 5176)
pnpm run dev --workspace=@tripalfa/booking-engine

# B2B Admin (port 5173)
pnpm run dev --workspace=@tripalfa/b2b-admin
```

### Running Services

```bash
# Start all services with Docker
docker compose -f infrastructure/compose/docker-compose.yml up -d

# Or run individual service
pnpm run dev --workspace=@tripalfa/booking-service
```

## 📖 Documentation

- [Repository Structure Guide](./REPOSITORY_STRUCTURE.md)
- [Documentation Index](./DOCUMENTATION_INDEX.md)
- [Architecture Overview](./architecture/microservices.md)
- [Backend Services](./architecture/BACKEND_SERVICES.md)
- [API Documentation](./api/API_DOCUMENTATION.md)
- [Deployment Guide](./operations/deployment.md)

### Documentation Categories

- `architecture/`: system architecture, service topology, resilience
- `api/`: contracts, endpoint documentation, API integration testing
- `integrations/`: supplier and external integration guides (Duffel, LiteAPI, wallet)
- `operations/`: deployment, optimization, runbooks, quick references
- `specs/`: product requirements, SRS, phased specifications
- `status/`: implementation and feature status summaries
- `migrations/`: migration-specific implementation notes

## 🛠️ Development

### Workspaces

This project uses pnpm workspaces for monorepo management:

| Workspace                   | Description          | Port |
| --------------------------- | -------------------- | ---- |
| `@tripalfa/booking-engine`  | B2C Booking Frontend | 5176 |
| `@tripalfa/b2b-admin`       | B2B Admin Frontend   | 5173 |
| `@tripalfa/api-gateway`     | API Gateway          | 3000 |
| `@tripalfa/booking-service` | Booking Service      | 3001 |

### Database

```bash
# Run migrations
pnpm run db:migrate

# Push schema changes
pnpm run db:push

# Generate Prisma client
pnpm run db:generate
```

## 📦 Services Overview

| Service                | Description                                        |
| ---------------------- | -------------------------------------------------- |
| API Gateway            | Request routing, auth, cross-service orchestration |
| Booking Service        | Core flight/hotel booking domain logic             |
| Booking Engine Service | Backend APIs supporting the booking frontend       |
| B2B Admin Service      | Backend APIs supporting B2B admin workflows        |
| Payment Service        | Wallet, payments, and transaction orchestration    |
| User Service           | Authentication and user profile management         |
| Notification Service   | Email/SMS notification orchestration               |
| KYC Service            | Identity and compliance workflows                  |
| Marketing Service      | Campaign and engagement workflows                  |
| Organization Service   | Enterprise and B2B organization management         |
| Wallet Service         | Wallet-specific operations and balances            |
| Rule Engine Service    | Dynamic business rules and policy execution        |

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
   pnpm install
   ```

3. **Set up the database**

   ```bash
   pnpm run db:generate
   pnpm run db:migrate
   ```

4. **Start development servers**

   ```bash
   pnpm run dev
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
   pnpm run build

   # Run tests
   pnpm test
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
- **Package Manager**: Use pnpm for all operations

### Architecture Guidelines

- **Frontend**: React with TypeScript, Vite for building
- **Backend**: Node.js with Express, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Microservices**: Independent services with API Gateway
- **State Management**: React Query for client state

## 📄 License

MIT License - See [LICENSE](./LICENSE) for details.
