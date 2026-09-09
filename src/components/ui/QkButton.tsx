import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'outline'
type Size = 'sm' | 'md'

interface QkButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  loading?: boolean
  leftIcon?: ReactNode
  rightIcon?: ReactNode
}

const styles: Record<Variant, React.CSSProperties> = {
  primary: {
    background: 'var(--qk-primary)',
    color: '#fff',
    border: '1px solid var(--qk-primary)',
  },
  secondary: {
    background: 'var(--qk-primary-soft)',
    color: 'var(--qk-primary)',
    border: '1px solid transparent',
  },
  ghost: {
    background: 'transparent',
    color: 'var(--qk-text-secondary)',
    border: '1px solid transparent',
  },
  danger: {
    background: 'var(--qk-danger-soft)',
    color: 'var(--qk-danger)',
    border: '1px solid transparent',
  },
  outline: {
    background: 'var(--qk-surface)',
    color: 'var(--qk-text)',
    border: '1px solid var(--qk-border)',
  },
}

export const QkButton = forwardRef<HTMLButtonElement, QkButtonProps>(
  ({ variant = 'primary', size = 'md', loading, leftIcon, rightIcon, children, disabled, style, className, ...props }, ref) => {
    const h = size === 'sm' ? 'calc(var(--qk-btn-h) - 4px)' : 'var(--qk-btn-h)'
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={className}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          height: h,
          padding: '0 12px',
          borderRadius: 'var(--qk-radius)',
          fontSize: 'var(--qk-font-btn)',
          fontWeight: 500,
          cursor: disabled || loading ? 'not-allowed' : 'pointer',
          opacity: disabled || loading ? 0.55 : 1,
          whiteSpace: 'nowrap',
          transition: 'background 120ms ease, border-color 120ms ease, color 120ms ease',
          ...styles[variant],
          ...style,
        }}
        {...props}
      >
        {loading ? <Loader2 size={14} style={{ animation: 'spin 0.8s linear infinite' }} /> : leftIcon}
        {children}
        {!loading && rightIcon}
      </button>
    )
  },
)

QkButton.displayName = 'QkButton'
