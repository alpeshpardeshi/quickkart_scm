import type { AllocationMethod, Bin, InventoryBalance, Product } from '../../types'
import { BUSINESS_DATE } from '../appState'
import { listAtpBalances } from './atpService'

export interface AllocationCandidate {
  balanceId: string
  warehouseId: string
  binId: string
  batchId: string
  batchNo: string
  expiry: string
  receivedProxy: string
  available: number
}

export interface AllocationResult {
  balanceId: string
  warehouseId: string
  binId: string
  batchId: string
  batchNo: string
  expiry: string
  quantity: number
  strategy: AllocationMethod
}

function toCandidates(rows: InventoryBalance[]): AllocationCandidate[] {
  return rows.map((r) => ({
    balanceId: r.id,
    warehouseId: r.warehouseId,
    binId: r.binId,
    batchId: r.batchId,
    batchNo: r.batch,
    expiry: r.expiry,
    receivedProxy: r.mfgDate || r.expiry,
    available: r.available,
  }))
}

export function sortForStrategy(
  candidates: AllocationCandidate[],
  method: AllocationMethod,
): AllocationCandidate[] {
  const list = [...candidates]
  if (method === 'FEFO') {
    list.sort((a, b) =>
      a.expiry.localeCompare(b.expiry)
      || a.receivedProxy.localeCompare(b.receivedProxy)
      || a.batchNo.localeCompare(b.batchNo),
    )
  } else {
    // FIFO (+ MANUAL defaults to FIFO deterministic)
    list.sort((a, b) =>
      a.receivedProxy.localeCompare(b.receivedProxy)
      || a.batchNo.localeCompare(b.batchNo)
      || a.binId.localeCompare(b.binId),
    )
  }
  return list
}

export function allocateQuantity(
  inventory: InventoryBalance[],
  bins: Bin[],
  product: Product,
  qty: number,
  warehouseId?: string,
  minRemainingShelfLifeDays?: number,
  businessDate = BUSINESS_DATE,
): { allocations: AllocationResult[]; shortfall: number } {
  if (qty <= 0) return { allocations: [], shortfall: 0 }
  const method: AllocationMethod = product.expiryTracking || product.perishable
    ? (product.allocationMethod === 'FIFO' ? 'FIFO' : 'FEFO')
    : (product.allocationMethod === 'FEFO' ? 'FEFO' : 'FIFO')

  const eligible = listAtpBalances(inventory, bins, {
    sku: product.sku,
    warehouseId,
    product,
    minRemainingShelfLifeDays,
    businessDate,
  })
  const sorted = sortForStrategy(toCandidates(eligible), method)
  const allocations: AllocationResult[] = []
  let remaining = qty
  for (const c of sorted) {
    if (remaining <= 0) break
    const take = Math.min(c.available, remaining)
    if (take <= 0) continue
    allocations.push({
      balanceId: c.balanceId,
      warehouseId: c.warehouseId,
      binId: c.binId,
      batchId: c.batchId,
      batchNo: c.batchNo,
      expiry: c.expiry,
      quantity: take,
      strategy: method,
    })
    remaining -= take
  }
  return { allocations, shortfall: remaining }
}

/** Multi-warehouse: fill from preferred warehouse first, then others by ATP. */
export function allocateMultiWarehouse(
  inventory: InventoryBalance[],
  bins: Bin[],
  product: Product,
  qty: number,
  preferredWarehouseId: string,
  allowMulti: boolean,
  minRemainingShelfLifeDays?: number,
): { allocations: AllocationResult[]; shortfall: number } {
  const primary = allocateQuantity(
    inventory, bins, product, qty, preferredWarehouseId, minRemainingShelfLifeDays,
  )
  if (primary.shortfall <= 0 || !allowMulti) return primary

  const otherWarehouses = Array.from(
    new Set(
      inventory
        .filter((i) => i.sku === product.sku && i.warehouseId !== preferredWarehouseId)
        .map((i) => i.warehouseId),
    ),
  )
  let remaining = primary.shortfall
  const allocations = [...primary.allocations]
  for (const wh of otherWarehouses) {
    if (remaining <= 0) break
    const next = allocateQuantity(inventory, bins, product, remaining, wh, minRemainingShelfLifeDays)
    allocations.push(...next.allocations)
    remaining = next.shortfall
  }
  return { allocations, shortfall: remaining }
}
