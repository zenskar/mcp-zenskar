import type { InvoiceLineItemsPayload, LineItem } from '../types'
import { type ColumnDef, DataTable } from './DataTable'
import { Dim, fmtDate, fmtMoney, fmtMoneyObj } from './format'

export function InvoiceLineItems({
  payload,
}: {
  payload: InvoiceLineItemsPayload
}) {
  const cur = payload.currency || 'USD'
  const lines = payload.lines || []

  const title = (
    <>
      Line Items{' '}
      <span className="text-muted-foreground font-normal">
        ({lines.length})
      </span>
      {payload.invoice_id ? (
        <span className="text-secondary font-mono text-xs break-all">
          {' '}
          · {payload.invoice_id}
        </span>
      ) : null}
    </>
  )

  const totalHint =
    payload.total != null ? (
      <span className="text-sm">
        Total:{' '}
        <span className="font-medium tabular-nums">
          {fmtMoney(payload.total, cur)}
        </span>
      </span>
    ) : null

  const columns: ColumnDef<LineItem>[] = [
    {
      key: 'type',
      header: 'Type',
      className: 'text-muted-foreground text-xs',
      render: (l) => (
        <div className="flex items-center gap-1">
          {l.line_item_type ? (
            l.line_item_type.replace(/_/g, ' ')
          ) : (
            <Dim>—</Dim>
          )}
          {l.is_adjustment ? (
            <span className="bg-warning/15 text-warning ring-warning/30 rounded-full px-1.5 py-0.5 text-[10px] ring-1">
              {l.adjustment_type || 'adj'}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: 'item',
      header: 'Item',
      render: (l) => (
        <>
          <div className="font-medium">{l.name || <Dim>—</Dim>}</div>
          {l.description ? (
            <div className="text-muted-foreground text-xs">{l.description}</div>
          ) : null}
        </>
      ),
    },
    {
      key: 'pricing_model',
      header: 'Pricing Model',
      className: 'text-muted-foreground text-xs',
      render: (l) => l.pricing_model || <Dim>—</Dim>,
    },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      render: (l) => l.quantity?.display || (l.quantity?.value ?? <Dim>—</Dim>),
    },
    {
      key: 'price',
      header: 'Price',
      align: 'right',
      render: (l) => (l.price ? fmtMoneyObj(l.price) : <Dim>—</Dim>),
    },
    {
      key: 'subtotal',
      header: 'Subtotal',
      align: 'right',
      render: (l) => {
        const negative = l.subtotal?.value != null && l.subtotal.value < 0
        return (
          <span className={negative ? 'text-destructive' : ''}>
            {fmtMoneyObj(l.subtotal)}
          </span>
        )
      },
    },
    {
      key: 'period',
      header: 'Service Period',
      className: 'text-xs whitespace-nowrap',
      render: (l) =>
        l.service_start_date && l.service_end_date ? (
          <>
            {fmtDate(l.service_start_date)} → {fmtDate(l.service_end_date)}
          </>
        ) : (
          <Dim>—</Dim>
        ),
    },
    {
      key: 'billed',
      header: 'Billed',
      className: 'text-xs',
      render: (l) =>
        l.is_billed === true ? '✓' : l.is_billed === false ? '—' : <Dim>?</Dim>,
    },
  ]

  return (
    <DataTable
      title={title}
      rightHint={totalHint}
      columns={columns}
      rows={lines}
      emptyMessage="No line items on this invoice."
      hoverRows={false}
    />
  )
}
