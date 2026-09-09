interface BucketMap {
  available: number
  reserved: number
  qcHold: number
  damaged: number
  expired: number
}

const COLORS = {
  available: 'var(--qk-success)',
  reserved: 'var(--qk-info)',
  qcHold: 'var(--qk-warning)',
  damaged: 'var(--qk-danger)',
  expired: '#7A4E4E',
}

const LABELS: Record<keyof BucketMap, string> = {
  available: 'Available',
  reserved: 'Reserved',
  qcHold: 'QC Hold',
  damaged: 'Damaged',
  expired: 'Expired',
}

export function InventoryHealth({
  buckets,
  total,
  availablePct,
  reservedPct,
  blockedPct,
  atRiskPct,
}: {
  buckets: BucketMap
  total: number
  availablePct: number
  reservedPct: number
  blockedPct: number
  atRiskPct: number
}) {
  const entries = (Object.keys(buckets) as (keyof BucketMap)[])
    .map((key) => ({ key, value: buckets[key], color: COLORS[key], label: LABELS[key] }))
    .filter((e) => e.value > 0 || total === 0)

  const size = 132
  const stroke = 18
  const r = (size - stroke) / 2
  const c = 2 * Math.PI * r
  let offset = 0

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'min(132px, 38%) minmax(0, 1fr)', gap: 12, alignItems: 'center' }}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} aria-label="Inventory distribution" style={{ maxWidth: '100%', height: 'auto' }}>
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="var(--qk-bg)" strokeWidth={stroke} />
        {entries.map((e) => {
          const frac = total ? e.value / total : 0
          const dash = frac * c
          const el = (
            <circle
              key={e.key}
              cx={size / 2}
              cy={size / 2}
              r={r}
              fill="none"
              stroke={e.color}
              strokeWidth={stroke}
              strokeDasharray={`${dash} ${c - dash}`}
              strokeDashoffset={-offset}
              strokeLinecap="butt"
              transform={`rotate(-90 ${size / 2} ${size / 2})`}
              style={{ transition: 'stroke-dasharray 0.7s ease' }}
            />
          )
          offset += dash
          return el
        })}
        <text
          x="50%"
          y="48%"
          textAnchor="middle"
          style={{ fontSize: 11, fill: 'var(--qk-text-muted)', fontWeight: 500 }}
        >
          Total
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          style={{ fontSize: 15, fill: 'var(--qk-text)', fontWeight: 650 }}
        >
          {total.toLocaleString('en-IN')}
        </text>
      </svg>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 7, minWidth: 0 }}>
        {entries.map((e) => (
          <div key={e.key} style={{ minWidth: 0 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr auto', gap: 8, fontSize: 12, marginBottom: 3, alignItems: 'center' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--qk-text-secondary)', minWidth: 0 }}>
                <span style={{ width: 8, height: 8, borderRadius: 2, background: e.color, flexShrink: 0 }} />
                <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{e.label}</span>
              </span>
              <strong style={{ fontVariantNumeric: 'tabular-nums' }}>{e.value.toLocaleString('en-IN')}</strong>
            </div>
            <div style={{ height: 5, borderRadius: 999, background: 'var(--qk-bg)', overflow: 'hidden' }}>
              <div
                className="qk-dash-bar-fill"
                style={{
                  width: `${total ? Math.round((e.value / total) * 100) : 0}%`,
                  height: '100%',
                  background: e.color,
                  borderRadius: 999,
                }}
              />
            </div>
          </div>
        ))}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 4,
            marginTop: 2,
            fontSize: 11,
            color: 'var(--qk-text-muted)',
          }}
        >
          <span>Available {availablePct}%</span>
          <span>Reserved {reservedPct}%</span>
          <span>Blocked {blockedPct}%</span>
          <span>At risk {atRiskPct}%</span>
        </div>
      </div>
    </div>
  )
}
