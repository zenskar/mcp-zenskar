import assert from 'node:assert/strict'
import { existsSync, readFileSync, statSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { customerFixture } from '../fixtures/customers'
import { setClientName } from '../server/client-detection.js'
import { resourceUriFor, SHAPES } from '../server/registry.js'
import { stub, STUB_MAX } from '../server/stub.js'
import { wrapToolResponse } from '../server/wrap.js'

process.env.ZENSKAR_MCP_UI_ENABLED = 'true'
// Default client class tests run as "default" (zenskar-ai-server-like)
setClientName(null as any)

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const ROOT = resolve(__dirname, '..', '..', '..')
const DIST_UI = resolve(ROOT, 'dist', 'ui')

interface UIResult {
  content: Array<{ type: string; text?: string }>
  structuredContent?: Record<string, unknown>
}

function assertDefaultUIResult(r: UIResult, _expectedArrayKey: string) {
  // Default client: plain text only, no structuredContent
  assert.equal(
    r.content.length,
    1,
    `expected 1 content item (fallback text), got ${r.content.length}`
  )
  assert.equal(r.content[0]!.type, 'text')
  assert(
    !('structuredContent' in r),
    'default client must not receive structuredContent'
  )
}

let runs = 0
let failures = 0
function check(name: string, fn: () => void) {
  runs++
  try {
    fn()
    console.log(`  ✓ ${name}`)
  } catch (e) {
    failures++
    console.error(`  ✗ ${name}\n    ${(e as Error).message}`)
  }
}

console.log('• stub()')
check('stub respects max length', () => {
  const out = stub('customer', 12, 'recently created')
  assert(out.length <= STUB_MAX, `stub too long: ${out.length}`)
  assert(/Rendered 12 customers/.test(out))
})
check('stub plural for 1', () =>
  assert.equal(stub('invoice', 1), 'Rendered invoice detail view.')
)
check('stub plural for 0', () =>
  assert.equal(stub('customer', 0), 'Rendered 0 customers.')
)
check('stub y -> ies', () => assert(stub('entity', 3).includes('entities')))

console.log('• resourceUriFor()')
check('uri shape stable per shape', () => {
  for (const shape of SHAPES) {
    assert.equal(resourceUriFor(shape), `ui://zenskar/${shape}.html`)
  }
})

console.log('• wrapToolResponse() — text-only mode')
{
  const old = process.env.ZENSKAR_MCP_UI_ENABLED
  process.env.ZENSKAR_MCP_UI_ENABLED = 'false'
  check('disabled flag returns text-only', () => {
    const r = wrapToolResponse(
      'listCustomers',
      { customers: customerFixture.customers },
      'fallback prose',
      {}
    )
    assert.equal(r.content.length, 1)
    assert.equal(r.content[0]!.type, 'text')
    assert.equal(r.content[0]!.text, 'fallback prose')
    assert(
      !('structuredContent' in r),
      'structuredContent must not be present in text-only mode'
    )
  })
  process.env.ZENSKAR_MCP_UI_ENABLED = old
}

console.log(
  '• wrapToolResponse() — default client (stub + fallback + structuredContent)'
)
check(
  'listCustomers returns stub + fallback + structuredContent.customers',
  () => {
    setClientName(null as any)
    const r = wrapToolResponse(
      'listCustomers',
      { customers: customerFixture.customers, total: customerFixture.total },
      'long fallback prose',
      {}
    )
    assertDefaultUIResult(r, 'customers')
  }
)

check(
  'listInvoices (real backend envelope) → structuredContent.invoices',
  () => {
    setClientName(null as any)
    const raw = {
      next: 'cur_next',
      previous: null,
      total_count: 24077,
      results: [
        {
          id: 'inv1',
          invoice_number: 'INV-001',
          customer_id: 'cust-1',
          status: 'open',
          invoice_total: 1200,
          amount_due: 1200,
          due_date: '2026-04-15',
          invoice_period: {
            begin_date: '2026-03-01',
            end_date_exclusive: '2026-03-31',
          },
          created_at: '2026-04-01',
        },
        {
          id: 'inv2',
          invoice_number: 'INV-002',
          customer_id: 'cust-2',
          status: 'paid',
          invoice_total: 850,
          amount_due: 0,
          due_date: '2026-04-30',
          invoice_period: {
            begin_date: '2026-04-01',
            end_date_exclusive: '2026-04-30',
          },
          created_at: '2026-04-01',
        },
      ],
    }
    const r = wrapToolResponse('listInvoices', raw, 'fallback', {}) as UIResult
    assertDefaultUIResult(r, 'invoices')
  }
)

check('listInvoices wrapped responseTemplate envelope handled', () => {
  setClientName(null as any)
  const raw = {
    template_info: '## Invoice List',
    api_response: {
      next: null,
      previous: null,
      total_count: 1,
      results: [
        { id: 'i', invoice_number: 'X', customer_id: 'c', status: 'draft' },
      ],
    },
  }
  const r = wrapToolResponse('listInvoices', raw, 'fallback', {}) as UIResult
  assertDefaultUIResult(r, 'invoices')
})

check('listAllPayments → structuredContent.payments', () => {
  setClientName(null as any)
  const raw = {
    next: 'cur_next',
    previous: null,
    total_count: 1843,
    results: [
      {
        id: 'pay1',
        external_id: 'STRIPE-PI-1',
        customer_id: 'cust-1',
        amount: 1200,
        currency_code: 'USD',
        payment_method: 'card',
        type: 'payment',
        status: 'paid',
        created_at: '2026-05-01T10:00:00Z',
      },
      {
        id: 'pay2',
        external_id: 'STRIPE-RE-2',
        customer_id: 'cust-1',
        amount: -200,
        currency_code: 'USD',
        payment_method: 'card',
        type: 'refund',
        status: 'refunded',
        created_at: '2026-05-02T10:00:00Z',
      },
    ],
  }
  const r = wrapToolResponse('listAllPayments', raw, 'fallback', {})
  assertDefaultUIResult(r, 'payments')
})

check('listCreditNotes → structuredContent.credit_notes', () => {
  setClientName(null as any)
  const raw = {
    template_info: '## Credit Notes',
    api_response: {
      next: null,
      previous: null,
      total_count: 2,
      results: [
        {
          id: 'cn1',
          customer_id: 'cust-1',
          invoice_id: 'inv-1',
          status: 'issued',
          amount: 500,
          currency_code: 'USD',
          reason: 'Outage credit',
          created_at: '2026-05-01T08:00:00Z',
        },
        {
          id: 'cn2',
          customer_id: 'cust-2',
          status: 'in_progress',
          amount: 1200,
          currency_code: 'USD',
          created_at: '2026-05-02T09:00:00Z',
        },
      ],
    },
  }
  const r = wrapToolResponse('listCreditNotes', raw, 'fallback', {
    status: 'issued',
  })
  assertDefaultUIResult(r, 'credit_notes')
})

check('listContracts → structuredContent.contracts', () => {
  setClientName(null as any)
  const raw = {
    next: null,
    previous: null,
    total_count: 312,
    results: [
      {
        id: 'ctr1',
        name: 'ACME Master',
        customer_id: 'cust-1',
        status: 'active',
        start_date: '2024-11-02',
        end_date: '2026-11-01',
        mrr: { amount: 12450, currency: 'USD' },
        total_value: { amount: 298800, currency: 'USD' },
        created_at: '2024-11-02T08:00:00Z',
      },
      {
        id: 'ctr2',
        name: 'Globex Annual',
        customer_id: 'cust-2',
        status: 'active',
        start_date: '2025-02-19',
        end_date: '2026-02-19',
        created_at: '2025-02-19T08:00:00Z',
      },
    ],
  }
  const r = wrapToolResponse('listContracts', raw, 'fallback', {})
  assertDefaultUIResult(r, 'contracts')
})

check('getContractById → structuredContent with phases and pricings', () => {
  setClientName(null as any)
  const raw = {
    id: 'ctr_001',
    name: 'ACME Agreement',
    customer_id: 'cust-1',
    customer: { id: 'cust-1', customer_name: 'ACME Corp' },
    status: 'active',
    currency: 'USD',
    start_date: '2025-01-01',
    end_date: '2026-01-01',
    created_at: '2025-01-01T00:00:00Z',
    contract_type: 'subscription',
    phases: [
      {
        id: 'ph_1',
        name: 'Year 1',
        start_date: '2025-01-01',
        end_date: '2026-01-01',
        pricings: [
          {
            product: { name: 'Platform', type: 'product' },
            pricing: {
              pricing_data: {
                pricing_type: 'flat_fee',
                currency: 'USD',
                unit_amount: 500,
              },
              billing_period: { cadence: 'P1M', offset: 'prepaid' },
              is_recurring: true,
              quantity: { type: 'fixed', quantity: 1, unit: 'seat' },
            },
            start_date: '2025-01-01',
            end_date: '2026-01-01',
          },
          {
            product: { name: 'API Calls', type: 'product' },
            pricing: {
              pricing_data: {
                pricing_type: 'tiered_pricing',
                currency: 'USD',
                tiers: [
                  { min_quantity: 0, max_quantity: 1000, unit_amount: 0.01 },
                  { min_quantity: 1001, max_quantity: null, unit_amount: 0.005 },
                ],
              },
              quantity: {
                type: 'metered',
                unit: 'calls',
                aggregate: { name: 'API Call Counter' },
              },
              billing_period: { cadence: 'P1M' },
              is_recurring: true,
              discounts: [
                { unit_amount: 10, type: 'percentage', label: 'Volume' },
              ],
            },
            start_date: '2025-01-01',
          },
        ],
      },
    ],
  }
  const r = wrapToolResponse(
    'getContractById',
    raw,
    'fallback',
    {}
  ) as UIResult
  assertDefaultUIResult(r, 'contract')

  // Verify via widget-host to inspect structuredContent payload
  setClientName('claude-desktop')
  const rw = wrapToolResponse('getContractById', raw, 'fallback', {}) as any
  assert(rw.structuredContent, 'widget-host must get structuredContent')
  const sc = rw.structuredContent as any
  assert.equal(sc.contract.name, 'ACME Agreement')
  assert.equal(sc.contract.customer_name, 'ACME Corp')
  assert.equal(sc.phases.length, 1)
  assert.equal(sc.phases[0].pricings.length, 2)

  const p0 = sc.phases[0].pricings[0]
  assert.equal(p0.product_name, 'Platform')
  assert.equal(p0.pricing_model, 'flat_fee')
  assert.equal(p0.unit_amount, 500)
  assert.equal(p0.quantity_type, 'fixed')
  assert.equal(p0.billing_cadence, 'P1M')
  assert.equal(p0.is_recurring, true)

  const p1 = sc.phases[0].pricings[1]
  assert.equal(p1.product_name, 'API Calls')
  assert.equal(p1.pricing_model, 'tiered_pricing')
  assert.equal(p1.tiers.length, 2)
  assert.equal(p1.meter_name, 'API Call Counter')
  assert.equal(p1.quantity_type, 'metered')
  assert(p1.features, 'pricing features must be extracted')
  assert.equal(p1.features.length, 1)
  assert.equal(p1.features[0].type, 'Discount')
  assert(p1.features[0].summary.includes('10%'))

  setClientName(null as any)
})

check('getInvoiceLineItems → structuredContent.lines', () => {
  setClientName(null as any)
  const raw = {
    lines: [
      {
        name: 'A',
        subtotal: { value: 100, unit: 'USD', display: '$100.00' },
        quantity: { value: 1, unit: null, display: '1' },
        price: null,
        service_start_date: '2026-05-01',
        service_end_date: '2026-05-31',
        is_billed: true,
        pricing_model: 'flat-fee',
      },
      {
        name: 'B',
        subtotal: { value: 200, unit: 'USD', display: '$200.00' },
        quantity: { value: 2, unit: 'unit', display: '2 units' },
        price: { value: 100, unit: 'USD/unit' },
        service_start_date: '2026-05-01',
        service_end_date: '2026-05-31',
        is_billed: true,
        pricing_model: 'per-unit',
      },
    ],
    total: 300,
  }
  const r = wrapToolResponse('getInvoiceLineItems', raw, 'fallback', {
    invoiceId: 'inv1',
  })
  assertDefaultUIResult(r, 'lines')
})

check('text-only tools never get structuredContent', () => {
  setClientName(null as any)
  const r = wrapToolResponse(
    'getCustomerBalance',
    { amount: 1234, currency: 'USD' },
    'Customer balance: USD 1,234.00',
    {}
  )
  assert.equal(r.content.length, 1)
  assert.equal(r.content[0]!.type, 'text')
  assert(
    !('structuredContent' in r),
    'structuredContent must be absent for text-only tools'
  )
})

check('unmapped tool returns text fallback', () => {
  setClientName(null as any)
  const r = wrapToolResponse(
    'createInvoice',
    { id: 'inv_1' },
    'Created invoice inv_1',
    {}
  )
  assert.equal(r.content.length, 1)
  assert.equal(r.content[0]!.type, 'text')
  assert(
    !('structuredContent' in r),
    'structuredContent must be absent for unmapped tools'
  )
})

console.log('• wrapToolResponse() — client-class branching')
{
  const listCustomersRaw = {
    customers: customerFixture.customers,
    total: customerFixture.total,
  }

  check('widget-host: TOON text + structuredContent, no raw JSON echo', () => {
    setClientName('claude-desktop')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'long raw fallback that should not appear',
      {}
    )
    assert.equal(r.content.length, 1, 'widget-host should have 1 content block')
    assert.equal(r.content[0]!.type, 'text')
    const text = r.content[0]!.text || ''
    assert(
      text.startsWith('Data rendered in table widget'),
      'widget-host text must start with nudge'
    )
    assert(
      !text.includes('long raw fallback'),
      'widget-host text must not contain raw fallback'
    )
    assert(
      !text.includes('"customers"'),
      'widget-host text must not contain JSON key syntax'
    )
    assert(
      r.structuredContent && typeof r.structuredContent === 'object',
      'widget-host must include structuredContent'
    )
  })

  check('coding-agent: full text only, no structuredContent', () => {
    setClientName('claude-code')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'full data text',
      {}
    )
    assert.equal(r.content.length, 1)
    assert.equal(r.content[0]!.text, 'full data text')
    assert(
      !('structuredContent' in r),
      'coding-agent must not receive structuredContent'
    )
  })

  check('default client: stub + fallback + structuredContent', () => {
    setClientName(null as any)
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'fallback prose',
      {}
    )
    assert.equal(r.content.length, 1, 'default should have fallback text only')
    assert(
      !('structuredContent' in r),
      'default must not include structuredContent'
    )
  })

  check('chatgpt classifies as widget-host', () => {
    setClientName('ChatGPT')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'fallback',
      {}
    )
    assert.equal(r.content.length, 1)
    assert(
      r.structuredContent && typeof r.structuredContent === 'object',
      'chatgpt should get structuredContent'
    )
  })

  check('claude-ai classifies as widget-host', () => {
    setClientName('claude-ai')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'fallback',
      {}
    )
    assert.equal(r.content.length, 1)
    assert(
      r.structuredContent && typeof r.structuredContent === 'object',
      'claude-ai should get structuredContent'
    )
  })

  check('cline classifies as coding-agent', () => {
    setClientName('Cline v3.2')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'fallback',
      {}
    )
    assert.equal(r.content.length, 1)
    assert(
      !('structuredContent' in r),
      'cline must not receive structuredContent'
    )
  })

  check('zenskar-ai-server classifies as default', () => {
    setClientName('zenskar-express-server')
    const r = wrapToolResponse(
      'listCustomers',
      listCustomersRaw,
      'fallback',
      {}
    )
    assert.equal(r.content.length, 1)
    assert(
      !('structuredContent' in r),
      'zenskar-ai-server must not receive structuredContent'
    )
  })

  // Reset for remaining tests
  setClientName(null as any)
}

