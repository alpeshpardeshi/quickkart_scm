import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { QkButton } from './QkButton'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface QkDrawerProps {
  open: boolean
  onClose: () => void
  title: string
  subtitle?: string
  children: ReactNode
  footer?: ReactNode
  width?: number
  /** Force side drawer even on mobile */
  forceSide?: boolean
}

export function QkDrawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  width = 420,
  forceSide = false,
}: QkDrawerProps) {
  const { isMobile } = useBreakpoint()
  const asSheet = isMobile && !forceSide

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

  if (asSheet) {
    return (
      <div className="qk-sheet-root" style={{ zIndex: 60 }}>
        <button type="button" className="qk-sheet-backdrop" aria-label="Close" onClick={onClose} />
        <aside
          className="qk-sheet qk-sheet--bottom qk-sheet--tall"
          role="dialog"
          aria-modal="true"
          aria-label={title}
        >
          <div className="qk-sheet__handle" />
          <header className="qk-sheet__header">
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650, fontSize: 16 }}>{title}</div>
              {subtitle && (
                <div style={{ fontSize: 'var(--qk-font-helper)', color: 'var(--qk-text-secondary)', marginTop: 2 }}>
                  {subtitle}
                </div>
              )}
            </div>
            <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
              <X size={18} />
            </QkButton>
          </header>
          <div className="qk-sheet__body">{children}</div>
          {footer && <footer className="qk-sheet__footer">{footer}</footer>}
        </aside>
      </div>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 60 }}>
      <div onClick={onClose} style={{ position: 'absolute', inset: 0, background: 'var(--qk-overlay)' }} />
      <aside
        role="dialog"
        aria-modal="true"
        aria-label={title}
        style={{
          position: 'absolute',
          top: 0,
          right: 0,
          height: '100%',
          width: `min(${width}px, 100%)`,
          background: 'var(--qk-surface)',
          borderLeft: '1px solid var(--qk-border)',
          display: 'flex',
          flexDirection: 'column',
          animation: 'qk-slide-in-right 180ms ease-out',
          boxShadow: 'var(--qk-shadow-md)',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'flex-start',
            justifyContent: 'space-between',
            gap: 12,
            padding: '14px 16px',
            borderBottom: '1px solid var(--qk-border)',
          }}
        >
          <div>
            <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
            {subtitle && (
              <div style={{ fontSize: 'var(--qk-font-helper)', color: 'var(--qk-text-secondary)', marginTop: 2 }}>
                {subtitle}
              </div>
            )}
          </div>
          <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close drawer">
            <X size={16} />
          </QkButton>
        </header>
        <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>{children}</div>
        {footer && (
          <footer
            style={{
              padding: 16,
              borderTop: '1px solid var(--qk-border)',
              display: 'flex',
              justifyContent: 'flex-end',
              gap: 8,
              flexWrap: 'wrap',
            }}
          >
            {footer}
          </footer>
        )}
      </aside>
    </div>
  )
}
