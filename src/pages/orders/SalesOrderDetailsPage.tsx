import { useMemo, useState, type ReactNode } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader, QkStickyActions } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkInput, QkMetric, QkModal, QkSelect, QkStatusBadge,
  QkStepper, QkTable, QkTabs, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { formatCurrency, formatDate, formatDateTime, formatNumber, statusTone } from '../../utils'
import type { PicklistLine, ReservationAllocation, ReturnRecord, SalesOrderItem } from '../../types'

const FLOW = [
  { id: 'order', label: 'Order' },
  { id: 'reservation', label: 'Reservation' },
  { id: 'picking', label: 'Picking' },
  { id: 'packing', label: 'Packing' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'delivery', label: 'Delivery' },
]

type TabId =
  | 'overview'
  | 'items'
  | 'availability'
  | 'allocation'
  | 'picking'
  | 'packing'
  | 'shipment'
  | 'returns'
  | 'activity'

function progressStep(order: {
  status: string
  items: SalesOrderItem[]
}, hasPicklist: boolean, hasPacking: boolean, hasDispatch: boolean, delivered: boolean) {
  const totals = {
    reserved: order.items.reduce((s, i) => s + i.reservedQty, 0),
    picked: order.items.reduce((s, i) => s + i.pickedQty, 0),
    packed: order.items.reduce((s, i) => s + i.packedQty, 0),
  }

  if (delivered || order.status === 'Delivered') return 'delivery'

  if (
    hasDispatch
    || ['Dispatched', 'Partially Dispatched'].includes(order.status)
  ) {
    return 'dispatch'
  }

  // Packing finished → next stage is Dispatch
  if (
    order.status === 'Packed'
    || order.status === 'Dispatch Ready'
    || (hasPacking && totals.packed > 0)
  ) {
    return 'dispatch'
  }

  if (
    order.status === 'Picked'
    || (totals.picked > 0 && totals.packed < totals.picked)
  ) {
    return 'packing'
  }

  if (
    hasPicklist
    || ['Picking', 'Partially Picked'].includes(order.status)
  ) {
    return 'picking'
  }

  if (
    ['Reserved', 'Partially Reserved'].includes(order.status)
    || totals.reserved > 0
  ) {
    return 'reservation'
  }

  return 'order'
}

const STEP_TO_TAB: Record<string, TabId> = {
  order: 'overview',
  reservation: 'allocation',
  picking: 'picking',
  packing: 'packing',
  dispatch: 'shipment',
  delivery: 'shipment',
}

