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
  | 'invoice-preview'
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
  line_item_type: string | null
  is_adjustment: boolean | null
  adjustment_type: string | null
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
  credit_note_number: string | null
  customer_id: string | null
  invoice_id: string | null
  status: string | null
  amount: number | null
  currency: string | null
  repayment_method: string | null
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
  customer_id: string | null
  name: string | null
  status: string | null
  currency: string | null
  start_date: string | null
  end_date: string | null
  created_at: string | null
}

export interface ContractTablePayload {
  contracts: ContractRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

// ===== Detail cards =====

export interface CustomerContact {
  name: string | null
  email: string | null
  send_invoice: boolean | null
  send_contract: boolean | null
}

export interface CustomerPaymentMethodSummary {
  type: string | null
  brand: string | null
  last4: string | null
  connector_name: string | null
}

export interface TaxInfo {
  country_code: string | null
  tax_code: string | null
  tax_id: string | null
}

export interface CustomerDetailPayload {
  customer: CustomerRow & {
    phone?: string | null
    business_entity_id?: string | null
    business_entity_name?: string | null
    address?: Record<string, string | null> | null
    ship_to_address?: Record<string, string | null> | null
    communications_enabled?: boolean | null
    auto_charge_enabled?: boolean | null
    custom_data?: Record<string, unknown> | null
    tax_info?: TaxInfo[] | null
    contacts?: CustomerContact[] | null
    default_payment_method?: CustomerPaymentMethodSummary | null
    updated_at?: string | null
  }
}

export interface InvoiceDetailPayload {
  invoice: InvoiceRow & {
    paid_amount?: number | null
    currency?: string | null
    business_entity_id?: string | null
    notes?: string | null
    custom_data?: Record<string, unknown> | null
    customer_name?: string | null
    contract_id?: string | null
    contract_name?: string | null
    invoice_pdf?: string | null
    approved_at?: string | null
    paid_at?: string | null
    sent_at?: string | null
  }
  line_items?: LineItem[]
}

export interface ContractPhase {
  id?: string | null
  name?: string | null
  start_date?: string | null
  end_date?: string | null
  pricing_summary?: string | null
  product_count?: number | null
}

export interface ContractDetailPayload {
  contract: ContractRow & {
    description?: string | null
    custom_attributes?: Record<string, unknown> | null
    renewal_policy?: string | null
    anchor_date?: string | null
    plan_id?: string | null
    customer_name?: string | null
    contract_type?: string | null
    tags?: string[] | null
    contract_link?: string | null
  }
  phases: ContractPhase[]
}

export interface CreditNoteDetailPayload {
  credit_note: CreditNoteRow & {
    line_items_url?: string | null
    credits_returned?: number | null
    custom_data?: Record<string, unknown> | null
    customer_name?: string | null
    invoice_number?: string | null
  }
}

// ===== List tables =====

export interface ProductRow {
  id: string
  name: string | null
  sku: string | null
  description: string | null
  product_type: string | null
  is_active: boolean | null
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
  description: string | null
  status: string | null
  plan_version: number | null
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
  posted_at: string | null
  event: string | null
  description: string | null
  status_type: string | null
  currency: string | null
  total_debit: number | null
  total_credit: number | null
  line_count: number | null
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
  name: string | null
  description: string | null
  job_type: string | null
  resource: string | null
  status: string | null
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
  customer_id: string | null
  send_invoice: boolean | null
  send_contract: boolean | null
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
  usage_upload_enabled: boolean | null
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
  line3: string | null
  city: string | null
  state: string | null
  zip_code: string | null
  country: string | null
  is_primary: boolean | null
  validation_status: string | null
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
  connector_name: string | null
  status: string | null
}
export interface PaymentMethodListPayload {
  customer_id?: string
  payment_methods: PaymentMethodRow[]
  total: number
}

export interface EntitlementRow {
  id: string
  name: string | null
  entitlement_type: string | null
  units: string | null
  is_active: boolean | null
  product_name: string | null
  created_at: string | null
}
export interface EntitlementTablePayload {
  entitlements: EntitlementRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface EntityRow {
  id: string
  name: string | null
  email: string | null
  phone_number: string | null
  country: string | null
  is_default: boolean | null
}
export interface EntityTablePayload {
  entities: EntityRow[]
  total: number
  cursor?: { next?: string | null; prev?: string | null }
  scope?: string
}

export interface InvoicePreviewPayload {
  html: string
  invoice_id?: string
}

declare global {
  interface Window {
    __DATA__?: unknown
    __ZENSKAR_BRAND__?: Partial<BrandConfig>
  }
}
