import { classifyClient, getClientName } from './client-detection.js'
import { lookup } from './registry.js'
import { formatResponse } from './response.js'
import { stub } from './stub.js'

const LIST_NUDGE =
  'Data rendered in table widget above. Use values below for follow-up questions — do not restate rows.'
const DETAIL_NUDGE =
  'Full detail rendered in widget above — user already sees every field. Do not summarize or restate. Only respond if user asks a specific question. Reference data below for follow-ups.'

function uiEnabled() {
  const v = process.env.ZENSKAR_MCP_UI_ENABLED
  if (v == null || v === '') return true
  return !/^(0|false|no|off)$/i.test(String(v).trim())
}

function disabledList() {
  const v = process.env.ZENSKAR_MCP_UI_DISABLED_TOOLS
  if (!v) return new Set()
  return new Set(
    String(v)
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean)
  )
}

const DEBUG =
  process.env.ZENSKAR_MCP_UI_DEBUG === 'true' ||
  process.env.MCP_DEBUG === 'true'
function dbg(...args) {
  if (DEBUG) console.error('[ui-wrap]', ...args)
}

export function wrapToolResponse(toolName, rawData, fallbackText, args) {
  if (!uiEnabled()) {
    dbg(toolName, 'skipped: ZENSKAR_MCP_UI_ENABLED explicitly disabled')
    return textResult(fallbackText)
  }
  const route = lookup(toolName)
  if (route.mode !== 'ui') {
    dbg(toolName, 'skipped: not in registry, mode=', route.mode)
    return textResult(fallbackText)
  }
  if (disabledList().has(toolName)) {
    dbg(toolName, 'skipped: in ZENSKAR_MCP_UI_DISABLED_TOOLS')
    return textResult(fallbackText)
  }

  let payload
  try {
    payload = route.toPayload(rawData, args)
  } catch (err) {
    dbg(toolName, 'toPayload threw:', err.message)
    return textResult(fallbackText)
  }

  const items = arrayLength(payload)
  if (items < (route.threshold ?? 0)) {
    dbg(toolName, 'below threshold:', items, '<', route.threshold)
    return textResult(fallbackText)
  }

  const clientClass = classifyClient(getClientName())
  dbg(
    toolName,
    'OK shape=',
    route.shape,
    'items=',
    items,
    'client=',
    clientClass
  )

  if (clientClass === 'coding-agent') {
    return textResult(fallbackText)
  }

  if (clientClass === 'widget-host') {
    const isDetail = items <= 1 && route.shape.includes('detail')
    const nudge = isDetail ? DETAIL_NUDGE : LIST_NUDGE
    const toonText = nudge + '\n' + formatResponse(payload)
    return {
      content: [{ type: 'text', text: toonText }],
      structuredContent: payload,
    }
  }

  // default: full-fidelity for zenskar-ai-server and unknown clients
  return textResult(fallbackText)
}

function arrayLength(payload) {
  if (!payload || typeof payload !== 'object') return 0
  for (const k of [
    'customers',
    'invoices',
    'lines',
    'payments',
    'credit_notes',
    'contracts',
    'transactions',
    'rows',
    'items',
    'data',
    'addresses',
    'payment_methods',
    'products',
    'plans',
    'entries',
    'jobs',
    'contacts',
    'raw_metrics',
    'aggregates',
    'entities',
  ]) {
    if (Array.isArray(payload[k])) return payload[k].length
  }
  if (Number.isFinite(payload.total)) return payload.total
  // Detail payloads have a singular object key (customer, invoice, etc.)
  for (const k of ['customer', 'invoice', 'contract', 'credit_note']) {
    if (payload[k] && typeof payload[k] === 'object') return 1
  }
  // Invoice preview or other non-array payloads with content
  if (payload.html) return 1
  return 0
}

function textResult(text) {
  return { content: [{ type: 'text', text }] }
}

export { uiEnabled }
