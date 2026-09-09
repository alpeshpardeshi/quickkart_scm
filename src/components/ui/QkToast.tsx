import { X, CheckCircle2, AlertTriangle, Info, XCircle } from 'lucide-react'
import { useToast, type ToastTone } from '../../context/ToastContext'

const icons: Record<ToastTone, React.ReactNode> = {
  success: <CheckCircle2 size={16} />,
  warning: <AlertTriangle size={16} />,
  danger: <XCircle size={16} />,
  info: <Info size={16} />,
}

const colors: Record<ToastTone, string> = {
  success: 'var(--qk-success)',
  warning: 'var(--qk-warning)',
  danger: 'var(--qk-danger)',
  info: 'var(--qk-info)',
}

export function QkToastViewport() {
  const { toasts, dismissToast } = useToast()
  return (
    <div
      style={{
        position: 'fixed',
        top: 16,
        right: 16,
        zIndex: 100,
        display: 'flex',
        flexDirection: 'column',
        gap: 8,
        width: 340,
        maxWidth: 'calc(100vw - 24px)',
      }}
    >
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className="qk-animate-in"
          style={{
            background: 'var(--qk-elevated)',
            border: '1px solid var(--qk-border)',
            borderRadius: 'var(--qk-radius)',
            boxShadow: 'var(--qk-shadow-md)',
            padding: '10px 12px',
            display: 'flex',
            gap: 10,
            alignItems: 'flex-start',
          }}
        >
          <span style={{ color: colors[toast.tone], marginTop: 1 }}>{icons[toast.tone]}</span>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontWeight: 600, fontSize: 13 }}>{toast.title}</div>
            {toast.message && (
              <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)', marginTop: 2 }}>{toast.message}</div>
            )}
          </div>
          <button
            type="button"
            onClick={() => dismissToast(toast.id)}
            aria-label="Dismiss"
            style={{ border: 'none', background: 'transparent', color: 'var(--qk-text-muted)', cursor: 'pointer', padding: 0 }}
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}
