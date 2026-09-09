import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton,
  QkDrawer,
  QkFilterBar,
  QkInput,
  QkMetric,
  QkSelect,
  QkStatusBadge,
  QkTable,
  type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, statusTone, uid } from '../../utils'
import type { Vendor } from '../../types'

const CATEGORIES = ['Dairy', 'Grocery', 'Produce', 'Frozen', 'Oil', 'Staples', 'Snacks', 'Beverages', 'Seafood']

interface VendorForm {
  name: string
  code: string
  contact: string
  email: string
  phone: string
  city: string
  status: Vendor['status']
  categories: string
  leadTimeDays: string
}

const emptyForm = (): VendorForm => ({
  name: '',
  code: '',
  contact: '',
  email: '',
  phone: '',
  city: '',
  status: 'Active',
  categories: '',
  leadTimeDays: '3',
})

export function VendorsPage() {
  const { vendors, setVendors } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [city, setCity] = useState('')
  const [open, setOpen] = useState(false)
  const [editing, setEditing] = useState<Vendor | null>(null)
  const [form, setForm] = useState<VendorForm>(emptyForm())
  const [errors, setErrors] = useState<Partial<Record<keyof VendorForm, string>>>({})

  const filtered = useMemo(() => {
    return vendors.filter((row) => {
      if (status && row.status !== status) return false
      if (city && row.city !== city) return false
      return true
    })
  }, [vendors, status, city])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'name',
    'code',
    'contact',
    'email',
    'city',
    'phone',
  ] as never)

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    city ? { id: 'city', label: `City: ${city}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  const openCreate = () => {
    setEditing(null)
    setForm(emptyForm())
    setErrors({})
    setOpen(true)
  }

  const openEdit = (vendor: Vendor) => {
    setEditing(vendor)
    setForm({
      name: vendor.name,
      code: vendor.code,
      contact: vendor.contact,
      email: vendor.email,
      phone: vendor.phone,
      city: vendor.city,
      status: vendor.status,
      categories: vendor.categories.join(', '),
      leadTimeDays: String(vendor.leadTimeDays),
    })
    setErrors({})
    setOpen(true)
  }

  const validate = () => {
    const next: Partial<Record<keyof VendorForm, string>> = {}
    if (!form.name.trim()) next.name = 'Name is required'
    if (!form.code.trim()) next.code = 'Code is required'
    if (!form.contact.trim()) next.contact = 'Contact is required'
    if (!form.email.trim() || !form.email.includes('@')) next.email = 'Valid email required'
    if (!form.phone.trim()) next.phone = 'Phone is required'
    if (!form.city.trim()) next.city = 'City is required'
    const lead = Number(form.leadTimeDays)
    if (!form.leadTimeDays || Number.isNaN(lead) || lead < 0) next.leadTimeDays = 'Enter lead time in days'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate()) return

    const categories = form.categories
      .split(',')
      .map((c) => c.trim())
      .filter(Boolean)

    if (editing) {
      setVendors((prev) =>
        prev.map((v) =>
          v.id === editing.id
            ? {
                ...v,
                name: form.name.trim(),
                code: form.code.trim(),
                contact: form.contact.trim(),
                email: form.email.trim(),
                phone: form.phone.trim(),
                city: form.city.trim(),
                status: form.status,
                categories: categories.length ? categories : v.categories,
                leadTimeDays: Number(form.leadTimeDays),
              }
            : v,
        ),
      )
      pushToast({ tone: 'success', title: 'Vendor updated', message: form.name.trim() })
    } else {
      const vendor: Vendor = {
        id: uid('v'),
        name: form.name.trim(),
        code: form.code.trim(),
        contact: form.contact.trim(),
        email: form.email.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        status: form.status,
        categories: categories.length ? categories : ['Grocery'],
        leadTimeDays: Number(form.leadTimeDays),
        createdAt: '2026-09-09',
      }
      setVendors((prev) => [vendor, ...prev])
      pushToast({ tone: 'success', title: 'Vendor created', message: vendor.name })
    }

    setOpen(false)
    setEditing(null)
    setForm(emptyForm())
  }

  const columns: QkColumn<Vendor>[] = [
    {
      key: 'code',
      header: 'Code',
      sortable: true,
      render: (r) => (
        <Link to={`/vendors/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>
          {r.code}
        </Link>
      ),
    },
    { key: 'name', header: 'Vendor', sortable: true },
    { key: 'contact', header: 'Contact', sortable: true },
    { key: 'city', header: 'City', sortable: true },
    { key: 'phone', header: 'Phone' },
    {
      key: 'categories',
      header: 'Categories',
      render: (r) => r.categories.join(', '),
    },
    { key: 'leadTimeDays', header: 'Lead (days)', align: 'right', sortable: true },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
    {
      key: 'actions',
      header: '',
      hideable: false,
      render: (r) => (
        <QkButton
          size="sm"
          variant="ghost"
          onClick={(e) => {
            e.stopPropagation()
            openEdit(r)
          }}
        >
          Edit
        </QkButton>
      ),
    },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Vendors"
        subtitle="Supplier master for procurement and inbound planning."
        actions={
          <QkButton leftIcon={<Plus size={14} />} onClick={openCreate}>
            Add vendor
          </QkButton>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Vendors" value={vendors.length} />
        <QkMetric label="Active" value={vendors.filter((v) => v.status === 'Active').length} />
        <QkMetric label="On hold" value={vendors.filter((v) => v.status === 'On Hold').length} />
        <QkMetric label="Inactive" value={vendors.filter((v) => v.status === 'Inactive').length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search vendor, code, contact..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: (v) => {
              setStatus(v)
              list.setPage(1)
            },
            options: ['Active', 'Inactive', 'On Hold'].map((s) => ({ label: s, value: s })),
          },
          {
            id: 'city',
            label: 'City',
            value: city,
            onChange: (v) => {
              setCity(v)
              list.setPage(1)
            },
            options: Array.from(new Set(vendors.map((v) => v.city))).map((c) => ({ label: c, value: c })),
          },
        ]}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'status') setStatus('')
          if (id === 'city') setCity('')
        }}
        onClearAll={() => {
          setStatus('')
          setCity('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as Vendor[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/vendors/${r.id}`)}
        storageKey="vendors"
        emptyTitle="No vendors matched your filters."
        emptyAction={
          <QkButton variant="outline" onClick={openCreate}>
            Add vendor
          </QkButton>
        }
      />

      <QkDrawer
        open={open}
        onClose={() => setOpen(false)}
        title={editing ? 'Edit vendor' : 'Add vendor'}
        subtitle={editing ? editing.code : 'Create a supplier master record'}
        width={460}
        footer={
          <>
            <QkButton variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </QkButton>
            {editing && (
              <QkButton variant="outline" onClick={() => navigate(`/vendors/${editing.id}`)}>
                Open details
              </QkButton>
            )}
            <QkButton type="submit" form="vendor-form">
              {editing ? 'Save changes' : 'Create vendor'}
            </QkButton>
          </>
        }
      >
        <form id="vendor-form" onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <QkInput
            label="Vendor name"
            required
            value={form.name}
            error={errors.name}
            onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
          />
          <QkInput
            label="Vendor code"
            required
            value={form.code}
            error={errors.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
          />
          <QkInput
            label="Contact person"
            required
            value={form.contact}
            error={errors.contact}
            onChange={(e) => setForm((f) => ({ ...f, contact: e.target.value }))}
          />
          <QkInput
            label="Email"
            required
            type="email"
            value={form.email}
            error={errors.email}
            onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
          />
          <QkInput
            label="Phone"
            required
            value={form.phone}
            error={errors.phone}
            onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
          />
          <QkInput
            label="City"
            required
            value={form.city}
            error={errors.city}
            onChange={(e) => setForm((f) => ({ ...f, city: e.target.value }))}
          />
          <QkSelect
            label="Status"
            value={form.status}
            options={[
              { label: 'Active', value: 'Active' },
              { label: 'Inactive', value: 'Inactive' },
              { label: 'On Hold', value: 'On Hold' },
            ]}
            onChange={(e) => setForm((f) => ({ ...f, status: e.target.value as Vendor['status'] }))}
          />
          <QkInput
            label="Categories"
            hint={`Comma-separated. e.g. ${CATEGORIES.slice(0, 3).join(', ')}`}
            value={form.categories}
            onChange={(e) => setForm((f) => ({ ...f, categories: e.target.value }))}
          />
          <QkInput
            label="Lead time (days)"
            required
            type="number"
            min={0}
            value={form.leadTimeDays}
            error={errors.leadTimeDays}
            onChange={(e) => setForm((f) => ({ ...f, leadTimeDays: e.target.value }))}
          />
        </form>
      </QkDrawer>
    </div>
  )
}
