import '../client/theme.css'

import { StrictMode, useState } from 'react'

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
} as const

type ShapeKey = keyof typeof SHAPES

function MockHostHeader() {
  const [width, setWidth] = useState<number>(720)
  return (
    <div
      style={{
        position: 'sticky',
        top: 0,
        zIndex: 10,
        background: '#0f172a',
        color: '#e2e8f0',
        padding: '8px 16px',
        fontSize: 12,
        display: 'flex',
        gap: 16,
        alignItems: 'center',
      }}
    >
      <strong>mock host</strong>
      <span>width:</span>
      <input
        type="range"
        min={320}
        max={1200}
        value={width}
        onChange={(e) => setWidth(Number(e.target.value))}
      />
      <span style={{ width: 48, textAlign: 'right' }}>{width}px</span>
      <ShapeSelect />
      <span style={{ marginLeft: 'auto', opacity: 0.7 }}>
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
        params.set('shape', e.target.value)
        location.search = params.toString()
      }}
      style={{
        background: '#1e293b',
        color: '#e2e8f0',
        border: '1px solid #334155',
        padding: '2px 6px',
        borderRadius: 4,
      }}
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
  const params = new URLSearchParams(location.search)
  const shape = (params.get('shape') as ShapeKey) || 'customer-table'
  const Render = SHAPES[shape] || SHAPES['customer-table']
  return (
    <>
      <MockHostHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Render />
      </main>
    </>
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
