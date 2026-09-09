import type { AppState } from '../appState'
import type { PutAwayTask, Task } from '../../types'
import { uid } from '../../utils'
import { postInventoryMovement } from '../inventory/movementService'

export interface PerformQcInput {
  qcId: string
  acceptedQty: number
  rejectedQty: number
  inspector: string
  reason?: string
  rejectionDisposition?: 'RTV' | 'DAMAGED' | 'WASTAGE' | 'QUARANTINE'
  packagingCondition?: string
  visualInspection?: string
  remarks?: string
}

export function performQc(state: AppState, input: PerformQcInput): AppState {
  const qc = state.qcInspections.find((q) => q.id === input.qcId)
  if (!qc) throw new Error('QC not found')
  if (input.acceptedQty + input.rejectedQty !== qc.receivedQty) {
    throw new Error('Accepted + Rejected must equal received quantity')
  }

  const balance = state.inventory.find(
    (i) => i.batchId === qc.batchId && i.warehouseId === qc.warehouseId && i.qcHold > 0,
  )
  if (!balance) throw new Error('QC Hold inventory not found for batch')

  let inventory = state.inventory
  let movements = state.movements
  const location = `${balance.zone}-${balance.rack}-${balance.shelf}-${balance.bin}`

  if (input.acceptedQty > 0) {
    const res = postInventoryMovement(inventory, movements, {
      movementType: 'QC_ACCEPT',
      balanceId: balance.id,
      sku: qc.sku,
      product: qc.product,
      productId: qc.productId,
      batchId: qc.batchId,
      batch: qc.batch,
      warehouseId: qc.warehouseId,
      quantity: input.acceptedQty,
      fromStatus: qc.sourceType === 'RETURN' ? 'RETURN_QC_HOLD' : 'QC_HOLD',
      toStatus: 'PUTAWAY_PENDING',
      fromLocation: location,
      toLocation: location,
      referenceType: 'QC',
      referenceId: qc.id,
      performedBy: input.inspector,
    })
    inventory = res.inventory
    movements = res.movements
  }

  if (input.rejectedQty > 0) {
    const disposition = input.rejectionDisposition || 'DAMAGED'
    const toStatus =
      disposition === 'WASTAGE' ? 'WASTAGE'
        : disposition === 'QUARANTINE' ? 'QUARANTINE'
          : disposition === 'RTV' ? 'QC_REJECTED'
            : 'DAMAGED'
    const res = postInventoryMovement(inventory, movements, {
      movementType: 'QC_REJECT',
      balanceId: balance.id,
      sku: qc.sku,
      product: qc.product,
      productId: qc.productId,
      batchId: qc.batchId,
      batch: qc.batch,
      warehouseId: qc.warehouseId,
      quantity: input.rejectedQty,
      fromStatus: qc.sourceType === 'RETURN' ? 'RETURN_QC_HOLD' : 'QC_HOLD',
      toStatus,
      fromLocation: location,
      toLocation: location,
      referenceType: 'QC',
      referenceId: qc.id,
      performedBy: input.inspector,
      reason: input.reason || disposition,
    })
    inventory = res.inventory
    movements = res.movements
  }

  const qcResult =
    input.rejectedQty === 0 ? 'Passed'
      : input.acceptedQty === 0 ? 'Failed'
        : 'Partial'

  const qcInspections = state.qcInspections.map((q) =>
    q.id === qc.id
      ? {
          ...q,
          acceptedQty: input.acceptedQty,
          rejectedQty: input.rejectedQty,
          inspectedQty: qc.receivedQty,
          inspector: input.inspector,
          inspectedAt: new Date().toISOString(),
          reason: input.reason || '',
          packagingCondition: input.packagingCondition,
          visualInspection: input.visualInspection,
          remarks: input.remarks,
          rejectionDisposition: input.rejectionDisposition,
          qcResult: qcResult as 'Passed' | 'Failed' | 'Partial',
          status: (qcResult === 'Passed' ? 'Passed' : qcResult === 'Failed' ? (input.rejectionDisposition === 'RTV' ? 'RTV' : 'Failed') : 'Partial') as typeof q.status,
        }
      : q,
  )

  const batches = state.batches.map((b) =>
    b.id === qc.batchId ? { ...b, qcStatus: qcResult as 'Passed' | 'Failed' | 'Partial' } : b,
  )

  let putAwayTasks = state.putAwayTasks
  let tasks = state.tasks
  const now = new Date().toISOString()

  if (input.acceptedQty > 0) {
    const paId = uid('pa')
    const suggested = state.bins.find((b) => b.warehouseId === qc.warehouseId && b.status === 'Available')
    const putAway: PutAwayTask = {
      id: paId,
      taskNumber: `PA-${2000 + putAwayTasks.length + 1}`,
      sourceType: qc.sourceType === 'RETURN' ? 'RETURN' : 'GRN',
      sourceId: qc.sourceId,
      product: qc.product,
      productId: qc.productId,
      sku: qc.sku,
      batchId: qc.batchId,
      batch: qc.batch,
      quantity: input.acceptedQty,
      currentLocation: location,
      warehouseId: qc.warehouseId,
      warehouse: qc.warehouse,
      suggestedBinId: suggested?.id,
      suggestedLocation: suggested ? suggested.code : 'TBD',
      destinationBin: '',
      assignedTo: 'Unassigned',
      priority: 'High',
      status: 'Queued',
    }
    putAwayTasks = [putAway, ...putAwayTasks]
    const task: Task = {
      id: uid('task'),
      taskNumber: `TSK-${1000 + tasks.length + 1}`,
      title: `Put-away ${qc.sku} ${qc.batch}`,
      type: 'Put-Away',
      referenceType: 'PUTAWAY',
      referenceId: paId,
      warehouseId: qc.warehouseId,
      warehouse: qc.warehouse,
      location: putAway.suggestedLocation,
      priority: 'High',
      status: 'Pending',
      due: now.slice(0, 10),
      assignedTo: 'Unassigned',
      createdBy: input.inspector,
      createdAt: now,
      description: `Put away ${input.acceptedQty} units`,
    }
    tasks = [task, ...tasks]
  }

  const grns = state.grns.map((g) => {
    if (g.id !== qc.sourceId && qc.sourceType === 'GRN') return g
    if (qc.sourceType !== 'GRN') return g
    const lines = g.lines.map((l) =>
      l.batchId === qc.batchId
        ? { ...l, acceptedQty: input.acceptedQty, rejectedQty: input.rejectedQty, qcStatus: qcResult as 'Passed' | 'Failed' | 'Partial' }
        : l,
    )
    const totalAccepted = lines.reduce((s, l) => s + l.acceptedQty, 0)
    const totalRejected = lines.reduce((s, l) => s + l.rejectedQty, 0)
    const allDone = lines.every((l) => l.qcStatus !== 'Pending')
    return {
      ...g,
      lines,
      totalAccepted,
      totalRejected,
      qcStatus: allDone ? (totalRejected === 0 ? 'Passed' as const : totalAccepted === 0 ? 'Failed' as const : 'Partial' as const) : g.qcStatus,
      status: allDone ? 'QC Complete' as const : g.status,
    }
  })

  const purchaseOrders = state.purchaseOrders.map((po) => {
    if (qc.sourceType !== 'GRN') return po
    const grn = grns.find((g) => g.id === qc.sourceId)
    if (!grn || grn.poId !== po.id) return po
    const items = po.items.map((item) => {
      if (item.sku !== qc.sku) return item
      return {
        ...item,
        acceptedQty: item.acceptedQty + input.acceptedQty,
        rejectedQty: item.rejectedQty + input.rejectedQty,
      }
    })
    return { ...po, items }
  })

  const notifications = [
    {
      id: uid('ntf'),
      title: qcResult === 'Passed' ? 'QC passed' : 'QC completed',
      message: `${qc.qcNumber}: accepted ${input.acceptedQty}, rejected ${input.rejectedQty}`,
      type: (qcResult === 'Failed' ? 'danger' : 'success') as 'danger' | 'success',
      referenceType: 'QC',
      referenceId: qc.id,
      read: false,
      createdAt: now,
    },
    ...state.notifications,
  ]

  return {
    ...state,
    inventory,
    movements,
    qcInspections,
    batches,
    putAwayTasks,
    tasks,
    grns,
    purchaseOrders,
    notifications,
  }
}
