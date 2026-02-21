import { defineConfig } from '@modelcontextprotocol/sdk/server/config.js';
import { NeonDatabaseServer } from './mcp-servers/neon-database-server.js';

export default defineConfig({
  name: 'neon-database-server',
  version: '1.0.0',
  description: 'MCP server for Neon PostgreSQL database operations',
  servers: {
    neonDatabase: {
      handler: new NeonDatabaseServer(),
    },
  },
});