import { useEffect, useMemo, useState, type ReactNode } from 'react'
import { ArrowDown, ArrowUp, ArrowUpDown, ChevronDown, ChevronUp, Columns3 } from 'lucide-react'
import { QkEmptyState } from './QkEmptyState'
import { QkSkeleton } from './QkSkeleton'
import { QkPagination } from './QkPagination'
import { QkCheckbox } from './QkCheckbox'
import { QkButton } from './QkButton'
import { QkDropdown } from './QkDropdown'
import { useBreakpoint } from '../../hooks/useBreakpoint'

export type QkMobileRole = 'title' | 'subtitle' | 'status' | 'meta' | 'field' | 'action' | false

export interface QkColumn<T> {
  key: string
  header: string
  width?: string | number
  sortable?: boolean
  align?: 'left' | 'right' | 'center'
  hideable?: boolean
  defaultHidden?: boolean
  /** How this column appears in mobile card mode */
  mobile?: QkMobileRole
  render?: (row: T) => ReactNode
  accessor?: (row: T) => ReactNode
}

interface QkTableProps<T extends { id: string }> {
  columns: QkColumn<T>[]
  rows: T[]
  loading?: boolean
  error?: string | null
  emptyTitle?: string
  emptyDescription?: string
  emptyAction?: ReactNode
  sortKey?: string | null
  sortDir?: 'asc' | 'desc'
  onSort?: (key: string) => void
  selectedIds?: string[]
  onToggleRow?: (id: string) => void
  onToggleAll?: () => void
  page?: number
  pageCount?: number
  total?: number
  pageSize?: number
  onPageChange?: (page: number) => void
  onRowClick?: (row: T) => void
  stickyHeader?: boolean
  columnVisibility?: boolean
  storageKey?: string
  toolbar?: ReactNode
  /** cards = operational list on mobile; table = always table (analytical) */
  mobileMode?: 'table' | 'cards'
  renderCard?: (row: T, helpers: { expanded: boolean; toggle: () => void }) => ReactNode
}

function cellValue<T>(col: QkColumn<T>, row: T): ReactNode {
  if (col.render) return col.render(row)
  if (col.accessor) return col.accessor(row)
  return (row as Record<string, unknown>)[col.key] as ReactNode
}

