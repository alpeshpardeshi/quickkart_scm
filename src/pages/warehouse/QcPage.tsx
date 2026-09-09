import { useMemo, useState, type FormEvent } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkStatusBadge,
  QkTabs, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, formatNumber, statusTone } from '../../utils'
import type { QcInspection } from '../../types'

export function QcPage() {
  const { qcInspections, svcPerformQc } = useData()
  const { pushToast } = useToast()
  const [tab, setTab] = useState('queue')
  const [status, setStatus] = useState('')
  const [selected, setSelected] = useState<QcInspection | null>(null)
  const [accepted, setAccepted] = useState('')
  const [rejected, setRejected] = useState('')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saving, setSaving] = useState(false)

  const base = useMemo(() => {
    if (tab === 'queue') return qcInspections.filter((q) => q.status === 'Pending' || q.status === 'In Progress')
    if (tab === 'rtv') return qcInspections.filter((q) => q.status === 'RTV' || q.status === 'Failed')
    return qcInspections.filter((q) => q.status === 'Passed' || q.status === 'Failed' || q.status === 'RTV' || q.status === 'Partial')
  }, [qcInspections, tab])

  const filtered = useMemo(() => base.filter((q) => !status || q.status === status), [base, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['reference', 'product', 'sku', 'batch', 'warehouse'] as never)

  const openInspect = (row: QcInspection) => {
    setSelected(row)
    setAccepted(String(row.acceptedQty || row.receivedQty))
    setRejected(String(row.rejectedQty || 0))
    setReason(row.reason || '')
    setErrors({})
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!selected) return
    const acc = Number(accepted)
    const rej = Number(rejected)
    const next: Record<string, string> = {}
    if (Number.isNaN(acc) || acc < 0) next.accepted = 'Enter accepted quantity'
    if (Number.isNaN(rej) || rej < 0) next.rejected = 'Enter rejected quantity'
    if (acc + rej !== selected.receivedQty) next.accepted = `Accepted + rejected must equal ${selected.receivedQty}`
    if (rej > 0 && !reason.trim()) next.reason = 'Reason is required for rejections'
    setErrors(next)
    if (Object.keys(next).length) return

    setSaving(true)
    await new Promise((r) => setTimeout(r, 300))
    try {
      svcPerformQc({
        qcId: selected.id,
        acceptedQty: acc,
        rejectedQty: rej,
        inspector: 'Vikram Singh',
        reason: reason.trim(),
        rejectionDisposition: rej > 0 ? (rej === selected.receivedQty ? 'RTV' : 'DAMAGED') : undefined,
      })
      pushToast({ tone: 'success', title: 'Inspection submitted', message: `${selected.qcNumber || selected.reference} updated — inventory moved` })
      setSelected(null)
    } catch (err) {
      pushToast({ tone: 'danger', title: 'QC failed', message: err instanceof Error ? err.message : 'Unable to complete QC' })
    } finally {
      setSaving(false)
    }
  }

  const columns: QkColumn<QcInspection>[] = [
    { key: 'reference', header: 'QC Ref', sortable: true, mobile: 'title', render: (r) => <strong style={{ color: 'var(--qk-primary)' }}>{r.reference}</strong> },
    { key: 'product', header: 'Product', sortable: true, mobile: 'subtitle' },
    { key: 'sku', header: 'SKU', mobile: 'meta' },
    { key: 'batch', header: 'Batch' },
    { key: 'receivedQty', header: 'Received', align: 'right', mobile: 'field', render: (r) => formatNumber(r.receivedQty) },
    { key: 'acceptedQty', header: 'Accepted', align: 'right', mobile: 'field', render: (r) => formatNumber(r.acceptedQty) },
    { key: 'rejectedQty', header: 'Rejected', align: 'right', render: (r) => formatNumber(r.rejectedQty) },
    { key: 'warehouse', header: 'Warehouse', mobile: 'meta' },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Quality Control" subtitle="Inspect inbound stock, capture defects, and raise RTV." />
      <div className="qk-grid-metrics">
        <QkMetric label="Queue" value={qcInspections.filter((q) => q.status === 'Pending' || q.status === 'In Progress').length} />
        <QkMetric label="Passed" value={qcInspections.filter((q) => q.status === 'Passed').length} />
        <QkMetric label="Failed / RTV" value={qcInspections.filter((q) => q.status === 'Failed' || q.status === 'RTV').length} />
        <QkMetric label="Rejected units" value={formatNumber(qcInspections.reduce((s, q) => s + q.rejectedQty, 0))} />
      </div>
      <QkTabs
        value={tab}
        onChange={(v) => { setTab(v); list.setPage(1) }}
        tabs={[
          { id: 'queue', label: 'QC Queue', count: qcInspections.filter((q) => q.status === 'Pending' || q.status === 'In Progress').length },
          { id: 'history', label: 'QC History' },
          { id: 'rtv', label: 'RTV', count: qcInspections.filter((q) => q.status === 'RTV' || q.status === 'Failed').length },
        ]}
      />
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search QC ref, SKU, batch..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Pending', 'In Progress', 'Passed', 'Failed', 'RTV'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable
        mobileMode="cards"
        columns={columns}
        rows={list.rows as unknown as QcInspection[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={openInspect}
        emptyTitle="No QC inspections in this view."
      />

      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.reference || 'QC Inspection'}
        subtitle={selected ? `${selected.product} · Batch ${selected.batch}` : undefined}
        footer={
          selected && (selected.status === 'Pending' || selected.status === 'In Progress') ? (
            <>
              <QkButton variant="outline" onClick={() => setSelected(null)}>Cancel</QkButton>
              <QkButton loading={saving} onClick={submit}>Submit inspection</QkButton>
            </>
          ) : (
            <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
          )
        }
      >
        {selected && (
          <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'grid', gap: 8, fontSize: 13 }}>
              <Row label="SKU" value={selected.sku} />
              <Row label="Received quantity" value={formatNumber(selected.receivedQty)} />
              <Row label="Warehouse" value={selected.warehouse} />
              {selected.inspectedAt && <Row label="Inspected" value={formatDateTime(selected.inspectedAt)} />}
            </div>
            {(selected.status === 'Pending' || selected.status === 'In Progress') ? (
              <>
                <QkInput label="Accepted" type="number" value={accepted} error={errors.accepted} onChange={(e) => setAccepted(e.target.value)} />
                <QkInput label="Rejected" type="number" value={rejected} error={errors.rejected} onChange={(e) => setRejected(e.target.value)} />
                <QkInput label="Reason" value={reason} error={errors.reason} onChange={(e) => setReason(e.target.value)} placeholder="Damaged packaging" />
              </>
            ) : (
              <>
                <Row label="Accepted" value={formatNumber(selected.acceptedQty)} />
                <Row label="Rejected" value={formatNumber(selected.rejectedQty)} />
                <Row label="Reason" value={selected.reason || '—'} />
                <Row label="Inspector" value={selected.inspector} />
              </>
            )}
          </form>
        )}
      </QkDrawer>
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
