import { useMemo } from 'react'
import { BUSINESS_DATE } from '../../services/appState'
import { remainingShelfLife } from '../../services/inventory/atpService'
import type {
  Batch,
  DispatchRecord,
  InventoryBalance,
  Picklist,
  PurchaseOrder,
  PutAwayTask,
  QcInspection,
  ReceivingRecord,
  SalesOrder,
  Task,
  Warehouse,
} from '../../types'

const OPEN_TASK = new Set(['Pending', 'Assigned', 'In Progress', 'On Hold'])

export type PipelineStageId =
  | 'Draft'
  | 'Confirmed'
  | 'Reserved'
  | 'Picking'
  | 'Packed'
  | 'Dispatch Ready'
  | 'Dispatched'
  | 'Delivered'

export interface PipelineStage {
  id: PipelineStageId
  label: string
  count: number
  hint: string
  to: string
}

function mapSoToPipeline(status: SalesOrder['status']): PipelineStageId | null {
  switch (status) {
    case 'Draft':
      return 'Draft'
    case 'Confirmed':
      return 'Confirmed'
    case 'Partially Reserved':
    case 'Reserved':
      return 'Reserved'
    case 'Picking':
    case 'Partially Picked':
    case 'Picked':
      return 'Picking'
    case 'Packed':
      return 'Packed'
    case 'Dispatch Ready':
      return 'Dispatch Ready'
    case 'Partially Dispatched':
    case 'Dispatched':
      return 'Dispatched'
    case 'Delivered':
      return 'Delivered'
    default:
      return null
  }
}

function daysAgo(date: string, businessDate: string): number {
  const a = new Date(`${date}T00:00:00`).getTime()
  const b = new Date(`${businessDate}T00:00:00`).getTime()
  return Math.round((b - a) / 86400000)
}

