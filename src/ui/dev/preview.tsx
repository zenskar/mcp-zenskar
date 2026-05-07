import '../client/theme.css';
import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import { CustomerTable } from '../components/CustomerTable';
import { InvoiceTable } from '../components/InvoiceTable';
import { InvoiceLineItems } from '../components/InvoiceLineItems';
import { PaymentTable } from '../components/PaymentTable';
import { CreditNoteTable } from '../components/CreditNoteTable';
import { ContractTable } from '../components/ContractTable';
import { customerFixture } from '../fixtures/customers';
import { invoiceFixture, lineItemsFixture } from '../fixtures/invoices';
import { paymentFixture } from '../fixtures/payments';
import { creditNoteFixture } from '../fixtures/creditNotes';
import { contractFixture } from '../fixtures/contracts';

const SHAPES = {
  'customer-table': () => <CustomerTable payload={customerFixture} />,
  'invoice-table': () => <InvoiceTable payload={invoiceFixture} />,
  'invoice-line-items': () => <InvoiceLineItems payload={lineItemsFixture} />,
  'payment-table': () => <PaymentTable payload={paymentFixture} />,
  'credit-note-table': () => <CreditNoteTable payload={creditNoteFixture} />,
  'contract-table': () => <ContractTable payload={contractFixture} />,
} as const;

type ShapeKey = keyof typeof SHAPES;

function MockHostHeader() {
  const [width, setWidth] = useState<number>(720);
  return (
    <div style={{ position: 'sticky', top: 0, zIndex: 10, background: '#0f172a', color: '#e2e8f0', padding: '8px 16px', fontSize: 12, display: 'flex', gap: 16, alignItems: 'center' }}>
      <strong>mock host</strong>
      <span>width:</span>
      <input type="range" min={320} max={1200} value={width} onChange={e => setWidth(Number(e.target.value))} />
      <span style={{ width: 48, textAlign: 'right' }}>{width}px</span>
      <ShapeSelect />
      <span style={{ marginLeft: 'auto', opacity: 0.7 }}>postMessage echoes in console</span>
      <iframe title="frame" id="dev-frame" data-width={width} style={{ display: 'none' }} />
    </div>
  );
}

function ShapeSelect() {
  const params = new URLSearchParams(location.search);
  const current = (params.get('shape') as ShapeKey) || 'customer-table';
  return (
    <select
      defaultValue={current}
      onChange={e => { params.set('shape', e.target.value); location.search = params.toString(); }}
      style={{ background: '#1e293b', color: '#e2e8f0', border: '1px solid #334155', padding: '2px 6px', borderRadius: 4 }}
    >
      {Object.keys(SHAPES).map(k => <option key={k} value={k}>{k}</option>)}
    </select>
  );
}

function App() {
  const params = new URLSearchParams(location.search);
  const shape = (params.get('shape') as ShapeKey) || 'customer-table';
  const Render = SHAPES[shape] || SHAPES['customer-table'];
  return (
    <>
      <MockHostHeader />
      <main style={{ maxWidth: 1100, margin: '0 auto' }}>
        <Render />
      </main>
    </>
  );
}

window.addEventListener('message', e => {
  if (e.data && typeof e.data === 'object') console.log('[mock-host:postMessage]', e.data);
});

createRoot(document.getElementById('root')!).render(<StrictMode><App /></StrictMode>);
