import { useId, useState, type ReactNode } from 'react'

interface QkTooltipProps {
  content: string
  children: ReactNode
  side?: 'top' | 'right'
}

export function QkTooltip({ content, children, side = 'top' }: QkTooltipProps) {
  const [open, setOpen] = useState(false)
  const id = useId()
  return (
    <span
      style={{ position: 'relative', display: 'flex', justifyContent: 'center' }}
      onMouseEnter={() => setOpen(true)}
      onMouseLeave={() => setOpen(false)}
      onFocus={() => setOpen(true)}
      onBlur={() => setOpen(false)}
    >
      <span aria-describedby={open ? id : undefined}>{children}</span>
      {open && (
        <span
          id={id}
          role="tooltip"
          style={{
            position: 'absolute',
            zIndex: 50,
            ...(side === 'top'
              ? { bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)' }
              : { left: 'calc(100% + 8px)', top: '50%', transform: 'translateY(-50%)' }),
            background: 'var(--qk-text)',
            color: 'var(--qk-surface)',
            fontSize: 11,
            fontWeight: 500,
            padding: '4px 8px',
            borderRadius: 4,
            whiteSpace: 'nowrap',
            pointerEvents: 'none',
          }}
        >
          {content}
        </span>
      )}
    </span>
  )
}
