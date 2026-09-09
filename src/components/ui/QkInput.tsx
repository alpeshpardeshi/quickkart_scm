import { forwardRef, type InputHTMLAttributes, type ReactNode } from 'react'

interface QkInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  hint?: string
  error?: string
  leftIcon?: ReactNode
  rightSlot?: ReactNode
}

export const QkInput = forwardRef<HTMLInputElement, QkInputProps>(
  ({ label, hint, error, leftIcon, rightSlot, style, id, ...props }, ref) => {
    const inputId = id || props.name
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {label && (
          <span style={{ fontSize: 'var(--qk-font-label)', fontWeight: 500, color: 'var(--qk-text-secondary)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--qk-danger)' }}> *</span>}
          </span>
        )}
        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          {leftIcon && (
            <span style={{ position: 'absolute', left: 10, color: 'var(--qk-text-muted)', display: 'flex' }}>
              {leftIcon}
            </span>
          )}
          <input
            ref={ref}
            id={inputId}
            style={{
              width: '100%',
              height: 'var(--qk-input-h)',
              paddingLeft: leftIcon ? 32 : 10,
              paddingRight: rightSlot ? 36 : 10,
              borderRadius: 'var(--qk-radius)',
              border: `1px solid ${error ? 'var(--qk-danger)' : 'var(--qk-border)'}`,
              background: props.disabled ? 'var(--qk-bg)' : 'var(--qk-surface)',
              color: 'var(--qk-text)',
              fontSize: 'var(--qk-font-body)',
              outline: 'none',
              ...style,
            }}
            {...props}
          />
          {rightSlot && (
            <span style={{ position: 'absolute', right: 8, display: 'flex', alignItems: 'center' }}>{rightSlot}</span>
          )}
        </div>
        {(error || hint) && (
          <span style={{ fontSize: 'var(--qk-font-helper)', color: error ? 'var(--qk-danger)' : 'var(--qk-text-muted)' }}>
            {error || hint}
          </span>
        )}
      </label>
    )
  },
)

QkInput.displayName = 'QkInput'
