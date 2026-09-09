import { useMemo, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTabs, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatDate, formatDateTime, formatNumber, statusTone } from '../../utils'
import type { StockMovement, ReceivingRecord, QcInspection } from '../../types'

export function BatchDetailsPage() {
  const { id } = useParams()
  const { batches, movements, receiving, qcInspections, inventory } = useData()
  const batch = batches.find((b) => b.id === id)
  const [tab, setTab] = useState('overview')

  const relatedMoves = useMemo(
    () => movements.filter((m) => m.batch === batch?.batchNo || (batch && m.sku === batch.sku)),
    [movements, batch],
  )
  const relatedInv = useMemo(
    () => inventory.filter((i) => i.batch === batch?.batchNo),
    [inventory, batch],
  )
  const relatedQc = useMemo(
    () => qcInspections.filter((q) => q.batch === batch?.batchNo),
    [qcInspections, batch],
  )
  const relatedGrn = useMemo(
    () => receiving.filter((r) => relatedMoves.some((m) => m.reference === r.grnNumber)),
    [receiving, relatedMoves],
  )

  if (!batch) {
    return (
      <div className="qk-page">
        <PageHeader title="Batch not found" subtitle="This batch does not exist in the mock dataset." />
        <Link to="/batches">
          <QkButton variant="outline">Back to batches</QkButton>
        </Link>
      </div>
    )
  }

  const moveCols: QkColumn<StockMovement>[] = [
    { key: 'performedAt', header: 'When', render: (r) => formatDateTime(r.performedAt) },
    { key: 'type', header: 'Type', render: (r) => <QkStatusBadge label={r.type} tone="info" /> },
    { key: 'qty', header: 'Qty', align: 'right' },
    { key: 'fromLocation', header: 'From' },
    { key: 'toLocation', header: 'To' },
    { key: 'reference', header: 'Reference' },
    { key: 'performedBy', header: 'By' },
  ]

  const qcCols: QkColumn<QcInspection>[] = [
    { key: 'reference', header: 'QC Ref' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'acceptedQty', header: 'Accepted', align: 'right' },
    { key: 'rejectedQty', header: 'Rejected', align: 'right' },
    { key: 'inspector', header: 'Inspector' },
  ]

  const grnCols: QkColumn<ReceivingRecord>[] = [
    { key: 'grnNumber', header: 'GRN' },
    { key: 'poNumber', header: 'PO' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'receivedQty', header: 'Received', align: 'right' },
    { key: 'receivedBy', header: 'By' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={batch.batchNo}
        subtitle={`${batch.sku} · ${batch.product} · ${batch.warehouse}`}
        actions={
          <>
            <Link to="/batches">
              <QkButton variant="outline">All batches</QkButton>
            </Link>
            <Link to={`/batch-traceability/${batch.id}`}>
              <QkButton variant="outline">Traceability</QkButton>
            </Link>
            <Link to="/stock-movement">
              <QkButton>View movements</QkButton>
            </Link>
          </>
        }
      />

      <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <QkStatusBadge label={batch.status} tone={statusTone(batch.status)} />
        <span className="qk-secondary" style={{ fontSize: 12 }}>
          Vendor {batch.vendor}
        </span>
        <span className="qk-muted" style={{ fontSize: 12 }}>
          FEFO {batch.fefoPriority}
        </span>
      </div>

      <div className="qk-grid-metrics">
        <QkMetric label="On hand" value={formatNumber(batch.qty)} />
        <QkMetric label="Locations" value={relatedInv.length} />
        <QkMetric label="Movements" value={relatedMoves.length} />
        <QkMetric label="Days to expiry" value={daysUntil(batch.expiry)} />
      </div>

      <QkTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'overview', label: 'Overview' },
          { id: 'trace', label: 'Traceability' },
          { id: 'movements', label: 'Movements', count: relatedMoves.length },
          { id: 'qc', label: 'QC', count: relatedQc.length },
        ]}
      />

      {tab === 'overview' && (
        <div className="qk-grid-2">
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
              Batch
            </h3>
            <DetailGrid
              rows={[
                ['Batch No', batch.batchNo],
                ['SKU', batch.sku],
                ['Product', batch.product],
                ['MFG Date', formatDate(batch.mfgDate)],
                ['Expiry', formatDate(batch.expiry)],
                ['FEFO Priority', String(batch.fefoPriority)],
              ]}
            />
          </section>
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
              Location & vendor
            </h3>
            <DetailGrid
              rows={[
                ['Warehouse', batch.warehouse],
                ['Vendor', batch.vendor],
                ['Quantity', formatNumber(batch.qty)],
                ['Status', batch.status],
                [
                  'Primary bin',
                  relatedInv[0]
                    ? `${relatedInv[0].zone}-${relatedInv[0].rack}-${relatedInv[0].shelf}-${relatedInv[0].bin}`
                    : '—',
                ],
              ]}
            />
          </section>
        </div>
      )}

      {tab === 'trace' && (
        <div style={{ display: 'grid', gap: 16 }}>
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
              Inbound receipts
            </h3>
            <QkTable columns={grnCols} rows={relatedGrn} emptyTitle="No GRN linked to this batch yet." />
          </section>
          <section className="qk-surface" style={{ padding: 16 }}>
            <h3 className="qk-section-title" style={{ marginBottom: 12 }}>
              Stock locations
            </h3>
            {relatedInv.length === 0 ? (
              <p className="qk-muted" style={{ fontSize: 13, margin: 0 }}>
                No inventory locations for this batch.
              </p>
            ) : (
              <div style={{ display: 'grid', gap: 8 }}>
                {relatedInv.map((i) => (
                  <div
                    key={i.id}
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      fontSize: 13,
                      padding: '8px 0',
                      borderBottom: '1px solid var(--qk-border)',
                    }}
                  >
                    <span>
                      {i.warehouse} · {i.zone}-{i.rack}-{i.shelf}-{i.bin}
                    </span>
                    <strong>{formatNumber(i.available)} avail</strong>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}

      {tab === 'movements' && (
        <QkTable columns={moveCols} rows={relatedMoves} emptyTitle="No movements recorded for this batch." />
      )}
      {tab === 'qc' && <QkTable columns={qcCols} rows={relatedQc} emptyTitle="No QC inspections for this batch." />}
    </div>
  )
}

function daysUntil(date: string) {
  const target = new Date(`${date}T00:00:00`).getTime()
  const today = new Date('2026-09-09T00:00:00').getTime()
  return Math.ceil((target - today) / (1000 * 60 * 60 * 24))
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
