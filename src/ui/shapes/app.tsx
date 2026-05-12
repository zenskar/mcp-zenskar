import '../client/theme.css'

import { StrictMode, useEffect, useRef, useState, type ReactNode } from 'react'

import { createRoot } from 'react-dom/client'

import { callHost, notifyHost, onNotification } from '../client/postMessage'
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

const APP_INFO = { name: 'Zenskar', version: '1.0.0' }
const PROTOCOL_VERSION = '2026-01-26'

interface Route {
  fallback: unknown
  marker: string
  render: (data: any) => ReactNode
}

// Tool name → component, fallback, ready marker. Mirrors src/ui/server/registry.js TOOL_TO_SHAPE.
const ROUTES: Record<string, Route> = {
  listCustomers: {
    fallback: { customers: [], total: 0 },
    marker: 'customer-table:mounted',
    render: (d) => <CustomerTable payload={d} />,
  },
  listInvoices: {
    fallback: { invoices: [], total: 0 },
    marker: 'invoice-table:mounted',
    render: (d) => <InvoiceTable payload={d} />,
  },
  getInvoiceLineItems: {
    fallback: { lines: [] },
    marker: 'invoice-line-items:mounted',
    render: (d) => <InvoiceLineItems payload={d} />,
  },
  listAllPayments: {
    fallback: { payments: [], total: 0 },
    marker: 'payment-table:mounted',
    render: (d) => <PaymentTable payload={d} />,
  },
  listCreditNotes: {
    fallback: { credit_notes: [], total: 0 },
    marker: 'credit-note-table:mounted',
    render: (d) => <CreditNoteTable payload={d} />,
  },
  listContracts: {
    fallback: { contracts: [], total: 0 },
    marker: 'contract-table:mounted',
    render: (d) => <ContractTable payload={d} />,
  },
  getCustomerById: {
    fallback: { customer: { id: '' } },
    marker: 'customer-detail:mounted',
    render: (d) => <CustomerDetail payload={d} />,
  },
  getInvoiceById: {
    fallback: { invoice: { id: '' } },
    marker: 'invoice-detail:mounted',
    render: (d) => <InvoiceDetail payload={d} />,
  },
  getContractById: {
    fallback: { contract: { id: '' }, phases: [] },
    marker: 'contract-detail:mounted',
    render: (d) => <ContractDetail payload={d} />,
  },
  getCreditNoteById: {
    fallback: { credit_note: { id: '' } },
    marker: 'credit-note-detail:mounted',
    render: (d) => <CreditNoteDetail payload={d} />,
  },
  listProducts: {
    fallback: { products: [], total: 0 },
    marker: 'product-table:mounted',
    render: (d) => <ProductTable payload={d} />,
  },
  listPlans: {
    fallback: { plans: [], total: 0 },
    marker: 'plan-table:mounted',
    render: (d) => <PlanTable payload={d} />,
  },
  listJournalEntries: {
    fallback: { entries: [], total: 0 },
    marker: 'journal-table:mounted',
    render: (d) => <JournalTable payload={d} />,
  },
  listJobs: {
    fallback: { jobs: [], total: 0 },
    marker: 'job-table:mounted',
    render: (d) => <JobTable payload={d} />,
  },
  listContacts: {
    fallback: { contacts: [], total: 0 },
    marker: 'contact-table:mounted',
    render: (d) => <ContactTable payload={d} />,
  },
  listRawMetrics: {
    fallback: { raw_metrics: [], total: 0 },
    marker: 'raw-metric-table:mounted',
    render: (d) => <RawMetricTable payload={d} />,
  },
  listAggregates: {
    fallback: { aggregates: [], total: 0 },
    marker: 'aggregate-table:mounted',
    render: (d) => <AggregateTable payload={d} />,
  },
  listCustomerAddresses: {
    fallback: { addresses: [] },
    marker: 'address-list:mounted',
    render: (d) => <AddressList payload={d} />,
  },
  listPaymentMethods: {
    fallback: { payment_methods: [] },
    marker: 'payment-method-list:mounted',
    render: (d) => <PaymentMethodList payload={d} />,
  },
  listBusinessEntities: {
    fallback: { entities: [] },
    marker: 'entity-table:mounted',
    render: (d) => <EntityTable payload={d} />,
  },
  getInvoicePreviewHtml: {
    fallback: { html: '' },
    marker: 'invoice-preview:mounted',
    render: (d) => <InvoicePreview payload={d} />,
  },
}

