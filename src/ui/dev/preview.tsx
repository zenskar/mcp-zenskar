import '../client/theme.css'

import { StrictMode, useEffect, useState } from 'react'

import { createRoot } from 'react-dom/client'

import { AddressList } from '../components/AddressList'
import { AggregateTable } from '../components/AggregateTable'
import { ContactTable } from '../components/ContactTable'
import { ContractDetail } from '../components/ContractDetail'
import { ContractTable } from '../components/ContractTable'
import { CreditNoteDetail } from '../components/CreditNoteDetail'
import { CreditNoteTable } from '../components/CreditNoteTable'
import { CustomerDetail } from '../components/CustomerDetail'
import { CustomerTable } from '../components/CustomerTable'
import { EntityTable } from '../components/EntityTable'
import { InvoiceDetail } from '../components/InvoiceDetail'
import { InvoicePreview } from '../components/InvoicePreview'
import { InvoiceLineItems } from '../components/InvoiceLineItems'
import { InvoiceTable } from '../components/InvoiceTable'
import { JobTable } from '../components/JobTable'
import { JournalTable } from '../components/JournalTable'
import { PaymentMethodList } from '../components/PaymentMethodList'
import { PaymentTable } from '../components/PaymentTable'
import { PlanTable } from '../components/PlanTable'
import { ProductTable } from '../components/ProductTable'
import { RawMetricTable } from '../components/RawMetricTable'
import { addressFixture } from '../fixtures/addresses'
import { aggregateFixture } from '../fixtures/aggregates'
import { contactFixture } from '../fixtures/contacts'
import { contractDetailFixture } from '../fixtures/contractDetail'
import { contractFixture } from '../fixtures/contracts'
import { creditNoteDetailFixture } from '../fixtures/creditNoteDetail'
import { creditNoteFixture } from '../fixtures/creditNotes'
import { customerDetailFixture } from '../fixtures/customerDetail'
import { customerFixture } from '../fixtures/customers'
import { entityFixture } from '../fixtures/entities'
import { invoiceDetailFixture } from '../fixtures/invoiceDetail'
import { invoicePreviewFixture } from '../fixtures/invoicePreview'
import { invoiceFixture, lineItemsFixture } from '../fixtures/invoices'
import { jobFixture } from '../fixtures/jobs'
import { journalEntryFixture } from '../fixtures/journalEntries'
import { paymentMethodFixture } from '../fixtures/paymentMethods'
import { paymentFixture } from '../fixtures/payments'
import { planFixture } from '../fixtures/plans'
import { productFixture } from '../fixtures/products'
import { rawMetricFixture } from '../fixtures/rawMetrics'

const SHAPES = {
  // Existing
  'customer-table': () => <CustomerTable payload={customerFixture} />,
  'invoice-table': () => <InvoiceTable payload={invoiceFixture} />,
  'invoice-line-items': () => <InvoiceLineItems payload={lineItemsFixture} />,
  'payment-table': () => <PaymentTable payload={paymentFixture} />,
  'credit-note-table': () => <CreditNoteTable payload={creditNoteFixture} />,
  'contract-table': () => <ContractTable payload={contractFixture} />,
  // New detail cards
  'customer-detail': () => <CustomerDetail payload={customerDetailFixture} />,
  'invoice-detail': () => <InvoiceDetail payload={invoiceDetailFixture} />,
  'contract-detail': () => <ContractDetail payload={contractDetailFixture} />,
  'credit-note-detail': () => (
    <CreditNoteDetail payload={creditNoteDetailFixture} />
  ),
  // New list tables
  'product-table': () => <ProductTable payload={productFixture} />,
  'plan-table': () => <PlanTable payload={planFixture} />,
  'journal-table': () => <JournalTable payload={journalEntryFixture} />,
  'job-table': () => <JobTable payload={jobFixture} />,
  'contact-table': () => <ContactTable payload={contactFixture} />,
  'raw-metric-table': () => <RawMetricTable payload={rawMetricFixture} />,
  'aggregate-table': () => <AggregateTable payload={aggregateFixture} />,
  'address-list': () => <AddressList payload={addressFixture} />,
  'payment-method-list': () => (
    <PaymentMethodList payload={paymentMethodFixture} />
  ),
  'entity-table': () => <EntityTable payload={entityFixture} />,
  'invoice-preview': () => <InvoicePreview payload={invoicePreviewFixture} />,
} as const

