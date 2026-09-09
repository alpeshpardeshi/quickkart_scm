import type {
  AllocationMethod,
  InventoryBucket,
  LockStatus,
  MovementType,
  PoStatus,
  Priority,
  QcResult,
  QcSourceType,
  ReservationStatus,
  SoStatus,
  TaskStatus,
  ZohoStatus,
} from './enums'

export type ThemeMode = 'light' | 'dark'
export type DensityMode = 'compact' | 'comfortable'
export type StatusTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info' | 'primary'

export type Address = {
  line1: string
  line2?: string
  city: string
  state: string
  postalCode: string
  country: string
}

export interface Vendor {
  id: string
  name: string
  code: string
  vendorType: 'Manufacturer' | 'Distributor' | 'Wholesaler' | 'Supplier'
  contact: string
  email: string
  phone: string
  alternatePhone?: string
  website?: string
  city: string
  status: 'Active' | 'Inactive' | 'On Hold'
  categories: string[]
  leadTimeDays: number
  createdAt: string
  gstin?: string
  pan?: string
  taxRegistrationNumber?: string
  businessRegistrationNumber?: string
  paymentTerms?: string
  creditDays?: number
  currency?: string
  minimumOrderValue?: number
  billingAddress?: Address
  shippingAddress?: Address
  bank?: {
    accountHolder?: string
    bankName?: string
    accountNumber?: string
    ifsc?: string
    branch?: string
  }
  notes?: string
}

export interface VendorProduct {
  id: string
  vendorId: string
  productId: string
  sku: string
  vendorSku: string
  vendorPrice: number
  moq: number
  leadTimeDays: number
  preferred: boolean
  effectiveFrom?: string
  effectiveTo?: string
}

export interface Warehouse {
  id: string
  name: string
  code: string
  warehouseType: string
  city: string
  state?: string
  country?: string
  postalCode?: string
  address: string
  zones: number
  capacity: number
  utilization: number
  status: 'Active' | 'Inactive' | 'Maintenance'
  manager: string
  contactPerson?: string
  phone?: string
  email?: string
  temperatureControlled?: boolean
  receivingLocationId?: string
  qcLocationId?: string
  dispatchLocationId?: string
  returnsLocationId?: string
}

export interface Zone {
  id: string
  warehouseId: string
  code: string
  name: string
  zoneType: string
  temperatureType: string
  active: boolean
}

export interface Rack {
  id: string
  zoneId: string
  warehouseId: string
  code: string
  capacity: number
  active: boolean
}

export interface Shelf {
  id: string
  rackId: string
  zoneId: string
  warehouseId: string
  code: string
  capacity: number
  active: boolean
}

export interface Bin {
  id: string
  shelfId: string
  rackId: string
  zoneId: string
  warehouseId: string
  code: string
  binType: string
  capacity: number
  temperatureType: string
  status: 'Available' | 'Blocked'
  allowedCategory?: string
}

export interface Product {
  id: string
  sku: string
  productCode: string
  name: string
  category: string
  subcategory?: string
  brand?: string
  description?: string
  productType?: string
  barcode?: string
  uom: string
  purchaseUom?: string
  salesUom?: string
  conversionFactor?: number
  safetyStock: number
  reorderPoint: number
  minimumStock?: number
  maximumStock?: number
  reorderQuantity?: number
  unitPrice: number
  purchasePrice?: number
  sellingPrice?: number
  taxCode?: string
  gstRate?: number
  hsnSac?: string
  status: 'Active' | 'Inactive' | 'Discontinued'
  perishable: boolean
  batchTracking: boolean
  expiryTracking: boolean
  serialTracking: boolean
  allocationMethod: AllocationMethod
  shelfLifeDays?: number
  minShelfLifeReceiving?: number
  minShelfLifeDispatch?: number
  nearExpiryThresholdDays?: number
  storageType?: string
  temperatureControlled?: boolean
  minTemperature?: number
  maxTemperature?: number
  handlingInstructions?: string
  defaultVendorId?: string
  vendorSku?: string
  vendorPrice?: number
}

