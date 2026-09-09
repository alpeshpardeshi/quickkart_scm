import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatNumber, statusTone } from '../../utils'
import type { SalesOrderItem } from '../../types'

export function PicklistDetailsPage() {
  const { id } = useParams()
  const { picklists, setPicklists, salesOrders } = useData()
  const { pushToast } = useToast()
  const picklist = picklists.find((p) => p.id === id)
  const order = salesOrders.find((s) => s.soNumber === picklist?.soNumber)

  if (!picklist) {
    return (
      <div className="qk-page">
        <PageHeader title="Picklist not found" />
        <Link to="/picklists"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const start = () => {
    setPicklists((prev) => prev.map((p) => (p.id === picklist.id ? { ...p, status: 'In Progress' } : p)))
    pushToast({ tone: 'success', title: 'Picklist started', message: picklist.picklistNo })
  }

  const columns: QkColumn<SalesOrderItem>[] = [
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product' },
    { key: 'orderedQty', header: 'Required', align: 'right', render: (r) => formatNumber(r.orderedQty) },
    { key: 'pickedQty', header: 'Picked', align: 'right', render: (r) => formatNumber(r.pickedQty) },
    { key: 'batch', header: 'Batch', render: (r) => r.batch || '—' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={picklist.picklistNo}
        subtitle={`${picklist.soNumber} · ${picklist.warehouse} · Assigned to ${picklist.assignedTo}`}
        actions={
          <>
            <Link to="/picklists"><QkButton variant="outline">All picklists</QkButton></Link>
            {picklist.status === 'Open' && <QkButton onClick={start}>Start picking</QkButton>}
            <Link to="/picking"><QkButton variant={picklist.status === 'Open' ? 'outline' : 'primary'}>Open picking screen</QkButton></Link>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <QkStatusBadge label={picklist.status} tone={statusTone(picklist.status)} />
        <QkStatusBadge label={picklist.priority} tone={statusTone(picklist.priority)} />
        <span className="qk-muted" style={{ fontSize: 12 }}>Created {formatDateTime(picklist.createdAt)}</span>
      </div>
      <div className="qk-grid-metrics">
        <QkMetric label="Items" value={picklist.items} />
        <QkMetric label="Picked lines" value={picklist.picked} />
        <QkMetric label="Customer" value={order?.customer || '—'} />
        <QkMetric label="Progress" value={`${picklist.items ? Math.round((picklist.picked / picklist.items) * 100) : 0}%`} />
      </div>
      <QkTable columns={columns} rows={order?.items || []} emptyTitle="No line items linked to this picklist." />
    </div>
  )
}
