interface QkMetricProps {
  label: string
  value: string | number
  hint?: string
  trend?: string
}

export function QkMetric({ label, value, hint, trend }: QkMetricProps) {
  return (
    <div
      className="qk-surface"
      style={{
        padding: '12px 14px',
        display: 'flex',
        flexDirection: 'column',
        gap: 4,
        minWidth: 0,
      }}
    >
      <div style={{ fontSize: 'var(--qk-font-label)', color: 'var(--qk-text-secondary)', fontWeight: 500 }}>
        {label}
      </div>
      <div style={{ fontSize: 22, fontWeight: 600, letterSpacing: '-0.02em', lineHeight: 1.2 }}>
        {value}
      </div>
      {(hint || trend) && (
        <div style={{ fontSize: 'var(--qk-font-helper)', color: 'var(--qk-text-muted)' }}>
          {trend && <span style={{ color: 'var(--qk-primary)', marginRight: 6 }}>{trend}</span>}
          {hint}
        </div>
      )}
    </div>
  )
}
