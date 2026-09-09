import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatNumber, statusTone } from '../../utils'
import type { Warehouse } from '../../types'

export function WarehousesPage() {
  const { warehouses } = useData()
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')

  const filtered = useMemo(
    () => warehouses.filter((w) => (!status || w.status === status) && (!city || w.city === city)),
    [warehouses, status, city],
  )
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['name', 'code', 'city', 'manager'] as never)

  const columns: QkColumn<Warehouse>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (r) => <strong style={{ color: 'var(--qk-primary)' }}>{r.code}</strong> },
    { key: 'name', header: 'Warehouse', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'manager', header: 'Manager' },
    { key: 'zones', header: 'Zones', align: 'right' },
    { key: 'capacity', header: 'Capacity', align: 'right', render: (r) => formatNumber(r.capacity) },
    {
      key: 'utilization',
      header: 'Utilization',
      width: 160,
      render: (r) => (
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 120 }}>
          <div style={{ flex: 1, height: 6, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden' }}>
            <div style={{ width: `${r.utilization}%`, height: '100%', background: r.utilization > 80 ? 'var(--qk-warning)' : 'var(--qk-primary)' }} />
          </div>
          <span style={{ fontSize: 12, width: 32 }}>{r.utilization}%</span>
        </div>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    city ? { id: 'city', label: `City: ${city}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Warehouses" subtitle="Network capacity and utilization across sites." />
      <div className="qk-grid-metrics">
        <QkMetric label="Sites" value={warehouses.length} />
        <QkMetric label="Active" value={warehouses.filter((w) => w.status === 'Active').length} />
        <QkMetric label="Total capacity" value={formatNumber(warehouses.reduce((s, w) => s + w.capacity, 0))} />
        <QkMetric label="Avg utilization" value={`${Math.round(warehouses.reduce((s, w) => s + w.utilization, 0) / warehouses.length)}%`} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search warehouse, code, manager..."
        filters={[
          { id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Active', 'Inactive', 'Maintenance'].map((s) => ({ label: s, value: s })) },
          { id: 'city', label: 'City', value: city, onChange: setCity, options: Array.from(new Set(warehouses.map((w) => w.city))).map((c) => ({ label: c, value: c })) },
        ]}
        chips={chips}
        onRemoveChip={(id) => { if (id === 'status') setStatus(''); if (id === 'city') setCity('') }}
        onClearAll={() => { setStatus(''); setCity(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as Warehouse[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No warehouses matched your filters."
      />
    </div>
  )
}
