import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkCheckbox, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, formatNumber, statusTone, uid } from '../../utils'
import type { Address, Priority, SalesOrder, SalesOrderItem } from '../../types'

type LineDraft = {
  key: string
  sku: string
  orderedQty: string
  unitPrice: string
  discount: string
  taxPercent: string
}

const emptyLine = (): LineDraft => ({
  key: uid('line'),
  sku: '',
  orderedQty: '1',
  unitPrice: '',
  discount: '0',
  taxPercent: '5',
})

const emptyAddress = (): Address => ({
  line1: '',
  city: '',
  state: '',
  postalCode: '',
  country: 'IN',
})

export function SalesOrdersPage() {
  const {
    salesOrders, customers, warehouses, products, getAtp,
    svcAddSalesOrder, svcAddAndConfirmSalesOrder,
  } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()

  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [customerFilter, setCustomerFilter] = useState('')
  const [priorityFilter, setPriorityFilter] = useState('')
  const [dateFrom, setDateFrom] = useState('')
  const [open, setOpen] = useState(false)

  const [soNumber] = useState(() => `SO-${20490 + salesOrders.length + 1}`)
  const [orderDate, setOrderDate] = useState('2026-09-09')
  const [customerId, setCustomerId] = useState('')
  const [customerRef, setCustomerRef] = useState('')
  const [priority, setPriority] = useState<Priority>('Medium')
  const [deliveryDate, setDeliveryDate] = useState('2026-09-15')
  const [warehouseId, setWarehouseId] = useState('')
  const [allowMulti, setAllowMulti] = useState(false)
  const [shippingMethod, setShippingMethod] = useState('Van')
  const [shipAddr, setShipAddr] = useState<Address>(emptyAddress())
  const [billAddr, setBillAddr] = useState<Address>(emptyAddress())
  const [sameAsShip, setSameAsShip] = useState(true)
  const [notes, setNotes] = useState('')
  const [internalNotes, setInternalNotes] = useState('')
  const [lines, setLines] = useState<LineDraft[]>([emptyLine()])
  const [errors, setErrors] = useState<Record<string, string>>({})

  const selectedCustomer = customers.find((c) => c.id === customerId)

  const filtered = useMemo(
    () => salesOrders.filter((s) => {
      if (status && s.status !== status) return false
      if (warehouse && s.warehouse !== warehouse) return false
      if (customerFilter && s.customer !== customerFilter) return false
      if (priorityFilter && s.priority !== priorityFilter) return false
      if (dateFrom && s.orderDate < dateFrom) return false
      return true
    }),
    [salesOrders, status, warehouse, customerFilter, priorityFilter, dateFrom],
  )
  const list = useListState(
    filtered as unknown as Record<string, unknown>[],
    ['soNumber', 'customer', 'warehouse', 'status', 'priority'] as never,
  )

  const lineTotals = lines.map((line) => {
    const product = products.find((p) => p.sku === line.sku)
    const qty = Number(line.orderedQty) || 0
    const price = Number(line.unitPrice) || product?.sellingPrice || product?.unitPrice || 0
    const discount = Number(line.discount) || 0
    const taxPct = Number(line.taxPercent) || 0
    const base = Math.max(0, qty * price - discount)
    const tax = Math.round(base * taxPct / 100)
    const atp = warehouseId && line.sku ? getAtp(line.sku, allowMulti ? undefined : warehouseId, product) : 0
    const fulfillable = Math.min(qty, atp)
    return { qty, price, discount, tax, base, total: base + tax, atp, fulfillable, backorder: Math.max(0, qty - fulfillable), product }
  })

  const subtotal = lineTotals.reduce((s, l) => s + l.base, 0)
  const discountTotal = lineTotals.reduce((s, l) => s + l.discount, 0)
  const taxTotal = lineTotals.reduce((s, l) => s + l.tax, 0)
  const shipping = 0
  const grandTotal = subtotal + taxTotal + shipping

  const resetForm = () => {
    setCustomerId('')
    setCustomerRef('')
    setPriority('Medium')
    setDeliveryDate('2026-09-15')
    setWarehouseId('')
    setAllowMulti(false)
    setShippingMethod('Van')
    setShipAddr(emptyAddress())
    setBillAddr(emptyAddress())
    setSameAsShip(true)
    setNotes('')
    setInternalNotes('')
    setLines([emptyLine()])
    setErrors({})
  }

  const buildOrder = (asDraft: boolean): SalesOrder | null => {
    const next: Record<string, string> = {}
    if (!customerId) next.customerId = 'Select customer'
    if (!warehouseId) next.warehouseId = 'Select warehouse'
    if (!deliveryDate) next.deliveryDate = 'Required delivery date'
    if (!shipAddr.line1 || !shipAddr.city) next.shipAddr = 'Shipping address required'
    const billing = sameAsShip ? shipAddr : billAddr
    if (!billing.line1 || !billing.city) next.billAddr = 'Billing address required'
    if (!lines.length || lines.every((l) => !l.sku)) next.lines = 'Add at least one item'
    lines.forEach((l, idx) => {
      if (!l.sku) next[`sku-${idx}`] = 'Select SKU'
      if (!l.orderedQty || Number(l.orderedQty) <= 0) next[`qty-${idx}`] = 'Enter quantity'
    })
    setErrors(next)
    if (Object.keys(next).length) return null

    const customer = customers.find((c) => c.id === customerId)!
    const wh = warehouses.find((w) => w.id === warehouseId)!
    const items: SalesOrderItem[] = lines.filter((l) => l.sku).map((l, idx) => {
      const t = lineTotals[idx]
      const product = t.product!
      return {
        id: uid('soi'),
        sku: product.sku,
        productId: product.id,
        product: product.name,
        uom: product.uom,
        orderedQty: t.qty,
        reservedQty: 0,
        pickedQty: 0,
        packedQty: 0,
        dispatchedQty: 0,
        deliveredQty: 0,
        backorderedQty: 0,
        cancelledQty: 0,
        unitPrice: t.price,
        discount: t.discount,
        taxPercent: Number(l.taxPercent) || 0,
        total: t.total,
        status: 'Pending',
      }
    })

    return {
      id: uid('so'),
      soNumber: `SO-${20490 + salesOrders.length + 1}`,
      customerId: customer.id,
      customer: customer.name,
      customerType: customer.customerType,
      warehouseId: wh.id,
      warehouse: wh.name,
      allowMultiWarehouse: allowMulti,
      status: asDraft ? 'Draft' : 'Confirmed',
      amount: grandTotal,
      subtotal,
      discountTotal,
      taxTotal,
      shipping,
      itemCount: items.length,
      orderDate,
      deliveryDate,
      paymentTerms: customer.paymentTerms,
      shippingMethod,
      priority,
      customerReference: customerRef || undefined,
      shippingAddress: { ...shipAddr },
      billingAddress: { ...(sameAsShip ? shipAddr : billAddr) },
      notes: notes || undefined,
      internalNotes: internalNotes || undefined,
      items,
      createdBy: 'Neha Kulkarni',
      createdAt: new Date().toISOString(),
    }
  }

  const save = (asDraft: boolean) => {
    const order = buildOrder(asDraft)
    if (!order) return
    if (asDraft) {
      svcAddSalesOrder(order)
      pushToast({ tone: 'success', title: 'Draft saved', message: order.soNumber })
    } else {
      try {
        svcAddAndConfirmSalesOrder({ ...order, status: 'Draft' }, 'Neha Kulkarni')
        pushToast({ tone: 'success', title: 'Order confirmed & reserved', message: order.soNumber })
      } catch (err) {
        pushToast({
          tone: 'danger',
          title: 'Confirm failed',
          message: err instanceof Error ? err.message : 'Unable to confirm',
        })
        return
      }
    }
    setOpen(false)
    resetForm()
    navigate(`/sales-orders/${order.id}`)
  }

  const saveDraft = (e?: FormEvent) => {
    e?.preventDefault()
    save(true)
  }

  const saveAndConfirm = (e?: FormEvent) => {
    e?.preventDefault()
    save(false)
  }

  const onCustomerChange = (id: string) => {
    setCustomerId(id)
    const c = customers.find((x) => x.id === id)
    if (c?.preferredWarehouseId) setWarehouseId(c.preferredWarehouseId)
    if (c?.deliveryPriority) setPriority(c.deliveryPriority)
    if (c?.city) {
      setShipAddr((a) => ({ ...a, city: c.city, state: a.state || 'MH' }))
    }
  }

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l
      const next = { ...l, ...patch }
      if (patch.sku) {
        const p = products.find((x) => x.sku === patch.sku)
        if (p) next.unitPrice = String(p.sellingPrice || p.unitPrice)
      }
      return next
    }))
  }

  const columns: QkColumn<SalesOrder>[] = [
    {
      key: 'soNumber',
      header: 'SO Number',
      sortable: true,
      width: 110,
      hideable: false,
      render: (r) => (
        <Link to={`/sales-orders/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>
          {r.soNumber}
        </Link>
      ),
    },
    { key: 'customer', header: 'Customer', sortable: true, width: 160 },
    { key: 'customerType', header: 'Type', width: 64, render: (r) => r.customerType },
    { key: 'orderDate', header: 'Order date', sortable: true, width: 100, render: (r) => formatDate(r.orderDate) },
    { key: 'deliveryDate', header: 'Required', width: 100, render: (r) => formatDate(r.deliveryDate) },
    { key: 'warehouse', header: 'Warehouse', width: 150 },
    {
      key: 'itemCount',
      header: 'Ordered',
      align: 'right',
      width: 88,
      render: (r) => {
        const qty = r.items.reduce((s, i) => s + i.orderedQty, 0)
        return `${formatNumber(qty)} / ${r.itemCount}`
      },
    },
    {
      key: 'reserved',
      header: 'Reserved',
      align: 'right',
      width: 80,
      render: (r) => formatNumber(r.items.reduce((s, i) => s + i.reservedQty, 0)),
    },
    {
      key: 'picked',
      header: 'Picked',
      align: 'right',
      width: 72,
      render: (r) => formatNumber(r.items.reduce((s, i) => s + i.pickedQty, 0)),
    },
    {
      key: 'packed',
      header: 'Packed',
      align: 'right',
      width: 72,
      render: (r) => formatNumber(r.items.reduce((s, i) => s + i.packedQty, 0)),
    },
    {
      key: 'dispatched',
      header: 'Dispatched',
      align: 'right',
      width: 88,
      render: (r) => formatNumber(r.items.reduce((s, i) => s + i.dispatchedQty, 0)),
    },
    {
      key: 'backordered',
      header: 'Backordered',
      align: 'right',
      width: 96,
      defaultHidden: true,
      render: (r) => formatNumber(r.items.reduce((s, i) => s + i.backorderedQty, 0)),
    },
    {
      key: 'status',
      header: 'Status',
      width: 120,
      render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} />,
    },
    {
      key: 'priority',
      header: 'Priority',
      width: 88,
      render: (r) => <QkStatusBadge label={r.priority} tone={statusTone(r.priority)} />,
    },
    {
      key: 'actions',
      header: 'Actions',
      width: 108,
      align: 'right',
      hideable: false,
      render: (r) => (
        <div
          style={{ display: 'inline-flex', justifyContent: 'flex-end', gap: 6 }}
          onClick={(e) => e.stopPropagation()}
        >
          <QkButton
            size="sm"
            variant="outline"
            leftIcon={<Eye size={13} />}
            onClick={() => navigate(`/sales-orders/${r.id}`)}
            aria-label={`Open ${r.soNumber}`}
          >
            Open
          </QkButton>
        </div>
      ),
    },
  ]

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
    customerFilter ? { id: 'customer', label: `Customer: ${customerFilter}` } : null,
    priorityFilter ? { id: 'priority', label: `Priority: ${priorityFilter}` } : null,
    dateFrom ? { id: 'date', label: `From: ${dateFrom}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Sales Orders"
        subtitle="Order lifecycle — create, reserve, pick, pack, dispatch from one workspace."
        actions={(
          <QkButton
            leftIcon={<Plus size={14} />}
            onClick={() => { resetForm(); setOpen(true) }}
          >
            Create order
          </QkButton>
        )}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Open orders" value={salesOrders.filter((s) => !['Delivered', 'Cancelled'].includes(s.status)).length} />
        <QkMetric label="Drafts" value={salesOrders.filter((s) => s.status === 'Draft').length} />
        <QkMetric label="Picking" value={salesOrders.filter((s) => ['Picking', 'Partially Picked'].includes(s.status)).length} />
        <QkMetric label="Order value" value={formatCurrency(salesOrders.reduce((s, o) => s + o.amount, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SO, customer..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: setStatus,
            options: ['Draft', 'Confirmed', 'Partially Reserved', 'Reserved', 'Picking', 'Picked', 'Packed', 'Dispatched', 'Delivered', 'Cancelled']
              .map((s) => ({ label: s, value: s })),
          },
          {
            id: 'customer',
            label: 'Customer',
            value: customerFilter,
            onChange: setCustomerFilter,
            options: Array.from(new Set(salesOrders.map((s) => s.customer))).map((c) => ({ label: c, value: c })),
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: setWarehouse,
            options: Array.from(new Set(salesOrders.map((s) => s.warehouse))).map((w) => ({ label: w, value: w })),
          },
          {
            id: 'priority',
            label: 'Priority',
            value: priorityFilter,
            onChange: setPriorityFilter,
            options: ['Low', 'Medium', 'High', 'Urgent'].map((p) => ({ label: p, value: p })),
          },
        ]}
        rightSlot={(
          <div style={{ minWidth: 158, flex: '0 1 168px', display: 'flex', flexDirection: 'column', gap: 4 }}>
            <QkInput
              aria-label="Order date from"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              title="Order date from"
            />
          </div>
        )}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'status') setStatus('')
          if (id === 'warehouse') setWarehouse('')
          if (id === 'customer') setCustomerFilter('')
          if (id === 'priority') setPriorityFilter('')
          if (id === 'date') setDateFrom('')
        }}
        onClearAll={() => {
          setStatus(''); setWarehouse(''); setCustomerFilter(''); setPriorityFilter(''); setDateFrom(''); list.setSearch('')
        }}
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
        storageKey="sales-orders-list"
        emptyTitle="No sales orders matched your filters."
      />

      <QkDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Create sales order"
        subtitle="Multi-line order — save draft or confirm with ATP reservation"
        width={760}
        footer={(
          <>
            <QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton>
            <QkButton variant="outline" onClick={saveDraft}>Save Draft</QkButton>
            <QkButton onClick={saveAndConfirm}>Confirm Order</QkButton>
          </>
        )}
      >
        <form onSubmit={saveAndConfirm} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <section>
            <h4 className="qk-section-title" style={{ marginBottom: 10 }}>Order information</h4>
            <div className="qk-grid-2" style={{ gap: 10 }}>
              <QkInput label="SO Number" value={soNumber} readOnly />
              <QkInput label="Order date" type="date" value={orderDate} onChange={(e) => setOrderDate(e.target.value)} />
              <QkSelect
                label="Customer"
                required
                value={customerId}
                error={errors.customerId}
                placeholder="Search / select"
                options={customers.filter((c) => c.status === 'Active').map((c) => ({ label: `${c.name} · ${c.customerType}`, value: c.id }))}
                onChange={(e) => onCustomerChange(e.target.value)}
              />
              <QkInput label="Customer type" value={selectedCustomer?.customerType || '—'} readOnly />
              <QkInput label="Customer reference" value={customerRef} onChange={(e) => setCustomerRef(e.target.value)} placeholder="PO / ref" />
              <QkSelect
                label="Priority"
                value={priority}
                options={['Low', 'Medium', 'High', 'Urgent'].map((p) => ({ label: p, value: p }))}
                onChange={(e) => setPriority(e.target.value as Priority)}
              />
              <QkInput
                label="Required delivery date"
                type="date"
                required
                value={deliveryDate}
                error={errors.deliveryDate}
                onChange={(e) => setDeliveryDate(e.target.value)}
              />
            </div>
          </section>

          <section>
            <h4 className="qk-section-title" style={{ marginBottom: 10 }}>Fulfillment</h4>
            <div className="qk-grid-2" style={{ gap: 10 }}>
              <QkSelect
                label="Preferred warehouse"
                required
                value={warehouseId}
                error={errors.warehouseId}
                placeholder="Select warehouse"
                options={warehouses.map((w) => ({ label: w.name, value: w.id }))}
                onChange={(e) => setWarehouseId(e.target.value)}
              />
              <QkSelect
                label="Shipping method"
                value={shippingMethod}
                options={['Van', 'Courier', 'Self Collect', 'Dedicated Truck'].map((m) => ({ label: m, value: m }))}
                onChange={(e) => setShippingMethod(e.target.value)}
              />
            </div>
            <div style={{ marginTop: 8 }}>
              <QkCheckbox
                checked={allowMulti}
                onChange={() => setAllowMulti((v) => !v)}
                label="Allow multi-warehouse fulfillment"
              />
            </div>
          </section>

          <section>
            <h4 className="qk-section-title" style={{ marginBottom: 10 }}>Shipping</h4>
            <div className="qk-grid-2" style={{ gap: 10 }}>
              <QkInput label="Shipping address" required value={shipAddr.line1} error={errors.shipAddr} onChange={(e) => setShipAddr((a) => ({ ...a, line1: e.target.value }))} />
              <QkInput label="City" value={shipAddr.city} onChange={(e) => setShipAddr((a) => ({ ...a, city: e.target.value }))} />
              <QkInput label="State" value={shipAddr.state} onChange={(e) => setShipAddr((a) => ({ ...a, state: e.target.value }))} />
              <QkInput label="PIN" value={shipAddr.postalCode} onChange={(e) => setShipAddr((a) => ({ ...a, postalCode: e.target.value }))} />
            </div>
            <div style={{ margin: '8px 0' }}>
              <QkCheckbox checked={sameAsShip} onChange={() => setSameAsShip((v) => !v)} label="Billing same as shipping" />
            </div>
            {!sameAsShip && (
              <div className="qk-grid-2" style={{ gap: 10 }}>
                <QkInput label="Billing address" required value={billAddr.line1} error={errors.billAddr} onChange={(e) => setBillAddr((a) => ({ ...a, line1: e.target.value }))} />
                <QkInput label="City" value={billAddr.city} onChange={(e) => setBillAddr((a) => ({ ...a, city: e.target.value }))} />
              </div>
            )}
          </section>

          <section>
            <h4 className="qk-section-title" style={{ marginBottom: 10 }}>Order items</h4>
            {errors.lines && <div style={{ color: 'var(--qk-danger)', fontSize: 12, marginBottom: 6 }}>{errors.lines}</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {lines.map((line, idx) => {
                const t = lineTotals[idx]
                return (
                  <div
                    key={line.key}
                    style={{
                      border: '1px solid var(--qk-border)',
                      borderRadius: 'var(--qk-radius)',
                      padding: 10,
                      display: 'grid',
                      gridTemplateColumns: '1.4fr 0.6fr 0.7fr 0.6fr 0.5fr auto',
                      gap: 8,
                      alignItems: 'end',
                    }}
                  >
                    <QkSelect
                      label="SKU"
                      required
                      value={line.sku}
                      error={errors[`sku-${idx}`]}
                      placeholder="Select"
                      options={products.filter((p) => p.status === 'Active').map((p) => ({ label: `${p.sku} · ${p.name}`, value: p.sku }))}
                      onChange={(e) => updateLine(line.key, { sku: e.target.value })}
                    />
                    <QkInput
                      label="Qty"
                      type="number"
                      required
                      value={line.orderedQty}
                      error={errors[`qty-${idx}`]}
                      onChange={(e) => updateLine(line.key, { orderedQty: e.target.value })}
                    />
                    <QkInput label="Unit price" type="number" value={line.unitPrice} onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })} />
                    <QkInput label="Discount" type="number" value={line.discount} onChange={(e) => updateLine(line.key, { discount: e.target.value })} />
                    <QkInput label="Tax %" type="number" value={line.taxPercent} onChange={(e) => updateLine(line.key, { taxPercent: e.target.value })} />
                    <QkButton
                      variant="ghost"
                      size="sm"
                      aria-label="Remove line"
                      onClick={() => setLines((prev) => (prev.length === 1 ? prev : prev.filter((l) => l.key !== line.key)))}
                    >
                      <Trash2 size={14} />
                    </QkButton>
                    {line.sku && warehouseId && (
                      <div style={{ gridColumn: '1 / -1', fontSize: 12, color: 'var(--qk-text-secondary)', display: 'flex', gap: 16, flexWrap: 'wrap' }}>
                        <span>Product: {t.product?.name || '—'}</span>
                        <span>UOM: {t.product?.uom || '—'}</span>
                        <span>ATP: {formatNumber(t.atp)}</span>
                        <span>Fulfillable: {formatNumber(t.fulfillable)}</span>
                        <span>Backorder: {formatNumber(t.backorder)}</span>
                        <span>Line total: {formatCurrency(t.total)}</span>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            <div style={{ marginTop: 8 }}>
              <QkButton variant="outline" size="sm" leftIcon={<Plus size={14} />} onClick={() => setLines((p) => [...p, emptyLine()])}>
                Add item
              </QkButton>
            </div>
          </section>

          <section>
            <h4 className="qk-section-title" style={{ marginBottom: 10 }}>Notes</h4>
            <div className="qk-grid-2" style={{ gap: 10 }}>
              <QkInput label="Customer notes" value={notes} onChange={(e) => setNotes(e.target.value)} />
              <QkInput label="Internal notes" value={internalNotes} onChange={(e) => setInternalNotes(e.target.value)} />
            </div>
          </section>

          <section className="qk-surface" style={{ padding: 12 }}>
            <h4 className="qk-section-title" style={{ marginBottom: 8 }}>Summary</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 4, fontSize: 13 }}>
              <span className="qk-secondary">Subtotal</span><span>{formatCurrency(subtotal)}</span>
              <span className="qk-secondary">Discount</span><span>{formatCurrency(discountTotal)}</span>
              <span className="qk-secondary">Tax</span><span>{formatCurrency(taxTotal)}</span>
              <span className="qk-secondary">Shipping</span><span>{formatCurrency(shipping)}</span>
              <strong>Grand total</strong><strong>{formatCurrency(grandTotal)}</strong>
            </div>
          </section>
        </form>
      </QkDrawer>
    </div>
  )
}
