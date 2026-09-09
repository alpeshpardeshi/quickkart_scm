export type ThemeMode = 'light' | 'dark'
export type DensityMode = 'compact' | 'comfortable'

export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

export interface Vendor {
  id: string
  name: string
  code: string
  contact: string
  email: string
  phone: string
  city: string
  status: 'Active' | 'Inactive' | 'On Hold'
  categories: string[]
  leadTimeDays: number
  createdAt: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  city: string
  address: string
  zones: number
  capacity: number
  utilization: number
  status: 'Active' | 'Inactive' | 'Maintenance'
  manager: string
}

export interface Product {
  id: string
  sku: string
  name: string
  category: string
  uom: string
  safetyStock: number
  reorderPoint: number
  unitPrice: number
  status: 'Active' | 'Discontinued'
  perishable: boolean
}

export interface InventoryItem {
  id: string
  sku: string
  product: string
  warehouseId: string
  warehouse: string
  zone: string
  rack: string
  shelf: string
  bin: string
  batch: string
  available: number
  reserved: number
  locked: number
  qcHold: number
  damaged: number
  expired: number
  inTransit: number
  status: 'Available' | 'Low Stock' | 'QC Hold' | 'Expired' | 'Damaged'
  expiry: string
  mfgDate: string
}

export interface Batch {
  id: string
  batchNo: string
  sku: string
  product: string
  warehouse: string
  qty: number
  mfgDate: string
  expiry: string
  fefoPriority: number
  status: 'Active' | 'Near Expiry' | 'Expired' | 'Quarantine'
  vendor: string
}

export interface PurchaseOrderItem {
  id: string
  sku: string
  product: string
  orderedQty: number
  receivedQty: number
  pendingQty: number
  unitPrice: number
  total: number
  status: 'Pending' | 'Partial' | 'Received' | 'Closed'
}

export interface PurchaseOrder {
  id: string
  poNumber: string
  vendorId: string
  vendor: string
  warehouseId: string
  warehouse: string
  expectedDelivery: string
  status: 'Draft' | 'Pending Approval' | 'Published' | 'Receiving' | 'Closed' | 'Cancelled'
  amount: number
  itemCount: number
  createdAt: string
  createdBy: string
  items: PurchaseOrderItem[]
  zohoStatus: 'Synced' | 'Pending' | 'Failed' | 'Not Linked'
}

export interface ReceivingRecord {
  id: string
  grnNumber: string
  poNumber: string
  vendor: string
  warehouse: string
  expectedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  status: 'In Progress' | 'Completed' | 'Partial' | 'Pending'
  receivedAt: string
  receivedBy: string
}

export interface QcInspection {
  id: string
  reference: string
  product: string
  sku: string
  batch: string
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  reason: string
  status: 'Pending' | 'In Progress' | 'Passed' | 'Failed' | 'RTV'
  warehouse: string
  inspector: string
  inspectedAt: string
}

export interface PutAwayTask {
  id: string
  product: string
  sku: string
  batch: string
  quantity: number
  currentLocation: string
  suggestedLocation: string
  destinationBin: string
  warehouse: string
  status: 'Queued' | 'In Progress' | 'Completed'
  assignedTo: string
}

export interface Customer {
  id: string
  name: string
  code: string
  contact: string
  email: string
  phone: string
  city: string
  type: 'Retail' | 'Wholesale' | 'Distributor'
  status: 'Active' | 'Inactive'
  creditLimit: number
}

export interface SalesOrderItem {
  id: string
  sku: string
  product: string
  orderedQty: number
  reservedQty: number
  pickedQty: number
  dispatchedQty: number
  unitPrice: number
  total: number
  batch?: string
  status: 'Pending' | 'Reserved' | 'Picked' | 'Dispatched'
}

export interface SalesOrder {
  id: string
  soNumber: string
  customerId: string
  customer: string
  warehouseId: string
  warehouse: string
  status: 'Draft' | 'Confirmed' | 'Reserved' | 'Picking' | 'Packed' | 'Dispatched' | 'Delivered' | 'Cancelled'
  amount: number
  itemCount: number
  orderDate: string
  deliveryDate: string
  items: SalesOrderItem[]
  createdBy: string
}

export interface Picklist {
  id: string
  picklistNo: string
  soNumber: string
  warehouse: string
  items: number
  picked: number
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled'
  assignedTo: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  createdAt: string
}

export interface DispatchRecord {
  id: string
  dispatchNo: string
  soNumber: string
  customer: string
  warehouse: string
  items: number
  status: 'Queued' | 'Verifying' | 'Ready' | 'Handed Over' | 'In Transit'
  vehicle: string
  driver: string
  dispatchedAt: string
}

export interface ReturnRecord {
  id: string
  returnNo: string
  soNumber: string
  customer: string
  sku: string
  product: string
  batch: string
  returnedQty: number
  reusableQty: number
  damagedQty: number
  wastageQty: number
  qcResult: 'Pending' | 'Passed' | 'Failed' | 'Partial'
  status: 'Open' | 'QC' | 'Decision Pending' | 'Closed'
  reason: string
  createdAt: string
}

export interface Task {
  id: string
  title: string
  type: 'Receiving' | 'QC' | 'Put-Away' | 'Picking' | 'Dispatch' | 'Audit' | 'General'
  warehouse: string
  location: string
  priority: 'Low' | 'Medium' | 'High' | 'Urgent'
  status: 'Open' | 'In Progress' | 'Blocked' | 'Completed' | 'Cancelled'
  due: string
  assignedTo: string
  createdBy: string
  createdAt: string
  description: string
}

export interface AppUser {
  id: string
  name: string
  email: string
  role: string
  warehouse: string
  status: 'Active' | 'Inactive' | 'Invited'
  lastActive: string
}

export interface Role {
  id: string
  name: string
  description: string
  users: number
  permissions: string[]
}

export interface NotificationItem {
  id: string
  title: string
  message: string
  type: 'info' | 'warning' | 'danger' | 'success'
  read: boolean
  createdAt: string
}

export interface StockMovement {
  id: string
  sku: string
  product: string
  batch: string
  type: 'Inbound' | 'Outbound' | 'Transfer' | 'Adjustment' | 'Return'
  qty: number
  fromLocation: string
  toLocation: string
  reference: string
  performedBy: string
  performedAt: string
}

export interface AuditRecord {
  id: string
  auditNo: string
  warehouse: string
  zone: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Variance'
  varianceCount: number
  scheduledAt: string
  completedAt?: string
  auditor: string
}

export interface WastageRecord {
  id: string
  sku: string
  product: string
  batch: string
  qty: number
  reason: string
  warehouse: string
  recordedBy: string
  recordedAt: string
  value: number
}

export interface ApprovalHistoryItem {
  id: string
  poNumber: string
  poId: string
  vendor: string
  amount: number
  action: 'Approved' | 'Rejected' | 'Submitted'
  actedBy: string
  actedAt: string
  notes: string
}

export interface ZohoSyncRecord {
  id: string
  poNumber: string
  direction: 'Push' | 'Pull'
  status: 'Synced' | 'Pending' | 'Failed'
  message: string
  syncedAt: string
  attempts: number
}
