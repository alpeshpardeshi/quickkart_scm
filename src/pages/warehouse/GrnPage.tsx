import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkDrawer, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, formatNumber, statusTone } from '../../utils'
import type { ReceivingRecord } from '../../types'

export function GrnPage() {
  const { receiving } = useData()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<ReceivingRecord | null>(null)

  const filtered = useMemo(() => receiving.filter((r) => !status || r.status === status), [receiving, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['grnNumber', 'poNumber', 'vendor', 'warehouse'] as never)

  const columns: QkColumn<ReceivingRecord>[] = [
    { key: 'grnNumber', header: 'GRN', sortable: true, render: (r) => <Link to={`/grn/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.grnNumber}</Link> },
    { key: 'poNumber', header: 'PO', sortable: true },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'expectedQty', header: 'Expected', align: 'right', render: (r) => formatNumber(r.expectedQty) },
    { key: 'receivedQty', header: 'Received', align: 'right', render: (r) => formatNumber(r.receivedQty) },
    { key: 'acceptedQty', header: 'Accepted', align: 'right', render: (r) => formatNumber(r.acceptedQty) },
    { key: 'rejectedQty', header: 'Rejected', align: 'right', render: (r) => formatNumber(r.rejectedQty) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'receivedBy', header: 'Received by' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="GRN" subtitle="Goods receipt notes across inbound deliveries." />
      <div className="qk-grid-metrics">
        <QkMetric label="GRNs" value={receiving.length} />
        <QkMetric label="Completed" value={receiving.filter((r) => r.status === 'Completed').length} />
        <QkMetric label="Accepted units" value={formatNumber(receiving.reduce((s, r) => s + r.acceptedQty, 0))} />
        <QkMetric label="Rejected units" value={formatNumber(receiving.reduce((s, r) => s + r.rejectedQty, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search GRN, PO, vendor..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Pending', 'In Progress', 'Partial', 'Completed'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as ReceivingRecord[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/grn/${r.id}`)}
        emptyTitle="No GRNs matched your filters."
      />
      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.grnNumber || 'GRN'}
        subtitle={selected ? `${selected.poNumber} · ${selected.vendor}` : undefined}
        footer={
          <>
            {selected && <Link to={`/grn/${selected.id}`}><QkButton>Open details</QkButton></Link>}
            <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
          </>
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: 10, fontSize: 13 }}>
            {[
              ['Warehouse', selected.warehouse],
              ['Status', selected.status],
              ['Expected', formatNumber(selected.expectedQty)],
              ['Received', formatNumber(selected.receivedQty)],
              ['Accepted', formatNumber(selected.acceptedQty)],
              ['Rejected', formatNumber(selected.rejectedQty)],
              ['Received by', selected.receivedBy],
              ['Started', formatDateTime(selected.receivedAt)],
            ].map(([k, v]) => (
              <div key={String(k)} style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                <span className="qk-secondary">{k}</span>
                <strong>{v}</strong>
              </div>
            ))}
          </div>
        )}
      </QkDrawer>
    </div>
  )
}
