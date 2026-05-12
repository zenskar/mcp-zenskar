import type { PaymentMethodListPayload, PaymentMethodRow } from '../types'
import { Dim, fmtDate, shortId } from './format'

export function PaymentMethodList({
  payload,
}: {
  payload: PaymentMethodListPayload
}) {
  const list = payload.payment_methods || []
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Payment Methods{' '}
          <span className="text-muted-foreground font-normal">
            ({list.length})
          </span>
          {payload.customer_id ? (
            <span className="text-muted-foreground font-mono text-xs">
              {' '}
              · {shortId(payload.customer_id, 12)}
            </span>
          ) : null}
        </h2>
      </header>
      {list.length === 0 ? (
        <div className="text-muted-foreground border-border rounded-md border py-8 text-center">
          No payment methods saved.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((m, i) => (
            <PaymentMethodCard key={m.id || i} method={m} />
          ))}
        </div>
      )}
    </div>
  )
}

function PaymentMethodCard({ method: m }: { method: PaymentMethodRow }) {
  const isCard = (m.type || '').toLowerCase().includes('card')
  return (
    <article
      className={`space-y-1 rounded-md border p-3 ${m.is_default ? 'border-ring ring-ring ring-1' : 'border-border'}`}
    >
      <header className="flex items-baseline justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <span className="bg-muted rounded px-2 py-0.5 text-xs">
            {(m.type || 'unknown').replace(/_/g, ' ')}
          </span>
          {m.brand ? (
            <span className="text-muted-foreground">{m.brand}</span>
          ) : null}
          {m.connector_name ? (
            <span className="text-muted-foreground text-xs">via {m.connector_name}</span>
          ) : null}
        </div>
        {m.is_default ? (
          <span className="bg-secondary/15 text-secondary ring-secondary/30 rounded-full px-2 py-0.5 text-xs ring-1">
            default
          </span>
        ) : null}
      </header>
      <div className="font-mono text-sm">
        {m.last4 ? `•••• ${m.last4}` : <Dim>—</Dim>}
      </div>
      <div className="text-muted-foreground flex gap-3 text-xs">
        {m.status ? (
          <span className={`rounded-full px-2 py-0.5 text-xs ring-1 ${
            m.status === 'valid'
              ? 'bg-secondary/15 text-secondary ring-secondary/30'
              : 'bg-destructive/15 text-destructive ring-destructive/30'
          }`}>
            {m.status}
          </span>
        ) : null}
        {isCard && m.exp_month && m.exp_year ? (
          <span>
            exp {String(m.exp_month).padStart(2, '0')}/
            {String(m.exp_year).slice(-2)}
          </span>
        ) : null}
        {m.created_at ? <span>added {fmtDate(m.created_at)}</span> : null}
      </div>
    </article>
  )
}
