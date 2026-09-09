import type { AppState } from '../appState'
import type { Batch, GrnLine, GrnRecord, InventoryBalance, Product, PurchaseOrder, QcInspection, ReceivingLine, ReceivingRecord, Task } from '../../types'
import { uid } from '../../utils'
import { emptyBuckets, postInventoryMovement } from '../inventory/movementService'

export interface ReceiveLineInput {
  sku: string
  productId: string
  product: string
  orderedQty: number
  previouslyReceivedQty: number
  pendingQty: number
  receivedQty: number
  batchNo: string
  vendorBatchNo?: string
  mfgDate: string
  expiryDate: string
  barcode?: string
  temperature?: number
  damagedQty?: number
  shortQty?: number
  excessQty?: number
  remarks?: string
  uom: string
}

export interface ReceivePoInput {
  poId: string
  receivedBy: string
  dock?: string
  vendorInvoiceNumber?: string
  vendorChallanNumber?: string
  vehicleNumber?: string
  notes?: string
  lines: ReceiveLineInput[]
  qcLocationLabel: string
  qcBinId: string
  zoneId: string
  zone: string
  rackId: string
  rack: string
  shelfId: string
  shelf: string
  bin: string
}

function refreshPoStatus(po: PurchaseOrder): PurchaseOrder {
  const items = po.items.map((line) => {
    const pendingQty = Math.max(0, line.orderedQty - line.receivedQty)
    const status =
      line.receivedQty <= 0 ? 'Pending' as const
        : line.receivedQty < line.orderedQty ? 'Partial' as const
          : 'Received' as const
    return { ...line, pendingQty, status }
  })
  const allReceived = items.every((i) => i.receivedQty >= i.orderedQty)
  const anyReceived = items.some((i) => i.receivedQty > 0)
  let status = po.status
  if (po.status !== 'Cancelled' && po.status !== 'Closed') {
    if (allReceived) status = 'Received'
    else if (anyReceived) status = 'Partially Received'
  }
  return { ...po, items, status, itemCount: items.length }
}

