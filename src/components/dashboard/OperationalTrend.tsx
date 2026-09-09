interface TrendPoint {
  date: string
  label: string
  orders: number
  fulfilled: number
}

export function OperationalTrend({
  days,
  hasSignal,
}: {
  days: TrendPoint[]
  hasSignal: boolean
}) {
  if (!hasSignal) {
    return (
      <div style={{ fontSize: 13, color: 'var(--qk-text-muted)', padding: 12 }}>
        Not enough dated order history in mock data for a multi-day trend. Pipeline and workload widgets use current state instead.
      </div>
    )
  }

  const w = 360
  const h = 140
  const pad = { t: 12, r: 8, b: 28, l: 28 }
  const max = Math.max(...days.map((d) => Math.max(d.orders, d.fulfilled)), 1)
  const innerW = w - pad.l - pad.r
  const innerH = h - pad.t - pad.b
  const step = innerW / Math.max(days.length - 1, 1)

  const points = (key: 'orders' | 'fulfilled') =>
    days
      .map((d, i) => {
        const x = pad.l + i * step
        const y = pad.t + innerH - (d[key] / max) * innerH
        return `${x},${y}`
      })
      .join(' ')

  return (
    <div>
      <svg width="100%" viewBox={`0 0 ${w} ${h}`} role="img" aria-label="Orders over recent days">
        {[0, 0.5, 1].map((t) => {
          const y = pad.t + innerH * (1 - t)
          return (
            <g key={t}>
              <line x1={pad.l} x2={w - pad.r} y1={y} y2={y} stroke="var(--qk-border)" strokeWidth={1} />
              <text x={pad.l - 6} y={y + 3} textAnchor="end" style={{ fontSize: 9, fill: 'var(--qk-text-muted)' }}>
                {Math.round(max * t)}
              </text>
            </g>
          )
        })}
        <polyline
          fill="none"
          stroke="var(--qk-primary)"
          strokeWidth={2}
          points={points('orders')}
          style={{ transition: 'all 0.4s ease' }}
        />
        <polyline
          fill="none"
          stroke="var(--qk-success)"
          strokeWidth={2}
          strokeDasharray="4 3"
          points={points('fulfilled')}
        />
        {days.map((d, i) => {
          const x = pad.l + i * step
          const y = pad.t + innerH - (d.orders / max) * innerH
          return (
            <g key={d.date}>
              <circle cx={x} cy={y} r={3} fill="var(--qk-primary)">
                <title>{`${d.label}: ${d.orders} orders, ${d.fulfilled} fulfilled`}</title>
              </circle>
              <text x={x} y={h - 8} textAnchor="middle" style={{ fontSize: 9, fill: 'var(--qk-text-muted)' }}>
                {d.label.split(' ')[0]}
              </text>
            </g>
          )
        })}
      </svg>
      <div style={{ display: 'flex', gap: 14, fontSize: 11, color: 'var(--qk-text-secondary)', marginTop: 4 }}>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'var(--qk-primary)' }} /> Orders created
        </span>
        <span style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}>
          <span style={{ width: 14, height: 2, background: 'var(--qk-success)', opacity: 0.9 }} /> Dispatched/delivered
        </span>
      </div>
    </div>
  )
}
