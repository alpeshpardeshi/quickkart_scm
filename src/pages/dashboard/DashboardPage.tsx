import { Link } from 'react-router-dom'
import { AlertTriangle, Clock3, PackageMinus, ShieldAlert } from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkMetric, QkStatusBadge, QkButton } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatNumber } from '../../utils'

export function DashboardPage() {
  const { inventory, tasks, batches, qcInspections, salesOrders, purchaseOrders } = useData()

  const available = inventory.reduce((s, i) => s + i.available, 0)
  const reserved = inventory.reduce((s, i) => s + i.reserved, 0)
  const qcHold = inventory.reduce((s, i) => s + i.qcHold, 0)
  const damagedExpired = inventory.reduce((s, i) => s + i.damaged + i.expired, 0)
  const totalInv = available + reserved + qcHold + damagedExpired
  const pct = (n: number) => (totalInv ? Math.round((n / totalInv) * 100) : 0)

  const pendingWork = tasks.filter((t) => t.status === 'Open' || t.status === 'In Progress' || t.status === 'Blocked').length
  const ordersToday = salesOrders.filter((s) => s.orderDate === '2026-09-08' || s.orderDate === '2026-09-09').length
  const nearExpiry = batches.filter((b) => b.status === 'Near Expiry').length
  const delayed = tasks.filter((t) => t.status === 'Blocked' || (t.due <= '2026-09-08' && t.status !== 'Completed')).length
  const lowStock = inventory.filter((i) => i.status === 'Low Stock').length
  const qcExceptions = qcInspections.filter((q) => q.status === 'Pending' || q.status === 'Failed' || q.status === 'RTV').length

  const statusRows = [
    { label: 'Available', value: available, color: 'var(--qk-success)' },
    { label: 'Reserved', value: reserved, color: 'var(--qk-info)' },
    { label: 'QC Hold', value: qcHold, color: 'var(--qk-warning)' },
    { label: 'Damaged/Expired', value: damagedExpired, color: 'var(--qk-danger)' },
  ]

  const attention = [
    { icon: AlertTriangle, title: 'Near-expiry batches', desc: `${nearExpiry} batches expire within 14 days`, to: '/expiry', tone: 'warning' as const },
    { icon: Clock3, title: 'Delayed tasks', desc: `${delayed} tasks are past SLA`, to: '/tasks', tone: 'danger' as const },
    { icon: PackageMinus, title: 'Low-stock SKUs', desc: `${lowStock} products below safety threshold`, to: '/inventory', tone: 'info' as const },
    { icon: ShieldAlert, title: 'QC exceptions', desc: `${qcExceptions} inspections require attention`, to: '/qc', tone: 'warning' as const },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Dashboard"
        subtitle="Operational snapshot across warehouses and open work."
        actions={
          <>
            <QkButton variant="outline" onClick={() => {}}>Refresh</QkButton>
            <Link to="/tasks"><QkButton>View tasks</QkButton></Link>
          </>
        }
      />

      <div className="qk-grid-metrics">
        <QkMetric label="Pending Work" value={pendingWork} hint="Open operational tasks" />
        <QkMetric label="Total Inventory" value={formatNumber(available + reserved)} hint="Available + reserved units" />
        <QkMetric label="Orders Today" value={ordersToday} hint="Confirmed / in-flight sales orders" />
        <QkMetric label="Open POs" value={purchaseOrders.filter((p) => p.status !== 'Closed' && p.status !== 'Cancelled').length} hint="Active purchase pipeline" />
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
            <h2 className="qk-section-title">Inventory Status</h2>
            <Link to="/inventory" style={{ fontSize: 12, color: 'var(--qk-primary)', fontWeight: 500 }}>View inventory</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {statusRows.map((row) => (
              <div key={row.label}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 13 }}>
                  <span style={{ color: 'var(--qk-text-secondary)' }}>{row.label}</span>
                  <strong>{formatNumber(row.value)}</strong>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden' }}>
                  <div style={{ width: `${pct(row.value)}%`, height: '100%', background: row.color, borderRadius: 999 }} />
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="qk-surface" style={{ padding: 16 }}>
          <h2 className="qk-section-title" style={{ marginBottom: 14 }}>Attention Required</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {attention.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.title}
                  to={item.to}
                  style={{
                    display: 'flex',
                    gap: 12,
                    padding: '10px 12px',
                    borderRadius: 'var(--qk-radius)',
                    border: '1px solid var(--qk-border)',
                    background: 'var(--qk-surface)',
                  }}
                >
                  <span
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      display: 'grid',
                      placeItems: 'center',
                      background: `var(--qk-${item.tone}-soft)`,
                      color: `var(--qk-${item.tone})`,
                      flexShrink: 0,
                    }}
                  >
                    <Icon size={15} />
                  </span>
                  <span style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, fontSize: 13 }}>{item.title}</div>
                    <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)', marginTop: 2 }}>{item.desc}</div>
                  </span>
                </Link>
              )
            })}
          </div>
        </section>
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="qk-section-title">Recent Sales Orders</h2>
            <Link to="/sales-orders" style={{ fontSize: 12, color: 'var(--qk-primary)' }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {salesOrders.slice(0, 4).map((so) => (
              <Link
                key={so.id}
                to={`/sales-orders/${so.id}`}
                style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--qk-border)' }}
              >
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{so.soNumber}</div>
                  <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)' }}>{so.customer}</div>
                </div>
                <QkStatusBadge label={so.status} tone={so.status === 'Dispatched' ? 'success' : so.status === 'Picking' ? 'primary' : 'warning'} />
              </Link>
            ))}
          </div>
        </section>

        <section className="qk-surface" style={{ padding: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
            <h2 className="qk-section-title">My Open Tasks</h2>
            <Link to="/tasks" style={{ fontSize: 12, color: 'var(--qk-primary)' }}>View all</Link>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {tasks.filter((t) => t.status !== 'Completed').slice(0, 4).map((task) => (
              <div key={task.id} style={{ display: 'flex', justifyContent: 'space-between', gap: 12, padding: '8px 0', borderBottom: '1px solid var(--qk-border)' }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 13 }}>{task.title}</div>
                  <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)' }}>{task.warehouse} · Due {task.due}</div>
                </div>
                <QkStatusBadge label={task.priority} tone={task.priority === 'Urgent' ? 'danger' : task.priority === 'High' ? 'warning' : 'neutral'} />
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  )
}
