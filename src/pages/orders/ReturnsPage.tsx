import { useMemo, useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton, QkDrawer, QkFilterBar, QkInput, QkMetric, QkSelect,
  QkStatusBadge, QkTable, type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, formatNumber, statusTone, uid } from '../../utils'
import type { ReturnRecord } from '../../types'

export function ReturnsPage() {
  const { returns, setReturns, salesOrders } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [selected, setSelected] = useState<ReturnRecord | null>(null)
  const [soNumber, setSoNumber] = useState('')
  const [sku, setSku] = useState('')
  const [qty, setQty] = useState('1')
  const [reason, setReason] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [reusable, setReusable] = useState('0')
  const [damaged, setDamaged] = useState('0')
  const [wastage, setWastage] = useState('0')

  const filtered = useMemo(() => returns.filter((r) => !status || r.status === status), [returns, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['returnNo', 'soNumber', 'customer', 'sku', 'product'] as never)

  const create = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!soNumber) next.soNumber = 'Select sales order'
    if (!sku) next.sku = 'Select SKU'
    if (!qty || Number(qty) <= 0) next.qty = 'Enter quantity'
    if (!reason.trim()) next.reason = 'Reason is required'
    setErrors(next)
    if (Object.keys(next).length) return
    const so = salesOrders.find((s) => s.soNumber === soNumber)!
    const item = so.items.find((i) => i.sku === sku) || so.items[0]
    const record: ReturnRecord = {
      id: uid('rt'),
      returnNo: `RTN-${300 + returns.length + 1}`,
      soId: so.id,
      soNumber,
      customerId: so.customerId,
      customer: so.customer,
      warehouseId: so.warehouseId,
      warehouse: so.warehouse,
      sku: item.sku,
      product: item.product,
      batch: item.batch || '—',
      returnedQty: Number(qty),
      reusableQty: 0,
      damagedQty: 0,
      wastageQty: 0,
      qcResult: 'Pending',
      status: 'Open',
      reason: reason.trim(),
      createdAt: '2026-09-09',
      lines: [],
    }
    setReturns((prev) => [record, ...prev])
    pushToast({ tone: 'success', title: 'Return created', message: record.returnNo })
    setOpen(false)
  }

  const saveDecision = () => {
    if (!selected) return
    const re = Number(reusable)
    const da = Number(damaged)
    const wa = Number(wastage)
    if (re + da + wa !== selected.returnedQty) {
      pushToast({ tone: 'warning', title: 'Quantities mismatch', message: `Must total ${selected.returnedQty}` })
      return
    }
    setReturns((prev) =>
      prev.map((r) =>
        r.id === selected.id
          ? {
              ...r,
              reusableQty: re,
              damagedQty: da,
              wastageQty: wa,
              qcResult: da + wa === 0 ? 'Passed' : re === 0 ? 'Failed' : 'Partial',
              status: 'Closed',
            }
          : r,
      ),
    )
    pushToast({ tone: 'success', title: 'Return decision saved', message: selected.returnNo })
    setSelected(null)
  }

  const columns: QkColumn<ReturnRecord>[] = [
    { key: 'returnNo', header: 'Return', sortable: true, render: (r) => <Link to={`/returns/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.returnNo}</Link> },
    { key: 'soNumber', header: 'SO', render: (r) => (
      r.soId
        ? <Link to={`/sales-orders/${r.soId}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.soNumber}</Link>
        : r.soNumber
    ) },
    { key: 'customer', header: 'Customer', sortable: true },
    { key: 'sku', header: 'SKU' },
    { key: 'product', header: 'Product' },
    { key: 'batch', header: 'Batch' },
    { key: 'returnedQty', header: 'Returned', align: 'right', render: (r) => formatNumber(r.returnedQty) },
    { key: 'qcResult', header: 'QC', render: (r) => <QkStatusBadge label={r.qcResult} tone={statusTone(r.qcResult)} /> },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDate(r.createdAt) },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Returns" subtitle="Inbound customer returns with QC and disposition." actions={<QkButton leftIcon={<Plus size={14} />} onClick={() => { setOpen(true); setErrors({}); setSoNumber(''); setSku(''); setQty('1'); setReason('') }}>Create return</QkButton>} />
      <div className="qk-grid-metrics">
        <QkMetric label="Open" value={returns.filter((r) => r.status !== 'Closed').length} />
        <QkMetric label="Reusable units" value={formatNumber(returns.reduce((s, r) => s + r.reusableQty, 0))} />
        <QkMetric label="Damaged" value={formatNumber(returns.reduce((s, r) => s + r.damagedQty, 0))} />
        <QkMetric label="Wastage" value={formatNumber(returns.reduce((s, r) => s + r.wastageQty, 0))} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search return, SO, SKU..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Open', 'QC', 'Decision Pending', 'Closed'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as unknown as ReturnRecord[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(r) => navigate(`/returns/${r.id}`)}
        emptyTitle="No returns matched your filters."
      />

      <QkDrawer open={open} onClose={() => setOpen(false)} title="Create return" footer={<><QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton><QkButton onClick={create}>Create</QkButton></>}>
        <form onSubmit={create} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkSelect label="Sales order" required value={soNumber} error={errors.soNumber} placeholder="Select SO" options={salesOrders.map((s) => ({ label: `${s.soNumber} · ${s.customer}`, value: s.soNumber }))} onChange={(e) => { setSoNumber(e.target.value); setSku('') }} />
          <QkSelect label="SKU" required value={sku} error={errors.sku} placeholder="Select SKU" options={(salesOrders.find((s) => s.soNumber === soNumber)?.items || []).map((i) => ({ label: `${i.sku} · ${i.product}`, value: i.sku }))} onChange={(e) => setSku(e.target.value)} />
          <QkInput label="Returned qty" type="number" value={qty} error={errors.qty} onChange={(e) => setQty(e.target.value)} />
          <QkInput label="Reason" value={reason} error={errors.reason} onChange={(e) => setReason(e.target.value)} />
        </form>
      </QkDrawer>

      <QkDrawer
        open={Boolean(selected)}
        onClose={() => setSelected(null)}
        title={selected?.returnNo || 'Return'}
        subtitle={selected ? `${selected.soNumber} · ${selected.product}` : undefined}
        footer={
          selected?.status !== 'Closed' ? (
            <>
              <QkButton variant="outline" onClick={() => setSelected(null)}>Cancel</QkButton>
              <QkButton onClick={saveDecision}>Save decision</QkButton>
            </>
          ) : (
            <QkButton variant="outline" onClick={() => setSelected(null)}>Close</QkButton>
          )
        }
      >
        {selected && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Row label="Customer" value={selected.customer} />
            <Row label="Batch" value={selected.batch} />
            <Row label="Returned qty" value={formatNumber(selected.returnedQty)} />
            <Row label="Reason" value={selected.reason} />
            {selected.status !== 'Closed' ? (
              <>
                <QkInput label="Reusable qty" type="number" value={reusable} onChange={(e) => setReusable(e.target.value)} />
                <QkInput label="Damaged qty" type="number" value={damaged} onChange={(e) => setDamaged(e.target.value)} />
                <QkInput label="Wastage qty" type="number" value={wastage} onChange={(e) => setWastage(e.target.value)} />
              </>
            ) : (
              <>
                <Row label="Reusable" value={formatNumber(selected.reusableQty)} />
                <Row label="Damaged" value={formatNumber(selected.damagedQty)} />
                <Row label="Wastage" value={formatNumber(selected.wastageQty)} />
                <Row label="QC result" value={selected.qcResult} />
              </>
            )}
          </div>
        )}
      </QkDrawer>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
      <span className="qk-secondary">{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  )
}
