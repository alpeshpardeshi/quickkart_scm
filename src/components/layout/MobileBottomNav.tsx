import { MoreHorizontal } from 'lucide-react'
import { NavLink, useLocation } from 'react-router-dom'
import { BOTTOM_NAV, isNavActive } from './navConfig'

interface MobileBottomNavProps {
  onMore: () => void
  moreOpen?: boolean
}

export function MobileBottomNav({ onMore, moreOpen }: MobileBottomNavProps) {
  const location = useLocation()

  return (
    <nav className="qk-mobile-bottom-nav" aria-label="Primary">
      {BOTTOM_NAV.map((item) => {
        const Icon = item.icon
        const active = !moreOpen && isNavActive(location.pathname, item.to, item.match)
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={`qk-mobile-bottom-nav__item${active ? ' is-active' : ''}`}
            aria-current={active ? 'page' : undefined}
          >
            <Icon size={20} strokeWidth={active ? 2.25 : 1.75} />
            <span>{item.label}</span>
          </NavLink>
        )
      })}
      <button
        type="button"
        className={`qk-mobile-bottom-nav__item${moreOpen ? ' is-active' : ''}`}
        onClick={onMore}
        aria-label="More modules"
        aria-expanded={moreOpen}
      >
        <MoreHorizontal size={20} strokeWidth={moreOpen ? 2.25 : 1.75} />
        <span>More</span>
      </button>
    </nav>
  )
}
