import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkMetric, QkStatusBadge } from '../../components/ui'
import { useData } from '../../context/DataContext'
import { formatDateTime } from '../../utils'

export function NotificationsPage() {
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData()
  const unread = notifications.filter((n) => !n.read).length

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader
        title="Notifications"
        subtitle="Operational alerts across inventory, tasks, and QC."
        actions={<QkButton variant="outline" onClick={markAllNotificationsRead}>Mark all read</QkButton>}
      />
      <div className="qk-grid-metrics">
        <QkMetric label="Total" value={notifications.length} />
        <QkMetric label="Unread" value={unread} />
        <QkMetric label="Warnings" value={notifications.filter((n) => n.type === 'warning' || n.type === 'danger').length} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
        {notifications.map((n) => (
          <button
            key={n.id}
            type="button"
            onClick={() => markNotificationRead(n.id)}
            className="qk-surface"
            style={{
              textAlign: 'left',
              padding: 14,
              cursor: 'pointer',
              background: n.read ? 'var(--qk-surface)' : 'var(--qk-primary-soft)',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
              <div>
                <div style={{ fontWeight: 600, fontSize: 13 }}>{n.title}</div>
                <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)', marginTop: 4 }}>{n.message}</div>
                <div style={{ fontSize: 11, color: 'var(--qk-text-muted)', marginTop: 8 }}>{formatDateTime(n.createdAt)}</div>
              </div>
              <QkStatusBadge label={n.type} tone={n.type === 'danger' ? 'danger' : n.type === 'warning' ? 'warning' : n.type === 'success' ? 'success' : 'info'} />
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