type ShapeKey = keyof typeof SHAPES
type ThemeMode = 'light' | 'dark' | 'system'

const THEME_STORAGE_KEY = 'mcp-zenskar-dev-theme'

function readThemeFromStorage(): ThemeMode {
  if (typeof localStorage === 'undefined') return 'system'
  const v = localStorage.getItem(THEME_STORAGE_KEY)
  return v === 'light' || v === 'dark' || v === 'system' ? v : 'system'
}

function applyTheme(mode: ThemeMode) {
  const root = document.documentElement
  root.classList.remove('dark', 'light')
  if (mode === 'dark') root.classList.add('dark')
  else if (mode === 'light') root.classList.add('light')
}

function useTheme(): [ThemeMode, (m: ThemeMode) => void] {
  const [mode, setMode] = useState<ThemeMode>(readThemeFromStorage)
  useEffect(() => {
    applyTheme(mode)
    try {
      localStorage.setItem(THEME_STORAGE_KEY, mode)
    } catch {
      // ignore storage failures
    }
  }, [mode])
  return [mode, setMode]
}

function ThemeToggle({
  mode,
  setMode,
}: {
  mode: ThemeMode
  setMode: (m: ThemeMode) => void
}) {
  const opts: ThemeMode[] = ['light', 'system', 'dark']
  return (
    <div className="bg-muted text-muted-foreground inline-flex items-center gap-0.5 rounded-md p-0.5 text-xs">
      {opts.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => setMode(o)}
          className={
            mode === o
              ? 'bg-background text-foreground rounded px-2 py-0.5 font-medium'
              : 'hover:text-foreground rounded px-2 py-0.5'
          }
        >
          {o}
        </button>
      ))}
    </div>
  )
}

function MockHostHeader({
  themeMode,
  setThemeMode,
}: {
  themeMode: ThemeMode
  setThemeMode: (m: ThemeMode) => void
}) {
  const [width, setWidth] = useState<number>(720)
  return (
    <div
      className="bg-card text-card-foreground border-border sticky top-0 z-10 flex items-center gap-4 border-b px-4 py-2 text-xs"
      style={{ fontFamily: 'var(--font-sans)' }}
    >
      <strong>mock host</strong>
      <span className="text-muted-foreground">width:</span>
      <input
        type="range"
        min={320}
        max={1200}
        value={width}
        onChange={(e) => setWidth(Number((e.target as HTMLInputElement).value))}
      />
      <span className="w-12 text-right tabular-nums">{width}px</span>
      <ShapeSelect />
      <ThemeToggle mode={themeMode} setMode={setThemeMode} />
      <span className="text-muted-foreground ml-auto">
        postMessage echoes in console
      </span>
      <iframe
        title="frame"
        id="dev-frame"
        data-width={width}
        style={{ display: 'none' }}
      />
    </div>
  )
}

function ShapeSelect() {
  const params = new URLSearchParams(location.search)
  const current = (params.get('shape') as ShapeKey) || 'customer-table'
  return (
    <select
      defaultValue={current}
      onChange={(e) => {
        params.set('shape', (e.target as HTMLSelectElement).value)
        location.search = params.toString()
      }}
      className="bg-background text-foreground border-border rounded border px-2 py-0.5"
    >
      {Object.keys(SHAPES).map((k) => (
        <option key={k} value={k}>
          {k}
        </option>
      ))}
    </select>
  )
}

function App() {
  const [themeMode, setThemeMode] = useTheme()
  const params = new URLSearchParams(location.search)
  const shape = (params.get('shape') as ShapeKey) || 'customer-table'
  const Render = SHAPES[shape] || SHAPES['customer-table']
  return (
    <div className="bg-background text-foreground min-h-screen">
      <MockHostHeader themeMode={themeMode} setThemeMode={setThemeMode} />
      <main className="mx-auto max-w-[1100px] p-4">
        <Render />
      </main>
    </div>
  )
}

window.addEventListener('message', (e) => {
  if (e.data && typeof e.data === 'object')
    console.log('[mock-host:postMessage]', e.data)
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
)
