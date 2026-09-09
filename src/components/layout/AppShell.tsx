import { useEffect, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Sidebar } from './Sidebar'
import { TopBar } from './TopBar'
import { MobileBottomNav } from './MobileBottomNav'
import { MobileNavDrawer } from './MobileNavDrawer'
import { useBreakpoint } from '../../hooks/useBreakpoint'
import { resolvePageTitle } from './navConfig'

const breadcrumbMap: Record<string, { label: string; parent?: string }[]> = {
  '/dashboard': [{ label: 'Dashboard' }],
  '/inventory-dashboard': [{ label: 'Inventory' }, { label: 'Dashboard' }],
  '/inventory': [{ label: 'Inventory' }],
  '/warehouse-inventory': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Warehouse Stock' }],
  '/batches': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Batches' }],
  '/expiry': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Expiry' }],
  '/near-expiry': [{ label: 'Inventory', parent: '/expiry' }, { label: 'Near Expiry' }],
  '/expired': [{ label: 'Inventory', parent: '/expiry' }, { label: 'Expired' }],
  '/audits': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Audits' }],
  '/wastage': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Wastage' }],
  '/stock-movement': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Stock Movement' }],
  '/stock-adjustment': [{ label: 'Inventory', parent: '/inventory' }, { label: 'Stock Adjustment' }],
  '/warehouses': [{ label: 'Warehouse' }, { label: 'Warehouses' }],
  '/vendors': [{ label: 'Procurement' }, { label: 'Vendors' }],
  '/purchase-orders': [{ label: 'Procurement' }, { label: 'Purchase Orders' }],
  '/purchase-orders/new': [{ label: 'Procurement', parent: '/purchase-orders' }, { label: 'Create PO' }],
  '/approvals': [{ label: 'Procurement' }, { label: 'Approvals' }],
  '/approval-history': [{ label: 'Procurement' }, { label: 'Approval History' }],
  '/zoho-sync': [{ label: 'Procurement' }, { label: 'Zoho Sync' }],
  '/receiving': [{ label: 'Warehouse' }, { label: 'Receiving' }],
  '/grn': [{ label: 'Warehouse' }, { label: 'GRN' }],
  '/qc': [{ label: 'Warehouse' }, { label: 'QC' }],
  '/put-away': [{ label: 'Warehouse' }, { label: 'Put-Away' }],
  '/customers': [{ label: 'Orders' }, { label: 'Customers' }],
  '/sales-orders': [{ label: 'Orders' }, { label: 'Sales Orders' }],
  '/reservations': [{ label: 'Orders' }, { label: 'Reservations' }],
  '/picklists': [{ label: 'Orders' }, { label: 'Picklists' }],
  '/my-picking': [{ label: 'Orders' }, { label: 'My Picking' }],
  '/picking': [{ label: 'Orders' }, { label: 'Picking' }],
  '/dispatch': [{ label: 'Orders' }, { label: 'Dispatch' }],
  '/returns': [{ label: 'Orders' }, { label: 'Returns' }],
  '/tasks': [{ label: 'Operations' }, { label: 'Tasks' }],
  '/notifications': [{ label: 'Operations' }, { label: 'Notifications' }],
  '/reports': [{ label: 'Analytics' }, { label: 'Reports' }],
  '/users': [{ label: 'Admin' }, { label: 'Users' }],
  '/roles': [{ label: 'Admin' }, { label: 'Roles' }],
  '/settings': [{ label: 'Admin' }, { label: 'Settings' }],
}

function resolveBreadcrumbs(pathname: string) {
  const exact = breadcrumbMap[pathname]
  if (exact) {
    return exact.map((b) => ({ label: b.label, to: b.parent }))
  }
  const base = Object.keys(breadcrumbMap)
    .filter((k) => pathname.startsWith(`${k}/`))
    .sort((a, b) => b.length - a.length)[0]
  if (base) {
    const crumbs = breadcrumbMap[base].map((b) => ({ label: b.label, to: b.parent || base }))
    const last = pathname.split('/').pop() || 'Details'
    return [...crumbs.slice(0, -1), { label: crumbs[crumbs.length - 1].label, to: base }, { label: last.toUpperCase() }]
  }
  return [{ label: 'Dashboard', to: '/dashboard' }]
}

export function AppShell({ children }: { children?: ReactNode }) {
  const [collapsed, setCollapsed] = useState(() => localStorage.getItem('quickart-sidebar') === '1')
  const [mobileNavOpen, setMobileNavOpen] = useState(false)
  const [mobileNavMode, setMobileNavMode] = useState<'menu' | 'more'>('menu')
  const location = useLocation()
  const { isMobile } = useBreakpoint()

  useEffect(() => {
    localStorage.setItem('quickart-sidebar', collapsed ? '1' : '0')
  }, [collapsed])

  useEffect(() => {
    setMobileNavOpen(false)
  }, [location.pathname])

  useEffect(() => {
    document.body.classList.toggle('qk-is-mobile', isMobile)
    document.documentElement.style.setProperty(
      '--qk-mobile-bottom-nav-h',
      isMobile ? 'calc(56px + env(safe-area-inset-bottom, 0px))' : '0px',
    )
    return () => {
      document.body.classList.remove('qk-is-mobile')
    }
  }, [isMobile])

  const breadcrumbs = resolveBreadcrumbs(location.pathname)
  const pageTitle = resolvePageTitle(location.pathname, breadcrumbs)

  const openMenu = () => {
    setMobileNavMode('menu')
    setMobileNavOpen(true)
  }
  const openMore = () => {
    setMobileNavMode('more')
    setMobileNavOpen(true)
  }

  return (
    <div className={`qk-app${isMobile ? ' qk-app--mobile' : ''}`} style={{ display: 'flex', minHeight: '100%' }}>
      {!isMobile && (
        <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((v) => !v)} />
      )}
      <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column' }}>
        <TopBar
          breadcrumbs={breadcrumbs}
          pageTitle={pageTitle}
          mobile={isMobile}
          onToggleSidebar={() => (isMobile ? openMenu() : setCollapsed((v) => !v))}
        />
        <main className="qk-app-main" style={{ flex: 1, minWidth: 0 }}>
          {children || <Outlet />}
        </main>
      </div>

      {isMobile && (
        <>
          <MobileBottomNav onMore={openMore} moreOpen={mobileNavOpen && mobileNavMode === 'more'} />
          <MobileNavDrawer
            open={mobileNavOpen}
            mode={mobileNavMode}
            onClose={() => setMobileNavOpen(false)}
          />
        </>
      )}
    </div>
  )
}
