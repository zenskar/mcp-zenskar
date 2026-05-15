import { useMemo, useState } from 'react'

import type { ContactRow, ContactTablePayload } from '../types'
import {
  type ColumnDef,
  DataTable,
  type SortDir,
  ViewButton,
  sortByKey,
} from './DataTable'
import { Dim, shortId } from './format'

type SortKey = 'name' | 'email'

export function ContactTable({ payload }: { payload: ContactTablePayload }) {
  const [sortKey, setSortKey] = useState<SortKey>('name')
  const [sortDir, setSortDir] = useState<SortDir>('asc')

  const rows = useMemo(
    () =>
      sortByKey(
        payload.contacts,
        (r) => (sortKey === 'name' ? r.name : r.email),
        sortDir
      ),
    [payload.contacts, sortKey, sortDir]
  )

  const onSort = (k: string) => {
    if (k === sortKey) setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'))
    else {
      setSortKey(k as SortKey)
      setSortDir('asc')
    }
  }

  const columns: ColumnDef<ContactRow>[] = [
    {
      key: 'name',
      header: 'Name',
      sortable: true,
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'email',
      header: 'Email',
      sortable: true,
      className: 'text-secondary',
      render: (r) => r.email || <Dim>—</Dim>,
    },
    {
      key: 'customer',
      header: 'Customer',
      className: 'font-mono text-xs',
      render: (r) => shortId(r.customer_id, 10),
    },
    {
      key: 'send_invoice',
      header: 'Send Invoice',
      className: 'text-xs',
      render: (r) =>
        r.send_invoice == null ? <Dim>—</Dim> : r.send_invoice ? 'yes' : 'no',
    },
    {
      key: 'send_contract',
      header: 'Send Contract',
      className: 'text-xs',
      render: (r) =>
        r.send_contract == null ? <Dim>—</Dim> : r.send_contract ? 'yes' : 'no',
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/contacts/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Contacts"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={rows}
      sortKey={sortKey}
      sortDir={sortDir}
      onSort={onSort}
      emptyMessage="No contacts match."
      rightHint={null}
      rowKey={(r, i) => r.id || i}
    />
  )
}