export function useDashboardData(input: {
  salesOrders: SalesOrder[]
  purchaseOrders: PurchaseOrder[]
  inventory: InventoryBalance[]
  batches: Batch[]
  tasks: Task[]
  picklists: Picklist[]
  dispatches: DispatchRecord[]
  qcInspections: QcInspection[]
  putAwayTasks: PutAwayTask[]
  receiving: ReceivingRecord[]
  warehouses: Warehouse[]
  businessDate?: string
}) {
  const businessDate = input.businessDate || BUSINESS_DATE
  const {
    salesOrders, purchaseOrders, inventory, batches, tasks,
    picklists, dispatches, qcInspections, putAwayTasks, receiving, warehouses,
  } = input

  return useMemo(() => {
    const ordersToday = salesOrders.filter((s) => s.orderDate === businessDate).length
    const ordersRequiringAction = salesOrders.filter((s) =>
      ['Draft', 'Confirmed', 'Partially Reserved', 'Picking', 'Partially Picked', 'Picked', 'Packed', 'Dispatch Ready'].includes(s.status)
      || s.items.some((i) => i.backorderedQty > 0),
    ).length

    const available = inventory.reduce((s, i) => s + i.available, 0)
    const reserved = inventory.reduce((s, i) => s + i.reserved, 0)
    const qcHold = inventory.reduce((s, i) => s + i.qcHold + (i.returnQcHold || 0), 0)
    const damaged = inventory.reduce((s, i) => s + i.damaged, 0)
    const expired = inventory.reduce((s, i) => s + i.expired, 0)
    const locked = inventory.reduce((s, i) => s + (i.locked || 0), 0)
    const putawayPending = inventory.reduce((s, i) => s + (i.putawayPending || 0), 0)
    const dispatchReadyInv = inventory.reduce((s, i) => s + (i.dispatchReady || 0), 0)

    // Bucket totals for health chart — no double-count of same units across buckets
    const invBuckets = { available, reserved, qcHold, damaged, expired }
    const invTotal = available + reserved + qcHold + damaged + expired
    const blocked = qcHold + locked + putawayPending
    const atRisk = damaged + expired

    const openPos = purchaseOrders.filter((p) => !['Closed', 'Cancelled', 'Received'].includes(p.status))
    const pickingQueue = picklists.filter((p) => p.status === 'Open' || p.status === 'In Progress').length
      || tasks.filter((t) => t.type === 'Picking' && OPEN_TASK.has(t.status)).length
    const dispatchReadySos = salesOrders.filter((s) => s.status === 'Packed' || s.status === 'Dispatch Ready').length
      + dispatches.filter((d) => d.status === 'Ready' || d.status === 'Queued' || d.status === 'Verifying').length

    const pipelineDefs: Array<{ id: PipelineStageId; label: string; hint: string; to: string }> = [
      { id: 'Draft', label: 'Draft', hint: 'Orders not yet confirmed', to: '/sales-orders' },
      { id: 'Confirmed', label: 'Confirmed', hint: 'Awaiting reservation', to: '/sales-orders' },
      { id: 'Reserved', label: 'Reserved', hint: 'Stock allocated', to: '/sales-orders' },
      { id: 'Picking', label: 'Picking', hint: 'Pick in progress or picked', to: '/picking' },
      { id: 'Packed', label: 'Packed', hint: 'Packages complete', to: '/sales-orders' },
      { id: 'Dispatch Ready', label: 'Dispatch Ready', hint: 'Ready for handover', to: '/dispatch' },
      { id: 'Dispatched', label: 'Dispatched', hint: 'Handed over / outbound', to: '/dispatch' },
      { id: 'Delivered', label: 'Delivered', hint: 'Customer delivery complete', to: '/sales-orders' },
    ]
    const pipelineCounts = Object.fromEntries(pipelineDefs.map((p) => [p.id, 0])) as Record<PipelineStageId, number>
    for (const so of salesOrders) {
      const stage = mapSoToPipeline(so.status)
      if (stage) pipelineCounts[stage] += 1
    }
    const pipeline: PipelineStage[] = pipelineDefs.map((p) => ({
      ...p,
      count: pipelineCounts[p.id],
    }))

    const lowStock = inventory
      .filter((i) => i.status === 'Low Stock' || (i.available > 0 && i.available < 30 && i.status === 'Available'))
      .slice(0, 6)
      .map((i) => ({
        id: i.id,
        severity: 'warning' as const,
        reason: 'LOW STOCK',
        sku: i.sku,
        product: i.product,
        warehouse: i.warehouse,
        detail: `${i.available} units remaining`,
        to: `/inventory/${i.id}`,
      }))

    const nearExpiry = batches
      .filter((b) => b.status === 'Near Expiry' || (b.expiry && remainingShelfLife(b.expiry, businessDate) <= 14 && remainingShelfLife(b.expiry, businessDate) >= 0))
      .slice(0, 6)
      .map((b) => {
        const days = remainingShelfLife(b.expiry, businessDate)
        return {
          id: b.id,
          severity: days <= 3 ? 'critical' as const : 'warning' as const,
          reason: 'NEAR EXPIRY',
          sku: b.sku,
          product: b.product,
          warehouse: b.warehouse,
          detail: `Batch ${b.batchNo} · ${days} day${days === 1 ? '' : 's'} left`,
          to: '/near-expiry',
        }
      })

    const expiredRows = inventory
      .filter((i) => i.expired > 0 || i.status === 'Expired')
      .slice(0, 4)
      .map((i) => ({
        id: `exp-${i.id}`,
        severity: 'critical' as const,
        reason: 'EXPIRED',
        sku: i.sku,
        product: i.product,
        warehouse: i.warehouse,
        detail: `${i.expired || i.available} units`,
        to: '/expired',
      }))

    const inventoryAttention = [...expiredRows, ...nearExpiry, ...lowStock].slice(0, 8)

    const openTasksOf = (type: Task['type']) =>
      tasks.filter((t) => t.type === type && OPEN_TASK.has(t.status)).length

    const warehouseWorkload = [
      {
        id: 'receiving',
        label: 'Receiving',
        count: openTasksOf('Receiving') || receiving.filter((r) => r.status === 'Pending' || r.status === 'In Progress' || r.status === 'Partial').length,
        to: '/receiving',
      },
      {
        id: 'qc',
        label: 'QC',
        count: openTasksOf('QC') || qcInspections.filter((q) => q.status === 'Pending' || q.status === 'Failed').length,
        to: '/qc',
      },
      {
        id: 'putaway',
        label: 'Put-away',
        count: openTasksOf('Put-Away') || putAwayTasks.filter((p) => p.status !== 'Completed').length,
        to: '/put-away',
      },
      {
        id: 'picking',
        label: 'Picking',
        count: openTasksOf('Picking') || picklists.filter((p) => p.status === 'Open' || p.status === 'In Progress').length,
        to: '/picking',
      },
      {
        id: 'packing',
        label: 'Packing',
        count: openTasksOf('Packing') || salesOrders.filter((s) => s.status === 'Picked').length,
        to: '/sales-orders',
      },
      {
        id: 'dispatch',
        label: 'Dispatch',
        count: openTasksOf('Dispatch')
          || dispatches.filter((d) => ['Queued', 'Verifying', 'Ready'].includes(d.status)).length
          || salesOrders.filter((s) => s.status === 'Packed' || s.status === 'Dispatch Ready').length,
        to: '/dispatch',
      },
    ]

    const awaitingReceiving = purchaseOrders.filter((p) =>
      ['Published', 'Partially Received'].includes(p.status),
    ).length
    const qcPending = qcInspections.filter((q) => q.status === 'Pending').length
    const putawayPendingCount = putAwayTasks.filter((p) => p.status !== 'Completed').length

    const inboundPos = openPos
      .slice()
      .sort((a, b) => (a.expectedDelivery || a.orderDate).localeCompare(b.expectedDelivery || b.orderDate))
      .slice(0, 5)

    const outboundFocus = salesOrders
      .filter((s) =>
        !['Draft', 'Cancelled'].includes(s.status),
      )
      .slice()
      .sort((a, b) => {
        const rank = (status: string) => {
          if (['Picking', 'Partially Picked', 'Picked', 'Packed', 'Dispatch Ready'].includes(status)) return 0
          if (['Dispatched', 'Partially Dispatched'].includes(status)) return 1
          if (status === 'Reserved' || status === 'Partially Reserved') return 2
          return 3
        }
        const r = rank(a.status) - rank(b.status)
        if (r !== 0) return r
        return a.deliveryDate.localeCompare(b.deliveryDate)
      })
      .slice(0, 6)

    const outboundCounts = {
      picking: salesOrders.filter((s) => ['Picking', 'Partially Picked', 'Picked'].includes(s.status)).length,
      packing: salesOrders.filter((s) => s.status === 'Picked').length,
      dispatchReady: salesOrders.filter((s) => s.status === 'Packed' || s.status === 'Dispatch Ready').length,
      inTransit: dispatches.filter((d) => d.status === 'In Transit' || d.status === 'Handed Over').length,
      delivered: salesOrders.filter((s) => s.status === 'Delivered').length,
    }

    const delayedTasks = tasks.filter(
      (t) => OPEN_TASK.has(t.status) && (t.status === 'On Hold' || t.due < businessDate),
    ).length
    const qcFailed = qcInspections.filter((q) => q.status === 'Failed' || q.status === 'RTV').length
    const backorderedOrders = salesOrders.filter((s) => s.items.some((i) => i.backorderedQty > 0)).length

    const exceptions = [
      {
        id: 'expired',
        severity: 'critical' as const,
        type: 'Expired inventory',
        message: `${expiredRows.length || inventory.filter((i) => i.expired > 0).length} lines with expired stock`,
        count: inventory.filter((i) => i.expired > 0 || i.status === 'Expired').length,
        action: 'Review',
        to: '/expired',
      },
      {
        id: 'qc-fail',
        severity: 'critical' as const,
        type: 'QC failure',
        message: `${qcFailed} inspections failed or need RTV`,
        count: qcFailed,
        action: 'Review QC',
        to: '/qc',
      },
      {
        id: 'delayed',
        severity: 'warning' as const,
        type: 'Delayed tasks',
        message: `${delayedTasks} tasks past due or on hold`,
        count: delayedTasks,
        action: 'Open tasks',
        to: '/tasks',
      },
      {
        id: 'near-exp',
        severity: 'warning' as const,
        type: 'Near expiry',
        message: `${nearExpiry.length} batches within shelf-life window`,
        count: nearExpiry.length,
        action: 'View batches',
        to: '/near-expiry',
      },
      {
        id: 'low-stock',
        severity: 'warning' as const,
        type: 'Low stock',
        message: `${lowStock.length} SKUs below comfortable cover`,
        count: inventory.filter((i) => i.status === 'Low Stock').length,
        action: 'Inventory',
        to: '/inventory',
      },
      {
        id: 'backorder',
        severity: 'info' as const,
        type: 'Insufficient stock',
        message: `${backorderedOrders} orders with backordered lines`,
        count: backorderedOrders,
        action: 'Sales orders',
        to: '/sales-orders',
      },
      {
        id: 'qc-pending',
        severity: 'info' as const,
        type: 'QC pending',
        message: `${qcPending} inspections awaiting result`,
        count: qcPending,
        action: 'Open QC',
        to: '/qc',
      },
    ].filter((e) => e.count > 0)

    const recentOrders = salesOrders
      .slice()
      .sort((a, b) => {
        const da = (a.createdAt || a.orderDate).localeCompare(b.createdAt || b.orderDate)
        return -da
      })
      .slice(0, 7)

    // Orders by day for last 7 business days ending BUSINESS_DATE
    const trendDays: { date: string; label: string; orders: number; fulfilled: number }[] = []
    for (let i = 6; i >= 0; i--) {
      const d = new Date(`${businessDate}T00:00:00`)
      d.setDate(d.getDate() - i)
      const iso = d.toISOString().slice(0, 10)
      const label = `${d.getDate()} ${d.toLocaleString('en-IN', { month: 'short' })}`
      const dayOrders = salesOrders.filter((s) => s.orderDate === iso).length
      const fulfilled = salesOrders.filter(
        (s) => (s.status === 'Dispatched' || s.status === 'Delivered') && s.orderDate === iso,
      ).length
      trendDays.push({ date: iso, label, orders: dayOrders, fulfilled })
    }
    const hasTrendSignal = trendDays.some((d) => d.orders > 0 || d.fulfilled > 0)

    const byWarehouse = warehouses.map((w) => {
      const rows = inventory.filter((i) => i.warehouseId === w.id || i.warehouse === w.name)
      const avail = rows.reduce((s, i) => s + i.available + i.reserved, 0)
      return {
        id: w.id,
        name: w.name,
        units: avail,
        skus: rows.length,
      }
    }).sort((a, b) => b.units - a.units)
    const maxWh = Math.max(...byWarehouse.map((w) => w.units), 1)

    const pct = (n: number) => (invTotal ? Math.round((n / invTotal) * 100) : 0)

    return {
      businessDate,
      kpis: {
        ordersToday: {
          value: ordersToday,
          hint: `${salesOrders.filter((s) => daysAgo(s.orderDate, businessDate) <= 2).length} in last 3 days`,
          to: '/sales-orders',
        },
        ordersAction: {
          value: ordersRequiringAction,
          hint: `${pipelineCounts.Draft} draft · ${pipelineCounts.Picking} picking`,
          to: '/sales-orders',
        },
        available: {
          value: available,
          hint: `${pct(available)}% of tracked stock`,
          to: '/inventory',
        },
        openPos: {
          value: openPos.length,
          hint: `${awaitingReceiving} awaiting receiving`,
          to: '/purchase-orders',
        },
        pickingQueue: {
          value: pickingQueue,
          hint: `${picklists.filter((p) => p.status === 'Open').length} picklists open`,
          to: '/picking',
        },
        dispatchReady: {
          value: dispatchReadySos || dispatchReadyInv,
          hint: dispatchReadyInv > 0 ? `${dispatchReadyInv} units dispatch-ready` : `${pipelineCounts.Packed} packed orders`,
          to: '/dispatch',
        },
      },
      pipeline,
      inventoryHealth: {
        buckets: invBuckets,
        total: invTotal,
        availablePct: pct(available),
        reservedPct: pct(reserved),
        blockedPct: pct(blocked),
        atRiskPct: pct(atRisk),
      },
      inventoryAttention,
      warehouseWorkload,
      inbound: {
        openPos: openPos.length,
        awaitingReceiving,
        qcPending,
        putawayPending: putawayPendingCount,
        rows: inboundPos,
      },
      outbound: {
        counts: outboundCounts,
        rows: outboundFocus,
      },
      exceptions,
      recentOrders,
      trendDays,
      hasTrendSignal,
      byWarehouse,
      maxWh,
    }
  }, [
    salesOrders, purchaseOrders, inventory, batches, tasks,
    picklists, dispatches, qcInspections, putAwayTasks, receiving, warehouses,
    businessDate,
  ])
}
