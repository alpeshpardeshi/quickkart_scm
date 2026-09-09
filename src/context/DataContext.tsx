import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'
import * as seed from '../data/mock'
import type { AppState } from '../services/appState'
import { approvePurchaseOrder, rejectPurchaseOrder, submitPurchaseOrder } from '../services/workflows/purchaseOrderService'
import { receiveAgainstPo, type ReceivePoInput } from '../services/workflows/receivingService'
import { performQc, type PerformQcInput } from '../services/workflows/qcService'
import { confirmPutAway, type ConfirmPutAwayInput } from '../services/workflows/putAwayService'
import { confirmSalesOrder, generatePicklistForSo, releaseReservation } from '../services/workflows/reservationService'
import { confirmPickLine, type ConfirmPickLineInput } from '../services/workflows/pickingService'
import {
  advanceShipmentStatus,
  createAndHandoverDispatch,
  createPacking,
  type HandoverDispatchInput,
} from '../services/workflows/dispatchService'
import { createReturn, processReturnQc, type CreateReturnInput, type ProcessReturnQcInput } from '../services/workflows/returnService'
import { calculateATP } from '../services/inventory/atpService'
import type { Product, SalesOrder } from '../types'

function buildInitialState(): AppState {
  return {
    vendors: seed.vendors,
    vendorProducts: seed.vendorProducts,
    warehouses: seed.warehouses,
    zones: seed.zones,
    racks: seed.racks,
    shelves: seed.shelves,
    bins: seed.bins,
    products: seed.products,
    inventory: seed.inventory,
    batches: seed.batches,
    purchaseOrders: seed.purchaseOrders,
    receiving: seed.receiving,
    grns: seed.grns,
    qcInspections: seed.qcInspections,
    putAwayTasks: seed.putAwayTasks,
    customers: seed.customers,
    salesOrders: seed.salesOrders,
    reservations: seed.reservations,
    reservationAllocations: seed.reservationAllocations,
    locks: seed.locks,
    picklists: seed.picklists,
    packings: seed.packings,
    dispatches: seed.dispatches,
    returns: seed.returns,
    tasks: seed.tasks,
    users: seed.users,
    roles: seed.roles,
    notifications: seed.notifications,
    movements: seed.movements,
    audits: seed.audits,
    wastage: seed.wastage,
    approvalHistory: seed.approvalHistory,
    zohoSyncHistory: seed.zohoSyncHistory,
  }
}

