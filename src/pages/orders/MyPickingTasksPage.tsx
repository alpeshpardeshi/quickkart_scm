import { Link } from 'react-router-dom'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge, QkTable, type QkColumn } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { formatDateTime, statusTone } from '../../utils'
import type { Picklist } from '../../types'

export function MyPickingTasksPage() {
  const { user } = useAuth()
  const { picklists } = useData()
  const mine = picklists.filter(
    (p) =>
      (p.assignedTo === user?.name || p.assignedTo === 'Suresh Yadav') &&
      (p.status === 'Open' || p.status === 'In Progress'),
  )

  const columns: QkColumn<Picklist>[] = [
    { key: 'picklistNo', header: 'Picklist', mobile: 'title', render: (r) => <Link to={`/picklists/${r.id}`} style={{ color: 'var(--qk-primary)', fontWeight: 600 }}>{r.picklistNo}</Link> },
    { key: 'soNumber', header: 'SO', mobile: 'subtitle' },
    { key: 'warehouse', header: 'Warehouse', mobile: 'meta' },
    { key: 'items', header: 'Items', align: 'right', mobile: 'field' },
    { key: 'picked', header: 'Picked', align: 'right', mobile: 'field' },
    { key: 'priority', header: 'Priority', mobile: 'meta', render: (r) => <QkStatusBadge label={r.priority} tone={statusTone(r.priority)} /> },
    { key: 'status', header: 'Status', mobile: 'status', render: (r) => <QkStatusBadge label={r.status} tone={statusTone(r.status)} /> },
    { key: 'createdAt', header: 'Created', render: (r) => formatDateTime(r.createdAt) },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="My Picking Tasks"
        subtitle={`Assigned to ${user?.name || 'current operator'}.`}
        actions={<Link to="/picking"><QkButton>Open picking screen</QkButton></Link>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="My open tasks" value={mine.length} />
        <QkMetric label="In progress" value={mine.filter((p) => p.status === 'In Progress').length} />
        <QkMetric label="Lines remaining" value={mine.reduce((s, p) => s + Math.max(0, p.items - p.picked), 0)} />
      </div>
      <QkTable mobileMode="cards" columns={columns} rows={mine} emptyTitle="No picking tasks assigned to you." />
    </div>
  )
}
