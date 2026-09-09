import { useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import {
  QkButton,
  QkDrawer,
  QkFilterBar,
  QkMetric,
  QkStatusBadge,
  QkTable,
  type QkColumn,
} from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatDate, formatNumber, statusTone } from '../../utils'
import type { Batch } from '../../types'

export function BatchesPage() {
  const { batches, movements } = useData()
  const [status, setStatus] = useState('')
  const [warehouse, setWarehouse] = useState('')
  const [selected, setSelected] = useState<Batch | null>(null)

  const filtered = useMemo(() => {
    return [...batches]
      .filter((row) => {
        if (status && row.status !== status) return false
        if (warehouse && row.warehouse !== warehouse) return false
        return true
      })
      .sort((a, b) => a.fefoPriority - b.fefoPriority || a.expiry.localeCompare(b.expiry))
  }, [batches, status, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'batchNo',
    'sku',
    'product',
    'warehouse',
    'vendor',
  ] as never)

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

  const relatedMoves = useMemo(
    () => (selected ? movements.filter((m) => m.batch === selected.batchNo || m.sku === selected.sku) : []),
    [movements, selected],
  )

  const columns: QkColumn<Batch>[] = [
    {
      key: 'batchNo',
      header: 'Batch',
      sortable: true,
      render: (r) => (
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation()
            setSelected(r)
          }}
          style={{ color: 'var(--qk-primary)', fontWeight: 600, background: 'none', border: 0, cursor: 'pointer', padding: 0 }}
        >
          {r.batchNo}
        </button>
      ),
    },
    { key: 'sku', header: 'SKU', sortable: true },
    { key: 'product', header: 'Product', sortable: true },
    { key: 'warehouse', header: 'Warehouse', sortable: true },
    { key: 'qty', header: 'Qty', align: 'right', sortable: true, render: (r) => formatNumber(r.qty) },
    { key: 'mfgDate', header: 'MFG', sortable: true, render: (r) => formatDate(r.mfgDate) },
    { key: 'expiry', header: 'Expiry', sortable: true, render: (r) => formatDate(r.expiry) },
    {
      key: 'fefoPriority',
      header: 'FEFO',
      align: 'center',
      sortable: true,
      render: (r) => (
        <span
          style={{
            display: 'inline-flex',
            width: 22,
            height: 22,
            borderRadius: '50%',
            background: 'var(--qk-primary-soft)',
            color: 'var(--qk-primary)',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 11,
            fontWeight: 700,
          }}
        >
          {r.fefoPriority}
        </span>
      ),
    },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'vendor', header: 'Vendor' },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Batches"
        subtitle="FEFO-prioritized batch stock across warehouses."
        actions={
          <Link to="/expiry">
            <QkButton variant="outline">Expiry dashboard</QkButton>
          </Link>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Batches" value={batches.length} />
        <QkMetric label="Near expiry" value={batches.filter((b) => b.status === 'Near Expiry').length} />
        <QkMetric label="Expired" value={batches.filter((b) => b.status === 'Expired').length} />
        <QkMetric label="Quarantine" value={batches.filter((b) => b.status === 'Quarantine').length} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search batch, SKU, product..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: (v) => {
              setStatus(v)
              list.setPage(1)
            },
            options: ['Active', 'Near Expiry', 'Expired', 'Quarantine'].map((s) => ({ label: s, value: s })),
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              setWarehouse(v)
              list.setPage(1)
            },
            options: Array.from(new Set(batches.map((b) => b.warehouse))).map((w) => ({ label: w, value: w })),
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
        rows={list.rows as unknown as Batch[]}
        loading={list.loading}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        onRowClick={(row) => setSelected(row)}
        emptyTitle="No batches matched your filters."
        emptyDescription="Try clearing filters or searching a different batch number."
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

      <QkDrawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title={selected?.batchNo ?? 'Batch'}
        subtitle={selected ? `${selected.sku} · ${selected.product}` : undefined}
        width={480}
        footer={
          selected && (
            <>
              <QkButton variant="outline" onClick={() => setSelected(null)}>
                Close
              </QkButton>
              <Link to={`/batches/${selected.id}`}>
                <QkButton>Open details</QkButton>
              </Link>
            </>
          )
        }
      >
        {selected && (
          <div style={{ display: 'grid', gap: 16 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
              <QkStatusBadge label={selected.status} tone={statusTone(selected.status)} />
              <span className="qk-muted" style={{ fontSize: 12 }}>
                FEFO priority {selected.fefoPriority}
              </span>
            </div>
            <DetailGrid
              rows={[
                ['Warehouse', selected.warehouse],
                ['Vendor', selected.vendor],
                ['Quantity', formatNumber(selected.qty)],
                ['MFG date', formatDate(selected.mfgDate)],
                ['Expiry', formatDate(selected.expiry)],
              ]}
            />
            <div>
              <h3 className="qk-section-title" style={{ marginBottom: 8 }}>
                Recent movements
              </h3>
              {relatedMoves.length === 0 ? (
                <p className="qk-muted" style={{ fontSize: 13, margin: 0 }}>
                  No movements linked to this batch.
                </p>
              ) : (
                <div style={{ display: 'grid', gap: 8 }}>
                  {relatedMoves.slice(0, 5).map((m) => (
                    <div
                      key={m.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        gap: 8,
                        fontSize: 12,
                        padding: '8px 0',
                        borderBottom: '1px solid var(--qk-border)',
                      }}
                    >
                      <span>
                        {m.type} · {m.reference}
                      </span>
                      <strong>{m.qty > 0 ? `+${m.qty}` : m.qty}</strong>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </QkDrawer>
    </div>
  )
}

function DetailGrid({ rows }: { rows: [string, string][] }) {
  return (
    <div style={{ display: 'grid', gap: 10 }}>
      {rows.map(([label, value]) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13 }}>
          <span className="qk-secondary">{label}</span>
          <strong>{value}</strong>
        </div>
      ))}
    </div>
  )
}
