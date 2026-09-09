import { useMemo, useState, type FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkInput, QkSelect } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatNumber, uid } from '../../utils'
import type { StockMovement } from '../../types'

type AdjType = 'increase' | 'decrease' | 'set'

interface FormState {
  inventoryId: string
  adjType: AdjType
  qty: string
  reason: string
  reference: string
}

const empty: FormState = {
  inventoryId: '',
  adjType: 'increase',
  qty: '',
  reason: '',
  reference: '',
}

export function StockAdjustmentPage() {
  const { inventory, setInventory, setMovements } = useData()
  const { user } = useAuth()
  const { pushToast } = useToast()
  const [form, setForm] = useState<FormState>(empty)
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({})

  const selected = useMemo(
    () => inventory.find((i) => i.id === form.inventoryId),
    [inventory, form.inventoryId],
  )

  const previewAvailable = useMemo(() => {
    if (!selected) return null
    const qty = Number(form.qty)
    if (!form.qty || Number.isNaN(qty) || qty < 0) return selected.available
    if (form.adjType === 'increase') return selected.available + qty
    if (form.adjType === 'decrease') return Math.max(0, selected.available - qty)
    return qty
  }, [selected, form.adjType, form.qty])

  const validate = () => {
    const next: Partial<Record<keyof FormState, string>> = {}
    if (!form.inventoryId) next.inventoryId = 'Select an inventory line'
    const qty = Number(form.qty)
    if (!form.qty || Number.isNaN(qty) || qty < 0) next.qty = 'Enter a valid quantity'
    if (form.adjType === 'decrease' && selected && qty > selected.available) {
      next.qty = `Cannot decrease more than available (${selected.available})`
    }
    if (!form.reason.trim()) next.reason = 'Reason is required'
    setErrors(next)
    return Object.keys(next).length === 0
  }

  const onSubmit = (e: FormEvent) => {
    e.preventDefault()
    if (!validate() || !selected) return

    const qty = Number(form.qty)
    const before = selected.available
    let after = before
    if (form.adjType === 'increase') after = before + qty
    else if (form.adjType === 'decrease') after = Math.max(0, before - qty)
    else after = qty

    const delta = after - before

    setInventory((prev) =>
      prev.map((item) => {
        if (item.id !== selected.id) return item
        const nextStatus =
          after === 0
            ? item.status === 'Expired'
              ? item.status
              : 'Low Stock'
            : after < 100
              ? 'Low Stock'
              : 'Available'
        return {
          ...item,
          available: after,
          status: item.status === 'QC Hold' || item.status === 'Damaged' || item.status === 'Expired' ? item.status : nextStatus,
        }
      }),
    )

    const movement: StockMovement = {
      id: uid('m'),
      sku: selected.sku,
      product: selected.product,
      batch: selected.batch,
      type: 'Adjustment',
      qty: delta,
      fromLocation: `${selected.zone}-${selected.rack}-${selected.shelf}-${selected.bin}`,
      toLocation: form.adjType === 'decrease' ? 'Adjustment' : `${selected.zone}-${selected.rack}-${selected.shelf}-${selected.bin}`,
      reference: form.reference.trim() || `ADJ-${Date.now().toString(36).toUpperCase()}`,
      performedBy: user?.name ?? 'Ankit Verma',
      performedAt: new Date().toISOString().slice(0, 19),
    }

    setMovements((prev) => [movement, ...prev])
    pushToast({
      tone: 'success',
      title: 'Stock adjusted',
      message: `${selected.sku} available: ${before} → ${after}`,
    })
    setForm(empty)
    setErrors({})
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Stock adjustment"
        subtitle="Correct on-hand quantities and log an adjustment movement."
        actions={
          <Link to="/stock-movement">
            <QkButton variant="outline">View movements</QkButton>
          </Link>
        }
      />

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 14 }}>
            Adjustment form
          </h3>
          <form onSubmit={onSubmit} style={{ display: 'grid', gap: 12 }}>
            <QkSelect
              label="Inventory line"
              required
              placeholder="Select SKU / location"
              value={form.inventoryId}
              error={errors.inventoryId}
              options={inventory.map((i) => ({
                label: `${i.sku} · ${i.product} · ${i.warehouse} (${i.batch})`,
                value: i.id,
              }))}
              onChange={(e) => setForm((f) => ({ ...f, inventoryId: e.target.value }))}
            />
            <QkSelect
              label="Adjustment type"
              required
              value={form.adjType}
              options={[
                { label: 'Increase', value: 'increase' },
                { label: 'Decrease', value: 'decrease' },
                { label: 'Set absolute qty', value: 'set' },
              ]}
              onChange={(e) => setForm((f) => ({ ...f, adjType: e.target.value as AdjType }))}
            />
            <QkInput
              label="Quantity"
              required
              type="number"
              min={0}
              value={form.qty}
              error={errors.qty}
              hint={form.adjType === 'set' ? 'New available quantity' : 'Units to add or remove'}
              onChange={(e) => setForm((f) => ({ ...f, qty: e.target.value }))}
            />
            <QkInput
              label="Reason"
              required
              value={form.reason}
              error={errors.reason}
              placeholder="Cycle count variance, damage, etc."
              onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
            />
            <QkInput
              label="Reference"
              value={form.reference}
              placeholder="Optional ADJ / audit reference"
              onChange={(e) => setForm((f) => ({ ...f, reference: e.target.value }))}
            />
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 4 }}>
              <QkButton
                type="button"
                variant="outline"
                onClick={() => {
                  setForm(empty)
                  setErrors({})
                }}
              >
                Reset
              </QkButton>
              <QkButton type="submit">Apply adjustment</QkButton>
            </div>
          </form>
        </section>

        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 14 }}>
            Preview
          </h3>
          {!selected ? (
            <p className="qk-muted" style={{ fontSize: 13, margin: 0 }}>
              Select an inventory line to preview the impact.
            </p>
          ) : (
            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <Row label="SKU" value={selected.sku} />
              <Row label="Product" value={selected.product} />
              <Row label="Warehouse" value={selected.warehouse} />
              <Row label="Location" value={`${selected.zone}-${selected.rack}-${selected.shelf}-${selected.bin}`} />
              <Row label="Batch" value={selected.batch} />
              <Row label="Current available" value={formatNumber(selected.available)} />
              <Row label="After adjustment" value={formatNumber(previewAvailable ?? selected.available)} />
              <Row
                label="Delta"
                value={
                  previewAvailable == null
                    ? '—'
                    : `${previewAvailable - selected.available >= 0 ? '+' : ''}${previewAvailable - selected.available}`
                }
              />
            </div>
          )}
        </section>
      </div>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
