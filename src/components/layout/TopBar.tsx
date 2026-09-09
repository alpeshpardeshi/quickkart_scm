import { Bell, Moon, Sun, PanelLeft, LogOut, User, Settings2, Rows3, Rows4, Menu } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { QkBreadcrumb, QkButton, QkDropdown, QkInput, QkTooltip, QkDrawer } from '../ui'
import { useTheme } from '../../context/ThemeContext'
import { useDensity } from '../../context/DensityContext'
import { useAuth } from '../../context/AuthContext'
import { useData } from '../../context/DataContext'
import { useState } from 'react'
import { formatDateTime } from '../../utils'
import { Search } from 'lucide-react'

interface TopBarProps {
  breadcrumbs: { label: string; to?: string }[]
  pageTitle?: string
  mobile?: boolean
  onToggleSidebar: () => void
}

export function TopBar({ breadcrumbs, pageTitle, mobile, onToggleSidebar }: TopBarProps) {
  const { theme, toggleTheme } = useTheme()
  const { density, setDensity } = useDensity()
  const { user, logout } = useAuth()
  const { notifications, markNotificationRead, markAllNotificationsRead } = useData()
  const navigate = useNavigate()
  const [notifOpen, setNotifOpen] = useState(false)
  const unread = notifications.filter((n) => !n.read).length

  return (
    <>
      <header className={`qk-topbar${mobile ? ' qk-topbar--mobile' : ''}`}>
        <QkTooltip content={mobile ? 'Open menu' : 'Toggle sidebar'}>
          <QkButton
            variant="ghost"
            size={mobile ? 'md' : 'sm'}
            onClick={onToggleSidebar}
            aria-label={mobile ? 'Open menu' : 'Toggle sidebar'}
            className="qk-topbar__menu-btn"
          >
            {mobile ? <Menu size={20} /> : <PanelLeft size={16} />}
          </QkButton>
        </QkTooltip>

        {mobile ? (
          <div className="qk-topbar__title" title={pageTitle}>
            {pageTitle || breadcrumbs[breadcrumbs.length - 1]?.label || 'QuicKart'}
          </div>
        ) : (
          <div style={{ flex: 1, minWidth: 0 }}>
            <QkBreadcrumb items={[{ label: 'QuicKart', to: '/dashboard' }, ...breadcrumbs]} />
          </div>
        )}

        {!mobile && (
          <div style={{ width: 240, maxWidth: '32vw' }}>
            <QkInput placeholder="Search anything..." leftIcon={<Search size={14} />} aria-label="Global search" />
          </div>
        )}

        {!mobile && (
          <>
            <QkTooltip content={theme === 'light' ? 'Night theme' : 'Day theme'}>
              <QkButton variant="ghost" size="sm" onClick={toggleTheme} aria-label="Toggle theme">
                {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
              </QkButton>
            </QkTooltip>

            <QkDropdown
              trigger={
                <QkButton variant="ghost" size="sm" aria-label="Density">
                  {density === 'compact' ? <Rows3 size={16} /> : <Rows4 size={16} />}
                </QkButton>
              }
              items={[
                { id: 'compact', label: density === 'compact' ? '✓ Compact' : 'Compact', onClick: () => setDensity('compact') },
                { id: 'comfortable', label: density === 'comfortable' ? '✓ Comfortable' : 'Comfortable', onClick: () => setDensity('comfortable') },
              ]}
            />
          </>
        )}

        <QkTooltip content="Notifications">
          <QkButton
            variant="ghost"
            size={mobile ? 'md' : 'sm'}
            onClick={() => setNotifOpen(true)}
            aria-label="Notifications"
            style={{ position: 'relative' }}
          >
            <Bell size={mobile ? 20 : 16} />
            {unread > 0 && (
              <span
                style={{
                  position: 'absolute',
                  top: mobile ? 8 : 4,
                  right: mobile ? 8 : 4,
                  width: 7,
                  height: 7,
                  borderRadius: '50%',
                  background: 'var(--qk-danger)',
                }}
              />
            )}
          </QkButton>
        </QkTooltip>

        {!mobile && (
          <QkDropdown
            trigger={
              <button
                type="button"
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 8,
                  height: 'var(--qk-btn-h)',
                  padding: '0 8px 0 4px',
                  borderRadius: 'var(--qk-radius)',
                  border: '1px solid var(--qk-border)',
                  background: 'var(--qk-surface)',
                  cursor: 'pointer',
                }}
              >
                <span
                  style={{
                    width: 26,
                    height: 26,
                    borderRadius: 6,
                    background: 'var(--qk-primary-soft)',
                    color: 'var(--qk-primary)',
                    display: 'grid',
                    placeItems: 'center',
                    fontSize: 11,
                    fontWeight: 700,
                  }}
                >
                  {(user?.name || 'U').split(' ').map((p) => p[0]).slice(0, 2).join('')}
                </span>
                <span style={{ textAlign: 'left', lineHeight: 1.15 }}>
                  <div style={{ fontSize: 12, fontWeight: 600 }}>{user?.name}</div>
                  <div style={{ fontSize: 10, color: 'var(--qk-text-muted)' }}>{user?.role}</div>
                </span>
              </button>
            }
            items={[
              { id: 'profile', label: 'Profile', icon: <User size={14} />, onClick: () => navigate('/settings') },
              { id: 'settings', label: 'Settings', icon: <Settings2 size={14} />, onClick: () => navigate('/settings') },
              {
                id: 'logout',
                label: 'Sign out',
                icon: <LogOut size={14} />,
                danger: true,
                onClick: () => {
                  logout()
                  navigate('/login')
                },
              },
            ]}
          />
        )}
      </header>

      <QkDrawer
        open={notifOpen}
        onClose={() => setNotifOpen(false)}
        title="Notifications"
        subtitle={`${unread} unread`}
        footer={<QkButton variant="outline" onClick={markAllNotificationsRead}>Mark all read</QkButton>}
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {notifications.map((n) => (
            <button
              key={n.id}
              type="button"
              onClick={() => markNotificationRead(n.id)}
              style={{
                textAlign: 'left',
                padding: 12,
                borderRadius: 'var(--qk-radius)',
                border: '1px solid var(--qk-border)',
                background: n.read ? 'var(--qk-surface)' : 'var(--qk-primary-soft)',
                cursor: 'pointer',
                minHeight: 44,
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', gap: 8 }}>
                <strong style={{ fontSize: 13 }}>{n.title}</strong>
                {!n.read && <span style={{ width: 7, height: 7, borderRadius: '50%', background: 'var(--qk-primary)', marginTop: 5 }} />}
              </div>
              <div style={{ fontSize: 12, color: 'var(--qk-text-secondary)', marginTop: 4 }}>{n.message}</div>
              <div style={{ fontSize: 11, color: 'var(--qk-text-muted)', marginTop: 6 }}>{formatDateTime(n.createdAt)}</div>
            </button>
          ))}
        </div>
      </QkDrawer>
    </>
  )
}
