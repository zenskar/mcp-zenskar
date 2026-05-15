#!/usr/bin/env node

import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { v4 as uuidv4 } from 'uuid'
import { z } from 'zod'

import ResponseProcessor from './response-processor.js'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const tokenUsageMonitor = {
  logUsage: async () => {
    /* no-op until monitor module is wired */
  },
}
const validateToolLimits = (_toolName, args) => ({
  valid: true,
  adjustedArgs: args,
  warnings: [],
  errors: [],
})
const generateTokenUsageFeedback = () => ({
  message: 'Limits validation unavailable',
  severity: 'info',
  suggestions: [],
})

// Create enhanced logger for MCP server with timestamps and better formatting
const logger = {
  debug: (message, data) => {
    if (process.env.MCP_DEBUG === 'true') {
      const timestamp = new Date().toISOString()
      console.error(
        `[${timestamp}] [MCP-DEBUG] ${message}`,
        data ? JSON.stringify(data, null, 2) : ''
      )
    }
  },
  info: (message, data) => {
    const timestamp = new Date().toISOString()
    console.error(
      `[${timestamp}] [MCP-INFO] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    )
  },
  error: (message, data) => {
    const timestamp = new Date().toISOString()
    console.error(
      `[${timestamp}] [MCP-ERROR] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    )
  },
  warn: (message, data) => {
    const timestamp = new Date().toISOString()
    console.error(
      `[${timestamp}] [MCP-WARN] ${message}`,
      data ? JSON.stringify(data, null, 2) : ''
    )
  },
}

// Load your OpenAPI-generated MCP configuration
const mcpConfigPath = path.join(__dirname, 'mcp-config.json')
let mcpConfig

try {
  mcpConfig = JSON.parse(fs.readFileSync(mcpConfigPath, 'utf8'))
} catch (error) {
  console.error('Failed to load MCP config:', error.message)
  console.error('Please ensure mcp-config.json exists in the project root')
  process.exit(1)
}

// Create MCP server
const server = new McpServer({
  name: mcpConfig.server?.name || 'zenskar-api-server',
  version: '1.0.0',
})

// Initialize the sophisticated response processor
const responseProcessor = new ResponseProcessor()

// Normalize usage ingestion payload values to ClickHouse-friendly formats
function normalizeUsageEventPayload(eventPayload) {
  if (
    !eventPayload ||
    typeof eventPayload !== 'object' ||
    Array.isArray(eventPayload)
  ) {
    return eventPayload
  }

  const normalized = { ...eventPayload }

  if (typeof normalized.timestamp === 'string') {
    normalized.timestamp = formatClickHouseDateTime(normalized.timestamp)
  }

  if (
    normalized.data &&
    typeof normalized.data === 'object' &&
    !Array.isArray(normalized.data)
  ) {
    normalized.data = { ...normalized.data }

    const dateTimeKeys = ['DateTime64', 'DateTime', 'DateTime32']
    dateTimeKeys.forEach((key) => {
      if (typeof normalized.data[key] === 'string') {
        normalized.data[key] = formatClickHouseDateTime(normalized.data[key])
      }
    })
  }

  return normalized
}

function formatClickHouseDateTime(value) {
  if (typeof value !== 'string') {
    return value
  }

  // Replace ISO 8601 separators with ClickHouse-friendly format and strip trailing Z offsets
  return value.replace('T', ' ').replace('t', ' ').replace(/Z$/i, '').trim()
}

function normalizeClickHouseType(type) {
  if (typeof type !== 'string') {
    return type
  }

  const trimmed = type.trim()
  if (!trimmed) {
    return type
  }

  const lower = trimmed.toLowerCase()
  switch (lower) {
    case 'boolean':
      return 'Bool'
    case 'string':
      return 'String'
    case 'int':
    case 'int64':
      return 'Int64'
    case 'float':
    case 'float64':
    case 'double':
      return 'Float64'
    case 'date':
    case 'date32':
      return 'Date32'
    case 'datetime':
    case 'datetime64':
      return 'DateTime64'
    case 'uuid':
      return 'UUID'
    default:
      return trimmed
  }
}

function normalizeRawMetricDataschema(schema) {
  if (!schema || typeof schema !== 'object' || Array.isArray(schema)) {
    return schema
  }

  const normalized = { ...schema }

  if (normalized.customer_id) {
    normalized.customer_id = normalizeClickHouseType(normalized.customer_id)
  }
  if (normalized.timestamp) {
    normalized.timestamp = normalizeClickHouseType(normalized.timestamp)
  }

  if (
    normalized.data &&
    typeof normalized.data === 'object' &&
    !Array.isArray(normalized.data)
  ) {
    const dataSchema = {}
    Object.entries(normalized.data).forEach(([key, value]) => {
      dataSchema[key] = normalizeClickHouseType(value)
    })
    normalized.data = dataSchema
  }

  return normalized
}

function extractListPayload(data) {
  if (!data) return []
  if (Array.isArray(data)) return data
  if (Array.isArray(data.results)) return data.results
  if (data.api_response !== undefined)
    return extractListPayload(data.api_response)
  return []
}

function normalizeAccountCategory(category) {
  if (!category || typeof category !== 'string') return 'Uncategorized'
  const normalized = category.trim()
  if (!normalized) return 'Uncategorized'
  return normalized
}

function toDisplayAmount(value) {
  const num = Number(value)
  if (!Number.isFinite(num)) return null
  return num / 100
}

function normalizeReportAccountCategory(reportType, category) {
  const normalized = normalizeAccountCategory(category)
  if (reportType === 'getBalanceSheet' && normalized === 'Liabilities') {
    return 'Liabilities & Equity'
  }
  return normalized
}

function getCategoryOrder(reportType, category) {
  const balanceSheetOrder = {
    Assets: 1,
    Liabilities: 2,
    Equity: 3,
  }
  const incomeStatementOrder = {
    Income: 1,
    Revenue: 1,
    'Cost of Goods Sold': 2,
    Expense: 3,
    Expenses: 3,
    'Other Income': 4,
    'Other Expense': 5,
    'Other Expenses': 5,
  }
  const map =
    reportType === 'getBalanceSheet' ? balanceSheetOrder : incomeStatementOrder
  return map[category] || 999
}

function buildPeriodKey(row) {
  const start = row?.interval_start || 'unknown_start'
  const end = row?.interval_end || 'unknown_end'
  return `${start}__${end}`
}

function summarizePeriods(periodMap) {
  return Object.values(periodMap).sort((a, b) =>
    String(a.interval_start).localeCompare(String(b.interval_start))
  )
}

