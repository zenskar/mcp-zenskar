#!/usr/bin/env node

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import fs from 'fs';
import path from 'path';
import { z } from 'zod';
import { fileURLToPath } from 'url';

// Get __dirname equivalent for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Import the response processor
import ResponseProcessor from './response-processor.js';

// Load the configuration
const configPath = path.join(__dirname, 'mcp-config.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));

// Logger configuration
const logger = {
  info: (message, data) => console.error(`[INFO] ${message}`, data || ''),
  error: (message, data) => console.error(`[ERROR] ${message}`, data || ''),
  warn: (message, data) => console.error(`[WARN] ${message}`, data || ''),
  debug: (message, data) => console.error(`[DEBUG] ${message}`, data || '')
};

const CLICKHOUSE_DATETIME_KEYS = ['DateTime64', 'DateTime', 'DateTime32'];

function formatClickHouseDateTime(value) {
  if (typeof value !== 'string') {
    return value;
  }

  return value
    .replace('T', ' ')
    .replace('t', ' ')
    .replace(/Z$/i, '')
    .trim();
}

function normalizeUsageEventPayload(eventPayload) {
  if (!eventPayload || typeof eventPayload !== 'object' || Array.isArray(eventPayload)) {
    return eventPayload;
  }

  const normalized = { ...eventPayload };

  if (typeof normalized.timestamp === 'string') {
    normalized.timestamp = formatClickHouseDateTime(normalized.timestamp);
  }

  if (normalized.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)) {
    normalized.data = { ...normalized.data };

    CLICKHOUSE_DATETIME_KEYS.forEach(key => {
      if (typeof normalized.data[key] === 'string') {
        normalized.data[key] = formatClickHouseDateTime(normalized.data[key]);
      }
    });
  }

  return normalized;
}

// User context validation schema
const userContextSchema = z.object({
  organization: z.string().describe('Organization ID for multi-tenant API access'),
  authorization: z.string().describe('Bearer token for API authentication'),
}).describe('Required authentication context for Zenskar API');

class ZenskarMcpServer {
  constructor() {
    this.server = new McpServer({
      name: config.server.name,
      version: "1.0.0"
    });

    this.responseProcessor = new ResponseProcessor();
    this.setupTools();
  }

  setupTools() {
    // Register each tool from the configuration
    config.tools.forEach(tool => {
      this.server.registerTool(tool.name, {
        description: tool.description,
        inputSchema: this.generateInputSchema(tool)
      }, async (args) => {
        try {
          return await this.executeTool(tool, args);
        } catch (error) {
          logger.error(`Tool execution failed for ${tool.name}:`, error.message);
          return {
            content: [
              {
                type: "text",
                text: `Error: ${error.message}`
              }
            ]
          };
        }
      });
    });
  }

  generateInputSchema(tool) {
    const schemaObj = {
      organization: z.string().describe("Organization ID for multi-tenant API access (required)"),
      authorization: z.string().describe("Bearer token for API authentication (required)")
    };

    // Add tool-specific arguments
    tool.args.forEach(arg => {
      let schema;
      switch(arg.type) {
        case 'string':
          schema = z.string();
          break;
        case 'integer':
        case 'number':
          schema = z.number();
          break;
        case 'boolean':
          schema = z.boolean();
          break;
        case 'object':
          schema = z.record(z.any());
          break;
        case 'array':
          schema = z.array(z.any());
          break;
        default:
          schema = z.string();
      }
      
      schema = schema.describe(arg.description);
      
      if (!arg.required) {
        schema = schema.optional();
      }

      schemaObj[arg.name] = schema;
    });

    return schemaObj;
  }

