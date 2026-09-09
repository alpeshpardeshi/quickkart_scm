import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, statusTone, uid } from '../../utils'
import type { Task } from '../../types'

export function TasksPage() {
  const { tasks, setTasks, warehouses, users } = useData()
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [status, setStatus] = useState('')
  const [mine, setMine] = useState(false)
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<Task | null>(null)
  const [title, setTitle] = useState('')
  const [type, setType] = useState<Task['type']>('General')
  const [warehouse, setWarehouse] = useState('')
  const [priority, setPriority] = useState<Task['priority']>('Medium')
  const [assignedTo, setAssignedTo] = useState('')
  const [due, setDue] = useState('2026-09-12')
  const [description, setDescription] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => {
    return tasks.filter((t) => {
      if (status && t.status !== status) return false
      if (mine && t.assignedTo !== user?.name) return false
      return true
    })
  }, [tasks, status, mine, user])

  const list = useListState(filtered as unknown as Record<string, unknown>[], ['title', 'type', 'warehouse', 'assignedTo', 'location'] as never)

  const create = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!title.trim()) next.title = 'Title is required'
    if (!warehouse) next.warehouse = 'Select warehouse'
    if (!assignedTo) next.assignedTo = 'Assign an owner'
    setErrors(next)
    if (Object.keys(next).length) return
    const task: Task = {
      id: uid('t'),
      taskNumber: `TSK-${9000 + tasks.length + 1}`,
      title: title.trim(),
      type,
      warehouse,
      location: 'General',
      priority,
      status: 'Pending',
      due,
      assignedTo,
      createdBy: user?.name || 'System',
      createdAt: '2026-09-09',
      description: description.trim(),
    }
    setTasks((prev) => [task, ...prev])
    pushToast({ tone: 'success', title: 'Task created', message: task.title })
    setOpen(false)
  }

  const setTaskStatus = (task: Task, nextStatus: Task['status']) => {
    setTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, status: nextStatus } : t)))
    pushToast({ tone: 'success', title: 'Task updated', message: `${task.title} → ${nextStatus}` })
    setSelected(null)
  }

  const columns: QkColumn<Task>[] = [
    { key: 'title', header: 'Task', sortable: true, mobile: 'title', render: (r) => <strong>{r.title}</strong> },
    { key: 'type', header: 'Type', mobile: 'meta' },
    { key: 'warehouse', header: 'Warehouse', mobile: 'field' },
    { key: 'location', header: 'Location' },
    { key: 'priority', header: 'Priority', mobile: 'meta', render: (r) => <QkStatusBadge label={r.priority} tone={statusTone(r.priority)} /> },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'due', header: 'Due', sortable: true, mobile: 'field', render: (r) => formatDate(r.due) },
    { key: 'assignedTo', header: 'Assigned to', sortable: true, mobile: 'subtitle' },
  ]

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    mine ? { id: 'mine', label: 'My tasks' } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Tasks"
        subtitle="Operational work across receiving, QC, picking, and audits."
        actions={
          <>
            <QkButton variant={mine ? 'secondary' : 'outline'} onClick={() => setMine((v) => !v)}>My tasks</QkButton>
            <QkButton leftIcon={<Plus size={14} />} onClick={() => { setOpen(true); setErrors({}); setTitle(''); setWarehouse(''); setAssignedTo(''); setDescription('') }}>Create task</QkButton>
          </>
        }
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Pending" value={tasks.filter((t) => t.status === 'Pending').length} />
        <QkMetric label="In progress" value={tasks.filter((t) => t.status === 'In Progress').length} />
        <QkMetric label="On hold" value={tasks.filter((t) => t.status === 'On Hold').length} />
        <QkMetric label="Completed" value={tasks.filter((t) => t.status === 'Completed').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search task, type, assignee..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Pending', 'Assigned', 'In Progress', 'On Hold', 'Completed', 'Cancelled'].map((s) => ({ label: s, value: s })) }]}
        chips={chips}
        onRemoveChip={(id) => { if (id === 'status') setStatus(''); if (id === 'mine') setMine(false) }}
        onClearAll={() => { setStatus(''); setMine(false); list.setSearch('') }}
      />
      <QkTable mobileMode="cards" columns={columns} rows={list.rows as unknown as Task[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={setSelected} emptyTitle="No tasks matched your filters." />

      <QkDrawer open={open} onClose={() => setOpen(false)} title="Create task" footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={create}>Create</QkButton></>}>
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkInput label="Title" required value={title} error={errors.title} onChange={(e) => setTitle(e.target.value)} />
          <QkSelect label="Type" value={type} options={['Receiving', 'QC', 'Put-Away', 'Picking', 'Dispatch', 'Audit', 'General'].map((t) => ({ label: t, value: t }))} onChange={(e) => setType(e.target.value as Task['type'])} />
          <QkSelect label="Warehouse" required value={warehouse} error={errors.warehouse} placeholder="Select warehouse" options={warehouses.map((w) => ({ label: w.name, value: w.name }))} onChange={(e) => setWarehouse(e.target.value)} />
          <QkSelect label="Priority" value={priority} options={['Low', 'Medium', 'High', 'Urgent'].map((p) => ({ label: p, value: p }))} onChange={(e) => setPriority(e.target.value as Task['priority'])} />
          <QkSelect label="Assign to" required value={assignedTo} error={errors.assignedTo} placeholder="Select user" options={users.map((u) => ({ label: u.name, value: u.name }))} onChange={(e) => setAssignedTo(e.target.value)} />
          <QkInput label="Due date" type="date" value={due} onChange={(e) => setDue(e.target.value)} />
          <QkInput label="Description" value={description} onChange={(e) => setDescription(e.target.value)} />
        </form>
      </QkDrawer>

      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.title || 'Task'}
        subtitle={selected ? `${selected.type} · ${selected.warehouse}` : undefined}
        footer={
          selected ? (
            <>
              <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
              {selected.status === 'Pending' && <QkButton onClick={() => setTaskStatus(selected, 'In Progress')}>Start</QkButton>}
              {selected.status === 'In Progress' && <QkButton variant="outline" onClick={() => setTaskStatus(selected, 'On Hold')}>Raise concern</QkButton>}
              {selected.status !== 'Completed' && <QkButton onClick={() => setTaskStatus(selected, 'Completed')}>Complete</QkButton>}
            </>
          ) : null
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            <Row label="Priority" value={selected.priority} />
            <Row label="Status" value={selected.status} />
            <Row label="Due" value={formatDate(selected.due)} />
            <Row label="Assigned to" value={selected.assignedTo} />
            <Row label="Location" value={selected.location} />
            <Row label="Created by" value={selected.createdBy} />
            <div>
              <div className="qk-secondary" style={{ marginBottom: 4 }}>Description</div>
              <div>{selected.description || '—'}</div>
            </div>
          </div>
        )}
      </QkDrawer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
