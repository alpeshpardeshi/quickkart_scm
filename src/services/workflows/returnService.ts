import type { AppState } from '../appState'
import type { QcInspection, ReturnLine, ReturnRecord } from '../../types'
import { uid } from '../../utils'
import { emptyBuckets, postInventoryMovement } from '../inventory/movementService'

export interface CreateReturnInput {
  soId: string
  dispatchId?: string
  warehouseId: string
  reason: string
  performedBy: string
  lines: Array<{
    sku: string
    productId: string
    product: string
    originalBatchId?: string
    originalBatch: string
    originalExpiry?: string
    originallyDispatchedQty: number
    returnQty: number
    reason: string
  }>
  returnsLocation: {
    binId: string
    bin: string
    zoneId: string
    zone: string
    rackId: string
    rack: string
    shelfId: string
    shelf: string
  }
}

export function createReturn(state: AppState, input: CreateReturnInput): AppState {
  const so = state.salesOrders.find((s) => s.id === input.soId)
  if (!so) throw new Error('SO not found')
  const wh = state.warehouses.find((w) => w.id === input.warehouseId)
  if (!wh) throw new Error('Warehouse not found')

  const returnId = uid('rtn')
  const returnNo = `RTN-${2900 + state.returns.length + 1}`
  const now = new Date().toISOString()

  let inventory = state.inventory
  let movements = state.movements
  const qcInspections = [...state.qcInspections]
  const tasks = [...state.tasks]
  const lines: ReturnLine[] = []

  for (const line of input.lines) {
    if (line.returnQty <= 0) continue
    const batchId = line.originalBatchId || state.batches.find((b) => b.batchNo === line.originalBatch)?.id || uid('bat')
    const balanceId = uid('inv')
    const posted = postInventoryMovement(inventory, movements, {
      movementType: 'RETURN_RECEIPT',
      createBalance: {
        id: balanceId,
        sku: line.sku,
        product: line.product,
        productId: line.productId,
        warehouseId: wh.id,
        warehouse: wh.name,
        zoneId: input.returnsLocation.zoneId,
        zone: input.returnsLocation.zone,
        rackId: input.returnsLocation.rackId,
        rack: input.returnsLocation.rack,
        shelfId: input.returnsLocation.shelfId,
        shelf: input.returnsLocation.shelf,
        binId: input.returnsLocation.binId,
        bin: input.returnsLocation.bin,
        batchId,
        batch: line.originalBatch,
        ...emptyBuckets(),
        expiry: line.originalExpiry || '2026-12-31',
        mfgDate: '2026-01-01',
      },
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      batchId,
      batch: line.originalBatch,
      warehouseId: wh.id,
      quantity: line.returnQty,
      fromStatus: '',
      toStatus: 'RETURN_QC_HOLD',
      fromLocation: 'CUSTOMER',
      toLocation: `${input.returnsLocation.zone}-${input.returnsLocation.bin}`,
      referenceType: 'RETURN',
      referenceId: returnId,
      performedBy: input.performedBy,
      reason: line.reason,
    })
    inventory = posted.inventory
    movements = posted.movements

    const qcId = uid('qc')
    const qc: QcInspection = {
      id: qcId,
      qcNumber: `QC-R-${5600 + qcInspections.length}`,
      sourceType: 'RETURN',
      sourceId: returnId,
      reference: returnNo,
      product: line.product,
      productId: line.productId,
      sku: line.sku,
      batchId,
      batch: line.originalBatch,
      receivedQty: line.returnQty,
      inspectedQty: line.returnQty,
      acceptedQty: 0,
      rejectedQty: 0,
      reason: '',
      status: 'Pending',
      qcResult: 'Pending',
      warehouseId: wh.id,
      warehouse: wh.name,
      inspector: '',
      inspectedAt: '',
    }
    qcInspections.unshift(qc)
    tasks.unshift({
      id: uid('task'),
      taskNumber: `TSK-${1000 + tasks.length + 1}`,
      title: `Return QC ${line.sku}`,
      type: 'Return QC',
      referenceType: 'QC',
      referenceId: qcId,
      warehouseId: wh.id,
      warehouse: wh.name,
      location: input.returnsLocation.bin,
      priority: 'High',
      status: 'Pending',
      due: now.slice(0, 10),
      assignedTo: 'Unassigned',
      createdBy: input.performedBy,
      createdAt: now,
      description: `Inspect returned ${line.returnQty} of ${line.sku}`,
    })

    lines.push({
      id: uid('rtl'),
      sku: line.sku,
      productId: line.productId,
      product: line.product,
      originalBatchId: batchId,
      originalBatch: line.originalBatch,
      originalExpiry: line.originalExpiry,
      originallyDispatchedQty: line.originallyDispatchedQty,
      returnQty: line.returnQty,
      reason: line.reason,
      reusableQty: 0,
      damagedQty: 0,
      wastageQty: 0,
    })
  }

  const first = lines[0]
  const record: ReturnRecord = {
    id: returnId,
    returnNo,
    soId: so.id,
    soNumber: so.soNumber,
    dispatchId: input.dispatchId,
    customerId: so.customerId,
    customer: so.customer,
    warehouseId: wh.id,
    warehouse: wh.name,
    sku: first?.sku || '',
    product: first?.product || '',
    batch: first?.originalBatch || '',
    returnedQty: lines.reduce((s, l) => s + l.returnQty, 0),
    reusableQty: 0,
    damagedQty: 0,
    wastageQty: 0,
    qcResult: 'Pending',
    status: 'QC',
    reason: input.reason,
    createdAt: now,
    lines,
  }

  return {
    ...state,
    inventory,
    movements,
    qcInspections,
    tasks,
    returns: [record, ...state.returns],
  }
}

