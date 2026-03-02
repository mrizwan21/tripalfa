# MCP Servers Configuration

This directory contains the Model Context Protocol (MCP) server configurations for TripAlfa. MCP is a standardized protocol that allows AI systems to interact with external services through structured tools.

## Available MCP Servers

### LITEAPI MCP Server

**Purpose**: Hotel booking and travel data search

**Endpoint**: `https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_API_KEY`

**Documentation**: <https://docs.liteapi.travel/reference/mcp-server>

**Supported Capabilities**:

- Hotel search
- Price and availability lookup
- Hotel details retrieval
- Prebooking
- Booking flows
- Place search

## Configuration

### Environment Variables

Add the following to your `.env.local` file:

```bash
# LITEAPI Configuration
LITEAPI_TEST_API_KEY=sand_e79a7012-2820-4644-874f-ea71a9295a0e
LITEAPI_PROD_API_KEY=your_production_key
LITEAPI_MCP_API_KEY=${LITEAPI_TEST_API_KEY}
```

### Using with Claude Desktop

To use the LITEAPI MCP server with Claude Desktop, add the following to your Claude Desktop settings:

```json
{
  "mcpServers": {
    "liteapi": {
      "url": "https://mcp.liteapi.travel/api/mcp?apiKey=sand_e79a7012-2820-4644-874f-ea71a9295a0e"
    }
  }
}
```

### Using with Other AI Tools

The LITEAPI MCP server can be used with any AI tool that supports MCP servers. Simply configure the server URL with your API key:

```text
https://mcp.liteapi.travel/api/mcp?apiKey=YOUR_API_KEY
```

## Security Considerations

- **Never expose production API keys** in client-side applications
- Store API keys securely using environment variables or secret managers
- Monitor agent behavior to prevent excessive calls
- Implement retry and backoff logic for API calls
- Rate limits: 500 requests per second (default)

## Rate Limits

- **Default**: 500 requests per second
- Monitoring available in the LiteAPI dashboard
- Usage billed according to endpoint pricing

## Sandbox vs Production

- **Sandbox**: Use keys starting with `sand_` for testing
- **Production**: Use production keys for live bookings

The MCP server automatically detects whether you're using sandbox or production based on the API key prefix.

## API Documentation

For detailed API documentation, visit: <https://docs.liteapi.travel/reference/overview>

## Support

- LiteAPI Dashboard: <https://dashboard.liteapi.travel>
- Documentation: <https://docs.liteapi.travel>
- Support: Contact LiteAPI support team
