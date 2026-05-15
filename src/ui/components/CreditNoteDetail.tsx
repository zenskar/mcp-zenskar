import type { CreditNoteDetailPayload } from '../types'
import { Field, Section, Stat } from './DetailScaffold'
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
            <span className="font-mono">{cn.credit_note_number || cn.id}</span>
            {cn.status ? <StatusPill status={cn.status} /> : null}
          </h2>
          <div className="text-muted-foreground mt-0.5 font-mono text-xs">
            {cn.id}
          </div>
        </div>
      </header>

      <div className="border-border grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-4">
        <Stat
          label="Amount"
          value={cn.amount != null ? fmtMoney(cn.amount, cur) : <Dim>—</Dim>}
        />
        <Stat label="Currency" value={cur} />
        <Stat
          label="Credits Returned"
          value={
            cn.credits_returned != null ? (
              cn.credits_returned.toLocaleString()
            ) : (
              <Dim>—</Dim>
            )
          }
        />
        <Stat label="Created" value={fmtDate(cn.created_at)} />
      </div>

      <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
        <Field label="Customer">
          {cn.customer_name ? (
            <div>
              <div className="text-sm">{cn.customer_name}</div>
              {cn.customer_id ? (
                <div className="text-muted-foreground font-mono text-[11px]">
                  {shortId(cn.customer_id, 12)}
                </div>
              ) : null}
            </div>
          ) : cn.customer_id ? (
            <span className="text-secondary font-mono text-xs">
              {shortId(cn.customer_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Invoice">
          {cn.invoice_number ? (
            <div>
              <div className="font-mono text-sm">{cn.invoice_number}</div>
              {cn.invoice_id ? (
                <div className="text-muted-foreground font-mono text-[11px]">
                  {shortId(cn.invoice_id, 12)}
                </div>
              ) : null}
            </div>
          ) : cn.invoice_id ? (
            <span className="text-secondary font-mono text-xs">
              {shortId(cn.invoice_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Repayment Method">
          {cn.repayment_method || <Dim>—</Dim>}
        </Field>
      </div>

      {cn.custom_data && Object.keys(cn.custom_data).length > 0 ? (
        <Section title="Custom Data">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(cn.custom_data).map(([k, v]) => (
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
