import type { Bin, InventoryBalance, Product } from '../../types'
import { BUSINESS_DATE } from '../appState'

export function daysBetween(fromIso: string, toIso: string): number {
  const a = new Date(`${fromIso}T00:00:00`)
  const b = new Date(`${toIso}T00:00:00`)
  return Math.round((b.getTime() - a.getTime()) / 86400000)
}

export function isExpired(expiry: string, businessDate = BUSINESS_DATE): boolean {
  if (!expiry) return false
  return expiry < businessDate
}

export function remainingShelfLife(expiry: string, businessDate = BUSINESS_DATE): number {
  return daysBetween(businessDate, expiry)
}

export interface AtpOptions {
  sku: string
  warehouseId?: string
  product?: Product
  minRemainingShelfLifeDays?: number
  businessDate?: string
}

export function isEligibleForAtp(
  row: InventoryBalance,
  bins: Bin[],
  opts: { product?: Product; minRemainingShelfLifeDays?: number; businessDate?: string },
): boolean {
  if (row.available <= 0) return false
  if (isExpired(row.expiry, opts.businessDate)) return false
  const bin = bins.find((b) => b.id === row.binId)
  if (bin && bin.status === 'Blocked') return false
  const minLife = opts.minRemainingShelfLifeDays
    ?? opts.product?.minShelfLifeDispatch
    ?? 0
  if (minLife > 0 && remainingShelfLife(row.expiry, opts.businessDate) < minLife) return false
  return true
}

export function calculateATP(
  inventory: InventoryBalance[],
  bins: Bin[],
  opts: AtpOptions,
): number {
  return inventory
    .filter((row) => row.sku === opts.sku)
    .filter((row) => !opts.warehouseId || row.warehouseId === opts.warehouseId)
    .filter((row) => isEligibleForAtp(row, bins, opts))
    .reduce((sum, row) => sum + row.available, 0)
}

export function listAtpBalances(
  inventory: InventoryBalance[],
  bins: Bin[],
  opts: AtpOptions,
): InventoryBalance[] {
  return inventory
    .filter((row) => row.sku === opts.sku)
    .filter((row) => !opts.warehouseId || row.warehouseId === opts.warehouseId)
    .filter((row) => isEligibleForAtp(row, bins, opts))
}
