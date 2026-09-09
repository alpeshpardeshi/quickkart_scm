interface QkRadioOption {
  label: string
  value: string
}

interface QkRadioProps {
  name: string
  value: string
  onChange: (value: string) => void
  options: QkRadioOption[]
  label?: string
}

export function QkRadio({ name, value, onChange, options, label }: QkRadioProps) {
  return (
    <fieldset style={{ border: 'none', margin: 0, padding: 0 }}>
      {label && (
        <legend style={{ fontSize: 'var(--qk-font-label)', fontWeight: 500, color: 'var(--qk-text-secondary)', marginBottom: 6 }}>
          {label}
        </legend>
      )}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
        {options.map((opt) => (
          <label
            key={opt.value}
            style={{ display: 'inline-flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 'var(--qk-font-body)' }}
          >
            <input
              type="radio"
              name={name}
              value={opt.value}
              checked={value === opt.value}
              onChange={() => onChange(opt.value)}
              style={{ accentColor: 'var(--qk-primary)' }}
            />
            {opt.label}
          </label>
        ))}
      </div>
    </fieldset>
  )
}
