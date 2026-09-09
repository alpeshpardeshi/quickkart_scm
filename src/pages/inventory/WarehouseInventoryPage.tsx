import { useMemo, useState } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatNumber, statusTone } from '../../utils'
import type { InventoryItem } from '../../types'

export function WarehouseInventoryPage() {
  const { inventory, warehouses } = useData()
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const warehouse = params.get('warehouse') || ''
  const [status, setStatus] = useState('')
  const [zone, setZone] = useState('')

  const filtered = useMemo(() => {
    return inventory.filter((row) => {
      if (warehouse && row.warehouse !== warehouse) return false
      if (status && row.status !== status) return false
      if (zone && row.zone !== zone) return false
      return true
    })
  }, [inventory, warehouse, status, zone])

  const list = useListState(filtered as unknown as Record<string, unknown>[], ['sku', 'product', 'batch', 'bin', 'rack'] as never)
  const zones = Array.from(new Set(filtered.map((i) => i.zone)))

  const columns: QkColumn<InventoryItem>[] = [
    { key: 'sku', header: 'SKU', sortable: true, render: (r) => <Link to={`/inventory/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.sku}</Link> },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'zone', header: 'Zone' },
    { key: 'rack', header: 'Rack' },
    { key: 'shelf', header: 'Shelf' },
    { key: 'bin', header: 'Bin' },
    { key: 'batch', header: 'Batch' },
    { key: 'available', header: 'Available', align: 'right', sortable: true, render: (r) => formatNumber(r.available) },
    { key: 'reserved', header: 'Reserved', align: 'right', render: (r) => formatNumber(r.reserved) },
    { key: 'locked', header: 'Locked', align: 'right', render: (r) => formatNumber(r.locked) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const chips = [
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
    status ? { id: 'status', label: `Status: ${status}` } : null,
    zone ? { id: 'zone', label: `Zone: ${zone}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Warehouse Inventory"
        subtitle="Location-level stock by warehouse, zone, rack, and bin."
        actions={<Link to="/inventory-dashboard"><QkButton variant="outline">Inventory dashboard</QkButton></Link>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Lines" value={filtered.length} />
        <QkMetric label="Available" value={formatNumber(filtered.reduce((s, i) => s + i.available, 0))} />
        <QkMetric label="Reserved" value={formatNumber(filtered.reduce((s, i) => s + i.reserved, 0))} />
        <QkMetric label="Locked" value={formatNumber(filtered.reduce((s, i) => s + i.locked, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, product, bin, batch..."
        filters={[
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              const next = new URLSearchParams(params)
              if (v) next.set('warehouse', v)
              else next.delete('warehouse')
              setParams(next)
              list.setPage(1)
            },
            options: warehouses.map((w) => ({ label: w.name, value: w.name })),
          },
          { id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Available', 'Low Stock', 'QC Hold', 'Expired', 'Damaged'].map((s) => ({ label: s, value: s })) },
          { id: 'zone', label: 'Zone', value: zone, onChange: setZone, options: zones.map((z) => ({ label: z, value: z })) },
        ]}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'warehouse') {
            const next = new URLSearchParams(params)
            next.delete('warehouse')
            setParams(next)
          }
          if (id === 'status') setStatus('')
          if (id === 'zone') setZone('')
        }}
        onClearAll={() => {
          setParams({})
          setStatus('')
          setZone('')
          list.setSearch('')
        }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as InventoryItem[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/inventory/${r.id}`)}
        emptyTitle="No warehouse inventory matched your filters."
      />
    </div>
  )
}
