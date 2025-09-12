# Installation Guide for Zenskar MCP Server

## Quick Setup for Claude Desktop

### Step 1: Install the Package
```bash
npm install -g mcp-zenskar
```

### Step 2: Configure Claude Desktop

1. Open Claude Desktop configuration file:
   - **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
   - **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
   - **Linux**: `~/.config/Claude/claude_desktop_config.json`

2. Add the Zenskar MCP server configuration:

```json
{
  "mcpServers": {
    "zenskar": {
      "command": "mcp-zenskar"
    }
  }
}
```

### Step 3: Get Your Credentials

1. **Organization ID**: 
   - Login to your Zenskar dashboard
   - Go to Settings → Organization
   - Copy your Organization ID

2. **API Token**:
   - Go to Settings → API Keys
   - Generate a new API token
   - Copy the Bearer token

### Step 4: Usage in Claude

Now you can ask Claude to interact with Zenskar. **Important**: You'll need to provide your credentials with each request.

Example:
```
Can you list my customers? Use organization ID "your-org-id" and authorization "Bearer your-token"
```

## Alternative Setup Methods

### Method 1: Direct NPX Usage
```bash
npx mcp-zenskar
```

### Method 2: Local Development
```bash
git clone <this-repo>
cd mcp-zenskar
npm install
npm start
```

### Method 3: Environment Variables (Future Feature)
You can set environment variables and modify the server to use them:
```bash
export ZENSKAR_ORGANIZATION="your-org-id"
export ZENSKAR_AUTH_TOKEN="Bearer your-token"
```

## Security Best Practices

1. **Never commit credentials** to version control
2. **Use environment variables** for storing credentials when possible
3. **Rotate API tokens** regularly
4. **Limit token permissions** to minimum required scope
5. **Monitor API usage** in your Zenskar dashboard

## Troubleshooting

### Common Issues

1. **"Organization ID is required"**
   - Ensure you're providing the organization parameter in your requests
   - Check that your organization ID is correct

2. **"Authorization token is required"**
   - Provide the authorization parameter
   - Ensure token starts with "Bearer " or the server will add it

3. **HTTP 401 Unauthorized**
   - Verify your API token is valid and not expired
   - Check that your organization ID is correct
   - Ensure you have proper permissions

4. **HTTP 403 Forbidden**
   - Your token may not have permission for this operation
   - Contact your Zenskar admin to verify permissions

### Debug Mode
To see detailed request logs, check the Claude Desktop logs or run the server manually with debug output.

## Available Operations

The server provides access to all Zenskar API endpoints including:

- Customer management (list, get, create, update)
- Invoice operations (create, retrieve, manage)
- Subscription handling
- Billing operations
- Contact management
- And many more...

For a complete list, see the `mcp-config.json` file in the package.