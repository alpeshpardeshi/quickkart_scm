import { PageHeader } from '../../components/layout/PageHeader'
import { QkMetric, QkTable, type QkColumn } from '../../components/ui'
import { useData } from '../../context/DataContext'
import type { Role } from '../../types'

export function RolesPage() {
  const { roles, permissionMatrix } = useData()

  const roleCols: QkColumn<Role>[] = [
    { key: 'name', header: 'Role', render: (r) => <strong>{r.name}</strong> },
    { key: 'description', header: 'Description' },
    { key: 'users', header: 'Users', align: 'right' },
    { key: 'permissions', header: 'Permissions', render: (r) => r.permissions.join(', ') },
  ]

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Roles" subtitle="Access roles and module permission matrix." />
      <div className="qk-grid-metrics">
        <QkMetric label="Roles" value={roles.length} />
        <QkMetric label="Assigned users" value={roles.reduce((s, r) => s + r.users, 0)} />
      </div>
      <QkTable columns={roleCols} rows={roles} emptyTitle="No roles defined." />
      <section className="qk-surface" style={{ padding: 16, overflow: 'auto' }}>
        <h3 className="qk-section-title" style={{ marginBottom: 12 }}>Permission matrix</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--qk-font-table)' }}>
          <thead>
            <tr>
              {['Module', 'Admin', 'Manager', 'Procurement', 'Operator', 'QC', 'Auditor'].map((h) => (
                <th key={h} style={{ textAlign: 'left', padding: '8px 10px', borderBottom: '1px solid var(--qk-border)', color: 'var(--qk-text-secondary)', fontWeight: 550 }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {permissionMatrix.map((row) => (
              <tr key={row.module}>
                <td style={{ padding: '8px 10px', borderBottom: '1px solid var(--qk-border)', fontWeight: 600 }}>{row.module}</td>
                {(['admin', 'manager', 'procurement', 'operator', 'qc', 'auditor'] as const).map((key) => (
                  <td key={key} style={{ padding: '8px 10px', borderBottom: '1px solid var(--qk-border)' }}>
                    <span style={{ color: row[key] ? 'var(--qk-success)' : 'var(--qk-text-muted)' }}>{row[key] ? 'Allow' : '—'}</span>
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </section>
    </div>
  )
}
