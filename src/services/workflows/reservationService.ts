import type { AppState } from '../appState'
import type { Picklist, PicklistLine, Reservation, ReservationAllocation, SalesOrder, Task } from '../../types'
import { uid } from '../../utils'
import { calculateATP } from '../inventory/atpService'
import { allocateMultiWarehouse } from '../inventory/allocationService'
import { postInventoryMovement } from '../inventory/movementService'

/** Confirm Draft/Confirmed SO: ATP → reserve → allocate (FIFO/FEFO). Does not generate picklist. */
export function confirmSalesOrder(state: AppState, soId: string, performedBy: string): AppState {
  const so = state.salesOrders.find((s) => s.id === soId)
  if (!so) throw new Error('SO not found')
  if (so.status !== 'Draft' && so.status !== 'Confirmed') {
    throw new Error('SO cannot be reserved in current status')
  }
  if (so.items.some((i) => i.reservedQty > 0)) {
    throw new Error('Stock already reserved for this order')
  }
  if (!so.customerId) throw new Error('Customer is required')
  if (!so.items.length) throw new Error('Add at least one order line')
  if (so.items.some((i) => i.orderedQty <= 0)) throw new Error('Ordered quantity must be greater than zero')

  let inventory = state.inventory
  let movements = state.movements
  const reservations: Reservation[] = []
  const allocations: ReservationAllocation[] = []
  const customer = state.customers.find((c) => c.id === so.customerId)

  const items = so.items.map((line) => {
    const product = state.products.find((p) => p.id === line.productId || p.sku === line.sku)
    if (!product) throw new Error(`Product not found for ${line.sku}`)

    const atp = calculateATP(inventory, state.bins, {
      sku: line.sku,
      warehouseId: so.allowMultiWarehouse ? undefined : so.warehouseId,
      product,
      minRemainingShelfLifeDays: customer?.minRemainingShelfLifeDays,
    })

    const need = line.orderedQty - line.cancelledQty
    const reserveQty = Math.min(need, atp)
    const backorderedQty = Math.max(0, need - reserveQty)

    if (reserveQty > 0) {
      const { allocations: allocs } = allocateMultiWarehouse(
        inventory,
        state.bins,
        product,
        reserveQty,
        so.warehouseId,
        so.allowMultiWarehouse,
        customer?.minRemainingShelfLifeDays,
      )
      const reservationId = uid('rsv')
      reservations.push({
        id: reservationId,
        soId: so.id,
        soNumber: so.soNumber,
        soLineId: line.id,
        sku: line.sku,
        productId: product.id,
        warehouseId: so.warehouseId,
        quantity: reserveQty,
        strategy: allocs[0]?.strategy || product.allocationMethod,
        status: 'ACTIVE',
        createdAt: new Date().toISOString(),
      })

      for (const a of allocs) {
        const allocId = uid('ral')
        allocations.push({
          id: allocId,
          reservationId,
          soId: so.id,
          soLineId: line.id,
          sku: line.sku,
          warehouseId: a.warehouseId,
          binId: a.binId,
          batchId: a.batchId,
          batchNo: a.batchNo,
          expiry: a.expiry,
          allocatedQty: a.quantity,
          consumedQty: 0,
          strategy: a.strategy,
          status: 'ACTIVE',
        })
        const bal = inventory.find((b) => b.id === a.balanceId)!
        const loc = `${bal.zone}-${bal.rack}-${bal.shelf}-${bal.bin}`
        const posted = postInventoryMovement(inventory, movements, {
          movementType: 'RESERVATION',
          balanceId: a.balanceId,
          sku: line.sku,
          product: line.product,
          productId: product.id,
          batchId: a.batchId,
          batch: a.batchNo,
          warehouseId: a.warehouseId,
          quantity: a.quantity,
          fromStatus: 'AVAILABLE',
          toStatus: 'RESERVED',
          fromLocation: loc,
          toLocation: loc,
          referenceType: 'SO',
          referenceId: so.id,
          performedBy,
          notes: `Reserve for ${so.soNumber}`,
        })
        inventory = posted.inventory
        movements = posted.movements
      }
    }

    return {
      ...line,
      reservedQty: reserveQty,
      backorderedQty,
      status: (reserveQty <= 0
        ? 'Backordered'
        : backorderedQty > 0
          ? 'Partially Reserved'
          : 'Reserved') as typeof line.status,
    }
  })

  const fullyReserved = items.every((i) => i.backorderedQty === 0 && i.reservedQty >= i.orderedQty - i.cancelledQty)
  const anyReserved = items.some((i) => i.reservedQty > 0)
  const status = fullyReserved ? 'Reserved' : anyReserved ? 'Partially Reserved' : 'Confirmed'

  const salesOrders = state.salesOrders.map((s) =>
    s.id === so.id
      ? { ...s, items, status: status as SalesOrder['status'] }
      : s,
  )

  const notifications = [
    {
      id: uid('ntf'),
      title: fullyReserved ? 'Order reserved' : anyReserved ? 'Partial ATP' : 'Confirmed — no ATP',
      message: fullyReserved
        ? `${so.soNumber} fully reserved`
        : anyReserved
          ? `${so.soNumber} partially reserved — backorders created`
          : `${so.soNumber} confirmed but no stock available`,
      type: (fullyReserved ? 'success' : 'warning') as 'success' | 'warning',
      referenceType: 'SO',
      referenceId: so.id,
      read: false,
      createdAt: new Date().toISOString(),
    },
    ...state.notifications,
  ]

  return {
    ...state,
    inventory,
    movements,
    salesOrders,
    reservations: [...reservations, ...state.reservations],
    reservationAllocations: [...allocations, ...state.reservationAllocations],
    notifications,
  }
}

