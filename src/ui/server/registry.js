const TEXT_ONLY_TOOLS = new Set([
  'getInvoiceSummary',
  'getCustomerBalance',
  'getPaymentStatus',
])

const TOOL_TO_SHAPE = {
  // Existing list tables
  listCustomers: {
    shape: 'customer-table',
    noun: 'customer',
    toPayload: customersToPayload,
    threshold: 0,
  },
  listInvoices: {
    shape: 'invoice-table',
    noun: 'invoice',
    toPayload: invoicesToPayload,
    threshold: 0,
  },
  getInvoiceLineItems: {
    shape: 'invoice-line-items',
    noun: 'line item',
    toPayload: lineItemsToPayload,
    threshold: 0,
  },
  listAllPayments: {
    shape: 'payment-table',
    noun: 'payment',
    toPayload: paymentsToPayload,
    threshold: 0,
  },
  listCreditNotes: {
    shape: 'credit-note-table',
    noun: 'credit note',
    toPayload: creditNotesToPayload,
    threshold: 0,
  },
  listContracts: {
    shape: 'contract-table',
    noun: 'contract',
    toPayload: contractsToPayload,
    threshold: 0,
  },
  // New detail cards (Tier 4)
  getCustomerById: {
    shape: 'customer-detail',
    noun: 'customer',
    toPayload: customerDetailToPayload,
    threshold: 0,
  },
  getInvoiceById: {
    shape: 'invoice-detail',
    noun: 'invoice',
    toPayload: invoiceDetailToPayload,
    threshold: 0,
  },
  getContractById: {
    shape: 'contract-detail',
    noun: 'contract',
    toPayload: contractDetailToPayload,
    threshold: 0,
  },
  getCreditNoteById: {
    shape: 'credit-note-detail',
    noun: 'credit note',
    toPayload: creditNoteDetailToPayload,
    threshold: 0,
  },
  // New list tables (Tier 3)
  listProducts: {
    shape: 'product-table',
    noun: 'product',
    toPayload: productsToPayload,
    threshold: 0,
  },
  listPlans: {
    shape: 'plan-table',
    noun: 'plan',
    toPayload: plansToPayload,
    threshold: 0,
  },
  listJournalEntries: {
    shape: 'journal-table',
    noun: 'journal entry',
    toPayload: journalEntriesToPayload,
    threshold: 0,
  },
  listJobs: {
    shape: 'job-table',
    noun: 'job',
    toPayload: jobsToPayload,
    threshold: 0,
  },
  listContacts: {
    shape: 'contact-table',
    noun: 'contact',
    toPayload: contactsToPayload,
    threshold: 0,
  },
  listRawMetrics: {
    shape: 'raw-metric-table',
    noun: 'raw metric',
    toPayload: rawMetricsToPayload,
    threshold: 0,
  },
  listAggregates: {
    shape: 'aggregate-table',
    noun: 'aggregate',
    toPayload: aggregatesToPayload,
    threshold: 0,
  },
  listCustomerAddresses: {
    shape: 'address-list',
    noun: 'address',
    toPayload: addressesToPayload,
    threshold: 0,
  },
  listPaymentMethods: {
    shape: 'payment-method-list',
    noun: 'payment method',
    toPayload: paymentMethodsToPayload,
    threshold: 0,
  },
  listBusinessEntities: {
    shape: 'entity-table',
    noun: 'business entity',
    toPayload: entitiesToPayload,
    threshold: 0,
  },
}

// Single-bundle architecture: all 20 shapes ship as one ui://zenskar/app.html
// resource. The bundled `app.tsx` reads the active tool name from the host
// context and dispatches to the matching component at runtime.
export const SHAPES = Object.freeze(['app'])

export function resourceUriFor(_shape) {
  return 'ui://zenskar/app.html'
}

// ===== Existing payload builders =====

function customersToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const customers = pickArray(body, ['customers', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? customers.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope =
    (args && (args.search_name_external_id || args.search)) || undefined
  return {
    customers: customers.map(normalizeCustomer),
    total,
    cursor: { next, prev },
    scope,
  }
}

function unwrapTemplate(raw) {
  if (
    raw &&
    typeof raw === 'object' &&
    raw.api_response &&
    typeof raw.api_response === 'object'
  ) {
    return raw.api_response
  }
  return raw || {}
}

function invoicesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['invoices', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? body.next ?? null
  const prev = cursor.prev ?? body.previous ?? null
  return {
    invoices: rows.map(normalizeInvoice),
    total,
    cursor: { next, prev },
    scope:
      (args &&
        (args.customer__customer_name__ilike ||
          args.invoice_number__like ||
          args.status)) ||
      undefined,
    default_currency: 'USD',
  }
}

function normalizeInvoice(r) {
  if (!r || typeof r !== 'object')
    return {
      id: '',
      invoice_number: null,
      customer_id: null,
      status: null,
      invoice_total: null,
      amount_due: null,
      due_date: null,
      invoice_period_begin: null,
      invoice_period_end: null,
      external_id: null,
      created_at: null,
      payment_url: null,
    }
  const period = r.invoice_period || {}
  return {
    id: String(r.id || r.invoice_id || ''),
    invoice_number: r.invoice_number ?? null,
    customer_id: r.customer_id ?? null,
    status: r.status ?? null,
    invoice_total: numOrNull(r.net_invoice_total ?? r.invoice_total),
    amount_due: numOrNull(r.amount_due),
    due_date: r.due_date ?? r.promise_due_date ?? null,
    invoice_period_begin: period.begin_date ?? r.period_begin_date ?? null,
    invoice_period_end: period.end_date_exclusive ?? r.period_end_date ?? null,
    external_id: r.external_id ?? null,
    created_at: r.created_at ?? null,
    payment_url: r.payment_url ?? null,
  }
}

function lineItemsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const lines = Array.isArray(body.lines)
    ? body.lines
    : Array.isArray(body)
      ? body
      : []
  const total = numOrNull(body.total)
  const currency = pickCurrencyFromLines(lines) || 'USD'
  return {
    invoice_id: args && args.invoiceId ? String(args.invoiceId) : undefined,
    total,
    currency,
    lines: lines.map(normalizeLineItem),
  }
}

function pickCurrencyFromLines(lines) {
  for (const l of lines) {
    if (l && l.subtotal && l.subtotal.unit) return l.subtotal.unit
    if (l && l.features && l.features[0] && l.features[0].currency)
      return l.features[0].currency
  }
  return null
}

function normalizeLineItem(l) {
  if (!l || typeof l !== 'object')
    return {
      name: '',
      description: null,
      pricing_model: null,
      subtotal: { value: null, unit: null },
      quantity: { value: null, unit: null },
      price: null,
      service_start_date: null,
      service_end_date: null,
      is_billed: null,
    }
  return {
    name: l.name ?? l.description ?? '',
    description: l.description ?? null,
    pricing_model: l.pricing_model ?? null,
    subtotal: normalizeMoney(l.subtotal),
    quantity: normalizeMoney(l.quantity),
    price: l.price ? normalizeMoney(l.price) : null,
    service_start_date: l.service_start_date ?? null,
    service_end_date: l.service_end_date ?? null,
    is_billed: typeof l.is_billed === 'boolean' ? l.is_billed : null,
  }
}

function normalizeMoney(m) {
  if (!m) return { value: null, unit: null, display: null }
  return {
    value: numOrNull(m.value),
    unit: m.unit ?? null,
    display: m.display ?? null,
  }
}

function normalizeCustomer(c) {
  if (!c || typeof c !== 'object')
    return { id: '', name: null, external_id: null, email: null }
  const inv = c.invoice_details || {}
  return {
    id: String(c.id || c.customer_id || ''),
    name: c.customer_name ?? c.name ?? null,
    external_id: c.external_id ?? null,
    email: c.email ?? c.primary_email ?? null,
    invoice_count: numOrNull(inv.no_of_invoices ?? c.invoice_count),
    mrr: pickMoney(c.mrr ?? c.monthly_recurring_revenue),
    outstanding: pickMoney(
      c.outstanding ??
        c.outstanding_amount ??
        c.amount_outstanding ??
        inv.total_amount_due
    ),
    status:
      c.status ?? (c.communications_enabled === false ? 'paused' : 'active'),
    last_activity_at:
      c.last_activity_at ?? c.last_seen_at ?? c.updated_at ?? null,
    created_at: c.created_at ?? c.created ?? null,
  }
}

function paymentsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['payments', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope =
    (args &&
      (args.search || args.customer_id || args.type || args.payment_method)) ||
    undefined
  return {
    payments: rows.map(normalizePayment),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
    default_currency: 'USD',
  }
}

