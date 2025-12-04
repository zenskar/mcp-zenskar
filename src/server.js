#!/usr/bin/env node

const { McpServer } = require('@modelcontextprotocol/sdk/server/mcp.js');
const { StdioServerTransport } = require('@modelcontextprotocol/sdk/server/stdio.js');
const fs = require('fs');
const path = require('path');
const { z } = require('zod');
const { v4: uuidv4 } = require('uuid');

// Import the sophisticated response processor
const ResponseProcessor = require('./response-processor.js');

// Import token usage monitor (try both compiled and source paths)
let tokenUsageMonitor;
try {
  // Try production path first (compiled TypeScript)
  const monitor = require('../dist/lib/token-usage-monitor.js');
  tokenUsageMonitor = monitor.tokenUsageMonitor;
} catch (e) {
  // Fall back to development path (TypeScript via ts-node)
  try {
    const monitor = require('../src/lib/token-usage-monitor.ts');
    tokenUsageMonitor = monitor.tokenUsageMonitor;
  } catch (e2) {
    // If monitor can't be loaded, create fallback
    tokenUsageMonitor = {
      logUsage: async (usage) => {
        console.warn('Token usage monitoring unavailable:', usage);
      }
    };
    console.error('Warning: Token usage monitoring unavailable:', e2.message);
  }
}

// Import limits validation (try both compiled and source paths)
let validateToolLimits, generateTokenUsageFeedback;
try {
  // Try production path first (compiled TypeScript)
  const limits = require('../dist/lib/mcp-limits.js');
  validateToolLimits = limits.validateToolLimits;
  generateTokenUsageFeedback = limits.generateTokenUsageFeedback;
} catch (e) {
  // Fall back to development path (TypeScript via ts-node)
  try {
    const limits = require('../src/lib/mcp-limits.ts');
    validateToolLimits = limits.validateToolLimits;
    generateTokenUsageFeedback = limits.generateTokenUsageFeedback;
  } catch (e2) {
    // If limits can't be loaded, create fallback functions
    validateToolLimits = (toolName, args) => ({ valid: true, adjustedArgs: args, warnings: [], errors: [] });
    generateTokenUsageFeedback = (toolName, args) => ({ message: 'Limits validation unavailable', severity: 'info', suggestions: [] });
    console.error('Warning: MCP limits validation unavailable:', e2.message);
  }
}

// Create enhanced logger for MCP server with timestamps and better formatting
const logger = {
  debug: (message, data) => {
    if (process.env.MCP_DEBUG === 'true') {
      const timestamp = new Date().toISOString();
      console.error(`[${timestamp}] [MCP-DEBUG] ${message}`, data ? JSON.stringify(data, null, 2) : '');
    }
  },
  info: (message, data) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [MCP-INFO] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  error: (message, data) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [MCP-ERROR] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  },
  warn: (message, data) => {
    const timestamp = new Date().toISOString();
    console.error(`[${timestamp}] [MCP-WARN] ${message}`, data ? JSON.stringify(data, null, 2) : '');
  }
};

// Load your OpenAPI-generated MCP configuration
const mcpConfigPath = path.join(__dirname, 'mcp-config.json');
let mcpConfig;

try {
  mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'));
} catch (error) {
  console.error('Failed to load MCP config:', error.message);
  console.error('Please ensure mcp-config.json exists in the project root');
  process.exit(1);
}

// Create MCP server
const server = new McpServer({
  name: mcpConfig.server?.name || "zenskar-api-server",
  version: "1.0.0"
});

// Initialize the sophisticated response processor
const responseProcessor = new ResponseProcessor();

// Normalize usage ingestion payload values to ClickHouse-friendly formats
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

    const dateTimeKeys = ['DateTime64', 'DateTime', 'DateTime32'];
    dateTimeKeys.forEach(key => {
      if (typeof normalized.data[key] === 'string') {
        normalized.data[key] = formatClickHouseDateTime(normalized.data[key]);
      }
    });
  }

  return normalized;
}

function formatClickHouseDateTime(value) {
  if (typeof value !== 'string') {
    return value;
  }

  // Replace ISO 8601 separators with ClickHouse-friendly format and strip trailing Z offsets
  return value
    .replace('T', ' ')
    .replace('t', ' ')
    .replace(/Z$/i, '')
    .trim();
}

