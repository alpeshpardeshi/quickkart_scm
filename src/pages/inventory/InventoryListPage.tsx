import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus, Download } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatNumber, statusTone } from '../../utils'
import type { InventoryItem } from '../../types'

export function InventoryListPage() {
  const { inventory } = useData()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')

  const filtered = useMemo(() => {
    return inventory.filter((row) => {
      if (status && row.status !== status) return false
      if (warehouse && row.warehouse !== warehouse) return false
      return true
    })
  }, [inventory, status, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], ['sku', 'product', 'batch', 'warehouse', 'bin'] as never)

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  const columns: QkColumn<InventoryItem>[] = [
    { key: 'sku', header: 'SKU', sortable: true, mobile: 'subtitle', render: (r) => <Link to={`/inventory/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.sku}</Link> },
    { key: 'product', header: 'Product', sortable: true, mobile: 'title' },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    { key: 'zone', header: 'Zone' },
    { key: 'rack', header: 'Rack' },
    { key: 'shelf', header: 'Shelf' },
    { key: 'bin', header: 'Bin', mobile: 'meta' },
    { key: 'batch', header: 'Batch' },
    { key: 'available', header: 'Available', align: 'right', sortable: true, mobile: 'field', render: (r) => formatNumber(r.available) },
    { key: 'reserved', header: 'Reserved', align: 'right', render: (r) => formatNumber(r.reserved) },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'expiry', header: 'Expiry', sortable: true },
  ]

  const available = inventory.reduce((s, i) => s + i.available, 0)
  const reserved = inventory.reduce((s, i) => s + i.reserved, 0)

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Inventory"
        subtitle="Live stock across warehouses, locations, and batches."
        actions={
          <>
            <Link to="/inventory-dashboard"><QkButton variant="outline">Dashboard</QkButton></Link>
            <QkButton variant="outline" leftIcon={<Download size={14} />}>Export</QkButton>
            <Link to="/stock-adjustment"><QkButton leftIcon={<Plus size={14} />}>Adjust stock</QkButton></Link>
          </>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="SKUs tracked" value={inventory.length} />
        <QkMetric label="Available" value={formatNumber(available)} />
        <QkMetric label="Reserved" value={formatNumber(reserved)} />
        <QkMetric label="Low stock" value={inventory.filter((i) => i.status === 'Low Stock').length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, product, batch..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: (v) => { setStatus(v); list.setPage(1) },
            options: ['Available', 'Low Stock', 'QC Hold', 'Expired', 'Damaged'].map((s) => ({ label: s, value: s })),
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => { setWarehouse(v); list.setPage(1) },
            options: Array.from(new Set(inventory.map((i) => i.warehouse))).map((w) => ({ label: w, value: w })),
          },
        ]}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'status') setStatus('')
          if (id === 'warehouse') setWarehouse('')
        }}
        onClearAll={() => { setStatus(''); setWarehouse(''); list.setSearch('') }}
      />

      <QkTable
        mobileMode="cards"
        columns={columns}
        rows={list.rows as unknown as InventoryItem[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        selectedIds={list.selectedIds}
        onToggleRow={list.toggleRow}
        onToggleAll={list.toggleAll}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(row) => navigate(`/inventory/${row.id}`)}
        emptyTitle="No inventory matched your filters."
        emptyDescription="Try clearing filters or searching a different SKU."
        emptyAction={<QkButton variant="outline" onClick={() => { setStatus(''); setWarehouse(''); list.setSearch('') }}>Clear filters</QkButton>}
      />
    </div>
  )
}
