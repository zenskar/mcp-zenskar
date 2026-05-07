const TEXT_ONLY_TOOLS = new Set([
  'getInvoiceSummary',
  'getCustomerBalance',
  'getPaymentStatus',
]);

const TOOL_TO_SHAPE = {
  listCustomers: { shape: 'customer-table', noun: 'customer', toPayload: customersToPayload, threshold: 0 },
  listInvoices: { shape: 'invoice-table', noun: 'invoice', toPayload: invoicesToPayload, threshold: 0 },
  getInvoiceLineItems: { shape: 'invoice-line-items', noun: 'line item', toPayload: lineItemsToPayload, threshold: 0 },
  listAllPayments: { shape: 'payment-table', noun: 'payment', toPayload: paymentsToPayload, threshold: 0 },
  listCreditNotes: { shape: 'credit-note-table', noun: 'credit note', toPayload: creditNotesToPayload, threshold: 0 },
  listContracts: { shape: 'contract-table', noun: 'contract', toPayload: contractsToPayload, threshold: 0 },
};

export const SHAPES = Object.freeze([
  'customer-table',
  'invoice-table',
  'invoice-line-items',
  'payment-table',
  'credit-note-table',
  'contract-table',
]);

export function resourceUriFor(shape) {
  return `ui://zenskar/${shape}.html`;
}

function customersToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const customers = pickArray(body, ['customers', 'data', 'results']);
  const total = pickNumber(body, ['total', 'count', 'total_count']) ?? customers.length;
  const cursor = pickObject(body, ['cursor', 'pagination']) || {};
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null;
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null;
  const scope = (args && (args.search_name_external_id || args.search)) || undefined;
  return {
    customers: customers.map(normalizeCustomer),
    total,
    cursor: { next, prev },
    scope,
  };
}

function unwrapTemplate(raw) {
  if (raw && typeof raw === 'object' && raw.api_response && typeof raw.api_response === 'object') {
    return raw.api_response;
  }
  return raw || {};
}

function invoicesToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const rows = pickArray(body, ['invoices', 'data', 'results']);
  const total = pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length;
  const cursor = pickObject(body, ['cursor', 'pagination']) || {};
  const next = cursor.next ?? body.next ?? null;
  const prev = cursor.prev ?? body.previous ?? null;
  return {
    invoices: rows.map(normalizeInvoice),
    total,
    cursor: { next, prev },
    scope: args && (args.customer__customer_name__ilike || args.invoice_number__like || args.status) || undefined,
    default_currency: 'USD',
  };
}

function normalizeInvoice(r) {
  if (!r || typeof r !== 'object') return { id: '', invoice_number: null, customer_id: null, status: null, invoice_total: null, amount_due: null, due_date: null, invoice_period_begin: null, invoice_period_end: null, external_id: null, created_at: null, payment_url: null };
  const period = r.invoice_period || {};
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
  };
}

function lineItemsToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const lines = Array.isArray(body.lines) ? body.lines : (Array.isArray(body) ? body : []);
  const total = numOrNull(body.total);
  const currency = pickCurrencyFromLines(lines) || 'USD';
  return {
    invoice_id: args && args.invoiceId ? String(args.invoiceId) : undefined,
    total,
    currency,
    lines: lines.map(normalizeLineItem),
  };
}

function pickCurrencyFromLines(lines) {
  for (const l of lines) {
    if (l && l.subtotal && l.subtotal.unit) return l.subtotal.unit;
    if (l && l.features && l.features[0] && l.features[0].currency) return l.features[0].currency;
  }
  return null;
}

function normalizeLineItem(l) {
  if (!l || typeof l !== 'object') return { name: '', description: null, pricing_model: null, subtotal: { value: null, unit: null }, quantity: { value: null, unit: null }, price: null, service_start_date: null, service_end_date: null, is_billed: null };
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
  };
}

function normalizeMoney(m) {
  if (!m) return { value: null, unit: null, display: null };
  return { value: numOrNull(m.value), unit: m.unit ?? null, display: m.display ?? null };
}

function normalizeCustomer(c) {
  if (!c || typeof c !== 'object') return { id: '', name: null, external_id: null, email: null };
  const inv = c.invoice_details || {};
  return {
    id: String(c.id || c.customer_id || ''),
    name: c.customer_name ?? c.name ?? null,
    external_id: c.external_id ?? null,
    email: c.email ?? c.primary_email ?? null,
    invoice_count: numOrNull(inv.no_of_invoices ?? c.invoice_count),
    mrr: pickMoney(c.mrr ?? c.monthly_recurring_revenue),
    outstanding: pickMoney(c.outstanding ?? c.outstanding_amount ?? c.amount_outstanding ?? inv.total_amount_due),
    status: c.status ?? (c.communications_enabled === false ? 'paused' : 'active'),
    last_activity_at: c.last_activity_at ?? c.last_seen_at ?? c.updated_at ?? null,
    created_at: c.created_at ?? c.created ?? null,
  };
}

function paymentsToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const rows = pickArray(body, ['payments', 'data', 'results']);
  const total = pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length;
  const cursor = pickObject(body, ['cursor', 'pagination']) || {};
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null;
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null;
  const scope = (args && (args.search || args.customer_id || args.type || args.payment_method)) || undefined;
  return {
    payments: rows.map(normalizePayment),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
    default_currency: 'USD',
  };
}

function normalizePayment(p) {
  if (!p || typeof p !== 'object') return { id: '', external_id: null, customer_id: null, invoice_id: null, amount: null, currency: null, payment_method: null, type: null, status: null, description: null, payment_date: null, created_at: null };
  const parts = Array.isArray(p.payment_parts) ? p.payment_parts : [];
  const firstInvoiceId = (parts.find(x => x && x.invoice_id) || {}).invoice_id || p.invoice_id || null;
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
  };
}

function creditNotesToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const rows = pickArray(body, ['credit_notes', 'creditNotes', 'data', 'results']);
  const total = pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length;
  const cursor = pickObject(body, ['cursor', 'pagination']) || {};
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null;
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null;
  const scope = (args && (args.customer_id || args.invoice_id || args.status)) || undefined;
  return {
    credit_notes: rows.map(normalizeCreditNote),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
    default_currency: 'USD',
  };
}

function normalizeCreditNote(c) {
  if (!c || typeof c !== 'object') return { id: '', external_id: null, customer_id: null, invoice_id: null, status: null, amount: null, currency: null, reason: null, issue_date: null, created_at: null };
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
  };
}

function contractsToPayload(raw, args) {
  const body = unwrapTemplate(raw);
  const rows = pickArray(body, ['contracts', 'data', 'results']);
  const total = pickNumber(body, ['total', 'count', 'total_count']) ?? rows.length;
  const cursor = pickObject(body, ['cursor', 'pagination']) || {};
  const next = cursor.next ?? cursor.next_cursor ?? body.next ?? null;
  const prev = cursor.prev ?? cursor.prev_cursor ?? body.previous ?? null;
  const scope = (args && (args.customer_id || args.name__ilike || args.status)) || undefined;
  return {
    contracts: rows.map(normalizeContract),
    total,
    cursor: { next, prev },
    scope: scope ? String(scope) : undefined,
  };
}

function normalizeContract(c) {
  if (!c || typeof c !== 'object') return { id: '', external_id: null, customer_id: null, name: null, status: null, start_date: null, end_date: null, mrr: null, total_value: null, phase_count: null, created_at: null };
  const phases = Array.isArray(c.phases) ? c.phases : [];
  return {
    id: String(c.id || c.contract_id || ''),
    external_id: c.external_id ?? null,
    customer_id: c.customer_id ?? null,
    name: c.name ?? c.contract_name ?? null,
    status: c.status ?? c.state ?? null,
    start_date: c.start_date ?? null,
    end_date: c.end_date ?? null,
    mrr: pickMoney(c.mrr ?? c.monthly_recurring_revenue),
    total_value: pickMoney(c.total_value ?? c.contract_value ?? c.total_contract_value),
    phase_count: numOrNull(c.phase_count ?? phases.length ?? null),
    created_at: c.created_at ?? null,
  };
}

function pickArray(o, keys) {
  if (Array.isArray(o)) return o;
  for (const k of keys) if (o && Array.isArray(o[k])) return o[k];
  return [];
}
function pickObject(o, keys) {
  for (const k of keys) if (o && o[k] && typeof o[k] === 'object') return o[k];
  return null;
}
function pickNumber(o, keys) {
  for (const k of keys) if (o && Number.isFinite(o[k])) return o[k];
  return null;
}
function pickMoney(v) {
  if (!v) return null;
  if (typeof v === 'object' && Number.isFinite(v.amount)) return { amount: v.amount, currency: v.currency || 'USD' };
  if (Number.isFinite(v)) return { amount: v, currency: 'USD' };
  return null;
}
function numOrNull(v) { return Number.isFinite(v) ? v : null; }

export function lookup(toolName) {
  if (TEXT_ONLY_TOOLS.has(toolName)) return { mode: 'text-only' };
  const entry = TOOL_TO_SHAPE[toolName];
  return entry ? { mode: 'ui', ...entry } : { mode: 'unmapped' };
}

export { TOOL_TO_SHAPE, TEXT_ONLY_TOOLS };
