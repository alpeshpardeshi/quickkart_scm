import { format, parseISO, isValid } from 'date-fns'

export function formatCurrency(value: number) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: 0,
  }).format(value)
}

export function formatNumber(value: number) {
  return new Intl.NumberFormat('en-IN').format(value)
}

export function formatDate(value?: string) {
  if (!value) return '—'
  try {
    const d = value.includes('T') ? parseISO(value) : parseISO(`${value}T00:00:00`)
    if (!isValid(d)) return value
    return format(d, 'dd MMM yyyy')
  } catch {
    return value
  }
}

export function formatDateTime(value?: string) {
  if (!value) return '—'
  try {
    const d = parseISO(value)
    if (!isValid(d)) return value
    return format(d, 'dd MMM yyyy, HH:mm')
  } catch {
    return value
  }
}

export function uid(prefix: string) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

export function statusTone(status: string): 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary' {
  const s = status.toLowerCase()
  if (['active', 'available', 'published', 'completed', 'passed', 'synced', 'delivered', 'handed over', 'closed', 'confirmed', 'reserved'].some((k) => s.includes(k))) return 'success'
  if (['pending', 'draft', 'queued', 'open', 'scheduled', 'invited', 'near expiry', 'partial', 'verifying', 'in progress', 'receiving'].some((k) => s.includes(k))) return 'warning'
  if (['failed', 'expired', 'damaged', 'cancelled', 'blocked', 'danger', 'rtv', 'inactive', 'on hold', 'variance'].some((k) => s.includes(k))) return 'danger'
  if (['qc hold', 'low stock', 'maintenance', 'decision'].some((k) => s.includes(k))) return 'info'
  if (['picking', 'packed', 'dispatched', 'in transit'].some((k) => s.includes(k))) return 'primary'
  return 'neutral'
}

export function filterByQuery<T extends Record<string, unknown>>(rows: T[], query: string, keys: (keyof T)[]) {
  const q = query.trim().toLowerCase()
  if (!q) return rows
  return rows.filter((row) =>
    keys.some((key) => String(row[key] ?? '').toLowerCase().includes(q)),
  )
}

export function paginate<T>(rows: T[], page: number, pageSize: number) {
  const start = (page - 1) * pageSize
  return {
    rows: rows.slice(start, start + pageSize),
    total: rows.length,
    pageCount: Math.max(1, Math.ceil(rows.length / pageSize)),
  }
}

export function sortRows<T>(rows: T[], key: keyof T | null, direction: 'asc' | 'desc') {
  if (!key) return rows
  return [...rows].sort((a, b) => {
    const av = a[key]
    const bv = b[key]
    if (av == null && bv == null) return 0
    if (av == null) return 1
    if (bv == null) return -1
    if (typeof av === 'number' && typeof bv === 'number') {
      return direction === 'asc' ? av - bv : bv - av
    }
    const as = String(av).toLowerCase()
    const bs = String(bv).toLowerCase()
    if (as < bs) return direction === 'asc' ? -1 : 1
    if (as > bs) return direction === 'asc' ? 1 : -1
    return 0
  })
}
