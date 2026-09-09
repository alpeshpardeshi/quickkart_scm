import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDateTime, statusTone } from '../../utils'
import type { ApprovalHistoryItem } from '../../types'

export function ApprovalHistoryPage() {
  const { approvalHistory } = useData()
  const [action, setAction] = useState('')
  const filtered = useMemo(() => approvalHistory.filter((r) => !action || r.action === action), [approvalHistory, action])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['poNumber', 'vendor', 'actedBy', 'notes'] as never)

  const columns: QkColumn<ApprovalHistoryItem>[] = [
    { key: 'poNumber', header: 'PO', sortable: true, render: (r) => <Link to={`/purchase-orders/${r.poId}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.poNumber}</Link> },
    { key: 'vendor', header: 'Vendor', sortable: true },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'action', header: 'Action', render: (r) => <QkStatusBadge label={r.action} tone={statusTone(r.action)} /> },
    { key: 'actedBy', header: 'Acted by', sortable: true },
    { key: 'actedAt', header: 'When', sortable: true, render: (r) => formatDateTime(r.actedAt) },
    { key: 'notes', header: 'Notes' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Approval History"
        subtitle="Audit trail of PO submissions, approvals, and rejections."
        actions={<Link to="/approvals"><QkButton variant="outline">Open queue</QkButton></Link>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Events" value={approvalHistory.length} />
        <QkMetric label="Approved" value={approvalHistory.filter((a) => a.action === 'Approved').length} />
        <QkMetric label="Rejected" value={approvalHistory.filter((a) => a.action === 'Rejected').length} />
        <QkMetric label="Submitted" value={approvalHistory.filter((a) => a.action === 'Submitted').length} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search PO, vendor, actor..."
        filters={[{ id: 'action', label: 'Action', value: action, onChange: setAction, options: ['Approved', 'Rejected', 'Submitted'].map((s) => ({ label: s, value: s })) }]}
        chips={action ? [{ id: 'action', label: `Action: ${action}` }] : []}
        onRemoveChip={() => setAction('')}
        onClearAll={() => { setAction(''); list.setSearch('') }}
      />
      <QkTable columns={columns} rows={list.rows as unknown as ApprovalHistoryItem[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} emptyTitle="No approval history yet." />
    </div>
  )
}
