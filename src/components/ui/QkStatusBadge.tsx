import type { StatusTone } from '../../types'

const toneStyles: Record<StatusTone, { bg: string; color: string }> = {
  neutral: { bg: 'var(--qk-bg)', color: 'var(--qk-text-secondary)' },
  success: { bg: 'var(--qk-success-soft)', color: 'var(--qk-success)' },
  warning: { bg: 'var(--qk-warning-soft)', color: 'var(--qk-warning)' },
  danger: { bg: 'var(--qk-danger-soft)', color: 'var(--qk-danger)' },
  info: { bg: 'var(--qk-info-soft)', color: 'var(--qk-info)' },
  primary: { bg: 'var(--qk-primary-soft)', color: 'var(--qk-primary)' },
}

interface QkStatusBadgeProps {
  label: string
  tone?: StatusTone
  dot?: boolean
}

export function QkStatusBadge({ label, tone = 'neutral', dot = true }: QkStatusBadgeProps) {
  const t = toneStyles[tone]
  return (
    <span
      title={label}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        minHeight: 22,
        maxWidth: '100%',
        padding: '2px 8px',
        borderRadius: 999,
        background: t.bg,
        color: t.color,
        fontSize: 11,
        fontWeight: 500,
        lineHeight: 1.2,
        boxSizing: 'border-box',
      }}
    >
      {dot && (
        <span
          style={{
            width: 6,
            height: 6,
            borderRadius: '50%',
            background: t.color,
            flexShrink: 0,
          }}
        />
      )}
      <span
        style={{
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          whiteSpace: 'nowrap',
          minWidth: 0,
        }}
      >
        {label}
      </span>
    </span>
  )
}
