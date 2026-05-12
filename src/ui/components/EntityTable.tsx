import { useMemo, useState } from 'react'

import { openZenskarPath } from '../client/postMessage'
import type { EntityRow, EntityTablePayload } from '../types'
import { Dim } from './format'

type SortKey = 'name'
type SortDir = 'asc' | 'desc'

export function EntityTable({ payload }: { payload: EntityTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')
  const rows = useMemo(
    () => sortRows(payload.entities, sortKey, sortDir),
    [payload.entities, sortKey, sortDir]
  )
  const toggle = (k: SortKey) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k)
      setSortDir('asc')
    }
  }
  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-base font-semibold">
          Business Entities{' '}
          <span className="text-muted-foreground font-normal">
            ({payload.total.toLocaleString()})
          </span>
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
              <Th>Email</Th>
              <Th>Phone</Th>
              <Th>Country</Th>
              <Th>Default</Th>
              <Th>View</Th>
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="text-muted-foreground py-8 text-center"
                >
                  No entities.
                </td>
              </tr>
            ) : (
              rows.map((r, i) => (
                <tr
                  key={r.id || i}
                  className="border-border hover:bg-muted/60 border-t"
                >
                  <td className="text-muted-foreground px-3 py-2 tabular-nums">
                    {i + 1}
                  </td>
                  <td className="px-3 py-2 font-medium">
                    {r.name || <Dim>—</Dim>}
                  </td>
                  <td className="text-secondary px-3 py-2 text-xs">
                    {r.email || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 font-mono text-xs">
                    {r.phone_number || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.country || <Dim>—</Dim>}
                  </td>
                  <td className="px-3 py-2 text-xs">
                    {r.is_default == null ? (
                      <Dim>—</Dim>
                    ) : r.is_default ? (
                      'yes'
                    ) : (
                      'no'
                    )}
                  </td>
                  <td className="px-3 py-2">
                    <button
                      type="button"
                      className="text-secondary hover:text-secondary/80 text-xs underline"
                      onClick={() => openZenskarPath(`/settings/tax-configuration/entity/${r.id}`)}
                    >
                      View
                    </button>
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

function sortRows(rows: EntityRow[], key: SortKey, dir: SortDir): EntityRow[] {
  const mult = dir === 'asc' ? 1 : -1
  const get = (r: EntityRow): string | null => {
    switch (key) {
      case 'name':
        return r.name
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
}: {
  children: React.ReactNode
  sortable?: boolean
  active?: boolean
  dir?: SortDir
  onClick?: () => void
}) {
  const cls = `px-3 py-2 text-left font-semibold ${sortable ? 'cursor-pointer select-none hover:text-foreground' : ''} ${active ? 'text-foreground' : ''}`
  return (
    <th className={cls} onClick={onClick}>
      {children}
      {sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  )
}
