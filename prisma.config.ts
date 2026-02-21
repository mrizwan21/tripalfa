import 'dotenv/config'
import { defineConfig, env } from 'prisma/config'

export default defineConfig({
  schema: 'database/prisma/schema.prisma',
  migrations: {
    path: 'database/prisma/migrations',
  },
  datasource: {
    // Use DATABASE_URL by default (Neon for wallet/payment services)
    // Falls back to DIRECT_DATABASE_URL for migrations
    // STATIC_DATABASE_URL is for local Docker development only
    url: env('DATABASE_URL') || env('DIRECT_DATABASE_URL') || env('STATIC_DATABASE_URL', 'postgresql://postgres:postgres@localhost:5433/staticdatabase'),
  },
})
