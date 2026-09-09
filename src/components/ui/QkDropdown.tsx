import { useEffect, useRef, useState, type ReactNode } from 'react'

interface QkDropdownItem {
  id: string
  label: string
  onClick: () => void
  danger?: boolean
  icon?: ReactNode
}

interface QkDropdownProps {
  trigger: ReactNode
  items: QkDropdownItem[]
  align?: 'left' | 'right'
}

export function QkDropdown({ trigger, items, align = 'right' }: QkDropdownProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-flex' }}>
      <div onClick={() => setOpen((v) => !v)}>{trigger}</div>
      {open && (
        <div
          role="menu"
          className="qk-animate-in"
          style={{
            position: 'absolute',
            top: 'calc(100% + 6px)',
            [align === 'right' ? 'right' : 'left']: 0,
            minWidth: 180,
            background: 'var(--qk-elevated)',
            border: '1px solid var(--qk-border)',
            borderRadius: 'var(--qk-radius)',
            boxShadow: 'var(--qk-shadow-md)',
            padding: 4,
            zIndex: 40,
          }}
        >
          {items.map((item) => (
            <button
              key={item.id}
              type="button"
              role="menuitem"
              onClick={() => {
                item.onClick()
                setOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                height: 34,
                padding: '0 10px',
                border: 'none',
                borderRadius: 4,
                background: 'transparent',
                color: item.danger ? 'var(--qk-danger)' : 'var(--qk-text)',
                fontSize: 13,
                cursor: 'pointer',
                textAlign: 'left',
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'var(--qk-bg)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent'
              }}
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
