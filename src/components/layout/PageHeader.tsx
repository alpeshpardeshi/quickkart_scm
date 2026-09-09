import type { ReactNode } from 'react'
import { QkButton } from '../ui'

interface PageHeaderProps {
  title: string
  subtitle?: string
  actions?: ReactNode
}

export function PageHeader({ title, subtitle, actions }: PageHeaderProps) {
  return (
    <div className="qk-page-header">
      <div>
        <h1 className="qk-page-title">{title}</h1>
        {subtitle && <p className="qk-page-subtitle">{subtitle}</p>}
      </div>
      {actions && <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>{actions}</div>}
    </div>
  )
}

export function PageActions({ children }: { children: ReactNode }) {
  return <>{children}</>
}

export { QkButton }
