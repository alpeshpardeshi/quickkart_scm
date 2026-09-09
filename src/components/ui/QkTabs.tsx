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
    <div role="tablist" className="qk-tabs qk-scroll-hidden">
      {tabs.map((tab) => {
        const active = tab.id === value
        return (
          <button
            key={tab.id}
            role="tab"
            aria-selected={active}
            type="button"
            onClick={() => onChange(tab.id)}
            className={`qk-tabs__tab${active ? ' is-active' : ''}`}
          >
            {tab.label}
            {typeof tab.count === 'number' && (
              <span className="qk-tabs__count">{tab.count}</span>
            )}
          </button>
        )
      })}
    </div>
  )
}
