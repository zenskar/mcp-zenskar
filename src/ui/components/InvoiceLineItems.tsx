import type { InvoiceLineItemsPayload, LineItem } from '../types'
import { Dim, fmtDate, fmtMoney, fmtMoneyObj, shortId } from './format'

export function InvoiceLineItems({
  payload,
}: {
  payload: InvoiceLineItemsPayload
}) {
  const cur = payload.currency || 'USD'
  const lines = payload.lines || []
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Line Items{' '}
          <span className="text-muted-foreground font-normal">
            ({lines.length})
          </span>
          {payload.invoice_id ? (
            <span className="text-muted-foreground font-mono text-xs">
              {' '}
              · {shortId(payload.invoice_id, 12)}
            </span>
          ) : null}
        </h2>
        {payload.total != null ? (
          <span className="text-sm">
            Total:{' '}
            <span className="font-medium tabular-nums">
              {fmtMoney(payload.total, cur)}
            </span>
          </span>
        ) : null}
      </header>

      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th>Type</Th>
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
              <tr>
                <td
                  colSpan={9}
                  className="text-muted-foreground py-8 text-center"
                >
                  No line items on this invoice.
                </td>
              </tr>
            ) : (
              lines.map((l, i) => (
                <tr key={i} className="border-border border-t">
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    <div className="flex items-center gap-1">
                      {l.line_item_type ? l.line_item_type.replace(/_/g, ' ') : <Dim>—</Dim>}
                      {l.is_adjustment ? (
                        <span className="bg-warning/15 text-warning ring-warning/30 rounded-full px-1.5 py-0.5 text-[10px] ring-1">
                          {l.adjustment_type || 'adj'}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-3 py-2">
                    <div className="font-medium">{l.name || <Dim>—</Dim>}</div>
                    {l.description ? (
                      <div className="text-muted-foreground text-xs">
                        {l.description}
                      </div>
                    ) : null}
                  </td>
                  <td className="text-muted-foreground px-3 py-2 text-xs">
                    {l.pricing_model || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {l.quantity?.display || (l.quantity?.value ?? <Dim>—</Dim>)}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {l.price ? fmtMoneyObj(l.price) : <Dim>—</Dim>}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${l.subtotal?.value != null && l.subtotal.value < 0 ? 'text-destructive' : ''}`}
                  >
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
                  <td className="px-3 py-2 text-xs">
                    {l.is_billed === true ? (
                      '✓'
                    ) : l.is_billed === false ? (
                      '—'
                    ) : (
                      <Dim>?</Dim>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

function Th({
  children,
  align = 'left',
}: {
  children: React.ReactNode
  align?: 'left' | 'right'
}) {
  return (
    <th
      className={`px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'}`}
    >
      {children}
    </th>
  )
}
