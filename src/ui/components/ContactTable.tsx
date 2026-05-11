import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { ContactRow, ContactTablePayload } from '../types'
import { Dim, fmtDate, shortId } from './format'

type SortKey = 'name' | 'email' | 'created_at'
type SortDir = 'asc' | 'desc'

export function ContactTable({ payload }: { payload: ContactTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const rows = useMemo(
    () => sortRows(payload.contacts, sortKey, sortDir),
    [payload.contacts, sortKey, sortDir]
  )
  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }
  const open = (r: ContactRow) => {
    if (!r.id) return
    openZenskarPath(`/contacts/${r.id}/edit`)
  }

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Contacts{' '}
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
                onClick={() => toggle('name')}
              >
                Name
              </Th>
              <Th
                sortable
                active={sortKey === 'email'}
                dir={sortDir}
                onClick={() => toggle('email')}
              >
                Email
              </Th>
              <Th>Phone</Th>
              <Th>Customer</Th>
              <Th>Role</Th>
              <Th
                sortable
                active={sortKey === 'created_at'}
                dir={sortDir}
                onClick={() => toggle('created_at')}
              >
                Created
              </Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No contacts match.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.id || i}
                  className="border-border hover:bg-muted/60 cursor-pointer border-t"
                  onClick={() => open(r)}
                >
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.name || <Dim>—</Dim>}
                  </td>
                  <td className="text-secondary px-3 py-2">
                    {r.email || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.phone || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {shortId(r.customer_id, 10)}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.role || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 whitespace-nowrap">
                    {fmtDate(r.created_at)}
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

function sortRows(
  rows: ContactRow[],
  key: SortKey,
  dir: SortDir
): ContactRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: ContactRow): string | number | null => {
    switch (key) {
      case 'name':
        return r.name
      case 'email':
        return r.email
      case 'created_at':
        return r.created_at
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