function buildAccountingStatementView(reportType, rows, accountLookup) {
  const periodMap = new Map()
  const sectionsMap = new Map()

  rows.forEach((row) => {
    const category = normalizeReportAccountCategory(
      reportType,
      row.account_category
    )
    const periodKey = buildPeriodKey(row)
    const periodEntry = periodMap.get(periodKey) || {
      key: periodKey,
      interval_start: row.interval_start || null,
      interval_end: row.interval_end || null,
    }
    periodMap.set(periodKey, periodEntry)

    if (!sectionsMap.has(category)) {
      sectionsMap.set(category, {
        category,
        accounts: new Map(),
        totals_by_period: {},
        total_balance: 0,
        total_debits: 0,
        total_credits: 0,
      })
    }

    const section = sectionsMap.get(category)
    const accountId = row.account_id || 'unknown_account'
    const accountMeta = accountLookup.get(accountId) || {}
    if (!section.accounts.has(accountId)) {
      section.accounts.set(accountId, {
        account_id: accountId,
        account_name: row.account_name || accountMeta.name || accountId,
        account_description:
          row.account_description || accountMeta.description || null,
        account_category: category,
        parent_path: row.account_parent_path || accountMeta.parent_path || null,
        balance_normality:
          row.balance_normality || accountMeta.balance_normality || null,
        periods: {},
        total_balance: 0,
        total_debits: 0,
        total_credits: 0,
      })
    }

    const account = section.accounts.get(accountId)
    account.periods[periodKey] = {
      interval_start: row.interval_start || null,
      interval_end: row.interval_end || null,
      balance: row.balance ?? 0,
      display_balance: toDisplayAmount(row.balance ?? 0),
      debits: row.debits ?? 0,
      display_debits: toDisplayAmount(row.debits ?? 0),
      credits: row.credits ?? 0,
      display_credits: toDisplayAmount(row.credits ?? 0),
    }
    account.total_balance += Number(row.balance || 0)
    account.total_debits += Number(row.debits || 0)
    account.total_credits += Number(row.credits || 0)

    const sectionPeriod = section.totals_by_period[periodKey] || {
      interval_start: row.interval_start || null,
      interval_end: row.interval_end || null,
      balance: 0,
      debits: 0,
      credits: 0,
      display_balance: 0,
      display_debits: 0,
      display_credits: 0,
    }
    sectionPeriod.balance += Number(row.balance || 0)
    sectionPeriod.debits += Number(row.debits || 0)
    sectionPeriod.credits += Number(row.credits || 0)
    sectionPeriod.display_balance = toDisplayAmount(sectionPeriod.balance)
    sectionPeriod.display_debits = toDisplayAmount(sectionPeriod.debits)
    sectionPeriod.display_credits = toDisplayAmount(sectionPeriod.credits)
    section.totals_by_period[periodKey] = sectionPeriod
    section.total_balance += Number(row.balance || 0)
    section.total_debits += Number(row.debits || 0)
    section.total_credits += Number(row.credits || 0)
  })

  const sections = Array.from(sectionsMap.values())
    .sort((a, b) => {
      const orderDiff =
        getCategoryOrder(reportType, a.category) -
        getCategoryOrder(reportType, b.category)
      return orderDiff !== 0 ? orderDiff : a.category.localeCompare(b.category)
    })
    .map((section) => ({
      category: section.category,
      accounts: Array.from(section.accounts.values())
        .sort((a, b) => a.account_name.localeCompare(b.account_name))
        .map((account) => ({
          ...account,
          periods: summarizePeriods(account.periods),
        })),
      totals_by_period: summarizePeriods(section.totals_by_period),
      total_balance: section.total_balance,
      display_total_balance: toDisplayAmount(section.total_balance),
      total_debits: section.total_debits,
      display_total_debits: toDisplayAmount(section.total_debits),
      total_credits: section.total_credits,
      display_total_credits: toDisplayAmount(section.total_credits),
    }))

  return {
    report_type:
      reportType === 'getBalanceSheet' ? 'balance_sheet' : 'income_statement',
    periods: Array.from(periodMap.values()).sort((a, b) =>
      String(a.interval_start).localeCompare(String(b.interval_start))
    ),
    sections,
  }
}

function normalizeChartAccountCategory(account) {
  if (!account) return ''
  const category = account.account_category || ''
  if (category === 'Liabilities') return 'Liabilities & Equity'
  return category
}

function buildChartOfAccountsView(accounts) {
  const baseAccounts = [...accounts]
    .map((account) => ({
      ...account,
      account_category: normalizeChartAccountCategory(account),
    }))
    .sort((a, b) => {
      const categoryDiff = normalizeChartAccountCategory(a).localeCompare(
        normalizeChartAccountCategory(b)
      )
      return categoryDiff !== 0
        ? categoryDiff
        : String(a.name || '').localeCompare(String(b.name || ''))
    })

  const grouped = new Map()
  baseAccounts.forEach((account) => {
    const category = normalizeChartAccountCategory(account) || 'Uncategorized'
    if (!grouped.has(category)) grouped.set(category, [])
    grouped.get(category).push(account)
  })

  const syntheticGroups = [
    'Assets',
    'Liabilities & Equity',
    'Equity',
    'Income',
    'Expenses',
  ]
  syntheticGroups.forEach((category) => {
    if (!grouped.has(category)) grouped.set(category, [])
  })

  const sections = Array.from(grouped.entries())
    .sort((a, b) => a[0].localeCompare(b[0]))
    .map(([category, entries]) => ({
      id: category,
      name: category,
      description: category,
      account_category: category,
      is_parent: true,
      parent_path: null,
      children: entries.map((entry) => ({
        ...entry,
        parent_path: entry.parent_path || category,
      })),
    }))

  const liabEqSection = sections.find(
    (section) => section.name === 'Liabilities & Equity'
  )
  if (liabEqSection) {
    const hasEquity = liabEqSection.children.some(
      (child) => child.name === 'Equity'
    )
    if (!hasEquity) {
      liabEqSection.children.push({
        id: 'Equity',
        name: 'Equity',
        description: 'Equity',
        account_category: 'Liabilities & Equity',
        balance_normality: 'credit',
        is_parent: true,
        parent_path: 'Liabilities & Equity',
        custom_data: { default_account: false },
        children: [],
      })
      liabEqSection.children.push({
        id: 'Equity:Retained Earnings',
        name: 'Retained Earnings',
        description: 'Retained Earnings',
        account_category: 'Liabilities & Equity',
        balance_normality: 'credit',
        is_parent: false,
        parent_path: 'Equity',
        custom_data: { default_account: false },
      })
    }
  }

  return sections
}

function enrichJobsResult(result) {
  if (!result || !Array.isArray(result.results)) return result
  const counts = result.results.reduce((acc, job) => {
    const status = job.status || 'unknown'
    acc[status] = (acc[status] || 0) + 1
    return acc
  }, {})

  return {
    ...result,
    summary: {
      total_count: result.total_count ?? result.results.length,
      returned_count: result.results.length,
      page_status_counts: counts,
      has_more: !!result.next,
      note: result.next
        ? `Showing ${result.results.length} jobs from the current page. Use the cursor to continue through the remaining jobs.`
        : `Showing ${result.results.length} jobs from the current page.`,
    },
  }
}

function enrichListAccountsResult(result) {
  if (!result || !Array.isArray(result.results)) return result
  const sortedResults = [...result.results].sort((a, b) => {
    const categoryA = normalizeAccountCategory(a.account_category)
    const categoryB = normalizeAccountCategory(b.account_category)
    const categoryDiff = categoryA.localeCompare(categoryB)
    return categoryDiff !== 0
      ? categoryDiff
      : String(a.name || '').localeCompare(String(b.name || ''))
  })

  const grouped = sortedResults.reduce((acc, account) => {
    const category = normalizeAccountCategory(account.account_category)
    acc[category] = acc[category] || []
    acc[category].push(account)
    return acc
  }, {})

  return {
    ...result,
    results: sortedResults,
    grouped_view: grouped,
  }
}

async function fetchJson(url, headers) {
  const response = await fetch(url, { method: 'GET', headers })
  const text = await response.text()
  if (!response.ok) {
    throw new Error(
      `Supplemental fetch failed: ${response.status} ${response.statusText}\nResponse: ${text}`
    )
  }

  try {
    return JSON.parse(text)
  } catch (_error) {
    throw new Error(`Supplemental fetch returned non-JSON response: ${text}`)
  }
}

async function executeFrontendStyleRawMetricLogs(args, headers, baseUrl) {
  const rawMetricId = args.rawMetricId
  const rawMetricUrl = `${baseUrl}/rawmetric/${encodeURIComponent(rawMetricId)}`
  const rawMetric = await fetchJson(rawMetricUrl, headers)

  if (!rawMetric?.api_slug) {
    throw new Error(`Unable to resolve api_slug for raw metric ${rawMetricId}`)
  }

  const previewHeaders = {
    ...headers,
    apiversion: '20240301',
  }

  const payload = {
    limit: args.limit ?? 20,
    offset: args.offset ?? 0,
    order_by: args.order_by ?? [{ column: 'timestamp', type: 'DESC' }],
    aggregate_operation: args.aggregate_operation ?? null,
    customer_mapping: null,
    end_date_mapping: null,
    start_date_mapping: null,
    table_name: `raw_metric_${rawMetric.api_slug}`,
    visual_query: {
      groups: [
        {
          filters: Array.isArray(args.filters) ? args.filters : [],
          logic: 'AND',
        },
      ],
      logic: 'AND',
    },
  }

  const response = await fetch(`${baseUrl}/aggregate/visualquery/preview`, {
    method: 'POST',
    headers: previewHeaders,
    body: JSON.stringify(payload),
  })

  const responseText = await response.text()
  if (!response.ok) {
    throw new Error(
      `API request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`
    )
  }

  try {
    return JSON.parse(responseText)
  } catch (_error) {
    return responseText
  }
}

