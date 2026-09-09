import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from 'react'

interface AuthUser {
  name: string
  email: string
  role: string
}

interface AuthContextValue {
  user: AuthUser | null
  login: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>
  logout: () => void
}

const AuthContext = createContext<AuthContextValue | null>(null)
const STORAGE_KEY = 'quickart-auth'

const DEMO_EMAIL = 'ops@quickart.in'
const DEMO_PASSWORD = 'quickart123'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    try {
      return JSON.parse(raw) as AuthUser
    } catch {
      return null
    }
  })

  const login = useCallback(async (email: string, password: string) => {
    await new Promise((r) => setTimeout(r, 600))
    if (email.trim().toLowerCase() === DEMO_EMAIL && password === DEMO_PASSWORD) {
      const next = { name: 'Ankit Verma', email: DEMO_EMAIL, role: 'Warehouse Manager' }
      setUser(next)
      localStorage.setItem(STORAGE_KEY, JSON.stringify(next))
      return { ok: true }
    }
    return { ok: false, error: 'Invalid email or password. Use ops@quickart.in / quickart123' }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    localStorage.removeItem(STORAGE_KEY)
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
