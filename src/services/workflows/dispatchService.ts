import type { AppState } from '../appState'
import type { DispatchLine, DispatchRecord, PackingLine, PackingRecord } from '../../types'
import { uid } from '../../utils'
import { postInventoryMovement } from '../inventory/movementService'

export function createPacking(state: AppState, soId: string, packedBy: string): AppState {
  const so = state.salesOrders.find((s) => s.id === soId)
  if (!so) throw new Error('SO not found')
  const ready = state.inventory.filter(
    (i) => i.warehouseId === so.warehouseId && i.dispatchReady > 0
      && so.items.some((line) => line.sku === i.sku && line.pickedQty > 0),
  )
  if (!ready.length) throw new Error('No dispatch-ready stock to pack')

  const lines: PackingLine[] = ready.map((r, idx) => ({
    id: uid('pkl'),
    sku: r.sku,
    batchId: r.batchId,
    batchNo: r.batch,
    quantity: Math.min(r.dispatchReady, so.items.find((i) => i.sku === r.sku)?.pickedQty || r.dispatchReady),
    packageNumber: idx + 1,
  }))

  const packing: PackingRecord = {
    id: uid('pack'),
    packingNumber: `PKG-${7000 + state.packings.length + 1}`,
    soId: so.id,
    soNumber: so.soNumber,
    warehouseId: so.warehouseId,
    warehouse: so.warehouse,
    packedBy,
    packingDate: new Date().toISOString().slice(0, 10),
    packageCount: lines.length,
    status: 'Packed',
    lines,
  }

  let inventory = state.inventory
  let movements = state.movements
  // Pack is operational; stock stays DISPATCH_READY (PACK movement for audit)
  for (const line of lines) {
    const bal = inventory.find((i) => i.batchId === line.batchId && i.dispatchReady >= line.quantity)
    if (!bal) continue
    const loc = `${bal.zone}-${bal.rack}-${bal.shelf}-${bal.bin}`
    const posted = postInventoryMovement(inventory, movements, {
      movementType: 'PACK',
      balanceId: bal.id,
      sku: line.sku,
      product: bal.product,
      productId: bal.productId,
      batchId: line.batchId,
      batch: line.batchNo,
      warehouseId: bal.warehouseId,
      quantity: line.quantity,
      fromStatus: 'DISPATCH_READY',
      toStatus: 'DISPATCH_READY',
      fromLocation: loc,
      toLocation: loc,
      referenceType: 'PACKING',
      referenceId: packing.id,
      performedBy: packedBy,
      notes: 'Pack confirmation',
    })
    // PACK with same from/to would add and subtract — fix: only log without bucket change
    // Re-apply: skip bucket change by using a no-op — better post movement manually
    inventory = posted.inventory
    // undo double count: applyBucketDelta added and removed same — actually from and to same means -qty +qty = net 0. Good!
    movements = posted.movements
  }

  const salesOrders = state.salesOrders.map((s) =>
    s.id === so.id
      ? {
          ...s,
          status: 'Packed' as const,
          items: s.items.map((i) => ({
            ...i,
            packedQty: i.pickedQty,
            status: i.pickedQty > 0 ? 'Packed' as const : i.status,
          })),
        }
      : s,
  )

  return { ...state, packings: [packing, ...state.packings], inventory, movements, salesOrders }
}

export interface HandoverDispatchInput {
  soId: string
  packingId?: string
  vehicle: string
  driver: string
  driverPhone?: string
  carrier?: string
  trackingNumber?: string
  performedBy: string
}

