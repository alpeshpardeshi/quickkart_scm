import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, statusTone, uid } from '../../utils'
import type { ZohoSyncRecord } from '../../types'

export function ZohoSyncHistoryPage() {
  const { zohoSyncHistory, setZohoSyncHistory, purchaseOrders, setPurchaseOrders } = useData()
  const { pushToast } = useToast()
  const [status, setStatus] = useState('')
  const filtered = useMemo(() => zohoSyncHistory.filter((r) => !status || r.status === status), [zohoSyncHistory, status])
  const list = useListState(filtered as unknown as Record<string, unknown>[], ['poNumber', 'message'] as never)

  const retryFailed = () => {
    const failed = zohoSyncHistory.filter((z) => z.status === 'Failed')
    if (!failed.length) {
      pushToast({ tone: 'info', title: 'Nothing to retry', message: 'No failed Zoho syncs' })
      return
    }
    setZohoSyncHistory((prev) => [
      ...failed.map((f) => ({
        id: uid('zs'),
        poNumber: f.poNumber,
        direction: f.direction,
        status: 'Synced' as const,
        message: 'Manual retry succeeded',
        syncedAt: new Date().toISOString(),
        attempts: f.attempts + 1,
      })),
      ...prev.map((z) => (z.status === 'Failed' ? { ...z, status: 'Synced' as const, message: 'Resolved by retry', attempts: z.attempts + 1 } : z)),
    ])
    setPurchaseOrders((prev) =>
      prev.map((p) => (failed.some((f) => f.poNumber === p.poNumber) ? { ...p, zohoStatus: 'Synced' } : p)),
    )
    pushToast({ tone: 'success', title: 'Zoho retry complete', message: `${failed.length} record(s) synced` })
  }

  const columns: QkColumn<ZohoSyncRecord>[] = [
    { key: 'poNumber', header: 'PO', sortable: true, render: (r) => <strong style={{ color: 'var(--qk-primary)' }}>{r.poNumber}</strong> },
    { key: 'direction', header: 'Direction' },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'message', header: 'Message' },
    { key: 'attempts', header: 'Attempts', align: 'right' },
    { key: 'syncedAt', header: 'When', sortable: true, render: (r) => formatDateTime(r.syncedAt) },
  ]

  const pendingPo = purchaseOrders.filter((p) => p.zohoStatus === 'Pending' || p.zohoStatus === 'Failed').length

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Zoho Sync History"
        subtitle="Integration status between QuicKart POs and Zoho Books."
        actions={<QkButton variant="outline" onClick={retryFailed}>Retry failed</QkButton>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Sync events" value={zohoSyncHistory.length} />
        <QkMetric label="Synced" value={zohoSyncHistory.filter((z) => z.status === 'Synced').length} />
        <QkMetric label="Pending / failed events" value={zohoSyncHistory.filter((z) => z.status !== 'Synced').length} />
        <QkMetric label="POs needing sync" value={pendingPo} />
      </div>
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search PO or message..."
        filters={[{ id: 'status', label: 'Status', value: status, onChange: setStatus, options: ['Synced', 'Pending', 'Failed'].map((s) => ({ label: s, value: s })) }]}
        chips={status ? [{ id: 'status', label: `Status: ${status}` }] : []}
        onRemoveChip={() => setStatus('')}
        onClearAll={() => { setStatus(''); list.setSearch('') }}
      />
      <QkTable columns={columns} rows={list.rows as unknown as ZohoSyncRecord[]} sortKey={list.sortKey} sortDir={list.sortDir} onSort={list.onSort} page={list.page} pageCount={list.pageCount} total={list.total} pageSize={list.pageSize} onPageChange={list.setPage} emptyTitle="No Zoho sync events." />
    </div>
  )
}