interface DataContextValue extends AppState {
  setVendors: React.Dispatch<React.SetStateAction<AppState['vendors']>>
  setWarehouses: React.Dispatch<React.SetStateAction<AppState['warehouses']>>
  setProducts: React.Dispatch<React.SetStateAction<AppState['products']>>
  setInventory: React.Dispatch<React.SetStateAction<AppState['inventory']>>
  setBatches: React.Dispatch<React.SetStateAction<AppState['batches']>>
  setPurchaseOrders: React.Dispatch<React.SetStateAction<AppState['purchaseOrders']>>
  setReceiving: React.Dispatch<React.SetStateAction<AppState['receiving']>>
  setQcInspections: React.Dispatch<React.SetStateAction<AppState['qcInspections']>>
  setPutAwayTasks: React.Dispatch<React.SetStateAction<AppState['putAwayTasks']>>
  setCustomers: React.Dispatch<React.SetStateAction<AppState['customers']>>
  setSalesOrders: React.Dispatch<React.SetStateAction<AppState['salesOrders']>>
  setPicklists: React.Dispatch<React.SetStateAction<AppState['picklists']>>
  setDispatches: React.Dispatch<React.SetStateAction<AppState['dispatches']>>
  setReturns: React.Dispatch<React.SetStateAction<AppState['returns']>>
  setTasks: React.Dispatch<React.SetStateAction<AppState['tasks']>>
  setUsers: React.Dispatch<React.SetStateAction<AppState['users']>>
  setRoles: React.Dispatch<React.SetStateAction<AppState['roles']>>
  setNotifications: React.Dispatch<React.SetStateAction<AppState['notifications']>>
  setMovements: React.Dispatch<React.SetStateAction<AppState['movements']>>
  setAudits: React.Dispatch<React.SetStateAction<AppState['audits']>>
  setWastage: React.Dispatch<React.SetStateAction<AppState['wastage']>>
  setApprovalHistory: React.Dispatch<React.SetStateAction<AppState['approvalHistory']>>
  setZohoSyncHistory: React.Dispatch<React.SetStateAction<AppState['zohoSyncHistory']>>
  setZones: React.Dispatch<React.SetStateAction<AppState['zones']>>
  setRacks: React.Dispatch<React.SetStateAction<AppState['racks']>>
  setShelves: React.Dispatch<React.SetStateAction<AppState['shelves']>>
  setBins: React.Dispatch<React.SetStateAction<AppState['bins']>>
  setGrns: React.Dispatch<React.SetStateAction<AppState['grns']>>
  setReservations: React.Dispatch<React.SetStateAction<AppState['reservations']>>
  setReservationAllocations: React.Dispatch<React.SetStateAction<AppState['reservationAllocations']>>
  setLocks: React.Dispatch<React.SetStateAction<AppState['locks']>>
  setPackings: React.Dispatch<React.SetStateAction<AppState['packings']>>
  setVendorProducts: React.Dispatch<React.SetStateAction<AppState['vendorProducts']>>
  permissionMatrix: typeof seed.permissionMatrix
  markNotificationRead: (id: string) => void
  markAllNotificationsRead: () => void
  /** Domain services */
  applyState: (next: AppState) => void
  getAtp: (sku: string, warehouseId?: string, product?: Product) => number
  svcSubmitPo: (poId: string, actedBy: string) => void
  svcApprovePo: (poId: string, actedBy: string, notes?: string) => void
  svcRejectPo: (poId: string, actedBy: string, notes?: string) => void
  svcReceivePo: (input: ReceivePoInput) => void
  svcPerformQc: (input: PerformQcInput) => void
  svcConfirmPutAway: (input: ConfirmPutAwayInput) => void
  svcConfirmSalesOrder: (soId: string, performedBy: string) => void
  svcAddSalesOrder: (order: SalesOrder) => void
  svcAddAndConfirmSalesOrder: (order: SalesOrder, performedBy: string) => void
  svcGeneratePicklist: (soId: string, performedBy: string) => void
  svcReleaseReservation: (reservationId: string, performedBy: string) => void
  svcConfirmPickLine: (input: ConfirmPickLineInput) => void
  svcCreatePacking: (soId: string, packedBy: string) => void
  svcHandoverDispatch: (input: HandoverDispatchInput) => void
  svcAdvanceShipment: (dispatchId: string, status: 'In Transit' | 'Delivered' | 'Handed Over' | 'Ready') => void
  svcCreateReturn: (input: CreateReturnInput) => void
  svcProcessReturnQc: (input: ProcessReturnQcInput) => void
}

const DataContext = createContext<DataContextValue | null>(null)

