import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkInput, QkMetric, QkSelect, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, statusTone } from '../../utils'

const BINS = ['A-R12-S3-B04', 'A-R14-S2-B08', 'B-R04-S1-B12', 'C-R08-S2-B07', 'E-R01-S1-B03', 'F-R03-S1-B02']

export function PutAwayDetailsPage() {
  const { id } = useParams()
  const { putAwayTasks, setPutAwayTasks } = useData()
  const { pushToast } = useToast()
  const task = putAwayTasks.find((t) => t.id === id)
  const [destination, setDestination] = useState(task?.destinationBin || task?.suggestedLocation || '')
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
      pushToast({ tone: 'warning', title: 'Destination required', message: 'Select or enter a bin' })
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 400))
    setPutAwayTasks((prev) => prev.map((t) => (t.id === task.id ? { ...t, destinationBin: destination, status: 'Completed' } : t)))
    setSaving(false)
    pushToast({ tone: 'success', title: 'Put-away confirmed', message: `${task.sku} → ${destination}` })
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
          <div style={{ marginTop: 12, fontSize: 13 }} className="qk-secondary">System FEFO / slotting recommendation</div>
        </section>
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Destination bin</h3>
          <QkSelect label="Select bin" value={destination} options={BINS.map((b) => ({ label: b, value: b }))} onChange={(e) => setDestination(e.target.value)} />
          <QkInput label="Or enter manually" value={destination} onChange={(e) => setDestination(e.target.value)} />
        </section>
      </div>
    </div>
  )
}
