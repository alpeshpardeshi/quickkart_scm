import { Link, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatCurrency, formatDate, statusTone } from '../../utils'
import type { SalesOrder } from '../../types'

export function CustomerDetailsPage() {
  const { id } = useParams()
  const { customers, salesOrders, returns } = useData()
  const customer = customers.find((c) => c.id === id)
  const orders = salesOrders.filter((s) => s.customerId === id || s.customer === customer?.name)
  const customerReturns = returns.filter((r) => r.customer === customer?.name)

  if (!customer) {
    return (
      <div className="qk-page">
        <PageHeader title="Customer not found" />
        <Link to="/customers"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const orderCols: QkColumn<SalesOrder>[] = [
    { key: 'soNumber', header: 'SO', render: (r) => <Link to={`/sales-orders/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.soNumber}</Link> },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'orderDate', header: 'Ordered', render: (r) => formatDate(r.orderDate) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={customer.name}
        subtitle={`${customer.code} · ${customer.type} · ${customer.city}`}
        actions={
          <>
            <Link to="/customers"><QkButton variant="outline">All customers</QkButton></Link>
            <Link to="/sales-orders"><QkButton>New order</QkButton></Link>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8 }}>
        <QkStatusBadge label={customer.status} tone={statusTone(customer.status)} />
      </div>
      <div className="qk-grid-metrics">
        <QkMetric label="Credit limit" value={formatCurrency(customer.creditLimit)} />
        <QkMetric label="Orders" value={orders.length} />
        <QkMetric label="Order value" value={formatCurrency(orders.reduce((s, o) => s + o.amount, 0))} />
        <QkMetric label="Returns" value={customerReturns.length} />
      </div>
      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Contact</h3>
          <Detail label="Contact" value={customer.contact} />
          <Detail label="Email" value={customer.email} />
          <Detail label="Phone" value={customer.phone} />
          <Detail label="City" value={customer.city} />
        </section>
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Account</h3>
          <Detail label="Code" value={customer.code} />
          <Detail label="Type" value={customer.type} />
          <Detail label="Status" value={customer.status} />
          <Detail label="Credit limit" value={formatCurrency(customer.creditLimit)} />
        </section>
      </div>
      <section>
        <h3 className="qk-section-title" style={{ marginBottom: 10 }}>Sales orders</h3>
        <QkTable columns={orderCols} rows={orders} emptyTitle="No sales orders for this customer." />
      </section>
    </div>
  )
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--qk-border)' }}>
      <span className="qk-secondary">{label}</span>
      <strong>{value}</strong>
    </div>
  )
}
