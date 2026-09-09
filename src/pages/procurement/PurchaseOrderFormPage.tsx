import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { Plus, Trash2 } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkDatePicker, QkInput, QkSelect } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { formatCurrency, formatNumber, uid } from '../../utils'
import type { PurchaseOrder, PurchaseOrderItem } from '../../types'

interface LineDraft {
  key: string
  sku: string
  qty: string
  unitPrice: string
}

function addDays(isoDate: string, days: number) {
  const d = new Date(`${isoDate}T00:00:00`)
  d.setDate(d.getDate() + days)
  return d.toISOString().slice(0, 10)
}

export function PurchaseOrderFormPage() {
  const { id } = useParams()
  const isEdit = Boolean(id)
  const navigate = useNavigate()
  const {
    purchaseOrders, setPurchaseOrders, vendors, warehouses, products, inventory,
    setZohoSyncHistory, svcSubmitPo,
  } = useData()
  const { pushToast } = useToast()
  const existing = purchaseOrders.find((p) => p.id === id)

  const [vendorId, setVendorId] = useState(existing?.vendorId || '')
  const [warehouseId, setWarehouseId] = useState(existing?.warehouseId || '')
  const [expectedDelivery, setExpectedDelivery] = useState(existing?.expectedDelivery || '2026-09-20')
  const [lines, setLines] = useState<LineDraft[]>(
    existing?.items.map((i) => ({
      key: i.id,
      sku: i.sku,
      qty: String(i.orderedQty),
      unitPrice: String(i.unitPrice),
    })) || [{ key: uid('line'), sku: '', qty: '', unitPrice: '' }],
  )
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [lineErrors, setLineErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const warehouse = warehouses.find((w) => w.id === warehouseId)
  const vendor = vendors.find((v) => v.id === vendorId)

  const warehouseStock = useMemo(() => {
    if (!warehouse) return []
    return inventory.filter((i) => i.warehouseId === warehouse.id || i.warehouse === warehouse.name)
  }, [inventory, warehouse])

  const stockBySku = useMemo(() => {
    const map = new Map<string, { available: number; reserved: number; inTransit: number; status: string }>()
    for (const row of warehouseStock) {
      const prev = map.get(row.sku) || { available: 0, reserved: 0, inTransit: 0, status: row.status }
      map.set(row.sku, {
        available: prev.available + row.available,
        reserved: prev.reserved + row.reserved,
        inTransit: prev.inTransit + row.inTransit,
        status: row.status === 'Low Stock' || prev.status === 'Low Stock' ? 'Low Stock' : row.status,
      })
    }
    return map
  }, [warehouseStock])

  const activeProducts = useMemo(
    () => products.filter((p) => p.status === 'Active'),
    [products],
  )

  const vendorProducts = useMemo(() => {
    if (!vendor) return activeProducts
    const cats = new Set(vendor.categories.map((c) => c.toLowerCase()))
    const matched = activeProducts.filter((p) => cats.has(p.category.toLowerCase()))
    return matched.length ? matched : activeProducts
  }, [activeProducts, vendor])

  const suggestions = useMemo(() => {
    if (!warehouse) return []
    return vendorProducts
      .map((p) => {
        const stock = stockBySku.get(p.sku) || { available: 0, reserved: 0, inTransit: 0, status: 'Available' }
        const onHand = stock.available + stock.inTransit
        const deficit = Math.max(0, p.reorderPoint - onHand)
        const suggestedQty = deficit > 0 ? Math.max(deficit, p.safetyStock - onHand > 0 ? p.safetyStock - onHand : deficit) : 0
        return {
          sku: p.sku,
          name: p.name,
          available: stock.available,
          inTransit: stock.inTransit,
          reorderPoint: p.reorderPoint,
          safetyStock: p.safetyStock,
          suggestedQty,
          unitPrice: p.unitPrice,
          needsReorder: onHand < p.reorderPoint || stock.status === 'Low Stock',
        }
      })
      .filter((s) => s.needsReorder && s.suggestedQty > 0)
      .sort((a, b) => b.suggestedQty - a.suggestedQty)
  }, [warehouse, vendorProducts, stockBySku])

  const totals = useMemo(() => {
    return lines.reduce((sum, line) => sum + Number(line.qty || 0) * Number(line.unitPrice || 0), 0)
  }, [lines])

  const openPosForWarehouse = useMemo(() => {
    if (!warehouse) return 0
    return purchaseOrders.filter(
      (p) =>
        (p.warehouseId === warehouse.id || p.warehouse === warehouse.name) &&
        !['Closed', 'Cancelled'].includes(p.status),
    ).length
  }, [purchaseOrders, warehouse])

  if (isEdit && !existing) {
    return (
      <div className="qk-page">
        <PageHeader title="Purchase order not found" />
        <Link to="/purchase-orders"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const applyVendorLeadTime = (nextVendorId: string) => {
    setVendorId(nextVendorId)
    const v = vendors.find((x) => x.id === nextVendorId)
    if (v) setExpectedDelivery(addDays('2026-09-09', v.leadTimeDays))
  }

  const onWarehouseChange = (nextWarehouseId: string) => {
    setWarehouseId(nextWarehouseId)
    setLineErrors({})
  }

  const stockFor = (sku: string) =>
    stockBySku.get(sku) || { available: 0, reserved: 0, inTransit: 0, status: 'Available' }

  const suggestedQtyFor = (sku: string) => {
    const product = products.find((p) => p.sku === sku)
    if (!product) return 10
    const stock = stockFor(sku)
    const onHand = stock.available + stock.inTransit
    const gap = product.reorderPoint - onHand
    if (gap > 0) return Math.max(gap, product.safetyStock)
    return Math.max(product.safetyStock, 10)
  }

  const updateLine = (key: string, patch: Partial<LineDraft>) => {
    setLines((prev) => prev.map((l) => {
      if (l.key !== key) return l
      const next = { ...l, ...patch }
      if (patch.sku) {
        const product = products.find((p) => p.sku === patch.sku)
        if (product) {
          next.unitPrice = String(product.unitPrice)
          if (!l.qty || l.qty === '0') next.qty = String(suggestedQtyFor(patch.sku))
        }
      }
      return next
    }))
    if (patch.sku) {
      setLineErrors((prev) => {
        const copy = { ...prev }
        delete copy[key]
        return copy
      })
    }
  }

  const usedSkus = lines.map((l) => l.sku).filter(Boolean)

  const addLine = () =>
    setLines((prev) => [...prev, { key: uid('line'), sku: '', qty: '', unitPrice: '' }])

  const save = async (e: FormEvent, submitForApproval = false) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    const nextLineErrors: Record<string, string> = {}
    if (!vendorId) next.vendorId = 'Select vendor'
    if (!warehouseId) next.warehouseId = 'Select warehouse'
    if (!expectedDelivery) next.expectedDelivery = 'Delivery date required'
    if (warehouse?.status === 'Maintenance') next.warehouseId = 'Warehouse is under maintenance'
    if (warehouse?.status === 'Inactive') next.warehouseId = 'Warehouse is inactive'

    if (!lines.length) next.lines = 'Add at least one line item'
    const skuSeen = new Set<string>()
    for (const line of lines) {
      if (!line.sku) nextLineErrors[line.key] = 'Select SKU'
      else if (skuSeen.has(line.sku)) nextLineErrors[line.key] = 'Duplicate SKU on this PO'
      else skuSeen.add(line.sku)
      if (!line.qty || Number(line.qty) <= 0) nextLineErrors[line.key] = (nextLineErrors[line.key] ? `${nextLineErrors[line.key]} · ` : '') + 'Qty must be > 0'
      if (line.unitPrice === '' || Number(line.unitPrice) < 0) nextLineErrors[line.key] = (nextLineErrors[line.key] ? `${nextLineErrors[line.key]} · ` : '') + 'Unit price required'
      const product = products.find((p) => p.sku === line.sku)
      if (product?.status === 'Discontinued') {
        nextLineErrors[line.key] = (nextLineErrors[line.key] ? `${nextLineErrors[line.key]} · ` : '') + 'SKU is discontinued — not available to order'
      }
      if (product && vendor && vendor.categories.length) {
        const ok = vendor.categories.some((c) => c.toLowerCase() === product.category.toLowerCase())
        if (!ok) nextLineErrors[line.key] = (nextLineErrors[line.key] ? `${nextLineErrors[line.key]} · ` : '') + `${vendor.name} does not supply ${product.category}`
      }
    }
    if (Object.keys(nextLineErrors).length) next.lines = 'Fix line item issues below'
    setErrors(next)
    setLineErrors(nextLineErrors)
    if (Object.keys(next).length || Object.keys(nextLineErrors).length) return

    const v = vendors.find((x) => x.id === vendorId)!
    const w = warehouses.find((x) => x.id === warehouseId)!
    const items: PurchaseOrderItem[] = lines.map((l) => {
      const product = products.find((p) => p.sku === l.sku)!
      const orderedQty = Number(l.qty)
      const unitPrice = Number(l.unitPrice)
      const existingItem = existing?.items.find((i) => i.sku === l.sku)
      return {
        id: existingItem?.id || uid('poi'),
        sku: product.sku,
        productId: product.id,
        product: product.name,
        uom: product.uom,
        orderedQty,
        receivedQty: existingItem?.receivedQty || 0,
        acceptedQty: existingItem?.acceptedQty || 0,
        rejectedQty: existingItem?.rejectedQty || 0,
        pendingQty: orderedQty,
        unitPrice,
        total: orderedQty * unitPrice,
        status: 'Pending' as const,
      }
    })

    setSaving(true)
    await new Promise((r) => setTimeout(r, 450))

    if (isEdit && existing) {
      const updated: PurchaseOrder = {
        ...existing,
        vendorId: v.id,
        vendor: v.name,
        warehouseId: w.id,
        warehouse: w.name,
        expectedDelivery,
        amount: totals,
        subtotal: totals,
        discountTotal: existing.discountTotal ?? 0,
        taxTotal: existing.taxTotal ?? 0,
        freight: existing.freight ?? 0,
        otherCharges: existing.otherCharges ?? 0,
        itemCount: items.length,
        items,
        updatedAt: new Date().toISOString(),
      }
      setPurchaseOrders((prev) => prev.map((p) => (p.id === existing.id ? updated : p)))
      if (submitForApproval && (existing.status === 'Draft' || existing.status === 'Pending Approval')) {
        svcSubmitPo(existing.id, 'Neha Kulkarni')
      }
      pushToast({ tone: 'success', title: 'PO updated', message: existing.poNumber })
      setSaving(false)
      navigate(`/purchase-orders/${existing.id}`)
      return
    }

    const poNumber = `PO-${10236 + purchaseOrders.length}`
    const newId = uid('po')
    const draft: PurchaseOrder = {
      id: newId,
      poNumber,
      vendorId: v.id,
      vendor: v.name,
      warehouseId: w.id,
      warehouse: w.name,
      orderDate: '2026-09-09',
      expectedDelivery,
      status: 'Draft',
      currency: 'INR',
      priority: 'Medium',
      amount: totals,
      subtotal: totals,
      discountTotal: 0,
      taxTotal: 0,
      freight: 0,
      otherCharges: 0,
      itemCount: items.length,
      createdAt: '2026-09-09',
      createdBy: 'Neha Kulkarni',
      items,
      zohoStatus: 'Not Synced',
    }
    setPurchaseOrders((prev) => [draft, ...prev])

    if (submitForApproval) {
      svcSubmitPo(newId, 'Neha Kulkarni')
      setZohoSyncHistory((prev) => [{
        id: uid('zs'),
        poNumber,
        poId: newId,
        direction: 'Push',
        status: 'Pending',
        message: 'Awaiting approval before Zoho sync',
        syncedAt: new Date().toISOString(),
        attempts: 0,
      }, ...prev])
    }

    setSaving(false)
    pushToast({ tone: 'success', title: submitForApproval ? 'PO submitted' : 'PO saved as draft', message: poNumber })
    navigate(`/purchase-orders/${newId}`)
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={isEdit ? `Edit ${existing!.poNumber}` : 'Create purchase order'}
        subtitle="Order against warehouse stock gaps — qty and price follow store availability and reorder rules."
        actions={
          <>
            <Link to={isEdit ? `/purchase-orders/${id}` : '/purchase-orders'}><QkButton variant="outline">Cancel</QkButton></Link>
            <QkButton variant="outline" loading={saving} onClick={(e) => save(e, false)}>Save draft</QkButton>
            <QkButton loading={saving} onClick={(e) => save(e, true)}>Save & submit</QkButton>
          </>
        }
      />

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
          <h3 className="qk-section-title">Header</h3>
          <QkSelect
            label="Warehouse"
            required
            value={warehouseId}
            error={errors.warehouseId}
            placeholder="Select warehouse"
            options={warehouses
              .filter((w) => w.status !== 'Inactive')
              .map((w) => ({
                label: `${w.name}${w.status === 'Maintenance' ? ' (Maintenance)' : ''} · ${w.utilization}% util`,
                value: w.id,
              }))}
            onChange={(e) => onWarehouseChange(e.target.value)}
          />
          <QkSelect
            label="Vendor"
            required
            value={vendorId}
            error={errors.vendorId}
            placeholder="Select vendor"
            options={vendors
              .filter((v) => v.status === 'Active')
              .map((v) => ({
                label: `${v.name} · ${v.leadTimeDays}d lead · ${v.categories.join(', ')}`,
                value: v.id,
              }))}
            onChange={(e) => applyVendorLeadTime(e.target.value)}
          />
          <QkDatePicker
            label="Expected delivery"
            required
            value={expectedDelivery}
            error={errors.expectedDelivery}
            hint={vendor ? `Auto-set from ${vendor.name} lead time (${vendor.leadTimeDays} days)` : 'Select vendor to apply lead time'}
            onChange={(e) => setExpectedDelivery(e.target.value)}
          />
        </section>

        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Warehouse & order summary</h3>
          {!warehouse ? (
            <p className="qk-secondary" style={{ margin: 0, fontSize: 13 }}>Select a warehouse to see on-hand stock and reorder needs.</p>
          ) : (
            <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
              <SummaryRow label="Warehouse" value={warehouse.name} />
              <SummaryRow label="Utilization" value={`${warehouse.utilization}%`} />
              <SummaryRow label="SKUs on hand" value={String(stockBySku.size)} />
              <SummaryRow label="Below reorder" value={String(suggestions.length)} />
              <SummaryRow label="Open POs here" value={String(openPosForWarehouse)} />
              <SummaryRow label="Lines" value={String(lines.filter((l) => l.sku).length)} />
              <SummaryRow label="Total" value={formatCurrency(totals)} />
              {vendor && <SummaryRow label="Vendor lead" value={`${vendor.leadTimeDays} days`} />}
            </div>
          )}
        </section>
      </div>

      <section className="qk-surface" style={{ padding: 16 }}>
        <div style={{ marginBottom: 12 }}>
          <h3 className="qk-section-title">Line items</h3>
          <p className="qk-secondary" style={{ margin: '4px 0 0', fontSize: 12 }}>
            SKU auto-fills price and qty from store stock gap.
          </p>
        </div>
        {!warehouseId && (
          <div style={{ marginBottom: 10, padding: '8px 10px', borderRadius: 6, background: 'var(--qk-warning-soft)', color: 'var(--qk-warning)', fontSize: 12 }}>
            Choose a warehouse first to see store availability.
          </div>
        )}
        {errors.lines && <div style={{ color: 'var(--qk-danger)', fontSize: 12, marginBottom: 8 }}>{errors.lines}</div>}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {lines.map((line) => {
            const product = products.find((p) => p.sku === line.sku)
            const stock = line.sku ? stockFor(line.sku) : null
            const belowRop = Boolean(
              product && stock && stock.available + stock.inTransit < product.reorderPoint,
            )
            const skuOptions = vendorProducts
              .filter((p) => p.sku === line.sku || !usedSkus.includes(p.sku))
              .map((p) => ({ label: `${p.sku} · ${p.name}`, value: p.sku }))
            return (
              <div key={line.key}>
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'minmax(200px, 2fr) 100px 120px 100px 120px 40px',
                    gap: 10,
                    alignItems: 'end',
                  }}
                >
                  <QkSelect
                    label="SKU"
                    value={line.sku}
                    placeholder={warehouseId ? 'Select SKU' : 'Select warehouse first'}
                    disabled={!warehouseId}
                    options={skuOptions}
                    onChange={(e) => updateLine(line.key, { sku: e.target.value })}
                  />
                  <QkInput
                    label="Qty"
                    type="number"
                    value={line.qty}
                    onChange={(e) => updateLine(line.key, { qty: e.target.value })}
                  />
                  <QkInput
                    label="Unit price"
                    type="number"
                    value={line.unitPrice}
                    onChange={(e) => updateLine(line.key, { unitPrice: e.target.value })}
                  />
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--qk-text-secondary)' }}>
                      On hand
                    </div>
                    <div
                      style={{
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                        padding: '0 10px',
                        borderRadius: 6,
                        border: `1px solid ${belowRop ? 'var(--qk-warning)' : 'var(--qk-border)'}`,
                        background: belowRop ? 'var(--qk-warning-soft)' : 'var(--qk-surface-muted, var(--qk-bg))',
                        fontSize: 13,
                        fontWeight: 600,
                        color: belowRop ? 'var(--qk-warning)' : 'var(--qk-text)',
                      }}
                      title={
                        product && stock
                          ? `Reorder at ${formatNumber(product.reorderPoint)} · reserved ${formatNumber(stock.reserved)}`
                          : undefined
                      }
                    >
                      {stock ? formatNumber(stock.available) : '—'}
                      {belowRop && (
                        <span style={{ fontSize: 10, fontWeight: 600 }}>low</span>
                      )}
                    </div>
                  </div>
                  <div>
                    <div style={{ fontSize: 12, marginBottom: 6, color: 'var(--qk-text-secondary)' }}>
                      Line total
                    </div>
                    <div
                      style={{
                        height: 36,
                        display: 'flex',
                        alignItems: 'center',
                        padding: '0 10px',
                        borderRadius: 6,
                        border: '1px solid var(--qk-border)',
                        background: 'var(--qk-surface-muted, var(--qk-bg))',
                        fontSize: 13,
                        fontWeight: 600,
                      }}
                    >
                      {formatCurrency(Number(line.qty || 0) * Number(line.unitPrice || 0))}
                    </div>
                  </div>
                  <QkButton
                    variant="ghost"
                    aria-label="Remove line"
                    onClick={() => setLines((prev) => prev.filter((l) => l.key !== line.key))}
                    disabled={lines.length === 1}
                  >
                    <Trash2 size={14} />
                  </QkButton>
                </div>
                {lineErrors[line.key] && (
                  <div style={{ color: 'var(--qk-danger)', fontSize: 11, marginTop: 6 }}>{lineErrors[line.key]}</div>
                )}
              </div>
            )
          })}
        </div>
        <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--qk-border)' }}>
          <QkButton
            size="sm"
            variant="outline"
            leftIcon={<Plus size={14} />}
            disabled={!warehouseId}
            onClick={addLine}
          >
            Add line
          </QkButton>
        </div>
      </section>
    </div>
  )
}

function SummaryRow({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
