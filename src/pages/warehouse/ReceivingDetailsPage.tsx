import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkBarcodeScanner, QkButton, QkInput, QkMetric, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDateTime, formatNumber, statusTone } from '../../utils'

export function ReceivingDetailsPage() {
  const { id } = useParams()
  const { receiving, setReceiving } = useData()
  const { pushToast } = useToast()
  const record = receiving.find((r) => r.id === id)

  const [receivedQty, setReceivedQty] = useState(String(record?.receivedQty || 0))
  const [acceptedQty, setAcceptedQty] = useState(String(record?.acceptedQty || 0))
  const [rejectedQty, setRejectedQty] = useState(String(record?.rejectedQty || 0))
  const [batch, setBatch] = useState('B' + (100 + Math.floor(Math.random() * 50)))
  const [expiry, setExpiry] = useState('2026-12-15')
  const [location, setLocation] = useState('Receiving Dock')
  const [barcode, setBarcode] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  if (!record) {
    return (
      <div className="qk-page">
        <PageHeader title="Receiving not found" />
        <Link to="/receiving"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const handleScan = (code: string) => {
    setBarcode(code)
    setReceivedQty((prev) => String(Number(prev || 0) + 1))
    setAcceptedQty((prev) => String(Number(prev || 0) + 1))
    pushToast({ tone: 'info', title: 'Barcode scanned', message: code })
  }

  const saveProgress = async (complete = false) => {
    const recv = Number(receivedQty)
    const acc = Number(acceptedQty)
    const rej = Number(rejectedQty)
    const next: Record<string, string> = {}
    if (recv < 0) next.receivedQty = 'Invalid quantity'
    if (acc + rej > recv) next.acceptedQty = 'Accepted + rejected cannot exceed received'
    if (!batch.trim()) next.batch = 'Batch is required'
    if (!expiry) next.expiry = 'Expiry is required'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))
    setReceiving((prev) =>
      prev.map((r) =>
        r.id === record.id
          ? {
              ...r,
              receivedQty: recv,
              acceptedQty: acc,
              rejectedQty: rej,
              status: complete ? 'Completed' : recv < r.expectedQty ? 'Partial' : 'In Progress',
              receivedBy: 'Suresh Yadav',
            }
          : r,
      ),
    )
    setSaving(false)
    pushToast({
      tone: 'success',
      title: complete ? 'Receiving completed' : 'Progress saved',
      message: `${record.grnNumber} · Batch ${batch} · Loc ${location}`,
    })
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={record.grnNumber}
        subtitle={`${record.poNumber} · ${record.vendor} · ${record.warehouse}`}
        actions={
          <>
            <QkButton variant="outline" loading={saving} onClick={() => saveProgress(false)}>Save progress</QkButton>
            <QkButton loading={saving} onClick={() => saveProgress(true)}>Complete GRN</QkButton>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
        <QkStatusBadge label={record.status} tone={statusTone(record.status)} />
        <span className="qk-muted" style={{ fontSize: 12 }}>Started {formatDateTime(record.receivedAt)}</span>
      </div>

      <div className="qk-grid-metrics">
        <QkMetric label="Expected" value={formatNumber(record.expectedQty)} />
        <QkMetric label="Received" value={formatNumber(Number(receivedQty) || 0)} />
        <QkMetric label="Accepted" value={formatNumber(Number(acceptedQty) || 0)} />
        <QkMetric label="Rejected" value={formatNumber(Number(rejectedQty) || 0)} />
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Receive quantities</h3>
          <QkInput label="Received qty" type="number" value={receivedQty} error={errors.receivedQty} onChange={(e) => setReceivedQty(e.target.value)} />
          <QkInput label="Accepted qty" type="number" value={acceptedQty} error={errors.acceptedQty} onChange={(e) => setAcceptedQty(e.target.value)} />
          <QkInput label="Rejected qty" type="number" value={rejectedQty} onChange={(e) => setRejectedQty(e.target.value)} />
          <QkInput label="Batch" value={batch} error={errors.batch} onChange={(e) => setBatch(e.target.value)} />
          <QkInput label="Expiry" type="date" value={expiry} error={errors.expiry} onChange={(e) => setExpiry(e.target.value)} />
          <QkInput label="Location" value={location} onChange={(e) => setLocation(e.target.value)} />
        </section>

        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Barcode / QR scanner</h3>
          <p className="qk-secondary" style={{ margin: 0, fontSize: 13 }}>
            Use the device camera or enter a code. Each scan increments received and accepted.
          </p>
          <QkBarcodeScanner value={barcode} onChange={setBarcode} onScan={handleScan} />
          {barcode && (
            <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)' }}>
              Last scan: <strong>{barcode}</strong>
            </div>
          )}
        </section>
      </div>
    </div>
  )
}
