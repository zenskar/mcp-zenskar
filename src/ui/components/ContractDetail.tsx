import { callHost, notifyHost } from '../client/postMessage'
import type { ContractDetailPayload, ContractPhase } from '../types'
import { Dim, fmtDate, shortId, StatusPill } from './format'

export function ContractDetail({
  payload,
}: {
  payload: ContractDetailPayload
}) {
  const c = payload.contract
  const phases = payload.phases || []
  const today = new Date()

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold">
            {c.name || <Dim>—</Dim>}
            {c.status ? <StatusPill status={c.status} /> : null}
          </h2>
          <div className="text-muted-foreground mt-0.5 font-mono text-xs">
            {c.id}
          </div>
        </div>
        <div className="flex gap-2">
          {c.contract_link ? (
            <a
              href={c.contract_link}
              target="_blank"
              rel="noreferrer"
              className="border-border bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground rounded border px-3 py-1 text-xs transition-colors"
            >
              Open
            </a>
          ) : null}
          <ActionButton
            onClick={() =>
              fireTool('getContractAmendments', { contractId: c.id })
            }
          >
            Amendments
          </ActionButton>
          <ActionButton
            onClick={() =>
              fireTool('listInvoices', {
                customer_id: c.customer_id,
                contract_id: c.id,
              })
            }
          >
            Invoices
          </ActionButton>
        </div>
      </header>

      <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
        <Field label="Customer">
          {c.customer_name ? (
            <div>
              <div className="text-sm">{c.customer_name}</div>
              {c.customer_id ? (
                <div className="text-muted-foreground font-mono text-[10px]">{shortId(c.customer_id, 12)}</div>
              ) : null}
            </div>
          ) : c.customer_id ? (
            <span className="text-secondary font-mono text-xs">{shortId(c.customer_id, 14)}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Currency">
          {c.currency ? (
            <span className="font-mono text-xs">{c.currency}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Type">{c.contract_type || <Dim>—</Dim>}</Field>
        <Field label="Term">
          {c.start_date && c.end_date ? (
            <span className="text-sm">
              {c.start_date.slice(0, 10)} → {c.end_date.slice(0, 10)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Anchor Date">{fmtDate(c.anchor_date)}</Field>
        <Field label="Renewal Policy">{c.renewal_policy || <Dim>—</Dim>}</Field>
        <Field label="Plan">
          {c.plan_id ? (
            <span className="font-mono text-xs">{shortId(c.plan_id, 14)}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Created">{fmtDate(c.created_at)}</Field>
      </div>

      {c.description ? (
        <Section title="Description">
          <div className="text-sm">{c.description}</div>
        </Section>
      ) : null}

      {c.tags && c.tags.length > 0 ? (
        <Section title="Tags">
          <div className="flex flex-wrap gap-2">
            {c.tags.map((tag, i) => (
              <span key={i} className="bg-muted text-muted-foreground rounded-full px-2 py-0.5 text-xs">{tag}</span>
            ))}
          </div>
        </Section>
      ) : null}

      {phases.length > 0 ? (
        <Section title={`Phases (${phases.length})`}>
          <div className="space-y-2">
            {phases.map((ph, i) => (
              <PhaseRow key={ph.id || i} phase={ph} index={i} today={today} />
            ))}
          </div>
        </Section>
      ) : null}

      {c.custom_attributes && Object.keys(c.custom_attributes).length > 0 ? (
        <Section title="Custom Attributes">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(c.custom_attributes).map(([k, v]) => (
              <div key={k} className="border-border rounded border px-2 py-1">
                <div className="text-muted-foreground">{k}</div>
                <div className="font-mono">
                  {typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}
                </div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  )
}

function PhaseRow({
  phase,
  index,
  today,
}: {
  phase: ContractPhase
  index: number
  today: Date
}) {
  const start = phase.start_date ? new Date(phase.start_date) : null
  const end = phase.end_date ? new Date(phase.end_date) : null
  const isCurrent = start && end && start <= today && today <= end
  const ringCls = isCurrent ? 'ring-2 ring-ring' : ''
  return (
    <div className={`border-border rounded-md border p-3 ${ringCls}`}>
      <div className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">
          <span className="text-muted-foreground mr-2">#{index + 1}</span>
          {phase.name || <Dim>Untitled phase</Dim>}
          {isCurrent ? (
            <span className="bg-secondary/15 text-secondary ring-secondary/30 ml-2 rounded-full px-2 py-0.5 text-xs ring-1">
              current
            </span>
          ) : null}
        </div>
        <div className="text-muted-foreground text-xs whitespace-nowrap">
          {phase.start_date ? phase.start_date.slice(0, 10) : '—'} →{' '}
          {phase.end_date ? phase.end_date.slice(0, 10) : '—'}
        </div>
      </div>
      <div className="mt-1 grid grid-cols-2 gap-2 text-xs sm:grid-cols-3">
        <div>
          <span className="text-muted-foreground">Products:</span>{' '}
          <span className="tabular-nums">{phase.product_count ?? '—'}</span>
        </div>
        {phase.pricing_summary ? (
          <div className="text-muted-foreground col-span-full sm:col-span-2">
            {phase.pricing_summary}
          </div>
        ) : null}
      </div>
    </div>
  )
}

function fireTool(name: string, args: Record<string, unknown>) {
  callHost('tools/call', { name, arguments: args }).catch(() =>
    notifyHost('ui/message', { text: `Run: ${name} ${JSON.stringify(args)}` })
  )
}

function ActionButton({
  children,
  onClick,
}: {
  children: React.ReactNode
  onClick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="border-border bg-background hover:bg-accent hover:text-accent-foreground rounded border px-3 py-1 text-xs transition-colors"
    >
      {children}
    </button>
  )
}

function Field({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div className="text-sm">{children}</div>
    </div>
  )
}

function Section({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-1">
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {title}
      </div>
      {children}
    </section>
  )
}
