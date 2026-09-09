import { useMemo, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatDateTime, formatNumber, statusTone } from '../../utils'
import type { StockMovement } from '../../types'

export function StockMovementPage() {
  const { movements } = useData()
  const [type, setType] = useState('')

  const filtered = useMemo(() => {
    return movements.filter((row) => {
      if (type && row.type !== type) return false
      return true
    })
  }, [movements, type])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'sku',
    'product',
    'batch',
    'reference',
    'fromLocation',
    'toLocation',
    'performedBy',
  ] as never)

  const chips = type ? [{ id: 'type', label: `Type: ${type}` }] : []

  const columns: QkColumn<StockMovement>[] = [
    {
      key: 'performedAt',
      header: 'When',
      sortable: true,
      render: (r) => formatDateTime(r.performedAt),
    },
    {
      key: 'type',
      header: 'Type',
      sortable: true,
      render: (r) => <QkStatusBadge label={r.type} tone={statusTone(r.type)} />,
    },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'batch', header: 'Batch', sortable: true },
    {
      key: 'qty',
      header: 'Qty',
      align: 'right',
      sortable: true,
      render: (r) => (
        <span style={{ color: r.qty < 0 ? 'var(--qk-danger)' : 'var(--qk-text)', fontWeight: 600 }}>
          {r.qty > 0 ? `+${formatNumber(r.qty)}` : formatNumber(r.qty)}
        </span>
      ),
    },
    { key: 'fromLocation', header: 'From' },
    { key: 'toLocation', header: 'To' },
    { key: 'reference', header: 'Reference', sortable: true },
    { key: 'performedBy', header: 'By' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Stock movements"
        subtitle="Inbound, outbound, transfer, adjustment, and return history."
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Movements" value={movements.length} />
        <QkMetric label="Inbound" value={movements.filter((m) => m.type === 'Inbound').length} />
        <QkMetric label="Outbound" value={movements.filter((m) => m.type === 'Outbound').length} />
        <QkMetric label="Adjustments" value={movements.filter((m) => m.type === 'Adjustment').length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, product, batch, reference..."
        filters={[
          {
            id: 'type',
            label: 'Type',
            value: type,
            onChange: (v) => {
              setType(v)
              list.setPage(1)
            },
            options: ['Inbound', 'Outbound', 'Transfer', 'Adjustment', 'Return'].map((s) => ({
              label: s,
              value: s,
            })),
          },
        ]}
        chips={chips}
        onRemoveChip={() => setType('')}
        onClearAll={() => {
          setType('')
          list.setSearch('')
        }}
      />

      <QkTable
        columns={columns}
        rows={list.rows as unknown as StockMovement[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No stock movements matched."
        emptyDescription="Try a different movement type or search term."
        emptyAction={
          <QkButton
            variant="outline"
            onClick={() => {
              setType('')
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
