export type ShapeName =
  | 'customer-table'
  | 'invoice-table'
  | 'invoice-line-items'
  | 'payment-table'
  | 'credit-note-table'
  | 'contract-table'
  | 'customer-detail'
  | 'invoice-detail'
  | 'contract-detail'
  | 'credit-note-detail'
  | 'product-table'
  | 'plan-table'
  | 'journal-table'
  | 'job-table'
  | 'contact-table'
  | 'raw-metric-table'
  | 'aggregate-table'
  | 'address-list'
  | 'payment-method-list'
  | 'entity-table'
  | 'transaction-table'
  | 'dunning'
  | 'forecast'
  | 'credit-note-form'

export interface Money {
  value: number | null
  unit: string | null
  display?: string | null
}

export interface InvoiceRow {
  id: string
  invoice_number: string | null
  customer_id: string | null
  status: string | null
  invoice_total: number | null
  amount_due: number | null
  due_date: string | null
  invoice_period_begin: string | null
  invoice_period_end: string | null
  external_id: string | null
  created_at: string | null
  payment_url: string | null
}

export interface InvoiceTablePayload {
  invoices: InvoiceRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
  default_currency?: string
}

export interface LineItem {
  name: string
  description: string | null
  pricing_model: string | null
  subtotal: Money
  quantity: Money
  price: Money | null
  service_start_date: string | null
  service_end_date: string | null
  is_billed: boolean | null
}

export interface InvoiceLineItemsPayload {
  invoice_id?: string
  total?: number | null
  currency?: string
  lines: LineItem[]
}

export interface BrandConfig {
  primary: string
  primaryFg: string
  accent: string
  accentFg: string
  link: string
  ring: string
  bg: string
  fg: string
  muted: string
  border: string
  rowHover: string
}

export interface HostContext {
  cssVariables?: Record<string, string>
  theme?: 'light' | 'dark'
  hostName?: string
}

export interface CustomerRow {
  id: string
  name: string | null
  external_id: string | null
  email: string | null
  invoice_count?: number | null
  mrr?: { amount: number; currency: string } | null
  outstanding?: { amount: number; currency: string } | null
  status?: 'active' | 'churned' | 'paused' | null
  last_activity_at?: string | null
  created_at?: string | null
}

export interface CustomerTablePayload {
  customers: CustomerRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface PaymentRow {
  id: string
  external_id: string | null
  customer_id: string | null
  invoice_id: string | null
  amount: number | null
  currency: string | null
  payment_method: string | null
  type: string | null
  status: string | null
  description: string | null
  payment_date: string | null
  created_at: string | null
}

export interface PaymentTablePayload {
  payments: PaymentRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
  default_currency?: string
}

export interface CreditNoteRow {
  id: string
  external_id: string | null
  customer_id: string | null
  invoice_id: string | null
  status: string | null
  amount: number | null
  currency: string | null
  reason: string | null
  issue_date: string | null
  created_at: string | null
}

export interface CreditNoteTablePayload {
  credit_notes: CreditNoteRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
  default_currency?: string
}

export interface ContractRow {
  id: string
  external_id: string | null
  customer_id: string | null
  name: string | null
  status: string | null
  start_date: string | null
  end_date: string | null
  mrr: { amount: number; currency: string } | null
  total_value: { amount: number; currency: string } | null
  phase_count: number | null
  created_at: string | null
}

export interface ContractTablePayload {
  contracts: ContractRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

// ===== Detail cards =====

export interface CustomerDetailPayload {
  customer: CustomerRow & {
    phone?: string | null
    business_entity_id?: string | null
    address?: Record<string, string | null> | null
    communications_enabled?: boolean | null
    auto_charge_enabled?: boolean | null
    custom_data?: Record<string, unknown> | null
  }
}

export interface InvoiceDetailPayload {
  invoice: InvoiceRow & {
    paid_amount?: number | null
    currency?: string | null
    business_entity_id?: string | null
    notes?: string | null
    custom_data?: Record<string, unknown> | null
  }
  line_items?: LineItem[]
}

export interface ContractPhase {
  id?: string | null
  name?: string | null
  start_date?: string | null
  end_date?: string | null
  mrr?: { amount: number; currency: string } | null
  pricing_summary?: string | null
  product_count?: number | null
}

export interface ContractDetailPayload {
  contract: ContractRow & {
    custom_attributes?: Record<string, unknown> | null
    renewal_policy?: string | null
    notes?: string | null
  }
  phases: ContractPhase[]
}

export interface CreditNoteDetailPayload {
  credit_note: CreditNoteRow & {
    line_items_url?: string | null
    business_entity_id?: string | null
    notes?: string | null
  }
}

// ===== List tables =====

export interface ProductRow {
  id: string
  name: string | null
  external_id: string | null
  description: string | null
  status: string | null
  pricing_count: number | null
  created_at: string | null
}
export interface ProductTablePayload {
  products: ProductRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface PlanRow {
  id: string
  name: string | null
  external_id: string | null
  status: string | null
  currency: string | null
  phase_count: number | null
  mrr: { amount: number; currency: string } | null
  created_at: string | null
}
export interface PlanTablePayload {
  plans: PlanRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface JournalEntryRow {
  id: string
  entry_number: string | null
  date: string | null
  account_id: string | null
  account_name: string | null
  debit: number | null
  credit: number | null
  currency: string | null
  description: string | null
  created_at: string | null
}
export interface JournalTablePayload {
  entries: JournalEntryRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
  default_currency?: string
}

export interface JobRow {
  id: string
  type: string | null
  status: string | null
  started_at: string | null
  completed_at: string | null
  duration_ms: number | null
  error: string | null
  created_at: string | null
}
export interface JobTablePayload {
  jobs: JobRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
  status_counts?: Record<string, number>
}

export interface ContactRow {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  customer_id: string | null
  role: string | null
  created_at: string | null
}
export interface ContactTablePayload {
  contacts: ContactRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface RawMetricRow {
  id: string
  name: string | null
  api_slug: string | null
  api_type: string | null
  status: string | null
  description: string | null
  created_at: string | null
}
export interface RawMetricTablePayload {
  raw_metrics: RawMetricRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface AggregateRow {
  id: string
  name: string | null
  datasource: string | null
  status: string | null
  formula: string | null
  unit: string | null
  last_run_at: string | null
  created_at: string | null
}
export interface AggregateTablePayload {
  aggregates: AggregateRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface AddressRow {
  id: string
  label: string | null
  line1: string | null
  line2: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  is_primary: boolean | null
}
export interface AddressListPayload {
  customer_id?: string
  addresses: AddressRow[]
  total: number
}

export interface PaymentMethodRow {
  id: string
  type: string | null
  brand: string | null
  last4: string | null
  exp_month: number | null
  exp_year: number | null
  is_default: boolean | null
  created_at: string | null
}
export interface PaymentMethodListPayload {
  customer_id?: string
  payment_methods: PaymentMethodRow[]
  total: number
}

export interface EntityRow {
  id: string
  name: string | null
  code: string | null
  country: string | null
  default_currency: string | null
  status: string | null
  created_at: string | null
}
export interface EntityTablePayload {
  entities: EntityRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

declare global {
  interface Window {
    __DATA__?: unknown
    __ZENSKAR_BRAND__?: Partial<BrandConfig>
  }
}
