import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkInput, QkMetric, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatNumber, statusTone } from '../../utils'

export function ReturnDetailsPage() {
  const { id } = useParams()
  const { returns, setReturns } = useData()
  const { pushToast } = useToast()
  const record = returns.find((r) => r.id === id)
  const [reusable, setReusable] = useState(String(record?.reusableQty ?? 0))
  const [damaged, setDamaged] = useState(String(record?.damagedQty ?? 0))
  const [wastage, setWastage] = useState(String(record?.wastageQty ?? 0))

  if (!record) {
    return (
      <div className="qk-page">
        <PageHeader title="Return not found" />
        <Link to="/returns"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const saveQc = () => {
    const re = Number(reusable)
    const da = Number(damaged)
    const wa = Number(wastage)
    if (re + da + wa !== record.returnedQty) {
      pushToast({ tone: 'warning', title: 'Quantities must match', message: `Total must equal ${record.returnedQty}` })
      return
    }
    setReturns((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? {
              ...r,
              reusableQty: re,
              damagedQty: da,
              wastageQty: wa,
              qcResult: da + wa === 0 ? 'Passed' : re === 0 ? 'Failed' : 'Partial',
              status: 'Closed',
            }
          : r,
      ),
    )
    pushToast({ tone: 'success', title: 'Return QC saved', message: record.returnNo })
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={record.returnNo}
        subtitle={`${record.soNumber} · ${record.customer}`}
        actions={
          <>
            <Link to="/returns"><QkButton variant="outline">All returns</QkButton></Link>
            {record.soId && <Link to={`/sales-orders/${record.soId}`}><QkButton variant="outline">View Sales Order</QkButton></Link>}
            {record.status !== 'Closed' && <QkButton onClick={saveQc}>Save QC decision</QkButton>}
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <QkStatusBadge label={record.status} tone={statusTone(record.status)} />
        <QkStatusBadge label={record.qcResult} tone={statusTone(record.qcResult)} />
      </div>
      <div className="qk-grid-metrics">
        <QkMetric label="Returned" value={formatNumber(record.returnedQty)} />
        <QkMetric label="Reusable" value={formatNumber(Number(reusable) || 0)} />
        <QkMetric label="Damaged" value={formatNumber(Number(damaged) || 0)} />
        <QkMetric label="Wastage" value={formatNumber(Number(wastage) || 0)} />
      </div>
      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Traceability</h3>
          {[
            ['SKU', record.sku],
            ['Product', record.product],
            ['Batch', record.batch],
            ['Original SO', record.soNumber],
            ['Reason', record.reason],
            ['Created', formatDate(record.createdAt)],
          ].map(([k, v]) => (
            <div key={k} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--qk-border)' }}>
              <span className="qk-secondary">{k}</span>
              <strong style={{ textAlign: 'right' }}>{v}</strong>
            </div>
          ))}
        </section>
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Return QC / Decision</h3>
          {record.status === 'Closed' ? (
            <div className="qk-secondary" style={{ fontSize: 13 }}>Decision already closed for this return.</div>
          ) : (
            <>
              <QkInput label="Reusable qty" type="number" value={reusable} onChange={(e) => setReusable(e.target.value)} />
              <QkInput label="Damaged qty" type="number" value={damaged} onChange={(e) => setDamaged(e.target.value)} />
              <QkInput label="Wastage qty" type="number" value={wastage} onChange={(e) => setWastage(e.target.value)} />
            </>
          )}
        </section>
      </div>
    </div>
  )
}