export function DataProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<AppState>(buildInitialState)

  const applyState = useCallback((next: AppState) => setState(next), [])

  const run = useCallback((fn: (s: AppState) => AppState) => {
    let caught: Error | null = null
    setState((prev) => {
      try {
        return fn(prev)
      } catch (e) {
        caught = e instanceof Error ? e : new Error(String(e))
        return prev
      }
    })
    if (caught) throw caught
  }, [])

  const setVendors = useCallback((u: React.SetStateAction<AppState['vendors']>) => {
    setState((s) => ({ ...s, vendors: typeof u === 'function' ? u(s.vendors) : u }))
  }, [])
  const setWarehouses = useCallback((u: React.SetStateAction<AppState['warehouses']>) => {
    setState((s) => ({ ...s, warehouses: typeof u === 'function' ? u(s.warehouses) : u }))
  }, [])
  const setProducts = useCallback((u: React.SetStateAction<AppState['products']>) => {
    setState((s) => ({ ...s, products: typeof u === 'function' ? u(s.products) : u }))
  }, [])
  const setInventory = useCallback((u: React.SetStateAction<AppState['inventory']>) => {
    setState((s) => ({ ...s, inventory: typeof u === 'function' ? u(s.inventory) : u }))
  }, [])
  const setBatches = useCallback((u: React.SetStateAction<AppState['batches']>) => {
    setState((s) => ({ ...s, batches: typeof u === 'function' ? u(s.batches) : u }))
  }, [])
  const setPurchaseOrders = useCallback((u: React.SetStateAction<AppState['purchaseOrders']>) => {
    setState((s) => ({ ...s, purchaseOrders: typeof u === 'function' ? u(s.purchaseOrders) : u }))
  }, [])
  const setReceiving = useCallback((u: React.SetStateAction<AppState['receiving']>) => {
    setState((s) => ({ ...s, receiving: typeof u === 'function' ? u(s.receiving) : u }))
  }, [])
  const setQcInspections = useCallback((u: React.SetStateAction<AppState['qcInspections']>) => {
    setState((s) => ({ ...s, qcInspections: typeof u === 'function' ? u(s.qcInspections) : u }))
  }, [])
  const setPutAwayTasks = useCallback((u: React.SetStateAction<AppState['putAwayTasks']>) => {
    setState((s) => ({ ...s, putAwayTasks: typeof u === 'function' ? u(s.putAwayTasks) : u }))
  }, [])
  const setCustomers = useCallback((u: React.SetStateAction<AppState['customers']>) => {
    setState((s) => ({ ...s, customers: typeof u === 'function' ? u(s.customers) : u }))
  }, [])
  const setSalesOrders = useCallback((u: React.SetStateAction<AppState['salesOrders']>) => {
    setState((s) => ({ ...s, salesOrders: typeof u === 'function' ? u(s.salesOrders) : u }))
  }, [])
  const setPicklists = useCallback((u: React.SetStateAction<AppState['picklists']>) => {
    setState((s) => ({ ...s, picklists: typeof u === 'function' ? u(s.picklists) : u }))
  }, [])
  const setDispatches = useCallback((u: React.SetStateAction<AppState['dispatches']>) => {
    setState((s) => ({ ...s, dispatches: typeof u === 'function' ? u(s.dispatches) : u }))
  }, [])
  const setReturns = useCallback((u: React.SetStateAction<AppState['returns']>) => {
    setState((s) => ({ ...s, returns: typeof u === 'function' ? u(s.returns) : u }))
  }, [])
  const setTasks = useCallback((u: React.SetStateAction<AppState['tasks']>) => {
    setState((s) => ({ ...s, tasks: typeof u === 'function' ? u(s.tasks) : u }))
  }, [])
  const setUsers = useCallback((u: React.SetStateAction<AppState['users']>) => {
    setState((s) => ({ ...s, users: typeof u === 'function' ? u(s.users) : u }))
  }, [])
  const setRoles = useCallback((u: React.SetStateAction<AppState['roles']>) => {
    setState((s) => ({ ...s, roles: typeof u === 'function' ? u(s.roles) : u }))
  }, [])
  const setNotifications = useCallback((u: React.SetStateAction<AppState['notifications']>) => {
    setState((s) => ({ ...s, notifications: typeof u === 'function' ? u(s.notifications) : u }))
  }, [])
  const setMovements = useCallback((u: React.SetStateAction<AppState['movements']>) => {
    setState((s) => ({ ...s, movements: typeof u === 'function' ? u(s.movements) : u }))
  }, [])
  const setAudits = useCallback((u: React.SetStateAction<AppState['audits']>) => {
    setState((s) => ({ ...s, audits: typeof u === 'function' ? u(s.audits) : u }))
  }, [])
  const setWastage = useCallback((u: React.SetStateAction<AppState['wastage']>) => {
    setState((s) => ({ ...s, wastage: typeof u === 'function' ? u(s.wastage) : u }))
  }, [])
  const setApprovalHistory = useCallback((u: React.SetStateAction<AppState['approvalHistory']>) => {
    setState((s) => ({ ...s, approvalHistory: typeof u === 'function' ? u(s.approvalHistory) : u }))
  }, [])
  const setZohoSyncHistory = useCallback((u: React.SetStateAction<AppState['zohoSyncHistory']>) => {
    setState((s) => ({ ...s, zohoSyncHistory: typeof u === 'function' ? u(s.zohoSyncHistory) : u }))
  }, [])
  const setZones = useCallback((u: React.SetStateAction<AppState['zones']>) => {
    setState((s) => ({ ...s, zones: typeof u === 'function' ? u(s.zones) : u }))
  }, [])
  const setRacks = useCallback((u: React.SetStateAction<AppState['racks']>) => {
    setState((s) => ({ ...s, racks: typeof u === 'function' ? u(s.racks) : u }))
  }, [])
  const setShelves = useCallback((u: React.SetStateAction<AppState['shelves']>) => {
    setState((s) => ({ ...s, shelves: typeof u === 'function' ? u(s.shelves) : u }))
  }, [])
  const setBins = useCallback((u: React.SetStateAction<AppState['bins']>) => {
    setState((s) => ({ ...s, bins: typeof u === 'function' ? u(s.bins) : u }))
  }, [])
  const setGrns = useCallback((u: React.SetStateAction<AppState['grns']>) => {
    setState((s) => ({ ...s, grns: typeof u === 'function' ? u(s.grns) : u }))
  }, [])
  const setReservations = useCallback((u: React.SetStateAction<AppState['reservations']>) => {
    setState((s) => ({ ...s, reservations: typeof u === 'function' ? u(s.reservations) : u }))
  }, [])
  const setReservationAllocations = useCallback((u: React.SetStateAction<AppState['reservationAllocations']>) => {
    setState((s) => ({ ...s, reservationAllocations: typeof u === 'function' ? u(s.reservationAllocations) : u }))
  }, [])
  const setLocks = useCallback((u: React.SetStateAction<AppState['locks']>) => {
    setState((s) => ({ ...s, locks: typeof u === 'function' ? u(s.locks) : u }))
  }, [])
  const setPackings = useCallback((u: React.SetStateAction<AppState['packings']>) => {
    setState((s) => ({ ...s, packings: typeof u === 'function' ? u(s.packings) : u }))
  }, [])
  const setVendorProducts = useCallback((u: React.SetStateAction<AppState['vendorProducts']>) => {
    setState((s) => ({ ...s, vendorProducts: typeof u === 'function' ? u(s.vendorProducts) : u }))
  }, [])

  const markNotificationRead = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => (n.id === id ? { ...n, read: true } : n)),
    }))
  }, [])
  const markAllNotificationsRead = useCallback(() => {
    setState((s) => ({
      ...s,
      notifications: s.notifications.map((n) => ({ ...n, read: true })),
    }))
  }, [])

  const getAtp = useCallback((sku: string, warehouseId?: string, product?: Product) => {
    return calculateATP(state.inventory, state.bins, { sku, warehouseId, product })
  }, [state.inventory, state.bins])

  const value = useMemo<DataContextValue>(() => ({
    ...state,
    setVendors, setWarehouses, setProducts, setInventory, setBatches,
    setPurchaseOrders, setReceiving, setQcInspections, setPutAwayTasks,
    setCustomers, setSalesOrders, setPicklists, setDispatches, setReturns,
    setTasks, setUsers, setRoles, setNotifications, setMovements, setAudits,
    setWastage, setApprovalHistory, setZohoSyncHistory,
    setZones, setRacks, setShelves, setBins, setGrns, setReservations,
    setReservationAllocations, setLocks, setPackings, setVendorProducts,
    permissionMatrix: seed.permissionMatrix,
    markNotificationRead, markAllNotificationsRead,
    applyState,
    getAtp,
    svcSubmitPo: (poId, actedBy) => run((s) => submitPurchaseOrder(s, poId, actedBy)),
    svcApprovePo: (poId, actedBy, notes) => run((s) => approvePurchaseOrder(s, poId, actedBy, notes)),
    svcRejectPo: (poId, actedBy, notes) => run((s) => rejectPurchaseOrder(s, poId, actedBy, notes)),
    svcReceivePo: (input) => run((s) => receiveAgainstPo(s, input)),
    svcPerformQc: (input) => run((s) => performQc(s, input)),
    svcConfirmPutAway: (input) => run((s) => confirmPutAway(s, input)),
    svcConfirmSalesOrder: (soId, performedBy) => run((s) => confirmSalesOrder(s, soId, performedBy)),
    svcAddSalesOrder: (order) => run((s) => ({ ...s, salesOrders: [order, ...s.salesOrders] })),
    svcAddAndConfirmSalesOrder: (order, performedBy) => run((s) => {
      const withOrder = { ...s, salesOrders: [order, ...s.salesOrders] }
      return confirmSalesOrder(withOrder, order.id, performedBy)
    }),
    svcGeneratePicklist: (soId, performedBy) => run((s) => generatePicklistForSo(s, soId, performedBy)),
    svcReleaseReservation: (reservationId, performedBy) => run((s) => releaseReservation(s, reservationId, performedBy)),
    svcConfirmPickLine: (input) => run((s) => confirmPickLine(s, input)),
    svcCreatePacking: (soId, packedBy) => run((s) => createPacking(s, soId, packedBy)),
    svcHandoverDispatch: (input) => run((s) => createAndHandoverDispatch(s, input)),
    svcAdvanceShipment: (dispatchId, status) => run((s) => advanceShipmentStatus(s, dispatchId, status)),
    svcCreateReturn: (input) => run((s) => createReturn(s, input)),
    svcProcessReturnQc: (input) => run((s) => processReturnQc(s, input)),
  }), [state, run, applyState, getAtp, markNotificationRead, markAllNotificationsRead,
    setVendors, setWarehouses, setProducts, setInventory, setBatches, setPurchaseOrders,
    setReceiving, setQcInspections, setPutAwayTasks, setCustomers, setSalesOrders,
    setPicklists, setDispatches, setReturns, setTasks, setUsers, setRoles, setNotifications,
    setMovements, setAudits, setWastage, setApprovalHistory, setZohoSyncHistory,
    setZones, setRacks, setShelves, setBins, setGrns, setReservations,
    setReservationAllocations, setLocks, setPackings, setVendorProducts])

  return <DataContext.Provider value={value}>{children}</DataContext.Provider>
}

export function useData() {
  const ctx = useContext(DataContext)
  if (!ctx) throw new Error('useData must be used within DataProvider')
  return ctx
}
