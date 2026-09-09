import { useEffect, useState } from 'react'

export const QK_BP = {
  mobile: 768,
  tablet: 1024,
} as const

function getSnapshot() {
  if (typeof window === 'undefined') {
    return { isMobile: false, isTablet: false, isDesktop: true }
  }
  const w = window.innerWidth
  return {
    isMobile: w < QK_BP.mobile,
    isTablet: w >= QK_BP.mobile && w < QK_BP.tablet,
    isDesktop: w >= QK_BP.tablet,
  }
}

/** Match CSS breakpoints: mobile <768, tablet 768–1023, desktop ≥1024 */
export function useBreakpoint() {
  const [bp, setBp] = useState(getSnapshot)

  useEffect(() => {
    const mqMobile = window.matchMedia(`(max-width: ${QK_BP.mobile - 1}px)`)
    const mqTablet = window.matchMedia(
      `(min-width: ${QK_BP.mobile}px) and (max-width: ${QK_BP.tablet - 1}px)`,
    )
    const sync = () => setBp(getSnapshot())
    sync()
    mqMobile.addEventListener('change', sync)
    mqTablet.addEventListener('change', sync)
    return () => {
      mqMobile.removeEventListener('change', sync)
      mqTablet.removeEventListener('change', sync)
    }
  }, [])

  return bp
}
