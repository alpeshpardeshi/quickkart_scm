import { Link } from 'react-router-dom'
import { ChevronRight } from 'lucide-react'

interface Crumb {
  label: string
  to?: string
}

interface QkBreadcrumbProps {
  items: Crumb[]
}

export function QkBreadcrumb({ items }: QkBreadcrumbProps) {
  return (
    <nav aria-label="Breadcrumb" style={{ display: 'flex', alignItems: 'center', gap: 4, flexWrap: 'wrap' }}>
      {items.map((item, i) => {
        const last = i === items.length - 1
        return (
          <span key={`${item.label}-${i}`} style={{ display: 'inline-flex', alignItems: 'center', gap: 4 }}>
            {i > 0 && <ChevronRight size={12} style={{ color: 'var(--qk-text-muted)' }} />}
            {item.to && !last ? (
              <Link
                to={item.to}
                style={{
                  fontSize: 'var(--qk-font-helper)',
                  color: 'var(--qk-text-secondary)',
                  fontWeight: 500,
                }}
              >
                {item.label}
              </Link>
            ) : (
              <span
                style={{
                  fontSize: 'var(--qk-font-helper)',
                  color: last ? 'var(--qk-text)' : 'var(--qk-text-secondary)',
                  fontWeight: last ? 600 : 500,
                }}
              >
                {item.label}
              </span>
            )}
          </span>
        )
      })}
    </nav>
  )
}