/** Build picklist(s) from active reservation allocations for an SO. */
export function generatePicklistForSo(state: AppState, soId: string, performedBy: string): AppState {
  const so = state.salesOrders.find((s) => s.id === soId)
  if (!so) throw new Error('SO not found')
  if (!['Reserved', 'Partially Reserved', 'Confirmed'].includes(so.status) && so.status !== 'Picking') {
    throw new Error('Generate picklist only after reservation')
  }

  const allocs = state.reservationAllocations.filter(
    (a) => a.soId === so.id && (a.status === 'ACTIVE' || a.status === 'PARTIALLY_CONSUMED'),
  )
  if (!allocs.length) throw new Error('No active allocations to pick')

  const existing = state.picklists.filter((p) => p.soId === so.id && p.status !== 'Cancelled')
  if (existing.some((p) => p.lines.length > 0 && p.status !== 'Completed')) {
    throw new Error('An open picklist already exists for this order')
  }

  let picklists = state.picklists
  let tasks = state.tasks
  const byWarehouse = new Map<string, ReservationAllocation[]>()
  for (const a of allocs) {
    const list = byWarehouse.get(a.warehouseId) || []
    list.push(a)
    byWarehouse.set(a.warehouseId, list)
  }

  for (const [warehouseId, warehouseAllocs] of byWarehouse) {
    const wh = state.warehouses.find((w) => w.id === warehouseId)
    const picklistId = uid('pl')
    const lines: PicklistLine[] = warehouseAllocs.map((a, idx) => {
      const bal = state.inventory.find((b) => b.batchId === a.batchId && b.binId === a.binId)
      return {
        id: uid('pll'),
        picklistId,
        soLineId: a.soLineId,
        reservationAllocationId: a.id,
        sku: a.sku,
        product: so.items.find((i) => i.id === a.soLineId)?.product || a.sku,
        batchId: a.batchId,
        batchNo: a.batchNo,
        expiry: a.expiry,
        warehouseId,
        warehouse: wh?.name || '',
        zone: bal?.zone || '',
        rack: bal?.rack || '',
        shelf: bal?.shelf || '',
        binId: a.binId,
        bin: bal?.bin || '',
        requiredQty: a.allocatedQty - a.consumedQty,
        pickedQty: 0,
        status: 'Open',
        sequence: idx + 1,
      }
    }).filter((l) => l.requiredQty > 0)

    if (!lines.length) continue

    const pl: Picklist = {
      id: picklistId,
      picklistNo: `PL-${9000 + picklists.length + 1}`,
      soId: so.id,
      soNumber: so.soNumber,
      warehouseId,
      warehouse: wh?.name || '',
      items: lines.length,
      picked: 0,
      status: 'Open',
      assignedTo: 'Unassigned',
      priority: so.priority,
      createdAt: new Date().toISOString(),
      lines,
    }
    picklists = [pl, ...picklists]
    const task: Task = {
      id: uid('task'),
      taskNumber: `TSK-${1000 + tasks.length + 1}`,
      title: `Pick ${pl.picklistNo}`,
      type: 'Picking',
      referenceType: 'PICKLIST',
      referenceId: picklistId,
      warehouseId,
      warehouse: wh?.name || '',
      location: wh?.name || '',
      priority: so.priority,
      status: 'Pending',
      due: so.deliveryDate,
      assignedTo: 'Unassigned',
      createdBy: performedBy,
      createdAt: new Date().toISOString(),
      description: `Pick ${lines.length} lines for ${so.soNumber}`,
    }
    tasks = [task, ...tasks]
  }

  const salesOrders = state.salesOrders.map((s) =>
    s.id === so.id && (s.status === 'Reserved' || s.status === 'Partially Reserved')
      ? { ...s, status: 'Picking' as const }
      : s,
  )

  return {
    ...state,
    picklists,
    tasks,
    salesOrders,
    notifications: [
      {
        id: uid('ntf'),
        title: 'Picklist generated',
        message: `Picklist created for ${so.soNumber}`,
        type: 'info' as const,
        referenceType: 'SO',
        referenceId: so.id,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  }
}

export function releaseReservation(state: AppState, reservationId: string, performedBy: string): AppState {
  const reservation = state.reservations.find((r) => r.id === reservationId)
  if (!reservation) throw new Error('Reservation not found')
  if (reservation.status === 'RELEASED' || reservation.status === 'CANCELLED') {
    throw new Error('Reservation already released')
  }

  const allocs = state.reservationAllocations.filter((a) => a.reservationId === reservationId)
  let inventory = state.inventory
  let movements = state.movements

  for (const a of allocs) {
    const remaining = a.allocatedQty - a.consumedQty
    if (remaining <= 0) continue
    const bal = inventory.find((b) => b.batchId === a.batchId && b.binId === a.binId && b.reserved >= remaining)
    if (!bal) continue
    const loc = `${bal.zone}-${bal.rack}-${bal.shelf}-${bal.bin}`
    const posted = postInventoryMovement(inventory, movements, {
      movementType: 'RESERVATION_RELEASE',
      balanceId: bal.id,
      sku: a.sku,
      product: bal.product,
      productId: bal.productId,
      batchId: a.batchId,
      batch: a.batchNo,
      warehouseId: a.warehouseId,
      quantity: remaining,
      fromStatus: 'RESERVED',
      toStatus: 'AVAILABLE',
      fromLocation: loc,
      toLocation: loc,
      referenceType: 'RESERVATION',
      referenceId: reservationId,
      performedBy,
    })
    inventory = posted.inventory
    movements = posted.movements
  }

  const reservations = state.reservations.map((r) =>
    r.id === reservationId ? { ...r, status: 'RELEASED' as const } : r,
  )
  const reservationAllocations = state.reservationAllocations.map((a) =>
    a.reservationId === reservationId ? { ...a, status: 'RELEASED' as const } : a,
  )

  const so = state.salesOrders.find((s) => s.id === reservation.soId)
  const salesOrders = state.salesOrders.map((s) => {
    if (s.id !== reservation.soId) return s
    const items = s.items.map((item) => {
      if (item.id !== reservation.soLineId) return item
      const released = reservation.quantity - (allocs.reduce((sum, a) => sum + a.consumedQty, 0))
      const reservedQty = Math.max(0, item.reservedQty - released)
      return {
        ...item,
        reservedQty,
        backorderedQty: item.orderedQty - reservedQty - item.cancelledQty,
        status: reservedQty > 0 ? item.status : 'Pending' as const,
      }
    })
    return { ...s, items, status: 'Confirmed' as const }
  })

  // Cancel open picklists for this SO if no remaining reservations
  const stillActive = reservations.some(
    (r) => r.soId === reservation.soId && r.id !== reservationId && r.status === 'ACTIVE',
  )
  const picklists = stillActive
    ? state.picklists
    : state.picklists.map((p) =>
        p.soId === reservation.soId && p.status !== 'Completed'
          ? { ...p, status: 'Cancelled' as const }
          : p,
      )

  return {
    ...state,
    inventory,
    movements,
    reservations,
    reservationAllocations,
    salesOrders,
    picklists,
    notifications: [
      {
        id: uid('ntf'),
        title: 'Reservation released',
        message: `Reservation released for ${so?.soNumber || reservation.soNumber}`,
        type: 'warning' as const,
        referenceType: 'SO',
        referenceId: reservation.soId,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  }
}
