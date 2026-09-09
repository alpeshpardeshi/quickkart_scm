import type { ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { QkButton, QkDropdown } from '../ui'
import { useBreakpoint } from '../../hooks/useBreakpoint'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
  /** Primary CTA shown prominently on mobile */
  primaryAction?: ReactNode
  /** Extra actions collapsed into ⋯ on mobile */
  secondaryActions?: { id: string; label: string; onClick: () => void; danger?: boolean }[]
}

export function PageHeader({ title, subtitle, actions, primaryAction, secondaryActions }: PageHeaderProps) {
  const { isMobile } = useBreakpoint()

  const mobileActions =
    isMobile && (primaryAction || (secondaryActions && secondaryActions.length > 0)) ? (
      <div className="qk-page-header__actions">
        {primaryAction}
        {secondaryActions && secondaryActions.length > 0 && (
          <QkDropdown
            align="right"
            trigger={
              <QkButton variant="outline" aria-label="More actions" style={{ minWidth: 44, minHeight: 44, padding: 0 }}>
                <MoreHorizontal size={18} />
              </QkButton>
            }
            items={secondaryActions.map((a) => ({
              id: a.id,
              label: a.label,
              danger: a.danger,
              onClick: a.onClick,
            }))}
          />
        )}
      </div>
    ) : (
      actions && <div className="qk-page-header__actions">{actions}</div>
    )

  return (
    <div className="qk-page-header">
      <div style={{ minWidth: 0, flex: 1 }}>
        <h1 className="qk-page-title">{title}</h1>
        {subtitle && !isMobile && <p className="qk-page-subtitle">{subtitle}</p>}
        {subtitle && isMobile && <p className="qk-page-subtitle">{subtitle}</p>}
      </div>
      {mobileActions}
    </div>
  )
}

export function PageActions({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export function QkStickyActions({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <div className={`qk-sticky-actions ${className}`.trim()}>{children}</div>
}

export { QkButton }