export function receiveAgainstPo(state: AppState, input: ReceivePoInput): AppState {
  const po = state.purchaseOrders.find((p) => p.id === input.poId)
  if (!po) throw new Error('PO not found')
  if (po.status !== 'Published' && po.status !== 'Partially Received') {
    throw new Error('PO must be Published or Partially Received')
  }

  const receivingNumber = `RCV-${8000 + state.receiving.length + 1}`
  const grnNumber = `GRN-${8000 + state.grns.length + 1}`
  const receivingId = uid('rcv')
  const grnId = uid('grn')
  const now = new Date().toISOString()

  let inventory = state.inventory
  let movements = state.movements
  let batches = [...state.batches]
  const qcInspections = [...state.qcInspections]
  const tasks = [...state.tasks]
  const grnLines: GrnLine[] = []
  const recvLines: ReceivingLine[] = []

  let totalReceived = 0

  for (const line of input.lines) {
    if (line.receivedQty <= 0) continue
    if (line.receivedQty > line.pendingQty) {
      throw new Error(`${line.sku}: received qty exceeds pending`)
    }
    if (line.expiryDate && line.mfgDate && line.expiryDate <= line.mfgDate) {
      throw new Error(`${line.sku}: expiry must be after manufacturing date`)
    }

    const product = state.products.find((p) => p.id === line.productId || p.sku === line.sku)
    if (product?.expiryTracking && product.minShelfLifeReceiving) {
      const days = Math.round(
        (new Date(`${line.expiryDate}T00:00:00`).getTime() - new Date(`${now.slice(0, 10)}T00:00:00`).getTime()) / 86400000,
      )
      if (days < product.minShelfLifeReceiving) {
        throw new Error(`${line.sku}: remaining shelf life below receiving minimum`)
      }
    }

    const batchId = uid('bat')
    const batch: Batch = {
      id: batchId,
      batchNo: line.batchNo,
      vendorBatchNo: line.vendorBatchNo,
      sku: line.sku,
      productId: line.productId,
      product: line.product,
      warehouseId: po.warehouseId,
      warehouse: po.warehouse,
      qty: line.receivedQty,
      mfgDate: line.mfgDate,
      expiry: line.expiryDate,
      receivedDate: now.slice(0, 10),
      vendorId: po.vendorId,
      vendor: po.vendor,
      poId: po.id,
      grnId,
      qcStatus: 'Pending',
      status: 'Active',
    }
    batches = [batch, ...batches]

    const balanceDraft: InventoryBalance = {
      id: uid('inv'),
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      warehouseId: po.warehouseId,
      warehouse: po.warehouse,
      zoneId: input.zoneId,
      zone: input.zone,
      rackId: input.rackId,
      rack: input.rack,
      shelfId: input.shelfId,
      shelf: input.shelf,
      binId: input.qcBinId,
      bin: input.bin,
      batchId,
      batch: line.batchNo,
      ...emptyBuckets(),
      qcHold: 0,
      status: 'QC Hold',
      expiry: line.expiryDate,
      mfgDate: line.mfgDate,
    }

    const posted = postInventoryMovement(inventory, movements, {
      movementType: 'GRN_RECEIPT',
      createBalance: balanceDraft,
      sku: line.sku,
      product: line.product,
      productId: line.productId,
      batchId,
      batch: line.batchNo,
      warehouseId: po.warehouseId,
      quantity: line.receivedQty,
      fromStatus: '',
      toStatus: 'QC_HOLD',
      fromLocation: input.dock || 'DOCK',
      toLocation: input.qcLocationLabel,
      referenceType: 'RECEIVING',
      referenceId: receivingId,
      performedBy: input.receivedBy,
    })
    inventory = posted.inventory
    movements = posted.movements

    const qcId = uid('qc')
    const qc: QcInspection = {
      id: qcId,
      qcNumber: `QC-${5500 + qcInspections.length + 1}`,
      sourceType: 'GRN',
      sourceId: grnId,
      reference: grnNumber,
      product: line.product,
      productId: line.productId,
      sku: line.sku,
      batchId,
      batch: line.batchNo,
      receivedQty: line.receivedQty,
      inspectedQty: line.receivedQty,
      acceptedQty: 0,
      rejectedQty: 0,
      reason: '',
      status: 'Pending',
      qcResult: 'Pending',
      warehouseId: po.warehouseId,
      warehouse: po.warehouse,
      inspector: '',
      inspectedAt: '',
    }
    qcInspections.unshift(qc)

    const task: Task = {
      id: uid('task'),
      taskNumber: `TSK-${1000 + tasks.length + 1}`,
      title: `QC ${line.sku} / ${line.batchNo}`,
      type: 'QC',
      referenceType: 'QC',
      referenceId: qcId,
      warehouseId: po.warehouseId,
      warehouse: po.warehouse,
      location: input.qcLocationLabel,
      priority: 'High',
      status: 'Pending',
      due: now.slice(0, 10),
      assignedTo: 'Unassigned',
      createdBy: input.receivedBy,
      createdAt: now,
      description: `Inspect inbound batch ${line.batchNo}`,
    }
    tasks.unshift(task)

    recvLines.push({
      id: uid('rl'),
      sku: line.sku,
      productId: line.productId,
      product: line.product,
      orderedQty: line.orderedQty,
      previouslyReceivedQty: line.previouslyReceivedQty,
      pendingQty: line.pendingQty,
      receivedQty: line.receivedQty,
      batchNo: line.batchNo,
      vendorBatchNo: line.vendorBatchNo,
      mfgDate: line.mfgDate,
      expiryDate: line.expiryDate,
      barcode: line.barcode,
      temperature: line.temperature,
      damagedQty: line.damagedQty || 0,
      shortQty: line.shortQty || 0,
      excessQty: line.excessQty || 0,
      remarks: line.remarks,
      batchId,
    })

    grnLines.push({
      id: uid('gl'),
      sku: line.sku,
      product: line.product,
      batchId,
      batchNo: line.batchNo,
      orderedQty: line.orderedQty,
      receivedQty: line.receivedQty,
      acceptedQty: 0,
      rejectedQty: 0,
      uom: line.uom,
      mfgDate: line.mfgDate,
      expiryDate: line.expiryDate,
      temperature: line.temperature,
      qcStatus: 'Pending',
    })

    totalReceived += line.receivedQty
  }

  const receiving: ReceivingRecord = {
    id: receivingId,
    receivingNumber,
    grnNumber,
    poId: po.id,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    vendor: po.vendor,
    warehouseId: po.warehouseId,
    warehouse: po.warehouse,
    receiptAt: now,
    vendorInvoiceNumber: input.vendorInvoiceNumber,
    vendorChallanNumber: input.vendorChallanNumber,
    vehicleNumber: input.vehicleNumber,
    dock: input.dock,
    notes: input.notes,
    expectedQty: input.lines.reduce((s, l) => s + l.pendingQty, 0),
    receivedQty: totalReceived,
    acceptedQty: 0,
    rejectedQty: 0,
    status: 'Completed',
    receivedAt: now,
    receivedBy: input.receivedBy,
    lines: recvLines,
    grnId,
  }

  const grn: GrnRecord = {
    id: grnId,
    grnNumber,
    receivingId,
    receivingNumber,
    poId: po.id,
    poNumber: po.poNumber,
    vendorId: po.vendorId,
    vendor: po.vendor,
    warehouseId: po.warehouseId,
    warehouse: po.warehouse,
    receiptDate: now.slice(0, 10),
    invoiceNumber: input.vendorInvoiceNumber,
    challanNumber: input.vendorChallanNumber,
    totalReceived,
    totalAccepted: 0,
    totalRejected: 0,
    qcStatus: 'Pending',
    status: 'QC Pending',
    lines: grnLines,
    receivedBy: input.receivedBy,
  }

  const purchaseOrders = state.purchaseOrders.map((p) => {
    if (p.id !== po.id) return p
    const items = p.items.map((item) => {
      const recv = input.lines
        .filter((l) => l.sku === item.sku)
        .reduce((s, l) => s + l.receivedQty, 0)
      if (!recv) return item
      const receivedQty = item.receivedQty + recv
      return {
        ...item,
        receivedQty,
        pendingQty: Math.max(0, item.orderedQty - receivedQty),
      }
    })
    return refreshPoStatus({ ...p, items })
  })

  const notifications = [
    {
      id: uid('ntf'),
      title: 'QC pending',
      message: `${grnNumber}: ${totalReceived} units awaiting QC`,
      type: 'warning' as const,
      severity: 'high' as const,
      referenceType: 'GRN',
      referenceId: grnId,
      read: false,
      createdAt: now,
    },
    ...state.notifications,
  ]

  return {
    ...state,
    inventory,
    movements,
    batches,
    qcInspections,
    tasks,
    receiving: [receiving, ...state.receiving],
    grns: [grn, ...state.grns],
    purchaseOrders,
    notifications,
  }
}

export function suggestReceiveDefaults(product: Product | undefined, qty: number) {
  const today = '2026-09-09'
  const mfg = '2026-08-01'
  const expiry = product?.expiryTracking || product?.perishable ? '2026-12-01' : '2028-01-01'
  return { mfg, expiry, today, qty }
}
