import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, statusTone } from '../../utils'
import type { AuditRecord } from '../../types'

export function AuditsPage() {
  const { audits } = useData()
  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')

  const filtered = useMemo(() => {
    return audits.filter((row) => {
      if (status && row.status !== status) return false
      if (warehouse && row.warehouse !== warehouse) return false
      return true
    })
  }, [audits, status, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'auditNo',
    'warehouse',
    'zone',
    'auditor',
  ] as never)

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  const columns: QkColumn<AuditRecord>[] = [
    { key: 'auditNo', header: 'Audit', sortable: true, render: (r) => <strong style={{ color: 'var(--qk-primary)' }}>{r.auditNo}</strong> },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    { key: 'zone', header: 'Zone', sortable: true },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'varianceCount', header: 'Variance', align: 'right', sortable: true },
    { key: 'scheduledAt', header: 'Scheduled', sortable: true, render: (r) => formatDate(r.scheduledAt) },
    { key: 'completedAt', header: 'Completed', render: (r) => formatDate(r.completedAt) },
    { key: 'auditor', header: 'Auditor', sortable: true },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Audits"
        subtitle="Cycle counts and inventory audit schedule."
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Total audits" value={audits.length} />
        <QkMetric label="Scheduled" value={audits.filter((a) => a.status === 'Scheduled').length} />
        <QkMetric label="In progress" value={audits.filter((a) => a.status === 'In Progress').length} />
        <QkMetric label="With variance" value={audits.filter((a) => a.status === 'Variance' || a.varianceCount > 0).length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search audit, warehouse, auditor..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: (v) => {
              setStatus(v)
              list.setPage(1)
            },
            options: ['Scheduled', 'In Progress', 'Completed', 'Variance'].map((s) => ({ label: s, value: s })),
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              setWarehouse(v)
              list.setPage(1)
            },
            options: Array.from(new Set(audits.map((a) => a.warehouse))).map((w) => ({ label: w, value: w })),
          },
        ]}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'status') setStatus('')
          if (id === 'warehouse') setWarehouse('')
        }}
        onClearAll={() => {
          setStatus('')
          setWarehouse('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as AuditRecord[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No audits matched your filters."
        emptyDescription="Adjust status or warehouse filters to see scheduled counts."
        emptyAction={
          <QkButton
            variant="outline"
            onClick={() => {
              setStatus('')
              setWarehouse('')
              list.setSearch('')
            }}
          >
            Clear filters
          </QkButton>
        }
      />
    </div>
  )
}
