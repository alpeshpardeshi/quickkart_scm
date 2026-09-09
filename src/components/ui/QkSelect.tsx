import { forwardRef, type SelectHTMLAttributes } from 'react'
import { ChevronDown } from 'lucide-react'

interface Option {
  label: string
  value: string
}

interface QkSelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  hint?: string
  error?: string
  options: Option[]
  placeholder?: string
}

export const QkSelect = forwardRef<HTMLSelectElement, QkSelectProps>(
  ({ label, hint, error, options, placeholder, style, id, ...props }, ref) => {
    const selectId = id || props.name
    return (
      <label style={{ display: 'flex', flexDirection: 'column', gap: 4, minWidth: 0 }}>
        {label && (
          <span style={{ fontSize: 'var(--qk-font-label)', fontWeight: 500, color: 'var(--qk-text-secondary)' }}>
            {label}
            {props.required && <span style={{ color: 'var(--qk-danger)' }}> *</span>}
          </span>
        )}
        <div style={{ position: 'relative' }}>
          <select
            ref={ref}
            id={selectId}
            style={{
              width: '100%',
              height: 'var(--qk-input-h)',
              padding: '0 30px 0 10px',
              borderRadius: 'var(--qk-radius)',
              border: `1px solid ${error ? 'var(--qk-danger)' : 'var(--qk-border)'}`,
              background: props.disabled ? 'var(--qk-bg)' : 'var(--qk-surface)',
              color: 'var(--qk-text)',
              fontSize: 'var(--qk-font-body)',
              appearance: 'none',
              outline: 'none',
              cursor: props.disabled ? 'not-allowed' : 'pointer',
              ...style,
            }}
            {...props}
          >
            {placeholder && <option value="">{placeholder}</option>}
            {options.map((opt) => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>
          <ChevronDown
            size={14}
            style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--qk-text-muted)', pointerEvents: 'none' }}
          />
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

QkSelect.displayName = 'QkSelect'