export interface InventoryBalance {
  id: string
  sku: string
  product: string
  productId: string
  warehouseId: string
  warehouse: string
  zoneId: string
  zone: string
  rackId: string
  rack: string
  shelfId: string
  shelf: string
  binId: string
  bin: string
  batchId: string
  batch: string
  available: number
  reserved: number
  locked: number
  qcHold: number
  putawayPending: number
  damaged: number
  expired: number
  inTransit: number
  dispatchReady: number
  wastage: number
  qcRejected: number
  returnQcHold: number
  quarantine: number
  status: 'Available' | 'Low Stock' | 'QC Hold' | 'Expired' | 'Damaged' | 'Putaway Pending'
  expiry: string
  mfgDate: string
}

export type InventoryItem = InventoryBalance

export interface Batch {
  id: string
  batchNo: string
  vendorBatchNo?: string
  sku: string
  productId: string
  product: string
  warehouseId: string
  warehouse: string
  qty: number
  mfgDate: string
  expiry: string
  receivedDate: string
  vendorId?: string
  vendor: string
  poId?: string
  grnId?: string
  qcStatus: QcResult
  status: 'Active' | 'Near Expiry' | 'Expired' | 'Quarantine'
}

export interface PurchaseOrderItem {
  id: string
  sku: string
  productId: string
  product: string
  vendorSku?: string
  uom: string
  orderedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  pendingQty: number
  unitPrice: number
  discount?: number
  taxPercent?: number
  taxAmount?: number
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
  orderDate: string
  expectedDelivery: string
  status: PoStatus
  currency: string
  paymentTerms?: string
  buyer?: string
  priority: Priority
  referenceNumber?: string
  shippingTerms?: string
  instructions?: string
  notes?: string
  amount: number
  subtotal: number
  discountTotal: number
  taxTotal: number
  freight: number
  otherCharges: number
  itemCount: number
  createdAt: string
  createdBy: string
  updatedAt?: string
  items: PurchaseOrderItem[]
  zohoStatus: ZohoStatus
  externalPoId?: string
  lastZohoSyncAt?: string
  zohoSyncError?: string
  zohoRetryCount?: number
}

export interface ReceivingLine {
  id: string
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
  damagedQty: number
  shortQty: number
  excessQty: number
  remarks?: string
  batchId?: string
}

export interface ReceivingRecord {
  id: string
  receivingNumber: string
  grnNumber: string
  poId: string
  poNumber: string
  vendorId: string
  vendor: string
  warehouseId: string
  warehouse: string
  receiptAt: string
  vendorInvoiceNumber?: string
  vendorChallanNumber?: string
  vehicleNumber?: string
  dock?: string
  notes?: string
  expectedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  status: 'In Progress' | 'Completed' | 'Partial' | 'Pending'
  receivedAt: string
  receivedBy: string
  lines: ReceivingLine[]
  grnId?: string
}

export interface GrnLine {
  id: string
  sku: string
  product: string
  batchId: string
  batchNo: string
  orderedQty: number
  receivedQty: number
  acceptedQty: number
  rejectedQty: number
  uom: string
  mfgDate: string
  expiryDate: string
  temperature?: number
  qcStatus: QcResult
}

export interface GrnRecord {
  id: string
  grnNumber: string
  receivingId: string
  receivingNumber: string
  poId: string
  poNumber: string
  vendorId: string
  vendor: string
  warehouseId: string
  warehouse: string
  receiptDate: string
  invoiceNumber?: string
  challanNumber?: string
  totalReceived: number
  totalAccepted: number
  totalRejected: number
  qcStatus: QcResult
  status: 'Open' | 'QC Pending' | 'QC Complete' | 'Closed'
  lines: GrnLine[]
  receivedBy: string
}

export interface QcInspection {
  id: string
  qcNumber: string
  sourceType: QcSourceType
  sourceId: string
  reference: string
  product: string
  productId: string
  sku: string
  batchId: string
  batch: string
  receivedQty: number
  inspectedQty: number
  sampleQty?: number
  acceptedQty: number
  rejectedQty: number
  temperature?: number
  packagingCondition?: string
  visualInspection?: string
  qualityParameters?: string
  reason: string
  status: 'Pending' | 'In Progress' | 'Passed' | 'Failed' | 'Partial' | 'RTV'
  qcResult: QcResult
  rejectionDisposition?: 'RTV' | 'DAMAGED' | 'WASTAGE' | 'QUARANTINE'
  warehouseId: string
  warehouse: string
  inspector: string
  inspectedAt: string
  remarks?: string
}