async function enrichAccountingReportResult(
  toolName,
  result,
  headers,
  baseUrl
) {
  if (!result || !Array.isArray(result.results)) {
    return result
  }

  try {
    const chartUrl = `${baseUrl}/accounting_new/chart_of_accounts`
    const chartData = await fetchJson(chartUrl, headers)
    const chartAccounts = extractListPayload(chartData)
    const accountLookup = new Map(
      chartAccounts
        .filter((account) => account && account.id)
        .map((account) => [account.id, account])
    )

    const enrichedRows = result.results.map((row) => {
      const account = accountLookup.get(row.account_id) || {}
      return {
        ...row,
        account_name: account.name || row.account_id || null,
        account_description: account.description || null,
        account_category: normalizeReportAccountCategory(
          toolName,
          account.account_category
        ),
        account_parent_path: account.parent_path || null,
        balance_normality: account.balance_normality || null,
        display_balance: toDisplayAmount(row.balance ?? 0),
        display_debits: toDisplayAmount(row.debits ?? 0),
        display_credits: toDisplayAmount(row.credits ?? 0),
      }
    })

    let statementView = buildAccountingStatementView(
      toolName,
      enrichedRows,
      accountLookup
    )

    if (toolName === 'getBalanceSheet') {
      const params = new URLSearchParams()
      if (headers.apiversion) params.set('apiversion', headers.apiversion)
      const incomeStatementUrl = `${baseUrl}/accounting_new/income_statement/v2`
      const incomeStatement = await fetchJson(incomeStatementUrl, headers)
      const incomeRows = Array.isArray(incomeStatement?.results)
        ? incomeStatement.results
        : []
      const retainedByPeriod = {}

      incomeRows.forEach((row) => {
        const periodKey = buildPeriodKey(row)
        const period = retainedByPeriod[periodKey] || {
          interval_start: row.interval_start || null,
          interval_end: row.interval_end || null,
          balance: 0,
          debits: 0,
          credits: 0,
        }
        period.balance += Number(row.balance || 0)
        period.debits += Number(row.debits || 0)
        period.credits += Number(row.credits || 0)
        retainedByPeriod[periodKey] = period
      })

      const retainedPeriods = summarizePeriods(
        Object.fromEntries(
          Object.entries(retainedByPeriod).map(([key, value]) => [
            key,
            {
              ...value,
              display_balance: toDisplayAmount(value.balance),
              display_debits: toDisplayAmount(value.debits),
              display_credits: toDisplayAmount(value.credits),
            },
          ])
        )
      )

      const retainedAccount = {
        account_id: 'Equity:Retained Earnings',
        account_name: 'Retained Earnings (Derived)',
        account_description:
          'Derived from the companion income statement for MCP presentation.',
        account_category: 'Liabilities & Equity',
        parent_path: 'Equity',
        balance_normality: 'credit',
        periods: retainedPeriods,
        total_balance: retainedPeriods.reduce(
          (sum, period) => sum + Number(period.balance || 0),
          0
        ),
        display_total_balance: toDisplayAmount(
          retainedPeriods.reduce(
            (sum, period) => sum + Number(period.balance || 0),
            0
          )
        ),
        total_debits: retainedPeriods.reduce(
          (sum, period) => sum + Number(period.debits || 0),
          0
        ),
        display_total_debits: toDisplayAmount(
          retainedPeriods.reduce(
            (sum, period) => sum + Number(period.debits || 0),
            0
          )
        ),
        total_credits: retainedPeriods.reduce(
          (sum, period) => sum + Number(period.credits || 0),
          0
        ),
        display_total_credits: toDisplayAmount(
          retainedPeriods.reduce(
            (sum, period) => sum + Number(period.credits || 0),
            0
          )
        ),
      }

      let liabEqSection = statementView.sections.find(
        (section) => section.category === 'Liabilities & Equity'
      )
      if (!liabEqSection) {
        liabEqSection = {
          category: 'Liabilities & Equity',
          accounts: [],
          totals_by_period: [],
          total_balance: 0,
          display_total_balance: 0,
          total_debits: 0,
          display_total_debits: 0,
          total_credits: 0,
          display_total_credits: 0,
        }
        statementView.sections.push(liabEqSection)
      }
      liabEqSection.accounts.push(retainedAccount)
    }

    return {
      ...result,
      results: enrichedRows,
      statement_view: statementView,
    }
  } catch (error) {
    logger.warn(
      `[${toolName}] Failed to enrich accounting report output; returning raw report`,
      {
        error: error.message,
      }
    )
    return result
  }
}

// Helper function to convert OpenAPI args to Zod schema
function convertArgsToZodSchema(args) {
  const schemaObj = {}

  args.forEach((arg) => {
    let zodType

    if (arg.type === 'integer' || arg.type === 'number') {
      zodType = z.number()
    } else if (arg.type === 'boolean') {
      zodType = z.boolean()
    } else if (arg.type === 'object') {
      zodType = z.record(z.any())
    } else if (arg.type === 'array') {
      zodType = z.array(z.any())
    } else if (arg.type === 'datetime') {
      // Accept ISO-8601 string or numeric unix seconds. Backend Pydantic
      // datetime fields parse both. Lets the LLM copy ISO strings directly
      // from getContractBillingCycles output instead of converting to unix.
      zodType = z.union([z.string(), z.number()])
    } else {
      zodType = z.string()
    }

    // Handle default values
    if (arg.default !== undefined) {
      zodType = zodType.default(arg.default)
    }

    if (!arg.required) {
      zodType = zodType.optional()
    }

    if (arg.description) {
      zodType = zodType.describe(arg.description)
    }

    schemaObj[arg.name] = zodType
  })

  // Add __userContext as an optional object parameter for all tools
  schemaObj['__userContext'] = z
    .object({
      userId: z.string().optional(),
      authorization: z.string().optional(),
      organization: z.string().optional(),
      apiKey: z.string().optional(),
      headers: z.object({}).optional(),
      // Add approval support for human-in-the-loop workflow
      approval: z
        .object({
          approved: z.boolean(),
          // Single-use token issued by server in the approval_required response.
          // Without this in the schema, Zod strips it from __userContext.approval
          // and consumeApprovalToken() always sees undefined → infinite re-approval loop.
          token: z.string().optional(),
          modifiedArguments: z.record(z.any()).optional(),
          originalArguments: z.record(z.any()).optional(),
          toolName: z.string().optional(),
        })
        .optional(),
    })
    .optional()
    .describe(
      'Internal user context for multi-tenant authentication and approval workflow'
    )

  return schemaObj
}

