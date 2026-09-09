import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkStepper, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatCurrency, formatDate, formatNumber, statusTone } from '../../utils'
import type { SalesOrderItem } from '../../types'

const FLOW = [
  { id: 'order', label: 'Sales Order' },
  { id: 'availability', label: 'Availability' },
  { id: 'reservation', label: 'Reservation' },
  { id: 'picklist', label: 'Picklist' },
  { id: 'picking', label: 'Picking' },
  { id: 'verification', label: 'Verification' },
  { id: 'dispatch', label: 'Dispatch' },
  { id: 'handover', label: 'Handover' },
]

function stepFor(status: string) {
  switch (status) {
    case 'Draft':
    case 'Confirmed':
      return 'availability'
    case 'Reserved':
      return 'reservation'
    case 'Picking':
      return 'picking'
    case 'Packed':
      return 'verification'
    case 'Dispatched':
      return 'dispatch'
    case 'Delivered':
      return 'handover'
    default:
      return 'order'
  }
}

export function SalesOrderDetailsPage() {
  const { id } = useParams()
  const { salesOrders, inventory } = useData()
  const order = salesOrders.find((s) => s.id === id)

  if (!order) {
    return (
      <div className="qk-page">
        <PageHeader title="Sales order not found" />
        <Link to="/sales-orders"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const columns: QkColumn<SalesOrderItem>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product' },
    { key: 'orderedQty', header: 'Ordered', align: 'right' },
    { key: 'reservedQty', header: 'Reserved', align: 'right' },
    { key: 'pickedQty', header: 'Picked', align: 'right' },
    { key: 'dispatchedQty', header: 'Dispatched', align: 'right' },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (r) => formatCurrency(r.unitPrice) },
    { key: 'total', header: 'Total', align: 'right', render: (r) => formatCurrency(r.total) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={order.soNumber}
        subtitle={`${order.customer} · ${order.warehouse}`}
        actions={
          <>
            <Link to="/reservations"><QkButton variant="outline">Reservations</QkButton></Link>
            <Link to="/picking"><QkButton>Open picking</QkButton></Link>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <QkStatusBadge label={order.status} tone={statusTone(order.status)} />
        <span className="qk-muted" style={{ fontSize: 12 }}>Ordered {formatDate(order.orderDate)} · Delivery {formatDate(order.deliveryDate)}</span>
      </div>

      <section className="qk-surface" style={{ padding: 16 }}>
        <QkStepper steps={FLOW} current={stepFor(order.status)} />
      </section>

      <div className="qk-grid-metrics">
        <QkMetric label="Amount" value={formatCurrency(order.amount)} />
        <QkMetric label="Items" value={order.itemCount} />
        <QkMetric label="Created by" value={order.createdBy} />
        <QkMetric label="Warehouse" value={order.warehouse} />
      </div>

      <section>
        <h3 className="qk-section-title" style={{ marginBottom: 10 }}>Order items</h3>
        <QkTable columns={columns} rows={order.items} emptyTitle="No line items." />
      </section>

      <section className="qk-surface" style={{ padding: 16 }}>
        <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Availability check</h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {order.items.map((item) => {
            const available = inventory
              .filter((i) => i.sku === item.sku && i.warehouse === order.warehouse)
              .reduce((s, i) => s + i.available, 0)
            const ok = available >= item.orderedQty
            return (
              <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--qk-border)' }}>
                <div>
                  <strong>{item.sku}</strong>
                  <div className="qk-secondary" style={{ fontSize: 12 }}>{item.product}</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>Need {formatNumber(item.orderedQty)} · Available {formatNumber(available)}</div>
                  <QkStatusBadge label={ok ? 'Available' : 'Short'} tone={ok ? 'success' : 'danger'} />
                </div>
              </div>
            )
          })}
        </div>
      </section>
    </div>
  )
}