interface OpenAIGlobals {
  toolInput?: { toolName?: string } | null
  toolOutput?: unknown
}

function readOpenAIGlobals(): OpenAIGlobals | null {
  if (typeof window === 'undefined') return null
  return (window as unknown as { openai?: OpenAIGlobals }).openai ?? null
}

function App() {
  const initial = readOpenAIGlobals()
  const [toolName, setToolName] = useState<string | null>(
    initial?.toolInput?.toolName ?? null
  )
  const [data, setData] = useState<unknown>(initial?.toolOutput ?? null)
  const ref = useRef<HTMLDivElement>(null)

  // MCP Apps bridge — Claude Desktop / VS Code / Goose. Hand-rolled JSON-RPC
  // over postMessage; no @modelcontextprotocol/ext-apps dependency.
  useEffect(() => {
    const unsubResult = onNotification(
      'ui/notifications/tool-result',
      (params) => {
        const p = params as { structuredContent?: unknown } | undefined
        if (p && Object.prototype.hasOwnProperty.call(p, 'structuredContent')) {
          setData(p.structuredContent ?? null)
        }
      }
    )
    const unsubContext = onNotification(
      'ui/notifications/host-context-changed',
      (params) => {
        const name = (params as any)?.toolInfo?.tool?.name
        if (typeof name === 'string') setToolName(name)
      }
    )
    callHost('ui/initialize', {
      appCapabilities: {},
      appInfo: APP_INFO,
      protocolVersion: PROTOCOL_VERSION,
    })
      .then((res) => {
        const name = (res as any)?.hostContext?.toolInfo?.tool?.name
        if (typeof name === 'string') setToolName(name)
        notifyHost('ui/notifications/initialized')
      })
      .catch(() => {
        // Host absent (dev preview / no parent frame) — leave fallback in place.
      })
    return () => {
      unsubResult()
      unsubContext()
    }
  }, [])

  // OpenAI bridge — ChatGPT iframe.
  useEffect(() => {
    const handler = (event: any) => {
      const globals = event?.detail?.globals
      if (!globals) return
      if (globals.toolInput?.toolName) setToolName(globals.toolInput.toolName)
      if (Object.prototype.hasOwnProperty.call(globals, 'toolOutput')) {
        setData(globals.toolOutput ?? null)
      }
    }
    window.addEventListener('openai:set_globals', handler, {
      passive: true,
    } as AddEventListenerOptions)
    return () => {
      window.removeEventListener('openai:set_globals', handler)
    }
  }, [])

  // ReadyMarker + size reporting.
  useEffect(() => {
    if (data === null || !toolName) return
    const route = ROUTES[toolName]
    if (route?.marker)
      notifyHost('ui/message', { hidden: true, marker: route.marker })
    if (!ref.current) return
    const post = () => {
      const r = ref.current!.getBoundingClientRect()
      notifyHost('ui/notifications/size-changed', {
        width: Math.round(r.width),
        height: Math.round(r.height),
      })
    }
    post()
    const ro = new ResizeObserver(post)
    ro.observe(ref.current)
    return () => ro.disconnect()
  }, [data, toolName])

  if (!toolName || !ROUTES[toolName]) {
    return (
      <div data-app-loading style={{ visibility: 'hidden', minHeight: 1 }} />
    )
  }
  const route = ROUTES[toolName]
  if (data === null && !initial?.toolOutput) {
    return (
      <div data-app-loading style={{ visibility: 'hidden', minHeight: 1 }} />
    )
  }
  const resolved = data ?? route.fallback

  return (
    <div
      ref={ref}
      className="text-foreground bg-background p-4 font-sans text-[14px]"
    >
      {route.render(resolved)}
    </div>
  )
}

const el = document.getElementById('root')
if (el) {
  createRoot(el).render(
    <StrictMode>
      <App />
    </StrictMode>
  )
}
