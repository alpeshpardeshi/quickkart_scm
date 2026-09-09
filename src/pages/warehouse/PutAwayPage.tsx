import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatNumber, statusTone } from '../../utils'
import type { PutAwayTask } from '../../types'

const LOCATION_OPTIONS = [
  'A-R12-S3-B04', 'A-R14-S2-B08', 'B-R04-S1-B12', 'C-R08-S2-B07',
  'D-R02-S4-B01', 'E-R01-S1-B03', 'F-R03-S1-B02',
]

export function PutAwayPage() {
  const { putAwayTasks, setPutAwayTasks } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<PutAwayTask | null>(null)
  const [destination, setDestination] = useState('')
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  const filtered = useMemo(() => putAwayTasks.filter((t) => !status || t.status === status), [putAwayTasks, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['product', 'sku', 'batch', 'warehouse', 'assignedTo'] as never)

  const openTask = (task: PutAwayTask) => {
    navigate(`/put-away/${task.id}`)
  }

  const confirm = async () => {
    if (!selected) return
    if (!destination.trim()) {
      setError('Select a destination bin')
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))
    setPutAwayTasks((prev) =>
      prev.map((t) =>
        t.id === selected.id
          ? { ...t, destinationBin: destination, status: 'Completed' }
          : t,
      ),
    )
    setSaving(false)
    pushToast({ tone: 'success', title: 'Put-away confirmed', message: `${selected.sku} → ${destination}` })
    setSelected(null)
  }

  const columns: QkColumn<PutAwayTask>[] = [
    { key: 'sku', header: 'SKU', sortable: true, mobile: 'title', render: (r) => <Link to={`/put-away/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.sku}</Link> },
    { key: 'product', header: 'Product', sortable: true, mobile: 'subtitle' },
    { key: 'batch', header: 'Batch' },
    { key: 'quantity', header: 'Qty', align: 'right', mobile: 'field', render: (r) => formatNumber(r.quantity) },
    { key: 'currentLocation', header: 'Current' },
    { key: 'suggestedLocation', header: 'Suggested', mobile: 'meta' },
    { key: 'warehouse', header: 'Warehouse', mobile: 'meta' },
    { key: 'assignedTo', header: 'Assigned', mobile: 'field' },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Put-Away" subtitle="Move accepted stock from dock/QC into storage locations." />
      <div className="qk-grid-metrics">
        <QkMetric label="Queued" value={putAwayTasks.filter((t) => t.status === 'Queued').length} />
        <QkMetric label="In progress" value={putAwayTasks.filter((t) => t.status === 'In Progress').length} />
        <QkMetric label="Completed" value={putAwayTasks.filter((t) => t.status === 'Completed').length} />
        <QkMetric label="Units pending" value={formatNumber(putAwayTasks.filter((t) => t.status !== 'Completed').reduce((s, t) => s + t.quantity, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, batch, assignee..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Queued', 'In Progress', 'Completed'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable
        mobileMode="cards"
        columns={columns}
        rows={list.rows as unknown as PutAwayTask[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={openTask}
        emptyTitle="No put-away tasks matched your filters."
      />

      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title="Put-away details"
        subtitle={selected ? `${selected.product} · ${selected.batch}` : undefined}
        footer={
          selected?.status !== 'Completed' ? (
            <>
              <Link to={selected ? `/put-away/${selected.id}` : '/put-away'}><QkButton variant="outline">Full page</QkButton></Link>
              <QkButton variant="outline" onClick={() => setSelected(null)}>Cancel</QkButton>
              <QkButton loading={saving} onClick={confirm}>Confirm put-away</QkButton>
            </>
          ) : (
            <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
          )
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Info label="SKU" value={selected.sku} />
            <Info label="Quantity" value={formatNumber(selected.quantity)} />
            <Info label="Current location" value={selected.currentLocation} />
            <div
              style={{
                padding: 12,
                borderRadius: 6,
                border: '1px solid var(--qk-border)',
                background: 'var(--qk-primary-soft)',
              }}
            >
              <div style={{ fontSize: 11, color: 'var(--qk-text-secondary)', marginBottom: 4 }}>Suggested location</div>
              <div style={{ fontWeight: 650, color: 'var(--qk-primary)' }}>{selected.suggestedLocation}</div>
            </div>
            {selected.status !== 'Completed' ? (
              <>
                <QkSelect
                  label="Destination bin"
                  value={destination}
                  error={error}
                  options={LOCATION_OPTIONS.map((l) => ({ label: l, value: l }))}
                  onChange={(e) => setDestination(e.target.value)}
                />
                <QkInput label="Or enter bin" value={destination} onChange={(e) => setDestination(e.target.value)} />
              </>
            ) : (
              <Info label="Destination bin" value={selected.destinationBin || '—'} />
            )}
          </div>
        )}
      </QkDrawer>
    </div>
  )
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
