import type { EntitlementRow, EntitlementTablePayload } from '../types'
import { type ColumnDef, DataTable, ViewButton } from './DataTable'
import { Dim, fmtDate } from './format'

export function EntitlementTable({
  payload,
}: {
  payload: EntitlementTablePayload
}) {
  const columns: ColumnDef<EntitlementRow>[] = [
    {
      key: 'name',
      header: 'Entitlement',
      className: 'font-medium',
      render: (r) => r.name || <Dim>—</Dim>,
    },
    {
      key: 'entitlement_type',
      header: 'Type',
      className: 'text-xs',
      render: (r) => r.entitlement_type || <Dim>—</Dim>,
    },
    {
      key: 'units',
      header: 'Units',
      className: 'font-mono text-xs',
      render: (r) => r.units || <Dim>—</Dim>,
    },
    {
      key: 'product_name',
      header: 'Product',
      className: 'text-xs',
      render: (r) => r.product_name || <Dim>—</Dim>,
    },
    {
      key: 'is_active',
      header: 'Status',
      className: 'text-xs',
      render: (r) =>
        r.is_active == null ? (
          <Dim>—</Dim>
        ) : r.is_active ? (
          'active'
        ) : (
          'inactive'
        ),
    },
    {
      key: 'created_at',
      header: 'Created',
      className: 'whitespace-nowrap',
      render: (r) => fmtDate(r.created_at),
    },
    {
      key: 'view',
      header: 'View',
      render: (r) => <ViewButton href={`/entitlements/${r.id}/edit`} />,
    },
  ]

  return (
    <DataTable
      title="Entitlements"
      count={payload.total}
      scope={payload.scope}
      columns={columns}
      rows={payload.entitlements}
      emptyMessage="No entitlements match."
      rowKey={(r, i) => r.id || i}
    />
  )
}