export interface PutAwayTask {
  id: string
  taskNumber: string
  sourceType: 'GRN' | 'RETURN'
  sourceId: string
  product: string
  productId: string
  sku: string
  batchId: string
  batch: string
  quantity: number
  currentLocation: string
  sourceLocationId?: string
  warehouseId: string
  warehouse: string
  suggestedBinId?: string
  suggestedLocation: string
  destinationBinId?: string
  destinationBin: string
  assignedTo: string
  priority: Priority
  status: 'Queued' | 'In Progress' | 'Completed'
}

export interface Customer {
  id: string
  name: string
  code: string
  contact: string
  email: string
  phone: string
  city: string
  customerType: 'B2B' | 'B2C'
  b2bSubtype?: 'WHOLESALE' | 'DISTRIBUTOR' | 'CORPORATE'
  type: 'Retail' | 'Wholesale' | 'Distributor'
  status: 'Active' | 'Inactive' | 'Blocked'
  creditLimit: number
  creditDays?: number
  paymentTerms?: string
  gstin?: string
  pan?: string
  companyName?: string
  billingAddress?: Address
  shippingAddress?: Address
  preferredWarehouseId?: string
  deliveryPriority?: Priority
  minRemainingShelfLifeDays?: number
}

export interface SalesOrderItem {
  id: string
  sku: string
  productId: string
  product: string
  uom: string
  orderedQty: number
  reservedQty: number
  pickedQty: number
  packedQty: number
  dispatchedQty: number
  deliveredQty: number
  backorderedQty: number
  cancelledQty: number
  unitPrice: number
  discount?: number
  taxPercent?: number
  total: number
  batch?: string
  status: 'Pending' | 'Reserved' | 'Partially Reserved' | 'Picked' | 'Packed' | 'Dispatched' | 'Backordered'
}

export interface SalesOrder {
  id: string
  soNumber: string
  customerId: string
  customer: string
  customerType: 'B2B' | 'B2C'
  warehouseId: string
  warehouse: string
  allowMultiWarehouse: boolean
  status: SoStatus
  amount: number
  subtotal: number
  discountTotal: number
  taxTotal: number
  shipping: number
  itemCount: number
  orderDate: string
  deliveryDate: string
  paymentTerms?: string
  shippingMethod?: string
  priority: Priority
  customerReference?: string
  externalOrderId?: string
  shippingAddress?: Address
  billingAddress?: Address
  notes?: string
  internalNotes?: string
  items: SalesOrderItem[]
  createdBy: string
  createdAt: string
}

export interface Reservation {
  id: string
  soId: string
  soNumber: string
  soLineId: string
  sku: string
  productId: string
  warehouseId: string
  quantity: number
  strategy: AllocationMethod
  status: ReservationStatus
  createdAt: string
  expiresAt?: string
}

export interface ReservationAllocation {
  id: string
  reservationId: string
  soId: string
  soLineId: string
  sku: string
  warehouseId: string
  binId: string
  batchId: string
  batchNo: string
  expiry: string
  allocatedQty: number
  consumedQty: number
  strategy: AllocationMethod
  status: ReservationStatus
}

export interface InventoryLock {
  id: string
  sku: string
  batchId: string
  warehouseId: string
  binId: string
  quantity: number
  referenceType: string
  referenceId: string
  user: string
  createdAt: string
  expiresAt: string
  status: LockStatus
}

export interface PicklistLine {
  id: string
  picklistId: string
  soLineId: string
  reservationAllocationId: string
  sku: string
  product: string
  batchId: string
  batchNo: string
  expiry: string
  warehouseId: string
  warehouse: string
  zone: string
  rack: string
  shelf: string
  binId: string
  bin: string
  requiredQty: number
  pickedQty: number
  barcode?: string
  status: 'Open' | 'In Progress' | 'Picked' | 'Short' | 'Cancelled'
  sequence: number
}

