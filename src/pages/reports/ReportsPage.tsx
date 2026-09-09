import { useMemo, useState } from 'react'
import { Download } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkFilterBar, QkStatusBadge, QkTabs, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { useToast } from '../../context/ToastContext'
import { useListState } from '../../hooks/useListState'
import { formatCurrency, formatDate, formatNumber, statusTone } from '../../utils'

type TabId = 'stock' | 'low' | 'fast' | 'slow' | 'purchase' | 'sales' | 'damaged' | 'expired'

export function ReportsPage() {
  const { inventory, purchaseOrders, salesOrders, wastage, batches } = useData()
  const { pushToast } = useToast()
  const [tab, setTab] = useState<TabId>('stock')
  const [warehouse, setWarehouse] = useState('')

  const rows = useMemo(() => {
    if (tab === 'stock') {
      return inventory
        .filter((i) => !warehouse || i.warehouse === warehouse)
        .map((i) => ({ id: i.id, sku: i.sku, product: i.product, warehouse: i.warehouse, available: i.available, reserved: i.reserved, status: i.status }))
    }
    if (tab === 'low') {
      return inventory.filter((i) => i.status === 'Low Stock' && (!warehouse || i.warehouse === warehouse))
        .map((i) => ({ id: i.id, sku: i.sku, product: i.product, warehouse: i.warehouse, available: i.available, reserved: i.reserved, status: i.status }))
    }
    if (tab === 'fast') {
      return salesOrders.flatMap((s) => s.items.map((item) => ({
        id: `${s.id}-${item.id}`,
        sku: item.sku,
        product: item.product,
        warehouse: s.warehouse,
        qty: item.orderedQty,
        amount: item.total,
        status: s.status,
      }))).sort((a, b) => b.qty - a.qty).slice(0, 20)
    }
    if (tab === 'slow') {
      return inventory
        .filter((i) => i.available > 200 && (!warehouse || i.warehouse === warehouse))
        .map((i) => ({ id: i.id, sku: i.sku, product: i.product, warehouse: i.warehouse, available: i.available, reserved: i.reserved, status: i.status }))
    }
    if (tab === 'purchase') {
      return purchaseOrders
        .filter((p) => !warehouse || p.warehouse === warehouse)
        .map((p) => ({ id: p.id, ref: p.poNumber, party: p.vendor, warehouse: p.warehouse, amount: p.amount, status: p.status, date: p.createdAt }))
    }
    if (tab === 'sales') {
      return salesOrders
        .filter((s) => !warehouse || s.warehouse === warehouse)
        .map((s) => ({ id: s.id, ref: s.soNumber, party: s.customer, warehouse: s.warehouse, amount: s.amount, status: s.status, date: s.orderDate }))
    }
    if (tab === 'damaged') {
      return wastage.map((w) => ({ id: w.id, sku: w.sku, product: w.product, warehouse: w.warehouse, qty: w.qty, reason: w.reason, value: w.value, status: w.reason }))
    }
    return batches
      .filter((b) => b.status === 'Expired' || b.status === 'Near Expiry')
      .filter((b) => !warehouse || b.warehouse === warehouse)
      .map((b) => ({ id: b.id, sku: b.sku, product: b.product, warehouse: b.warehouse, batch: b.batchNo, qty: b.qty, expiry: b.expiry, status: b.status }))
  }, [tab, inventory, purchaseOrders, salesOrders, wastage, batches, warehouse])

  const list = useListState(rows as unknown as Record<string, unknown>[], ['sku', 'product', 'warehouse', 'ref', 'party', 'batch'] as never)

  const columns = useMemo(() => {
    if (tab === 'purchase' || tab === 'sales') {
      return [
        { key: 'ref', header: 'Reference', sortable: true },
        { key: 'party', header: tab === 'purchase' ? 'Vendor' : 'Customer', sortable: true },
        { key: 'warehouse', header: 'Warehouse' },
        { key: 'amount', header: 'Amount', align: 'right' as const, render: (r: { amount: number }) => formatCurrency(r.amount) },
        { key: 'date', header: 'Date', render: (r: { date: string }) => formatDate(r.date) },
        { key: 'status', header: 'Status', render: (r: { status: string }) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
      ] as QkColumn<{ id: string }>[]
    }
    if (tab === 'damaged') {
      return [
        { key: 'sku', header: 'SKU' },
        { key: 'product', header: 'Product' },
        { key: 'warehouse', header: 'Warehouse' },
        { key: 'qty', header: 'Qty', align: 'right' as const, render: (r: { qty: number }) => formatNumber(r.qty) },
        { key: 'reason', header: 'Reason' },
        { key: 'value', header: 'Value', align: 'right' as const, render: (r: { value: number }) => formatCurrency(r.value) },
      ] as QkColumn<{ id: string }>[]
    }
    if (tab === 'expired') {
      return [
        { key: 'batch', header: 'Batch' },
        { key: 'sku', header: 'SKU' },
        { key: 'product', header: 'Product' },
        { key: 'warehouse', header: 'Warehouse' },
        { key: 'qty', header: 'Qty', align: 'right' as const, render: (r: { qty: number }) => formatNumber(r.qty) },
        { key: 'expiry', header: 'Expiry', render: (r: { expiry: string }) => formatDate(r.expiry) },
        { key: 'status', header: 'Status', render: (r: { status: string }) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
      ] as QkColumn<{ id: string }>[]
    }
    if (tab === 'fast') {
      return [
        { key: 'sku', header: 'SKU' },
        { key: 'product', header: 'Product' },
        { key: 'warehouse', header: 'Warehouse' },
        { key: 'qty', header: 'Ordered qty', align: 'right' as const, render: (r: { qty: number }) => formatNumber(r.qty) },
        { key: 'amount', header: 'Amount', align: 'right' as const, render: (r: { amount: number }) => formatCurrency(r.amount) },
        { key: 'status', header: 'Order status', render: (r: { status: string }) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
      ] as QkColumn<{ id: string }>[]
    }
    return [
      { key: 'sku', header: 'SKU', sortable: true },
      { key: 'product', header: 'Product', sortable: true },
      { key: 'warehouse', header: 'Warehouse' },
      { key: 'available', header: 'Available', align: 'right' as const, render: (r: { available: number }) => formatNumber(r.available) },
      { key: 'reserved', header: 'Reserved', align: 'right' as const, render: (r: { reserved: number }) => formatNumber(r.reserved) },
      { key: 'status', header: 'Status', render: (r: { status: string }) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    ] as QkColumn<{ id: string }>[]
  }, [tab])

  const warehouses = Array.from(new Set(inventory.map((i) => i.warehouse)))

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Reports"
        subtitle="Operational datasets for stock, movement, and fulfillment."
        actions={<QkButton variant="outline" leftIcon={<Download size={14} />} onClick={() => pushToast({ tone: 'success', title: 'Export queued', message: 'CSV export simulated for this frontend prototype.' })}>Export</QkButton>}
      />
      <QkTabs
        value={tab}
        onChange={(v) => { setTab(v as TabId); list.setPage(1) }}
        tabs={[
          { id: 'stock', label: 'Stock' },
          { id: 'low', label: 'Low Stock' },
          { id: 'fast', label: 'Fast Moving' },
          { id: 'slow', label: 'Slow Moving' },
          { id: 'purchase', label: 'Purchase' },
          { id: 'sales', label: 'Sales Fulfillment' },
          { id: 'damaged', label: 'Damaged' },
          { id: 'expired', label: 'Expired' },
        ]}
      />
      <QkFilterBar
        search={list.search}
        onSearchChange={list.setSearch}
        searchPlaceholder="Search SKU, product, reference..."
        filters={[{ id: 'warehouse', label: 'Warehouse', value: warehouse, onChange: (v) => { setWarehouse(v); list.setPage(1) }, options: warehouses.map((w) => ({ label: w, value: w })) }]}
        chips={warehouse ? [{ id: 'warehouse', label: `Warehouse: ${warehouse}` }] : []}
        onRemoveChip={() => setWarehouse('')}
        onClearAll={() => { setWarehouse(''); list.setSearch('') }}
      />
      <QkTable
        columns={columns}
        rows={list.rows as { id: string }[]}
        sortKey={list.sortKey}
        sortDir={list.sortDir}
        onSort={list.onSort}
        page={list.page}
        pageCount={list.pageCount}
        total={list.total}
        pageSize={list.pageSize}
        onPageChange={list.setPage}
        emptyTitle="No report rows matched your filters."
      />
    </div>
  )
}
