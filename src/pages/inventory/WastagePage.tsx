import { useMemo, useState, type FormEvent } from 'react'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton,
  QkDrawer,
  QkFilterBar,
  QkInput,
  QkMetric,
  QkSelect,
  QkTable,
  type QkColumn,
} from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, formatNumber, uid } from '../../utils'
import type { WastageRecord } from '../../types'

const REASONS = ['Expired', 'Damaged during handling', 'Temperature abuse', 'Quality rejection', 'Spillage', 'Other']

interface WastageForm {
  sku: string
  batch: string
  qty: string
  reason: string
  warehouse: string
}

const emptyForm: WastageForm = { sku: '', batch: '', qty: '', reason: '', warehouse: '' }

export function WastagePage() {
  const { wastage, setWastage, products, batches, warehouses, inventory, setInventory } = useData()
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [warehouse, setWarehouse] = useState('')
  const [open, setOpen] = useState(false)
  const [form, setForm] = useState<WastageForm>(emptyForm)
  const [errors, setErrors] = useState<Partial<Record<keyof WastageForm, string>>>({})

  const filtered = useMemo(() => {
    return wastage.filter((row) => {
      if (warehouse && row.warehouse !== warehouse) return false
      return true
    })
  }, [wastage, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'sku',
    'product',
    'batch',
    'reason',
    'warehouse',
    'recordedBy',
  ] as never)

  const chips = warehouse ? [{ id: 'warehouse', label: `Warehouse: ${warehouse}` }] : []

  const product = products.find((p) => p.sku === form.sku)
  const batchOptions = batches
    .filter((b) => !form.sku || b.sku === form.sku)
    .map((b) => ({ label: `${b.batchNo} · ${b.warehouse}`, value: b.batchNo }))

  const columns: QkColumn<WastageRecord>[] = [
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'batch', header: 'Batch', sortable: true },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, render: (r) => formatNumber(r.qty) },
    { key: 'reason', header: 'Reason' },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    { key: 'value', header: 'Value', align: 'right', sortable: true, render: (r) => formatCurrency(r.value) },
    { key: 'recordedBy', header: 'By' },
    { key: 'recordedAt', header: 'Date', sortable: true, render: (r) => formatDate(r.recordedAt) },
  ]

  const validate = () => {
    const next: Partial<Record<keyof WastageForm, string>> = {}
    if (!form.sku) next.sku = 'Select a SKU'
    if (!form.batch) next.batch = 'Select a batch'
    if (!form.warehouse) next.warehouse = 'Select a warehouse'
    if (!form.reason) next.reason = 'Select a reason'
    const qty = Number(form.qty)
    if (!form.qty || Number.isNaN(qty) || qty <= 0) next.qty = 'Enter a positive quantity'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !product) return

    const qty = Number(form.qty)
    const value = qty * product.unitPrice
    const record: WastageRecord = {
      id: uid('wst'),
      sku: form.sku,
      product: product.name,
      batch: form.batch,
      qty,
      reason: form.reason,
      warehouse: form.warehouse,
      recordedBy: user?.name ?? 'Ankit Verma',
      recordedAt: '2026-09-09',
      value,
    }

    setWastage((prev) => [record, ...prev])
    setInventory((prev) =>
      prev.map((item) => {
        if (item.sku !== form.sku || item.batch !== form.batch || item.warehouse !== form.warehouse) return item
        return {
          ...item,
          available: Math.max(0, item.available - qty),
          expired: item.expired + (form.reason === 'Expired' ? qty : 0),
          damaged: item.damaged + (form.reason.includes('Damaged') ? qty : 0),
        }
      }),
    )

    pushToast({ tone: 'success', title: 'Wastage recorded', message: `${qty} units of ${product.name} written off.` })
    setOpen(false)
    setForm(emptyForm)
    setErrors({})
  }

  const totalValue = wastage.reduce((s, w) => s + w.value, 0)

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Wastage"
        subtitle="Write-offs for expired, damaged, and rejected stock."
        actions={
          <QkButton
            leftIcon={<Plus size={14} />}
            onClick={() => {
              setForm(emptyForm)
              setErrors({})
              setOpen(true)
            }}
          >
            Record wastage
          </QkButton>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Records" value={wastage.length} />
        <QkMetric label="Units written off" value={formatNumber(wastage.reduce((s, w) => s + w.qty, 0))} />
        <QkMetric label="Total value" value={formatCurrency(totalValue)} />
        <QkMetric label="This month" value={wastage.filter((w) => w.recordedAt.startsWith('2026-09')).length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, product, batch, reason..."
        filters={[
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              setWarehouse(v)
              list.setPage(1)
            },
            options: Array.from(new Set(wastage.map((w) => w.warehouse).concat(warehouses.map((w) => w.name)))).map(
              (w) => ({ label: w, value: w }),
            ),
          },
        ]}
        chips={chips}
        onRemoveChip={() => setWarehouse('')}
        onClearAll={() => {
          setWarehouse('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as WastageRecord[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No wastage records found."
        emptyDescription="Record write-offs for expired or damaged inventory."
        emptyAction={
          <QkButton variant="outline" onClick={() => setOpen(true)}>
            Record wastage
          </QkButton>
        }
      />

      <QkDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Record wastage"
        subtitle="Deduct stock and log write-off value."
        footer={
          <>
            <QkButton variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </QkButton>
            <QkButton type="submit" form="wastage-form">
              Save wastage
            </QkButton>
          </>
        }
      >
        <form id="wastage-form" onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
          <QkSelect
            label="SKU"
            required
            placeholder="Select SKU"
            value={form.sku}
            error={errors.sku}
            options={products.map((p) => ({ label: `${p.sku} · ${p.name}`, value: p.sku }))}
            onChange={(e) => {
              const sku = e.target.value
              const inv = inventory.find((i) => i.sku === sku)
              setForm((f) => ({
                ...f,
                sku,
                batch: '',
                warehouse: inv?.warehouse ?? f.warehouse,
              }))
            }}
          />
          <QkSelect
            label="Batch"
            required
            placeholder="Select batch"
            value={form.batch}
            error={errors.batch}
            options={batchOptions}
            onChange={(e) => {
              const batchNo = e.target.value
              const b = batches.find((x) => x.batchNo === batchNo)
              setForm((f) => ({ ...f, batch: batchNo, warehouse: b?.warehouse ?? f.warehouse }))
            }}
          />
          <QkSelect
            label="Warehouse"
            required
            placeholder="Select warehouse"
            value={form.warehouse}
            error={errors.warehouse}
            options={warehouses.map((w) => ({ label: w.name, value: w.name }))}
            onChange={(e) => setForm((f) => ({ ...f, warehouse: e.target.value }))}
          />
          <QkInput
            label="Quantity"
            required
            type="number"
            min={1}
            value={form.qty}
            error={errors.qty}
            onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
          />
          <QkSelect
            label="Reason"
            required
            placeholder="Select reason"
            value={form.reason}
            error={errors.reason}
            options={REASONS.map((r) => ({ label: r, value: r }))}
            onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
          />
          {product && form.qty && Number(form.qty) > 0 && (
            <p className="qk-secondary" style={{ fontSize: 12, margin: 0 }}>
              Estimated value: {formatCurrency(Number(form.qty) * product.unitPrice)}
            </p>
          )}
        </form>
      </QkDrawer>
    </div>
  )
}