export interface Picklist {
  id: string
  picklistNo: string
  soId: string
  soNumber: string
  warehouseId: string
  warehouse: string
  items: number
  picked: number
  status: 'Open' | 'In Progress' | 'Completed' | 'Cancelled'
  assignedTo: string
  priority: Priority
  createdAt: string
  lines: PicklistLine[]
}

export interface PackingLine {
  id: string
  sku: string
  batchId: string
  batchNo: string
  quantity: number
  packageNumber: number
}

export interface PackingRecord {
  id: string
  packingNumber: string
  soId: string
  soNumber: string
  warehouseId: string
  warehouse: string
  shipmentId?: string
  packedBy: string
  packingDate: string
  packageCount: number
  totalWeight?: number
  dimensions?: string
  packagingType?: string
  remarks?: string
  status: 'Open' | 'Packing' | 'Packed'
  lines: PackingLine[]
}

export interface DispatchLine {
  id: string
  sku: string
  batchId: string
  batchNo: string
  quantity: number
  picklistLineId?: string
}

export interface DispatchRecord {
  id: string
  dispatchNo: string
  soId: string
  soNumber: string
  customerId: string
  customer: string
  warehouseId: string
  warehouse: string
  picklistId?: string
  packingId?: string
  shipmentId?: string
  items: number
  status: 'Queued' | 'Verifying' | 'Ready' | 'Handed Over' | 'In Transit' | 'Delivered'
  vehicle: string
  driver: string
  driverPhone?: string
  carrier?: string
  trackingNumber?: string
  packageCount?: number
  weight?: number
  shippingMethod?: string
  notes?: string
  dispatchedAt: string
  lines: DispatchLine[]
}

export interface ReturnLine {
  id: string
  sku: string
  productId: string
  product: string
  originalBatchId?: string
  originalBatch: string
  originalExpiry?: string
  originallyDispatchedQty: number
  returnQty: number
  condition?: string
  reason: string
  reusableQty: number
  damagedQty: number
  wastageQty: number
}

export interface ReturnRecord {
  id: string
  returnNo: string
  soId: string
  soNumber: string
  dispatchId?: string
  dispatchNumber?: string
  customerId: string
  customer: string
  warehouseId: string
  warehouse: string
  sku: string
  product: string
  batch: string
  returnedQty: number
  reusableQty: number
  damagedQty: number
  wastageQty: number
  qcResult: QcResult
  status: 'Open' | 'QC' | 'Decision Pending' | 'Closed'
  reason: string
  createdAt: string
  lines: ReturnLine[]
}

export interface Task {
  id: string
  taskNumber: string
  title: string
  type: 'Receiving' | 'QC' | 'Put-Away' | 'Picking' | 'Packing' | 'Dispatch' | 'Audit' | 'Return QC' | 'General'
  referenceType?: string
  referenceId?: string
  warehouseId?: string
  warehouse: string
  location: string
  priority: Priority
  status: TaskStatus
  due: string
  assignedTo: string
  createdBy: string
  createdAt: string
  completedAt?: string
  description: string
  concern?: string
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
  severity?: 'low' | 'medium' | 'high'
  referenceType?: string
  referenceId?: string
  read: boolean
  createdAt: string
}

export interface StockMovement {
  id: string
  movementId: string
  timestamp: string
  movementType: MovementType
  type: 'Inbound' | 'Outbound' | 'Transfer' | 'Adjustment' | 'Return'
  sku: string
  product: string
  productId: string
  batchId: string
  batch: string
  warehouseId: string
  qty: number
  fromLocation: string
  toLocation: string
  fromStatus: InventoryBucket | ''
  toStatus: InventoryBucket | ''
  referenceType: string
  referenceId: string
  reference: string
  performedBy: string
  performedAt: string
  reason?: string
  notes?: string
}

export interface AuditRecord {
  id: string
  auditNo: string
  warehouseId: string
  warehouse: string
  zone: string
  status: 'Scheduled' | 'In Progress' | 'Completed' | 'Variance' | 'Approved' | 'Closed'
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
  batchId?: string
  qty: number
  reason: string
  warehouseId?: string
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
  poId?: string
  direction: 'Push' | 'Pull'
  status: 'Synced' | 'Pending' | 'Failed' | 'Not Synced'
  message: string
  syncedAt: string
  attempts: number
  error?: string
}