export interface ProcessReturnQcInput {
  returnId: string
  lineId: string
  reusableQty: number
  damagedQty: number
  wastageQty: number
  inspector: string
  notes?: string
}

export function processReturnQc(state: AppState, input: ProcessReturnQcInput): AppState {
  const ret = state.returns.find((r) => r.id === input.returnId)
  if (!ret) throw new Error('Return not found')
  const line = ret.lines.find((l) => l.id === input.lineId)
  if (!line) throw new Error('Return line not found')
  if (input.reusableQty + input.damagedQty + input.wastageQty !== line.returnQty) {
    throw new Error('Disposition quantities must equal return qty')
  }

  const balance = state.inventory.find(
    (i) => i.batchId === line.originalBatchId && i.returnQcHold >= line.returnQty,
  )
  if (!balance) throw new Error('Return QC hold inventory not found')

  let inventory = state.inventory
  let movements = state.movements
  const loc = `${balance.zone}-${balance.rack}-${balance.shelf}-${balance.bin}`

  if (input.reusableQty > 0) {
    const res = postInventoryMovement(inventory, movements, {
      movementType: 'RETURN_QC_ACCEPT',
      balanceId: balance.id,
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      batchId: balance.batchId,
      batch: balance.batch,
      warehouseId: balance.warehouseId,
      quantity: input.reusableQty,
      fromStatus: 'RETURN_QC_HOLD',
      toStatus: 'PUTAWAY_PENDING',
      fromLocation: loc,
      toLocation: loc,
      referenceType: 'RETURN',
      referenceId: ret.id,
      performedBy: input.inspector,
    })
    inventory = res.inventory
    movements = res.movements
  }
  if (input.damagedQty > 0) {
    const res = postInventoryMovement(inventory, movements, {
      movementType: 'RETURN_QC_REJECT',
      balanceId: balance.id,
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      batchId: balance.batchId,
      batch: balance.batch,
      warehouseId: balance.warehouseId,
      quantity: input.damagedQty,
      fromStatus: 'RETURN_QC_HOLD',
      toStatus: 'DAMAGED',
      fromLocation: loc,
      toLocation: loc,
      referenceType: 'RETURN',
      referenceId: ret.id,
      performedBy: input.inspector,
      reason: 'DAMAGED',
    })
    inventory = res.inventory
    movements = res.movements
  }
  if (input.wastageQty > 0) {
    const res = postInventoryMovement(inventory, movements, {
      movementType: 'WASTAGE',
      balanceId: balance.id,
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      batchId: balance.batchId,
      batch: balance.batch,
      warehouseId: balance.warehouseId,
      quantity: input.wastageQty,
      fromStatus: 'RETURN_QC_HOLD',
      toStatus: 'WASTAGE',
      fromLocation: loc,
      toLocation: loc,
      referenceType: 'RETURN',
      referenceId: ret.id,
      performedBy: input.inspector,
      reason: 'WASTAGE',
    })
    inventory = res.inventory
    movements = res.movements
  }

  const qcResult =
    input.damagedQty + input.wastageQty === 0 ? 'Passed'
      : input.reusableQty === 0 ? 'Failed'
        : 'Partial'

  const returns = state.returns.map((r) => {
    if (r.id !== ret.id) return r
    const lines = r.lines.map((l) =>
      l.id === line.id
        ? { ...l, reusableQty: input.reusableQty, damagedQty: input.damagedQty, wastageQty: input.wastageQty }
        : l,
    )
    return {
      ...r,
      lines,
      reusableQty: lines.reduce((s, l) => s + l.reusableQty, 0),
      damagedQty: lines.reduce((s, l) => s + l.damagedQty, 0),
      wastageQty: lines.reduce((s, l) => s + l.wastageQty, 0),
      qcResult: qcResult as 'Passed' | 'Failed' | 'Partial',
      status: 'Closed' as const,
    }
  })

  // Spawn put-away for reusable
  let putAwayTasks = state.putAwayTasks
  if (input.reusableQty > 0) {
    const suggested = state.bins.find((b) => b.warehouseId === ret.warehouseId && b.status === 'Available')
    putAwayTasks = [{
      id: uid('pa'),
      taskNumber: `PA-${2000 + putAwayTasks.length + 1}`,
      sourceType: 'RETURN',
      sourceId: ret.id,
      product: line.product,
      productId: line.productId,
      sku: line.sku,
      batchId: balance.batchId,
      batch: balance.batch,
      quantity: input.reusableQty,
      currentLocation: loc,
      warehouseId: ret.warehouseId,
      warehouse: ret.warehouse,
      suggestedBinId: suggested?.id,
      suggestedLocation: suggested?.code || 'TBD',
      destinationBin: '',
      assignedTo: 'Unassigned',
      priority: 'Medium',
      status: 'Queued',
    }, ...putAwayTasks]
  }

  const qcInspections = state.qcInspections.map((q) =>
    q.sourceType === 'RETURN' && q.sourceId === ret.id && q.sku === line.sku
      ? {
          ...q,
          acceptedQty: input.reusableQty,
          rejectedQty: input.damagedQty + input.wastageQty,
          inspector: input.inspector,
          inspectedAt: new Date().toISOString(),
          qcResult: qcResult as 'Passed' | 'Failed' | 'Partial',
          status: (qcResult === 'Passed' ? 'Passed' : qcResult === 'Failed' ? 'Failed' : 'Partial') as typeof q.status,
          remarks: input.notes,
        }
      : q,
  )

  return { ...state, inventory, movements, returns, putAwayTasks, qcInspections }
}