export function QkTable<T extends { id: string }>({
  columns,
  rows,
  loading,
  error,
  emptyTitle = 'No records found',
  emptyDescription = 'Try adjusting filters or create a new record.',
  emptyAction,
  sortKey,
  sortDir = 'asc',
  onSort,
  selectedIds,
  onToggleRow,
  onToggleAll,
  page,
  pageCount,
  total,
  pageSize = 10,
  onPageChange,
  onRowClick,
  stickyHeader = true,
  columnVisibility = true,
  storageKey,
  toolbar,
  mobileMode = 'table',
  renderCard,
}: QkTableProps<T>) {
  const { isMobile } = useBreakpoint()
  const useCards = isMobile && mobileMode === 'cards'
  const [expandedIds, setExpandedIds] = useState<string[]>([])

  const hideableCols = useMemo(
    () => columns.filter((c) => c.hideable !== false),
    [columns],
  )

  const defaultVisible = useMemo(() => {
    return columns.filter((c) => !c.defaultHidden).map((c) => c.key)
  }, [columns])

  const [visibleKeys, setVisibleKeys] = useState<string[]>(() => {
    if (storageKey) {
      try {
        const raw = localStorage.getItem(`qk-cols:${storageKey}`)
        if (raw) {
          const parsed = JSON.parse(raw) as string[]
          if (Array.isArray(parsed) && parsed.length) return parsed
        }
      } catch {
        /* ignore */
      }
    }
    return defaultVisible
  })

  useEffect(() => {
    if (!storageKey) return
    localStorage.setItem(`qk-cols:${storageKey}`, JSON.stringify(visibleKeys))
  }, [storageKey, visibleKeys])

  const visibleColumns = useMemo(
    () => columns.filter((c) => visibleKeys.includes(c.key) || c.hideable === false),
    [columns, visibleKeys],
  )

  const toggleColumn = (key: string) => {
    setVisibleKeys((prev) => {
      if (prev.includes(key)) {
        if (prev.length <= 1) return prev
        return prev.filter((k) => k !== key)
      }
      return [...prev, key]
    })
  }

  const selectable = Boolean(onToggleRow && selectedIds)
  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds!.includes(r.id))
  const colSpan = visibleColumns.length + (selectable ? 1 : 0)

  const titleCol = columns.find((c) => c.mobile === 'title') || columns[0]
  const subtitleCol = columns.find((c) => c.mobile === 'subtitle')
  const statusCol = columns.find((c) => c.mobile === 'status')
  const metaCols = columns.filter((c) => c.mobile === 'meta')
  const fieldCols = columns.filter((c) => c.mobile === 'field')
  const actionCol = columns.find((c) => c.mobile === 'action')
  const expandCols = columns.filter(
    (c) =>
      c.mobile !== 'title' &&
      c.mobile !== 'subtitle' &&
      c.mobile !== 'status' &&
      c.mobile !== 'meta' &&
      c.mobile !== 'field' &&
      c.mobile !== 'action' &&
      c.mobile !== false &&
      c.key !== titleCol?.key &&
      !c.defaultHidden,
  )

  const pagination =
    onPageChange && page && pageCount && total !== undefined ? (
      <QkPagination
        page={page}
        pageCount={pageCount}
        total={total}
        pageSize={pageSize}
        onPageChange={onPageChange}
      />
    ) : null

  if (useCards) {
    return (
      <div className="qk-surface qk-table-cards" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        {(columnVisibility || toolbar) && (
          <div className="qk-table-cards__toolbar">
            {toolbar}
            {selectable && (
              <QkCheckbox checked={allSelected} onChange={() => onToggleAll?.()} aria-label="Select all" label="Select all" />
            )}
          </div>
        )}
        {loading && (
          <div style={{ padding: 12, display: 'flex', flexDirection: 'column', gap: 8 }}>
            {Array.from({ length: 4 }).map((_, i) => (
              <QkSkeleton key={i} height={88} />
            ))}
          </div>
        )}
        {!loading && error && <QkEmptyState title="Unable to load data" description={error} tone="danger" />}
        {!loading && !error && rows.length === 0 && (
          <QkEmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
        )}
        {!loading && !error && (
          <div className="qk-table-cards__list">
            {rows.map((row) => {
              const expanded = expandedIds.includes(row.id)
              const toggle = () =>
                setExpandedIds((prev) =>
                  prev.includes(row.id) ? prev.filter((id) => id !== row.id) : [...prev, row.id],
                )
              const selected = selectedIds?.includes(row.id)

              if (renderCard) {
                return (
                  <div key={row.id} className={`qk-ops-card${selected ? ' is-selected' : ''}`}>
                    {selectable && (
                      <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: 8 }}>
                        <QkCheckbox checked={Boolean(selected)} onChange={() => onToggleRow?.(row.id)} aria-label="Select" />
                      </div>
                    )}
                    {renderCard(row, { expanded, toggle })}
                  </div>
                )
              }

              return (
                <article
                  key={row.id}
                  className={`qk-ops-card${selected ? ' is-selected' : ''}${onRowClick ? ' is-clickable' : ''}`}
                  onClick={() => onRowClick?.(row)}
                >
                  <div className="qk-ops-card__head">
                    <div style={{ minWidth: 0, flex: 1 }}>
                      {selectable && (
                        <div onClick={(e) => e.stopPropagation()} style={{ marginBottom: 6 }}>
                          <QkCheckbox checked={Boolean(selected)} onChange={() => onToggleRow?.(row.id)} aria-label="Select" />
                        </div>
                      )}
                      <div className="qk-ops-card__title">{titleCol ? cellValue(titleCol, row) : row.id}</div>
                      {subtitleCol && <div className="qk-ops-card__subtitle">{cellValue(subtitleCol, row)}</div>}
                    </div>
                    {statusCol && <div className="qk-ops-card__status">{cellValue(statusCol, row)}</div>}
                  </div>

                  {(metaCols.length > 0 || fieldCols.length > 0) && (
                    <div className="qk-ops-card__meta">
                      {[...metaCols, ...fieldCols].map((col) => (
                        <div key={col.key} className="qk-ops-card__meta-item">
                          <span className="qk-ops-card__meta-label">{col.header}</span>
                          <span className="qk-ops-card__meta-value">{cellValue(col, row)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  {expandCols.length > 0 && (
                    <>
                      <button
                        type="button"
                        className="qk-ops-card__expand"
                        onClick={(e) => {
                          e.stopPropagation()
                          toggle()
                        }}
                      >
                        {expanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                        {expanded ? 'Less' : 'More'}
                      </button>
                      {expanded && (
                        <div className="qk-ops-card__extra">
                          {expandCols.map((col) => (
                            <div key={col.key} className="qk-ops-card__meta-item">
                              <span className="qk-ops-card__meta-label">{col.header}</span>
                              <span className="qk-ops-card__meta-value">{cellValue(col, row)}</span>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}

                  {actionCol && (
                    <div className="qk-ops-card__actions" onClick={(e) => e.stopPropagation()}>
                      {cellValue(actionCol, row)}
                    </div>
                  )}
                </article>
              )
            })}
          </div>
        )}
        {pagination}
      </div>
    )
  }

  return (
    <div className="qk-surface" style={{ overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
      {(columnVisibility || toolbar) && (
        <div
          style={{
            display: 'flex',
            justifyContent: 'flex-end',
            alignItems: 'center',
            gap: 8,
            padding: '8px 10px',
            borderBottom: '1px solid var(--qk-border)',
          }}
        >
          {toolbar}
          {columnVisibility && (
            <QkDropdown
              align="right"
              items={hideableCols.map((col) => ({
                id: col.key,
                label: `${visibleKeys.includes(col.key) ? '✓ ' : ''}${col.header}`,
                onClick: () => toggleColumn(col.key),
              }))}
              trigger={
                <QkButton variant="outline" size="sm" leftIcon={<Columns3 size={14} />} aria-label="Column visibility">
                  Columns
                </QkButton>
              }
            />
          )}
        </div>
      )}
      <div style={{ overflow: 'auto' }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 'var(--qk-font-table)' }}>
          <thead>
            <tr>
              {selectable && (
                <th style={thStyle(stickyHeader, 40)}>
                  <QkCheckbox checked={allSelected} onChange={() => onToggleAll?.()} aria-label="Select all" />
                </th>
              )}
              {visibleColumns.map((col) => {
                const active = sortKey === col.key
                return (
                  <th
                    key={col.key}
                    style={{
                      ...thStyle(stickyHeader),
                      width: col.width,
                      textAlign: col.align || 'left',
                      cursor: col.sortable ? 'pointer' : 'default',
                      userSelect: 'none',
                    }}
                    onClick={() => col.sortable && onSort?.(col.key)}
                  >
                    <span
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        width: '100%',
                        justifyContent:
                          col.align === 'right' ? 'flex-end' : col.align === 'center' ? 'center' : 'flex-start',
                      }}
                    >
                      {col.header}
                      {col.sortable && (
                        active ? (
                          sortDir === 'asc' ? <ArrowUp size={12} /> : <ArrowDown size={12} />
                        ) : (
                          <ArrowUpDown size={12} style={{ opacity: 0.4 }} />
                        )
                      )}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody>
            {loading && (
              Array.from({ length: 6 }).map((_, i) => (
                <tr key={`sk-${i}`}>
                  <td colSpan={colSpan} style={{ padding: '10px 12px' }}>
                    <QkSkeleton height={14} />
                  </td>
                </tr>
              ))
            )}
            {!loading && error && (
              <tr>
                <td colSpan={colSpan}>
                  <QkEmptyState title="Unable to load data" description={error} tone="danger" />
                </td>
              </tr>
            )}
            {!loading && !error && rows.length === 0 && (
              <tr>
                <td colSpan={colSpan}>
                  <QkEmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
                </td>
              </tr>
            )}
            {!loading && !error && rows.map((row) => {
              const selected = selectedIds?.includes(row.id)
              return (
                <tr
                  key={row.id}
                  onClick={() => onRowClick?.(row)}
                  style={{
                    height: 'var(--qk-row-h)',
                    background: selected ? 'var(--qk-primary-soft)' : 'transparent',
                    cursor: onRowClick ? 'pointer' : 'default',
                  }}
                  onMouseEnter={(e) => {
                    if (!selected) e.currentTarget.style.background = 'var(--qk-bg)'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = selected ? 'var(--qk-primary-soft)' : 'transparent'
                  }}
                >
                  {selectable && (
                    <td style={tdStyle} onClick={(e) => e.stopPropagation()}>
                      <QkCheckbox
                        checked={Boolean(selected)}
                        onChange={() => onToggleRow?.(row.id)}
                        aria-label="Select row"
                      />
                    </td>
                  )}
                  {visibleColumns.map((col) => (
                    <td key={col.key} style={{ ...tdStyle, textAlign: col.align || 'left' }}>
                      {cellValue(col, row)}
                    </td>
                  ))}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
      {pagination}
    </div>
  )
}

function thStyle(sticky: boolean, width?: number): React.CSSProperties {
  return {
    position: sticky ? 'sticky' : 'static',
    top: 0,
    zIndex: 1,
    height: 36,
    padding: '0 12px',
    fontWeight: 550,
    fontSize: 'var(--qk-font-label)',
    color: 'var(--qk-text-secondary)',
    background: 'var(--qk-surface)',
    borderBottom: '1px solid var(--qk-border)',
    whiteSpace: 'nowrap',
    width,
  }
}

const tdStyle: React.CSSProperties = {
  padding: '0 12px',
  borderBottom: '1px solid var(--qk-border)',
  color: 'var(--qk-text)',
  whiteSpace: 'nowrap',
}
