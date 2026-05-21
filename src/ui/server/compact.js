const MAX_ROWS = 20

const FIELD_ALLOWLIST = {
  customer: ['name', 'email', 'external_id', 'created_at'],
  invoice: [
    'invoice_number',
    'customer_name',
    'status',
    'invoice_total',
    'amount_due',
    'due_date',
  ],
  payment: [
    'customer_name',
    'amount',
    'currency',
    'status',
    'type',
    'payment_date',
  ],
  credit_note: [
    'credit_note_number',
    'customer_name',
    'status',
    'amount',
    'currency',
  ],
  contract: ['name', 'customer_name', 'status', 'start_date', 'end_date'],
  product: ['name', 'sku', 'product_type', 'is_active'],
  plan: ['name', 'status', 'plan_version'],
  job: ['name', 'job_type', 'status', 'created_at'],
  contact: ['name', 'email', 'customer_id'],
  entity: ['name', 'email', 'country', 'is_default'],
  entitlement: ['name', 'entitlement_type', 'units', 'is_active'],
  line_item: ['name', 'pricing_model', 'subtotal', 'quantity'],
  address: ['label', 'city', 'state', 'country', 'is_primary'],
  payment_method: ['type', 'brand', 'last4', 'is_default'],
  raw_metric: ['name', 'api_slug', 'usage_upload_enabled'],
  aggregate: ['name', 'datasource'],
  journal_entry: [
    'event',
    'status_type',
    'total_debit',
    'total_credit',
    'posted_at',
  ],
}

function shortId(id) {
  if (!id || typeof id !== 'string') return id
  return id.length > 8 ? id.slice(0, 8) : id
}

function formatValue(v) {
  if (v == null) return ''
  if (typeof v === 'object' && v.value != null)
    return v.display ?? `${v.value} ${v.unit ?? ''}`.trim()
  if (typeof v === 'boolean') return v ? 'yes' : 'no'
  return String(v)
}

function summarizeItem(item, allowlist) {
  const id = item.id ? shortId(item.id) : null
  const fields = allowlist
    ? allowlist.filter((k) => item[k] != null)
    : Object.keys(item).filter((k) => k !== 'id' && item[k] != null)

  const parts = fields.map((k) => `${k}=${formatValue(item[k])}`)
  if (id) parts.unshift(`id=${id}`)
  return parts.join(' | ')
}

export function compactSummary(noun, payload) {
  const allowlist =
    FIELD_ALLOWLIST[noun] ?? FIELD_ALLOWLIST[noun.replace(/ /g, '_')] ?? null

  const arrayKeys = [
    'customers',
    'invoices',
    'payments',
    'credit_notes',
    'contracts',
    'products',
    'plans',
    'entries',
    'jobs',
    'contacts',
    'raw_metrics',
    'aggregates',
    'entities',
    'entitlements',
    'lines',
    'addresses',
    'payment_methods',
  ]

  let items = null
  for (const k of arrayKeys) {
    if (Array.isArray(payload[k])) {
      items = payload[k]
      break
    }
  }

  if (items) {
    const total = payload.total ?? items.length
    const capped = items.slice(0, MAX_ROWS)
    const lines = capped.map((item) => summarizeItem(item, allowlist))
    const header = `${total} ${noun}${total !== 1 ? 's' : ''}${payload.scope ? ` matching "${payload.scope}"` : ''}`
    const body = lines.join('\n')
    const overflow =
      items.length > MAX_ROWS ? `\n... and ${items.length - MAX_ROWS} more` : ''
    return `${header}\n${body}${overflow}`
  }

  const detailKeys = ['customer', 'invoice', 'contract', 'credit_note']
  for (const k of detailKeys) {
    if (payload[k] && typeof payload[k] === 'object') {
      return `${noun} detail\n${summarizeItem(payload[k], allowlist)}`
    }
  }

  if (payload.html) return `${noun} (HTML preview)`

  return `${noun} result`
}
