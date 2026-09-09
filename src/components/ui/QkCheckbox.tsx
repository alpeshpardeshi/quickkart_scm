interface QkCheckboxProps {
  checked: boolean
  onChange: () => void
  label?: string
  'aria-label'?: string
  disabled?: boolean
}

export function QkCheckbox({ checked, onChange, label, disabled, ...rest }: QkCheckboxProps) {
  return (
    <label
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        cursor: disabled ? 'not-allowed' : 'pointer',
        opacity: disabled ? 0.55 : 1,
        fontSize: 'var(--qk-font-body)',
      }}
    >
      <input
        type="checkbox"
        checked={checked}
        disabled={disabled}
        onChange={onChange}
        aria-label={rest['aria-label']}
        style={{
          width: 14,
          height: 14,
          accentColor: 'var(--qk-primary)',
          cursor: disabled ? 'not-allowed' : 'pointer',
        }}
      />
      {label}
    </label>
  )
}