function normalizeClickHouseType(type) {
  if (typeof type !== 'string') {
    return type;
  }

  const trimmed = type.trim();
  if (!trimmed) {
    return type;
  }

  const lower = trimmed.toLowerCase();
  switch (lower) {
    case 'boolean':
      return 'Bool';
    case 'string':
      return 'String';
    case 'int':
    case 'int64':
      return 'Int64';
    case 'float':
    case 'float64':
    case 'double':
      return 'Float64';
    case 'date':
    case 'date32':
      return 'Date32';
    case 'datetime':
    case 'datetime64':
      return 'DateTime64';
    case 'uuid':
      return 'UUID';
    default:
      return trimmed;
  }
}

function normalizeRawMetricDataschema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return schema;
  }

  const normalized = { ...schema };

  if (normalized.customer_id) {
    normalized.customer_id = normalizeClickHouseType(normalized.customer_id);
  }
  if (normalized.timestamp) {
    normalized.timestamp = normalizeClickHouseType(normalized.timestamp);
  }

  if (normalized.data && typeof normalized.data === 'object' && !Array.isArray(normalized.data)) {
    const dataSchema = {};
    Object.entries(normalized.data).forEach(([key, value]) => {
      dataSchema[key] = normalizeClickHouseType(value);
    });
    normalized.data = dataSchema;
  }

  return normalized;
}

// Helper function to convert OpenAPI args to Zod schema
function convertArgsToZodSchema(args) {
  const schemaObj = {};
  
  args.forEach(arg => {
    let zodType;
    
    if (arg.type === 'integer' || arg.type === 'number') {
      zodType = z.number();
    } else if (arg.type === 'boolean') {
      zodType = z.boolean();
    } else if (arg.type === 'object') {
      zodType = z.record(z.any());
    } else if (arg.type === 'array') {
      zodType = z.array(z.any());
    } else {
      zodType = z.string();
    }
    
    // Handle default values
    if (arg.default !== undefined) {
      zodType = zodType.default(arg.default);
    }
    
    if (!arg.required) {
      zodType = zodType.optional();
    }
    
    if (arg.description) {
      zodType = zodType.describe(arg.description);
    }
    
    schemaObj[arg.name] = zodType;
  });
  
  // Add __userContext as an optional object parameter for all tools
  schemaObj['__userContext'] = z.object({
    userId: z.string().optional(),
    authorization: z.string().optional(),
    organization: z.string().optional(),
    apiKey: z.string().optional(),
    headers: z.object({}).optional(),
    // Add approval support for human-in-the-loop workflow
    approval: z.object({
      approved: z.boolean(),
      modifiedArguments: z.record(z.any()).optional(),
      originalArguments: z.record(z.any()).optional(),
      toolName: z.string().optional()
    }).optional()
  }).optional().describe('Internal user context for multi-tenant authentication and approval workflow');
  
  return schemaObj;
}

