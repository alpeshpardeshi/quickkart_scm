import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatDateTime, formatNumber, statusTone } from '../../utils'

export function GrnDetailsPage() {
  const { id } = useParams()
  const { receiving } = useData()
  const record = receiving.find((r) => r.id === id)

  if (!record) {
    return (
      <div className="qk-page">
        <PageHeader title="GRN not found" />
        <Link to="/grn"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={record.grnNumber}
        subtitle={`${record.poNumber} · ${record.vendor} · ${record.warehouse}`}
        actions={
          <>
            <Link to="/grn"><QkButton variant="outline">All GRNs</QkButton></Link>
            <Link to={`/receiving/${record.id}`}><QkButton>Open receiving</QkButton></Link>
          </>
        }
      />
      <QkStatusBadge label={record.status} tone={statusTone(record.status)} />
      <div className="qk-grid-metrics">
        <QkMetric label="Expected" value={formatNumber(record.expectedQty)} />
        <QkMetric label="Received" value={formatNumber(record.receivedQty)} />
        <QkMetric label="Accepted" value={formatNumber(record.acceptedQty)} />
        <QkMetric label="Rejected" value={formatNumber(record.rejectedQty)} />
      </div>
      <section className="qk-surface" style={{ padding: 16, maxWidth: 520 }}>
        <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Details</h3>
        {[
          ['Received by', record.receivedBy],
          ['Started', formatDateTime(record.receivedAt)],
          ['PO', record.poNumber],
          ['Vendor', record.vendor],
          ['Warehouse', record.warehouse],
        ].map(([k, v]) => (
          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--qk-border)' }}>
            <span className="qk-secondary">{k}</span>
            <strong>{v}</strong>
          </div>
        ))}
      </section>
    </div>
  )
}
