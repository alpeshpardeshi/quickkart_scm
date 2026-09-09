import { Check } from 'lucide-react'

interface Step {
  id: string
  label: string
}

interface QkStepperProps {
  steps: Step[]
  current: string
  /** When set, steps become clickable navigation targets. */
  onStepClick?: (stepId: string) => void
}

export function QkStepper({ steps, current, onStepClick }: QkStepperProps) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === current))
  return (
    <div
      role="list"
      aria-label="Progress"
      style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 2 }}
    >
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        const clickable = Boolean(onStepClick)
        const content = (
          <>
            <span
              style={{
                width: 22,
                height: 22,
                borderRadius: '50%',
                display: 'grid',
                placeItems: 'center',
                fontSize: 11,
                fontWeight: 600,
                flexShrink: 0,
                background: done || active ? 'var(--qk-primary)' : 'var(--qk-bg)',
                color: done || active ? '#fff' : 'var(--qk-text-muted)',
                border: done || active ? 'none' : '1px solid var(--qk-border)',
              }}
            >
              {done ? <Check size={12} /> : index + 1}
            </span>
            <span
              style={{
                fontSize: 12,
                fontWeight: active ? 600 : 500,
                color: active ? 'var(--qk-text)' : done ? 'var(--qk-text-secondary)' : 'var(--qk-text-muted)',
                whiteSpace: 'nowrap',
              }}
            >
              {step.label}
            </span>
          </>
        )

        return (
          <div key={step.id} role="listitem" style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
            {clickable ? (
              <button
                type="button"
                onClick={() => onStepClick?.(step.id)}
                aria-current={active ? 'step' : undefined}
                title={`Go to ${step.label}`}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  margin: 0,
                  padding: '4px 2px',
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  borderRadius: 'var(--qk-radius)',
                }}
              >
                {content}
              </button>
            ) : (
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }} aria-current={active ? 'step' : undefined}>
                {content}
              </div>
            )}
            {index < steps.length - 1 && (
              <div
                aria-hidden
                style={{
                  width: 28,
                  height: 1,
                  margin: '0 10px',
                  background: index < currentIndex ? 'var(--qk-primary)' : 'var(--qk-border)',
                }}
              />
            )}
          </div>
        )
      })}
    </div>
  )
}
