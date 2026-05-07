export type ShapeName =
  | 'customer-table'
  | 'invoice-table'
  | 'invoice-line-items'
  | 'payment-table'
  | 'credit-note-table'
  | 'contract-table'
  | 'transaction-table'
  | 'dunning'
  | 'forecast'
  | 'credit-note-form';

export interface Money { value: number | null; unit: string | null; display?: string | null }

export interface InvoiceRow {
  id: string;
  invoice_number: string | null;
  customer_id: string | null;
  status: string | null;
  invoice_total: number | null;
  amount_due: number | null;
  due_date: string | null;
  invoice_period_begin: string | null;
  invoice_period_end: string | null;
  external_id: string | null;
  created_at: string | null;
  payment_url: string | null;
}

export interface InvoiceTablePayload {
  invoices: InvoiceRow[];
  total: number;
  cursor?: { next?: string | null; prev?: string | null };
  scope?: string;
  default_currency?: string;
}

export interface LineItem {
  name: string;
  description: string | null;
  pricing_model: string | null;
  subtotal: Money;
  quantity: Money;
  price: Money | null;
  service_start_date: string | null;
  service_end_date: string | null;
  is_billed: boolean | null;
}

export interface InvoiceLineItemsPayload {
  invoice_id?: string;
  total?: number | null;
  currency?: string;
  lines: LineItem[];
}

export interface BrandConfig {
  primary: string;
  primaryFg: string;
  accent: string;
  accentFg: string;
  link: string;
  ring: string;
  bg: string;
  fg: string;
  muted: string;
  border: string;
  rowHover: string;
}

export interface HostContext {
  cssVariables?: Record<string, string>;
  theme?: 'light' | 'dark';
  hostName?: string;
}

export interface CustomerRow {
  id: string;
  name: string | null;
  external_id: string | null;
  email: string | null;
  invoice_count?: number | null;
  mrr?: { amount: number; currency: string } | null;
  outstanding?: { amount: number; currency: string } | null;
  status?: 'active' | 'churned' | 'paused' | null;
  last_activity_at?: string | null;
  created_at?: string | null;
}

export interface CustomerTablePayload {
  customers: CustomerRow[];
  total: number;
  cursor?: { next?: string | null; prev?: string | null };
  scope?: string;
}

export interface PaymentRow {
  id: string;
  external_id: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  amount: number | null;
  currency: string | null;
  payment_method: string | null;
  type: string | null;
  status: string | null;
  description: string | null;
  payment_date: string | null;
  created_at: string | null;
}

export interface PaymentTablePayload {
  payments: PaymentRow[];
  total: number;
  cursor?: { next?: string | null; prev?: string | null };
  scope?: string;
  default_currency?: string;
}

export interface CreditNoteRow {
  id: string;
  external_id: string | null;
  customer_id: string | null;
  invoice_id: string | null;
  status: string | null;
  amount: number | null;
  currency: string | null;
  reason: string | null;
  issue_date: string | null;
  created_at: string | null;
}

export interface CreditNoteTablePayload {
  credit_notes: CreditNoteRow[];
  total: number;
  cursor?: { next?: string | null; prev?: string | null };
  scope?: string;
  default_currency?: string;
}

export interface ContractRow {
  id: string;
  external_id: string | null;
  customer_id: string | null;
  name: string | null;
  status: string | null;
  start_date: string | null;
  end_date: string | null;
  mrr: { amount: number; currency: string } | null;
  total_value: { amount: number; currency: string } | null;
  phase_count: number | null;
  created_at: string | null;
}

export interface ContractTablePayload {
  contracts: ContractRow[];
  total: number;
  cursor?: { next?: string | null; prev?: string | null };
  scope?: string;
}

declare global {
  interface Window {
    __DATA__?: unknown;
    __ZENSKAR_BRAND__?: Partial<BrandConfig>;
  }
}
