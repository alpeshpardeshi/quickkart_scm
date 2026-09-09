import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { QkButton } from './QkButton'

interface QkModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
  footer?: ReactNode
  width?: number
}

export function QkModal({ open, onClose, title, children, footer, width = 480 }: QkModalProps) {
  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

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
          background: 'var(--qk-surface)',
          border: '1px solid var(--qk-border)',
          borderRadius: 'calc(var(--qk-radius) + 2px)',
          boxShadow: 'var(--qk-shadow-md)',
          overflow: 'hidden',
        }}
      >
        <header
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '12px 14px',
            borderBottom: '1px solid var(--qk-border)',
          }}
        >
          <div style={{ fontWeight: 600, fontSize: 15 }}>{title}</div>
          <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={16} />
          </QkButton>
        </header>
        <div style={{ padding: 16 }}>{children}</div>
        {footer && (
          <footer style={{ padding: 14, borderTop: '1px solid var(--qk-border)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
            {footer}
          </footer>
        )}
      </div>
    </div>
  )
}
