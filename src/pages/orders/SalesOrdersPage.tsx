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
import { formatCurrency, formatDate, statusTone, uid } from '../../utils'
import type { SalesOrder } from '../../types'

export function SalesOrdersPage() {
  const { salesOrders, setSalesOrders, customers, warehouses, products, inventory } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [open, setOpen] = useState(false)
  const [customerId, setCustomerId] = useState('')
  const [warehouseId, setWarehouseId] = useState('')
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState('10')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(
    () => salesOrders.filter((s) => (!status || s.status === status) && (!warehouse || s.warehouse === warehouse)),
    [salesOrders, status, warehouse],
  )
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['soNumber', 'customer', 'warehouse'] as never)

  const create = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!customerId) next.customerId = 'Select customer'
    if (!warehouseId) next.warehouseId = 'Select warehouse'
    if (!sku) next.sku = 'Select SKU'
    if (!qty || Number(qty) <= 0) next.qty = 'Enter quantity'
    else if (warehouseId && sku) {
      const wh = warehouses.find((w) => w.id === warehouseId)
      const available = inventory
        .filter((i) => i.sku === sku && (i.warehouseId === warehouseId || i.warehouse === wh?.name))
        .reduce((s, i) => s + i.available, 0)
      if (Number(qty) > available) {
        next.qty = `Only ${available} available at warehouse`
      }
    }
    setErrors(next)
    if (Object.keys(next).length) return

    const customer = customers.find((c) => c.id === customerId)!
    const wh = warehouses.find((w) => w.id === warehouseId)!
    const product = products.find((p) => p.sku === sku)!
    const orderedQty = Number(qty)
    const unitPrice = Math.round(product.unitPrice * 1.05)
    const order: SalesOrder = {
      id: uid('so'),
      soNumber: `SO-${20490 + salesOrders.length}`,
      customerId: customer.id,
      customer: customer.name,
      warehouseId: wh.id,
      warehouse: wh.name,
      status: 'Confirmed',
      amount: unitPrice * orderedQty,
      itemCount: 1,
      orderDate: '2026-09-09',
      deliveryDate,
      createdBy: 'Neha Kulkarni',
      items: [{
        id: uid('soi'),
        sku: product.sku,
        product: product.name,
        orderedQty,
        reservedQty: 0,
        pickedQty: 0,
        dispatchedQty: 0,
        unitPrice,
        total: unitPrice * orderedQty,
        status: 'Pending',
      }],
    }
    setSalesOrders((prev) => [order, ...prev])
    pushToast({ tone: 'success', title: 'Sales order created', message: order.soNumber })
    setOpen(false)
    navigate(`/sales-orders/${order.id}`)
  }

  const columns: QkColumn<SalesOrder>[] = [
    { key: 'soNumber', header: 'SO', sortable: true, render: (r) => <Link to={`/sales-orders/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.soNumber}</Link> },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'itemCount', header: 'Items', align: 'right' },
    { key: 'amount', header: 'Amount', align: 'right', sortable: true, render: (r) => formatCurrency(r.amount) },
    { key: 'orderDate', header: 'Order date', render: (r) => formatDate(r.orderDate) },
    { key: 'deliveryDate', header: 'Delivery', render: (r) => formatDate(r.deliveryDate) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Sales Orders"
        subtitle="Customer orders through reservation, picking, and dispatch."
        actions={<QkButton leftIcon={<Plus size={14} />} onClick={() => { setOpen(true); setErrors({}); setCustomerId(''); setWarehouseId(''); setSku(''); setQty('10') }}>Create order</QkButton>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Open orders" value={salesOrders.filter((s) => !['Delivered', 'Cancelled'].includes(s.status)).length} />
        <QkMetric label="Picking" value={salesOrders.filter((s) => s.status === 'Picking').length} />
        <QkMetric label="Dispatched" value={salesOrders.filter((s) => s.status === 'Dispatched').length} />
        <QkMetric label="Order value" value={formatCurrency(salesOrders.reduce((s, o) => s + o.amount, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SO, customer..."
        filters={[
          { id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Draft', 'Confirmed', 'Reserved', 'Picking', 'Packed', 'Dispatched', 'Delivered', 'Cancelled'].map((s) => ({ label: s, value: s })) },
          { id: 'warehouse', label: 'Warehouse', value: warehouse, onChange: setWarehouse, options: Array.from(new Set(salesOrders.map((s) => s.warehouse))).map((w) => ({ label: w, value: w })) },
        ]}
        chips={chips}
        onRemoveChip={(id) => { if (id === 'status') setStatus(''); if (id === 'warehouse') setWarehouse('') }}
        onClearAll={() => { setStatus(''); setWarehouse(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as SalesOrder[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/sales-orders/${r.id}`)}
        emptyTitle="No sales orders matched your filters."
      />
      <QkDrawer open={open} onClose={() => setOpen(false)} title="Create sales order" footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={create}>Create</QkButton></>}>
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkSelect label="Customer" required value={customerId} error={errors.customerId} placeholder="Select customer" options={customers.map((c) => ({ label: c.name, value: c.id }))} onChange={(e) => setCustomerId(e.target.value)} />
          <QkSelect label="Warehouse" required value={warehouseId} error={errors.warehouseId} placeholder="Select warehouse" options={warehouses.map((w) => ({ label: w.name, value: w.id }))} onChange={(e) => { setWarehouseId(e.target.value); setErrors((prev) => ({ ...prev, qty: '' })) }} />
          <QkInput label="Delivery date" type="date" value={deliveryDate} onChange={(e) => setDeliveryDate(e.target.value)} />
          <QkSelect label="SKU" required value={sku} error={errors.sku} placeholder="Select product" options={products.filter((p) => p.status === 'Active').map((p) => ({ label: `${p.sku} · ${p.name}`, value: p.sku }))} onChange={(e) => { setSku(e.target.value); setErrors((prev) => ({ ...prev, qty: '' })) }} />
          <QkInput
            label="Quantity"
            type="number"
            required
            value={qty}
            error={errors.qty}
            hint={
              warehouseId && sku
                ? `Available at warehouse: ${inventory
                    .filter((i) => i.sku === sku && (i.warehouseId === warehouseId || i.warehouse === warehouses.find((w) => w.id === warehouseId)?.name))
                    .reduce((s, i) => s + i.available, 0)}`
                : 'Select warehouse and SKU to see availability'
            }
            onChange={(e) => setQty(e.target.value)}
          />
        </form>
      </QkDrawer>
    </div>
  )
}
