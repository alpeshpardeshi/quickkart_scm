import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTabs, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatDate, formatDateTime, formatNumber, statusTone } from '../../utils'
import type { Batch, StockMovement, AuditRecord } from '../../types'

export function InventoryDetailsPage() {
  const { id } = useParams()
  const { inventory, batches, movements, audits } = useData()
  const item = inventory.find((i) => i.id === id)
  const [tab, setTab] = useState('overview')

  const relatedBatches = useMemo(
    () => batches.filter((b) => b.sku === item?.sku),
    [batches, item],
  )
  const relatedMoves = useMemo(
    () => movements.filter((m) => m.sku === item?.sku),
    [movements, item],
  )

  if (!item) {
    return (
      <div className="qk-page">
        <PageHeader title="Inventory not found" subtitle="This inventory record does not exist in the mock dataset." />
        <Link to="/inventory"><QkButton variant="outline">Back to inventory</QkButton></Link>
      </div>
    )
  }

  const batchCols: QkColumn<Batch>[] = [
    { key: 'batchNo', header: 'Batch' },
    { key: 'qty', header: 'Qty', align: 'right' },
    { key: 'mfgDate', header: 'MFG Date', render: (r) => formatDate(r.mfgDate) },
    { key: 'expiry', header: 'Expiry', render: (r) => formatDate(r.expiry) },
    { key: 'expiry', header: 'Days left', align: 'center', render: (r) => {
      const days = Math.ceil((new Date(`${r.expiry}T00:00:00`).getTime() - new Date('2026-09-09T00:00:00').getTime()) / (1000 * 60 * 60 * 24))
      return (
        <span style={{ display: 'inline-flex', minWidth: 22, height: 22, padding: '0 6px', borderRadius: 999, background: 'var(--qk-primary-soft)', color: 'var(--qk-primary)', alignItems: 'center', justifyContent: 'center', fontSize: 11, fontWeight: 700 }}>{days}</span>
      )
    } },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  const moveCols: QkColumn<StockMovement>[] = [
    { key: 'performedAt', header: 'When', render: (r) => formatDateTime(r.performedAt) },
    { key: 'type', header: 'Type', render: (r) => <QkStatusBadge label={r.type} tone="info" /> },
    { key: 'qty', header: 'Qty', align: 'right' },
    { key: 'fromLocation', header: 'From' },
    { key: 'toLocation', header: 'To' },
    { key: 'reference', header: 'Reference' },
    { key: 'performedBy', header: 'By' },
  ]

  const auditCols: QkColumn<AuditRecord>[] = [
    { key: 'auditNo', header: 'Audit' },
    { key: 'zone', header: 'Zone' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'varianceCount', header: 'Variance', align: 'right' },
    { key: 'auditor', header: 'Auditor' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={item.product}
        subtitle={`${item.sku} · ${item.warehouse} · ${item.zone}-${item.rack}-${item.shelf}-${item.bin}`}
        actions={
          <>
            <Link to="/stock-adjustment"><QkButton variant="outline">Adjust</QkButton></Link>
            <Link to="/stock-movement"><QkButton>View movements</QkButton></Link>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <QkStatusBadge label={item.status} tone={statusTone(item.status)} />
        <span className="qk-secondary" style={{ fontSize: 12 }}>Batch {item.batch}</span>
        <span className="qk-muted" style={{ fontSize: 12 }}>Expiry {formatDate(item.expiry)}</span>
      </div>

      <div className="qk-grid-metrics">
        <QkMetric label="Available" value={formatNumber(item.available)} />
        <QkMetric label="Reserved" value={formatNumber(item.reserved)} />
        <QkMetric label="Locked" value={formatNumber(item.locked)} />
        <QkMetric label="QC Hold" value={formatNumber(item.qcHold)} />
        <QkMetric label="Damaged" value={formatNumber(item.damaged)} />
        <QkMetric label="Expired" value={formatNumber(item.expired)} />
        <QkMetric label="In Transit" value={formatNumber(item.inTransit)} />
      </div>

      <QkTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'batches', label: 'Batches', count: relatedBatches.length },
          { id: 'locations', label: 'Locations' },
          { id: 'movements', label: 'Movements', count: relatedMoves.length },
          { id: 'audit', label: 'Audit History' },
        ]}
      />

      {tab === 'overview' && (
        <div className="qk-grid-2">
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Product</h3>
            <DetailGrid
              rows={[
                ['SKU', item.sku],
                ['Product', item.product],
                ['Batch', item.batch],
                ['MFG Date', formatDate(item.mfgDate)],
                ['Expiry', formatDate(item.expiry)],
              ]}
            />
          </section>
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Location</h3>
            <DetailGrid
              rows={[
                ['Warehouse', item.warehouse],
                ['Zone', item.zone],
                ['Rack', item.rack],
                ['Shelf', item.shelf],
                ['Bin', item.bin],
              ]}
            />
          </section>
        </div>
      )}

      {tab === 'batches' && <QkTable columns={batchCols} rows={relatedBatches} emptyTitle="No batches for this SKU." />}
      {tab === 'locations' && (
        <section className="qk-surface" style={{ padding: 16 }}>
          <DetailGrid
            rows={[
              ['Primary location', `${item.zone}-${item.rack}-${item.shelf}-${item.bin}`],
              ['Warehouse', item.warehouse],
              ['Available at location', formatNumber(item.available)],
              ['Reserved at location', formatNumber(item.reserved)],
            ]}
          />
        </section>
      )}
      {tab === 'movements' && <QkTable columns={moveCols} rows={relatedMoves} emptyTitle="No movements recorded for this SKU." />}
      {tab === 'audit' && <QkTable columns={auditCols} rows={audits.filter((a) => a.warehouse === item.warehouse)} emptyTitle="No audits for this warehouse yet." />}
    </div>
  )
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
          <span className="qk-secondary">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}
