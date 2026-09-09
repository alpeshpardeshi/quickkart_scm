import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkInput, QkMetric, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, statusTone } from '../../utils'

export function DispatchDetailsPage() {
  const { id } = useParams()
  const { dispatches, setDispatches, salesOrders } = useData()
  const { pushToast } = useToast()
  const record = dispatches.find((d) => d.id === id)
  const order = salesOrders.find((s) => s.soNumber === record?.soNumber)
  const [vehicle, setVehicle] = useState(record?.vehicle === '—' ? '' : record?.vehicle || '')
  const [driver, setDriver] = useState(record?.driver === '—' ? '' : record?.driver || '')

  if (!record) {
    return (
      <div className="qk-page">
        <PageHeader title="Dispatch not found" />
        <Link to="/dispatch"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const advance = (status: typeof record.status) => {
    if ((status === 'Ready' || status === 'Handed Over') && (!vehicle.trim() || !driver.trim())) {
      pushToast({ tone: 'warning', title: 'Missing details', message: 'Vehicle and driver required' })
      return
    }
    setDispatches((prev) =>
      prev.map((d) =>
        d.id === record.id
          ? {
              ...d,
              status,
              vehicle: vehicle.trim() || d.vehicle,
              driver: driver.trim() || d.driver,
              dispatchedAt: status === 'Handed Over' ? new Date().toISOString() : d.dispatchedAt,
            }
          : d,
      ),
    )
    pushToast({ tone: 'success', title: 'Dispatch updated', message: `${record.dispatchNo} → ${status}` })
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={record.dispatchNo}
        subtitle={`${record.soNumber} · ${record.customer} · ${record.warehouse}`}
        actions={
          <>
            <Link to="/dispatch"><QkButton variant="outline">Queue</QkButton></Link>
            {record.status === 'Queued' && <QkButton onClick={() => advance('Verifying')}>Start verification</QkButton>}
            {record.status === 'Verifying' && <QkButton onClick={() => advance('Ready')}>Mark ready</QkButton>}
            {(record.status === 'Ready' || record.status === 'Verifying') && <QkButton onClick={() => advance('Handed Over')}>Confirm handover</QkButton>}
          </>
        }
      />
      <QkStatusBadge label={record.status} tone={statusTone(record.status)} />
      <div className="qk-grid-metrics">
        <QkMetric label="Items" value={record.items} />
        <QkMetric label="Vehicle" value={vehicle || record.vehicle} />
        <QkMetric label="Driver" value={driver || record.driver} />
        <QkMetric label="Dispatched" value={formatDateTime(record.dispatchedAt)} />
      </div>
      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Verification</h3>
          <QkInput label="Vehicle" value={vehicle} onChange={(e) => setVehicle(e.target.value)} placeholder="MH-02-AB-4412" />
          <QkInput label="Driver" value={driver} onChange={(e) => setDriver(e.target.value)} />
        </section>
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Order lines</h3>
          {(order?.items || []).map((item) => (
            <div key={item.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '8px 0', borderBottom: '1px solid var(--qk-border)' }}>
              <div>
                <strong>{item.sku}</strong>
                <div className="qk-secondary" style={{ fontSize: 12 }}>{item.product} · Batch {item.batch || '—'}</div>
              </div>
              <strong>{item.dispatchedQty || item.pickedQty}/{item.orderedQty}</strong>
            </div>
          ))}
          {!order?.items?.length && <div className="qk-secondary">No linked order lines.</div>}
        </section>
      </div>
    </div>
  )
}