// Enhanced API execution with better error handling and logging
async function executeAPICall(tool, args) {
  const startTime = Date.now()

  // Handle system tools that don't require API calls
  if (tool.name === 'getCurrentDateTime') {
    const now = new Date()
    return {
      currentDate: now.toISOString().split('T')[0],
      currentDateTime: now.toISOString(),
      timestamp: now.getTime(),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      humanReadable: now.toLocaleString(),
    }
  }

  // Debug: Log raw args received
  logger.debug(`[${tool.name}] Raw args received:`, {
    argKeys: Object.keys(args),
    argValues: JSON.stringify(args, null, 2),
  })

  // Extract user context from args (if provided)
  const userContext = args.__userContext
  const cleanArgs = { ...args }
  delete cleanArgs.__userContext // Remove internal context from API args

  // Debug: Log what we received
  logger.debug(
    `[${tool.name}] User context received:`,
    userContext
      ? {
          hasUserId: !!userContext.userId,
          hasAuthorization: !!userContext.authorization,
          hasOrganization: !!userContext.organization,
          authPrefix: userContext.authorization
            ? userContext.authorization.substring(0, 20) + '...'
            : 'none',
        }
      : 'NO USER CONTEXT'
  )

  // Build the request URL
  let url = tool.requestTemplate?.url || '/'
  const method = tool.requestTemplate?.method || 'GET'

  // Check if URL is absolute (starts with http/https) or relative
  const isAbsoluteUrl = url.startsWith('http://') || url.startsWith('https://')

  logger.debug(
    `[${tool.name}] Executing ${method} request with args:`,
    JSON.stringify(cleanArgs, null, 2)
  )
  if (userContext) {
    logger.debug(`[${tool.name}] Using user context:`, {
      hasApiKey: !!userContext.apiKey,
      hasOrganization: !!userContext.organization,
      userId: userContext.userId,
    })
  }

  // Replace path parameters
  if (tool.args) {
    tool.args.forEach((arg) => {
      if (arg.position === 'path' && cleanArgs[arg.name] !== undefined) {
        url = url.replace(
          `{${arg.name}}`,
          encodeURIComponent(cleanArgs[arg.name])
        )
      }
    })
  }

  // Build query parameters with intelligent handling
  const queryParams = new URLSearchParams()
  if (tool.args) {
    tool.args.forEach((arg) => {
      if (
        arg.position === 'query' &&
        cleanArgs[arg.name] !== undefined &&
        cleanArgs[arg.name] !== null &&
        cleanArgs[arg.name] !== ''
      ) {
        // Handle different data types properly
        if (typeof cleanArgs[arg.name] === 'boolean') {
          queryParams.append(arg.name, cleanArgs[arg.name].toString())
        } else if (Array.isArray(cleanArgs[arg.name])) {
          // Handle array parameters
          cleanArgs[arg.name].forEach((value) => {
            queryParams.append(arg.name, value)
          })
        } else {
          queryParams.append(arg.name, cleanArgs[arg.name])
        }
      }
    })
  }

  // Handle additional parameters intelligently
  Object.keys(cleanArgs).forEach((key) => {
    if (
      !queryParams.has(key) &&
      cleanArgs[key] !== undefined &&
      cleanArgs[key] !== null &&
      cleanArgs[key] !== ''
    ) {
      const isPathParam = tool.args?.some(
        (arg) => arg.position === 'path' && arg.name === key
      )
      const isBodyParam = tool.args?.some(
        (arg) => arg.position === 'body' && arg.name === key
      )

      if (!isPathParam && !isBodyParam) {
        if (typeof cleanArgs[key] === 'boolean') {
          queryParams.append(key, cleanArgs[key].toString())
        } else if (Array.isArray(cleanArgs[key])) {
          cleanArgs[key].forEach((value) => {
            queryParams.append(key, value)
          })
        } else {
          queryParams.append(key, cleanArgs[key])
        }
      }
    }
  })

  if (queryParams.toString()) {
    url += '?' + queryParams.toString()
  }

  // Build request body
  let body = null
  if (method !== 'GET' && method !== 'DELETE' && tool.args) {
    // Pydantic datetime fields on the Zenskar backend accept both ISO strings
    // and unix int — but downstream code paths assume naive UTC datetimes
    // (.astimezone() on aware datetimes raises). The UI normalises everything
    // to unix int via dayjs.utc(...).unix(); we do the same here so the LLM
    // can pass either form without producing a 500.
    const coerceDatetime = (v) => {
      if (typeof v === 'number') return Number.isFinite(v) ? Math.floor(v) : v
      if (typeof v === 'string') {
        const t = Date.parse(v)
        return Number.isFinite(t) ? Math.floor(t / 1000) : v
      }
      return v
    }
    const bodyParams = {}
    tool.args.forEach((arg) => {
      if (arg.position === 'body' && cleanArgs[arg.name] !== undefined) {
        if (arg.type === 'datetime') {
          bodyParams[arg.name] = coerceDatetime(cleanArgs[arg.name])
          return
        }
        if (tool.name === 'ingestRawMetricEvent' && arg.name === 'event') {
          const eventPayload = normalizeUsageEventPayload(cleanArgs[arg.name])
          if (
            eventPayload &&
            typeof eventPayload === 'object' &&
            !Array.isArray(eventPayload)
          ) {
            // Flatten usage event payload so it matches the API contract
            Object.entries(eventPayload).forEach(([key, value]) => {
              if (value !== undefined) {
                bodyParams[key] = value
              }
            })
          } else {
            bodyParams[arg.name] = eventPayload
          }
        } else {
          bodyParams[arg.name] = cleanArgs[arg.name]
        }
      }
    })

    // Nest flat address fields into address/ship_to_address objects for the Zenskar API
    if (tool.name === 'createCustomer' || tool.name === 'updateCustomer') {
      const nestAddress = (prefix, targetKey) => {
        const fieldMap = {
          [`${prefix}line1`]: 'line1',
          [`${prefix}line2`]: 'line2',
          [`${prefix}line3`]: 'line3',
          [`${prefix}city`]: 'city',
          [`${prefix}state`]: 'state',
          [`${prefix}zipCode`]: 'zipCode',
          [`${prefix}country`]: 'country',
          [`${prefix}country_code`]: 'country_code',
        }
        const obj = {}
        let has = false
        Object.entries(fieldMap).forEach(([flatKey, nestedKey]) => {
          if (bodyParams[flatKey] !== undefined) {
            obj[nestedKey] = bodyParams[flatKey]
            delete bodyParams[flatKey]
            has = true
          }
        })
        if (has) {
          bodyParams[targetKey] = obj
          logger.debug(
            `[${tool.name}] Transformed flat ${prefix}* fields into ${targetKey} object`
          )
        }
      }
      nestAddress('address_', 'address')
      nestAddress('ship_to_', 'ship_to_address')
    }

    // Same address nesting for createBusinessEntity
    if (tool.name === 'createBusinessEntity') {
      const nestAddress = (prefix, targetKey) => {
        const fieldMap = {
          [`${prefix}line1`]: 'line1',
          [`${prefix}line2`]: 'line2',
          [`${prefix}line3`]: 'line3',
          [`${prefix}city`]: 'city',
          [`${prefix}state`]: 'state',
          [`${prefix}zipCode`]: 'zipCode',
          [`${prefix}country`]: 'country',
        }
        const obj = {}
        let has = false
        Object.entries(fieldMap).forEach(([flatKey, nestedKey]) => {
          if (bodyParams[flatKey] !== undefined) {
            obj[nestedKey] = bodyParams[flatKey]
            delete bodyParams[flatKey]
            has = true
          }
        })
        if (has) {
          bodyParams[targetKey] = obj
          logger.debug(
            `[${tool.name}] Transformed flat ${prefix}* fields into ${targetKey} object`
          )
        }
      }
      nestAddress('address_', 'address')
    }

    // Smart defaults for helper tools
    if (tool.name === 'extractContractFromRaw') {
      // Auto-populate organization_id from user context or env var if not provided
      if (!bodyParams.organization_id) {
        const orgId =
          userContext?.organization || process.env.ZENSKAR_ORGANIZATION
        if (orgId) {
          bodyParams.organization_id = orgId
          logger.debug(
            `[${tool.name}] Auto-populated organization_id: ${orgId}`
          )
        }
      }
    }

    if (tool.name === 'createRawMetric') {
      if (!bodyParams.connector) {
        bodyParams.connector = cleanArgs.connector || 'push_to_zenskar'
      }
      if (!bodyParams.api_type) {
        bodyParams.api_type = cleanArgs.api_type || 'PUSH'
      }
      if (!bodyParams.dataschema) {
        bodyParams.dataschema = {
          customer_id: 'string',
          timestamp: 'timestamp',
          data: {
            usage_amount: 'decimal',
            feature_id: 'string',
          },
        }
      }
      if (bodyParams.dataschema) {
        bodyParams.dataschema = normalizeRawMetricDataschema(
          bodyParams.dataschema
        )
      }
      // Production ClickHouse pipelines only accept ['timestamp']; enforce regardless of user input
      bodyParams.column_order = ['timestamp']
    }

    if (Object.keys(bodyParams).length > 0) {
      body = JSON.stringify(bodyParams)
    } else if (method === 'PATCH' || method === 'POST' || method === 'PUT') {
      // Always send at least an empty JSON body for non-GET methods
      // Some endpoints (e.g., approveInvoice) require a body even when no body params are provided
      body = '{}'
    }
  }

  // Build headers with enhanced authentication
  const headers = {
    'Content-Type': 'application/json',
    'User-Agent': 'Zenskar-MCP-Server/1.0.0',
    apiversion: '20230501',
  }

  // Use dynamic user context if available, fall back to environment variables for CLI/MCP usage
  const orgId = userContext?.organization || process.env.ZENSKAR_ORGANIZATION
  const authToken =
    userContext?.authorization ||
    userContext?.headers?.['authorization'] ||
    userContext?.headers?.['Authorization'] ||
    process.env.ZENSKAR_AUTH_TOKEN
  const apiKey =
    userContext?.apiKey ||
    userContext?.headers?.['x-api-key'] ||
    process.env.ZENSKAR_API_KEY ||
    process.env.ZENSKAR_AUTH_TOKEN // Fallback: use AUTH_TOKEN as API key if it looks like one

  if (orgId) {
    headers['organisation'] = orgId
  } else {
    logger.error(`[${tool.name}] SECURITY ERROR: No organization ID provided`)
    throw new Error(
      'Organization ID is required for API access. Set ZENSKAR_ORGANIZATION env var or provide in user context.'
    )
  }

  // Determine auth method: Bearer token for JWT, x-api-key for sandbox keys
  if (authToken && authToken.startsWith('eyJ')) {
    // JWT token - use Bearer auth
    headers['Authorization'] = authToken.startsWith('Bearer ')
      ? authToken
      : `Bearer ${authToken}`
  } else if (apiKey) {
    // API key (sandbox_* or other) - use x-api-key header
    headers['x-api-key'] = apiKey
  } else {
    logger.error(`[${tool.name}] SECURITY ERROR: No authorization provided`)
    throw new Error(
      'Authorization is required. Set ZENSKAR_AUTH_TOKEN (JWT) or ZENSKAR_API_KEY env var.'
    )
  }

  // Add any other headers from user context (case-insensitive collision check).
  // Object keys cannot duplicate across casings within the same object, so the
  // Set only needs to be built once from the existing `headers`.
  // Filter prototype-pollution keys: `userContext.headers` may originate from
  // a JSON payload where an attacker could set `__proto__` to mutate the
  // local `headers` prototype.
  if (userContext?.headers) {
    const existingLower = new Set(
      Object.keys(headers).map((k) => k.toLowerCase())
    )
    const POISON_KEYS = new Set(['__proto__', 'prototype', 'constructor'])
    Object.keys(userContext.headers).forEach((key) => {
      if (POISON_KEYS.has(key)) return
      if (!Object.prototype.hasOwnProperty.call(userContext.headers, key))
        return
      if (userContext.headers[key] && !existingLower.has(key.toLowerCase())) {
        headers[key] = userContext.headers[key]
      }
    })
  }

  logger.debug(`[${tool.name}] Using headers:`, {
    hasOrganization: !!headers['organisation'],
    hasAuthorization: !!headers['Authorization'],
    hasApiKey: !!headers['x-api-key'],
    source: userContext?.organization ? 'userContext' : 'env',
  })

  // Add custom headers from template (override any dynamic ones)
  if (tool.requestTemplate?.headers) {
    if (Array.isArray(tool.requestTemplate.headers)) {
      // Handle array format
      tool.requestTemplate.headers.forEach((header) => {
        headers[header.key] = header.value
      })
    } else {
      // Handle object format
      Object.keys(tool.requestTemplate.headers).forEach((key) => {
        headers[key] = tool.requestTemplate.headers[key]
      })
    }
  }

  // Build the full URL based on whether the URL is absolute or relative
  let fullUrl
  if (isAbsoluteUrl) {
    // Use the URL as-is for absolute URLs (like generateContract)
    fullUrl = url
    logger.debug(`[${tool.name}] Using absolute URL: ${fullUrl}`)
  } else {
    // Prepend base URL for relative URLs (like createContractPrompt)
    const baseUrl =
      process.env.ZENSKAR_API_BASE_URL || 'https://api.zenskar.com'
    fullUrl = baseUrl + url
    logger.debug(
      `[${tool.name}] Using relative URL with base: ${baseUrl} + ${url} = ${fullUrl}`
    )
  }

  logger.debug(`[${tool.name}] Making ${method} request to: ${fullUrl}`)
  logger.info(
    `[${tool.name}] MULTI-TENANT SECURITY CHECK - Headers being sent:`,
    {
      organization: headers['organisation'] || 'MISSING',
      hasAuth: !!headers['Authorization'],
      authPrefix: headers['Authorization']
        ? headers['Authorization'].substring(0, 30) + '...'
        : 'NONE',
      allHeaders: JSON.stringify(headers, null, 2),
    }
  )

  try {
    if (tool.name === 'getRawMetricLogs') {
      const baseUrl =
        process.env.ZENSKAR_API_BASE_URL || 'https://api.zenskar.com'
      const result = await executeFrontendStyleRawMetricLogs(
        cleanArgs,
        headers,
        baseUrl
      )
      logger.debug(
        `[${tool.name}] Successfully processed frontend-style usage-event logs`
      )
      return result
    }

    const response = await fetch(fullUrl, {
      method,
      headers,
      body,
    })

    const responseText = await response.text()
    const duration = Date.now() - startTime

    logger.info(
      `[${tool.name}] Response received in ${duration}ms - Status: ${response.status}, Size: ${responseText.length} chars`
    )
    logger.info(`[${tool.name}] Raw response body:`, responseText)

    if (!response.ok) {
      logger.error(`[${tool.name}] API Error Response:`, responseText)
      let errorMessage = `API request failed: ${response.status} ${response.statusText}\nResponse: ${responseText}`

      throw new Error(errorMessage)
    }

    let result
    try {
      result = JSON.parse(responseText)
    } catch (e) {
      logger.debug(
        `[${tool.name}] Failed to parse JSON response, returning as text`
      )
      result = responseText
    }

    if (tool.name === 'getBalanceSheet' || tool.name === 'getIncomeStatement') {
      const baseUrl =
        process.env.ZENSKAR_API_BASE_URL || 'https://api.zenskar.com'
      result = await enrichAccountingReportResult(
        tool.name,
        result,
        headers,
        baseUrl
      )
    }
    if (tool.name === 'listJobs') {
      result = enrichJobsResult(result)
    }
    if (tool.name === 'listAccounts') {
      result = enrichListAccountsResult(result)
    }
    if (tool.name === 'getChartOfAccounts' && Array.isArray(result)) {
      result = {
        raw_accounts: result,
        chart_view: buildChartOfAccountsView(result),
      }
    }

    // Apply response template if available
    if (tool.responseTemplate?.prependBody) {
      result = {
        template_info: tool.responseTemplate.prependBody,
        api_response: result,
      }
    }

    logger.debug(`[${tool.name}] Successfully processed response`)
    return result
  } catch (fetchError) {
    logger.error(`[${tool.name}] Network error:`, fetchError)
    throw new Error(`Network error: ${fetchError.message}`)
  }
}

