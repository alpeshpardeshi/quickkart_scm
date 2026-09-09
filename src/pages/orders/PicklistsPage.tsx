import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkMetric, QkSelect, QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, statusTone, uid } from '../../utils'
import type { Picklist } from '../../types'

export function PicklistsPage() {
  const { picklists, setPicklists, salesOrders, setSalesOrders } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [soId, setSoId] = useState('')
  const [error, setError] = useState('')

  const eligible = salesOrders.filter((s) => ['Reserved', 'Confirmed', 'Picking'].includes(s.status))
  const filtered = useMemo(() => picklists.filter((p) => !status || p.status === status), [picklists, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['picklistNo', 'soNumber', 'warehouse', 'assignedTo'] as never)

  const generate = () => {
    if (!soId) {
      setError('Select a sales order')
      return
    }
    const so = salesOrders.find((s) => s.id === soId)!
    const pl: Picklist = {
      id: uid('pl'),
      picklistNo: `PL-${10230 + picklists.length + 1}`,
      soId: so.id,
      soNumber: so.soNumber,
      warehouseId: so.warehouseId,
      warehouse: so.warehouse,
      items: so.itemCount,
      picked: 0,
      status: 'Open',
      assignedTo: 'Suresh Yadav',
      priority: 'High',
      createdAt: new Date().toISOString(),
      lines: [],
    }
    setPicklists((prev) => [pl, ...prev])
    setSalesOrders((prev) => prev.map((s) => (s.id === soId ? { ...s, status: 'Picking' } : s)))
    pushToast({ tone: 'success', title: 'Picklist generated', message: pl.picklistNo })
    setOpen(false)
  }

  const columns: QkColumn<Picklist>[] = [
    { key: 'picklistNo', header: 'Picklist', sortable: true, render: (r) => <Link to={`/picklists/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.picklistNo}</Link> },
    { key: 'soNumber', header: 'SO', sortable: true, render: (r) => <Link to={`/sales-orders/${r.soId}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.soNumber}</Link> },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'items', header: 'Items', align: 'right' },
    { key: 'picked', header: 'Picked', align: 'right' },
    { key: 'priority', header: 'Priority', render: (r) => <QkStatusBadge label={r.priority} tone={statusTone(r.priority)} /> },
    { key: 'assignedTo', header: 'Assigned' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDateTime(r.createdAt) },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Picklists" subtitle="Wave and order-based pick work." actions={
        <>
          <Link to="/my-picking"><QkButton variant="outline">My tasks</QkButton></Link>
          <QkButton leftIcon={<Plus size={14} />} onClick={() => { setOpen(true); setSoId(''); setError('') }}>Generate picklist</QkButton>
        </>
      } />
      <div className="qk-grid-metrics">
        <QkMetric label="Open" value={picklists.filter((p) => p.status === 'Open').length} />
        <QkMetric label="In progress" value={picklists.filter((p) => p.status === 'In Progress').length} />
        <QkMetric label="Completed" value={picklists.filter((p) => p.status === 'Completed').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search picklist, SO..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Open', 'In Progress', 'Completed', 'Cancelled'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable columns={columns} rows={list.rows as unknown as Picklist[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={(r) => navigate(`/picklists/${r.id}`)} emptyTitle="No picklists matched your filters." />
      <QkDrawer open={open} onClose={() => setOpen(false)} title="Generate picklist" footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={generate}>Generate</QkButton></>}>
        <QkSelect label="Sales order" required value={soId} error={error} placeholder="Select order" options={eligible.map((s) => ({ label: `${s.soNumber} · ${s.customer}`, value: s.id }))} onChange={(e) => setSoId(e.target.value)} />
      </QkDrawer>
    </div>
  )
}
