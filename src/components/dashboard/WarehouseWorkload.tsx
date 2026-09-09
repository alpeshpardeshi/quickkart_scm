import { Link } from 'react-router-dom'

interface WorkItem {
  id: string
  label: string
  count: number
  to: string
}

export function WarehouseWorkload({ items }: { items: WorkItem[] }) {
  const max = Math.max(...items.map((i) => i.count), 1)
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
      {items.map((item, idx) => (
        <Link
          key={item.id}
          to={item.to}
          style={{
            display: 'grid',
            gridTemplateColumns: '76px minmax(0, 1fr) 24px',
            gap: 8,
            alignItems: 'center',
            fontSize: 12.5,
            minWidth: 0,
          }}
        >
          <span style={{ color: 'var(--qk-text-secondary)', fontWeight: 500 }}>{item.label}</span>
          <div style={{ height: 8, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden', minWidth: 0 }}>
            <div
              className="qk-dash-bar-fill"
              style={{
                width: `${Math.round((item.count / max) * 100)}%`,
                height: '100%',
                background: item.count > 0 ? 'var(--qk-primary)' : 'var(--qk-border)',
                borderRadius: 999,
                animationDelay: `${idx * 60}ms`,
              }}
            />
          </div>
          <strong style={{ textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>{item.count}</strong>
        </Link>
      ))}
    </div>
  )
}
