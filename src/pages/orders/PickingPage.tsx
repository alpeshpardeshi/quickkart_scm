import { useMemo, useState } from 'react'
import { PageHeader, QkStickyActions } from '../../components/layout/PageHeader'
import { QkBarcodeScanner, QkButton, QkInput, QkSelect, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { formatDate, formatNumber, statusTone } from '../../utils'

export function PickingPage() {
  const { picklists, setPicklists, salesOrders, setSalesOrders, batches } = useData()
  const { pushToast } = useToast()
  const { isMobile } = useBreakpoint()
  const active = useMemo(() => picklists.filter((p) => p.status === 'Open' || p.status === 'In Progress'), [picklists])
  const [picklistId, setPicklistId] = useState(active[0]?.id || '')
  const picklist = picklists.find((p) => p.id === picklistId) || active[0]
  const so = salesOrders.find((s) => s.soNumber === picklist?.soNumber)
  const line = so?.items[0]
  const batch = batches.find((b) => b.sku === line?.sku && b.status !== 'Expired') || batches[0]
  const location = [batch?.warehouse, 'A-03', '02', '14'].filter(Boolean).join('-') || 'A-03-02-14'

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
    <div className={`qk-page qk-animate-in${isMobile ? ' qk-floor-page' : ''}`}>
      <PageHeader title="Picking" subtitle="Scan, verify batch, and confirm picks." />
      <div style={{ maxWidth: isMobile ? '100%' : 320 }}>
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
        <div className="qk-floor-card">
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <strong>{picklist.picklistNo}</strong>
            <QkStatusBadge label={picklist.status} tone={statusTone(picklist.status)} />
          </div>

          <div className="qk-floor-card__block">
            <div className="qk-floor-card__label">Order</div>
            <div className="qk-floor-card__value" style={{ fontSize: 18 }}>{picklist.soNumber}</div>
          </div>

          <div className="qk-floor-card__block">
            <div className="qk-floor-card__label">Location / Bin</div>
            <div className="qk-floor-card__value qk-floor-card__value--lg">{location}</div>
          </div>

          <div className="qk-floor-card__block">
            <div className="qk-floor-card__label">Product</div>
            <div className="qk-floor-card__value" style={{ fontSize: 20 }}>{line.product}</div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div className="qk-floor-card__block">
              <div className="qk-floor-card__label">SKU</div>
              <div style={{ fontWeight: 650, fontSize: 15 }}>{line.sku}</div>
            </div>
            <div className="qk-floor-card__block">
              <div className="qk-floor-card__label">Batch</div>
              <div style={{ fontWeight: 650, fontSize: 15 }}>{batch?.batchNo || '—'}</div>
            </div>
          </div>

          <div style={{ fontSize: 13, color: 'var(--qk-text-secondary)' }}>
            Expiry · {formatDate(batch?.expiry)} · {picklist.warehouse}
          </div>

          <div className="qk-floor-card__block">
            <div className="qk-floor-card__label">Quantity</div>
            <div style={{ display: 'flex', gap: 16, alignItems: 'baseline', flexWrap: 'wrap' }}>
              <span className="qk-floor-card__value qk-floor-card__value--lg">{formatNumber(required)}</span>
              <span className="qk-secondary">Required</span>
              <span style={{ fontWeight: 650 }}>{formatNumber(pickedNum)} picked</span>
              <span className="qk-secondary">{formatNumber(Math.max(0, required - pickedNum))} left</span>
            </div>
          </div>

          <QkInput label="Picked qty" type="number" value={picked} onChange={(e) => setPicked(e.target.value)} />

          <QkBarcodeScanner
            value={barcode}
            onChange={setBarcode}
            onScan={handleScan}
            placeholder={line.sku}
          />

          <QkStickyActions>
            <QkButton variant="outline" onClick={() => barcode && handleScan(barcode)} style={{ flex: 1 }}>
              Scan
            </QkButton>
            <QkButton loading={saving} onClick={confirm} style={{ flex: 1.4 }}>
              Confirm Pick
            </QkButton>
          </QkStickyActions>
        </div>
      )}
    </div>
  )
}
