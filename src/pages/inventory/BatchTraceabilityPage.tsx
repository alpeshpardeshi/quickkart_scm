import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTabs, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useState, useMemo } from 'react'
import { formatDate, formatDateTime, formatNumber, statusTone } from '../../utils'
import type { StockMovement, QcInspection } from '../../types'

export function BatchTraceabilityPage() {
  const { id } = useParams()
  const { batches, movements, qcInspections, receiving, inventory } = useData()
  const batch = batches.find((b) => b.id === id) || batches.find((b) => b.batchNo === id)
  const [tab, setTab] = useState('timeline')

  const moves = useMemo(() => movements.filter((m) => m.batch === batch?.batchNo), [movements, batch])
  const qc = useMemo(() => qcInspections.filter((q) => q.batch === batch?.batchNo), [qcInspections, batch])
  const inv = useMemo(() => inventory.filter((i) => i.batch === batch?.batchNo), [inventory, batch])
  const grns = useMemo(
    () => receiving.filter((r) => moves.some((m) => m.reference === r.grnNumber)),
    [receiving, moves],
  )

  if (!batch) {
    return (
      <div className="qk-page">
        <PageHeader title="Batch not found" />
        <Link to="/batches"><QkButton variant="outline">Back</QkButton></Link>
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
  ]

  const qcCols: QkColumn<QcInspection>[] = [
    { key: 'reference', header: 'QC' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'acceptedQty', header: 'Accepted', align: 'right' },
    { key: 'rejectedQty', header: 'Rejected', align: 'right' },
    { key: 'inspector', header: 'Inspector' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={`Traceability · ${batch.batchNo}`}
        subtitle={`${batch.sku} · ${batch.product} · ${batch.warehouse}`}
        actions={
          <>
            <Link to="/batches"><QkButton variant="outline">Batches</QkButton></Link>
            <Link to={`/batches/${batch.id}`}><QkButton>Batch details</QkButton></Link>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <QkStatusBadge label={batch.status} tone={statusTone(batch.status)} />
        <span className="qk-muted" style={{ fontSize: 12 }}>
          {Math.ceil((new Date(`${batch.expiry}T00:00:00`).getTime() - new Date('2026-09-09T00:00:00').getTime()) / (1000 * 60 * 60 * 24))} days left · Expiry {formatDate(batch.expiry)}
        </span>
      </div>
      <div className="qk-grid-metrics">
        <QkMetric label="Qty" value={formatNumber(batch.qty)} />
        <QkMetric label="Movements" value={moves.length} />
        <QkMetric label="QC events" value={qc.length} />
        <QkMetric label="Locations" value={inv.length} />
      </div>
      <QkTabs
        value={tab}
        onChange={setTab}
        tabs={[
          { id: 'timeline', label: 'Movements', count: moves.length },
          { id: 'qc', label: 'QC', count: qc.length },
          { id: 'inbound', label: 'Inbound GRN', count: grns.length },
          { id: 'locations', label: 'Locations', count: inv.length },
        ]}
      />
      {tab === 'timeline' && <QkTable columns={moveCols} rows={moves} emptyTitle="No movements for this batch." />}
      {tab === 'qc' && <QkTable columns={qcCols} rows={qc} emptyTitle="No QC events for this batch." />}
      {tab === 'inbound' && (
        <section className="qk-surface" style={{ padding: 16 }}>
          {grns.length === 0 && <div className="qk-secondary">No linked GRNs found.</div>}
          {grns.map((g) => (
            <Link key={g.id} to={`/grn/${g.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--qk-border)', fontSize: 13 }}>
              <strong style={{ color: 'var(--qk-primary)' }}>{g.grnNumber}</strong>
              <span>{g.vendor} · {formatNumber(g.acceptedQty)} accepted</span>
            </Link>
          ))}
        </section>
      )}
      {tab === 'locations' && (
        <section className="qk-surface" style={{ padding: 16 }}>
          {inv.map((i) => (
            <Link key={i.id} to={`/inventory/${i.id}`} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--qk-border)', fontSize: 13 }}>
              <strong style={{ color: 'var(--qk-primary)' }}>{i.zone}-{i.rack}-{i.shelf}-{i.bin}</strong>
              <span>{formatNumber(i.available)} available · {i.warehouse}</span>
            </Link>
          ))}
          {!inv.length && <div className="qk-secondary">No inventory locations for this batch.</div>}
        </section>
      )}
    </div>
  )
}