// Enhanced API execution with better error handling and logging
async function executeAPICall(tool, args) {
  const startTime = Date.now();
  
  // Handle system tools that don't require API calls
  if (tool.name === 'getCurrentDateTime') {
    const now = new Date();
    return {
      currentDate: now.toISOString().split('T')[0],
      currentDateTime: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      humanReadable: now.toLocaleString()
    };
  }
  
  // Debug: Log raw args received
  logger.debug(`[${tool.name}] Raw args received:`, {
    argKeys: Object.keys(args),
    argValues: JSON.stringify(args, null, 2)
  });
  
  // Extract user context from args (if provided)
  const userContext = args.__userContext;
  const cleanArgs = { ...args };
  delete cleanArgs.__userContext; // Remove internal context from API args
  
  // Debug: Log what we received
  logger.debug(`[${tool.name}] User context received:`, userContext ? {
    hasUserId: !!userContext.userId,
    hasAuthorization: !!userContext.authorization,
    hasOrganization: !!userContext.organization,
    authPrefix: userContext.authorization ? userContext.authorization.substring(0, 20) + '...' : 'none'
  } : 'NO USER CONTEXT');
  
  // Build the request URL
  let url = tool.requestTemplate?.url || '/';
  const method = tool.requestTemplate?.method || 'GET';
  
  // Check if URL is absolute (starts with http/https) or relative
  const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://');
  
  logger.debug(`[${tool.name}] Executing ${method} request with args:`, JSON.stringify(cleanArgs, null, 2));
  if (userContext) {
    logger.debug(`[${tool.name}] Using user context:`, {
      hasApiKey: !!userContext.apiKey,
      hasOrganization: !!userContext.organization,
      userId: userContext.userId
    });
  }
  
  // Replace path parameters
  if (tool.args) {
    tool.args.forEach(arg => {
      if (arg.position === 'path' && cleanArgs[arg.name] !== undefined) {
        url = url.replace(`{${arg.name}}`, encodeURIComponent(cleanArgs[arg.name]));
      }
    });
  }

  // Build query parameters with intelligent handling
  const queryParams = new URLSearchParams();
  if (tool.args) {
    tool.args.forEach(arg => {
      if (arg.position === 'query' && cleanArgs[arg.name] !== undefined && cleanArgs[arg.name] !== null && cleanArgs[arg.name] !== '') {
        // Handle different data types properly
        if (typeof cleanArgs[arg.name] === 'boolean') {
          queryParams.append(arg.name, cleanArgs[arg.name].toString());
        } else if (Array.isArray(cleanArgs[arg.name])) {
          // Handle array parameters
          cleanArgs[arg.name].forEach(value => {
            queryParams.append(arg.name, value);
          });
        } else {
          queryParams.append(arg.name, cleanArgs[arg.name]);
        }
      }
    });
  }

  // Handle additional parameters intelligently
  Object.keys(cleanArgs).forEach(key => {
    if (!queryParams.has(key) && cleanArgs[key] !== undefined && cleanArgs[key] !== null && cleanArgs[key] !== '') {
      const isPathParam = tool.args?.some(arg => arg.position === 'path' && arg.name === key);
      const isBodyParam = tool.args?.some(arg => arg.position === 'body' && arg.name === key);
      
      if (!isPathParam && !isBodyParam) {
        if (typeof cleanArgs[key] === 'boolean') {
          queryParams.append(key, cleanArgs[key].toString());
        } else if (Array.isArray(cleanArgs[key])) {
          cleanArgs[key].forEach(value => {
            queryParams.append(key, value);
          });
        } else {
          queryParams.append(key, cleanArgs[key]);
        }
      }
    }
  });

  if (queryParams.toString()) {
    url += '?' + queryParams.toString();
  }

  // Build request body
  let body = null;
  if (method !== 'GET' && method !== 'DELETE' && tool.args) {
    const bodyParams = {};
    tool.args.forEach(arg => {
      if (arg.position === 'body' && cleanArgs[arg.name] !== undefined) {
        if (tool.name === 'ingestRawMetricEvent' && arg.name === 'event') {
          const eventPayload = normalizeUsageEventPayload(cleanArgs[arg.name]);
          if (eventPayload && typeof eventPayload === 'object' && !Array.isArray(eventPayload)) {
            // Flatten usage event payload so it matches the API contract
            Object.entries(eventPayload).forEach(([key, value]) => {
              if (value !== undefined) {
                bodyParams[key] = value;
              }
            });
          } else {
            bodyParams[arg.name] = eventPayload;
          }
        } else {
          bodyParams[arg.name] = cleanArgs[arg.name];
        }
      }
    });
    
    // Smart defaults for helper tools
    if (tool.name === 'extractContractFromRaw') {
      // Auto-populate organization_id from user context or env var if not provided
      if (!bodyParams.organization_id) {
        const orgId = userContext?.organization || process.env.ZENSKAR_ORGANIZATION;
        if (orgId) {
          bodyParams.organization_id = orgId;
          logger.debug(`[${tool.name}] Auto-populated organization_id: ${orgId}`);
        }
      }
    }

    if (tool.name === 'createRawMetric') {
      if (!bodyParams.connector) {
        bodyParams.connector = cleanArgs.connector || 'push_to_zenskar';
      }
      if (!bodyParams.api_type) {
        bodyParams.api_type = cleanArgs.api_type || 'PUSH';
      }
      if (!bodyParams.dataschema) {
        bodyParams.dataschema = {
          customer_id: 'string',
          timestamp: 'timestamp',
          data: {
            usage_amount: 'decimal',
            feature_id: 'string'
          }
        };
      }
      if (bodyParams.dataschema) {
        bodyParams.dataschema = normalizeRawMetricDataschema(bodyParams.dataschema);
      }
      // Production ClickHouse pipelines only accept ['timestamp']; enforce regardless of user input
      bodyParams.column_order = ['timestamp'];
    }
    
    if (Object.keys(bodyParams).length > 0) {
      body = JSON.stringify(bodyParams);
    }
  }

  // Build headers with enhanced authentication
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Zenskar-MCP-Server/1.0.0',
    'apiversion': '20230501'
  };

  // Use dynamic user context if available, fall back to environment variables for CLI/MCP usage
  const orgId = userContext?.organization || process.env.ZENSKAR_ORGANIZATION;
  const authToken = userContext?.authorization ||
                    userContext?.headers?.['authorization'] ||
                    userContext?.headers?.['Authorization'] ||
                    (process.env.ZENSKAR_AUTH_TOKEN ? `Bearer ${process.env.ZENSKAR_AUTH_TOKEN}` : null);

  if (orgId) {
    headers['organisation'] = orgId;
  } else {
    logger.error(`[${tool.name}] SECURITY ERROR: No organization ID provided`);
    throw new Error('Organization ID is required for API access. Set ZENSKAR_ORGANIZATION env var or provide in user context.');
  }

  if (authToken) {
    headers['Authorization'] = authToken.startsWith('Bearer ') ? authToken : `Bearer ${authToken}`;
  } else {
    logger.error(`[${tool.name}] SECURITY ERROR: No authorization token provided`);
    throw new Error('Authorization token is required for API access. Set ZENSKAR_AUTH_TOKEN env var or provide in user context.');
  }

  // Also support legacy x-api-key if provided (optional)
  if (userContext?.apiKey) {
    headers['x-api-key'] = userContext.apiKey;
  } else if (userContext?.headers?.['x-api-key']) {
    headers['x-api-key'] = userContext.headers['x-api-key'];
  }

  // Add any other headers from user context
  if (userContext?.headers) {
    Object.keys(userContext.headers).forEach(key => {
      if (userContext.headers[key] && !headers[key.toLowerCase()]) {
        headers[key] = userContext.headers[key];
      }
    });
  }

  logger.debug(`[${tool.name}] Using headers:`, {
    hasOrganization: !!headers['organisation'],
    hasAuthorization: !!headers['Authorization'],
    hasApiKey: !!headers['x-api-key'],
    source: userContext?.organization ? 'userContext' : 'env'
  });

  // Add custom headers from template (override any dynamic ones)
  if (tool.requestTemplate?.headers) {
    if (Array.isArray(tool.requestTemplate.headers)) {
      // Handle array format
      tool.requestTemplate.headers.forEach(header => {
        headers[header.key] = header.value;
      });
    } else {
      // Handle object format
      Object.keys(tool.requestTemplate.headers).forEach(key => {
        headers[key] = tool.requestTemplate.headers[key];
      });
    }
  }
  
  // Build the full URL based on whether the URL is absolute or relative
  let fullUrl;
  if (isAbsoluteUrl) {
    // Use the URL as-is for absolute URLs (like generateContract)
    fullUrl = url;
    logger.debug(`[${tool.name}] Using absolute URL: ${fullUrl}`);
  } else {
    // Prepend base URL for relative URLs (like createContractPrompt)
    const baseUrl = process.env.ZENSKAR_API_BASE_URL || 'https://api.zenskar.com';
    fullUrl = baseUrl + url;
    logger.debug(`[${tool.name}] Using relative URL with base: ${baseUrl} + ${url} = ${fullUrl}`);
  }

  logger.debug(`[${tool.name}] Making ${method} request to: ${fullUrl}`);
  logger.info(`[${tool.name}] MULTI-TENANT SECURITY CHECK - Headers being sent:`, {
    organization: headers['organisation'] || 'MISSING',
    hasAuth: !!headers['Authorization'],
    authPrefix: headers['Authorization'] ? headers['Authorization'].substring(0, 30) + '...' : 'NONE',
    allHeaders: JSON.stringify(headers, null, 2)
  });
  
  try {
    const response = await fetch(fullUrl, {
      method,
      headers,
      body
    });

    const responseText = await response.text();
    const duration = Date.now() - startTime;
    
    logger.info(`[${tool.name}] Response received in ${duration}ms - Status: ${response.status}, Size: ${responseText.length} chars`);
    logger.info(`[${tool.name}] Raw response body:`, responseText);

    if (!response.ok) {
      logger.error(`[${tool.name}] API Error Response:`, responseText);
      throw new Error(`API request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`);
    }

    let result;
    try {
      result = JSON.parse(responseText);
    } catch (e) {
      logger.debug(`[${tool.name}] Failed to parse JSON response, returning as text`);
      result = responseText;
    }
    
    // Apply response template if available
    if (tool.responseTemplate?.prependBody) {
      result = {
        template_info: tool.responseTemplate.prependBody,
        api_response: result
      };
    }

    logger.debug(`[${tool.name}] Successfully processed response`);
    return result;
    
  } catch (fetchError) {
    logger.error(`[${tool.name}] Network error:`, fetchError);
    throw new Error(`Network error: ${fetchError.message}`);
  }
}

