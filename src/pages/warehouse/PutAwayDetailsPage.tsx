import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkSelect, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, statusTone } from '../../utils'

export function PutAwayDetailsPage() {
  const { id } = useParams()
  const { putAwayTasks, bins, svcConfirmPutAway } = useData()
  const { pushToast } = useToast()
  const task = putAwayTasks.find((t) => t.id === id)
  const warehouseBins = bins.filter((b) => b.warehouseId === task?.warehouseId && b.status === 'Available')
  const [destination, setDestination] = useState(task?.destinationBinId || task?.suggestedBinId || '')
  const [saving, setSaving] = useState(false)

  if (!task) {
    return (
      <div className="qk-page">
        <PageHeader title="Put-away task not found" />
        <Link to="/put-away"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const confirm = async () => {
    if (!destination.trim()) {
      pushToast({ tone: 'warning', title: 'Destination required', message: 'Select a bin' })
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    try {
      svcConfirmPutAway({ taskId: task.id, binId: destination, performedBy: 'Ankit Verma' })
      pushToast({ tone: 'success', title: 'Put-away confirmed', message: `${task.sku} moved to AVAILABLE` })
    } catch (err) {
      pushToast({ tone: 'danger', title: 'Put-away failed', message: err instanceof Error ? err.message : 'Unable to confirm' })
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={`Put-away · ${task.sku}`}
        subtitle={`${task.product} · Batch ${task.batch} · ${task.warehouse}`}
        actions={
          <>
            <Link to="/put-away"><QkButton variant="outline">Queue</QkButton></Link>
            {task.status !== 'Completed' && <QkButton loading={saving} onClick={confirm}>Confirm put-away</QkButton>}
          </>
        }
      />
      <QkStatusBadge label={task.status} tone={statusTone(task.status)} />
      <div className="qk-grid-metrics">
        <QkMetric label="Quantity" value={formatNumber(task.quantity)} />
        <QkMetric label="Assigned" value={task.assignedTo} />
        <QkMetric label="Current" value={task.currentLocation} />
      </div>
      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Suggested location</h3>
          <div style={{ padding: 14, borderRadius: 6, background: 'var(--qk-primary-soft)', color: 'var(--qk-primary)', fontWeight: 650, fontSize: 18 }}>
            {task.suggestedLocation}
          </div>
          <div style={{ marginTop: 12, fontSize: 13 }} className="qk-secondary">Suggested storage bin from warehouse hierarchy</div>
        </section>
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Destination bin</h3>
          <QkSelect
            label="Select bin"
            value={destination}
            options={warehouseBins.map((b) => ({ label: `${b.code} (${b.binType})`, value: b.id }))}
            onChange={(e) => setDestination(e.target.value)}
          />
        </section>
      </div>
    </div>
  )
}
