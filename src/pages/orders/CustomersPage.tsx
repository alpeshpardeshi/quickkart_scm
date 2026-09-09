import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, statusTone, uid } from '../../utils'
import type { Customer } from '../../types'

interface FormState {
  name: string
  code: string
  contact: string
  email: string
  phone: string
  city: string
  type: Customer['type']
  status: Customer['status']
  creditLimit: string
}

const empty = (): FormState => ({
  name: '', code: '', contact: '', email: '', phone: '', city: '',
  type: 'Retail', status: 'Active', creditLimit: '100000',
})

export function CustomersPage() {
  const { customers, setCustomers } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Customer | null>(null)
  const [form, setForm] = useState<FormState>(empty())
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const filtered = useMemo(() => customers.filter((c) => !status || c.status === status), [customers, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['name', 'code', 'contact', 'email', 'city'] as never)

  const openCreate = () => { setEditing(null); setForm(empty()); setErrors({}); setOpen(true) }
  const openEdit = (c: Customer) => {
    setEditing(c)
    setForm({
      name: c.name, code: c.code, contact: c.contact, email: c.email, phone: c.phone,
      city: c.city, type: c.type, status: c.status, creditLimit: String(c.creditLimit),
    })
    setErrors({})
    setOpen(true)
  }

  const save = (e: FormEvent) => {
    e.preventDefault()
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.code.trim()) next.code = 'Code is required'
    if (!form.email.trim()) next.email = 'Email is required'
    if (!form.contact.trim()) next.contact = 'Contact is required'
    if (!form.creditLimit || Number(form.creditLimit) < 0) next.creditLimit = 'Enter a valid credit limit'
    setErrors(next)
    if (Object.keys(next).length) return

    const payload: Customer = {
      id: editing?.id || uid('c'),
      name: form.name.trim(),
      code: form.code.trim(),
      contact: form.contact.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim() || 'Mumbai',
      type: form.type,
      status: form.status,
      creditLimit: Number(form.creditLimit),
    }
    setCustomers((prev) => (editing ? prev.map((c) => (c.id === editing.id ? payload : c)) : [payload, ...prev]))
    pushToast({ tone: 'success', title: editing ? 'Customer updated' : 'Customer created', message: payload.name })
    setOpen(false)
  }

  const columns: QkColumn<Customer>[] = [
    { key: 'code', header: 'Code', sortable: true, render: (r) => <Link to={`/customers/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.code}</Link> },
    { key: 'name', header: 'Customer', sortable: true },
    { key: 'contact', header: 'Contact' },
    { key: 'city', header: 'City', sortable: true },
    { key: 'type', header: 'Type' },
    { key: 'creditLimit', header: 'Credit limit', align: 'right', render: (r) => formatCurrency(r.creditLimit) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Customers" subtitle="Retail, wholesale, and distributor accounts." actions={
          <>
            <QkButton variant="outline" onClick={() => {
              const first = customers[0]
              if (first) openEdit(first)
            }}>Quick edit</QkButton>
            <QkButton leftIcon={<Plus size={14} />} onClick={openCreate}>Add customer</QkButton>
          </>
        } />
      <div className="qk-grid-metrics">
        <QkMetric label="Customers" value={customers.length} />
        <QkMetric label="Active" value={customers.filter((c) => c.status === 'Active').length} />
        <QkMetric label="Wholesale" value={customers.filter((c) => c.type === 'Wholesale').length} />
        <QkMetric label="Distributors" value={customers.filter((c) => c.type === 'Distributor').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search customer, code, contact..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Active', 'Inactive'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as Customer[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/customers/${r.id}`)}
        emptyTitle="No customers matched your filters."
      />
      <QkDrawer open={open} onClose={() => setOpen(false)} title={editing ? 'Edit customer' : 'Create customer'} footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={save}>Save</QkButton></>}>
        <form onSubmit={save} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkInput label="Name" required value={form.name} error={errors.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
          <QkInput label="Code" required value={form.code} error={errors.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
          <QkInput label="Contact" required value={form.contact} error={errors.contact} onChange={(e) => setForm({ ...form, contact: e.target.value })} />
          <QkInput label="Email" required value={form.email} error={errors.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <QkInput label="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <QkInput label="City" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} />
          <QkSelect label="Type" value={form.type} options={['Retail', 'Wholesale', 'Distributor'].map((t) => ({ label: t, value: t }))} onChange={(e) => setForm({ ...form, type: e.target.value as Customer['type'] })} />
          <QkSelect label="Status" value={form.status} options={['Active', 'Inactive'].map((t) => ({ label: t, value: t }))} onChange={(e) => setForm({ ...form, status: e.target.value as Customer['status'] })} />
          <QkInput label="Credit limit" type="number" value={form.creditLimit} error={errors.creditLimit} onChange={(e) => setForm({ ...form, creditLimit: e.target.value })} />
        </form>
      </QkDrawer>
    </div>
  )
}