function normalizePayment(p) {
  if (!p || typeof p !== 'object')
    return {
      id: '',
      external_id: null,
      customer_id: null,
      invoice_id: null,
      amount: null,
      currency: null,
      payment_method: null,
      type: null,
      status: null,
      description: null,
      payment_date: null,
      created_at: null,
    }
  const parts = Array.isArray(p.payment_parts) ? p.payment_parts : []
  const firstInvoiceId =
    (parts.find((x) => x && x.invoice_id) || {}).invoice_id ||
    p.invoice_id ||
    null
  return {
    id: String(p.id || p.payment_id || ''),
    external_id: p.external_id ?? null,
    customer_id: p.customer_id ?? null,
    invoice_id: firstInvoiceId,
    amount: numOrNull(p.amount ?? p.value),
    currency: p.currency_code ?? p.currency ?? null,
    payment_method: p.payment_method ?? null,
    type: p.type ?? null,
    status: p.status ?? null,
    description: p.description ?? p.notes ?? null,
    payment_date: p.payment_date ?? p.received_at ?? p.processed_at ?? null,
    created_at: p.created_at ?? null,
  }
}

function creditNotesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, [
    'credit_notes',
    'creditNotes',
    'data',
    'results',
  ])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope =
    (args && (args.customer_id || args.invoice_id || args.status)) || undefined
  return {
    credit_notes: rows.map(normalizeCreditNote),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
    default_currency: 'USD',
  }
}

function normalizeCreditNote(c) {
  if (!c || typeof c !== 'object')
    return {
      id: '',
      external_id: null,
      customer_id: null,
      invoice_id: null,
      status: null,
      amount: null,
      currency: null,
      reason: null,
      issue_date: null,
      created_at: null,
    }
  return {
    id: String(c.id || c.credit_note_id || ''),
    external_id: c.external_id ?? null,
    customer_id: c.customer_id ?? null,
    invoice_id: c.invoice_id ?? null,
    status: c.status ?? null,
    amount: numOrNull(c.amount ?? c.total ?? c.value),
    currency: c.currency_code ?? c.currency ?? null,
    reason: c.reason ?? c.notes ?? c.description ?? null,
    issue_date: c.issue_date ?? c.issued_at ?? c.effective_date ?? null,
    created_at: c.created_at ?? null,
  }
}

function contractsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['contracts', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope =
    (args && (args.customer_id || args.name__ilike || args.status)) || undefined
  return {
    contracts: rows.map(normalizeContract),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
  }
}

function normalizeContract(c) {
  if (!c || typeof c !== 'object')
    return {
      id: '',
      external_id: null,
      customer_id: null,
      name: null,
      status: null,
      start_date: null,
      end_date: null,
      mrr: null,
      total_value: null,
      phase_count: null,
      created_at: null,
    }
  const phases = Array.isArray(c.phases) ? c.phases : []
  return {
    id: String(c.id || c.contract_id || ''),
    external_id: c.external_id ?? null,
    customer_id: c.customer_id ?? null,
    name: c.name ?? c.contract_name ?? null,
    status: c.status ?? c.state ?? null,
    start_date: c.start_date ?? null,
    end_date: c.end_date ?? null,
    mrr: pickMoney(c.mrr ?? c.monthly_recurring_revenue),
    total_value: pickMoney(
      c.total_value ?? c.contract_value ?? c.total_contract_value
    ),
    phase_count: numOrNull(c.phase_count ?? phases.length ?? null),
    created_at: c.created_at ?? null,
  }
}

// ===== New detail-card payload builders =====

function customerDetailToPayload(raw) {
  const body = unwrapTemplate(raw)
  const c = body.customer ?? body
  const base = normalizeCustomer(c)
  return {
    customer: {
      ...base,
      phone: c.phone ?? c.primary_phone ?? null,
      business_entity_id: c.business_entity_id ?? null,
      address: c.address ?? null,
      communications_enabled:
        typeof c.communications_enabled === 'boolean'
          ? c.communications_enabled
          : null,
      auto_charge_enabled:
        typeof c.auto_charge_enabled === 'boolean'
          ? c.auto_charge_enabled
          : null,
      custom_data: c.custom_data ?? null,
    },
  }
}

function invoiceDetailToPayload(raw) {
  const body = unwrapTemplate(raw)
  const i = body.invoice ?? body
  const base = normalizeInvoice(i)
  const lines = Array.isArray(i.line_items)
    ? i.line_items
    : Array.isArray(body.line_items)
      ? body.line_items
      : []
  return {
    invoice: {
      ...base,
      paid_amount: numOrNull(
        i.paid_amount ??
          (base.invoice_total != null && base.amount_due != null
            ? base.invoice_total - base.amount_due
            : null)
      ),
      currency: i.currency_code ?? i.currency ?? null,
      business_entity_id: i.business_entity_id ?? null,
      notes: i.notes ?? null,
      custom_data: i.custom_data ?? null,
    },
    line_items: lines.length ? lines.map(normalizeLineItem) : undefined,
  }
}

