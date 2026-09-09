import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from 'react'
import type { DensityMode } from '../types'

interface DensityContextValue {
  density: DensityMode
  setDensity: (density: DensityMode) => void
}

const DensityContext = createContext<DensityContextValue | null>(null)
const STORAGE_KEY = 'quickart-density'

export function DensityProvider({ children }: { children: ReactNode }) {
  const [density, setDensityState] = useState<DensityMode>(() => {
    const stored = localStorage.getItem(STORAGE_KEY) as DensityMode | null
    return stored === 'comfortable' || stored === 'compact' ? stored : 'compact'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-density', density)
    localStorage.setItem(STORAGE_KEY, density)
  }, [density])

  const value = useMemo(
    () => ({ density, setDensity: setDensityState }),
    [density],
  )

  return <DensityContext.Provider value={value}>{children}</DensityContext.Provider>
}

export function useDensity() {
  const ctx = useContext(DensityContext)
  if (!ctx) throw new Error('useDensity must be used within DensityProvider')
  return ctx
}