// One-time approval tokens. Server issues a token on the approval_required response;
// the host must echo it back on the second invocation. Prevents prompt-injection
// scenarios where an LLM fabricates `approval.approved=true` to bypass the dialog.
// Tokens are single-use and expire after 5 minutes.
const APPROVAL_TOKEN_TTL_MS = 5 * 60 * 1000
const APPROVAL_TOKEN_CLEANUP_MS = 60 * 1000
const approvalTokens = new Map() // token -> {toolName, issuedAt, expiresAt, args}

// Deep clone via structuredClone when available, JSON fallback otherwise.
// Approval args may include nested objects (addresses, pricing_data) that
// executeAPICall mutates downstream; a shallow spread would share refs.
function deepCloneArgs(value) {
  if (value == null) return value
  if (typeof structuredClone === 'function') {
    try {
      return structuredClone(value)
    } catch (_) {
      /* fall through to JSON */
    }
  }
  return JSON.parse(JSON.stringify(value))
}

function issueApprovalToken(toolName, args) {
  const token = uuidv4()
  const issuedAt = Date.now()
  // Snapshot args at issue time so the second invocation can restore them
  // even when the host does not echo them at the top level (e.g. Claude
  // Desktop's approval dialog only echoes __userContext.approval).
  // Note: `args` here is the initial tool invocation. generateApprovalRequest
  // only runs when checkNeedsApproval returned true, which means there was no
  // valid approval block. We still strip __userContext defensively in case a
  // host replays a stale approval block alongside fresh top-level args.
  const snapshot = args ? deepCloneArgs(args) : {}
  delete snapshot.__userContext
  approvalTokens.set(token, {
    toolName,
    issuedAt,
    expiresAt: issuedAt + APPROVAL_TOKEN_TTL_MS,
    args: snapshot,
  })
  return token
}

