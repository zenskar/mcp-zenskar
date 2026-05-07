import { callHost, notifyHost } from '../client/postMessage';
import type { InvoiceDetailPayload } from '../types';
import { Dim, StatusPill, fmtDate, fmtMoney, fmtMoneyObj, shortId, daysBetween } from './format';

export function InvoiceDetail({ payload }: { payload: InvoiceDetailPayload }) {
  const i = payload.invoice;
  const cur = i.currency || 'USD';
  const overdueDays = i.due_date && i.amount_due && i.amount_due > 0 ? daysBetween(i.due_date) : null;
  const isOverdue = overdueDays != null && overdueDays > 0;

  return (
    <div className="space-y-4">
      <header className="flex items-start justify-between gap-3">
        <div>
          <h2 className="text-lg font-semibold m-0 flex items-center gap-2">
            <span className="font-mono">{i.invoice_number || i.id}</span>
            {i.status ? <StatusPill status={i.status} /> : null}
            {isOverdue ? <span className="px-2 py-0.5 rounded-full text-xs bg-red-100 text-red-800">{overdueDays}d overdue</span> : null}
          </h2>
          <div className="text-xs text-muted font-mono mt-0.5">{i.id}</div>
        </div>
        <div className="flex gap-2">
          {i.payment_url ? <ActionLink href={i.payment_url}>Pay link</ActionLink> : null}
          <ActionButton onClick={() => fireTool('getInvoiceLineItems', { invoiceId: i.id })}>Line items</ActionButton>
          <ActionButton onClick={() => fireTool('getInvoicePayments', { invoiceId: i.id })}>Payments</ActionButton>
        </div>
      </header>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 rounded-md border border-border p-3">
        <Stat label="Total" value={fmtMoney(i.invoice_total, cur)} />
        <Stat label="Paid" value={fmtMoney(i.paid_amount, cur)} />
        <Stat label="Due" value={fmtMoney(i.amount_due, cur)} tone={isOverdue ? 'warn' : undefined} />
        <Stat label="Period" value={i.invoice_period_begin && i.invoice_period_end
          ? <span className="text-sm">{i.invoice_period_begin.slice(0, 10)} → {i.invoice_period_end.slice(0, 10)}</span>
          : <Dim>—</Dim>} />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 rounded-md border border-border p-3">
        <Field label="Customer">{i.customer_id ? <span className="font-mono text-xs text-[var(--brand-link)]">{shortId(i.customer_id, 14)}</span> : <Dim>—</Dim>}</Field>
        <Field label="Business Entity">{i.business_entity_id ? <span className="font-mono text-xs">{shortId(i.business_entity_id, 14)}</span> : <Dim>—</Dim>}</Field>
        <Field label="External ID">{i.external_id ? <span className="font-mono text-xs">{i.external_id}</span> : <Dim>—</Dim>}</Field>
        <Field label="Created">{fmtDate(i.created_at)}</Field>
        <Field label="Due Date">{fmtDate(i.due_date)}</Field>
        <Field label="Currency">{cur}</Field>
      </div>

      {i.notes ? <Section title="Notes"><div className="text-sm">{i.notes}</div></Section> : null}

      {payload.line_items && payload.line_items.length > 0 ? (
        <Section title={`Line Items (${payload.line_items.length})`}>
          <div className="overflow-auto rounded-md border border-border">
            <table className="w-full text-sm">
              <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
                <tr>
                  <th className="px-3 py-2 text-left font-semibold">Item</th>
                  <th className="px-3 py-2 text-right font-semibold">Qty</th>
                  <th className="px-3 py-2 text-right font-semibold">Price</th>
                  <th className="px-3 py-2 text-right font-semibold">Subtotal</th>
                  <th className="px-3 py-2 text-left font-semibold">Period</th>
                </tr>
              </thead>
              <tbody>
                {payload.line_items.map((l, idx) => (
                  <tr key={idx} className="border-t border-border">
                    <td className="px-3 py-2">
                      <div className="font-medium">{l.name || <Dim>—</Dim>}</div>
                      {l.description ? <div className="text-xs text-muted">{l.description}</div> : null}
                    </td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.quantity?.display || (l.quantity?.value ?? <Dim>—</Dim>)}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{l.price ? fmtMoneyObj(l.price) : <Dim>—</Dim>}</td>
                    <td className="px-3 py-2 text-right tabular-nums">{fmtMoneyObj(l.subtotal)}</td>
                    <td className="px-3 py-2 text-xs whitespace-nowrap">
                      {l.service_start_date && l.service_end_date
                        ? <>{fmtDate(l.service_start_date)} → {fmtDate(l.service_end_date)}</>
                        : <Dim>—</Dim>}
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
              <div key={k} className="border border-border rounded px-2 py-1">
                <div className="text-muted">{k}</div>
                <div className="font-mono">{typeof v === 'object' ? JSON.stringify(v) : String(v ?? '')}</div>
              </div>
            ))}
          </div>
        </Section>
      ) : null}
    </div>
  );
}

function fireTool(name: string, args: Record<string, unknown>) {
  callHost('tools/call', { name, arguments: args })
    .catch(() => notifyHost('ui/message', { text: `Run: ${name} ${JSON.stringify(args)}` }));
}

function ActionButton({ children, onClick }: { children: React.ReactNode; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick}
      className="px-3 py-1 text-xs rounded border border-border bg-bg hover:bg-[var(--brand-accent)] hover:text-[var(--brand-accent-fg)] transition-colors">
      {children}
    </button>
  );
}

function ActionLink({ children, href }: { children: React.ReactNode; href: string }) {
  return (
    <a href={href} target="_blank" rel="noreferrer"
      className="px-3 py-1 text-xs rounded border border-border bg-[var(--brand-accent)] text-[var(--brand-accent-fg)] hover:bg-[var(--brand-link)] hover:text-white transition-colors">
      {children}
    </a>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className="text-sm">{children}</div>
    </div>
  );
}

function Stat({ label, value, tone }: { label: string; value: React.ReactNode; tone?: 'warn' }) {
  const cls = tone === 'warn' ? 'text-[var(--color-status-overdue)]' : '';
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-muted">{label}</div>
      <div className={`text-base font-semibold tabular-nums ${cls}`}>{value}</div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-1">
      <div className="text-[10px] uppercase tracking-wide text-muted">{title}</div>
      {children}
    </section>
  );
}
