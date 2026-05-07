import assert from 'node:assert/strict';
import { existsSync, readFileSync, statSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

process.env.ZENSKAR_MCP_UI_ENABLED = 'true';

import { wrapToolResponse } from '../server/wrap.js';
import { stub, STUB_MAX } from '../server/stub.js';
import { generateBrandStyle, DEFAULT_BRAND } from '../server/brandStyles.js';
import { resourceUriFor, SHAPES } from '../server/registry.js';
import { customerFixture } from '../fixtures/customers';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const ROOT = resolve(__dirname, '..', '..', '..');
const DIST_UI = resolve(ROOT, 'dist', 'ui');

interface UIResult {
  content: Array<{ type: string; text?: string }>;
  structuredContent?: Record<string, unknown>;
}

function assertUIResult(r: UIResult, expectedArrayKey: string) {
  assert.equal(r.content.length, 1, `expected 1 content item, got ${r.content.length}`);
  assert.equal(r.content[0]!.type, 'text');
  const stubText = r.content[0]!.text || '';
  assert(stubText.length <= STUB_MAX, `stub exceeds ${STUB_MAX}: ${stubText.length}`);
  assert(!stubText.includes('|'), `stub looks like markdown table: ${stubText}`);
  assert(!r.content.some(c => c.type === 'resource'), 'inline resource must be absent — Pattern B uses static registerResource');
  assert(r.structuredContent && typeof r.structuredContent === 'object', 'structuredContent must be present and be an object');
  assert(Array.isArray((r.structuredContent as any)[expectedArrayKey]), `structuredContent.${expectedArrayKey} must be an array`);
}

let runs = 0;
let failures = 0;
function check(name: string, fn: () => void) {
  runs++;
  try { fn(); console.log(`  ✓ ${name}`); }
  catch (e) { failures++; console.error(`  ✗ ${name}\n    ${(e as Error).message}`); }
}

console.log('• stub()');
check('stub respects max length', () => {
  const out = stub('customer', 12, 'recently created');
  assert(out.length <= STUB_MAX, `stub too long: ${out.length}`);
  assert(/Rendered 12 customers/.test(out));
});
check('stub plural for 1', () => assert.equal(stub('invoice', 1), 'Rendered 1 invoice.'));
check('stub plural for 0', () => assert.equal(stub('customer', 0), 'Rendered 0 customers.'));
check('stub y -> ies', () => assert(stub('entity', 3).includes('entities')));

console.log('• generateBrandStyle()');
check('inlines all default vars', () => {
  const s = generateBrandStyle({});
  for (const v of ['--brand-primary', '--brand-fg', '--brand-bg', '--brand-border']) {
    assert(s.includes(v), `missing ${v}`);
  }
});
check('contains terracotta primary', () => {
  const s = generateBrandStyle(DEFAULT_BRAND);
  assert(s.toLowerCase().includes('#ed765e'));
});

console.log('• resourceUriFor()');
check('uri shape stable per shape', () => {
  for (const shape of SHAPES) {
    assert.equal(resourceUriFor(shape), `ui://zenskar/${shape}.html`);
  }
});

console.log('• wrapToolResponse() — text-only mode');
{
  const old = process.env.ZENSKAR_MCP_UI_ENABLED;
  process.env.ZENSKAR_MCP_UI_ENABLED = 'false';
  check('disabled flag returns text-only', () => {
    const r = wrapToolResponse('listCustomers', { customers: customerFixture.customers }, 'fallback prose', {});
    assert.equal(r.content.length, 1);
    assert.equal(r.content[0].type, 'text');
    assert.equal(r.content[0].text, 'fallback prose');
    assert(!('structuredContent' in r), 'structuredContent must not be present in text-only mode');
  });
  process.env.ZENSKAR_MCP_UI_ENABLED = old;
}

console.log('• wrapToolResponse() — UI mode (Pattern B: text stub + structuredContent)');
check('listCustomers returns text stub + structuredContent.customers', () => {
  const r = wrapToolResponse('listCustomers', { customers: customerFixture.customers, total: customerFixture.total }, 'long fallback prose', {});
  assertUIResult(r, 'customers');
});

check('listInvoices (real backend envelope) → structuredContent.invoices', () => {
  const raw = {
    next: 'cur_next', previous: null, total_count: 24077,
    results: [
      { id: 'inv1', invoice_number: 'INV-001', customer_id: 'cust-1', status: 'open', invoice_total: 1200, amount_due: 1200, due_date: '2026-04-15', invoice_period: { begin_date: '2026-03-01', end_date_exclusive: '2026-03-31' }, created_at: '2026-04-01' },
      { id: 'inv2', invoice_number: 'INV-002', customer_id: 'cust-2', status: 'paid', invoice_total: 850, amount_due: 0, due_date: '2026-04-30', invoice_period: { begin_date: '2026-04-01', end_date_exclusive: '2026-04-30' }, created_at: '2026-04-01' },
    ],
  };
  const r = wrapToolResponse('listInvoices', raw, 'fallback', {});
  assertUIResult(r, 'invoices');
  assert.equal((r.structuredContent as any).total, 24077);
});

check('listInvoices wrapped responseTemplate envelope handled', () => {
  const raw = {
    template_info: '## Invoice List',
    api_response: { next: null, previous: null, total_count: 1, results: [{ id: 'i', invoice_number: 'X', customer_id: 'c', status: 'draft' }] },
  };
  const r = wrapToolResponse('listInvoices', raw, 'fallback', {});
  assertUIResult(r, 'invoices');
  assert((r.content[0].text || '').includes('1 invoice'), 'stub should reflect 1 invoice');
});

check('listAllPayments → structuredContent.payments', () => {
  const raw = {
    next: 'cur_next', previous: null, total_count: 1843,
    results: [
      { id: 'pay1', external_id: 'STRIPE-PI-1', customer_id: 'cust-1', amount: 1200, currency_code: 'USD', payment_method: 'card', type: 'payment', status: 'paid', created_at: '2026-05-01T10:00:00Z' },
      { id: 'pay2', external_id: 'STRIPE-RE-2', customer_id: 'cust-1', amount: -200, currency_code: 'USD', payment_method: 'card', type: 'refund', status: 'refunded', created_at: '2026-05-02T10:00:00Z' },
    ],
  };
  const r = wrapToolResponse('listAllPayments', raw, 'fallback', {});
  assertUIResult(r, 'payments');
});

check('listCreditNotes → structuredContent.credit_notes', () => {
  const raw = {
    template_info: '## Credit Notes',
    api_response: {
      next: null, previous: null, total_count: 2,
      results: [
        { id: 'cn1', customer_id: 'cust-1', invoice_id: 'inv-1', status: 'issued', amount: 500, currency_code: 'USD', reason: 'Outage credit', created_at: '2026-05-01T08:00:00Z' },
        { id: 'cn2', customer_id: 'cust-2', status: 'in_progress', amount: 1200, currency_code: 'USD', created_at: '2026-05-02T09:00:00Z' },
      ],
    },
  };
  const r = wrapToolResponse('listCreditNotes', raw, 'fallback', { status: 'issued' });
  assertUIResult(r, 'credit_notes');
});

check('listContracts → structuredContent.contracts', () => {
  const raw = {
    next: null, previous: null, total_count: 312,
    results: [
      { id: 'ctr1', name: 'ACME Master', customer_id: 'cust-1', status: 'active', start_date: '2024-11-02', end_date: '2026-11-01', mrr: { amount: 12450, currency: 'USD' }, total_value: { amount: 298800, currency: 'USD' }, created_at: '2024-11-02T08:00:00Z' },
      { id: 'ctr2', name: 'Globex Annual', customer_id: 'cust-2', status: 'active', start_date: '2025-02-19', end_date: '2026-02-19', created_at: '2025-02-19T08:00:00Z' },
    ],
  };
  const r = wrapToolResponse('listContracts', raw, 'fallback', {});
  assertUIResult(r, 'contracts');
});

check('getInvoiceLineItems → structuredContent.lines', () => {
  const raw = {
    lines: [
      { name: 'A', subtotal: { value: 100, unit: 'USD', display: '$100.00' }, quantity: { value: 1, unit: null, display: '1' }, price: null, service_start_date: '2026-05-01', service_end_date: '2026-05-31', is_billed: true, pricing_model: 'flat-fee' },
      { name: 'B', subtotal: { value: 200, unit: 'USD', display: '$200.00' }, quantity: { value: 2, unit: 'unit', display: '2 units' }, price: { value: 100, unit: 'USD/unit' }, service_start_date: '2026-05-01', service_end_date: '2026-05-31', is_billed: true, pricing_model: 'per-unit' },
    ],
    total: 300,
  };
  const r = wrapToolResponse('getInvoiceLineItems', raw, 'fallback', { invoiceId: 'inv1' });
  assertUIResult(r, 'lines');
});

check('text-only tools never get structuredContent', () => {
  const r = wrapToolResponse('getCustomerBalance', { amount: 1234, currency: 'USD' }, 'Customer balance: USD 1,234.00', {});
  assert.equal(r.content.length, 1);
  assert.equal(r.content[0].type, 'text');
  assert(!('structuredContent' in r), 'structuredContent must be absent for text-only tools');
});

check('unmapped tool returns text fallback', () => {
  const r = wrapToolResponse('createInvoice', { id: 'inv_1' }, 'Created invoice inv_1', {});
  assert.equal(r.content.length, 1);
  assert.equal(r.content[0].type, 'text');
  assert(!('structuredContent' in r), 'structuredContent must be absent for unmapped tools');
});

console.log('• Built bundles (Pattern B: static, no placeholders)');
for (const shape of SHAPES) {
  const bundle = resolve(DIST_UI, `${shape}.html`);
  if (!existsSync(bundle)) {
    console.warn(`  ! skipping ${shape}: ${bundle} missing — run 'pnpm run build:ui' first`);
    continue;
  }
  check(`${shape}.html ≤ 600KB`, () => {
    const size = statSync(bundle).size;
    assert(size <= 600 * 1024, `bundle ${size} bytes exceeds 600KB`);
  });
  check(`${shape}.html has no __DATA__ / __BRAND__ placeholder`, () => {
    const html = readFileSync(bundle, 'utf8');
    assert(!html.includes('<!--__BRAND__-->'), 'brand placeholder must be stripped');
    assert(!html.includes('/*__DATA__*/'), 'data placeholder must be stripped');
    assert(!html.includes('window.__DATA__'), 'window.__DATA__ injection must be removed');
  });
  check(`${shape}.html bundles brand vars from Tailwind theme`, () => {
    const html = readFileSync(bundle, 'utf8');
    assert(html.includes('--brand-primary') || html.includes('--color-brand-primary'), 'expected brand CSS var inlined by Tailwind');
    assert(!/<link[^>]+href=["']https?:/i.test(html), 'no external CSS allowed');
  });
}

console.log(`\n${runs - failures}/${runs} passed`);
process.exit(failures === 0 ? 0 : 1);
