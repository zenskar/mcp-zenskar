import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { CustomerRow, CustomerTablePayload } from '../types'
import { StatusPill } from './format'

type SortKey =
  | 'name'
  | 'mrr'
  | 'outstanding'
  | 'created_at'
  | 'last_activity_at'
type SortDir = 'asc' | 'desc'

export function CustomerTable({ payload }: { payload: CustomerTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('created_at')
  const [sortDir, setSortDir] = useState<SortDir>('desc')

  const rows = useMemo(
    () => sortRows(payload.customers, sortKey, sortDir),
    [payload.customers, sortKey, sortDir]
  )

  const toggleSort = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir(k === 'name' ? 'asc' : 'desc')
    }
  }

  const openCustomer = (c: CustomerRow) => {
    if (!c.id) return
    openZenskarPath(`/customers/${c.id}/view`)
  }

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Customers{' '}
          <span className="text-muted-foreground font-normal">
            ({payload.total.toLocaleString()})
          </span>
          {payload.scope ? (
            <span className="text-muted-foreground text-sm font-normal">
              {' '}
              · {payload.scope}
            </span>
          ) : null}
        </h2>
        <span className="text-muted-foreground text-xs">
          click row to open in Zenskar · click headers to sort
        </span>
      </header>

      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground text-xs tracking-wide uppercase">
            <tr>
              <Th>#</Th>
              <Th
                sortable
                active={sortKey === 'name'}
                dir={sortDir}
                onClick={() => toggleSort('name')}
              >
                Name
              </Th>
              <Th>External ID</Th>
              <Th>Email</Th>
              <Th align="right">Invoices</Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'mrr'}
                dir={sortDir}
                onClick={() => toggleSort('mrr')}
              >
                MRR
              </Th>
              <Th
                align="right"
                sortable
                active={sortKey === 'outstanding'}
                dir={sortDir}
                onClick={() => toggleSort('outstanding')}
              >
                Outstanding
              </Th>
              <Th>Status</Th>
              <Th
                sortable
                active={sortKey === 'last_activity_at'}
                dir={sortDir}
                onClick={() => toggleSort('last_activity_at')}
              >
                Last Activity
              </Th>
              <Th
                sortable
                active={sortKey === 'created_at'}
                dir={sortDir}
                onClick={() => toggleSort('created_at')}
              >
                Created
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={10}
                  className="text-muted-foreground py-8 text-center"
                >
                  No customers match.
                </td>
              </tr>
            ) : (
              rows.map((c, i) => (
                <tr
                  key={c.id || i}
                  className="border-border hover:bg-muted/60 cursor-pointer border-t"
                  onClick={() => openCustomer(c)}
                >
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {c.name || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {c.external_id || <Dim>—</Dim>}
                  </td>
                  <td className="text-secondary px-3 py-2">
                    {c.email || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {c.invoice_count ?? <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-right tabular-nums">
                    {fmtMoney(c.mrr)}
                  </td>
                  <td
                    className={`px-3 py-2 text-right tabular-nums ${c.outstanding && c.outstanding.amount > 0 ? 'text-destructive font-medium' : ''}`}
                  >
                    {fmtMoney(c.outstanding)}
                  </td>
                  <td className="px-3 py-2">
                    <StatusPill status={c.status} />
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(c.last_activity_at)}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(c.created_at)}
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
  sortable,
  active,
  dir,
  onClick,
  align = 'left',
}: {
  children: React.ReactNode
  sortable?: boolean
  active?: boolean
  dir?: SortDir
  onClick?: () => void
  align?: 'left' | 'right'
}) {
  const cls = `px-3 py-2 font-semibold ${align === 'right' ? 'text-right' : 'text-left'} ${sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} ${active ? 'text-foreground' : ''}`
  return (
    <th className={cls} onClick={onClick}>
      {children}
      {sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  )
}

function Dim({ children }: { children: React.ReactNode }) {
  return <span className="text-muted-foreground">{children}</span>
}

function fmtMoney(m: { amount: number; currency: string } | null | undefined) {
  if (!m || !Number.isFinite(m.amount)) return <Dim>—</Dim>
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency: m.currency || 'USD',
      maximumFractionDigits: 2,
    }).format(m.amount)
  } catch {
    return `${m.currency} ${m.amount.toLocaleString()}`
  }
}

function fmtDate(s: string | null | undefined) {
  if (!s) return <Dim>—</Dim>
  const d = new Date(s)
  if (Number.isNaN(d.getTime())) return <Dim>—</Dim>
  return d.toISOString().slice(0, 10)
}

function sortRows(
  rows: CustomerRow[],
  key: SortKey,
  dir: SortDir
): CustomerRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: CustomerRow): string | number | null => {
    switch (key) {
      case 'name':
        return r.name
      case 'mrr':
        return r.mrr?.amount ?? null
      case 'outstanding':
        return r.outstanding?.amount ?? null
      case 'created_at':
        return r.created_at ?? null
      case 'last_activity_at':
        return r.last_activity_at ?? null
    }
  }
  return [...rows].sort((a, b) => {
    const av = get(a)
    const bv = get(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return -1 * mult
    if (av > bv) return 1 * mult
    return 0
  })
}
