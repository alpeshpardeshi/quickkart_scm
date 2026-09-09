import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatDate, formatNumber, statusTone } from '../../utils'

interface LockRow {
  id: string
  sku: string
  product: string
  batch: string
  warehouse: string
  location: string
  lockedQty: number
  available: number
  reason: string
  status: string
}

export function LockDetailsPage() {
  const { id } = useParams()
  const { salesOrders, inventory } = useData()
  const order = salesOrders.find((s) => s.id === id) || salesOrders.find((s) => s.status === 'Reserved' || s.status === 'Picking')

  if (!order) {
    return (
      <div className="qk-page">
        <PageHeader title="Lock details not found" />
        <Link to="/reservations"><QkButton variant="outline">Back to reservations</QkButton></Link>
      </div>
    )
  }

  const locks: LockRow[] = order.items
    .filter((i) => i.reservedQty > 0 || i.status === 'Reserved' || i.status === 'Picked')
    .map((item) => {
      const inv = inventory.find((i) => i.sku === item.sku && i.warehouse === order.warehouse)
      return {
        id: item.id,
        sku: item.sku,
        product: item.product,
        batch: item.batch || inv?.batch || 'FEFO auto',
        warehouse: order.warehouse,
        location: inv ? `${inv.zone}-${inv.rack}-${inv.shelf}-${inv.bin}` : '—',
        lockedQty: item.reservedQty || item.orderedQty,
        available: inv?.available || 0,
        reason: `Reservation for ${order.soNumber}`,
        status: item.status,
      }
    })

  const columns: QkColumn<LockRow>[] = [
    { key: 'sku', header: 'SKU', render: (r) => <strong style={{ color: 'var(--qk-primary)' }}>{r.sku}</strong> },
    { key: 'product', header: 'Product' },
    { key: 'batch', header: 'Batch' },
    { key: 'location', header: 'Location' },
    { key: 'lockedQty', header: 'Locked', align: 'right', render: (r) => formatNumber(r.lockedQty) },
    { key: 'available', header: 'Available', align: 'right', render: (r) => formatNumber(r.available) },
    { key: 'reason', header: 'Reason' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={`Locks · ${order.soNumber}`}
        subtitle={`${order.customer} · ${order.warehouse} · Delivery ${formatDate(order.deliveryDate)}`}
        actions={
          <>
            <Link to="/reservations"><QkButton variant="outline">Reservations</QkButton></Link>
            <Link to={`/sales-orders/${order.id}`}><QkButton>Open order</QkButton></Link>
          </>
        }
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Locked lines" value={locks.length} />
        <QkMetric label="Units locked" value={formatNumber(locks.reduce((s, r) => s + r.lockedQty, 0))} />
        <QkMetric label="Order status" value={order.status} />
      </div>
      <QkTable columns={columns} rows={locks} emptyTitle="No inventory locks on this order." />
    </div>
  )
}
