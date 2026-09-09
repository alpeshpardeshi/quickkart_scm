import { NavLink, useLocation } from 'react-router-dom'
import {
  LayoutDashboard, Package, Boxes, ShoppingCart, Truck, ClipboardCheck,
  Warehouse, Users, FileBarChart, Settings, Bell, ListTodo, ChevronLeft, ChevronRight,
  Shield, ArrowLeftRight, AlertTriangle, Recycle, ScanLine,
  PackageCheck, PackageOpen, RotateCcw, UserRound, Store, Layers,
} from 'lucide-react'
import { QkTooltip } from '../ui'
import type { LucideIcon } from 'lucide-react'

interface NavItem {
  label: string
  to: string
  icon: LucideIcon
}

interface NavSection {
  title: string
  items: NavItem[]
}

const sections: NavSection[] = [
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

interface SidebarProps {
  collapsed: boolean
  onToggle: () => void
}

export function Sidebar({ collapsed, onToggle }: SidebarProps) {
  const location = useLocation()

  return (
    <aside
      style={{
        width: collapsed ? 'var(--qk-sidebar-collapsed)' : 'var(--qk-sidebar-w)',
        minWidth: collapsed ? 'var(--qk-sidebar-collapsed)' : 'var(--qk-sidebar-w)',
        height: '100vh',
        position: 'sticky',
        top: 0,
        background: 'var(--qk-sidebar)',
        borderRight: '1px solid var(--qk-border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 180ms ease, min-width 180ms ease',
        zIndex: 20,
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          height: 'var(--qk-topbar-h)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '0 8px' : '0 12px',
          borderBottom: '1px solid var(--qk-border)',
          gap: 8,
          flexShrink: 0,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, minWidth: 0 }}>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 7,
              background: 'var(--qk-primary)',
              color: '#fff',
              display: 'grid',
              placeItems: 'center',
              fontWeight: 700,
              fontSize: 13,
              flexShrink: 0,
            }}
          >
            Q
          </div>
          {!collapsed && (
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650, fontSize: 14, letterSpacing: '-0.02em', lineHeight: 1.1 }}>QuicKart.</div>
              <div style={{ fontSize: 10, color: 'var(--qk-text-muted)', fontWeight: 500 }}>SCM</div>
            </div>
          )}
        </div>
        {!collapsed && (
          <button
            type="button"
            onClick={onToggle}
            aria-label="Collapse sidebar"
            style={{
              width: 28,
              height: 28,
              borderRadius: 6,
              border: '1px solid var(--qk-border)',
              background: 'var(--qk-surface)',
              color: 'var(--qk-text-secondary)',
              cursor: 'pointer',
              display: 'grid',
              placeItems: 'center',
              flexShrink: 0,
            }}
          >
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      <nav
        className="qk-scroll-hidden"
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          padding: collapsed ? '8px 0' : '10px 8px',
        }}
      >
        {sections.map((section, sectionIdx) => (
          <div
            key={section.title}
            style={{
              marginBottom: collapsed ? 6 : 12,
              paddingBottom: collapsed && sectionIdx < sections.length - 1 ? 6 : 0,
              borderBottom:
                collapsed && sectionIdx < sections.length - 1 ? '1px solid var(--qk-border)' : 'none',
              marginLeft: collapsed ? 10 : 0,
              marginRight: collapsed ? 10 : 0,
            }}
          >
            {!collapsed && (
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  color: 'var(--qk-text-muted)',
                  padding: '4px 8px 6px',
                }}
              >
                {section.title}
              </div>
            )}
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                gap: collapsed ? 4 : 2,
                alignItems: collapsed ? 'center' : 'stretch',
              }}
            >
              {section.items.map((item) => {
                const Icon = item.icon
                const active = location.pathname === item.to || location.pathname.startsWith(`${item.to}/`)
                const link = (
                  <NavLink
                    to={item.to}
                    aria-label={item.label}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      width: collapsed ? 36 : '100%',
                      height: collapsed ? 36 : 34,
                      padding: collapsed ? 0 : '0 10px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      borderRadius: 8,
                      color: active ? 'var(--qk-primary)' : 'var(--qk-text-secondary)',
                      background: active ? 'var(--qk-sidebar-active)' : 'transparent',
                      fontWeight: active ? 600 : 500,
                      fontSize: 13,
                      flexShrink: 0,
                    }}
                    onMouseEnter={(e) => {
                      if (!active) e.currentTarget.style.background = 'var(--qk-sidebar-hover)'
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.background = active ? 'var(--qk-sidebar-active)' : 'transparent'
                    }}
                  >
                    <Icon size={collapsed ? 18 : 16} strokeWidth={1.75} />
                    {!collapsed && (
                      <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {item.label}
                      </span>
                    )}
                  </NavLink>
                )
                return collapsed ? (
                  <QkTooltip key={item.to} content={item.label} side="right">
                    {link}
                  </QkTooltip>
                ) : (
                  <div key={item.to}>{link}</div>
                )
              })}
            </div>
          </div>
        ))}
      </nav>

      {collapsed && (
        <div style={{ padding: '8px 0 10px', borderTop: '1px solid var(--qk-border)', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
          <QkTooltip content="Expand sidebar" side="right">
            <button
              type="button"
              onClick={onToggle}
              aria-label="Expand sidebar"
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                border: '1px solid var(--qk-border)',
                background: 'var(--qk-surface)',
                color: 'var(--qk-text-secondary)',
                cursor: 'pointer',
                display: 'grid',
                placeItems: 'center',
              }}
            >
              <ChevronRight size={16} />
            </button>
          </QkTooltip>
        </div>
      )}
    </aside>
  )
}
