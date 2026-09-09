import { useState, type ReactNode } from 'react'
import { Filter, X } from 'lucide-react'
import { QkSearch } from './QkSearch'
import { QkSelect } from './QkSelect'
import { QkButton } from './QkButton'
import { useBreakpoint } from '../../hooks/useBreakpoint'

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
  const { isMobile } = useBreakpoint()
  const [sheetOpen, setSheetOpen] = useState(false)
  const [draft, setDraft] = useState<Record<string, string>>({})

  const openSheet = () => {
    const next: Record<string, string> = {}
    filters.forEach((f) => {
      next[f.id] = f.value
    })
    setDraft(next)
    setSheetOpen(true)
  }

  const applySheet = () => {
    filters.forEach((f) => {
      const v = draft[f.id] ?? ''
      if (v !== f.value) f.onChange(v)
    })
    setSheetOpen(false)
  }

  const resetSheet = () => {
    const next: Record<string, string> = {}
    filters.forEach((f) => {
      next[f.id] = ''
      if (f.value) f.onChange('')
    })
    setDraft(next)
    onClearAll?.()
  }

  const activeFilterCount = filters.filter((f) => f.value).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
        <QkSearch
          value={search}
          onChange={onSearchChange}
          placeholder={searchPlaceholder}
          style={{ flex: isMobile ? '1 1 100%' : '1 1 240px', minWidth: isMobile ? 0 : 180 }}
        />
        {isMobile && filters.length > 0 ? (
          <QkButton
            variant="outline"
            onClick={openSheet}
            leftIcon={<Filter size={16} />}
            style={{ minHeight: 44, flex: '1 1 auto' }}
          >
            Filter{activeFilterCount > 0 ? ` (${activeFilterCount})` : ''}
          </QkButton>
        ) : (
          filters.map((f) => (
            <div key={f.id} style={{ minWidth: 140, flex: '0 1 160px' }}>
              <QkSelect
                aria-label={f.label}
                value={f.value}
                onChange={(e) => f.onChange(e.target.value)}
                options={[{ label: f.label, value: '' }, ...f.options]}
                placeholder={f.label}
              />
            </div>
          ))
        )}
        {rightSlot}
      </div>
      {chips.length > 0 && (
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, alignItems: 'center' }}>
          {chips.map((chip) => (
            <button
              key={chip.id}
              type="button"
              onClick={() => onRemoveChip?.(chip.id)}
              className="qk-filter-chip"
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

      {sheetOpen && (
        <div className="qk-sheet-root" style={{ zIndex: 75 }}>
          <button type="button" className="qk-sheet-backdrop" aria-label="Close filters" onClick={() => setSheetOpen(false)} />
          <div className="qk-sheet qk-sheet--bottom" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="qk-sheet__handle" />
            <header className="qk-sheet__header">
              <div style={{ fontWeight: 650, fontSize: 16 }}>Filters</div>
              <QkButton variant="ghost" size="sm" onClick={() => setSheetOpen(false)} aria-label="Close">
                <X size={18} />
              </QkButton>
            </header>
            <div className="qk-sheet__body">
              {filters.map((f) => (
                <div key={f.id} style={{ marginBottom: 14 }}>
                  <QkSelect
                    label={f.label}
                    value={draft[f.id] ?? ''}
                    onChange={(e) => setDraft((d) => ({ ...d, [f.id]: e.target.value }))}
                    options={[{ label: 'All', value: '' }, ...f.options]}
                    placeholder="All"
                  />
                </div>
              ))}
            </div>
            <footer className="qk-sheet__footer qk-sheet__footer--split">
              <QkButton variant="outline" onClick={resetSheet} style={{ flex: 1, minHeight: 44 }}>
                Reset
              </QkButton>
              <QkButton onClick={applySheet} style={{ flex: 1, minHeight: 44 }}>
                Apply
              </QkButton>
            </footer>
          </div>
        </div>
      )}
    </div>
  )
}
