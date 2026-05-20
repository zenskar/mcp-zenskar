import type { JSX, ReactNode } from 'react'

import { openZenskarPath } from '../client/postMessage'

export type SortDir = 'asc' | 'desc'

export type ColumnDef<R> = {
  key: string
  header: ReactNode
  align?: 'left' | 'right'
  sortable?: boolean
  className?: string
  render: (row: R, index: number) => ReactNode
}

type DataTableProps<R> = {
  title: ReactNode
  count?: number
  scope?: string
  rightHint?: ReactNode
  columns: ColumnDef<R>[]
  rows: R[]
  sortKey?: string
  sortDir?: SortDir
  onSort?: (key: string) => void
  emptyMessage?: string
  showIndex?: boolean
  rowKey?: (row: R, index: number) => string | number
  rowClassName?: (row: R, index: number) => string
  hoverRows?: boolean
}

export function DataTable<R>({
  title,
  count,
  scope,
  rightHint,
  columns,
  rows,
  sortKey,
  sortDir,
  onSort,
  emptyMessage = 'Nothing to show.',
  showIndex = true,
  rowKey,
  rowClassName,
  hoverRows = true,
}: DataTableProps<R>): JSX.Element {
  const totalCols = columns.length + (showIndex ? 1 : 0)
  const hint =
    rightHint === undefined && onSort ? 'click headers to sort' : rightHint

  return (
    <div className="space-y-3">
      <header className="flex items-baseline justify-between gap-3">
        <h2 className="m-0 text-lg font-semibold">
          {title}
          {count != null ? (
            <span className="text-muted-foreground text-sm font-normal">
              {' '}
              ({count.toLocaleString()})
            </span>
          ) : null}
          {scope ? (
            <span className="text-muted-foreground text-sm font-normal">
              {' '}
              · {scope}
            </span>
          ) : null}
        </h2>
        {hint != null ? (
          <span className="text-muted-foreground text-xs">{hint}</span>
        ) : null}
      </header>

      <div className="border-border overflow-auto rounded-md border">
        <table className="w-full text-sm">
          <thead className="bg-muted text-muted-foreground border-b-2 border-border text-xs tracking-wide uppercase">
            <tr>
              {showIndex ? <Th>#</Th> : null}
              {columns.map((c) => (
                <Th
                  key={c.key}
                  align={c.align}
                  sortable={c.sortable}
                  active={c.sortable && sortKey === c.key}
                  dir={sortDir}
                  onClick={
                    c.sortable && onSort ? () => onSort(c.key) : undefined
                  }
                >
                  {c.header}
                </Th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td
                  colSpan={totalCols}
                  className="text-muted-foreground py-8 text-center"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row, i) => (
                <tr
                  key={rowKey ? rowKey(row, i) : i}
                  className={`border-border border-t ${hoverRows ? 'hover:bg-muted/60' : ''} ${rowClassName ? rowClassName(row, i) : ''}`
                    .trim()
                    .replace(/\s+/g, ' ')}
                >
                  {showIndex ? (
                    <td className="text-muted-foreground px-3 py-2 tabular-nums">
                      {i + 1}
                    </td>
                  ) : null}
                  {columns.map((c) => (
                    <td
                      key={c.key}
                      className={`px-3 py-2 ${c.align === 'right' ? 'text-right tabular-nums' : ''} ${c.className ?? ''}`.trim()}
                    >
                      {c.render(row, i)}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

type ThProps = {
  children: ReactNode
  sortable?: boolean
  active?: boolean
  dir?: SortDir
  onClick?: () => void
  align?: 'left' | 'right'
}

function Th({
  children,
  sortable,
  active,
  dir,
  onClick,
  align = 'left',
}: ThProps): JSX.Element {
  const cls = [
    'px-3 py-2 font-semibold',
    align === 'right' ? 'text-right' : 'text-left',
    sortable ? 'cursor-pointer select-none hover:text-foreground' : '',
    active ? 'text-foreground' : '',
  ]
    .filter(Boolean)
    .join(' ')
  return (
    <th className={cls} onClick={onClick}>
      {children}
      {sortable && active ? (dir === 'asc' ? ' ↑' : ' ↓') : null}
    </th>
  )
}

export function ViewButton({
  href,
  label = 'View',
}: {
  href: string
  label?: string
}): JSX.Element {
  return (
    <button
      type="button"
      className="text-secondary hover:text-secondary/80 text-xs underline"
      onClick={() => openZenskarPath(href)}
    >
      {label}
    </button>
  )
}

export function sortByKey<R>(
  rows: R[],
  getValue: (row: R) => string | number | null | undefined,
  dir: SortDir
): R[] {
  const mult = dir === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => {
    const av = getValue(a)
    const bv = getValue(b)
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (av < bv) return -1 * mult
    if (av > bv) return 1 * mult
    return 0
  })
}
