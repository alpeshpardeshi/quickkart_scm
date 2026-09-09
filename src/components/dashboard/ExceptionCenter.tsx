import { Link } from 'react-router-dom'

interface ExceptionItem {
  id: string
  severity: 'critical' | 'warning' | 'info'
  type: string
  message: string
  count: number
  action: string
  to: string
}

const TONE = {
  critical: { label: 'Critical', color: 'var(--qk-danger)', soft: 'var(--qk-danger-soft)' },
  warning: { label: 'Warning', color: 'var(--qk-warning)', soft: 'var(--qk-warning-soft)' },
  info: { label: 'Info', color: 'var(--qk-info)', soft: 'var(--qk-info-soft)' },
}

export function ExceptionCenter({
  items,
  layout = 'stack',
}: {
  items: ExceptionItem[]
  layout?: 'stack' | 'grid'
}) {
  if (!items.length) {
    return (
      <div style={{ fontSize: 13, color: 'var(--qk-text-muted)', padding: '4px 0' }}>
        No exceptions right now — operations look clear.
      </div>
    )
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: layout === 'grid' ? 'repeat(auto-fill, minmax(280px, 1fr))' : '1fr',
        gap: 8,
      }}
    >
      {items.map((item) => {
        const tone = TONE[item.severity]
        return (
          <div
            key={item.id}
            className={item.severity === 'critical' ? 'qk-dash-critical-pulse' : undefined}
            style={{
              display: 'grid',
              gridTemplateColumns: 'minmax(0, 1fr) auto',
              gap: 8,
              alignItems: 'center',
              padding: '8px 10px',
              borderRadius: 'var(--qk-radius)',
              border: `1px solid ${tone.color}33`,
              background: tone.soft,
              minWidth: 0,
            }}
          >
            <div style={{ minWidth: 0 }}>
              <div style={{ display: 'flex', gap: 6, alignItems: 'center', flexWrap: 'wrap' }}>
                <span
                  aria-hidden
                  style={{
                    width: 7,
                    height: 7,
                    borderRadius: '50%',
                    background: tone.color,
                    flexShrink: 0,
                  }}
                />
                <strong style={{ fontSize: 12.5 }}>{item.type}</strong>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: 650,
                    color: tone.color,
                    textTransform: 'uppercase',
                    letterSpacing: '0.03em',
                  }}
                >
                  {tone.label} · {item.count}
                </span>
              </div>
              <div
                style={{
                  fontSize: 11.5,
                  color: 'var(--qk-text-secondary)',
                  marginTop: 2,
                  lineHeight: 1.35,
                }}
              >
                {item.message}
              </div>
            </div>
            <Link
              to={item.to}
              style={{
                flexShrink: 0,
                fontSize: 11,
                fontWeight: 600,
                color: tone.color,
                padding: '5px 9px',
                borderRadius: 5,
                border: `1px solid ${tone.color}55`,
                background: 'var(--qk-surface)',
                whiteSpace: 'nowrap',
              }}
            >
              {item.action}
            </Link>
          </div>
        )
      })}
    </div>
  )
}