function consumeApprovalToken(token, toolName) {
  if (!token || typeof token !== 'string') return null
  const entry = approvalTokens.get(token)
  if (!entry) return null
  // Single-use: delete on first lookup regardless of toolName/expiry. A wrong
  // toolName here means either a replay attack or a host bug; either way the
  // token should not survive. Legitimate users get a fresh token via re-approval.
  approvalTokens.delete(token)
  if (entry.toolName !== toolName) return null
  if (entry.expiresAt < Date.now()) return null
  return entry
}

// Periodic sweep so expired tokens (and the args they snapshot) don't linger
// in memory past their TTL even when no new approval is issued.
setInterval(() => {
  const now = Date.now()
  for (const [t, entry] of approvalTokens) {
    if (entry.expiresAt < now) approvalTokens.delete(t)
  }
}, APPROVAL_TOKEN_CLEANUP_MS).unref()

// Pure resolver: decides which arg source wins for an approved re-invoke.
// Returns { args, source } where args is the object to apply (always non-null
// for valid tokens), and source names the tier that won.
//
// SECURITY MODEL: the token snapshot stored at issue time is the canonical
// record of what the user approved. We DO NOT trust top-level args on a
// re-invoke — a malicious LLM holding a valid token could otherwise swap
// in arbitrary path/body params (e.g. a different invoiceId) and still pass
// the gate. The only host-supplied override accepted is
// `approval.modifiedArguments`, which represents user edits performed inside
// the approval dialog. Those edits MUST be re-validated by the caller
// against the tool schema before the API call is executed.
function resolveApprovedArgs(approval, tokenEntry) {
  const nonEmptyObj = (obj) =>
    obj &&
    typeof obj === 'object' &&
    !Array.isArray(obj) &&
    Object.keys(obj).length > 0

  if (nonEmptyObj(approval.modifiedArguments)) {
    return { args: approval.modifiedArguments, source: 'modifiedArguments' }
  }
  return { args: tokenEntry.args, source: 'tokenSnapshot' }
}

// Replace `args` contents with `resolvedArgs` while preserving __userContext.
// Kept separate from the resolver so the decision logic stays pure/testable.
function applyResolvedArgs(args, resolvedArgs) {
  const savedUserContext = args.__userContext
  Object.keys(args).forEach((key) => {
    if (key !== '__userContext') delete args[key]
  })
  Object.assign(args, resolvedArgs)
  args.__userContext = savedUserContext
}

// Decides whether `tool` still needs approval given the current `args`.
// As a side effect, when a valid approval token is present this function
// also restores path/body params onto `args` from the resolver's chosen
// tier. The mutation is deliberate — the MCP SDK passes `args` by
// reference, and downstream callers (validateToolLimits, executeAPICall)
// read from the same object. Argument resolution is itself pure, see
// resolveApprovedArgs above.
function checkNeedsApproval(tool, args) {
  if (!tool.needsApproval) {
    return false
  }

  const userContext = args.__userContext
  const approval = userContext && userContext.approval
  if (approval && approval.approved === true) {
    const tokenEntry = consumeApprovalToken(approval.token, tool.name)
    if (tokenEntry) {
      // Snapshot is canonical (see resolveApprovedArgs). The only host-supplied
      // override accepted is `approval.modifiedArguments` (user edits from the
      // approval dialog); those are re-validated against the tool schema in
      // the caller. Top-level args on the re-invoke are ignored to prevent a
      // valid token from acting as a blank check on path/body params.
      const { args: resolvedArgs, source } = resolveApprovedArgs(
        approval,
        tokenEntry
      )
      logger.info(
        `[${tool.name}] Approval token verified; arg source=${source}`
      )
      applyResolvedArgs(args, resolvedArgs)
      logger.info(
        `[${tool.name}] Restored arguments for approved execution:`,
        Object.keys(resolvedArgs)
      )
      return false
    }
    logger.warn(
      `[${tool.name}] Approval received without valid token (got: ${approval.token ? 'expired/mismatched' : 'missing'}); requiring re-approval`
    )
    // Fall through to issue a fresh approval_required response.
  }

  if (typeof tool.needsApproval === 'function') {
    return tool.needsApproval(args)
  }
  return tool.needsApproval === true
}

// Function to generate approval request
function generateApprovalRequest(tool, args) {
  const userContext = args.__userContext
  const cleanArgs = { ...args }
  delete cleanArgs.__userContext
  const approvalToken = issueApprovalToken(tool.name, args)

  return {
    type: 'approval_required',
    toolName: tool.name,
    toolDescription: tool.description,
    arguments: cleanArgs,
    approvalToken,
    approvalTokenExpiresInSeconds: Math.floor(APPROVAL_TOKEN_TTL_MS / 1000),
    approvalConfig: tool.approvalConfig || {
      title: `Approve ${tool.name}`,
      description: `This action requires your approval: ${tool.description}`,
      warningText: 'Please review the parameters carefully before proceeding.',
      confirmText: 'Approve',
      cancelText: 'Cancel',
    },
    // Generate field definitions for the frontend
    fields: (tool.args || []).map((arg) => ({
      name: arg.name,
      label: arg.description || arg.name,
      type: getFieldType(arg.type),
      required: arg.required || false,
      value: cleanArgs[arg.name],
      sensitive:
        tool.approvalConfig?.sensitiveFields?.includes(arg.name) || false,
    })),
  }
}

