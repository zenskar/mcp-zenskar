import type { InvoiceDetailPayload } from '../types'
import {
  daysBetween,
  Dim,
  fmtDate,
  fmtMoney,
  fmtMoneyObj,
  shortId,
  StatusPill,
} from './format'

export function InvoiceDetail({ payload }: { payload: InvoiceDetailPayload }) {
  const i = payload.invoice
  const cur = i.currency || 'USD'
  const overdueDays =
    i.due_date && i.amount_due && i.amount_due > 0
      ? daysBetween(i.due_date)
      : null
  const isOverdue = overdueDays != null && overdueDays > 0

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="m-0 flex items-center gap-2 text-lg font-semibold">
            <span className="font-mono">{i.invoice_number || i.id}</span>
            {i.status ? <StatusPill status={i.status} /> : null}
            {isOverdue ? (
              <span className="bg-destructive/15 text-destructive ring-destructive/30 rounded-full px-2 py-0.5 text-xs ring-1">
                {overdueDays}d overdue
              </span>
            ) : null}
          </h2>
          <div className="text-muted-foreground mt-0.5 font-mono text-xs">
            {i.id}
          </div>
        </div>
        <div className="flex gap-2">
          {i.invoice_pdf ? (
            <ActionLink href={i.invoice_pdf}>PDF</ActionLink>
          ) : null}
          {i.payment_url ? (
            <ActionLink href={i.payment_url}>Pay link</ActionLink>
          ) : null}
        </div>
      </header>

      <div className="border-border grid grid-cols-2 gap-3 rounded-md border p-3 sm:grid-cols-4">
        <Stat label="Total" value={fmtMoney(i.invoice_total, cur)} />
        <Stat label="Paid" value={fmtMoney(i.paid_amount, cur)} />
        <Stat
          label="Due"
          value={fmtMoney(i.amount_due, cur)}
          tone={isOverdue ? 'warn' : undefined}
        />
        <Stat
          label="Period"
          value={
            i.invoice_period_begin && i.invoice_period_end ? (
              <span className="text-sm">
                {i.invoice_period_begin.slice(0, 10)} →{' '}
                {i.invoice_period_end.slice(0, 10)}
              </span>
            ) : (
              <Dim>—</Dim>
            )
          }
        />
      </div>

      <div className="border-border grid grid-cols-1 gap-3 rounded-md border p-3 sm:grid-cols-2">
        <Field label="Customer">
          {i.customer_name ? (
            <div>
              <div className="text-sm">{i.customer_name}</div>
              {i.customer_id ? (
                <div className="text-muted-foreground font-mono text-[10px]">{shortId(i.customer_id, 12)}</div>
              ) : null}
            </div>
          ) : i.customer_id ? (
            <span className="text-secondary font-mono text-xs">{shortId(i.customer_id, 14)}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Business Entity">
          {i.business_entity_id ? (
            <span className="font-mono text-xs">
              {shortId(i.business_entity_id, 14)}
            </span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Contract">
          {i.contract_name ? (
            <div>
              <div className="text-sm">{i.contract_name}</div>
              {i.contract_id ? (
                <div className="text-muted-foreground font-mono text-[10px]">{shortId(i.contract_id, 12)}</div>
              ) : null}
            </div>
          ) : i.contract_id ? (
            <span className="font-mono text-xs">{shortId(i.contract_id, 14)}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="External ID">
          {i.external_id ? (
            <span className="font-mono text-xs">{i.external_id}</span>
          ) : (
            <Dim>—</Dim>
          )}
        </Field>
        <Field label="Created">{fmtDate(i.created_at)}</Field>
        <Field label="Due Date">{fmtDate(i.due_date)}</Field>
        <Field label="Currency">{cur}</Field>
      </div>

      {i.notes ? (
        <Section title="Notes">
          <div className="text-sm">{i.notes}</div>
        </Section>
      ) : null}

      {(i.approved_at || i.sent_at || i.paid_at) ? (
        <Section title="Timeline">
          <div className="flex flex-wrap gap-4 text-sm">
            {i.sent_at ? (
              <div>
                <span className="text-muted-foreground text-xs">Sent </span>
                <span className="tabular-nums">{fmtDate(i.sent_at)}</span>
              </div>
            ) : null}
            {i.approved_at ? (
              <div>
                <span className="text-muted-foreground text-xs">Approved </span>
                <span className="tabular-nums">{fmtDate(i.approved_at)}</span>
              </div>
            ) : null}
            {i.paid_at ? (
              <div>
                <span className="text-muted-foreground text-xs">Paid </span>
                <span className="tabular-nums">{fmtDate(i.paid_at)}</span>
              </div>
            ) : null}
          </div>
        </Section>
      ) : null}

      {payload.line_items && payload.line_items.length > 0 ? (
        <Section title={`Line Items (${payload.line_items.length})`}>
          <div className="border-border overflow-auto rounded-md border">
            <table className="w-full text-sm">
              <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">
                    Subtotal
                  </th>
                  <th className="px-3 py-2 text-left font-semibold">Period</th>
                </tr>
              </thead>
              <tbody>
                {payload.line_items.map((l, idx) => (
                  <tr key={idx} className="border-border border-t">
                    <td className="px-3 py-2">
                      <div className="font-medium">
                        {l.name || <Dim>—</Dim>}
                      </div>
                      {l.description ? (
                        <div className="text-muted-foreground text-xs">
                          {l.description}
                        </div>
                      ) : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {l.quantity?.display ||
                        (l.quantity?.value ?? <Dim>—</Dim>)}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {l.price ? fmtMoneyObj(l.price) : <Dim>—</Dim>}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">
                      {fmtMoneyObj(l.subtotal)}
                    </td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {l.service_start_date && l.service_end_date ? (
                        <>
                          {fmtDate(l.service_start_date)} →{' '}
                          {fmtDate(l.service_end_date)}
                        </>
                      ) : (
                        <Dim>—</Dim>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Section>
      ) : null}

      {i.custom_data && Object.keys(i.custom_data).length > 0 ? (
        <Section title="Custom Data">
          <div className="grid grid-cols-2 gap-2 text-xs">
            {Object.entries(i.custom_data).map(([k, v]) => (
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

function ActionLink({
  children,
  href,
}: {
  children: React.ReactNode
  href: string
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="border-border bg-accent text-accent-foreground hover:bg-primary hover:text-primary-foreground rounded border px-3 py-1 text-xs transition-colors"
    >
      {children}
    </a>
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

function Stat({
  label,
  value,
  tone,
}: {
  label: string
  value: React.ReactNode
  tone?: 'warn'
}) {
  const cls = tone === 'warn' ? 'text-destructive' : ''
  return (
    <div>
      <div className="text-muted-foreground text-[10px] tracking-wide uppercase">
        {label}
      </div>
      <div className={`text-base font-semibold tabular-nums ${cls}`}>
        {value}
      </div>
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
