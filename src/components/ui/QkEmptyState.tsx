interface QkEmptyStateProps {
  title: string
  description?: string
  action?: React.ReactNode
  tone?: 'neutral' | 'danger'
}

export function QkEmptyState({ title, description, action, tone = 'neutral' }: QkEmptyStateProps) {
  return (
    <div
      style={{
        padding: '40px 20px',
        textAlign: 'center',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 8,
      }}
    >
      <div
        style={{
          width: 40,
          height: 40,
          borderRadius: 10,
          background: tone === 'danger' ? 'var(--qk-danger-soft)' : 'var(--qk-bg)',
          border: '1px solid var(--qk-border)',
          display: 'grid',
          placeItems: 'center',
          color: tone === 'danger' ? 'var(--qk-danger)' : 'var(--qk-text-muted)',
          fontSize: 16,
          fontWeight: 600,
        }}
      >
        ∅
      </div>
      <div style={{ fontWeight: 600, fontSize: 14 }}>{title}</div>
      {description && (
        <div style={{ color: 'var(--qk-text-secondary)', fontSize: 'var(--qk-font-helper)', maxWidth: 360 }}>
          {description}
        </div>
      )}
      {action && <div style={{ marginTop: 8 }}>{action}</div>}
    </div>
  )
}
