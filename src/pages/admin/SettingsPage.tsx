import { useEffect, useState } from 'react'
import { PageHeader } from '../../components/layout/PageHeader'
import { QkButton, QkInput, QkRadio, QkSwitch } from '../../components/ui'
import { useTheme } from '../../context/ThemeContext'
import { useDensity } from '../../context/DensityContext'
import { useToast } from '../../context/ToastContext'

export function SettingsPage() {
  const { theme, setTheme } = useTheme()
  const { density, setDensity } = useDensity()
  const { pushToast } = useToast()
  const [company, setCompany] = useState(() => localStorage.getItem('quickart-company') || 'QuicKart Retail Pvt Ltd')
  const [emailAlerts, setEmailAlerts] = useState(() => localStorage.getItem('quickart-email-alerts') !== '0')
  const [slaAlerts, setSlaAlerts] = useState(() => localStorage.getItem('quickart-sla-alerts') !== '0')
  const [expiryAlerts, setExpiryAlerts] = useState(() => localStorage.getItem('quickart-expiry-alerts') !== '0')

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  const save = () => {
    localStorage.setItem('quickart-company', company)
    localStorage.setItem('quickart-email-alerts', emailAlerts ? '1' : '0')
    localStorage.setItem('quickart-sla-alerts', slaAlerts ? '1' : '0')
    localStorage.setItem('quickart-expiry-alerts', expiryAlerts ? '1' : '0')
    pushToast({ tone: 'success', title: 'Settings saved', message: 'Preferences updated for this browser.' })
  }

  return (
    <div className="qk-page qk-animate-in">
      <PageHeader title="Settings" subtitle="Workspace preferences for theme, density, and alerts." actions={<QkButton onClick={save}>Save changes</QkButton>} />

      <div className="qk-grid-2">
        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="qk-section-title">Appearance</h3>
          <QkRadio
            name="theme"
            label="Theme"
            value={theme}
            onChange={(v) => setTheme(v as 'light' | 'dark')}
            options={[
              { label: 'Day (Light)', value: 'light' },
              { label: 'Night (Dark)', value: 'dark' },
            ]}
          />
          <QkRadio
            name="density"
            label="Density"
            value={density}
            onChange={(v) => setDensity(v as 'compact' | 'comfortable')}
            options={[
              { label: 'Compact — operations focused', value: 'compact' },
              { label: 'Comfortable — office reading', value: 'comfortable' },
            ]}
          />
        </section>

        <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
          <h3 className="qk-section-title">Organization</h3>
          <QkInput label="Company name" value={company} onChange={(e) => setCompany(e.target.value)} />
          <div style={{ fontSize: 12, color: 'var(--qk-text-muted)' }}>Stored in localStorage for this frontend prototype.</div>
        </section>
      </div>

      <section className="qk-surface" style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 14 }}>
        <h3 className="qk-section-title">Notifications</h3>
        <QkSwitch checked={emailAlerts} onChange={setEmailAlerts} label="Email digests for delayed tasks" />
        <QkSwitch checked={slaAlerts} onChange={setSlaAlerts} label="SLA breach alerts" />
        <QkSwitch checked={expiryAlerts} onChange={setExpiryAlerts} label="Near-expiry batch alerts" />
      </section>
    </div>
  )
}
