import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { ThemeProvider } from './context/ThemeContext'
import { DensityProvider } from './context/DensityContext'
import { AuthProvider } from './context/AuthContext'
import { DataProvider } from './context/DataContext'
import { ToastProvider } from './context/ToastContext'
import { QkToastViewport } from './components/ui'
import { ProtectedRoute } from './components/layout/ProtectedRoute'
import { LoginPage } from './pages/auth/LoginPage'
import { DashboardPage } from './pages/dashboard/DashboardPage'
import { InventoryListPage } from './pages/inventory/InventoryListPage'
import { InventoryDetailsPage } from './pages/inventory/InventoryDetailsPage'
import { InventoryDashboardPage } from './pages/inventory/InventoryDashboardPage'
import { WarehouseInventoryPage } from './pages/inventory/WarehouseInventoryPage'
import { BatchesPage } from './pages/inventory/BatchesPage'
import { BatchDetailsPage } from './pages/inventory/BatchDetailsPage'
import { BatchTraceabilityPage } from './pages/inventory/BatchTraceabilityPage'
import { ExpiryPage } from './pages/inventory/ExpiryPage'
import { NearExpiryPage, ExpiredStockPage } from './pages/inventory/ExpiryStockPages'
import { AuditsPage } from './pages/inventory/AuditsPage'
import { WastagePage } from './pages/inventory/WastagePage'
import { StockMovementPage } from './pages/inventory/StockMovementPage'
import { StockAdjustmentPage } from './pages/inventory/StockAdjustmentPage'
import { VendorsPage } from './pages/procurement/VendorsPage'
import { VendorDetailsPage } from './pages/procurement/VendorDetailsPage'
import { PurchaseOrdersPage } from './pages/procurement/PurchaseOrdersPage'
import { PurchaseOrderDetailsPage } from './pages/procurement/PurchaseOrderDetailsPage'
import { PurchaseOrderFormPage } from './pages/procurement/PurchaseOrderFormPage'
import { ApprovalsPage } from './pages/procurement/ApprovalsPage'
import { ApprovalHistoryPage } from './pages/procurement/ApprovalHistoryPage'
import { ZohoSyncHistoryPage } from './pages/procurement/ZohoSyncHistoryPage'
import { WarehousesPage } from './pages/warehouse/WarehousesPage'
import { ReceivingPage } from './pages/warehouse/ReceivingPage'
import { ReceivingDetailsPage } from './pages/warehouse/ReceivingDetailsPage'
import { GrnPage } from './pages/warehouse/GrnPage'
import { GrnDetailsPage } from './pages/warehouse/GrnDetailsPage'
import { QcPage } from './pages/warehouse/QcPage'
import { PutAwayPage } from './pages/warehouse/PutAwayPage'
import { PutAwayDetailsPage } from './pages/warehouse/PutAwayDetailsPage'
import { CustomersPage } from './pages/orders/CustomersPage'
import { CustomerDetailsPage } from './pages/orders/CustomerDetailsPage'
import { SalesOrdersPage } from './pages/orders/SalesOrdersPage'
import { SalesOrderDetailsPage } from './pages/orders/SalesOrderDetailsPage'
import { ReservationsPage } from './pages/orders/ReservationsPage'
import { LockDetailsPage } from './pages/orders/LockDetailsPage'
import { PicklistsPage } from './pages/orders/PicklistsPage'
import { PicklistDetailsPage } from './pages/orders/PicklistDetailsPage'
import { MyPickingTasksPage } from './pages/orders/MyPickingTasksPage'
import { PickingPage } from './pages/orders/PickingPage'
import { DispatchPage } from './pages/orders/DispatchPage'
import { DispatchDetailsPage } from './pages/orders/DispatchDetailsPage'
import { ReturnsPage } from './pages/orders/ReturnsPage'
import { ReturnDetailsPage } from './pages/orders/ReturnDetailsPage'
import { TasksPage } from './pages/tasks/TasksPage'
import { NotificationsPage } from './pages/tasks/NotificationsPage'
import { ReportsPage } from './pages/reports/ReportsPage'
import { UsersPage } from './pages/admin/UsersPage'
import { RolesPage } from './pages/admin/RolesPage'
import { SettingsPage } from './pages/admin/SettingsPage'

