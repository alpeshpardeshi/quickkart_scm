interface TabItem {
  id: string
  label: string
  count?: number
}

interface QkTabsProps {
  tabs: TabItem[]
  value: string
  onChange: (id: string) => void
}

export function QkTabs({ tabs, value, onChange }: QkTabsProps) {
  return (
    <div
      role="tablist"
      style={{
        display: 'flex',
        gap: 2,
        borderBottom: '1px solid var(--qk-border)',
        overflowX: 'auto',
      }}
    >
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            style={{
              height: 36,
              padding: '0 12px',
              border: 'none',
              background: 'transparent',
              color: active ? 'var(--qk-primary)' : 'var(--qk-text-secondary)',
              fontWeight: active ? 600 : 500,
              fontSize: 'var(--qk-font-btn)',
              borderBottom: active ? '2px solid var(--qk-primary)' : '2px solid transparent',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span
                style={{
                  fontSize: 11,
                  background: active ? 'var(--qk-primary-soft)' : 'var(--qk-bg)',
                  color: active ? 'var(--qk-primary)' : 'var(--qk-text-muted)',
                  borderRadius: 999,
                  padding: '1px 6px',
                }}
              >
                {tab.count}
              </span>
            )}
          </button>
        )
      })}
    </div>
  )
}
