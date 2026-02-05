# WickedHauffe API Management - Run Instructions

This repository contains the configuration for the WickedHauffe API Management system.

> **Note for Apple Silicon Users**: This setup treats `wicked-kong` as standard `kong:latest` to ensure ARM64 compatibility.

## Prerequisites
- Docker
- Docker Compose

## Setup
If running for the first time, ensure `infrastructure/wicked/wicked-config` contains the necessary templates (globals.json, env/docker.json, etc.). These have been pre-hydrated.

## Quick Start
To start the entire WickedHauffe stack (Portal, Gateway, API, Auth), run:

```bash
docker-compose -f infrastructure/compose/docker-compose.wicked.yml up -d
```

## Services
| Service | URL | Description |
| :--- | :--- | :--- |
| **API Portal** | `http://localhost:3001` | The developer portal for discovering APIs. |
| **API Gateway** | `http://localhost:8000` | The Kong API Gateway. |
| **Admin API** | `http://localhost:8001` | Kong Admin API (Internal). |

## Data Persistence
Data is persisted in Docker named volumes:
- `wicked-mongo-data`
- `wicked-redis-data`
- `wicked-postgres-data`

## Configuration
The system is configured via the `infrastructure/wicked/wicked-config` directory. Changes to files in `infrastructure/wicked/wicked-config/` (like `apis/`, `auth/`, etc.) will be reflected after restarting the containers.

## Troubleshooting
If services fail to start, check the logs:
```bash
docker-compose -f infrastructure/compose/docker-compose.wicked.yml logs -f
```

**Note:** Ensure ports `3001` and `8000` are not in use by other services (like the custom `api-portal` or `api-gateway`) before starting.
