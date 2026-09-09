import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Check, X } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton,
  QkConfirmDialog,
  QkFilterBar,
  QkMetric,
  QkStatusBadge,
  QkTable,
  type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, statusTone } from '../../utils'
import type { PurchaseOrder } from '../../types'

export function ApprovalsPage() {
  const { purchaseOrders, svcApprovePo, svcRejectPo } = useData()
  const { pushToast } = useToast()
  const navigate = useNavigate()
  const [vendor, setVendor] = useState('')
  const [confirm, setConfirm] = useState<{ po: PurchaseOrder; action: 'approve' | 'reject' } | null>(null)

  const queue = useMemo(
    () => purchaseOrders.filter((p) => p.status === 'Pending Approval'),
    [purchaseOrders],
  )

  const filtered = useMemo(() => {
    return queue.filter((row) => {
      if (vendor && row.vendor !== vendor) return false
      return true
    })
  }, [queue, vendor])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'poNumber',
    'vendor',
    'warehouse',
    'createdBy',
  ] as never)

  const chips = vendor ? [{ id: 'vendor', label: `Vendor: ${vendor}` }] : []

  const applyAction = () => {
    if (!confirm) return
    const { po, action } = confirm
    if (action === 'approve') {
      svcApprovePo(po.id, 'Ankit Verma', 'Approved from approval queue')
    } else {
      svcRejectPo(po.id, 'Ankit Verma', 'Rejected from approval queue')
    }
    pushToast({
      tone: action === 'approve' ? 'success' : 'warning',
      title: action === 'approve' ? 'PO approved' : 'PO rejected',
      message:
        action === 'approve'
          ? `${po.poNumber} published and ready for inbound.`
          : `${po.poNumber} cancelled and removed from approval queue.`,
    })
    setConfirm(null)
  }

  const columns: QkColumn<PurchaseOrder>[] = [
    {
      key: 'poNumber',
      header: 'PO Number',
      sortable: true,
      render: (r) => (
        <Link to={`/purchase-orders/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>
          {r.poNumber}
        </Link>
      ),
    },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (r) => formatCurrency(r.amount),
    },
    { key: 'itemCount', header: 'Items', align: 'right' },
    {
      key: 'expectedDelivery',
      header: 'Expected',
      sortable: true,
      render: (r) => formatDate(r.expectedDelivery),
    },
    { key: 'createdBy', header: 'Requested by', sortable: true },
    {
      key: 'status',
      header: 'Status',
      render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} />,
    },
    {
      key: 'id',
      header: 'Actions',
      render: (r) => (
        <div style={{ display: 'flex', gap: 6 }} onClick={(e) => e.stopPropagation()}>
          <QkButton
            size="sm"
            leftIcon={<Check size={12} />}
            onClick={() => setConfirm({ po: r, action: 'approve' })}
          >
            Approve
          </QkButton>
          <QkButton
            size="sm"
            variant="outline"
            leftIcon={<X size={12} />}
            onClick={() => setConfirm({ po: r, action: 'reject' })}
          >
            Reject
          </QkButton>
        </div>
      ),
    },
  ]

  const queueValue = queue.reduce((s, p) => s + p.amount, 0)

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Approvals"
        subtitle="Purchase orders awaiting procurement / warehouse approval."
        actions={
          <Link to="/purchase-orders">
            <QkButton variant="outline">All purchase orders</QkButton>
          </Link>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="In queue" value={queue.length} />
        <QkMetric label="Queue value" value={formatCurrency(queueValue)} />
        <QkMetric
          label="Vendors"
          value={new Set(queue.map((p) => p.vendorId)).size}
        />
        <QkMetric
          label="Avg items"
          value={queue.length ? Math.round(queue.reduce((s, p) => s + p.itemCount, 0) / queue.length) : 0}
        />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search PO, vendor, requester..."
        filters={[
          {
            id: 'vendor',
            label: 'Vendor',
            value: vendor,
            onChange: (v) => {
              setVendor(v)
              list.setPage(1)
            },
            options: Array.from(new Set(queue.map((p) => p.vendor))).map((v) => ({ label: v, value: v })),
          },
        ]}
        chips={chips}
        onRemoveChip={() => setVendor('')}
        onClearAll={() => {
          setVendor('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as PurchaseOrder[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(row) => navigate(`/purchase-orders/${row.id}`)}
        emptyTitle="No POs pending approval."
        emptyDescription="Approved and rejected purchase orders leave this queue."
      />

      <QkConfirmDialog
        open={!!confirm}
        onClose={() => setConfirm(null)}
        onConfirm={applyAction}
        title={confirm?.action === 'approve' ? 'Approve purchase order?' : 'Reject purchase order?'}
        message={
          confirm
            ? confirm.action === 'approve'
              ? `${confirm.po.poNumber} for ${confirm.po.vendor} (${formatCurrency(confirm.po.amount)}) will be published.`
              : `${confirm.po.poNumber} will be cancelled and removed from the approval queue.`
            : ''
        }
        confirmLabel={confirm?.action === 'approve' ? 'Approve' : 'Reject'}
        tone={confirm?.action === 'reject' ? 'danger' : 'primary'}
      />
    </div>
  )
}
