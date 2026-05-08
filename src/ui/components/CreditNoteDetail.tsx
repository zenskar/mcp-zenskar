import { callHost, notifyHost } from '../client/postMessage'
import type { CreditNoteDetailPayload } from '../types'
import { Dim, fmtDate, fmtMoney, shortId, StatusPill } from './format'

export function CreditNoteDetail({
  payload,
}: {
  payload: CreditNoteDetailPayload
}) {
  const cn = payload.credit_note
  const cur = cn.currency || 'USD'

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold">
            <span className="font-mono">{cn.external_id || cn.id}</span>
            {cn.status ? <StatusPill status={cn.status} /> : null}
          </h2>
          <div className="text-muted-foreground mt-0.5 font-mono text-xs">
            {cn.id}
          </div>
        </div>
        <div className="flex gap-2">
          {cn.invoice_id ? (
            <ActionButton
              onClick={() =>
                fireTool('getInvoiceById', { invoiceId: cn.invoice_id })
              }
            >
              Open invoice
            </ActionButton>
          ) : null}
          {cn.customer_id ? (
            <ActionButton
              onClick={() =>
                fireTool('getCustomerById', { customerId: cn.customer_id })
              }
            >
              Customer
            </ActionButton>
          ) : null}
        </div>
      </header>

      <div className="border-border grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-4">
        <Stat
          label="Amount"
          value={cn.amount != null ? fmtMoney(cn.amount, cur) : <Dim>—</Dim>}
        />
        <Stat label="Currency" value={cur} />
        <Stat label="Issue Date" value={fmtDate(cn.issue_date)} />
        <Stat label="Created" value={fmtDate(cn.created_at)} />
      </div>

      <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
        <Field label="Customer">
          {cn.customer_id ? (
            <span className="text-secondary font-mono text-xs">
              {shortId(cn.customer_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Invoice">
          {cn.invoice_id ? (
            <span className="text-secondary font-mono text-xs">
              {shortId(cn.invoice_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Business Entity">
          {cn.business_entity_id ? (
            <span className="font-mono text-xs">
              {shortId(cn.business_entity_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="External ID">
          {cn.external_id ? (
            <span className="font-mono text-xs">{cn.external_id}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
      </div>

      {cn.reason ? (
        <Section title="Reason">
          <div className="text-sm">{cn.reason}</div>
        </Section>
      ) : null}
      {cn.notes ? (
        <Section title="Notes">
          <div className="text-sm">{cn.notes}</div>
        </Section>
      ) : null}
      {cn.line_items_url ? (
        <Section title="Line Items">
          <a
            href={cn.line_items_url}
            target="_blank"
            rel="noreferrer"
            className="text-secondary text-xs break-all underline"
          >
            {cn.line_items_url}
          </a>
        </Section>
      ) : null}
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

function Stat({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div className="text-base font-semibold tabular-nums">{value}</div>
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
