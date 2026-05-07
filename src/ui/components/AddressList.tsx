import type { AddressListPayload, AddressRow } from '../types';
import { Dim, shortId } from './format';

export function AddressList({ payload }: { payload: AddressListPayload }) {
  const list = payload.addresses || [];
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="text-base font-semibold m-0">Addresses <span className="text-muted font-normal">({list.length})</span>
          {payload.customer_id ? <span className="text-muted font-mono text-xs"> · {shortId(payload.customer_id, 12)}</span> : null}</h2>
      </header>
      {list.length === 0 ? (
        <div className="text-center text-muted py-8 border border-border rounded-md">No addresses on file.</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {list.map((a, i) => <AddressCard key={a.id || i} addr={a} />)}
        </div>
      )}
    </div>
  );
}

function AddressCard({ addr }: { addr: AddressRow }) {
  return (
    <article className={`rounded-md border p-3 space-y-1 ${addr.is_primary ? 'border-[var(--brand-ring)] ring-1 ring-[var(--brand-ring)]' : 'border-border'}`}>
      <header className="flex items-baseline justify-between gap-2">
        <div className="font-medium text-sm">{addr.label || <Dim>Untitled</Dim>}</div>
        {addr.is_primary ? <span className="px-2 py-0.5 rounded-full text-xs bg-emerald-100 text-emerald-800">primary</span> : null}
      </header>
      <div className="text-sm">
        {addr.line1 ? <div>{addr.line1}</div> : null}
        {addr.line2 ? <div>{addr.line2}</div> : null}
        <div>
          {[addr.city, addr.state, addr.zip_code].filter(Boolean).join(', ') || <Dim>—</Dim>}
        </div>
        {addr.country ? <div className="text-xs text-muted uppercase mt-0.5">{addr.country}</div> : null}
      </div>
    </article>
  );
}
