# Zenskar MCP Server

A Model Context Protocol (MCP) server that provides AI assistants with access to the Zenskar API for customer management, invoicing, and billing operations.

## Features

- **Customer Management**: List, search, create, and update customers
- **Invoice Operations**: Create, retrieve, and manage invoices
- **Subscription Management**: Handle subscription lifecycle
- **Billing Operations**: Process payments and manage billing
- **Multi-tenant Support**: Organization-based access control
- **Secure Authentication**: Bearer token authentication

## Installation

### For Claude Desktop App

Add to your Claude Desktop configuration (`~/Library/Application Support/Claude/claude_desktop_config.json` on macOS):

```json
{
  "mcpServers": {
    "zenskar": {
      "command": "npx",
      "args": ["mcp-zenskar"],
      "env": {
        "ZENSKAR_ORGANIZATION": "your-org-id",
        "ZENSKAR_AUTH_TOKEN": "your-bearer-token"
      }
    }
  }
}
```

### For Other AI Applications

Install globally:
```bash
npm install -g mcp-zenskar
```

Or run directly:
```bash
npx mcp-zenskar
```

## Authentication

This MCP server requires two authentication parameters for every request:

1. **Organization ID**: Your Zenskar organization identifier
2. **Authorization Token**: Your API Bearer token

### Getting Your Credentials

1. **Organization ID**: Available in your Zenskar dashboard settings
2. **API Token**: Generate from Zenskar dashboard → Settings → API Keys

## Usage

### In Claude Desktop

Once configured, you can ask Claude to interact with your Zenskar data:

```
"Show me my recent customers"
"Create an invoice for customer XYZ"
"List all active subscriptions"
```

### Manual Tool Calls

Each tool requires authentication parameters:

```javascript
{
  "organization": "your-org-id",
  "authorization": "Bearer your-token",
  // ... other tool-specific parameters
}
```

## Available Tools

The server provides access to all Zenskar API endpoints including:

- `listCustomers` - Retrieve paginated customer lists
- `getCustomer` - Get specific customer details  
- `createCustomer` - Create new customers
- `updateCustomer` - Update existing customers
- `listInvoices` - Retrieve invoice lists
- `createInvoice` - Generate new invoices
- `getInvoice` - Get invoice details
- And many more...

## Security

- All API requests require valid organization ID and Bearer token
- Multi-tenant isolation ensures data privacy
- No credentials are stored by the MCP server
- All authentication is passed through from the client

## Development

```bash
# Clone the repository
git clone https://github.com/your-org/mcp-zenskar
cd mcp-zenskar

# Install dependencies
npm install

# Run the server
npm start
```

## Configuration

The server uses `src/mcp-config.json` to define available tools and API endpoints. This file contains the complete mapping of MCP tools to Zenskar API operations.

## License

MIT

## Support

For issues and support:
- GitHub Issues: https://github.com/your-org/mcp-zenskar/issues
- Zenskar Documentation: https://docs.zenskar.com