import { useMemo } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkFilterBar, QkMetric, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatNumber } from '../../utils'

interface ReservationRow {
  id: string
  soNumber: string
  soId: string
  customer: string
  warehouse: string
  sku: string
  product: string
  orderedQty: number
  reservedQty: number
  batch?: string
  status: string
}

export function ReservationsPage() {
  const { salesOrders } = useData()

  const rows = useMemo(() => {
    const list: ReservationRow[] = []
    for (const so of salesOrders) {
      for (const item of so.items) {
        if (item.reservedQty > 0 || so.status === 'Reserved' || so.status === 'Picking') {
          list.push({
            id: `${so.id}-${item.id}`,
            soNumber: so.soNumber,
            soId: so.id,
            customer: so.customer,
            warehouse: so.warehouse,
            sku: item.sku,
            product: item.product,
            orderedQty: item.orderedQty,
            reservedQty: item.reservedQty,
            batch: item.batch,
            status: item.status,
          })
        }
      }
    }
    return list
  }, [salesOrders])

  const list = useListState(rows as unknown as Record<string, unknown>[], ['soNumber', 'customer', 'sku', 'product', 'warehouse'] as never)

  const columns: QkColumn<ReservationRow>[] = [
    { key: 'soNumber', header: 'SO', sortable: true, render: (r) => <Link to={`/sales-orders/${r.soId}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.soNumber}</Link> },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product' },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'batch', header: 'Batch', render: (r) => r.batch || '—' },
    { key: 'orderedQty', header: 'Ordered', align: 'right', render: (r) => formatNumber(r.orderedQty) },
    { key: 'reservedQty', header: 'Reserved', align: 'right', render: (r) => formatNumber(r.reservedQty) },
    {
      key: 'status',
      header: 'Locks',
      render: (r) => <Link to={`/locks/${r.soId}`} style={{ color: 'var(--qk-primary)', fontWeight: 500 }}>View locks</Link>,
    },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Reservations" subtitle="Stock locked against confirmed sales orders." />
      <div className="qk-grid-metrics">
        <QkMetric label="Reserved lines" value={rows.length} />
        <QkMetric label="Units reserved" value={formatNumber(rows.reduce((s, r) => s + r.reservedQty, 0))} />
        <QkMetric label="Orders covered" value={new Set(rows.map((r) => r.soNumber)).size} />
      </div>
      <QkFilterBar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search SO, SKU, customer..." />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as ReservationRow[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No reservations found."
      />
    </div>
  )
}
