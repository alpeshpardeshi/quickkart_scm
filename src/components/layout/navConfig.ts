import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Truck, ClipboardCheck,
  Warehouse, Users, FileBarChart, Settings, Bell, ListTodo,
  Shield, ArrowLeftRight, AlertTriangle, Recycle, ScanLine,
  PackageCheck, PackageOpen, RotateCcw, UserRound, Store, Layers,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

export interface NavSection {
  title: string
  items: NavItem[]
}

export const NAV_SECTIONS: NavSection[] = [
  {
    title: 'Overview',
    items: [{ label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard }],
  },
  {
    title: 'Procurement',
    items: [
      { label: 'Purchase Orders', to: '/purchase-orders', icon: ShoppingCart },
      { label: 'Approvals', to: '/approvals', icon: ClipboardCheck },
      { label: 'Approval History', to: '/approval-history', icon: ListTodo },
      { label: 'Zoho Sync', to: '/zoho-sync', icon: ArrowLeftRight },
      { label: 'Vendors', to: '/vendors', icon: Store },
    ],
  },
  {
    title: 'Warehouse',
    items: [
      { label: 'Warehouses', to: '/warehouses', icon: Warehouse },
      { label: 'Receiving', to: '/receiving', icon: PackageOpen },
      { label: 'GRN', to: '/grn', icon: ClipboardCheck },
      { label: 'QC', to: '/qc', icon: ScanLine },
      { label: 'Put-Away', to: '/put-away', icon: PackageCheck },
    ],
  },
  {
    title: 'Inventory',
    items: [
      { label: 'Inv. Dashboard', to: '/inventory-dashboard', icon: LayoutDashboard },
      { label: 'Inventory', to: '/inventory', icon: Package },
      { label: 'Warehouse Stock', to: '/warehouse-inventory', icon: Warehouse },
      { label: 'Batches', to: '/batches', icon: Layers },
      { label: 'Expiry', to: '/expiry', icon: AlertTriangle },
      { label: 'Audits', to: '/audits', icon: ClipboardCheck },
      { label: 'Wastage', to: '/wastage', icon: Recycle },
      { label: 'Stock Movement', to: '/stock-movement', icon: ArrowLeftRight },
    ],
  },
  {
    title: 'Orders',
    items: [
      { label: 'Customers', to: '/customers', icon: Users },
      { label: 'Sales Orders', to: '/sales-orders', icon: ShoppingCart },
      { label: 'Reservations', to: '/reservations', icon: Boxes },
      { label: 'Picklists', to: '/picklists', icon: ListTodo },
      { label: 'My Picking', to: '/my-picking', icon: ScanLine },
      { label: 'Picking', to: '/picking', icon: ScanLine },
      { label: 'Dispatch', to: '/dispatch', icon: Truck },
      { label: 'Returns', to: '/returns', icon: RotateCcw },
    ],
  },
  {
    title: 'Operations',
    items: [
      { label: 'Tasks', to: '/tasks', icon: ListTodo },
      { label: 'Notifications', to: '/notifications', icon: Bell },
    ],
  },
  {
    title: 'Analytics',
    items: [{ label: 'Reports', to: '/reports', icon: FileBarChart }],
  },
  {
    title: 'Admin',
    items: [
      { label: 'Users', to: '/users', icon: UserRound },
      { label: 'Roles', to: '/roles', icon: Shield },
      { label: 'Settings', to: '/settings', icon: Settings },
    ],
  },
]

export const BOTTOM_NAV: { label: string; to: string; icon: LucideIcon; match?: string[] }[] = [
  { label: 'Dashboard', to: '/dashboard', icon: LayoutDashboard },
  {
    label: 'Orders',
    to: '/sales-orders',
    icon: ShoppingCart,
    match: ['/sales-orders', '/customers', '/reservations', '/picklists', '/my-picking', '/picking', '/dispatch', '/returns'],
  },
  { label: 'Tasks', to: '/tasks', icon: ListTodo, match: ['/tasks', '/notifications'] },
  {
    label: 'Inventory',
    to: '/inventory',
    icon: Package,
    match: [
      '/inventory',
      '/inventory-dashboard',
      '/warehouse-inventory',
      '/batches',
      '/expiry',
      '/near-expiry',
      '/expired',
      '/audits',
      '/wastage',
      '/stock-movement',
      '/stock-adjustment',
    ],
  },
]

export function isNavActive(pathname: string, to: string, match?: string[]) {
  if (match?.some((m) => pathname === m || pathname.startsWith(`${m}/`))) return true
  return pathname === to || pathname.startsWith(`${to}/`)
}

export function resolvePageTitle(pathname: string, breadcrumbs: { label: string }[]) {
  if (breadcrumbs.length) return breadcrumbs[breadcrumbs.length - 1].label
  const hit = NAV_SECTIONS.flatMap((s) => s.items).find(
    (i) => pathname === i.to || pathname.startsWith(`${i.to}/`),
  )
  return hit?.label || 'QuicKart'
}
