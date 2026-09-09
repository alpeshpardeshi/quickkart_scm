import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as seed from '../data/mock'
import type {
  Vendor, Warehouse, Product, InventoryItem, Batch, PurchaseOrder,
  ReceivingRecord, QcInspection, PutAwayTask, Customer, SalesOrder,
  Picklist, DispatchRecord, ReturnRecord, Task, AppUser, Role,
  NotificationItem, StockMovement, AuditRecord, WastageRecord,
  ApprovalHistoryItem, ZohoSyncRecord,
} from '../types'

interface DataContextValue {
  vendors: Vendor[]
  setVendors: React.Dispatch<React.SetStateAction<Vendor[]>>
  warehouses: Warehouse[]
  setWarehouses: React.Dispatch<React.SetStateAction<Warehouse[]>>
  products: Product[]
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>
  inventory: InventoryItem[]
  setInventory: React.Dispatch<React.SetStateAction<InventoryItem[]>>
  batches: Batch[]
  setBatches: React.Dispatch<React.SetStateAction<Batch[]>>
  purchaseOrders: PurchaseOrder[]
  setPurchaseOrders: React.Dispatch<React.SetStateAction<PurchaseOrder[]>>
  receiving: ReceivingRecord[]
  setReceiving: React.Dispatch<React.SetStateAction<ReceivingRecord[]>>
  qcInspections: QcInspection[]
  setQcInspections: React.Dispatch<React.SetStateAction<QcInspection[]>>
  putAwayTasks: PutAwayTask[]
  setPutAwayTasks: React.Dispatch<React.SetStateAction<PutAwayTask[]>>
  customers: Customer[]
  setCustomers: React.Dispatch<React.SetStateAction<Customer[]>>
  salesOrders: SalesOrder[]
  setSalesOrders: React.Dispatch<React.SetStateAction<SalesOrder[]>>
  picklists: Picklist[]
  setPicklists: React.Dispatch<React.SetStateAction<Picklist[]>>
  dispatches: DispatchRecord[]
  setDispatches: React.Dispatch<React.SetStateAction<DispatchRecord[]>>
  returns: ReturnRecord[]
  setReturns: React.Dispatch<React.SetStateAction<ReturnRecord[]>>
  tasks: Task[]
  setTasks: React.Dispatch<React.SetStateAction<Task[]>>
  users: AppUser[]
  setUsers: React.Dispatch<React.SetStateAction<AppUser[]>>
  roles: Role[]
  setRoles: React.Dispatch<React.SetStateAction<Role[]>>
  notifications: NotificationItem[]
  setNotifications: React.Dispatch<React.SetStateAction<NotificationItem[]>>
  movements: StockMovement[]
  setMovements: React.Dispatch<React.SetStateAction<StockMovement[]>>
  audits: AuditRecord[]
  setAudits: React.Dispatch<React.SetStateAction<AuditRecord[]>>
  wastage: WastageRecord[]
  setWastage: React.Dispatch<React.SetStateAction<WastageRecord[]>>
  approvalHistory: ApprovalHistoryItem[]
  setApprovalHistory: React.Dispatch<React.SetStateAction<ApprovalHistoryItem[]>>
  zohoSyncHistory: ZohoSyncRecord[]
  setZohoSyncHistory: React.Dispatch<React.SetStateAction<ZohoSyncRecord[]>>
  permissionMatrix: typeof seed.permissionMatrix
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [vendors, setVendors] = useState(seed.vendors)
  const [warehouses, setWarehouses] = useState(seed.warehouses)
  const [products, setProducts] = useState(seed.products)
  const [inventory, setInventory] = useState(seed.inventory)
  const [batches, setBatches] = useState(seed.batches)
  const [purchaseOrders, setPurchaseOrders] = useState(seed.purchaseOrders)
  const [receiving, setReceiving] = useState(seed.receiving)
  const [qcInspections, setQcInspections] = useState(seed.qcInspections)
  const [putAwayTasks, setPutAwayTasks] = useState(seed.putAwayTasks)
  const [customers, setCustomers] = useState(seed.customers)
  const [salesOrders, setSalesOrders] = useState(seed.salesOrders)
  const [picklists, setPicklists] = useState(seed.picklists)
  const [dispatches, setDispatches] = useState(seed.dispatches)
  const [returns, setReturns] = useState(seed.returns)
  const [tasks, setTasks] = useState(seed.tasks)
  const [users, setUsers] = useState(seed.users)
  const [roles, setRoles] = useState(seed.roles)
  const [notifications, setNotifications] = useState(seed.notifications)
  const [movements, setMovements] = useState(seed.movements)
  const [audits, setAudits] = useState(seed.audits)
  const [wastage, setWastage] = useState(seed.wastage)
  const [approvalHistory, setApprovalHistory] = useState(seed.approvalHistory)
  const [zohoSyncHistory, setZohoSyncHistory] = useState(seed.zohoSyncHistory)

  const markNotificationRead = useCallback((id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)))
  }, [])

  const markAllNotificationsRead = useCallback(() => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })))
  }, [])

  const value = useMemo(
    () => ({
      vendors, setVendors,
      warehouses, setWarehouses,
      products, setProducts,
      inventory, setInventory,
      batches, setBatches,
      purchaseOrders, setPurchaseOrders,
      receiving, setReceiving,
      qcInspections, setQcInspections,
      putAwayTasks, setPutAwayTasks,
      customers, setCustomers,
      salesOrders, setSalesOrders,
      picklists, setPicklists,
      dispatches, setDispatches,
      returns, setReturns,
      tasks, setTasks,
      users, setUsers,
      roles, setRoles,
      notifications, setNotifications,
      movements, setMovements,
      audits, setAudits,
      wastage, setWastage,
      approvalHistory, setApprovalHistory,
      zohoSyncHistory, setZohoSyncHistory,
      permissionMatrix: seed.permissionMatrix,
      markNotificationRead,
      markAllNotificationsRead,
    }),
    [
      vendors, warehouses, products, inventory, batches, purchaseOrders, receiving,
      qcInspections, putAwayTasks, customers, salesOrders, picklists, dispatches,
      returns, tasks, users, roles, notifications, movements, audits, wastage,
      approvalHistory, zohoSyncHistory, markNotificationRead, markAllNotificationsRead,
    ],
  )

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
