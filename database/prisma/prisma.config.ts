import 'dotenv/config';
import { defineConfig, env } from 'prisma/config';

export default defineConfig({
  schema: 'database/prisma/schema.prisma',
  migrations: {
    path: 'database/prisma/migrations',
  },
  datasource: {
    url: env('DIRECT_DATABASE_URL') || env('STATIC_DATABASE_URL') || env('DATABASE_URL'),
  },
});
