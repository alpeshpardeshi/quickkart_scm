import { useState } from 'react'
import { Link } from 'react-router-dom'
import type { PipelineStage } from './useDashboardData'

/** Short display labels so 8 stages fit without ellipsis. */
const SHORT: Record<string, string> = {
  Draft: 'Draft',
  Confirmed: 'Confirmed',
  Reserved: 'Reserved',
  Picking: 'Picking',
  Packed: 'Packed',
  'Dispatch Ready': 'Ready',
  Dispatched: 'Dispatched',
  Delivered: 'Delivered',
}

export function OrderPipeline({ stages }: { stages: PipelineStage[] }) {
  const [active, setActive] = useState<string | null>(null)
  const max = Math.max(...stages.map((s) => s.count), 1)
  const selected =
    stages.find((s) => s.id === active)
    || stages.find((s) => s.count === Math.max(...stages.map((x) => x.count)))

  return (
    <div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: `repeat(${stages.length}, minmax(0, 1fr))`,
          gap: 8,
          alignItems: 'end',
        }}
      >
        {stages.map((stage) => {
          const isActive = active === stage.id || (!active && selected?.id === stage.id)
          const height = 24 + Math.round((stage.count / max) * 56)
          const label = SHORT[stage.label] || stage.label
          return (
            <Link
              key={stage.id}
              to={stage.to}
              title={`${stage.label}: ${stage.count} — ${stage.hint}`}
              onMouseEnter={() => setActive(stage.id)}
              onMouseLeave={() => setActive(null)}
              onFocus={() => setActive(stage.id)}
              onBlur={() => setActive(null)}
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'flex-end',
                gap: 5,
                padding: '8px 4px',
                borderRadius: 'var(--qk-radius)',
                border: `1px solid ${isActive ? 'var(--qk-primary)' : 'transparent'}`,
                background: isActive ? 'var(--qk-primary-soft)' : 'transparent',
                transition: 'background 0.15s ease, border-color 0.15s ease',
                textAlign: 'center',
                minWidth: 0,
              }}
            >
              <div
                style={{
                  width: '55%',
                  maxWidth: 40,
                  height,
                  borderRadius: 4,
                  background: stage.count > 0 ? 'var(--qk-primary)' : 'var(--qk-border)',
                  opacity: stage.count > 0 ? 0.9 : 0.45,
                  transition: 'height 0.45s cubic-bezier(0.22, 1, 0.36, 1)',
                }}
              />
              <div style={{ fontSize: 16, fontWeight: 650, letterSpacing: '-0.02em', lineHeight: 1 }}>
                {stage.count}
              </div>
              <div
                style={{
                  fontSize: 11,
                  fontWeight: isActive ? 600 : 500,
                  color: isActive ? 'var(--qk-text)' : 'var(--qk-text-secondary)',
                  lineHeight: 1.2,
                  width: '100%',
                }}
              >
                {label}
              </div>
            </Link>
          )
        })}
      </div>
      {selected && (
        <div
          style={{
            marginTop: 10,
            padding: '8px 10px',
            borderRadius: 'var(--qk-radius)',
            background: 'var(--qk-bg)',
            fontSize: 12,
            color: 'var(--qk-text-secondary)',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            gap: 8,
            flexWrap: 'wrap',
          }}
        >
          <span style={{ minWidth: 0 }}>
            <strong style={{ color: 'var(--qk-text)' }}>{selected.label}</strong>
            {' · '}
            {selected.hint}
          </span>
          <Link to={selected.to} style={{ color: 'var(--qk-primary)', fontWeight: 600, flexShrink: 0 }}>
            View queue →
          </Link>
        </div>
      )}
    </div>
  )
}
