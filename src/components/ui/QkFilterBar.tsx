import { X } from 'lucide-react'
import type { ReactNode } from 'react'
import { QkSearch } from './QkSearch'
import { QkSelect } from './QkSelect'
import { QkButton } from './QkButton'

export interface FilterChip {
  id: string
  label: string
}

export interface FilterField {
  id: string
  label: string
  value: string
  options: { label: string; value: string }[]
  onChange: (value: string) => void
}

interface QkFilterBarProps {
  search: string
  onSearchChange: (value: string) => void
  searchPlaceholder?: string
  filters?: FilterField[]
  chips?: FilterChip[]
  onRemoveChip?: (id: string) => void
  onClearAll?: () => void
  rightSlot?: ReactNode
}

export function QkFilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters = [],
  chips = [],
  onRemoveChip,
  onClearAll,
  rightSlot,
}: QkFilterBarProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <QkSearch value={search} onChange={onSearchChange} placeholder={searchPlaceholder} style={{ flex: '1 1 240px' }} />
        {filters.map((f) => (
          <div key={f.id} style={{ minWidth: 140, flex: '0 1 160px' }}>
            <QkSelect
              aria-label={f.label}
              value={f.value}
              onChange={(e) => f.onChange(e.target.value)}
              options={[{ label: f.label, value: '' }, ...f.options]}
              placeholder={f.label}
            />
          </div>
        ))}
        {rightSlot}
      </div>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveChip?.(chip.id)}
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: 6,
                height: 24,
                padding: '0 8px',
                borderRadius: 999,
                border: '1px solid var(--qk-border)',
                background: 'var(--qk-primary-soft)',
                color: 'var(--qk-primary)',
                fontSize: 11.5,
                fontWeight: 500,
                cursor: 'pointer',
              }}
            >
              {chip.label}
              <X size={12} />
            </button>
          ))}
          {onClearAll && (
            <QkButton variant="ghost" size="sm" onClick={onClearAll}>
              Clear filters
            </QkButton>
          )}
        </div>
      )}
    </div>
  )
}
