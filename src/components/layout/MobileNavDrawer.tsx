import { NavLink, useLocation } from 'react-router-dom'
import { X, Moon, Sun, Rows3, Rows4, LogOut, User, Settings2 } from 'lucide-react'
import { NAV_SECTIONS, isNavActive } from './navConfig'
import { useTheme } from '../../context/ThemeContext'
import { useDensity } from '../../context/DensityContext'
import { useAuth } from '../../context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { QkButton } from '../ui'

interface MobileNavDrawerProps {
  open: boolean
  onClose: () => void
  mode?: 'menu' | 'more'
}

export function MobileNavDrawer({ open, onClose, mode = 'menu' }: MobileNavDrawerProps) {
  const location = useLocation()
  const { theme, toggleTheme } = useTheme()
  const { density, setDensity } = useDensity()
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  if (!open) return null

  const sections =
    mode === 'more'
      ? NAV_SECTIONS.filter((s) => !['Overview'].includes(s.title))
      : NAV_SECTIONS

  return (
    <div className="qk-mobile-nav" style={{ position: 'fixed', inset: 0, zIndex: 80 }}>
      <button type="button" className="qk-mobile-nav__backdrop" aria-label="Close menu" onClick={onClose} />
      <aside
        className="qk-mobile-nav__panel"
        role="dialog"
        aria-modal="true"
        aria-label={mode === 'more' ? 'More modules' : 'Navigation'}
      >
        <header className="qk-mobile-nav__header">
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
            <div className="qk-mobile-nav__logo">Q</div>
            <div style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 650, fontSize: 15 }}>QuicKart</div>
              <div style={{ fontSize: 11, color: 'var(--qk-text-muted)' }}>
                {user?.name || 'SCM'} · {user?.role || ''}
              </div>
            </div>
          </div>
          <QkButton variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <X size={18} />
          </QkButton>
        </header>

        <nav className="qk-mobile-nav__body qk-scroll-hidden">
          {sections.map((section) => (
            <div key={section.title} className="qk-mobile-nav__section">
              <div className="qk-mobile-nav__section-title">{section.title}</div>
              {section.items.map((item) => {
                const Icon = item.icon
                const active = isNavActive(location.pathname, item.to)
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    onClick={onClose}
                    className={`qk-mobile-nav__link${active ? ' is-active' : ''}`}
                  >
                    <Icon size={18} strokeWidth={1.75} />
                    <span>{item.label}</span>
                  </NavLink>
                )
              })}
            </div>
          ))}
        </nav>

        <footer className="qk-mobile-nav__footer">
          <div className="qk-mobile-nav__prefs">
            <button type="button" onClick={toggleTheme} className="qk-mobile-nav__pref">
              {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              {theme === 'light' ? 'Night' : 'Day'}
            </button>
            <button
              type="button"
              className="qk-mobile-nav__pref"
              onClick={() => setDensity(density === 'compact' ? 'comfortable' : 'compact')}
            >
              {density === 'compact' ? <Rows4 size={16} /> : <Rows3 size={16} />}
              {density === 'compact' ? 'Comfort' : 'Compact'}
            </button>
            <button
              type="button"
              className="qk-mobile-nav__pref"
              onClick={() => {
                onClose()
                navigate('/settings')
              }}
            >
              <Settings2 size={16} />
              Settings
            </button>
            <button
              type="button"
              className="qk-mobile-nav__pref"
              onClick={() => {
                onClose()
                navigate('/settings')
              }}
            >
              <User size={16} />
              Profile
            </button>
          </div>
          <QkButton
            variant="outline"
            onClick={() => {
              logout()
              onClose()
              navigate('/login')
            }}
            leftIcon={<LogOut size={14} />}
            style={{ width: '100%' }}
          >
            Sign out
          </QkButton>
        </footer>
      </aside>
    </div>
  )
}
