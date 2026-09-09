import { useEffect, useState, type CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import {
  AlertTriangle, ClipboardList, Package, RefreshCw, ShoppingCart,
  Truck, Warehouse,
} from 'lucide-react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { BUSINESS_DATE } from '../../services/appState'
import { formatDate, formatNumber, statusTone } from '../../utils'
import {
  DashboardKpi,
  DashboardLoader,
  DashSection,
  ExceptionCenter,
  InventoryHealth,
  OperationalTrend,
  OrderPipeline,
  useDashboardData,
  WarehouseWorkload,
} from '../../components/dashboard'
import '../../components/dashboard/dashboard.css'

export function DashboardPage() {
  const {
    salesOrders, purchaseOrders, inventory, batches, tasks, picklists,
    dispatches, qcInspections, putAwayTasks, receiving, warehouses,
  } = useData()

  const [loading, setLoading] = useState(true)
  const [tick, setTick] = useState(0)

  useEffect(() => {
    setLoading(true)
    const id = window.setTimeout(() => setLoading(false), 650)
    return () => window.clearTimeout(id)
  }, [tick])

  const data = useDashboardData({
    salesOrders,
    purchaseOrders,
    inventory,
    batches,
    tasks,
    picklists,
    dispatches,
    qcInspections,
    putAwayTasks,
    receiving,
    warehouses,
    businessDate: BUSINESS_DATE,
  })

  if (loading) {
    return (
      <div className="qk-page">
        <PageHeader
          title="Dashboard"
          subtitle="Operational command center across orders, inventory, warehouse activity and procurement."
        />
        <div className="qk-dash-card" style={{ minHeight: 360 }}>
          <DashboardLoader />
        </div>
      </div>
    )
  }

  const linkStyle: CSSProperties = { fontSize: 12, color: 'var(--qk-primary)', fontWeight: 600 }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Dashboard"
        subtitle="Operational command center across orders, inventory, warehouse activity and procurement."
        actions={(
          <>
            <div
              className="qk-dash-card"
              style={{
                padding: '6px 10px',
                fontSize: 12,
                color: 'var(--qk-text-secondary)',
                display: 'flex',
                alignItems: 'center',
                gap: 6,
              }}
            >
              <span style={{ fontWeight: 500 }}>Business date</span>
              <strong style={{ color: 'var(--qk-text)' }}>{formatDate(data.businessDate)}</strong>
            </div>
            <QkButton
              variant="outline"
              leftIcon={<RefreshCw size={14} />}
              onClick={() => setTick((t) => t + 1)}
            >
              Refresh
            </QkButton>
          </>
        )}
      />

      <div className="qk-dash-kpi-strip">
        <DashboardKpi label="Orders Today" value={data.kpis.ordersToday.value} hint={data.kpis.ordersToday.hint} icon={ShoppingCart} to={data.kpis.ordersToday.to} delay={40} />
        <DashboardKpi label="Orders Requiring Action" value={data.kpis.ordersAction.value} hint={data.kpis.ordersAction.hint} icon={AlertTriangle} to={data.kpis.ordersAction.to} delay={80} />
        <DashboardKpi label="Available Inventory" value={data.kpis.available.value} hint={data.kpis.available.hint} icon={Package} to={data.kpis.available.to} delay={120} />
        <DashboardKpi label="Open Purchase Orders" value={data.kpis.openPos.value} hint={data.kpis.openPos.hint} icon={ClipboardList} to={data.kpis.openPos.to} delay={160} />
        <DashboardKpi label="Picking Queue" value={data.kpis.pickingQueue.value} hint={data.kpis.pickingQueue.hint} icon={Warehouse} to={data.kpis.pickingQueue.to} delay={200} />
        <DashboardKpi label="Dispatch Ready" value={data.kpis.dispatchReady.value} hint={data.kpis.dispatchReady.hint} icon={Truck} to={data.kpis.dispatchReady.to} delay={240} />
      </div>

      <DashSection title="Order fulfillment pipeline" delay={100} action={<Link to="/sales-orders" style={linkStyle}>Sales orders</Link>}>
        <OrderPipeline stages={data.pipeline} />
      </DashSection>

      <DashSection title="Attention required" delay={140}>
        <ExceptionCenter items={data.exceptions} layout="grid" />
      </DashSection>

      <div className="qk-dash-split">
        <DashSection title="Warehouse workload" delay={160} action={<Link to="/tasks" style={linkStyle}>Tasks</Link>}>
          <WarehouseWorkload items={data.warehouseWorkload} />
        </DashSection>
        <DashSection title="Orders · last 7 days" delay={200}>
          <OperationalTrend days={data.trendDays} hasSignal={data.hasTrendSignal} />
        </DashSection>
      </div>

      <DashSection title="Inventory health" delay={220} action={<Link to="/inventory" style={linkStyle}>Inventory</Link>}>
        <div className="qk-dash-inv-layout">
          <InventoryHealth {...data.inventoryHealth} />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, minWidth: 0 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--qk-text-secondary)' }}>By warehouse</div>
            {data.byWarehouse.map((w, idx) => (
              <Link
                key={w.id}
                to={`/warehouse-inventory?warehouse=${encodeURIComponent(w.name)}`}
                style={{ display: 'block', minWidth: 0, fontSize: 12.5 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, marginBottom: 4, alignItems: 'baseline' }}>
                  <strong style={{ minWidth: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{w.name}</strong>
                  <span style={{ flexShrink: 0, fontWeight: 650, fontVariantNumeric: 'tabular-nums' }}>
                    {formatNumber(w.units)}
                    <span style={{ color: 'var(--qk-text-muted)', fontWeight: 500, marginLeft: 6 }}>{w.skus} lines</span>
                  </span>
                </div>
                <div style={{ height: 6, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden' }}>
                  <div
                    className="qk-dash-bar-fill"
                    style={{
                      width: `${Math.round((w.units / data.maxWh) * 100)}%`,
                      height: '100%',
                      background: 'var(--qk-primary)',
                      borderRadius: 999,
                      animationDelay: `${idx * 50}ms`,
                    }}
                  />
                </div>
              </Link>
            ))}
            <Link to="/warehouse-inventory" style={{ ...linkStyle, marginTop: 2 }}>View warehouse stock →</Link>
          </div>
        </div>
      </DashSection>

      <DashSection title="Inventory attention" delay={260} action={<Link to="/expiry" style={linkStyle}>Expiry</Link>}>
        {data.inventoryAttention.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--qk-text-muted)' }}>No inventory risks flagged.</div>
        ) : (
          <div className="qk-dash-card-grid">
            {data.inventoryAttention.map((row) => (
              <div key={row.id} className="qk-dash-item-card">
                <div style={{ minWidth: 0 }}>
                  <div style={{ display: 'flex', gap: 8, alignItems: 'baseline', flexWrap: 'wrap' }}>
                    <span style={{ fontSize: 10, fontWeight: 700, letterSpacing: '0.04em', color: row.severity === 'critical' ? 'var(--qk-danger)' : 'var(--qk-warning)' }}>
                      {row.reason}
                    </span>
                    <strong style={{ fontSize: 12.5 }}>{row.product}</strong>
                  </div>
                  <div style={{ color: 'var(--qk-text-secondary)', fontSize: 11.5, marginTop: 2 }}>{row.sku} · {row.warehouse}</div>
                  <div style={{ color: 'var(--qk-text-muted)', fontSize: 11.5 }}>{row.detail}</div>
                </div>
                <Link to={row.to} className="qk-dash-open-btn">View</Link>
              </div>
            ))}
          </div>
        )}
      </DashSection>

      <DashSection title="Inbound · procurement" delay={300} action={<Link to="/purchase-orders" style={linkStyle}>Purchase orders</Link>}>
        <div className="qk-dash-mini-metrics" style={{ gridTemplateColumns: 'repeat(4, minmax(0, 1fr))' }}>
          {[
            { label: 'Open POs', value: data.inbound.openPos, to: '/purchase-orders' },
            { label: 'Awaiting receiving', value: data.inbound.awaitingReceiving, to: '/receiving' },
            { label: 'QC pending', value: data.inbound.qcPending, to: '/qc' },
            { label: 'Put-away pending', value: data.inbound.putawayPending, to: '/put-away' },
          ].map((m) => (
            <Link key={m.label} to={m.to} className="qk-dash-mini-metric">
              <div className="label">{m.label}</div>
              <div className="value">{m.value}</div>
            </Link>
          ))}
        </div>
        <div className="qk-dash-card-grid">
          {data.inbound.rows.map((po) => (
            <div key={po.id} className="qk-dash-item-card">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--qk-primary)' }}>{po.poNumber}</strong>
                  <QkStatusBadge label={po.status} tone={statusTone(po.status)} />
                </div>
                <div style={{ color: 'var(--qk-text-secondary)', fontSize: 11.5, marginTop: 2 }}>{po.vendor}</div>
                <div style={{ color: 'var(--qk-text-muted)', fontSize: 11.5 }}>Expected {formatDate(po.expectedDelivery || po.orderDate)}</div>
              </div>
              <Link to={`/purchase-orders/${po.id}`} className="qk-dash-open-btn">View PO</Link>
            </div>
          ))}
        </div>
      </DashSection>

      <DashSection title="Outbound · fulfillment" delay={320} action={<Link to="/dispatch" style={linkStyle}>Dispatch</Link>}>
        <div className="qk-dash-mini-metrics" style={{ gridTemplateColumns: 'repeat(5, minmax(0, 1fr))' }}>
          {[
            { label: 'Picking', value: data.outbound.counts.picking },
            { label: 'Packing', value: data.outbound.counts.packing },
            { label: 'Ready', value: data.outbound.counts.dispatchReady },
            { label: 'In transit', value: data.outbound.counts.inTransit },
            { label: 'Delivered', value: data.outbound.counts.delivered },
          ].map((m) => (
            <div key={m.label} className="qk-dash-mini-metric">
              <div className="label">{m.label}</div>
              <div className="value">{m.value}</div>
            </div>
          ))}
        </div>
        <div className="qk-dash-card-grid">
          {data.outbound.rows.map((so) => (
            <div key={so.id} className="qk-dash-item-card">
              <div style={{ minWidth: 0 }}>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <strong style={{ color: 'var(--qk-primary)' }}>{so.soNumber}</strong>
                  <QkStatusBadge label={so.status} tone={statusTone(so.status)} />
                </div>
                <div style={{ color: 'var(--qk-text-secondary)', fontSize: 11.5, marginTop: 2 }}>{so.customer}</div>
                <div style={{ color: 'var(--qk-text-muted)', fontSize: 11.5 }}>{so.warehouse} · Due {formatDate(so.deliveryDate)}</div>
              </div>
              <Link to={`/sales-orders/${so.id}`} className="qk-dash-open-btn">View SO</Link>
            </div>
          ))}
        </div>
      </DashSection>

      <DashSection title="Recent order activity" delay={340} action={<Link to="/sales-orders" style={linkStyle}>View all</Link>}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12.5, tableLayout: 'fixed' }}>
            <thead>
              <tr style={{ color: 'var(--qk-text-secondary)', textAlign: 'left' }}>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '12%' }}>SO Number</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '24%' }}>Customer</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '8%', textAlign: 'right' }}>Items</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '18%' }}>Warehouse</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '12%' }}>Delivery</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '14%' }}>Status</th>
                <th style={{ padding: '6px 8px', fontWeight: 550, width: '12%', textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {data.recentOrders.map((so) => (
                <tr key={so.id} style={{ borderTop: '1px solid var(--qk-border)' }}>
                  <td style={{ padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    <Link to={`/sales-orders/${so.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{so.soNumber}</Link>
                  </td>
                  <td style={{ padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{so.customer}</td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>{so.itemCount}</td>
                  <td style={{ padding: '8px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{so.warehouse}</td>
                  <td style={{ padding: '8px' }}>{formatDate(so.deliveryDate)}</td>
                  <td style={{ padding: '8px' }}><QkStatusBadge label={so.status} tone={statusTone(so.status)} /></td>
                  <td style={{ padding: '8px', textAlign: 'right' }}>
                    <Link to={`/sales-orders/${so.id}`} className="qk-dash-open-btn">Workspace</Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </DashSection>
    </div>
  )
}