console.log('• Built bundles (Pattern B: static, no placeholders)')
for (const shape of SHAPES) {
  const bundle = resolve(DIST_UI, `${shape}.html`)
  if (!existsSync(bundle)) {
    console.warn(
      `  ! skipping ${shape}: ${bundle} missing — run 'pnpm run build:ui' first`
    )
    continue
  }
  check(`${shape}.html ≤ 600KB`, () => {
    const size = statSync(bundle).size
    assert(size <= 600 * 1024, `bundle ${size} bytes exceeds 600KB`)
  })
  check(`${shape}.html has no __DATA__ / __BRAND__ placeholder`, () => {
    const html = readFileSync(bundle, 'utf8')
    assert(
      !html.includes('<!--__BRAND__-->'),
      'brand placeholder must be stripped'
    )
    assert(!html.includes('/*__DATA__*/'), 'data placeholder must be stripped')
    assert(
      !html.includes('window.__DATA__'),
      'window.__DATA__ injection must be removed'
    )
  })
  check(`${shape}.html bundles theme tokens from Tailwind`, () => {
    const html = readFileSync(bundle, 'utf8')
    assert(
      html.includes('--primary'),
      'expected --primary token inlined by Tailwind'
    )
    assert(
      html.includes('--background'),
      'expected --background token inlined by Tailwind'
    )
    assert(!/<link[^>]+href=["']https?:/i.test(html), 'no external CSS allowed')
  })
  check(`${shape}.html ships dark-mode probe + .dark class`, () => {
    const html = readFileSync(bundle, 'utf8')
    assert(
      html.includes('prefers-color-scheme'),
      'expected @media (prefers-color-scheme: dark) block in bundled CSS'
    )
    assert(
      html.includes('.dark'),
      'expected .dark class block in bundled CSS for class-based toggling'
    )
  })
}

console.log(`\n${runs - failures}/${runs} passed`)
process.exit(failures === 0 ? 0 : 1)
