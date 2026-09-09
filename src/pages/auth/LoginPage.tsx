import { useState } from 'react'
import { Navigate, useNavigate } from 'react-router-dom'
import { QkButton, QkInput } from '../../components/ui'
import { useAuth } from '../../context/AuthContext'
import { useTheme } from '../../context/ThemeContext'
import { Moon, Sun } from 'lucide-react'

export function LoginPage() {
  const { user, login } = useAuth()
  const { theme, toggleTheme } = useTheme()
  const navigate = useNavigate()
  const [email, setEmail] = useState('ops@quickart.in')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string; form?: string }>({})
  const [loading, setLoading] = useState(false)
  const [forgot, setForgot] = useState(false)
  const [forgotSent, setForgotSent] = useState(false)

  if (user) return <Navigate to="/dashboard" replace />

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    const next: typeof errors = {}
    if (!email.trim()) next.email = 'Email is required'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email'
    if (!password) next.password = 'Password is required'
    setErrors(next)
    if (Object.keys(next).length) return

    setLoading(true)
    const result = await login(email, password)
    setLoading(false)
    if (!result.ok) {
      setErrors({ form: result.error })
      return
    }
    navigate('/dashboard')
  }

  return (
    <div
      className="qk-app"
      style={{
        minHeight: '100%',
        display: 'grid',
        gridTemplateColumns: 'minmax(0, 1.1fr) minmax(360px, 480px)',
        background: 'var(--qk-bg)',
      }}
    >
      <section
        style={{
          padding: 48,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'space-between',
          background: 'var(--qk-surface)',
          borderRight: '1px solid var(--qk-border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 8, background: 'var(--qk-primary)', color: '#fff', display: 'grid', placeItems: 'center', fontWeight: 700 }}>Q</div>
          <div>
            <div style={{ fontWeight: 650, fontSize: 18, letterSpacing: '-0.02em' }}>QuicKart.</div>
            <div style={{ fontSize: 12, color: 'var(--qk-text-muted)' }}>Supply Chain Management</div>
          </div>
        </div>
        <div style={{ maxWidth: 460 }}>
          <h1 style={{ margin: 0, fontSize: 32, fontWeight: 650, letterSpacing: '-0.03em', lineHeight: 1.2 }}>
            Operations clarity for modern warehouses.
          </h1>
          <p style={{ margin: '14px 0 0', color: 'var(--qk-text-secondary)', fontSize: 14, lineHeight: 1.6 }}>
            Track inventory, purchasing, receiving, QC, picking, and dispatch in one compact, purpose-built workspace.
          </p>
          <div style={{ marginTop: 28, display: 'grid', gap: 10 }}>
            {[
              'FEFO-aware batch control',
              'Compact tables for high-volume ops',
              'Day / Night themes for every shift',
            ].map((item) => (
              <div key={item} style={{ display: 'flex', gap: 8, alignItems: 'center', color: 'var(--qk-text-secondary)', fontSize: 13 }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--qk-primary)' }} />
                {item}
              </div>
            ))}
          </div>
        </div>
        <div style={{ fontSize: 12, color: 'var(--qk-text-muted)' }}>© 2026 QuicKart SCM · Frontend prototype</div>
      </section>

      <section style={{ display: 'grid', placeItems: 'center', padding: 32, position: 'relative' }}>
        <button
          type="button"
          onClick={toggleTheme}
          aria-label="Toggle theme"
          style={{
            position: 'absolute',
            top: 20,
            right: 20,
            width: 34,
            height: 34,
            borderRadius: 8,
            border: '1px solid var(--qk-border)',
            background: 'var(--qk-surface)',
            color: 'var(--qk-text-secondary)',
            cursor: 'pointer',
            display: 'grid',
            placeItems: 'center',
          }}
        >
          {theme === 'light' ? <Moon size={16} /> : <Sun size={16} />}
        </button>

        <div className="qk-surface" style={{ width: '100%', maxWidth: 380, padding: 24 }}>
          {!forgot ? (
            <>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 650 }}>Sign in</h2>
              <p style={{ margin: '6px 0 20px', color: 'var(--qk-text-secondary)', fontSize: 13 }}>
                Use demo credentials to explore the workspace.
              </p>
              <form onSubmit={onSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <QkInput
                  label="Email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  error={errors.email}
                  autoComplete="username"
                  required
                />
                <QkInput
                  label="Password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  error={errors.password}
                  autoComplete="current-password"
                  required
                />
                {errors.form && (
                  <div style={{ padding: '8px 10px', borderRadius: 6, background: 'var(--qk-danger-soft)', color: 'var(--qk-danger)', fontSize: 12 }}>
                    {errors.form}
                  </div>
                )}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <button
                    type="button"
                    onClick={() => { setForgot(true); setForgotSent(false) }}
                    style={{ border: 'none', background: 'transparent', color: 'var(--qk-primary)', fontSize: 12, cursor: 'pointer', padding: 0 }}
                  >
                    Forgot password?
                  </button>
                  <span style={{ fontSize: 11, color: 'var(--qk-text-muted)' }}>ops@quickart.in / quickart123</span>
                </div>
                <QkButton type="submit" loading={loading} style={{ width: '100%', marginTop: 4 }}>
                  Sign in
                </QkButton>
              </form>
            </>
          ) : (
            <>
              <h2 style={{ margin: 0, fontSize: 20, fontWeight: 650 }}>Reset password</h2>
              <p style={{ margin: '6px 0 20px', color: 'var(--qk-text-secondary)', fontSize: 13 }}>
                Frontend-only flow — no email is sent.
              </p>
              {forgotSent ? (
                <div style={{ padding: 12, borderRadius: 6, background: 'var(--qk-success-soft)', color: 'var(--qk-success)', fontSize: 13 }}>
                  If an account exists for {email}, a reset link would be sent.
                </div>
              ) : (
                <form
                  onSubmit={(e) => {
                    e.preventDefault()
                    if (!email.trim()) {
                      setErrors({ email: 'Email is required' })
                      return
                    }
                    setForgotSent(true)
                  }}
                  style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
                >
                  <QkInput label="Email" value={email} onChange={(e) => setEmail(e.target.value)} error={errors.email} />
                  <QkButton type="submit">Send reset link</QkButton>
                </form>
              )}
              <QkButton variant="ghost" style={{ marginTop: 12, width: '100%' }} onClick={() => setForgot(false)}>
                Back to sign in
              </QkButton>
            </>
          )}
        </div>
      </section>

      <style>{`
        @media (max-width: 900px) {
          .qk-app { grid-template-columns: 1fr !important; }
          .qk-app > section:first-child { display: none !important; }
        }
      `}</style>
    </div>
  )
}
