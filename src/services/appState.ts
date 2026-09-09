import type {
  AppUser,
  ApprovalHistoryItem,
  AuditRecord,
  Batch,
  Bin,
  Customer,
  DispatchRecord,
  GrnRecord,
  InventoryBalance,
  InventoryLock,
  NotificationItem,
  PackingRecord,
  Picklist,
  Product,
  PurchaseOrder,
  PutAwayTask,
  QcInspection,
  Rack,
  ReceivingRecord,
  Reservation,
  ReservationAllocation,
  ReturnRecord,
  Role,
  SalesOrder,
  Shelf,
  StockMovement,
  Task,
  Vendor,
  VendorProduct,
  Warehouse,
  WastageRecord,
  Zone,
  ZohoSyncRecord,
} from '../types'

export interface AppState {
  vendors: Vendor[]
  vendorProducts: VendorProduct[]
  warehouses: Warehouse[]
  zones: Zone[]
  racks: Rack[]
  shelves: Shelf[]
  bins: Bin[]
  products: Product[]
  inventory: InventoryBalance[]
  batches: Batch[]
  purchaseOrders: PurchaseOrder[]
  receiving: ReceivingRecord[]
  grns: GrnRecord[]
  qcInspections: QcInspection[]
  putAwayTasks: PutAwayTask[]
  customers: Customer[]
  salesOrders: SalesOrder[]
  reservations: Reservation[]
  reservationAllocations: ReservationAllocation[]
  locks: InventoryLock[]
  picklists: Picklist[]
  packings: PackingRecord[]
  dispatches: DispatchRecord[]
  returns: ReturnRecord[]
  tasks: Task[]
  users: AppUser[]
  roles: Role[]
  notifications: NotificationItem[]
  movements: StockMovement[]
  audits: AuditRecord[]
  wastage: WastageRecord[]
  approvalHistory: ApprovalHistoryItem[]
  zohoSyncHistory: ZohoSyncRecord[]
}

export const BUSINESS_DATE = '2026-09-09'
