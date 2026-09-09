import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTabs, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, formatNumber, statusTone } from '../../utils'
import type { Batch } from '../../types'

const TODAY = '2026-09-09'

export function ExpiryPage() {
  const { batches, products } = useData()
  const [tab, setTab] = useState('near')
  const [warehouse, setWarehouse] = useState('')

  const nearExpiry = useMemo(
    () => batches.filter((b) => b.status === 'Near Expiry' || (b.status === 'Active' && daysUntil(b.expiry) <= 30 && daysUntil(b.expiry) >= 0)),
    [batches],
  )
  const expired = useMemo(() => batches.filter((b) => b.status === 'Expired' || daysUntil(b.expiry) < 0), [batches])

  const source = tab === 'near' ? nearExpiry : expired

  const filtered = useMemo(() => {
    return source.filter((row) => {
      if (warehouse && row.warehouse !== warehouse) return false
      return true
    })
  }, [source, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'batchNo',
    'sku',
    'product',
    'warehouse',
    'vendor',
  ] as never)

  const valueAtRisk = useMemo(() => {
    return nearExpiry.reduce((sum, b) => {
      const price = products.find((p) => p.sku === b.sku)?.unitPrice ?? 0
      return sum + price * b.qty
    }, 0)
  }, [nearExpiry, products])

  const chips = warehouse ? [{ id: 'warehouse', label: `Warehouse: ${warehouse}` }] : []

  const columns: QkColumn<Batch>[] = [
    {
      key: 'batchNo',
      header: 'Batch',
      sortable: true,
      render: (r) => (
        <Link to={`/batches/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>
          {r.batchNo}
        </Link>
      ),
    },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, render: (r) => formatNumber(r.qty) },
    { key: 'expiry', header: 'Expiry', sortable: true, render: (r) => formatDate(r.expiry) },
    {
      key: 'fefoPriority',
      header: 'Days left',
      align: 'right',
      render: (r) => {
        const d = daysUntil(r.expiry)
        return (
          <span style={{ color: d < 0 ? 'var(--qk-danger)' : d <= 7 ? 'var(--qk-warning)' : 'var(--qk-text)', fontWeight: 600 }}>
            {d < 0 ? `${Math.abs(d)} overdue` : d}
          </span>
        )
      },
    },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Expiry"
        subtitle="Monitor near-expiry and expired batches for FEFO and wastage."
        actions={
          <>
            <Link to="/near-expiry"><QkButton variant="outline">Near expiry</QkButton></Link>
            <Link to="/expired"><QkButton variant="outline">Expired stock</QkButton></Link>
            <Link to="/wastage"><QkButton>Record wastage</QkButton></Link>
          </>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Near expiry" value={nearExpiry.length} hint="Within 30 days" />
        <QkMetric label="Expired" value={expired.length} />
        <QkMetric label="Units at risk" value={formatNumber(nearExpiry.reduce((s, b) => s + b.qty, 0))} />
        <QkMetric label="Value at risk" value={formatCurrency(valueAtRisk)} />
      </div>

      <QkTabs
        value={tab}
        onChange={(v) => {
          setTab(v)
          list.setPage(1)
        }}
        tabs={[
          { id: 'near', label: 'Near expiry', count: nearExpiry.length },
          { id: 'expired', label: 'Expired', count: expired.length },
        ]}
      />

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search batch, SKU, product..."
        filters={[
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              setWarehouse(v)
              list.setPage(1)
            },
            options: Array.from(new Set(batches.map((b) => b.warehouse))).map((w) => ({ label: w, value: w })),
          },
        ]}
        chips={chips}
        onRemoveChip={() => setWarehouse('')}
        onClearAll={() => {
          setWarehouse('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as Batch[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle={tab === 'near' ? 'No near-expiry batches.' : 'No expired batches.'}
        emptyDescription="All clear for the selected warehouse filters."
      />
    </div>
  )
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`).getTime()
  const today = new Date(`${TODAY}T00:00:00`).getTime()
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
}