export default function App() {
  return (
    <ThemeProvider>
      <DensityProvider>
        <AuthProvider>
          <DataProvider>
            <ToastProvider>
              <BrowserRouter>
                <Routes>
                  <Route path="/login" element={<LoginPage />} />
                  <Route element={<ProtectedRoute />}>
                    <Route path="/" element={<Navigate to="/dashboard" replace />} />
                    <Route path="/dashboard" element={<DashboardPage />} />
                    <Route path="/inventory-dashboard" element={<InventoryDashboardPage />} />
                    <Route path="/inventory" element={<InventoryListPage />} />
                    <Route path="/inventory/:id" element={<InventoryDetailsPage />} />
                    <Route path="/warehouse-inventory" element={<WarehouseInventoryPage />} />
                    <Route path="/batches" element={<BatchesPage />} />
                    <Route path="/batches/:id" element={<BatchDetailsPage />} />
                    <Route path="/batch-traceability/:id" element={<BatchTraceabilityPage />} />
                    <Route path="/expiry" element={<ExpiryPage />} />
                    <Route path="/near-expiry" element={<NearExpiryPage />} />
                    <Route path="/expired" element={<ExpiredStockPage />} />
                    <Route path="/audits" element={<AuditsPage />} />
                    <Route path="/wastage" element={<WastagePage />} />
                    <Route path="/stock-movement" element={<StockMovementPage />} />
                    <Route path="/stock-adjustment" element={<StockAdjustmentPage />} />
                    <Route path="/vendors" element={<VendorsPage />} />
                    <Route path="/vendors/:id" element={<VendorDetailsPage />} />
                    <Route path="/purchase-orders" element={<PurchaseOrdersPage />} />
                    <Route path="/purchase-orders/new" element={<PurchaseOrderFormPage />} />
                    <Route path="/purchase-orders/:id/edit" element={<PurchaseOrderFormPage />} />
                    <Route path="/purchase-orders/:id" element={<PurchaseOrderDetailsPage />} />
                    <Route path="/approvals" element={<ApprovalsPage />} />
                    <Route path="/approval-history" element={<ApprovalHistoryPage />} />
                    <Route path="/zoho-sync" element={<ZohoSyncHistoryPage />} />
                    <Route path="/warehouses" element={<WarehousesPage />} />
                    <Route path="/receiving" element={<ReceivingPage />} />
                    <Route path="/receiving/:id" element={<ReceivingDetailsPage />} />
                    <Route path="/grn" element={<GrnPage />} />
                    <Route path="/grn/:id" element={<GrnDetailsPage />} />
                    <Route path="/qc" element={<QcPage />} />
                    <Route path="/put-away" element={<PutAwayPage />} />
                    <Route path="/put-away/:id" element={<PutAwayDetailsPage />} />
                    <Route path="/customers" element={<CustomersPage />} />
                    <Route path="/customers/:id" element={<CustomerDetailsPage />} />
                    <Route path="/sales-orders" element={<SalesOrdersPage />} />
                    <Route path="/sales-orders/:id" element={<SalesOrderDetailsPage />} />
                    <Route path="/reservations" element={<ReservationsPage />} />
                    <Route path="/locks/:id" element={<LockDetailsPage />} />
                    <Route path="/picklists" element={<PicklistsPage />} />
                    <Route path="/picklists/:id" element={<PicklistDetailsPage />} />
                    <Route path="/my-picking" element={<MyPickingTasksPage />} />
                    <Route path="/picking" element={<PickingPage />} />
                    <Route path="/dispatch" element={<DispatchPage />} />
                    <Route path="/dispatch/:id" element={<DispatchDetailsPage />} />
                    <Route path="/returns" element={<ReturnsPage />} />
                    <Route path="/returns/:id" element={<ReturnDetailsPage />} />
                    <Route path="/tasks" element={<TasksPage />} />
                    <Route path="/notifications" element={<NotificationsPage />} />
                    <Route path="/reports" element={<ReportsPage />} />
                    <Route path="/users" element={<UsersPage />} />
                    <Route path="/roles" element={<RolesPage />} />
                    <Route path="/settings" element={<SettingsPage />} />
                  </Route>
                  <Route path="*" element={<Navigate to="/dashboard" replace />} />
                </Routes>
              </BrowserRouter>
              <QkToastViewport />
            </ToastProvider>
          </DataProvider>
        </AuthProvider>
      </DensityProvider>
    </ThemeProvider>
  )
}
