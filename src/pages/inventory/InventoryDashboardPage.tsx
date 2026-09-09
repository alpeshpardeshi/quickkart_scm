import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatNumber, statusTone } from '../../utils'
import type { InventoryItem } from '../../types'

export function InventoryDashboardPage() {
  const { inventory, batches, warehouses } = useData()
  const available = inventory.reduce((s, i) => s + i.available, 0)
  const reserved = inventory.reduce((s, i) => s + i.reserved, 0)
  const qcHold = inventory.reduce((s, i) => s + i.qcHold, 0)
  const damagedExpired = inventory.reduce((s, i) => s + i.damaged + i.expired, 0)
  const total = available + reserved + qcHold + damagedExpired || 1

  const byWarehouse = warehouses.map((w) => {
    const rows = inventory.filter((i) => i.warehouseId === w.id || i.warehouse === w.name)
    return {
      id: w.id,
      name: w.name,
      skus: rows.length,
      available: rows.reduce((s, i) => s + i.available, 0),
      reserved: rows.reduce((s, i) => s + i.reserved, 0),
      lowStock: rows.filter((i) => i.status === 'Low Stock').length,
    }
  })

  const attention = inventory.filter((i) => ['Low Stock', 'QC Hold', 'Expired', 'Damaged'].includes(i.status)).slice(0, 8)
  const cols: QkColumn<InventoryItem>[] = [
    { key: 'sku', header: 'SKU', render: (r) => <Link to={`/inventory/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.sku}</Link> },
    { key: 'product', header: 'Product' },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'available', header: 'Available', align: 'right', render: (r) => formatNumber(r.available) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const bars = [
    { label: 'Available', value: available, color: 'var(--qk-success)' },
    { label: 'Reserved', value: reserved, color: 'var(--qk-info)' },
    { label: 'QC Hold', value: qcHold, color: 'var(--qk-warning)' },
    { label: 'Damaged/Expired', value: damagedExpired, color: 'var(--qk-danger)' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Inventory Dashboard"
        subtitle="Stock health across warehouses, batches, and exceptions."
        actions={
          <>
            <Link to="/inventory"><QkButton variant="outline">Inventory list</QkButton></Link>
            <Link to="/warehouse-inventory"><QkButton>By warehouse</QkButton></Link>
          </>
        }
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Total on hand" value={formatNumber(available + reserved)} />
        <QkMetric label="SKUs tracked" value={inventory.length} />
        <QkMetric label="Near expiry batches" value={batches.filter((b) => b.status === 'Near Expiry').length} />
        <QkMetric label="Low stock lines" value={inventory.filter((i) => i.status === 'Low Stock').length} />
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 14 }}>Inventory status</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bars.map((row) => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span className="qk-secondary">{row.label}</span>
                  <strong>{formatNumber(row.value)}</strong>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${Math.round((row.value / total) * 100)}%`, height: '100%', background: row.color }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 14 }}>By warehouse</h3>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {byWarehouse.map((w) => (
              <Link
                key={w.id}
                to={`/warehouse-inventory?warehouse=${encodeURIComponent(w.name)}`}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--qk-border)', fontSize: 13 }}
              >
                <div>
                  <strong>{w.name}</strong>
                  <div className="qk-secondary" style={{ fontSize: 12 }}>{w.skus} lines · {w.lowStock} low stock</div>
                </div>
                <div style={{ textAlign: 'right' }}>
                  <div>{formatNumber(w.available)} avail</div>
                  <div className="qk-muted" style={{ fontSize: 12 }}>{formatNumber(w.reserved)} reserved</div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <section>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 10 }}>
          <h3 className="qk-section-title">Attention required</h3>
          <Link to="/inventory" style={{ fontSize: 12, color: 'var(--qk-primary)' }}>View all</Link>
        </div>
        <QkTable columns={cols} rows={attention} emptyTitle="No inventory exceptions right now." />
      </section>
    </div>
  )
}
