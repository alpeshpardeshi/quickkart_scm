import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, statusTone } from '../../utils'
import type { DispatchRecord } from '../../types'

export function DispatchPage() {
  const { dispatches, setDispatches } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<DispatchRecord | null>(null)
  const [vehicle, setVehicle] = useState('')
  const [driver, setDriver] = useState('')

  const filtered = useMemo(() => dispatches.filter((d) => !status || d.status === status), [dispatches, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['dispatchNo', 'soNumber', 'customer', 'warehouse'] as never)

  const open = (row: DispatchRecord) => {
    navigate(`/dispatch/${row.id}`)
  }

  const updateStatus = (next: DispatchRecord['status']) => {
    if (!selected) return
    if ((next === 'Ready' || next === 'Handed Over') && (!vehicle.trim() || !driver.trim())) {
      pushToast({ tone: 'warning', title: 'Missing details', message: 'Vehicle and driver are required' })
      return
    }
    setDispatches((prev) =>
      prev.map((d) =>
        d.id === selected.id
          ? {
              ...d,
              status: next,
              vehicle: vehicle.trim() || d.vehicle,
              driver: driver.trim() || d.driver,
              dispatchedAt: next === 'Handed Over' || next === 'In Transit' ? new Date().toISOString() : d.dispatchedAt,
            }
          : d,
      ),
    )
    pushToast({ tone: 'success', title: 'Dispatch updated', message: `${selected.dispatchNo} → ${next}` })
    setSelected(null)
  }

  const columns: QkColumn<DispatchRecord>[] = [
    { key: 'dispatchNo', header: 'Dispatch', sortable: true, render: (r) => <Link to={`/dispatch/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.dispatchNo}</Link> },
    { key: 'soNumber', header: 'SO', sortable: true },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'items', header: 'Items', align: 'right' },
    { key: 'vehicle', header: 'Vehicle' },
    { key: 'driver', header: 'Driver' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Dispatch" subtitle="Verification, handover, and outbound status." />
      <div className="qk-grid-metrics">
        <QkMetric label="Queued" value={dispatches.filter((d) => d.status === 'Queued').length} />
        <QkMetric label="Verifying" value={dispatches.filter((d) => d.status === 'Verifying').length} />
        <QkMetric label="Ready" value={dispatches.filter((d) => d.status === 'Ready').length} />
        <QkMetric label="Handed over" value={dispatches.filter((d) => d.status === 'Handed Over').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search dispatch, SO, customer..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Queued', 'Verifying', 'Ready', 'Handed Over', 'In Transit'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable columns={columns} rows={list.rows as unknown as DispatchRecord[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={open} emptyTitle="No dispatches matched your filters." />
      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.dispatchNo || 'Dispatch'}
        subtitle={selected ? `${selected.soNumber} · ${selected.customer}` : undefined}
        footer={
          selected ? (
            <>
              <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
              {selected.status === 'Queued' && <QkButton onClick={() => updateStatus('Verifying')}>Start verification</QkButton>}
              {selected.status === 'Verifying' && <QkButton onClick={() => updateStatus('Ready')}>Mark ready</QkButton>}
              {(selected.status === 'Ready' || selected.status === 'Verifying') && <QkButton onClick={() => updateStatus('Handed Over')}>Confirm handover</QkButton>}
            </>
          ) : null
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row label="Warehouse" value={selected.warehouse} />
            <Row label="Items" value={String(selected.items)} />
            <Row label="Status" value={selected.status} />
            <Row label="Dispatched" value={formatDateTime(selected.dispatchedAt)} />
            <QkInput label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="MH-02-AB-4412" />
            <QkInput label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} placeholder="Driver name" />
          </div>
        )}
      </QkDrawer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
