import { ChevronLeft, ChevronRight } from 'lucide-react'
import { QkButton } from './QkButton'

interface QkPaginationProps {
  page: number
  pageCount: number
  total: number
  pageSize: number
  onPageChange: (page: number) => void
}

export function QkPagination({ page, pageCount, total, pageSize, onPageChange }: QkPaginationProps) {
  const from = total === 0 ? 0 : (page - 1) * pageSize + 1
  const to = Math.min(page * pageSize, total)
  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 12px',
        borderTop: '1px solid var(--qk-border)',
        fontSize: 'var(--qk-font-helper)',
        color: 'var(--qk-text-secondary)',
      }}
    >
      <span>
        Showing {from}–{to} of {total}
      </span>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <QkButton
          variant="outline"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
          aria-label="Previous page"
          leftIcon={<ChevronLeft size={14} />}
        >
          Prev
        </QkButton>
        <span style={{ minWidth: 64, textAlign: 'center' }}>
          {page} / {pageCount}
        </span>
        <QkButton
          variant="outline"
          size="sm"
          disabled={page >= pageCount}
          onClick={() => onPageChange(page + 1)}
          aria-label="Next page"
          rightIcon={<ChevronRight size={14} />}
        >
          Next
        </QkButton>
      </div>
    </div>
  )
}
