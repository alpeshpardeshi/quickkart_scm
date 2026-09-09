import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, statusTone, uid } from '../../utils'
import type { AppUser } from '../../types'

export function UsersPage() {
  const { users, setUsers, warehouses, roles } = useData()
  const { pushToast } = useToast()
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<AppUser | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [role, setRole] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [userStatus, setUserStatus] = useState<AppUser['status']>('Active')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => users.filter((u) => !status || u.status === status), [users, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['name', 'email', 'role', 'warehouse'] as never)

  const openCreate = () => {
    setEditing(null)
    setName(''); setEmail(''); setRole(roles[1]?.name || 'Warehouse Operator'); setWarehouse(warehouses[0]?.name || ''); setUserStatus('Invited')
    setErrors({}); setOpen(true)
  }

  const openEdit = (u: AppUser) => {
    setEditing(u)
    setName(u.name); setEmail(u.email); setRole(u.role); setWarehouse(u.warehouse); setUserStatus(u.status)
    setErrors({}); setOpen(true)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Name is required'
    if (!email.trim()) next.email = 'Email is required'
    if (!role) next.role = 'Select role'
    setErrors(next)
    if (Object.keys(next).length) return
    const payload: AppUser = {
      id: editing?.id || uid('u'),
      name: name.trim(),
      email: email.trim(),
      role,
      warehouse,
      status: userStatus,
      lastActive: editing?.lastActive || '',
    }
    setUsers((prev) => (editing ? prev.map((u) => (u.id === editing.id ? payload : u)) : [payload, ...prev]))
    pushToast({ tone: 'success', title: editing ? 'User updated' : 'User invited', message: payload.email })
    setOpen(false)
  }

  const columns: QkColumn<AppUser>[] = [
    { key: 'name', header: 'Name', sortable: true, render: (r) => <strong>{r.name}</strong> },
    { key: 'email', header: 'Email', sortable: true },
    { key: 'role', header: 'Role' },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'lastActive', header: 'Last active', render: (r) => formatDateTime(r.lastActive) },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Users" subtitle="Warehouse and office access accounts." actions={<QkButton leftIcon={<Plus size={14} />} onClick={openCreate}>Invite user</QkButton>} />
      <div className="qk-grid-metrics">
        <QkMetric label="Users" value={users.length} />
        <QkMetric label="Active" value={users.filter((u) => u.status === 'Active').length} />
        <QkMetric label="Invited" value={users.filter((u) => u.status === 'Invited').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search name, email, role..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Active', 'Inactive', 'Invited'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable columns={columns} rows={list.rows as unknown as AppUser[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} onRowClick={openEdit} emptyTitle="No users matched your filters." />
      <QkDrawer open={open} onClose={() => setOpen(false)} title={editing ? 'Edit user' : 'Invite user'} footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={save}>Save</QkButton></>}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkInput label="Name" required value={name} error={errors.name} onChange={(e) => setName(e.target.value)} />
          <QkInput label="Email" required value={email} error={errors.email} onChange={(e) => setEmail(e.target.value)} />
          <QkSelect label="Role" required value={role} error={errors.role} options={roles.map((r) => ({ label: r.name, value: r.name }))} onChange={(e) => setRole(e.target.value)} />
          <QkSelect label="Warehouse" value={warehouse} options={warehouses.map((w) => ({ label: w.name, value: w.name }))} onChange={(e) => setWarehouse(e.target.value)} />
          <QkSelect label="Status" value={userStatus} options={['Active', 'Inactive', 'Invited'].map((s) => ({ label: s, value: s }))} onChange={(e) => setUserStatus(e.target.value as AppUser['status'])} />
        </form>
      </QkDrawer>
    </div>
  )
}
