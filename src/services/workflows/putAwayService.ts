import type { AppState } from '../appState'
import { postInventoryMovement } from '../inventory/movementService'

export interface ConfirmPutAwayInput {
  taskId: string
  binId: string
  performedBy: string
}

export function confirmPutAway(state: AppState, input: ConfirmPutAwayInput): AppState {
  const task = state.putAwayTasks.find((t) => t.id === input.taskId)
  if (!task) throw new Error('Put-away task not found')
  if (task.status === 'Completed') throw new Error('Task already completed')

  const bin = state.bins.find((b) => b.id === input.binId)
  if (!bin) throw new Error('Bin not found')
  if (bin.status === 'Blocked') throw new Error('Bin is blocked')

  const shelf = state.shelves.find((s) => s.id === bin.shelfId)
  const rack = state.racks.find((r) => r.id === bin.rackId)
  const zone = state.zones.find((z) => z.id === bin.zoneId)

  const source = state.inventory.find(
    (i) => i.batchId === task.batchId && i.warehouseId === task.warehouseId && i.putawayPending >= task.quantity,
  )
  if (!source) throw new Error('Putaway pending inventory not found')

  const sourceLoc = `${source.zone}-${source.rack}-${source.shelf}-${source.bin}`
  const destLoc = `${zone?.code || ''}-${rack?.code || ''}-${shelf?.code || ''}-${bin.code}`

  const { inventory, movements } = postInventoryMovement(state.inventory, state.movements, {
    movementType: 'PUTAWAY',
    balanceId: source.id,
    sku: task.sku,
    product: task.product,
    productId: task.productId,
    batchId: task.batchId,
    batch: task.batch,
    warehouseId: task.warehouseId,
    quantity: task.quantity,
    fromStatus: 'PUTAWAY_PENDING',
    toStatus: 'AVAILABLE',
    fromLocation: sourceLoc,
    toLocation: destLoc,
    referenceType: 'PUTAWAY',
    referenceId: task.id,
    performedBy: input.performedBy,
    relocateFields: {
      zoneId: bin.zoneId,
      zone: zone?.name || zone?.code || '',
      rackId: bin.rackId,
      rack: rack?.code || '',
      shelfId: bin.shelfId,
      shelf: shelf?.code || '',
      binId: bin.id,
      bin: bin.code,
      warehouseId: bin.warehouseId,
      warehouse: task.warehouse,
      batchId: task.batchId,
      batch: task.batch,
      sku: task.sku,
      product: task.product,
      productId: task.productId,
      expiry: source.expiry,
      mfgDate: source.mfgDate,
    },
  })

  const putAwayTasks = state.putAwayTasks.map((t) =>
    t.id === task.id
      ? {
          ...t,
          status: 'Completed' as const,
          destinationBinId: bin.id,
          destinationBin: bin.code,
          assignedTo: input.performedBy,
        }
      : t,
  )

  const tasks = state.tasks.map((t) =>
    t.referenceId === task.id && t.type === 'Put-Away'
      ? { ...t, status: 'Completed' as const, completedAt: new Date().toISOString(), assignedTo: input.performedBy }
      : t,
  )

  return { ...state, inventory, movements, putAwayTasks, tasks }
}
