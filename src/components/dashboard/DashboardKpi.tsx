import { useEffect, useState, type ReactNode } from 'react'
import { Link } from 'react-router-dom'
import type { LucideIcon } from 'lucide-react'

interface DashboardKpiProps {
  label: string
  value: number
  hint: string
  icon: LucideIcon
  to: string
  delay?: number
  accent?: string
}

function useCountUp(target: number, active: boolean, duration = 700) {
  const [value, setValue] = useState(0)
  useEffect(() => {
    if (!active) {
      setValue(target)
      return
    }
    let frame = 0
    const start = performance.now()
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - (1 - t) ** 3
      setValue(Math.round(target * eased))
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [target, active, duration])
  return value
}

export function DashboardKpi({ label, value, hint, icon: Icon, to, delay = 0, accent = 'var(--qk-primary)' }: DashboardKpiProps) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const id = window.setTimeout(() => setReady(true), delay)
    return () => window.clearTimeout(id)
  }, [delay])
  const display = useCountUp(value, ready)

  return (
    <Link
      to={to}
      className="qk-dash-card qk-dash-card-link qk-dash-enter"
      style={{ padding: '12px 12px', animationDelay: `${delay}ms`, minWidth: 0 }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8 }}>
        <div
          style={{
            fontSize: 11.5,
            fontWeight: 500,
            color: 'var(--qk-text-secondary)',
            lineHeight: 1.25,
            minWidth: 0,
          }}
        >
          {label}
        </div>
        <span
          style={{
            width: 26,
            height: 26,
            borderRadius: 7,
            display: 'grid',
            placeItems: 'center',
            background: 'var(--qk-primary-soft)',
            color: accent,
            flexShrink: 0,
          }}
        >
          <Icon size={13} />
        </span>
      </div>
      <div style={{ fontSize: 22, fontWeight: 650, letterSpacing: '-0.03em', marginTop: 6, lineHeight: 1.1 }}>
        {display.toLocaleString('en-IN')}
      </div>
      <div
        style={{
          fontSize: 11,
          color: 'var(--qk-text-muted)',
          marginTop: 6,
          lineHeight: 1.3,
          overflow: 'hidden',
          display: '-webkit-box',
          WebkitLineClamp: 2,
          WebkitBoxOrient: 'vertical',
        }}
      >
        {hint}
      </div>
    </Link>
  )
}

export function DashSection({
  title,
  action,
  children,
  delay = 0,
  className = '',
}: {
  title: string
  action?: ReactNode
  children: ReactNode
  delay?: number
  className?: string
}) {
  return (
    <section
      className={`qk-dash-card qk-dash-enter ${className}`}
      style={{ padding: 14, animationDelay: `${delay}ms` }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12, gap: 8 }}>
        <h2 className="qk-section-title" style={{ margin: 0 }}>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  )
}
