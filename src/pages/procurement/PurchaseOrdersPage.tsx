import { useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Plus } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, statusTone } from '../../utils'
import type { PurchaseOrder } from '../../types'

export function PurchaseOrdersPage() {
  const { purchaseOrders } = useData()
  const navigate = useNavigate()
  const [status, setStatus] = useState('')
  const [vendor, setVendor] = useState('')
  const [warehouse, setWarehouse] = useState('')

  const filtered = useMemo(() => {
    return purchaseOrders.filter((row) => {
      if (status && row.status !== status) return false
      if (vendor && row.vendor !== vendor) return false
      if (warehouse && row.warehouse !== warehouse) return false
      return true
    })
  }, [purchaseOrders, status, vendor, warehouse])

  const list = useListState(filtered as unknown as Record<string, unknown>[], [
    'poNumber',
    'vendor',
    'warehouse',
    'createdBy',
  ] as never)

  const chips = [
    status ? { id: 'status', label: `Status: ${status}` } : null,
    vendor ? { id: 'vendor', label: `Vendor: ${vendor}` } : null,
    warehouse ? { id: 'warehouse', label: `Warehouse: ${warehouse}` } : null,
  ].filter(Boolean) as { id: string; label: string }[]

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
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} />,
    },
    {
      key: 'amount',
      header: 'Amount',
      align: 'right',
      sortable: true,
      render: (r) => formatCurrency(r.amount),
    },
    { key: 'itemCount', header: 'Items', align: 'right', sortable: true },
    {
      key: 'expectedDelivery',
      header: 'Expected',
      sortable: true,
      render: (r) => formatDate(r.expectedDelivery),
    },
    {
      key: 'zohoStatus',
      header: 'Zoho',
      render: (r) => <QkStatusBadge label={r.zohoStatus} tone={statusTone(r.zohoStatus)} />,
    },
    { key: 'createdBy', header: 'Created by' },
  ]

  const openCount = purchaseOrders.filter((p) => p.status !== 'Closed' && p.status !== 'Cancelled').length
  const pendingApproval = purchaseOrders.filter((p) => p.status === 'Pending Approval').length
  const totalValue = purchaseOrders
    .filter((p) => p.status !== 'Cancelled')
    .reduce((s, p) => s + p.amount, 0)

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Purchase orders"
        subtitle="Vendor POs across draft, approval, publish, and receiving."
        actions={
          <>
            <Link to="/approval-history">
              <QkButton variant="outline">History</QkButton>
            </Link>
            <Link to="/approvals">
              <QkButton variant="outline">Approvals ({pendingApproval})</QkButton>
            </Link>
            <Link to="/purchase-orders/new">
              <QkButton leftIcon={<Plus size={14} />}>New PO</QkButton>
            </Link>
          </>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Open POs" value={openCount} />
        <QkMetric label="Pending approval" value={pendingApproval} />
        <QkMetric label="Receiving" value={purchaseOrders.filter((p) => p.status === 'Receiving').length} />
        <QkMetric label="Pipeline value" value={formatCurrency(totalValue)} />
      </div>

      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search PO, vendor, warehouse..."
        filters={[
          {
            id: 'status',
            label: 'Status',
            value: status,
            onChange: (v) => {
              setStatus(v)
              list.setPage(1)
            },
            options: ['Draft', 'Pending Approval', 'Published', 'Receiving', 'Closed', 'Cancelled'].map((s) => ({
              label: s,
              value: s,
            })),
          },
          {
            id: 'vendor',
            label: 'Vendor',
            value: vendor,
            onChange: (v) => {
              setVendor(v)
              list.setPage(1)
            },
            options: Array.from(new Set(purchaseOrders.map((p) => p.vendor))).map((v) => ({ label: v, value: v })),
          },
          {
            id: 'warehouse',
            label: 'Warehouse',
            value: warehouse,
            onChange: (v) => {
              setWarehouse(v)
              list.setPage(1)
            },
            options: Array.from(new Set(purchaseOrders.map((p) => p.warehouse))).map((w) => ({
              label: w,
              value: w,
            })),
          },
        ]}
        chips={chips}
        onRemoveChip={(id) => {
          if (id === 'status') setStatus('')
          if (id === 'vendor') setVendor('')
          if (id === 'warehouse') setWarehouse('')
        }}
        onClearAll={() => {
          setStatus('')
          setVendor('')
          setWarehouse('')
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
        emptyTitle="No purchase orders matched."
        emptyDescription="Clear filters or create a new draft PO."
        emptyAction={
          <QkButton
            variant="outline"
            onClick={() => {
              setStatus('')
              setVendor('')
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
