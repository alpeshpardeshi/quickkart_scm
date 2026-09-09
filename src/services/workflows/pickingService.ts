import type { AppState } from '../appState'
import { BUSINESS_DATE } from '../appState'
import { postInventoryMovement } from '../inventory/movementService'

export interface ConfirmPickLineInput {
  picklistId: string
  lineId: string
  pickedQty: number
  scannedSku: string
  scannedBatch: string
  scannedBin: string
  performedBy: string
}

export function confirmPickLine(state: AppState, input: ConfirmPickLineInput): AppState {
  const picklist = state.picklists.find((p) => p.id === input.picklistId)
  if (!picklist) throw new Error('Picklist not found')
  const line = picklist.lines.find((l) => l.id === input.lineId)
  if (!line) throw new Error('Pick line not found')

  if (input.scannedSku !== line.sku) throw new Error('Wrong SKU scanned')
  if (input.scannedBatch !== line.batchNo) throw new Error('Wrong batch scanned')
  if (input.scannedBin !== line.bin && input.scannedBin !== line.binId) throw new Error('Wrong bin scanned')
  if (input.pickedQty <= 0) throw new Error('Pick qty must be > 0')
  if (input.pickedQty > line.requiredQty - line.pickedQty) throw new Error('Cannot pick more than remaining')

  const balance = state.inventory.find(
    (i) => i.batchId === line.batchId && i.binId === line.binId && i.reserved >= input.pickedQty,
  )
  if (!balance) throw new Error('Reserved inventory not found for pick')
  if (balance.expiry < BUSINESS_DATE) throw new Error('Cannot pick expired inventory')

  const loc = `${balance.zone}-${balance.rack}-${balance.shelf}-${balance.bin}`
  const { inventory, movements } = postInventoryMovement(state.inventory, state.movements, {
    movementType: 'PICK',
    balanceId: balance.id,
    sku: line.sku,
    product: line.product,
    productId: state.products.find((p) => p.sku === line.sku)?.id || '',
    batchId: line.batchId,
    batch: line.batchNo,
    warehouseId: line.warehouseId,
    quantity: input.pickedQty,
    fromStatus: 'RESERVED',
    toStatus: 'DISPATCH_READY',
    fromLocation: loc,
    toLocation: loc,
    referenceType: 'PICKLIST',
    referenceId: picklist.id,
    performedBy: input.performedBy,
  })

  const newPicked = line.pickedQty + input.pickedQty
  const lineDone = newPicked >= line.requiredQty
  const picklists = state.picklists.map((p) => {
    if (p.id !== picklist.id) return p
    const lines = p.lines.map((l) =>
      l.id === line.id
        ? { ...l, pickedQty: newPicked, status: lineDone ? 'Picked' as const : 'In Progress' as const }
        : l,
    )
    const pickedLines = lines.filter((l) => l.status === 'Picked').length
    const allDone = lines.every((l) => l.status === 'Picked')
    return {
      ...p,
      lines,
      picked: pickedLines,
      status: allDone ? 'Completed' as const : 'In Progress' as const,
      assignedTo: input.performedBy,
    }
  })

  const reservationAllocations = state.reservationAllocations.map((a) => {
    if (a.id !== line.reservationAllocationId) return a
    const consumedQty = a.consumedQty + input.pickedQty
    return {
      ...a,
      consumedQty,
      status: consumedQty >= a.allocatedQty ? 'CONSUMED' as const : 'PARTIALLY_CONSUMED' as const,
    }
  })

  const salesOrders = state.salesOrders.map((so) => {
    if (so.id !== picklist.soId) return so
    const items = so.items.map((item) => {
      if (item.id !== line.soLineId) return item
      const pickedQty = item.pickedQty + input.pickedQty
      return {
        ...item,
        pickedQty,
        batch: line.batchNo,
        status: pickedQty >= item.reservedQty ? 'Picked' as const : item.status,
      }
    })
    const allPicked = items.every((i) => i.pickedQty >= i.reservedQty && i.reservedQty > 0)
    const anyPicked = items.some((i) => i.pickedQty > 0)
    return {
      ...so,
      items,
      status: (allPicked ? 'Picked' : anyPicked ? 'Partially Picked' : 'Picking') as typeof so.status,
    }
  })

  return { ...state, inventory, movements, picklists, reservationAllocations, salesOrders }
}