// Tool-specific deep argument validation. Catches semantic gaps that JSON Schema
// `required` cannot express (e.g. nested fields inside an `object` arg).
// Return shape matches validateToolLimits: {valid, errors[]}.
function validateToolArgs(toolName, args) {
  const errors = []

  if (toolName === 'createProductPricing') {
    const pd = args.pricing_data
    if (!pd || typeof pd !== 'object') {
      errors.push(
        "'pricing_data' is required and must be an object containing 'pricing_type' and 'currency'."
      )
    } else {
      if (!pd.pricing_type)
        errors.push(
          "'pricing_data.pricing_type' is required (e.g. 'per_unit', 'flat_fee', 'tiered', 'volume', 'percent', 'package')."
        )
      if (!pd.currency)
        errors.push(
          "'pricing_data.currency' is required (ISO 4217, e.g. 'USD')."
        )
    }
    const q = args.quantity
    if (!q || typeof q !== 'object') {
      errors.push(
        "'quantity' is required and must be an object: {type:'fixed'|'metered', quantity?, unit?, aggregate_id?}. Without it the UI shows 0 for billing_metric."
      )
    } else {
      if (q.type !== 'fixed' && q.type !== 'metered')
        errors.push("'quantity.type' must be exactly 'fixed' or 'metered'.")
      if (q.type === 'fixed' && (q.quantity == null || !q.unit))
        errors.push(
          "'quantity.type'='fixed' requires both 'quantity' (number) and 'unit' (label string)."
        )
      if (q.type === 'metered' && !q.aggregate_id)
        errors.push(
          "'quantity.type'='metered' requires 'aggregate_id' (UUID of the billable metric)."
        )
    }
    const bp = args.billing_period
    if (!bp || typeof bp !== 'object') {
      errors.push(
        "'billing_period' is required and must be an object: {cadence:'P1M'|'P3M'|'P1Y'|..., offset:'P0D'|...}. Without it the UI renders 'Undefined- Every Undefined Undefined'."
      )
    } else {
      if (!bp.cadence)
        errors.push(
          "'billing_period.cadence' is required (ISO-8601 duration: 'P1M'=monthly, 'P3M'=quarterly, 'P1Y'=yearly)."
        )
      if (!bp.offset)
        errors.push(
          "'billing_period.offset' is required (ISO-8601 duration, 'P0D' for no offset)."
        )
    }
  }

  if (toolName === 'createPlan') {
    if (
      !args.schedule ||
      typeof args.schedule !== 'object' ||
      !args.schedule.duration
    ) {
      errors.push(
        "'schedule' is required and must include 'duration' (ISO-8601, e.g. 'P1Y')."
      )
    }
    if (!args.status) {
      errors.push("'status' is required: 'draft' | 'active' | 'archived'.")
    }
    const phases = args.phases
    if (!Array.isArray(phases) || phases.length === 0) {
      errors.push(
        "'phases' must be a non-empty array. A plan with no phases is unusable in PlansV2 — include at least one phase with name, schedule, order, and either features or pricings."
      )
    } else {
      phases.forEach((p, i) => {
        if (!p || typeof p !== 'object') {
          errors.push(`'phases[${i}]' must be an object.`)
          return
        }
        if (!p.name) errors.push(`'phases[${i}].name' is required.`)
        if (!p.schedule || !p.schedule.duration)
          errors.push(
            `'phases[${i}].schedule.duration' is required (ISO-8601).`
          )
        if (typeof p.order !== 'number')
          errors.push(`'phases[${i}].order' is required (integer, 0-indexed).`)
        if (
          !p.features &&
          (!Array.isArray(p.pricings) || p.pricings.length === 0)
        ) {
          errors.push(
            `'phases[${i}]' has neither 'features' nor non-empty 'pricings' — phase will be empty in the UI.`
          )
        }
      })
    }
  }

  if (toolName === 'generateInvoice') {
    const toUnix = (v) => {
      if (typeof v === 'number') return Number.isInteger(v) ? v : null
      if (typeof v === 'string') {
        const t = Date.parse(v)
        return Number.isFinite(t) ? Math.floor(t / 1000) : null
      }
      return null
    }
    const from = toUnix(args.from_date)
    const to = toUnix(args.to_date)
    if (from === null)
      errors.push(
        "'from_date' must be either an integer UNIX timestamp (seconds) or an ISO-8601 datetime string. Copy from getContractBillingCycles.start_date."
      )
    if (to === null)
      errors.push(
        "'to_date' must be either an integer UNIX timestamp (seconds) or an ISO-8601 datetime string. Copy from getContractBillingCycles.end_date."
      )
    if (from !== null && to !== null && to <= from) {
      errors.push("'to_date' must be strictly greater than 'from_date'.")
    }
    if (toUnix(args.bill_for_date) === null) {
      errors.push(
        "'bill_for_date' is REQUIRED (UNIX seconds or ISO-8601 string). Without it the API returns a $0 invoice. Copy from getContractBillingCycles.bill_for_date — do NOT compute."
      )
    }
    if (
      !Number.isInteger(args.billing_cycle_start_day) ||
      args.billing_cycle_start_day < 1 ||
      args.billing_cycle_start_day > 31
    ) {
      errors.push(
        "'billing_cycle_start_day' is REQUIRED and must be an integer 1-31. Copy from getContractBillingCycles.billing_cycle_start_day."
      )
    }
  }

  if (toolName === 'pauseContract') {
    if (!args.start_date) errors.push("'start_date' is required (ISO 8601).")
    if (!args.unpause_extension_policy)
      errors.push(
        "'unpause_extension_policy' is required: 'extend' or 'overlap'."
      )
  }

  return { valid: errors.length === 0, errors }
}

// Helper to map API types to form field types
function getFieldType(apiType) {
  switch (apiType) {
    case 'string':
      return 'text'
    case 'integer':
    case 'number':
      return 'number'
    case 'boolean':
      return 'checkbox'
    default:
      return 'text'
  }
}