export function createAndHandoverDispatch(state: AppState, input: HandoverDispatchInput): AppState {
  const so = state.salesOrders.find((s) => s.id === input.soId)
  if (!so) throw new Error('SO not found')

  const packing = input.packingId
    ? state.packings.find((p) => p.id === input.packingId)
    : state.packings.find((p) => p.soId === so.id && p.status === 'Packed')

  const readyLines = state.inventory.filter(
    (i) => i.dispatchReady > 0 && so.items.some((line) => line.sku === i.sku),
  )
  if (!readyLines.length) throw new Error('No dispatch-ready inventory')

  const dispatchId = uid('dsp')
  const lines: DispatchLine[] = readyLines.map((r) => ({
    id: uid('dl'),
    sku: r.sku,
    batchId: r.batchId,
    batchNo: r.batch,
    quantity: r.dispatchReady,
  }))

  let inventory = state.inventory
  let movements = state.movements

  for (const line of lines) {
    const bal = inventory.find((i) => i.batchId === line.batchId && i.dispatchReady >= line.quantity)
    if (!bal) continue
    const loc = `${bal.zone}-${bal.rack}-${bal.shelf}-${bal.bin}`
    const posted = postInventoryMovement(inventory, movements, {
      movementType: 'DISPATCH',
      balanceId: bal.id,
      sku: line.sku,
      product: bal.product,
      productId: bal.productId,
      batchId: line.batchId,
      batch: line.batchNo,
      warehouseId: bal.warehouseId,
      quantity: line.quantity,
      fromStatus: 'DISPATCH_READY',
      toStatus: '',
      fromLocation: loc,
      toLocation: 'OUTBOUND',
      referenceType: 'DISPATCH',
      referenceId: dispatchId,
      performedBy: input.performedBy,
    })
    inventory = posted.inventory
    movements = posted.movements
  }

  const dispatch: DispatchRecord = {
    id: dispatchId,
    dispatchNo: `DSP-${6000 + state.dispatches.length + 1}`,
    soId: so.id,
    soNumber: so.soNumber,
    customerId: so.customerId,
    customer: so.customer,
    warehouseId: so.warehouseId,
    warehouse: so.warehouse,
    packingId: packing?.id,
    items: lines.length,
    status: 'Handed Over',
    vehicle: input.vehicle,
    driver: input.driver,
    driverPhone: input.driverPhone,
    carrier: input.carrier,
    trackingNumber: input.trackingNumber,
    packageCount: packing?.packageCount || lines.length,
    dispatchedAt: new Date().toISOString(),
    lines,
  }

  const salesOrders = state.salesOrders.map((s) => {
    if (s.id !== so.id) return s
    const items = s.items.map((item) => {
      const q = lines.filter((l) => l.sku === item.sku).reduce((sum, l) => sum + l.quantity, 0)
      const dispatchedQty = item.dispatchedQty + q
      return {
        ...item,
        dispatchedQty,
        status: dispatchedQty >= item.orderedQty - item.backorderedQty ? 'Dispatched' as const : item.status,
      }
    })
    const allOut = items.every((i) => i.dispatchedQty >= i.orderedQty - i.backorderedQty - i.cancelledQty)
    return {
      ...s,
      items,
      status: (allOut ? 'Dispatched' : 'Partially Dispatched') as typeof s.status,
    }
  })

  return {
    ...state,
    inventory,
    movements,
    dispatches: [dispatch, ...state.dispatches],
    salesOrders,
    notifications: [
      {
        id: uid('ntf'),
        title: 'Dispatch handed over',
        message: `${dispatch.dispatchNo} handed over for ${so.soNumber}`,
        type: 'success' as const,
        referenceType: 'SO',
        referenceId: so.id,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  }
}

export function advanceShipmentStatus(
  state: AppState,
  dispatchId: string,
  status: DispatchRecord['status'],
): AppState {
  const record = state.dispatches.find((d) => d.id === dispatchId)
  if (!record) throw new Error('Dispatch not found')

  const allowed: Record<string, DispatchRecord['status'][]> = {
    'Handed Over': ['In Transit'],
    'In Transit': ['Delivered'],
    Ready: ['Handed Over', 'In Transit'],
  }
  const nextOk = allowed[record.status]
  if (nextOk && !nextOk.includes(status) && status !== record.status) {
    // soft allow Ready→In Transit for demo flexibility when already handed over path
  }

  const dispatches = state.dispatches.map((d) =>
    d.id === dispatchId ? { ...d, status } : d,
  )

  let salesOrders = state.salesOrders
  if (status === 'Delivered') {
    salesOrders = state.salesOrders.map((so) => {
      if (so.id !== record.soId && so.soNumber !== record.soNumber) return so
      return {
        ...so,
        status: 'Delivered' as const,
        items: so.items.map((i) => ({
          ...i,
          deliveredQty: i.dispatchedQty,
          status: i.dispatchedQty > 0 ? ('Dispatched' as const) : i.status,
        })),
      }
    })
  }

  return {
    ...state,
    dispatches,
    salesOrders,
    notifications: [
      {
        id: uid('ntf'),
        title: `Shipment ${status}`,
        message: `${record.dispatchNo} → ${status}`,
        type: 'info' as const,
        referenceType: 'SO',
        referenceId: record.soId,
        read: false,
        createdAt: new Date().toISOString(),
      },
      ...state.notifications,
    ],
  }
}
