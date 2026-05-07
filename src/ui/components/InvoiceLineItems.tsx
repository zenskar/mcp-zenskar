import type { InvoiceLineItemsPayload, LineItem } from '../types';
import { Dim, fmtDate, fmtMoneyObj, shortId } from './format';
import { fmtMoney } from './format';

export function InvoiceLineItems({ payload }: { payload: InvoiceLineItemsPayload }) {
  const cur = payload.currency || 'USD';
  const lines = payload.lines || [];
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">
          Line Items <span className="text-muted font-normal">({lines.length})</span>
          {payload.invoice_id ? <span className="text-muted font-mono text-xs"> · {shortId(payload.invoice_id, 12)}</span> : null}
        </h2>
        {payload.total != null ? (
          <span className="text-sm">Total: <span className="font-medium tabular-nums">{fmtMoney(payload.total, cur)}</span></span>
        ) : null}
      </header>

      <div className="overflow-auto rounded-md border border-border">
        <table className="w-full text-sm">
          <thead className="bg-row-hover text-xs uppercase tracking-wide text-muted">
            <tr>
              <Th>#</Th>
              <Th>Item</Th>
              <Th>Pricing Model</Th>
              <Th align="right">Qty</Th>
              <Th align="right">Price</Th>
              <Th align="right">Subtotal</Th>
              <Th>Service Period</Th>
              <Th>Billed</Th>
            </tr>
          </thead>
          <tbody>
            {lines.length === 0 ? (
              <tr><td colSpan={8} className="py-8 text-center text-muted">No line items on this invoice.</td></tr>
            ) : lines.map((l, i) => (
              <tr key={i} className="border-t border-border">
                <td className="px-3 py-2 text-muted tabular-nums">{i + 1}</td>
                <td className="px-3 py-2">
                  <div className="font-medium">{l.name || <Dim>—</Dim>}</div>
                  {l.description ? <div className="text-xs text-muted">{l.description}</div> : null}
                </td>
                <td className="px-3 py-2 text-xs text-muted">{l.pricing_model || <Dim>—</Dim>}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.quantity?.display || (l.quantity?.value ?? <Dim>—</Dim>)}</td>
                <td className="px-3 py-2 text-right tabular-nums">{l.price ? fmtMoneyObj(l.price) : <Dim>—</Dim>}</td>
                <td className={`px-3 py-2 text-right tabular-nums ${l.subtotal?.value != null && l.subtotal.value < 0 ? 'text-[var(--color-status-overdue)]' : ''}`}>
                  {fmtMoneyObj(l.subtotal)}
                </td>
                <td className="px-3 py-2 whitespace-nowrap text-xs">
                  {l.service_start_date && l.service_end_date
                    ? <>{fmtDate(l.service_start_date)} → {fmtDate(l.service_end_date)}</>
                    : <Dim>—</Dim>}
                </td>
                <td className="px-3 py-2 text-xs">{l.is_billed === true ? '✓' : l.is_billed === false ? '—' : <Dim>?</Dim>}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function Th({ children, align = 'left' }: { children: React.ReactNode; align?: 'left' | 'right' }) {
  return <th className={`px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}>{children}</th>;
}