  async executeTool(tool, args) {
    // Extract authentication from arguments
    const { organization, authorization, ...toolArgs } = args;

    // Validate required authentication
    if (!organization) {
      throw new Error('Organization ID is required for API access');
    }
    if (!authorization) {
      throw new Error('Authorization token is required for API access');
    }

    logger.info(`[${tool.name}] Executing with organization: ${organization.substring(0, 10)}...`);

    // Build headers
    const headers = {
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'organisation': organization, // Note: API uses 'organisation' not 'organization'
      'Authorization': authorization.startsWith('Bearer ') ? authorization : `Bearer ${authorization}`
    };

    // Build URL from requestTemplate
    let url = `${config.server.baseUrl}${tool.requestTemplate.url}`;
    const method = tool.requestTemplate.method;
    
    // Add path parameters
    tool.args.forEach(arg => {
      if (arg.position === 'path' && toolArgs[arg.name]) {
        url = url.replace(`{${arg.name}}`, toolArgs[arg.name]);
      }
    });

    // Add query parameters
    const queryParams = new URLSearchParams();
    tool.args.forEach(arg => {
      if (arg.position === 'query' && toolArgs[arg.name] !== undefined) {
        queryParams.append(arg.name, toolArgs[arg.name]);
      }
    });

    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    // Prepare request body for POST/PUT/PATCH requests
    let body = null;
    if (['POST', 'PUT', 'PATCH'].includes(method.toUpperCase())) {
      const bodyArgs = {};
      tool.args.forEach(arg => {
        if (arg.position === 'body' && toolArgs[arg.name] !== undefined) {
          if (tool.name === 'ingestRawMetricEvent' && arg.name === 'event') {
            const eventPayload = normalizeUsageEventPayload(toolArgs[arg.name]);
            if (eventPayload && typeof eventPayload === 'object' && !Array.isArray(eventPayload)) {
              Object.entries(eventPayload).forEach(([key, value]) => {
                if (value !== undefined) {
                  bodyArgs[key] = value;
                }
              });
            } else {
              bodyArgs[arg.name] = eventPayload;
            }
          } else {
            bodyArgs[arg.name] = toolArgs[arg.name];
          }
        }
      });

      if (tool.name === 'createRawMetric') {
        if (!bodyArgs.connector) {
          bodyArgs.connector = toolArgs.connector || 'push_to_zenskar';
        }
        if (!bodyArgs.api_type) {
          bodyArgs.api_type = toolArgs.api_type || 'PUSH';
        }
        if (!bodyArgs.dataschema) {
          bodyArgs.dataschema = {
            customer_id: 'String',
            timestamp: 'DateTime64',
            data: {
              String: 'String',
              Int64: 'Int64',
              Float64: 'Float64',
              Date32: 'Date32',
              DateTime64: 'DateTime64',
              UUID: 'UUID',
              Bool: 'Bool'
            }
          };
        }
        if (!bodyArgs.column_order) {
          bodyArgs.column_order = ['timestamp'];
        }
      }
      
      if (Object.keys(bodyArgs).length > 0) {
        body = JSON.stringify(bodyArgs);
      }
    }

    logger.debug(`[${tool.name}] Making ${method} request to: ${url}`);

    try {
      const response = await fetch(url, {
        method: method,
        headers,
        body
      });

      const responseText = await response.text();
      
      if (!response.ok) {
        logger.error(`[${tool.name}] HTTP ${response.status}: ${responseText}`);
        throw new Error(`HTTP ${response.status}: ${responseText}`);
      }

      // Process response
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = responseText;
      }

      // Use response processor for formatting
      const processedResponse = this.responseProcessor.processResponse(responseData, tool.name);
      
      logger.info(`[${tool.name}] Request successful`);

      return {
        content: [
          {
            type: "text",
            text: processedResponse
          }
        ]
      };

    } catch (error) {
      const errorMessage = `Error executing ${tool.name}: ${error.message}\n\nThis might be due to:\n- Invalid parameters\n- API rate limiting\n- Network connectivity issues\n- Authentication problems (check organization ID and Bearer token)\n\nPlease verify your credentials and try again.`;
      
      logger.error(`[${tool.name}] Request failed: ${error.message}`);
      
      throw new Error(errorMessage);
    }
  }

  async run() {
    const transport = new StdioServerTransport();
    await this.server.connect(transport);
    logger.info(`${config.server.name} MCP server running`);
  }
}

// Start the server when run directly
const server = new ZenskarMcpServer();
server.run().catch(error => {
  logger.error('Failed to start server:', error);
  process.exit(1);
});

export default ZenskarMcpServer;