// Register tools from config with enhanced error handling
if (mcpConfig.tools && mcpConfig.tools.length > 0) {
  mcpConfig.tools.forEach((tool) => {
    logger.info(`Registering tool: ${tool.name}`)

    const inputSchema = convertArgsToZodSchema(tool.args || [])

    server.registerTool(
      tool.name,
      {
        title: tool.name,
        description: tool.description,
        inputSchema: inputSchema,
      },
      async (args) => {
        const executionStart = Date.now()
        let tokenUsageStatus = 'success'
        let tokenUsageReason = null
        let requestTokens = 0
        let responseTokens = 0
        let limitRequested = null
        let limitApplied = null

        try {
          logger.debug(`[${tool.name}] Tool execution started`)

          // Debug: Check what args are received
          logger.info(`[${tool.name}] Raw args received:`, {
            argKeys: Object.keys(args),
            hasUserContextInArgs: !!args.__userContext,
            userContextInArgs: args.__userContext,
            approvedInArgs: args.__userContext?.approved,
          })

          // Validate args BEFORE the approval gate so users do not approve broken calls.
          const earlyArgValidation = validateToolArgs(tool.name, args)
          if (!earlyArgValidation.valid) {
            logger.error(
              `[${tool.name}] Tool execution blocked due to invalid arguments (pre-approval):`,
              earlyArgValidation.errors
            )
            tokenUsageStatus = 'blocked'
            tokenUsageReason = `invalid_args: ${earlyArgValidation.errors.join('; ')}`
            const errorJson = {
              type: 'invalid_arguments',
              toolName: tool.name,
              errors: earlyArgValidation.errors,
            }
            return {
              content: [
                { type: 'text', text: JSON.stringify(errorJson, null, 2) },
                {
                  type: 'text',
                  text:
                    `ACTION_NOT_EXECUTED — INVALID_ARGUMENTS\n\nTool '${tool.name}' was NOT executed because the supplied arguments are invalid or incomplete:\n\n` +
                    earlyArgValidation.errors
                      .map((e, i) => `${i + 1}. ${e}`)
                      .join('\n') +
                    `\n\nFix the arguments and call again. Do NOT report success to the user.`,
                },
              ],
              isError: true,
            }
          }

          // Check if this tool needs approval and hasn't been approved yet.
          // checkNeedsApproval() validates the one-time token from
          // __userContext.approval.token; bare `approved: true` is not trusted.
          const needsApproval = checkNeedsApproval(tool, args)
          const userContext = args.__userContext

          logger.info(`[${tool.name}] Approval check:`, {
            needsApproval,
            hasUserContext: !!userContext,
            userContextKeys: userContext ? Object.keys(userContext) : [],
            hasApprovalBlock: !!(userContext && userContext.approval),
            hasToken: !!(
              userContext &&
              userContext.approval &&
              userContext.approval.token
            ),
          })

          if (needsApproval) {
            logger.info(
              `[${tool.name}] Tool requires approval, generating approval request`
            )
            const approvalRequest = generateApprovalRequest(tool, args)
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(approvalRequest, null, 2),
                },
                {
                  type: 'text',
                  text:
                    `ACTION_NOT_EXECUTED — APPROVAL_REQUIRED\n\n` +
                    `Tool '${tool.name}' was NOT executed. The host must render an approval dialog from the JSON payload above and re-invoke this tool with __userContext.approval = {approved: true, token: '<approvalToken from payload>'} to actually perform the action. The token is single-use and expires in ${Math.floor(APPROVAL_TOKEN_TTL_MS / 1000)}s. Do NOT fabricate the token. Do NOT report success to the user; surface the dialog instead.`,
                },
              ],
              isApprovalRequired: true,
              approvalRequest: approvalRequest,
            }
          }

          // Re-validate after the approval gate. checkNeedsApproval may have
          // swapped path/body params with user-supplied `modifiedArguments`
          // (host dialog edits), which were not part of the pre-approval
          // validation pass. Bypass attempts via crafted modifiedArguments
          // get caught here.
          const postApprovalValidation = validateToolArgs(tool.name, args)
          if (!postApprovalValidation.valid) {
            logger.error(
              `[${tool.name}] Approved arguments failed validation:`,
              postApprovalValidation.errors
            )
            tokenUsageStatus = 'blocked'
            tokenUsageReason = `invalid_args_post_approval: ${postApprovalValidation.errors.join('; ')}`
            return {
              content: [
                {
                  type: 'text',
                  text: JSON.stringify(
                    {
                      type: 'invalid_arguments',
                      toolName: tool.name,
                      errors: postApprovalValidation.errors,
                    },
                    null,
                    2
                  ),
                },
                {
                  type: 'text',
                  text:
                    `ACTION_NOT_EXECUTED — INVALID_ARGUMENTS\n\nApproved arguments failed validation. The user-edited values from the approval dialog do not satisfy the tool schema:\n\n` +
                    postApprovalValidation.errors
                      .map((e, i) => `${i + 1}. ${e}`)
                      .join('\n') +
                    `\n\nRe-issue the call with corrected arguments; a new approval gate will be required.`,
                },
              ],
              isError: true,
            }
          }

          // Extract user context for token usage tracking
          const userId = userContext?.userId || 'unknown'
          const chatId = userContext?.chatId || null // Use NULL for direct MCP calls

          // Estimate request tokens (rough approximation)
          const argsString = JSON.stringify(args)
          requestTokens = Math.ceil(argsString.length / 4) // Rough token estimation

          // Validate and enforce limits on tool arguments
          const limitsValidation = validateToolLimits(tool.name, args)

          if (!limitsValidation.valid) {
            const feedback = generateTokenUsageFeedback(tool.name, args)
            logger.error(
              `[${tool.name}] Tool execution blocked due to limits:`,
              limitsValidation.errors
            )

            // Log blocked token usage
            tokenUsageStatus = 'blocked'
            tokenUsageReason = limitsValidation.errors.join('; ')
            responseTokens = 200 // Estimated tokens for error message

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
                limitApplied: null,
              })
            } catch (monitorError) {
              logger.error(
                `[${tool.name}] Failed to log token usage:`,
                monitorError
              )
            }

            return {
              content: [
                {
                  type: 'text',
                  text:
                    `I'm sorry, but this request is too large to process efficiently. To get better results, please try:\n\n` +
                    `• Using smaller numbers when asking for lists (try 10-20 items instead of larger amounts)\n` +
                    `• Being more specific with your search criteria\n` +
                    `• Breaking your request into smaller parts\n\n` +
                    `For example, instead of asking for all customers, try asking for "customers created this month" or "customers from a specific region."`,
                },
              ],
              isError: true,
            }
          }

          // (validateToolArgs ran pre-approval; post-approval re-validation
          // ran immediately after the approval gate. No third check here.)

          // Use adjusted args with enforced limits
          const adjustedArgs = limitsValidation.adjustedArgs

          // Track limit adjustments
          if (
            args.limit &&
            adjustedArgs.limit &&
            args.limit !== adjustedArgs.limit
          ) {
            limitRequested = args.limit
            limitApplied = adjustedArgs.limit
          }

          // Log token usage feedback
          const tokenFeedback = generateTokenUsageFeedback(
            tool.name,
            adjustedArgs
          )
          logger.info(`[${tool.name}] Token usage assessment:`, {
            estimatedTokens: tokenFeedback.message,
            severity: tokenFeedback.severity,
            suggestions: tokenFeedback.suggestions,
            originalArgs: JSON.stringify(args),
            adjustedArgs: JSON.stringify(adjustedArgs),
          })

          // Execute API call with validated and adjusted arguments
          const rawResult = await executeAPICall(tool, adjustedArgs)

          // Process the response with intelligent optimization
          const processedResult = responseProcessor.processResponse(
            rawResult,
            tool.name
          )

          const executionTime = Date.now() - executionStart
          logger.info(
            `[${tool.name}] Tool execution completed in ${executionTime}ms`
          )

          // Add user-friendly notice for large responses
          let responseText =
            typeof processedResult === 'string'
              ? processedResult
              : JSON.stringify(processedResult, null, 2)

          // Check if response was truncated
          if (
            limitsValidation.warnings.length > 0 ||
            tokenFeedback.severity === 'warning'
          ) {
            tokenUsageStatus = 'truncated'
            tokenUsageReason = 'Response optimized due to size limits'

            const warningText =
              `\n\n---\n**📋 Response Summary:**\n` +
              `Your request returned a large amount of data, so I've shown you a summary with the most relevant information. ` +
              `If you need more specific details, try asking for:\n\n` +
              `• Specific items by ID or name\n` +
              `• Data from a particular time period\n` +
              `• Filtered results based on status or category\n\n` +
              `This helps ensure faster and more focused results.`
            responseText = responseText + warningText
          }

          // Estimate response tokens
          responseTokens = Math.ceil(responseText.length / 4)

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
              limitApplied,
            })
          } catch (monitorError) {
            logger.error(
              `[${tool.name}] Failed to log token usage:`,
              monitorError
            )
          }

          return {
            content: [
              {
                type: 'text',
                text: responseText,
              },
            ],
          }
        } catch (error) {
          const executionTime = Date.now() - executionStart
          logger.error(
            `[${tool.name}] Tool execution failed after ${executionTime}ms:`,
            error
          )

          // Log failed token usage
          const userContext = args.__userContext
          const userId = userContext?.userId || 'unknown'
          const chatId = userContext?.chatId || null // Use NULL for direct MCP calls

          const errorMessage = `Error executing ${tool.name}: ${error.message}\n\nThis might be due to:\n- Invalid parameters\n- API rate limiting\n- Network connectivity issues\n- Authentication problems\n- Token usage limits exceeded\n\nPlease check the parameters and try again with smaller limits if needed.`

          responseTokens = Math.ceil(errorMessage.length / 4)

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
              limitApplied,
            })
          } catch (monitorError) {
            logger.error(
              `[${tool.name}] Failed to log token usage:`,
              monitorError
            )
          }

          return {
            content: [
              {
                type: 'text',
                text: errorMessage,
              },
            ],
            isError: true,
          }
        }
      }
    )
  })
}

// Enhanced startup with better logging
async function main() {
  const transport = new StdioServerTransport()
  await server.connect(transport)

  console.error('Zenskar Intelligent MCP Server running on stdio')
  console.error(`Loaded ${mcpConfig.tools?.length || 0} tools from config`)
  console.error(
    `Response optimization: Advanced processor with config-driven optimizations enabled`
  )

  if (mcpConfig.tools?.length > 0) {
    console.error('\nAvailable tools:')
    mcpConfig.tools.forEach((tool) => {
      console.error(`  • ${tool.name}: ${tool.description}`)
    })
  }

  console.error('\nServer ready to handle requests')
}

// Graceful shutdown handling
process.on('SIGINT', () => {
  console.error('\nReceived SIGINT, shutting down gracefully...')
  process.exit(0)
})

process.on('SIGTERM', () => {
  console.error('\nReceived SIGTERM, shutting down gracefully...')
  process.exit(0)
})

main().catch((error) => {
  console.error('Server failed to start:', error)
  process.exit(1)
})
