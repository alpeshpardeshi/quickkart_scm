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
import { formatDateTime, formatNumber, statusTone, uid } from '../../utils'
import type { ReceivingRecord } from '../../types'

export function ReceivingPage() {
  const { receiving, setReceiving, purchaseOrders, warehouses } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [open, setOpen] = useState(false)
  const [poNumber, setPoNumber] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [expectedQty, setExpectedQty] = useState('')
  const [errors, setErrors] = useState<Record<string, string>>({})

  const filtered = useMemo(() => receiving.filter((r) => !status || r.status === status), [receiving, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['grnNumber', 'poNumber', 'vendor', 'warehouse'] as never)

  const openPos = purchaseOrders.filter((p) => p.status === 'Published' || p.status === 'Receiving')

  const startReceiving = (e: FormEvent) => {
    e.preventDefault()
    const next: Record<string, string> = {}
    if (!poNumber) next.poNumber = 'Select a purchase order'
    if (!warehouse) next.warehouse = 'Select a warehouse'
    if (!expectedQty || Number(expectedQty) <= 0) next.expectedQty = 'Enter expected quantity'
    setErrors(next)
    if (Object.keys(next).length) return

    const po = purchaseOrders.find((p) => p.poNumber === poNumber)
    const record: ReceivingRecord = {
      id: uid('r'),
      grnNumber: `GRN-${8000 + receiving.length + 1}`,
      poNumber,
      vendor: po?.vendor || '—',
      warehouse,
      expectedQty: Number(expectedQty),
      receivedQty: 0,
      acceptedQty: 0,
      rejectedQty: 0,
      status: 'In Progress',
      receivedAt: new Date().toISOString(),
      receivedBy: 'Suresh Yadav',
    }
    setReceiving((prev) => [record, ...prev])
    pushToast({ tone: 'success', title: 'Receiving started', message: `${record.grnNumber} created for ${poNumber}` })
    setOpen(false)
    navigate(`/receiving/${record.id}`)
  }

  const columns: QkColumn<ReceivingRecord>[] = [
    { key: 'grnNumber', header: 'GRN', sortable: true, render: (r) => <Link to={`/receiving/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.grnNumber}</Link> },
    { key: 'poNumber', header: 'PO', sortable: true },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'expectedQty', header: 'Expected', align: 'right', render: (r) => formatNumber(r.expectedQty) },
    { key: 'receivedQty', header: 'Received', align: 'right', render: (r) => formatNumber(r.receivedQty) },
    { key: 'acceptedQty', header: 'Accepted', align: 'right', render: (r) => formatNumber(r.acceptedQty) },
    { key: 'rejectedQty', header: 'Rejected', align: 'right', render: (r) => formatNumber(r.rejectedQty) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'receivedAt', header: 'Started', render: (r) => formatDateTime(r.receivedAt) },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Receiving"
        subtitle="Inbound dock operations and GRN progress."
        actions={<QkButton leftIcon={<Plus size={14} />} onClick={() => { setOpen(true); setErrors({}); setPoNumber(''); setWarehouse(''); setExpectedQty('') }}>Start receiving</QkButton>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Open" value={receiving.filter((r) => r.status !== 'Completed').length} />
        <QkMetric label="In progress" value={receiving.filter((r) => r.status === 'In Progress').length} />
        <QkMetric label="Completed" value={receiving.filter((r) => r.status === 'Completed').length} />
        <QkMetric label="Units received" value={formatNumber(receiving.reduce((s, r) => s + r.receivedQty, 0))} />
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
        onRowClick={(r) => navigate(`/receiving/${r.id}`)}
        emptyTitle="No receiving records matched your filters."
      />

      <QkDrawer
        open={open}
        onClose={() => setOpen(false)}
        title="Start receiving"
        subtitle="Create a GRN from a published purchase order."
        footer={
          <>
            <QkButton variant="outline" onClick={() => setOpen(false)}>Cancel</QkButton>
            <QkButton onClick={startReceiving}>Start</QkButton>
          </>
        }
      >
        <form onSubmit={startReceiving} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
          <QkSelect
            label="Purchase order"
            required
            value={poNumber}
            error={errors.poNumber}
            placeholder="Select PO"
            options={openPos.map((p) => ({ label: `${p.poNumber} · ${p.vendor}`, value: p.poNumber }))}
            onChange={(e) => {
              setPoNumber(e.target.value)
              const po = purchaseOrders.find((p) => p.poNumber === e.target.value)
              if (po) {
                setWarehouse(po.warehouse)
                setExpectedQty(String(po.items.reduce((s, i) => s + i.pendingQty, 0)))
              }
            }}
          />
          <QkSelect
            label="Warehouse"
            required
            value={warehouse}
            error={errors.warehouse}
            placeholder="Select warehouse"
            options={warehouses.map((w) => ({ label: w.name, value: w.name }))}
            onChange={(e) => setWarehouse(e.target.value)}
          />
          <QkInput label="Expected qty" type="number" required value={expectedQty} error={errors.expectedQty} onChange={(e) => setExpectedQty(e.target.value)} />
        </form>
      </QkDrawer>
    </div>
  )
}
