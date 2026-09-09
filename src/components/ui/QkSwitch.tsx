interface QkSwitchProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label?: string
  disabled?: boolean
}

export function QkSwitch({ checked, onChange, label, disabled }: QkSwitchProps) {
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
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        style={{
          width: 36,
          height: 20,
          borderRadius: 999,
          border: 'none',
          padding: 2,
          background: checked ? 'var(--qk-primary)' : 'var(--qk-border-strong)',
          cursor: disabled ? 'not-allowed' : 'pointer',
          transition: 'background 140ms ease',
        }}
      >
        <span
          style={{
            display: 'block',
            width: 16,
            height: 16,
            borderRadius: '50%',
            background: '#fff',
            transform: checked ? 'translateX(16px)' : 'translateX(0)',
            transition: 'transform 140ms ease',
          }}
        />
      </button>
      {label}
    </label>
  )
}
