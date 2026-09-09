import { useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, formatNumber, statusTone } from '../../utils'
import type { Batch } from '../../types'

export function NearExpiryPage() {
  const { batches } = useData()
  const navigate = useNavigate()
  const rows = useMemo(() => batches.filter((b) => b.status === 'Near Expiry'), [batches])
  const list = useListState(rows as unknown as Record<string, unknown>[], ['batchNo', 'sku', 'product', 'warehouse'] as never)

  const columns: QkColumn<Batch>[] = [
    { key: 'batchNo', header: 'Batch', sortable: true, render: (r) => <Link to={`/batches/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.batchNo}</Link> },
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'qty', header: 'Qty', align: 'right', render: (r) => formatNumber(r.qty) },
    { key: 'expiry', header: 'Expiry', sortable: true, render: (r) => formatDate(r.expiry) },
    { key: 'fefoPriority', header: 'FEFO', align: 'center' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Near Expiry"
        subtitle="Batches expiring within the FEFO attention window."
        actions={
          <>
            <Link to="/expiry"><QkButton variant="outline">Expiry dashboard</QkButton></Link>
            <Link to="/expired"><QkButton variant="outline">Expired stock</QkButton></Link>
          </>
        }
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Near-expiry batches" value={rows.length} />
        <QkMetric label="Units at risk" value={formatNumber(rows.reduce((s, b) => s + b.qty, 0))} />
      </div>
      <QkFilterBar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search batch, SKU, product..." />
      <QkTable columns={columns} rows={list.rows as unknown as Batch[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={(r) => navigate(`/batches/${r.id}`)} emptyTitle="No near-expiry batches." />
    </div>
  )
}

export function ExpiredStockPage() {
  const { batches, wastage } = useData()
  const navigate = useNavigate()
  const rows = useMemo(() => batches.filter((b) => b.status === 'Expired'), [batches])
  const list = useListState(rows as unknown as Record<string, unknown>[], ['batchNo', 'sku', 'product', 'warehouse'] as never)

  const columns: QkColumn<Batch>[] = [
    { key: 'batchNo', header: 'Batch', sortable: true, render: (r) => <Link to={`/batches/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.batchNo}</Link> },
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'qty', header: 'Qty', align: 'right', render: (r) => formatNumber(r.qty) },
    { key: 'expiry', header: 'Expiry', sortable: true, render: (r) => formatDate(r.expiry) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Expired Stock"
        subtitle="Expired batches pending wastage or quarantine clearance."
        actions={
          <>
            <Link to="/wastage"><QkButton variant="outline">Wastage ({wastage.length})</QkButton></Link>
            <Link to="/near-expiry"><QkButton variant="outline">Near expiry</QkButton></Link>
          </>
        }
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Expired batches" value={rows.length} />
        <QkMetric label="Expired units" value={formatNumber(rows.reduce((s, b) => s + b.qty, 0))} />
      </div>
      <QkFilterBar search={list.search} onSearchChange={list.setSearch} searchPlaceholder="Search batch, SKU, product..." />
      <QkTable columns={columns} rows={list.rows as unknown as Batch[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={(r) => navigate(`/batches/${r.id}`)} emptyTitle="No expired batches." />
    </div>
  )
}