export function SalesOrderDetailsPage() {
  const { id } = useParams()
  const {
    salesOrders, setSalesOrders, customers, products, bins, warehouses,
    reservations, reservationAllocations, picklists, packings, dispatches, returns,
    movements, notifications, inventory, getAtp,
    svcConfirmSalesOrder, svcGeneratePicklist, svcReleaseReservation,
    svcConfirmPickLine, svcCreatePacking, svcHandoverDispatch, svcAdvanceShipment,
    svcCreateReturn, svcProcessReturnQc,
  } = useData()
  const { pushToast } = useToast()
  const { isMobile } = useBreakpoint()
  const order = salesOrders.find((s) => s.id === id)

  const [tab, setTab] = useState<TabId>('overview')
  const [pickDrawer, setPickDrawer] = useState<{ picklistId: string; line: PicklistLine } | null>(null)
  const [scanBin, setScanBin] = useState('')
  const [scanSku, setScanSku] = useState('')
  const [scanBatch, setScanBatch] = useState('')
  const [pickQty, setPickQty] = useState('')
  const [dispatchOpen, setDispatchOpen] = useState(false)
  const [vehicle, setVehicle] = useState('MH-02-AB-4412')
  const [driver, setDriver] = useState('Ravi More')
  const [carrier, setCarrier] = useState('QuickKart Fleet')
  const [tracking, setTracking] = useState('')
  const [returnOpen, setReturnOpen] = useState(false)
  const [retSku, setRetSku] = useState('')
  const [retBatch, setRetBatch] = useState('')
  const [retQty, setRetQty] = useState('10')
  const [retReason, setRetReason] = useState('Damaged packaging')
  const [qcOpen, setQcOpen] = useState<ReturnRecord | null>(null)
  const [qcReusable, setQcReusable] = useState('8')
  const [qcDamaged, setQcDamaged] = useState('2')
  const [qcWastage, setQcWastage] = useState('0')

  const soReservations = useMemo(
    () => (order ? reservations.filter((r) => r.soId === order.id) : []),
    [reservations, order],
  )
  const soAllocs = useMemo(
    () => (order ? reservationAllocations.filter((a) => a.soId === order.id) : []),
    [reservationAllocations, order],
  )
  const soPicklists = useMemo(
    () => (order ? picklists.filter((p) => p.soId === order.id || p.soNumber === order.soNumber) : []),
    [picklists, order],
  )
  const soPackings = useMemo(
    () => (order ? packings.filter((p) => p.soId === order.id) : []),
    [packings, order],
  )
  const soDispatches = useMemo(
    () => (order ? dispatches.filter((d) => d.soId === order.id || d.soNumber === order.soNumber) : []),
    [dispatches, order],
  )
  const soReturns = useMemo(
    () => (order ? returns.filter((r) => r.soId === order.id || r.soNumber === order.soNumber) : []),
    [returns, order],
  )

  const activity = useMemo(() => {
    if (!order) return []
    const events: { at: string; text: string }[] = [
      { at: order.createdAt, text: `SO created (${order.status === 'Draft' ? 'Draft' : 'recorded'})` },
    ]
    for (const r of soReservations) {
      events.push({ at: r.createdAt, text: `${r.quantity} units reserved · ${r.strategy} · ${r.id.slice(0, 12)}` })
    }
    for (const pl of soPicklists) {
      events.push({ at: pl.createdAt, text: `Picklist ${pl.picklistNo} generated (${pl.lines.length} lines)` })
    }
    for (const m of movements.filter((x) => x.referenceId === order.id || soPicklists.some((p) => p.id === x.referenceId) || soDispatches.some((d) => d.id === x.referenceId) || soReturns.some((r) => r.id === x.referenceId) || soPackings.some((p) => p.id === x.referenceId))) {
      events.push({ at: m.timestamp, text: `${m.movementType} · ${m.sku} · qty ${m.qty}` })
    }
    for (const n of notifications.filter((x) => x.referenceId === order.id)) {
      events.push({ at: n.createdAt, text: n.message })
    }
    for (const d of soDispatches) {
      events.push({ at: d.dispatchedAt, text: `Dispatch ${d.dispatchNo} · ${d.status}` })
    }
    for (const r of soReturns) {
      events.push({ at: r.createdAt, text: `Return ${r.returnNo} · ${r.returnedQty} units · ${r.status}` })
    }
    return events.sort((a, b) => a.at.localeCompare(b.at))
  }, [order, soReservations, soPicklists, soDispatches, soReturns, soPackings, movements, notifications])

  if (!order) {
    return (
      <div className="qk-page">
        <PageHeader title="Sales order not found" />
        <Link to="/sales-orders"><QkButton variant="outline">Back to orders</QkButton></Link>
      </div>
    )
  }

  const customer = customers.find((c) => c.id === order.customerId)
  const currentStep = progressStep(
    order,
    soPicklists.some((p) => p.lines.length > 0 && p.status !== 'Cancelled'),
    soPackings.length > 0,
    soDispatches.length > 0,
    order.status === 'Delivered'
      || soDispatches.some((d) => d.status === 'Delivered' || d.status === 'In Transit'),
  )

  const totals = {
    ordered: order.items.reduce((s, i) => s + i.orderedQty, 0),
    reserved: order.items.reduce((s, i) => s + i.reservedQty, 0),
    picked: order.items.reduce((s, i) => s + i.pickedQty, 0),
    packed: order.items.reduce((s, i) => s + i.packedQty, 0),
    dispatched: order.items.reduce((s, i) => s + i.dispatchedQty, 0),
    backordered: order.items.reduce((s, i) => s + i.backorderedQty, 0),
  }

  const runSafe = (fn: () => void, okTitle: string, okMsg?: string) => {
    try {
      fn()
      pushToast({ tone: 'success', title: okTitle, message: okMsg || order.soNumber })
    } catch (err) {
      pushToast({
        tone: 'danger',
        title: 'Action failed',
        message: err instanceof Error ? err.message : 'Unexpected error',
      })
    }
  }

  const contextualActions = () => {
    const actions: ReactNode[] = []
    if (order.status === 'Draft') {
      actions.push(
        <QkButton key="confirm" onClick={() => runSafe(() => svcConfirmSalesOrder(order.id, 'Neha Kulkarni'), 'Order confirmed', 'ATP reserved & allocated')}>
          Confirm Order
        </QkButton>,
      )
    }
    if (order.status === 'Confirmed' && totals.reserved === 0) {
      actions.push(
        <QkButton key="reserve" onClick={() => runSafe(() => svcConfirmSalesOrder(order.id, 'Neha Kulkarni'), 'Stock reserved')}>
          Reserve Stock
        </QkButton>,
      )
    }
    if (['Reserved', 'Partially Reserved'].includes(order.status) && !soPicklists.some((p) => p.status !== 'Cancelled' && p.lines.length > 0)) {
      actions.push(
        <QkButton key="pl" onClick={() => runSafe(() => svcGeneratePicklist(order.id, 'Neha Kulkarni'), 'Picklist generated')}>
          Generate Picklist
        </QkButton>,
      )
    }
    if (['Picking', 'Partially Picked', 'Reserved', 'Partially Reserved'].includes(order.status) && soPicklists.some((p) => p.status !== 'Completed' && p.status !== 'Cancelled')) {
      actions.push(
        <QkButton key="pick" variant="outline" onClick={() => setTab('picking')}>Open Picking</QkButton>,
      )
    }
    if (['Picked', 'Partially Picked'].includes(order.status) || (totals.picked > 0 && totals.packed < totals.picked && order.status !== 'Packed')) {
      if (!['Packed', 'Dispatched', 'Delivered'].includes(order.status)) {
        actions.push(
          <QkButton key="pack" onClick={() => runSafe(() => svcCreatePacking(order.id, 'Neha Kulkarni'), 'Packing complete')}>
            Pack Order
          </QkButton>,
        )
      }
    }
    if (['Packed', 'Dispatch Ready'].includes(order.status) || (totals.packed > 0 && totals.dispatched < totals.packed)) {
      if (!['Dispatched', 'Delivered', 'Partially Dispatched'].includes(order.status) || totals.dispatched < totals.packed) {
        if (!soDispatches.length) {
          actions.push(
            <QkButton key="dsp" onClick={() => setDispatchOpen(true)}>Dispatch</QkButton>,
          )
        }
      }
    }
    if (soDispatches.some((d) => d.status === 'Handed Over')) {
      actions.push(
        <QkButton key="transit" variant="outline" onClick={() => {
          const d = soDispatches.find((x) => x.status === 'Handed Over')!
          runSafe(() => svcAdvanceShipment(d.id, 'In Transit'), 'In transit')
        }}
        >
          Mark In Transit
        </QkButton>,
      )
    }
    if (soDispatches.some((d) => d.status === 'In Transit')) {
      actions.push(
        <QkButton key="del" onClick={() => {
          const d = soDispatches.find((x) => x.status === 'In Transit')!
          runSafe(() => svcAdvanceShipment(d.id, 'Delivered'), 'Delivered')
        }}
        >
          Mark Delivered
        </QkButton>,
      )
    }
    if (order.status === 'Delivered' || soDispatches.some((d) => d.status === 'Delivered')) {
      actions.push(
        <QkButton key="ret" variant="outline" onClick={() => { setReturnOpen(true); setRetSku(order.items[0]?.sku || '') }}>
          Create Return
        </QkButton>,
      )
    }
    if (order.status === 'Draft' || order.status === 'Confirmed') {
      actions.push(
        <QkButton
          key="cancel"
          variant="outline"
          onClick={() => {
            setSalesOrders((prev) => prev.map((s) => (s.id === order.id ? { ...s, status: 'Cancelled' } : s)))
            pushToast({ tone: 'warning', title: 'Order cancelled', message: order.soNumber })
          }}
        >
          Cancel Order
        </QkButton>,
      )
    }
    return actions
  }

  const itemColumns: QkColumn<SalesOrderItem>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product' },
    { key: 'uom', header: 'UOM' },
    { key: 'orderedQty', header: 'Ordered', align: 'right' },
    { key: 'reservedQty', header: 'Reserved', align: 'right' },
    { key: 'pickedQty', header: 'Picked', align: 'right' },
    { key: 'packedQty', header: 'Packed', align: 'right' },
    { key: 'dispatchedQty', header: 'Dispatched', align: 'right' },
    { key: 'backorderedQty', header: 'Backorder', align: 'right' },
    { key: 'unitPrice', header: 'Price', align: 'right', render: (r) => formatCurrency(r.unitPrice) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const allocColumns: QkColumn<ReservationAllocation>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'batchNo', header: 'Batch' },
    { key: 'expiry', header: 'Expiry', render: (r) => formatDate(r.expiry) },
    {
      key: 'binId',
      header: 'Location',
      render: (r) => {
        const bal = inventory.find((i) => i.batchId === r.batchId && i.binId === r.binId)
        return bal ? `${bal.zone}/${bal.rack}/${bal.shelf}/${bal.bin}` : r.binId
      },
    },
    { key: 'allocatedQty', header: 'Qty', align: 'right' },
    { key: 'consumedQty', header: 'Consumed', align: 'right' },
    { key: 'strategy', header: 'Strategy' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const submitPick = () => {
    if (!pickDrawer) return
    runSafe(() => {
      svcConfirmPickLine({
        picklistId: pickDrawer.picklistId,
        lineId: pickDrawer.line.id,
        pickedQty: Number(pickQty),
        scannedSku: scanSku,
        scannedBatch: scanBatch,
        scannedBin: scanBin,
        performedBy: 'Suresh Yadav',
      })
      setPickDrawer(null)
      setScanBin(''); setScanSku(''); setScanBatch(''); setPickQty('')
    }, 'Pick confirmed')
  }

  const submitDispatch = () => {
    runSafe(() => {
      svcHandoverDispatch({
        soId: order.id,
        packingId: soPackings[0]?.id,
        vehicle,
        driver,
        carrier,
        trackingNumber: tracking || `TRK-${Date.now().toString().slice(-8)}`,
        performedBy: 'Neha Kulkarni',
      })
      setDispatchOpen(false)
    }, 'Dispatch handed over')
  }

  const submitReturn = () => {
    const item = order.items.find((i) => i.sku === retSku)
    const product = products.find((p) => p.sku === retSku)
    const wh = warehouses.find((w) => w.id === order.warehouseId)
    const retBin = bins.find((b) => b.id === wh?.returnsLocationId) || bins.find((b) => b.warehouseId === order.warehouseId && b.binType === 'Returns')
    if (!item || !product || !retBin) {
      pushToast({ tone: 'danger', title: 'Return failed', message: 'Missing product or returns bin' })
      return
    }
    const zone = { zoneId: 'z1', zone: 'Ambient / Cold A', rackId: 'rk1', rack: 'R12', shelfId: 'sh1', shelf: 'S3' }
    runSafe(() => {
      svcCreateReturn({
        soId: order.id,
        dispatchId: soDispatches[0]?.id,
        warehouseId: order.warehouseId,
        reason: retReason,
        performedBy: 'Neha Kulkarni',
        lines: [{
          sku: retSku,
          productId: product.id,
          product: product.name,
          originalBatchId: soAllocs.find((a) => a.batchNo === retBatch)?.batchId,
          originalBatch: retBatch,
          originalExpiry: soAllocs.find((a) => a.batchNo === retBatch)?.expiry,
          originallyDispatchedQty: item.dispatchedQty,
          returnQty: Number(retQty),
          reason: retReason,
        }],
        returnsLocation: {
          binId: retBin.id,
          bin: retBin.code,
          ...zone,
        },
      })
      setReturnOpen(false)
      setTab('returns')
    }, 'Return created', 'Inventory on RETURN_QC_HOLD')
  }

  const submitQc = () => {
    if (!qcOpen) return
    const line = qcOpen.lines[0]
    if (!line) return
    runSafe(() => {
      svcProcessReturnQc({
        returnId: qcOpen.id,
        lineId: line.id,
        reusableQty: Number(qcReusable),
        damagedQty: Number(qcDamaged),
        wastageQty: Number(qcWastage),
        inspector: 'Priya Shah',
      })
      setQcOpen(null)
    }, 'Return QC complete')
  }

  const actions = contextualActions()

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={order.soNumber}
        subtitle={`${order.customer} · ${order.customerType} · ${order.warehouse}`}
        secondaryActions={isMobile ? [
          { id: 'back', label: 'Back to Orders', onClick: () => { window.history.back() } },
        ] : undefined}
        actions={(
          <>
            <Link to="/sales-orders"><QkButton variant="outline">Back to Orders</QkButton></Link>
            {actions}
          </>
        )}
      />

      <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap', marginBottom: 4 }}>
        <QkStatusBadge label={order.status} tone={statusTone(order.status)} />
        <QkStatusBadge label={order.priority} tone={statusTone(order.priority)} />
        {order.customerReference && (
          <span className="qk-muted" style={{ fontSize: 12 }}>Ref: {order.customerReference}</span>
        )}
        <span className="qk-muted" style={{ fontSize: 12 }}>
          Ordered {formatDate(order.orderDate)} · Required {formatDate(order.deliveryDate)}
        </span>
        {customer && <span className="qk-muted" style={{ fontSize: 12 }}>{customer.city}</span>}
      </div>

      <section className="qk-surface" style={{ padding: '12px 16px' }}>
        <QkStepper
          steps={FLOW}
          current={currentStep}
          onStepClick={(stepId) => {
            const next = STEP_TO_TAB[stepId]
            if (next) setTab(next)
          }}
        />
      </section>

      <div className="qk-grid-metrics">
        <QkMetric label="Ordered" value={formatNumber(totals.ordered)} />
        <QkMetric label="Reserved" value={formatNumber(totals.reserved)} />
        <QkMetric label="Picked" value={formatNumber(totals.picked)} />
        <QkMetric label="Packed" value={formatNumber(totals.packed)} />
        <QkMetric label="Dispatched" value={formatNumber(totals.dispatched)} />
        <QkMetric label="Backordered" value={formatNumber(totals.backordered)} />
      </div>

      <QkTabs
        value={tab}
        onChange={(id) => setTab(id as TabId)}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'items', label: 'Items', count: order.items.length },
          { id: 'availability', label: 'Availability' },
          { id: 'allocation', label: 'Allocation', count: soAllocs.length },
          { id: 'picking', label: 'Picking', count: soPicklists.length },
          { id: 'packing', label: 'Packing', count: soPackings.length },
          { id: 'shipment', label: 'Shipment', count: soDispatches.length },
          { id: 'returns', label: 'Returns', count: soReturns.length },
          { id: 'activity', label: 'Activity' },
        ]}
      />

      <div style={{ marginTop: 14 }}>
        {tab === 'overview' && (
          <div className="qk-grid-2" style={{ gap: 12 }}>
            <section className="qk-surface" style={{ padding: 14 }}>
              <h3 className="qk-section-title" style={{ marginBottom: 10 }}>Order</h3>
              <dl style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 6, fontSize: 13, margin: 0 }}>
                <dt className="qk-secondary">Customer</dt><dd style={{ margin: 0 }}>{order.customer}</dd>
                <dt className="qk-secondary">Type</dt><dd style={{ margin: 0 }}>{order.customerType}</dd>
                <dt className="qk-secondary">Warehouse</dt><dd style={{ margin: 0 }}>{order.warehouse}</dd>
                <dt className="qk-secondary">Multi-WH</dt><dd style={{ margin: 0 }}>{order.allowMultiWarehouse ? 'Yes' : 'No'}</dd>
                <dt className="qk-secondary">Shipping</dt><dd style={{ margin: 0 }}>{order.shippingMethod || '—'}</dd>
                <dt className="qk-secondary">Amount</dt><dd style={{ margin: 0 }}>{formatCurrency(order.amount)}</dd>
                <dt className="qk-secondary">Notes</dt><dd style={{ margin: 0 }}>{order.notes || '—'}</dd>
                <dt className="qk-secondary">Internal</dt><dd style={{ margin: 0 }}>{order.internalNotes || '—'}</dd>
              </dl>
            </section>
            <section className="qk-surface" style={{ padding: 14 }}>
              <h3 className="qk-section-title" style={{ marginBottom: 10 }}>Addresses</h3>
              <div style={{ fontSize: 13, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div>
                  <div className="qk-secondary" style={{ fontSize: 11 }}>Shipping</div>
                  {order.shippingAddress
                    ? `${order.shippingAddress.line1}, ${order.shippingAddress.city} ${order.shippingAddress.postalCode || ''}`
                    : '—'}
                </div>
                <div>
                  <div className="qk-secondary" style={{ fontSize: 11 }}>Billing</div>
                  {order.billingAddress
                    ? `${order.billingAddress.line1}, ${order.billingAddress.city}`
                    : '—'}
                </div>
              </div>
              <h3 className="qk-section-title" style={{ margin: '14px 0 8px' }}>Reservations</h3>
              {soReservations.length === 0 && <div className="qk-muted" style={{ fontSize: 13 }}>No reservations yet.</div>}
              {soReservations.map((r) => (
                <div key={r.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--qk-border)' }}>
                  <span>{r.id.slice(0, 10)} · {r.sku} · {r.quantity} · {r.strategy}</span>
                  <QkStatusBadge label={r.status} tone={statusTone(r.status)} />
                </div>
              ))}
            </section>
          </div>
        )}

        {tab === 'items' && (
          <QkTable columns={itemColumns} rows={order.items} emptyTitle="No line items." />
        )}

        {tab === 'availability' && (
          <section className="qk-surface" style={{ padding: 14 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Availability (ATP)</h3>
            {order.items.map((item) => {
              const product = products.find((p) => p.sku === item.sku)
              const atp = getAtp(item.sku, order.allowMultiWarehouse ? undefined : order.warehouseId, product)
              const fulfillable = item.reservedQty > 0 ? item.reservedQty : Math.min(item.orderedQty, atp)
              const backordered = item.backorderedQty > 0 ? item.backorderedQty : Math.max(0, item.orderedQty - fulfillable)
              return (
                <div key={item.id} style={{ padding: '10px 0', borderBottom: '1px solid var(--qk-border)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                    <div>
                      <strong style={{ fontSize: 13 }}>{item.sku}</strong>
                      <div className="qk-secondary" style={{ fontSize: 12 }}>{item.product}</div>
                    </div>
                    <QkStatusBadge
                      label={backordered > 0 && fulfillable > 0 ? 'PARTIALLY RESERVED' : backordered > 0 ? 'SHORT' : 'OK'}
                      tone={backordered > 0 ? 'warning' : 'success'}
                    />
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, fontSize: 13 }}>
                    <div><span className="qk-secondary">Requested</span><div>{formatNumber(item.orderedQty)}</div></div>
                    <div><span className="qk-secondary">Available (ATP)</span><div>{formatNumber(item.reservedQty > 0 ? item.reservedQty + (inventory.filter((i) => i.sku === item.sku && i.warehouseId === order.warehouseId).reduce((s, i) => s + i.available, 0)) : atp)}</div></div>
                    <div><span className="qk-secondary">Reserved</span><div>{formatNumber(item.reservedQty)}</div></div>
                    <div><span className="qk-secondary">Backordered</span><div>{formatNumber(backordered)}</div></div>
                  </div>
                </div>
              )
            })}
          </section>
        )}

        {tab === 'allocation' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
              <h3 className="qk-section-title" style={{ margin: 0 }}>
                Allocation {soAllocs[0] ? `· Strategy: ${soAllocs[0].strategy}` : ''}
              </h3>
              {soReservations.some((r) => r.status === 'ACTIVE') && (
                <QkButton
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const r = soReservations.find((x) => x.status === 'ACTIVE')
                    if (r) runSafe(() => svcReleaseReservation(r.id, 'Neha Kulkarni'), 'Reservation released')
                  }}
                >
                  Release Reservation
                </QkButton>
              )}
            </div>
            {order.items.map((item) => {
              const lines = soAllocs.filter((a) => a.soLineId === item.id)
              return (
                <div key={item.id} style={{ marginBottom: 16 }}>
                  <div style={{ fontSize: 13, marginBottom: 6 }}>
                    <strong>{item.product}</strong>
                    <span className="qk-secondary"> · Requested: {item.orderedQty} · Reserved: {item.reservedQty}</span>
                  </div>
                  {lines.length === 0 ? (
                    <div className="qk-muted" style={{ fontSize: 13 }}>No allocations yet — confirm the order to reserve.</div>
                  ) : (
                    <QkTable columns={allocColumns} rows={lines} emptyTitle="" />
                  )}
                </div>
              )
            })}
            {/* Multi-warehouse summary */}
            {soAllocs.length > 0 && (
              <div className="qk-surface" style={{ padding: 12, marginTop: 8 }}>
                <h4 className="qk-section-title" style={{ marginBottom: 8 }}>By warehouse</h4>
                {Array.from(new Set(soAllocs.map((a) => a.warehouseId))).map((whId) => {
                  const wh = warehouses.find((w) => w.id === whId)
                  const qty = soAllocs.filter((a) => a.warehouseId === whId).reduce((s, a) => s + a.allocatedQty, 0)
                  return (
                    <div key={whId} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                      <span>{wh?.name || whId}</span>
                      <span>Reserved = {formatNumber(qty)}</span>
                    </div>
                  )
                })}
              </div>
            )}
          </section>
        )}

        {tab === 'picking' && (
          <section>
            {soPicklists.length === 0 ? (
              <div className="qk-surface" style={{ padding: 16 }}>
                <div className="qk-muted" style={{ fontSize: 13, marginBottom: 10 }}>No picklist yet.</div>
                {['Reserved', 'Partially Reserved'].includes(order.status) && (
                  <QkButton onClick={() => runSafe(() => svcGeneratePicklist(order.id, 'Neha Kulkarni'), 'Picklist generated')}>
                    Generate Picklist
                  </QkButton>
                )}
              </div>
            ) : (
              soPicklists.map((pl) => (
                <div key={pl.id} className="qk-surface" style={{ padding: 14, marginBottom: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                    <div>
                      <strong>{pl.picklistNo}</strong>
                      <span className="qk-secondary" style={{ marginLeft: 8, fontSize: 12 }}>{pl.warehouse}</span>
                    </div>
                    <QkStatusBadge label={pl.status} tone={statusTone(pl.status)} />
                  </div>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                    <thead>
                      <tr style={{ textAlign: 'left', color: 'var(--qk-text-secondary)' }}>
                        <th style={{ padding: '6px 4px' }}>SKU</th>
                        <th>Batch</th>
                        <th>Expiry</th>
                        <th>Location</th>
                        <th style={{ textAlign: 'right' }}>Req</th>
                        <th style={{ textAlign: 'right' }}>Picked</th>
                        <th style={{ textAlign: 'right' }}>Rem</th>
                        <th />
                      </tr>
                    </thead>
                    <tbody>
                      {pl.lines.map((line) => (
                        <tr key={line.id} style={{ borderTop: '1px solid var(--qk-border)' }}>
                          <td style={{ padding: '8px 4px' }}>{line.sku}<div className="qk-secondary">{line.product}</div></td>
                          <td>{line.batchNo}</td>
                          <td>{formatDate(line.expiry)}</td>
                          <td>{line.zone}/{line.rack}/{line.shelf}/{line.bin}</td>
                          <td style={{ textAlign: 'right' }}>{line.requiredQty}</td>
                          <td style={{ textAlign: 'right' }}>{line.pickedQty}</td>
                          <td style={{ textAlign: 'right' }}>{line.requiredQty - line.pickedQty}</td>
                          <td style={{ textAlign: 'right' }}>
                            {line.status !== 'Picked' && (
                              <QkButton
                                size="sm"
                                onClick={() => {
                                  setPickDrawer({ picklistId: pl.id, line })
                                  setScanBin(line.bin)
                                  setScanSku(line.sku)
                                  setScanBatch(line.batchNo)
                                  setPickQty(String(line.requiredQty - line.pickedQty))
                                }}
                              >
                                Start Picking
                              </QkButton>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ))
            )}
          </section>
        )}

        {tab === 'packing' && (
          <section className="qk-surface" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="qk-section-title" style={{ margin: 0 }}>Packing</h3>
              {totals.picked > 0 && totals.packed < totals.picked && !['Dispatched', 'Delivered'].includes(order.status) && (
                <QkButton size="sm" onClick={() => runSafe(() => svcCreatePacking(order.id, 'Neha Kulkarni'), 'Packing complete')}>
                  Complete Packing
                </QkButton>
              )}
            </div>
            {soPackings.length === 0 && <div className="qk-muted" style={{ fontSize: 13 }}>No packages yet. Pick stock first, then pack.</div>}
            {soPackings.map((pkg) => (
              <div key={pkg.id} style={{ marginBottom: 12, borderBottom: '1px solid var(--qk-border)', paddingBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <strong style={{ fontSize: 13 }}>{pkg.packingNumber}</strong>
                  <QkStatusBadge label={pkg.status} tone={statusTone(pkg.status)} />
                </div>
                <div className="qk-secondary" style={{ fontSize: 12, marginBottom: 6 }}>
                  Packages: {pkg.packageCount} · Packed by {pkg.packedBy} · {formatDate(pkg.packingDate)}
                </div>
                {pkg.lines.map((l) => (
                  <div key={l.id} style={{ fontSize: 13, display: 'flex', justifyContent: 'space-between', padding: '4px 0' }}>
                    <span>Package {l.packageNumber}: {l.sku} · {l.batchNo}</span>
                    <span>Qty {l.quantity}</span>
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {tab === 'shipment' && (
          <section className="qk-surface" style={{ padding: 14 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="qk-section-title" style={{ margin: 0 }}>Shipment / Dispatch</h3>
              {['Packed', 'Dispatch Ready'].includes(order.status) && !soDispatches.length && (
                <QkButton size="sm" onClick={() => setDispatchOpen(true)}>Prepare Dispatch</QkButton>
              )}
            </div>
            {soDispatches.length === 0 && <div className="qk-muted" style={{ fontSize: 13 }}>No shipment yet.</div>}
            {soDispatches.map((d) => (
              <div key={d.id} style={{ marginBottom: 12 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
                  <strong>{d.dispatchNo}</strong>
                  <QkStatusBadge label={d.status} tone={statusTone(d.status)} />
                </div>
                <dl style={{ display: 'grid', gridTemplateColumns: '120px 1fr', gap: 4, fontSize: 13, margin: 0 }}>
                  <dt className="qk-secondary">Warehouse</dt><dd style={{ margin: 0 }}>{d.warehouse}</dd>
                  <dt className="qk-secondary">Carrier</dt><dd style={{ margin: 0 }}>{d.carrier || '—'}</dd>
                  <dt className="qk-secondary">Vehicle</dt><dd style={{ margin: 0 }}>{d.vehicle}</dd>
                  <dt className="qk-secondary">Driver</dt><dd style={{ margin: 0 }}>{d.driver}</dd>
                  <dt className="qk-secondary">Tracking</dt><dd style={{ margin: 0 }}>{d.trackingNumber || '—'}</dd>
                  <dt className="qk-secondary">Packages</dt><dd style={{ margin: 0 }}>{d.packageCount || d.items}</dd>
                  <dt className="qk-secondary">Dispatched</dt><dd style={{ margin: 0 }}>{formatDateTime(d.dispatchedAt)}</dd>
                </dl>
                <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                  {d.status === 'Handed Over' && (
                    <QkButton size="sm" onClick={() => runSafe(() => svcAdvanceShipment(d.id, 'In Transit'), 'In transit')}>Mark In Transit</QkButton>
                  )}
                  {d.status === 'In Transit' && (
                    <QkButton size="sm" onClick={() => runSafe(() => svcAdvanceShipment(d.id, 'Delivered'), 'Delivered')}>Mark Delivered</QkButton>
                  )}
                </div>
              </div>
            ))}
          </section>
        )}

        {tab === 'returns' && (
          <section>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
              <h3 className="qk-section-title" style={{ margin: 0 }}>Returns</h3>
              {(order.status === 'Delivered' || soDispatches.some((d) => d.status === 'Delivered')) && (
                <QkButton size="sm" onClick={() => setReturnOpen(true)}>Create Return</QkButton>
              )}
            </div>
            {soReturns.length === 0 && <div className="qk-muted" style={{ fontSize: 13 }}>No returns for this order.</div>}
            {soReturns.map((r) => (
              <div key={r.id} className="qk-surface" style={{ padding: 12, marginBottom: 10 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <strong style={{ fontSize: 13 }}>{r.returnNo}</strong>
                  <QkStatusBadge label={r.status} tone={statusTone(r.status)} />
                </div>
                <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)', marginBottom: 8 }}>
                  {formatDateTime(r.createdAt)} · {r.reason} · QC: {r.qcResult}
                </div>
                {r.lines.map((l) => (
                  <div key={l.id} style={{ fontSize: 13, padding: '4px 0' }}>
                    {l.sku} · Batch {l.originalBatch} · Qty {l.returnQty}
                    {(l.reusableQty || l.damagedQty || l.wastageQty) > 0 && (
                      <span className="qk-secondary"> · Reusable {l.reusableQty} · Damaged {l.damagedQty} · Wastage {l.wastageQty}</span>
                    )}
                  </div>
                ))}
                {r.status === 'QC' && (
                  <QkButton size="sm" style={{ marginTop: 8 }} onClick={() => {
                    setQcOpen(r)
                    const l = r.lines[0]
                    setQcReusable(String(Math.max(0, (l?.returnQty || 0) - 2)))
                    setQcDamaged('2')
                    setQcWastage('0')
                  }}
                  >
                    Perform QC
                  </QkButton>
                )}
              </div>
            ))}
          </section>
        )}

        {tab === 'activity' && (
          <section className="qk-surface" style={{ padding: 14 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Activity</h3>
            {activity.length === 0 && <div className="qk-muted" style={{ fontSize: 13 }}>No activity yet.</div>}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {activity.map((e, idx) => (
                <div key={`${e.at}-${idx}`} style={{ display: 'grid', gridTemplateColumns: '140px 1fr', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--qk-border)', fontSize: 13 }}>
                  <span className="qk-secondary">{formatDateTime(e.at)}</span>
                  <span>{e.text}</span>
                </div>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Picking overlay */}
      <QkDrawer
        open={!!pickDrawer}
        onClose={() => setPickDrawer(null)}
        title="Picking"
        subtitle={pickDrawer ? `${pickDrawer.line.sku} · ${pickDrawer.line.batchNo}` : undefined}
        footer={(
          <>
            <QkButton variant="outline" onClick={() => setPickDrawer(null)}>Cancel</QkButton>
            <QkButton onClick={submitPick}>Confirm Pick</QkButton>
          </>
        )}
      >
        {pickDrawer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="qk-surface" style={{ padding: 10, fontSize: 12 }}>
              Expected: Bin <strong>{pickDrawer.line.bin}</strong> · SKU <strong>{pickDrawer.line.sku}</strong> · Batch <strong>{pickDrawer.line.batchNo}</strong>
              <div>Remaining: {pickDrawer.line.requiredQty - pickDrawer.line.pickedQty}</div>
            </div>
            <QkInput label="Scan bin" value={scanBin} onChange={(e) => setScanBin(e.target.value)} placeholder={pickDrawer.line.bin} />
            <QkInput label="Scan SKU" value={scanSku} onChange={(e) => setScanSku(e.target.value)} />
            <QkInput label="Scan batch" value={scanBatch} onChange={(e) => setScanBatch(e.target.value)} />
            <QkInput label="Quantity" type="number" value={pickQty} onChange={(e) => setPickQty(e.target.value)} />
          </div>
        )}
      </QkDrawer>

      <QkModal
        open={dispatchOpen}
        onClose={() => setDispatchOpen(false)}
        title="Prepare dispatch"
        footer={(
          <>
            <QkButton variant="outline" onClick={() => setDispatchOpen(false)}>Cancel</QkButton>
            <QkButton onClick={submitDispatch}>Handover</QkButton>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QkInput label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} />
          <QkInput label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} />
          <QkInput label="Carrier" value={carrier} onChange={(e) => setCarrier(e.target.value)} />
          <QkInput label="Tracking number" value={tracking} onChange={(e) => setTracking(e.target.value)} placeholder="Auto if blank" />
        </div>
      </QkModal>

      <QkModal
        open={returnOpen}
        onClose={() => setReturnOpen(false)}
        title="Create return"
        footer={(
          <>
            <QkButton variant="outline" onClick={() => setReturnOpen(false)}>Cancel</QkButton>
            <QkButton onClick={submitReturn}>Create Return</QkButton>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <QkInput label="Original SO" value={order.soNumber} readOnly />
          <QkSelect
            label="SKU"
            value={retSku}
            options={order.items.map((i) => ({ label: `${i.sku} · ${i.product}`, value: i.sku }))}
            onChange={(e) => setRetSku(e.target.value)}
          />
          <QkSelect
            label="Original batch"
            value={retBatch}
            placeholder="Select batch"
            options={Array.from(new Set([
              ...soAllocs.map((a) => a.batchNo),
              ...order.items.map((i) => i.batch).filter(Boolean) as string[],
            ])).map((b) => ({ label: b, value: b }))}
            onChange={(e) => setRetBatch(e.target.value)}
          />
          <QkInput label="Returned qty" type="number" value={retQty} onChange={(e) => setRetQty(e.target.value)} />
          <QkInput label="Reason" value={retReason} onChange={(e) => setRetReason(e.target.value)} />
        </div>
      </QkModal>

      <QkModal
        open={!!qcOpen}
        onClose={() => setQcOpen(null)}
        title="Return QC disposition"
        footer={(
          <>
            <QkButton variant="outline" onClick={() => setQcOpen(null)}>Cancel</QkButton>
            <QkButton onClick={submitQc}>Complete QC</QkButton>
          </>
        )}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          <div style={{ fontSize: 13 }}>Returned qty: {qcOpen?.lines[0]?.returnQty}</div>
          <QkInput label="Reusable → PUTAWAY_PENDING" type="number" value={qcReusable} onChange={(e) => setQcReusable(e.target.value)} />
          <QkInput label="Damaged" type="number" value={qcDamaged} onChange={(e) => setQcDamaged(e.target.value)} />
          <QkInput label="Wastage" type="number" value={qcWastage} onChange={(e) => setQcWastage(e.target.value)} />
          <div className="qk-secondary" style={{ fontSize: 12 }}>Reusable + Damaged + Wastage must equal returned qty.</div>
        </div>
      </QkModal>

      {isMobile && actions.length > 0 && (
        <QkStickyActions>
          {actions.slice(0, 2)}
        </QkStickyActions>
      )}
    </div>
  )
}