// Function to check if tool needs approval
function checkNeedsApproval(tool, args) {
  if (!tool.needsApproval) {
    return false;
  }
  
  // Check if this is a re-execution after approval
  const userContext = args.__userContext;
  if (userContext && userContext.approval && userContext.approval.approved === true) {
    logger.info(`[${tool.name}] Tool was approved by user, using modified arguments`);
    
    // Replace current args with user-approved/modified arguments
    const modifiedArgs = userContext.approval.modifiedArguments;
    if (modifiedArgs) {
      // Clear existing tool args but keep __userContext
      const savedUserContext = args.__userContext;
      Object.keys(args).forEach(key => {
        if (key !== '__userContext') {
          delete args[key];
        }
      });
      
      // Apply user's modified arguments
      Object.assign(args, modifiedArgs);
      args.__userContext = savedUserContext;
      
      logger.info(`[${tool.name}] Using user-modified arguments:`, modifiedArgs);
    }
    
    return false; // Skip approval, execute with approved args
  }
  
  // If needsApproval is a function, evaluate it
  if (typeof tool.needsApproval === 'function') {
    return tool.needsApproval(args);
  }
  
  // If it's a boolean true, always needs approval
  return tool.needsApproval === true;
}

// Function to generate approval request
function generateApprovalRequest(tool, args) {
  const userContext = args.__userContext;
  const cleanArgs = { ...args };
  delete cleanArgs.__userContext;
  
  return {
    type: 'approval_required',
    toolName: tool.name,
    toolDescription: tool.description,
    arguments: cleanArgs,
    approvalConfig: tool.approvalConfig || {
      title: `Approve ${tool.name}`,
      description: `This action requires your approval: ${tool.description}`,
      warningText: 'Please review the parameters carefully before proceeding.',
      confirmText: 'Approve',
      cancelText: 'Cancel'
    },
    // Generate field definitions for the frontend
    fields: (tool.args || []).map(arg => ({
      name: arg.name,
      label: arg.description || arg.name,
      type: getFieldType(arg.type),
      required: arg.required || false,
      value: cleanArgs[arg.name],
      sensitive: tool.approvalConfig?.sensitiveFields?.includes(arg.name) || false
    }))
  };
}

