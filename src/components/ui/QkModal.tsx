import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { QkButton } from './QkButton'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface QkModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
  /** Compact confirm-style; stays centered on mobile */
  compact?: boolean
}

export function QkModal({ open, onClose, title, children, footer, width = 480, compact }: QkModalProps) {
  const { isMobile } = useBreakpoint()
  const fullBleed = isMobile && !compact && width >= 420

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = prev
    }
  }, [open, onClose])

  if (!open) return null

  if (fullBleed) {
    return (
      <div className="qk-sheet-root" style={{ zIndex: 70 }}>
        <button type="button" className="qk-sheet-backdrop" aria-label="Close" onClick={onClose} />
        <div className="qk-sheet qk-sheet--bottom qk-sheet--tall" role="dialog" aria-modal="true" aria-label={title}>
          <div className="qk-sheet__handle" />
          <header className="qk-sheet__header">
            <div style={{ fontWeight: 650, fontSize: 16 }}>{title}</div>
            <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
              <X size={18} />
            </QkButton>
          </header>
          <div className="qk-sheet__body">{children}</div>
          {footer && <footer className="qk-sheet__footer">{footer}</footer>}
        </div>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 70, display: 'grid', placeItems: 'center', padding: 16 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--qk-overlay)' }} />
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="qk-animate-in"
        style={{
          position: 'relative',
          width: `min(${width}px, 100%)`,
          maxHeight: 'min(90vh, 100%)',
          background: 'var(--qk-surface)',
          border: '1px solid var(--qk-border)',
          borderRadius: 'calc(var(--qk-radius) + 2px)',
          boxShadow: 'var(--qk-shadow-md)',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--qk-border)',
            flexShrink: 0,
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </QkButton>
        </header>
        <div style={{ padding: 16, overflow: 'auto', flex: 1 }}>{children}</div>
        {footer && (
          <footer
            style={{
              padding: 14,
              borderTop: '1px solid var(--qk-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'wrap',
              flexShrink: 0,
            }}
          >
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