function contractDetailToPayload(raw) {
  const body = unwrapTemplate(raw)
  const c = body.contract ?? body
  const base = normalizeContract(c)
  const phases = Array.isArray(c.phases) ? c.phases : []
  return {
    contract: {
      ...base,
      custom_attributes: c.custom_attributes ?? null,
      renewal_policy: c.renewal_policy ?? null,
      notes: c.notes ?? null,
    },
    phases: phases.map(normalizePhase),
  }
}

function normalizePhase(p) {
  if (!p || typeof p !== 'object')
    return {
      id: null,
      name: null,
      start_date: null,
      end_date: null,
      mrr: null,
      pricing_summary: null,
      product_count: null,
    }
  const prods = Array.isArray(p.products) ? p.products : []
  return {
    id: p.id ?? null,
    name: p.name ?? p.phase_name ?? null,
    start_date: p.start_date ?? null,
    end_date: p.end_date ?? null,
    mrr: pickMoney(p.mrr ?? p.monthly_recurring_revenue),
    pricing_summary: p.pricing_summary ?? null,
    product_count: prods.length || numOrNull(p.product_count),
  }
}

function creditNoteDetailToPayload(raw) {
  const body = unwrapTemplate(raw)
  const c = body.credit_note ?? body.creditNote ?? body
  const base = normalizeCreditNote(c)
  return {
    credit_note: {
      ...base,
      line_items_url: c.line_items_url ?? null,
      business_entity_id: c.business_entity_id ?? null,
      notes: c.notes ?? null,
    },
  }
}

// ===== New list-table payload builders =====

function productsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['products', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && args.name__ilike) || undefined
  return {
    products: rows.map(normalizeProduct),
    total,
    cursor: { next, prev },
    scope,
  }
}
function normalizeProduct(p) {
  if (!p || typeof p !== 'object')
    return {
      id: '',
      name: null,
      external_id: null,
      description: null,
      status: null,
      pricing_count: null,
      created_at: null,
    }
  const pricings = Array.isArray(p.pricings)
    ? p.pricings
    : Array.isArray(p.pricing_configurations)
      ? p.pricing_configurations
      : null
  return {
    id: String(p.id || p.product_id || ''),
    name: p.name ?? p.product_name ?? null,
    external_id: p.external_id ?? p.sku ?? null,
    description: p.description ?? null,
    status: p.status ?? p.state ?? null,
    pricing_count: pricings ? pricings.length : numOrNull(p.pricing_count),
    created_at: p.created_at ?? null,
  }
}

function plansToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['plans', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && (args.name__ilike || args.status)) || undefined
  return {
    plans: rows.map(normalizePlan),
    total,
    cursor: { next, prev },
    scope,
  }
}
function normalizePlan(p) {
  if (!p || typeof p !== 'object')
    return {
      id: '',
      name: null,
      external_id: null,
      status: null,
      currency: null,
      phase_count: null,
      mrr: null,
      created_at: null,
    }
  const phases = Array.isArray(p.phases) ? p.phases : []
  return {
    id: String(p.id || p.plan_id || ''),
    name: p.name ?? p.plan_name ?? null,
    external_id: p.external_id ?? null,
    status: p.status ?? p.state ?? null,
    currency: p.currency ?? p.currency_code ?? null,
    phase_count: phases.length || numOrNull(p.phase_count),
    mrr: pickMoney(p.mrr ?? p.monthly_recurring_revenue),
    created_at: p.created_at ?? null,
  }
}

function journalEntriesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, [
    'entries',
    'journal_entries',
    'data',
    'results',
  ])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && args.search_query) || undefined
  return {
    entries: rows.map(normalizeJournalEntry),
    total,
    cursor: { next, prev },
    scope,
    default_currency: 'USD',
  }
}
function normalizeJournalEntry(e) {
  if (!e || typeof e !== 'object')
    return {
      id: '',
      entry_number: null,
      date: null,
      account_id: null,
      account_name: null,
      debit: null,
      credit: null,
      currency: null,
      description: null,
      created_at: null,
    }
  return {
    id: String(e.id || e.journal_entry_id || ''),
    entry_number: e.entry_number ?? e.reference ?? null,
    date: e.date ?? e.transaction_date ?? e.posted_at ?? null,
    account_id: e.account_id ?? null,
    account_name: e.account_name ?? null,
    debit: numOrNull(e.debit ?? e.debit_amount),
    credit: numOrNull(e.credit ?? e.credit_amount),
    currency: e.currency ?? e.currency_code ?? null,
    description: e.description ?? e.memo ?? null,
    created_at: e.created_at ?? null,
  }
}

function jobsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['jobs', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && args.search) || undefined
  // Roll up status counts so the header can show distribution at a glance
  const status_counts = {}
  for (const r of rows) {
    const s = (r && r.status) || 'unknown'
    status_counts[s] = (status_counts[s] || 0) + 1
  }
  return {
    jobs: rows.map(normalizeJob),
    total,
    cursor: { next, prev },
    scope,
    status_counts,
  }
}
function normalizeJob(j) {
  if (!j || typeof j !== 'object')
    return {
      id: '',
      type: null,
      status: null,
      started_at: null,
      completed_at: null,
      duration_ms: null,
      error: null,
      created_at: null,
    }
  const start = j.started_at ?? j.start_time ?? null
  const end = j.completed_at ?? j.end_time ?? null
  let duration_ms = null
  if (start && end) {
    const a = Date.parse(start)
    const b = Date.parse(end)
    if (Number.isFinite(a) && Number.isFinite(b)) duration_ms = b - a
  }
  return {
    id: String(j.id || j.job_id || ''),
    type: j.type ?? j.job_type ?? j.kind ?? null,
    status: j.status ?? null,
    started_at: start,
    completed_at: end,
    duration_ms,
    error: j.error ?? j.error_message ?? null,
    created_at: j.created_at ?? null,
  }
}

function contactsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['contacts', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && args.customer_id) || undefined
  return {
    contacts: rows.map(normalizeContact),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
  }
}
function normalizeContact(c) {
  if (!c || typeof c !== 'object')
    return {
      id: '',
      name: null,
      email: null,
      phone: null,
      customer_id: null,
      role: null,
      created_at: null,
    }
  const first = c.first_name ?? ''
  const last = c.last_name ?? ''
  const composedName = [first, last].filter(Boolean).join(' ').trim()
  return {
    id: String(c.id || c.contact_id || ''),
    name: c.name ?? (composedName || null),
    email: c.email ?? c.primary_email ?? null,
    phone: c.phone ?? c.primary_phone ?? null,
    customer_id: c.customer_id ?? null,
    role: c.role ?? c.title ?? c.position ?? null,
    created_at: c.created_at ?? null,
  }
}

function rawMetricsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, [
    'raw_metrics',
    'rawmetrics',
    'rawMetrics',
    'data',
    'results',
  ])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && (args.search || args.name__ilike)) || undefined
  return {
    raw_metrics: rows.map(normalizeRawMetric),
    total,
    cursor: { next, prev },
    scope,
  }
}
function normalizeRawMetric(m) {
  if (!m || typeof m !== 'object')
    return {
      id: '',
      name: null,
      api_slug: null,
      api_type: null,
      status: null,
      description: null,
      created_at: null,
    }
  return {
    id: String(m.id || m.raw_metric_id || ''),
    name: m.name ?? null,
    api_slug: m.api_slug ?? null,
    api_type: m.api_type ?? null,
    status: m.status ?? null,
    description: m.description ?? null,
    created_at: m.created_at ?? null,
  }
}

function aggregatesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['aggregates', 'data', 'results'])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  const scope = (args && (args.name__ilike || args.datasource)) || undefined
  return {
    aggregates: rows.map(normalizeAggregate),
    total,
    cursor: { next, prev },
    scope,
  }
}
function normalizeAggregate(a) {
  if (!a || typeof a !== 'object')
    return {
      id: '',
      name: null,
      datasource: null,
      status: null,
      formula: null,
      unit: null,
      last_run_at: null,
      created_at: null,
    }
  return {
    id: String(a.id || a.aggregate_id || ''),
    name: a.name ?? null,
    datasource: a.datasource ?? a.data_source ?? a.raw_metric_name ?? null,
    status: a.status ?? null,
    formula: a.formula ?? a.aggregation ?? null,
    unit: a.unit ?? null,
    last_run_at: a.last_run_at ?? a.updated_at ?? null,
    created_at: a.created_at ?? null,
  }
}

function addressesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, ['addresses', 'data', 'results'])
  return {
    customer_id: args && args.customerId ? String(args.customerId) : undefined,
    addresses: rows.map(normalizeAddress),
    total: rows.length,
  }
}
function normalizeAddress(a) {
  if (!a || typeof a !== 'object')
    return {
      id: '',
      label: null,
      line1: null,
      line2: null,
      city: null,
      state: null,
      zip_code: null,
      country: null,
      is_primary: null,
    }
  return {
    id: String(a.id || ''),
    label: a.label ?? a.name ?? a.address_type ?? null,
    line1: a.line1 ?? a.address_line_1 ?? null,
    line2: a.line2 ?? a.address_line_2 ?? null,
    city: a.city ?? null,
    state: a.state ?? null,
    zip_code: a.zipCode ?? a.zip_code ?? a.postal_code ?? null,
    country: a.country ?? a.country_code ?? null,
    is_primary:
      typeof a.is_primary === 'boolean'
        ? a.is_primary
        : typeof a.primary === 'boolean'
          ? a.primary
          : null,
  }
}

function paymentMethodsToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, [
    'payment_methods',
    'paymentMethods',
    'data',
    'results',
  ])
  return {
    customer_id: args && args.customerId ? String(args.customerId) : undefined,
    payment_methods: rows.map(normalizePaymentMethod),
    total: rows.length,
  }
}
function normalizePaymentMethod(m) {
  if (!m || typeof m !== 'object')
    return {
      id: '',
      type: null,
      brand: null,
      last4: null,
      exp_month: null,
      exp_year: null,
      is_default: null,
      created_at: null,
    }
  const card = m.card || {}
  return {
    id: String(m.id || ''),
    type: m.type ?? m.payment_method_type ?? null,
    brand: card.brand ?? m.brand ?? null,
    last4: card.last4 ?? m.last4 ?? null,
    exp_month: numOrNull(card.exp_month ?? m.exp_month),
    exp_year: numOrNull(card.exp_year ?? m.exp_year),
    is_default:
      typeof m.is_default === 'boolean'
        ? m.is_default
        : typeof m.default === 'boolean'
          ? m.default
          : null,
    created_at: m.created_at ?? null,
  }
}

function entitiesToPayload(raw, args) {
  const body = unwrapTemplate(raw)
  const rows = pickArray(body, [
    'business_entities',
    'businessEntities',
    'entities',
    'data',
    'results',
  ])
  const total =
    pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length
  const cursor = pickObject(body, ['cursor', 'pagination']) || {}
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null
  return {
    entities: rows.map(normalizeEntity),
    total,
    cursor: { next, prev },
  }
}
function normalizeEntity(e) {
  if (!e || typeof e !== 'object')
    return {
      id: '',
      name: null,
      code: null,
      country: null,
      default_currency: null,
      status: null,
      created_at: null,
    }
  return {
    id: String(e.id || e.business_entity_id || ''),
    name: e.name ?? e.business_entity_name ?? null,
    code: e.code ?? e.short_code ?? null,
    country:
      e.country ?? e.country_code ?? (e.address && e.address.country) ?? null,
    default_currency: e.default_currency ?? e.currency ?? null,
    status: e.status ?? null,
    created_at: e.created_at ?? null,
  }
}

// ===== Helpers =====

function pickArray(o, keys) {
  if (Array.isArray(o)) return o
  for (const k of keys) if (o && Array.isArray(o[k])) return o[k]
  return []
}
function pickObject(o, keys) {
  for (const k of keys) if (o && o[k] && typeof o[k] === 'object') return o[k]
  return null
}
function pickNumber(o, keys) {
  for (const k of keys) if (o && Number.isFinite(o[k])) return o[k]
  return null
}
function pickMoney(v) {
  if (!v) return null
  if (typeof v === 'object' && Number.isFinite(v.amount))
    return { amount: v.amount, currency: v.currency || 'USD' }
  if (Number.isFinite(v)) return { amount: v, currency: 'USD' }
  return null
}
function numOrNull(v) {
  return Number.isFinite(v) ? v : null
}

export function lookup(toolName) {
  if (TEXT_ONLY_TOOLS.has(toolName)) return { mode: 'text-only' }
  const entry = TOOL_TO_SHAPE[toolName]
  return entry ? { mode: 'ui', ...entry } : { mode: 'unmapped' }
}

export { TOOL_TO_SHAPE, TEXT_ONLY_TOOLS }