// Helper to map API types to form field types
function getFieldType(apiType) {
  switch (apiType) {
    case 'string': return 'text';
    case 'integer':
    case 'number': return 'number';
    case 'boolean': return 'checkbox';
    default: return 'text';
  }
}

// Register tools from config with enhanced error handling
if (mcpConfig.tools && mcpConfig.tools.length > 0) {
  mcpConfig.tools.forEach(tool => {
    logger.info(`Registering tool: ${tool.name}`);
    
    const inputSchema = convertArgsToZodSchema(tool.args || []);
    
    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: inputSchema
      },
      async (args) => {
        const executionStart = Date.now();
        let tokenUsageStatus = 'success';
        let tokenUsageReason = null;
        let requestTokens = 0;
        let responseTokens = 0;
        let limitRequested = null;
        let limitApplied = null;
        
        try {
          logger.debug(`[${tool.name}] Tool execution started`);
          
          // Debug: Check what args are received
          logger.info(`[${tool.name}] Raw args received:`, {
            argKeys: Object.keys(args),
            hasUserContextInArgs: !!args.__userContext,
            userContextInArgs: args.__userContext,
            approvedInArgs: args.__userContext?.approved
          });
          
          // Check if this tool needs approval and hasn't been approved yet
          const needsApproval = checkNeedsApproval(tool, args);
          const userContext = args.__userContext;
          const isApproved = userContext?.approved === true;
          
          logger.info(`[${tool.name}] Approval check:`, {
            needsApproval,
            isApproved,
            hasUserContext: !!userContext,
            userContextKeys: userContext ? Object.keys(userContext) : [],
            approvedValue: userContext?.approved,
            fullUserContext: JSON.stringify(userContext, null, 2)
          });
          
          if (needsApproval && !isApproved) {
            logger.info(`[${tool.name}] Tool requires approval, generating approval request`);
            const approvalRequest = generateApprovalRequest(tool, args);
            
            return {
              content: [{
                type: "text",
                text: JSON.stringify(approvalRequest, null, 2)
              }],
              isApprovalRequired: true,
              approvalRequest: approvalRequest
            };
          }
          
          if (needsApproval && isApproved) {
            logger.info(`[${tool.name}] Tool was approved, executing actual API call`);
          }
          
          // Extract user context for token usage tracking
          const userId = userContext?.userId || 'unknown';
          const chatId = userContext?.chatId || null; // Use NULL for direct MCP calls
          
          // Estimate request tokens (rough approximation)
          const argsString = JSON.stringify(args);
          requestTokens = Math.ceil(argsString.length / 4); // Rough token estimation
          
          // Validate and enforce limits on tool arguments
          const limitsValidation = validateToolLimits(tool.name, args);
          
          if (!limitsValidation.valid) {
            const feedback = generateTokenUsageFeedback(tool.name, args);
            logger.error(`[${tool.name}] Tool execution blocked due to limits:`, limitsValidation.errors);
            
            // Log blocked token usage
            tokenUsageStatus = 'blocked';
            tokenUsageReason = limitsValidation.errors.join('; ');
            responseTokens = 200; // Estimated tokens for error message
            
            try {
              await tokenUsageMonitor.logUsage({
                userId,
                chatId,
                tool: tool.name,
                requestTokens,
                responseTokens,
                totalTokens: requestTokens + responseTokens,
                status: tokenUsageStatus,
                reason: tokenUsageReason,
                limitRequested: args.limit,
                limitApplied: null
              });
            } catch (monitorError) {
              logger.error(`[${tool.name}] Failed to log token usage:`, monitorError);
            }
            
            return {
              content: [{
                type: "text",
                text: `I'm sorry, but this request is too large to process efficiently. To get better results, please try:\n\n` +
                      `• Using smaller numbers when asking for lists (try 10-20 items instead of larger amounts)\n` +
                      `• Being more specific with your search criteria\n` +
                      `• Breaking your request into smaller parts\n\n` +
                      `For example, instead of asking for all customers, try asking for "customers created this month" or "customers from a specific region."`
              }],
              isError: true
            };
          }
          
          // Use adjusted args with enforced limits
          const adjustedArgs = limitsValidation.adjustedArgs;
          
          // Track limit adjustments
          if (args.limit && adjustedArgs.limit && args.limit !== adjustedArgs.limit) {
            limitRequested = args.limit;
            limitApplied = adjustedArgs.limit;
          }
          
          // Log token usage feedback
          const tokenFeedback = generateTokenUsageFeedback(tool.name, adjustedArgs);
          logger.info(`[${tool.name}] Token usage assessment:`, {
            estimatedTokens: tokenFeedback.message,
            severity: tokenFeedback.severity,
            suggestions: tokenFeedback.suggestions,
            originalArgs: JSON.stringify(args),
            adjustedArgs: JSON.stringify(adjustedArgs)
          });
          
          // Execute API call with validated and adjusted arguments
          const rawResult = await executeAPICall(tool, adjustedArgs);
          
          // Process the response with intelligent optimization
          const processedResult = responseProcessor.processResponse(rawResult, tool.name);
          
          const executionTime = Date.now() - executionStart;
          logger.info(`[${tool.name}] Tool execution completed in ${executionTime}ms`);
          
          // Add user-friendly notice for large responses
          let responseText = typeof processedResult === 'string' ? processedResult : JSON.stringify(processedResult, null, 2);
          
          // Check if response was truncated
          if (limitsValidation.warnings.length > 0 || tokenFeedback.severity === 'warning') {
            tokenUsageStatus = 'truncated';
            tokenUsageReason = 'Response optimized due to size limits';
            
            const warningText = `\n\n---\n**📋 Response Summary:**\n` +
                              `Your request returned a large amount of data, so I've shown you a summary with the most relevant information. ` +
                              `If you need more specific details, try asking for:\n\n` +
                              `• Specific items by ID or name\n` +
                              `• Data from a particular time period\n` +
                              `• Filtered results based on status or category\n\n` +
                              `This helps ensure faster and more focused results.`;
            responseText = responseText + warningText;
          }
          
          // Estimate response tokens
          responseTokens = Math.ceil(responseText.length / 4);
          
          // Log successful token usage
          try {
            await tokenUsageMonitor.logUsage({
              userId,
              chatId,
              tool: tool.name,
              requestTokens,
              responseTokens,
              totalTokens: requestTokens + responseTokens,
              status: tokenUsageStatus,
              reason: tokenUsageReason,
              limitRequested,
              limitApplied
            });
          } catch (monitorError) {
            logger.error(`[${tool.name}] Failed to log token usage:`, monitorError);
          }
          
          return {
            content: [{
              type: "text",
              text: responseText
            }]
          };
        } catch (error) {
          const executionTime = Date.now() - executionStart;
          logger.error(`[${tool.name}] Tool execution failed after ${executionTime}ms:`, error);
          
          // Log failed token usage
          const userContext = args.__userContext;
          const userId = userContext?.userId || 'unknown';
          const chatId = userContext?.chatId || null; // Use NULL for direct MCP calls
          
          const errorMessage = `Error executing ${tool.name}: ${error.message}\n\nThis might be due to:\n- Invalid parameters\n- API rate limiting\n- Network connectivity issues\n- Authentication problems\n- Token usage limits exceeded\n\nPlease check the parameters and try again with smaller limits if needed.`;
          
          responseTokens = Math.ceil(errorMessage.length / 4);
          
          try {
            await tokenUsageMonitor.logUsage({
              userId,
              chatId,
              tool: tool.name,
              requestTokens,
              responseTokens,
              totalTokens: requestTokens + responseTokens,
              status: 'blocked',
              reason: `Execution failed: ${error.message}`,
              limitRequested,
              limitApplied
            });
          } catch (monitorError) {
            logger.error(`[${tool.name}] Failed to log token usage:`, monitorError);
          }
          
          return {
            content: [{
              type: "text",
              text: errorMessage
            }],
            isError: true
          };
        }
      }
    );
  });
}

// Enhanced startup with better logging
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  
  console.error('Zenskar Intelligent MCP Server running on stdio');
  console.error(`Loaded ${mcpConfig.tools?.length || 0} tools from config`);
  console.error(`Response optimization: Advanced processor with config-driven optimizations enabled`);
  
  if (mcpConfig.tools?.length > 0) {
    console.error('\nAvailable tools:');
    mcpConfig.tools.forEach(tool => {
      console.error(`  • ${tool.name}: ${tool.description}`);
    });
  }
  
  console.error('\nServer ready to handle requests');
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.error('\nReceived SIGINT, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.error('\nReceived SIGTERM, shutting down gracefully...');
  process.exit(0);
});

main().catch(error => {
  console.error('Server failed to start:', error);
  process.exit(1);
});
