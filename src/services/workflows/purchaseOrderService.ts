import type { AppState } from '../appState'
import type { ApprovalHistoryItem, PurchaseOrder, PurchaseOrderItem, ZohoSyncRecord } from '../../types'
import { uid } from '../../utils'

export function createPurchaseOrder(
  state: AppState,
  po: Omit<PurchaseOrder, 'id' | 'poNumber' | 'status' | 'zohoStatus' | 'createdAt'> & { createdBy: string },
): AppState {
  const id = uid('po')
  const poNumber = `PO-${10236 + state.purchaseOrders.length}`
  const record: PurchaseOrder = {
    ...po,
    id,
    poNumber,
    status: 'Draft',
    zohoStatus: 'Not Synced',
    createdAt: new Date().toISOString(),
    orderDate: po.orderDate || '2026-09-09',
  }
  return { ...state, purchaseOrders: [record, ...state.purchaseOrders] }
}

export function submitPurchaseOrder(state: AppState, poId: string, actedBy: string): AppState {
  const po = state.purchaseOrders.find((p) => p.id === poId)
  if (!po) throw new Error('PO not found')
  if (po.status !== 'Draft' && po.status !== 'Pending Approval') throw new Error('Invalid PO status for submit')

  const purchaseOrders = state.purchaseOrders.map((p) =>
    p.id === poId ? { ...p, status: 'Pending Approval' as const, zohoStatus: 'Not Synced' as const } : p,
  )
  const history: ApprovalHistoryItem = {
    id: uid('ah'),
    poNumber: po.poNumber,
    poId: po.id,
    vendor: po.vendor,
    amount: po.amount,
    action: 'Submitted',
    actedBy,
    actedAt: new Date().toISOString(),
    notes: 'Submitted for approval',
  }
  return {
    ...state,
    purchaseOrders,
    approvalHistory: [history, ...state.approvalHistory],
  }
}

/** Approve auto-publishes. Zoho stays Not Synced / Pending — never fake Synced. */
export function approvePurchaseOrder(state: AppState, poId: string, actedBy: string, notes?: string): AppState {
  const po = state.purchaseOrders.find((p) => p.id === poId)
  if (!po) throw new Error('PO not found')
  if (po.status !== 'Pending Approval') throw new Error('PO is not pending approval')

  const purchaseOrders = state.purchaseOrders.map((p) =>
    p.id === poId
      ? { ...p, status: 'Published' as const, zohoStatus: 'Pending' as const, updatedAt: new Date().toISOString() }
      : p,
  )
  const history: ApprovalHistoryItem = {
    id: uid('ah'),
    poNumber: po.poNumber,
    poId: po.id,
    vendor: po.vendor,
    amount: po.amount,
    action: 'Approved',
    actedBy,
    actedAt: new Date().toISOString(),
    notes: notes || 'Approved and published',
  }
  const zoho: ZohoSyncRecord = {
    id: uid('zoho'),
    poNumber: po.poNumber,
    poId: po.id,
    direction: 'Push',
    status: 'Pending',
    message: 'Queued for Zoho sync (not completed)',
    syncedAt: new Date().toISOString(),
    attempts: 0,
  }
  const notifications = [
    {
      id: uid('ntf'),
      title: 'PO published',
      message: `${po.poNumber} approved and published — ready for receiving`,
      type: 'success' as const,
      referenceType: 'PO',
      referenceId: po.id,
      read: false,
      createdAt: new Date().toISOString(),
    },
    ...state.notifications,
  ]
  return {
    ...state,
    purchaseOrders,
    approvalHistory: [history, ...state.approvalHistory],
    zohoSyncHistory: [zoho, ...state.zohoSyncHistory],
    notifications,
  }
}

export function rejectPurchaseOrder(state: AppState, poId: string, actedBy: string, notes?: string): AppState {
  const po = state.purchaseOrders.find((p) => p.id === poId)
  if (!po) throw new Error('PO not found')
  const purchaseOrders = state.purchaseOrders.map((p) =>
    p.id === poId ? { ...p, status: 'Cancelled' as const, zohoStatus: 'Not Synced' as const } : p,
  )
  const history: ApprovalHistoryItem = {
    id: uid('ah'),
    poNumber: po.poNumber,
    poId: po.id,
    vendor: po.vendor,
    amount: po.amount,
    action: 'Rejected',
    actedBy,
    actedAt: new Date().toISOString(),
    notes: notes || 'Rejected',
  }
  return { ...state, purchaseOrders, approvalHistory: [history, ...state.approvalHistory] }
}

export function buildPoLine(
  product: { id: string; sku: string; name: string; uom: string; unitPrice: number },
  qty: number,
  unitPrice?: number,
): PurchaseOrderItem {
  const price = unitPrice ?? product.unitPrice
  return {
    id: uid('poi'),
    sku: product.sku,
    productId: product.id,
    product: product.name,
    uom: product.uom,
    orderedQty: qty,
    receivedQty: 0,
    acceptedQty: 0,
    rejectedQty: 0,
    pendingQty: qty,
    unitPrice: price,
    taxPercent: 0,
    taxAmount: 0,
    discount: 0,
    total: qty * price,
    status: 'Pending',
  }
}
