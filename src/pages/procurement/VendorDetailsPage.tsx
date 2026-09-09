import { Link, useNavigate, useParams } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatCurrency, formatDate, statusTone } from '../../utils'
import type { PurchaseOrder } from '../../types'

export function VendorDetailsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { vendors, purchaseOrders, receiving } = useData()
  const vendor = vendors.find((v) => v.id === id)
  const pos = purchaseOrders.filter((p) => p.vendorId === id || p.vendor === vendor?.name)
  const grns = receiving.filter((r) => r.vendor === vendor?.name)

  if (!vendor) {
    return (
      <div className="qk-page">
        <PageHeader title="Vendor not found" />
        <Link to="/vendors"><QkButton variant="outline">Back</QkButton></Link>
      </div>
    )
  }

  const poCols: QkColumn<PurchaseOrder>[] = [
    { key: 'poNumber', header: 'PO', render: (r) => <Link to={`/purchase-orders/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.poNumber}</Link> },
    { key: 'warehouse', header: 'Warehouse' },
    { key: 'amount', header: 'Amount', align: 'right', render: (r) => formatCurrency(r.amount) },
    { key: 'expectedDelivery', header: 'Expected', render: (r) => formatDate(r.expectedDelivery) },
    { key: 'status', header: 'Status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'zohoStatus', header: 'Zoho', render: (r) => <QkStatusBadge label={r.zohoStatus} tone={statusTone(r.zohoStatus)} /> },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title={vendor.name}
        subtitle={`${vendor.code} · ${vendor.city}`}
        actions={
          <>
            <Link to="/vendors"><QkButton variant="outline">All vendors</QkButton></Link>
            <Link to="/vendors"><QkButton variant="outline">Edit</QkButton></Link>
            <QkButton onClick={() => navigate('/purchase-orders/new')}>Create PO</QkButton>
          </>
        }
      />
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <QkStatusBadge label={vendor.status} tone={statusTone(vendor.status)} />
        {vendor.categories.map((c) => (
          <QkStatusBadge key={c} label={c} tone="neutral" dot={false} />
        ))}
      </div>

      <div className="qk-grid-metrics">
        <QkMetric label="Lead time" value={`${vendor.leadTimeDays} days`} />
        <QkMetric label="Purchase orders" value={pos.length} />
        <QkMetric label="PO value" value={formatCurrency(pos.reduce((s, p) => s + p.amount, 0))} />
        <QkMetric label="GRNs" value={grns.length} />
      </div>

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Contact</h3>
          <Row label="Contact" value={vendor.contact} />
          <Row label="Email" value={vendor.email} />
          <Row label="Phone" value={vendor.phone} />
          <Row label="City" value={vendor.city} />
        </section>
        <section className="qk-surface" style={{ padding: 16 }}>
          <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Account</h3>
          <Row label="Code" value={vendor.code} />
          <Row label="Status" value={vendor.status} />
          <Row label="Categories" value={vendor.categories.join(', ')} />
          <Row label="Created" value={formatDate(vendor.createdAt)} />
        </section>
      </div>

      <section>
        <h3 className="qk-section-title" style={{ marginBottom: 10 }}>Purchase orders</h3>
        <QkTable columns={poCols} rows={pos} storageKey="vendor-pos" emptyTitle="No purchase orders for this vendor." />
      </section>
    </div>
  )
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 13, padding: '6px 0', borderBottom: '1px solid var(--qk-border)' }}>
      <span className="qk-secondary">{label}</span>
      <strong style={{ textAlign: 'right' }}>{value}</strong>
    </div>
  )
}
