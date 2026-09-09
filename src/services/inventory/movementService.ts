import type { InventoryBalance, InventoryBucket, MovementType, StockMovement } from '../../types'
import { uid } from '../../utils'

const BUCKET_FIELD: Record<InventoryBucket, keyof InventoryBalance> = {
  AVAILABLE: 'available',
  RESERVED: 'reserved',
  LOCKED: 'locked',
  QC_HOLD: 'qcHold',
  PUTAWAY_PENDING: 'putawayPending',
  DAMAGED: 'damaged',
  EXPIRED: 'expired',
  IN_TRANSIT: 'inTransit',
  DISPATCH_READY: 'dispatchReady',
  WASTAGE: 'wastage',
  QC_REJECTED: 'qcRejected',
  RETURN_QC_HOLD: 'returnQcHold',
  QUARANTINE: 'quarantine',
}

export function getBucketQty(row: InventoryBalance, bucket: InventoryBucket): number {
  return Number(row[BUCKET_FIELD[bucket]] ?? 0)
}

export function deriveInventoryStatus(row: InventoryBalance): InventoryBalance['status'] {
  if (row.expired > 0 && row.available <= 0) return 'Expired'
  if (row.damaged > 0 && row.available <= 0) return 'Damaged'
  if (row.qcHold > 0 || row.returnQcHold > 0) return 'QC Hold'
  if (row.putawayPending > 0 && row.available <= 0) return 'Putaway Pending'
  if (row.available > 0 && row.available < 50) return 'Low Stock'
  return 'Available'
}

export function emptyBuckets(): Pick<
  InventoryBalance,
  | 'available' | 'reserved' | 'locked' | 'qcHold' | 'putawayPending' | 'damaged'
  | 'expired' | 'inTransit' | 'dispatchReady' | 'wastage' | 'qcRejected' | 'returnQcHold' | 'quarantine'
> {
  return {
    available: 0,
    reserved: 0,
    locked: 0,
    qcHold: 0,
    putawayPending: 0,
    damaged: 0,
    expired: 0,
    inTransit: 0,
    dispatchReady: 0,
    wastage: 0,
    qcRejected: 0,
    returnQcHold: 0,
    quarantine: 0,
  }
}

export function movementLegacyType(t: MovementType): StockMovement['type'] {
  if (t.startsWith('RETURN')) return 'Return'
  if (t.includes('TRANSFER')) return 'Transfer'
  if (t.includes('ADJUSTMENT') || t === 'DAMAGE' || t === 'WASTAGE' || t === 'EXPIRY') return 'Adjustment'
  if (t === 'DISPATCH' || t === 'PICK' || t === 'PACK') return 'Outbound'
  return 'Inbound'
}

export interface PostMovementInput {
  movementType: MovementType
  balanceId?: string
  createBalance?: Omit<InventoryBalance, 'id' | 'status'> & { id?: string }
  sku: string
  product: string
  productId: string
  batchId: string
  batch: string
  warehouseId: string
  quantity: number
  fromStatus: InventoryBucket | ''
  toStatus: InventoryBucket | ''
  fromLocation: string
  toLocation: string
  referenceType: string
  referenceId: string
  performedBy: string
  reason?: string
  notes?: string
  /** When moving between balances (put-away relocate) */
  targetBalanceId?: string
  relocateFields?: Partial<InventoryBalance>
}

export function applyBucketDelta(
  row: InventoryBalance,
  fromStatus: InventoryBucket | '',
  toStatus: InventoryBucket | '',
  qty: number,
): InventoryBalance {
  if (qty <= 0) throw new Error('Quantity must be > 0')
  const next = { ...row }
  if (fromStatus) {
    const field = BUCKET_FIELD[fromStatus] as keyof InventoryBalance
    const current = Number(next[field] ?? 0)
    if (current < qty) throw new Error(`Insufficient ${fromStatus}: have ${current}, need ${qty}`)
    Object.assign(next, { [field]: current - qty })
  }
  if (toStatus) {
    const field = BUCKET_FIELD[toStatus] as keyof InventoryBalance
    const current = Number(next[field] ?? 0)
    Object.assign(next, { [field]: current + qty })
  }
  next.status = deriveInventoryStatus(next)
  return next
}

