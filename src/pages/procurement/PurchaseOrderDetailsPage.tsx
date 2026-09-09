import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton,
  QkMetric,
  QkStatusBadge,
  QkStepper,
  QkTable,
  type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatCurrency, formatDate, formatNumber, statusTone } from '../../utils'
import type { PurchaseOrderItem } from '../../types'

const PO_STEPS = [
  { id: 'Draft', label: 'Draft' },
  { id: 'Pending Approval', label: 'Pending Approval' },
  { id: 'Published', label: 'Published' },
  { id: 'Receiving', label: 'Receiving' },
  { id: 'Closed', label: 'Closed' },
]

export function PurchaseOrderDetailsPage() {
  const { id } = useParams()
  const { purchaseOrders, receiving } = useData()
  const po = purchaseOrders.find((p) => p.id === id)
  const relatedGrn = receiving.filter((r) => r.poNumber === po?.poNumber)

  if (!po) {
    return (
      <div className="qk-page">
        <PageHeader title="Purchase order not found" subtitle="This PO does not exist in the mock dataset." />
        <Link to="/purchase-orders">
          <QkButton variant="outline">Back to purchase orders</QkButton>
        </Link>
      </div>
    )
  }

  const stepId = po.status === 'Cancelled' ? 'Draft' : po.status
  const receivedQty = po.items.reduce((s, i) => s + i.receivedQty, 0)
  const orderedQty = po.items.reduce((s, i) => s + i.orderedQty, 0)

  const itemCols: QkColumn<PurchaseOrderItem>[] = [
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'orderedQty', header: 'Ordered', align: 'right', render: (r) => formatNumber(r.orderedQty) },
    { key: 'receivedQty', header: 'Received', align: 'right', render: (r) => formatNumber(r.receivedQty) },
    { key: 'pendingQty', header: 'Pending', align: 'right', render: (r) => formatNumber(r.pendingQty) },
    { key: 'unitPrice', header: 'Unit price', align: 'right', render: (r) => formatCurrency(r.unitPrice) },
    { key: 'total', header: 'Line total', align: 'right', render: (r) => formatCurrency(r.total) },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} />,
    },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={po.poNumber}
        subtitle={`${po.vendor} · ${po.warehouse}`}
        actions={
          <>
            <Link to="/purchase-orders">
              <QkButton variant="outline">All POs</QkButton>
            </Link>
            <Link to="/zoho-sync">
              <QkButton variant="outline">Zoho sync</QkButton>
            </Link>
            {(po.status === 'Draft' || po.status === 'Pending Approval') && (
              <Link to={`/purchase-orders/${po.id}/edit`}>
                <QkButton variant="outline">Edit</QkButton>
              </Link>
            )}
            {po.status === 'Pending Approval' && (
              <Link to="/approvals">
                <QkButton>Go to approvals</QkButton>
              </Link>
            )}
          </>
        }
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <QkStatusBadge label={po.status} tone={statusTone(po.status)} />
        <QkStatusBadge label={`Zoho: ${po.zohoStatus}`} tone={statusTone(po.zohoStatus)} />
        <span className="qk-muted" style={{ fontSize: 12 }}>
          Created {formatDate(po.createdAt)} by {po.createdBy}
        </span>
      </div>

      {po.status !== 'Cancelled' && (
        <section className="qk-surface" style={{ padding: '14px 16px' }}>
          <QkStepper steps={PO_STEPS} current={stepId} />
        </section>
      )}

      <div className="qk-grid-metrics">
        <QkMetric label="Amount" value={formatCurrency(po.amount)} />
        <QkMetric label="Line items" value={po.itemCount} />
        <QkMetric label="Received / ordered" value={`${formatNumber(receivedQty)} / ${formatNumber(orderedQty)}`} />
        <QkMetric label="Expected delivery" value={formatDate(po.expectedDelivery)} />
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
            Order details
          </h3>
          <DetailGrid
            rows={[
              ['PO Number', po.poNumber],
              ['Vendor', po.vendor],
              ['Warehouse', po.warehouse],
              ['Status', po.status],
              ['Expected delivery', formatDate(po.expectedDelivery)],
              ['Created by', po.createdBy],
            ]}
          />
        </section>
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
            Zoho Books sync
          </h3>
          <DetailGrid
            rows={[
              ['Sync status', po.zohoStatus],
              ['Billable amount', formatCurrency(po.amount)],
              ['Linked GRNs', relatedGrn.length ? relatedGrn.map((g) => g.grnNumber).join(', ') : 'None'],
              [
                'Last inbound',
                relatedGrn[0] ? formatDate(relatedGrn[0].receivedAt.slice(0, 10)) : '—',
              ],
            ]}
          />
        </section>
      </div>

      <section>
        <h3 className="qk-section-title" style={{ marginBottom: 10 }}>
          Line items
        </h3>
        <QkTable columns={itemCols} rows={po.items} emptyTitle="No line items on this PO." />
      </section>
    </div>
  )
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
          <span className="qk-secondary">{label}</span>
          <strong style={{ textAlign: 'right' }}>{value}</strong>
        </div>
      ))}
    </div>
  )
}
