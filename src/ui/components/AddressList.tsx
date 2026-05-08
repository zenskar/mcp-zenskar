import type { AddressListPayload, AddressRow } from '../types'
import { Dim, shortId } from './format'

export function AddressList({ payload }: { payload: AddressListPayload }) {
  const list = payload.addresses || []
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Addresses{' '}
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
          No addresses on file.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          {list.map((a, i) => (
            <AddressCard key={a.id || i} addr={a} />
          ))}
        </div>
      )}
    </div>
  )
}

function AddressCard({ addr }: { addr: AddressRow }) {
  return (
    <article
      className={`space-y-1 rounded-md border p-3 ${addr.is_primary ? 'border-ring ring-ring ring-1' : 'border-border'}`}
    >
      <header className="flex items-baseline justify-between gap-2">
        <div className="text-sm font-medium">
          {addr.label || <Dim>Untitled</Dim>}
        </div>
        {addr.is_primary ? (
          <span className="bg-secondary/15 text-secondary ring-secondary/30 rounded-full px-2 py-0.5 text-xs ring-1">
            primary
          </span>
        ) : null}
      </header>
      <div className="text-sm">
        {addr.line1 ? <div>{addr.line1}</div> : null}
        {addr.line2 ? <div>{addr.line2}</div> : null}
        <div>
          {[addr.city, addr.state, addr.zip_code]
            .filter(Boolean)
            .join(', ') || <Dim>—</Dim>}
        </div>
        {addr.country ? (
          <div className="text-muted-foreground mt-0.5 text-xs uppercase">
            {addr.country}
          </div>
        ) : null}
      </div>
    </article>
  )
}