export function postInventoryMovement(
  inventory: InventoryBalance[],
  movements: StockMovement[],
  input: PostMovementInput,
): { inventory: InventoryBalance[]; movements: StockMovement[]; balanceId: string } {
  let balances = [...inventory]
  let balanceId = input.balanceId || ''

  if (input.createBalance && !balanceId) {
    const id = input.createBalance.id || uid('inv')
    const row: InventoryBalance = {
      ...emptyBuckets(),
      ...input.createBalance,
      id,
      status: 'Available',
    }
    row.status = deriveInventoryStatus(row)
    balances = [row, ...balances]
    balanceId = id
  }

  if (!balanceId) throw new Error('balanceId required for inventory movement')

  const idx = balances.findIndex((b) => b.id === balanceId)
  if (idx < 0) throw new Error(`Inventory balance not found: ${balanceId}`)

  let row = balances[idx]

  if (input.targetBalanceId && input.relocateFields) {
    // Move qty out of source bucket, into target balance bucket (put-away)
    row = applyBucketDelta(row, input.fromStatus, '', input.quantity)
    balances[idx] = row

    const tIdx = balances.findIndex((b) => b.id === input.targetBalanceId)
    if (tIdx >= 0) {
      let target = applyBucketDelta(balances[tIdx], '', input.toStatus, input.quantity)
      balances[tIdx] = target
    } else {
      const created: InventoryBalance = {
        ...row,
        ...emptyBuckets(),
        ...input.relocateFields,
        id: input.targetBalanceId,
        available: 0,
        reserved: 0,
        locked: 0,
        qcHold: 0,
        putawayPending: 0,
        damaged: 0,
        expired: 0,
        inTransit: 0,
        dispatchReady: 0,
        wastage: 0,
        qcRejected: 0,
        returnQcHold: 0,
        quarantine: 0,
      }
      const withQty = applyBucketDelta(created, '', input.toStatus, input.quantity)
      balances = [withQty, ...balances]
    }
  } else if (input.relocateFields && input.toStatus) {
    row = applyBucketDelta(row, input.fromStatus, '', input.quantity)
    const newId = uid('inv')
    const created: InventoryBalance = {
      ...row,
      ...emptyBuckets(),
      ...input.relocateFields,
      id: newId,
    }
    const withQty = applyBucketDelta(created, '', input.toStatus, input.quantity)
    // zero out emptied source buckets already done; keep source row
    balances[idx] = row
    balances = [withQty, ...balances]
    balanceId = newId
  } else {
    row = applyBucketDelta(row, input.fromStatus, input.toStatus, input.quantity)
    balances[idx] = row
  }

  const now = new Date().toISOString()
  const movement: StockMovement = {
    id: uid('mv'),
    movementId: uid('MVT'),
    timestamp: now,
    movementType: input.movementType,
    type: movementLegacyType(input.movementType),
    sku: input.sku,
    product: input.product,
    productId: input.productId,
    batchId: input.batchId,
    batch: input.batch,
    warehouseId: input.warehouseId,
    qty: input.quantity,
    fromLocation: input.fromLocation,
    toLocation: input.toLocation,
    fromStatus: input.fromStatus,
    toStatus: input.toStatus,
    referenceType: input.referenceType,
    referenceId: input.referenceId,
    reference: `${input.referenceType}:${input.referenceId}`,
    performedBy: input.performedBy,
    performedAt: now,
    reason: input.reason,
    notes: input.notes,
  }

  return { inventory: balances, movements: [movement, ...movements], balanceId }
}
