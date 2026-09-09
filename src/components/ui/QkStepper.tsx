import { Check } from 'lucide-react'

interface Step {
  id: string
  label: string
}

interface QkStepperProps {
  steps: Step[]
  current: string
}

export function QkStepper({ steps, current }: QkStepperProps) {
  const currentIndex = Math.max(0, steps.findIndex((s) => s.id === current))
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 0, overflowX: 'auto', paddingBottom: 2 }}>
      {steps.map((step, index) => {
        const done = index < currentIndex
        const active = index === currentIndex
        return (
          <div key={step.id} style={{ display: 'flex', alignItems: 'center', flex: '0 0 auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span
                style={{
                  width: 22,
                  height: 22,
                  borderRadius: '50%',
                  display: 'grid',
                  placeItems: 'center',
                  fontSize: 11,
                  fontWeight: 600,
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
                  color: active ? 'var(--qk-text)' : 'var(--qk-text-secondary)',
                  whiteSpace: 'nowrap',
                }}
              >
                {step.label}
              </span>
            </div>
            {index < steps.length - 1 && (
              <div
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
