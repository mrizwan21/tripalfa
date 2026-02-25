import { defineConfig } from '@modelcontextprotocol/sdk/server/config.js';

/**
 * LITEAPI MCP Server Configuration
 * 
 * LiteAPI provides an MCP (Model Context Protocol) server that allows AI systems,
 * agents, and LLM-based applications to securely access LiteAPI capabilities.
 * 
 * Endpoint: https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_API_KEY
 * 
 * Supported capabilities:
 * - Booking flows
 * - Prebooking
 * - Hotel details retrieval
 * - Place search
 * - Price and availability lookup
 * - Hotel search
 * 
 * Documentation: https://docs.liteapi.travel/reference/mcp-server
 */

// Get API key from environment - prefer sandbox for development
const getLiteApiKey = () => {
  return process.env.LITEAPI_MCP_API_KEY || process.env.LITEAPI_TEST_API_KEY || '';
};

const liteApiKey = getLiteApiKey();
const isSandbox = !liteApiKey || liteApiKey.startsWith('sand_');

export default defineConfig({
  name: 'tripalfa-mcp-servers',
  version: '1.0.0',
  description: 'MCP servers for TripAlfa - LITEAPI for hotel bookings',
  servers: {
    /**
     * LITEAPI MCP Server
     * 
     * HTTP-based MCP server that provides access to LiteAPI's hotel booking
     * and travel data capabilities.
     * 
     * Usage in AI tools (Claude Desktop, etc.):
     * {
     *   "mcpServers": {
     *     "liteapi": {
     *       "url": "https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_API_KEY"
     *     }
     *   }
     * }
     */
    liteapi: {
      url: `https://mcp.liteapi.travel/api/mcp?apiKey=${liteApiKey || 'YOUR_API_KEY'}`,
      // For tools that support external MCP servers via URL
      _meta: {
        type: 'external',
        description: 'LITEAPI hotel booking and travel data MCP server',
        environmentVariable: 'LITEAPI_MCP_API_KEY',
        sandboxUrl: 'https://mcp.liteapi.travel/api/mcp?apiKey=sand_xxxxxxxx-xxxx-xxxx-xxxx-xxxxxxxxxxxx',
        productionUrl: 'https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_PRODUCTION_KEY',
        docs: 'https://docs.liteapi.travel/reference/mcp-server',
        capabilities: [
          'Hotel search',
          'Price and availability lookup',
          'Hotel details retrieval',
          'Prebooking',
          'Booking flows',
          'Place search'
        ],
        isSandbox
      }
    },
  },
});
