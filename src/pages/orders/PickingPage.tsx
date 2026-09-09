import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkBarcodeScanner, QkButton, QkInput, QkMetric, QkSelect, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatDate, formatNumber, statusTone } from '../../utils'

export function PickingPage() {
  const { picklists, setPicklists, salesOrders, setSalesOrders, batches } = useData()
  const { pushToast } = useToast()
  const active = useMemo(() => picklists.filter((p) => p.status === 'Open' || p.status === 'In Progress'), [picklists])
  const [picklistId, setPicklistId] = useState(active[0]?.id || '')
  const picklist = picklists.find((p) => p.id === picklistId) || active[0]
  const so = salesOrders.find((s) => s.soNumber === picklist?.soNumber)
  const line = so?.items[0]
  const batch = batches.find((b) => b.sku === line?.sku && b.status !== 'Expired') || batches[0]

  const [picked, setPicked] = useState(String(line?.pickedQty || 0))
  const [barcode, setBarcode] = useState('')
  const [saving, setSaving] = useState(false)

  const required = line?.orderedQty || 0
  const pickedNum = Number(picked) || 0

  const handleScan = (code: string) => {
    setBarcode(code)
    setPicked(String(Math.min(required, pickedNum + 1)))
    pushToast({ tone: 'info', title: 'Barcode verified', message: code })
  }

  const confirm = async () => {
    if (!picklist || !so || !line) return
    if (pickedNum <= 0) {
      pushToast({ tone: 'warning', title: 'Nothing to confirm', message: 'Pick at least 1 unit' })
      return
    }
    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))
    const done = pickedNum >= required
    setPicklists((prev) =>
      prev.map((p) =>
        p.id === picklist.id
          ? { ...p, picked: Math.min(p.items, p.picked + (done ? 1 : 0)), status: done && p.picked + 1 >= p.items ? 'Completed' : 'In Progress' }
          : p,
      ),
    )
    setSalesOrders((prev) =>
      prev.map((order) =>
        order.id === so.id
          ? {
              ...order,
              status: done ? 'Packed' : 'Picking',
              items: order.items.map((item) =>
                item.id === line.id
                  ? { ...item, pickedQty: pickedNum, batch: batch?.batchNo, status: done ? 'Picked' : 'Reserved' }
                  : item,
              ),
            }
          : order,
      ),
    )
    setSaving(false)
    pushToast({ tone: 'success', title: 'Pick confirmed', message: `${line.sku}: ${pickedNum}/${required}` })
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Picking" subtitle="Scan, verify batch, and confirm picks." />
      <div style={{ maxWidth: 320 }}>
        <QkSelect
          label="My picking task"
          value={picklist?.id || ''}
          options={active.map((p) => ({ label: `${p.picklistNo} · ${p.soNumber}`, value: p.id }))}
          onChange={(e) => {
            setPicklistId(e.target.value)
            const next = picklists.find((p) => p.id === e.target.value)
            const nextSo = salesOrders.find((s) => s.soNumber === next?.soNumber)
            setPicked(String(nextSo?.items[0]?.pickedQty || 0))
          }}
        />
      </div>

      {!picklist || !line ? (
        <div className="qk-surface" style={{ padding: 24 }}>No open picking tasks.</div>
      ) : (
        <>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <strong>{picklist.picklistNo}</strong>
            <QkStatusBadge label={picklist.status} tone={statusTone(picklist.status)} />
            <span className="qk-secondary" style={{ fontSize: 12 }}>Order {picklist.soNumber} · {picklist.warehouse}</span>
          </div>

          <div className="qk-grid-metrics">
            <QkMetric label="Required" value={formatNumber(required)} />
            <QkMetric label="Picked" value={formatNumber(pickedNum)} />
            <QkMetric label="Remaining" value={formatNumber(Math.max(0, required - pickedNum))} />
          </div>

          <div className="qk-grid-2">
            <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <h3 className="qk-section-title">{line.product}</h3>
              <div style={{ fontSize: 13 }}><span className="qk-secondary">SKU</span> · <strong>{line.sku}</strong></div>
              <div style={{ fontSize: 13 }}><span className="qk-secondary">Batch</span> · <strong>{batch?.batchNo || '—'}</strong></div>
              <div style={{ fontSize: 13 }}><span className="qk-secondary">Expiry</span> · <strong>{formatDate(batch?.expiry)}</strong></div>
              <QkInput label="Picked qty" type="number" value={picked} onChange={(e) => setPicked(e.target.value)} />
            </section>
            <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <h3 className="qk-section-title">Barcode verification</h3>
              <QkBarcodeScanner
                value={barcode}
                onChange={setBarcode}
                onScan={handleScan}
                placeholder={line.sku}
              />
              <QkButton loading={saving} onClick={confirm}>Confirm pick</QkButton>
            </section>
          </div>
        </>
      )}
    </div>
  )
}
