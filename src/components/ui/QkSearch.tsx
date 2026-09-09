import { Search, X } from 'lucide-react'
import { QkInput } from './QkInput'

interface QkSearchProps {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  style?: React.CSSProperties
}

export function QkSearch({ value, onChange, placeholder = 'Search...', style }: QkSearchProps) {
  return (
    <QkInput
      value={value}
      onChange={(e) => onChange(e.target.value)}
      placeholder={placeholder}
      leftIcon={<Search size={14} />}
      rightSlot={
        value ? (
          <button
            type="button"
            onClick={() => onChange('')}
            aria-label="Clear search"
            style={{
              border: 'none',
              background: 'transparent',
              color: 'var(--qk-text-muted)',
              cursor: 'pointer',
              display: 'flex',
              padding: 2,
            }}
          >
            <X size={14} />
          </button>
        ) : undefined
      }
      style={{ minWidth: 220, ...style }}
    />
  )
}
