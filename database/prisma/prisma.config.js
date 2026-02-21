require('dotenv/config');

module.exports = {
  schema: 'schema.prisma',
  migrations: {
    path: 'migrations',
  },
  datasource: {
    url: process.env.DATABASE_URL,
  },
};
